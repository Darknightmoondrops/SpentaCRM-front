"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { extensionRegistry } from "./registry";
import {
  EXTENSION_API_VERSION,
  THEME_TOKEN_KEYS,
  type ExtensionDefinition,
  type PortableExtensionPackage,
  type RemoteModuleContribution,
  type ThemeContribution,
  type ThemeVisualProfile,
} from "./sdk";

const STATE_KEY = "b2b-crm.extensions.state.v2";
const LEGACY_STATE_KEY = "b2b-crm.extensions.state.v1";
const PACKAGES_KEY = "b2b-crm.extensions.portable-packages.v2";
const LEGACY_PACKAGES_KEY = "b2b-crm.extensions.theme-packages.v1";
const DEFAULT_THEME = "b2bcrm.clean";
const CORE_EXTENSION = "b2bcrm.core-theme";

type ExtensionState = { enabledIds: string[]; activeThemeId: string };
const DEFAULT_ENABLED_IDS = extensionRegistry.filter(x => x.manifest.id !== "b2bcrm.account-health-sample").map(x => x.manifest.id);
const DEFAULT_STATE: ExtensionState = { enabledIds: DEFAULT_ENABLED_IDS, activeThemeId: DEFAULT_THEME };
export type InstalledExtension = ExtensionDefinition & { source: "built-in" | "package" | "imported" | "custom" };
export type InstalledTheme = ThemeContribution & { extensionId: string; enabled: boolean; source: InstalledExtension["source"] };
export type InstalledRemoteModule = RemoteModuleContribution & { extensionId: string; enabled: boolean; extensionName: string };

type ExtensionContextValue = {
  extensions: InstalledExtension[];
  enabledIds: Set<string>;
  activeThemeId: string;
  activeTheme?: InstalledTheme;
  themes: InstalledTheme[];
  remoteModules: InstalledRemoteModule[];
  setExtensionEnabled: (extensionId: string, enabled: boolean) => void;
  setActiveTheme: (themeId: string) => void;
  installPortablePackage: (raw: string) => { ok: true; extensionId: string } | { ok: false; error: string };
  installThemePackage: (raw: string) => { ok: true; extensionId: string } | { ok: false; error: string };
  upsertCustomTheme: (theme: ThemeContribution, extensionId?: string) => { extensionId: string; themeId: string };
  exportThemePackage: (themeId: string) => string | null;
  uninstallExtension: (extensionId: string) => void;
};

const ExtensionContext = createContext<ExtensionContextValue | null>(null);

function loadState(): ExtensionState {
  try {
    const raw = localStorage.getItem(STATE_KEY) || localStorage.getItem(LEGACY_STATE_KEY);
    const value = JSON.parse(raw || "null") as ExtensionState | null;
    if (value?.enabledIds && value.activeThemeId) return value;
  } catch {}
  return DEFAULT_STATE;
}

function normalizePortablePackage(value: PortableExtensionPackage): PortableExtensionPackage {
  return { ...value, apiVersion: EXTENSION_API_VERSION };
}

function loadImportedPackages(): PortableExtensionPackage[] {
  try {
    const raw = localStorage.getItem(PACKAGES_KEY) || localStorage.getItem(LEGACY_PACKAGES_KEY) || "[]";
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.map(item => validatePortablePackage(item)).filter(Boolean).map(item => normalizePortablePackage(item!));
  } catch { return []; }
}

function toDefinition(pkg: PortableExtensionPackage): ExtensionDefinition {
  return {
    manifest: { ...pkg.manifest, apiVersion: EXTENSION_API_VERSION, builtIn: false },
    contributes: { themes: pkg.contributes.themes || [], remoteModules: pkg.contributes.remoteModules || [] },
  };
}

function safeNumber(value: unknown, min: number, max: number) {
  return value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max);
}

