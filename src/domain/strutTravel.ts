export const STRUT_TRAVEL_TOLERANCE_MM = 1e-8;

export function strutTravelViolation(length: number, min: number, max: number): number {
    return Math.max(0, min - length, length - max);
}
