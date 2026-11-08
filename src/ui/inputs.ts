import {steeringRackTravelLimitMm, withStaticStrutLength} from "../domain/coordinates";
import {allProjectFields, isValidFieldValue, setFieldValue} from "../domain/fields";
import type {UiElements} from "./elements";
import type {ProjectState} from "./projectManager";
import type {UiRenderers} from "./renderers";

export function bindInputs(state: ProjectState, elements: UiElements, renderers: UiRenderers, persistOrNotify: () => boolean): void {
    const {showNotice, renderGeometry} = renderers;
    for (const field of allProjectFields) {
        const ui = field.definition.ui;
        if (!ui) continue;
        const input = elements.parameterInputs[ui.id];
        input.addEventListener("change", () => {
            const value = Number(input.value);
            const {constraint} = field.definition;
            const knuckle = state.current.wheelKnuckle;
            const isMax = field.section === "wheelKnuckle" && field.key === "strutMaxLengthMm";
            const isMin = field.section === "wheelKnuckle" && field.key === "strutMinLengthMm";
            const orderValid = (!isMax || value > knuckle.strutMinLengthMm) &&
                (!isMin || value < knuckle.strutMaxLengthMm);
            if (!isValidFieldValue(value, constraint) || !orderValid) {
                const description = constraint === "finite" ? "a finite"
                    : constraint === "positive" ? "a positive finite" : "a non-negative finite";
                const message = isMax ? `${ui.label} must be positive, finite, and greater than Strut Min Length.`
                    : isMin ? `${ui.label} must be positive, finite, and less than Strut Max Length.`
                        : `${ui.label} must be ${description} number.`;
                showNotice(message, "error");
                renderGeometry();
                return;
            }
            if (field.section === "wheelKnuckle" && field.key === "strutStaticLengthMm") {
                try {
                    state.current = withStaticStrutLength({
                        ...state.current,
                        wheelKnuckle: {...knuckle, strutStaticLengthMm: value},
                    });
                } catch (error) {
                    showNotice(error instanceof Error ? error.message : "Could not set Strut Static Length.", "error");
                    renderGeometry();
                    return;
                }
            } else {
                setFieldValue(state.current, field, value);
                if (field.section === "steeringRack") {
                    const rack = state.current.steeringRack;
                    const limit = steeringRackTravelLimitMm(rack.widthMm, rack.housingWidthMm, rack.steeringLimiterMm);
                    rack.rackTravelMm = Math.max(-limit, Math.min(limit, rack.rackTravelMm));
                }
            }
            renderGeometry();
            persistOrNotify();
        });
    }
}
