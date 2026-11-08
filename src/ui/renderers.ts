import { allProjectFields, getFieldValue } from "../domain/fields";
import type { SuspensionProject } from "../domain/types";
import type { WheelAlignmentMeasurements } from "../domain/coordinates";
import type { UiElements } from "./elements";
import type { ProjectState } from "./projectManager";

export function createUiRenderers(state: ProjectState, elements: UiElements, updateViewer: (project: SuspensionProject) => void) {
  const {
    projectSelect,
    notice,
    toeTotalOutput,
    toeSidesOutput,
    camberOutput,
    casterOutput,
    scrubRadiusOutput,
    motionRatioOutput,
    wheelRateOutput,
    parameterInputs,
  } = elements;
  let noticeTimer: number | undefined;
  function showNotice(message: string, type: "error" | "success" = "success"): void {
    notice.textContent = message;
    notice.dataset.type = type;
    notice.classList.add("visible");
    // Restart the timer so an earlier notice's timeout cannot hide this one early.
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => notice.classList.remove("visible"), 4500);
  }

  function renderProjectSelect(): void {
    projectSelect.replaceChildren(...state.projects.map((project) => {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      option.selected = project.id === state.current.id;
      return option;
    }));
  }

  function renderGeometry(): void {
    for (const field of allProjectFields) {
      const ui = field.definition.ui;
      if (!ui) continue;
      const value = getFieldValue(state.current, field);
      parameterInputs[ui.id].value = ui.precision === undefined ? String(value) : value.toFixed(ui.precision);
    }
    document.querySelector("#front-point-spacing")!.textContent =
      `${(state.current.frontLowerControlArmPickup.widthMm * 2).toFixed(0)} mm`;
    updateViewer(state.current);
  }

  // Tab switching functionality
  function switchTab(tabName: string): void {
    // Hide all tab panes
    const panes = document.querySelectorAll<HTMLDivElement>(".tab-pane");
    panes.forEach((pane) => pane.classList.remove("active"));

    // Remove active class from all buttons
    const buttons = document.querySelectorAll<HTMLButtonElement>(".tab-button");
    buttons.forEach((btn) => btn.classList.remove("active"));

    // Show selected pane and mark button as active
    const selectedPane = document.querySelector<HTMLDivElement>(`#tab-${tabName}`);
    const selectedButton = document.querySelector<HTMLButtonElement>(`[data-tab="${tabName}"]`);

    if (selectedPane) selectedPane.classList.add("active");
    if (selectedButton) selectedButton.classList.add("active");
  }

  // Attach tab button listeners
  document.querySelectorAll<HTMLButtonElement>(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab");
      if (tabName) switchTab(tabName);
    });
  });

  function renderAlignmentMeasurements(measurements: WheelAlignmentMeasurements | null): void {
    if (!measurements) {
      toeTotalOutput.textContent = "Unavailable";
      toeSidesOutput.textContent = "Geometry constraints cannot be satisfied";
      camberOutput.textContent = "Unavailable";
      casterOutput.textContent = "Unavailable";
      scrubRadiusOutput.textContent = "Unavailable";
      motionRatioOutput.textContent = "Unavailable";
      wheelRateOutput.textContent = "Unavailable";
      return;
    }
    toeTotalOutput.textContent = measurements.totalToeMm === null
      ? "Unavailable"
      : `${measurements.totalToeMm.toFixed(1)} mm total`;
    toeSidesOutput.textContent = measurements.toeMm
      ? `Left ${measurements.toeMm[0].toFixed(1)} mm · Right ${measurements.toeMm[1].toFixed(1)} mm`
      : "Straight-ahead geometry cannot be satisfied";
    camberOutput.textContent =
      `Left ${measurements.camberDeg[0].toFixed(1)}° · Right ${measurements.camberDeg[1].toFixed(1)}°`;
    casterOutput.textContent =
      `Left ${measurements.casterDeg[0].toFixed(1)}° · Right ${measurements.casterDeg[1].toFixed(1)}°`;
    scrubRadiusOutput.textContent = measurements.scrubRadiusMm
      .map((value) => value === null ? "—" : `${value.toFixed(1)} mm`)
      .map((value, index) => `${index === 0 ? "Left" : "Right"} ${value}`)
      .join(" · ");
    motionRatioOutput.textContent = measurements.motionRatio
      .map((value) => value === null ? "—" : value.toFixed(3))
      .map((value, index) => `${index === 0 ? "Left" : "Right"} ${value}`)
      .join(" · ");
    wheelRateOutput.textContent = measurements.wheelRateNPerMm
      .map((value) => value === null ? "—" : `${value.toFixed(1)} N/mm`)
      .map((value, index) => `${index === 0 ? "Left" : "Right"} ${value}`)
      .join(" · ");
  }


  return { showNotice, renderProjectSelect, renderGeometry, renderAlignmentMeasurements };
}

export type UiRenderers = ReturnType<typeof createUiRenderers>;
