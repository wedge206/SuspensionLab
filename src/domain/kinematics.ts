import {
    controlArmPickupPoints, frontTopMountPoints, orientHubPoint, rearCamberArmInnerMountPoints,
    rearMainArmInnerMountPoints, rearMainArmOuterMountPoints, rearToeArmInnerMountPoints,
    rearTrailingArmMountPoints, solveRearHubMounts, steeredHubFacePoints, steeringKnucklePivotPoints,
    steeringRackPivotPoints, strutMountAngleSegments, strutMountPoints, suspensionMotionRatios,
    tieRodConstrainedKnucklePoints, tireOverallDiameterMm, tireTreadCenter, trueHubFaceGeometry,
    wheelAlignmentMeasurements,
} from "./coordinates";
import {FRONT_GEOMETRY_ERROR_CODES, isGeometryError, REAR_GEOMETRY_ERROR_CODES} from "./geometryError";
import {STRUT_TRAVEL_TOLERANCE_MM, strutTravelViolation} from "./strutTravel";
import type {SuspensionProject, Vec3} from "./types";

export function calculateGroundStations(project: SuspensionProject) {
    const rear = rearMainArmInnerMountPoints(
        project.rearSuspension.frontToRearLengthMm,
        project.rearSuspension.mainArmInnerMountWidthMm,
        project.rearSuspension.mainArmInnerMountHeightMm,
    );
    const toe = rearToeArmInnerMountPoints(
        rear, project.rearSuspension.toeArmInnerMountWidthMm,
        project.rearSuspension.toeArmInnerMountHeightMm, project.rearSuspension.toeArmMainArmWidthMm,
    );
    return {
        rear,
        toe,
        controlArmDepthMm: project.frontLowerControlArmPickup.controlArmDepthMm,
        frontHeightMm: project.frontLowerControlArmPickup.frontHeightMm,
    };
}

