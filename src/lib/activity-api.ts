import { api } from "./api-client";
import type { PaginatedResponse } from "./api-types";
import type { Activity, RelationType } from "./types";

export type ActivityType = Activity["type"];

export interface ActivityListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: ActivityType;
  actorId?: string;
  relationType?: RelationType;
  relationId?: string;
}

export interface ActivityPayload {
  type: ActivityType;
  title: string;
  detail: string;
  actorId: string;
  relationType: RelationType;
  relationId: string;
  occurredAt?: string;
}

export const activityApi = {
  list(query: ActivityListQuery = {}) { return api<PaginatedResponse<Activity>>("/activities", { query: { page: query.page, pageSize: query.pageSize, search: query.search, type: query.type, actorId: query.actorId, relationType: query.relationType, relationId: query.relationId } }); },
  create(payload: ActivityPayload) { return api<Activity>("/activities", { method: "POST", body: JSON.stringify(payload) }); },
};
