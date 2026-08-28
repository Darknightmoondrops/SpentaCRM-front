"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useExtensions } from "@/extensions/extension-provider";
import type { EntityKind } from "@/extensions/sdk";
import { RuntimeModuleFrame } from "./runtime-module-frame";

export function EntityExtensionPoints({ entityType, entityId }: { entityType: EntityKind; entityId: string }) {
  const { extensions, enabledIds } = useExtensions();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabs = useMemo(() => extensions.flatMap(extension => {
    if (!enabledIds.has(extension.manifest.id)) return [];
    const code = (extension.contributes?.entityTabs || []).filter(tab => tab.entity === entityType).map(tab => ({ kind: "code" as const, extensionId: extension.manifest.id, extensionName: extension.manifest.name, tab }));
    const runtime = (extension.contributes?.runtimeEntityTabs || []).filter(tab => tab.entity === entityType).map(tab => ({ kind: "runtime" as const, extensionId: extension.manifest.id, extensionName: extension.manifest.name, tab }));
    return [...code, ...runtime];
  }), [enabledIds, entityType, extensions]);

  const actions = useMemo(() => extensions.flatMap(extension => {
    if (!enabledIds.has(extension.manifest.id)) return [];
    const code = (extension.contributes?.entityActions || []).filter(action => action.entity === entityType).map(action => ({ kind: "code" as const, extensionId: extension.manifest.id, action }));
    const runtime = (extension.contributes?.runtimeEntityActions || []).filter(action => action.entity === entityType).map(action => ({ kind: "runtime" as const, extensionId: extension.manifest.id, action }));
    return [...code, ...runtime];
  }), [enabledIds, entityType, extensions]);

  const selectedKey = searchParams.get("extTab");
  const selected = tabs.find(item => `${item.extensionId}:${item.tab.id}` === selectedKey) || null;

  function selectTab(key?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key) params.set("extTab", key); else params.delete("extTab");
    const query = params.toString();
    router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
  }

  async function runAction(item: (typeof actions)[number]) {
    if (item.kind === "code") {
      await item.action.run({ extensionId: item.extensionId, entityType, entityId });
      return;
    }
    if (item.action.action.type === "open-page") {
      router.push(`/extension-pages/${encodeURIComponent(item.extensionId)}/${encodeURIComponent(item.action.action.pageId)}` as Route);
      return;
    }
    window.open(item.action.action.url, "_blank", "noopener,noreferrer");
  }

  if (!tabs.length && !actions.length) return null;
  return <section className="entity-extension-points" aria-label="Module extensions">
    <div className="entity-extension-head"><div><span className="eyebrow">SPENTACRM MODULES</span><strong>Record extensions</strong></div>{actions.length > 0 && <div className="entity-extension-actions">{actions.map(item => <button key={`${item.extensionId}:${item.action.id}`} type="button" className={item.action.tone === "primary" ? "primary-button" : item.action.tone === "danger" ? "danger-button" : "secondary-button"} onClick={() => void runAction(item)}>{item.action.label}</button>)}</div>}</div>
    {tabs.length > 0 && <>
      <nav className="entity-extension-tabs" aria-label="Module tabs"><button type="button" className={!selected ? "active" : ""} onClick={() => selectTab()}>Module overview</button>{tabs.map(item => { const key = `${item.extensionId}:${item.tab.id}`; return <button type="button" className={selectedKey === key ? "active" : ""} onClick={() => selectTab(key)} key={key}>{item.tab.label}</button>; })}</nav>
      {!selected && <div className="entity-extension-empty"><strong>{tabs.length} module tab{tabs.length === 1 ? "" : "s"} available.</strong><p>Select a module tab to open its isolated business surface for this {entityType}.</p></div>}
      {selected?.kind === "code" && <div className="entity-extension-content">{(() => { const Component = selected.tab.component; return <Component extensionId={selected.extensionId} entityType={entityType} entityId={entityId}/>; })()}</div>}
      {selected?.kind === "runtime" && <div className="entity-extension-content"><div className="runtime-tab-meta"><span>{selected.extensionName}</span><code>{selected.extensionId}</code></div><RuntimeModuleFrame extensionId={selected.extensionId} surfaceId={selected.tab.id} entry={selected.tab.entry} surfaceType="entity-tab" entityType={entityType} entityId={entityId} height={selected.tab.height || 480}/></div>}
    </>}
  </section>;
}
