import type { SuspensionProject } from "../domain/types";
import { validateProject } from "../domain/project";

const STORAGE_KEY = "suspension-lab.projects.v1";

export interface ProjectLibrary {
  projects: SuspensionProject[];
}

export function loadProjects(): ProjectLibrary {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { projects: [] };
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error("Saved project storage is invalid. Export or clear browser storage to recover.");
  const projects = value.map(validateProject);
  return { projects };
}

export function saveProjects(projects: SuspensionProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function downloadProject(project: SuspensionProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${project.name.trim().replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "suspension-project"}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function readProjectFile(file: File): Promise<SuspensionProject> {
  const text = await file.text();
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  return validateProject(value);
}
