import { Suspense } from "react";
import { CompaniesWorkspace } from "@/components/companies/companies-workspace";
import { companies, workspaceUsers } from "@/lib/mock-data";
import CompaniesLoading from "./loading";

export default function CompaniesPage() {
  return (
    <Suspense fallback={<CompaniesLoading />}>
      <CompaniesWorkspace seedCompanies={companies} owners={workspaceUsers} />
    </Suspense>
  );
}
