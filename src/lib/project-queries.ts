import { activities, companies, deals, projects, tasks, workspaceUsers } from "./mock-data";

export async function getProjectById(id: string) {
  return projects.find((item) => item.id === id) ?? null;
}

export async function getProjectCompany(id: string) {
  const project = projects.find((item) => item.id === id);
  if (!project) return null;
  return companies.find((item) => item.id === project.companyId) ?? null;
}

export async function getProjectSourceDeal(id: string) {
  const project = projects.find((item) => item.id === id);
  if (!project?.sourceDealId) return null;
  return deals.find((item) => item.id === project.sourceDealId) ?? null;
}

export async function getProjectTasks(id: string) {
  return tasks.filter((item) => item.relationType === "PROJECT" && item.relationId === id);
}

export async function getProjectActivities(id: string) {
  return activities.filter((item) => item.relationType === "PROJECT" && item.relationId === id);
}

export async function getProjectMembers(id: string) {
  const project = projects.find((item) => item.id === id);
  if (!project) return [];
  return workspaceUsers.filter((user) => project.memberIds.includes(user.id));
}

export async function getProjectFormOptions() {
  return { companies, deals, owners: workspaceUsers };
}
