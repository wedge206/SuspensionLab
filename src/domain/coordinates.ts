import type { Vec3 } from "./types";

export const FRONT_PICKUP_STATION_MM = 650;

export interface ControlArmPickupPoints {
  front: [Vec3, Vec3];
  rear: [Vec3, Vec3];
  ballJoint: [Vec3, Vec3];
}

export interface HubOrientation {
  axis: Vec3;
  angleRad: number;
  rollAxis: Vec3;
  rollAngleRad: number;
}

export function controlArmPickupPoints(
  frontWidthMm: number,
  rearWidthMm: number,
  frontHeightMm: number,
  rearHeightMm: number,
  controlArmDepthMm: number,
  controlArmLengthMm: number,
  ballJointOffsetMm: number,
  leftRotationRad = 0,
  rightRotationRad = 0,
): ControlArmPickupPoints {
  const front: [Vec3, Vec3] = [
    [FRONT_PICKUP_STATION_MM, frontWidthMm, frontHeightMm],
    [FRONT_PICKUP_STATION_MM, -frontWidthMm, frontHeightMm],
  ];
  const rear: [Vec3, Vec3] = [
    [FRONT_PICKUP_STATION_MM - controlArmDepthMm, rearWidthMm, rearHeightMm],
    [FRONT_PICKUP_STATION_MM - controlArmDepthMm, -rearWidthMm, rearHeightMm],
  ];
  const ballJoints: [Vec3, Vec3] = [
    [FRONT_PICKUP_STATION_MM - ballJointOffsetMm, frontWidthMm + controlArmLengthMm, frontHeightMm],
    [FRONT_PICKUP_STATION_MM - ballJointOffsetMm, -frontWidthMm - controlArmLengthMm, frontHeightMm],
  ];
  return {
    front,
    rear,
    ballJoint: [
      rotatePointAroundAxis(ballJoints[0], front[0], rear[0], leftRotationRad),
      rotatePointAroundAxis(ballJoints[1], front[1], rear[1], rightRotationRad),
    ],
  };
}

export function rotatePointAroundAxis(point: Vec3, axisStart: Vec3, axisEnd: Vec3, angle: number): Vec3 {
  const axis = normalize([
    axisEnd[0] - axisStart[0],
    axisEnd[1] - axisStart[1],
    axisEnd[2] - axisStart[2],
  ]);
  const vector = [
    point[0] - axisStart[0],
    point[1] - axisStart[1],
    point[2] - axisStart[2],
  ];
  const cross = [
    axis[1] * vector[2] - axis[2] * vector[1],
    axis[2] * vector[0] - axis[0] * vector[2],
    axis[0] * vector[1] - axis[1] * vector[0],
  ];
  const dot = axis[0] * vector[0] + axis[1] * vector[1] + axis[2] * vector[2];
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [
    axisStart[0] + vector[0] * cosine + cross[0] * sine + axis[0] * dot * (1 - cosine),
    axisStart[1] + vector[1] * cosine + cross[1] * sine + axis[1] * dot * (1 - cosine),
    axisStart[2] + vector[2] * cosine + cross[2] * sine + axis[2] * dot * (1 - cosine),
  ];
}

function rotateVector(vector: Vec3, axis: Vec3, angle: number): Vec3 {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const cross = [
    axis[1] * vector[2] - axis[2] * vector[1],
    axis[2] * vector[0] - axis[0] * vector[2],
    axis[0] * vector[1] - axis[1] * vector[0],
  ];
  const dot = axis[0] * vector[0] + axis[1] * vector[1] + axis[2] * vector[2];
  return [
    vector[0] * cosine + cross[0] * sine + axis[0] * dot * (1 - cosine),
    vector[1] * cosine + cross[1] * sine + axis[1] * dot * (1 - cosine),
    vector[2] * cosine + cross[2] * sine + axis[2] * dot * (1 - cosine),
  ];
}

