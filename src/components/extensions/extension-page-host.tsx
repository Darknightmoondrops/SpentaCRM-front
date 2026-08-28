"use client";

import Link from "next/link";
import { useExtensions } from "@/extensions/extension-provider";
import { RuntimeModuleFrame } from "./runtime-module-frame";

export function ExtensionPageHost({ extensionId, pageId }: { extensionId: string; pageId: string }) {
  const { extensions, enabledIds } = useExtensions();
  const extension = extensions.find(item => item.manifest.id === extensionId);
  if (!extension || !enabledIds.has(extensionId)) return <Unavailable/>;

  const page = extension.contributes?.pages?.find(item => item.id === pageId);
  if (page) {
    const Component = page.component;
    return <div data-extension-page={`${extensionId}:${pageId}`}><Component extensionId={extensionId} pageId={pageId} /></div>;
  }

  const runtimePage = extension.contributes?.runtimePages?.find(item => item.id === pageId);
  if (runtimePage) {
    return <div className="runtime-page-shell" data-runtime-page={`${extensionId}:${pageId}`}>
      <div className="runtime-page-head"><div><span className="eyebrow">SANDBOXED MODULE PAGE</span><h1>{runtimePage.title}</h1><p>{runtimePage.description || `${extension.manifest.name} module surface`}</p></div><span className="runtime-security-badge">isolated</span></div>
      <RuntimeModuleFrame extensionId={extensionId} surfaceId={pageId} entry={runtimePage.entry} surfaceType="page" height={runtimePage.height || "viewport"}/>
    </div>;
  }

  return <Unavailable/>;
}

function Unavailable() {
  return <div className="record-not-found"><span className="eyebrow">EXTENSION PAGE</span><h2>This extension page is unavailable.</h2><p>The extension may be disabled, uninstalled, incompatible, or its package files may be missing.</p><Link className="secondary-button settings-extension-link" href="/extensions">Open Extensions</Link></div>;
}
