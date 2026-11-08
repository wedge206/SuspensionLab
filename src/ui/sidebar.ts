import { allProjectFields } from "../domain/fields";
import type { FieldGroup } from "../domain/fields";

function renderFieldGroup(group: FieldGroup): string {
  return allProjectFields
    .flatMap(({ definition }) => definition.ui?.group === group ? [definition.ui] : [])
    .sort((left, right) => left.order - right.order)
    .map(({ id, label, hint, unit, min, step }) => `
        <label class="dimension-field" for="${id}">
          <span><strong>${label}</strong><small>${hint}</small></span>
          <span class="dimension-input"><input id="${id}" type="number"${min === undefined ? "" : ` min="${min}"`} step="${step}" /> <small>${unit}</small></span>
        </label>`).join("");
}

export function renderFrontSidebar(): string {
  return `          <div class="tab-pane active" id="tab-front">
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Front chassis</h2><span>Left & right</span></div>
        ${renderFieldGroup("front-0")}
        <p class="point-spacing">Front subframe width <strong id="front-point-spacing">— mm</strong></p>
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Front Control Arm</h2><span>Left & right</span></div>
        ${renderFieldGroup("front-1")}
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Steering Rack</h2><span>Left & right</span></div>
        ${renderFieldGroup("front-2")}
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Hub &amp; Knuckle</h2><span>Left &amp; right</span></div>
        ${renderFieldGroup("front-3")}
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Wheel &amp; Tire</h2><span>Wheel assembly</span></div>
        ${renderFieldGroup("front-4")}
      </section>
      <section class="build-sequence">
        <div class="geometry-heading"><h2>Suspension</h2><span>Spring setup</span></div>
        ${renderFieldGroup("front-5")}
      </section>
      <p class="sidebar-footnote">Front and rear mount pairs are mirrored equally across the centerline; each mount station has its own height. Strut lengths run from the moving strut mounts to the fixed top mounts and are checked against the configured travel limits.</p>
          </div>
`;
}


export function renderRearSidebar(): string {
  return `          <div class="tab-pane" id="tab-rear">
            <section class="build-sequence">
              <div class="geometry-heading"><h2>Rear Subframe</h2><span>Control arm mounts</span></div>
              ${renderFieldGroup("rear-0")}
            </section>
            <section class="build-sequence">
              <div class="geometry-heading"><h2>Rear Hub</h2><span>Outer arm mounts</span></div>
              ${renderFieldGroup("rear-1")}
            </section>
          </div>
`;
}


export function renderSidebar(): string {
  return `    <aside class="sidebar">
      <div class="section-heading">
        <div><p class="eyebrow">Hard chassis points</p><h1>Vehicle frame</h1></div>
        <span class="layout-badge">Front view</span>
      </div>
      <div class="coordinate-note"><span class="axis-icon">XYZ</span><span><strong>Ground-based dimensions</strong><small>Height is measured from the ground plane</small></span></div>
      <div class="tabs-container">
        <div class="tabs-header">
          <button class="tab-button active" data-tab="front">Front</button>
          <button class="tab-button" data-tab="rear">Rear</button>
        </div>
        <div class="tabs-content">
${renderFrontSidebar()}${renderRearSidebar()}        </div>
      </div>
    </aside>
`;
}
