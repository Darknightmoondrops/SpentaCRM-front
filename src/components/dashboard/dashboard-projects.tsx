"use client";

import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProjectIcon } from "@/components/icons";
import { Badge, Progress, SectionTitle } from "@/components/ui";
import { hydrateMockProjects } from "@/lib/mock-project-store";
import { dashboardFiltersFromSearchParams, dashboardQuery, filterDashboardProjects } from "@/lib/dashboard-utils";
import { projectHealthTone, projectStatusTone } from "@/lib/project-utils";
import type { Project } from "@/lib/types";

const healthRank = { BLOCKED: 0, AT_RISK: 1, ON_TRACK: 2 } as const;

export function DashboardProjects({ seedProjects }: { seedProjects: Project[] }) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => dashboardFiltersFromSearchParams(searchParams), [searchParams]);
  const [projects, setProjects] = useState(seedProjects);
  useEffect(() => setProjects(hydrateMockProjects(seedProjects)), [seedProjects]);
  const active = useMemo(() => filterDashboardProjects(projects, filters).filter((project) => project.status !== "COMPLETED").sort((a, b) => healthRank[a.health] - healthRank[b.health] || new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()), [projects, filters]);
  const attention = active.filter((project) => project.health !== "ON_TRACK").length;
  const averageProgress = active.length ? Math.round(active.reduce((sum, project) => sum + project.progress, 0) / active.length) : 0;
  const query = dashboardQuery(filters, "projects", { view: "ACTIVE" });

  return <section className="panel section-space dashboard-stream-section dashboard-delivery-section">
    <SectionTitle eyebrow="Delivery" title="Project health" action={{ label: "Project portfolio", href: `/projects${query ? `?${query}` : ""}` as Route }} />
    <div className="dashboard-section-summary"><div><strong>{active.length}</strong><span>Active projects</span></div><div><strong>{attention}</strong><span>Need attention</span></div><div><strong>{averageProgress}%</strong><span>Average progress</span></div></div>
    <div className="project-strip dashboard-project-strip">{active.slice(0, 4).map((project) => <Link href={`/projects/${project.id}` as Route} className="project-card" key={project.id}><div className="project-card-top"><ProjectIcon /><span className="dashboard-project-badges"><Badge tone={projectHealthTone(project.health)}>{project.health.replaceAll("_", " ")}</Badge><Badge tone={projectStatusTone(project.status)}>{project.status.replaceAll("_", " ")}</Badge></span></div><h3>{project.title}</h3><p>{project.company}</p><div className="project-metrics"><span>{project.progress}% complete</span><span>{project.target}</span></div><Progress value={project.progress} /></Link>)}</div>
    {!active.length && <div className="dashboard-empty-inline">No active delivery projects match the selected scope.</div>}
  </section>;
}
