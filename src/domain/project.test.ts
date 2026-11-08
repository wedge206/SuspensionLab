import {describe, expect, it} from "vitest";
import defaultTemplate from "../templates/default.json";
import {createProjectFromTemplate} from "../templates/templates";
import {allProjectFields, getFieldValue, isValidFieldValue, projectFields} from "./fields";
import {validateProject} from "./project";

describe("project field contract", () => {
    it("keeps the default JSON and field registry in exact agreement", () => {
        const defaults: Record<string, unknown> = defaultTemplate;
        expect(Object.keys(defaults).sort()).toEqual(["id", "name", ...Object.keys(projectFields)].sort());
        for (const [section, fields] of Object.entries(projectFields)) {
            expect(Object.keys(defaults[section] as object).sort()).toEqual(Object.keys(fields).sort());
        }
        expect(validateProject(defaultTemplate)).toEqual(defaultTemplate);
    });

    it.each(allProjectFields)("uses the current default when $section.$key is missing", (field) => {
        const source = structuredClone(defaultTemplate);
        const section = source[field.section] as Record<string, unknown>;
        delete section[field.key];
        expect(getFieldValue(validateProject(source), field)).toBe(getFieldValue(defaultTemplate, field));
    });

    it.each(Object.keys(projectFields))("fills missing section %s with current defaults", (section) => {
        const source: Record<string, unknown> = structuredClone(defaultTemplate);
        delete source[section];
        expect(validateProject(source)[section as keyof typeof projectFields])
            .toEqual(defaultTemplate[section as keyof typeof projectFields]);
        for (const invalid of [null, 0, "section", []]) {
            expect(() => validateProject({...source, [section]: invalid})).toThrow("must be an object");
        }
    });

    it.each(allProjectFields)("validates $section.$key against its constraint", (field) => {
        const constraint = field.definition.constraint;
        for (const invalid of [NaN, Infinity, -Infinity, null, "1", false, {}]) {
            const source = structuredClone(defaultTemplate);
            (source[field.section] as Record<string, unknown>)[field.key] = invalid;
            expect(() => validateProject(source)).toThrow("finite");
        }
        for (const number of [-1, 0, 0.5]) {
            const expected = constraint === "finite" || (constraint === "positive" ? number > 0 : number >= 0);
            expect(isValidFieldValue(number, constraint)).toBe(expected);
        }
        for (const number of [-1, 0, field.key === "strutMaxLengthMm" ? 651 : 0.5]) {
            const source = structuredClone(defaultTemplate);
            (source[field.section] as Record<string, unknown>)[field.key] = number;
            if (isValidFieldValue(number, constraint)) {
                expect(getFieldValue(validateProject(source), field)).toBe(number);
            } else {
                expect(() => validateProject(source)).toThrow("finite");
            }
        }
    });

    it("requires nonempty identity and rejects malformed roots", () => {
        for (const value of [null, [], 1, "project"]) {
            expect(() => validateProject(value)).toThrow("JSON object");
        }
        for (const name of ["", " ", null, 42]) {
            expect(() => validateProject({...defaultTemplate, name})).toThrow("non-empty id and name");
            expect(() => validateProject({...defaultTemplate, id: name})).toThrow("non-empty id and name");
        }
    });

    it("retains saved values and fills missing rear offsets without reconstructing rotations", () => {
        const project = createProjectFromTemplate("default", "Project", "project-id");
        project.rearSuspension.leftRotationRad = 0.4;
        project.rearSuspension.rightRotationRad = -0.3;
        const {leftVerticalOffsetMm: _left, rightVerticalOffsetMm: _right, ...rearSuspension} = project.rearSuspension;
        const loaded = validateProject({...project, rearSuspension});
        expect(loaded.rearSuspension).toMatchObject({
            leftRotationRad: 0.4, rightRotationRad: -0.3, leftVerticalOffsetMm: 0, rightVerticalOffsetMm: 0,
        });
    });

    it("rejects a negative strut mount angle rather than normalizing it", () => {
        expect(() => validateProject({
            ...defaultTemplate, wheelKnuckle: {...defaultTemplate.wheelKnuckle, strutMountAngleDeg: -20},
        })).toThrow("Strut Mount Angle must be a non-negative finite number.");
    });

    it("rejects reversed strut limits and out-of-range rack travel", () => {
        expect(() => validateProject({
            ...defaultTemplate, wheelKnuckle: {...defaultTemplate.wheelKnuckle, strutMinLengthMm: 650},
        })).toThrow("Minimum strut length");
        expect(() => validateProject({
            ...defaultTemplate, steeringRack: {...defaultTemplate.steeringRack, rackTravelMm: 166},
        })).toThrow("Rack travel");
        expect(validateProject({
            ...defaultTemplate, steeringRack: {...defaultTemplate.steeringRack, rackTravelMm: 165},
        }).steeringRack.rackTravelMm).toBe(165);
    });
});
