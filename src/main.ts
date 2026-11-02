import type { SuspensionProject } from "./domain/types";
import type { WheelAlignmentMeasurements } from "./domain/coordinates";
import {
  DEFAULT_FRONT_PICKUP_HEIGHT_MM,
  DEFAULT_REAR_PICKUP_HEIGHT_MM,
  DEFAULT_PICKUP_WIDTH_MM,
  DEFAULT_REAR_PICKUP_WIDTH_MM,
  DEFAULT_CONTROL_ARM_DEPTH_MM,
  DEFAULT_CONTROL_ARM_LENGTH_MM,
  DEFAULT_BALL_JOINT_OFFSET_MM,
  DEFAULT_CONTROL_ARM_ROTATION_RAD,
  DEFAULT_STEERING_RACK_WIDTH_MM,
  DEFAULT_STEERING_RACK_HEIGHT_MM,
  DEFAULT_STEERING_RACK_OFFSET_MM,
  DEFAULT_STEERING_HOUSING_WIDTH_MM,
  DEFAULT_STEERING_LIMITER_MM,
  DEFAULT_STEERING_RACK_TRAVEL_MM,
  DEFAULT_TIE_ROD_LENGTH_MM,
  DEFAULT_TOP_MOUNT_HEIGHT_MM,
  DEFAULT_TOP_MOUNT_WIDTH_MM,
  DEFAULT_TOP_MOUNT_OFFSET_MM,
  DEFAULT_STEERING_PIVOT_HEIGHT_MM,
  DEFAULT_STEERING_PIVOT_DEPTH_MM,
  DEFAULT_STEERING_PIVOT_OFFSET_MM,
  DEFAULT_STRUT_MOUNT_HEIGHT_MM,
  DEFAULT_STRUT_MOUNT_OFFSET_MM,
  DEFAULT_STRUT_MOUNT_LOCATION_MM,
  DEFAULT_STRUT_MOUNT_ANGLE_DEG,
  DEFAULT_STRUT_MAX_LENGTH_MM,
  DEFAULT_STRUT_MIN_LENGTH_MM,
  DEFAULT_HUB_HEIGHT_MM,
  DEFAULT_HUB_SPACING_MM,
  DEFAULT_WHEEL_OFFSET_MM,
  DEFAULT_WHEEL_DIAMETER_IN,
  DEFAULT_TIRE_SECTION_WIDTH_MM,
  DEFAULT_TIRE_ASPECT_RATIO,
  DEFAULT_SPRING_RATE_N_PER_MM,
} from "./domain/project";
import { downloadProject, loadProjects, readProjectFile, saveProjects } from "./persistence/projects";
import { steeringRackTravelLimitMm } from "./domain/coordinates";
import type { ChassisScene } from "./viewer/scene";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Application root was not found.");

let projects: SuspensionProject[] = [];
let current: SuspensionProject;
let initialNotice = "";

try {
  const loaded = loadProjects();
  projects = loaded.projects;
  if (loaded.resetLegacyProjects) {
    initialNotice = "Older projects were upgraded to the current chassis-point format.";
  }
  if (!projects.length) {
    current = createProject("New suspension project");
    projects = [current];
    saveProjects(projects);
  } else {
    current = projects[0];
  }
} catch (error) {
  current = createProject("New suspension project");
  projects = [current];
  initialNotice = error instanceof Error ? error.message : "Could not load saved projects.";
}

