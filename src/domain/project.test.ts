import { describe, expect, it } from "vitest";
import { createProjectFromTemplate } from "../templates/templates";
import { validateProject } from "./project";

describe("rear suspension main arm inner mount height", () => {
  const project = () => createProjectFromTemplate("default", "Project", "project-id");

  it("defaults the height for projects saved before it was added", () => {
    const legacy = project();
    const { mainArmInnerMountWidthMm } = legacy.rearSuspension;

    expect(validateProject({
      ...legacy,
      rearSuspension: { mainArmInnerMountWidthMm },
    }).rearSuspension).toEqual({
      mainArmInnerMountWidthMm,
      mainArmInnerMountHeightMm: 250,
      frontToRearLengthMm: 1600,
    });

  });

  it("preserves a valid height", () => {
    const value = project();
    value.rearSuspension.mainArmInnerMountHeightMm = 315;
    expect(validateProject(value).rearSuspension.mainArmInnerMountHeightMm).toBe(315);
  });

  it.each([0, -1, NaN, Infinity, null, "250"])("rejects an invalid height: %s", (height) => {
    const value = project();
    expect(() => validateProject({
      ...value,
      rearSuspension: { ...value.rearSuspension, mainArmInnerMountHeightMm: height },
    })).toThrow("Main arm inner mount height must be a positive finite value.");
  });
});

describe("rear suspension front to rear length", () => {
  const project = () => createProjectFromTemplate("default", "Project", "project-id");

  it("defaults the length for older projects without it", () => {
    const value = project();
    const { mainArmInnerMountWidthMm, mainArmInnerMountHeightMm } = value.rearSuspension;
    expect(validateProject({
      ...value,
      rearSuspension: { mainArmInnerMountWidthMm, mainArmInnerMountHeightMm },
    }).rearSuspension.frontToRearLengthMm).toBe(1600);
  });

  it("preserves a valid length", () => {
    const value = project();
    value.rearSuspension.frontToRearLengthMm = 1800;
    expect(validateProject(value).rearSuspension.frontToRearLengthMm).toBe(1800);
  });

  it.each([0, -1, NaN, Infinity, null, "1600"])("rejects an invalid length: %s", (length) => {
    const value = project();
    expect(() => validateProject({
      ...value,
      rearSuspension: { ...value.rearSuspension, frontToRearLengthMm: length },
    })).toThrow("Front to rear length must be a positive finite value.");
  });
});
