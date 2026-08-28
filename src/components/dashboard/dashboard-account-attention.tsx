"use client";

import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, SectionTitle } from "@/components/ui";
import { hydrateMockActivities } from "@/lib/mock-activity-store";
import { hydrateMockCompanies } from "@/lib/mock-company-store";
import { hydrateMockContacts } from "@/lib/mock-contact-store";
import { hydrateMockDeals } from "@/lib/mock-deal-store";
import { hydrateMockProjects } from "@/lib/mock-project-store";
import { hydrateMockTasks } from "@/lib/mock-task-store";
import {
  dashboardFiltersFromSearchParams,
  dashboardQuery,
  filterDashboardCompanies,
  relationCompanyId,
} from "@/lib/dashboard-utils";
import { OPEN_DEAL_STAGES } from "@/lib/deal-utils";
import { taskDueBucket } from "@/lib/task-utils";
import type { Activity, Company, Contact, Deal, Project, Task } from "@/lib/types";

type AccountSignal = { company: Company; score: number; openDeals: number; deliveryAttention: number; overdueTasks: number; latestActivity?: Activity };

export function DashboardAccountAttention({ seedCompanies, seedContacts, seedDeals, seedProjects, seedTasks, seedActivities }: { seedCompanies: Company[]; seedContacts: Contact[]; seedDeals: Deal[]; seedProjects: Project[]; seedTasks: Task[]; seedActivities: Activity[] }) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => dashboardFiltersFromSearchParams(searchParams), [searchParams]);
  const [companies, setCompanies] = useState(seedCompanies);
  const [contacts, setContacts] = useState(seedContacts);
  const [deals, setDeals] = useState(seedDeals);
  const [projects, setProjects] = useState(seedProjects);
  const [tasks, setTasks] = useState(seedTasks);
  const [activities, setActivities] = useState(seedActivities);

  useEffect(() => setCompanies(hydrateMockCompanies(seedCompanies)), [seedCompanies]);
  useEffect(() => setContacts(hydrateMockContacts(seedContacts)), [seedContacts]);
  useEffect(() => setDeals(hydrateMockDeals(seedDeals)), [seedDeals]);
  useEffect(() => setProjects(hydrateMockProjects(seedProjects)), [seedProjects]);
  useEffect(() => setTasks(hydrateMockTasks(seedTasks)), [seedTasks]);
  useEffect(() => setActivities(hydrateMockActivities(seedActivities)), [seedActivities]);

  const records = useMemo<AccountSignal[]>(() => {
    const refs = { contacts, deals, projects };
    return filterDashboardCompanies(companies, filters).map((company) => {
      const companyDeals = deals.filter((deal) => deal.companyId === company.id && OPEN_DEAL_STAGES.includes(deal.stage));
      const companyProjects = projects.filter((project) => project.companyId === company.id && !project.archivedAt && project.status !== "COMPLETED");
      const deliveryAttention = companyProjects.filter((project) => project.health !== "ON_TRACK").length;
      const overdueTasks = tasks.filter((task) => !task.archivedAt && task.status !== "DONE" && taskDueBucket(task) === "OVERDUE" && relationCompanyId(task.relationType, task.relationId, refs) === company.id).length;
      const latestActivity = activities
        .filter((activity) => relationCompanyId(activity.relationType, activity.relationId, refs) === company.id)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
      const stale = latestActivity ? Date.now() - new Date(latestActivity.createdAt).getTime() > 14 * 24 * 60 * 60 * 1000 : true;
      const score = deliveryAttention * 3 + overdueTasks * 2 + (stale ? 2 : 0) + (company.status === "PROSPECT" && companyDeals.length ? 1 : 0);
      return { company, score, openDeals: companyDeals.length, deliveryAttention, overdueTasks, latestActivity };
    }).sort((a, b) => b.score - a.score || b.company.value - a.company.value).slice(0, 5);
  }, [activities, companies, contacts, deals, projects, tasks, filters]);
  const query = dashboardQuery(filters, "companies");

  return <section className="panel dashboard-account-panel"><SectionTitle eyebrow="Accounts" title="Attention radar" action={{ label: "All accounts", href: `/companies${query ? `?${query}` : ""}` as Route }} />
    <div className="dashboard-account-list">{records.map((record) => <Link href={`/companies/${record.company.id}` as Route} className="dashboard-account-row" key={record.company.id}>
      <div className="dashboard-account-copy"><strong>{record.company.name}</strong><span>{record.company.industry} · {record.company.owner}</span></div>
      <div className="dashboard-account-signals">
        {record.deliveryAttention > 0 && <Badge tone="red">{record.deliveryAttention} delivery</Badge>}
        {record.overdueTasks > 0 && <Badge tone="yellow">{record.overdueTasks} overdue</Badge>}
        {record.openDeals > 0 && <Badge tone="blue">{record.openDeals} deal{record.openDeals > 1 ? "s" : ""}</Badge>}
        {record.score === 0 && <Badge tone="green">Healthy</Badge>}
      </div>
      <small>{record.latestActivity?.time ?? "No recent activity"}</small>
    </Link>)}</div>
    {!records.length && <div className="dashboard-empty-inline">No accounts match the selected scope.</div>}
  </section>;
}
