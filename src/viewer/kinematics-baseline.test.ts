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
        expect(builder.geometryStatus.textContent).toContain("Rear arm lengths cannot reach all outer mounts");
        expect(alignment.mock.lastCall?.[0]).not.toBeNull();

        project.steeringRack.tieRodLengthMm = 1;
        builder.update(solveSuspension(project));
        expect(alignment.mock.lastCall?.[0]).toBeNull();
        expect(builder.geometryStatus.textContent).toContain("Tie Rod Length cannot be satisfied");
        expect(builder.steeringPivots[0].visible).toBe(false);
        expect(builder.geometryStatus.textContent).toContain("Rear arm lengths cannot reach all outer mounts");
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
        const faceGeometryDispose = vi.spyOn(builder.rearHubFaces.geometry, "dispose");
        const faceMaterialDispose = vi.spyOn(builder.rearHubFaces.material, "dispose");
        const armGeometryDispose = vi.spyOn(builder.rearCamberArms.geometry, "dispose");
        const armMaterialDispose = vi.spyOn(builder.rearCamberArms.material, "dispose");
        const trailingGeometryDispose = vi.spyOn(builder.rearTrailingArms.geometry, "dispose");
        const trailingMaterialDispose = vi.spyOn(builder.rearTrailingArms.material, "dispose");
        expect(scene.children).toContain(builder.rearHubFaces);
        expect(scene.children).toContain(builder.rearCamberArms);
        expect(scene.children).toContain(builder.rearTrailingArms);
        for (const travel of [0, 20, -20]) {
            project.rearSuspension.leftVerticalOffsetMm = travel;
            const snapshot = solveSuspension(project);
            builder.update(snapshot);
            const edges = builder.rearOuterMountConnections.geometry.getAttribute("position");
            const faces = builder.rearHubFaces.geometry.getAttribute("position");
            const arms = builder.rearCamberArms.geometry.getAttribute("position");
            const trailing = builder.rearTrailingArms.geometry.getAttribute("position");
            expect(edges.count).toBe(12);
            expect(faces.count).toBe(6);
            expect(arms.count).toBe(4);
            expect(trailing.count).toBe(8);
            expect(builder.rearHubFaces.visible).toBe(true);
            expect(builder.rearCamberArms.visible).toBe(true);
            expect(builder.rearTrailingArms.visible).toBe(true);
            for (const side of [0, 1] as const) {
                const main = builder.rearMainArmOuterMounts[side];
                const toe = builder.rearToeArmOuterMounts[side];
                const camber = builder.rearCamberArmOuterMounts[side];
                expect(scene.children).toContain(camber);
                expect(camber.visible).toBe(true);
                const inner = builder.rearCamberArmInnerMounts[side];
                expect(camber.position.distanceTo(inner.position)).toBeCloseTo(project.rearSuspension.camberArmLengthMm);
                expect(camber.position.distanceTo(main.position)).toBeCloseTo(Math.hypot(189, 97));
                for (const [index, vertex] of [inner.position, camber.position].entries()) {
                    for (const [axis, get] of [["x", "getX"], ["y", "getY"], ["z", "getZ"]] as const) {
                        expect(arms[get](side * 2 + index)).toBeCloseTo(vertex[axis], 3);
                    }
                }
                const vertices = [main.position, toe.position, camber.position];
                const [trailingToe, trailingStart, trailingEnd] = snapshot.trailingArms![side];
                for (const [index, vertex] of [trailingToe, trailingStart, trailingStart, trailingEnd].entries()) {
                    for (const [axis, get] of [[0, "getX"], [1, "getY"], [2, "getZ"]] as const) {
                        expect(trailing[get](side * 4 + index)).toBeCloseTo(vertex[axis], 3);
                    }
                }
                for (const [index, vertex] of vertices.entries()) {
                    for (const [axis, get] of [["x", "getX"], ["y", "getY"], ["z", "getZ"]] as const) {
                        expect(faces[get](side * 3 + index)).toBeCloseTo(vertex[axis], 3);
                    }
                }
                for (const [index, vertex] of [main.position, toe.position, toe.position, camber.position, camber.position, main.position].entries()) {
                    for (const [axis, get] of [["x", "getX"], ["y", "getY"], ["z", "getZ"]] as const) {
                        expect(edges[get](side * 6 + index)).toBeCloseTo(vertex[axis], 3);
                    }
                }
            }
        }
        project.rearSuspension.mainArmLengthMm = 1;
        builder.update(solveSuspension(project));
        expect(builder.rearCamberArmOuterMounts.every((mount) => !mount.visible)).toBe(true);
        expect(builder.rearHubFaces.visible).toBe(false);
        expect(builder.rearOuterMountConnections.visible).toBe(false);
        expect(builder.rearCamberArms.visible).toBe(false);
        expect(builder.rearTrailingArms.visible).toBe(false);
        project.rearSuspension.mainArmLengthMm = 370;
        builder.update(solveSuspension(project));
        expect(builder.rearCamberArmOuterMounts.every((mount) => mount.visible)).toBe(true);
        expect(builder.rearHubFaces.visible).toBe(true);
        expect(builder.rearOuterMountConnections.visible).toBe(true);
        expect(builder.rearCamberArms.visible).toBe(true);
        expect(builder.rearTrailingArms.visible).toBe(true);
        builder.dispose();
        expect(geometryDispose).toHaveBeenCalledOnce();
        expect(materialDispose).toHaveBeenCalledOnce();
        expect(faceGeometryDispose).toHaveBeenCalledOnce();
        expect(faceMaterialDispose).toHaveBeenCalledOnce();
        expect(armGeometryDispose).toHaveBeenCalledOnce();
        expect(armMaterialDispose).toHaveBeenCalledOnce();
        expect(trailingGeometryDispose).toHaveBeenCalledOnce();
        expect(trailingMaterialDispose).toHaveBeenCalledOnce();
    });
});
