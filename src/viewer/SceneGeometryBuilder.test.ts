import { describe, expect, it } from "vitest";
import { SceneGeometryBuilder } from "./SceneGeometryBuilder";

describe("SceneGeometryBuilder", () => {
  it("creates the chassis frame points at the requested stations", () => {
    const builder = Object.create(SceneGeometryBuilder.prototype) as SceneGeometryBuilder;
    const points = builder.framePoints(120, 310, [-700, -640]);

    expect(points).toHaveLength(18);
    expect(points[0].toArray()).toEqual([-900, -430, 310]);
    expect(points[1].toArray()).toEqual([850, -430, 310]);
    expect(points[14].toArray()).toEqual([-700, -430, 310]);
    expect(points[16].toArray()).toEqual([-640, -430, 310]);
  });
});
