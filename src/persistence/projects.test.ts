import { afterEach, describe, expect, it, vi } from "vitest";
import { createProjectFromTemplate } from "../templates/templates";
import { loadProjects, readProjectFile, saveProjects } from "./projects";

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
    storage.set(PROJECTS_KEY, JSON.stringify([createProjectFromTemplate("default", "Project", "project-id")]));

    expect(loadProjects().templateKeys).toEqual({ "project-id": "default" });
  });

  it("persists template assignments separately from project JSON", () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    const project = createProjectFromTemplate("default", "Project", "project-id");
    project.rearSuspension.mainArmInnerMountHeightMm = 315;
    project.rearSuspension.frontToRearLengthMm = 1800;
    project.rearSuspension.toeArmInnerMountWidthMm = 910;
    project.rearSuspension.toeArmInnerMountHeightMm = 310;
    project.rearSuspension.toeArmMainArmWidthMm = 210;

    saveProjects([project], { "project-id": "default" });

    expect(JSON.parse(storage.get(PROJECTS_KEY)!)).toEqual([project]);
    expect(JSON.parse(storage.get(TEMPLATE_KEYS_KEY)!)).toEqual({ "project-id": "default" });
    expect(loadProjects().projects[0].rearSuspension.mainArmInnerMountHeightMm).toBe(315);
    expect(loadProjects().projects[0].rearSuspension.frontToRearLengthMm).toBe(1800);
    expect(loadProjects().projects[0].rearSuspension).toMatchObject({
      toeArmInnerMountWidthMm: 910, toeArmInnerMountHeightMm: 310, toeArmMainArmWidthMm: 210,
    });
  });

  it("loads saved projects without a rear main arm inner mount height", () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    const project = createProjectFromTemplate("default", "Project", "project-id");
    storage.set(PROJECTS_KEY, JSON.stringify([{
      ...project,
      rearSuspension: { mainArmInnerMountWidthMm: 750 },
    }]));

    expect(loadProjects().projects[0].rearSuspension.mainArmInnerMountHeightMm).toBe(250);
    expect(loadProjects().projects[0].rearSuspension.frontToRearLengthMm).toBe(1600);
    expect(loadProjects().projects[0].rearSuspension).toMatchObject({
      toeArmInnerMountWidthMm: 850, toeArmInnerMountHeightMm: 250, toeArmMainArmWidthMm: 190,
    });
  });

  it("imports projects without a rear main arm inner mount height", async () => {
    const project = createProjectFromTemplate("default", "Project", "project-id");
    const text = JSON.stringify({
      ...project,
      rearSuspension: { mainArmInnerMountWidthMm: 750 },
    });
    const file = { text: async () => text } as File;

    expect((await readProjectFile(file)).rearSuspension.mainArmInnerMountHeightMm).toBe(250);
    expect((await readProjectFile(file)).rearSuspension.frontToRearLengthMm).toBe(1600);
    expect((await readProjectFile(file)).rearSuspension).toMatchObject({
      toeArmInnerMountWidthMm: 850, toeArmInnerMountHeightMm: 250, toeArmMainArmWidthMm: 190,
    });
  });
});
