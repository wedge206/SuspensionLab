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
  const widthInput = document.querySelector<HTMLInputElement>("#pickup-width")!;
  const rearWidthInput = document.querySelector<HTMLInputElement>("#pickup-rear-width")!;
  const frontHeightInput = document.querySelector<HTMLInputElement>("#pickup-front-height")!;
  const rearHeightInput = document.querySelector<HTMLInputElement>("#pickup-rear-height")!;
  const controlArmDepthInput = document.querySelector<HTMLInputElement>("#control-arm-depth")!;
  const controlArmLengthInput = document.querySelector<HTMLInputElement>("#control-arm-length")!;
  const ballJointOffsetInput = document.querySelector<HTMLInputElement>("#ball-joint-offset")!;
  const steeringRackWidthInput = document.querySelector<HTMLInputElement>("#steering-rack-width")!;
  const steeringRackHeightInput = document.querySelector<HTMLInputElement>("#steering-rack-height")!;
  const steeringRackOffsetInput = document.querySelector<HTMLInputElement>("#steering-rack-offset")!;
  const steeringHousingWidthInput = document.querySelector<HTMLInputElement>("#steering-housing-width")!;
  const steeringLimiterInput = document.querySelector<HTMLInputElement>("#steering-limiter")!;
  const tieRodLengthInput = document.querySelector<HTMLInputElement>("#tie-rod-length")!;
  const topMountHeightInput = document.querySelector<HTMLInputElement>("#top-mount-height")!;
  const topMountWidthInput = document.querySelector<HTMLInputElement>("#top-mount-width")!;
  const topMountOffsetInput = document.querySelector<HTMLInputElement>("#top-mount-offset")!;
  const steeringPivotHeightInput = document.querySelector<HTMLInputElement>("#steering-pivot-height")!;
  const steeringPivotDepthInput = document.querySelector<HTMLInputElement>("#steering-pivot-depth")!;
  const steeringPivotOffsetInput = document.querySelector<HTMLInputElement>("#steering-pivot-offset")!;
  const strutMountHeightInput = document.querySelector<HTMLInputElement>("#strut-mount-height")!;
  const strutMountOffsetInput = document.querySelector<HTMLInputElement>("#strut-mount-offset")!;
  const strutMountLocationInput = document.querySelector<HTMLInputElement>("#strut-mount-location")!;
  const strutMountAngleInput = document.querySelector<HTMLInputElement>("#strut-mount-angle")!;
  const strutMaxLengthInput = document.querySelector<HTMLInputElement>("#strut-max-length")!;
  const strutMinLengthInput = document.querySelector<HTMLInputElement>("#strut-min-length")!;
  const strutStaticLengthInput = document.querySelector<HTMLInputElement>("#strut-static-length")!;
  const hubHeightInput = document.querySelector<HTMLInputElement>("#hub-height")!;
  const hubSpacingInput = document.querySelector<HTMLInputElement>("#hub-spacing")!;
  const wheelOffsetInput = document.querySelector<HTMLInputElement>("#wheel-offset")!;
  const wheelDiameterInput = document.querySelector<HTMLInputElement>("#wheel-diameter")!;
  const tireSectionWidthInput = document.querySelector<HTMLInputElement>("#tire-section-width")!;
  const tireAspectRatioInput = document.querySelector<HTMLInputElement>("#tire-aspect-ratio")!;
  const springRateInput = document.querySelector<HTMLInputElement>("#spring-rate")!;
  const rearMainArmInnerMountWidthInput =
    document.querySelector<HTMLInputElement>("#rear-main-arm-inner-mount-width")!;
  const rearCamberArmInnerMountHeightInput =
    document.querySelector<HTMLInputElement>("#rear-camber-arm-inner-mount-height")!;
  const rearCamberArmInnerMountForwardOffsetInput =
    document.querySelector<HTMLInputElement>("#rear-camber-arm-inner-mount-forward-offset")!;
  const rearCamberArmInnerMountWidthInput =
    document.querySelector<HTMLInputElement>("#rear-camber-arm-inner-mount-width")!;
  const rearMainArmInnerMountHeightInput =
    document.querySelector<HTMLInputElement>("#rear-main-arm-inner-mount-height")!;
  const rearFrontToRearLengthInput =
    document.querySelector<HTMLInputElement>("#rear-front-to-rear-length")!;
  const rearToeArmInnerMountWidthInput =
    document.querySelector<HTMLInputElement>("#rear-toe-arm-inner-mount-width")!;
  const rearToeArmInnerMountHeightInput =
    document.querySelector<HTMLInputElement>("#rear-toe-arm-inner-mount-height")!;
  const rearToeArmMainArmWidthInput =
    document.querySelector<HTMLInputElement>("#rear-toe-arm-main-arm-width")!;
  const rearMainArmLengthInput =
    document.querySelector<HTMLInputElement>("#rear-main-arm-length")!;
  const rearToeArmLengthInput =
    document.querySelector<HTMLInputElement>("#rear-toe-arm-length")!;
  const rearMainArmOuterMountStaticHeightInput =
    document.querySelector<HTMLInputElement>("#rear-main-arm-outer-mount-static-height")!;
  const rearToeArmOuterMountOffsetInput =
    document.querySelector<HTMLInputElement>("#rear-toe-arm-outer-mount-offset")!;
  const rearToeArmOuterMountHeightInput =
    document.querySelector<HTMLInputElement>("#rear-toe-arm-outer-mount-height")!;
  const rearToeArmOuterMountHeightOffsetInput =
    document.querySelector<HTMLInputElement>("#rear-toe-arm-outer-mount-height-offset")!;
  const rearToeArmOuterMountForwardOffsetInput =
    document.querySelector<HTMLInputElement>("#rear-toe-arm-outer-mount-forward-offset")!;
  const rearToeArmOuterMountLateralOffsetInput =
    document.querySelector<HTMLInputElement>("#rear-toe-arm-outer-mount-lateral-offset")!;
  const rearTrailingArmLengthInput =
    document.querySelector<HTMLInputElement>("#rear-trailing-arm-length")!;
  const rearTrailingArmMountHeightInput =
    document.querySelector<HTMLInputElement>("#rear-trailing-arm-mount-height")!;
  const rearTrailingArmMountWidthInput =
    document.querySelector<HTMLInputElement>("#rear-trailing-arm-mount-width")!;
  const rearTrailingArmMountForwardOffsetInput =
    document.querySelector<HTMLInputElement>("#rear-trailing-arm-mount-forward-offset")!;
  const scrubGeometryToggle = document.querySelector<HTMLInputElement>("#show-scrub-geometry")!;
  return {
    projectSelect, notice, templateDialog, templateSelect, projectNameInput, createProjectButton,
    toeTotalOutput, toeSidesOutput, camberOutput, casterOutput, scrubRadiusOutput, motionRatioOutput,
    wheelRateOutput, widthInput, rearWidthInput, frontHeightInput, rearHeightInput,
    controlArmDepthInput, controlArmLengthInput, ballJointOffsetInput, steeringRackWidthInput,
    steeringRackHeightInput, steeringRackOffsetInput, steeringHousingWidthInput, steeringLimiterInput,
    tieRodLengthInput, topMountHeightInput, topMountWidthInput, topMountOffsetInput,
    steeringPivotHeightInput, steeringPivotDepthInput, steeringPivotOffsetInput, strutMountHeightInput,
    strutMountOffsetInput, strutMountLocationInput, strutMountAngleInput, strutMaxLengthInput,
    strutMinLengthInput, strutStaticLengthInput, hubHeightInput, hubSpacingInput, wheelOffsetInput,
    wheelDiameterInput, tireSectionWidthInput, tireAspectRatioInput, springRateInput,
    rearMainArmInnerMountWidthInput, rearCamberArmInnerMountHeightInput,
    rearCamberArmInnerMountForwardOffsetInput, rearCamberArmInnerMountWidthInput,
    rearMainArmInnerMountHeightInput, rearFrontToRearLengthInput, rearToeArmInnerMountWidthInput,
    rearToeArmInnerMountHeightInput, rearToeArmMainArmWidthInput, rearMainArmLengthInput,
    rearToeArmLengthInput, rearMainArmOuterMountStaticHeightInput, rearToeArmOuterMountOffsetInput,
    rearToeArmOuterMountHeightInput, rearToeArmOuterMountHeightOffsetInput,
    rearToeArmOuterMountForwardOffsetInput, rearToeArmOuterMountLateralOffsetInput,
    rearTrailingArmLengthInput, rearTrailingArmMountHeightInput, rearTrailingArmMountWidthInput,
    rearTrailingArmMountForwardOffsetInput, scrubGeometryToggle,
  };
}

export type UiElements = ReturnType<typeof getUiElements>;
