import type { SuspensionProject } from "./types";

export const DEFAULT_PICKUP_WIDTH_MM = 300;
export const DEFAULT_PICKUP_HEIGHT_MM = 250;

export function validateProject(value: unknown): SuspensionProject {
  if (!value || typeof value !== "object") {
    throw new Error("Project file must contain a JSON object.");
  }
  const project = value as Record<string, unknown>;
  if (![1, 2, 3, 4].includes(project.schemaVersion as number)) {
    throw new Error(`Unsupported project schema version: ${String(project.schemaVersion)}.`);
  }
  if (typeof project.id !== "string" || typeof project.name !== "string" ||
      !project.id.trim() || !project.name.trim()) {
    throw new Error("Project needs a non-empty id and name.");
  }
  const isLegacy = project.schemaVersion !== 4;
  const pickup = project.frontLowerControlArmPickup;
  if (!isLegacy && (!pickup || typeof pickup !== "object")) {
    throw new Error("Project is missing front lower control arm pickup dimensions.");
  }
  const pickupDimensions = pickup && typeof pickup === "object"
    ? pickup as Record<string, unknown>
    : {};
  const widthMm: unknown = isLegacy ? DEFAULT_PICKUP_WIDTH_MM : pickupDimensions.widthMm;
  const heightMm: unknown = isLegacy ? DEFAULT_PICKUP_HEIGHT_MM : pickupDimensions.heightMm;
  if (typeof widthMm !== "number" || !Number.isFinite(widthMm) || widthMm <= 0 ||
      typeof heightMm !== "number" || !Number.isFinite(heightMm) || heightMm <= 0) {
    throw new Error("Front lower control arm pickup width and height must be positive finite values.");
  }
  return {
    schemaVersion: 4,
    id: project.id,
    name: project.name,
    frontLowerControlArmPickup: { widthMm, heightMm },
  };
}
