import { activities, companies, contacts, deals, projects } from "@/lib/mock-data";

/**
 * Server query boundary for Company routes.
 * Mock fixtures live here only until the NestJS API exists.
 */
export async function getCompanyById(id: string) {
  return companies.find((item) => item.id === id) ?? null;
}

export async function getCompanyContacts(id: string) {
  return contacts.filter((item) => item.companyId === id);
}

export async function getCompanyDeals(id: string) {
  return deals.filter((item) => item.companyId === id);
}

export async function getCompanyProjects(id: string) {
  return projects.filter((item) => item.companyId === id);
}

export async function getCompanyActivities(relationIds: Set<string>) {
  return activities.filter((activity) => relationIds.has(activity.relationId));
}