app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="Suspension Lab home"><span class="brand-mark">S</span><span>Suspension<span class="brand-light">Lab</span></span></a>
    <div class="project-controls">
      <label class="sr-only" for="project-select">Active project</label>
      <select id="project-select" aria-label="Active project"></select>
      <button class="button button-quiet" id="new-project">New</button>
      <button class="button button-quiet" id="rename-project">Rename</button>
      <button class="button button-quiet" id="duplicate-project">Duplicate</button>
      <button class="button button-quiet" id="delete-project">Delete</button>
    </div>
    <div class="topbar-actions">
      <button class="button button-quiet" id="reset-project" title="Reset this project's dimensions to their defaults">Reset</button>
      <button class="button button-quiet" id="import-project">Import JSON</button>
      <button class="button button-primary" id="export-project">Export JSON</button>
      <input id="import-file" class="sr-only" type="file" accept="application/json,.json" />
    </div>
  </header>
  <main class="workspace">
    <aside class="sidebar">
      <div class="section-heading">
        <div><p class="eyebrow">Hard chassis points</p><h1>Vehicle frame</h1></div>
        <span class="layout-badge">Front view</span>
      </div>
      <div class="coordinate-note"><span class="axis-icon">XYZ</span><span><strong>Ground-based dimensions</strong><small>Height is measured from the ground plane</small></span></div>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Front chassis</h2><span>Left & right</span></div>
        <label class="dimension-field" for="pickup-width">
          <span><strong>Front Control Arm Front Mount Location</strong><small>Vehicle centerline to each point</small></span>
          <span class="dimension-input"><input id="pickup-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="pickup-rear-width">
          <span><strong>Front Control Arm Rear Mount Location</strong><small>Vehicle centerline to each point</small></span>
          <span class="dimension-input"><input id="pickup-rear-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="control-arm-depth">
          <span><strong>Front Control Arm Depth</strong><small>Distance between front and rear mounts</small></span>
          <span class="dimension-input"><input id="control-arm-depth" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="pickup-front-height">
          <span><strong>Front Control Arm Front Mount Height</strong><small>Height from ground plane</small></span>
          <span class="dimension-input"><input id="pickup-front-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="pickup-rear-height">
          <span><strong>Front Control Arm Rear Mount Height</strong><small>Height from ground plane</small></span>
          <span class="dimension-input"><input id="pickup-rear-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="top-mount-height">
          <span><strong>Top Mount Height</strong><small>Height from ground plane</small></span>
          <span class="dimension-input"><input id="top-mount-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="top-mount-width">
          <span><strong>Top Mount Width</strong><small>Distance between left and right points</small></span>
          <span class="dimension-input"><input id="top-mount-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="top-mount-offset">
          <span><strong>Top Mount Offset</strong><small>Rearward from front mount location</small></span>
          <span class="dimension-input"><input id="top-mount-offset" type="number" min="0" step="1" /> <small>mm</small></span>
        </label>
        <p class="point-spacing">Front subframe width <strong id="front-point-spacing">— mm</strong></p>
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Front Control Arm</h2><span>Left & right</span></div>
        <label class="dimension-field" for="control-arm-length">
          <span><strong>Control Arm Length</strong><small>Outward from front mount</small></span>
          <span class="dimension-input"><input id="control-arm-length" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="ball-joint-offset">
          <span><strong>Ball Joint Offset</strong><small>Rearward from front mount</small></span>
          <span class="dimension-input"><input id="ball-joint-offset" type="number" min="0" step="1" /> <small>mm</small></span>
        </label>
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Steering Rack</h2><span>Left & right</span></div>
        <label class="dimension-field" for="steering-rack-width">
          <span><strong>Steering Rack Width</strong><small>Distance between pivot points</small></span>
          <span class="dimension-input"><input id="steering-rack-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="steering-rack-height">
          <span><strong>Steering Rack Centerline Height</strong><small>Height from ground plane</small></span>
          <span class="dimension-input"><input id="steering-rack-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="steering-rack-offset">
          <span><strong>Steering Rack Centerline Offset</strong><small>Rearward from front mount location</small></span>
          <span class="dimension-input"><input id="steering-rack-offset" type="number" min="0" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="steering-housing-width">
          <span><strong>Steering Housing Width</strong><small>Width of the rack cylinder</small></span>
          <span class="dimension-input"><input id="steering-housing-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="steering-limiter">
          <span><strong>Steering Limiter</strong><small>Extra stop clearance at each end of the housing</small></span>
          <span class="dimension-input"><input id="steering-limiter" type="number" min="0" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="tie-rod-length">
          <span><strong>Tie Rod Length</strong><small>Fixed length from rack pivot to steering pivot</small></span>
          <span class="dimension-input"><input id="tie-rod-length" type="number" min="1" step="0.1" /> <small>mm</small></span>
        </label>
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Hub &amp; Knuckle</h2><span>Left &amp; right</span></div>
        <label class="dimension-field" for="steering-pivot-height">
          <span><strong>Steering Pivot Height</strong><small>Above ball joint pivot point</small></span>
          <span class="dimension-input"><input id="steering-pivot-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="steering-pivot-depth">
          <span><strong>Steering Pivot Depth</strong><small>Rearward from ball joint pivot point</small></span>
          <span class="dimension-input"><input id="steering-pivot-depth" type="number" min="0" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="steering-pivot-offset">
          <span><strong>Steering Pivot Offset</strong><small>In/out from ball joint pivot point</small></span>
          <span class="dimension-input"><input id="steering-pivot-offset" type="number" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="strut-mount-height">
          <span><strong>Strut Mount Height</strong><small>Above ball joint pivot point</small></span>
          <span class="dimension-input"><input id="strut-mount-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="strut-mount-offset">
          <span><strong>Strut Mount Offset</strong><small>Front/rear from ball joint pivot point</small></span>
          <span class="dimension-input"><input id="strut-mount-offset" type="number" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="strut-mount-location">
          <span><strong>Strut Mount Location</strong><small>In/out from ball joint pivot point</small></span>
          <span class="dimension-input"><input id="strut-mount-location" type="number" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="strut-mount-angle">
          <span><strong>Strut Mount Angle</strong><small>Mount orientation from vertical (front view)</small></span>
          <span class="dimension-input"><input id="strut-mount-angle" type="number" step="1" /> <small>deg</small></span>
        </label>
        <label class="dimension-field" for="strut-max-length">
          <span><strong>Strut Max Length</strong><small>Maximum distance between strut mount and top mount</small></span>
          <span class="dimension-input"><input id="strut-max-length" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="strut-min-length">
          <span><strong>Strut Min Length</strong><small>Minimum distance between strut mount and top mount</small></span>
          <span class="dimension-input"><input id="strut-min-length" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="hub-height">
          <span><strong>Hub Height</strong><small>Distance along the strut-side hub-face edge</small></span>
          <span class="dimension-input"><input id="hub-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="hub-spacing">
          <span><strong>Hub Spacing</strong><small>Perpendicular distance from the virtual hub face</small></span>
          <span class="dimension-input"><input id="hub-spacing" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Wheel &amp; Tire</h2><span>Wheel assembly</span></div>
        <label class="dimension-field" for="wheel-offset">
          <span><strong>Wheel Offset</strong><small>Offset from the hub mounting face</small></span>
          <span class="dimension-input"><input id="wheel-offset" type="number" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="wheel-diameter">
          <span><strong>Wheel Diameter</strong><small>Rim diameter</small></span>
          <span class="dimension-input"><input id="wheel-diameter" type="number" min="1" step="0.5" /> <small>in</small></span>
        </label>
        <label class="dimension-field" for="tire-section-width">
          <span><strong>Tire Section Width</strong><small>Nominal tire width</small></span>
          <span class="dimension-input"><input id="tire-section-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="tire-aspect-ratio">
          <span><strong>Tire Aspect Ratio</strong><small>Sidewall height as a percentage of section width</small></span>
          <span class="dimension-input"><input id="tire-aspect-ratio" type="number" min="1" step="1" /> <small>%</small></span>
        </label>
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Suspension</h2><span>Spring setup</span></div>
        <label class="dimension-field" for="spring-rate">
          <span><strong>Spring Rate</strong><small>Spring stiffness</small></span>
          <span class="dimension-input"><input id="spring-rate" type="number" min="0.1" step="0.1" /> <small>N/mm</small></span>
        </label>
      </section>
      <p class="sidebar-footnote">Front and rear mount pairs are mirrored equally across the centerline; each mount station has its own height. Strut lengths run from the moving strut mounts to the fixed top mounts and are checked against the configured travel limits.</p>
    </aside>
    <section class="analysis-area">
      <div class="viewport" id="viewport" aria-label="3D suspension model with control arms, tie rods, knuckles, and struts">
        <label class="virtual-geometry-toggle" for="show-scrub-geometry">
          <input id="show-scrub-geometry" type="checkbox" checked />
          <span>Show virtual geometry</span>
        </label>
        <div class="viewport-hint">Drag to orbit · hover and drag a ball joint vertically to move the arm</div>
      </div>
      <section class="alignment-panel" aria-labelledby="alignment-heading">
        <div class="geometry-heading"><h2 id="alignment-heading">Calculated Alignment</h2><span>Current suspension position</span></div>
        <div class="alignment-grid">
          <article class="alignment-card">
            <h3>Toe</h3>
            <strong id="toe-total">—</strong>
            <small id="toe-sides">Left — mm · Right — mm</small>
          </article>
          <article class="alignment-card">
            <h3>Camber</h3>
            <strong id="camber-values">Left —° · Right —°</strong>
            <small>Wheel inclination from vertical</small>
          </article>
          <article class="alignment-card">
            <h3>Caster</h3>
            <strong id="caster-values">Left —° · Right —°</strong>
            <small>Steering axis angle from vertical</small>
          </article>
          <article class="alignment-card">
            <h3>Scrub Radius</h3>
            <strong id="scrub-radius-values">Left — mm · Right — mm</strong>
            <small>Tire centerline to steering-axis ground intersection</small>
          </article>
          <article class="alignment-card">
            <h3>Motion Ratio</h3>
            <strong id="motion-ratio-values">Left — · Right —</strong>
            <small>Strut travel ÷ vertical wheel travel</small>
          </article>
          <article class="alignment-card">
            <h3>Wheel Rate</h3>
            <strong id="wheel-rate-values">Left — N/mm · Right — N/mm</strong>
            <small>Spring rate × motion ratio²</small>
          </article>
        </div>
      </section>
    </section>
  </main>
  <div id="notice" class="notice" role="status" aria-live="polite"></div>
