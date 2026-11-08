import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectFromTemplate, DEFAULT_TEMPLATE_KEY } from "../templates/templates";
import { allProjectFields, getFieldValue } from "../domain/fields";
import { validateProject } from "../domain/project";
import * as persistence from "../persistence/projects";
import { getUiElements } from "./elements";
import { bindInputs } from "./inputs";
import { renderAlignmentPanel, renderPage, renderSidebar, renderToolbar } from "./page";
import { bindProjectManager, loadProjectState } from "./projectManager";
import { createUiRenderers } from "./renderers";

class FakeElement extends EventTarget {
  value = "";
  disabled = false;
  checked = true;
  textContent = "";
  children: FakeElement[] = [];
  get valueAsNumber(): number {
    return this.value === "" ? NaN : Number(this.value);
  }
  append(child: FakeElement): void { this.children.push(child); }
  focus(): void {}
  showModal(): void {}
  close(): void {}
  click(): void { this.dispatchEvent(new Event("click")); }
}

describe("UI composition", () => {
  it("assembles each page section once and keeps the existing control IDs", () => {
    const page = renderPage();
    expect(page).toContain(renderToolbar());
    expect(page).toContain(renderSidebar());
    expect(page).toContain(renderAlignmentPanel());
    for (const id of ["project-select", "template-dialog", "tab-front", "tab-rear", "viewport", "show-scrub-geometry", "toe-total", "notice"]) {
      expect(page.match(new RegExp(`id="${id}"`, "g"))).toHaveLength(1);
    }
  });

  it("renders every registered control once with its label, hint and numeric attributes", () => {
    const page = renderSidebar();
    const controls = allProjectFields.flatMap(({ definition }) => definition.ui ? [definition.ui] : []);
    expect(new Set(controls.map(({ id }) => id)).size).toBe(controls.length);
    for (const { id, label, hint, unit, min, step } of controls) {
      expect(page.match(new RegExp(`id="${id}"`, "g"))).toHaveLength(1);
      expect(page).toContain(`for="${id}"`);
      expect(page).toContain(`<strong>${label}</strong><small>${hint}</small>`);
      expect(page).toContain(`<input id="${id}" type="number"${min === undefined ? "" : ` min="${min}"`} step="${step}" /> <small>${unit}</small>`);
    }
  });
});

