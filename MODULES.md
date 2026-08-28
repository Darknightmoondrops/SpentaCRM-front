# SpentaCRM Module Runtime v3

SpentaCRM supports installable **project ZIP modules**. A module is not only JSON: the JSON file is the manifest, while the ZIP contains the browser-ready UI files that implement new pages, dashboard widgets, entity tabs, and module actions.

## Core rule

```text
module.zip
├── spenta-module.json   # identity, permissions and contribution map
├── src/                 # optional authoring source
├── dist/                # required browser-ready runtime surfaces
│   ├── pages/
│   ├── widgets/
│   └── tabs/
└── README.md
```

`src/` may contain TypeScript, React source, design files or build scripts for the module author. SpentaCRM does **not** compile arbitrary TypeScript after upload. Before packaging, the developer builds the runtime UI into self-contained/bundled HTML/CSS/JS files under `dist/`.

## Why this model

Next.js routes are compiled at application build time, so copying an uploaded `page.tsx` into `src/app` is not a safe or reliable production plugin system. SpentaCRM therefore provides stable host routes and extension points, while uploaded module UI is executed in isolated sandbox frames.

This gives the desired workflow:

```text
Build module project → ZIP → Modules & Extensions → Install → Enable → Use
```

without rebuilding the SpentaCRM frontend for portable modules.

## Manifest v3

```json
{
  "apiVersion": 3,
  "manifest": {
    "id": "vendor.inventory",
    "name": "Inventory Management",
    "version": "1.0.0",
    "publisher": "Vendor",
    "description": "Inventory and stock management for B2B accounts.",
    "complexity": "advanced",
    "categories": ["module"],
    "permissions": [
      "runtime:sandbox",
      "ui:navigation",
      "ui:dashboard",
      "ui:entity-tabs",
      "ui:entity-actions"
    ]
  },
  "contributes": {
    "runtimePages": [
      {
        "id": "inventory",
        "title": "Inventory",
        "entry": "dist/pages/inventory.html",
        "navigation": {
          "label": "Inventory",
          "section": "extensions"
        },
        "height": "viewport"
      }
    ],
    "runtimeDashboardWidgets": [
      {
        "id": "stock-health",
        "title": "Stock health",
        "zone": "dashboard.afterStats",
        "entry": "dist/widgets/stock-health.html",
        "height": 240
      }
    ],
    "runtimeEntityTabs": [
      {
        "id": "company-stock",
        "entity": "company",
        "label": "Inventory",
        "entry": "dist/tabs/company-stock.html",
        "height": 420
      }
    ],
    "runtimeEntityActions": [
      {
        "id": "open-inventory",
        "entity": "company",
        "label": "Open Inventory",
        "tone": "primary",
        "action": {
          "type": "open-page",
          "pageId": "inventory"
        }
      }
    ]
  }
}
```

## Runtime contribution points

### `runtimePages`
Adds a new module page through SpentaCRM's stable `/extension-pages/:extensionId/:pageId` host route. A page may also contribute a sidebar navigation item.

### `runtimeDashboardWidgets`
Adds a sandboxed module widget to one of the supported dashboard zones:

- `dashboard.afterStats`
- `dashboard.afterPipeline`
- `dashboard.afterActivity`
- `dashboard.afterAccounts`

### `runtimeEntityTabs`
Adds a module-specific tab surface to CRM records. Current host integration exists for:

- company
- contact
- deal
- project

The SDK also reserves `task` for a future task-detail host.

### `runtimeEntityActions`
Adds an action to an entity extension surface. Runtime actions currently support:

- `open-page`
- `open-url`

Trusted code extensions can still implement direct callback actions.

## Package persistence

The manifest metadata is stored with the extension registry state. Runtime ZIP files are extracted and persisted in **IndexedDB** under a module-specific key. This avoids localStorage size limits and allows a portable module to remain installed across reloads.

Uninstalling a ZIP module removes both its registry metadata and its runtime package files.

## Sandbox and bridge

Runtime HTML is rendered with an iframe sandbox and without `allow-same-origin`. SpentaCRM injects a minimal bridge:

```js
window.SpentaCRM.context
window.SpentaCRM.post(type, payload)
window.SpentaCRM.ready(payload)
window.SpentaCRM.resize(height)
window.SpentaCRM.navigate("/companies")
```

The context includes the extension ID, surface ID and — for entity tabs — the entity type and entity ID.

The module cannot directly read the parent DOM, cookies, localStorage or React state.

## Asset rules

A runtime entry is an HTML file. Local CSS, JavaScript and common media referenced by that HTML are loaded from the same ZIP. Runtime JavaScript should be bundled before packaging; relative ESM dependency graphs are intentionally not compiled by the CRM installer.

Examples:

```html
<link rel="stylesheet" href="../shared.css">
<script src="../runtime.js"></script>
```

are resolved from the installed ZIP and inlined into the sandbox document.

## Complexity tiers

- **simple** — one focused UI or workflow with minimal permissions.
- **medium** — several screens or a page plus dashboard integration.
- **advanced** — multiple extension points and richer company workflows.
- **professional** — enterprise-scale package structure, audited integrations, multiple entity surfaces, and typically a companion backend service.

The tier is descriptive; permissions still control what the package declares.

## Backend modules

The current repository is frontend-focused. A future NestJS/PostgreSQL Module Registry should extend this format with signed packages, backend service descriptors, migrations, dependency resolution, tenant installation state and audit records.

Until that backend exists, uploaded runtime code remains client-side and sandboxed. A professional module that needs privileged backend logic should run that logic in a separately deployed service/API rather than attempting to execute server code from the browser ZIP.

## Examples

`module-examples/` contains four complete runtime ZIP examples:

- `simple-module-example.zip`
- `medium-module-example.zip`
- `advanced-module-example.zip`
- `professional-module-example.zip`

Each ZIP contains its manifest and actual `dist/` runtime project files.
