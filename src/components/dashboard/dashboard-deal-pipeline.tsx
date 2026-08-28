"use client";

import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SectionTitle } from "@/components/ui";
import { currency } from "@/lib/format";
import { hydrateMockDeals } from "@/lib/mock-deal-store";
import { OPEN_DEAL_STAGES } from "@/lib/deal-utils";
import { dashboardFiltersFromSearchParams, dashboardQuery, filterDashboardDeals } from "@/lib/dashboard-utils";
import type { Deal } from "@/lib/types";

const stages = ["NEW", "CONTACTED", "PROPOSAL", "NEGOTIATION"] as const;

export function DashboardDealPipeline({ seedDeals }: { seedDeals: Deal[] }) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => dashboardFiltersFromSearchParams(searchParams), [searchParams]);
  const [deals, setDeals] = useState(seedDeals);
  useEffect(() => setDeals(hydrateMockDeals(seedDeals)), [seedDeals]);

  const openDeals = useMemo(() => filterDashboardDeals(deals, filters).filter((deal) => OPEN_DEAL_STAGES.includes(deal.stage)), [deals, filters]);
  const total = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weighted = openDeals.reduce((sum, deal) => sum + deal.value * deal.probability / 100, 0);
  const avgProbability = openDeals.length ? Math.round(openDeals.reduce((sum, deal) => sum + deal.probability, 0) / openDeals.length) : 0;
  const maxValue = Math.max(1, ...stages.map((stage) => openDeals.filter((deal) => deal.stage === stage).reduce((sum, deal) => sum + deal.value, 0)));
  const baseQuery = dashboardQuery(filters, "deals", { view: "OPEN" });

  return (
    <section className="panel panel-large dashboard-pipeline-panel">
      <SectionTitle eyebrow="Revenue" title="Pipeline & forecast" action={{ label: "Open pipeline", href: `/deals${baseQuery ? `?${baseQuery}` : ""}` as Route }} />
      <div className="dashboard-pipeline-summary">
        <div><span>Open value</span><strong>{currency(total)}</strong></div>
        <div><span>Weighted forecast</span><strong>{currency(weighted)}</strong></div>
        <div><span>Avg. confidence</span><strong>{avgProbability}%</strong></div>
      </div>
      <div className="pipeline-bars dashboard-pipeline-bars">
        {stages.map((stage, index) => {
          const stageDeals = openDeals.filter((deal) => deal.stage === stage);
          const value = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
          const stageWeighted = stageDeals.reduce((sum, deal) => sum + deal.value * deal.probability / 100, 0);
          const query = dashboardQuery(filters, "deals", { view: "OPEN", stage });
          return (
            <Link href={`/deals${query ? `?${query}` : ""}` as Route} className="pipeline-row dashboard-pipeline-row" key={stage}>
              <div className="pipeline-index">0{index + 1}</div>
              <div className="pipeline-name"><strong>{stage.replace("_", " ")}</strong><span>{stageDeals.length} deal{stageDeals.length === 1 ? "" : "s"}</span></div>
              <div className="pipeline-track"><span style={{ width: `${value ? Math.max(8, value / maxValue * 100) : 0}%` }} /></div>
              <div className="pipeline-value"><strong>{currency(value)}</strong><span>{currency(stageWeighted)} weighted</span></div>
            </Link>
          );
        })}
        {!openDeals.length && <div className="dashboard-empty-inline">No open opportunities match the selected scope.</div>}
      </div>
    </section>
  );
}
