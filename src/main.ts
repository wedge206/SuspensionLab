import type { SuspensionProject } from "./domain/types";
import { DEFAULT_PICKUP_HEIGHT_MM, DEFAULT_PICKUP_WIDTH_MM } from "./domain/project";
import { downloadProject, loadProjects, readProjectFile, saveProjects } from "./persistence/projects";
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
    initialNotice = "Previous geometry and calculations were cleared. Project names were kept for a fresh start.";
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
        <div class="geometry-heading"><h2>Front lower control arm point</h2><span>Left & right</span></div>
        <label class="dimension-field" for="pickup-width">
          <span><strong>Width</strong><small>Vehicle centerline to each point</small></span>
          <span class="dimension-input"><input id="pickup-width" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <label class="dimension-field" for="pickup-height">
          <span><strong>Height</strong><small>Ground to point center</small></span>
          <span class="dimension-input"><input id="pickup-height" type="number" min="1" step="1" /> <small>mm</small></span>
        </label>
        <p class="point-spacing">Mirrored point spacing <strong id="point-spacing">— mm</strong></p>
      </section>
      <p class="sidebar-footnote">The frame is a centered visual reference. The two pickup points are mirrored equally from the vehicle centerline. No control arms or suspension calculations are included.</p>
    </aside>
    <section class="analysis-area">
      <div class="viewport-heading">
        <div><p class="eyebrow">Chassis reference model</p><h2>Vehicle frame & pickup points</h2></div>
        <div class="view-legend"><span><i class="legend-dot green"></i>Frame</span><span><i class="legend-dot amber"></i>Control arm pickup</span></div>
      </div>
      <div class="viewport" id="viewport" aria-label="3D vehicle frame with mirrored front lower control arm pickup points">
        <div class="viewport-hint">Drag to orbit · scroll to zoom</div>
      </div>
      <div class="canvas-footer"><span>Ground plane at Z = 0</span><span>Mirrored pickup points · spacing equals width × 2</span></div>
    </section>
  </main>
  <div id="notice" class="notice" role="status" aria-live="polite"></div>
`;

const projectSelect = document.querySelector<HTMLSelectElement>("#project-select")!;
const notice = document.querySelector<HTMLDivElement>("#notice")!;
const widthInput = document.querySelector<HTMLInputElement>("#pickup-width")!;
const heightInput = document.querySelector<HTMLInputElement>("#pickup-height")!;
let viewer: ChassisScene | undefined;

function createProject(name: string): SuspensionProject {
  return {
    schemaVersion: 4,
    id: crypto.randomUUID(),
    name,
    frontLowerControlArmPickup: {
      widthMm: DEFAULT_PICKUP_WIDTH_MM,
      heightMm: DEFAULT_PICKUP_HEIGHT_MM,
    },
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
  heightInput.value = String(current.frontLowerControlArmPickup.heightMm);
  document.querySelector("#point-spacing")!.textContent =
    `${(current.frontLowerControlArmPickup.widthMm * 2).toFixed(0)} mm`;
  viewer?.update(current);
}

renderProjectSelect();
renderGeometry();
if (initialNotice) showNotice(initialNotice, initialNotice.startsWith("Previous geometry") ? "success" : "error");
void import("./viewer/scene").then(({ ChassisScene: Scene }) => {
  viewer = new Scene(document.querySelector<HTMLDivElement>("#viewport")!);
  viewer.update(current);
}).catch(() => {
  document.querySelector("#viewport")!.innerHTML =
    `<div class="webgl-fallback"><strong>3D view unavailable</strong><span>Your browser or device could not create a WebGL context.</span></div>`;
});

projectSelect.addEventListener("change", () => selectProject(projectSelect.value));

widthInput.addEventListener("change", () => updateDimension("widthMm", widthInput));
heightInput.addEventListener("change", () => updateDimension("heightMm", heightInput));

function updateDimension(key: "widthMm" | "heightMm", input: HTMLInputElement): void {
  const value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0) {
    showNotice(`${key === "widthMm" ? "Width" : "Height"} must be a positive finite number.`, "error");
    renderGeometry();
    return;
  }
  current.frontLowerControlArmPickup[key] = value;
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
