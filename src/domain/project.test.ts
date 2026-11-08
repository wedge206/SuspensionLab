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
      toeArmInnerMountWidthMm: 850,
      toeArmInnerMountHeightMm: 250,
      toeArmMainArmWidthMm: 190,
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

describe("rear suspension toe arm dimensions", () => {
  const project = () => createProjectFromTemplate("default", "Project", "project-id");
  const dimensions = [
    { key: "toeArmInnerMountWidthMm", label: "Toe arm inner mount width", defaultValue: 850 },
    { key: "toeArmInnerMountHeightMm", label: "Toe arm inner mount height", defaultValue: 250 },
    { key: "toeArmMainArmWidthMm", label: "Toe arm Main arm width", defaultValue: 190 },
  ] as const;

  it.each(dimensions)("defaults an absent $key without changing the other dimensions", ({ key, defaultValue }) => {
    const value = project();
    value.rearSuspension.toeArmInnerMountWidthMm = 901;
    value.rearSuspension.toeArmInnerMountHeightMm = 301;
    value.rearSuspension.toeArmMainArmWidthMm = 201;
    const { [key]: _omitted, ...remaining } = value.rearSuspension;
    expect(validateProject({ ...value, rearSuspension: remaining }).rearSuspension)
      .toEqual({ ...remaining, [key]: defaultValue });
  });

  it.each(dimensions)("preserves valid $key", ({ key }) => {
    const value = project();
    value.rearSuspension[key] = 123.5;
    expect(validateProject(value).rearSuspension[key]).toBe(123.5);
  });

  for (const { key, label } of dimensions) {
    it.each([0, -1, NaN, Infinity, null, "250"])(
      `rejects invalid ${key}: %s`,
      (dimension) => {
        const value = project();
        expect(() => validateProject({
          ...value,
          rearSuspension: { ...value.rearSuspension, [key]: dimension },
        })).toThrow(`${label} must be a positive finite value.`);
      },
    );
  }
});
