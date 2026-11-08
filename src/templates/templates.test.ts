import { describe, expect, it } from "vitest";
import {
  createProjectFromTemplate,
  DEFAULT_TEMPLATE_KEY,
  listProjectTemplates,
  resetProjectToTemplate,
} from "./templates";

describe("built-in project templates", () => {
  it("loads the default template as the current project format", () => {
    expect(listProjectTemplates()).toContainEqual({ key: DEFAULT_TEMPLATE_KEY, name: "Default" });
    expect(createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "New project", "new-id")).toEqual({
      id: "new-id",
      name: "New project",
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
        tieRodLengthMm: 338,
      },
      frontTopMount: { heightMm: 900, widthMm: 960, offsetMm: 30 },
      wheelKnuckle: {
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
      },
      wheelTire: {
        wheelOffsetMm: -42,
        wheelDiameterIn: 15,
        tireSectionWidthMm: 195,
        tireAspectRatio: 65,
      },
      suspension: { springRateNPerMm: 50 },
      rearSuspension: {
        mainArmInnerMountWidthMm: 750, mainArmInnerMountHeightMm: 250, frontToRearLengthMm: 1900,
        toeArmInnerMountWidthMm: 1000, toeArmInnerMountHeightMm: 260, toeArmMainArmWidthMm: 201,
        mainArmLengthMm: 420, toeArmLengthMm: 225,
      },
    });
  });

  it("resets a project to its template while preserving its id and name", () => {
    const project = createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "Default", "existing-id");
    project.name = "Renamed";
    project.frontLowerControlArmPickup.widthMm = 700;
    project.rearSuspension.mainArmInnerMountHeightMm = 300;
    project.rearSuspension.frontToRearLengthMm = 1800;
    project.rearSuspension.toeArmInnerMountWidthMm = 900;
    project.rearSuspension.toeArmInnerMountHeightMm = 300;
    project.rearSuspension.toeArmMainArmWidthMm = 200;

    expect(resetProjectToTemplate(project, DEFAULT_TEMPLATE_KEY)).toMatchObject({
      id: "existing-id",
      name: "Renamed",
      frontLowerControlArmPickup: { widthMm: 465 },
      rearSuspension: {
        mainArmInnerMountHeightMm: 250, frontToRearLengthMm: 1900,
        toeArmInnerMountWidthMm: 1000, toeArmInnerMountHeightMm: 260, toeArmMainArmWidthMm: 201,
        mainArmLengthMm: 420, toeArmLengthMm: 225,
      },
    });
  });
});
