"use client";

import dynamic from "next/dynamic";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowIcon, PlusIcon, ProjectIcon, SearchIcon } from "@/components/icons";
import { ConfirmDialog, Modal, Toast } from "@/components/overlay";
import { Badge, Progress } from "@/components/ui";
import type { ProjectPayload } from "@/lib/project-api";
import { formatProjectDate, projectHealthLabel, projectHealthTone, projectStatusTone } from "@/lib/project-utils";
import { hydrateMockCompanies } from "@/lib/mock-company-store";
import { hydrateMockDeals } from "@/lib/mock-deal-store";
import { hydrateMockProjects, persistMockProjects } from "@/lib/mock-project-store";
import type { Company, Deal, Project, ProjectHealth, ProjectStatus, WorkspaceUser } from "@/lib/types";

const ProjectForm = dynamic(() => import("./project-form").then((module) => module.ProjectForm), {
  loading: () => <div className="form-loading" aria-hidden="true"><div /><div /><div /><div /></div>,
});

const PAGE_SIZE = 8;
type ProjectView = "ACTIVE" | "ALL" | "COMPLETED" | "ARCHIVED";
type DisplayMode = "PORTFOLIO" | "LIST";

function makeId(title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "project";
  return `${slug}-${Date.now().toString(36)}`;
}

function formatTarget(value: string) {
  return formatProjectDate(value);
}

