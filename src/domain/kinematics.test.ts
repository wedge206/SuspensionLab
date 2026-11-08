import { describe, expect, it } from "vitest";
import { createProjectFromTemplate, DEFAULT_TEMPLATE_KEY } from "../templates/templates";
import { solveSuspension } from "./kinematics";
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
});
