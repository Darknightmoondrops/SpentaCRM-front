"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { isSafeHttpUrl, useExtensions } from "@/extensions/extension-provider";
import type { ThemeContribution, ThemeEffectPreset } from "@/extensions/sdk";

const effects: Array<{ id: ThemeEffectPreset; label: string; help: string }> = [
  { id: "none", label: "None", help: "Static and distraction-free." },
  { id: "aurora", label: "Aurora", help: "Slow luminous color clouds." },
  { id: "soft-glow", label: "Soft glow", help: "Ambient moving light." },
  { id: "cyber-grid", label: "Cyber grid", help: "Animated technical grid." },
  { id: "scanlines", label: "Scanlines", help: "Subtle terminal display motion." },
  { id: "starfield", label: "Starfield", help: "Fantasy / cosmic particles." },
  { id: "embers", label: "Embers", help: "Warm drifting sparks." },
  { id: "blood-mist", label: "Blood mist", help: "Deep crimson atmospheric fog." },
];

const fallbackTokens = {
  "--paper": "#f6f8fb", "--surface": "#ffffff", "--surface-2": "#f0f3f8", "--surface-raised": "#ffffff",
  "--ink": "#172033", "--ink-soft": "#26344d", "--muted": "#667085", "--line": "#e2e7ef", "--line-strong": "#c8d1df",
  "--accent": "#4f6ef7", "--accent-soft": "#e9edff", "--focus": "#4f6ef7", "--radius": "10px", "--shadow": "0 10px 32px rgba(31,45,74,.08)",
  "--app-sidebar-bg": "#111827", "--app-sidebar-border": "#202a3d", "--app-sidebar-active": "#24314a", "--app-sidebar-hover": "#1a2639", "--app-sidebar-text": "#b7c0cf", "--app-sidebar-muted": "#77849a", "--app-topbar-bg": "rgba(255,255,255,.92)",
};

function cloneTheme(source?: ThemeContribution): ThemeContribution {
  const id = `user.theme.${Date.now().toString(36)}`;
  return {
    id,
    label: source ? `${source.label} Custom` : "My Custom Theme",
    description: source?.description || "Custom workspace theme created in Theme Studio.",
    appearance: source?.appearance || "light",
    tokens: { ...fallbackTokens, ...(source?.tokens || {}) },
    visuals: {
      background: { opacity: 0, blurPx: 0, position: "center center", size: "cover", repeat: "no-repeat", overlay: "transparent", blendMode: "normal", ...(source?.visuals?.background || {}) },
      surfaces: { opacity: 1, blurPx: 0, saturation: 1, sidebarOpacity: 1, topbarOpacity: 1, ...(source?.visuals?.surfaces || {}) },
      motion: { preset: "none", intensity: .5, speed: 1, grain: 0, vignette: 0, ...(source?.visuals?.motion || {}) },
      typography: { family: "system", scale: 1, letterSpacingEm: 0, ...(source?.visuals?.typography || {}) },
    },
  };
}

function download(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}

