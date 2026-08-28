import { api } from "./api-client";
import type { PaginatedResponse } from "./api-types";
import type { Priority, RelationType, Task, TaskStatus } from "./types";

export interface TaskListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  relationType?: RelationType;
  relationId?: string;
  due?: "OVERDUE" | "TODAY" | "UPCOMING";
}

export interface TaskPayload {
  title: string;
  description?: string;
  relationType: RelationType;
  relationId: string;
  assigneeId: string;
  dueAt: string;
  priority: Priority;
  status?: TaskStatus;
}

export const taskApi = {
  list(query: TaskListQuery = {}) {
    return api<PaginatedResponse<Task>>("/tasks", { query: { page: query.page, pageSize: query.pageSize, search: query.search, status: query.status, priority: query.priority, assigneeId: query.assigneeId, relationType: query.relationType, relationId: query.relationId, due: query.due } });
  },
  get(id: string) { return api<Task>(`/tasks/${id}`); },
  create(payload: TaskPayload) { return api<Task>("/tasks", { method: "POST", body: JSON.stringify(payload) }); },
  update(id: string, payload: Partial<TaskPayload>) { return api<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); },
  setStatus(id: string, status: TaskStatus) { return api<Task>(`/tasks/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }); },
  archive(id: string) { return api<Task>(`/tasks/${id}/archive`, { method: "POST" }); },
  reactivate(id: string) { return api<Task>(`/tasks/${id}/reactivate`, { method: "POST" }); },
};
