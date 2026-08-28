import type { PermissionKey, WorkspaceRole, WorkspaceSettings, WorkspaceUser } from "./types";
import { api } from "./api-client";

export interface InviteMemberPayload { name: string; email: string; roleId: string; title?: string; }
export interface UpdateMemberPayload { roleId?: string; title?: string; status?: "ACTIVE" | "SUSPENDED"; }
export interface CreateRolePayload { name: string; description: string; permissions: PermissionKey[]; }

export const workspaceApi = {
  getSettings: () => api<WorkspaceSettings>("/workspace/settings"),
  updateSettings: (payload: Partial<WorkspaceSettings>) => api<WorkspaceSettings>("/workspace/settings", { method: "PATCH", body: JSON.stringify(payload) }),
  listMembers: () => api<WorkspaceUser[]>("/workspace/members"),
  inviteMember: (payload: InviteMemberPayload) => api<WorkspaceUser>("/workspace/members", { method: "POST", body: JSON.stringify(payload) }),
  updateMember: (id: string, payload: UpdateMemberPayload) => api<WorkspaceUser>(`/workspace/members/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  listRoles: () => api<WorkspaceRole[]>("/workspace/roles"),
  createRole: (payload: CreateRolePayload) => api<WorkspaceRole>("/workspace/roles", { method: "POST", body: JSON.stringify(payload) }),
  updateRole: (id: string, payload: Partial<CreateRolePayload>) => api<WorkspaceRole>(`/workspace/roles/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteRole: (id: string) => api<void>(`/workspace/roles/${id}`, { method: "DELETE" }),
};
