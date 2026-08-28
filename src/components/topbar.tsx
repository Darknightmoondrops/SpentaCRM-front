"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/auth/auth-provider";
import { productConfig } from "@/config/product";
import { activities, tasks } from "@/lib/mock-data";
import { BellIcon, ChevronDownIcon, LogoutIcon, MenuIcon, SearchIcon, SettingsIcon, TaskIcon, UserIcon } from "./icons";

const GlobalSearchCommand = dynamic(
  () => import("./global-search-command").then((module) => module.GlobalSearchCommand),
  { ssr: false, loading: () => null },
);

const routeNames: Record<string, string> = {
  "/": "Dashboard",
  "/companies": "Companies",
  "/contacts": "Contacts",
  "/deals": "Deals",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/activities": "Activities",
  "/audit": "Audit log",
  "/settings": "Settings",
  "/extensions": "Extensions",
  "/extension-pages": "Extension",
  "/extension-modules": "Extension module",
};

function getRouteName(path: string) {
  if (routeNames[path]) return routeNames[path];
  const root = Object.keys(routeNames).find((key) => key !== "/" && path.startsWith(`${key}/`));
  return root ? routeNames[root] : "Workspace";
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const path = usePathname();
  const { session, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const urgentTasks = tasks.filter((task) => task.status !== "DONE" && ["HIGH", "CRITICAL"].includes(task.priority)).slice(0, 3);
  const recentActivity = activities[0];
  const pageName = getRouteName(path);
  const user = session?.user ?? productConfig.demoUser;

  return <>
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation"><MenuIcon /></button>
        <div className="route-context" aria-label="Current location"><span>{productConfig.name}</span><b>/</b><strong>{pageName}</strong></div>
      </div>

      <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Open global search"><SearchIcon /><span>Search companies, contacts, deals, projects...</span><kbd>⌘ K</kbd></button>

      <div className="topbar-right">
        <div className="top-status"><span className="status-dot" />Synced</div>
        <div className="topbar-popover-wrap">
          <button className={`icon-button topbar-icon ${notificationsOpen ? "is-active" : ""}`} onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }} aria-label="Notifications" aria-expanded={notificationsOpen}><BellIcon /><span className="notification-dot" /></button>
          {notificationsOpen && <div className="topbar-popover notifications-popover">
            <div className="popover-head"><div><span className="eyebrow">TO DO</span><strong>Notifications</strong></div><span>{urgentTasks.length}</span></div>
            <div className="popover-list">
              {urgentTasks.map((task) => <Link href="/tasks" key={task.id} className="notification-item" onClick={() => setNotificationsOpen(false)}><div className="notification-icon"><TaskIcon /></div><div><strong>{task.title}</strong><span>{task.relation} · {task.due}</span></div></Link>)}
              <Link href="/activities" className="notification-item" onClick={() => setNotificationsOpen(false)}><div className="notification-icon">↗</div><div><strong>{recentActivity.title}</strong><span>{recentActivity.relation} · {recentActivity.time}</span></div></Link>
            </div>
            <Link className="popover-action" href="/tasks" onClick={() => setNotificationsOpen(false)}>Open work queue →</Link>
          </div>}
        </div>

        <div className="topbar-popover-wrap">
          <button className={`profile-trigger ${profileOpen ? "is-active" : ""}`} onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }} aria-expanded={profileOpen}><span className="avatar">{user.initials}</span><span className="profile-copy"><strong>{user.name}</strong><small>{user.role}</small></span><ChevronDownIcon /></button>
          {profileOpen && <div className="topbar-popover profile-popover">
            <div className="profile-summary"><span className="avatar avatar-large">{user.initials}</span><div><strong>{user.name}</strong><span>{user.email}</span></div></div>
            <div className="popover-menu"><Link href="/settings?tab=profile" onClick={() => setProfileOpen(false)}><UserIcon />My profile</Link><Link href="/settings" onClick={() => setProfileOpen(false)}><SettingsIcon />Workspace settings</Link><button type="button" onClick={() => { setProfileOpen(false); void signOut(); }}><LogoutIcon />Sign out</button></div>
          </div>}
        </div>
      </div>
    </header>
    {searchOpen && <GlobalSearchCommand onClose={() => setSearchOpen(false)} />}
  </>;
}
