import { api } from "./api-client";
import type { Activity, Company, Deal, Project, Task } from "./types";
import type { DashboardPeriod } from "./dashboard-utils";

export type DashboardScopeQuery = {
  period?: DashboardPeriod;
  ownerId?: string;
  companyId?: string;
};

export type DashboardKpiReadModel = {
  activeCustomers: number;
  openPipelineValue: number;
  weightedForecast: number;
  activeProjects: number;
  projectsNeedingAttention: number;
  deliveryRate: number;
  overdueTasks: number;
  dueTodayTasks: number;
};

export type DashboardPipelineStageReadModel = {
  stage: Deal["stage"];
  dealCount: number;
  value: number;
  weightedValue: number;
};

export type DashboardAccountAttentionReadModel = {
  company: Company;
  openDeals: number;
  deliveryAttention: number;
  overdueTasks: number;
  latestActivityAt?: string;
};

export const dashboardApi = {
  kpis: (query: DashboardScopeQuery) => api<DashboardKpiReadModel>("/dashboard/kpis", { query: { ...query } }),
  pipeline: (query: DashboardScopeQuery) => api<{ stages: DashboardPipelineStageReadModel[]; openValue: number; weightedForecast: number; averageProbability: number }>("/dashboard/pipeline", { query: { ...query } }),
  work: (query: DashboardScopeQuery) => api<{ tasks: Task[] }>("/dashboard/work", { query: { ...query } }),
  delivery: (query: DashboardScopeQuery) => api<{ projects: Project[] }>("/dashboard/delivery", { query: { ...query } }),
  accounts: (query: DashboardScopeQuery) => api<{ accounts: DashboardAccountAttentionReadModel[] }>("/dashboard/accounts", { query: { ...query } }),
  activity: (query: DashboardScopeQuery) => api<{ activities: Activity[]; touchpoints: number; recordsTouched: number }>("/dashboard/activity", { query: { ...query } }),
};
