import * as THREE from "three";
import {
    acceptedFrontAngle, acceptedRearPosition, clampRackTravel, frontConstraintViolation,
    MAX_CONTROL_ARM_DRAG_ANGLE_RAD,
} from "../domain/dragConstraints";
import type {SuspensionProject} from "../domain/types";

export function rearPointerDisplacement(
    pointer: THREE.Vector2, longitudinal: THREE.Vector2, vertical: THREE.Vector2,
): {longitudinalMm: number; verticalMm: number} {
    const determinant = longitudinal.x * vertical.y - longitudinal.y * vertical.x;
    const scale = longitudinal.length() * vertical.length();
    if (scale > 1e-8 && Math.abs(determinant) > scale * 0.05) {
        return {
            longitudinalMm: (pointer.x * vertical.y - pointer.y * vertical.x) / determinant,
            verticalMm: (longitudinal.x * pointer.y - longitudinal.y * pointer.x) / determinant,
        };
    }
    if (longitudinal.lengthSq() > vertical.lengthSq()) {
        return {longitudinalMm: pointer.dot(longitudinal) / longitudinal.lengthSq(), verticalMm: 0};
    }
    return {longitudinalMm: 0, verticalMm: vertical.lengthSq() > 1e-8 ? pointer.dot(vertical) / vertical.lengthSq() : 0};
}

export interface SceneInteractionContext {
    readonly camera: THREE.PerspectiveCamera;
    readonly controls: { enabled: boolean };
    readonly pickups: THREE.Mesh[];
    readonly ballJoints: THREE.Mesh[];
    readonly steeringRackPivots: THREE.Mesh[];
    readonly rearMainArmOuterMounts: THREE.Mesh[];
    readonly onProjectChange: () => void;
    readonly update: (project: SuspensionProject) => void;
    readonly getProject: () => SuspensionProject | undefined;
}

export interface SceneInteractionState {
    hoveredBallJointIndex: number | null;
    hoveredRearOuterMountIndex: number | null;
    hoveredSteeringRackPivotIndex: number | null;
    draggingBallJointIndex: number | null;
    draggingRearOuterMountIndex: number | null;
    draggingSteeringRackPivotIndex: number | null;
    dragStartRackTravelMm: number;
    dragStartRackPointerX: number;
    dragStartRackPointerY: number;
    rackTravelScreenDirection: THREE.Vector2;
    dragRackChanged: boolean;
    dragAcceptedAngle: number;
    dragAcceptedConstraintViolation: [number, number];
    dragRotationRecoverySign: number;
    dragStartY: number;
    dragStartRearHeightOffsetMm: number;
    dragStartRearLongitudinalOffsetMm: number;
    dragStartRearPointerX: number;
    rearLongitudinalScreenDirection: THREE.Vector2;
    rearVerticalScreenDirection: THREE.Vector2;
    dragStartAngle: number;
    dragVerticalSign: number;
    dragChanged: boolean;
}

export class SceneInteractionController {
    readonly state: SceneInteractionState = {
        hoveredBallJointIndex: null,
        hoveredRearOuterMountIndex: null,
        hoveredSteeringRackPivotIndex: null,
        draggingBallJointIndex: null,
        draggingRearOuterMountIndex: null,
        draggingSteeringRackPivotIndex: null,
        dragStartRackTravelMm: 0,
        dragStartRackPointerX: 0,
        dragStartRackPointerY: 0,
        rackTravelScreenDirection: new THREE.Vector2(),
        dragRackChanged: false,
        dragAcceptedAngle: 0,
        dragAcceptedConstraintViolation: [0, 0],
        dragRotationRecoverySign: 0,
        dragStartY: 0,
        dragStartRearHeightOffsetMm: 0,
        dragStartRearLongitudinalOffsetMm: 0,
        dragStartRearPointerX: 0,
        rearLongitudinalScreenDirection: new THREE.Vector2(),
        rearVerticalScreenDirection: new THREE.Vector2(),
        dragStartAngle: 0,
        dragVerticalSign: 1,
        dragChanged: false,
    };
    private readonly raycaster = new THREE.Raycaster();
    private readonly pointer = new THREE.Vector2();
    private disposed = false;
    private readonly onPointerDown = (event: PointerEvent): void => this.handlePointerDown(event);
    private readonly onPointerMove = (event: PointerEvent): void => this.handlePointerMove(event);
    private readonly onPointerUp = (event: PointerEvent): void => this.finishDrag(event);
    private readonly onPointerCancel = (event: PointerEvent): void => this.finishDrag(event);
    private readonly onLostPointerCapture = (event: PointerEvent): void => this.finishDrag(event);
    private readonly onPointerLeave = (): void => {
        if (this.state.draggingBallJointIndex === null && this.state.draggingRearOuterMountIndex === null &&
            this.state.draggingSteeringRackPivotIndex === null) {
            this.setHoveredBallJoint(null);
            this.setHoveredRearOuterMount(null);
            this.setHoveredSteeringRackPivot(null);
        }
    };

