import type { AuditAction, AuditEvent } from "./types";
import type { PaginatedResponse } from "./api-types";
import { api } from "./api-client";

export interface AuditQuery {
  q?: string;
  actorId?: string;
  action?: AuditAction | "ALL";
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const auditApi = {
  list: (query: AuditQuery = {}) => api<PaginatedResponse<AuditEvent>>("/audit", { query: { ...query } }),
  get: (id: string) => api<AuditEvent>(`/audit/${id}`),
};
