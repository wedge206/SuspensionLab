import type { SuspensionProject } from "../domain/types";
import { steeringRackTravelLimitMm, withStaticStrutLength } from "../domain/coordinates";
import type { UiElements } from "./elements";
import type { ProjectState } from "./projectManager";
import type { UiRenderers } from "./renderers";

export function bindInputs(state: ProjectState, elements: UiElements, renderers: UiRenderers, persistOrNotify: () => boolean): void {
  const { showNotice, renderGeometry } = renderers;
  const {
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
  widthInput.addEventListener("change", () => updateDimension("widthMm", widthInput));
  rearWidthInput.addEventListener("change", () => updateDimension("rearWidthMm", rearWidthInput));
  frontHeightInput.addEventListener("change", () => updateDimension("frontHeightMm", frontHeightInput));
  rearHeightInput.addEventListener("change", () => updateDimension("rearHeightMm", rearHeightInput));
  controlArmDepthInput.addEventListener("change", () => updateDimension("controlArmDepthMm", controlArmDepthInput));
  controlArmLengthInput.addEventListener("change", () => updateControlArmDimension("lengthMm", controlArmLengthInput));
  ballJointOffsetInput.addEventListener("change", () => updateControlArmDimension("ballJointOffsetMm", ballJointOffsetInput));
  steeringRackWidthInput.addEventListener("change", () => updateSteeringRackDimension("widthMm", steeringRackWidthInput));
  steeringRackHeightInput.addEventListener("change", () => updateSteeringRackDimension("centerlineHeightMm", steeringRackHeightInput));
  steeringRackOffsetInput.addEventListener("change", () => updateSteeringRackDimension("centerlineOffsetMm", steeringRackOffsetInput));
  steeringHousingWidthInput.addEventListener("change", () => updateSteeringRackDimension("housingWidthMm", steeringHousingWidthInput));
  steeringLimiterInput.addEventListener("change", () => updateSteeringRackDimension("steeringLimiterMm", steeringLimiterInput));
  tieRodLengthInput.addEventListener("change", () => updateSteeringRackDimension("tieRodLengthMm", tieRodLengthInput));
  topMountHeightInput.addEventListener("change", () => updateTopMountDimension("heightMm", topMountHeightInput));
  topMountWidthInput.addEventListener("change", () => updateTopMountDimension("widthMm", topMountWidthInput));
  topMountOffsetInput.addEventListener("change", () => updateTopMountDimension("offsetMm", topMountOffsetInput));
  steeringPivotHeightInput.addEventListener("change", () => updateWheelKnuckleDimension("steeringPivotHeightMm", steeringPivotHeightInput));
  steeringPivotDepthInput.addEventListener("change", () => updateWheelKnuckleDimension("steeringPivotDepthMm", steeringPivotDepthInput));
  steeringPivotOffsetInput.addEventListener("change", () => updateWheelKnuckleDimension("steeringPivotOffsetMm", steeringPivotOffsetInput));
  strutMountHeightInput.addEventListener("change", () => updateWheelKnuckleDimension("strutMountHeightMm", strutMountHeightInput));
  strutMountOffsetInput.addEventListener("change", () => updateWheelKnuckleDimension("strutMountOffsetMm", strutMountOffsetInput));
  strutMountLocationInput.addEventListener("change", () => updateWheelKnuckleDimension("strutMountLocationMm", strutMountLocationInput));
  strutMountAngleInput.addEventListener("change", () => updateWheelKnuckleDimension("strutMountAngleDeg", strutMountAngleInput));
  strutMaxLengthInput.addEventListener("change", () => updateWheelKnuckleDimension("strutMaxLengthMm", strutMaxLengthInput));
  strutMinLengthInput.addEventListener("change", () => updateWheelKnuckleDimension("strutMinLengthMm", strutMinLengthInput));
  strutStaticLengthInput.addEventListener("change", () => {
    const value = Number(strutStaticLengthInput.value);
    if (!Number.isFinite(value) || value <= 0) {
      showNotice("Strut Static Length must be a positive finite number.", "error");
      renderGeometry();
      return;
    }
    try {
      state.current = withStaticStrutLength({
        ...state.current,
        wheelKnuckle: { ...state.current.wheelKnuckle, strutStaticLengthMm: value },
      });
      renderGeometry();
      persistOrNotify();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not set Strut Static Length.", "error");
      renderGeometry();
    }
  });
  hubHeightInput.addEventListener("change", () => updateWheelKnuckleDimension("hubHeightMm", hubHeightInput));
  hubSpacingInput.addEventListener("change", () => updateWheelKnuckleDimension("hubSpacingMm", hubSpacingInput));
  wheelOffsetInput.addEventListener("change", () => updateWheelTireDimension("wheelOffsetMm", wheelOffsetInput));
  wheelDiameterInput.addEventListener("change", () => updateWheelTireDimension("wheelDiameterIn", wheelDiameterInput));
  tireSectionWidthInput.addEventListener("change", () => updateWheelTireDimension("tireSectionWidthMm", tireSectionWidthInput));
  tireAspectRatioInput.addEventListener("change", () => updateWheelTireDimension("tireAspectRatio", tireAspectRatioInput));
  springRateInput.addEventListener("change", () => updateSpringRate());
  rearCamberArmInnerMountHeightInput.addEventListener("change", () =>
    updateRearSuspensionDimension(
      "camberArmInnerMountHeightMm",
      rearCamberArmInnerMountHeightInput,
      "Camber arm inner mount height",
    ));
  rearCamberArmInnerMountForwardOffsetInput.addEventListener("change", () =>
    updateRearSuspensionDimension(
      "camberArmInnerMountForwardOffsetMm",
      rearCamberArmInnerMountForwardOffsetInput,
      "Camber arm inner mount forward offset",
    ));
  rearCamberArmInnerMountWidthInput.addEventListener("change", () =>
    updateRearSuspensionDimension(
      "camberArmInnerMountWidthMm",
      rearCamberArmInnerMountWidthInput,
      "Camber arm inner mount width",
    ));
  rearMainArmInnerMountWidthInput.addEventListener("change", () =>
    updateRearSuspensionDimension("mainArmInnerMountWidthMm", rearMainArmInnerMountWidthInput, "Main arm inner mount width"));
  rearMainArmInnerMountHeightInput.addEventListener("change", () =>
    updateRearSuspensionDimension("mainArmInnerMountHeightMm", rearMainArmInnerMountHeightInput, "Main arm inner mount height"));
  rearFrontToRearLengthInput.addEventListener("change", () =>
    updateRearSuspensionDimension("frontToRearLengthMm", rearFrontToRearLengthInput, "Front to rear length"));
  rearToeArmInnerMountWidthInput.addEventListener("change", () =>
    updateRearSuspensionDimension("toeArmInnerMountWidthMm", rearToeArmInnerMountWidthInput, "Toe arm inner mount width"));
  rearToeArmInnerMountHeightInput.addEventListener("change", () =>
    updateRearSuspensionDimension("toeArmInnerMountHeightMm", rearToeArmInnerMountHeightInput, "Toe arm inner mount height"));
  rearToeArmMainArmWidthInput.addEventListener("change", () =>
    updateRearSuspensionDimension("toeArmMainArmWidthMm", rearToeArmMainArmWidthInput, "Toe arm Main arm width"));
  rearMainArmLengthInput.addEventListener("change", () =>
    updateRearSuspensionDimension("mainArmLengthMm", rearMainArmLengthInput, "Rear Main Arm Length"));
  rearToeArmLengthInput.addEventListener("change", () =>
    updateRearSuspensionDimension("toeArmLengthMm", rearToeArmLengthInput, "Rear Toe Arm Length"));
  rearMainArmOuterMountStaticHeightInput.addEventListener("change", () =>
    updateRearHubDimension("mainArmOuterMountStaticHeightMm", rearMainArmOuterMountStaticHeightInput, "Main arm outer mount static height"));
  rearToeArmOuterMountOffsetInput.addEventListener("change", () =>
    updateRearHubDimension("toeArmOuterMountOffsetMm", rearToeArmOuterMountOffsetInput, "Toe arm outer mount offset"));
  rearToeArmOuterMountHeightInput.addEventListener("change", () =>
    updateRearHubDimension("toeArmOuterMountHeightMm", rearToeArmOuterMountHeightInput, "Toe arm outer mount height"));
  rearToeArmOuterMountHeightOffsetInput.addEventListener("change", () =>
    updateRearHubDimension("toeArmOuterMountHeightOffsetMm", rearToeArmOuterMountHeightOffsetInput, "Toe Arm Outer Mount Height Offset"));
  rearToeArmOuterMountForwardOffsetInput.addEventListener("change", () =>
    updateRearHubDimension("toeArmOuterMountForwardOffsetMm", rearToeArmOuterMountForwardOffsetInput, "Toe Arm Outer Mount Forward Offset"));
  rearToeArmOuterMountLateralOffsetInput.addEventListener("change", () =>
    updateRearHubDimension("toeArmOuterMountLateralOffsetMm", rearToeArmOuterMountLateralOffsetInput, "Toe Arm Outer Mount Lateral Offset"));
  rearTrailingArmLengthInput.addEventListener("change", () =>
    updateRearHubDimension("trailingArmLengthMm", rearTrailingArmLengthInput, "Trailing Arm Length"));
  rearTrailingArmMountHeightInput.addEventListener("change", () =>
    updateRearHubDimension("trailingArmMountHeightMm", rearTrailingArmMountHeightInput, "Trailing Arm Mount Height"));
  rearTrailingArmMountWidthInput.addEventListener("change", () =>
    updateRearHubDimension("trailingArmMountWidthMm", rearTrailingArmMountWidthInput, "Trailing Arm Mount Width"));
  rearTrailingArmMountForwardOffsetInput.addEventListener("change", () =>
    updateRearHubDimension(
      "trailingArmMountForwardOffsetMm",
      rearTrailingArmMountForwardOffsetInput,
      "Trailing Arm Mount Forward Offset",
    ));

  function updateRearHubDimension(
    key: keyof SuspensionProject["rearHub"],
    input: HTMLInputElement,
    label: string,
  ): void {
    const value = input.valueAsNumber;
    const isSignedOffset = key === "toeArmOuterMountHeightOffsetMm" ||
      key === "toeArmOuterMountForwardOffsetMm" || key === "toeArmOuterMountLateralOffsetMm";
    if (!Number.isFinite(value) || (!isSignedOffset && value <= 0)) {
      showNotice(`${label} must be a ${isSignedOffset ? "" : "positive "}finite number.`, "error");
      renderGeometry();
      return;
    }
    state.current.rearHub[key] = value;
    renderGeometry();
    persistOrNotify();
  }

  function updateRearSuspensionDimension(
    key: keyof SuspensionProject["rearSuspension"],
    input: HTMLInputElement,
    label: string,
  ): void {
    const value = Number(input.value);
    if (!Number.isFinite(value) || value <= 0) {
      showNotice(`${label} must be a positive finite number.`, "error");
      renderGeometry();
      return;
    }
    state.current.rearSuspension[key] = value;
    renderGeometry();
    persistOrNotify();
  }

  function updateSpringRate(): void {
    const value = Number(springRateInput.value);
    if (!Number.isFinite(value) || value <= 0) {
      showNotice("Spring Rate must be a positive finite number.", "error");
      renderGeometry();
      return;
    }
    state.current.suspension.springRateNPerMm = value;
    renderGeometry();
    persistOrNotify();
  }

  function updateDimension(
    key: "widthMm" | "rearWidthMm" | "controlArmDepthMm" | "frontHeightMm" | "rearHeightMm",
    input: HTMLInputElement,
  ): void {
    const value = Number(input.value);
    if (!Number.isFinite(value) || value <= 0) {
      const label = key === "widthMm"
        ? "Front Control Arm Front Mount Location"
        : key === "rearWidthMm"
          ? "Front Control Arm Rear Mount Location"
          : key === "controlArmDepthMm"
            ? "Front Control Arm Depth"
            : key === "frontHeightMm"
              ? "Front Control Arm Front Mount Height"
              : "Front Control Arm Rear Mount Height";
      showNotice(`${label} must be a positive finite number.`, "error");
      renderGeometry();
      return;
    }

    state.current.frontLowerControlArmPickup[key] = value;
    renderGeometry();
    persistOrNotify();
  }

  function updateControlArmDimension(
    key: "lengthMm" | "ballJointOffsetMm",
    input: HTMLInputElement,
  ): void {
    const value = Number(input.value);
    const isValid = Number.isFinite(value) && (key === "lengthMm" ? value > 0 : value >= 0);
    if (!isValid) {
      const label = key === "lengthMm" ? "Control Arm Length" : "Ball Joint Offset";
      showNotice(`${label} must be a ${key === "lengthMm" ? "positive" : "non-negative"} finite number.`, "error");
      renderGeometry();
      return;
    }
    state.current.frontControlArm[key] = value;
    renderGeometry();
    persistOrNotify();
  }

  function updateSteeringRackDimension(
    key: "widthMm" | "centerlineHeightMm" | "centerlineOffsetMm" | "housingWidthMm" |
      "steeringLimiterMm" | "tieRodLengthMm",
    input: HTMLInputElement,
  ): void {
    const value = Number(input.value);
    const isNonNegative = key === "centerlineOffsetMm" || key === "steeringLimiterMm";
    const isValid = Number.isFinite(value) && (isNonNegative ? value >= 0 : value > 0);
    if (!isValid) {
      const labels = {
        widthMm: "Steering Rack Width",
        centerlineHeightMm: "Steering Rack Centerline Height",
        centerlineOffsetMm: "Steering Rack Centerline Offset",
        housingWidthMm: "Steering Housing Width",
        steeringLimiterMm: "Steering Limiter",
        tieRodLengthMm: "Tie Rod Length",
      };
      showNotice(`${labels[key]} must be a ${isNonNegative ? "non-negative" : "positive"} finite number.`, "error");
      renderGeometry();
      return;
    }
    state.current.steeringRack[key] = value;
    const travelLimit = steeringRackTravelLimitMm(
      state.current.steeringRack.widthMm,
      state.current.steeringRack.housingWidthMm,
      state.current.steeringRack.steeringLimiterMm,
    );
    state.current.steeringRack.rackTravelMm = Math.max(
      -travelLimit,
      Math.min(travelLimit, state.current.steeringRack.rackTravelMm),
    );
    renderGeometry();
    persistOrNotify();
  }

  function updateTopMountDimension(
    key: "heightMm" | "widthMm" | "offsetMm",
    input: HTMLInputElement,
  ): void {
    const value = Number(input.value);
    const isValid = Number.isFinite(value) && (key === "offsetMm" ? value >= 0 : value > 0);
    if (!isValid) {
      const labels = {
        heightMm: "Top Mount Height",
        widthMm: "Top Mount Width",
        offsetMm: "Top Mount Offset",
      };
      showNotice(`${labels[key]} must be a ${key === "offsetMm" ? "non-negative" : "positive"} finite number.`, "error");
      renderGeometry();
      return;
    }
    state.current.frontTopMount[key] = value;
    renderGeometry();
    persistOrNotify();
  }

  function updateWheelKnuckleDimension(
    key: "steeringPivotHeightMm" | "steeringPivotDepthMm" | "steeringPivotOffsetMm" |
      "strutMountHeightMm" | "strutMountOffsetMm" | "strutMountLocationMm" |
      "strutMountAngleDeg" | "strutMaxLengthMm" | "strutMinLengthMm" |
      "hubHeightMm" | "hubSpacingMm",
    input: HTMLInputElement,
  ): void {
    const value = Number(input.value);
    const mustBePositive = key === "steeringPivotHeightMm" || key === "strutMountHeightMm" ||
      key === "strutMaxLengthMm" || key === "strutMinLengthMm" ||
      key === "hubHeightMm" || key === "hubSpacingMm";
    const allowsNegative = key === "steeringPivotOffsetMm" ||
      key === "strutMountOffsetMm" || key === "strutMountLocationMm";
    const lengthOrderValid =
      (key !== "strutMaxLengthMm" || value > state.current.wheelKnuckle.strutMinLengthMm) &&
      (key !== "strutMinLengthMm" || value < state.current.wheelKnuckle.strutMaxLengthMm);
    const isValid = Number.isFinite(value) && lengthOrderValid &&
      (mustBePositive ? value > 0 : allowsNegative || value >= 0);
    if (!isValid) {
      const labels = {
        steeringPivotHeightMm: "Steering Pivot Height",
        steeringPivotDepthMm: "Steering Pivot Depth",
        steeringPivotOffsetMm: "Steering Pivot Offset",
        strutMountHeightMm: "Strut Mount Height",
        strutMountOffsetMm: "Strut Mount Offset",
        strutMountLocationMm: "Strut Mount Location",
        strutMountAngleDeg: "Strut Mount Angle",
        strutMaxLengthMm: "Strut Max Length",
        strutMinLengthMm: "Strut Min Length",
        hubHeightMm: "Hub Height",
        hubSpacingMm: "Hub Spacing",
      };
      const message = key === "strutMaxLengthMm"
        ? `${labels[key]} must be positive, finite, and greater than Strut Min Length.`
        : key === "strutMinLengthMm"
          ? `${labels[key]} must be positive, finite, and less than Strut Max Length.`
        : `${labels[key]} must be ${mustBePositive ? "a positive" : allowsNegative ? "a" : "a non-negative"} finite number.`;
      showNotice(message, "error");
      renderGeometry();
      return;
    }
    state.current.wheelKnuckle[key] = value;
    renderGeometry();
    persistOrNotify();
  }

  function updateWheelTireDimension(
    key: "wheelOffsetMm" | "wheelDiameterIn" | "tireSectionWidthMm" | "tireAspectRatio",
    input: HTMLInputElement,
  ): void {
    const value = Number(input.value);
    const isOffset = key === "wheelOffsetMm";
    if (!Number.isFinite(value) || (!isOffset && value <= 0)) {
      const labels = {
        wheelOffsetMm: "Wheel Offset",
        wheelDiameterIn: "Wheel Diameter",
        tireSectionWidthMm: "Tire Section Width",
        tireAspectRatio: "Tire Aspect Ratio",
      };
      showNotice(`${labels[key]} must be ${isOffset ? "a finite" : "a positive finite"} number.`, "error");
      renderGeometry();
      return;
    }
    state.current.wheelTire[key] = value;
    renderGeometry();
    persistOrNotify();
  }


}
