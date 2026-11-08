export const THEME_STORAGE_KEY = "suspension-lab.theme.v1";

export function bindTheme(
    select: Pick<HTMLSelectElement, "value" | "addEventListener">,
    lightTheme: Pick<HTMLLinkElement, "disabled">,
    onError: (message: string) => void,
): string {
    let savedTheme: string | null = null;
    let loadError = "";
    try {
        savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
        loadError = "Could not load the saved theme; using Dark.";
    }
    select.value = savedTheme === "light" ? "light" : "dark";
    lightTheme.disabled = select.value !== "light";
    select.addEventListener("change", () => {
        if (select.value !== "light" && select.value !== "dark") {
            onError("Invalid theme selection.");
            return;
        }
        lightTheme.disabled = select.value !== "light";
        try {
            localStorage.setItem(THEME_STORAGE_KEY, select.value);
        } catch {
            onError("Could not save the selected theme.");
        }
    });
    return loadError;
}

export function renderToolbar(): string {
    return `
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
      <label class="sr-only" for="theme-select">Color theme</label>
      <select id="theme-select" aria-label="Color theme">
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
      <button class="button button-quiet" id="reset-project" title="Reset to the template, preserving Strut Static Length">Reset</button>
      <button class="button button-quiet" id="import-project">Import JSON</button>
      <button class="button button-primary" id="export-project">Export JSON</button>
      <input id="import-file" class="sr-only" type="file" accept="application/json,.json" />
    </div>
  </header>
`;
}


export function renderTemplateDialog(): string {
    return `  <dialog id="template-dialog" class="template-dialog" aria-labelledby="template-heading">
    <form id="template-form">
      <h2 id="template-heading">New project</h2>
      <label for="template-select">Choose a template</label>
      <select id="template-select"></select>
      <label for="project-name">Project name</label>
      <input id="project-name" type="text" autocomplete="off" />
      <div class="template-dialog-actions">
        <button class="button button-quiet" id="cancel-template" type="button">Cancel</button>
        <button class="button button-primary" id="create-project" type="submit" disabled>Create project</button>
      </div>
    </form>
  </dialog>
`;
}
