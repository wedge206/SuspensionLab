import {describe, expect, it} from "vitest";
import {createProjectFromTemplate, DEFAULT_TEMPLATE_KEY} from "../templates/templates";
import {solveSuspension} from "./kinematics";
import {rearMainArmOuterMountPoints, solveRearArmMounts} from "./coordinates";
import {isGeometryError, REAR_GEOMETRY_ERROR_CODES} from "./geometryError";
import {STRUT_TRAVEL_TOLERANCE_MM} from "./strutTravel";
import {
    acceptedFrontAngle, acceptedRearOffset, acceptedRearPosition, clampRackTravel, frontConstraintViolation,
    rearHeightReachable, rearPositionReachable,
} from "./dragConstraints";

function project() {
    return createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "Test", "test");
}

describe("solved suspension snapshot", () => {
    it("calculates mirrored positions, alignment and ground geometry without mutating the project", () => {
        const value = project();
        const before = structuredClone(value);
        const result = solveSuspension(value);
        expect(value).toEqual(before);
        expect(result.points.front).toEqual([[650, 465, 250], [650, -465, 250]]);
        expect(result.rackPivots).toEqual([[484, 425, 362], [484, -425, 362]]);
        expect(result.rearSolution).not.toBeNull();
        expect(result.knuckleValid).toBe(true);
        expect(result.knucklePoints.strutLengths[0]).toBeCloseTo(580, 6);
        expect(result.knucklePoints.strutLengths[1]).toBeCloseTo(580, 6);
        expect(result.alignment?.totalToeMm).not.toBeNull();
        expect(result.groundAxisPoints.every((point) => point?.[2] === 0)).toBe(true);
        expect(result.geometryMessage).toBe("");
    });

    it("keeps all hub side lengths fixed through independent rear suspension travel", () => {
        const value = project();
        const distance = (a: number[], b: number[]) =>
            Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        const expected = [Math.hypot(200, 10), Math.hypot(189, 97), Math.hypot(11, 10, 97)];
        let previousCamber: number[] | undefined;
        const relativeHeights: number[] = [];
        for (const travel of [-40, -20, 0, 20, 40]) {
            value.rearSuspension.leftVerticalOffsetMm = travel;
            value.rearSuspension.rightVerticalOffsetMm = -travel;
            const result = solveSuspension(value);
            expect(result.rearSolution).not.toBeNull();
            expect(result.camberArmOuterMounts).not.toBeNull();
            for (const side of [0, 1] as const) {
                const main = result.rearSolution!.mainOuterMounts[side];
                const toe = result.rearSolution!.toeOuterMounts[side];
                const camber = result.camberArmOuterMounts![side];
                expect(distance(result.rearMounts[side], main)).toBeCloseTo(value.rearSuspension.mainArmLengthMm, 8);
                expect(distance(result.toeArmMounts[side], toe)).toBeCloseTo(value.rearSuspension.toeArmLengthMm, 8);
                expect(distance(result.camberArmMounts[side], camber)).toBeCloseTo(value.rearSuspension.camberArmLengthMm, 8);
                expect(distance(main, toe)).toBeCloseTo(expected[0], 8);
                expect(distance(main, camber)).toBeCloseTo(expected[1], 8);
                expect(distance(toe, camber)).toBeCloseTo(expected[2], 8);
                expect(toe[2] - main[2]).toBeCloseTo(value.rearHub.toeArmOuterMountHeightOffsetMm, 8);
            }
            const camber = result.camberArmOuterMounts![0];
            relativeHeights.push(camber[2] - result.rearSolution!.mainOuterMounts[0][2]);
            if (previousCamber) expect(distance(camber, previousCamber)).toBeLessThan(80);
            previousCamber = camber;
        }
        expect(Math.max(...relativeHeights) - Math.min(...relativeHeights)).toBeGreaterThan(0.1);
        value.rearSuspension.mainArmLengthMm = 1;
        expect(solveSuspension(value).camberArmOuterMounts).toBeNull();
    });

    it("rejects a camber arm length that cannot reach the hub", () => {
        const value = project();
        value.rearSuspension.camberArmLengthMm = 1;
        expect(solveSuspension(value).rearSolution).toBeNull();
        expect(rearHeightReachable(value, 0, 0)).toBe(false);
    });

    it("mirrors the solved hubs and responds to camber arm length changes", () => {
        const value = project();
        const original = solveSuspension(value);
        value.rearSuspension.camberArmLengthMm = 220;
        const changed = solveSuspension(value);
        expect(changed.rearSolution).not.toBeNull();
        for (const result of [original, changed]) {
            const [left, right] = result.camberArmOuterMounts!;
            expect(left[0]).toBeCloseTo(right[0], 8);
            expect(left[1]).toBeCloseTo(-right[1], 8);
            expect(left[2]).toBeCloseTo(right[2], 8);
        }
        expect(changed.rearSolution!.toeOuterMounts).toEqual(original.rearSolution!.toeOuterMounts);
        expect(changed.camberArmOuterMounts![0]).not.toEqual(original.camberArmOuterMounts![0]);
        const inner = changed.camberArmMounts[0];
        const outer = changed.camberArmOuterMounts![0];
        expect(Math.hypot(outer[0] - inner[0], outer[1] - inner[1], outer[2] - inner[2])).toBeCloseTo(220, 8);
    });

    it.each([-20, 20])("preserves the tilted hub dimensions with camber lateral offset %i", (lateral) => {
        const value = project();
        value.rearHub.toeArmOuterMountHeightOffsetMm = 15;
        value.rearHub.camberArmOuterMountLateralOffsetMm = lateral;
        const distance = (a: number[], b: number[]) =>
            Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        for (const travel of [-20, 0, 20]) {
            value.rearSuspension.leftVerticalOffsetMm = travel;
            const result = solveSuspension(value);
            expect(result.rearSolution).not.toBeNull();
            for (const side of [0, 1] as const) {
                const main = result.rearSolution!.mainOuterMounts[side];
                const toe = result.rearSolution!.toeOuterMounts[side];
                const camber = result.camberArmOuterMounts![side];
                expect(distance(main, toe)).toBeCloseTo(Math.hypot(200, 10, 15), 8);
                expect(distance(main, camber)).toBeCloseTo(Math.hypot(189, lateral, 97), 8);
                expect(distance(toe, camber)).toBeCloseTo(Math.hypot(11, 10 - lateral, 15 - 97), 8);
                expect(distance(result.camberArmMounts[side], camber)).toBeCloseTo(210, 8);
            }
        }
    });

    it("preserves independent front and rear failure states and warning keys", () => {
        const value = project();
        value.rearSuspension.mainArmLengthMm = 1;
        let result = solveSuspension(value);
        expect(result.rearSolution).toBeNull();
        expect(result.knuckleValid).toBe(true);
        expect(result.alignment).not.toBeNull();
        expect(result.geometryStatusKey).toBe("Rear arm lengths cannot reach all outer mounts with the current geometry.");
        value.steeringRack.tieRodLengthMm = 1;
        result = solveSuspension(value);
        expect(result.knuckleValid).toBe(false);
        expect(result.alignment).toBeNull();
        expect(result.groundAxisPoints).toEqual([null, null]);
        expect(result.geometryMessage).toContain("Tie Rod Length cannot be satisfied");
        expect(result.geometryMessage).toContain("Strut length outside configured");
        expect(result.geometryStatusKey).toContain("|left|right");
    });

    it("uses the supplied project each time, including replacements", () => {
        const first = project();
        const second = structuredClone(first);
        second.frontLowerControlArmPickup.widthMm = 510;
        expect(solveSuspension(first).points.front[0][1]).toBe(465);
        expect(solveSuspension(second).points.front[0][1]).toBe(510);
    });

    it("reports strut travel violations without suppressing valid alignment", () => {
        const value = project();
        value.wheelKnuckle.strutMinLengthMm = 590;
        const result = solveSuspension(value);
        expect(result.knuckleValid).toBe(true);
        expect(result.strutOutOfRange).toEqual([true, true]);
        expect(result.geometryMessage).toContain("Strut length outside configured 590-650 mm travel: left 580.0 mm, right 580.0 mm.");
        expect(result.geometryStatusKey).toBe("left|right");
        expect(result.alignment).not.toBeNull();
    });

    it.each(["min", "max"] as const)("tolerates tiny deviations at the strut %s limit", (limit) => {
        const value = project();
        const length = solveSuspension(value).knucklePoints.strutLengths[0];
        const direction = limit === "min" ? 1 : -1;
        const setLimit = (offset: number) => {
            if (limit === "min") value.wheelKnuckle.strutMinLengthMm = length + offset;
            else value.wheelKnuckle.strutMaxLengthMm = length + offset;
        };
        for (const offset of [0, direction * STRUT_TRAVEL_TOLERANCE_MM / 2]) {
            setLimit(offset);
            const result = solveSuspension(value);
            expect(result.strutOutOfRange).toEqual([false, false]);
            expect(result.geometryMessage).not.toContain("Strut length outside configured");
            expect(result.geometryStatusKey).toBe("");
        }
        setLimit(direction * STRUT_TRAVEL_TOLERANCE_MM * 2);
        const result = solveSuspension(value);
        expect(result.strutOutOfRange).toEqual([true, true]);
        expect(result.geometryMessage).toContain("Strut length outside configured");
        expect(result.geometryStatusKey).toBe("left|right");
    });
});

