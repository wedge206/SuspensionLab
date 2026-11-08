import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

export interface SceneRendererState {
    readonly renderer: THREE.WebGLRenderer;
    readonly camera: THREE.PerspectiveCamera;
    readonly controls: OrbitControls;
}

export class SceneRenderer implements SceneRendererState {
    readonly renderer: THREE.WebGLRenderer;
    readonly camera = new THREE.PerspectiveCamera(42, 1, 1, 10000);
    readonly controls: OrbitControls;
    private resizeObserver?: ResizeObserver;
    private animationFrame: number | null = null;
    private disposed = false;
    private started = false;

    constructor(
        private readonly host: HTMLElement,
    ) {
        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x12191c);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.domElement.setAttribute("aria-label", "Interactive 3D chassis frame view");
        host.append(this.renderer.domElement);

        this.camera.up.set(0, 0, 1);
        this.camera.position.set(1800, -2400, 1500);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 280);
        this.controls.enableDamping = true;
        this.renderer.domElement.style.cursor = "default";

    }

    start(scene: THREE.Scene): void {
        if (this.disposed || this.started) return;
        this.started = true;
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.host);
        this.resize();
        this.animate(scene);
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.resizeObserver?.disconnect();
        this.controls.dispose();
        if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
        this.renderer.dispose();
    }

    private resize(): void {
        const width = Math.max(this.host.clientWidth, 1);
        const height = Math.max(this.host.clientHeight, 1);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    private readonly animate = (scene: THREE.Scene): void => {
        if (this.disposed) return;
        this.controls.update();
        this.camera.updateMatrixWorld();
        this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert();
        this.renderer.render(scene, this.camera);
        this.animationFrame = requestAnimationFrame(() => this.animate(scene));
    };
}
