"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { dashboardFiltersFromSearchParams, dashboardPeriodLabel, type DashboardPeriod } from "@/lib/dashboard-utils";

type Option = { id: string; name: string };

export function DashboardFilters({ owners, companies }: { owners: Option[]; companies: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const filters = useMemo(() => dashboardFiltersFromSearchParams(searchParams), [searchParams]);

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (!value || (key === "period" && value === "30D")) params.delete(key);
      else params.set(key, value);
    });
    const query = params.toString();
    startTransition(() => router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false }));
  }

  const activeCount = Number(Boolean(filters.ownerId)) + Number(Boolean(filters.companyId)) + Number(filters.period !== "30D");
  return (
    <section className="dashboard-filterbar" aria-label="Dashboard filters" aria-busy={isPending}>
      <div className="dashboard-filterbar-copy">
        <strong>Operational scope</strong>
        <span>{dashboardPeriodLabel(filters.period)} · {activeCount ? `${activeCount} custom filter${activeCount > 1 ? "s" : ""}` : "default view"}</span>
      </div>
      <div className="dashboard-filter-controls">
        <label className="dashboard-filter-control">
          <span>Period</span>
          <select value={filters.period} onChange={(event) => update({ period: event.target.value as DashboardPeriod })}>
            <option value="30D">Last 30 days</option>
            <option value="90D">Last 90 days</option>
            <option value="ALL">All time</option>
          </select>
        </label>
        <label className="dashboard-filter-control">
          <span>Team member</span>
          <select value={filters.ownerId} onChange={(event) => update({ ownerId: event.target.value || null })}>
            <option value="">Everyone</option>
            {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
          </select>
        </label>
        <label className="dashboard-filter-control dashboard-filter-account">
          <span>Account</span>
          <select value={filters.companyId} onChange={(event) => update({ companyId: event.target.value || null })}>
            <option value="">All accounts</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
        </label>
        {activeCount > 0 && <button className="dashboard-filter-reset" type="button" onClick={() => update({ period: null, ownerId: null, companyId: null })}>Reset</button>}
      </div>
    </section>
  );
}
