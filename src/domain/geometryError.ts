/**
 * Expected solver failures: the current geometry has no valid solution. Callers handle these by
 * code (showing a status message, rejecting a drag step, etc.); any other error is a real bug and
 * should propagate.
 */
const GEOMETRY_ERROR_MESSAGES = {
    rearArmsUnreachable: "Rear arm lengths cannot reach both outer mounts with the current geometry.",
    tieRodUnsatisfiable: "Tie Rod Length cannot be satisfied at the current ball joint position.",
    strutCannotReachTopMount: "Strut angle cannot reach the fixed top mount.",
} as const;

export type GeometryErrorCode = keyof typeof GEOMETRY_ERROR_MESSAGES;

/** Failures from the front knuckle solve (tie rod and strut constraints). */
export const FRONT_GEOMETRY_ERROR_CODES: readonly GeometryErrorCode[] = [
    "tieRodUnsatisfiable",
    "strutCannotReachTopMount",
];

/** Failures from the rear arm solve. */
export const REAR_GEOMETRY_ERROR_CODES: readonly GeometryErrorCode[] = ["rearArmsUnreachable"];

export class GeometryError extends Error {
    constructor(readonly code: GeometryErrorCode) {
        super(GEOMETRY_ERROR_MESSAGES[code]);
        this.name = "GeometryError";
    }
}

/** True when `error` is a GeometryError whose code is one of `codes`. */
export function isGeometryError(error: unknown, codes: readonly GeometryErrorCode[]): error is GeometryError {
    return error instanceof GeometryError && codes.includes(error.code);
}
