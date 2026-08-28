import { defineExtension } from "../sdk";

export const arcaneThemeExtension = defineExtension({
  manifest: {
    apiVersion: 3,
    id: "spentacrm.arcane-theme",
    name: "Arcane Violet",
    version: "2.0.0",
    publisher: "SpentaCRM",
    description: "Fantasy-inspired violet glass theme with starfield motion.",
    categories: ["theme"], permissions: ["ui:theme"], builtIn: true,
  },
  contributes: { themes: [{
    id: "spentacrm.arcane-violet", label: "Arcane Violet", description: "Purple-blue glass surfaces with a subtle animated starfield.", appearance: "dark",
    tokens: {
      "--ink":"#f5f0ff","--ink-soft":"#d9ccf5","--paper":"#0c0817","--surface":"#17102a","--surface-2":"#21183a","--surface-raised":"#1c1332",
      "--line":"#392b59","--line-strong":"#5a4480","--muted":"#a99bc7","--accent":"#a78bfa","--accent-soft":"#34265a","--blue":"#17284e",
      "--yellow":"#4b3c20","--red":"#4b2335","--green":"#183b34","--success":"#6ee7b7","--warning":"#f5c96a","--danger":"#fb7185","--focus":"#c4b5fd",
      "--radius":"16px","--shadow":"0 20px 60px rgba(17,7,43,.42)","--app-sidebar-bg":"#090612","--app-sidebar-border":"#291d44","--app-sidebar-active":"#2a1e49",
      "--app-sidebar-hover":"#1b1332","--app-sidebar-text":"#ddd2f2","--app-sidebar-muted":"#80739e","--app-topbar-bg":"rgba(12,8,23,.72)"
    },
    visuals: { surfaces: { opacity: .84, blurPx: 20, saturation: 1.06, sidebarOpacity: .9, topbarOpacity: .78 }, motion: { preset: "starfield", intensity: .64, speed: .7, grain: .06, vignette: .25 } }
  }] }
});
