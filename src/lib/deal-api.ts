import { api } from "./api-client";
import type { PaginatedResponse } from "./api-types";
import type { Deal, DealStage, Project, ProjectHealth } from "./types";

export type DealSortBy = "updatedAt" | "title" | "value" | "closeDate" | "probability";
export type SortOrder = "asc" | "desc";

export interface DealListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  companyId?: string;
  ownerId?: string;
  stage?: DealStage;
  open?: boolean;
  sortBy?: DealSortBy;
  sortOrder?: SortOrder;
}

export interface DealPayload {
  title: string;
  companyId: string;
  primaryContactId?: string;
  stage: DealStage;
  value: number;
  ownerId: string;
  closeDate: string;
  probability: number;
  description?: string;
}

export interface MarkLostPayload {
  reason: string;
}


export interface CreateProjectFromDealPayload {
  title: string;
  ownerId: string;
  memberIds: string[];
  startDate: string;
  targetDate: string;
  health: ProjectHealth;
  description?: string;
}

export type CreateDealPayload = DealPayload;
export type UpdateDealPayload = Partial<DealPayload>;

export const dealApi = {
  list(query: DealListQuery = {}) {
    return api<PaginatedResponse<Deal>>("/deals", {
      query: {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        companyId: query.companyId,
        ownerId: query.ownerId,
        stage: query.stage,
        open: query.open,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });
  },
  get(id: string) {
    return api<Deal>(`/deals/${id}`);
  },
  create(payload: CreateDealPayload) {
    return api<Deal>("/deals", { method: "POST", body: JSON.stringify(payload) });
  },
  update(id: string, payload: UpdateDealPayload) {
    return api<Deal>(`/deals/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  },
  move(id: string, stage: DealStage) {
    return api<Deal>(`/deals/${id}/stage`, { method: "POST", body: JSON.stringify({ stage }) });
  },
  markWon(id: string) {
    return api<Deal>(`/deals/${id}/mark-won`, { method: "POST" });
  },
  markLost(id: string, payload: MarkLostPayload) {
    return api<Deal>(`/deals/${id}/mark-lost`, { method: "POST", body: JSON.stringify(payload) });
  },
  reopen(id: string, stage: Exclude<DealStage, "WON" | "LOST"> = "NEGOTIATION") {
    return api<Deal>(`/deals/${id}/reopen`, { method: "POST", body: JSON.stringify({ stage }) });
  },
  createProject(id: string, payload: CreateProjectFromDealPayload) {
    return api<Project>(`/deals/${id}/create-project`, { method: "POST", body: JSON.stringify(payload) });
  },
};
