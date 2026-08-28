import { activities, companies, contacts, deals, tasks } from "@/lib/mock-data";

/**
 * Server query boundary for Contact routes.
 * Replace these fixtures with NestJS API calls without changing route components.
 */
export async function getContactById(id: string) {
  return contacts.find((item) => item.id === id) ?? null;
}

export async function getContactCompany(contactId: string) {
  const contact = contacts.find((item) => item.id === contactId);
  if (!contact) return null;
  return companies.find((item) => item.id === contact.companyId) ?? null;
}

export async function getContactDeals(id: string) {
  return deals.filter((item) => item.primaryContactId === id);
}

export async function getContactTasks(id: string) {
  return tasks.filter((item) => item.relationType === "CONTACT" && item.relationId === id);
}

export async function getContactActivities(id: string) {
  return activities.filter((item) => item.relationType === "CONTACT" && item.relationId === id);
}