export function solveSuspension(project: SuspensionProject) {
    const pickup = project.frontLowerControlArmPickup;
    const arm = project.frontControlArm;
    const rack = project.steeringRack;
    const knuckle = project.wheelKnuckle;
    const rear = project.rearSuspension;
    const hub = project.rearHub;
    const tire = project.wheelTire;
    const points = controlArmPickupPoints(
        pickup.widthMm, pickup.rearWidthMm, pickup.frontHeightMm, pickup.rearHeightMm,
        pickup.controlArmDepthMm, arm.lengthMm, arm.ballJointOffsetMm, arm.leftRotationRad, arm.rightRotationRad,
    );
    const ground = calculateGroundStations(project);
    const rearMounts = ground.rear;
    const toeArmMounts = ground.toe;
    const camberArmMounts = rearCamberArmInnerMountPoints(
        rearMounts, rear.camberArmInnerMountHeightMm, rear.camberArmInnerMountForwardOffsetMm,
        rear.camberArmInnerMountWidthMm,
    );
    const trailingArmMounts = rearTrailingArmMountPoints(
        rearMounts, hub.trailingArmMountWidthMm, hub.trailingArmMountHeightMm, hub.trailingArmMountForwardOffsetMm,
    );
    const nominalOuterMounts = rearMainArmOuterMountPoints(
        rearMounts, trailingArmMounts, rear.mainArmLengthMm, hub.trailingArmLengthMm,
        hub.mainArmOuterMountStaticHeightMm, rear.leftVerticalOffsetMm, rear.rightVerticalOffsetMm,
    );
    let rearSolution: ReturnType<typeof solveRearHubMounts> | null = null;
    let rearGeometryMessage = "";
    try {
        rearSolution = solveRearHubMounts(
            rearMounts, toeArmMounts, nominalOuterMounts, rear.mainArmLengthMm, rear.toeArmLengthMm,
            hub.toeArmOuterMountHeightOffsetMm, hub.toeArmOuterMountForwardOffsetMm,
            hub.toeArmOuterMountLateralOffsetMm, hub.mainArmOuterMountStaticHeightMm,
            {
                innerMounts: camberArmMounts, lengthMm: rear.camberArmLengthMm, heightMm: hub.camberArmOuterMountHeightMm,
                forwardOffsetMm: hub.camberArmOuterMountForwardOffsetMm, lateralOffsetMm: hub.camberArmOuterMountLateralOffsetMm,
            },
            [rear.leftLongitudinalOffsetMm, rear.rightLongitudinalOffsetMm],
        );
    } catch (error) {
        if (!isGeometryError(error, REAR_GEOMETRY_ERROR_CODES)) throw error;
        rearGeometryMessage = error.message;
    }
    const camberArmOuterMounts = rearSolution && rearSolution.camberOuterMounts;
    const rackPivots = steeringRackPivotPoints(
        rack.widthMm, rack.centerlineHeightMm, rack.centerlineOffsetMm, rack.rackTravelMm,
    );
    const topMounts = frontTopMountPoints(
        project.frontTopMount.widthMm, project.frontTopMount.heightMm, project.frontTopMount.offsetMm,
    );
    const neutralSteeringPivots = steeringKnucklePivotPoints(
        points.ballJoint, knuckle.steeringPivotHeightMm, knuckle.steeringPivotDepthMm, knuckle.steeringPivotOffsetMm,
    );
    const neutralStrutMounts = strutMountPoints(
        points.ballJoint, knuckle.strutMountHeightMm, knuckle.strutMountOffsetMm, knuckle.strutMountLocationMm,
    );
    let knucklePoints: ReturnType<typeof tieRodConstrainedKnucklePoints>;
    let geometryError = "";
    try {
        knucklePoints = tieRodConstrainedKnucklePoints(
            points.ballJoint, rackPivots, topMounts,
            knuckle.steeringPivotHeightMm, knuckle.steeringPivotDepthMm, knuckle.steeringPivotOffsetMm,
            knuckle.strutMountHeightMm, knuckle.strutMountOffsetMm, knuckle.strutMountLocationMm,
            -knuckle.strutMountAngleDeg, rack.tieRodLengthMm, knuckle.strutMinLengthMm, knuckle.strutMaxLengthMm,
        );
    } catch (error) {
        if (!isGeometryError(error, FRONT_GEOMETRY_ERROR_CODES)) throw error;
        geometryError = error.message;
        knucklePoints = {
            steeringPivots: neutralSteeringPivots,
            strutMounts: neutralStrutMounts,
            orientations: [
                {axis: [0, 0, 1], angleRad: 0, rollAxis: [0, 0, 1], rollAngleRad: 0},
                {axis: [0, 0, 1], angleRad: 0, rollAxis: [0, 0, 1], rollAngleRad: 0},
            ],
            strutLengths: [0, 0],
        };
    }
    const knuckleValid = !geometryError;
    const hubFaces = steeredHubFacePoints(
        points.ballJoint, neutralSteeringPivots, neutralStrutMounts, knuckle.steeringPivotOffsetMm,
        knuckle.strutMountLocationMm, knucklePoints.orientations,
    );
    const trueHubFaces = hubFaces.map((face) => trueHubFaceGeometry(face, knuckle.hubHeightMm, knuckle.hubSpacingMm));
    const tireCenters: [Vec3, Vec3] = [
        tireTreadCenter(trueHubFaces[0].center, trueHubFaces[0].normal, tire.wheelOffsetMm),
        tireTreadCenter(trueHubFaces[1].center, trueHubFaces[1].normal, tire.wheelOffsetMm),
    ];
    const tireDiameterMm = tireOverallDiameterMm(tire.wheelDiameterIn, tire.tireSectionWidthMm, tire.tireAspectRatio);
    const groundAxisPoints = points.ballJoint.map((point, index): Vec3 | null => {
        const span = topMounts[index][2] - point[2];
        if (!knuckleValid || Math.abs(span) < 1e-9) return null;
        const ratio = -point[2] / span;
        return [point[0] + (topMounts[index][0] - point[0]) * ratio,
            point[1] + (topMounts[index][1] - point[1]) * ratio, 0];
    });
    const alignment = knuckleValid ? wheelAlignmentMeasurements(
        [trueHubFaces[0].normal, trueHubFaces[1].normal], points.ballJoint, topMounts, tireDiameterMm,
        tireCenters, suspensionMotionRatios(project), project.suspension.springRateNPerMm,
    ) : null;
    const angleMarkers = strutMountAngleSegments(neutralStrutMounts, -knuckle.strutMountAngleDeg)
        .map((point, index) => {
            const side: 0 | 1 = index < 2 ? 0 : 1;
            return orientHubPoint(point, points.ballJoint[side], knucklePoints.orientations[side]);
        });
    const strutOutOfRange: [boolean, boolean] = [
        strutTravelViolation(knucklePoints.strutLengths[0], knuckle.strutMinLengthMm, knuckle.strutMaxLengthMm) > STRUT_TRAVEL_TOLERANCE_MM,
        strutTravelViolation(knucklePoints.strutLengths[1], knuckle.strutMinLengthMm, knuckle.strutMaxLengthMm) > STRUT_TRAVEL_TOLERANCE_MM,
    ];
    const outOfRangeSides = knucklePoints.strutLengths
        .map((length, index) => ({length, side: index === 0 ? "left" : "right"}))
        .filter((_, index) => strutOutOfRange[index]);
    const strutWarning = outOfRangeSides.length
        ? `Strut length outside configured ${knuckle.strutMinLengthMm}-${knuckle.strutMaxLengthMm} mm travel: ${
            outOfRangeSides.map(({side, length}) => `${side} ${length.toFixed(1)} mm`).join(", ")
        }.`
        : "";
    const geometryMessage = [rearGeometryMessage, geometryError, strutWarning].filter(Boolean).join(" ");
    const geometryStatusKey = [rearGeometryMessage, geometryError, ...outOfRangeSides.map(({side}) => side)]
        .filter(Boolean).join("|");
    return {
        ground, points, rearMounts, toeArmMounts, camberArmMounts, camberArmOuterMounts, trailingArmMounts, rearSolution,
        rackPivots, topMounts, knucklePoints, knuckleValid, hubFaces, trueHubFaces, tireCenters, tireDiameterMm,
        tireWidthMm: tire.tireSectionWidthMm, groundAxisPoints, alignment, angleMarkers,
        strutOutOfRange,
        rackHousingWidthMm: rack.housingWidthMm, geometryMessage, geometryStatusKey,
    };
}

export type SuspensionSnapshot = ReturnType<typeof solveSuspension>;
export type GroundStations = ReturnType<typeof calculateGroundStations>;
