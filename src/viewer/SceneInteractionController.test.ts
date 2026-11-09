import * as THREE from "three";
import {describe, expect, it, vi} from "vitest";
import {SceneInteractionController, rearPointerDisplacement} from "./SceneInteractionController";
import type {SceneInteractionContext} from "./SceneInteractionController";
import {createProjectFromTemplate} from "../templates/templates";
import {solveSuspension} from "../domain/kinematics";

describe("SceneInteractionController", () => {
    it("maps projected horizontal and vertical axes independently and handles edge-on views", () => {
        expect(rearPointerDisplacement(new THREE.Vector2(14, -4), new THREE.Vector2(2, 1), new THREE.Vector2(1, -2)))
            .toEqual({longitudinalMm: 4.8, verticalMm: 4.4});
        expect(rearPointerDisplacement(new THREE.Vector2(10, -20), new THREE.Vector2(0, 0), new THREE.Vector2(0, -2)))
            .toEqual({longitudinalMm: 0, verticalMm: 10});
        expect(rearPointerDisplacement(new THREE.Vector2(10, 5), new THREE.Vector2(2, 0), new THREE.Vector2(0, 0)))
            .toEqual({longitudinalMm: 5, verticalMm: 0});
    });

    it("drags the rear outer pivot along the constrained path and persists the resulting position", () => {
        const project = createProjectFromTemplate("default", "Test", "test");
        const snapshot = solveSuspension(project);
        const outer = snapshot.rearSolution!.mainOuterMounts[0];
        const camera = new THREE.PerspectiveCamera(50, 1, 1, 10000);
        camera.up.set(0, 0, 1);
        camera.position.set(outer[0], outer[1] + 2000, outer[2]);
        camera.lookAt(...outer);
        camera.updateMatrixWorld();
        const mounts = [0, 1].map((index) => {
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(24), new THREE.MeshStandardMaterial());
            mesh.position.set(...snapshot.rearSolution!.mainOuterMounts[index]);
            mesh.updateMatrixWorld();
            return mesh;
        });
        const canvas = Object.assign(new EventTarget(), {
            style: {cursor: ""},
            getBoundingClientRect: () => ({left: 0, top: 0, width: 800, height: 800}),
            setPointerCapture: vi.fn(),
            hasPointerCapture: () => true,
            releasePointerCapture: vi.fn(),
        }) as unknown as HTMLCanvasElement;
        const onProjectChange = vi.fn();
        const context: SceneInteractionContext = {
            camera, controls: {enabled: true}, pickups: [], ballJoints: [], steeringRackPivots: [],
            rearMainArmOuterMounts: mounts, onProjectChange, getProject: () => project,
            update: (updated) => {
                const solved = solveSuspension(updated);
                mounts.forEach((mount, index) => {
                    mount.position.set(...solved.rearSolution!.mainOuterMounts[index]);
                    mount.updateMatrixWorld();
                });
            },
        };
        const controller = new SceneInteractionController(canvas, context);
        const pointer = (type: string, clientX: number, clientY: number) => {
            canvas.dispatchEvent(Object.assign(new Event(type, {cancelable: true}), {clientX, clientY, pointerId: 1}));
        };
        const start = new THREE.Vector3(...outer).project(camera);
        const end = new THREE.Vector3(outer[0] + 30, outer[1], outer[2] + 20).project(camera);
        pointer("pointerdown", 400, 400);
        expect(controller.state.draggingRearOuterMountIndex).toBe(0);
        pointer("pointermove", 400 + (end.x - start.x) * 400, 400 - (end.y - start.y) * 400);
        expect(project.rearSuspension.leftLongitudinalOffsetMm).toBeCloseTo(
            mounts[0].position.x - outer[0], 6);
        expect(project.rearSuspension.leftLongitudinalOffsetMm).not.toBeCloseTo(30);
        expect(project.rearSuspension.leftVerticalOffsetMm).toBeCloseTo(20);
        expect(project.rearSuspension.rightLongitudinalOffsetMm).toBe(0);
        pointer("pointerup", 400, 400);
        expect(onProjectChange).toHaveBeenCalledOnce();
        expect(context.controls.enabled).toBe(true);
        controller.dispose();
        mounts.forEach((mount) => {
            mount.geometry.dispose();
            (mount.material as THREE.Material).dispose();
        });
    });

    it("forwards pointer events and removes listeners on disposal", () => {
        const canvas = Object.assign(new EventTarget(), {
            getBoundingClientRect: () => ({left: 0, top: 0, width: 100, height: 100}),
        }) as HTMLCanvasElement;
        const getProject = vi.fn(() => undefined);
        const context: SceneInteractionContext = {
            camera: new THREE.PerspectiveCamera(),
            controls: {enabled: true},
            pickups: [],
            ballJoints: [],
            steeringRackPivots: [],
            rearMainArmOuterMounts: [],
            onProjectChange: vi.fn(),
            update: vi.fn(),
            getProject,
        };
        const controller = new SceneInteractionController(canvas, context);

        canvas.dispatchEvent(new Event("pointerdown"));
        expect(getProject).toHaveBeenCalledTimes(1);

        controller.dispose();
        controller.dispose();
        canvas.dispatchEvent(new Event("pointerdown"));
        expect(getProject).toHaveBeenCalledTimes(1);
    });
});