    constructor(
        private readonly canvas: HTMLCanvasElement,
        private readonly context: SceneInteractionContext,
    ) {
        canvas.addEventListener("pointerdown", this.onPointerDown, {capture: true});
        canvas.addEventListener("pointermove", this.onPointerMove, {capture: true});
        canvas.addEventListener("pointerup", this.onPointerUp, {capture: true});
        canvas.addEventListener("pointercancel", this.onPointerCancel, {capture: true});
        canvas.addEventListener("lostpointercapture", this.onLostPointerCapture, {capture: true});
        canvas.addEventListener("pointerleave", this.onPointerLeave);
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.canvas.removeEventListener("pointerdown", this.onPointerDown, {capture: true});
        this.canvas.removeEventListener("pointermove", this.onPointerMove, {capture: true});
        this.canvas.removeEventListener("pointerup", this.onPointerUp, {capture: true});
        this.canvas.removeEventListener("pointercancel", this.onPointerCancel, {capture: true});
        this.canvas.removeEventListener("lostpointercapture", this.onLostPointerCapture, {capture: true});
        this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    }

    private get camera(): THREE.PerspectiveCamera {
        return this.context.camera;
    }

    private get controls(): SceneInteractionContext["controls"] {
        return this.context.controls;
    }

    private get pickups(): THREE.Mesh[] {
        return this.context.pickups;
    }

    private get ballJoints(): THREE.Mesh[] {
        return this.context.ballJoints;
    }

    private get steeringRackPivots(): THREE.Mesh[] {
        return this.context.steeringRackPivots;
    }

    private get rearMainArmOuterMounts(): THREE.Mesh[] {
        return this.context.rearMainArmOuterMounts;
    }

    private get project(): SuspensionProject | undefined {
        return this.context.getProject();
    }

    private onProjectChange(): void {
        this.context.onProjectChange();
    }

    private update(project: SuspensionProject): void {
        this.context.update(project);
    }

