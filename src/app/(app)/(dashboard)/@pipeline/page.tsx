import { DashboardDealPipeline } from "@/components/dashboard/dashboard-deal-pipeline";
import { getDashboardPipeline } from "@/lib/dashboard-queries";

export default async function DashboardPipelineSlot() {
  const deals = await getDashboardPipeline();
  return <DashboardDealPipeline seedDeals={deals} />;
}
