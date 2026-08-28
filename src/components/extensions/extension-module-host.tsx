"use client";

import Link from "next/link";
import { useExtensions } from "@/extensions/extension-provider";

export function ExtensionModuleHost({ extensionId, moduleId }: { extensionId: string; moduleId: string }) {
  const { extensions, enabledIds, remoteModules } = useExtensions();
  const extension = extensions.find(item => item.manifest.id === extensionId);
  if (!extension || !enabledIds.has(extensionId)) return <Unavailable/>;

  const local = extension.contributes?.modules?.find(item => item.id === moduleId);
  if (local) {
    const Component = local.component;
    return <div className="extension-module-host" data-extension-module={`${extensionId}:${moduleId}`}><Component extensionId={extensionId} moduleId={moduleId}/></div>;
  }

  const remote = remoteModules.find(item => item.extensionId === extensionId && item.id === moduleId && item.enabled);
  if (!remote) return <Unavailable/>;
  let remoteHost = "external host";
  try { remoteHost = new URL(remote.url).host; } catch {}
  return <div className={`remote-module-shell ${remote.height === "content" ? "remote-module-content" : ""}`}>
    <div className="remote-module-bar"><div><span className="eyebrow">SANDBOXED REMOTE MODULE</span><strong>{remote.title}</strong><small>{remote.extensionName} · {remoteHost}</small></div><a className="secondary-button" href={remote.url} target="_blank" rel="noreferrer">Open externally ↗</a></div>
    <div className="remote-module-warning">This module runs in an isolated iframe without same-origin access to the CRM. The remote server must allow iframe embedding.</div>
    <iframe title={remote.title} src={remote.url} sandbox="allow-scripts allow-forms allow-popups allow-downloads" referrerPolicy="no-referrer" allow="clipboard-read; clipboard-write" />
  </div>;
}

function Unavailable() {
  return <div className="record-not-found"><span className="eyebrow">EXTENSION MODULE</span><h2>This module is unavailable.</h2><p>The extension may be disabled, uninstalled, incompatible, or its contribution ID may have changed.</p><Link className="secondary-button settings-extension-link" href="/extensions">Open Extensions</Link></div>;
}
