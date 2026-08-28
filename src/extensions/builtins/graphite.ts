import { defineExtension } from "../sdk";

export const graphiteThemeExtension = defineExtension({
  manifest: {
    apiVersion: 3, id: "spentacrm.graphite-theme", name: "Graphite", version: "1.0.0", publisher: "SpentaCRM",
    description: "A low-saturation professional theme for dense workspaces.", categories: ["theme"], permissions: ["ui:theme"], builtIn: true,
  },
  contributes: { themes: [{
    id: "spentacrm.graphite", label: "Graphite", description: "Soft graphite surfaces with a teal accent.", appearance: "light",
    tokens: {
      "--ink": "#18201f", "--ink-soft": "#2d3937", "--paper": "#f3f5f4", "--surface": "#ffffff", "--surface-2": "#e9eeec",
      "--surface-raised": "#ffffff", "--line": "#dbe2df", "--line-strong": "#becbc6", "--muted": "#64706d", "--accent": "#147d73",
      "--accent-soft": "#dff3f0", "--blue": "#e6eef7", "--yellow": "#fff0cb", "--red": "#ffe5e4", "--green": "#dcf3e7",
      "--success": "#147451", "--warning": "#9a6500", "--danger": "#b94343", "--focus": "#147d73", "--radius": "8px",
      "--shadow": "0 8px 26px rgba(31,45,42,.07)", "--app-sidebar-bg": "#17201f", "--app-sidebar-border": "#293431",
      "--app-sidebar-active": "#263936", "--app-sidebar-hover": "#202d2a", "--app-sidebar-text": "#bdc9c6", "--app-sidebar-muted": "#81918c",
      "--app-topbar-bg": "rgba(255,255,255,.94)",
    },
  }] },
});
