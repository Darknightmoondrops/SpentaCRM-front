"use client";

import Link from "next/link";
import { useExtensions } from "@/extensions/extension-provider";

export function ExtensionPageHost({ extensionId, pageId }: { extensionId: string; pageId: string }) {
  const { extensions, enabledIds } = useExtensions();
  const extension = extensions.find(item => item.manifest.id === extensionId);
  const page = extension?.contributes?.pages?.find(item => item.id === pageId);
  if (!extension || !enabledIds.has(extensionId) || !page) {
    return <div className="record-not-found"><span className="eyebrow">EXTENSION PAGE</span><h2>This extension page is unavailable.</h2><p>The extension may be disabled, uninstalled, or incompatible with this route.</p><Link className="secondary-button settings-extension-link" href="/extensions">Open Extensions</Link></div>;
  }
  const Component = page.component;
  return <div data-extension-page={`${extensionId}:${pageId}`}><Component extensionId={extensionId} pageId={pageId} /></div>;
}