`;

const projectSelect = document.querySelector<HTMLSelectElement>("#project-select")!;
const notice = document.querySelector<HTMLDivElement>("#notice")!;
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
const hubHeightInput = document.querySelector<HTMLInputElement>("#hub-height")!;
const hubSpacingInput = document.querySelector<HTMLInputElement>("#hub-spacing")!;
const wheelOffsetInput = document.querySelector<HTMLInputElement>("#wheel-offset")!;
const wheelDiameterInput = document.querySelector<HTMLInputElement>("#wheel-diameter")!;
const tireSectionWidthInput = document.querySelector<HTMLInputElement>("#tire-section-width")!;
const tireAspectRatioInput = document.querySelector<HTMLInputElement>("#tire-aspect-ratio")!;
const springRateInput = document.querySelector<HTMLInputElement>("#spring-rate")!;
const scrubGeometryToggle = document.querySelector<HTMLInputElement>("#show-scrub-geometry")!;
let scrubGeometryVisible = scrubGeometryToggle.checked;
let viewer: ChassisScene | undefined;

function createProject(name: string): SuspensionProject {
  return {
    schemaVersion: 22,
    id: crypto.randomUUID(),
    name,
    frontLowerControlArmPickup: {
      widthMm: DEFAULT_PICKUP_WIDTH_MM,
      rearWidthMm: DEFAULT_REAR_PICKUP_WIDTH_MM,
      controlArmDepthMm: DEFAULT_CONTROL_ARM_DEPTH_MM,
      frontHeightMm: DEFAULT_FRONT_PICKUP_HEIGHT_MM,
      rearHeightMm: DEFAULT_REAR_PICKUP_HEIGHT_MM,
    },
    frontControlArm: {
      lengthMm: DEFAULT_CONTROL_ARM_LENGTH_MM,
      ballJointOffsetMm: DEFAULT_BALL_JOINT_OFFSET_MM,
      leftRotationRad: DEFAULT_CONTROL_ARM_ROTATION_RAD,
      rightRotationRad: DEFAULT_CONTROL_ARM_ROTATION_RAD,
    },
    steeringRack: {
      widthMm: DEFAULT_STEERING_RACK_WIDTH_MM,
      centerlineHeightMm: DEFAULT_STEERING_RACK_HEIGHT_MM,
      centerlineOffsetMm: DEFAULT_STEERING_RACK_OFFSET_MM,
      housingWidthMm: DEFAULT_STEERING_HOUSING_WIDTH_MM,
      steeringLimiterMm: DEFAULT_STEERING_LIMITER_MM,
      rackTravelMm: DEFAULT_STEERING_RACK_TRAVEL_MM,
      tieRodLengthMm: DEFAULT_TIE_ROD_LENGTH_MM,
    },
    frontTopMount: {
      heightMm: DEFAULT_TOP_MOUNT_HEIGHT_MM,
      widthMm: DEFAULT_TOP_MOUNT_WIDTH_MM,
      offsetMm: DEFAULT_TOP_MOUNT_OFFSET_MM,
    },
    wheelKnuckle: {
      steeringPivotHeightMm: DEFAULT_STEERING_PIVOT_HEIGHT_MM,
      steeringPivotDepthMm: DEFAULT_STEERING_PIVOT_DEPTH_MM,
      steeringPivotOffsetMm: DEFAULT_STEERING_PIVOT_OFFSET_MM,
      strutMountHeightMm: DEFAULT_STRUT_MOUNT_HEIGHT_MM,
      strutMountOffsetMm: DEFAULT_STRUT_MOUNT_OFFSET_MM,
      strutMountLocationMm: DEFAULT_STRUT_MOUNT_LOCATION_MM,
      strutMountAngleDeg: DEFAULT_STRUT_MOUNT_ANGLE_DEG,
      strutMaxLengthMm: DEFAULT_STRUT_MAX_LENGTH_MM,
      strutMinLengthMm: DEFAULT_STRUT_MIN_LENGTH_MM,
      hubHeightMm: DEFAULT_HUB_HEIGHT_MM,
      hubSpacingMm: DEFAULT_HUB_SPACING_MM,
    },
    wheelTire: {
      wheelOffsetMm: DEFAULT_WHEEL_OFFSET_MM,
      wheelDiameterIn: DEFAULT_WHEEL_DIAMETER_IN,
      tireSectionWidthMm: DEFAULT_TIRE_SECTION_WIDTH_MM,
      tireAspectRatio: DEFAULT_TIRE_ASPECT_RATIO,
    },
    suspension: { springRateNPerMm: DEFAULT_SPRING_RATE_N_PER_MM },
  };
}

function showNotice(message: string, type: "error" | "success" = "success"): void {
  notice.textContent = message;
  notice.dataset.type = type;
  notice.classList.add("visible");
  window.setTimeout(() => notice.classList.remove("visible"), 4500);
}

function renderProjectSelect(): void {
  projectSelect.replaceChildren(...projects.map((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    option.selected = project.id === current.id;
    return option;
  }));
}

function persist(): void {
  projects = projects.map((project) => project.id === current.id ? current : project);
  saveProjects(projects);
}

function persistOrNotify(): boolean {
  try {
    persist();
    return true;
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Could not save this project.", "error");
    return false;
  }
}

function selectProject(id: string): void {
  const next = projects.find((project) => project.id === id);
  if (!next) return;
  current = next;
  renderProjectSelect();
  renderGeometry();
}

function renderGeometry(): void {
  widthInput.value = String(current.frontLowerControlArmPickup.widthMm);
  rearWidthInput.value = String(current.frontLowerControlArmPickup.rearWidthMm);
  controlArmDepthInput.value = String(current.frontLowerControlArmPickup.controlArmDepthMm);
  frontHeightInput.value = String(current.frontLowerControlArmPickup.frontHeightMm);
  rearHeightInput.value = String(current.frontLowerControlArmPickup.rearHeightMm);
  controlArmLengthInput.value = String(current.frontControlArm.lengthMm);
  ballJointOffsetInput.value = String(current.frontControlArm.ballJointOffsetMm);
  steeringRackWidthInput.value = String(current.steeringRack.widthMm);
  steeringRackHeightInput.value = String(current.steeringRack.centerlineHeightMm);
  steeringRackOffsetInput.value = String(current.steeringRack.centerlineOffsetMm);
  steeringHousingWidthInput.value = String(current.steeringRack.housingWidthMm);
  steeringLimiterInput.value = String(current.steeringRack.steeringLimiterMm);
  tieRodLengthInput.value = current.steeringRack.tieRodLengthMm.toFixed(1);
  topMountHeightInput.value = String(current.frontTopMount.heightMm);
  topMountWidthInput.value = String(current.frontTopMount.widthMm);
  topMountOffsetInput.value = String(current.frontTopMount.offsetMm);
  steeringPivotHeightInput.value = String(current.wheelKnuckle.steeringPivotHeightMm);
  steeringPivotDepthInput.value = String(current.wheelKnuckle.steeringPivotDepthMm);
  steeringPivotOffsetInput.value = String(current.wheelKnuckle.steeringPivotOffsetMm);
  strutMountHeightInput.value = String(current.wheelKnuckle.strutMountHeightMm);
  strutMountOffsetInput.value = String(current.wheelKnuckle.strutMountOffsetMm);
  strutMountLocationInput.value = String(current.wheelKnuckle.strutMountLocationMm);
  strutMountAngleInput.value = String(current.wheelKnuckle.strutMountAngleDeg);
  strutMaxLengthInput.value = String(current.wheelKnuckle.strutMaxLengthMm);
  strutMinLengthInput.value = String(current.wheelKnuckle.strutMinLengthMm);
  hubHeightInput.value = String(current.wheelKnuckle.hubHeightMm);
  hubSpacingInput.value = String(current.wheelKnuckle.hubSpacingMm);
  wheelOffsetInput.value = String(current.wheelTire.wheelOffsetMm);
  wheelDiameterInput.value = String(current.wheelTire.wheelDiameterIn);
  tireSectionWidthInput.value = String(current.wheelTire.tireSectionWidthMm);
  tireAspectRatioInput.value = String(current.wheelTire.tireAspectRatio);
  springRateInput.value = String(current.suspension.springRateNPerMm);
  document.querySelector("#front-point-spacing")!.textContent =
    `${(current.frontLowerControlArmPickup.widthMm * 2).toFixed(0)} mm`;
  viewer?.update(current);
}

renderProjectSelect();
renderGeometry();
if (initialNotice) showNotice(initialNotice);
void import("./viewer/scene").then(({ ChassisScene: Scene }) => {
  viewer = new Scene(
    document.querySelector<HTMLDivElement>("#viewport")!,
    persistOrNotify,
    (message, type) => showNotice(message, type),
    renderAlignmentMeasurements,
  );
  viewer.setScrubRadiusGeometryVisible(scrubGeometryVisible);
  scrubGeometryToggle.addEventListener("change", () => {
    scrubGeometryVisible = scrubGeometryToggle.checked;
    viewer?.setScrubRadiusGeometryVisible(scrubGeometryVisible);
  });
  viewer.update(current);
}).catch(() => {
  document.querySelector("#viewport")!.innerHTML =
    `<div class="webgl-fallback"><strong>3D view unavailable</strong><span>Your browser or device could not create a WebGL context.</span></div>`;
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

projectSelect.addEventListener("change", () => selectProject(projectSelect.value));

document.querySelector<HTMLButtonElement>("#reset-project")!.addEventListener("click", () => {
  current.frontLowerControlArmPickup = {
    widthMm: DEFAULT_PICKUP_WIDTH_MM,
    rearWidthMm: DEFAULT_REAR_PICKUP_WIDTH_MM,
    controlArmDepthMm: DEFAULT_CONTROL_ARM_DEPTH_MM,
    frontHeightMm: DEFAULT_FRONT_PICKUP_HEIGHT_MM,
    rearHeightMm: DEFAULT_REAR_PICKUP_HEIGHT_MM,
  };
  current.frontControlArm = {
    lengthMm: DEFAULT_CONTROL_ARM_LENGTH_MM,
    ballJointOffsetMm: DEFAULT_BALL_JOINT_OFFSET_MM,
    leftRotationRad: DEFAULT_CONTROL_ARM_ROTATION_RAD,
    rightRotationRad: DEFAULT_CONTROL_ARM_ROTATION_RAD,
  };
  current.steeringRack = {
    widthMm: DEFAULT_STEERING_RACK_WIDTH_MM,
    centerlineHeightMm: DEFAULT_STEERING_RACK_HEIGHT_MM,
    centerlineOffsetMm: DEFAULT_STEERING_RACK_OFFSET_MM,
    housingWidthMm: DEFAULT_STEERING_HOUSING_WIDTH_MM,
    steeringLimiterMm: DEFAULT_STEERING_LIMITER_MM,
    rackTravelMm: DEFAULT_STEERING_RACK_TRAVEL_MM,
    tieRodLengthMm: DEFAULT_TIE_ROD_LENGTH_MM,
  };
  current.frontTopMount = {
    heightMm: DEFAULT_TOP_MOUNT_HEIGHT_MM,
    widthMm: DEFAULT_TOP_MOUNT_WIDTH_MM,
    offsetMm: DEFAULT_TOP_MOUNT_OFFSET_MM,
  };
  current.wheelKnuckle = {
    steeringPivotHeightMm: DEFAULT_STEERING_PIVOT_HEIGHT_MM,
    steeringPivotDepthMm: DEFAULT_STEERING_PIVOT_DEPTH_MM,
    steeringPivotOffsetMm: DEFAULT_STEERING_PIVOT_OFFSET_MM,
    strutMountHeightMm: DEFAULT_STRUT_MOUNT_HEIGHT_MM,
    strutMountOffsetMm: DEFAULT_STRUT_MOUNT_OFFSET_MM,
    strutMountLocationMm: DEFAULT_STRUT_MOUNT_LOCATION_MM,
    strutMountAngleDeg: DEFAULT_STRUT_MOUNT_ANGLE_DEG,
    strutMaxLengthMm: DEFAULT_STRUT_MAX_LENGTH_MM,
    strutMinLengthMm: DEFAULT_STRUT_MIN_LENGTH_MM,
    hubHeightMm: DEFAULT_HUB_HEIGHT_MM,
    hubSpacingMm: DEFAULT_HUB_SPACING_MM,
  };
  current.wheelTire = {
    wheelOffsetMm: DEFAULT_WHEEL_OFFSET_MM,
    wheelDiameterIn: DEFAULT_WHEEL_DIAMETER_IN,
    tireSectionWidthMm: DEFAULT_TIRE_SECTION_WIDTH_MM,
    tireAspectRatio: DEFAULT_TIRE_ASPECT_RATIO,
  };
  current.suspension = { springRateNPerMm: DEFAULT_SPRING_RATE_N_PER_MM };
  renderGeometry();
  if (persistOrNotify()) showNotice("Project dimensions reset to their default values.");
});

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
hubHeightInput.addEventListener("change", () => updateWheelKnuckleDimension("hubHeightMm", hubHeightInput));
hubSpacingInput.addEventListener("change", () => updateWheelKnuckleDimension("hubSpacingMm", hubSpacingInput));
wheelOffsetInput.addEventListener("change", () => updateWheelTireDimension("wheelOffsetMm", wheelOffsetInput));
wheelDiameterInput.addEventListener("change", () => updateWheelTireDimension("wheelDiameterIn", wheelDiameterInput));
tireSectionWidthInput.addEventListener("change", () => updateWheelTireDimension("tireSectionWidthMm", tireSectionWidthInput));
tireAspectRatioInput.addEventListener("change", () => updateWheelTireDimension("tireAspectRatio", tireAspectRatioInput));
springRateInput.addEventListener("change", () => updateSpringRate());

function updateSpringRate(): void {
  const value = Number(springRateInput.value);
  if (!Number.isFinite(value) || value <= 0) {
    showNotice("Spring Rate must be a positive finite number.", "error");
    renderGeometry();
    return;
  }
  current.suspension.springRateNPerMm = value;
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

  current.frontLowerControlArmPickup[key] = value;
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
  current.frontControlArm[key] = value;
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
  current.steeringRack[key] = value;
  const travelLimit = steeringRackTravelLimitMm(
    current.steeringRack.widthMm,
    current.steeringRack.housingWidthMm,
    current.steeringRack.steeringLimiterMm,
  );
  current.steeringRack.rackTravelMm = Math.max(
    -travelLimit,
    Math.min(travelLimit, current.steeringRack.rackTravelMm),
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
  current.frontTopMount[key] = value;
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
    (key !== "strutMaxLengthMm" || value > current.wheelKnuckle.strutMinLengthMm) &&
    (key !== "strutMinLengthMm" || value < current.wheelKnuckle.strutMaxLengthMm);
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
  current.wheelKnuckle[key] = value;
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
  current.wheelTire[key] = value;
  renderGeometry();
  persistOrNotify();
}

document.querySelector<HTMLButtonElement>("#new-project")!.addEventListener("click", () => {
  current = createProject("New suspension project");
  projects.push(current);
  renderProjectSelect();
  renderGeometry();
  persistOrNotify();
});

document.querySelector<HTMLButtonElement>("#rename-project")!.addEventListener("click", () => {
  const name = window.prompt("Project name", current.name)?.trim();
  if (!name) return;
  current.name = name;
  renderProjectSelect();
  try {
    persist();
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Could not save this project.", "error");
  }
});

document.querySelector<HTMLButtonElement>("#duplicate-project")!.addEventListener("click", () => {
  current = { ...structuredClone(current), id: crypto.randomUUID(), name: `${current.name} copy` };
  projects.push(current);
  renderProjectSelect();
  renderGeometry();
  persistOrNotify();
});

document.querySelector<HTMLButtonElement>("#delete-project")!.addEventListener("click", () => {
  if (projects.length < 2) {
    showNotice("Keep at least one project in the browser library.", "error");
    return;
  }
  if (!window.confirm(`Delete "${current.name}" from this browser?`)) return;
  projects = projects.filter((project) => project.id !== current.id);
  current = projects[0];
  renderProjectSelect();
  renderGeometry();
  try {
    saveProjects(projects);
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Could not save the project library.", "error");
  }
});

document.querySelector<HTMLButtonElement>("#export-project")!.addEventListener("click", () => downloadProject(current));
document.querySelector<HTMLButtonElement>("#import-project")!.addEventListener("click", () =>
  document.querySelector<HTMLInputElement>("#import-file")!.click());
document.querySelector<HTMLInputElement>("#import-file")!.addEventListener("change", async (event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    current = await readProjectFile(file);
    current.id = crypto.randomUUID();
    projects.push(current);
    renderProjectSelect();
    renderGeometry();
    if (persistOrNotify()) showNotice(`Imported project "${current.name}".`);
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Could not import this project.", "error");
  } finally {
    input.value = "";
  }
});

window.addEventListener("beforeunload", () => viewer?.dispose());
