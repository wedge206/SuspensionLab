import {describe, expect, it} from "vitest";
import {
    controlArmPickupPoints, frontTopMountPoints, steeringRackPivotPoints,
    tieRodConstrainedKnucklePoints, withStaticStrutLength,
} from "../domain/coordinates";
import type {SuspensionProject} from "../domain/types";
import {
    createProjectFromTemplate,
    DEFAULT_TEMPLATE_KEY,
    listProjectTemplates,
    resetProjectToTemplate,
} from "./templates";

describe("built-in project templates", () => {
    it("loads the default template as the current project format", () => {
        expect(listProjectTemplates()).toContainEqual({key: DEFAULT_TEMPLATE_KEY, name: "Default"});
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
                leftRotationRad: expect.any(Number),
                rightRotationRad: expect.any(Number),
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
            frontTopMount: {heightMm: 900, widthMm: 960, offsetMm: 30},
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
            suspension: {springRateNPerMm: 50},
            rearSuspension: {
                camberArmInnerMountHeightMm: 97,
                camberArmInnerMountForwardOffsetMm: 189,
                camberArmInnerMountWidthMm: 660,
                mainArmInnerMountWidthMm: 400, mainArmInnerMountHeightMm: 250, frontToRearLengthMm: 1900,
                toeArmInnerMountWidthMm: 685, toeArmInnerMountHeightMm: 260, toeArmMainArmWidthMm: 201,
                mainArmLengthMm: 370, toeArmLengthMm: 210, leftRotationRad: 0, rightRotationRad: 0,
                leftVerticalOffsetMm: 0, rightVerticalOffsetMm: 0,
            },
            rearHub: {
                camberArmOuterMountHeightMm: 97,
                camberArmOuterMountForwardOffsetMm: 189,
                camberArmOuterMountLateralOffsetMm: 0,
                mainArmOuterMountStaticHeightMm: 240,
                toeArmOuterMountOffsetMm: 150,
                toeArmOuterMountHeightMm: 10,
                toeArmOuterMountHeightOffsetMm: 0,
                toeArmOuterMountForwardOffsetMm: 200,
                toeArmOuterMountLateralOffsetMm: 10,
                trailingArmLengthMm: 470,
                trailingArmMountHeightMm: 308,
                trailingArmMountWidthMm: 1040,
                trailingArmMountForwardOffsetMm: 460,
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
            frontLowerControlArmPickup: {widthMm: 465},
            rearSuspension: {
                mainArmInnerMountHeightMm: 250, frontToRearLengthMm: 1900,
                toeArmInnerMountWidthMm: 685, toeArmInnerMountHeightMm: 260, toeArmMainArmWidthMm: 201,
                mainArmLengthMm: 370, toeArmLengthMm: 210,
            },
        });
    });

    function measuredStrutLengths(project: SuspensionProject): [number, number] {
        const p = project.frontLowerControlArmPickup;
        const a = project.frontControlArm;
        const k = project.wheelKnuckle;
        const rack = project.steeringRack;
        const top = project.frontTopMount;
        const joints = controlArmPickupPoints(
            p.widthMm, p.rearWidthMm, p.frontHeightMm, p.rearHeightMm, p.controlArmDepthMm,
            a.lengthMm, a.ballJointOffsetMm, a.leftRotationRad, a.rightRotationRad,
        ).ballJoint;
        return tieRodConstrainedKnucklePoints(
            joints, steeringRackPivotPoints(rack.widthMm, rack.centerlineHeightMm, rack.centerlineOffsetMm, rack.rackTravelMm),
            frontTopMountPoints(top.widthMm, top.heightMm, top.offsetMm),
            k.steeringPivotHeightMm, k.steeringPivotDepthMm, k.steeringPivotOffsetMm,
            k.strutMountHeightMm, k.strutMountOffsetMm, k.strutMountLocationMm, -k.strutMountAngleDeg,
            rack.tieRodLengthMm, k.strutMinLengthMm, k.strutMaxLengthMm,
        ).strutLengths;
    }

    describe("static strut length", () => {
        it("initializes both struts to 580 mm", () => {
            const project = createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "Project", "id");
            for (const length of measuredStrutLengths(project)) expect(length).toBeCloseTo(580, 6);
        });

        it("sets both struts to the configured value and preserves it on reset after dragging", () => {
            const project = createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "Project", "id");
            project.wheelKnuckle.strutStaticLengthMm = 600;
            const positioned = withStaticStrutLength(project);
            for (const length of measuredStrutLengths(positioned)) expect(length).toBeCloseTo(600, 6);
            positioned.frontControlArm.leftRotationRad += 0.1;
            positioned.frontControlArm.rightRotationRad -= 0.1;
            const reset = resetProjectToTemplate(positioned, DEFAULT_TEMPLATE_KEY);
            expect(reset.wheelKnuckle.strutStaticLengthMm).toBe(600);
            for (const length of measuredStrutLengths(reset)) expect(length).toBeCloseTo(600, 6);
        });

        it("reports unreachable static lengths without modifying the project", () => {
            const project = createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "Project", "id");
            project.wheelKnuckle.strutStaticLengthMm = 1000;
            const before = structuredClone(project);
            expect(() => withStaticStrutLength(project)).toThrow("within the strut travel limits");
            expect(project).toEqual(before);
            project.wheelKnuckle.strutMaxLengthMm = 1100;
            expect(() => withStaticStrutLength(project)).toThrow("cannot be reached");
        });
    });
});
