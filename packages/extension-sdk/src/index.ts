import type { ComponentType } from "react";

export const EXTENSION_API_VERSION = 3 as const;
export const LEGACY_EXTENSION_API_VERSIONS = [1, 2] as const;

export type ModuleComplexity = "simple" | "medium" | "advanced" | "professional";

export type ExtensionCategory =
  | "theme"
  | "module"
  | "productivity"
  | "analytics"
  | "integration"
  | "automation"
  | "data"
  | "developer";

export type ExtensionPermission =
  | "ui:theme"
  | "ui:dashboard"
  | "ui:navigation"
  | "ui:commands"
  | "ui:settings"
  | "ui:entity-tabs"
  | "ui:entity-actions"
  | "remote:frame"
  | "runtime:sandbox"
  | "crm:companies:read"
  | "crm:companies:write"
  | "crm:contacts:read"
  | "crm:contacts:write"
  | "crm:deals:read"
  | "crm:deals:write"
  | "crm:projects:read"
  | "crm:projects:write"
  | "crm:tasks:read"
  | "crm:tasks:write"
  | "crm:activities:read"
  | "crm:activities:write";

export type ThemeAppearance = "light" | "dark";
export type ThemeEffectPreset = "none" | "aurora" | "cyber-grid" | "scanlines" | "embers" | "blood-mist" | "starfield" | "soft-glow";
export type ThemeBackgroundSize = "cover" | "contain" | "auto";
export type ThemeBackgroundRepeat = "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
export type ThemeBlendMode = "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light" | "color-dodge" | "luminosity";

export type ThemeTokens = {
  "--ink": string;
  "--ink-soft": string;
  "--paper": string;
  "--surface": string;
  "--surface-2": string;
  "--surface-raised": string;
  "--line": string;
  "--line-strong": string;
  "--muted": string;
  "--accent": string;
  "--accent-soft": string;
  "--blue": string;
  "--yellow": string;
  "--red": string;
  "--green": string;
  "--success": string;
  "--warning": string;
  "--danger": string;
  "--focus": string;
  "--radius": string;
  "--shadow": string;
  "--app-sidebar-bg": string;
  "--app-sidebar-border": string;
  "--app-sidebar-active": string;
  "--app-sidebar-hover": string;
  "--app-sidebar-text": string;
  "--app-sidebar-muted": string;
  "--app-topbar-bg": string;
};

export const THEME_TOKEN_KEYS = [
  "--ink", "--ink-soft", "--paper", "--surface", "--surface-2", "--surface-raised", "--line", "--line-strong", "--muted", "--accent", "--accent-soft", "--blue", "--yellow", "--red", "--green", "--success", "--warning", "--danger", "--focus", "--radius", "--shadow", "--app-sidebar-bg", "--app-sidebar-border", "--app-sidebar-active", "--app-sidebar-hover", "--app-sidebar-text", "--app-sidebar-muted", "--app-topbar-bg",
] as const;

export type ThemeBackground = {
  imageUrl?: string;
  opacity?: number;
  blurPx?: number;
  position?: string;
  size?: ThemeBackgroundSize;
  repeat?: ThemeBackgroundRepeat;
  overlay?: string;
  blendMode?: ThemeBlendMode;
};

export type ThemeSurfaceEffects = {
  opacity?: number;
  blurPx?: number;
  saturation?: number;
  sidebarOpacity?: number;
  topbarOpacity?: number;
};

export type ThemeMotion = {
  preset?: ThemeEffectPreset;
  intensity?: number;
  speed?: number;
  grain?: number;
  vignette?: number;
};

export type ThemeTypography = {
  family?: "system" | "humanist" | "mono";
  scale?: number;
  letterSpacingEm?: number;
};

export type ThemeVisualProfile = {
  background?: ThemeBackground;
  surfaces?: ThemeSurfaceEffects;
  motion?: ThemeMotion;
  typography?: ThemeTypography;
};

export type ThemeContribution = {
  id: string;
  label: string;
  description?: string;
  appearance: ThemeAppearance;
  tokens: Partial<ThemeTokens>;
  visuals?: ThemeVisualProfile;
};

export type NavigationSection = "overview" | "relationships" | "delivery" | "workspace" | "extensions";

export type SidebarContribution = {
  id: string;
  label: string;
  href?: string;
  pageId?: string;
  section?: NavigationSection;
};

export type ExtensionPageProps = {
  extensionId: string;
  pageId: string;
};

export type PageContribution = {
  id: string;
  title: string;
  description?: string;
  component: ComponentType<ExtensionPageProps>;
};

export type RemoteModuleContribution = {
  id: string;
  title: string;
  description?: string;
  url: string;
  navigation?: { label: string; section?: NavigationSection };
  height?: "viewport" | "content";
};

export type ExtensionModuleProps = {
  extensionId: string;
  moduleId: string;
};

export type ModuleContribution = {
  id: string;
  title: string;
  description?: string;
  navigation?: { label: string; section?: NavigationSection };
  component: ComponentType<ExtensionModuleProps>;
};

