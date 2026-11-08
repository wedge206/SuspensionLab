import * as THREE from "three";
import {FRONT_PICKUP_STATION_MM} from "../domain/coordinates";
import type {GroundStations, SuspensionSnapshot} from "../domain/kinematics";
import type {WheelAlignmentMeasurements} from "../domain/coordinates";

const FRAME_HALF_LENGTH = 850;
const FRAME_HALF_WIDTH = 430;
const GROUND_SIZE_MM = 3000;
const GROUND_HALF_SIZE_MM = GROUND_SIZE_MM / 2;
const GROUND_COMPASS_TEXTURE_WIDTH_PX = 512;
const GROUND_COMPASS_PLANE_WIDTH_MM = 560;
const GROUND_COMPASS_TIP_X_PX = 500;
const GROUND_COMPASS_LENGTH_SCALE = 0.75;

export interface GroundSceneGeometry {
    readonly grid: THREE.Group;
    readonly compass: THREE.Group;
    readonly rearMarker: THREE.Mesh;
    readonly frame: THREE.LineSegments;
}

export class SceneGeometryBuilder {
    createGroundAndFrame(
        controlArmDepthMm: number,
        frontMountHeightMm: number,
        rearMainArmX: number,
        rearToeArmX: number,
    ): GroundSceneGeometry {
        const grid = this.createGroundGrid();
        const compass = this.createGroundCompass();
        const rearMarker = compass.getObjectByName("Rear");
        if (!(rearMarker instanceof THREE.Mesh)) {
            throw new Error("Unable to create rear ground marker.");
        }
        this.updateGroundGrid(grid, compass, rearMarker, rearMainArmX);
        return {
            grid,
            compass,
            rearMarker,
            frame: this.createFrame(
                controlArmDepthMm,
                frontMountHeightMm,
                [rearMainArmX, rearToeArmX],
            ),
        };
    }

    updateGroundGrid(
        grid: THREE.Group,
        compass: THREE.Group,
        rearMarker: THREE.Mesh,
        rearMainArmX: number,
    ): void {
        const frameRearX = rearMainArmX - (FRAME_HALF_LENGTH - FRONT_PICKUP_STATION_MM);
        const groundOverhang = GROUND_HALF_SIZE_MM - FRAME_HALF_LENGTH;
        const frontGroundX = FRAME_HALF_LENGTH + groundOverhang;
        const rearGroundX = frameRearX - groundOverhang;
        grid.position.x = (frontGroundX + rearGroundX) / 2;
        grid.scale.x = (frontGroundX - rearGroundX) / GROUND_SIZE_MM;
        for (const label of ["Left", "Right"] as const) {
            const marker = compass.getObjectByName(label);
            if (!(marker instanceof THREE.Mesh)) {
                throw new Error(`Unable to find ${label.toLowerCase()} ground marker.`);
            }
            marker.position.x = grid.position.x;
        }
        const tipOffsetMm =
            (GROUND_COMPASS_TIP_X_PX / GROUND_COMPASS_TEXTURE_WIDTH_PX - 0.5) * GROUND_COMPASS_PLANE_WIDTH_MM;
        rearMarker.position.x = rearGroundX + tipOffsetMm;
    }

    disposeGroundGeometry(geometry: GroundSceneGeometry): void {
        for (const object of geometry.grid.children) {
            if (object instanceof THREE.Line || object instanceof THREE.Mesh) {
                object.geometry.dispose();
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                for (const material of materials) material.dispose();
            }
        }
        for (const marker of geometry.compass.children) {
            if (!(marker instanceof THREE.Mesh)) continue;
            marker.geometry.dispose();
            const material = marker.material as THREE.MeshBasicMaterial;
            material.map?.dispose();
            material.dispose();
        }
        geometry.frame.geometry.dispose();
        (geometry.frame.material as THREE.Material).dispose();
    }