    private handlePointerDown(event: PointerEvent): void {
        const index = this.intersectBallJoint(event);
        if (!this.project) return;
        if (index === null) {
            const rearIndex = this.intersectRearOuterMount(event);
            if (rearIndex !== null) {
                const outer = this.rearMainArmOuterMounts[rearIndex].position;
                event.preventDefault();
                event.stopImmediatePropagation();
                this.state.draggingRearOuterMountIndex = rearIndex;
                this.setHoveredRearOuterMount(rearIndex);
                this.state.dragStartY = event.clientY;
                this.state.dragStartRearPointerX = event.clientX;
                this.state.dragChanged = false;
                this.state.dragStartRearHeightOffsetMm = outer.z - this.project.rearHub.mainArmOuterMountStaticHeightMm;
                this.state.dragStartRearLongitudinalOffsetMm = rearIndex === 0
                    ? this.project.rearSuspension.leftLongitudinalOffsetMm
                    : this.project.rearSuspension.rightLongitudinalOffsetMm;
                const bounds = this.canvas.getBoundingClientRect();
                const start = outer.clone().project(this.camera);
                const longitudinal = outer.clone().add(new THREE.Vector3(1, 0, 0)).project(this.camera);
                const vertical = outer.clone().add(new THREE.Vector3(0, 0, 1)).project(this.camera);
                this.state.rearLongitudinalScreenDirection.set(
                    (longitudinal.x - start.x) * bounds.width / 2, -(longitudinal.y - start.y) * bounds.height / 2,
                );
                this.state.rearVerticalScreenDirection.set(
                    (vertical.x - start.x) * bounds.width / 2, -(vertical.y - start.y) * bounds.height / 2,
                );
                this.controls.enabled = false;
                this.canvas.style.cursor = "grabbing";
                this.canvas.setPointerCapture(event.pointerId);
                return;
            }
            const rackIndex = this.intersectSteeringRackPivot(event);
            if (rackIndex === null) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            this.state.draggingSteeringRackPivotIndex = rackIndex;
            this.setHoveredSteeringRackPivot(rackIndex);
            this.state.dragStartRackTravelMm = this.project.steeringRack.rackTravelMm;
            this.state.dragStartRackPointerX = event.clientX;
            this.state.dragStartRackPointerY = event.clientY;
            const bounds = this.canvas.getBoundingClientRect();
            const start = this.steeringRackPivots[rackIndex].position.clone();
            const end = start.clone().add(new THREE.Vector3(0, 1, 0));
            start.project(this.camera);
            end.project(this.camera);
            this.state.rackTravelScreenDirection.set(
                (end.x - start.x) * bounds.width / 2,
                -(end.y - start.y) * bounds.height / 2,
            );
            this.state.dragRackChanged = false;
            this.controls.enabled = false;
            this.canvas.style.cursor = "grabbing";
            this.canvas.setPointerCapture(event.pointerId);
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        this.state.draggingBallJointIndex = index;
        this.state.dragStartY = event.clientY;
        this.state.dragChanged = false;
        this.state.dragStartAngle = index === 0
            ? this.project.frontControlArm.leftRotationRad
            : this.project.frontControlArm.rightRotationRad;
        this.state.dragAcceptedAngle = this.state.dragStartAngle;
        this.state.dragRotationRecoverySign = Math.abs(this.state.dragStartAngle) > MAX_CONTROL_ARM_DRAG_ANGLE_RAD
            ? Math.sign(this.state.dragStartAngle)
            : 0;
        this.state.dragAcceptedConstraintViolation = frontConstraintViolation(
            this.project, index === 0 ? 0 : 1, this.state.dragAcceptedAngle,
        );
        const axis = this.pickups[index + 2].position.clone().sub(this.pickups[index].position).normalize();
        const radial = this.ballJoints[index].position.clone().sub(this.pickups[index].position);
        const verticalTangent = axis.cross(radial).z;
        this.state.dragVerticalSign = Math.abs(verticalTangent) > 1e-6
            ? Math.sign(verticalTangent)
            : index === 0 ? -1 : 1;
        this.controls.enabled = false;
        this.canvas.style.cursor = "grabbing";
        this.canvas.setPointerCapture(event.pointerId);
    }

    private handlePointerMove(event: PointerEvent): void {
        if (this.state.draggingRearOuterMountIndex !== null && this.project) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const index: 0 | 1 = this.state.draggingRearOuterMountIndex === 0 ? 0 : 1;
            const delta = rearPointerDisplacement(
                new THREE.Vector2(event.clientX - this.state.dragStartRearPointerX, event.clientY - this.state.dragStartY),
                this.state.rearLongitudinalScreenDirection, this.state.rearVerticalScreenDirection,
            );
            const offset = acceptedRearPosition(this.project, index, {
                verticalMm: this.state.dragStartRearHeightOffsetMm + delta.verticalMm,
                longitudinalMm: this.state.dragStartRearLongitudinalOffsetMm + delta.longitudinalMm,
            });
            const rear = this.project.rearSuspension;
            const currentVertical = index === 0 ? rear.leftVerticalOffsetMm : rear.rightVerticalOffsetMm;
            const currentLongitudinal = index === 0 ? rear.leftLongitudinalOffsetMm : rear.rightLongitudinalOffsetMm;
            if (Math.abs(offset.verticalMm - currentVertical) > 1e-10 ||
                Math.abs(offset.longitudinalMm - currentLongitudinal) > 1e-10) this.state.dragChanged = true;
            if (index === 0) {
                rear.leftVerticalOffsetMm = offset.verticalMm;
                rear.leftLongitudinalOffsetMm = offset.longitudinalMm;
            } else {
                rear.rightVerticalOffsetMm = offset.verticalMm;
                rear.rightLongitudinalOffsetMm = offset.longitudinalMm;
            }
            this.update(this.project);
            return;
        }

        if (this.state.draggingSteeringRackPivotIndex !== null && this.project) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const directionLengthSquared = this.state.rackTravelScreenDirection.lengthSq();
            const pointerDelta = new THREE.Vector2(
                event.clientX - this.state.dragStartRackPointerX,
                event.clientY - this.state.dragStartRackPointerY,
            );
            const requestedTravel = this.state.dragStartRackTravelMm +
                (directionLengthSquared > 1e-8
                    ? pointerDelta.dot(this.state.rackTravelScreenDirection) / directionLengthSquared
                    : 0);
            const rackTravelMm = clampRackTravel(this.project, requestedTravel);
            if (Math.abs(rackTravelMm - this.project.steeringRack.rackTravelMm) > 1e-10) {
                this.state.dragRackChanged = true;
            }
            this.project.steeringRack.rackTravelMm = rackTravelMm;
            this.update(this.project);
            return;
        }

