import type { SuspensionProject } from "./types";
import { steeringRackTravelLimitMm } from "./coordinates";

export const DEFAULT_PICKUP_WIDTH_MM = 465;
export const DEFAULT_REAR_PICKUP_WIDTH_MM = 465;
export const DEFAULT_CONTROL_ARM_DEPTH_MM = 302;
export const DEFAULT_FRONT_PICKUP_HEIGHT_MM = 250;
export const DEFAULT_REAR_PICKUP_HEIGHT_MM = 250;
export const DEFAULT_CONTROL_ARM_LENGTH_MM = 320;
export const DEFAULT_BALL_JOINT_OFFSET_MM = 12;
export const DEFAULT_CONTROL_ARM_ROTATION_RAD = 0;
export const DEFAULT_STEERING_RACK_WIDTH_MM = 850;
export const DEFAULT_STEERING_RACK_HEIGHT_MM = 362;
export const DEFAULT_STEERING_RACK_OFFSET_MM = 166;
export const DEFAULT_STEERING_HOUSING_WIDTH_MM = 500;
export const DEFAULT_STEERING_LIMITER_MM = 10;
export const DEFAULT_STEERING_RACK_TRAVEL_MM = 0;
export const DEFAULT_TIE_ROD_LENGTH_MM = 338;
export const DEFAULT_STRUT_MOUNT_ANGLE_DEG = 20;
export const DEFAULT_STRUT_MAX_LENGTH_MM = 650;
export const DEFAULT_STRUT_MIN_LENGTH_MM = 450;
export const DEFAULT_TOP_MOUNT_HEIGHT_MM = 900;
export const DEFAULT_TOP_MOUNT_WIDTH_MM = 960;
export const DEFAULT_TOP_MOUNT_OFFSET_MM = 30;
export const DEFAULT_STEERING_PIVOT_HEIGHT_MM = 125;
export const DEFAULT_STEERING_PIVOT_DEPTH_MM = 210;
export const DEFAULT_STEERING_PIVOT_OFFSET_MM = -24;
export const DEFAULT_STRUT_MOUNT_HEIGHT_MM = 130;
export const DEFAULT_STRUT_MOUNT_OFFSET_MM = -10;
export const DEFAULT_STRUT_MOUNT_LOCATION_MM = -89;
export const DEFAULT_HUB_HEIGHT_MM = 60;
export const DEFAULT_HUB_SPACING_MM = 94;
export const DEFAULT_WHEEL_OFFSET_MM = -42;
export const DEFAULT_WHEEL_DIAMETER_IN = 15;
export const DEFAULT_TIRE_SECTION_WIDTH_MM = 195;
export const DEFAULT_TIRE_ASPECT_RATIO = 65;
export const DEFAULT_SPRING_RATE_N_PER_MM = 50;
export const DEFAULT_MAIN_ARM_INNER_MOUNT_WIDTH_MM = 750;

