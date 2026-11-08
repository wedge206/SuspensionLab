import {
    controlArmPickupPoints, frontTopMountPoints, rearMainArmInnerMountPoints, rearMainArmOuterMountPoints,
    rearToeArmInnerMountPoints, rearTrailingArmMountPoints, solveRearArmMounts, steeringRackPivotPoints,
    steeringRackTravelLimitMm, tieRodConstrainedKnucklePoints,
} from "./coordinates";
import {FRONT_GEOMETRY_ERROR_CODES, isGeometryError, REAR_GEOMETRY_ERROR_CODES} from "./geometryError";
import type {SuspensionProject} from "./types";

export const MAX_CONTROL_ARM_DRAG_ANGLE_RAD = Math.PI / 2;
export type ConstraintViolation = [number, number];

export function frontConstraintViolation(project: SuspensionProject, index: 0 | 1, angle: number): ConstraintViolation {
    const rotationViolation = Math.max(0, Math.abs(angle) - MAX_CONTROL_ARM_DRAG_ANGLE_RAD);
    const rotations: [number, number] = [project.frontControlArm.leftRotationRad, project.frontControlArm.rightRotationRad];
    rotations[index] = angle;
    const pickup = project.frontLowerControlArmPickup;
    const arm = project.frontControlArm;
    const rack = project.steeringRack;
    const top = project.frontTopMount;
    const knuckle = project.wheelKnuckle;
    const points = controlArmPickupPoints(
        pickup.widthMm, pickup.rearWidthMm, pickup.frontHeightMm, pickup.rearHeightMm, pickup.controlArmDepthMm,
        arm.lengthMm, arm.ballJointOffsetMm, rotations[0], rotations[1],
    );
    const rackPivots = steeringRackPivotPoints(rack.widthMm, rack.centerlineHeightMm, rack.centerlineOffsetMm, rack.rackTravelMm);
    const topMounts = frontTopMountPoints(top.widthMm, top.heightMm, top.offsetMm);
    try {
        const solved = tieRodConstrainedKnucklePoints(
            points.ballJoint, rackPivots, topMounts,
            knuckle.steeringPivotHeightMm, knuckle.steeringPivotDepthMm, knuckle.steeringPivotOffsetMm,
            knuckle.strutMountHeightMm, knuckle.strutMountOffsetMm, knuckle.strutMountLocationMm,
            -knuckle.strutMountAngleDeg, rack.tieRodLengthMm, knuckle.strutMinLengthMm, knuckle.strutMaxLengthMm,
        );
        const travelViolation = solved.strutLengths.reduce((violation, length) =>
            violation + Math.max(0, knuckle.strutMinLengthMm - length) +
            Math.max(0, length - knuckle.strutMaxLengthMm), 0);
        return [rotationViolation, travelViolation];
    } catch (error) {
        if (isGeometryError(error, FRONT_GEOMETRY_ERROR_CODES)) {
            return [rotationViolation, Number.POSITIVE_INFINITY];
        }
        throw error;
    }
}

export function acceptedFrontAngle(
    project: SuspensionProject, index: 0 | 1, target: number, accepted: number,
    baseline: ConstraintViolation, recoverySign: number,
): number {
    const allowed = (angle: number): boolean => {
        if (recoverySign !== 0 && Math.abs(angle) > MAX_CONTROL_ARM_DRAG_ANGLE_RAD &&
            Math.sign(angle) !== recoverySign) return false;
        const candidate = frontConstraintViolation(project, index, angle);
        return candidate[0] <= baseline[0] + 1e-8 && candidate[1] <= baseline[1] + 1e-8;
    };
    if (allowed(target)) return target;
    const angleDelta = target - accepted;
    let validFraction = 0;
    let invalidFraction = 1;
    for (let iteration = 0; iteration < 30; iteration += 1) {
        const fraction = (validFraction + invalidFraction) / 2;
        if (allowed(accepted + angleDelta * fraction)) validFraction = fraction;
        else invalidFraction = fraction;
    }
    return accepted + angleDelta * validFraction;
}

export function rearHeightReachable(project: SuspensionProject, index: 0 | 1, offset: number): boolean {
    const rear = project.rearSuspension;
    const hub = project.rearHub;
    const inner = rearMainArmInnerMountPoints(rear.frontToRearLengthMm, rear.mainArmInnerMountWidthMm, rear.mainArmInnerMountHeightMm);
    const toe = rearToeArmInnerMountPoints(inner, rear.toeArmInnerMountWidthMm, rear.toeArmInnerMountHeightMm, rear.toeArmMainArmWidthMm);
    const trailing = rearTrailingArmMountPoints(inner, hub.trailingArmMountWidthMm, hub.trailingArmMountHeightMm, hub.trailingArmMountForwardOffsetMm);
    const nominal = rearMainArmOuterMountPoints(
        inner, trailing, rear.mainArmLengthMm, hub.trailingArmLengthMm, hub.mainArmOuterMountStaticHeightMm,
        index === 0 ? offset : rear.leftVerticalOffsetMm, index === 1 ? offset : rear.rightVerticalOffsetMm,
    );
    try {
        solveRearArmMounts(
            inner, toe, nominal, rear.mainArmLengthMm, rear.toeArmLengthMm, hub.toeArmOuterMountHeightOffsetMm,
            hub.toeArmOuterMountForwardOffsetMm, hub.toeArmOuterMountLateralOffsetMm, hub.mainArmOuterMountStaticHeightMm,
        );
        return true;
    } catch (error) {
        if (isGeometryError(error, REAR_GEOMETRY_ERROR_CODES)) return false;
        throw error;
    }
}

export function acceptedRearOffset(project: SuspensionProject, index: 0 | 1, requested: number): number {
    const rear = project.rearSuspension;
    const current = index === 0 ? rear.leftVerticalOffsetMm : rear.rightVerticalOffsetMm;
    const innerHeight = rear.mainArmInnerMountHeightMm;
    const staticHeight = project.rearHub.mainArmOuterMountStaticHeightMm;
    const length = rear.mainArmLengthMm;
    const target = Math.max(innerHeight - length - staticHeight, Math.min(innerHeight + length - staticHeight, requested));
    let offset = current;
    const steps = Math.min(2048, Math.max(1, Math.ceil(Math.abs(target - current) / 5)));
    for (let step = 1; step <= steps; step += 1) {
        const candidate = current + (target - current) * step / steps;
        if (rearHeightReachable(project, index, candidate)) {
            offset = candidate;
        } else {
            let valid = offset;
            let invalid = candidate;
            for (let iteration = 0; iteration < 30; iteration += 1) {
                const middle = (valid + invalid) / 2;
                if (rearHeightReachable(project, index, middle)) valid = middle;
                else invalid = middle;
            }
            offset = valid;
            break;
        }
    }
    return offset;
}

export function clampRackTravel(project: SuspensionProject, requested: number): number {
    const rack = project.steeringRack;
    const limit = steeringRackTravelLimitMm(rack.widthMm, rack.housingWidthMm, rack.steeringLimiterMm);
    return Math.max(-limit, Math.min(limit, requested));
}
