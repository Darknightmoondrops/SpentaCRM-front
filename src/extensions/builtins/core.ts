import { defineExtension } from "../sdk";

export const coreThemeExtension = defineExtension({
  manifest: {
    apiVersion: 2,
    id: "b2bcrm.core-theme",
    name: "B2B CRM Clean",
    version: "1.0.0",
    publisher: "B2B CRM",
    description: "The default clean B2B workspace theme.",
    categories: ["theme"],
    permissions: ["ui:theme"],
    builtIn: true,
  },
  contributes: {
    themes: [{
      id: "b2bcrm.clean",
      label: "Clean",
      description: "Neutral light theme for everyday B2B work.",
      appearance: "light",
      tokens: {
        "--ink": "#172033", "--ink-soft": "#26344d", "--paper": "#f6f8fb", "--surface": "#ffffff",
        "--surface-2": "#f0f3f8", "--surface-raised": "#ffffff", "--line": "#e2e7ef", "--line-strong": "#c8d1df",
        "--muted": "#667085", "--accent": "#4f6ef7", "--accent-soft": "#e9edff", "--blue": "#e8efff",
        "--yellow": "#fff4d6", "--red": "#ffe7e7", "--green": "#e4f7ed", "--success": "#168556",
        "--warning": "#b86a00", "--danger": "#c63c45", "--focus": "#4f6ef7", "--radius": "10px",
        "--shadow": "0 10px 32px rgba(31,45,74,.08)", "--app-sidebar-bg": "#111827", "--app-sidebar-border": "#202a3d",
        "--app-sidebar-active": "#24314a", "--app-sidebar-hover": "#1a2639", "--app-sidebar-text": "#b7c0cf",
        "--app-sidebar-muted": "#77849a", "--app-topbar-bg": "rgba(255,255,255,.92)",
      },
    }],
  },
});
