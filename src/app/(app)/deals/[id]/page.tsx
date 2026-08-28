import { Suspense } from "react";
import { DealDetailData } from "@/components/deals/deal-detail-data";
import DealDetailLoading from "./loading";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<DealDetailLoading />}>
      <DealDetailData dealId={id} />
    </Suspense>
  );
}