    framePoints(
        controlArmDepthMm: number,
        frontMountHeightMm: number,
        [rearMainArmX, rearToeArmX]: [number, number],
    ): THREE.Vector3[] {
        const frontOverhang = FRAME_HALF_LENGTH - FRONT_PICKUP_STATION_MM;
        const x0 = rearMainArmX - frontOverhang, x1 = FRAME_HALF_LENGTH;
        const y0 = -FRAME_HALF_WIDTH, y1 = FRAME_HALF_WIDTH;
        const z = frontMountHeightMm;
        const points = [
            [x0, y0, z], [x1, y0, z],
            [x1, y0, z], [x1, y1, z],
            [x1, y1, z], [x0, y1, z],
            [x0, y1, z], [x0, y0, z],
            [0, y0, z], [0, y1, z],
            [FRONT_PICKUP_STATION_MM, y0, z], [FRONT_PICKUP_STATION_MM, y1, z],
            [FRONT_PICKUP_STATION_MM - controlArmDepthMm, y0, z],
            [FRONT_PICKUP_STATION_MM - controlArmDepthMm, y1, z],
            [rearMainArmX, y0, z], [rearMainArmX, y1, z],
            [rearToeArmX, y0, z], [rearToeArmX, y1, z],
        ].map(([x, y, height]) => new THREE.Vector3(x, y, height));
        return points;
    }