export function ThemeStudio({ initialThemeId, onClose, onMessage }: { initialThemeId?: string; onClose: () => void; onMessage: (message: string) => void }) {
  const { themes, upsertCustomTheme, exportThemePackage } = useExtensions();
  const source = themes.find(theme => theme.id === initialThemeId);
  const [draft, setDraft] = useState<ThemeContribution>(() => cloneTheme(source));
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ extensionId: string; themeId: string } | null>(null);

  useEffect(() => { setDraft(cloneTheme(source)); setSaved(null); }, [initialThemeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const bg = draft.visuals?.background || {};
  const surfaces = draft.visuals?.surfaces || {};
  const motion = draft.visuals?.motion || {};
  const typography = draft.visuals?.typography || {};
  const previewStyle = useMemo(() => ({
    "--preview-paper": draft.tokens["--paper"] || fallbackTokens["--paper"],
    "--preview-surface": draft.tokens["--surface"] || fallbackTokens["--surface"],
    "--preview-ink": draft.tokens["--ink"] || fallbackTokens["--ink"],
    "--preview-muted": draft.tokens["--muted"] || fallbackTokens["--muted"],
    "--preview-line": draft.tokens["--line"] || fallbackTokens["--line"],
    "--preview-accent": draft.tokens["--accent"] || fallbackTokens["--accent"],
    "--preview-sidebar": draft.tokens["--app-sidebar-bg"] || fallbackTokens["--app-sidebar-bg"],
    "--preview-radius": draft.tokens["--radius"] || "10px",
    "--preview-bg": bg.imageUrl && isSafeHttpUrl(bg.imageUrl) ? `url(${JSON.stringify(bg.imageUrl)})` : "none",
    "--preview-bg-opacity": String(bg.opacity ?? 0),
    "--preview-bg-blur": `${bg.blurPx ?? 0}px`,
    "--preview-bg-position": bg.position || "center center",
    "--preview-bg-size": bg.size || "cover",
    "--preview-bg-repeat": bg.repeat || "no-repeat",
    "--preview-overlay": bg.overlay || "transparent",
    "--preview-blend": bg.blendMode || "normal",
    "--preview-surface-opacity": String(surfaces.opacity ?? 1),
    "--preview-surface-alpha": `${Math.round((surfaces.opacity ?? 1) * 100)}%`,
    "--preview-blur": `${surfaces.blurPx ?? 0}px`,
    "--preview-speed": String(motion.speed ?? 1),
    "--preview-intensity": String(motion.intensity ?? .5),
    "--preview-font": typography.family === "mono" ? 'ui-monospace,SFMono-Regular,Menlo,monospace' : typography.family === "humanist" ? '"Trebuchet MS","Segoe UI",sans-serif' : 'ui-sans-serif,system-ui,"Segoe UI",sans-serif',
    "--preview-font-scale": String(typography.scale ?? 1),
  } as CSSProperties), [draft, bg.imageUrl, bg.opacity, surfaces.opacity, surfaces.blurPx, motion.speed, motion.intensity, typography.family, typography.scale]);

  function token(key: keyof typeof fallbackTokens, value: string) { setDraft(current => ({ ...current, tokens: { ...current.tokens, [key]: value } })); }
  function background(patch: NonNullable<ThemeContribution["visuals"]>["background"]) { setDraft(current => ({ ...current, visuals: { ...current.visuals, background: { ...current.visuals?.background, ...patch } } })); }
  function surface(patch: NonNullable<ThemeContribution["visuals"]>["surfaces"]) { setDraft(current => ({ ...current, visuals: { ...current.visuals, surfaces: { ...current.visuals?.surfaces, ...patch } } })); }
  function animate(patch: NonNullable<ThemeContribution["visuals"]>["motion"]) { setDraft(current => ({ ...current, visuals: { ...current.visuals, motion: { ...current.visuals?.motion, ...patch } } })); }
  function typographyPatch(patch: NonNullable<ThemeContribution["visuals"]>["typography"]) { setDraft(current => ({ ...current, visuals: { ...current.visuals, typography: { ...current.visuals?.typography, ...patch } } })); }

  function save() {
    if (!draft.label.trim()) { onMessage("Theme name is required."); return; }
    if (bg.imageUrl && !isSafeHttpUrl(bg.imageUrl)) { setBackgroundError("Only HTTPS image URLs are accepted. HTTP is allowed only for localhost during development."); return; }
    try {
      const result = upsertCustomTheme({ ...draft, label: draft.label.trim(), description: draft.description?.trim() }, saved?.extensionId);
      setSaved(result);
      onMessage(`Saved and activated ${draft.label}.`);
    } catch { onMessage("Theme validation failed. Check URLs, colors and visual values."); }
  }

  function exportTheme() {
    if (!saved) { onMessage("Save the theme before exporting it."); return; }
    const raw = exportThemePackage(saved.themeId);
    if (!raw) return;
    download(`${draft.label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "crm-theme"}.extension.json`, raw);
  }

  return <div className="theme-studio-shell">
    <div className="theme-studio-head"><div><span className="eyebrow">THEME STUDIO · LIVE</span><h2>Build a workspace theme</h2><p>Create reusable themes without editing CRM code. Backgrounds accept remote image URLs only; uploads and data URLs are rejected.</p></div><button className="secondary-button" onClick={onClose}>Close studio</button></div>
    <div className="theme-studio-layout">
      <div className="theme-studio-controls">
        <section className="theme-control-section"><div className="theme-control-title"><strong>Identity</strong><span>Name and appearance</span></div><div className="theme-form-grid">
          <label className="field"><span>Name</span><input value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })}/></label>
          <label className="field"><span>Appearance</span><select value={draft.appearance} onChange={e => setDraft({ ...draft, appearance: e.target.value as "light" | "dark" })}><option value="light">Light</option><option value="dark">Dark</option></select></label>
        </div><label className="field"><span>Description</span><input value={draft.description || ""} onChange={e => setDraft({ ...draft, description: e.target.value })}/></label></section>

        <section className="theme-control-section"><div className="theme-control-title"><strong>Palette</strong><span>Core visual tokens</span></div><div className="theme-color-grid">
          {([ ["--paper","Background"], ["--surface","Surface"], ["--ink","Text"], ["--muted","Muted"], ["--accent","Accent"], ["--line","Border"], ["--app-sidebar-bg","Sidebar"] ] as const).map(([key,label]) => <label key={key}><span>{label}</span><div><input type="color" value={(draft.tokens[key] as string || fallbackTokens[key]).slice(0,7)} onChange={e => token(key,e.target.value)}/><code>{draft.tokens[key] || fallbackTokens[key]}</code></div></label>)}
        </div><label className="field"><span>Corner radius</span><select value={draft.tokens["--radius"] || "10px"} onChange={e => token("--radius",e.target.value)}><option>0px</option><option>6px</option><option>10px</option><option>14px</option><option>18px</option><option>24px</option></select></label></section>

        <section className="theme-control-section"><div className="theme-control-title"><strong>Background image</strong><span>Remote URL only</span></div><label className="field"><span>Image URL</span><input type="url" placeholder="https://images.example.com/background.jpg" value={bg.imageUrl || ""} onChange={e => { const value=e.target.value; background({ imageUrl:value }); setBackgroundError(value && !isSafeHttpUrl(value) ? "Use an HTTPS URL. Localhost HTTP is allowed for development." : null); }}/>{backgroundError && <small className="field-error">{backgroundError}</small>}</label>
          <div className="theme-range-grid"><Range label="Image opacity" value={bg.opacity ?? 0} min={0} max={1} step={.05} onChange={value => background({ opacity:value })}/><Range label="Image blur" value={bg.blurPx ?? 0} min={0} max={30} step={1} suffix="px" onChange={value => background({ blurPx:value })}/></div>
          <div className="theme-form-grid"><label className="field"><span>Position</span><select value={bg.position || "center center"} onChange={e => background({ position:e.target.value })}><option value="center center">Center</option><option value="center top">Top</option><option value="center bottom">Bottom</option><option value="left center">Left</option><option value="right center">Right</option></select></label><label className="field"><span>Size</span><select value={bg.size || "cover"} onChange={e => background({ size:e.target.value as "cover"|"contain"|"auto" })}><option value="cover">Cover</option><option value="contain">Contain</option><option value="auto">Original</option></select></label></div>
          <div className="theme-form-grid"><label className="field"><span>Overlay color</span><input placeholder="rgba(0,0,0,.25)" value={bg.overlay || "transparent"} onChange={e => background({ overlay:e.target.value })}/></label><label className="field"><span>Blend mode</span><select value={bg.blendMode || "normal"} onChange={e => background({ blendMode:e.target.value as NonNullable<typeof bg.blendMode> })}><option value="normal">Normal</option><option value="multiply">Multiply</option><option value="screen">Screen</option><option value="overlay">Overlay</option><option value="soft-light">Soft light</option><option value="hard-light">Hard light</option><option value="color-dodge">Color dodge</option><option value="luminosity">Luminosity</option></select></label></div>
        </section>

        <section className="theme-control-section"><div className="theme-control-title"><strong>Glass & surfaces</strong><span>Transparency and blur</span></div><div className="theme-range-grid"><Range label="Surface opacity" value={surfaces.opacity ?? 1} min={.2} max={1} step={.05} onChange={value => surface({ opacity:value })}/><Range label="Glass blur" value={surfaces.blurPx ?? 0} min={0} max={32} step={1} suffix="px" onChange={value => surface({ blurPx:value })}/><Range label="Sidebar opacity" value={surfaces.sidebarOpacity ?? 1} min={.25} max={1} step={.05} onChange={value => surface({ sidebarOpacity:value })}/><Range label="Topbar opacity" value={surfaces.topbarOpacity ?? 1} min={.25} max={1} step={.05} onChange={value => surface({ topbarOpacity:value })}/></div></section>


        <section className="theme-control-section"><div className="theme-control-title"><strong>Typography</strong><span>Safe local font stacks</span></div><div className="theme-form-grid"><label className="field"><span>Font family</span><select value={typography.family || "system"} onChange={e => typographyPatch({ family:e.target.value as "system"|"humanist"|"mono" })}><option value="system">System UI</option><option value="humanist">Humanist</option><option value="mono">Monospace</option></select></label><Range label="Text scale" value={typography.scale ?? 1} min={.9} max={1.18} step={.01} suffix="×" onChange={value => typographyPatch({ scale:value })}/></div></section>
        <section className="theme-control-section"><div className="theme-control-title"><strong>Motion & atmosphere</strong><span>CSS-only effects with reduced-motion support</span></div><div className="theme-effect-grid">{effects.map(effect => <button key={effect.id} className={motion.preset === effect.id ? "active" : ""} onClick={() => animate({ preset:effect.id })}><strong>{effect.label}</strong><span>{effect.help}</span></button>)}</div><div className="theme-range-grid"><Range label="Intensity" value={motion.intensity ?? .5} min={0} max={1} step={.05} onChange={value => animate({ intensity:value })}/><Range label="Speed" value={motion.speed ?? 1} min={.25} max={3} step={.05} suffix="×" onChange={value => animate({ speed:value })}/><Range label="Grain" value={motion.grain ?? 0} min={0} max={1} step={.05} onChange={value => animate({ grain:value })}/><Range label="Vignette" value={motion.vignette ?? 0} min={0} max={1} step={.05} onChange={value => animate({ vignette:value })}/></div></section>
      </div>

      <aside className="theme-studio-preview-wrap"><div className="theme-studio-preview" data-effect={motion.preset || "none"} style={previewStyle}><div className="theme-preview-bg"/><div className="theme-preview-overlay"/><div className="theme-preview-fx"><i/><i/><i/></div><div className="theme-preview-shell"><div className="theme-preview-side"><b>CRM</b><span/><span/><span/><span/></div><div className="theme-preview-main"><div className="theme-preview-top"><span/><i/></div><div className="theme-preview-content"><small>LIVE PREVIEW</small><h3>Customer operations</h3><div className="theme-preview-stats"><article><span>Pipeline</span><strong>$428K</strong></article><article><span>Projects</span><strong>12</strong></article></div><div className="theme-preview-card"><b/><span/><span/><span/></div></div></div></div></div><div className="theme-studio-actions"><button className="primary-button" onClick={save}>Save & activate</button><button className="secondary-button" onClick={exportTheme} disabled={!saved}>Export extension JSON</button><span>{saved ? "Saved as a local theme extension." : "Changes are preview-only until saved."}</span></div></aside>
    </div>
  </div>;
}

function Range({ label, value, min, max, step, suffix = "", onChange }: { label:string; value:number; min:number; max:number; step:number; suffix?:string; onChange:(value:number)=>void }) {
  return <label className="theme-range"><span><b>{label}</b><code>{Math.round(value*100)/100}{suffix}</code></span><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/></label>;
}
