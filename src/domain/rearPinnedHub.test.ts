import {describe, expect, it} from "vitest";
import {rotatePointAroundAxis} from "./coordinates";
import {solvePinnedRearHub, type PinnedRearHubParameters} from "./rearPinnedHub";
import {solveSuspension} from "./kinematics";
import {acceptedRearOffset, rearHeightReachable} from "./dragConstraints";
import {createProjectFromTemplate} from "../templates/templates";
import type {Vec3} from "./types";

const distance = (a: Vec3, b: Vec3) => Math.hypot(...a.map((value, i) => value - b[i]));

function fixture(pivot: number, twist: number, bend: number): PinnedRearHubParameters {
    const mainMounts: [Vec3, Vec3] = [[0, 200, 250], [0, -200, 250]];
    const toeMounts: [Vec3, Vec3] = [[200, 300, 270], [200, -300, 270]];
    const camberMounts: [Vec3, Vec3] = [[300, 330, 400], [300, -330, 400]];
    const trailingMounts: [Vec3, Vec3] = [[670, 535, 317], [670, -535, 317]];
    const transform = (point: Vec3): Vec3 => {
        const origin: Vec3 = [0, 0, 0];
        const twisted = rotatePointAroundAxis(point, origin, [1, 0, 0], twist);
        const bent = rotatePointAroundAxis(twisted, origin, [0, 0, 1], bend);
        const rotated = rotatePointAroundAxis([bent[0] - 470, bent[1], bent[2]], origin, [0, 1, 0], pivot);
        return [rotated[0] + trailingMounts[0][0], rotated[1] + trailingMounts[0][1],
            rotated[2] + trailingMounts[0][2]];
    };
    const main = transform([-200, 0, -77]);
    const toe = transform([0, 0, -77]);
    const camber = transform([-10, 0, 20]);
    return {
        mainMounts, toeMounts, camberMounts, trailingMounts,
        mainLengthMm: distance(main, mainMounts[0]),
        toeLengthMm: distance(toe, toeMounts[0]),
        camberLengthMm: distance(camber, camberMounts[0]),
        toeHeightMm: 0, toeForwardMm: 200, toeLateralMm: 0,
        camberHeightMm: 97, camberForwardMm: 190, camberLateralMm: 0,
        trailingHeightMm: 77, trailingLateralMm: 0, trailingLengthMm: 470,
        twistLimitRad: 0.3, bendingLimitRad: 0.3, heights: [main[2], main[2]],
    };
}

describe("trailing-arm bending", () => {
    it.each([[0.08, 0.04, 0.08], [-0.08, -0.04, -0.08]] as const)(
        "limits bending to the top view with pivot %f, twist %f, bend %f", (pivot, twist, bend) => {
            const p = fixture(pivot, twist, bend);
            const solution = solvePinnedRearHub(p);
            for (const side of [0, 1] as const) {
                const main = solution.mainOuterMounts[side];
                const toe = solution.toeOuterMounts[side];
                const flex = solution.flex[side];
                const dx = toe[0] - main[0];
                const dy = toe[1] - main[1];
                const dz = toe[2] - main[2];
                expect(Math.atan2(-dz, dx)).toBeCloseTo(flex.pivotRad, 7);
                expect(Math.abs(Math.atan2(dy, Math.hypot(dx, dz)))).toBeCloseTo(flex.bendingRad, 7);
                expect(flex.bendingRad).toBeGreaterThan(0.01);
                expect(distance(main, p.mainMounts[side])).toBeCloseTo(p.mainLengthMm, 6);
                expect(distance(toe, p.toeMounts[side])).toBeCloseTo(p.toeLengthMm, 6);
                expect(distance(solution.camberOuterMounts[side], p.camberMounts[side])).toBeCloseTo(p.camberLengthMm, 6);
                expect(solution.trailingArms[side][2]).toEqual(p.trailingMounts[side]);
            }
        },
    );

    it("does not invent side-view bending to make an incompatible height reachable", () => {
        const p = fixture(0, 0, 0);
        expect(() => solvePinnedRearHub(p)).not.toThrow();
        p.heights[0] += 10;
        expect(() => solvePinnedRearHub(p)).toThrow();
    });

    it("enforces the individual twist and top-view bending limits", () => {
        const p = fixture(0.08, 0.04, 0.08);
        const solved = solvePinnedRearHub(p);
        const twist = Math.abs(solved.flex[0].twistRad);
        const bend = solved.flex[0].bendingRad;
        expect(twist).toBeGreaterThan(0.001);
        expect(bend).toBeGreaterThan(0.001);
        expect(() => solvePinnedRearHub({...p, twistLimitRad: twist / 2})).toThrow();
        expect(() => solvePinnedRearHub({...p, bendingLimitRad: bend / 2})).toThrow();
    });

    it("accepts the current mount geometry with neutral-pose link lengths", () => {
        const project = createProjectFromTemplate("default", "Test", "test");
        project.rearSuspension.mainArmLengthMm = Math.hypot(20, 399.2, 10);
        project.rearSuspension.toeArmLengthMm = Math.hypot(40, 140, 10);
        project.rearSuspension.camberArmLengthMm = Math.hypot(20, 161.7, 17);
        const result = solveSuspension(project);
        expect(result.rearSolution).not.toBeNull();
        expect(result.rearSolution!.flex[0].bendingRad).toBeCloseTo(0, 7);
        expect(result.rearSolution!.flex[0].twistRad).toBeCloseTo(0, 7);
        expect(rearHeightReachable(project, 0, 0)).toBe(true);
        expect(Math.abs(acceptedRearOffset(project, 0, 10))).toBeLessThan(0.1);
        project.rearSuspension.leftVerticalOffsetMm = 1;
        expect(solveSuspension(project).rearSolution).toBeNull();
    });
});
