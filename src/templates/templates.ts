import { validateProject } from "../domain/project";
import { withStaticStrutLength } from "../domain/coordinates";
import type { SuspensionProject } from "../domain/types";

export const DEFAULT_TEMPLATE_KEY = "default";

export interface ProjectTemplate {
  key: string;
  name: string;
  project: SuspensionProject;
}

const templateModules = import.meta.glob<unknown>("./*.json", {
  eager: true,
  import: "default",
});

const builtInTemplates: ProjectTemplate[] = Object.entries(templateModules)
  .map(([path, value]) => {
    const key = path.slice(2, -".json".length);
    const project = validateProject(value);
    return { key, name: project.name, project };
  })
  .sort((left, right) => left.name.localeCompare(right.name));

if (!builtInTemplates.some((template) => template.key === DEFAULT_TEMPLATE_KEY)) {
  throw new Error(`The required "${DEFAULT_TEMPLATE_KEY}" project template is missing.`);
}

export function listProjectTemplates(): Pick<ProjectTemplate, "key" | "name">[] {
  return builtInTemplates.map(({ key, name }) => ({ key, name }));
}

function getProjectTemplate(key: string): ProjectTemplate {
  const template = builtInTemplates.find((candidate) => candidate.key === key);
  if (!template) {
    throw new Error(`Unknown project template: "${key}".`);
  }
  return template;
}

export function createProjectFromTemplate(
  key: string,
  name: string,
  id: string = crypto.randomUUID(),
): SuspensionProject {
  const template = getProjectTemplate(key);
  return withStaticStrutLength({ ...structuredClone(template.project), id, name });
}

export function resetProjectToTemplate(
  project: SuspensionProject,
  key: string,
): SuspensionProject {
  const template = getProjectTemplate(key);
  const reset = { ...structuredClone(template.project), id: project.id, name: project.name };
  reset.wheelKnuckle.strutStaticLengthMm = project.wheelKnuckle.strutStaticLengthMm;
  return withStaticStrutLength(reset);
}
