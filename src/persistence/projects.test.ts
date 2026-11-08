import { afterEach, describe, expect, it, vi } from "vitest";
import { createProjectFromTemplate } from "../templates/templates";
import { loadProjects, saveProjects } from "./projects";

const PROJECTS_KEY = "suspension-lab.projects.v1";
const TEMPLATE_KEYS_KEY = "suspension-lab.project-templates.v1";
const storage = new Map<string, string>();

describe("project template assignments", () => {
  afterEach(() => {
    storage.clear();
    vi.unstubAllGlobals();
  });

  it("uses the Default template for saved projects without provenance", () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    storage.set(PROJECTS_KEY, JSON.stringify([createProjectFromTemplate("default", "project-id")]));

    expect(loadProjects().templateKeys).toEqual({ "project-id": "default" });
  });

  it("persists template assignments separately from project JSON", () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    const project = createProjectFromTemplate("default", "project-id");

    saveProjects([project], { "project-id": "default" });

    expect(JSON.parse(storage.get(PROJECTS_KEY)!)).toEqual([project]);
    expect(JSON.parse(storage.get(TEMPLATE_KEYS_KEY)!)).toEqual({ "project-id": "default" });
  });
});
