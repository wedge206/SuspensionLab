import { describe, expect, it } from "vitest";
import { createProjectFromTemplate } from "../templates/templates";
import { validateProject } from "./project";
import {
  rearArmAxisEnd, rearMainArmInnerMountPoints, rearMainArmOuterMountPoints,
  rearTrailingArmMountPoints, rotatePointAroundAxis,
} from "./coordinates";

describe("static strut length", () => {
  it("defaults older projects to 580 mm while retaining their saved arm positions", () => {
    const project = createProjectFromTemplate("default", "Project", "project-id");
    project.frontControlArm.leftRotationRad = 0.2;
    const { strutStaticLengthMm: _omitted, ...wheelKnuckle } = project.wheelKnuckle;
    const loaded = validateProject({ ...project, wheelKnuckle });
    expect(loaded.wheelKnuckle.strutStaticLengthMm).toBe(580);
    expect(loaded.frontControlArm.leftRotationRad).toBe(0.2);
  });

  it.each([0, -1, NaN, Infinity, null, "580"])("rejects invalid static length: %s", (length) => {
    const project = createProjectFromTemplate("default", "Project", "project-id");
    expect(() => validateProject({
      ...project, wheelKnuckle: { ...project.wheelKnuckle, strutStaticLengthMm: length },
    })).toThrow("strut lengths");
  });
});

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
      mainArmLengthMm: 420,
      toeArmLengthMm: 225,
      leftRotationRad: 0,
      rightRotationRad: 0,
      leftVerticalOffsetMm: 0,
      rightVerticalOffsetMm: 0,
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
    { key: "mainArmLengthMm", label: "Rear main arm length", defaultValue: 420 },
    { key: "toeArmLengthMm", label: "Rear toe arm length", defaultValue: 225 },
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

  describe("rear arm positions", () => {
    it("defaults missing positions and preserves saved angles independently", () => {
      const project = createProjectFromTemplate("default", "Project", "project-id");
      const { leftRotationRad: _left, rightRotationRad: _right, ...legacy } = project.rearSuspension;
      expect(validateProject({ ...project, rearSuspension: legacy }).rearSuspension)
        .toMatchObject({ leftRotationRad: 0, rightRotationRad: 0 });
      project.rearSuspension.leftRotationRad = 0.4;
      project.rearSuspension.rightRotationRad = -0.2;
      expect(validateProject(JSON.parse(JSON.stringify(project))).rearSuspension)
        .toMatchObject({ leftRotationRad: 0.4, rightRotationRad: -0.2 });
    });

    it.each(["leftRotationRad", "rightRotationRad"])("rejects invalid %s", (key) => {
      const project = createProjectFromTemplate("default", "Project", "project-id");
      for (const value of [NaN, Infinity, null, "0"]) {
        expect(() => validateProject({
          ...project, rearSuspension: { ...project.rearSuspension, [key]: value },
        })).toThrow("Rear arm rotation angles must be finite values.");
      }
    });

    it("migrates legacy rotations to independent saved vertical offsets", () => {
      const value = project();
      const { leftVerticalOffsetMm: _left, rightVerticalOffsetMm: _right, ...legacy } = value.rearSuspension;
      legacy.leftRotationRad = 0.4;
      legacy.rightRotationRad = -0.3;
      const loaded = validateProject({ ...value, rearSuspension: legacy });
      const inner = rearMainArmInnerMountPoints(legacy.frontToRearLengthMm, legacy.mainArmInnerMountWidthMm, legacy.mainArmInnerMountHeightMm);
      const hub = value.rearHub;
      const trailing = rearTrailingArmMountPoints(inner, hub.trailingArmMountWidthMm, hub.trailingArmMountHeightMm, hub.trailingArmMountForwardOffsetMm);
      const neutral = rearMainArmOuterMountPoints(inner, trailing, legacy.mainArmLengthMm, hub.trailingArmLengthMm, hub.mainArmOuterMountStaticHeightMm);
      for (const [side, angle, offset] of [
        [0, legacy.leftRotationRad, loaded.rearSuspension.leftVerticalOffsetMm],
        [1, legacy.rightRotationRad, loaded.rearSuspension.rightVerticalOffsetMm],
      ] as const) {
        const old = rotatePointAroundAxis(neutral[side], inner[side], rearArmAxisEnd(inner[side], trailing[side], neutral[side]), angle);
        expect(offset).toBeCloseTo(old[2] - hub.mainArmOuterMountStaticHeightMm, 10);
      }
      loaded.rearSuspension.leftVerticalOffsetMm = -150;
      loaded.rearSuspension.rightVerticalOffsetMm = 250;
      expect(validateProject(JSON.parse(JSON.stringify(loaded))).rearSuspension)
        .toMatchObject({ leftVerticalOffsetMm: -150, rightVerticalOffsetMm: 250 });
    });

    it.each(["leftVerticalOffsetMm", "rightVerticalOffsetMm"])("rejects invalid %s", (key) => {
      const value = project();
      for (const offset of [NaN, Infinity, null, "0"]) {
        expect(() => validateProject({
          ...value, rearSuspension: { ...value.rearSuspension, [key]: offset },
        })).toThrow("Rear arm vertical offsets must be finite values.");
      }
    });
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

describe("rear hub dimensions", () => {
  const project = () => createProjectFromTemplate("default", "Project", "project-id");
  const dimensions = [
    {
      key: "mainArmOuterMountStaticHeightMm",
      label: "Main arm outer mount static height",
      defaultValue: 240,
    },
    {
      key: "toeArmOuterMountOffsetMm",
      label: "Toe arm outer mount offset",
      defaultValue: 150,
    },
    {
      key: "toeArmOuterMountHeightMm",
      label: "Toe arm outer mount height",
      defaultValue: 10,
    },
    { key: "trailingArmLengthMm", label: "Trailing arm length", defaultValue: 355 },
    { key: "trailingArmMountHeightMm", label: "Trailing arm mount height", defaultValue: 308 },
    { key: "trailingArmMountWidthMm", label: "Trailing arm mount width", defaultValue: 1100 },
    {
      key: "trailingArmMountForwardOffsetMm",
      label: "Trailing arm mount forward offset",
      defaultValue: 290,
    },
  ] as const;

  it("defaults all rear hub dimensions for older projects", () => {
    const value = project();
    expect(validateProject({ ...value, rearHub: undefined }).rearHub).toEqual({
      mainArmOuterMountStaticHeightMm: 240,
      toeArmOuterMountOffsetMm: 150,
      toeArmOuterMountHeightMm: 10,
      toeArmOuterMountHeightOffsetMm: 0,
      toeArmOuterMountForwardOffsetMm: 200,
      toeArmOuterMountLateralOffsetMm: 10,
      trailingArmLengthMm: 355,
      trailingArmMountHeightMm: 308,
      trailingArmMountWidthMm: 1100,
      trailingArmMountForwardOffsetMm: 290,
    });
  });

  it.each(dimensions)("defaults an absent $key without changing the other dimensions", ({ key, defaultValue }) => {
    const value = project();
    value.rearHub.toeArmOuterMountOffsetMm = 155;
    const { [key]: _omitted, ...remaining } = value.rearHub;
    expect(validateProject({ ...value, rearHub: remaining }).rearHub)
      .toEqual({ ...remaining, [key]: defaultValue });
  });

  it.each(dimensions)("preserves valid $key", ({ key }) => {
    const value = project();
    value.rearHub[key] = 123.5;
    expect(validateProject(value).rearHub[key]).toBe(123.5);
  });

  for (const { key, label } of dimensions) {
    it.each([0, -1, NaN, Infinity, null, "250"])(
      `rejects invalid ${key}: %s`,
      (dimension) => {
        const value = project();
        expect(() => validateProject({
          ...value,
          rearHub: { ...value.rearHub, [key]: dimension },
        })).toThrow(`${label} must be a positive finite value.`);
      },
    );
  }

  const offsets = [
    { key: "toeArmOuterMountHeightOffsetMm", label: "Toe arm outer mount height offset", defaultValue: 0 },
    { key: "toeArmOuterMountForwardOffsetMm", label: "Toe arm outer mount forward offset", defaultValue: 200 },
    { key: "toeArmOuterMountLateralOffsetMm", label: "Toe arm outer mount lateral offset", defaultValue: 10 },
  ] as const;

  it.each(offsets)("defaults missing $key without changing other values", ({ key, defaultValue }) => {
    const value = project();
    value.rearHub.toeArmOuterMountOffsetMm = 155;
    const { [key]: _omitted, ...remaining } = value.rearHub;
    expect(validateProject({ ...value, rearHub: remaining }).rearHub)
      .toEqual({ ...remaining, [key]: defaultValue });
  });

  it.each(offsets)("preserves signed and zero values for $key", ({ key }) => {
    for (const offset of [-25.5, 0, 42]) {
      const value = project();
      value.rearHub[key] = offset;
      expect(validateProject(JSON.parse(JSON.stringify(value))).rearHub[key]).toBe(offset);
    }
  });

  for (const { key, label } of offsets) {
    it.each([NaN, Infinity, null, "10"])(`rejects invalid ${key}: %s`, (offset) => {
      const value = project();
      expect(() => validateProject({
        ...value, rearHub: { ...value.rearHub, [key]: offset },
      })).toThrow(`${label} must be a finite value.`);
    });
  }
});
