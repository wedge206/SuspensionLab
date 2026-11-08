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
    widthInput,
    rearWidthInput,
    frontHeightInput,
    rearHeightInput,
    controlArmDepthInput,
    controlArmLengthInput,
    ballJointOffsetInput,
    steeringRackWidthInput,
    steeringRackHeightInput,
    steeringRackOffsetInput,
    steeringHousingWidthInput,
    steeringLimiterInput,
    tieRodLengthInput,
    topMountHeightInput,
    topMountWidthInput,
    topMountOffsetInput,
    steeringPivotHeightInput,
    steeringPivotDepthInput,
    steeringPivotOffsetInput,
    strutMountHeightInput,
    strutMountOffsetInput,
    strutMountLocationInput,
    strutMountAngleInput,
    strutMaxLengthInput,
    strutMinLengthInput,
    strutStaticLengthInput,
    hubHeightInput,
    hubSpacingInput,
    wheelOffsetInput,
    wheelDiameterInput,
    tireSectionWidthInput,
    tireAspectRatioInput,
    springRateInput,
    rearMainArmInnerMountWidthInput,
    rearCamberArmInnerMountHeightInput,
    rearCamberArmInnerMountForwardOffsetInput,
    rearCamberArmInnerMountWidthInput,
    rearMainArmInnerMountHeightInput,
    rearFrontToRearLengthInput,
    rearToeArmInnerMountWidthInput,
    rearToeArmInnerMountHeightInput,
    rearToeArmMainArmWidthInput,
    rearMainArmLengthInput,
    rearToeArmLengthInput,
    rearMainArmOuterMountStaticHeightInput,
    rearToeArmOuterMountOffsetInput,
    rearToeArmOuterMountHeightInput,
    rearToeArmOuterMountHeightOffsetInput,
    rearToeArmOuterMountForwardOffsetInput,
    rearToeArmOuterMountLateralOffsetInput,
    rearTrailingArmLengthInput,
    rearTrailingArmMountHeightInput,
    rearTrailingArmMountWidthInput,
    rearTrailingArmMountForwardOffsetInput,
  } = elements;
  function showNotice(message: string, type: "error" | "success" = "success"): void {
    notice.textContent = message;
    notice.dataset.type = type;
    notice.classList.add("visible");
    window.setTimeout(() => notice.classList.remove("visible"), 4500);
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
    widthInput.value = String(state.current.frontLowerControlArmPickup.widthMm);
    rearWidthInput.value = String(state.current.frontLowerControlArmPickup.rearWidthMm);
    controlArmDepthInput.value = String(state.current.frontLowerControlArmPickup.controlArmDepthMm);
    frontHeightInput.value = String(state.current.frontLowerControlArmPickup.frontHeightMm);
    rearHeightInput.value = String(state.current.frontLowerControlArmPickup.rearHeightMm);
    controlArmLengthInput.value = String(state.current.frontControlArm.lengthMm);
    ballJointOffsetInput.value = String(state.current.frontControlArm.ballJointOffsetMm);
    steeringRackWidthInput.value = String(state.current.steeringRack.widthMm);
    steeringRackHeightInput.value = String(state.current.steeringRack.centerlineHeightMm);
    steeringRackOffsetInput.value = String(state.current.steeringRack.centerlineOffsetMm);
    steeringHousingWidthInput.value = String(state.current.steeringRack.housingWidthMm);
    steeringLimiterInput.value = String(state.current.steeringRack.steeringLimiterMm);
    tieRodLengthInput.value = state.current.steeringRack.tieRodLengthMm.toFixed(1);
    topMountHeightInput.value = String(state.current.frontTopMount.heightMm);
    topMountWidthInput.value = String(state.current.frontTopMount.widthMm);
    topMountOffsetInput.value = String(state.current.frontTopMount.offsetMm);
    steeringPivotHeightInput.value = String(state.current.wheelKnuckle.steeringPivotHeightMm);
    steeringPivotDepthInput.value = String(state.current.wheelKnuckle.steeringPivotDepthMm);
    steeringPivotOffsetInput.value = String(state.current.wheelKnuckle.steeringPivotOffsetMm);
    strutMountHeightInput.value = String(state.current.wheelKnuckle.strutMountHeightMm);
    strutMountOffsetInput.value = String(state.current.wheelKnuckle.strutMountOffsetMm);
    strutMountLocationInput.value = String(state.current.wheelKnuckle.strutMountLocationMm);
    strutMountAngleInput.value = String(state.current.wheelKnuckle.strutMountAngleDeg);
    strutMaxLengthInput.value = String(state.current.wheelKnuckle.strutMaxLengthMm);
    strutMinLengthInput.value = String(state.current.wheelKnuckle.strutMinLengthMm);
    strutStaticLengthInput.value = String(state.current.wheelKnuckle.strutStaticLengthMm);
    hubHeightInput.value = String(state.current.wheelKnuckle.hubHeightMm);
    hubSpacingInput.value = String(state.current.wheelKnuckle.hubSpacingMm);
    wheelOffsetInput.value = String(state.current.wheelTire.wheelOffsetMm);
    wheelDiameterInput.value = String(state.current.wheelTire.wheelDiameterIn);
    tireSectionWidthInput.value = String(state.current.wheelTire.tireSectionWidthMm);
    tireAspectRatioInput.value = String(state.current.wheelTire.tireAspectRatio);
    springRateInput.value = String(state.current.suspension.springRateNPerMm);
    rearCamberArmInnerMountHeightInput.value =
      String(state.current.rearSuspension.camberArmInnerMountHeightMm);
    rearCamberArmInnerMountForwardOffsetInput.value =
      String(state.current.rearSuspension.camberArmInnerMountForwardOffsetMm);
    rearCamberArmInnerMountWidthInput.value =
      String(state.current.rearSuspension.camberArmInnerMountWidthMm);
    rearMainArmInnerMountWidthInput.value =
      String(state.current.rearSuspension.mainArmInnerMountWidthMm);
    rearMainArmInnerMountHeightInput.value =
      String(state.current.rearSuspension.mainArmInnerMountHeightMm);
    rearFrontToRearLengthInput.value = String(state.current.rearSuspension.frontToRearLengthMm);
    rearToeArmInnerMountWidthInput.value = String(state.current.rearSuspension.toeArmInnerMountWidthMm);
    rearToeArmInnerMountHeightInput.value = String(state.current.rearSuspension.toeArmInnerMountHeightMm);
    rearToeArmMainArmWidthInput.value = String(state.current.rearSuspension.toeArmMainArmWidthMm);
    rearMainArmLengthInput.value = String(state.current.rearSuspension.mainArmLengthMm);
    rearToeArmLengthInput.value = String(state.current.rearSuspension.toeArmLengthMm);
    rearMainArmOuterMountStaticHeightInput.value =
      String(state.current.rearHub.mainArmOuterMountStaticHeightMm);
    rearToeArmOuterMountOffsetInput.value = String(state.current.rearHub.toeArmOuterMountOffsetMm);
    rearToeArmOuterMountHeightInput.value = String(state.current.rearHub.toeArmOuterMountHeightMm);
    rearToeArmOuterMountHeightOffsetInput.value = String(state.current.rearHub.toeArmOuterMountHeightOffsetMm);
    rearToeArmOuterMountForwardOffsetInput.value = String(state.current.rearHub.toeArmOuterMountForwardOffsetMm);
    rearToeArmOuterMountLateralOffsetInput.value = String(state.current.rearHub.toeArmOuterMountLateralOffsetMm);
    rearTrailingArmLengthInput.value = String(state.current.rearHub.trailingArmLengthMm);
    rearTrailingArmMountHeightInput.value = String(state.current.rearHub.trailingArmMountHeightMm);
    rearTrailingArmMountWidthInput.value = String(state.current.rearHub.trailingArmMountWidthMm);
    rearTrailingArmMountForwardOffsetInput.value =
      String(state.current.rearHub.trailingArmMountForwardOffsetMm);
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
