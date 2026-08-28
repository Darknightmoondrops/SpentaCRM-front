import { Suspense } from "react";
import { CompanyDetailData } from "@/components/companies/company-detail-data";
import CompanyDetailLoading from "./loading";

export default async function CompanyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<CompanyDetailLoading />}>
      <CompanyDetailData companyId={id} />
    </Suspense>
  );
}
