import type {ChassisScene} from "./viewer/scene";
import {getUiElements} from "./ui/elements";
import {bindInputs} from "./ui/inputs";
import {renderPage} from "./ui/page";
import {bindProjectManager, loadProjectState} from "./ui/projectManager";
import {createUiRenderers} from "./ui/renderers";
import {bindTheme} from "./ui/toolbar";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Application root was not found.");

const state = loadProjectState();
app.innerHTML = renderPage();
const themeSelect = document.querySelector<HTMLSelectElement>("#theme-select");
const lightTheme = document.querySelector<HTMLLinkElement>("#light-theme");
if (!themeSelect || !lightTheme) throw new Error("Theme controls were not found.");
// Vite can move the base stylesheet after this link in production builds.
document.head.append(lightTheme);
const elements = getUiElements();
let viewer: ChassisScene | undefined;
let scrubGeometryVisible = elements.scrubGeometryToggle.checked;
const renderers = createUiRenderers(state, elements, (project) => viewer?.update(project));
const themeLoadError = bindTheme(themeSelect, lightTheme, (message) => renderers.showNotice(message, "error"));
const manager = bindProjectManager(state, elements, renderers);
bindInputs(state, elements, renderers, manager.persistOrNotify);
renderers.renderProjectSelect();
renderers.renderGeometry();

const initialNotice = [state.initialNotice, themeLoadError].filter(Boolean).join(" ");
if (initialNotice) renderers.showNotice(initialNotice, "error");
void import("./viewer/scene").then(({ChassisScene: Scene}) => {
    viewer = new Scene(
        document.querySelector<HTMLDivElement>("#viewport")!,
        manager.persistOrNotify,
        (message, type) => renderers.showNotice(message, type),
        renderers.renderAlignmentMeasurements,
        state.current,
    );
    viewer.setScrubRadiusGeometryVisible(scrubGeometryVisible);
    elements.scrubGeometryToggle.addEventListener("change", () => {
        scrubGeometryVisible = elements.scrubGeometryToggle.checked;
        viewer?.setScrubRadiusGeometryVisible(scrubGeometryVisible);
    });
    viewer.update(state.current);
}).catch(() => {
    document.querySelector("#viewport")!.innerHTML =
        `<div class="webgl-fallback"><strong>3D view unavailable</strong><span>Your browser or device could not create a WebGL context.</span></div>`;
});

window.addEventListener("beforeunload", () => viewer?.dispose());
