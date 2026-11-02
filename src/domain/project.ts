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
export const DEFAULT_TIE_ROD_LENGTH_MM = 341;
export const DEFAULT_STRUT_MOUNT_ANGLE_DEG = 15;
export const DEFAULT_STRUT_MAX_LENGTH_MM = 650;
export const DEFAULT_STRUT_MIN_LENGTH_MM = 450;
export const DEFAULT_TOP_MOUNT_HEIGHT_MM = 900;
export const DEFAULT_TOP_MOUNT_WIDTH_MM = 950;
export const DEFAULT_TOP_MOUNT_OFFSET_MM = 10;
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

export function validateProject(value: unknown): SuspensionProject {
  if (!value || typeof value !== "object") {
    throw new Error("Project file must contain a JSON object.");
  }
  const project = value as Record<string, unknown>;
  if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].includes(project.schemaVersion as number)) {
    throw new Error(`Unsupported project schema version: ${String(project.schemaVersion)}.`);
  }
  if (typeof project.id !== "string" || typeof project.name !== "string" ||
      !project.id.trim() || !project.name.trim()) {
    throw new Error("Project needs a non-empty id and name.");
  }
  const schemaVersion = project.schemaVersion as number;
  const isLegacy = schemaVersion < 4;
  const pickup = project.frontLowerControlArmPickup;
  if (!isLegacy && (!pickup || typeof pickup !== "object")) {
    throw new Error("Project is missing front lower control arm pickup dimensions.");
  }
  const pickupDimensions = pickup && typeof pickup === "object"
    ? pickup as Record<string, unknown>
    : {};
  const widthMm: unknown = isLegacy ? DEFAULT_PICKUP_WIDTH_MM : pickupDimensions.widthMm;
  const rearWidthMm: unknown = schemaVersion >= 5
    ? pickupDimensions.rearWidthMm
    : DEFAULT_REAR_PICKUP_WIDTH_MM;
  const controlArmDepthMm: unknown = schemaVersion >= 6
    ? pickupDimensions.controlArmDepthMm
    : DEFAULT_CONTROL_ARM_DEPTH_MM;
  const frontHeightMm: unknown = isLegacy
    ? DEFAULT_FRONT_PICKUP_HEIGHT_MM
    : schemaVersion >= 7
      ? pickupDimensions.frontHeightMm
      : pickupDimensions.heightMm;
  const rearHeightMm: unknown = isLegacy
    ? DEFAULT_REAR_PICKUP_HEIGHT_MM
    : schemaVersion >= 7
      ? pickupDimensions.rearHeightMm
      : pickupDimensions.heightMm;
  const controlArm = project.frontControlArm && typeof project.frontControlArm === "object"
    ? project.frontControlArm as Record<string, unknown>
    : {};
  const controlArmLengthMm: unknown = schemaVersion >= 8
    ? controlArm.lengthMm
    : DEFAULT_CONTROL_ARM_LENGTH_MM;
  const ballJointOffsetMm: unknown = schemaVersion >= 8
    ? controlArm.ballJointOffsetMm
    : DEFAULT_BALL_JOINT_OFFSET_MM;
  const leftRotationRad: unknown = schemaVersion >= 11
    ? controlArm.leftRotationRad
    : DEFAULT_CONTROL_ARM_ROTATION_RAD;
  const rightRotationRad: unknown = schemaVersion >= 11
    ? controlArm.rightRotationRad
    : DEFAULT_CONTROL_ARM_ROTATION_RAD;
  const steeringRack = project.steeringRack && typeof project.steeringRack === "object"
    ? project.steeringRack as Record<string, unknown>
    : {};
  const steeringRackWidthMm: unknown = schemaVersion >= 9
    ? steeringRack.widthMm
    : DEFAULT_STEERING_RACK_WIDTH_MM;
  const steeringRackHeightMm: unknown = schemaVersion >= 9
    ? steeringRack.centerlineHeightMm
    : DEFAULT_STEERING_RACK_HEIGHT_MM;
  const steeringRackOffsetMm: unknown = schemaVersion >= 9
    ? steeringRack.centerlineOffsetMm
    : DEFAULT_STEERING_RACK_OFFSET_MM;
  const steeringHousingWidthMm: unknown = schemaVersion >= 18
    ? steeringRack.housingWidthMm
    : DEFAULT_STEERING_HOUSING_WIDTH_MM;
  const steeringLimiterMm: unknown = schemaVersion >= 19
    ? steeringRack.steeringLimiterMm
    : DEFAULT_STEERING_LIMITER_MM;
  const rackTravelMm: unknown = schemaVersion >= 19
    ? steeringRack.rackTravelMm
    : DEFAULT_STEERING_RACK_TRAVEL_MM;
  const tieRodLengthMm: unknown = schemaVersion >= 16
    ? steeringRack.tieRodLengthMm
    : DEFAULT_TIE_ROD_LENGTH_MM;
  const topMount = project.frontTopMount && typeof project.frontTopMount === "object"
    ? project.frontTopMount as Record<string, unknown>
    : {};
  const topMountHeightMm: unknown = schemaVersion >= 10
    ? topMount.heightMm
    : DEFAULT_TOP_MOUNT_HEIGHT_MM;
  const topMountWidthMm: unknown = schemaVersion >= 10
    ? topMount.widthMm
    : DEFAULT_TOP_MOUNT_WIDTH_MM;
  const topMountOffsetMm: unknown = schemaVersion >= 10
    ? topMount.offsetMm
    : DEFAULT_TOP_MOUNT_OFFSET_MM;
  const wheelKnuckle = project.wheelKnuckle && typeof project.wheelKnuckle === "object"
    ? project.wheelKnuckle as Record<string, unknown>
    : {};
  const steeringPivotHeightMm: unknown = schemaVersion >= 12
    ? wheelKnuckle.steeringPivotHeightMm
    : DEFAULT_STEERING_PIVOT_HEIGHT_MM;
  const steeringPivotDepthMm: unknown = schemaVersion >= 12
    ? wheelKnuckle.steeringPivotDepthMm
    : DEFAULT_STEERING_PIVOT_DEPTH_MM;
  const savedSteeringPivotOffsetMm: unknown = schemaVersion >= 12
    ? wheelKnuckle.steeringPivotOffsetMm
    : DEFAULT_STEERING_PIVOT_OFFSET_MM;
  const steeringPivotOffsetMm: unknown =
    schemaVersion >= 12 && schemaVersion < 15 && savedSteeringPivotOffsetMm === 24
      ? DEFAULT_STEERING_PIVOT_OFFSET_MM
      : savedSteeringPivotOffsetMm;
  const strutMountHeightMm: unknown = schemaVersion >= 13
    ? wheelKnuckle.strutMountHeightMm
    : DEFAULT_STRUT_MOUNT_HEIGHT_MM;
  const savedStrutMountOffsetMm: unknown = schemaVersion >= 13
    ? wheelKnuckle.strutMountOffsetMm
    : DEFAULT_STRUT_MOUNT_OFFSET_MM;
  const savedStrutMountLocationMm: unknown = schemaVersion >= 13
    ? wheelKnuckle.strutMountLocationMm
    : DEFAULT_STRUT_MOUNT_LOCATION_MM;
  const strutMountOffsetMm: unknown = schemaVersion === 13 && savedStrutMountOffsetMm === 10
    ? DEFAULT_STRUT_MOUNT_OFFSET_MM
    : savedStrutMountOffsetMm;
  const strutMountLocationMm: unknown = schemaVersion === 13 && savedStrutMountLocationMm === 89
    ? DEFAULT_STRUT_MOUNT_LOCATION_MM
    : savedStrutMountLocationMm;
  const strutMountAngleDeg: unknown = schemaVersion >= 17
    ? wheelKnuckle.strutMountAngleDeg
    : DEFAULT_STRUT_MOUNT_ANGLE_DEG;
  const strutMaxLengthMm: unknown = schemaVersion >= 17
    ? wheelKnuckle.strutMaxLengthMm
    : DEFAULT_STRUT_MAX_LENGTH_MM;
  const strutMinLengthMm: unknown = schemaVersion >= 17
    ? wheelKnuckle.strutMinLengthMm
    : DEFAULT_STRUT_MIN_LENGTH_MM;
  const hubHeightMm: unknown = schemaVersion >= 20
    ? wheelKnuckle.hubHeightMm
    : DEFAULT_HUB_HEIGHT_MM;
  const hubSpacingMm: unknown = schemaVersion >= 20
    ? wheelKnuckle.hubSpacingMm
    : DEFAULT_HUB_SPACING_MM;
  const wheelTire = project.wheelTire && typeof project.wheelTire === "object"
    ? project.wheelTire as Record<string, unknown>
    : {};
  const wheelOffsetMm: unknown = schemaVersion >= 21
    ? wheelTire.wheelOffsetMm
    : DEFAULT_WHEEL_OFFSET_MM;
  const wheelDiameterIn: unknown = schemaVersion >= 21
    ? wheelTire.wheelDiameterIn
    : DEFAULT_WHEEL_DIAMETER_IN;
  const tireSectionWidthMm: unknown = schemaVersion >= 21
    ? wheelTire.tireSectionWidthMm
    : DEFAULT_TIRE_SECTION_WIDTH_MM;
  const tireAspectRatio: unknown = schemaVersion >= 21
    ? wheelTire.tireAspectRatio
    : DEFAULT_TIRE_ASPECT_RATIO;
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
  return {
    schemaVersion: 21,
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
  };
}
