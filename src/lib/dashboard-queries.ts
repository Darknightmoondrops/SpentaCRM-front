import { activities, companies, contacts, deals, projects, tasks } from "@/lib/mock-data";

/**
 * Server-side dashboard query boundary.
 * Today these functions return mock fixtures. When NestJS is available, each
 * parallel route can replace this implementation with parallel API calls while
 * the dashboard components and filter contract remain unchanged.
 */
export async function getDashboardStats() {
  return { companies, contacts, deals, projects, tasks };
}

export async function getDashboardPipeline() {
  return deals;
}

export async function getDashboardPriorityTasks() {
  return { tasks, contacts, deals, projects };
}

export async function getDashboardProjects() {
  return projects;
}

export async function getDashboardAccounts() {
  return { companies, contacts, deals, projects, tasks, activities };
}

export async function getDashboardActivity() {
  return { activities, contacts, deals, projects };
}