    private createGroundGrid(): THREE.Group {
        const group = new THREE.Group();
        const grid = new THREE.GridHelper(GROUND_SIZE_MM, 30, 0x465659, 0x2a373a);
        grid.rotation.x = Math.PI / 2;
        group.add(grid);
        const centerlineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-GROUND_HALF_SIZE_MM, 0, 1),
            new THREE.Vector3(GROUND_HALF_SIZE_MM, 0, 1),
        ]);
        group.add(new THREE.Line(
            centerlineGeometry,
            new THREE.LineDashedMaterial({color: 0x577368, dashSize: 45, gapSize: 30}),
        ));
        (group.children[group.children.length - 1] as THREE.Line).computeLineDistances();
        return group;
    }

    private createFrame(
        controlArmDepthMm: number,
        frontMountHeightMm: number,
        rearArmStations: [number, number],
    ): THREE.LineSegments {
        const geometry = new THREE.BufferGeometry().setFromPoints(
            this.framePoints(controlArmDepthMm, frontMountHeightMm, rearArmStations),
        );
        return new THREE.LineSegments(
            geometry,
            new THREE.LineBasicMaterial({color: 0x84b9a2, transparent: true, opacity: 0.8}),
        );
    }

    private createGroundCompass(): THREE.Group {
        const tipOffsetMm =
            (GROUND_COMPASS_TIP_X_PX / GROUND_COMPASS_TEXTURE_WIDTH_PX - 0.5) * GROUND_COMPASS_PLANE_WIDTH_MM;
        const markerCenterMm = GROUND_HALF_SIZE_MM - tipOffsetMm;
        const directions = [
            {label: "Front", color: [126, 212, 157], x: 1, y: 0, rotation: 0},
            {label: "Rear", color: [235, 119, 111], x: -1, y: 0, rotation: Math.PI},
            {label: "Left", color: [246, 232, 166], x: 0, y: 1, rotation: Math.PI / 2},
            {label: "Right", color: [126, 174, 245], x: 0, y: -1, rotation: -Math.PI / 2},
        ];
        const markers = new THREE.Group();
        for (const direction of directions) {
            const canvas = document.createElement("canvas");
            canvas.width = GROUND_COMPASS_TEXTURE_WIDTH_PX;
            canvas.height = 192;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Unable to create ground compass labels.");
            const [red, green, blue] = direction.color;
            context.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.36)`;
            context.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.68)`;
            context.lineWidth = 5;
            context.lineJoin = "round";
            const shortenX = (x: number): number =>
                GROUND_COMPASS_TIP_X_PX - (GROUND_COMPASS_TIP_X_PX - x) * GROUND_COMPASS_LENGTH_SCALE;
            context.beginPath();
            context.moveTo(shortenX(20), 48);
            context.lineTo(shortenX(342), 48);
            context.lineTo(shortenX(342), 12);
            context.lineTo(shortenX(GROUND_COMPASS_TIP_X_PX), 96);
            context.lineTo(shortenX(342), 180);
            context.lineTo(shortenX(342), 144);
            context.lineTo(shortenX(20), 144);
            context.closePath();
            context.fill();
            context.stroke();
            context.fillStyle = "#29312d";
            context.font = "900 64px sans-serif";
            context.textAlign = "center";
            context.textBaseline = "middle";
            if (direction.label === "Left") {
                context.translate(shortenX(190), 96);
                context.rotate(Math.PI);
                context.fillText(direction.label, 0, 0);
            } else {
                context.fillText(direction.label, shortenX(190), 96);
            }
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            const marker = new THREE.Mesh(
                new THREE.PlaneGeometry(GROUND_COMPASS_PLANE_WIDTH_MM, 210),
                new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    toneMapped: false,
                }),
            );
            marker.name = direction.label;
            marker.position.set(direction.x * markerCenterMm, direction.y * markerCenterMm, 3);
            marker.rotation.z = direction.rotation;
            marker.renderOrder = 1;
            markers.add(marker);
        }
        return markers;
    }

    geometryStatus = document.createElement("div");
    lastGeometryMessage = "";
    scrubRadiusGeometryVisible = true;
    scrubRadiusGeometryAvailable: [boolean, boolean] = [false, false];
    groundGeometry!: GroundSceneGeometry;

    get frame() {
        return this.groundGeometry.frame;
    }

    get grid() {
        return this.groundGeometry.grid;
    }

    get compass() {
        return this.groundGeometry.compass;
    }

    get rearMarker() {
        return this.groundGeometry.rearMarker;
    }

    readonly pickups = [
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xe4ab61,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xe4ab61,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0x82aef0,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0x82aef0,
            roughness: 0.4
        })),
    ];
    readonly rearMainArmInnerMounts = [
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            roughness: 0.4
        })),
    ];
    readonly rearCamberArmInnerMounts = [
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xc98ce8,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xc98ce8,
            roughness: 0.4
        })),
    ];
    readonly rearCamberArmOuterMounts = [
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xc98ce8,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xc98ce8,
            roughness: 0.4
        })),
    ];
    readonly rearMainArmOuterMounts = [
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            roughness: 0.4
        })),
    ];
    readonly rearToeArmInnerMounts = [
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xe7d36b,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xe7d36b,
            roughness: 0.4
        })),
    ];
    readonly rearToeArmOuterMounts = [
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xe7d36b,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xe7d36b,
            roughness: 0.4
        })),
    ];
    readonly rearTrailingArmMounts = [
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0x7be0e6,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0x7be0e6,
            roughness: 0.4
        })),
    ];
    readonly rearMainArms = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({color: 0x00ffff}),
    );
    readonly rearOuterMountConnections = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({color: 0xffffff}),
    );
    readonly rearHubFaces = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.MeshStandardMaterial({color: 0x777e89, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1}),
    );
    readonly rearToeArms = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({color: 0xe7d36b}),
    );
    readonly rearCamberArms = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({color: 0xc98ce8}),
    );
    readonly rearTrailingArms = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({color: 0x7be0e6}),
    );
    readonly ballJoints = [
        new THREE.Mesh(new THREE.SphereGeometry(28, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xe77858,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(28, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xe77858,
            roughness: 0.4
        })),
    ];
    readonly steeringRackPivots = [
        new THREE.Mesh(new THREE.SphereGeometry(22, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xb98de8,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(22, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xb98de8,
            roughness: 0.4
        })),
    ];
    readonly topMountPoints = [
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0x78d0c0,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({
            color: 0x78d0c0,
            roughness: 0.4
        })),
    ];
    readonly steeringPivots = [
        new THREE.Mesh(new THREE.SphereGeometry(22, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xe7d36b,
            roughness: 0.4
        })),
        new THREE.Mesh(new THREE.SphereGeometry(22, 24, 16), new THREE.MeshStandardMaterial({
            color: 0xe7d36b,
            roughness: 0.4
        })),
    ];
    readonly hubFaces = [
        new THREE.Mesh(
            new THREE.BufferGeometry(),
            new THREE.MeshBasicMaterial({
                color: 0x7bbec5,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.32,
                depthWrite: false,
            }),
        ),
        new THREE.Mesh(
            new THREE.BufferGeometry(),
            new THREE.MeshBasicMaterial({
                color: 0xd99abf,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.32,
                depthWrite: false,
            }),
        ),
    ];
    readonly hubFaceExtensions = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({
            color: 0xf2f5ee,
            transparent: true,
            opacity: 1,
            depthTest: false,
        }),
    );
    readonly hubConstructionLines = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({color: 0xf2c66d, depthTest: false}),
    );
    readonly hubFaceCircles = [
        new THREE.LineLoop(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({color: 0x7be0e6, depthTest: false}),
        ),
        new THREE.LineLoop(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({color: 0xe7a7d2, depthTest: false}),
        ),
    ];
    readonly tireTreads = [
        new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 1, 96, 1, true),
            new THREE.MeshStandardMaterial({color: 0x303536, roughness: 0.92, side: THREE.DoubleSide}),
        ),
        new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 1, 96, 1, true),
            new THREE.MeshStandardMaterial({color: 0x303536, roughness: 0.92, side: THREE.DoubleSide}),
        ),
    ];
    readonly tireGroundOutlines = [
        new THREE.LineLoop(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({color: 0x7be0e6, depthTest: false}),
        ),
        new THREE.LineLoop(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({color: 0xe7a7d2, depthTest: false}),
        ),
    ];
    readonly steeringAxisGroundLines = [
        new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineDashedMaterial({color: 0xf2c66d, dashSize: 24, gapSize: 14, depthTest: false}),
        ),
        new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineDashedMaterial({color: 0xf2c66d, dashSize: 24, gapSize: 14, depthTest: false}),
        ),
    ];
    readonly tireCenterGroundLines = [
        new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineDashedMaterial({color: 0x7be0e6, dashSize: 24, gapSize: 14, depthTest: false}),
        ),
        new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineDashedMaterial({color: 0xe7a7d2, dashSize: 24, gapSize: 14, depthTest: false}),
        ),
    ];
    readonly controlArmFirstSides = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({color: 0xf0c27e}),
    );
    readonly steeringRack = new THREE.Mesh(
        new THREE.CylinderGeometry(8, 8, 1, 16),
        new THREE.MeshStandardMaterial({color: 0xb98de8, roughness: 0.4}),
    );
    readonly tieRods = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({color: 0x9ecbd0}),
    );
    readonly steeringRackExtensions = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({color: 0xf2a65a}),
    );
    readonly struts = [
        new THREE.Mesh(
            new THREE.CylinderGeometry(10, 10, 1, 16),
            new THREE.MeshStandardMaterial({color: 0xd982c7, roughness: 0.4}),
        ),
        new THREE.Mesh(
            new THREE.CylinderGeometry(10, 10, 1, 16),
            new THREE.MeshStandardMaterial({color: 0xd982c7, roughness: 0.4}),
        ),
    ];
    readonly strutMountAngleMarkers = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({color: 0xf2f5ee}),
    );

    constructor(
        private readonly onGeometryError: (message: string, type?: "error" | "success") => void,
        private readonly onAlignmentUpdate: (measurements: WheelAlignmentMeasurements | null) => void,
    ) {
        this.geometryStatus.className = "geometry-status";
        this.geometryStatus.setAttribute("role", "status");
        this.geometryStatus.hidden = true;
    }

    initialize(ground: GroundStations): void {
        this.groundGeometry = this.createGroundAndFrame(
            ground.controlArmDepthMm,
            ground.frontHeightMm,
            ground.rear[0][0],
            ground.toe[0][0],
        );
    }

    addToScene(scene: THREE.Scene): void {
        scene.add(this.grid, this.compass, this.frame);
        scene.add(
            this.controlArmFirstSides, this.steeringRack, this.steeringRackExtensions, this.tieRods,
            ...this.struts, this.strutMountAngleMarkers, ...this.pickups, ...this.rearMainArmInnerMounts,
            ...this.rearCamberArmInnerMounts, ...this.rearCamberArmOuterMounts,
            ...this.rearMainArmOuterMounts, ...this.rearToeArmInnerMounts,
            ...this.rearToeArmOuterMounts, ...this.rearTrailingArmMounts, this.rearMainArms,
            this.rearOuterMountConnections, this.rearHubFaces, this.rearToeArms, this.rearCamberArms, this.rearTrailingArms,
            ...this.ballJoints, ...this.steeringRackPivots,
            ...this.topMountPoints, ...this.steeringPivots, ...this.hubFaces, this.hubFaceExtensions,
            this.hubConstructionLines, ...this.hubFaceCircles, ...this.tireTreads, ...this.tireGroundOutlines,
            ...this.steeringAxisGroundLines, ...this.tireCenterGroundLines,
        );
        [...this.steeringAxisGroundLines, ...this.tireCenterGroundLines].forEach((line) => {
            line.renderOrder = 4;
        });
        this.hubFaces.forEach((face) => {
            face.renderOrder = 2;
        });
        this.hubFaceExtensions.renderOrder = 3;
    }

    update(snapshot: SuspensionSnapshot): void {
        const {
            ground, points, rearMounts, camberArmMounts, camberArmOuterMounts, trailingArmMounts, trailingArms, toeArmMounts,
            rearSolution, rackPivots, topMounts, knucklePoints, knuckleValid,
            hubFaces, trueHubFaces, tireCenters, tireDiameterMm, tireWidthMm, groundAxisPoints,
            alignment, angleMarkers, strutOutOfRange,
            rackHousingWidthMm, geometryMessage, geometryStatusKey,
        } = snapshot;
        const positions = [...points.front, ...points.rear];
        this.pickups.forEach((pickup, index) => pickup.position.set(...positions[index]));
        this.rearMainArmInnerMounts.forEach((mount, index) => mount.position.set(...rearMounts[index]));
        this.rearCamberArmInnerMounts.forEach((mount, index) => mount.position.set(...camberArmMounts[index]));
        this.rearTrailingArmMounts.forEach((mount, index) => mount.position.set(...trailingArmMounts[index]));
        this.updateGroundGrid(this.grid, this.compass, this.rearMarker, rearMounts[0][0]);
        this.rearToeArmInnerMounts.forEach((mount, index) => mount.position.set(...toeArmMounts[index]));
        if (rearSolution && camberArmOuterMounts && trailingArms) {
            const rearOuterMounts = rearSolution.mainOuterMounts;
            const toeArmOuterMounts = rearSolution.toeOuterMounts;
            this.rearMainArmOuterMounts.forEach((mount, index) => mount.position.set(...rearOuterMounts[index]));
            this.rearCamberArmOuterMounts.forEach((mount, index) => mount.position.set(...camberArmOuterMounts[index]));
            this.rearToeArmOuterMounts.forEach((mount, index) => mount.position.set(...toeArmOuterMounts[index]));
            this.rearMainArms.geometry.setFromPoints(rearMounts.flatMap((mount, index) => [
                new THREE.Vector3(...mount), new THREE.Vector3(...rearOuterMounts[index]),
            ]));
            this.rearOuterMountConnections.geometry.setFromPoints(rearOuterMounts.flatMap((mount, index) => [
                new THREE.Vector3(...mount), new THREE.Vector3(...toeArmOuterMounts[index]),
                new THREE.Vector3(...toeArmOuterMounts[index]), new THREE.Vector3(...camberArmOuterMounts[index]),
                new THREE.Vector3(...camberArmOuterMounts[index]), new THREE.Vector3(...mount),
            ]));
            this.rearHubFaces.geometry.setFromPoints(rearOuterMounts.flatMap((mount, index) => [
                new THREE.Vector3(...mount), new THREE.Vector3(...toeArmOuterMounts[index]),
                new THREE.Vector3(...camberArmOuterMounts[index]),
            ]));
            this.rearHubFaces.geometry.computeVertexNormals();
            this.rearHubFaces.geometry.computeBoundingSphere();
            this.rearToeArms.geometry.setFromPoints(toeArmMounts.flatMap((mount, index) => [
                new THREE.Vector3(...mount), new THREE.Vector3(...toeArmOuterMounts[index]),
            ]));
            this.rearCamberArms.geometry.setFromPoints(camberArmMounts.flatMap((mount, index) => [
                new THREE.Vector3(...mount), new THREE.Vector3(...camberArmOuterMounts[index]),
            ]));
            this.rearTrailingArms.geometry.setFromPoints(trailingArms.flatMap(([toe, start, end]) => [
                new THREE.Vector3(...toe), new THREE.Vector3(...start),
                new THREE.Vector3(...start), new THREE.Vector3(...end),
            ]));
            for (const line of [this.rearMainArms, this.rearOuterMountConnections, this.rearToeArms, this.rearCamberArms, this.rearTrailingArms]) {
                line.geometry.computeBoundingSphere();
            }
            this.setRearArmVisibility(true);
        } else {
            this.setRearArmVisibility(false);
        }
        points.ballJoint.forEach((point, index) => this.ballJoints[index].position.set(...point));
        rackPivots.forEach((point, index) => this.steeringRackPivots[index].position.set(...point));
        this.setKnuckleVisibility(knuckleValid);
        const steeringPivots = knucklePoints.steeringPivots;
        const strutMounts = knucklePoints.strutMounts;
        steeringPivots.forEach((point, index) => this.steeringPivots[index].position.set(...point));
        hubFaces.forEach((face, index) => {
            this.hubFaces[index].geometry.setFromPoints(face.map((point) => new THREE.Vector3(...point)));
            this.hubFaces[index].geometry.setIndex([0, 1, 2]);
            this.hubFaces[index].geometry.computeVertexNormals();
            this.hubFaces[index].geometry.computeBoundingSphere();
        });
        trueHubFaces.forEach((_hubFace, index) => {
            const steeringAxisLine = this.steeringAxisGroundLines[index];
            const tireCenterLine = this.tireCenterGroundLines[index];
            const groundPoint = groundAxisPoints[index];
            if (!groundPoint) {
                this.scrubRadiusGeometryAvailable[index] = false;
                steeringAxisLine.visible = false;
                tireCenterLine.visible = false;
                return;
            }
            this.scrubRadiusGeometryAvailable[index] = true;

            steeringAxisLine.geometry.setFromPoints([
                new THREE.Vector3(...topMounts[index]),
                new THREE.Vector3(...groundPoint),
            ]);
            steeringAxisLine.computeLineDistances();
            steeringAxisLine.visible = this.scrubRadiusGeometryVisible;

            const tireCenter = tireCenters[index];
            tireCenterLine.geometry.setFromPoints([
                new THREE.Vector3(...tireCenter),
                new THREE.Vector3(tireCenter[0], tireCenter[1], 0),
            ]);
            tireCenterLine.computeLineDistances();
            tireCenterLine.visible = this.scrubRadiusGeometryVisible;
        });
        this.onAlignmentUpdate(alignment);
        this.hubConstructionLines.geometry.setFromPoints(trueHubFaces.flatMap((hubFace, index) => [
            new THREE.Vector3(...points.ballJoint[index]),
            new THREE.Vector3(...hubFace.heightPoint),
            new THREE.Vector3(...hubFace.heightPoint),
            new THREE.Vector3(...hubFace.center),
        ]));
        this.hubConstructionLines.geometry.computeBoundingSphere();
        trueHubFaces.forEach((hubFace, index) => {
            this.hubFaceCircles[index].geometry.setFromPoints(
                hubFace.circle.map((point) => new THREE.Vector3(...point)),
            );
            this.hubFaceCircles[index].geometry.computeBoundingSphere();
            const tire = this.tireTreads[index];
            const tireCenter = tireCenters[index];
            tire.position.set(...tireCenter);
            tire.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(...hubFace.normal).normalize(),
            );
            const radius = tireDiameterMm / 2;
            tire.scale.set(radius, tireWidthMm, radius);
            const horizontalNormalLength = Math.hypot(hubFace.normal[0], hubFace.normal[1]);
            const widthDirection = new THREE.Vector2(
                hubFace.normal[0] / horizontalNormalLength,
                hubFace.normal[1] / horizontalNormalLength,
            );
            const lengthDirection = new THREE.Vector2(-widthDirection.y, widthDirection.x);
            const groundCenter = new THREE.Vector2(tireCenter[0], tireCenter[1]);
            const halfWidth = tireWidthMm / 2;
            const halfLength = radius;
            const corners = [
                groundCenter.clone().addScaledVector(lengthDirection, halfLength).addScaledVector(widthDirection, halfWidth),
                groundCenter.clone().addScaledVector(lengthDirection, halfLength).addScaledVector(widthDirection, -halfWidth),
                groundCenter.clone().addScaledVector(lengthDirection, -halfLength).addScaledVector(widthDirection, -halfWidth),
                groundCenter.clone().addScaledVector(lengthDirection, -halfLength).addScaledVector(widthDirection, halfWidth),
            ];
            const groundOutline = this.tireGroundOutlines[index];
            groundOutline.geometry.setFromPoints(corners.map((corner) => new THREE.Vector3(corner.x, corner.y, 1)));
            groundOutline.geometry.computeBoundingSphere();
        });
        this.hubFaceExtensions.geometry.setFromPoints([
            new THREE.Vector3(...steeringPivots[0]),
            new THREE.Vector3(...hubFaces[0][0]),
            new THREE.Vector3(...strutMounts[0]),
            new THREE.Vector3(...hubFaces[0][1]),
            new THREE.Vector3(...hubFaces[0][0]),
            new THREE.Vector3(...hubFaces[0][1]),
            new THREE.Vector3(...hubFaces[0][1]),
            new THREE.Vector3(...hubFaces[0][2]),
            new THREE.Vector3(...hubFaces[0][2]),
            new THREE.Vector3(...hubFaces[0][0]),
            new THREE.Vector3(...steeringPivots[1]),
            new THREE.Vector3(...hubFaces[1][0]),
            new THREE.Vector3(...strutMounts[1]),
            new THREE.Vector3(...hubFaces[1][1]),
            new THREE.Vector3(...hubFaces[1][0]),
            new THREE.Vector3(...hubFaces[1][1]),
            new THREE.Vector3(...hubFaces[1][1]),
            new THREE.Vector3(...hubFaces[1][2]),
            new THREE.Vector3(...hubFaces[1][2]),
            new THREE.Vector3(...hubFaces[1][0]),
        ]);
        this.hubFaceExtensions.geometry.computeBoundingSphere();
        topMounts.forEach((point, index) => this.topMountPoints[index].position.set(...point));
        const strutLengths = knucklePoints.strutLengths;
        this.struts.forEach((strut, index) => {
            const start = new THREE.Vector3(...strutMounts[index]);
            const end = new THREE.Vector3(...topMounts[index]);
            const direction = end.clone().sub(start);
            strut.position.copy(start).add(end).multiplyScalar(0.5);
            strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
            strut.scale.set(1, strutLengths[index], 1);
            (strut.material as THREE.MeshStandardMaterial).color.set(strutOutOfRange[index] ? 0xf06e55 : 0xd982c7);
        });
        this.strutMountAngleMarkers.geometry.setFromPoints(angleMarkers.map((point) =>
            new THREE.Vector3(...point)));
        this.strutMountAngleMarkers.geometry.computeBoundingSphere();
        this.geometryStatus.textContent = geometryMessage;
        this.geometryStatus.hidden = !geometryMessage;
        if (geometryStatusKey !== this.lastGeometryMessage) {
            this.onGeometryError(
                geometryMessage || "Suspension geometry is valid.",
                geometryMessage ? "error" : "success",
            );
            this.lastGeometryMessage = geometryStatusKey;
        }

        const rackStart = new THREE.Vector3(...rackPivots[0]);
        const rackEnd = new THREE.Vector3(...rackPivots[1]);
        const housingHalfWidth = rackHousingWidthMm / 2;
        const housingPoints: [THREE.Vector3, THREE.Vector3] = [
            new THREE.Vector3(rackStart.x, housingHalfWidth, rackStart.z),
            new THREE.Vector3(rackEnd.x, -housingHalfWidth, rackEnd.z),
        ];
        const rackDirection = housingPoints[1].clone().sub(housingPoints[0]);
        this.steeringRack.position.copy(housingPoints[0]).add(housingPoints[1]).multiplyScalar(0.5);
        this.steeringRack.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            rackDirection.normalize(),
        );
        this.steeringRack.scale.set(1, rackHousingWidthMm, 1);
        this.steeringRackExtensions.geometry.setFromPoints([
            housingPoints[0],
            rackStart,
            housingPoints[1],
            rackEnd,
        ]);
        this.steeringRackExtensions.geometry.computeBoundingSphere();
        this.tieRods.geometry.setFromPoints([
            new THREE.Vector3(...rackPivots[0]),
            new THREE.Vector3(...steeringPivots[0]),
            new THREE.Vector3(...rackPivots[1]),
            new THREE.Vector3(...steeringPivots[1]),
        ]);
        this.tieRods.geometry.computeBoundingSphere();
        this.frame.geometry.setFromPoints(this.framePoints(
            ground.controlArmDepthMm,
            ground.frontHeightMm,
            [rearMounts[0][0], toeArmMounts[0][0]],
        ));
        this.frame.geometry.computeBoundingSphere();
        this.controlArmFirstSides.geometry.setFromPoints([
            new THREE.Vector3(...points.front[0]),
            new THREE.Vector3(...points.rear[0]),
            new THREE.Vector3(...points.ballJoint[0]),
            new THREE.Vector3(...points.front[0]),
            new THREE.Vector3(...points.ballJoint[0]),
            new THREE.Vector3(...points.rear[0]),
            new THREE.Vector3(...points.front[1]),
            new THREE.Vector3(...points.rear[1]),
            new THREE.Vector3(...points.ballJoint[1]),
            new THREE.Vector3(...points.front[1]),
            new THREE.Vector3(...points.ballJoint[1]),
            new THREE.Vector3(...points.rear[1]),
        ]);
        this.controlArmFirstSides.geometry.computeBoundingSphere();
    }

    setScrubRadiusGeometryVisible(visible: boolean): void {
        this.scrubRadiusGeometryVisible = visible;
        this.steeringAxisGroundLines.forEach((line, index) => {
            line.visible = visible && this.scrubRadiusGeometryAvailable[index];
        });
        this.tireCenterGroundLines.forEach((line, index) => {
            line.visible = visible && this.scrubRadiusGeometryAvailable[index];
        });
    }

    setKnuckleVisibility(visible: boolean): void {
        this.steeringPivots.forEach((point) => {
            point.visible = visible;
        });
        this.hubFaces.forEach((face) => {
            face.visible = visible;
        });
        this.tireTreads.forEach((tire) => {
            tire.visible = visible;
        });
        this.tireGroundOutlines.forEach((outline) => {
            outline.visible = visible;
        });
        this.hubFaceExtensions.visible = visible;
        this.tieRods.visible = visible;
        this.struts.forEach((strut) => {
            strut.visible = visible;
        });
        this.strutMountAngleMarkers.visible = visible;
    }

    setRearArmVisibility(visible: boolean): void {
        for (const object of [
            ...this.rearMainArmOuterMounts, ...this.rearCamberArmOuterMounts, ...this.rearToeArmOuterMounts,
            this.rearMainArms, this.rearOuterMountConnections, this.rearHubFaces, this.rearToeArms, this.rearCamberArms,
            this.rearTrailingArms,
        ]) object.visible = visible;
    }


    dispose(): void {
        this.rearTrailingArms.geometry.dispose();
        this.rearTrailingArms.material.dispose();
        this.rearCamberArms.geometry.dispose();
        this.rearCamberArms.material.dispose();
        this.rearHubFaces.geometry.dispose();
        this.rearHubFaces.material.dispose();
        for (const pickup of [
            ...this.pickups,
            ...this.rearMainArmInnerMounts,
            ...this.rearCamberArmInnerMounts,
            ...this.rearCamberArmOuterMounts,
            ...this.rearMainArmOuterMounts,
            ...this.rearToeArmInnerMounts,
            ...this.rearToeArmOuterMounts,
            ...this.rearTrailingArmMounts,
        ]) {
            pickup.geometry.dispose();
            pickup.material.dispose();
        }

        for (const ballJoint of this.ballJoints) {
            ballJoint.geometry.dispose();
            ballJoint.material.dispose();
        }
        for (const pivot of this.steeringRackPivots) {
            pivot.geometry.dispose();
            pivot.material.dispose();
        }
        for (const point of this.topMountPoints) {
            point.geometry.dispose();
            point.material.dispose();
        }
        for (const pivot of this.steeringPivots) {
            pivot.geometry.dispose();
            pivot.material.dispose();
        }
        for (const face of this.hubFaces) {
            face.geometry.dispose();
            (face.material as THREE.Material).dispose();
        }
        this.hubFaceExtensions.geometry.dispose();
        this.hubFaceExtensions.material.dispose();
        this.hubConstructionLines.geometry.dispose();
        this.hubConstructionLines.material.dispose();
        for (const circle of this.hubFaceCircles) {
            circle.geometry.dispose();
            circle.material.dispose();
        }
        for (const tire of this.tireTreads) {
            tire.geometry.dispose();
            tire.material.dispose();
        }
        for (const outline of this.tireGroundOutlines) {
            outline.geometry.dispose();
            outline.material.dispose();
        }
        for (const line of [...this.steeringAxisGroundLines, ...this.tireCenterGroundLines]) {
            line.geometry.dispose();
            line.material.dispose();
        }
        this.controlArmFirstSides.geometry.dispose();
        this.controlArmFirstSides.material.dispose();
        this.rearMainArms.geometry.dispose();
        this.rearMainArms.material.dispose();
        this.rearOuterMountConnections.geometry.dispose();
        this.rearOuterMountConnections.material.dispose();
        this.rearToeArms.geometry.dispose();
        this.rearToeArms.material.dispose();
        this.steeringRack.geometry.dispose();
        this.steeringRack.material.dispose();
        this.steeringRackExtensions.geometry.dispose();
        this.steeringRackExtensions.material.dispose();
        this.tieRods.geometry.dispose();
        this.tieRods.material.dispose();
        for (const strut of this.struts) {
            strut.geometry.dispose();
            strut.material.dispose();
        }
        this.strutMountAngleMarkers.geometry.dispose();
        this.strutMountAngleMarkers.material.dispose();
        this.disposeGroundGeometry(this.groundGeometry);
    }

}
