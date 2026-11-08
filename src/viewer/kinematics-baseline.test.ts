import {afterEach, describe, expect, it, vi} from "vitest";
import * as THREE from "three";
import {createProjectFromTemplate, DEFAULT_TEMPLATE_KEY} from "../templates/templates";
import {SceneGeometryBuilder} from "./SceneGeometryBuilder";
import {calculateGroundStations, solveSuspension} from "../domain/kinematics";

describe("viewer kinematics behavior", () => {
    afterEach(() => vi.unstubAllGlobals());

    function makeBuilder() {
        const context = new Proxy({}, {
            get: () => () => {
            }
        });
        vi.stubGlobal("document", {
            createElement: (tag: string) => tag === "canvas"
                ? {width: 0, height: 0, getContext: () => context}
                : {
                    className: "", hidden: false, textContent: "", setAttribute: () => {
                    }
                },
        });
        const notices = vi.fn();
        const alignment = vi.fn();
        return {builder: new SceneGeometryBuilder(notices, alignment), notices, alignment};
    }

    it("renders default and changed projects and reports invalid solutions independently", () => {
        const {builder, notices, alignment} = makeBuilder();
        const project = createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "Test", "test");
        builder.initialize(calculateGroundStations(project));
        builder.update(solveSuspension(project));
        expect(builder.pickups[0].position.toArray()).toEqual([650, 465, 250]);
        expect(builder.steeringRackPivots[0].position.toArray()).toEqual([484, 425, 362]);
        expect(builder.rearMainArmOuterMounts[0].visible).toBe(true);
        expect(alignment.mock.lastCall?.[0]).not.toBeNull();
        expect(builder.geometryStatus.hidden).toBe(true);
        expect(notices).not.toHaveBeenCalled();

        project.frontLowerControlArmPickup.widthMm = 500;
        builder.update(solveSuspension(project));
        expect(builder.pickups[0].position.toArray()).toEqual([650, 500, 250]);
        expect(alignment.mock.lastCall?.[0]).not.toBeNull();

        project.rearSuspension.mainArmLengthMm = 1;
        builder.update(solveSuspension(project));
        expect(builder.rearMainArmOuterMounts[0].visible).toBe(false);
        expect(builder.geometryStatus.textContent).toContain("Rear arm lengths cannot reach both outer mounts");
        expect(alignment.mock.lastCall?.[0]).not.toBeNull();

        project.steeringRack.tieRodLengthMm = 1;
        builder.update(solveSuspension(project));
        expect(alignment.mock.lastCall?.[0]).toBeNull();
        expect(builder.geometryStatus.textContent).toContain("Tie Rod Length cannot be satisfied");
        expect(builder.steeringPivots[0].visible).toBe(false);
        expect(builder.geometryStatus.textContent).toContain("Rear arm lengths cannot reach both outer mounts");
        expect(notices.mock.lastCall?.[1]).toBe("error");
        const noticeCount = notices.mock.calls.length;
        builder.update(solveSuspension(project));
        expect(notices).toHaveBeenCalledTimes(noticeCount);
        project.rearSuspension.mainArmLengthMm = 370;
        project.steeringRack.tieRodLengthMm = 338;
        builder.update(solveSuspension(project));
        expect(builder.geometryStatus.hidden).toBe(true);
        expect(notices.mock.lastCall).toEqual(["Suspension geometry is valid.", "success"]);
        builder.setScrubRadiusGeometryVisible(false);
        expect(builder.steeringAxisGroundLines.every((line) => !line.visible)).toBe(true);
        builder.setScrubRadiusGeometryVisible(true);
        expect(builder.steeringAxisGroundLines.every((line) => line.visible)).toBe(true);
        builder.dispose();
    });

    it("renders and updates mirrored camber outer pivots and hides them for unsolved rear geometry", () => {
        const {builder} = makeBuilder();
        const project = createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "Test", "test");
        builder.initialize(calculateGroundStations(project));
        const scene = new THREE.Scene();
        builder.addToScene(scene);
        const geometryDispose = vi.spyOn(builder.rearCamberArmOuterMounts[0].geometry, "dispose");
        const materialDispose = vi.spyOn(builder.rearCamberArmOuterMounts[0].material, "dispose");
        for (const [height, forward, lateral, travel] of [[97, 189, 0, 0], [125, -20, 35, 40], [80, 70, -45, -40]]) {
            project.rearHub.camberArmOuterMountHeightMm = height;
            project.rearHub.camberArmOuterMountForwardOffsetMm = forward;
            project.rearHub.camberArmOuterMountLateralOffsetMm = lateral;
            project.rearSuspension.leftVerticalOffsetMm = travel;
            builder.update(solveSuspension(project));
            for (const side of [0, 1] as const) {
                const main = builder.rearMainArmOuterMounts[side];
                const camber = builder.rearCamberArmOuterMounts[side];
                expect(scene.children).toContain(camber);
                expect(camber.visible).toBe(true);
                expect(camber.position.x - main.position.x).toBeCloseTo(forward);
                expect(camber.position.y - main.position.y).toBeCloseTo(side === 0 ? -lateral : lateral);
                expect(camber.position.z - main.position.z).toBeCloseTo(height);
            }
        }
        project.rearSuspension.mainArmLengthMm = 1;
        builder.update(solveSuspension(project));
        expect(builder.rearCamberArmOuterMounts.every((mount) => !mount.visible)).toBe(true);
        project.rearSuspension.mainArmLengthMm = 370;
        builder.update(solveSuspension(project));
        expect(builder.rearCamberArmOuterMounts.every((mount) => mount.visible)).toBe(true);
        builder.dispose();
        expect(geometryDispose).toHaveBeenCalledOnce();
        expect(materialDispose).toHaveBeenCalledOnce();
    });
});
