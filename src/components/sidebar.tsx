"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/auth/auth-provider";
import { productConfig } from "@/config/product";
import { useExtensions } from "@/extensions/extension-provider";
import { ActivityIcon, AuditIcon, CompanyIcon, ContactIcon, DealIcon, ExtensionIcon, GridIcon, ProjectIcon, SettingsIcon, TaskIcon } from "./icons";

type NavItem = { href: string; label: string; icon: typeof GridIcon; extensionId?: string; extensionSection?: "overview" | "relationships" | "delivery" | "workspace" | "extensions" };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Overview", items: [{ href: "/", label: "Dashboard", icon: GridIcon }] },
  { label: "Relationships", items: [
    { href: "/companies", label: "Companies", icon: CompanyIcon },
    { href: "/contacts", label: "Contacts", icon: ContactIcon },
    { href: "/deals", label: "Deals", icon: DealIcon },
  ]},
  { label: "Delivery", items: [
    { href: "/projects", label: "Projects", icon: ProjectIcon },
    { href: "/tasks", label: "Tasks", icon: TaskIcon },
  ]},
  { label: "Workspace", items: [
    { href: "/activities", label: "Activities", icon: ActivityIcon },
    { href: "/audit", label: "Audit log", icon: AuditIcon },
  ]},
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  const { hasPermission, session } = useAuth();
  const { extensions, enabledIds } = useExtensions();
  const extensionItems: NavItem[] = extensions.flatMap(extension => {
    if (!enabledIds.has(extension.manifest.id)) return [];
    const sidebar = (extension.contributes?.sidebar || []).flatMap(item => {
      const href = item.pageId ? `/extension-pages/${encodeURIComponent(extension.manifest.id)}/${encodeURIComponent(item.pageId)}` : item.href;
      return href ? [{ href, label: item.label, icon: ExtensionIcon, extensionId: extension.manifest.id, extensionSection: item.section || "extensions" }] : [];
    });
    const modules = (extension.contributes?.modules || []).flatMap(item => item.navigation ? [{ href: `/extension-modules/${encodeURIComponent(extension.manifest.id)}/${encodeURIComponent(item.id)}`, label: item.navigation.label, icon: ExtensionIcon, extensionId: extension.manifest.id, extensionSection: item.navigation.section || "extensions" }] : []);
    const remoteModules = (extension.contributes?.remoteModules || []).flatMap(item => item.navigation ? [{ href: `/extension-modules/${encodeURIComponent(extension.manifest.id)}/${encodeURIComponent(item.id)}`, label: item.navigation.label, icon: ExtensionIcon, extensionId: extension.manifest.id, extensionSection: item.navigation.section || "extensions" }] : []);
    return [...sidebar, ...modules, ...remoteModules] as NavItem[];
  });
  const groupKey: Record<string, NavItem["extensionSection"]> = { Overview: "overview", Relationships: "relationships", Delivery: "delivery", Workspace: "workspace" };
  const coreGroups = groups.map((group) => ({
    ...group,
    items: [
      ...(group.label === "Workspace" ? group.items.filter((item) => item.href !== "/audit" || hasPermission("audit:read")) : group.items),
      ...extensionItems.filter(item => item.extensionSection === groupKey[group.label]),
    ],
  }));
  const extensionOnly = extensionItems.filter(item => item.extensionSection === "extensions");
  const visibleGroups = extensionOnly.length ? [...coreGroups, { label: "Extensions", items: extensionOnly }] : coreGroups;

  return <>
    {open && <button className="mobile-overlay" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`} aria-label="Primary navigation">
      <div className="brand-block">
        <Link href="/" className="brand public-brand" onClick={onClose} aria-label={`${productConfig.name} home`}>
          <span className="brand-mark">{productConfig.shortName.slice(0, 1)}</span>
          <span className="brand-copy"><strong>{productConfig.name}</strong><small>{productConfig.tagline}</small></span>
        </Link>
      </div>

      <div className="workspace-switcher" aria-label="Current workspace">
        <div className="workspace-mark">{(session?.workspace.name ?? productConfig.workspaceName).split(/\s+/).slice(0,2).map((part) => part[0]).join("").toUpperCase()}</div>
        <div className="workspace-copy"><strong>{session?.workspace.name ?? productConfig.workspaceName}</strong><span>{session?.workspace.plan ?? productConfig.workspacePlan} workspace</span></div>
        <span className="workspace-state">Demo</span>
      </div>

      <nav className="sidebar-nav">
        {visibleGroups.map(group => <div className="nav-group" key={group.label}>
          <div className="nav-label">{group.label}</div>
          {group.items.map(item => {
            const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
            const Icon = item.icon;
            return <Link className={`nav-item ${active ? "active" : ""}`} href={item.href as Route} key={`${item.extensionId || "core"}:${item.href}`} onClick={onClose} aria-current={active ? "page" : undefined}>
              <Icon/><span>{item.label}</span><span className="nav-arrow">›</span>
            </Link>;
          })}
        </div>)}
      </nav>

      <div className="sidebar-footer">
        {hasPermission("extensions:manage") && <Link href="/extensions" className={`nav-item ${path.startsWith("/extensions") ? "active" : ""}`} onClick={onClose} aria-current={path.startsWith("/extensions") ? "page" : undefined}><ExtensionIcon/><span>Extensions</span><span className="nav-arrow">›</span></Link>}
        <Link href="/settings" className={`nav-item ${path.startsWith("/settings") ? "active" : ""}`} onClick={onClose} aria-current={path.startsWith("/settings") ? "page" : undefined}><SettingsIcon/><span>Settings</span><span className="nav-arrow">›</span></Link>
        <div className="environment"><span className="status-dot"/>DEMO DATA <span>{productConfig.version}</span></div>
      </div>
    </aside>
  </>;
}
