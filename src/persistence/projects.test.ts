import {afterEach, describe, expect, it, vi} from "vitest";
import {createProjectFromTemplate} from "../templates/templates";
import {CORRUPT_BACKUP_KEY, loadProjects, readProjectFile, saveProjects} from "./projects";

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

        expect(loadProjects().templateKeys).toEqual({"project-id": "default"});
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
        project.rearSuspension.leftRotationRad = 0.4;
        project.rearSuspension.rightRotationRad = -0.3;

        saveProjects([project], {"project-id": "default"});

        expect(JSON.parse(storage.get(PROJECTS_KEY)!)).toEqual([project]);
        expect(JSON.parse(storage.get(TEMPLATE_KEYS_KEY)!)).toEqual({"project-id": "default"});
        expect(loadProjects().projects[0].rearSuspension.mainArmInnerMountHeightMm).toBe(315);
        expect(loadProjects().projects[0].rearSuspension.frontToRearLengthMm).toBe(1800);
        expect(loadProjects().projects[0].rearSuspension).toMatchObject({
            toeArmInnerMountWidthMm: 910, toeArmInnerMountHeightMm: 310, toeArmMainArmWidthMm: 210,
            leftRotationRad: 0.4, rightRotationRad: -0.3,
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
            rearSuspension: {mainArmInnerMountWidthMm: 750},
        }]));

        expect(loadProjects().projects[0].rearSuspension.mainArmInnerMountHeightMm).toBe(250);
        expect(loadProjects().projects[0].rearSuspension.frontToRearLengthMm).toBe(1900);
        expect(loadProjects().projects[0].rearSuspension).toMatchObject({
            toeArmInnerMountWidthMm: 685, toeArmInnerMountHeightMm: 260, toeArmMainArmWidthMm: 201,
        });
    });

    it("keeps invalid saved projects in storage instead of discarding the library", () => {
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
        });
        const good = createProjectFromTemplate("default", "Good", "good-id");
        const bad = {...createProjectFromTemplate("default", "Broken", "bad-id"), steeringRack: {widthMm: -1}};
        storage.set(PROJECTS_KEY, JSON.stringify([good, bad]));
        storage.set(TEMPLATE_KEYS_KEY, JSON.stringify({"good-id": "default", "bad-id": "default"}));

        const loaded = loadProjects();
        expect(loaded.projects.map((project) => project.id)).toEqual(["good-id"]);
        expect(loaded.unreadable).toEqual([bad]);
        expect(loaded.warning).toContain('"Broken"');

        saveProjects(loaded.projects, loaded.templateKeys, loaded.unreadable);
        expect(JSON.parse(storage.get(PROJECTS_KEY)!)).toEqual([good, bad]);
        expect(JSON.parse(storage.get(TEMPLATE_KEYS_KEY)!)).toEqual({"good-id": "default", "bad-id": "default"});
    });

    it("preserves saved projects with a negative strut angle as unreadable", () => {
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
        });
        const bad = createProjectFromTemplate("default", "Negative angle", "negative-angle");
        bad.wheelKnuckle.strutMountAngleDeg = -20;
        storage.set(PROJECTS_KEY, JSON.stringify([bad]));
        const loaded = loadProjects();
        expect(loaded.projects).toEqual([]);
        expect(loaded.unreadable).toEqual([bad]);
        expect(loaded.warning).toContain("Strut Mount Angle");
        saveProjects(loaded.projects, loaded.templateKeys, loaded.unreadable);
        expect(JSON.parse(storage.get(PROJECTS_KEY)!)).toEqual([bad]);
    });

    it("backs up unparseable storage before reporting it", () => {
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
        });
        storage.set(PROJECTS_KEY, "{not json");

        expect(() => loadProjects()).toThrow(CORRUPT_BACKUP_KEY);
        expect(storage.get(CORRUPT_BACKUP_KEY)).toBe("{not json");
    });

    it("ignores invalid template assignments instead of failing the load", () => {
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
        });
        storage.set(PROJECTS_KEY, JSON.stringify([createProjectFromTemplate("default", "Project", "project-id")]));
        storage.set(TEMPLATE_KEYS_KEY, "[1, 2]");

        const loaded = loadProjects();
        expect(loaded.projects).toHaveLength(1);
        expect(loaded.templateKeys).toEqual({"project-id": "default"});
    });

    it("imports projects without a rear main arm inner mount height", async () => {
        const project = createProjectFromTemplate("default", "Project", "project-id");
        const text = JSON.stringify({
            ...project,
            rearSuspension: {mainArmInnerMountWidthMm: 750},
        });
        const file = {text: async () => text} as File;

        expect((await readProjectFile(file)).rearSuspension.mainArmInnerMountHeightMm).toBe(250);
        expect((await readProjectFile(file)).rearSuspension.frontToRearLengthMm).toBe(1900);
        expect((await readProjectFile(file)).rearSuspension).toMatchObject({
            toeArmInnerMountWidthMm: 685, toeArmInnerMountHeightMm: 260, toeArmMainArmWidthMm: 201,
        });
    });
});
