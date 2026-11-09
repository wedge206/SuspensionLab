import {GeometryError} from "./geometryError";
import type {Vec3} from "./types";

export interface PinnedRearHubParameters {
    mainMounts: [Vec3, Vec3];
    toeMounts: [Vec3, Vec3];
    camberMounts: [Vec3, Vec3];
    trailingMounts: [Vec3, Vec3];
    mainLengthMm: number;
    toeLengthMm: number;
    camberLengthMm: number;
    toeHeightMm: number;
    toeForwardMm: number;
    toeLateralMm: number;
    camberHeightMm: number;
    camberForwardMm: number;
    camberLateralMm: number;
    trailingHeightMm: number;
    trailingLateralMm: number;
    trailingLengthMm: number;
    twistLimitRad: number;
    bendingLimitRad: number;
    heights: [number, number];
}

type RearAngles = [number, number, number];

function rotate(v: Vec3, angles: Vec3): Vec3 {
    const [x, y, z] = angles;
    const a = Math.hypot(x, y, z);
    if (a < 1e-14) return [...v];
    const u: Vec3 = [x / a, y / a, z / a];
    const c = Math.cos(a), s = Math.sin(a);
    const dot = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    return [
        v[0] * c + (u[1] * v[2] - u[2] * v[1]) * s + u[0] * dot * (1 - c),
        v[1] * c + (u[2] * v[0] - u[0] * v[2]) * s + u[1] * dot * (1 - c),
        v[2] * c + (u[0] * v[1] - u[1] * v[0]) * s + u[2] * dot * (1 - c),
    ];
}

function linearSolve(matrix: number[][], rhs: number[]): number[] | null {
    const size = rhs.length;
    const a = matrix.map((row, i) => [...row, rhs[i]]);
    for (let col = 0; col < size; col += 1) {
        let pivot = col;
        for (let row = col + 1; row < size; row += 1) {
            if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
        }
        if (Math.abs(a[pivot][col]) < 1e-18) return null;
        [a[col], a[pivot]] = [a[pivot], a[col]];
        for (let row = col + 1; row < size; row += 1) {
            const factor = a[row][col] / a[col][col];
            for (let k = col; k <= size; k += 1) a[row][k] -= factor * a[col][k];
        }
    }
    const result = Array<number>(size).fill(0);
    for (let row = size - 1; row >= 0; row -= 1) {
        result[row] = (a[row][size] - result.reduce((sum, value, k) =>
            sum + (k > row ? a[row][k] * value : 0), 0)) / a[row][row];
    }
    return result;
}