describe("drag constraints", () => {
    it.each([0, 1] as const)("limits front travel for side %i without mutating the project", (side) => {
        const value = project();
        const before = structuredClone(value);
        const initial = side === 0 ? value.frontControlArm.leftRotationRad : value.frontControlArm.rightRotationRad;
        const violation = frontConstraintViolation(value, side, initial);
        const accepted = acceptedFrontAngle(value, side, initial + 10, initial, violation, 0);
        expect(accepted).toBeGreaterThanOrEqual(initial);
        expect(accepted).toBeLessThan(initial + 10);
        const result = frontConstraintViolation(value, side, accepted);
        expect(result[0]).toBeLessThanOrEqual(violation[0] + 1e-8);
        expect(result[1]).toBeLessThanOrEqual(violation[1] + 1e-8);
        expect(value).toEqual(before);
    });

    it.each([0, 1] as const)("stops rear travel at a reachable boundary for side %i", (side) => {
        const value = project();
        const before = structuredClone(value);
        expect(rearHeightReachable(value, side, 0)).toBe(true);
        expect(rearHeightReachable(value, side, 1000)).toBe(false);
        const accepted = acceptedRearOffset(value, side, 1000);
        expect(accepted).toBeGreaterThan(0);
        expect(accepted).toBeLessThan(1000);
        expect(rearHeightReachable(value, side, accepted)).toBe(true);
        expect(value).toEqual(before);
    });

    it("stops dragging when the camber constraint fails even if the main and toe arms still reach", () => {
        const value = project();
        value.rearSuspension.camberArmLengthMm = 190;
        const snapshot = solveSuspension(value);
        expect(snapshot.rearSolution).not.toBeNull();
        let target: number | undefined;
        for (let magnitude = 1; magnitude <= 350 && target === undefined; magnitude += 1) {
            for (const offset of [magnitude, -magnitude]) {
                const nominal = rearMainArmOuterMountPoints(
                    snapshot.rearMounts, snapshot.trailingArmMounts, value.rearSuspension.mainArmLengthMm,
                    value.rearHub.trailingArmLengthMm, value.rearHub.mainArmOuterMountStaticHeightMm, offset, 0,
                );
                try {
                    solveRearArmMounts(
                        snapshot.rearMounts, snapshot.toeArmMounts, nominal, value.rearSuspension.mainArmLengthMm,
                        value.rearSuspension.toeArmLengthMm, value.rearHub.toeArmOuterMountHeightOffsetMm,
                        value.rearHub.toeArmOuterMountForwardOffsetMm, value.rearHub.toeArmOuterMountLateralOffsetMm,
                        value.rearHub.mainArmOuterMountStaticHeightMm,
                    );
                } catch (error) {
                    if (!isGeometryError(error, REAR_GEOMETRY_ERROR_CODES)) throw error;
                    continue;
                }
                if (!rearHeightReachable(value, 0, offset)) {
                    target = offset;
                    break;
                }
            }
        }
        expect(target).toBeDefined();
        const accepted = acceptedRearOffset(value, 0, target!);
        expect(Math.abs(accepted)).toBeLessThan(Math.abs(target!));
        expect(rearHeightReachable(value, 0, accepted)).toBe(true);
    });

    it.each([0, 1] as const)("moves rear side %i longitudinally and vertically while preserving link lengths", (side) => {
        const value = project();
        const before = solveSuspension(value);
        const accepted = acceptedRearPosition(value, side, {longitudinalMm: 30, verticalMm: 20});
        expect(accepted.longitudinalMm).toBeCloseTo(30);
        expect(accepted.verticalMm).toBeCloseTo(20);
        if (side === 0) {
            value.rearSuspension.leftLongitudinalOffsetMm = accepted.longitudinalMm;
            value.rearSuspension.leftVerticalOffsetMm = accepted.verticalMm;
        } else {
            value.rearSuspension.rightLongitudinalOffsetMm = accepted.longitudinalMm;
            value.rearSuspension.rightVerticalOffsetMm = accepted.verticalMm;
        }
        const after = solveSuspension(value);
        const main = after.rearSolution!.mainOuterMounts[side];
        expect(main[0] - before.rearSolution!.mainOuterMounts[side][0]).toBeCloseTo(30, 8);
        expect(main[2] - before.rearSolution!.mainOuterMounts[side][2]).toBeCloseTo(20, 8);
        expect(after.rearSolution!.mainOuterMounts[1 - side]).toEqual(before.rearSolution!.mainOuterMounts[1 - side]);
        const distance = (a: number[], b: number[]) =>
            Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        expect(distance(main, after.rearMounts[side])).toBeCloseTo(value.rearSuspension.mainArmLengthMm, 8);
        expect(distance(after.rearSolution!.toeOuterMounts[side], after.toeArmMounts[side]))
            .toBeCloseTo(value.rearSuspension.toeArmLengthMm, 8);
        expect(distance(after.camberArmOuterMounts![side], after.camberArmMounts[side]))
            .toBeCloseTo(value.rearSuspension.camberArmLengthMm, 8);
        const oldMain = before.rearSolution!.mainOuterMounts[side];
        const oldToe = before.rearSolution!.toeOuterMounts[side];
        const oldCamber = before.camberArmOuterMounts![side];
        const toe = after.rearSolution!.toeOuterMounts[side];
        const camber = after.camberArmOuterMounts![side];
        expect(distance(main, toe)).toBeCloseTo(distance(oldMain, oldToe), 8);
        expect(distance(main, camber)).toBeCloseTo(distance(oldMain, oldCamber), 8);
        expect(distance(toe, camber)).toBeCloseTo(distance(oldToe, oldCamber), 8);
        const boundary = acceptedRearPosition(value, side, {longitudinalMm: 1000, verticalMm: 20});
        expect(boundary.longitudinalMm).toBeLessThan(1000);
        expect(rearPositionReachable(value, side, boundary)).toBe(true);
    });

    it("clamps rack travel symmetrically to the configured limits", () => {
        const value = project();
        expect(clampRackTravel(value, 1000)).toBe(165);
        expect(clampRackTravel(value, -1000)).toBe(-165);
        expect(clampRackTravel(value, 20)).toBe(20);
    });

    it("allows recovery from an out-of-range angle without crossing to the opposite invalid side", () => {
        const value = project();
        value.frontControlArm.leftRotationRad = 2;
        const initial = frontConstraintViolation(value, 0, 2);
        const accepted = acceptedFrontAngle(value, 0, -2, 2, initial, 1);
        expect(accepted).toBeGreaterThanOrEqual(-Math.PI / 2 - 1e-8);
        expect(accepted).toBeLessThan(2);
    });

    it.each([[0, -1], [0, 1], [1, -1], [1, 1]] as const)(
        "does not accumulate travel tolerance across repeated drags on side %i toward %i", (side, direction) => {
            const value = project();
            let accepted = side === 0 ? value.frontControlArm.leftRotationRad : value.frontControlArm.rightRotationRad;
            const target = accepted + direction * 1e-5;
            const initialLength = solveSuspension(value).knucklePoints.strutLengths[side];
            const moved = structuredClone(value);
            if (side === 0) moved.frontControlArm.leftRotationRad = target;
            else moved.frontControlArm.rightRotationRad = target;
            const targetLength = solveSuspension(moved).knucklePoints.strutLengths[side];
            if (targetLength < initialLength) value.wheelKnuckle.strutMinLengthMm = initialLength;
            else value.wheelKnuckle.strutMaxLengthMm = initialLength;
            let baseline = frontConstraintViolation(value, side, accepted);
            for (let i = 0; i < 50; i += 1) {
                accepted = acceptedFrontAngle(value, side, target, accepted, baseline, 0);
                if (side === 0) value.frontControlArm.leftRotationRad = accepted;
                else value.frontControlArm.rightRotationRad = accepted;
                baseline = frontConstraintViolation(value, side, accepted);
                expect(baseline[1]).toBeLessThanOrEqual(STRUT_TRAVEL_TOLERANCE_MM);
                expect(solveSuspension(value).strutOutOfRange).toEqual([false, false]);
            }
            expect(Math.abs(accepted - target)).toBeGreaterThan(1e-6);
            expect(baseline[1]).toBeGreaterThan(0);
        });

    it("allows recovery from strut travel violations without increasing them", () => {
        const value = project();
        value.wheelKnuckle.strutMinLengthMm = 590;
        const initial = value.frontControlArm.leftRotationRad;
        const baseline = frontConstraintViolation(value, 0, initial);
        const direction = frontConstraintViolation(value, 0, initial + 1e-4)[1] < baseline[1] ? 1 : -1;
        const improving = initial + direction * 1e-4;
        const worsening = initial - direction * 1e-4;
        expect(acceptedFrontAngle(value, 0, improving, initial, baseline, 0)).toBe(improving);
        const accepted = acceptedFrontAngle(value, 0, worsening, initial, baseline, 0);
        expect(frontConstraintViolation(value, 0, accepted)[1]).toBeLessThanOrEqual(baseline[1]);
        expect(accepted).not.toBe(worsening);
    });
});
