import { DashboardActivity } from "@/components/dashboard/dashboard-activity";
import { getDashboardActivity } from "@/lib/dashboard-queries";

export default async function DashboardActivitySlot() {
  const data = await getDashboardActivity();
  return <DashboardActivity seedActivities={data.activities} contacts={data.contacts} deals={data.deals} projects={data.projects} />;
}