export function orientHubPoint(point: Vec3, ballJoint: Vec3, orientation: HubOrientation): Vec3 {
  const vector: Vec3 = [
    point[0] - ballJoint[0],
    point[1] - ballJoint[1],
    point[2] - ballJoint[2],
  ];
  const aligned = rotateVector(vector, orientation.axis, orientation.angleRad);
  const rolled = rotateVector(aligned, orientation.rollAxis, orientation.rollAngleRad);
  return [
    ballJoint[0] + rolled[0],
    ballJoint[1] + rolled[1],
    ballJoint[2] + rolled[2],
  ];
}

function normalize(vector: [number, number, number]): [number, number, number] {
  const length = Math.hypot(...vector);
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

export function steeringRackPivotPoints(
  widthMm: number,
  centerlineHeightMm: number,
  centerlineOffsetMm: number,
  rackTravelMm = 0,
): [Vec3, Vec3] {
  const x = FRONT_PICKUP_STATION_MM - centerlineOffsetMm;
  const halfWidth = widthMm / 2;
  return [
    [x, halfWidth + rackTravelMm, centerlineHeightMm],
    [x, -halfWidth + rackTravelMm, centerlineHeightMm],
  ];
}

export function steeringRackTravelLimitMm(
  rackWidthMm: number,
  housingWidthMm: number,
  steeringLimiterMm: number,
): number {
  return Math.max(0, (rackWidthMm - housingWidthMm) / 2 - steeringLimiterMm);
}

export function tieRodConstrainedKnucklePoints(
  ballJoints: [Vec3, Vec3],
  rackPivots: [Vec3, Vec3],
  topMounts: [Vec3, Vec3],
  steeringPivotHeightMm: number,
  steeringPivotDepthMm: number,
  steeringPivotOffsetMm: number,
  strutMountHeightMm: number,
  strutMountOffsetMm: number,
  strutMountLocationMm: number,
  strutMountAngleDeg: number,
  tieRodLengthMm: number,
  strutMinLengthMm: number,
  strutMaxLengthMm: number,
): {
  steeringPivots: [Vec3, Vec3];
  strutMounts: [Vec3, Vec3];
  orientations: [HubOrientation, HubOrientation];
  strutLengths: [number, number];
} {
  const neutralSteeringPivots = steeringKnucklePivotPoints(
    ballJoints,
    steeringPivotHeightMm,
    steeringPivotDepthMm,
    steeringPivotOffsetMm,
  );
  const neutralStrutMounts = strutMountPoints(
    ballJoints,
    strutMountHeightMm,
    strutMountOffsetMm,
    strutMountLocationMm,
  );

  const rotateAboutSteeringAxis = (index: 0 | 1): {
    steeringPivot: Vec3;
    strutMount: Vec3;
    orientation: HubOrientation;
    strutLength: number;
  } => {
    const ballJoint = ballJoints[index];
    const steeringPivot = neutralSteeringPivots[index];
    const rackPivot = rackPivots[index];
    const targetVector: [number, number, number] = [
      topMounts[index][0] - ballJoint[0],
      topMounts[index][1] - ballJoint[1],
      topMounts[index][2] - ballJoint[2],
    ];
    const topMountDistance = Math.hypot(...targetVector);
    if (topMountDistance < 1e-9) {
      throw new Error("Tie Rod Length cannot be satisfied at the current ball joint position.");
    }
    const topDirection = normalize(targetVector);
    const neutralStrutMount = neutralStrutMounts[index];
    const mountOffset: Vec3 = [
      neutralStrutMount[0] - ballJoint[0],
      neutralStrutMount[1] - ballJoint[1],
      neutralStrutMount[2] - ballJoint[2],
    ];
    const side: 1 | -1 = index === 0 ? 1 : -1;
    const angleRad = strutMountAngleDeg * Math.PI / 180;
    const strutDirection: Vec3 = [0, side * Math.sin(angleRad), Math.cos(angleRad)];
    const mountProjection =
      mountOffset[0] * strutDirection[0] +
      mountOffset[1] * strutDirection[1] +
      mountOffset[2] * strutDirection[2];
    const discriminant = mountProjection ** 2 + topMountDistance ** 2 -
      mountOffset[0] ** 2 - mountOffset[1] ** 2 - mountOffset[2] ** 2;
    if (discriminant < -1e-7) {
      throw new Error("Strut angle cannot reach the fixed top mount.");
    }
    const root = Math.sqrt(Math.max(0, discriminant));
    const candidates = [-mountProjection + root, -mountProjection - root]
      .filter((length) => length > 0);
    if (!candidates.length) {
      throw new Error("Strut angle cannot reach the fixed top mount.");
    }
    const distanceToTravel = (length: number): number =>
      Math.max(strutMinLengthMm - length, 0, length - strutMaxLengthMm);
    const strutLength = candidates.sort((a, b) =>
      distanceToTravel(a) - distanceToTravel(b))[0];
    const localStrutEndpoint: Vec3 = [
      mountOffset[0] + strutDirection[0] * strutLength,
      mountOffset[1] + strutDirection[1] * strutLength,
      mountOffset[2] + strutDirection[2] * strutLength,
    ];
    const from = normalize(localStrutEndpoint);
    const to = topDirection;
    const rotationAxis: Vec3 = [
      from[1] * to[2] - from[2] * to[1],
      from[2] * to[0] - from[0] * to[2],
      from[0] * to[1] - from[1] * to[0],
    ];
    const axisMagnitude = Math.hypot(...rotationAxis);
    const alignment = Math.max(-1, Math.min(1,
      from[0] * to[0] + from[1] * to[1] + from[2] * to[2]));
    const baseAxis: Vec3 = axisMagnitude > 1e-9
      ? normalize(rotationAxis)
      : Math.abs(from[2]) < 0.9
        ? normalize([from[1], -from[0], 0])
        : normalize([0, from[2], -from[1]]);
    const baseAngle = axisMagnitude > 1e-9
      ? Math.atan2(axisMagnitude, alignment)
      : alignment < 0 ? Math.PI : 0;
    const baseOrientation: HubOrientation = {
      axis: baseAxis,
      angleRad: baseAngle,
      rollAxis: to,
      rollAngleRad: 0,
    };
    const baseSteering = orientHubPoint(steeringPivot, ballJoint, baseOrientation);
    const steeringOffset: Vec3 = [
      baseSteering[0] - ballJoint[0],
      baseSteering[1] - ballJoint[1],
      baseSteering[2] - ballJoint[2],
    ];
    const rackOffset: Vec3 = [
      rackPivot[0] - ballJoint[0],
      rackPivot[1] - ballJoint[1],
      rackPivot[2] - ballJoint[2],
    ];
    const projection = (vector: Vec3): number =>
      vector[0] * to[0] + vector[1] * to[1] + vector[2] * to[2];
    const steeringAxial = projection(steeringOffset);
    const rackAxial = projection(rackOffset);
    const steeringRadial: Vec3 = [
      steeringOffset[0] - to[0] * steeringAxial,
      steeringOffset[1] - to[1] * steeringAxial,
      steeringOffset[2] - to[2] * steeringAxial,
    ];
    const rackRadial: Vec3 = [
      rackOffset[0] - to[0] * rackAxial,
      rackOffset[1] - to[1] * rackAxial,
      rackOffset[2] - to[2] * rackAxial,
    ];
    const cross: Vec3 = [
      to[1] * steeringRadial[2] - to[2] * steeringRadial[1],
      to[2] * steeringRadial[0] - to[0] * steeringRadial[2],
      to[0] * steeringRadial[1] - to[1] * steeringRadial[0],
    ];
    const constant = (
      (rackAxial - steeringAxial) ** 2 +
      rackRadial[0] ** 2 + rackRadial[1] ** 2 + rackRadial[2] ** 2 +
      steeringRadial[0] ** 2 + steeringRadial[1] ** 2 + steeringRadial[2] ** 2 -
      tieRodLengthMm ** 2
    ) / 2;
    const cosineCoefficient =
      rackRadial[0] * steeringRadial[0] +
      rackRadial[1] * steeringRadial[1] +
      rackRadial[2] * steeringRadial[2];
    const sineCoefficient =
      rackRadial[0] * cross[0] +
      rackRadial[1] * cross[1] +
      rackRadial[2] * cross[2];
    const amplitude = Math.hypot(cosineCoefficient, sineCoefficient);
    if (Math.abs(constant) > amplitude + 1e-7) {
      throw new Error("Tie Rod Length cannot be satisfied at the current ball joint position.");
    }

    let rollAngleRad = 0;
    if (amplitude >= 1e-9) {
      const phase = Math.atan2(sineCoefficient, cosineCoefficient);
      const offset = Math.acos(Math.max(-1, Math.min(1, constant / amplitude)));
      const candidateAngles = [phase + offset, phase - offset];
      rollAngleRad = candidateAngles
        .map((candidate) => Math.atan2(Math.sin(candidate), Math.cos(candidate)))
        .sort((a, b) => Math.abs(a) - Math.abs(b))[0];
    }
    const orientation: HubOrientation = { ...baseOrientation, rollAngleRad };
    return {
      steeringPivot: orientHubPoint(steeringPivot, ballJoint, orientation),
      strutMount: orientHubPoint(neutralStrutMount, ballJoint, orientation),
      orientation,
      strutLength,
    };
  };

  const left = rotateAboutSteeringAxis(0);
  const right = rotateAboutSteeringAxis(1);
  return {
    steeringPivots: [left.steeringPivot, right.steeringPivot],
    strutMounts: [left.strutMount, right.strutMount],
    orientations: [left.orientation, right.orientation],
    strutLengths: [left.strutLength, right.strutLength],
  };
}

export function frontTopMountPoints(
  widthMm: number,
  heightMm: number,
  offsetMm: number,
): [Vec3, Vec3] {
  const x = FRONT_PICKUP_STATION_MM - offsetMm;
  const halfWidth = widthMm / 2;
  return [
    [x, halfWidth, heightMm],
    [x, -halfWidth, heightMm],
  ];
}

export function strutLengthsMm(
  strutMounts: [Vec3, Vec3],
  topMounts: [Vec3, Vec3],
): [number, number] {
  const distance = (point: Vec3, topMount: Vec3): number => Math.hypot(
    point[0] - topMount[0],
    point[1] - topMount[1],
    point[2] - topMount[2],
  );
  return [distance(strutMounts[0], topMounts[0]), distance(strutMounts[1], topMounts[1])];
}

export function strutMountAngleSegments(
  strutMounts: [Vec3, Vec3],
  angleDeg: number,
  markerLengthMm = 80,
  knuckleRotationRad: [number, number] = [0, 0],
): [Vec3, Vec3, Vec3, Vec3] {
  const halfLength = markerLengthMm / 2;
  const angleRad = angleDeg * Math.PI / 180;
  const segment = (mount: Vec3, rotationRad: number): [Vec3, Vec3] => {
    const localY = Math.sin(angleRad) * halfLength;
    const localZ = Math.cos(angleRad) * halfLength;
    const deltaY = localY * Math.cos(rotationRad) - localZ * Math.sin(rotationRad);
    const deltaZ = localY * Math.sin(rotationRad) + localZ * Math.cos(rotationRad);
    return [
      [mount[0], mount[1] - deltaY, mount[2] - deltaZ],
      [mount[0], mount[1] + deltaY, mount[2] + deltaZ],
    ];
  };
  const left = segment(strutMounts[0], knuckleRotationRad[0]);
  const right = segment(strutMounts[1], knuckleRotationRad[1]);
  return [left[0], left[1], right[0], right[1]];
}

export function steeringKnucklePivotPoints(
  ballJoints: [Vec3, Vec3],
  heightMm: number,
  depthMm: number,
  offsetMm: number,
): [Vec3, Vec3] {
  const makePivot = (ballJoint: Vec3, side: 1 | -1): Vec3 => [
    ballJoint[0] - depthMm,
    ballJoint[1] + side * offsetMm,
    ballJoint[2] + heightMm,
  ];
  return [makePivot(ballJoints[0], 1), makePivot(ballJoints[1], -1)];
}

export function strutMountPoints(
  ballJoints: [Vec3, Vec3],
  heightMm: number,
  offsetMm: number,
  locationMm: number,
): [Vec3, Vec3] {
  const makeMount = (ballJoint: Vec3, side: 1 | -1): Vec3 => [
    ballJoint[0] - offsetMm,
    ballJoint[1] + side * locationMm,
    ballJoint[2] + heightMm,
  ];
  return [makeMount(ballJoints[0], 1), makeMount(ballJoints[1], -1)];
}

export function hubFacePoints(
  ballJoints: [Vec3, Vec3],
  steeringPivots: [Vec3, Vec3],
  strutMounts: [Vec3, Vec3],
  steeringPivotOffsetMm: number,
  strutMountLocationMm: number,
): [[Vec3, Vec3, Vec3], [Vec3, Vec3, Vec3]] {
  const makeFace = (index: 0 | 1): [Vec3, Vec3, Vec3] => {
    const side: 1 | -1 = index === 0 ? 1 : -1;
    const extendOutward = (point: Vec3, distanceMm: number): Vec3 => [
      point[0],
      point[1] + side * Math.abs(distanceMm),
      point[2],
    ];
    return [
      extendOutward(steeringPivots[index], steeringPivotOffsetMm),
      extendOutward(strutMounts[index], strutMountLocationMm),
      ballJoints[index],
    ];
  };
  return [makeFace(0), makeFace(1)];
}

export function steeredHubFacePoints(
  ballJoints: [Vec3, Vec3],
  neutralSteeringPivots: [Vec3, Vec3],
  neutralStrutMounts: [Vec3, Vec3],
  steeringPivotOffsetMm: number,
  strutMountLocationMm: number,
  orientations: [HubOrientation, HubOrientation],
): [[Vec3, Vec3, Vec3], [Vec3, Vec3, Vec3]] {
  const neutralFaces = hubFacePoints(
    ballJoints,
    neutralSteeringPivots,
    neutralStrutMounts,
    steeringPivotOffsetMm,
    strutMountLocationMm,
  );
  return neutralFaces.map((face, index) => face.map((point) =>
    orientHubPoint(point, ballJoints[index], orientations[index])
  ) as [Vec3, Vec3, Vec3]) as [[Vec3, Vec3, Vec3], [Vec3, Vec3, Vec3]];
}

export function trueHubFaceGeometry(
  face: [Vec3, Vec3, Vec3],
  hubHeightMm: number,
  hubSpacingMm: number,
  diameterMm = 100,
  segments = 48,
): { heightPoint: Vec3; center: Vec3; normal: Vec3; circle: Vec3[] } {
  const [steeringCorner, strutCorner, ballJoint] = face;
  const strutRay: Vec3 = [
    strutCorner[0] - ballJoint[0],
    strutCorner[1] - ballJoint[1],
    strutCorner[2] - ballJoint[2],
  ];
  const strutRayLength = Math.hypot(...strutRay);
  if (strutRayLength < 1e-9) {
    throw new Error("Hub face cannot be calculated from coincident points.");
  }
  const heightPoint: Vec3 = [
    ballJoint[0] + strutRay[0] / strutRayLength * hubHeightMm,
    ballJoint[1] + strutRay[1] / strutRayLength * hubHeightMm,
    ballJoint[2] + strutRay[2] / strutRayLength * hubHeightMm,
  ];
  const firstEdge: Vec3 = [
    steeringCorner[0] - ballJoint[0],
    steeringCorner[1] - ballJoint[1],
    steeringCorner[2] - ballJoint[2],
  ];
  const rawNormal: Vec3 = [
    firstEdge[1] * strutRay[2] - firstEdge[2] * strutRay[1],
    firstEdge[2] * strutRay[0] - firstEdge[0] * strutRay[2],
    firstEdge[0] * strutRay[1] - firstEdge[1] * strutRay[0],
  ];
  const normalLength = Math.hypot(...rawNormal);
  if (normalLength < 1e-9) {
    throw new Error("Hub face cannot be calculated from collinear points.");
  }
  let normal: Vec3 = rawNormal.map((value) => value / normalLength) as Vec3;
  const outwardSign = ballJoint[1] < 0 ? -1 : 1;
  if (normal[1] * outwardSign < 0) {
    normal = normal.map((value) => -value) as Vec3;
  }
  const center: Vec3 = [
    heightPoint[0] + normal[0] * hubSpacingMm,
    heightPoint[1] + normal[1] * hubSpacingMm,
    heightPoint[2] + normal[2] * hubSpacingMm,
  ];
  const tangentLength = Math.hypot(...firstEdge);
  const tangent: Vec3 = firstEdge.map((value) => value / tangentLength) as Vec3;
  const bitangent: Vec3 = [
    normal[1] * tangent[2] - normal[2] * tangent[1],
    normal[2] * tangent[0] - normal[0] * tangent[2],
    normal[0] * tangent[1] - normal[1] * tangent[0],
  ];
  const radius = diameterMm / 2;
  const circle = Array.from({ length: segments }, (_, index): Vec3 => {
    const angle = 2 * Math.PI * index / segments;
    return [
      center[0] + radius * (tangent[0] * Math.cos(angle) + bitangent[0] * Math.sin(angle)),
      center[1] + radius * (tangent[1] * Math.cos(angle) + bitangent[1] * Math.sin(angle)),
      center[2] + radius * (tangent[2] * Math.cos(angle) + bitangent[2] * Math.sin(angle)),
    ];
  });
  return { heightPoint, center, normal, circle };
}

export function tireOverallDiameterMm(
  wheelDiameterIn: number,
  tireSectionWidthMm: number,
  tireAspectRatio: number,
): number {
  return wheelDiameterIn * 25.4 + 2 * tireSectionWidthMm * tireAspectRatio / 100;
}

export function tireTreadCenter(
  hubFaceCenter: Vec3,
  hubFaceNormal: Vec3,
  wheelOffsetMm: number,
): Vec3 {
  return [
    hubFaceCenter[0] + hubFaceNormal[0] * wheelOffsetMm,
    hubFaceCenter[1] + hubFaceNormal[1] * wheelOffsetMm,
    hubFaceCenter[2] + hubFaceNormal[2] * wheelOffsetMm,
  ];
}

export interface WheelAlignmentMeasurements {
  toeMm: [number, number] | null;
  totalToeMm: number | null;
  camberDeg: [number, number];
  casterDeg: [number, number];
  scrubRadiusMm: [number | null, number | null];
}

export function wheelAlignmentMeasurements(
  wheelFaceNormals: [Vec3, Vec3],
  ballJoints: [Vec3, Vec3],
  topMounts: [Vec3, Vec3],
  tireDiameterMm: number,
  tireCenters: [Vec3, Vec3] | null = null,
): WheelAlignmentMeasurements {
  const toeMm = wheelFaceNormals.map((normal) =>
    normal[0] / Math.abs(normal[1]) * tireDiameterMm
  ) as [number, number];
  const camberDeg = wheelFaceNormals.map((normal) =>
    Math.asin(Math.max(-1, Math.min(1, -normal[2]))) * 180 / Math.PI
  ) as [number, number];
  const casterDeg = ballJoints.map((ballJoint, index) =>
    Math.atan2(
      ballJoint[0] - topMounts[index][0],
      topMounts[index][2] - ballJoint[2],
    ) * 180 / Math.PI
  ) as [number, number];
  const scrubRadiusMm = tireCenters
    ? ballJoints.map((ballJoint, index) => {
      const verticalAxisSpan = topMounts[index][2] - ballJoint[2];
      if (Math.abs(verticalAxisSpan) < 1e-9) return null;
      const groundIntersectionRatio = -ballJoint[2] / verticalAxisSpan;
      const steeringAxisGroundY = ballJoint[1] +
        (topMounts[index][1] - ballJoint[1]) * groundIntersectionRatio;
      const outwardSign = index === 0 ? 1 : -1;
      return (tireCenters[index][1] - steeringAxisGroundY) * outwardSign;
    }) as [number | null, number | null]
    : [null, null];
  return {
    toeMm,
    totalToeMm: toeMm ? toeMm[0] + toeMm[1] : null,
    camberDeg,
    casterDeg,
    scrubRadiusMm,
  };
}
