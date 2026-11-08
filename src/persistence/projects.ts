import type {SuspensionProject} from "../domain/types";
import {validateProject} from "../domain/project";
import {DEFAULT_TEMPLATE_KEY} from "../templates/templates";

const STORAGE_KEY = "suspension-lab.projects.v1";
const TEMPLATE_STORAGE_KEY = "suspension-lab.project-templates.v1";
export const CORRUPT_BACKUP_KEY = `${STORAGE_KEY}.corrupt-backup`;

export interface ProjectLibrary {
    projects: SuspensionProject[];
    templateKeys: Record<string, string>;
    /** Saved entries that failed validation. They are written back unchanged on save so they are never lost. */
    unreadable: unknown[];
    /** Human-readable description of anything that could not be loaded, or "" if everything loaded. */
    warning: string;
}

export function loadProjects(): ProjectLibrary {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {projects: [], templateKeys: {}, unreadable: [], warning: ""};
    let value: unknown;
    try {
        value = JSON.parse(raw);
    } catch {
        value = undefined;
    }
    if (!Array.isArray(value)) {
        // Preserve the unreadable data before the app replaces it with a fresh library.
        localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
        throw new Error(
            `Saved project storage is invalid. Its contents were backed up to the "${CORRUPT_BACKUP_KEY}" storage key.`,
        );
    }
    const projects: SuspensionProject[] = [];
    const unreadable: unknown[] = [];
    const failures: string[] = [];
    for (const entry of value) {
        try {
            projects.push(validateProject(entry));
        } catch (error) {
            unreadable.push(entry);
            const name = entry && typeof entry === "object" && typeof (entry as { name?: unknown }).name === "string"
                ? `"${(entry as { name: string }).name}"`
                : "An unnamed project";
            failures.push(`${name}: ${error instanceof Error ? error.message : "invalid project"}`);
        }
    }
    const templateKeys = loadTemplateKeys();
    for (const project of projects) {
        templateKeys[project.id] ??= DEFAULT_TEMPLATE_KEY;
    }
    const warning = failures.length
        ? `${failures.length} saved project${failures.length === 1 ? "" : "s"} could not be loaded and ${
            failures.length === 1 ? "was" : "were"} kept in storage unchanged. ${failures.join(" ")}`
        : "";
    return {projects, templateKeys, unreadable, warning};
}

function loadTemplateKeys(): Record<string, string> {
    // Template assignments only affect Reset, so bad data here falls back to the default template
    // instead of blocking the project library from loading.
    const templateKeys: Record<string, string> = {};
    let parsed: unknown;
    try {
        parsed = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) ?? "{}");
    } catch {
        return templateKeys;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return templateKeys;
    for (const [projectId, templateKey] of Object.entries(parsed)) {
        if (typeof templateKey === "string") templateKeys[projectId] = templateKey;
    }
    return templateKeys;
}

export function saveProjects(
    projects: SuspensionProject[],
    templateKeys: Record<string, string>,
    unreadable: unknown[] = [],
): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...projects, ...unreadable]));
    const unreadableIds = unreadable.flatMap((entry) => {
        const id = entry && typeof entry === "object" ? (entry as { id?: unknown }).id : undefined;
        return typeof id === "string" && templateKeys[id] !== undefined ? [[id, templateKeys[id]]] : [];
    });
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(Object.fromEntries([
        ...unreadableIds,
        ...projects.map((project) => [project.id, templateKeys[project.id] ?? DEFAULT_TEMPLATE_KEY]),
    ])));
}

export function downloadProject(project: SuspensionProject): void {
    const blob = new Blob([JSON.stringify(project, null, 2)], {type: "application/json"});
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
