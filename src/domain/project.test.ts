import { describe, expect, it } from "vitest";
import { validateProject } from "./project";

describe("chassis project format", () => {
  it("migrates a legacy project to default front pickup dimensions", () => {
    const project = validateProject({
      schemaVersion: 2,
      id: "legacy-id",
      name: "Old suspension",
      geometry: { wheelCenter: [1, 2, 3], armPivotStart: [4, 5, 6] },
      analysis: { bumpLimitMm: 120 },
    });

    expect(project.schemaVersion).toBe(4);
    expect(project.id).toBe("legacy-id");
    expect(project.name).toBe("Old suspension");
    expect(project.frontLowerControlArmPickup).toEqual({ widthMm: 300, heightMm: 250 });
  });

  it("accepts a project with explicit pickup dimensions", () => {
    expect(validateProject({
      schemaVersion: 4,
      id: "blank-id",
      name: "Frame project",
      frontLowerControlArmPickup: { widthMm: 275, heightMm: 210 },
    })).toEqual({
      schemaVersion: 4,
      id: "blank-id",
      name: "Frame project",
      frontLowerControlArmPickup: { widthMm: 275, heightMm: 210 },
    });
  });

  it("rejects malformed or unsupported project files", () => {
    expect(() => validateProject({ schemaVersion: 4, id: "", name: "Frame" })).toThrow("non-empty");
    expect(() => validateProject({ schemaVersion: 99, id: "id", name: "Project" })).toThrow("Unsupported");
    expect(() => validateProject({
      schemaVersion: 4,
      id: "id",
      name: "Frame",
      frontLowerControlArmPickup: { widthMm: 0, heightMm: 250 },
    })).toThrow("positive finite");
  });
});
