import { Suspense } from "react";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { productConfig } from "@/config/product";
import { companies, workspaceUsers } from "@/lib/mock-data";

export default function DashboardPage() {
  const date = new Intl.DateTimeFormat(productConfig.locale, { day: "2-digit", month: "short", year: "numeric", timeZone: productConfig.timezone }).format(new Date()).toUpperCase();
  return (
    <>
      <div className="page-header dashboard-header">
        <div>
          <div className="eyebrow">B2B OPERATIONS · {date}</div>
          <h1>Revenue, relationships and delivery.</h1>
          <p>See commercial momentum, customer attention, delivery health and the work that needs a decision next.</p>
        </div>
        <div className="header-system"><span className="status-dot" />{productConfig.workspaceName}</div>
      </div>
      <Suspense fallback={<div className="dashboard-filterbar dashboard-filterbar-skeleton" aria-hidden="true"><div /><div /><div /></div>}>
        <DashboardFilters
          owners={workspaceUsers.map(({ id, name }) => ({ id, name }))}
          companies={companies.filter((company) => !company.archivedAt).map(({ id, name }) => ({ id, name }))}
        />
      </Suspense>
    </>
  );
}