export type DashboardWidgetProps = { extensionId: string };
export type DashboardWidgetZone = "dashboard.afterStats" | "dashboard.afterPipeline" | "dashboard.afterActivity" | "dashboard.afterAccounts";
export type DashboardWidgetContribution = {
  id: string;
  title: string;
  zone: DashboardWidgetZone;
  component: ComponentType<DashboardWidgetProps>;
};

export type ExtensionCommandContext = { pathname: string };
export type CommandContribution = {
  id: string;
  title: string;
  category?: string;
  keywords?: string[];
  href?: string;
  run?: (context: ExtensionCommandContext) => void | Promise<void>;
};

export type ExtensionSettingsProps = { extensionId: string; settingsId: string };
export type SettingsContribution = {
  id: string;
  title: string;
  description?: string;
  component: ComponentType<ExtensionSettingsProps>;
};

export type EntityKind = "company" | "contact" | "deal" | "project" | "task";
export type EntityContributionProps = { extensionId: string; entityType: EntityKind; entityId: string };
export type EntityTabContribution = {
  id: string;
  entity: EntityKind;
  label: string;
  component: ComponentType<EntityContributionProps>;
};
export type EntityActionContribution = {
  id: string;
  entity: EntityKind;
  label: string;
  tone?: "default" | "primary" | "danger";
  run: (props: EntityContributionProps) => void | Promise<void>;
};


export type RuntimeSurfaceHeight = "compact" | "content" | "viewport";

/**
 * A UI surface shipped inside an uploaded SpentaCRM module ZIP.
 * `entry` points to a bundled HTML file inside the archive (for example `dist/pages/inventory.html`).
 * Runtime surfaces are always rendered in sandboxed iframes and never receive same-origin access.
 */
export type RuntimePageContribution = {
  id: string;
  title: string;
  description?: string;
  entry: string;
  navigation?: { label: string; section?: NavigationSection };
  height?: RuntimeSurfaceHeight;
};

export type RuntimeDashboardWidgetContribution = {
  id: string;
  title: string;
  zone: DashboardWidgetZone;
  entry: string;
  height?: number;
};

export type RuntimeEntityTabContribution = {
  id: string;
  entity: EntityKind;
  label: string;
  entry: string;
  height?: number;
};

export type RuntimeEntityAction =
  | { type: "open-page"; pageId: string }
  | { type: "open-url"; url: string };

export type RuntimeEntityActionContribution = {
  id: string;
  entity: EntityKind;
  label: string;
  tone?: "default" | "primary" | "danger";
  action: RuntimeEntityAction;
};

export type ExtensionManifest = {
  apiVersion: typeof EXTENSION_API_VERSION;
  id: string;
  name: string;
  version: string;
  publisher: string;
  description: string;
  categories: ExtensionCategory[];
  permissions?: ExtensionPermission[];
  homepage?: string;
  license?: string;
  builtIn?: boolean;
  iconUrl?: string;
  /** Human-facing module complexity tier used by the SpentaCRM module catalogue. */
  complexity?: ModuleComplexity;
};

export type ExtensionDefinition = {
  manifest: ExtensionManifest;
  contributes?: {
    themes?: ThemeContribution[];
    sidebar?: SidebarContribution[];
    pages?: PageContribution[];
    modules?: ModuleContribution[];
    remoteModules?: RemoteModuleContribution[];
    dashboardWidgets?: DashboardWidgetContribution[];
    commands?: CommandContribution[];
    settings?: SettingsContribution[];
    entityTabs?: EntityTabContribution[];
    entityActions?: EntityActionContribution[];
    /** Sandboxed surfaces delivered inside an uploaded module ZIP. */
    runtimePages?: RuntimePageContribution[];
    runtimeDashboardWidgets?: RuntimeDashboardWidgetContribution[];
    runtimeEntityTabs?: RuntimeEntityTabContribution[];
    runtimeEntityActions?: RuntimeEntityActionContribution[];
  };
};

/**
 * Serializable manifest stored in `spenta-module.json`. A module ZIP may also contain
 * bundled HTML/CSS/JS/assets referenced by the runtime contribution `entry` fields.
 * Those files execute only inside sandboxed iframes.
 */
export type PortableExtensionPackage = {
  apiVersion: typeof EXTENSION_API_VERSION | 2 | 1;
  manifest: Omit<ExtensionManifest, "apiVersion" | "builtIn"> & { apiVersion?: never };
  contributes: {
    themes?: ThemeContribution[];
    remoteModules?: RemoteModuleContribution[];
    runtimePages?: RuntimePageContribution[];
    runtimeDashboardWidgets?: RuntimeDashboardWidgetContribution[];
    runtimeEntityTabs?: RuntimeEntityTabContribution[];
    runtimeEntityActions?: RuntimeEntityActionContribution[];
  };
};

export type PortableThemeExtensionPackage = PortableExtensionPackage;

export function defineExtension<T extends ExtensionDefinition>(extension: T): T { return extension; }
export function defineTheme(theme: ThemeContribution): ThemeContribution { return theme; }
