import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { SceneInteractionController } from "./SceneInteractionController";
import type { SceneInteractionContext } from "./SceneInteractionController";

describe("SceneInteractionController", () => {
  it("forwards pointer events and removes listeners on disposal", () => {
    const canvas = Object.assign(new EventTarget(), {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    }) as HTMLCanvasElement;
    const getProject = vi.fn(() => undefined);
    const context: SceneInteractionContext = {
      camera: new THREE.PerspectiveCamera(),
      controls: { enabled: true },
      pickups: [],
      ballJoints: [],
      steeringRackPivots: [],
      rearMainArmOuterMounts: [],
      onProjectChange: vi.fn(),
      update: vi.fn(),
      getProject,
    };
    const controller = new SceneInteractionController(canvas, context);

    canvas.dispatchEvent(new Event("pointerdown"));
    expect(getProject).toHaveBeenCalledTimes(1);

    controller.dispose();
    controller.dispose();
    canvas.dispatchEvent(new Event("pointerdown"));
    expect(getProject).toHaveBeenCalledTimes(1);
  });
});
