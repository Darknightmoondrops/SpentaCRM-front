"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useExtensions } from "@/extensions/extension-provider";
import { PageHeader } from "@/components/ui";
import { ThemeStudio } from "./theme-studio";

export function ExtensionsWorkspace() {
  const { extensions, enabledIds, themes, activeThemeId, remoteModules, setExtensionEnabled, setActiveTheme, installPortablePackage, uninstallExtension, exportThemePackage } = useExtensions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"installed" | "themes" | "modules" | "developer">("installed");
  const [studioThemeId, setStudioThemeId] = useState<string | undefined>();
  const [studioOpen, setStudioOpen] = useState(false);

  const moduleCount = useMemo(() => extensions.reduce((sum, extension) => sum + (extension.contributes?.modules?.length || 0) + (extension.contributes?.remoteModules?.length || 0) + (extension.contributes?.pages?.length || 0) + (extension.contributes?.dashboardWidgets?.length || 0), 0), [extensions]);

  async function importPackage(file?: File) {
    if (!file) return;
    if (file.size > 512 * 1024) { setMessage("Extension packages must be smaller than 512 KB."); return; }
    const result = installPortablePackage(await file.text());
    setMessage(result.ok ? `Installed ${result.extensionId}.` : result.error);
    if (result.ok) setTab("installed");
    if (inputRef.current) inputRef.current.value = "";
  }

  function exportTheme(themeId: string, label: string) {
    const raw = exportThemePackage(themeId);
    if (!raw) { setMessage("This theme could not be exported."); return; }
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "theme"}.extension.json`; a.click(); URL.revokeObjectURL(url);
  }

  function openStudio(themeId?: string) { setStudioThemeId(themeId); setStudioOpen(true); setTab("themes"); }

  if (studioOpen) return <ThemeStudio initialThemeId={studioThemeId} onClose={() => setStudioOpen(false)} onMessage={setMessage}/>;

  return <>
    <PageHeader eyebrow="PLATFORM" title="Extensions" description="Extend the CRM with themes, modules, dashboards, commands and isolated remote tools—without coupling custom work to the core product." action={<><input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={event => importPackage(event.target.files?.[0])}/><button className="secondary-button" onClick={() => openStudio(activeThemeId)}>Customize theme</button><button className="primary-button" onClick={() => inputRef.current?.click()}>Install extension package</button></>} />
    {message && <div className="extension-message" role="status"><span>{message}</span><button onClick={() => setMessage(null)}>Dismiss</button></div>}

    <div className="extension-platform-summary">
      <div><span>Installed</span><strong>{extensions.length}</strong><small>Core + workspace packages</small></div>
      <div><span>Active themes</span><strong>{themes.filter(theme => theme.enabled).length}</strong><small>Built-in and custom</small></div>
      <div><span>Module surfaces</span><strong>{moduleCount}</strong><small>Pages, widgets and modules</small></div>
      <div><span>Runtime modules</span><strong>{remoteModules.filter(module => module.enabled).length}</strong><small>Sandboxed remote tools</small></div>
    </div>

    <div className="extension-tabs">
      <button className={tab === "installed" ? "active" : ""} onClick={() => setTab("installed")}>Installed <span>{extensions.length}</span></button>
      <button className={tab === "themes" ? "active" : ""} onClick={() => setTab("themes")}>Themes <span>{themes.length}</span></button>
      <button className={tab === "modules" ? "active" : ""} onClick={() => setTab("modules")}>Modules <span>{moduleCount}</span></button>
      <button className={tab === "developer" ? "active" : ""} onClick={() => setTab("developer")}>Developer</button>
    </div>

    {tab === "installed" && <div className="extension-list">{extensions.map(extension => {
      const enabled = enabledIds.has(extension.manifest.id);
      const isCore = extension.manifest.id === "b2bcrm.core-theme";
      const source = extension.source;
      const contributes = extension.contributes;
      const contributionCount = (contributes?.themes?.length || 0) + (contributes?.modules?.length || 0) + (contributes?.remoteModules?.length || 0) + (contributes?.pages?.length || 0) + (contributes?.dashboardWidgets?.length || 0) + (contributes?.commands?.length || 0) + (contributes?.sidebar?.length || 0);
      return <article className="extension-card" key={extension.manifest.id}>
        <div className="extension-card-mark">{extension.manifest.name.slice(0, 2).toUpperCase()}</div>
        <div className="extension-card-main"><div className="extension-card-title"><div><strong>{extension.manifest.name}</strong><span>v{extension.manifest.version} · {extension.manifest.publisher}</span></div><div className="extension-card-badges"><span>{source}</span>{extension.manifest.categories.map(category => <span key={category}>{category}</span>)}</div></div><p>{extension.manifest.description}</p><div className="extension-contribution-summary"><span>{contributionCount} contribution{contributionCount === 1 ? "" : "s"}</span>{contributes?.themes?.length ? <code>{contributes.themes.length} theme</code> : null}{contributes?.modules?.length ? <code>{contributes.modules.length} module</code> : null}{contributes?.remoteModules?.length ? <code>{contributes.remoteModules.length} remote</code> : null}{contributes?.dashboardWidgets?.length ? <code>{contributes.dashboardWidgets.length} widget</code> : null}{contributes?.commands?.length ? <code>{contributes.commands.length} command</code> : null}</div><div className="extension-permissions">{(extension.manifest.permissions || []).map(permission => <code key={permission}>{permission}</code>)}</div></div>
        <div className="extension-card-actions"><label className="extension-switch"><input type="checkbox" checked={enabled} disabled={isCore} onChange={event => setExtensionEnabled(extension.manifest.id, event.target.checked)}/><span>{enabled ? "Enabled" : "Disabled"}</span></label>{["imported","custom"].includes(source) && <button className="text-link extension-remove" onClick={() => uninstallExtension(extension.manifest.id)}>Uninstall</button>}</div>
      </article>;
    })}</div>}

    {tab === "themes" && <>
      <div className="theme-toolbar"><div><strong>Workspace themes</strong><span>Choose a theme, duplicate it in Theme Studio, or build one from scratch.</span></div><button className="primary-button" onClick={() => openStudio()}>Create custom theme</button></div>
      <div className="theme-extension-grid">{themes.filter(theme => theme.enabled).map(theme => {
        const image = theme.visuals?.background?.imageUrl;
        const effect = theme.visuals?.motion?.preset || "none";
        return <article className={`theme-extension-card ${activeThemeId === theme.id ? "active" : ""}`} key={theme.id}>
          <button className="theme-card-select" onClick={() => setActiveTheme(theme.id)} aria-label={`Use ${theme.label}`}>
            <div className="theme-preview advanced" data-effect={effect} style={{ background: theme.tokens["--paper"] }}><div className="theme-preview-image" style={image ? { backgroundImage:`url(${JSON.stringify(image)})`, opacity:theme.visuals?.background?.opacity ?? .25 } : undefined}/><span style={{ background: theme.tokens["--app-sidebar-bg"] }}/><i style={{ background: theme.tokens["--surface"], borderColor: theme.tokens["--line"] }}/><b style={{ background: theme.tokens["--accent"] }}/><em/></div>
            <div><strong>{theme.label}</strong><span>{theme.description || theme.appearance}</span></div><em>{activeThemeId === theme.id ? "Active" : "Use theme"}</em>
          </button>
          <div className="theme-card-actions"><button onClick={() => openStudio(theme.id)}>Customize</button><button onClick={() => exportTheme(theme.id,theme.label)}>Export</button><code>{effect}</code></div>
        </article>;
      })}</div>
    </>}

    {tab === "modules" && <div className="extension-modules-grid">
      {extensions.flatMap(extension => {
        if (!enabledIds.has(extension.manifest.id)) return [];
        const modules = (extension.contributes?.modules || []).map(module => ({ kind:"Code module", id:module.id, title:module.title, description:module.description, href:`/extension-modules/${extension.manifest.id}/${module.id}`, extension }));
        const remote = (extension.contributes?.remoteModules || []).map(module => ({ kind:"Remote sandbox", id:module.id, title:module.title, description:module.description || module.url, href:`/extension-modules/${extension.manifest.id}/${module.id}`, extension }));
        const pages = (extension.contributes?.pages || []).map(page => ({ kind:"Extension page", id:page.id, title:page.title, description:page.description, href:`/extension-pages/${extension.manifest.id}/${page.id}`, extension }));
        const widgets = (extension.contributes?.dashboardWidgets || []).map(widget => ({ kind:"Dashboard widget", id:widget.id, title:widget.title, description:`Zone: ${widget.zone}`, href:"/", extension }));
        return [...modules,...remote,...pages,...widgets];
      }).map(item => <article className="extension-module-card" key={`${item.extension.manifest.id}:${item.kind}:${item.id}`}><div className="extension-module-icon">{item.kind === "Remote sandbox" ? "↗" : item.kind === "Dashboard widget" ? "▦" : "◇"}</div><div><span className="eyebrow">{item.kind}</span><strong>{item.title}</strong><p>{item.description || "No description provided."}</p><small>{item.extension.manifest.name} · {item.extension.manifest.publisher}</small></div><Link className="secondary-button" href={item.href}>Open</Link></article>)}
      {moduleCount === 0 && <div className="record-not-found"><span className="eyebrow">MODULES</span><h2>No extension modules yet.</h2><p>Install a portable remote module package or add a trusted code extension.</p></div>}
    </div>}

    {tab === "developer" && <div className="extension-developer-grid">
      <section className="panel"><div className="eyebrow">EXTENSION API · V2</div><h2>Contribution points</h2><p>Trusted code extensions can contribute complete modules, pages, dashboard widgets, commands and navigation. Portable packages can contribute themes and sandboxed remote modules at runtime. The SDK keeps reserved contracts for future record/settings hosts.</p><div className="developer-capabilities"><code>contributes.themes</code><code>contributes.modules</code><code>contributes.remoteModules</code><code>contributes.dashboardWidgets</code><code>contributes.pages</code><code>contributes.commands</code><code>contributes.sidebar</code></div></section>
      <section className="panel"><div className="eyebrow">RUNTIME SECURITY</div><h2>Portable vs trusted code</h2><p>Runtime JSON packages never execute JavaScript in the CRM origin. Remote modules run inside sandboxed iframes. React/TypeScript extensions are trusted deployment packages and must be installed through the registry workflow.</p><div className="extension-security-stack"><span>Theme JSON <b>safe data</b></span><span>Remote module <b>sandboxed</b></span><span>Code package <b>trusted build</b></span></div></section>
      <section className="panel"><div className="eyebrow">INSTALL A CODE EXTENSION</div><h2>Registry workflow</h2><p>Third-party packages import the stable SDK alias and are generated into the registry before dev/build.</p><pre className="extension-command">npm install @vendor/crm-extension{`\n`}npm run extension:add -- @vendor/crm-extension{`\n`}npm run dev</pre></section>
      <section className="panel"><div className="eyebrow">PORTABLE MODULE</div><h2>Install without a rebuild</h2><p>A JSON extension can add a remote HTTPS app to the CRM navigation. It is isolated from CRM cookies and origin data by the iframe sandbox.</p><pre className="extension-command">{`{\n  "apiVersion": 2,\n  "manifest": { "id": "vendor.portal", ... },\n  "contributes": {\n    "remoteModules": [{\n      "id": "portal",\n      "title": "Customer Portal",\n      "url": "https://portal.example.com",\n      "navigation": { "label": "Portal" }\n    }]\n  }\n}`}</pre></section>
    </div>}
  </>;
}
