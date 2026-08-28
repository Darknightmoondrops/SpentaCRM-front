import { productConfig } from "@/config/product";
import { SYSTEM_ROLES } from "@/auth/permissions";
import { workspaceUsers } from "./mock-data";
import type { PermissionKey, WorkspaceRole, WorkspaceSettings, WorkspaceUser } from "./types";

const SETTINGS_KEY = "spentacrm:workspace-settings:v1";
const MEMBERS_KEY = "spentacrm:workspace-members:v1";
const ROLES_KEY = "spentacrm:workspace-roles:v1";

export const defaultWorkspaceSettings: WorkspaceSettings = {
  name: productConfig.workspaceName,
  currency: productConfig.currency,
  locale: productConfig.locale,
  timezone: productConfig.timezone,
  fiscalYearStart: "JANUARY",
  weekStartsOn: "MONDAY",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch { return fallback; }
}

function write<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("spentacrm:workspace-store", { detail: { key } }));
}

export function getWorkspaceSettings() { return read(SETTINGS_KEY, defaultWorkspaceSettings); }
export function saveWorkspaceSettings(settings: WorkspaceSettings) { write(SETTINGS_KEY, settings); return settings; }

export function getWorkspaceMembers() { return read<WorkspaceUser[]>(MEMBERS_KEY, workspaceUsers); }
export function saveWorkspaceMembers(members: WorkspaceUser[]) { write(MEMBERS_KEY, members); return members; }

export function getWorkspaceRoles() { return read<WorkspaceRole[]>(ROLES_KEY, SYSTEM_ROLES); }
export function saveWorkspaceRoles(roles: WorkspaceRole[]) { write(ROLES_KEY, roles); return roles; }

export function createCustomRole(name: string, description: string, permissions: PermissionKey[]) {
  const roles = getWorkspaceRoles();
  const id = `CUSTOM_${name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "")}_${Date.now().toString(36).toUpperCase()}`;
  const role: WorkspaceRole = { id, name, description, permissions, system: false, userCount: 0 };
  saveWorkspaceRoles([...roles, role]);
  return role;
}
