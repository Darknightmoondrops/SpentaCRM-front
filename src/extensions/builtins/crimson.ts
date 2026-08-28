import { defineExtension } from "../sdk";

export const crimsonThemeExtension = defineExtension({
  manifest: {
    apiVersion: 2,
    id: "b2bcrm.crimson-theme",
    name: "Crimson Ritual",
    version: "2.0.0",
    publisher: "B2B CRM",
    description: "A dramatic crimson glass theme with animated blood-mist ambience.",
    categories: ["theme"], permissions: ["ui:theme"], builtIn: true,
  },
  contributes: { themes: [{
    id: "b2bcrm.crimson-ritual", label: "Crimson Ritual", description: "Dark glass surfaces, deep red accents and slow atmospheric motion.", appearance: "dark",
    tokens: {
      "--ink":"#fff1f2","--ink-soft":"#e9c8cc","--paper":"#100607","--surface":"#1a0b0d","--surface-2":"#241013","--surface-raised":"#1f0d10",
      "--line":"#4a2026","--line-strong":"#74303a","--muted":"#b58c92","--accent":"#e11d48","--accent-soft":"#48101f","--blue":"#281b35",
      "--yellow":"#473818","--red":"#4a111b","--green":"#153426","--success":"#4ade80","--warning":"#f2b84b","--danger":"#fb7185","--focus":"#fb7185",
      "--radius":"14px","--shadow":"0 18px 55px rgba(50,0,8,.38)","--app-sidebar-bg":"#0b0304","--app-sidebar-border":"#351116","--app-sidebar-active":"#351019",
      "--app-sidebar-hover":"#220a0e","--app-sidebar-text":"#e7c4c9","--app-sidebar-muted":"#91636b","--app-topbar-bg":"rgba(16,6,7,.72)"
    },
    visuals: { surfaces: { opacity: .82, blurPx: 18, saturation: 1.08, sidebarOpacity: .9, topbarOpacity: .78 }, motion: { preset: "blood-mist", intensity: .72, speed: .72, grain: .18, vignette: .45 } }
  }] }
});