function isSafeCssValue(value: unknown, max = 240) {
  return typeof value === "string" && value.length <= max && !/(url\s*\(|expression\s*\(|@import|javascript:|data:text\/html)/i.test(value);
}

export function isSafeHttpUrl(value: string, allowHttpLocalhost = true) {
  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    if (url.protocol === "https:") return true;
    return allowHttpLocalhost && url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch { return false; }
}

function validateVisualProfile(visuals?: ThemeVisualProfile) {
  if (!visuals) return true;
  const background = visuals.background;
  if (background) {
    if (background.imageUrl && (!isSafeHttpUrl(background.imageUrl) || background.imageUrl.length > 2048)) return false;
    if (!safeNumber(background.opacity, 0, 1) || !safeNumber(background.blurPx, 0, 40)) return false;
    if (background.position !== undefined && !isSafeCssValue(background.position, 80)) return false;
    if (background.overlay !== undefined && !isSafeCssValue(background.overlay, 100)) return false;
    if (background.size && !["cover", "contain", "auto"].includes(background.size)) return false;
    if (background.repeat && !["no-repeat", "repeat", "repeat-x", "repeat-y"].includes(background.repeat)) return false;
    if (background.blendMode && !["normal", "multiply", "screen", "overlay", "soft-light", "hard-light", "color-dodge", "luminosity"].includes(background.blendMode)) return false;
  }
  const surfaces = visuals.surfaces;
  if (surfaces && (!safeNumber(surfaces.opacity, .15, 1) || !safeNumber(surfaces.blurPx, 0, 40) || !safeNumber(surfaces.saturation, .5, 2) || !safeNumber(surfaces.sidebarOpacity, .2, 1) || !safeNumber(surfaces.topbarOpacity, .2, 1))) return false;
  const motion = visuals.motion;
  if (motion) {
    if (motion.preset && !["none", "aurora", "cyber-grid", "scanlines", "embers", "blood-mist", "starfield", "soft-glow"].includes(motion.preset)) return false;
    if (!safeNumber(motion.intensity, 0, 1) || !safeNumber(motion.speed, .25, 3) || !safeNumber(motion.grain, 0, 1) || !safeNumber(motion.vignette, 0, 1)) return false;
  }
  const typography = visuals.typography;
  if (typography) {
    if (typography.family && !["system","humanist","mono"].includes(typography.family)) return false;
    if (!safeNumber(typography.scale,.9,1.18) || !safeNumber(typography.letterSpacingEm,-.03,.08)) return false;
  }
  return true;
}

function validateTheme(theme: ThemeContribution) {
  if (!theme || typeof theme.id !== "string" || !/^[a-z0-9][a-z0-9._-]{2,100}$/i.test(theme.id) || typeof theme.label !== "string" || theme.label.length > 80 || (theme.appearance !== "light" && theme.appearance !== "dark") || !theme.tokens || typeof theme.tokens !== "object") return false;
  const tokensValid = Object.entries(theme.tokens).every(([key, value]) => THEME_TOKEN_KEYS.includes(key as (typeof THEME_TOKEN_KEYS)[number]) && isSafeCssValue(value));
  return tokensValid && validateVisualProfile(theme.visuals);
}

function validateRemoteModule(module: RemoteModuleContribution) {
  return !!module && typeof module.id === "string" && /^[a-z0-9][a-z0-9._-]{2,100}$/i.test(module.id) && typeof module.title === "string" && module.title.length <= 100 && typeof module.url === "string" && isSafeHttpUrl(module.url) && (!module.navigation || (typeof module.navigation.label === "string" && module.navigation.label.length <= 60));
}

function validatePortablePackage(value: unknown): PortableExtensionPackage | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as PortableExtensionPackage;
  if (![1, EXTENSION_API_VERSION].includes(candidate.apiVersion)) return null;
  const manifest = candidate.manifest;
  if (!manifest || typeof manifest.id !== "string" || !/^[a-z0-9][a-z0-9._-]{2,80}$/i.test(manifest.id) || typeof manifest.name !== "string" || typeof manifest.version !== "string" || typeof manifest.publisher !== "string" || typeof manifest.description !== "string") return null;
  if (!Array.isArray(manifest.categories) || !candidate.contributes || typeof candidate.contributes !== "object") return null;
  const allowedCategories = new Set(["theme","module","productivity","analytics","integration","automation","data","developer"]);
  const allowedPermissions = new Set(["ui:theme","ui:dashboard","ui:navigation","ui:commands","ui:settings","ui:entity-tabs","ui:entity-actions","remote:frame","crm:companies:read","crm:companies:write","crm:contacts:read","crm:contacts:write","crm:deals:read","crm:deals:write","crm:projects:read","crm:projects:write","crm:tasks:read","crm:tasks:write","crm:activities:read","crm:activities:write"]);
  if (!manifest.categories.every(category => allowedCategories.has(category)) || (manifest.permissions && (!Array.isArray(manifest.permissions) || !manifest.permissions.every(permission => allowedPermissions.has(permission))))) return null;
  const themes = candidate.contributes.themes || [];
  const remoteModules = candidate.contributes.remoteModules || [];
  if (!Array.isArray(themes) || !Array.isArray(remoteModules) || (!themes.length && !remoteModules.length)) return null;
  if (!themes.every(validateTheme) || !remoteModules.every(validateRemoteModule)) return null;
  if (themes.length && !(manifest.permissions || []).includes("ui:theme")) return null;
  if (remoteModules.length && !(manifest.permissions || []).includes("remote:frame")) return null;
  return candidate;
}

function cssUrl(value?: string) {
  return value && isSafeHttpUrl(value) ? `url(${JSON.stringify(value)})` : "none";
}

function visualDefaults(visuals?: ThemeVisualProfile) {
  return {
    image: cssUrl(visuals?.background?.imageUrl),
    opacity: visuals?.background?.opacity ?? 0,
    blur: visuals?.background?.blurPx ?? 0,
    position: visuals?.background?.position || "center center",
    size: visuals?.background?.size || "cover",
    repeat: visuals?.background?.repeat || "no-repeat",
    overlay: visuals?.background?.overlay || "transparent",
    blend: visuals?.background?.blendMode || "normal",
    surfaceOpacity: visuals?.surfaces?.opacity ?? 1,
    surfaceBlur: visuals?.surfaces?.blurPx ?? 0,
    surfaceSaturation: visuals?.surfaces?.saturation ?? 1,
    sidebarOpacity: visuals?.surfaces?.sidebarOpacity ?? 1,
    topbarOpacity: visuals?.surfaces?.topbarOpacity ?? 1,
    effect: visuals?.motion?.preset || "none",
    intensity: visuals?.motion?.intensity ?? .5,
    speed: visuals?.motion?.speed ?? 1,
    grain: visuals?.motion?.grain ?? 0,
    vignette: visuals?.motion?.vignette ?? 0,
    fontFamily: visuals?.typography?.family || "system",
    fontScale: visuals?.typography?.scale ?? 1,
    letterSpacing: visuals?.typography?.letterSpacingEm ?? 0,
  };
}

function ThemeLayers({ effect }: { effect: string }) {
  return <div className="crm-theme-layers" aria-hidden="true">
    <div className="crm-theme-background" />
    <div className="crm-theme-overlay" />
    <div className="crm-theme-effects" data-effect={effect}><i/><i/><i/></div>
    <div className="crm-theme-grain" />
    <div className="crm-theme-vignette" />
  </div>;
}

export function ExtensionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ExtensionState>(DEFAULT_STATE);
  const [importedPackages, setImportedPackages] = useState<PortableExtensionPackage[]>([]);

  useEffect(() => {
    setState(loadState());
    const packages = loadImportedPackages();
    setImportedPackages(packages);
    localStorage.setItem(PACKAGES_KEY, JSON.stringify(packages));
  }, []);

  const extensions = useMemo<InstalledExtension[]>(() => [
    ...extensionRegistry.map(extension => ({ ...extension, source: extension.manifest.builtIn ? "built-in" as const : "package" as const })),
    ...importedPackages.map(pkg => ({ ...toDefinition(pkg), source: pkg.manifest.id.startsWith("local.theme.") ? "custom" as const : "imported" as const })),
  ], [importedPackages]);

  const enabledIds = useMemo(() => new Set([CORE_EXTENSION, ...state.enabledIds]), [state.enabledIds]);
  const themes = useMemo<InstalledTheme[]>(() => extensions.flatMap(extension => (extension.contributes?.themes || []).map(theme => ({ ...theme, extensionId: extension.manifest.id, enabled: enabledIds.has(extension.manifest.id), source: extension.source }))), [extensions, enabledIds]);
  const activeTheme = themes.find(theme => theme.id === state.activeThemeId && theme.enabled) || themes.find(theme => theme.id === DEFAULT_THEME);
  const remoteModules = useMemo<InstalledRemoteModule[]>(() => extensions.flatMap(extension => (extension.contributes?.remoteModules || []).map(module => ({ ...module, extensionId: extension.manifest.id, extensionName: extension.manifest.name, enabled: enabledIds.has(extension.manifest.id) }))), [extensions, enabledIds]);

  const persistState = useCallback((next: ExtensionState) => {
    setState(next);
    localStorage.setItem(STATE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    const selected = activeTheme;
    if (!selected) return;
    const root = document.documentElement;
    const baseTheme = themes.find(theme => theme.id === DEFAULT_THEME);
    const tokens = { ...(baseTheme?.tokens || {}), ...selected.tokens };
    const visual = visualDefaults(selected.visuals);
    root.dataset.crmTheme = selected.id;
    root.dataset.themeAppearance = selected.appearance;
    root.dataset.crmEffect = visual.effect;
    root.style.colorScheme = selected.appearance;
    for (const [key, value] of Object.entries(tokens)) if (typeof value === "string") root.style.setProperty(key, value);
    const surfacePct = Math.round(visual.surfaceOpacity * 10000) / 100;
    const sidebarPct = Math.round(visual.sidebarOpacity * 10000) / 100;
    const topbarPct = Math.round(visual.topbarOpacity * 10000) / 100;
    if (tokens["--surface"]) root.style.setProperty("--surface", `color-mix(in srgb, ${tokens["--surface"]} ${surfacePct}%, transparent)`);
    if (tokens["--surface-2"]) root.style.setProperty("--surface-2", `color-mix(in srgb, ${tokens["--surface-2"]} ${surfacePct}%, transparent)`);
    if (tokens["--surface-raised"]) root.style.setProperty("--surface-raised", `color-mix(in srgb, ${tokens["--surface-raised"]} ${surfacePct}%, transparent)`);
    if (tokens["--app-sidebar-bg"]) root.style.setProperty("--app-sidebar-bg", `color-mix(in srgb, ${tokens["--app-sidebar-bg"]} ${sidebarPct}%, transparent)`);
    if (tokens["--app-topbar-bg"]) root.style.setProperty("--app-topbar-bg", `color-mix(in srgb, ${tokens["--app-topbar-bg"]} ${topbarPct}%, transparent)`);
    root.style.setProperty("--crm-bg-image", visual.image);
    root.style.setProperty("--crm-bg-opacity", String(visual.opacity));
    root.style.setProperty("--crm-bg-blur", `${visual.blur}px`);
    root.style.setProperty("--crm-bg-position", visual.position);
    root.style.setProperty("--crm-bg-size", visual.size);
    root.style.setProperty("--crm-bg-repeat", visual.repeat);
    root.style.setProperty("--crm-bg-overlay", visual.overlay);
    root.style.setProperty("--crm-bg-blend", visual.blend);
    root.style.setProperty("--crm-surface-opacity", String(visual.surfaceOpacity));
    root.style.setProperty("--crm-surface-blur", `${visual.surfaceBlur}px`);
    root.style.setProperty("--crm-surface-saturation", String(visual.surfaceSaturation));
    root.style.setProperty("--crm-sidebar-opacity", String(visual.sidebarOpacity));
    root.style.setProperty("--crm-topbar-opacity", String(visual.topbarOpacity));
    root.style.setProperty("--crm-motion-intensity", String(visual.intensity));
    root.style.setProperty("--crm-motion-speed", String(visual.speed));
    root.style.setProperty("--crm-motion-duration", `${20 / visual.speed}s`);
    root.style.setProperty("--crm-motion-duration-fast", `${10 / visual.speed}s`);
    root.style.setProperty("--crm-motion-duration-slow", `${34 / visual.speed}s`);
    root.style.setProperty("--crm-grain-opacity", String(visual.grain));
    root.style.setProperty("--crm-vignette-opacity", String(visual.vignette));
    const fontStacks = {
      system: 'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
      humanist: '"Trebuchet MS","Segoe UI",ui-sans-serif,system-ui,sans-serif',
      mono: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace',
    } as const;
    root.style.setProperty("--crm-font-family", fontStacks[visual.fontFamily]);
    root.style.setProperty("--crm-font-scale", String(visual.fontScale));
    root.style.setProperty("--crm-letter-spacing", `${visual.letterSpacing}em`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tokens["--paper"] || (selected.appearance === "dark" ? "#0d1422" : "#f6f8fb"));
  }, [activeTheme, themes]);

  const setExtensionEnabled = useCallback((extensionId: string, enabled: boolean) => {
    if (extensionId === CORE_EXTENSION) return;
    setState(current => {
      const ids = new Set(current.enabledIds);
      enabled ? ids.add(extensionId) : ids.delete(extensionId);
      let activeThemeId = current.activeThemeId;
      if (!enabled && extensions.find(x => x.manifest.id === extensionId)?.contributes?.themes?.some(theme => theme.id === activeThemeId)) activeThemeId = DEFAULT_THEME;
      const next = { enabledIds: [...ids], activeThemeId };
      localStorage.setItem(STATE_KEY, JSON.stringify(next));
      return next;
    });
  }, [extensions]);

  const setActiveTheme = useCallback((themeId: string) => {
    const theme = themes.find(item => item.id === themeId);
    if (!theme || !theme.enabled) return;
    persistState({ ...state, activeThemeId: themeId });
  }, [persistState, state, themes]);

  const persistPackages = useCallback((packages: PortableExtensionPackage[]) => {
    setImportedPackages(packages);
    localStorage.setItem(PACKAGES_KEY, JSON.stringify(packages));
  }, []);

  const installPortablePackage = useCallback((raw: string) => {
    try {
      const parsed = validatePortablePackage(JSON.parse(raw));
      if (!parsed) return { ok: false as const, error: "Invalid extension package, unsafe URL/CSS, or unsupported contribution." };
      const normalized = normalizePortablePackage(parsed);
      if (extensionRegistry.some(item => item.manifest.id === normalized.manifest.id) || importedPackages.some(item => item.manifest.id === normalized.manifest.id)) return { ok: false as const, error: "An extension with this ID is already installed." };
      const existingThemeIds = new Set(extensions.flatMap(item => item.contributes?.themes?.map(theme => theme.id) || []));
      if ((normalized.contributes.themes || []).some(theme => existingThemeIds.has(theme.id))) return { ok: false as const, error: "A theme with this ID is already installed." };
      persistPackages([...importedPackages, normalized]);
      setState(current => {
        const next = { ...current, enabledIds: [...new Set([...current.enabledIds, normalized.manifest.id])] };
        localStorage.setItem(STATE_KEY, JSON.stringify(next));
        return next;
      });
      return { ok: true as const, extensionId: normalized.manifest.id };
    } catch { return { ok: false as const, error: "The selected extension package is not valid JSON." }; }
  }, [extensions, importedPackages, persistPackages]);

  const upsertCustomTheme = useCallback((theme: ThemeContribution, extensionId?: string) => {
    if (!validateTheme(theme)) throw new Error("Invalid theme configuration.");
    const safeLabel = theme.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "custom";
    const id = extensionId?.startsWith("local.theme.") ? extensionId : `local.theme.${safeLabel}.${Date.now().toString(36)}`;
    const pkg: PortableExtensionPackage = {
      apiVersion: EXTENSION_API_VERSION,
      manifest: { id, name: theme.label, version: "1.0.0", publisher: "Local workspace", description: theme.description || "Custom workspace theme.", categories: ["theme"], permissions: ["ui:theme"] },
      contributes: { themes: [theme] },
    };
    const next = importedPackages.some(item => item.manifest.id === id) ? importedPackages.map(item => item.manifest.id === id ? pkg : item) : [...importedPackages, pkg];
    persistPackages(next);
    setState(current => {
      const nextState = { enabledIds: [...new Set([...current.enabledIds, id])], activeThemeId: theme.id };
      localStorage.setItem(STATE_KEY, JSON.stringify(nextState));
      return nextState;
    });
    return { extensionId: id, themeId: theme.id };
  }, [importedPackages, persistPackages]);

  const exportThemePackage = useCallback((themeId: string) => {
    const theme = themes.find(item => item.id === themeId);
    if (!theme) return null;
    const extension = extensions.find(item => item.manifest.id === theme.extensionId);
    const sharedId = `shared.${theme.id.replace(/[^a-z0-9._-]/gi, "-")}`;
    const pkg: PortableExtensionPackage = {
      apiVersion: EXTENSION_API_VERSION,
      manifest: {
        id: sharedId,
        name: theme.label,
        version: extension?.manifest.version || "1.0.0",
        publisher: extension?.manifest.publisher || "Workspace export",
        description: theme.description || "Exported CRM theme.",
        categories: ["theme"], permissions: ["ui:theme"],
      },
      contributes: { themes: [{ id: sharedId, label: theme.label, description: theme.description, appearance: theme.appearance, tokens: theme.tokens, visuals: theme.visuals }] },
    };
    return JSON.stringify(pkg, null, 2);
  }, [extensions, themes]);

  const uninstallExtension = useCallback((extensionId: string) => {
    const ext = extensions.find(item => item.manifest.id === extensionId);
    if (!ext || !["imported", "custom"].includes(ext.source)) return;
    persistPackages(importedPackages.filter(item => item.manifest.id !== extensionId));
    setState(current => {
      const next = { enabledIds: current.enabledIds.filter(id => id !== extensionId), activeThemeId: ext.contributes?.themes?.some(theme => theme.id === current.activeThemeId) ? DEFAULT_THEME : current.activeThemeId };
      localStorage.setItem(STATE_KEY, JSON.stringify(next));
      return next;
    });
  }, [extensions, importedPackages, persistPackages]);

  const value = useMemo<ExtensionContextValue>(() => ({
    extensions, enabledIds, activeThemeId: state.activeThemeId, activeTheme, themes, remoteModules,
    setExtensionEnabled, setActiveTheme, installPortablePackage, installThemePackage: installPortablePackage, upsertCustomTheme, exportThemePackage, uninstallExtension,
  }), [extensions, enabledIds, state.activeThemeId, activeTheme, themes, remoteModules, setExtensionEnabled, setActiveTheme, installPortablePackage, upsertCustomTheme, exportThemePackage, uninstallExtension]);

  const effect = visualDefaults(activeTheme?.visuals).effect;
  return <ExtensionContext.Provider value={value}><ThemeLayers effect={effect}/>{children}</ExtensionContext.Provider>;
}

export function useExtensions() {
  const context = useContext(ExtensionContext);
  if (!context) throw new Error("useExtensions must be used inside ExtensionProvider");
  return context;
}
