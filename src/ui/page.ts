import { renderToolbar, renderTemplateDialog } from "./toolbar";
import { renderSidebar } from "./sidebar";
import { renderAlignmentPanel } from "./alignmentPanel";

export { renderToolbar, renderSidebar, renderAlignmentPanel };

export function renderPage(): string {
  return `${renderToolbar()}${renderTemplateDialog()}  <main class="workspace">
${renderSidebar()}    <section class="analysis-area">
      <div class="viewport" id="viewport" aria-label="3D suspension model with control arms, tie rods, knuckles, and struts">
        <label class="virtual-geometry-toggle" for="show-scrub-geometry">
          <input id="show-scrub-geometry" type="checkbox" checked />
          <span>Show virtual geometry</span>
        </label>
        <div class="viewport-hint">Drag to orbit · hover and drag a ball joint vertically to move the arm</div>
      </div>
${renderAlignmentPanel()}    </section>
  </main>
  <div id="notice" class="notice" role="status" aria-live="polite"></div>
`;
}

