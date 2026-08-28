"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useExtensions } from "@/extensions/extension-provider";
import { readSpentaModuleArchive } from "@/extensions/zip-package";
import { PageHeader } from "@/components/ui";
import { ThemeStudio } from "./theme-studio";

const moduleLevels = [
  { id: "simple", label: "Simple", description: "A focused single-purpose module with a small surface and minimal permissions." },
  { id: "medium", label: "Medium", description: "A broader workflow module that can expose several screens or integrate an external service." },
  { id: "advanced", label: "Advanced", description: "A multi-surface business capability with richer integrations and wider CRM permissions." },
  { id: "professional", label: "Professional", description: "Enterprise-grade modules intended for complex workflows, backend services, RBAC and audited integrations." },
] as const;

export function ExtensionsWorkspace() {
  const { extensions, enabledIds, themes, activeThemeId, remoteModules, setExtensionEnabled, setActiveTheme, installPortablePackage, installModuleArchive, uninstallExtension, exportThemePackage } = useExtensions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"installed" | "themes" | "modules" | "developer">("installed");
  const [studioThemeId, setStudioThemeId] = useState<string | undefined>();
  const [studioOpen, setStudioOpen] = useState(false);

  const moduleCount = useMemo(() => extensions.reduce((sum, extension) => sum + (extension.contributes?.modules?.length || 0) + (extension.contributes?.remoteModules?.length || 0) + (extension.contributes?.pages?.length || 0) + (extension.contributes?.dashboardWidgets?.length || 0) + (extension.contributes?.runtimePages?.length || 0) + (extension.contributes?.runtimeDashboardWidgets?.length || 0) + (extension.contributes?.runtimeEntityTabs?.length || 0) + (extension.contributes?.runtimeEntityActions?.length || 0), 0), [extensions]);

  async function importPackage(file?: File) {
    if (!file) return;
    try {
      const isZip = file.name.toLowerCase().endsWith(".zip");
      if (!isZip && file.size > 512 * 1024) { setMessage("JSON extension packages must be smaller than 512 KB."); return; }
      const result = isZip
        ? await installModuleArchive(await readSpentaModuleArchive(file))
        : installPortablePackage(await file.text());
      setMessage(result.ok ? `Installed ${result.extensionId} from ${isZip ? "project module ZIP" : "extension JSON"}.` : result.error);
      if (result.ok) setTab("installed");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The selected package could not be installed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
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
    <PageHeader eyebrow="SPENTACRM PLATFORM" title="Modules & Extensions" description="Install optional company capabilities as portable ZIP modules, enable only what each workspace needs, and keep custom functionality separated from the SpentaCRM core." action={<><input ref={inputRef} type="file" accept="application/zip,.zip,application/json,.json" hidden onChange={event => importPackage(event.target.files?.[0])}/><button className="secondary-button" onClick={() => openStudio(activeThemeId)}>Customize theme</button><button className="primary-button" onClick={() => inputRef.current?.click()}>Install module ZIP</button></>} />
    {message && <div className="extension-message" role="status"><span>{message}</span><button onClick={() => setMessage(null)}>Dismiss</button></div>}

    <div className="module-level-strip">
      {moduleLevels.map(level => <div key={level.id}><span>{level.label}</span><p>{level.description}</p></div>)}
    </div>

    <div className="extension-platform-summary">
      <div><span>Installed</span><strong>{extensions.length}</strong><small>Core + workspace packages</small></div>
      <div><span>Active themes</span><strong>{themes.filter(theme => theme.enabled).length}</strong><small>Built-in and custom</small></div>
      <div><span>Module surfaces</span><strong>{moduleCount}</strong><small>Pages, widgets and modules</small></div>
      <div><span>Runtime modules</span><strong>{extensions.filter(extension => extension.source === "module-zip" && enabledIds.has(extension.manifest.id)).length + remoteModules.filter(module => module.enabled).length}</strong><small>ZIP packages + remote tools</small></div>
    </div>

    <div className="extension-tabs">
      <button className={tab === "installed" ? "active" : ""} onClick={() => setTab("installed")}>Installed <span>{extensions.length}</span></button>
      <button className={tab === "themes" ? "active" : ""} onClick={() => setTab("themes")}>Themes <span>{themes.length}</span></button>
      <button className={tab === "modules" ? "active" : ""} onClick={() => setTab("modules")}>Modules <span>{moduleCount}</span></button>
      <button className={tab === "developer" ? "active" : ""} onClick={() => setTab("developer")}>Developer</button>
    </div>

    {tab === "installed" && <div className="extension-list">{extensions.map(extension => {
      const enabled = enabledIds.has(extension.manifest.id);
      const isCore = extension.manifest.id === "spentacrm.core-theme";
      const source = extension.source;
      const contributes = extension.contributes;
      const contributionCount = (contributes?.themes?.length || 0) + (contributes?.modules?.length || 0) + (contributes?.remoteModules?.length || 0) + (contributes?.pages?.length || 0) + (contributes?.dashboardWidgets?.length || 0) + (contributes?.commands?.length || 0) + (contributes?.sidebar?.length || 0) + (contributes?.runtimePages?.length || 0) + (contributes?.runtimeDashboardWidgets?.length || 0) + (contributes?.runtimeEntityTabs?.length || 0) + (contributes?.runtimeEntityActions?.length || 0);
      return <article className="extension-card" key={extension.manifest.id}>
        <div className="extension-card-mark">{extension.manifest.name.slice(0, 2).toUpperCase()}</div>
        <div className="extension-card-main"><div className="extension-card-title"><div><strong>{extension.manifest.name}</strong><span>v{extension.manifest.version} · {extension.manifest.publisher}</span></div><div className="extension-card-badges"><span>{source}</span>{extension.manifest.complexity && <span className={`module-tier module-tier-${extension.manifest.complexity}`}>{extension.manifest.complexity}</span>}{extension.manifest.categories.map(category => <span key={category}>{category}</span>)}</div></div><p>{extension.manifest.description}</p><div className="extension-contribution-summary"><span>{contributionCount} contribution{contributionCount === 1 ? "" : "s"}</span>{contributes?.themes?.length ? <code>{contributes.themes.length} theme</code> : null}{contributes?.modules?.length ? <code>{contributes.modules.length} module</code> : null}{contributes?.remoteModules?.length ? <code>{contributes.remoteModules.length} remote</code> : null}{contributes?.runtimePages?.length ? <code>{contributes.runtimePages.length} ZIP page</code> : null}{contributes?.runtimeDashboardWidgets?.length ? <code>{contributes.runtimeDashboardWidgets.length} ZIP widget</code> : null}{contributes?.runtimeEntityTabs?.length ? <code>{contributes.runtimeEntityTabs.length} entity tab</code> : null}{contributes?.dashboardWidgets?.length ? <code>{contributes.dashboardWidgets.length} widget</code> : null}{contributes?.commands?.length ? <code>{contributes.commands.length} command</code> : null}</div><div className="extension-permissions">{(extension.manifest.permissions || []).map(permission => <code key={permission}>{permission}</code>)}</div></div>
        <div className="extension-card-actions"><label className="extension-switch"><input type="checkbox" checked={enabled} disabled={isCore} onChange={event => setExtensionEnabled(extension.manifest.id, event.target.checked)}/><span>{enabled ? "Enabled" : "Disabled"}</span></label>{["imported","module-zip","custom"].includes(source) && <button className="text-link extension-remove" onClick={() => uninstallExtension(extension.manifest.id)}>Uninstall</button>}</div>
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
        const remote = (extension.contributes?.remoteModules || []).map(module => ({ kind:"ZIP / remote module", id:module.id, title:module.title, description:module.description || module.url, href:`/extension-modules/${extension.manifest.id}/${module.id}`, extension }));
        const pages = (extension.contributes?.pages || []).map(page => ({ kind:"Extension page", id:page.id, title:page.title, description:page.description, href:`/extension-pages/${extension.manifest.id}/${page.id}`, extension }));
        const widgets = (extension.contributes?.dashboardWidgets || []).map(widget => ({ kind:"Dashboard widget", id:widget.id, title:widget.title, description:`Zone: ${widget.zone}`, href:"/", extension }));
        const runtimePages = (extension.contributes?.runtimePages || []).map(page => ({ kind:"ZIP page", id:page.id, title:page.title, description:page.description || page.entry, href:`/extension-pages/${extension.manifest.id}/${page.id}`, extension }));
        const runtimeWidgets = (extension.contributes?.runtimeDashboardWidgets || []).map(widget => ({ kind:"ZIP widget", id:widget.id, title:widget.title, description:`Zone: ${widget.zone} · ${widget.entry}`, href:"/", extension }));
        const runtimeTabs = (extension.contributes?.runtimeEntityTabs || []).map(tab => ({ kind:"Entity tab", id:tab.id, title:tab.label, description:`${tab.entity} · ${tab.entry}`, href:"/", extension }));
        return [...modules,...remote,...pages,...widgets,...runtimePages,...runtimeWidgets,...runtimeTabs];
      }).map(item => <article className="extension-module-card" key={`${item.extension.manifest.id}:${item.kind}:${item.id}`}><div className="extension-module-icon">{item.kind === "ZIP / remote module" ? "↗" : item.kind === "Dashboard widget" ? "▦" : "◇"}</div><div><span className="eyebrow">{item.kind}{item.extension.manifest.complexity ? ` · ${item.extension.manifest.complexity.toUpperCase()}` : ""}</span><strong>{item.title}</strong><p>{item.description || "No description provided."}</p><small>{item.extension.manifest.name} · {item.extension.manifest.publisher}</small></div><Link className="secondary-button" href={item.href}>Open</Link></article>)}
      {moduleCount === 0 && <div className="record-not-found"><span className="eyebrow">MODULES</span><h2>No optional modules installed yet.</h2><p>Install a SpentaCRM module ZIP or add a trusted code extension.</p></div>}
    </div>}

    {tab === "developer" && <div className="extension-developer-grid">
      <section className="panel"><div className="eyebrow">SPENTACRM PROJECT MODULE</div><h2>ZIP = manifest + bundled project files</h2><p>A runtime module is a small project archive. <code>spenta-module.json</code> is only its manifest; the actual page/widget/tab UI is shipped as bundled HTML/CSS/JS inside the same ZIP and persisted in the browser module store.</p><div className="developer-capabilities"><code>pages</code><code>dashboard widgets</code><code>entity tabs</code><code>entity actions</code></div></section>
      <section className="panel"><div className="eyebrow">RUNTIME SECURITY</div><h2>Sandboxed by default</h2><p>Bundled module code executes in an isolated iframe without same-origin access. The runtime exposes a minimal <code>window.SpentaCRM</code> bridge for context, resize and safe CRM navigation.</p><div className="extension-security-stack"><span>ZIP files <b>IndexedDB</b></span><span>Runtime code <b>sandboxed</b></span><span>Core access <b>bridge/permissions</b></span></div></section>
      <section className="panel"><div className="eyebrow">PROJECT STRUCTURE</div><h2>Build before packaging</h2><pre className="extension-command">{`inventory-module/\n├── spenta-module.json\n├── src/\n│   ├── inventory.ts\n│   └── inventory.css\n├── dist/\n│   ├── pages/inventory.html\n│   ├── widgets/stock.html\n│   └── tabs/company-stock.html\n└── README.md`}</pre><p>Source files may be included for maintainability, but every manifest <code>entry</code> must point to a browser-ready HTML surface inside the ZIP.</p></section>
      <section className="panel"><div className="eyebrow">MANIFEST V3</div><h2>Declare extension points</h2><pre className="extension-command">{`{\n  "apiVersion": 3,\n  "manifest": {\n    "id": "vendor.inventory",\n    "name": "Inventory",\n    "version": "1.0.0",\n    "publisher": "Vendor",\n    "description": "Inventory management",\n    "complexity": "advanced",\n    "categories": ["module"],\n    "permissions": [\n      "runtime:sandbox", "ui:navigation",\n      "ui:dashboard", "ui:entity-tabs"\n    ]\n  },\n  "contributes": {\n    "runtimePages": [{\n      "id": "inventory", "title": "Inventory",\n      "entry": "dist/pages/inventory.html",\n      "navigation": { "label": "Inventory", "section": "extensions" }\n    }],\n    "runtimeDashboardWidgets": [{\n      "id": "stock", "title": "Stock health",\n      "zone": "dashboard.afterStats",\n      "entry": "dist/widgets/stock.html"\n    }],\n    "runtimeEntityTabs": [{\n      "id": "company-stock", "entity": "company",\n      "label": "Inventory",\n      "entry": "dist/tabs/company-stock.html"\n    }]\n  }\n}`}</pre></section>
    </div>}
  </>;
}
