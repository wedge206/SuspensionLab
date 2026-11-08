import { describe, expect, it } from "vitest";
import {
  controlArmPickupPoints,
  frontTopMountPoints,
  type HubOrientation,
  hubFacePoints,
  orientHubPoint,
  rearMainArmInnerMountPoints,
  rearToeArmInnerMountPoints,
  steeringKnucklePivotPoints,
  steeringRackPivotPoints,
  steeringRackTravelLimitMm,
  steeredHubFacePoints,
  strutLengthsMm,
  strutMountAngleSegments,
  strutMountPoints,
  suspensionMotionRatios,
  tireOverallDiameterMm,
  tireTreadCenter,
  tieRodConstrainedKnucklePoints,
  trueHubFaceGeometry,
  wheelAlignmentMeasurements,
} from "./coordinates";
import type { SuspensionProject } from "./types";

describe("front lower control arm pickup points", () => {
  it("mirrors each pair by its own width and uses independently specified heights", () => {
    const points = controlArmPickupPoints(325, 275, 240, 210, 1300, 320, 12);
    expect(points.front).toEqual([[650, 325, 240], [650, -325, 240]]);
    expect(points.rear).toEqual([[-650, 275, 210], [-650, -275, 210]]);
    expect(points.ballJoint).toEqual([[638, 645, 240], [638, -645, 240]]);
    expect(points.front[0][1] - points.front[1][1]).toBe(650);
    expect(points.rear[0][1] - points.rear[1][1]).toBe(550);
    expect(points.front.every((point) => point[2] === 240)).toBe(true);
    expect(points.rear.every((point) => point[2] === 210)).toBe(true);
  });

  describe("rear main arm inner mount points", () => {
    it("places the default mounts rearward of the front mounts at the configured height and width", () => {
      const front = controlArmPickupPoints(465, 465, 250, 250, 302, 320, 12).front;
      const rear = rearMainArmInnerMountPoints(1600, 750, 250);
      expect(rear).toEqual([[-950, 375, 250], [-950, -375, 250]]);
      for (let side = 0; side < 2; side += 1) {
        expect(front[side][0] - rear[side][0]).toBe(1600);
      }
      expect(rear[0][1] - rear[1][1]).toBe(750);
    });

    describe("rear toe arm inner mount points", () => {
      it("places the default points forward of the main arm mounts at the configured width and height", () => {
        const rear = rearMainArmInnerMountPoints(1600, 750, 250);
        const toe = rearToeArmInnerMountPoints(rear, 850, 250, 190);
        expect(toe).toEqual([[-760, 425, 250], [-760, -425, 250]]);
        for (let side = 0; side < 2; side += 1) {
          expect(toe[side][0] - rear[side][0]).toBe(190);
        }
        expect(toe[0][1] - toe[1][1]).toBe(850);
      });

      it("follows the rear mount station and uses the toe arm dimensions independently", () => {
        const rear = rearMainArmInnerMountPoints(1720, 700, 330);
        const toe = rearToeArmInnerMountPoints(rear, 930, 285, 215);
        expect(toe).toEqual([[-855, 465, 285], [-855, -465, 285]]);
        expect(toe[0][1] - toe[1][1]).toBe(930);
        expect(toe[0][0] - rear[0][0]).toBe(215);
        expect(toe[1][0] - rear[1][0]).toBe(215);
      });
    });

    it("updates longitudinal position, spacing, and ground height independently", () => {
      const rear = rearMainArmInnerMountPoints(1720, 840, 310);
      expect(rear).toEqual([[-1070, 420, 310], [-1070, -420, 310]]);
      expect(rear[0][1] - rear[1][1]).toBe(840);
    });
  });

  it("uses control arm depth as the front-to-rear distance while keeping the front station fixed", () => {
    const points = controlArmPickupPoints(325, 275, 240, 210, 900, 320, 12);
    expect(points.front[0][0] - points.rear[0][0]).toBe(900);
    expect(points.front[1][0] - points.rear[1][0]).toBe(900);
    expect(points.front[0][0]).toBe(650);
    expect(points.rear[0][0]).toBe(-250);
  });

  it("places ball joints outward and rearward from the front mount and mirrors them", () => {
    const points = controlArmPickupPoints(465, 465, 250, 220, 302, 320, 12);
    expect(points.ballJoint).toEqual([[638, 785, 250], [638, -785, 250]]);
  });

  it("places steering rack pivots at half the specified width and rearward from the front station", () => {
    expect(steeringRackPivotPoints(850, 362, 166)).toEqual([
      [484, 425, 362],
      [484, -425, 362],
    ]);
  });

  it("translates both rack pivots together without changing their spacing", () => {
    const points = steeringRackPivotPoints(850, 362, 166, 165);
    expect(points).toEqual([
      [484, 590, 362],
      [484, -260, 362],
    ]);
    expect(points[0][1] - points[1][1]).toBe(850);
  });

  it("limits rack travel to the housing clearance less the steering limiter", () => {
    expect(steeringRackTravelLimitMm(850, 500, 10)).toBe(165);
    expect(steeringRackTravelLimitMm(850, 850, 10)).toBe(0);
  });

  it("uses a fixed tie-rod length to rotate the knuckle as the ball joint moves", () => {
    const movedArm = controlArmPickupPoints(465, 465, 250, 250, 302, 320, 12, 0.25, -0.25);
    const rackPivots = steeringRackPivotPoints(850, 362, 166);
    const topMounts = frontTopMountPoints(950, 900, 10);
    const tieRodLength = 341;
    const neutralSteeringPivots = steeringKnucklePivotPoints(movedArm.ballJoint, 125, 210, -24);
    const neutralStrutMounts = strutMountPoints(movedArm.ballJoint, 130, -10, -89);
    const knuckle = tieRodConstrainedKnucklePoints(
      movedArm.ballJoint,
      rackPivots,
      topMounts,
      125,
      210,
      -24,
      130,
      -10,
      -89,
      -10,
      tieRodLength,
      450,
      650,
    );
    const distance = (a: readonly number[], b: readonly number[]) =>
      Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    for (let side = 0; side < 2; side += 1) {
      expect(distance(knuckle.steeringPivots[side], rackPivots[side])).toBeCloseTo(tieRodLength);
      expect(distance(knuckle.strutMounts[side], movedArm.ballJoint[side]))
        .toBeCloseTo(distance(neutralStrutMounts[side], movedArm.ballJoint[side]));
      expect(distance(knuckle.steeringPivots[side], knuckle.strutMounts[side]))
        .toBeCloseTo(distance(neutralSteeringPivots[side], neutralStrutMounts[side]));
      expect(knuckle.strutLengths[side]).toBeCloseTo(distance(knuckle.strutMounts[side], topMounts[side]));
      const direction: [number, number, number] = [0, side === 0 ? -Math.sin(Math.PI / 18) : Math.sin(Math.PI / 18), Math.cos(Math.PI / 18)];
      const localPoint: [number, number, number] = [
        neutralStrutMounts[side][0] + direction[0] * 100,
        neutralStrutMounts[side][1] + direction[1] * 100,
        neutralStrutMounts[side][2] + direction[2] * 100,
      ];
      const expectedAxisPoint = orientHubPoint(localPoint, movedArm.ballJoint[side], knuckle.orientations[side]);
      const actualAxisPoint: [number, number, number] = [
        knuckle.strutMounts[side][0] + (topMounts[side][0] - knuckle.strutMounts[side][0]) / knuckle.strutLengths[side] * 100,
        knuckle.strutMounts[side][1] + (topMounts[side][1] - knuckle.strutMounts[side][1]) / knuckle.strutLengths[side] * 100,
        knuckle.strutMounts[side][2] + (topMounts[side][2] - knuckle.strutMounts[side][2]) / knuckle.strutLengths[side] * 100,
      ];
      expect(actualAxisPoint[0]).toBeCloseTo(expectedAxisPoint[0]);
      expect(actualAxisPoint[1]).toBeCloseTo(expectedAxisPoint[1]);
      expect(actualAxisPoint[2]).toBeCloseTo(expectedAxisPoint[2]);
    }
    expect(knuckle.steeringPivots[0]).not.toEqual(neutralSteeringPivots[0]);
    expect(knuckle.strutMounts[0]).not.toEqual(
      strutMountPoints(movedArm.ballJoint, 130, -10, -89)[0],
    );
  });

  it("reports the actual strut length even when it exceeds the travel limit", () => {
    const ballJoints: [[number, number, number], [number, number, number]] =
      [[638, 785, 250], [638, -785, 250]];
    const topMounts = frontTopMountPoints(950, 900, 10);
    const knuckle = tieRodConstrainedKnucklePoints(
      ballJoints,
      steeringRackPivotPoints(850, 362, 166),
      topMounts,
      125,
      210,
      -24,
      130,
      -10,
      -89,
      -10,
      341,
      450,
      500,
    );

    for (let side = 0; side < 2; side += 1) {
      expect(knuckle.strutLengths[side]).toBeGreaterThan(500);
      expect(knuckle.strutLengths[side]).toBeCloseTo(Math.hypot(
        topMounts[side][0] - knuckle.strutMounts[side][0],
        topMounts[side][1] - knuckle.strutMounts[side][1],
        topMounts[side][2] - knuckle.strutMounts[side][2],
      ));
    }
  });

  it("satisfies rack travel while retaining rigid hub dimensions", () => {
    const ballJoints: [[number, number, number], [number, number, number]] =
      [[638, 785, 250], [638, -785, 250]];
    const rackPivots = steeringRackPivotPoints(850, 362, 166, 20);
    const topMounts = frontTopMountPoints(950, 900, 10);
    const neutralSteeringPivot = steeringKnucklePivotPoints(ballJoints, 125, 210, -24)[0];
    const tieRodLength = Math.hypot(
      neutralSteeringPivot[0] - steeringRackPivotPoints(850, 362, 166)[0][0],
      neutralSteeringPivot[1] - steeringRackPivotPoints(850, 362, 166)[0][1],
      neutralSteeringPivot[2] - steeringRackPivotPoints(850, 362, 166)[0][2],
    );
    const knuckle = tieRodConstrainedKnucklePoints(
      ballJoints,
      rackPivots,
      topMounts,
      125,
      210,
      -24,
      130,
      -10,
      -89,
      10,
      tieRodLength,
      450,
      650,
    );
    const distance = (a: readonly number[], b: readonly number[]) =>
      Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

    expect(knuckle.orientations[0].angleRad).not.toBeCloseTo(0);
    expect(distance(knuckle.strutMounts[0], ballJoints[0]))
      .toBeCloseTo(distance(
        strutMountPoints(ballJoints, 130, -10, -89)[0],
        ballJoints[0],
      ));
    expect(distance(knuckle.steeringPivots[0], rackPivots[0])).toBeCloseTo(tieRodLength);
  });

  it("rejects a tie-rod length that cannot be reached by knuckle rotation", () => {
    expect(() => tieRodConstrainedKnucklePoints(
      [[0, 100, 100], [0, -100, 100]],
      [[0, 0, 100], [0, 0, 100]],
      [[0, 100, 600], [0, -100, 600]],
      125,
      210,
      -24,
      130,
      -10,
      -89,
      10,
      10000,
      450,
      650,
    )).toThrow("Tie Rod Length cannot be satisfied");
  });

  it("rejects a strut angle that cannot reach the fixed top mount", () => {
    expect(() => tieRodConstrainedKnucklePoints(
      [[0, 100, 100], [0, -100, 100]],
      [[0, 0, 100], [0, 0, 100]],
      [[0, 100, 110], [0, -100, 110]],
      125,
      210,
      -24,
      130,
      -10,
      -89,
      10,
      341,
      450,
      650,
    )).toThrow("Strut angle cannot reach the fixed top mount");
  });

  it("places top mount points using total width, height, and rearward offset", () => {
    expect(frontTopMountPoints(950, 900, 10)).toEqual([
      [640, 475, 900],
      [640, -475, 900],
    ]);
  });

  it("measures each strut between its moving mount and fixed top mount", () => {
    expect(strutLengthsMm(
      [[10, 20, 30], [10, -20, 30]],
      [[10, 20, 530], [10, -20, 430]],
    )).toEqual([500, 400]);
  });

  it("shows the configured strut mount orientation from vertical in front view", () => {
    const segments = strutMountAngleSegments([[1, 2, 3], [4, -5, 6]], 10, 100);
    expect(segments[0][0]).toBe(1);
    expect(segments[1][0]).toBe(1);
    expect(segments[0][2]).toBeCloseTo(3 - Math.cos(10 * Math.PI / 180) * 50);
    expect(segments[1][2]).toBeCloseTo(3 + Math.cos(10 * Math.PI / 180) * 50);
    expect(segments[1][1] - segments[0][1]).toBeCloseTo(2 * Math.sin(10 * Math.PI / 180) * 50);
  });

  it("rotates the strut mount orientation with the knuckle", () => {
    const segments = strutMountAngleSegments([[1, 2, 3], [4, -5, 6]], 0, 100, [Math.PI / 2, 0]);
    expect(segments[0][1]).toBeCloseTo(52);
    expect(segments[1][1]).toBeCloseTo(-48);
    expect(segments[0][2]).toBeCloseTo(3);
    expect(segments[1][2]).toBeCloseTo(3);
  });

  it("places mirrored steering pivots relative to the moved ball joints", () => {
    expect(steeringKnucklePivotPoints([[638, 785, 250], [638, -785, 250]], 125, 210, 24))
      .toEqual([[428, 809, 375], [428, -809, 375]]);
  });

  it("supports a negative steering pivot offset", () => {
    expect(steeringKnucklePivotPoints([[638, 785, 250], [638, -785, 250]], 125, 210, -24))
      .toEqual([[428, 761, 375], [428, -761, 375]]);
  });

  it("places mirrored strut mounts at the configured height, depth, and location from the ball joints", () => {
    expect(strutMountPoints([[638, 785, 250], [638, -785, 250]], 130, 10, 89))
      .toEqual([[628, 874, 380], [628, -874, 380]]);
  });

  it("supports negative strut mount offsets and locations", () => {
    expect(strutMountPoints([[638, 785, 250], [638, -785, 250]], 130, -10, -89))
      .toEqual([[648, 696, 380], [648, -696, 380]]);
  });

  it("extends the steering and strut points outward parallel to each control arm to form mirrored hub faces", () => {
    const faces = hubFacePoints(
      [[0, 10, 0], [0, -10, 0]],
      [[2, 3, 4], [2, -3, 4]],
      [[6, 7, 8], [6, -7, 8]],
      -24,
      -89,
    );
    expect(faces).toEqual([
      [[2, 27, 4], [6, 96, 8], [0, 10, 0]],
      [[2, -27, 4], [6, -96, 8], [0, -10, 0]],
    ]);
    expect(Math.hypot(
      faces[0][0][0] - 2,
      faces[0][0][1] - 3,
      faces[0][0][2] - 4,
    )).toBeCloseTo(24);
    expect(Math.hypot(
      faces[0][1][0] - 6,
      faces[0][1][1] - 7,
      faces[0][1][2] - 8,
    )).toBeCloseTo(89);
  });

  it("keeps hub-face offset lengths and makes both extensions horizontal in front view", () => {
    const steeringPivots: [[number, number, number], [number, number, number]] =
      [[2, 3, 4], [2, -3, 4]];
    const strutMounts: [[number, number, number], [number, number, number]] =
      [[6, 7, 8], [6, -7, 8]];
    const faces = hubFacePoints(
      [[0, 10, 20], [0, -10, 20]],
      steeringPivots,
      strutMounts,
      -24,
      -89,
    );

    for (let side = 0; side < 2; side += 1) {
      expect(faces[side][0][2]).toBe(steeringPivots[side][2]);
      expect(faces[side][1][2]).toBe(strutMounts[side][2]);
      expect(Math.hypot(
        faces[side][0][0] - steeringPivots[side][0],
        faces[side][0][1] - steeringPivots[side][1],
        faces[side][0][2] - steeringPivots[side][2],
      )).toBeCloseTo(24);
      expect(Math.hypot(
        faces[side][1][0] - strutMounts[side][0],
        faces[side][1][1] - strutMounts[side][1],
        faces[side][1][2] - strutMounts[side][2],
      )).toBeCloseTo(89);
    }
    expect(faces[0][0][1]).toBeGreaterThan(3);
    expect(faces[1][0][1]).toBeLessThan(-3);
  });

  it("preserves hub-face shape and right-angle extensions while steering the rigid hub", () => {
    const ballJoints: [[number, number, number], [number, number, number]] =
      [[638, 785, 250], [638, -785, 250]];
    const steeringPivots = steeringKnucklePivotPoints(ballJoints, 125, 210, -24);
    const strutMounts = strutMountPoints(ballJoints, 130, -10, -89);
    const topMounts = frontTopMountPoints(950, 900, 10);
    const orientationForSide = (side: 0 | 1): HubOrientation => {
      const direction = [
        topMounts[side][0] - ballJoints[side][0],
        topMounts[side][1] - ballJoints[side][1],
        topMounts[side][2] - ballJoints[side][2],
      ];
      const length = Math.hypot(...direction);
      return {
        axis: [1, 0, 0],
        angleRad: 0,
        rollAxis: direction.map((value) => value / length) as [number, number, number],
        rollAngleRad: side === 0 ? 0.2 : -0.2,
      };
    };
    const orientations: [HubOrientation, HubOrientation] = [
      orientationForSide(0),
      orientationForSide(1),
    ];
    const faces = steeredHubFacePoints(
      ballJoints,
      steeringPivots,
      strutMounts,
      -24,
      -89,
      orientations,
    );
    const distance = (a: readonly number[], b: readonly number[]) =>
      Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const neutralFaces = hubFacePoints(ballJoints, steeringPivots, strutMounts, -24, -89);

    for (let side = 0; side < 2; side += 1) {
      const actualSteeringPivot = orientHubPoint(steeringPivots[side], ballJoints[side], orientations[side]);
      const actualStrutMount = orientHubPoint(strutMounts[side], ballJoints[side], orientations[side]);
      for (let corner = 0; corner < 3; corner += 1) {
        expect(distance(faces[side][corner], faces[side][(corner + 1) % 3]))
          .toBeCloseTo(distance(neutralFaces[side][corner], neutralFaces[side][(corner + 1) % 3]));
      }
      expect(distance(faces[side][0], actualSteeringPivot)).toBeCloseTo(24);
      expect(distance(faces[side][1], actualStrutMount)).toBeCloseTo(89);
    }
  });

  it("places the true hub face from hub height and spacing and draws a 100 mm circle parallel to the virtual face", () => {
    const face: [[number, number, number], [number, number, number], [number, number, number]] =
      [[2, 27, 4], [6, 96, 8], [0, 10, 0]];
    const hub = trueHubFaceGeometry(face, 60, 94);
    const distance = (a: readonly number[], b: readonly number[]) =>
      Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const faceNormal = [
      (face[0][1] - face[2][1]) * (face[1][2] - face[2][2]) -
        (face[0][2] - face[2][2]) * (face[1][1] - face[2][1]),
      (face[0][2] - face[2][2]) * (face[1][0] - face[2][0]) -
        (face[0][0] - face[2][0]) * (face[1][2] - face[2][2]),
      (face[0][0] - face[2][0]) * (face[1][1] - face[2][1]) -
        (face[0][1] - face[2][1]) * (face[1][0] - face[2][0]),
    ];
    const normalLength = Math.hypot(...faceNormal);
    const unitNormal = faceNormal.map((value) => value / normalLength);

    expect(distance(hub.heightPoint, face[2])).toBeCloseTo(60);
    expect(distance(hub.center, hub.heightPoint)).toBeCloseTo(94);
    expect(hub.normal).toHaveLength(3);
    expect(hub.circle).toHaveLength(48);
    hub.circle.forEach((point) => {
      expect(distance(point, hub.center)).toBeCloseTo(50);
      const offset = [
        point[0] - hub.center[0],
        point[1] - hub.center[1],
        point[2] - hub.center[2],
      ];
      expect(offset[0] * unitNormal[0] + offset[1] * unitNormal[1] + offset[2] * unitNormal[2])
        .toBeCloseTo(0);
    });
  });

  it("calculates overall tire diameter and places the tread centerline from the hub face", () => {
    expect(tireOverallDiameterMm(15, 195, 65)).toBeCloseTo(634.5);
    expect(tireTreadCenter([10, 20, 30], [0, -1, 0], -42)).toEqual([10, 62, 30]);
    expect(tireTreadCenter([10, 20, 30], [0, -1, 0], 42)).toEqual([10, -22, 30]);
  });

  it("calculates toe in millimeters, camber, and caster for both sides", () => {
    const toeRad = 2 * Math.PI / 180;
    const camberRad = 4 * Math.PI / 180;
    const normals: [[number, number, number], [number, number, number]] = [1, -1].map((side) => [
      Math.sin(toeRad) * Math.cos(camberRad),
      side * Math.cos(toeRad) * Math.cos(camberRad),
      -Math.sin(camberRad),
    ]) as [[number, number, number], [number, number, number]];
    const measurements = wheelAlignmentMeasurements(
      normals,
      [[0, 100, 100], [0, -100, 100]],
      [[-10, 100, 600], [-10, -100, 600]],
      634.5,
    );
    if (!measurements.toeMm || measurements.totalToeMm === null) {
      throw new Error("Toe should be available for the current wheel normals.");
    }

    expect(measurements.toeMm[0]).toBeCloseTo(Math.tan(toeRad) * 634.5);
    expect(measurements.toeMm[1]).toBeCloseTo(Math.tan(toeRad) * 634.5);
    expect(measurements.totalToeMm).toBeCloseTo(2 * Math.tan(toeRad) * 634.5);
    expect(measurements.camberDeg[0]).toBeCloseTo(4);
    expect(measurements.camberDeg[1]).toBeCloseTo(4);
    expect(measurements.casterDeg[0]).toBeCloseTo(Math.atan2(10, 500) * 180 / Math.PI);
    expect(measurements.casterDeg[1]).toBeCloseTo(Math.atan2(10, 500) * 180 / Math.PI);
    expect(measurements.scrubRadiusMm).toEqual([null, null]);
  });

  it("calculates scrub radius from the steering-axis ground intersection to each tire centerline", () => {
    const measurements = wheelAlignmentMeasurements(
      [[0, 1, 0], [0, -1, 0]],
      [[0, 100, 100], [0, -100, 100]],
      [[-10, 100, 600], [-10, -100, 600]],
      634.5,
      [[0, 130, 300], [0, -130, 300]],
    );

    expect(measurements.scrubRadiusMm).toEqual([30, 30]);
  });

  it("calculates wheel rate as spring rate multiplied by motion ratio squared", () => {
    const measurements = wheelAlignmentMeasurements(
      [[0, 1, 0], [0, -1, 0]],
      [[0, 100, 100], [0, -100, 100]],
      [[-10, 100, 600], [-10, -100, 600]],
      634.5,
      null,
      [0.8, 1.2],
      50,
    );

    expect(measurements.motionRatio).toEqual([0.8, 1.2]);
    expect(measurements.wheelRateNPerMm[0]).toBeCloseTo(32);
    expect(measurements.wheelRateNPerMm[1]).toBeCloseTo(72);
  });

  it("calculates the local motion ratio from suspension geometry", () => {
    const project: SuspensionProject = {
      id: "motion-ratio-test",
      name: "Motion ratio test",
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
        strutStaticLengthMm: 580,
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
        mainArmInnerMountWidthMm: 750, mainArmInnerMountHeightMm: 250, frontToRearLengthMm: 1600,
        toeArmInnerMountWidthMm: 850, toeArmInnerMountHeightMm: 250, toeArmMainArmWidthMm: 190,
        mainArmLengthMm: 420, toeArmLengthMm: 225,
      },
    };

    const ratios = suspensionMotionRatios(project);
    expect(ratios[0]).toEqual(expect.any(Number));
    expect(ratios[1]).toEqual(expect.any(Number));
    expect(ratios[0]).toBeGreaterThan(0);
    expect(ratios[1]).toBeGreaterThan(0);
  });

  it("updates toe from the current steering position while keeping current camber", () => {
    const turnedNormals: [[number, number, number], [number, number, number]] =
      [[0.2, 0.98, 0], [0.2, -0.98, -0.1]];
    const measurements = wheelAlignmentMeasurements(
      turnedNormals,
      [[0, 100, 100], [0, -100, 100]],
      [[0, 100, 600], [0, -100, 600]],
      634.5,
    );

    expect(measurements.toeMm?.[0]).toBeCloseTo(0.2 / 0.98 * 634.5);
    expect(measurements.toeMm?.[1]).toBeCloseTo(0.2 / 0.98 * 634.5);
    expect(measurements.totalToeMm).toBeCloseTo(2 * 0.2 / 0.98 * 634.5);
    expect(measurements.camberDeg[0]).toBeCloseTo(0);
    expect(measurements.camberDeg[1]).toBeCloseTo(Math.asin(0.1) * 180 / Math.PI);
  });

  it("rotates the ball joint about its two inner pivots without changing triangle side lengths", () => {
    const initial = controlArmPickupPoints(465, 440, 250, 230, 302, 320, 12);
    const moved = controlArmPickupPoints(465, 440, 250, 230, 302, 320, 12, 0.65, -0.35);
    const distance = (a: readonly number[], b: readonly number[]) =>
      Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

    for (let side = 0; side < 2; side += 1) {
      expect(distance(moved.ballJoint[side], moved.front[side]))
        .toBeCloseTo(distance(initial.ballJoint[side], initial.front[side]));
      expect(distance(moved.ballJoint[side], moved.rear[side]))
        .toBeCloseTo(distance(initial.ballJoint[side], initial.rear[side]));
    }
    expect(moved.ballJoint[0][2]).not.toBe(initial.ballJoint[0][2]);
    expect(moved.ballJoint[1][2]).not.toBe(initial.ballJoint[1][2]);
  });
});
