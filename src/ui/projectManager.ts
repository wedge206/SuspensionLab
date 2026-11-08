import type { SuspensionProject } from "../domain/types";
import { downloadProject, loadProjects, readProjectFile, saveProjects } from "../persistence/projects";
import { createProjectFromTemplate, DEFAULT_TEMPLATE_KEY, listProjectTemplates, resetProjectToTemplate } from "../templates/templates";
import type { UiElements } from "./elements";
import type { UiRenderers } from "./renderers";

export function loadProjectState() {
  let projects: SuspensionProject[] = [];
  let projectTemplateKeys: Record<string, string> = {};
  let unreadableProjects: unknown[] = [];
  let current: SuspensionProject;
  let initialNotice = "";

  try {
    const loaded = loadProjects();
    projects = loaded.projects;
    projectTemplateKeys = loaded.templateKeys;
    unreadableProjects = loaded.unreadable;
    initialNotice = loaded.warning;
    const knownTemplateKeys = new Set(listProjectTemplates().map((template) => template.key));
    for (const project of projects) {
      if (!knownTemplateKeys.has(projectTemplateKeys[project.id])) {
        projectTemplateKeys[project.id] = DEFAULT_TEMPLATE_KEY;
      }
    }
    if (!projects.length) {
      current = createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "New suspension project");
      projects = [current];
      projectTemplateKeys[current.id] = DEFAULT_TEMPLATE_KEY;
      saveProjects(projects, projectTemplateKeys, unreadableProjects);
    } else {
      current = projects[0];
    }
  } catch (error) {
    current = createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "New suspension project");
    projects = [current];
    projectTemplateKeys = { [current.id]: DEFAULT_TEMPLATE_KEY };
    unreadableProjects = [];
    initialNotice = error instanceof Error ? error.message : "Could not load saved projects.";
  }

  return { projects, projectTemplateKeys, unreadableProjects, current, initialNotice };
}

export type ProjectState = ReturnType<typeof loadProjectState>;

export function bindProjectManager(state: ProjectState, elements: UiElements, renderers: UiRenderers) {
  const { showNotice, renderProjectSelect, renderGeometry } = renderers;
  const { projectSelect, templateDialog, templateSelect, projectNameInput, createProjectButton } = elements;
  function persist(): void {
    state.projects = state.projects.map((project) => project.id === state.current.id ? state.current : project);
    saveProjects(state.projects, state.projectTemplateKeys, state.unreadableProjects);
  }

  function persistOrNotify(): boolean {
    try {
      persist();
      return true;
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not save this project.", "error");
      return false;
    }
  }

  function selectProject(id: string): void {
    const next = state.projects.find((project) => project.id === id);
    if (!next) return;
    state.current = next;
    renderProjectSelect();
    renderGeometry();
  }


  for (const template of listProjectTemplates()) {
    const option = document.createElement("option");
    option.value = template.key;
    option.textContent = template.name;
    templateSelect.append(option);
  }
  templateSelect.value = DEFAULT_TEMPLATE_KEY;
  projectNameInput.addEventListener("input", () => {
    createProjectButton.disabled = (projectNameInput.value.match(/\S/g)?.length ?? 0) < 2;
  });

  projectSelect.addEventListener("change", () => selectProject(projectSelect.value));

  document.querySelector<HTMLButtonElement>("#reset-project")!.addEventListener("click", () => {
    try {
      state.current = resetProjectToTemplate(
        state.current,
        state.projectTemplateKeys[state.current.id] ?? DEFAULT_TEMPLATE_KEY,
      );
      renderGeometry();
      if (persistOrNotify()) showNotice("Project reset to template values, preserving Strut Static Length.");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not reset the project.", "error");
    }
  });

  document.querySelector<HTMLButtonElement>("#new-project")!.addEventListener("click", () => {
    projectNameInput.value = "";
    createProjectButton.disabled = true;
    templateDialog.showModal();
    projectNameInput.focus();
  });

  document.querySelector<HTMLButtonElement>("#cancel-template")!.addEventListener("click", () => {
    templateDialog.close();
  });

  document.querySelector<HTMLFormElement>("#template-form")!.addEventListener("submit", (event) => {
    event.preventDefault();
    const templateKey = templateSelect.value;
    const projectName = projectNameInput.value.trim();
    if ((projectName.match(/\S/g)?.length ?? 0) < 2) {
      createProjectButton.disabled = true;
      projectNameInput.focus();
      return;
    }
    try {
      state.current = createProjectFromTemplate(templateKey, projectName);
      state.projects.push(state.current);
      state.projectTemplateKeys[state.current.id] = templateKey;
      renderProjectSelect();
      renderGeometry();
      if (persistOrNotify()) showNotice(`Created project "${state.current.name}".`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not create a project from this template.", "error");
    } finally {
      templateDialog.close();
    }
  });

  document.querySelector<HTMLButtonElement>("#rename-project")!.addEventListener("click", () => {
    const name = window.prompt("Project name", state.current.name)?.trim();
    if (!name) return;
    state.current.name = name;
    renderProjectSelect();
    try {
      persist();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not save this project.", "error");
    }
  });

  document.querySelector<HTMLButtonElement>("#duplicate-project")!.addEventListener("click", () => {
    const templateKey = state.projectTemplateKeys[state.current.id] ?? DEFAULT_TEMPLATE_KEY;
    state.current = { ...structuredClone(state.current), id: crypto.randomUUID(), name: `${state.current.name} copy` };
    state.projects.push(state.current);
    state.projectTemplateKeys[state.current.id] = templateKey;
    renderProjectSelect();
    renderGeometry();
    persistOrNotify();
  });

  document.querySelector<HTMLButtonElement>("#delete-project")!.addEventListener("click", () => {
    if (state.projects.length < 2) {
      showNotice("Keep at least one project in the browser library.", "error");
      return;
    }
    if (!window.confirm(`Delete "${state.current.name}" from this browser?`)) return;
    state.projects = state.projects.filter((project) => project.id !== state.current.id);
    delete state.projectTemplateKeys[state.current.id];
    state.current = state.projects[0];
    renderProjectSelect();
    renderGeometry();
    try {
      saveProjects(state.projects, state.projectTemplateKeys, state.unreadableProjects);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not save the project library.", "error");
    }
  });

  document.querySelector<HTMLButtonElement>("#export-project")!.addEventListener("click", () => downloadProject(state.current));
  document.querySelector<HTMLButtonElement>("#import-project")!.addEventListener("click", () =>
    document.querySelector<HTMLInputElement>("#import-file")!.click());
  document.querySelector<HTMLInputElement>("#import-file")!.addEventListener("change", async (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      state.current = await readProjectFile(file);
      state.current.id = crypto.randomUUID();
      state.projects.push(state.current);
      state.projectTemplateKeys[state.current.id] = DEFAULT_TEMPLATE_KEY;
      renderProjectSelect();
      renderGeometry();
      if (persistOrNotify()) showNotice(`Imported project "${state.current.name}".`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not import this project.", "error");
    } finally {
      input.value = "";
    }
  });


  return { persistOrNotify };
}
