"use client";

import { useExtensions } from "@/extensions/extension-provider";
import type { DashboardWidgetContribution } from "@/extensions/sdk";
import { RuntimeModuleFrame } from "./runtime-module-frame";

export function ExtensionZone({ zone }: { zone: DashboardWidgetContribution["zone"] }) {
  const { extensions, enabledIds } = useExtensions();
  const codeWidgets = extensions.flatMap(extension => enabledIds.has(extension.manifest.id)
    ? (extension.contributes?.dashboardWidgets || []).filter(widget => widget.zone === zone).map(widget => ({ extensionId: extension.manifest.id, widget }))
    : []);
  const runtimeWidgets = extensions.flatMap(extension => enabledIds.has(extension.manifest.id)
    ? (extension.contributes?.runtimeDashboardWidgets || []).filter(widget => widget.zone === zone).map(widget => ({ extensionId: extension.manifest.id, widget }))
    : []);
  if (!codeWidgets.length && !runtimeWidgets.length) return null;
  return <div className="extension-zone" data-extension-zone={zone}>
    {codeWidgets.map(({ extensionId, widget }) => {
      const Widget = widget.component;
      return <Widget key={`${extensionId}:${widget.id}`} extensionId={extensionId} />;
    })}
    {runtimeWidgets.map(({ extensionId, widget }) => <section className="runtime-widget-shell" key={`${extensionId}:${widget.id}`}>
      <div className="runtime-widget-title"><strong>{widget.title}</strong><span>sandboxed module</span></div>
      <RuntimeModuleFrame extensionId={extensionId} surfaceId={widget.id} entry={widget.entry} surfaceType="widget" height={widget.height || 260}/>
    </section>)}
  </div>;
}
