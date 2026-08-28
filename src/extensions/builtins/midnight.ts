import { defineExtension } from "../sdk";

export const midnightThemeExtension = defineExtension({
  manifest: {
    apiVersion: 3, id: "spentacrm.midnight-theme", name: "Midnight", version: "1.0.0", publisher: "SpentaCRM",
    description: "Dark theme for low-light work and operations rooms.", categories: ["theme"], permissions: ["ui:theme"], builtIn: true,
  },
  contributes: { themes: [{
    id: "spentacrm.midnight", label: "Midnight", description: "Dark navy workspace with an electric blue accent.", appearance: "dark",
    tokens: {
      "--ink": "#edf2ff", "--ink-soft": "#cbd5e7", "--paper": "#0d1422", "--surface": "#131d2d", "--surface-2": "#192538",
      "--surface-raised": "#172235", "--line": "#26354d", "--line-strong": "#3b4e69", "--muted": "#98a6bb", "--accent": "#7892ff",
      "--accent-soft": "#202d55", "--blue": "#1c3152", "--yellow": "#493d1f", "--red": "#4a282c", "--green": "#1c3b32",
      "--success": "#52cf91", "--warning": "#e7ad4b", "--danger": "#ef7379", "--focus": "#7892ff", "--radius": "10px",
      "--shadow": "0 16px 42px rgba(0,0,0,.22)", "--app-sidebar-bg": "#09101b", "--app-sidebar-border": "#1c2a3f",
      "--app-sidebar-active": "#1d2c46", "--app-sidebar-hover": "#142238", "--app-sidebar-text": "#b8c5d9", "--app-sidebar-muted": "#71829a",
      "--app-topbar-bg": "rgba(13,20,34,.92)",
    },
  }] },
});
