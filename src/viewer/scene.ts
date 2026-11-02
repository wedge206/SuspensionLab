import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  FRONT_PICKUP_STATION_MM,
  controlArmPickupPoints,
  frontTopMountPoints,
  orientHubPoint,
  steeredHubFacePoints,
  steeringKnucklePivotPoints,
  steeringRackPivotPoints,
  steeringRackTravelLimitMm,
  suspensionMotionRatios,
  strutMountAngleSegments,
  strutMountPoints,
  tireOverallDiameterMm,
  tireTreadCenter,
  tieRodConstrainedKnucklePoints,
  trueHubFaceGeometry,
  wheelAlignmentMeasurements,
} from "../domain/coordinates";
import {
  DEFAULT_CONTROL_ARM_DEPTH_MM,
  DEFAULT_FRONT_PICKUP_HEIGHT_MM,
} from "../domain/project";
import type { SuspensionProject, Vec3 } from "../domain/types";
import type { WheelAlignmentMeasurements } from "../domain/coordinates";

const FRAME_HALF_LENGTH = 850;
const FRAME_HALF_WIDTH = 430;
const MAX_CONTROL_ARM_DRAG_ANGLE_RAD = Math.PI / 2;

interface CompassAxis {
  direction: THREE.Vector3;
  line: SVGLineElement;
  label: SVGTextElement;
}

