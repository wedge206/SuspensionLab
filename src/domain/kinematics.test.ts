import {describe, expect, it} from "vitest";
import {createProjectFromTemplate, DEFAULT_TEMPLATE_KEY} from "../templates/templates";
import {solveSuspension} from "./kinematics";
import {STRUT_TRAVEL_TOLERANCE_MM} from "./strutTravel";
import {
    acceptedFrontAngle, acceptedRearOffset, clampRackTravel, frontConstraintViolation, rearHeightReachable,
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
        value.rearHub.camberArmOuterMountHeightMm = 110;
        value.rearHub.camberArmOuterMountForwardOffsetMm = -25;
        for (const lateral of [0, 30, -30]) {
            value.rearHub.camberArmOuterMountLateralOffsetMm = lateral;
            const expected = [
                Math.hypot(200, 10),
                Math.hypot(-25, lateral, 110),
                Math.hypot(200 - (-25), 10 - lateral, 110),
            ];
            let firstToeDirection: number | undefined;
            let lastToeDirection = 0;
            for (const travel of [-60, -30, 0, 30, 60]) {
                value.rearSuspension.leftVerticalOffsetMm = travel;
                value.rearSuspension.rightVerticalOffsetMm = -travel;
                const result = solveSuspension(value);
                expect(result.rearSolution).not.toBeNull();
                expect(result.camberArmOuterMounts).not.toBeNull();
                for (const side of [0, 1] as const) {
                    const main = result.rearSolution!.mainOuterMounts[side];
                    const toe = result.rearSolution!.toeOuterMounts[side];
                    const camber = result.camberArmOuterMounts![side];
                    expect(distance(main, toe)).toBeCloseTo(expected[0], 8);
                    expect(distance(main, camber)).toBeCloseTo(expected[1], 8);
                    expect(distance(toe, camber)).toBeCloseTo(expected[2], 8);
                    expect(camber[2] - main[2]).toBeCloseTo(110);
                }
                const main = result.rearSolution!.mainOuterMounts[0];
                const toe = result.rearSolution!.toeOuterMounts[0];
                lastToeDirection = Math.atan2(toe[1] - main[1], toe[0] - main[0]);
                if (firstToeDirection === undefined) firstToeDirection = lastToeDirection;
            }
            expect(Math.abs(lastToeDirection - firstToeDirection!)).toBeGreaterThan(1e-4);
        }
        value.rearSuspension.mainArmLengthMm = 1;
        expect(solveSuspension(value).camberArmOuterMounts).toBeNull();
    });

    it("preserves independent front and rear failure states and warning keys", () => {
        const value = project();
        value.rearSuspension.mainArmLengthMm = 1;
        let result = solveSuspension(value);
        expect(result.rearSolution).toBeNull();
        expect(result.knuckleValid).toBe(true);
        expect(result.alignment).not.toBeNull();
        expect(result.geometryStatusKey).toBe("Rear arm lengths cannot reach both outer mounts with the current geometry.");
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
