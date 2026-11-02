import { describe, expect, it } from "vitest";
import { frontLowerControlArmPoints } from "./coordinates";

describe("front lower control arm pickup points", () => {
  it("places one point on each side with a total spacing of twice the width", () => {
    const [left, right] = frontLowerControlArmPoints(325, 240);
    expect(left).toEqual([650, 325, 240]);
    expect(right).toEqual([650, -325, 240]);
    expect(left[1] - right[1]).toBe(650);
    expect(left[2]).toBe(right[2]);
  });
});
