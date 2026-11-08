import * as THREE from "three";
import {SceneRenderer} from "./SceneRenderer";
import {SceneGeometryBuilder} from "./SceneGeometryBuilder";
import {SceneInteractionController} from "./SceneInteractionController";
import type {SuspensionProject} from "../domain/types";
import type {WheelAlignmentMeasurements} from "../domain/coordinates";
import {calculateGroundStations, solveSuspension} from "../domain/kinematics";

export class ChassisScene {
    private readonly rendering: SceneRenderer;
    private readonly interaction: SceneInteractionController;
    private readonly scene = new THREE.Scene();
    private readonly geometryBuilder: SceneGeometryBuilder;

    private get geometryStatus() {
        return this.geometryBuilder.geometryStatus;
    }

    private get renderer(): THREE.WebGLRenderer {
        return this.rendering.renderer;
    }

    private get camera(): THREE.PerspectiveCamera {
        return this.rendering.camera;
    }

    private get controls() {
        return this.rendering.controls;
    }

    private get pickups() {
        return this.geometryBuilder.pickups;
    }

    private get ballJoints() {
        return this.geometryBuilder.ballJoints;
    }

    private get steeringRackPivots() {
        return this.geometryBuilder.steeringRackPivots;
    }

    private get rearMainArmOuterMounts() {
        return this.geometryBuilder.rearMainArmOuterMounts;
    }

    private project?: SuspensionProject;

    constructor(
        private readonly host: HTMLElement,
        private readonly onProjectChange: () => void,
        onGeometryError: (message: string, type?: "error" | "success") => void,
        onAlignmentUpdate: (measurements: WheelAlignmentMeasurements | null) => void,
        initialProject: SuspensionProject,
    ) {
        this.rendering = new SceneRenderer(host);
        this.geometryBuilder = new SceneGeometryBuilder(onGeometryError, onAlignmentUpdate);
        host.append(this.geometryStatus);
        this.scene.background = new THREE.Color(0x12191c);
        this.scene.add(new THREE.HemisphereLight(0xe4f0e9, 0x263336, 2.2));

        const key = new THREE.DirectionalLight(0xffffff, 3.2);
        key.position.set(900, -800, 1400);
        this.scene.add(key);
        this.geometryBuilder.initialize(calculateGroundStations(initialProject));
        this.geometryBuilder.addToScene(this.scene);
        this.interaction = new SceneInteractionController(this.renderer.domElement, {
            camera: this.camera,
            controls: this.controls,
            pickups: this.pickups,
            ballJoints: this.ballJoints,
            steeringRackPivots: this.steeringRackPivots,
            rearMainArmOuterMounts: this.rearMainArmOuterMounts,
            onProjectChange: this.onProjectChange,
            update: (project) => this.update(project),
            getProject: () => this.project,
        });
        this.rendering.start(this.scene);
    }

    update(project: SuspensionProject): void {
        this.project = project;
        this.geometryBuilder.update(solveSuspension(project));
    }

    setScrubRadiusGeometryVisible(visible: boolean): void {
        this.geometryBuilder.setScrubRadiusGeometryVisible(visible);
    }

    dispose(): void {
        this.interaction.dispose();
        this.rendering.dispose();
        this.geometryBuilder.dispose();
        this.host.replaceChildren();
    }
}
