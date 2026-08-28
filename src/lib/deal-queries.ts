import { activities, companies, contacts, deals, projects, tasks, workspaceUsers } from "@/lib/mock-data";

/**
 * Server query boundary for Deal routes.
 * These calls are deliberately independent so the route can fetch them in parallel.
 * Replace fixtures with NestJS requests without changing route components.
 */
export async function getDealById(id: string) {
  return deals.find((item) => item.id === id) ?? null;
}

export async function getDealCompany(id: string) {
  const deal = deals.find((item) => item.id === id);
  if (!deal) return null;
  return companies.find((item) => item.id === deal.companyId) ?? null;
}

export async function getDealContact(id: string) {
  const deal = deals.find((item) => item.id === id);
  if (!deal?.primaryContactId) return null;
  return contacts.find((item) => item.id === deal.primaryContactId) ?? null;
}

export async function getDealTasks(id: string) {
  return tasks.filter((item) => item.relationType === "DEAL" && item.relationId === id);
}

export async function getDealActivities(id: string) {
  return activities.filter((item) => item.relationType === "DEAL" && item.relationId === id);
}

export async function getDealProject(id: string) {
  return projects.find((item) => item.sourceDealId === id) ?? null;
}

export async function getDealFormOptions() {
  return { companies, contacts, owners: workspaceUsers };
}