export function ProjectsWorkspace({
  seedProjects,
  seedCompanies,
  seedDeals,
  owners,
}: {
  seedProjects: Project[];
  seedCompanies: Company[];
  seedDeals: Deal[];
  owners: WorkspaceUser[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState(seedProjects);
  const [companies, setCompanies] = useState(seedCompanies);
  const [deals, setDeals] = useState(seedDeals);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [editor, setEditor] = useState<{ mode: "create" | "edit"; project?: Project; defaultSourceDealId?: string } | null>(null);
  const [confirmingArchive, setConfirmingArchive] = useState<Project | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();

  useEffect(() => {
    setRecords(hydrateMockProjects(seedProjects));
    setCompanies(hydrateMockCompanies(seedCompanies));
    setDeals(hydrateMockDeals(seedDeals));
  }, [seedProjects, seedCompanies, seedDeals]);

  const updateQuery = useCallback((changes: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "" || value === "ACTIVE" || value === "PORTFOLIO" || value === 1) params.delete(key);
      else params.set(key, String(value));
    });
    const query = params.toString();
    startTransition(() => router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false }));
  }, [pathname, router, searchParams]);

  const urlSearch = searchParams.get("search") ?? "";
  useEffect(() => {
    if (search === urlSearch) return;
    const timer = window.setTimeout(() => updateQuery({ search: search.trim(), page: 1 }), 250);
    return () => window.clearTimeout(timer);
  }, [search, updateQuery, urlSearch]);
  useEffect(() => setSearch(urlSearch), [urlSearch]);

  const sourceDealFromUrl = searchParams.get("sourceDealId") ?? "";
  const wantsNew = searchParams.get("new") === "1";
  useEffect(() => {
    if (!wantsNew || editor) return;
    const existing = sourceDealFromUrl ? hydrateMockProjects(seedProjects).find((project) => project.sourceDealId === sourceDealFromUrl && !project.archivedAt) : null;
    if (existing) {
      setToast("A project already exists for that won deal.");
      updateQuery({ new: null, sourceDealId: null });
      router.push(`/projects/${existing.id}` as Route);
      return;
    }
    setEditor({ mode: "create", defaultSourceDealId: sourceDealFromUrl || undefined });
    updateQuery({ new: null });
  }, [wantsNew, sourceDealFromUrl, editor, seedProjects, router, updateQuery]);

  const rawView = searchParams.get("view");
  const view: ProjectView = rawView === "ALL" || rawView === "COMPLETED" || rawView === "ARCHIVED" ? rawView : "ACTIVE";
  const mode: DisplayMode = searchParams.get("mode") === "LIST" ? "LIST" : "PORTFOLIO";
  const companyId = searchParams.get("companyId") ?? "";
  const ownerId = searchParams.get("ownerId") ?? "";
  const health = searchParams.get("health") as ProjectHealth | "";
  const status = searchParams.get("status") as ProjectStatus | "";
  const requestedSort = searchParams.get("sort") ?? "updatedAt-desc";
  const validSorts = ["updatedAt-desc", "updatedAt-asc", "targetDate-asc", "targetDate-desc", "progress-desc", "progress-asc", "title-asc", "title-desc"] as const;
  const sort = validSorts.includes(requestedSort as (typeof validSorts)[number]) ? requestedSort : "updatedAt-desc";
  const [sortBy, sortOrder] = sort.split("-") as ["updatedAt" | "targetDate" | "progress" | "title", "asc" | "desc"];
  const requestedPage = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const companyNameById = useMemo(() => new Map(companies.map((company) => [company.id, company.name])), [companies]);
  const ownerNameById = useMemo(() => new Map(owners.map((owner) => [owner.id, owner.name])), [owners]);

  const counts = useMemo(() => ({
    active: records.filter((project) => !project.archivedAt && project.status !== "COMPLETED").length,
    completed: records.filter((project) => !project.archivedAt && project.status === "COMPLETED").length,
    archived: records.filter((project) => Boolean(project.archivedAt)).length,
    all: records.filter((project) => !project.archivedAt).length,
  }), [records]);

  const metrics = useMemo(() => {
    const active = records.filter((project) => !project.archivedAt && project.status !== "COMPLETED");
    const attention = active.filter((project) => project.health !== "ON_TRACK").length;
    const avgProgress = active.length ? Math.round(active.reduce((sum, project) => sum + project.progress, 0) / active.length) : 0;
    const next30 = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const dueSoon = active.filter((project) => {
      const target = new Date(project.targetDate).getTime();
      return Number.isFinite(target) && target >= Date.now() && target <= next30;
    }).length;
    return { attention, avgProgress, dueSoon };
  }, [records]);

  const filtered = useMemo(() => {
    const needle = urlSearch.trim().toLowerCase();
    const list = records.filter((project) => {
      if (view === "ACTIVE" && (project.archivedAt || project.status === "COMPLETED")) return false;
      if (view === "ALL" && project.archivedAt) return false;
      if (view === "COMPLETED" && (project.archivedAt || project.status !== "COMPLETED")) return false;
      if (view === "ARCHIVED" && !project.archivedAt) return false;
      if (companyId && project.companyId !== companyId) return false;
      if (ownerId && project.ownerId !== ownerId) return false;
      if (health && project.health !== health) return false;
      if (status && project.status !== status) return false;
      if (!needle) return true;
      return [project.title, companyNameById.get(project.companyId) ?? project.company, ownerNameById.get(project.ownerId) ?? project.owner, project.description ?? ""]
        .some((value) => value.toLowerCase().includes(needle));
    });
    return [...list].sort((a, b) => {
      let result = 0;
      if (sortBy === "updatedAt") result = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === "targetDate") result = new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
      if (sortBy === "progress") result = a.progress - b.progress;
      if (sortBy === "title") result = a.title.localeCompare(b.title);
      return sortOrder === "asc" ? result : -result;
    });
  }, [records, view, companyId, ownerId, health, status, urlSearch, sortBy, sortOrder, companyNameById, ownerNameById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { if (requestedPage > totalPages) updateQuery({ page: totalPages }); }, [requestedPage, totalPages, updateQuery]);

  const linkedSourceDealIds = useMemo(() => new Set(records.filter((project) => !project.archivedAt && project.sourceDealId).map((project) => project.sourceDealId)), [records]);
  const wonDeals = useMemo(() => deals.filter((deal) => deal.stage === "WON" && (!linkedSourceDealIds.has(deal.id) || editor?.project?.sourceDealId === deal.id)), [deals, linkedSourceDealIds, editor]);

  function commit(next: Project[], message: string) {
    setRecords(next);
    persistMockProjects(next);
    setToast(message);
  }

  function saveProject(values: ProjectPayload) {
    const company = companies.find((item) => item.id === values.companyId);
    const owner = owners.find((item) => item.id === values.ownerId);
    if (!company || !owner) return;
    const now = new Date().toISOString();
    const target = formatTarget(values.targetDate);
    if (editor?.mode === "edit" && editor.project) {
      const next = records.map((item) => item.id === editor.project?.id ? {
        ...item,
        ...values,
        company: company.name,
        owner: owner.name,
        team: values.memberIds.length,
        target,
        updatedAt: now,
      } : item);
      commit(next, `${values.title} updated.`);
    } else {
      const project: Project = {
        id: makeId(values.title),
        ...values,
        company: company.name,
        owner: owner.name,
        team: values.memberIds.length,
        target,
        milestones: [],
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      commit([project, ...records], `${values.title} created.`);
      setSearch("");
      updateQuery({ view: "ACTIVE", search: null, page: 1, sort: "updatedAt-desc", sourceDealId: null });
      router.push(`/projects/${project.id}` as Route);
    }
    setEditor(null);
  }

  function archive(project: Project) {
    const now = new Date().toISOString();
    commit(records.map((item) => item.id === project.id ? { ...item, archivedAt: now, updatedAt: now } : item), `${project.title} archived.`);
    setConfirmingArchive(null);
  }

  function reactivate(project: Project) {
    const now = new Date().toISOString();
    commit(records.map((item) => item.id === project.id ? { ...item, archivedAt: null, updatedAt: now } : item), `${project.title} reactivated.`);
  }

  return (
    <>
      <div className="page-header project-page-header">
        <div><div className="eyebrow">DELIVERY / 01 ──</div><h1>Projects</h1><p>Delivery context for won work — progress, ownership, milestones and customer linkage without recreating Jira.</p></div>
        <button className="primary-button" type="button" onClick={() => setEditor({ mode: "create" })}><PlusIcon />New project</button>
      </div>

      <div className="project-metrics-strip">
        <div><span>ACTIVE PROJECTS</span><strong>{counts.active}</strong><small>{counts.completed} completed</small></div>
        <div><span>NEEDS ATTENTION</span><strong>{metrics.attention}</strong><small>At risk or blocked</small></div>
        <div><span>AVG. PROGRESS</span><strong>{metrics.avgProgress}%</strong><small>Across active delivery</small></div>
        <div><span>DUE ≤ 30 DAYS</span><strong>{metrics.dueSoon}</strong><small>Target dates approaching</small></div>
      </div>

      <div className={`workspace-toolbar projects-toolbar ${isNavigating ? "is-navigating" : ""}`}>
        <div className="filter-tabs">
          {(["ACTIVE", "ALL", "COMPLETED", "ARCHIVED"] as ProjectView[]).map((item) => <button key={item} className={view === item ? "active" : ""} type="button" onClick={() => updateQuery({ view: item, page: 1 })}>{item}<span>{item === "ACTIVE" ? counts.active : item === "ALL" ? counts.all : item === "COMPLETED" ? counts.completed : counts.archived}</span></button>)}
        </div>
        <div className="toolbar-tools project-toolbar-tools">
          <label className="inline-search project-search"><SearchIcon /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects..." /></label>
          <label className="sort-control project-select-control"><span>ACCOUNT</span><select value={companyId} onChange={(event) => updateQuery({ companyId: event.target.value, page: 1 })}><option value="">All companies</option>{companies.filter((company) => !company.archivedAt).map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select></label>
          <label className="sort-control project-select-control"><span>HEALTH</span><select value={health} onChange={(event) => updateQuery({ health: event.target.value, page: 1 })}><option value="">Any health</option><option value="ON_TRACK">On track</option><option value="AT_RISK">At risk</option><option value="BLOCKED">Blocked</option></select></label>
          <label className="sort-control project-select-control"><span>STATUS</span><select value={status} onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}><option value="">Any status</option><option value="PLANNED">Planned</option><option value="IN_PROGRESS">In progress</option><option value="ON_HOLD">On hold</option><option value="COMPLETED">Completed</option></select></label>
          <label className="sort-control project-select-control"><span>OWNER</span><select value={ownerId} onChange={(event) => updateQuery({ ownerId: event.target.value, page: 1 })}><option value="">Any owner</option>{owners.map((owner) => <option value={owner.id} key={owner.id}>{owner.name}</option>)}</select></label>
          <label className="sort-control project-select-control compact-control"><span>SORT</span><select value={sort} onChange={(event) => updateQuery({ sort: event.target.value, page: 1 })}><option value="updatedAt-desc">Recently updated</option><option value="targetDate-asc">Target soonest</option><option value="progress-desc">Progress high → low</option><option value="progress-asc">Progress low → high</option><option value="title-asc">Title A → Z</option></select></label>
          <div className="view-toggle project-view-toggle"><button type="button" className={mode === "PORTFOLIO" ? "active" : ""} onClick={() => updateQuery({ mode: "PORTFOLIO", page: 1 })}>Portfolio</button><button type="button" className={mode === "LIST" ? "active" : ""} onClick={() => updateQuery({ mode: "LIST", page: 1 })}>List</button></div>
        </div>
      </div>

      {pageRecords.length === 0 ? (
        <div className="data-empty project-empty"><div className="empty-code">PROJECTS / NO MATCH</div><strong>No projects in this view.</strong><p>Adjust filters or create a delivery project from a won deal.</p><button className="secondary-button" type="button" onClick={() => { setSearch(""); updateQuery({ view: "ACTIVE", companyId: null, ownerId: null, health: null, status: null, search: null, page: 1 }); }}>Reset filters</button></div>
      ) : mode === "PORTFOLIO" ? (
        <div className="project-portfolio-grid">
          {pageRecords.map((project) => (
            <article className={`project-portfolio-card health-${project.health.toLowerCase().replace("_", "-")}`} key={project.id}>
              <div className="project-card-head"><span className="record-id">PROJECT / {project.id.toUpperCase()}</span><div className="project-card-badges"><Badge tone={projectHealthTone(project.health)}>{projectHealthLabel(project.health)}</Badge><Badge tone={projectStatusTone(project.status)}>{project.status.replaceAll("_", " ")}</Badge></div></div>
              <Link href={`/projects/${project.id}` as Route} className="project-card-title"><h2>{project.title}</h2></Link>
              <Link href={`/companies/${project.companyId}` as Route} className="project-account-link">{companyNameById.get(project.companyId) ?? project.company} <ArrowIcon /></Link>
              <p>{project.description ?? "No delivery context added yet."}</p>
              <div className="project-progress-line"><span>{project.progress}% complete</span><span>Target {formatTarget(project.targetDate)}</span></div>
              <Progress value={project.progress} />
              <div className="project-card-facts"><div><span>OWNER</span><strong>{ownerNameById.get(project.ownerId) ?? project.owner}</strong></div><div><span>TEAM</span><strong>{project.team}</strong></div><div><span>MILESTONES</span><strong>{project.milestones.length}</strong></div></div>
              <div className="project-card-actions"><Link href={`/projects/${project.id}` as Route}>Open <ArrowIcon /></Link><button type="button" onClick={() => setEditor({ mode: "edit", project })}>Edit</button>{project.archivedAt ? <button type="button" onClick={() => reactivate(project)}>Reactivate</button> : <button type="button" onClick={() => setConfirmingArchive(project)}>Archive</button>}</div>
            </article>
          ))}
        </div>
      ) : (
        <div className="table-panel projects-table-panel"><table className="data-table projects-table"><thead><tr><th>Project</th><th>Status</th><th>Health</th><th>Owner</th><th>Progress</th><th>Team</th><th>Target</th><th>Source</th><th /></tr></thead><tbody>{pageRecords.map((project) => <tr key={project.id}><td><Link className="entity-link" href={`/projects/${project.id}` as Route}><span className="mini-avatar square"><ProjectIcon /></span><span><strong>{project.title}</strong><small>{companyNameById.get(project.companyId) ?? project.company}</small></span></Link></td><td><Badge tone={projectStatusTone(project.status)}>{project.status.replaceAll("_", " ")}</Badge></td><td><Badge tone={projectHealthTone(project.health)}>{projectHealthLabel(project.health)}</Badge></td><td>{ownerNameById.get(project.ownerId) ?? project.owner}</td><td><div className="table-progress"><span>{project.progress}%</span><Progress value={project.progress} /></div></td><td>{project.team}</td><td>{formatTarget(project.targetDate)}</td><td>{project.sourceDealId ? "WON DEAL" : "MANUAL"}</td><td><Link className="table-edit-button" href={`/projects/${project.id}` as Route}>Open</Link></td></tr>)}</tbody></table></div>
      )}

      <div className="pagination-bar"><span>Showing {(page - 1) * PAGE_SIZE + (filtered.length ? 1 : 0)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span><div className="pagination-controls"><button type="button" disabled={page <= 1} onClick={() => updateQuery({ page: page - 1 })}>← Previous</button><span>{page} / {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => updateQuery({ page: page + 1 })}>Next →</button></div></div>

      <Modal open={Boolean(editor)} onClose={() => setEditor(null)} eyebrow="DELIVERY / Project" title={editor?.mode === "edit" ? `Edit ${editor.project?.title}` : "Create project"} size="lg" footer={<><button className="secondary-button" type="button" onClick={() => setEditor(null)}>Cancel</button><button className="primary-button" type="submit" form="project-form">{editor?.mode === "edit" ? "Save changes" : "Create project"}</button></>}>
        {editor && <ProjectForm key={`${editor.mode}-${editor.project?.updatedAt ?? editor.defaultSourceDealId ?? "new"}`} project={editor.project} companies={companies} wonDeals={wonDeals} owners={owners} defaultSourceDealId={editor.defaultSourceDealId} onSubmit={saveProject} />}
      </Modal>

      <ConfirmDialog open={Boolean(confirmingArchive)} onClose={() => setConfirmingArchive(null)} onConfirm={() => confirmingArchive && archive(confirmingArchive)} title="Archive project?" description={`${confirmingArchive?.title ?? "This project"} will leave active delivery views, while source-deal, tasks, activity and milestone history remain available.`} confirmLabel="Archive project" danger />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
