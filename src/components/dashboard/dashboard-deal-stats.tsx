"use client";

import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Stat } from "@/components/ui";
import { currency } from "@/lib/format";
import { hydrateMockCompanies } from "@/lib/mock-company-store";
import { hydrateMockContacts } from "@/lib/mock-contact-store";
import { hydrateMockDeals } from "@/lib/mock-deal-store";
import { hydrateMockProjects } from "@/lib/mock-project-store";
import { hydrateMockTasks } from "@/lib/mock-task-store";
import {
  dashboardFiltersFromSearchParams,
  dashboardMetrics,
  dashboardQuery,
  filterDashboardCompanies,
  filterDashboardDeals,
  filterDashboardProjects,
  filterDashboardTasks,
} from "@/lib/dashboard-utils";
import type { Company, Contact, Deal, Project, Task } from "@/lib/types";

export function DashboardDealStats({ seedCompanies, seedContacts, seedDeals, seedProjects, seedTasks }: { seedCompanies: Company[]; seedContacts: Contact[]; seedDeals: Deal[]; seedProjects: Project[]; seedTasks: Task[] }) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => dashboardFiltersFromSearchParams(searchParams), [searchParams]);
  const [companies, setCompanies] = useState(seedCompanies);
  const [contacts, setContacts] = useState(seedContacts);
  const [deals, setDeals] = useState(seedDeals);
  const [projects, setProjects] = useState(seedProjects);
  const [tasks, setTasks] = useState(seedTasks);

  useEffect(() => setCompanies(hydrateMockCompanies(seedCompanies)), [seedCompanies]);
  useEffect(() => setContacts(hydrateMockContacts(seedContacts)), [seedContacts]);
  useEffect(() => setDeals(hydrateMockDeals(seedDeals)), [seedDeals]);
  useEffect(() => setProjects(hydrateMockProjects(seedProjects)), [seedProjects]);
  useEffect(() => setTasks(hydrateMockTasks(seedTasks)), [seedTasks]);

  const metrics = useMemo(() => {
    const filteredDeals = filterDashboardDeals(deals, filters);
    const filteredProjects = filterDashboardProjects(projects, filters);
    const refs = { contacts, deals, projects };
    const filteredTasks = filterDashboardTasks(tasks, filters, refs);
    const filteredCompanies = filterDashboardCompanies(companies, filters);
    return dashboardMetrics({ companies: filteredCompanies, deals: filteredDeals, projects: filteredProjects, tasks: filteredTasks });
  }, [companies, contacts, deals, projects, tasks, filters]);

  const companyQuery = dashboardQuery(filters, "companies", { status: "CUSTOMER" });
  const dealQuery = dashboardQuery(filters, "deals", { view: "OPEN" });
  const projectQuery = dashboardQuery(filters, "projects", { view: "ACTIVE" });
  const taskQuery = dashboardQuery(filters, "tasks", { view: "OPEN" });

  return (
    <div className="stats-grid dashboard-kpi-grid">
      <Stat index="01" label="Active customers" value={String(metrics.customers.length)} sub="Customer accounts in the selected scope" href={(filters.companyId ? `/companies/${filters.companyId}` : `/companies${companyQuery ? `?${companyQuery}` : ""}`) as Route} />
      <Stat index="02" label="Open pipeline" value={currency(metrics.pipelineValue)} sub={`${metrics.openDeals.length} active opportunities`} accent href={`/deals${dealQuery ? `?${dealQuery}` : ""}` as Route} />
      <Stat index="03" label="Weighted forecast" value={currency(metrics.weightedForecast)} sub="Opportunity value × probability" href={`/deals${dealQuery ? `?${dealQuery}&sort=probability-desc` : "?sort=probability-desc"}` as Route} />
      <Stat index="04" label="Delivery health" value={`${metrics.deliveryRate}%`} sub={`${metrics.deliveryAttention.length} of ${metrics.activeProjects.length} active projects need attention`} href={`/projects${projectQuery ? `?${projectQuery}` : ""}` as Route} />
      <Stat index="05" label="Work due" value={String(metrics.overdueTasks.length + metrics.dueToday.length)} sub={`${metrics.overdueTasks.length} overdue · ${metrics.dueToday.length} due today`} href={`/tasks${taskQuery ? `?${taskQuery}` : ""}` as Route} />
    </div>
  );
}
