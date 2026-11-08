import { afterEach, describe, expect, it, vi } from "vitest";
import { createProjectFromTemplate, DEFAULT_TEMPLATE_KEY } from "../templates/templates";
import { SceneGeometryBuilder } from "./SceneGeometryBuilder";
import { calculateGroundStations, solveSuspension } from "../domain/kinematics";

describe("viewer kinematics behavior", () => {
  afterEach(() => vi.unstubAllGlobals());

  function makeBuilder() {
    const context = new Proxy({}, { get: () => () => {} });
    vi.stubGlobal("document", {
      createElement: (tag: string) => tag === "canvas"
        ? { width: 0, height: 0, getContext: () => context }
        : { className: "", hidden: false, textContent: "", setAttribute: () => {} },
    });
    const notices = vi.fn();
    const alignment = vi.fn();
    return { builder: new SceneGeometryBuilder(notices, alignment), notices, alignment };
  }

  it("renders default and changed projects and reports invalid solutions independently", () => {
    const { builder, notices, alignment } = makeBuilder();
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
});
