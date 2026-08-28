import { api } from "./api-client";
import type { PaginatedResponse } from "./api-types";
import type { MilestoneStatus, Project, ProjectHealth, ProjectMilestone, ProjectStatus } from "./types";

export type ProjectSortBy = "updatedAt" | "title" | "targetDate" | "progress";
export type SortOrder = "asc" | "desc";

export interface ProjectListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  companyId?: string;
  ownerId?: string;
  status?: ProjectStatus;
  health?: ProjectHealth;
  active?: boolean;
  sortBy?: ProjectSortBy;
  sortOrder?: SortOrder;
}

export interface ProjectPayload {
  title: string;
  companyId: string;
  sourceDealId?: string;
  status: ProjectStatus;
  health: ProjectHealth;
  ownerId: string;
  memberIds: string[];
  progress: number;
  startDate: string;
  targetDate: string;
  description?: string;
}

export interface MilestonePayload {
  title: string;
  dueDate: string;
  status: MilestoneStatus;
}

export const projectApi = {
  list(query: ProjectListQuery = {}) {
    return api<PaginatedResponse<Project>>("/projects", { query: {
      page: query.page, pageSize: query.pageSize, search: query.search, companyId: query.companyId,
      ownerId: query.ownerId, status: query.status, health: query.health, active: query.active,
      sortBy: query.sortBy, sortOrder: query.sortOrder,
    } });
  },
  get(id: string) {
    return api<Project>(`/projects/${id}`);
  },
  create(payload: ProjectPayload) {
    return api<Project>("/projects", { method: "POST", body: JSON.stringify(payload) });
  },
  update(id: string, payload: Partial<ProjectPayload>) {
    return api<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  },
  setStatus(id: string, status: ProjectStatus) {
    return api<Project>(`/projects/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
  },
  setProgress(id: string, progress: number) {
    return api<Project>(`/projects/${id}/progress`, { method: "POST", body: JSON.stringify({ progress }) });
  },
  replaceTeam(id: string, memberIds: string[]) {
    return api<Project>(`/projects/${id}/team`, { method: "PUT", body: JSON.stringify({ memberIds }) });
  },
  addMilestone(id: string, payload: MilestonePayload) {
    return api<ProjectMilestone>(`/projects/${id}/milestones`, { method: "POST", body: JSON.stringify(payload) });
  },
  updateMilestone(id: string, milestoneId: string, payload: Partial<MilestonePayload>) {
    return api<ProjectMilestone>(`/projects/${id}/milestones/${milestoneId}`, { method: "PATCH", body: JSON.stringify(payload) });
  },
  archive(id: string) {
    return api<Project>(`/projects/${id}/archive`, { method: "POST" });
  },
  reactivate(id: string) {
    return api<Project>(`/projects/${id}/reactivate`, { method: "POST" });
  },
};