export class ChassisScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly geometryStatus = document.createElement("div");
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 1, 10000);
  private readonly controls: OrbitControls;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private project?: SuspensionProject;
  private hoveredBallJointIndex: number | null = null;
  private hoveredSteeringRackPivotIndex: number | null = null;
  private draggingBallJointIndex: number | null = null;
  private draggingSteeringRackPivotIndex: number | null = null;
  private dragStartRackTravelMm = 0;
  private dragStartRackPointerX = 0;
  private dragStartRackPointerY = 0;
  private rackTravelScreenDirection = new THREE.Vector2();
  private dragRackChanged = false;
  private dragAcceptedAngle = 0;
  private dragAcceptedConstraintViolation: [number, number] = [0, 0];
  private dragRotationRecoverySign = 0;
  private lastGeometryMessage = "";
  private dragStartY = 0;
  private dragStartAngle = 0;
  private dragVerticalSign = 1;
  private dragChanged = false;
  private readonly pickups = [
    new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe4ab61, roughness: 0.4 })),
    new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe4ab61, roughness: 0.4 })),
    new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({ color: 0x82aef0, roughness: 0.4 })),
    new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({ color: 0x82aef0, roughness: 0.4 })),
  ];
  private readonly ballJoints = [
    new THREE.Mesh(new THREE.SphereGeometry(28, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe77858, roughness: 0.4 })),
    new THREE.Mesh(new THREE.SphereGeometry(28, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe77858, roughness: 0.4 })),
  ];
  private readonly steeringRackPivots = [
    new THREE.Mesh(new THREE.SphereGeometry(22, 24, 16), new THREE.MeshStandardMaterial({ color: 0xb98de8, roughness: 0.4 })),
    new THREE.Mesh(new THREE.SphereGeometry(22, 24, 16), new THREE.MeshStandardMaterial({ color: 0xb98de8, roughness: 0.4 })),
  ];
  private readonly topMountPoints = [
    new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({ color: 0x78d0c0, roughness: 0.4 })),
    new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({ color: 0x78d0c0, roughness: 0.4 })),
  ];
  private readonly steeringPivots = [
    new THREE.Mesh(new THREE.SphereGeometry(22, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe7d36b, roughness: 0.4 })),
    new THREE.Mesh(new THREE.SphereGeometry(22, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe7d36b, roughness: 0.4 })),
  ];
  private readonly hubFaces = [
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
  private readonly hubFaceExtensions = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({
      color: 0xf2f5ee,
      transparent: true,
      opacity: 1,
      depthTest: false,
    }),
  );
  private readonly hubConstructionLines = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xf2c66d, depthTest: false }),
  );
  private readonly hubFaceCircles = [
    new THREE.LineLoop(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x7be0e6, depthTest: false }),
    ),
    new THREE.LineLoop(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xe7a7d2, depthTest: false }),
    ),
  ];
  private readonly tireTreads = [
    new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 96, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x303536, roughness: 0.92, side: THREE.DoubleSide }),
    ),
    new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 96, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x303536, roughness: 0.92, side: THREE.DoubleSide }),
    ),
  ];
  private readonly tireGroundOutlines = [
    new THREE.LineLoop(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x7be0e6, depthTest: false }),
    ),
    new THREE.LineLoop(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xe7a7d2, depthTest: false }),
    ),
  ];
  private readonly controlArmFirstSides = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xf0c27e }),
  );
  private readonly steeringRack = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8, 1, 16),
    new THREE.MeshStandardMaterial({ color: 0xb98de8, roughness: 0.4 }),
  );
  private readonly tieRods = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x9ecbd0 }),
  );
  private readonly steeringRackExtensions = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xf2a65a }),
  );
  private readonly struts = [
    new THREE.Mesh(
      new THREE.CylinderGeometry(10, 10, 1, 16),
      new THREE.MeshStandardMaterial({ color: 0xd982c7, roughness: 0.4 }),
    ),
    new THREE.Mesh(
      new THREE.CylinderGeometry(10, 10, 1, 16),
      new THREE.MeshStandardMaterial({ color: 0xd982c7, roughness: 0.4 }),
    ),
  ];
  private readonly strutMountAngleMarkers = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xf2f5ee }),
  );
  private readonly frame: THREE.LineSegments;
  private readonly resizeObserver: ResizeObserver;
  private readonly compass = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  private readonly compassAxes: CompassAxis[];
  private readonly onPointerDown = (event: PointerEvent): void => this.handlePointerDown(event);
  private readonly onPointerMove = (event: PointerEvent): void => this.handlePointerMove(event);
  private readonly onPointerUp = (event: PointerEvent): void => this.finishDrag(event);
  private readonly onPointerCancel = (event: PointerEvent): void => this.finishDrag(event);
  private readonly onLostPointerCapture = (event: PointerEvent): void => this.finishDrag(event);
  private readonly onPointerLeave = (): void => {
    if (this.draggingBallJointIndex === null && this.draggingSteeringRackPivotIndex === null) {
      this.setHoveredBallJoint(null);
      this.setHoveredSteeringRackPivot(null);
    }
  };

  constructor(
    private readonly host: HTMLElement,
    private readonly onProjectChange: () => void,
    private readonly onGeometryError: (message: string, type?: "error" | "success") => void,
    private readonly onAlignmentUpdate: (measurements: WheelAlignmentMeasurements | null) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x12191c);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute("aria-label", "Interactive 3D chassis frame view");
    host.append(this.renderer.domElement);
    this.geometryStatus.className = "geometry-status";
    this.geometryStatus.setAttribute("role", "status");
    this.geometryStatus.hidden = true;
    host.append(this.geometryStatus);
    this.compass.setAttribute("viewBox", "0 0 120 120");
    this.compass.setAttribute("class", "view-compass");
    this.compass.setAttribute("role", "img");
    this.compass.setAttribute("aria-label", "3D orientation compass showing vehicle front, left, and up");
    this.compass.innerHTML = `
      <defs>
        <marker id="compass-arrow-x" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#e4ab61" /></marker>
        <marker id="compass-arrow-y" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#80b69d" /></marker>
        <marker id="compass-arrow-z" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#82aef0" /></marker>
      </defs>
      <circle cx="60" cy="60" r="3" class="compass-origin" />
    `;
    this.compassAxes = [
      this.createCompassAxis([1, 0, 0], "FRONT", "#e4ab61", "x"),
      this.createCompassAxis([0, 1, 0], "LEFT", "#80b69d", "y"),
      this.createCompassAxis([0, 0, 1], "UP", "#82aef0", "z"),
    ];
    host.append(this.compass);
    this.scene.background = new THREE.Color(0x12191c);
    this.scene.add(new THREE.HemisphereLight(0xe4f0e9, 0x263336, 2.2));

    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(900, -800, 1400);
    this.scene.add(key);

    this.scene.add(this.createGroundGrid());
    this.frame = this.createFrame(DEFAULT_CONTROL_ARM_DEPTH_MM, DEFAULT_FRONT_PICKUP_HEIGHT_MM);
    this.scene.add(this.frame);
    this.scene.add(
      this.controlArmFirstSides,
      this.steeringRack,
      this.steeringRackExtensions,
      this.tieRods,
      ...this.struts,
      this.strutMountAngleMarkers,
      ...this.pickups,
      ...this.ballJoints,
      ...this.steeringRackPivots,
      ...this.topMountPoints,
      ...this.steeringPivots,
      ...this.hubFaces,
      this.hubFaceExtensions,
      this.hubConstructionLines,
      ...this.hubFaceCircles,
      ...this.tireTreads,
      ...this.tireGroundOutlines,
    );
    this.hubFaces.forEach((face) => {
      face.renderOrder = 2;
    });
    this.hubFaceExtensions.renderOrder = 3;
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(1800, -2400, 1500);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 280);
    this.controls.enableDamping = true;
    this.renderer.domElement.style.cursor = "grab";
    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown, true);
    this.renderer.domElement.addEventListener("pointermove", this.onPointerMove, true);
    this.renderer.domElement.addEventListener("pointerup", this.onPointerUp, true);
    this.renderer.domElement.addEventListener("pointercancel", this.onPointerCancel, true);
    this.renderer.domElement.addEventListener("lostpointercapture", this.onLostPointerCapture, true);
    this.renderer.domElement.addEventListener("pointerleave", this.onPointerLeave);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.animate();
  }

  update(project: SuspensionProject): void {
    this.project = project;
    const { widthMm, rearWidthMm, frontHeightMm, rearHeightMm, controlArmDepthMm } =
      project.frontLowerControlArmPickup;
    const points = controlArmPickupPoints(
      widthMm,
      rearWidthMm,
      frontHeightMm,
      rearHeightMm,
      controlArmDepthMm,
      project.frontControlArm.lengthMm,
      project.frontControlArm.ballJointOffsetMm,
      project.frontControlArm.leftRotationRad,
      project.frontControlArm.rightRotationRad,
    );
    const positions = [...points.front, ...points.rear];
    this.pickups.forEach((pickup, index) => pickup.position.set(...positions[index]));
    points.ballJoint.forEach((point, index) => this.ballJoints[index].position.set(...point));
    const rackPivots = steeringRackPivotPoints(
      project.steeringRack.widthMm,
      project.steeringRack.centerlineHeightMm,
      project.steeringRack.centerlineOffsetMm,
      project.steeringRack.rackTravelMm,
    );
    rackPivots.forEach((point, index) => this.steeringRackPivots[index].position.set(...point));
    const topMounts = frontTopMountPoints(
      project.frontTopMount.widthMm,
      project.frontTopMount.heightMm,
      project.frontTopMount.offsetMm,
    );
    let knucklePoints: ReturnType<typeof tieRodConstrainedKnucklePoints>;
    let knuckleValid = true;
    let geometryError = "";
    try {
      knucklePoints = tieRodConstrainedKnucklePoints(
        points.ballJoint,
        rackPivots,
        topMounts,
        project.wheelKnuckle.steeringPivotHeightMm,
        project.wheelKnuckle.steeringPivotDepthMm,
        project.wheelKnuckle.steeringPivotOffsetMm,
        project.wheelKnuckle.strutMountHeightMm,
        project.wheelKnuckle.strutMountOffsetMm,
        project.wheelKnuckle.strutMountLocationMm,
        -project.wheelKnuckle.strutMountAngleDeg,
        project.steeringRack.tieRodLengthMm,
        project.wheelKnuckle.strutMinLengthMm,
        project.wheelKnuckle.strutMaxLengthMm,
      );
    } catch (error) {
      if (!(error instanceof Error) ||
          ![
            "Tie Rod Length cannot be satisfied at the current ball joint position.",
            "Strut angle cannot reach the fixed top mount.",
          ].includes(error.message)) {
        throw error;
      }
      knuckleValid = false;
      this.setKnuckleVisibility(false);
      geometryError = error.message;
      knucklePoints = {
        steeringPivots: steeringKnucklePivotPoints(
          points.ballJoint,
          project.wheelKnuckle.steeringPivotHeightMm,
          project.wheelKnuckle.steeringPivotDepthMm,
          project.wheelKnuckle.steeringPivotOffsetMm,
        ),
        strutMounts: strutMountPoints(
          points.ballJoint,
          project.wheelKnuckle.strutMountHeightMm,
          project.wheelKnuckle.strutMountOffsetMm,
          project.wheelKnuckle.strutMountLocationMm,
        ),
        orientations: [
          { axis: [0, 0, 1], angleRad: 0, rollAxis: [0, 0, 1], rollAngleRad: 0 },
          { axis: [0, 0, 1], angleRad: 0, rollAxis: [0, 0, 1], rollAngleRad: 0 },
        ],
        strutLengths: [0, 0],
      };
    }
    if (knuckleValid) {
      this.setKnuckleVisibility(true);
    }
    const steeringPivots = knucklePoints.steeringPivots;
    const strutMounts = knucklePoints.strutMounts;
    steeringPivots.forEach((point, index) => this.steeringPivots[index].position.set(...point));
    const neutralSteeringPivots = steeringKnucklePivotPoints(
      points.ballJoint,
      project.wheelKnuckle.steeringPivotHeightMm,
      project.wheelKnuckle.steeringPivotDepthMm,
      project.wheelKnuckle.steeringPivotOffsetMm,
    );
    const neutralStrutMounts = strutMountPoints(
      points.ballJoint,
      project.wheelKnuckle.strutMountHeightMm,
      project.wheelKnuckle.strutMountOffsetMm,
      project.wheelKnuckle.strutMountLocationMm,
    );
    const hubFaces = steeredHubFacePoints(
      points.ballJoint,
      neutralSteeringPivots,
      neutralStrutMounts,
      project.wheelKnuckle.steeringPivotOffsetMm,
      project.wheelKnuckle.strutMountLocationMm,
      knucklePoints.orientations,
    );
    hubFaces.forEach((face, index) => {
      this.hubFaces[index].geometry.setFromPoints(face.map((point) => new THREE.Vector3(...point)));
      this.hubFaces[index].geometry.setIndex([0, 1, 2]);
      this.hubFaces[index].geometry.computeVertexNormals();
      this.hubFaces[index].geometry.computeBoundingSphere();
    });
    const trueHubFaces = hubFaces.map((face) => trueHubFaceGeometry(
      face,
      project.wheelKnuckle.hubHeightMm,
      project.wheelKnuckle.hubSpacingMm,
    ));
    this.onAlignmentUpdate(knuckleValid
      ? wheelAlignmentMeasurements(
        [trueHubFaces[0].normal, trueHubFaces[1].normal],
        points.ballJoint,
        topMounts,
        tireOverallDiameterMm(
          project.wheelTire.wheelDiameterIn,
          project.wheelTire.tireSectionWidthMm,
          project.wheelTire.tireAspectRatio,
        ),
        trueHubFaces.map((hubFace) => tireTreadCenter(
          hubFace.center,
          hubFace.normal,
          project.wheelTire.wheelOffsetMm,
        )) as [Vec3, Vec3],
        suspensionMotionRatios(project),
        project.suspension.springRateNPerMm,
      )
      : null);
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
      const tireCenter = tireTreadCenter(hubFace.center, hubFace.normal, project.wheelTire.wheelOffsetMm);
      tire.position.set(...tireCenter);
      tire.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(...hubFace.normal).normalize(),
      );
      const radius = tireOverallDiameterMm(
        project.wheelTire.wheelDiameterIn,
        project.wheelTire.tireSectionWidthMm,
        project.wheelTire.tireAspectRatio,
      ) / 2;
      tire.scale.set(radius, project.wheelTire.tireSectionWidthMm, radius);
      const horizontalNormalLength = Math.hypot(hubFace.normal[0], hubFace.normal[1]);
      const widthDirection = new THREE.Vector2(
        hubFace.normal[0] / horizontalNormalLength,
        hubFace.normal[1] / horizontalNormalLength,
      );
      const lengthDirection = new THREE.Vector2(-widthDirection.y, widthDirection.x);
      const groundCenter = new THREE.Vector2(tireCenter[0], tireCenter[1]);
      const halfWidth = project.wheelTire.tireSectionWidthMm / 2;
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
      const isOutOfRange = strutLengths[index] < project.wheelKnuckle.strutMinLengthMm ||
        strutLengths[index] > project.wheelKnuckle.strutMaxLengthMm;
      (strut.material as THREE.MeshStandardMaterial).color.set(isOutOfRange ? 0xf06e55 : 0xd982c7);
    });
    const neutralAngleMarkers = strutMountAngleSegments(
      strutMountPoints(
        points.ballJoint,
        project.wheelKnuckle.strutMountHeightMm,
        project.wheelKnuckle.strutMountOffsetMm,
        project.wheelKnuckle.strutMountLocationMm,
      ),
      -project.wheelKnuckle.strutMountAngleDeg,
    );
    const angleMarkers = neutralAngleMarkers.map((point, index) => {
      const side: 0 | 1 = index < 2 ? 0 : 1;
      return orientHubPoint(point, points.ballJoint[side], knucklePoints.orientations[side]);
    });
    this.strutMountAngleMarkers.geometry.setFromPoints(angleMarkers.map((point) =>
      new THREE.Vector3(...point)));
    this.strutMountAngleMarkers.geometry.computeBoundingSphere();
    const outOfRangeSides = strutLengths
      .map((length, index) => ({ length, side: index === 0 ? "left" : "right" }))
      .filter(({ length }) =>
        length < project.wheelKnuckle.strutMinLengthMm ||
        length > project.wheelKnuckle.strutMaxLengthMm);
    const strutWarning = outOfRangeSides.length
      ? `Strut length outside configured ${project.wheelKnuckle.strutMinLengthMm}-${project.wheelKnuckle.strutMaxLengthMm} mm travel: ${
        outOfRangeSides.map(({ side, length }) => `${side} ${length.toFixed(1)} mm`).join(", ")
      }.`
      : "";
    const geometryMessage = geometryError || strutWarning;
    const geometryStatusKey = geometryError
      ? "tie-rod-error"
      : outOfRangeSides.map(({ side }) => side).join(",");
    this.geometryStatus.textContent = geometryMessage;
    this.geometryStatus.hidden = !geometryMessage;
    if (geometryStatusKey !== this.lastGeometryMessage) {
      this.onGeometryError(
        geometryMessage || "Strut lengths are within configured travel limits.",
        geometryMessage ? "error" : "success",
      );
      this.lastGeometryMessage = geometryStatusKey;
    }
    const rackStart = new THREE.Vector3(...rackPivots[0]);
    const rackEnd = new THREE.Vector3(...rackPivots[1]);
    const housingHalfWidth = project.steeringRack.housingWidthMm / 2;
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
    this.steeringRack.scale.set(1, project.steeringRack.housingWidthMm, 1);
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
    this.frame.geometry.setFromPoints(this.framePoints(controlArmDepthMm, frontHeightMm));
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

  dispose(): void {
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown, true);
    this.renderer.domElement.removeEventListener("pointermove", this.onPointerMove, true);
    this.renderer.domElement.removeEventListener("pointerup", this.onPointerUp, true);
    this.renderer.domElement.removeEventListener("pointercancel", this.onPointerCancel, true);
    this.renderer.domElement.removeEventListener("lostpointercapture", this.onLostPointerCapture, true);
    this.renderer.domElement.removeEventListener("pointerleave", this.onPointerLeave);
    this.controls.dispose();
    this.renderer.dispose();
    for (const pickup of this.pickups) {
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
    this.controlArmFirstSides.geometry.dispose();
    this.controlArmFirstSides.material.dispose();
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
    this.frame.geometry.dispose();
    (this.frame.material as THREE.LineBasicMaterial).dispose();
    this.host.replaceChildren();
  }

  private setKnuckleVisibility(visible: boolean): void {
    this.steeringPivots.forEach((point) => { point.visible = visible; });
    this.hubFaces.forEach((face) => { face.visible = visible; });
    this.tireTreads.forEach((tire) => { tire.visible = visible; });
    this.tireGroundOutlines.forEach((outline) => { outline.visible = visible; });
    this.hubFaceExtensions.visible = visible;
    this.tieRods.visible = visible;
    this.struts.forEach((strut) => { strut.visible = visible; });
    this.strutMountAngleMarkers.visible = visible;
  }

  private handlePointerDown(event: PointerEvent): void {
    const index = this.intersectBallJoint(event);
    if (!this.project) return;
    if (index === null) {
      const rackIndex = this.intersectSteeringRackPivot(event);
      if (rackIndex === null) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.draggingSteeringRackPivotIndex = rackIndex;
      this.setHoveredSteeringRackPivot(rackIndex);
      this.dragStartRackTravelMm = this.project.steeringRack.rackTravelMm;
      this.dragStartRackPointerX = event.clientX;
      this.dragStartRackPointerY = event.clientY;
      const bounds = this.renderer.domElement.getBoundingClientRect();
      const start = this.steeringRackPivots[rackIndex].position.clone();
      const end = start.clone().add(new THREE.Vector3(0, 1, 0));
      start.project(this.camera);
      end.project(this.camera);
      this.rackTravelScreenDirection.set(
        (end.x - start.x) * bounds.width / 2,
        -(end.y - start.y) * bounds.height / 2,
      );
      this.dragRackChanged = false;
      this.controls.enabled = false;
      this.renderer.domElement.style.cursor = "grabbing";
      this.renderer.domElement.setPointerCapture(event.pointerId);
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    this.draggingBallJointIndex = index;
    this.dragStartY = event.clientY;
    this.dragChanged = false;
    this.dragStartAngle = index === 0
      ? this.project.frontControlArm.leftRotationRad
      : this.project.frontControlArm.rightRotationRad;
    this.dragAcceptedAngle = this.dragStartAngle;
    this.dragRotationRecoverySign = Math.abs(this.dragStartAngle) > MAX_CONTROL_ARM_DRAG_ANGLE_RAD
      ? Math.sign(this.dragStartAngle)
      : 0;
    this.dragAcceptedConstraintViolation = this.dragConstraintViolation(index, this.dragAcceptedAngle);
    const axis = this.pickups[index + 2].position.clone().sub(this.pickups[index].position).normalize();
    const radial = this.ballJoints[index].position.clone().sub(this.pickups[index].position);
    const verticalTangent = axis.cross(radial).z;
    this.dragVerticalSign = Math.abs(verticalTangent) > 1e-6
      ? Math.sign(verticalTangent)
      : index === 0 ? -1 : 1;
    this.controls.enabled = false;
    this.renderer.domElement.style.cursor = "grabbing";
    this.renderer.domElement.setPointerCapture(event.pointerId);
  }

  private handlePointerMove(event: PointerEvent): void {
    if (this.draggingSteeringRackPivotIndex !== null && this.project) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const travelLimit = steeringRackTravelLimitMm(
        this.project.steeringRack.widthMm,
        this.project.steeringRack.housingWidthMm,
        this.project.steeringRack.steeringLimiterMm,
      );
      const directionLengthSquared = this.rackTravelScreenDirection.lengthSq();
      const pointerDelta = new THREE.Vector2(
        event.clientX - this.dragStartRackPointerX,
        event.clientY - this.dragStartRackPointerY,
      );
      const requestedTravel = this.dragStartRackTravelMm +
        (directionLengthSquared > 1e-8
          ? pointerDelta.dot(this.rackTravelScreenDirection) / directionLengthSquared
          : 0);
      const rackTravelMm = Math.max(-travelLimit, Math.min(travelLimit, requestedTravel));
      if (Math.abs(rackTravelMm - this.project.steeringRack.rackTravelMm) > 1e-10) {
        this.dragRackChanged = true;
      }
      this.project.steeringRack.rackTravelMm = rackTravelMm;
      this.update(this.project);
      return;
    }

    if (this.draggingBallJointIndex !== null && this.project) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const dragIndex: 0 | 1 = this.draggingBallJointIndex === 0 ? 0 : 1;
      const requestedAngle =
        (this.dragStartY - event.clientY) * 0.01 * this.dragVerticalSign;
      const targetAngle = this.dragStartAngle + requestedAngle;
      let acceptedAngle = targetAngle;
      if (!this.isDragCandidateAllowed(targetAngle, dragIndex)) {
        const angleDelta = targetAngle - this.dragAcceptedAngle;
        let validFraction = 0;
        let invalidFraction = 1;
        for (let iteration = 0; iteration < 30; iteration += 1) {
          const fraction = (validFraction + invalidFraction) / 2;
          const candidate = this.dragAcceptedAngle + angleDelta * fraction;
          if (this.isDragCandidateAllowed(candidate, dragIndex)) {
            validFraction = fraction;
          } else {
            invalidFraction = fraction;
          }
        }
        acceptedAngle = this.dragAcceptedAngle + angleDelta * validFraction;
      }
      const currentAngle = dragIndex === 0
        ? this.project.frontControlArm.leftRotationRad
        : this.project.frontControlArm.rightRotationRad;
      if (Math.abs(acceptedAngle - currentAngle) > 1e-10) {
        this.dragChanged = true;
      }
      if (dragIndex === 0) {
        this.project.frontControlArm.leftRotationRad = acceptedAngle;
      } else {
        this.project.frontControlArm.rightRotationRad = acceptedAngle;
      }
      this.dragAcceptedAngle = acceptedAngle;
      this.dragAcceptedConstraintViolation = this.dragConstraintViolation(dragIndex, acceptedAngle);
      if (Math.abs(acceptedAngle) <= MAX_CONTROL_ARM_DRAG_ANGLE_RAD) {
        this.dragRotationRecoverySign = 0;
      }
      this.update(this.project);
      return;
    }

    this.setHoveredBallJoint(this.intersectBallJoint(event));
    this.setHoveredSteeringRackPivot(this.intersectSteeringRackPivot(event));
  }

  private finishDrag(event: PointerEvent): void {
    if (this.draggingSteeringRackPivotIndex !== null) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const changed = this.dragRackChanged;
      this.draggingSteeringRackPivotIndex = null;
      this.controls.enabled = true;
      this.renderer.domElement.style.cursor = "grab";
      if (this.renderer.domElement.hasPointerCapture(event.pointerId)) {
        this.renderer.domElement.releasePointerCapture(event.pointerId);
      }
      this.setHoveredBallJoint(this.intersectBallJoint(event));
      this.setHoveredSteeringRackPivot(this.intersectSteeringRackPivot(event));
      if (changed) this.onProjectChange();
      return;
    }
    if (this.draggingBallJointIndex === null) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const changed = this.dragChanged;
    this.draggingBallJointIndex = null;
    this.controls.enabled = true;
    this.renderer.domElement.style.cursor = "grab";
    if (this.renderer.domElement.hasPointerCapture(event.pointerId)) {
      this.renderer.domElement.releasePointerCapture(event.pointerId);
    }
    this.setHoveredBallJoint(this.intersectBallJoint(event));
    if (changed) this.onProjectChange();
  }

  private intersectBallJoint(event: PointerEvent): number | null {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.ballJoints, false)[0];
    if (!hit) return null;
    const index = this.ballJoints.findIndex((joint) => joint.uuid === hit.object.uuid);
    return index < 0 ? null : index;
  }

  private intersectSteeringRackPivot(event: PointerEvent): number | null {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.steeringRackPivots, false)[0];
    if (!hit) return null;
    const index = this.steeringRackPivots.findIndex((pivot) => pivot.uuid === hit.object.uuid);
    return index < 0 ? null : index;
  }

  private dragConstraintViolation(index: number, angle: number): [number, number] {
    const rotationViolation = Math.max(0, Math.abs(angle) - MAX_CONTROL_ARM_DRAG_ANGLE_RAD);
    if (!this.project) return [rotationViolation, Number.POSITIVE_INFINITY];
    const project = this.project;
    const rotations: [number, number] = [
      project.frontControlArm.leftRotationRad,
      project.frontControlArm.rightRotationRad,
    ];
    rotations[index] = angle;
    const { widthMm, rearWidthMm, frontHeightMm, rearHeightMm, controlArmDepthMm } =
      project.frontLowerControlArmPickup;
    const points = controlArmPickupPoints(
      widthMm,
      rearWidthMm,
      frontHeightMm,
      rearHeightMm,
      controlArmDepthMm,
      project.frontControlArm.lengthMm,
      project.frontControlArm.ballJointOffsetMm,
      rotations[0],
      rotations[1],
    );
    const rackPivots = steeringRackPivotPoints(
      project.steeringRack.widthMm,
      project.steeringRack.centerlineHeightMm,
      project.steeringRack.centerlineOffsetMm,
      project.steeringRack.rackTravelMm,
    );
    const topMounts = frontTopMountPoints(
      project.frontTopMount.widthMm,
      project.frontTopMount.heightMm,
      project.frontTopMount.offsetMm,
    );
    try {
      const knucklePoints = tieRodConstrainedKnucklePoints(
        points.ballJoint,
        rackPivots,
        topMounts,
        project.wheelKnuckle.steeringPivotHeightMm,
        project.wheelKnuckle.steeringPivotDepthMm,
        project.wheelKnuckle.steeringPivotOffsetMm,
        project.wheelKnuckle.strutMountHeightMm,
        project.wheelKnuckle.strutMountOffsetMm,
        project.wheelKnuckle.strutMountLocationMm,
        -project.wheelKnuckle.strutMountAngleDeg,
        project.steeringRack.tieRodLengthMm,
        project.wheelKnuckle.strutMinLengthMm,
        project.wheelKnuckle.strutMaxLengthMm,
      );
      const travelViolation = knucklePoints.strutLengths.reduce((violation, length) =>
        violation +
        Math.max(0, project.wheelKnuckle.strutMinLengthMm - length) +
        Math.max(0, length - project.wheelKnuckle.strutMaxLengthMm), 0);
      return [rotationViolation, travelViolation];
    } catch (error) {
      if (error instanceof Error &&
          [
            "Tie Rod Length cannot be satisfied at the current ball joint position.",
            "Strut angle cannot reach the fixed top mount.",
          ].includes(error.message)) {
        return [rotationViolation, Number.POSITIVE_INFINITY];
      }
      throw error;
    }
  }

  private isNoWorseConstraint(candidate: [number, number], baseline: [number, number]): boolean {
    return candidate[0] <= baseline[0] + 1e-8 && candidate[1] <= baseline[1] + 1e-8;
  }

  private isDragCandidateAllowed(angle: number, index: 0 | 1): boolean {
    if (this.dragRotationRecoverySign !== 0 &&
        Math.abs(angle) > MAX_CONTROL_ARM_DRAG_ANGLE_RAD &&
        Math.sign(angle) !== this.dragRotationRecoverySign) {
      return false;
    }
    return this.isNoWorseConstraint(
      this.dragConstraintViolation(index, angle),
      this.dragAcceptedConstraintViolation,
    );
  }

  private setHoveredBallJoint(index: number | null): void {
    if (this.hoveredBallJointIndex === index) return;
    if (this.hoveredBallJointIndex !== null) {
      const previous = this.ballJoints[this.hoveredBallJointIndex];
      (previous.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
      previous.scale.setScalar(1);
    }
    this.hoveredBallJointIndex = index;
    if (index !== null) {
      const hovered = this.ballJoints[index];
      (hovered.material as THREE.MeshStandardMaterial).emissive.setHex(0x8a3020);
      hovered.scale.setScalar(1.45);
      this.renderer.domElement.style.cursor = "grab";
    } else if (this.draggingBallJointIndex === null) {
      this.renderer.domElement.style.cursor = "grab";
    }
  }

  private setHoveredSteeringRackPivot(index: number | null): void {
    if (this.hoveredSteeringRackPivotIndex === index) return;
    if (this.hoveredSteeringRackPivotIndex !== null) {
      const previous = this.steeringRackPivots[this.hoveredSteeringRackPivotIndex];
      (previous.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
      previous.scale.setScalar(1);
    }
    this.hoveredSteeringRackPivotIndex = index;
    if (index !== null) {
      const hovered = this.steeringRackPivots[index];
      (hovered.material as THREE.MeshStandardMaterial).emissive.setHex(0x8a3020);
      hovered.scale.setScalar(1.45);
      this.renderer.domElement.style.cursor = "grab";
    } else if (this.draggingSteeringRackPivotIndex === null) {
      this.renderer.domElement.style.cursor = "grab";
    }
  }

  private createGroundGrid(): THREE.Group {
    const group = new THREE.Group();
    const grid = new THREE.GridHelper(3000, 30, 0x465659, 0x2a373a);
    grid.rotation.x = Math.PI / 2;
    group.add(grid);

    const centerlineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1500, 0, 1),
      new THREE.Vector3(1500, 0, 1),
    ]);
    group.add(new THREE.Line(
      centerlineGeometry,
      new THREE.LineDashedMaterial({ color: 0x577368, dashSize: 45, gapSize: 30 }),
    ));
    (group.children[group.children.length - 1] as THREE.Line).computeLineDistances();
    return group;
  }

  private createFrame(controlArmDepthMm: number, frontMountHeightMm: number): THREE.LineSegments {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      this.framePoints(controlArmDepthMm, frontMountHeightMm),
    );
    return new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: 0x84b9a2, transparent: true, opacity: 0.8 }),
    );
  }

  private framePoints(controlArmDepthMm: number, frontMountHeightMm: number): THREE.Vector3[] {
    const x0 = -FRAME_HALF_LENGTH, x1 = FRAME_HALF_LENGTH;
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
    ].map(([x, y, height]) => new THREE.Vector3(x, y, height));
    return points;
  }

  private resize(): void {
    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private createCompassAxis(
    direction: [number, number, number],
    name: string,
    color: string,
    axis: string,
  ): CompassAxis {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", `compass-axis compass-axis-${axis}`);
    line.setAttribute("marker-end", `url(#compass-arrow-${axis})`);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", `compass-label compass-label-${axis}`);
    label.setAttribute("fill", color);
    label.textContent = name;
    this.compass.append(line, label);
    return { direction: new THREE.Vector3(...direction), line, label };
  }

  private updateCompass(): void {
    const center = 60;
    const projectedAxes = this.compassAxes.map((axis) => ({
      axis,
      direction: axis.direction.clone().transformDirection(this.camera.matrixWorldInverse),
    })).sort((a, b) => a.direction.z - b.direction.z);

    for (const { axis, direction } of projectedAxes) {
      const x = center + direction.x * 38;
      const y = center - direction.y * 38;
      axis.line.setAttribute("x1", String(center));
      axis.line.setAttribute("y1", String(center));
      axis.line.setAttribute("x2", x.toFixed(1));
      axis.line.setAttribute("y2", y.toFixed(1));
      axis.line.style.opacity = String(0.55 + (direction.z + 1) * 0.22);
      axis.label.setAttribute("x", String(Math.max(8, Math.min(112, x + direction.x * 9))));
      axis.label.setAttribute("y", String(Math.max(12, Math.min(110, y - direction.y * 9 + 3))));
      axis.label.setAttribute("text-anchor", direction.x < -0.25 ? "end" : "start");
    }
  }

  private animate = (): void => {
    this.controls.update();
    this.camera.updateMatrixWorld();
    this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert();
    this.updateCompass();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  };
}