export function validateProject(value: unknown): SuspensionProject {
  if (!value || typeof value !== "object") {
    throw new Error("Project file must contain a JSON object.");
  }
  const project = value as Record<string, unknown>;
  if (typeof project.id !== "string" || typeof project.name !== "string" ||
      !project.id.trim() || !project.name.trim()) {
    throw new Error("Project needs a non-empty id and name.");
  }
  const pickup = project.frontLowerControlArmPickup;
  if (!pickup || typeof pickup !== "object") {
    throw new Error("Project is missing front lower control arm pickup dimensions.");
  }
  const pickupDimensions = pickup && typeof pickup === "object"
    ? pickup as Record<string, unknown>
    : {};
  const widthMm: unknown = pickupDimensions.widthMm;
  const rearWidthMm: unknown = pickupDimensions.rearWidthMm;
  const controlArmDepthMm: unknown = pickupDimensions.controlArmDepthMm;
  const frontHeightMm: unknown = pickupDimensions.frontHeightMm;
  const rearHeightMm: unknown = pickupDimensions.rearHeightMm;
  const controlArm = project.frontControlArm && typeof project.frontControlArm === "object"
    ? project.frontControlArm as Record<string, unknown>
    : {};
  const controlArmLengthMm: unknown = controlArm.lengthMm;
  const ballJointOffsetMm: unknown = controlArm.ballJointOffsetMm;
  const leftRotationRad: unknown = controlArm.leftRotationRad;
  const rightRotationRad: unknown = controlArm.rightRotationRad;
  const steeringRack = project.steeringRack && typeof project.steeringRack === "object"
    ? project.steeringRack as Record<string, unknown>
    : {};
  const steeringRackWidthMm: unknown = steeringRack.widthMm;
  const steeringRackHeightMm: unknown = steeringRack.centerlineHeightMm;
  const steeringRackOffsetMm: unknown = steeringRack.centerlineOffsetMm;
  const steeringHousingWidthMm: unknown = steeringRack.housingWidthMm;
  const steeringLimiterMm: unknown = steeringRack.steeringLimiterMm;
  const rackTravelMm: unknown = steeringRack.rackTravelMm;
  const tieRodLengthMm: unknown = steeringRack.tieRodLengthMm;
  const topMount = project.frontTopMount && typeof project.frontTopMount === "object"
    ? project.frontTopMount as Record<string, unknown>
    : {};
  const topMountHeightMm: unknown = topMount.heightMm;
  const topMountWidthMm: unknown = topMount.widthMm;
  const topMountOffsetMm: unknown = topMount.offsetMm;
  const wheelKnuckle = project.wheelKnuckle && typeof project.wheelKnuckle === "object"
    ? project.wheelKnuckle as Record<string, unknown>
    : {};
  const steeringPivotHeightMm: unknown = wheelKnuckle.steeringPivotHeightMm;
  const steeringPivotDepthMm: unknown = wheelKnuckle.steeringPivotDepthMm;
  const steeringPivotOffsetMm: unknown = wheelKnuckle.steeringPivotOffsetMm;
  const strutMountHeightMm: unknown = wheelKnuckle.strutMountHeightMm;
  const strutMountOffsetMm: unknown = wheelKnuckle.strutMountOffsetMm;
  const strutMountLocationMm: unknown = wheelKnuckle.strutMountLocationMm;
  const strutMountAngleDeg: unknown = wheelKnuckle.strutMountAngleDeg;
  const strutMaxLengthMm: unknown = wheelKnuckle.strutMaxLengthMm;
  const strutMinLengthMm: unknown = wheelKnuckle.strutMinLengthMm;
  const hubHeightMm: unknown = wheelKnuckle.hubHeightMm;
  const hubSpacingMm: unknown = wheelKnuckle.hubSpacingMm;
  const wheelTire = project.wheelTire && typeof project.wheelTire === "object"
    ? project.wheelTire as Record<string, unknown>
    : {};
  const wheelOffsetMm: unknown = wheelTire.wheelOffsetMm;
  const wheelDiameterIn: unknown = wheelTire.wheelDiameterIn;
  const tireSectionWidthMm: unknown = wheelTire.tireSectionWidthMm;
  const tireAspectRatio: unknown = wheelTire.tireAspectRatio;
  const suspension = project.suspension && typeof project.suspension === "object"
    ? project.suspension as Record<string, unknown>
    : {};
  const springRateNPerMm: unknown = suspension.springRateNPerMm;
  const rearSuspension = project.rearSuspension && typeof project.rearSuspension === "object"
    ? project.rearSuspension as Record<string, unknown>
    : {};
  const mainArmInnerMountWidthMm: unknown = rearSuspension.mainArmInnerMountWidthMm;
  if (typeof widthMm !== "number" || !Number.isFinite(widthMm) || widthMm <= 0 ||
      typeof rearWidthMm !== "number" || !Number.isFinite(rearWidthMm) || rearWidthMm <= 0 ||
      typeof controlArmDepthMm !== "number" || !Number.isFinite(controlArmDepthMm) || controlArmDepthMm <= 0 ||
      typeof frontHeightMm !== "number" || !Number.isFinite(frontHeightMm) || frontHeightMm <= 0 ||
      typeof rearHeightMm !== "number" || !Number.isFinite(rearHeightMm) || rearHeightMm <= 0 ||
      typeof controlArmLengthMm !== "number" || !Number.isFinite(controlArmLengthMm) || controlArmLengthMm <= 0 ||
      typeof ballJointOffsetMm !== "number" || !Number.isFinite(ballJointOffsetMm) || ballJointOffsetMm < 0 ||
      typeof leftRotationRad !== "number" || !Number.isFinite(leftRotationRad) ||
      typeof rightRotationRad !== "number" || !Number.isFinite(rightRotationRad) ||
      typeof steeringRackWidthMm !== "number" || !Number.isFinite(steeringRackWidthMm) || steeringRackWidthMm <= 0 ||
      typeof steeringRackHeightMm !== "number" || !Number.isFinite(steeringRackHeightMm) || steeringRackHeightMm <= 0 ||
      typeof steeringRackOffsetMm !== "number" || !Number.isFinite(steeringRackOffsetMm) || steeringRackOffsetMm < 0 ||
      typeof steeringHousingWidthMm !== "number" || !Number.isFinite(steeringHousingWidthMm) || steeringHousingWidthMm <= 0 ||
      typeof steeringLimiterMm !== "number" || !Number.isFinite(steeringLimiterMm) || steeringLimiterMm < 0 ||
      typeof rackTravelMm !== "number" || !Number.isFinite(rackTravelMm) ||
      typeof steeringRackWidthMm !== "number" || typeof steeringHousingWidthMm !== "number" ||
      typeof steeringLimiterMm !== "number" ||
      Math.abs(rackTravelMm) > steeringRackTravelLimitMm(
        steeringRackWidthMm,
        steeringHousingWidthMm,
        steeringLimiterMm,
      ) + 1e-8 ||
      typeof tieRodLengthMm !== "number" || !Number.isFinite(tieRodLengthMm) || tieRodLengthMm <= 0 ||
      typeof topMountHeightMm !== "number" || !Number.isFinite(topMountHeightMm) || topMountHeightMm <= 0 ||
      typeof topMountWidthMm !== "number" || !Number.isFinite(topMountWidthMm) || topMountWidthMm <= 0 ||
      typeof topMountOffsetMm !== "number" || !Number.isFinite(topMountOffsetMm) || topMountOffsetMm < 0 ||
      typeof steeringPivotHeightMm !== "number" || !Number.isFinite(steeringPivotHeightMm) || steeringPivotHeightMm <= 0 ||
      typeof steeringPivotDepthMm !== "number" || !Number.isFinite(steeringPivotDepthMm) || steeringPivotDepthMm < 0 ||
      typeof steeringPivotOffsetMm !== "number" || !Number.isFinite(steeringPivotOffsetMm)) {
    throw new Error("Mount dimensions and control arm length must be positive finite values; steering pivot offset must be finite and other offsets must be non-negative finite values.");
  }
  if (typeof strutMountHeightMm !== "number" || !Number.isFinite(strutMountHeightMm) || strutMountHeightMm <= 0 ||
      typeof strutMountOffsetMm !== "number" || !Number.isFinite(strutMountOffsetMm) ||
      typeof strutMountLocationMm !== "number" || !Number.isFinite(strutMountLocationMm)) {
    throw new Error("Strut mount height must be positive; strut mount offset and location must be finite values.");
  }
  if (typeof strutMountAngleDeg !== "number" || !Number.isFinite(strutMountAngleDeg) ||
      typeof strutMaxLengthMm !== "number" || !Number.isFinite(strutMaxLengthMm) || strutMaxLengthMm <= 0 ||
      typeof strutMinLengthMm !== "number" || !Number.isFinite(strutMinLengthMm) || strutMinLengthMm <= 0 ||
      strutMinLengthMm >= strutMaxLengthMm ||
      typeof hubHeightMm !== "number" || !Number.isFinite(hubHeightMm) || hubHeightMm <= 0 ||
      typeof hubSpacingMm !== "number" || !Number.isFinite(hubSpacingMm) || hubSpacingMm <= 0) {
    throw new Error("Strut mount angle must be finite; strut lengths and hub dimensions must be positive finite values, with minimum strut length below maximum.");
  }
  if (typeof wheelOffsetMm !== "number" || !Number.isFinite(wheelOffsetMm) ||
      typeof wheelDiameterIn !== "number" || !Number.isFinite(wheelDiameterIn) || wheelDiameterIn <= 0 ||
      typeof tireSectionWidthMm !== "number" || !Number.isFinite(tireSectionWidthMm) || tireSectionWidthMm <= 0 ||
      typeof tireAspectRatio !== "number" || !Number.isFinite(tireAspectRatio) || tireAspectRatio <= 0) {
    throw new Error("Wheel offset must be finite; wheel diameter, tire section width, and tire aspect ratio must be positive finite values.");
  }
  if (typeof springRateNPerMm !== "number" || !Number.isFinite(springRateNPerMm) || springRateNPerMm <= 0) {
    throw new Error("Spring rate must be a positive finite value.");
  }
  if (typeof mainArmInnerMountWidthMm !== "number" ||
      !Number.isFinite(mainArmInnerMountWidthMm) || mainArmInnerMountWidthMm <= 0) {
    throw new Error("Main arm inner mount width must be a positive finite value.");
  }
  return {
    id: project.id,
    name: project.name,
    frontLowerControlArmPickup: { widthMm, rearWidthMm, controlArmDepthMm, frontHeightMm, rearHeightMm },
    frontControlArm: {
      lengthMm: controlArmLengthMm,
      ballJointOffsetMm,
      leftRotationRad,
      rightRotationRad,
    },
    steeringRack: {
      widthMm: steeringRackWidthMm,
      centerlineHeightMm: steeringRackHeightMm,
      centerlineOffsetMm: steeringRackOffsetMm,
      housingWidthMm: steeringHousingWidthMm,
      steeringLimiterMm,
      rackTravelMm,
      tieRodLengthMm,
    },
    frontTopMount: {
      heightMm: topMountHeightMm,
      widthMm: topMountWidthMm,
      offsetMm: topMountOffsetMm,
    },
    wheelKnuckle: {
      steeringPivotHeightMm,
      steeringPivotDepthMm,
      steeringPivotOffsetMm,
      strutMountHeightMm,
      strutMountOffsetMm,
      strutMountLocationMm,
      strutMountAngleDeg: Math.abs(strutMountAngleDeg),
      strutMaxLengthMm,
      strutMinLengthMm,
      hubHeightMm,
      hubSpacingMm,
    },
    wheelTire: {
      wheelOffsetMm,
      wheelDiameterIn,
      tireSectionWidthMm,
      tireAspectRatio,
    },
    suspension: { springRateNPerMm },
    rearSuspension: { mainArmInnerMountWidthMm },
  };
}