        if (this.state.draggingBallJointIndex !== null && this.project) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const dragIndex: 0 | 1 = this.state.draggingBallJointIndex === 0 ? 0 : 1;
            const requestedAngle =
                (this.state.dragStartY - event.clientY) * 0.01 * this.state.dragVerticalSign;
            const targetAngle = this.state.dragStartAngle + requestedAngle;
            const acceptedAngle = acceptedFrontAngle(
                this.project, dragIndex, targetAngle, this.state.dragAcceptedAngle,
                this.state.dragAcceptedConstraintViolation, this.state.dragRotationRecoverySign,
            );
            const currentAngle = dragIndex === 0
                ? this.project.frontControlArm.leftRotationRad
                : this.project.frontControlArm.rightRotationRad;
            if (Math.abs(acceptedAngle - currentAngle) > 1e-10) {
                this.state.dragChanged = true;
            }
            if (dragIndex === 0) {
                this.project.frontControlArm.leftRotationRad = acceptedAngle;
            } else {
                this.project.frontControlArm.rightRotationRad = acceptedAngle;
            }
            this.state.dragAcceptedAngle = acceptedAngle;
            this.state.dragAcceptedConstraintViolation = frontConstraintViolation(this.project, dragIndex, acceptedAngle);
            if (Math.abs(acceptedAngle) <= MAX_CONTROL_ARM_DRAG_ANGLE_RAD) {
                this.state.dragRotationRecoverySign = 0;
            }
            this.update(this.project);
            return;
        }

        this.setHoveredBallJoint(this.intersectBallJoint(event));
        this.setHoveredRearOuterMount(this.intersectRearOuterMount(event));
        this.setHoveredSteeringRackPivot(this.intersectSteeringRackPivot(event));
    }

    private finishDrag(event: PointerEvent): void {
        if (this.state.draggingRearOuterMountIndex !== null) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const changed = this.state.dragChanged;
            this.state.draggingRearOuterMountIndex = null;
            this.controls.enabled = true;
            if (this.canvas.hasPointerCapture(event.pointerId)) {
                this.canvas.releasePointerCapture(event.pointerId);
            }
            this.setHoveredBallJoint(this.intersectBallJoint(event));
            this.setHoveredRearOuterMount(this.intersectRearOuterMount(event));
            this.setHoveredSteeringRackPivot(this.intersectSteeringRackPivot(event));
            if (changed) this.onProjectChange();
            return;
        }
        if (this.state.draggingSteeringRackPivotIndex !== null) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const changed = this.state.dragRackChanged;
            this.state.draggingSteeringRackPivotIndex = null;
            this.controls.enabled = true;
            this.updatePointerCursor();
            if (this.canvas.hasPointerCapture(event.pointerId)) {
                this.canvas.releasePointerCapture(event.pointerId);
            }
            this.setHoveredBallJoint(this.intersectBallJoint(event));
            this.setHoveredRearOuterMount(this.intersectRearOuterMount(event));
            this.setHoveredSteeringRackPivot(this.intersectSteeringRackPivot(event));
            if (changed) this.onProjectChange();
            return;
        }
        if (this.state.draggingBallJointIndex === null) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const changed = this.state.dragChanged;
        this.state.draggingBallJointIndex = null;
        this.controls.enabled = true;
        this.updatePointerCursor();
        if (this.canvas.hasPointerCapture(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId);
        }
        this.setHoveredBallJoint(this.intersectBallJoint(event));
        this.setHoveredRearOuterMount(this.intersectRearOuterMount(event));
        this.setHoveredSteeringRackPivot(this.intersectSteeringRackPivot(event));
        if (changed) this.onProjectChange();
    }

    private intersectBallJoint(event: PointerEvent): number | null {
        const bounds = this.canvas.getBoundingClientRect();
        this.pointer.set(
            ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
            -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
        );
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hit = this.raycaster.intersectObjects(this.ballJoints, false)[0];
        if (!hit) return null;
        const index = this.ballJoints.findIndex((joint) => joint.uuid === hit.object.uuid);
        return index < 0 ? null : index;
    }

    private intersectRearOuterMount(event: PointerEvent): number | null {
        if (!this.rearMainArmOuterMounts[0].visible) return null;
        const bounds = this.canvas.getBoundingClientRect();
        this.pointer.set(
            ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
            -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
        );
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hit = this.raycaster.intersectObjects(this.rearMainArmOuterMounts, false)[0];
        if (!hit) return null;
        const index = this.rearMainArmOuterMounts.findIndex((mount) => mount.uuid === hit.object.uuid);
        return index < 0 ? null : index;
    }

    private intersectSteeringRackPivot(event: PointerEvent): number | null {
        const bounds = this.canvas.getBoundingClientRect();
        this.pointer.set(
            ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
            -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
        );
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hit = this.raycaster.intersectObjects(this.steeringRackPivots, false)[0];
        if (!hit) return null;
        const index = this.steeringRackPivots.findIndex((pivot) => pivot.uuid === hit.object.uuid);
        return index < 0 ? null : index;
    }

    private setHoveredBallJoint(index: number | null): void {
        if (this.state.hoveredBallJointIndex === index) {
            this.updatePointerCursor();
            return;
        }
        if (this.state.hoveredBallJointIndex !== null) {
            const previous = this.ballJoints[this.state.hoveredBallJointIndex];
            (previous.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            previous.scale.setScalar(1);
        }
        this.state.hoveredBallJointIndex = index;
        if (index !== null) {
            const hovered = this.ballJoints[index];
            (hovered.material as THREE.MeshStandardMaterial).emissive.setHex(0x8a3020);
            hovered.scale.setScalar(1.45);
        }
        this.updatePointerCursor();
    }

    private setHoveredRearOuterMount(index: number | null): void {
        if (this.state.hoveredRearOuterMountIndex === index) {
            this.updatePointerCursor();
            return;
        }
        if (this.state.hoveredRearOuterMountIndex !== null) {
            const previous = this.rearMainArmOuterMounts[this.state.hoveredRearOuterMountIndex];
            (previous.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            previous.scale.setScalar(1);
        }
        this.state.hoveredRearOuterMountIndex = index;
        if (index !== null) {
            const hovered = this.rearMainArmOuterMounts[index];
            (hovered.material as THREE.MeshStandardMaterial).emissive.setHex(0x006969);
            hovered.scale.setScalar(1.45);
        }
        this.updatePointerCursor();
    }

    private setHoveredSteeringRackPivot(index: number | null): void {
        if (this.state.hoveredSteeringRackPivotIndex === index) {
            this.updatePointerCursor();
            return;
        }
        if (this.state.hoveredSteeringRackPivotIndex !== null) {
            const previous = this.steeringRackPivots[this.state.hoveredSteeringRackPivotIndex];
            (previous.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            previous.scale.setScalar(1);
        }
        this.state.hoveredSteeringRackPivotIndex = index;
        if (index !== null) {
            const hovered = this.steeringRackPivots[index];
            (hovered.material as THREE.MeshStandardMaterial).emissive.setHex(0x8a3020);
            hovered.scale.setScalar(1.45);
        }
        this.updatePointerCursor();
    }

    private updatePointerCursor(): void {
        const dragging = this.state.draggingBallJointIndex !== null ||
            this.state.draggingRearOuterMountIndex !== null ||
            this.state.draggingSteeringRackPivotIndex !== null;
        const hoveringDraggable = this.state.hoveredBallJointIndex !== null ||
            this.state.hoveredRearOuterMountIndex !== null ||
            this.state.hoveredSteeringRackPivotIndex !== null;
        this.canvas.style.cursor = dragging
            ? "grabbing"
            : hoveringDraggable ? "grab" : "default";
    }
}
