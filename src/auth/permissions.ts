import type { PermissionKey, WorkspaceRole, WorkspaceRoleId } from "@/lib/types";

export const ALL_PERMISSIONS: PermissionKey[] = [
  "crm:read",
  "crm:write",
  "crm:archive",
  "workspace:manage",
  "members:manage",
  "roles:manage",
  "audit:read",
  "extensions:manage",
];

export const SYSTEM_ROLES: WorkspaceRole[] = [
  { id: "OWNER", name: "Owner", description: "Workspace ownership, governance and unrestricted access.", permissions: ALL_PERMISSIONS, system: true, userCount: 1 },
  { id: "ADMIN", name: "Administrator", description: "Full CRM and workspace administration without ownership controls.", permissions: ALL_PERMISSIONS.filter((permission) => permission !== "roles:manage"), system: true, userCount: 1 },
  { id: "MANAGER", name: "Manager", description: "Manage customer work, reporting and day-to-day team operations.", permissions: ["crm:read", "crm:write", "crm:archive", "audit:read"], system: true, userCount: 1 },
  { id: "MEMBER", name: "Member", description: "Create and update CRM records assigned to the team.", permissions: ["crm:read", "crm:write"], system: true, userCount: 4 },
  { id: "VIEWER", name: "Viewer", description: "Read-only access to customer, sales and delivery records.", permissions: ["crm:read"], system: true, userCount: 1 },
];

export const PERMISSION_LABELS: Record<PermissionKey, { label: string; description: string }> = {
  "crm:read": { label: "Read CRM", description: "View companies, contacts, deals, projects, tasks and activities." },
  "crm:write": { label: "Write CRM", description: "Create and update operational CRM records." },
  "crm:archive": { label: "Archive records", description: "Archive and reactivate CRM records." },
  "workspace:manage": { label: "Workspace settings", description: "Change workspace defaults and organisation settings." },
  "members:manage": { label: "Manage members", description: "Invite, suspend and assign roles to workspace users." },
  "roles:manage": { label: "Manage roles", description: "Create custom roles and update permission sets." },
  "audit:read": { label: "View audit log", description: "Read immutable governance and security events." },
  "extensions:manage": { label: "Manage extensions", description: "Install, enable and configure workspace extensions." },
};

export function permissionsForRole(roleId: WorkspaceRoleId, roles: WorkspaceRole[] = SYSTEM_ROLES) {
  return roles.find((role) => role.id === roleId)?.permissions ?? ["crm:read"];
}
