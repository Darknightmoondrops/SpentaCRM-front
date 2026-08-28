"use client";

import { useExtensions } from "@/extensions/extension-provider";
import type { DashboardWidgetContribution } from "@/extensions/sdk";

export function ExtensionZone({ zone }: { zone: DashboardWidgetContribution["zone"] }) {
  const { extensions, enabledIds } = useExtensions();
  const widgets = extensions.flatMap(extension => enabledIds.has(extension.manifest.id)
    ? (extension.contributes?.dashboardWidgets || []).filter(widget => widget.zone === zone).map(widget => ({ extensionId: extension.manifest.id, widget }))
    : []);
  if (!widgets.length) return null;
  return <div className="extension-zone" data-extension-zone={zone}>{widgets.map(({ extensionId, widget }) => {
    const Widget = widget.component;
    return <Widget key={`${extensionId}:${widget.id}`} extensionId={extensionId} />;
  })}</div>;
}
