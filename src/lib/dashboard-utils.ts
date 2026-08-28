import type { Activity, Company, Contact, Deal, Project, Task } from "./types";
import { OPEN_DEAL_STAGES } from "./deal-utils";
import { taskDueBucket } from "./task-utils";

export type DashboardPeriod = "30D" | "90D" | "ALL";

export type DashboardFilters = {
  period: DashboardPeriod;
  ownerId: string;
  companyId: string;
};

export type DashboardReferences = {
  contacts: Contact[];
  deals: Deal[];
  projects: Project[];
};

export function dashboardFiltersFromSearchParams(params: Pick<URLSearchParams, "get">): DashboardFilters {
  const rawPeriod = params.get("period");
  return {
    period: rawPeriod === "90D" || rawPeriod === "ALL" ? rawPeriod : "30D",
    ownerId: params.get("ownerId") ?? "",
    companyId: params.get("companyId") ?? "",
  };
}

export function dashboardPeriodLabel(period: DashboardPeriod) {
  if (period === "30D") return "Last 30 days";
  if (period === "90D") return "Last 90 days";
  return "All time";
}

export function recordInDashboardPeriod(value: string, period: DashboardPeriod, now = new Date()) {
  if (period === "ALL") return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  const days = period === "30D" ? 30 : 90;
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return date.getTime() >= cutoff && date.getTime() <= now.getTime() + 24 * 60 * 60 * 1000;
}

export function relationCompanyId(type: Task["relationType"] | Activity["relationType"], id: string, refs: DashboardReferences) {
  if (type === "COMPANY") return id;
  if (type === "CONTACT") return refs.contacts.find((contact) => contact.id === id)?.companyId ?? "";
  if (type === "DEAL") return refs.deals.find((deal) => deal.id === id)?.companyId ?? "";
  return refs.projects.find((project) => project.id === id)?.companyId ?? "";
}

export function filterDashboardCompanies(records: Company[], filters: DashboardFilters) {
  return records.filter((company) => {
    if (company.archivedAt) return false;
    if (filters.companyId && company.id !== filters.companyId) return false;
    if (filters.ownerId && company.ownerId !== filters.ownerId) return false;
    if (!recordInDashboardPeriod(company.updatedAt, filters.period)) return false;
    return true;
  });
}

export function filterDashboardDeals(records: Deal[], filters: DashboardFilters) {
  return records.filter((deal) => {
    if (filters.companyId && deal.companyId !== filters.companyId) return false;
    if (filters.ownerId && deal.ownerId !== filters.ownerId) return false;
    if (!recordInDashboardPeriod(deal.updatedAt, filters.period)) return false;
    return true;
  });
}

export function filterDashboardProjects(records: Project[], filters: DashboardFilters) {
  return records.filter((project) => {
    if (project.archivedAt) return false;
    if (filters.companyId && project.companyId !== filters.companyId) return false;
    if (filters.ownerId && project.ownerId !== filters.ownerId) return false;
    if (!recordInDashboardPeriod(project.updatedAt, filters.period)) return false;
    return true;
  });
}

export function filterDashboardTasks(records: Task[], filters: DashboardFilters, refs: DashboardReferences) {
  return records.filter((task) => {
    if (task.archivedAt) return false;
    if (filters.ownerId && task.assigneeId !== filters.ownerId) return false;
    if (filters.companyId && relationCompanyId(task.relationType, task.relationId, refs) !== filters.companyId) return false;
    if (!recordInDashboardPeriod(task.updatedAt, filters.period)) return false;
    return true;
  });
}

export function filterDashboardActivities(records: Activity[], filters: DashboardFilters, refs: DashboardReferences) {
  return records.filter((activity) => {
    if (filters.ownerId && activity.actorId !== filters.ownerId) return false;
    if (filters.companyId && relationCompanyId(activity.relationType, activity.relationId, refs) !== filters.companyId) return false;
    if (!recordInDashboardPeriod(activity.createdAt, filters.period)) return false;
    return true;
  });
}

export function dashboardMetrics({ companies, deals, projects, tasks }: { companies: Company[]; deals: Deal[]; projects: Project[]; tasks: Task[] }) {
  const customers = companies.filter((company) => company.status === "CUSTOMER" && !company.archivedAt);
  const openDeals = deals.filter((deal) => OPEN_DEAL_STAGES.includes(deal.stage));
  const pipelineValue = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weightedForecast = openDeals.reduce((sum, deal) => sum + deal.value * (deal.probability / 100), 0);
  const activeProjects = projects.filter((project) => !project.archivedAt && project.status !== "COMPLETED");
  const deliveryAttention = activeProjects.filter((project) => project.health !== "ON_TRACK");
  const openTasks = tasks.filter((task) => !task.archivedAt && task.status !== "DONE");
  const overdueTasks = openTasks.filter((task) => taskDueBucket(task) === "OVERDUE");
  const dueToday = openTasks.filter((task) => taskDueBucket(task) === "TODAY");
  const deliveryRate = activeProjects.length
    ? Math.round(((activeProjects.length - deliveryAttention.length) / activeProjects.length) * 100)
    : 100;
  return { customers, openDeals, pipelineValue, weightedForecast, activeProjects, deliveryAttention, openTasks, overdueTasks, dueToday, deliveryRate };
}

export function dashboardQuery(filters: DashboardFilters, target: "deals" | "projects" | "tasks" | "activities" | "companies", extra: Record<string, string> = {}) {
  const params = new URLSearchParams();
  if (filters.companyId) params.set("companyId", filters.companyId);
  if (filters.ownerId) {
    if (target === "tasks") params.set("assigneeId", filters.ownerId);
    else if (target === "activities") params.set("actorId", filters.ownerId);
    else params.set("ownerId", filters.ownerId);
  }
  Object.entries(extra).forEach(([key, value]) => value && params.set(key, value));
  return params.toString();
}
