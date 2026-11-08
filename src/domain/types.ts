export type Vec3 = [number, number, number];

export interface SuspensionProject {
  id: string;
  name: string;
  frontLowerControlArmPickup: {
    widthMm: number;
    rearWidthMm: number;
    controlArmDepthMm: number;
    frontHeightMm: number;
    rearHeightMm: number;
  };
  frontControlArm: {
    lengthMm: number;
    ballJointOffsetMm: number;
    leftRotationRad: number;
    rightRotationRad: number;
  };
  steeringRack: {
    widthMm: number;
    centerlineHeightMm: number;
    centerlineOffsetMm: number;
    housingWidthMm: number;
    steeringLimiterMm: number;
    rackTravelMm: number;
    tieRodLengthMm: number;
  };
  frontTopMount: {
    heightMm: number;
    widthMm: number;
    offsetMm: number;
  };
  wheelKnuckle: {
    steeringPivotHeightMm: number;
    steeringPivotDepthMm: number;
    steeringPivotOffsetMm: number;
    strutMountHeightMm: number;
    strutMountOffsetMm: number;
    strutMountLocationMm: number;
    strutMountAngleDeg: number;
    strutMaxLengthMm: number;
    strutMinLengthMm: number;
    strutStaticLengthMm: number;
    hubHeightMm: number;
    hubSpacingMm: number;
  };
  wheelTire: {
    wheelOffsetMm: number;
    wheelDiameterIn: number;
    tireSectionWidthMm: number;
    tireAspectRatio: number;
  };
  suspension: {
    springRateNPerMm: number;
  };
  rearSuspension: {
    mainArmInnerMountWidthMm: number;
    mainArmInnerMountHeightMm: number;
    frontToRearLengthMm: number;
    toeArmInnerMountWidthMm: number;
    toeArmInnerMountHeightMm: number;
    toeArmMainArmWidthMm: number;
    mainArmLengthMm: number;
    toeArmLengthMm: number;
  };
}
