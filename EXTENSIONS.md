# SpentaCRM Extension Platform (API v3)

SpentaCRM has two extension models that solve different deployment requirements.

## 1. Portable project ZIP modules

Portable modules are installed from **Modules & Extensions** without rebuilding SpentaCRM. They use a `spenta-module.json` manifest plus bundled runtime files inside the same ZIP.

API v3 portable contribution points:

- `contributes.themes`
- `contributes.remoteModules`
- `contributes.runtimePages`
- `contributes.runtimeDashboardWidgets`
- `contributes.runtimeEntityTabs`
- `contributes.runtimeEntityActions`

Runtime pages/widgets/tabs execute in sandboxed iframes. Their package assets are persisted in IndexedDB.

See [MODULES.md](./MODULES.md) for the complete package specification.

## 2. Trusted code extensions

Trusted deployment packages use `@spentacrm/extension-sdk` and are registered before `next dev` / `next build`. They can contribute native React components because an administrator explicitly trusts and deploys them with the application.

Trusted contribution points include:

- themes
- sidebar entries
- extension pages
- code modules
- dashboard widgets
- commands
- settings contracts
- entity tabs
- entity actions
- remote modules

Example:

```ts
import { defineExtension } from "@spentacrm/extension-sdk";

export default defineExtension({
  manifest: {
    apiVersion: 3,
    id: "vendor.revenue",
    name: "Revenue Intelligence",
    version: "1.0.0",
    publisher: "Vendor",
    description: "Revenue intelligence tools",
    categories: ["analytics"],
    permissions: ["ui:dashboard", "crm:deals:read"]
  },
  contributes: {
    dashboardWidgets: [/* native React widget */]
  }
});
```

Registry workflow:

```bash
npm install @vendor/spentacrm-extension
npm run extension:add -- @vendor/spentacrm-extension
npm run dev
```

## Security boundary

The distinction is intentional:

- uploaded ZIP module → **untrusted/sandboxed runtime**;
- deployment-installed code package → **trusted native code**.

SpentaCRM does not copy arbitrary uploaded `page.tsx` files into the Next.js source tree and does not eval uploaded JavaScript in the parent CRM origin.

Portable runtime frames receive a deliberately small bridge (`window.SpentaCRM`) and can only navigate to safe internal paths through that bridge. Future API versions can expand the bridge with permission-gated CRM data operations.

## Compatibility

API v3 continues to accept portable API v1/v2 theme or remote-module manifests and normalizes their metadata at runtime. New project ZIP modules should target API v3.
