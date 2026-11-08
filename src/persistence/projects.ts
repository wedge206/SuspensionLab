import type { SuspensionProject } from "../domain/types";
import { validateProject } from "../domain/project";
import { DEFAULT_TEMPLATE_KEY } from "../templates/templates";

const STORAGE_KEY = "suspension-lab.projects.v1";
const TEMPLATE_STORAGE_KEY = "suspension-lab.project-templates.v1";

export interface ProjectLibrary {
  projects: SuspensionProject[];
  templateKeys: Record<string, string>;
}

export function loadProjects(): ProjectLibrary {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { projects: [], templateKeys: {} };
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error("Saved project storage is invalid. Export or clear browser storage to recover.");
  const projects = value.map(validateProject);
  const rawTemplateKeys = localStorage.getItem(TEMPLATE_STORAGE_KEY);
  const parsedTemplateKeys: unknown = rawTemplateKeys ? JSON.parse(rawTemplateKeys) : {};
  if (!parsedTemplateKeys || typeof parsedTemplateKeys !== "object" || Array.isArray(parsedTemplateKeys)) {
    throw new Error("Saved project template assignments are invalid. Export or clear browser storage to recover.");
  }
  const templateKeys: Record<string, string> = {};
  for (const [projectId, templateKey] of Object.entries(parsedTemplateKeys)) {
    if (typeof templateKey !== "string") {
      throw new Error("Saved project template assignments are invalid. Export or clear browser storage to recover.");
    }
    templateKeys[projectId] = templateKey;
  }
  for (const project of projects) {
    templateKeys[project.id] ??= DEFAULT_TEMPLATE_KEY;
  }
  return { projects, templateKeys };
}

export function saveProjects(
  projects: SuspensionProject[],
  templateKeys: Record<string, string>,
): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(
    Object.fromEntries(projects.map((project) => [
      project.id,
      templateKeys[project.id] ?? DEFAULT_TEMPLATE_KEY,
    ])),
  ));
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
