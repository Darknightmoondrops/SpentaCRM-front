import { DashboardProjects } from "@/components/dashboard/dashboard-projects";
import { getDashboardProjects } from "@/lib/dashboard-queries";

export default async function DashboardProjectsSlot() {
  const projects = await getDashboardProjects();
  return <DashboardProjects seedProjects={projects} />;
}
