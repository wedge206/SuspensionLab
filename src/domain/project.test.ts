import { describe, expect, it } from "vitest";
import { validateProject } from "./project";

describe("chassis project format", () => {
  it("migrates a legacy project to the current default dimensions", () => {
    const project = validateProject({
      schemaVersion: 2,
      id: "legacy-id",
      name: "Old suspension",
      geometry: { wheelCenter: [1, 2, 3], armPivotStart: [4, 5, 6] },
      analysis: { bumpLimitMm: 120 },
    });

    expect(project.schemaVersion).toBe(23);
    expect(project.id).toBe("legacy-id");
    expect(project.name).toBe("Old suspension");
    expect(project.frontLowerControlArmPickup).toEqual({
      widthMm: 465,
      rearWidthMm: 465,
      controlArmDepthMm: 302,
      frontHeightMm: 250,
      rearHeightMm: 250,
    });
    expect(project.frontControlArm).toEqual({
      lengthMm: 320,
      ballJointOffsetMm: 12,
      leftRotationRad: 0,
      rightRotationRad: 0,
    });
    expect(project.steeringRack).toEqual({
      widthMm: 850,
      centerlineHeightMm: 362,
      centerlineOffsetMm: 166,
      housingWidthMm: 500,
      steeringLimiterMm: 10,
      rackTravelMm: 0,
      tieRodLengthMm: 338,
    });
    expect(project.frontTopMount).toEqual({ heightMm: 900, widthMm: 960, offsetMm: 30 });
    expect(project.wheelKnuckle).toEqual({
      steeringPivotHeightMm: 125,
      steeringPivotDepthMm: 210,
      steeringPivotOffsetMm: -24,
      strutMountHeightMm: 130,
      strutMountOffsetMm: -10,
      strutMountLocationMm: -89,
      strutMountAngleDeg: 20,
      strutMaxLengthMm: 650,
      strutMinLengthMm: 450,
      hubHeightMm: 60,
      hubSpacingMm: 94,
    });
    expect(project.wheelTire).toEqual({
      wheelOffsetMm: -42,
      wheelDiameterIn: 15,
      tireSectionWidthMm: 195,
      tireAspectRatio: 65,
    });
    expect(project.suspension).toEqual({ springRateNPerMm: 50 });
    expect(project.rearSuspension).toEqual({ mainArmInnerMountWidthMm: 750 });
  });

  it("accepts a project with explicit top mount dimensions", () => {
    expect(validateProject({
      schemaVersion: 13,
      id: "project-id",
      name: "Frame project",
      frontLowerControlArmPickup: {
        widthMm: 275,
        rearWidthMm: 240,
        controlArmDepthMm: 900,
        frontHeightMm: 210,
        rearHeightMm: 180,
      },
      frontControlArm: {
        lengthMm: 350,
        ballJointOffsetMm: 20,
        leftRotationRad: 0.3,
        rightRotationRad: -0.2,
      },
      steeringRack: { widthMm: 1020, centerlineHeightMm: 330, centerlineOffsetMm: 180 },
      frontTopMount: { heightMm: 920, widthMm: 980, offsetMm: 25 },
      wheelKnuckle: {
        steeringPivotHeightMm: 140,
        steeringPivotDepthMm: 215,
        steeringPivotOffsetMm: 30,
        strutMountHeightMm: 145,
        strutMountOffsetMm: 12,
        strutMountLocationMm: 95,
      },
    })).toEqual({
      schemaVersion: 23,
      id: "project-id",
      name: "Frame project",
      frontLowerControlArmPickup: {
        widthMm: 275,
        rearWidthMm: 240,
        controlArmDepthMm: 900,
        frontHeightMm: 210,
        rearHeightMm: 180,
      },
      frontControlArm: {
        lengthMm: 350,
        ballJointOffsetMm: 20,
        leftRotationRad: 0.3,
        rightRotationRad: -0.2,
      },
      steeringRack: {
        widthMm: 1020,
        centerlineHeightMm: 330,
        centerlineOffsetMm: 180,
        housingWidthMm: 500,
        steeringLimiterMm: 10,
        rackTravelMm: 0,
        tieRodLengthMm: 338,
      },
      frontTopMount: { heightMm: 920, widthMm: 980, offsetMm: 25 },
      wheelKnuckle: {
        steeringPivotHeightMm: 140,
        steeringPivotDepthMm: 215,
        steeringPivotOffsetMm: 30,
        strutMountHeightMm: 145,
        strutMountOffsetMm: 12,
        strutMountLocationMm: 95,
        strutMountAngleDeg: 20,
        strutMaxLengthMm: 650,
        strutMinLengthMm: 450,
        hubHeightMm: 60,
        hubSpacingMm: 94,
      },
      wheelTire: {
        wheelOffsetMm: -42,
        wheelDiameterIn: 15,
        tireSectionWidthMm: 195,
        tireAspectRatio: 65,
      },
      suspension: { springRateNPerMm: 50 },
      rearSuspension: { mainArmInnerMountWidthMm: 750 },
    });
  });

  it("adds suspension defaults when migrating v21 projects", () => {
    const currentProject = validateProject({
      schemaVersion: 2,
      id: "wheel-tire-migration",
      name: "Wheel and tire migration",
    });
    const v21Project: Record<string, unknown> = { ...structuredClone(currentProject) };
    v21Project.schemaVersion = 21;
    delete v21Project.suspension;
    expect(validateProject(v21Project).suspension).toEqual({ springRateNPerMm: 50 });
    const customizedProject = validateProject({
      ...currentProject,
      suspension: { springRateNPerMm: 72.5 },
    });
    expect(customizedProject.suspension.springRateNPerMm).toBe(72.5);
    expect(() => validateProject({
      ...currentProject,
      suspension: { springRateNPerMm: 0 },
    })).toThrow("Spring rate");
  });

  it("adds wheel and tire defaults when migrating v20 projects", () => {
    const currentProject = validateProject({
      schemaVersion: 2,
      id: "wheel-tire-migration",
      name: "Wheel and tire migration",
    });
    const v20Project: Record<string, unknown> = { ...structuredClone(currentProject) };
    delete v20Project.wheelTire;
    delete v20Project.suspension;
    v20Project.schemaVersion = 20;
    expect(validateProject(v20Project).wheelTire).toEqual({
      wheelOffsetMm: -42,
      wheelDiameterIn: 15,
      tireSectionWidthMm: 195,
      tireAspectRatio: 65,
    });
  });

  it("migrates the previous strut mount defaults to signed defaults", () => {
    const project = validateProject({
      schemaVersion: 13,
      id: "existing-v13-id",
      name: "Existing v13 project",
      frontLowerControlArmPickup: {
        widthMm: 465,
        rearWidthMm: 465,
        controlArmDepthMm: 302,
        frontHeightMm: 250,
        rearHeightMm: 250,
      },
      frontControlArm: {
        lengthMm: 320,
        ballJointOffsetMm: 12,
        leftRotationRad: 0,
        rightRotationRad: 0,
      },
      steeringRack: { widthMm: 850, centerlineHeightMm: 362, centerlineOffsetMm: 166 },
      frontTopMount: { heightMm: 900, widthMm: 950, offsetMm: 10 },
      wheelKnuckle: {
        steeringPivotHeightMm: 125,
        steeringPivotDepthMm: 210,
        steeringPivotOffsetMm: 24,
        strutMountHeightMm: 130,
        strutMountOffsetMm: 10,
        strutMountLocationMm: 89,
      },
    });

    expect(project.schemaVersion).toBe(23);
    expect(project.wheelKnuckle.steeringPivotOffsetMm).toBe(-24);
    expect(project.wheelKnuckle.strutMountOffsetMm).toBe(-10);
    expect(project.wheelKnuckle.strutMountLocationMm).toBe(-89);
  });

  it("migrates the previous steering pivot offset default and preserves custom values", () => {
    const previousProject = {
      schemaVersion: 14,
      id: "existing-v14-id",
      name: "Existing v14 project",
      frontLowerControlArmPickup: {
        widthMm: 465,
        rearWidthMm: 465,
        controlArmDepthMm: 302,
        frontHeightMm: 250,
        rearHeightMm: 250,
      },
      frontControlArm: {
        lengthMm: 320,
        ballJointOffsetMm: 12,
        leftRotationRad: 0,
        rightRotationRad: 0,
      },
      steeringRack: { widthMm: 850, centerlineHeightMm: 362, centerlineOffsetMm: 166 },
      frontTopMount: { heightMm: 900, widthMm: 950, offsetMm: 10 },
      wheelKnuckle: {
        steeringPivotHeightMm: 125,
        steeringPivotDepthMm: 210,
        steeringPivotOffsetMm: -24,
        strutMountHeightMm: 130,
        strutMountOffsetMm: -10,
        strutMountLocationMm: -89,
      },
    };

    expect(validateProject(previousProject).wheelKnuckle.steeringPivotOffsetMm).toBe(-24);
    expect(validateProject({
      ...previousProject,
      wheelKnuckle: { ...previousProject.wheelKnuckle, steeringPivotOffsetMm: 18 },
    }).wheelKnuckle.steeringPivotOffsetMm).toBe(18);
  });

  it("adds a default tie rod length when migrating v15 projects", () => {
    const project = validateProject({
      schemaVersion: 15,
      id: "existing-v15-id",
      name: "Existing v15 project",
      frontLowerControlArmPickup: {
        widthMm: 465,
        rearWidthMm: 465,
        controlArmDepthMm: 302,
        frontHeightMm: 250,
        rearHeightMm: 250,
      },
      frontControlArm: {
        lengthMm: 320,
        ballJointOffsetMm: 12,
        leftRotationRad: 0,
        rightRotationRad: 0,
      },
      steeringRack: { widthMm: 850, centerlineHeightMm: 362, centerlineOffsetMm: 166 },
      frontTopMount: { heightMm: 900, widthMm: 950, offsetMm: 10 },
      wheelKnuckle: {
        steeringPivotHeightMm: 125,
        steeringPivotDepthMm: 210,
        steeringPivotOffsetMm: -24,
        strutMountHeightMm: 130,
        strutMountOffsetMm: -10,
        strutMountLocationMm: -89,
      },
    });

    expect(project.schemaVersion).toBe(23);
    expect(project.steeringRack.tieRodLengthMm).toBe(338);
    expect(project.steeringRack.housingWidthMm).toBe(500);
    expect(project.steeringRack.steeringLimiterMm).toBe(10);
  });

  it("adds strut travel defaults when migrating v16 projects", () => {
    const project = validateProject({
      schemaVersion: 16,
      id: "existing-v16-id",
      name: "Existing v16 project",
      frontLowerControlArmPickup: {
        widthMm: 465,
        rearWidthMm: 465,
        controlArmDepthMm: 302,
        frontHeightMm: 250,
        rearHeightMm: 250,
      },
      frontControlArm: {
        lengthMm: 320,
        ballJointOffsetMm: 12,
        leftRotationRad: 0,
        rightRotationRad: 0,
      },
      steeringRack: {
        widthMm: 850,
        centerlineHeightMm: 362,
        centerlineOffsetMm: 166,
        tieRodLengthMm: 341,
      },
      frontTopMount: { heightMm: 900, widthMm: 950, offsetMm: 10 },
      wheelKnuckle: {
        steeringPivotHeightMm: 125,
        steeringPivotDepthMm: 210,
        steeringPivotOffsetMm: -24,
        strutMountHeightMm: 130,
        strutMountOffsetMm: -10,
        strutMountLocationMm: -89,
      },
    });

    expect(project.schemaVersion).toBe(23);
    expect(project.wheelKnuckle).toEqual({
      steeringPivotHeightMm: 125,
      steeringPivotDepthMm: 210,
      steeringPivotOffsetMm: -24,
      strutMountHeightMm: 130,
      strutMountOffsetMm: -10,
      strutMountLocationMm: -89,
      strutMountAngleDeg: 20,
      strutMaxLengthMm: 650,
      strutMinLengthMm: 450,
      hubHeightMm: 60,
      hubSpacingMm: 94,
    });
  });

  it("adds the steering housing width when migrating v17 projects", () => {
    const project = validateProject({
      schemaVersion: 17,
      id: "existing-v17-id",
      name: "Existing v17 project",
      frontLowerControlArmPickup: {
        widthMm: 465,
        rearWidthMm: 465,
        controlArmDepthMm: 302,
        frontHeightMm: 250,
        rearHeightMm: 250,
      },
      frontControlArm: {
        lengthMm: 320,
        ballJointOffsetMm: 12,
        leftRotationRad: 0,
        rightRotationRad: 0,
      },
      steeringRack: {
        widthMm: 850,
        centerlineHeightMm: 362,
        centerlineOffsetMm: 166,
        tieRodLengthMm: 341,
      },
      frontTopMount: { heightMm: 900, widthMm: 950, offsetMm: 10 },
      wheelKnuckle: {
        steeringPivotHeightMm: 125,
        steeringPivotDepthMm: 210,
        steeringPivotOffsetMm: -24,
        strutMountHeightMm: 130,
        strutMountOffsetMm: -10,
        strutMountLocationMm: -89,
        strutMountAngleDeg: 15,
        strutMaxLengthMm: 650,
        strutMinLengthMm: 450,
      },
    });

    expect(project.schemaVersion).toBe(23);
    expect(project.steeringRack).toEqual({
      widthMm: 850,
      centerlineHeightMm: 362,
      centerlineOffsetMm: 166,
      housingWidthMm: 500,
      steeringLimiterMm: 10,
      rackTravelMm: 0,
      tieRodLengthMm: 341,
    });
  });

  it("adds steering limiter and rack travel defaults when migrating v18 projects", () => {
    const project = validateProject({
      schemaVersion: 18,
      id: "existing-v18-id",
      name: "Existing v18 project",
      frontLowerControlArmPickup: {
        widthMm: 465,
        rearWidthMm: 465,
        controlArmDepthMm: 302,
        frontHeightMm: 250,
        rearHeightMm: 250,
      },
      frontControlArm: {
        lengthMm: 320,
        ballJointOffsetMm: 12,
        leftRotationRad: 0,
        rightRotationRad: 0,
      },
      steeringRack: {
        widthMm: 850,
        centerlineHeightMm: 362,
        centerlineOffsetMm: 166,
        housingWidthMm: 500,
        tieRodLengthMm: 341,
      },
      frontTopMount: { heightMm: 900, widthMm: 950, offsetMm: 10 },
      wheelKnuckle: {
        steeringPivotHeightMm: 125,
        steeringPivotDepthMm: 210,
        steeringPivotOffsetMm: -24,
        strutMountHeightMm: 130,
        strutMountOffsetMm: -10,
        strutMountLocationMm: -89,
        strutMountAngleDeg: 15,
        strutMaxLengthMm: 650,
        strutMinLengthMm: 450,
      },
    });

    expect(project.schemaVersion).toBe(23);
    expect(project.steeringRack).toEqual({
      widthMm: 850,
      centerlineHeightMm: 362,
      centerlineOffsetMm: 166,
      housingWidthMm: 500,
      steeringLimiterMm: 10,
      rackTravelMm: 0,
      tieRodLengthMm: 341,
    });
  });

  it("adds hub geometry defaults when migrating v19 projects", () => {
    const project = validateProject({
      schemaVersion: 19,
      id: "existing-v19-id",
      name: "Existing v19 project",
      frontLowerControlArmPickup: {
        widthMm: 465,
        rearWidthMm: 465,
        controlArmDepthMm: 302,
        frontHeightMm: 250,
        rearHeightMm: 250,
      },
      frontControlArm: {
        lengthMm: 320,
        ballJointOffsetMm: 12,
        leftRotationRad: 0,
        rightRotationRad: 0,
      },
      steeringRack: {
        widthMm: 850,
        centerlineHeightMm: 362,
        centerlineOffsetMm: 166,
        housingWidthMm: 500,
        steeringLimiterMm: 10,
        rackTravelMm: 0,
        tieRodLengthMm: 341,
      },
      frontTopMount: { heightMm: 900, widthMm: 950, offsetMm: 10 },
      wheelKnuckle: {
        steeringPivotHeightMm: 125,
        steeringPivotDepthMm: 210,
        steeringPivotOffsetMm: -24,
        strutMountHeightMm: 130,
        strutMountOffsetMm: -10,
        strutMountLocationMm: -89,
        strutMountAngleDeg: 15,
        strutMaxLengthMm: 650,
        strutMinLengthMm: 450,
      },
    });

    expect(project.schemaVersion).toBe(23);
    expect(project.wheelKnuckle.hubHeightMm).toBe(60);
    expect(project.wheelKnuckle.hubSpacingMm).toBe(94);
  });

  it("preserves existing dimensions and defaults top mounts when migrating v9", () => {
    const project = validateProject({
      schemaVersion: 9,
      id: "existing-v9-id",
      name: "Existing v9 project",
      frontLowerControlArmPickup: {
        widthMm: 325,
        rearWidthMm: 275,
        controlArmDepthMm: 302,
        frontHeightMm: 240,
        rearHeightMm: 220,
      },
      frontControlArm: { lengthMm: 330, ballJointOffsetMm: 14 },
      steeringRack: { widthMm: 850, centerlineHeightMm: 362, centerlineOffsetMm: 166 },
    });

    expect(project.frontLowerControlArmPickup.widthMm).toBe(325);
    expect(project.frontControlArm).toEqual({
      lengthMm: 330,
      ballJointOffsetMm: 14,
      leftRotationRad: 0,
      rightRotationRad: 0,
    });
    expect(project.steeringRack).toEqual({
      widthMm: 850,
      centerlineHeightMm: 362,
      centerlineOffsetMm: 166,
      housingWidthMm: 500,
      steeringLimiterMm: 10,
      rackTravelMm: 0,
      tieRodLengthMm: 338,
    });
    expect(project.frontTopMount).toEqual({ heightMm: 900, widthMm: 960, offsetMm: 30 });
  });

  it("preserves v10 dimensions and initializes control-arm rotation angles", () => {
    const project = validateProject({
      schemaVersion: 10,
      id: "existing-v10-id",
      name: "Existing v10 project",
      frontLowerControlArmPickup: {
        widthMm: 325,
        rearWidthMm: 275,
        controlArmDepthMm: 302,
        frontHeightMm: 240,
        rearHeightMm: 220,
      },
      frontControlArm: { lengthMm: 330, ballJointOffsetMm: 14 },
      steeringRack: { widthMm: 850, centerlineHeightMm: 362, centerlineOffsetMm: 166 },
      frontTopMount: { heightMm: 920, widthMm: 980, offsetMm: 25 },
    });

    expect(project.schemaVersion).toBe(23);
    expect(project.frontLowerControlArmPickup.widthMm).toBe(325);
    expect(project.frontControlArm).toEqual({
      lengthMm: 330,
      ballJointOffsetMm: 14,
      leftRotationRad: 0,
      rightRotationRad: 0,
    });
    expect(project.frontTopMount).toEqual({ heightMm: 920, widthMm: 980, offsetMm: 25 });
    expect(project.wheelKnuckle).toEqual({
      steeringPivotHeightMm: 125,
      steeringPivotDepthMm: 210,
      steeringPivotOffsetMm: -24,
      strutMountHeightMm: 130,
      strutMountOffsetMm: -10,
      strutMountLocationMm: -89,
      strutMountAngleDeg: 20,
      strutMaxLengthMm: 650,
      strutMinLengthMm: 450,
      hubHeightMm: 60,
      hubSpacingMm: 94,
    });
  });

  it("preserves v11 dimensions and initializes wheel/knuckle defaults", () => {
    const project = validateProject({
      schemaVersion: 11,
      id: "existing-v11-id",
      name: "Existing v11 project",
      frontLowerControlArmPickup: {
        widthMm: 325,
        rearWidthMm: 275,
        controlArmDepthMm: 302,
        frontHeightMm: 240,
        rearHeightMm: 220,
      },
      frontControlArm: {
        lengthMm: 330,
        ballJointOffsetMm: 14,
        leftRotationRad: 0.1,
        rightRotationRad: -0.1,
      },
      steeringRack: { widthMm: 850, centerlineHeightMm: 362, centerlineOffsetMm: 166 },
      frontTopMount: { heightMm: 920, widthMm: 980, offsetMm: 25 },
    });

    expect(project.schemaVersion).toBe(23);
    expect(project.frontLowerControlArmPickup.widthMm).toBe(325);
    expect(project.frontControlArm.leftRotationRad).toBe(0.1);
    expect(project.frontTopMount).toEqual({ heightMm: 920, widthMm: 980, offsetMm: 25 });
    expect(project.wheelKnuckle).toEqual({
      steeringPivotHeightMm: 125,
      steeringPivotDepthMm: 210,
      steeringPivotOffsetMm: -24,
      strutMountHeightMm: 130,
      strutMountOffsetMm: -10,
      strutMountLocationMm: -89,
      strutMountAngleDeg: 20,
      strutMaxLengthMm: 650,
      strutMinLengthMm: 450,
      hubHeightMm: 60,
      hubSpacingMm: 94,
    });
  });

  it("preserves v12 wheel/knuckle dimensions and adds default strut mount dimensions", () => {
    const project = validateProject({
      schemaVersion: 12,
      id: "existing-v12-id",
      name: "Existing v12 project",
      frontLowerControlArmPickup: {
        widthMm: 325,
        rearWidthMm: 275,
        controlArmDepthMm: 302,
        frontHeightMm: 240,
        rearHeightMm: 220,
      },
      frontControlArm: {
        lengthMm: 330,
        ballJointOffsetMm: 14,
        leftRotationRad: 0.1,
        rightRotationRad: -0.1,
      },
      steeringRack: { widthMm: 850, centerlineHeightMm: 362, centerlineOffsetMm: 166 },
      frontTopMount: { heightMm: 920, widthMm: 980, offsetMm: 25 },
      wheelKnuckle: {
        steeringPivotHeightMm: 140,
        steeringPivotDepthMm: 215,
        steeringPivotOffsetMm: 30,
      },
    });

    expect(project.schemaVersion).toBe(23);
    expect(project.wheelKnuckle).toEqual({
      steeringPivotHeightMm: 140,
      steeringPivotDepthMm: 215,
      steeringPivotOffsetMm: 30,
      strutMountHeightMm: 130,
      strutMountOffsetMm: -10,
      strutMountLocationMm: -89,
      strutMountAngleDeg: 20,
      strutMaxLengthMm: 650,
      strutMinLengthMm: 450,
      hubHeightMm: 60,
      hubSpacingMm: 94,
    });
  });

  it("migrates projects with existing chassis mount data and supplies later defaults", () => {
    const project = validateProject({
      schemaVersion: 4,
      id: "existing-v4-id",
      name: "Existing v4 project",
      frontLowerControlArmPickup: { widthMm: 280, heightMm: 230 },
    });

    expect(project.frontLowerControlArmPickup).toEqual({
      widthMm: 280,
      rearWidthMm: 465,
      controlArmDepthMm: 302,
      frontHeightMm: 230,
      rearHeightMm: 230,
    });
    expect(project.frontControlArm).toEqual({
      lengthMm: 320,
      ballJointOffsetMm: 12,
      leftRotationRad: 0,
      rightRotationRad: 0,
    });
    expect(project.steeringRack).toEqual({
      widthMm: 850,
      centerlineHeightMm: 362,
      centerlineOffsetMm: 166,
      housingWidthMm: 500,
      steeringLimiterMm: 10,
      rackTravelMm: 0,
      tieRodLengthMm: 338,
    });
    expect(project.frontTopMount).toEqual({ heightMm: 900, widthMm: 960, offsetMm: 30 });
    expect(project.wheelKnuckle).toEqual({
      steeringPivotHeightMm: 125,
      steeringPivotDepthMm: 210,
      steeringPivotOffsetMm: -24,
      strutMountHeightMm: 130,
      strutMountOffsetMm: -10,
      strutMountLocationMm: -89,
      strutMountAngleDeg: 20,
      strutMaxLengthMm: 650,
      strutMinLengthMm: 450,
      hubHeightMm: 60,
      hubSpacingMm: 94,
    });
  });

  it("rejects malformed or unsupported project files", () => {
    expect(() => validateProject({ schemaVersion: 18, id: "", name: "Frame" })).toThrow("non-empty");
    expect(() => validateProject({ schemaVersion: 99, id: "id", name: "Project" })).toThrow("Unsupported");

    const validDimensions = {
      frontLowerControlArmPickup: {
        widthMm: 465,
        rearWidthMm: 465,
        controlArmDepthMm: 302,
        frontHeightMm: 250,
        rearHeightMm: 250,
      },
      frontControlArm: {
        lengthMm: 320,
        ballJointOffsetMm: 12,
        leftRotationRad: 0,
        rightRotationRad: 0,
      },
      steeringRack: {
        widthMm: 850,
        centerlineHeightMm: 362,
        centerlineOffsetMm: 166,
        housingWidthMm: 500,
        steeringLimiterMm: 10,
        rackTravelMm: 0,
        tieRodLengthMm: 341,
      },
      wheelKnuckle: {
        steeringPivotHeightMm: 125,
        steeringPivotDepthMm: 210,
        steeringPivotOffsetMm: -24,
        strutMountHeightMm: 130,
        strutMountOffsetMm: -10,
        strutMountLocationMm: -89,
        strutMountAngleDeg: 15,
        strutMaxLengthMm: 650,
        strutMinLengthMm: 450,
        hubHeightMm: 60,
        hubSpacingMm: 94,
      },
      wheelTire: {
        wheelOffsetMm: -42,
        wheelDiameterIn: 15,
        tireSectionWidthMm: 195,
        tireAspectRatio: 65,
      },
      suspension: { springRateNPerMm: 50 },
      rearSuspension: { mainArmInnerMountWidthMm: 750 },
    };
    const project = (frontTopMount: unknown) => ({
      schemaVersion: 23,
      id: "id",
      name: "Frame",
      ...validDimensions,
      frontTopMount,
    });

    const customizedRearSuspension = validateProject({
      ...project({ heightMm: 900, widthMm: 950, offsetMm: 10 }),
      rearSuspension: { mainArmInnerMountWidthMm: 825 },
    });
    expect(customizedRearSuspension.rearSuspension).toEqual({
      mainArmInnerMountWidthMm: 825,
    });
    expect(() => validateProject({
      ...project({ heightMm: 900, widthMm: 950, offsetMm: 10 }),
      rearSuspension: { mainArmInnerMountWidthMm: 0 },
    })).toThrow("Main arm inner mount width must be a positive finite value");

    expect(() => validateProject(project({ heightMm: 0, widthMm: 950, offsetMm: 10 })))
      .toThrow("positive finite");
    expect(() => validateProject(project({ heightMm: 900, widthMm: -1, offsetMm: 10 })))
      .toThrow("positive finite");
    expect(() => validateProject(project({ heightMm: 900, widthMm: 950, offsetMm: -1 })))
      .toThrow("non-negative finite");
    const customizedRack = validateProject({
      ...project({ heightMm: 900, widthMm: 950, offsetMm: 10 }),
      steeringRack: { ...validDimensions.steeringRack, housingWidthMm: 640 },
    });
    expect(customizedRack.steeringRack.housingWidthMm).toBe(640);
    expect(() => validateProject({
      ...project({ heightMm: 900, widthMm: 950, offsetMm: 10 }),
      steeringRack: { ...validDimensions.steeringRack, housingWidthMm: 0 },
    })).toThrow("positive finite");
    expect(() => validateProject({
      ...project({ heightMm: 900, widthMm: 950, offsetMm: 10 }),
      steeringRack: { ...validDimensions.steeringRack, steeringLimiterMm: -1 },
    })).toThrow("positive finite");
    expect(() => validateProject({
      ...project({ heightMm: 900, widthMm: 950, offsetMm: 10 }),
      steeringRack: { ...validDimensions.steeringRack, rackTravelMm: 166 },
    })).toThrow("positive finite");
    const projectWithWheelKnuckle = (wheelKnuckle: Record<string, unknown>) => ({
      schemaVersion: 23,
      id: "id",
      name: "Frame",
      ...validDimensions,
      frontTopMount: { heightMm: 900, widthMm: 950, offsetMm: 10 },
      wheelKnuckle: { ...validDimensions.wheelKnuckle, ...wheelKnuckle },
    });
    expect(() => validateProject(projectWithWheelKnuckle({
      steeringPivotHeightMm: 0,
      steeringPivotDepthMm: 210,
      steeringPivotOffsetMm: 24,
    }))).toThrow("positive finite");
    expect(() => validateProject(projectWithWheelKnuckle({
      steeringPivotHeightMm: 125,
      steeringPivotDepthMm: -1,
      steeringPivotOffsetMm: 24,
      strutMountHeightMm: 130,
      strutMountOffsetMm: 10,
      strutMountLocationMm: 89,
    }))).toThrow("non-negative finite");
    expect(() => validateProject({
      schemaVersion: 23,
      id: "id",
      name: "Frame",
      ...validDimensions,
      frontTopMount: { heightMm: 900, widthMm: 950, offsetMm: 10 },
      steeringRack: { ...validDimensions.steeringRack, tieRodLengthMm: 0 },
    })).toThrow("positive finite");
    const projectWithNegativeStrutMountValues = validateProject(projectWithWheelKnuckle({
      steeringPivotHeightMm: 125,
      steeringPivotDepthMm: 210,
      steeringPivotOffsetMm: -1,
      strutMountHeightMm: 130,
      strutMountOffsetMm: -1,
      strutMountLocationMm: -89,
      strutMountAngleDeg: -5,
    }));
    expect(projectWithNegativeStrutMountValues.wheelKnuckle.strutMountOffsetMm).toBe(-1);
    expect(projectWithNegativeStrutMountValues.wheelKnuckle.strutMountLocationMm).toBe(-89);
    expect(projectWithNegativeStrutMountValues.wheelKnuckle.steeringPivotOffsetMm).toBe(-1);
    expect(projectWithNegativeStrutMountValues.wheelKnuckle.strutMountAngleDeg).toBe(5);
    const customizedStrut = validateProject(projectWithWheelKnuckle({
      strutMountAngleDeg: 7,
      strutMaxLengthMm: 520,
      strutMinLengthMm: 180,
    }));
    expect(customizedStrut.wheelKnuckle).toMatchObject({
      strutMountAngleDeg: 7,
      strutMaxLengthMm: 520,
      strutMinLengthMm: 180,
    });
    const customizedHub = validateProject(projectWithWheelKnuckle({
      hubHeightMm: 72,
      hubSpacingMm: 108,
    }));
    expect(customizedHub.wheelKnuckle).toMatchObject({
      hubHeightMm: 72,
      hubSpacingMm: 108,
    });
    expect(() => validateProject(projectWithWheelKnuckle({ hubHeightMm: 0 })))
      .toThrow("hub dimensions must be positive finite");
    expect(() => validateProject(projectWithWheelKnuckle({ hubSpacingMm: -1 })))
      .toThrow("hub dimensions must be positive finite");
    expect(() => validateProject(projectWithWheelKnuckle({
      strutMountAngleDeg: Number.NaN,
    }))).toThrow("Strut mount angle");
    expect(() => validateProject(projectWithWheelKnuckle({
      strutMaxLengthMm: 200,
    }))).toThrow("minimum below maximum");
    expect(() => validateProject(projectWithWheelKnuckle({
      strutMinLengthMm: 400,
    }))).toThrow("minimum below maximum");
    const customizedWheelTire = validateProject({
      ...project({ heightMm: 900, widthMm: 950, offsetMm: 10 }),
      wheelTire: {
        wheelOffsetMm: -10,
        wheelDiameterIn: 16,
        tireSectionWidthMm: 205,
        tireAspectRatio: 55,
      },
    });
    expect(customizedWheelTire.wheelTire).toEqual({
      wheelOffsetMm: -10,
      wheelDiameterIn: 16,
      tireSectionWidthMm: 205,
      tireAspectRatio: 55,
    });
    for (const [field, value] of [
      ["wheelDiameterIn", 0],
      ["tireSectionWidthMm", 0],
      ["tireAspectRatio", 0],
    ] as const) {
      expect(() => validateProject({
        ...project({ heightMm: 900, widthMm: 950, offsetMm: 10 }),
        wheelTire: { ...validDimensions.wheelTire, [field]: value },
      })).toThrow("positive finite");
    }
    expect(() => validateProject({
      ...project({ heightMm: 900, widthMm: 950, offsetMm: 10 }),
      wheelTire: { ...validDimensions.wheelTire, wheelOffsetMm: Number.NaN },
    })).toThrow("Wheel offset");
  });
});
