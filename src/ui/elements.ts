import { allProjectFields } from "../domain/fields";

export function getUiElements() {
  const projectSelect = document.querySelector<HTMLSelectElement>("#project-select")!;
  const notice = document.querySelector<HTMLDivElement>("#notice")!;
  const templateDialog = document.querySelector<HTMLDialogElement>("#template-dialog")!;
  const templateSelect = document.querySelector<HTMLSelectElement>("#template-select")!;
  const projectNameInput = document.querySelector<HTMLInputElement>("#project-name")!;
  const createProjectButton = document.querySelector<HTMLButtonElement>("#create-project")!;
  const toeTotalOutput = document.querySelector<HTMLElement>("#toe-total")!;
  const toeSidesOutput = document.querySelector<HTMLElement>("#toe-sides")!;
  const camberOutput = document.querySelector<HTMLElement>("#camber-values")!;
  const casterOutput = document.querySelector<HTMLElement>("#caster-values")!;
  const scrubRadiusOutput = document.querySelector<HTMLElement>("#scrub-radius-values")!;
  const motionRatioOutput = document.querySelector<HTMLElement>("#motion-ratio-values")!;
  const wheelRateOutput = document.querySelector<HTMLElement>("#wheel-rate-values")!;
  const scrubGeometryToggle = document.querySelector<HTMLInputElement>("#show-scrub-geometry")!;
  const parameterInputs: Record<string, HTMLInputElement> = {};
  for (const { definition } of allProjectFields) {
    if (!definition.ui) continue;
    const input = document.querySelector<HTMLInputElement>(`#${definition.ui.id}`);
    if (!input) throw new Error(`Missing parameter input: ${definition.ui.id}.`);
    parameterInputs[definition.ui.id] = input;
  }
  return {
    projectSelect, notice, templateDialog, templateSelect, projectNameInput, createProjectButton,
    toeTotalOutput, toeSidesOutput, camberOutput, casterOutput, scrubRadiusOutput, motionRatioOutput,
    wheelRateOutput, scrubGeometryToggle, parameterInputs,
  };
}

export type UiElements = ReturnType<typeof getUiElements>;
