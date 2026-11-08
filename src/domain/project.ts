import defaultTemplate from "../templates/default.json";
import {steeringRackTravelLimitMm} from "./coordinates";
import {allProjectFields, isValidFieldValue, projectFields} from "./fields";
import type {SuspensionProject} from "./types";

const defaults: SuspensionProject = defaultTemplate;

export function validateProject(value: unknown): SuspensionProject {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Project file must contain a JSON object.");
    }
    const source = value as Record<string, unknown>;
    if (typeof source.id !== "string" || typeof source.name !== "string" ||
        !source.id.trim() || !source.name.trim()) {
        throw new Error("Project needs a non-empty id and name.");
    }

    const project = structuredClone(defaults);
    project.id = source.id;
    project.name = source.name;
    for (const section of Object.keys(projectFields)) {
        const inputSection = source[section];
        if (inputSection !== undefined &&
            (!inputSection || typeof inputSection !== "object" || Array.isArray(inputSection))) {
            throw new Error(`Project section ${section} must be an object.`);
        }
    }
    for (const {section, key, definition} of allProjectFields) {
        const inputSection = source[section] as Record<string, unknown> | undefined;
        const candidate = inputSection?.[key] === undefined
            ? (defaults[section] as Record<string, number>)[key]
            : inputSection[key];
        if (!isValidFieldValue(candidate, definition.constraint)) {
            const description = definition.constraint === "finite" ? "a finite"
                : definition.constraint === "positive" ? "a positive finite" : "a non-negative finite";
            throw new Error(`${definition.ui?.label ?? `${section}.${key}`} must be ${description} number.`);
        }
        (project[section] as Record<string, number>)[key] = candidate;
    }
    const {strutMinLengthMm, strutMaxLengthMm} = project.wheelKnuckle;
    if (strutMinLengthMm >= strutMaxLengthMm) {
        throw new Error("Minimum strut length must be below maximum strut length.");
    }
    const {widthMm, housingWidthMm, steeringLimiterMm, rackTravelMm} = project.steeringRack;
    if (Math.abs(rackTravelMm) > steeringRackTravelLimitMm(widthMm, housingWidthMm, steeringLimiterMm) + 1e-8) {
        throw new Error("Rack travel exceeds the steering rack travel limit.");
    }
    return project;
}
