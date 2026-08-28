import { api } from "./api-client";
import type { PaginatedResponse } from "./api-types";
import type { Company, CompanyStatus } from "./types";

export type CompanySortBy = "updatedAt" | "name" | "value" | "openDeals";
export type SortOrder = "asc" | "desc";

export interface CompanyListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CompanyStatus | "ARCHIVED";
  sortBy?: CompanySortBy;
  sortOrder?: SortOrder;
}

export interface CompanyPayload {
  name: string;
  industry: string;
  status: CompanyStatus;
  location: string;
  website: string;
  ownerId: string;
  description?: string;
}

export type CreateCompanyPayload = CompanyPayload;
export type UpdateCompanyPayload = Partial<CompanyPayload>;

export const companyApi = {
  list(query: CompanyListQuery = {}) {
    return api<PaginatedResponse<Company>>("/companies", {
      query: {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        status: query.status,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });
  },
  get(id: string) {
    return api<Company>(`/companies/${id}`);
  },
  create(payload: CreateCompanyPayload) {
    return api<Company>("/companies", { method: "POST", body: JSON.stringify(payload) });
  },
  update(id: string, payload: UpdateCompanyPayload) {
    return api<Company>(`/companies/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  },
  archive(id: string) {
    return api<Company>(`/companies/${id}/archive`, { method: "POST" });
  },
  reactivate(id: string) {
    return api<Company>(`/companies/${id}/reactivate`, { method: "POST" });
  },
};
