"use client";

import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ActivityIcon, ArrowIcon } from "@/components/icons";
import { SectionTitle } from "@/components/ui";
import { hydrateMockActivities } from "@/lib/mock-activity-store";
import { dashboardFiltersFromSearchParams, dashboardQuery, filterDashboardActivities } from "@/lib/dashboard-utils";
import type { Activity, Contact, Deal, Project, RelationType } from "@/lib/types";

function href(type: RelationType, id: string): Route { if (type === "COMPANY") return `/companies/${id}` as Route; if (type === "CONTACT") return `/contacts/${id}` as Route; if (type === "DEAL") return `/deals/${id}` as Route; return `/projects/${id}` as Route; }
export function DashboardActivity({ seedActivities, contacts, deals, projects }: { seedActivities: Activity[]; contacts: Contact[]; deals: Deal[]; projects: Project[] }) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => dashboardFiltersFromSearchParams(searchParams), [searchParams]);
  const [activities, setActivities] = useState(seedActivities);
  useEffect(() => setActivities(hydrateMockActivities(seedActivities)), [seedActivities]);
  const refs = useMemo(() => ({ contacts, deals, projects }), [contacts, deals, projects]);
  const visible = useMemo(() => filterDashboardActivities(activities, filters, refs).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [activities, filters, refs]);
  const typeCounts = useMemo(() => visible.reduce<Record<string, number>>((acc, item) => { acc[item.type] = (acc[item.type] ?? 0) + 1; return acc; }, {}), [visible]);
  const relationCount = new Set(visible.map((item) => `${item.relationType}:${item.relationId}`)).size;
  const query = dashboardQuery(filters, "activities");

  return <section className="panel section-space dashboard-stream-section dashboard-activity-section"><SectionTitle eyebrow="Relationships" title="Customer activity" action={{ label: "Full activity", href: `/activities${query ? `?${query}` : ""}` as Route }} />
    <div className="dashboard-activity-intel"><div><strong>{visible.length}</strong><span>Touchpoints</span></div><div><strong>{relationCount}</strong><span>Records touched</span></div><div><strong>{typeCounts.MEETING ?? 0}</strong><span>Meetings</span></div><div><strong>{(typeCounts.EMAIL ?? 0) + (typeCounts.CALL ?? 0)}</strong><span>Email / calls</span></div></div>
    <div className="activity-list">{visible.slice(0, 5).map((activity) => <Link href={href(activity.relationType, activity.relationId)} className="activity-row" key={activity.id}><div className="activity-time">{activity.time}</div><div className="activity-mark"><span /></div><div className="activity-icon"><ActivityIcon /></div><div className="activity-copy"><strong>{activity.title}</strong><p>{activity.detail}</p><small>{activity.actor} · {activity.relation}</small></div><ArrowIcon className="row-arrow" /></Link>)}</div>
    {!visible.length && <div className="dashboard-empty-inline">No customer activity matches the selected scope.</div>}
  </section>;
}
