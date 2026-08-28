import { productConfig } from "@/config/product";
import { workspaceUsers } from "@/lib/mock-data";
import type { AuthSession, PermissionKey } from "@/lib/types";
import { permissionsForRole } from "./permissions";

export const DEMO_SESSION_STORAGE_KEY = "b2b-crm:auth-session:v1";
export const DEMO_SESSION_COOKIE = "b2b_crm_demo_session";
export const DEMO_PASSWORD = "demo1234";

export function createDemoSession(email = productConfig.demoUser.email): AuthSession {
  const selected = workspaceUsers.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? workspaceUsers[0];
  const roleId = selected.roleId ?? "MEMBER";
  return {
    user: {
      id: selected.id,
      name: selected.name,
      initials: selected.initials,
      email: selected.email ?? email,
      roleId,
      role: selected.role ?? String(roleId),
      title: selected.title,
    },
    workspace: { id: "workspace-demo", name: productConfig.workspaceName, plan: productConfig.workspacePlan },
    permissions: permissionsForRole(roleId) as PermissionKey[],
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}

export function persistDemoSession(session: AuthSession) {
  window.localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(session));
  document.cookie = `${DEMO_SESSION_COOKIE}=1; Path=/; Max-Age=${8 * 60 * 60}; SameSite=Lax`;
}

export function readDemoSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY);
    if (!raw) { clearDemoSession(); return null; }
    const session = JSON.parse(raw) as AuthSession;
    if (!session.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) {
      clearDemoSession();
      return null;
    }
    return session;
  } catch {
    clearDemoSession();
    return null;
  }
}

export function clearDemoSession() {
  window.localStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
  document.cookie = `${DEMO_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