export function solvePinnedRearHub(p: PinnedRearHubParameters) {
    const solved = ([0, 1] as const).map((side) => {
        const sign = side === 0 ? -1 : 1;
        const toe: Vec3 = [p.toeForwardMm, sign * p.toeLateralMm, p.toeHeightMm];
        const camber: Vec3 = [p.camberForwardMm, sign * p.camberLateralMm, p.camberHeightMm];
        const start: Vec3 = [toe[0], toe[1] + sign * p.trailingLateralMm, toe[2] + p.trailingHeightMm];
        const local: Vec3[] = [[0, 0, 0], toe, camber, start];
        const relative = local.map((point): Vec3 => [point[0] - start[0], point[1] - start[1], point[2] - start[2]]);
        // The shaft swings about the chassis lateral axis; the hub rotates at its end by the
        // equivalent twist and top-view bending deformation.
        const position = ([pivot, twist, bendZ]: RearAngles) => relative.map((point): Vec3 => {
            const flexed = rotate(rotate(point, [twist, 0, 0]), [0, 0, bendZ]);
            const rotated = rotate([flexed[0] - p.trailingLengthMm, flexed[1], flexed[2]], [0, pivot, 0]);
            return [rotated[0] + p.trailingMounts[side][0], rotated[1] + p.trailingMounts[side][1],
                rotated[2] + p.trailingMounts[side][2]];
        });
        const residual = (angles: RearAngles) => {
            const points = position(angles);
            return [
                Math.hypot(...points[0].map((v, i) => v - p.mainMounts[side][i])) - p.mainLengthMm,
                Math.hypot(...points[1].map((v, i) => v - p.toeMounts[side][i])) - p.toeLengthMm,
                Math.hypot(...points[2].map((v, i) => v - p.camberMounts[side][i])) - p.camberLengthMm,
                points[0][2] - p.heights[side],
            ];
        };
        const cost = (r: number[]) => r.reduce((sum, value) => sum + value * value, 0);
        const seeds: RearAngles[] = [[0, 0, 0], [0.2, 0, 0], [-0.2, 0, 0],
            [0, 0.15, 0], [0, -0.15, 0], [0, 0, 0.15], [0, 0, -0.15]];
        let best: {angles: RearAngles; flex: number} | null = null;
        let exceedsFlexLimit = false;
        for (const seed of seeds) {
            let angles: RearAngles = [...seed];
            let lambda = 0.01;
            for (let iteration = 0; iteration < 100; iteration += 1) {
                const r = residual(angles);
                const error = cost(r);
                if (error < 1e-16) break;
                const h = 1e-6;
                const jacobian = angles.map((_, column) => {
                    const next: RearAngles = [...angles];
                    next[column] += h;
                    return residual(next).map((value, row) => (value - r[row]) / h);
                });
                const matrix = jacobian.map((column, i) => jacobian.map((other, j) =>
                    column.reduce((sum, value, k) => sum + value * other[k], 0) + (i === j ? lambda : 0)));
                const rhs = jacobian.map((column) => -column.reduce((sum, value, k) => sum + value * r[k], 0));
                const step = linearSolve(matrix, rhs);
                if (!step) break;
                const next: RearAngles = [
                    angles[0] + step[0], angles[1] + step[1], angles[2] + step[2],
                ];
                if (cost(residual(next)) < error) {
                    angles = next;
                    lambda = Math.max(1e-12, lambda / 4);
                } else {
                    lambda *= 10;
                    if (lambda > 1e12) break;
                }
            }
            const error = cost(residual(angles));
            const flex = Math.hypot(angles[1], angles[2]);
            if (error < 1e-12 && Math.abs(angles[0]) <= Math.PI &&
                (Math.abs(angles[1]) > p.twistLimitRad + 1e-8 ||
                    Math.abs(angles[2]) > p.bendingLimitRad + 1e-8)) {
                exceedsFlexLimit = true;
            }
            if (error < 1e-12 && Math.abs(angles[1]) <= p.twistLimitRad + 1e-8 &&
                Math.abs(angles[2]) <= p.bendingLimitRad + 1e-8 &&
                Math.abs(angles[0]) <= Math.PI && (!best || flex < best.flex)) {
                best = {angles, flex};
            }
            if (best && best.flex < 1e-8) break;
        }
        if (!best) throw new GeometryError(exceedsFlexLimit ? "rearFlexLimitExceeded" : "rearArmsUnreachable");
        const points = position(best.angles);
        return {main: points[0], toe: points[1], camber: points[2],
            flex: {pivotRad: best.angles[0], twistRad: best.angles[1],
                bendingRad: Math.abs(best.angles[2])},
            trailing: [points[1], points[3], p.trailingMounts[side]] as [Vec3, Vec3, Vec3]};
    });
    return {
        mainOuterMounts: [solved[0].main, solved[1].main] as [Vec3, Vec3],
        toeOuterMounts: [solved[0].toe, solved[1].toe] as [Vec3, Vec3],
        camberOuterMounts: [solved[0].camber, solved[1].camber] as [Vec3, Vec3],
        flex: [solved[0].flex, solved[1].flex] as [typeof solved[0]["flex"], typeof solved[0]["flex"]],
        trailingArms: [solved[0].trailing, solved[1].trailing] as [[Vec3, Vec3, Vec3], [Vec3, Vec3, Vec3]],
    };
}
