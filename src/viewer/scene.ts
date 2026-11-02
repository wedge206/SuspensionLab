import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FRONT_PICKUP_STATION_MM, frontLowerControlArmPoints } from "../domain/coordinates";
import type { SuspensionProject } from "../domain/types";

const FRAME_HALF_LENGTH = 850;
const FRAME_HALF_WIDTH = 430;
const FRAME_HEIGHT = 420;

export class ChassisScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 1, 10000);
  private readonly controls: OrbitControls;
  private readonly pickups = [
    new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe4ab61, roughness: 0.4 })),
    new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe4ab61, roughness: 0.4 })),
  ];
  private readonly resizeObserver: ResizeObserver;

  constructor(private readonly host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x12191c);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute("aria-label", "Interactive 3D chassis frame view");
    host.append(this.renderer.domElement);
    this.scene.background = new THREE.Color(0x12191c);
    this.scene.add(new THREE.HemisphereLight(0xe4f0e9, 0x263336, 2.2));

    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(900, -800, 1400);
    this.scene.add(key);

    this.scene.add(this.createGroundGrid());
    this.scene.add(this.createFrame());
    this.scene.add(...this.pickups);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(1800, -2400, 1500);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 280);
    this.controls.enableDamping = true;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.animate();
  }

  update(project: SuspensionProject): void {
    const { widthMm, heightMm } = project.frontLowerControlArmPickup;
    const [left, right] = frontLowerControlArmPoints(widthMm, heightMm);
    this.pickups[0].position.set(...left);
    this.pickups[1].position.set(...right);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    for (const pickup of this.pickups) {
      pickup.geometry.dispose();
      pickup.material.dispose();
    }
    this.host.replaceChildren();
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

  private createFrame(): THREE.LineSegments {
    const x0 = -FRAME_HALF_LENGTH, x1 = FRAME_HALF_LENGTH;
    const y0 = -FRAME_HALF_WIDTH, y1 = FRAME_HALF_WIDTH;
    const z = FRAME_HEIGHT;
    const points = [
      [x0, y0, z], [x1, y0, z],
      [x1, y0, z], [x1, y1, z],
      [x1, y1, z], [x0, y1, z],
      [x0, y1, z], [x0, y0, z],
      [0, y0, z], [0, y1, z],
      [FRONT_PICKUP_STATION_MM, y0, z], [FRONT_PICKUP_STATION_MM, y1, z],
    ].map(([x, y, height]) => new THREE.Vector3(x, y, height));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: 0x84b9a2, transparent: true, opacity: 0.8 }),
    );
  }

  private resize(): void {
    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private animate = (): void => {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  };
}
