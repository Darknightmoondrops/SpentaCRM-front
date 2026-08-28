import { DashboardDealStats } from "@/components/dashboard/dashboard-deal-stats";
import { getDashboardStats } from "@/lib/dashboard-queries";

export default async function DashboardStatsSlot() {
  const data = await getDashboardStats();
  return <DashboardDealStats seedCompanies={data.companies} seedContacts={data.contacts} seedDeals={data.deals} seedProjects={data.projects} seedTasks={data.tasks} />;
}
