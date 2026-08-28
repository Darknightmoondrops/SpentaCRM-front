"use client";

import { useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AccessBoundary } from "@/auth/access-boundary";
import { ALL_PERMISSIONS, PERMISSION_LABELS } from "@/auth/permissions";
import { useAuth } from "@/auth/auth-provider";
import type { PermissionKey, WorkspaceRole, WorkspaceSettings, WorkspaceUser } from "@/lib/types";
import { createCustomRole, getWorkspaceMembers, getWorkspaceRoles, getWorkspaceSettings, saveWorkspaceMembers, saveWorkspaceRoles, saveWorkspaceSettings } from "@/lib/mock-workspace-store";
import { Modal, Toast } from "@/components/overlay";
import { Badge, PageHeader } from "@/components/ui";
import Link from "next/link";

type Tab = "workspace" | "profile" | "members" | "roles" | "extensions";

const tabs: { id: Tab; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "profile", label: "My profile" },
  { id: "members", label: "Members" },
  { id: "roles", label: "Roles & permissions" },
  { id: "extensions", label: "Extensions" },
];

function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""); }

export function SettingsWorkspace() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requested = search.get("tab") as Tab | null;
  const active = tabs.some((tab) => tab.id === requested) ? requested! : "workspace";
  const { session, updateLocalSession } = useAuth();
  const [settings, setSettings] = useState<WorkspaceSettings>(() => getWorkspaceSettings());
  const [members, setMembers] = useState<WorkspaceUser[]>(() => getWorkspaceMembers());
  const [roles, setRoles] = useState<WorkspaceRole[]>(() => getWorkspaceRoles());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [toast, setToast] = useState("");

  function setTab(tab: Tab) {
    const params = new URLSearchParams(search.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const title = active === "profile" ? "My profile" : active === "members" ? "Members" : active === "roles" ? "Roles & permissions" : active === "extensions" ? "Extensions" : "Workspace settings";
  const description = active === "profile" ? "Personal identity and preferences for your CRM session." : active === "members" ? "Invite people, assign roles and control workspace access." : active === "roles" ? "Define what each team role can see and change." : active === "extensions" ? "Manage workspace themes and trusted extensions." : "Organisation defaults used across commercial and delivery workflows.";

  return <>
    <PageHeader eyebrow="SETTINGS" title={title} description={description} action={null} />
    <div className="settings-shell">
      <aside className="settings-nav" aria-label="Settings sections">{tabs.map((tab) => <button key={tab.id} className={active === tab.id ? "active" : ""} onClick={() => setTab(tab.id)}>{tab.label}</button>)}</aside>
      <div className="settings-content">
        {active === "workspace" && <AccessBoundary permission="workspace:manage"><WorkspacePanel settings={settings} onChange={setSettings} onSaved={(next) => { setSettings(next); setToast("Workspace settings saved."); }} /></AccessBoundary>}
        {active === "profile" && session && <ProfilePanel session={session} onSaved={(name, title) => {
          const next = { ...session, user: { ...session.user, name, title, initials: initials(name) } };
          updateLocalSession(next);
          setMembers((current) => saveWorkspaceMembers(current.map((member) => member.id === session.user.id ? { ...member, name, title, initials: initials(name) } : member)));
          setToast("Profile updated.");
        }} />}
        {active === "members" && <AccessBoundary permission="members:manage"><MembersPanel members={members} roles={roles} onChange={(next) => { setMembers(saveWorkspaceMembers(next)); setToast("Member access updated."); }} onInvite={() => setInviteOpen(true)} /></AccessBoundary>}
        {active === "roles" && <AccessBoundary permission="roles:manage"><RolesPanel roles={roles} onChange={(next) => { setRoles(saveWorkspaceRoles(next)); setToast("Role permissions updated."); }} onCreate={() => setRoleOpen(true)} /></AccessBoundary>}
        {active === "extensions" && <AccessBoundary permission="extensions:manage"><section className="panel settings-extension-panel"><div className="eyebrow">EXTENSIBILITY</div><h2>Workspace extensions</h2><p>The extension host keeps themes, dashboard contributions and trusted code packages outside core CRM modules.</p><Link href="/extensions" className="primary-button">Manage extensions</Link></section></AccessBoundary>}
      </div>
    </div>
    <InviteMemberModal open={inviteOpen} roles={roles} onClose={() => setInviteOpen(false)} onSubmit={(member) => { setMembers(saveWorkspaceMembers([...members, member])); setInviteOpen(false); setToast("Invitation created."); }} />
    <RoleModal open={roleOpen} onClose={() => setRoleOpen(false)} onSubmit={(name, description, permissions) => { const role = createCustomRole(name, description, permissions); setRoles(getWorkspaceRoles()); setRoleOpen(false); setToast(`${role.name} role created.`); }} />
    {toast && <Toast message={toast} onClose={() => setToast("")} />}
  </>;
}

function WorkspacePanel({ settings, onChange, onSaved }: { settings: WorkspaceSettings; onChange: (value: WorkspaceSettings) => void; onSaved: (value: WorkspaceSettings) => void }) {
  function submit(event: FormEvent) { event.preventDefault(); onSaved(saveWorkspaceSettings(settings)); }
  return <form className="panel settings-form" onSubmit={submit}><div className="settings-section-head"><div><div className="eyebrow">ORGANISATION</div><h2>Workspace defaults</h2><p>These values become defaults for new CRM records and server-side reporting.</p></div><Badge tone="blue">Workspace-wide</Badge></div>
    <div className="form-grid two-col">
      <label className="field"><span>Workspace name</span><input value={settings.name} onChange={(e) => onChange({ ...settings, name: e.target.value })} /></label>
      <label className="field"><span>Default currency</span><select value={settings.currency} onChange={(e) => onChange({ ...settings, currency: e.target.value })}><option>EUR</option><option>USD</option><option>GBP</option><option>CAD</option><option>AUD</option></select></label>
      <label className="field"><span>Locale</span><select value={settings.locale} onChange={(e) => onChange({ ...settings, locale: e.target.value })}><option value="en-GB">English (UK)</option><option value="en-US">English (US)</option><option value="de-DE">Deutsch</option><option value="fr-FR">Français</option></select></label>
      <label className="field"><span>Timezone</span><select value={settings.timezone} onChange={(e) => onChange({ ...settings, timezone: e.target.value })}><option>Europe/Berlin</option><option>Europe/London</option><option>America/New_York</option><option>Asia/Dubai</option><option>UTC</option></select></label>
      <label className="field"><span>Fiscal year starts</span><select value={settings.fiscalYearStart} onChange={(e) => onChange({ ...settings, fiscalYearStart: e.target.value })}><option value="JANUARY">January</option><option value="APRIL">April</option><option value="JULY">July</option><option value="OCTOBER">October</option></select></label>
      <label className="field"><span>Week starts on</span><select value={settings.weekStartsOn} onChange={(e) => onChange({ ...settings, weekStartsOn: e.target.value as WorkspaceSettings["weekStartsOn"] })}><option value="MONDAY">Monday</option><option value="SUNDAY">Sunday</option></select></label>
    </div><div className="settings-form-footer"><span>Backend contract: <code>PATCH /workspace/settings</code></span><button className="primary-button" type="submit">Save workspace</button></div>
  </form>;
}

function ProfilePanel({ session, onSaved }: { session: NonNullable<ReturnType<typeof useAuth>["session"]>; onSaved: (name: string, title: string) => void }) {
  const [name, setName] = useState(session.user.name); const [title, setTitle] = useState(session.user.title ?? "");
  return <form className="panel settings-form" onSubmit={(e) => { e.preventDefault(); onSaved(name.trim(), title.trim()); }}><div className="profile-settings-head"><span className="avatar avatar-xlarge">{session.user.initials}</span><div><div className="eyebrow">SIGNED IN AS</div><h2>{session.user.name}</h2><p>{session.user.email} · {session.user.role}</p></div></div><div className="form-grid two-col"><label className="field"><span>Full name</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label><label className="field"><span>Job title</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Account Executive" /></label><label className="field"><span>Email</span><input value={session.user.email} disabled /></label><label className="field"><span>Role</span><input value={session.user.role} disabled /></label></div><div className="security-callout"><div><strong>Password & MFA</strong><p>Password changes, recovery and MFA enrolment are intentionally delegated to the backend identity service.</p></div><span>Auth service</span></div><div className="settings-form-footer"><span>Session expires {new Date(session.expiresAt).toLocaleString()}</span><button className="primary-button" type="submit">Save profile</button></div></form>;
}

function MembersPanel({ members, roles, onChange, onInvite }: { members: WorkspaceUser[]; roles: WorkspaceRole[]; onChange: (members: WorkspaceUser[]) => void; onInvite: () => void }) {
  return <section className="panel settings-members-panel"><div className="settings-section-head"><div><div className="eyebrow">ACCESS</div><h2>Workspace members</h2><p>Invitations and status changes become auditable backend commands in production.</p></div><button className="primary-button" onClick={onInvite}>Invite member</button></div><div className="members-table"><div className="members-table-head"><span>Member</span><span>Role</span><span>Status</span><span>Last active</span><span /></div>{members.map((member) => <div className="member-row" key={member.id}><div className="member-person"><span className="avatar">{member.initials}</span><div><strong>{member.name}</strong><small>{member.email}<br/>{member.title}</small></div></div><select value={member.roleId ?? "MEMBER"} disabled={member.roleId === "OWNER"} onChange={(e) => onChange(members.map((item) => item.id === member.id ? { ...item, roleId: e.target.value, role: roles.find((role) => role.id === e.target.value)?.name ?? e.target.value } : item))}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><Badge tone={member.status === "ACTIVE" ? "green" : member.status === "INVITED" ? "blue" : "red"}>{member.status ?? "ACTIVE"}</Badge><span className="member-active">{member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleDateString() : "Not yet"}</span><button className="secondary-button member-status-button" disabled={member.roleId === "OWNER" || member.status === "INVITED"} onClick={() => onChange(members.map((item) => item.id === member.id ? { ...item, status: item.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED" } : item))}>{member.status === "SUSPENDED" ? "Reactivate" : "Suspend"}</button></div>)}</div></section>;
}

function RolesPanel({ roles, onChange, onCreate }: { roles: WorkspaceRole[]; onChange: (roles: WorkspaceRole[]) => void; onCreate: () => void }) {
  return <section className="panel settings-roles-panel"><div className="settings-section-head"><div><div className="eyebrow">RBAC</div><h2>Roles & permissions</h2><p>Frontend permissions improve UX; NestJS remains authoritative for every protected action.</p></div><button className="primary-button" onClick={onCreate}>Create role</button></div><div className="role-card-grid">{roles.map((role) => <article className="role-card" key={role.id}><div className="role-card-head"><div><strong>{role.name}</strong><p>{role.description}</p></div><Badge tone={role.system ? "neutral" : "blue"}>{role.system ? "System" : "Custom"}</Badge></div><div className="role-count">{role.userCount} {role.userCount === 1 ? "member" : "members"}</div><div className="permission-list">{ALL_PERMISSIONS.map((permission) => <label key={permission} className={role.permissions.includes(permission) ? "enabled" : ""}><input type="checkbox" checked={role.permissions.includes(permission)} disabled={role.system} onChange={(e) => onChange(roles.map((item) => item.id === role.id ? { ...item, permissions: e.target.checked ? [...item.permissions, permission] : item.permissions.filter((value) => value !== permission) } : item))} /><span><strong>{PERMISSION_LABELS[permission].label}</strong><small>{PERMISSION_LABELS[permission].description}</small></span></label>)}</div></article>)}</div></section>;
}

function InviteMemberModal({ open, roles, onClose, onSubmit }: { open: boolean; roles: WorkspaceRole[]; onClose: () => void; onSubmit: (member: WorkspaceUser) => void }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [title, setTitle] = useState(""); const [roleId, setRoleId] = useState("MEMBER");
  const role = useMemo(() => roles.find((item) => item.id === roleId), [roleId, roles]);
  return <Modal open={open} onClose={onClose} title="Invite workspace member" eyebrow="Access" footer={<><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!name.trim() || !email.includes("@")} onClick={() => { onSubmit({ id: `u-${Date.now().toString(36)}`, name: name.trim(), initials: initials(name), email: email.trim(), title: title.trim(), roleId, role: role?.name ?? roleId, status: "INVITED", joinedAt: new Date().toISOString() }); setName(""); setEmail(""); setTitle(""); }}>Send invitation</button></>}><div className="form-grid"><label className="field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} /></label><label className="field"><span>Work email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label className="field"><span>Job title</span><input value={title} onChange={(e) => setTitle(e.target.value)} /></label><label className="field"><span>Role</span><select value={roleId} onChange={(e) => setRoleId(e.target.value)}>{roles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div></Modal>;
}

function RoleModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (name: string, description: string, permissions: PermissionKey[]) => void }) {
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [permissions, setPermissions] = useState<PermissionKey[]>(["crm:read"]);
  return <Modal open={open} onClose={onClose} title="Create custom role" eyebrow="RBAC" size="lg" footer={<><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!name.trim()} onClick={() => { onSubmit(name.trim(), description.trim(), permissions); setName(""); setDescription(""); setPermissions(["crm:read"]); }}>Create role</button></>}><div className="form-grid"><label className="field"><span>Role name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales operations" /></label><label className="field"><span>Description</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this role is responsible for." /></label></div><div className="role-modal-permissions">{ALL_PERMISSIONS.map((permission) => <label key={permission}><input type="checkbox" checked={permissions.includes(permission)} disabled={permission === "crm:read"} onChange={(e) => setPermissions(e.target.checked ? [...permissions, permission] : permissions.filter((item) => item !== permission))} /><span><strong>{PERMISSION_LABELS[permission].label}</strong><small>{PERMISSION_LABELS[permission].description}</small></span></label>)}</div></Modal>;
}