describe("UI bindings", () => {
  const nodes = new Map<string, FakeElement>();
  const getNode = (selector: string): FakeElement => {
    let node = nodes.get(selector);
    if (!node) {
      node = new FakeElement();
      nodes.set(selector, node);
    }
    return node;
  };
  const renderers = {
    showNotice: vi.fn(),
    renderGeometry: vi.fn(),
    renderProjectSelect: vi.fn(),
    renderAlignmentMeasurements: vi.fn(),
  };

  beforeEach(() => {
    nodes.clear();
    vi.clearAllMocks();
    vi.stubGlobal("document", {
      querySelector: getNode,
      querySelectorAll: () => [],
      createElement: () => new FakeElement(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function makeState() {
    const current = createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "First", "first");
    return {
      current,
      projects: [current],
      projectTemplateKeys: { first: DEFAULT_TEMPLATE_KEY },
      unreadableProjects: [] as unknown[],
      initialNotice: "",
    };
  }

  it("rejects invalid input without persisting and restores the displayed value", () => {
    const state = makeState();
    const persist = vi.fn(() => true);
    bindInputs(state, getUiElements(), renderers, persist);
    const original = state.current.frontLowerControlArmPickup.widthMm;
    getNode("#pickup-width").value = "-1";
    getNode("#pickup-width").dispatchEvent(new Event("change"));
    expect(state.current.frontLowerControlArmPickup.widthMm).toBe(original);
    expect(renderers.showNotice).toHaveBeenCalledWith(
      "Front Control Arm Front Mount Location must be a positive finite number.", "error",
    );
    expect(renderers.renderGeometry).toHaveBeenCalledOnce();
    expect(persist).not.toHaveBeenCalled();
  });

  it("updates the selected project and clamps rack travel before persisting", () => {
    const state = makeState();
    const persist = vi.fn(() => true);
    bindInputs(state, getUiElements(), renderers, persist);
    state.current.steeringRack.rackTravelMm = 1000;
    getNode("#steering-housing-width").value = "800";
    getNode("#steering-housing-width").dispatchEvent(new Event("change"));
    expect(state.current.steeringRack.housingWidthMm).toBe(800);
    expect(state.current.steeringRack.rackTravelMm).toBeLessThan(1000);
    expect(persist).toHaveBeenCalledOnce();
  });

  it("selects the current project and reports save failures", () => {
    const state = makeState();
    const second = createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "Second", "second");
    state.projects.push(second);
    vi.spyOn(persistence, "saveProjects").mockImplementation(() => { throw new Error("storage full"); });
    const manager = bindProjectManager(state, getUiElements(), renderers);
    getNode("#project-select").value = "second";
    getNode("#project-select").dispatchEvent(new Event("change"));
    expect(state.current).toBe(second);
    expect(renderers.renderProjectSelect).toHaveBeenCalledOnce();
    expect(renderers.renderGeometry).toHaveBeenCalledOnce();
    expect(manager.persistOrNotify()).toBe(false);
    expect(renderers.showNotice).toHaveBeenCalledWith("storage full", "error");
  });

  it("uses a replacement current project for subsequent input edits", () => {
    const state = makeState();
    const original = state.current;
    const persist = vi.fn(() => true);
    bindInputs(state, getUiElements(), renderers, persist);
    state.current = createProjectFromTemplate(DEFAULT_TEMPLATE_KEY, "Second", "second");
    getNode("#pickup-width").value = "510";
    getNode("#pickup-width").dispatchEvent(new Event("change"));
    expect(state.current.frontLowerControlArmPickup.widthMm).toBe(510);
    expect(original.frontLowerControlArmPickup.widthMm).not.toBe(510);
    expect(persist).toHaveBeenCalledOnce();
  });

  it.each(allProjectFields.filter((field) => field.definition.ui))(
    "matches project validation for UI boundaries on $section.$key",
    (field) => {
      const ui = field.definition.ui!;
      const inputs = ["", "0", "-1"];
      if (field.key !== "strutStaticLengthMm") inputs.push("0.5");
      for (const inputValue of inputs) {
        nodes.clear();
        vi.clearAllMocks();
        const state = makeState();
        const persist = vi.fn(() => true);
        const before = getFieldValue(state.current, field);
        const candidate = structuredClone(state.current);
        (candidate[field.section] as Record<string, number>)[field.key] = Number(inputValue);
        let accepted = true;
        try {
          validateProject(candidate);
        } catch {
          accepted = false;
        }
        bindInputs(state, getUiElements(), renderers, persist);
        const input = getNode(`#${ui.id}`);
        input.value = inputValue;
        input.dispatchEvent(new Event("change"));
        expect(getFieldValue(state.current, field)).toBe(accepted ? Number(inputValue) : before);
        expect(persist).toHaveBeenCalledTimes(accepted ? 1 : 0);
        expect(renderers.showNotice).toHaveBeenCalledTimes(accepted ? 0 : 1);
        expect(renderers.renderGeometry).toHaveBeenCalledOnce();
      }
    },
  );

  it("renders current values with registered precision", () => {
    const state = makeState();
    state.current.steeringRack.tieRodLengthMm = 338.25;
    const updateViewer = vi.fn();
    const ui = createUiRenderers(state, getUiElements(), updateViewer);
    ui.renderGeometry();
    for (const field of allProjectFields) {
      const metadata = field.definition.ui;
      if (!metadata) continue;
      const value = getFieldValue(state.current, field);
      expect(getNode(`#${metadata.id}`).value).toBe(
        metadata.precision === undefined ? String(value) : value.toFixed(metadata.precision),
      );
    }
    expect(updateViewer).toHaveBeenCalledWith(state.current);
  });

  it("rejects reversed strut limits and rolls back an unreachable static length", () => {
    const state = makeState();
    const before = structuredClone(state.current);
    const persist = vi.fn(() => true);
    bindInputs(state, getUiElements(), renderers, persist);
    getNode("#strut-min-length").value = String(before.wheelKnuckle.strutMaxLengthMm);
    getNode("#strut-min-length").dispatchEvent(new Event("change"));
    expect(renderers.showNotice).toHaveBeenCalledWith(
      "Strut Min Length must be positive, finite, and less than Strut Max Length.", "error",
    );
    getNode("#strut-static-length").value = "1000";
    getNode("#strut-static-length").dispatchEvent(new Event("change"));
    expect(state.current).toEqual(before);
    expect(persist).not.toHaveBeenCalled();
    expect(renderers.showNotice).toHaveBeenCalledTimes(2);
  });

  it("repositions both struts and persists a valid static length", () => {
    const state = makeState();
    const persist = vi.fn(() => true);
    bindInputs(state, getUiElements(), renderers, persist);
    getNode("#strut-static-length").value = "600";
    getNode("#strut-static-length").dispatchEvent(new Event("change"));
    expect(state.current.wheelKnuckle.strutStaticLengthMm).toBe(600);
    expect(state.current.frontControlArm.leftRotationRad).not.toBe(0);
    expect(state.current.frontControlArm.rightRotationRad).not.toBe(0);
    expect(renderers.showNotice).not.toHaveBeenCalled();
    expect(persist).toHaveBeenCalledOnce();
  });

  it("reports load errors while providing a fallback project", () => {
    vi.spyOn(persistence, "loadProjects").mockImplementation(() => { throw new Error("storage corrupt"); });
    const state = loadProjectState();
    expect(state.initialNotice).toBe("storage corrupt");
    expect(state.projects).toEqual([state.current]);
    expect(state.projectTemplateKeys[state.current.id]).toBe(DEFAULT_TEMPLATE_KEY);
  });

  it("keeps a new notice visible for its full duration after an earlier notice", () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
    const classes = new Set<string>();
    Object.assign(getNode("#notice"), {
      dataset: {},
      classList: { add: (name: string) => classes.add(name), remove: (name: string) => classes.delete(name) },
    });
    try {
      const ui = createUiRenderers(makeState(), getUiElements(), vi.fn());
      ui.showNotice("first");
      vi.advanceTimersByTime(4000);
      ui.showNotice("second");
      vi.advanceTimersByTime(1000);
      expect(classes.has("visible")).toBe(true);
      vi.advanceTimersByTime(3500);
      expect(classes.has("visible")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("formats alignment values and unavailable geometry", () => {
    const ui = createUiRenderers(makeState(), getUiElements(), vi.fn());
    ui.renderAlignmentMeasurements({
      toeMm: [1.24, -2.35], totalToeMm: -1.11,
      camberDeg: [2, -3], casterDeg: [4, 5],
      scrubRadiusMm: [null, 12.34], motionRatio: [0.1234, null],
      wheelRateNPerMm: [7.89, null],
    });
    expect(getNode("#toe-total").textContent).toBe("-1.1 mm total");
    expect(getNode("#scrub-radius-values").textContent).toBe("Left — · Right 12.3 mm");
    expect(getNode("#motion-ratio-values").textContent).toBe("Left 0.123 · Right —");
    ui.renderAlignmentMeasurements(null);
    expect(getNode("#toe-total").textContent).toBe("Unavailable");
    expect(getNode("#toe-sides").textContent).toBe("Geometry constraints cannot be satisfied");
  });
});
