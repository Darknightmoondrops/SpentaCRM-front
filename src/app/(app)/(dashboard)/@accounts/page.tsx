import { DashboardAccountAttention } from "@/components/dashboard/dashboard-account-attention";
import { getDashboardAccounts } from "@/lib/dashboard-queries";

export default async function DashboardAccountsSlot() {
  const data = await getDashboardAccounts();
  return <DashboardAccountAttention seedCompanies={data.companies} seedContacts={data.contacts} seedDeals={data.deals} seedProjects={data.projects} seedTasks={data.tasks} seedActivities={data.activities} />;
}
