import {afterEach, expect, it, vi} from "vitest";

vi.mock("./ui/page", () => ({renderPage: () => "<header>toolbar</header>"}));
vi.mock("./ui/elements", () => ({
    getUiElements: () => ({scrubGeometryToggle: new EventTarget()}),
}));
vi.mock("./ui/inputs", () => ({bindInputs: vi.fn()}));
vi.mock("./ui/projectManager", () => ({
    loadProjectState: () => ({current: {}, initialNotice: ""}),
    bindProjectManager: () => ({persistOrNotify: vi.fn()}),
}));
vi.mock("./ui/renderers", () => ({
    createUiRenderers: () => ({
        renderProjectSelect: vi.fn(),
        renderGeometry: vi.fn(),
        renderAlignmentMeasurements: vi.fn(),
        showNotice: vi.fn(),
    }),
}));
vi.mock("./viewer/scene", () => ({
    ChassisScene: class {
        setScrubRadiusGeometryVisible() {}
        update() {}
        dispose() {}
    },
}));

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

it("renders the page before binding the theme selector", async () => {
    const app = {innerHTML: ""};
    const select = Object.assign(new EventTarget(), {value: ""});
    const lightTheme = {disabled: true};
    const append = vi.fn();
    vi.stubGlobal("document", {
        head: {append},
        querySelector: (selector: string) => {
            if (selector === "#app") return app;
            if (selector === "#theme-select") return app.innerHTML ? select : null;
            if (selector === "#light-theme") return lightTheme;
            if (selector === "#viewport") return {};
            return null;
        },
    });
    vi.stubGlobal("window", new EventTarget());
    vi.stubGlobal("localStorage", {getItem: () => null, setItem: vi.fn()});

    await import("./main");
    expect(app.innerHTML).toBe("<header>toolbar</header>");
    expect(append).toHaveBeenCalledWith(lightTheme);
    expect(select.value).toBe("dark");
    expect(lightTheme.disabled).toBe(true);
    select.value = "light";
    select.dispatchEvent(new Event("change"));
    expect(lightTheme.disabled).toBe(false);
});
