import { DashboardPriorityTasks } from "@/components/dashboard/dashboard-priority-tasks";
import { getDashboardPriorityTasks } from "@/lib/dashboard-queries";

export default async function DashboardPrioritySlot() {
  const data = await getDashboardPriorityTasks();
  return <DashboardPriorityTasks seedTasks={data.tasks} contacts={data.contacts} deals={data.deals} projects={data.projects} />;
}
