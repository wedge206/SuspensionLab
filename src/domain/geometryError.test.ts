import { describe, expect, it } from "vitest";
import {
  rearMainArmInnerMountPoints, rearMainArmOuterMountPoints, rearToeArmInnerMountPoints,
  rearTrailingArmMountPoints, solveRearArmMounts, tieRodConstrainedKnucklePoints,
} from "./coordinates";
import {
  FRONT_GEOMETRY_ERROR_CODES, GeometryError, isGeometryError, REAR_GEOMETRY_ERROR_CODES,
} from "./geometryError";

function thrownBy(action: () => unknown): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  throw new Error("Expected the action to throw.");
}

describe("GeometryError", () => {
  it("is matched by code, not by message text", () => {
    const error = new GeometryError("tieRodUnsatisfiable");
    expect(isGeometryError(error, FRONT_GEOMETRY_ERROR_CODES)).toBe(true);
    expect(isGeometryError(error, REAR_GEOMETRY_ERROR_CODES)).toBe(false);
    expect(isGeometryError(new Error(error.message), FRONT_GEOMETRY_ERROR_CODES)).toBe(false);
  });

  it("is thrown with the expected codes by the solvers", () => {
    const knuckle = (tieRodLengthMm: number, topMountHeightMm: number) => () => tieRodConstrainedKnucklePoints(
      [[0, 100, 100], [0, -100, 100]],
      [[0, 0, 100], [0, 0, 100]],
      [[0, 100, topMountHeightMm], [0, -100, topMountHeightMm]],
      125, 210, -24, 130, -10, -89, 10, tieRodLengthMm, 450, 650,
    );
    expect(thrownBy(knuckle(10000, 600))).toMatchObject({ code: "tieRodUnsatisfiable" });
    expect(thrownBy(knuckle(341, 110))).toMatchObject({ code: "strutCannotReachTopMount" });

    const inner = rearMainArmInnerMountPoints(1900, 400, 250);
    const trailing = rearTrailingArmMountPoints(inner, 1160, 308, 460);
    const nominal = rearMainArmOuterMountPoints(inner, trailing, 370, 455, 240);
    const toe = rearToeArmInnerMountPoints(inner, 685, 260, 201);
    expect(thrownBy(() => solveRearArmMounts(inner, toe, nominal, 10, 10, 0, 200, 10, 240)))
      .toMatchObject({ code: "rearArmsUnreachable" });
  });
});
