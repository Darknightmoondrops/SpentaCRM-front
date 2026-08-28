# B2B CRM Extension Platform (API v2)

The CRM has an extension host inspired by editor extension systems such as VS Code, but adapted to a multi-tenant B2B web application and its security boundaries.

## What can an extension contribute?

Trusted code extensions can contribute:

- `contributes.themes` — complete workspace themes.
- `contributes.modules` — full React modules with optional sidebar navigation.
- `contributes.pages` — full extension-owned pages.
- `contributes.dashboardWidgets` — widgets in named dashboard zones.
- `contributes.sidebar` — navigation links.
- `contributes.commands` — command-palette actions (`Cmd/Ctrl + K`, type `>`).
- `contributes.settings`, `contributes.entityTabs` and `contributes.entityActions` are reserved SDK contracts for the next host surfaces; API v2 does not mount them into core record pages yet.
- `contributes.remoteModules` — HTTPS applications rendered in an isolated iframe.

The stable SDK is exposed as `@b2b-crm/extension-sdk`.

## Installation models

### 1. Portable runtime extensions (no rebuild)

A portable extension is a JSON package. It can contain **themes** and/or **remote modules**. It never executes uploaded JavaScript in the CRM origin.

Install it from **Extensions → Install extension package**.

Remote modules run inside a sandboxed iframe without `allow-same-origin`. The remote application must use HTTPS (HTTP is accepted only for localhost development) and must allow iframe embedding.

Example:

```json
{
  "apiVersion": 2,
  "manifest": {
    "id": "acme.customer-portal",
    "name": "Customer Portal",
    "version": "1.0.0",
    "publisher": "Acme",
    "description": "Customer portal module",
    "categories": ["module", "integration"],
    "permissions": ["remote:frame", "ui:navigation"]
  },
  "contributes": {
    "remoteModules": [{
      "id": "portal",
      "title": "Customer Portal",
      "url": "https://portal.example.com",
      "navigation": { "label": "Portal", "section": "extensions" }
    }]
  }
}
```

See `extension-examples/remote-module/extension.json`.

### 2. Trusted code extensions

React/TypeScript extensions execute inside the CRM application, so they are deployment-trusted packages rather than arbitrary browser uploads.

```tsx
import { defineExtension } from "@b2b-crm/extension-sdk";

function RevenueModule() {
  return <section className="panel">Revenue intelligence</section>;
}

export default defineExtension({
  manifest: {
    apiVersion: 2,
    id: "acme.revenue-intelligence",
    name: "Revenue Intelligence",
    version: "1.0.0",
    publisher: "Acme",
    description: "Adds revenue intelligence to the CRM.",
    categories: ["analytics", "module"],
    permissions: ["ui:navigation", "ui:commands", "crm:deals:read"]
  },
  contributes: {
    modules: [{
      id: "revenue",
      title: "Revenue intelligence",
      navigation: { label: "Revenue", section: "relationships" },
      component: RevenueModule
    }],
    commands: [{
      id: "open-revenue",
      title: "Open revenue intelligence",
      category: "Revenue",
      href: "/extension-modules/acme.revenue-intelligence/revenue"
    }]
  }
});
```

Install and register:

```bash
npm install @acme/b2b-crm-revenue
npm run extension:add -- @acme/b2b-crm-revenue
```

Remove:

```bash
npm run extension:remove -- @acme/b2b-crm-revenue
npm uninstall @acme/b2b-crm-revenue
```

`predev` and `prebuild` regenerate `src/extensions/generated-registry.ts` automatically.

## Theme Studio

The built-in Theme Studio lets workspace administrators create themes without editing code.

Supported controls include:

- light/dark appearance;
- core palette and accent colors;
- radius and glass surfaces;
- safe typography presets and text scale;
- **remote background image URL** (HTTPS only; file uploads, `data:` and `javascript:` URLs are rejected);
- background opacity, blur, position and size;
- surface/sidebar/topbar transparency;
- animation/effect presets: `aurora`, `soft-glow`, `cyber-grid`, `scanlines`, `starfield`, `embers`, `blood-mist`;
- effect intensity/speed, grain and vignette;
- live preview;
- save/activate as a local theme extension;
- export as an installable `.extension.json` package.

Motion honors `prefers-reduced-motion`.

Theme visual schema:

```json
{
  "visuals": {
    "background": {
      "imageUrl": "https://cdn.example.com/bg.jpg",
      "opacity": 0.35,
      "blurPx": 2,
      "position": "center center",
      "size": "cover",
      "repeat": "no-repeat",
      "overlay": "rgba(0,0,0,.25)",
      "blendMode": "normal"
    },
    "surfaces": {
      "opacity": 0.82,
      "blurPx": 18,
      "saturation": 1.05,
      "sidebarOpacity": 0.9,
      "topbarOpacity": 0.8
    },
    "motion": {
      "preset": "starfield",
      "intensity": 0.6,
      "speed": 0.8,
      "grain": 0.05,
      "vignette": 0.2
    },
    "typography": {
      "family": "system",
      "scale": 1.04,
      "letterSpacingEm": 0
    }
  }
}
```

## Security model

The extension platform deliberately separates three trust levels:

1. **Theme JSON** — data-only; validated CSS tokens and HTTPS background URLs.
2. **Remote module JSON** — runtime-installable, isolated iframe; no same-origin CRM access.
3. **Code extension package** — trusted build artifact; reviewed/deployed by the operator.

Never execute uploaded bundles with `eval`, inject arbitrary scripts, or hand unrestricted CRM tokens to an extension.

When the NestJS backend is added, workspace installation should move from localStorage to server resources with explicit permission grants, package signatures, version pinning and audit events.

## Compatibility

API v2 accepts legacy API v1 portable theme packages and normalizes them to v2 at runtime. New code extensions should target v2.
