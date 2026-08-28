"use client";

import dynamic from "next/dynamic";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ActivityIcon, ArrowIcon, CheckIcon, CompanyIcon, DealIcon, ProjectIcon, TaskIcon } from "@/components/icons";
import { ConfirmDialog, Modal, Toast } from "@/components/overlay";
import { EntityExtensionPoints } from "@/components/extensions/entity-extension-points";
import { Badge, Progress, SectionTitle } from "@/components/ui";
import { hydrateMockCompanies } from "@/lib/mock-company-store";
import { hydrateMockDeals } from "@/lib/mock-deal-store";
import { findPersistedMockProject, hydrateMockProjects, persistMockProjects } from "@/lib/mock-project-store";
import { hydrateMockTasks } from "@/lib/mock-task-store";
import { hydrateMockActivities } from "@/lib/mock-activity-store";
import type { MilestonePayload, ProjectPayload } from "@/lib/project-api";
import { formatProjectDate, PROJECT_STATUSES, projectHealthLabel, projectHealthTone, projectStatusTone } from "@/lib/project-utils";
import type { Activity, Company, Deal, MilestoneStatus, Project, ProjectMilestone, ProjectStatus, Task, WorkspaceUser } from "@/lib/types";

const ProjectForm = dynamic(() => import("./project-form").then((module) => module.ProjectForm), {
  loading: () => <div className="form-loading" aria-hidden="true"><div /><div /><div /><div /></div>,
});

const TABS = ["overview", "milestones", "tasks", "activity", "team", "files"] as const;
type Tab = (typeof TABS)[number];

function taskTone(priority: Task["priority"]) {
  if (priority === "CRITICAL" || priority === "HIGH") return "red" as const;
  if (priority === "MEDIUM") return "yellow" as const;
  return "neutral" as const;
}

function makeMilestoneId() {
  return `milestone-${Date.now().toString(36)}`;
}

export function ProjectDetailView({
  projectId,
  seedProject,
  seedProjects,
  seedCompanies,
  seedDeals,
  owners,
  company,
  sourceDeal,
  tasks,
  activities,
  members,
}: {
  projectId: string;
  seedProject: Project | null;
  seedProjects: Project[];
  seedCompanies: Company[];
  seedDeals: Deal[];
  owners: WorkspaceUser[];
  company: Company | null;
  sourceDeal: Deal | null;
  tasks: Task[];
  activities: Activity[];
  members: WorkspaceUser[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(seedProject);
  const [companies, setCompanies] = useState(seedCompanies);
  const [deals, setDeals] = useState(seedDeals);
  const [editing, setEditing] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [milestoneEditor, setMilestoneEditor] = useState<ProjectMilestone | "new" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [progressDraft, setProgressDraft] = useState(seedProject?.progress ?? 0);
  const [hydrated, setHydrated] = useState(Boolean(seedProject));
  const [liveTasks, setLiveTasks] = useState(tasks);
  const [liveActivities, setLiveActivities] = useState(activities);

  useEffect(() => {
    const hydratedProject = findPersistedMockProject(projectId, seedProject);
    setProject(hydratedProject);
    setProgressDraft(hydratedProject?.progress ?? 0);
    setCompanies(hydrateMockCompanies(seedCompanies));
    setDeals(hydrateMockDeals(seedDeals));
    setLiveTasks(hydrateMockTasks(tasks).filter((item) => item.relationType === "PROJECT" && item.relationId === projectId && !item.archivedAt));
    setLiveActivities(hydrateMockActivities(activities).filter((item) => item.relationType === "PROJECT" && item.relationId === projectId));
    setHydrated(true);
  }, [projectId, seedProject, seedCompanies, seedDeals, tasks, activities]);

  const tabParam = searchParams.get("tab");
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "overview";
  const setTab = useCallback((next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") params.delete("tab"); else params.set("tab", next);
    const query = params.toString();
    router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
  }, [pathname, router, searchParams]);

  const account = useMemo(() => companies.find((item) => item.id === project?.companyId) ?? company, [companies, company, project]);
  const linkedDeal = useMemo(() => project?.sourceDealId ? deals.find((item) => item.id === project.sourceDealId) ?? sourceDeal : null, [project, deals, sourceDeal]);
  const teamMembers = useMemo(() => project ? owners.filter((owner) => project.memberIds.includes(owner.id)) : members, [project, owners, members]);
  const wonDeals = useMemo(() => deals.filter((deal) => deal.stage === "WON" && (!hydrateMockProjects(seedProjects).some((item) => item.sourceDealId === deal.id && item.id !== projectId && !item.archivedAt) || deal.id === project?.sourceDealId)), [deals, seedProjects, projectId, project?.sourceDealId]);
  const openTasks = liveTasks.filter((task) => task.status !== "DONE");
  const doneMilestones = project?.milestones.filter((milestone) => milestone.status === "DONE").length ?? 0;

  function persistProject(nextProject: Project, message: string) {
    const all = hydrateMockProjects(seedProjects);
    const found = all.some((item) => item.id === nextProject.id);
    const nextAll = found ? all.map((item) => item.id === nextProject.id ? nextProject : item) : [nextProject, ...all];
    persistMockProjects(nextAll);
    setProject(nextProject);
    setProgressDraft(nextProject.progress);
    setToast(message);
  }

  function save(values: ProjectPayload) {
    if (!project) return;
    const owner = owners.find((item) => item.id === values.ownerId);
    const accountRecord = companies.find((item) => item.id === values.companyId);
    if (!owner || !accountRecord) return;
    const next = {
      ...project,
      ...values,
      owner: owner.name,
      company: accountRecord.name,
      team: values.memberIds.length,
      target: formatProjectDate(values.targetDate),
      updatedAt: new Date().toISOString(),
    };
    persistProject(next, `${next.title} updated.`);
    setEditing(false);
  }

  function setStatus(status: ProjectStatus) {
    if (!project || project.status === status) return;
    persistProject({ ...project, status, progress: status === "COMPLETED" ? 100 : project.progress, updatedAt: new Date().toISOString() }, `${project.title} moved to ${status.replaceAll("_", " ")}.`);
  }

  function setProgress(progress: number) {
    if (!project) return;
    const safe = Math.max(0, Math.min(100, progress));
    persistProject({ ...project, progress: safe, status: safe === 100 ? "COMPLETED" : project.status === "COMPLETED" ? "IN_PROGRESS" : project.status, updatedAt: new Date().toISOString() }, `${project.title} progress updated.`);
  }

  function saveMilestone(values: MilestonePayload) {
    if (!project) return;
    const now = new Date().toISOString();
    let milestones: ProjectMilestone[];
    if (milestoneEditor === "new") milestones = [...project.milestones, { id: makeMilestoneId(), ...values }];
    else if (milestoneEditor) milestones = project.milestones.map((item) => item.id === milestoneEditor.id ? { ...item, ...values } : item);
    else return;
    persistProject({ ...project, milestones, updatedAt: now }, milestoneEditor === "new" ? "Milestone added." : "Milestone updated.");
    setMilestoneEditor(null);
  }

  function archive() {
    if (!project) return;
    persistProject({ ...project, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, `${project.title} archived.`);
    setConfirmingArchive(false);
  }

  function reactivate() {
    if (!project) return;
    persistProject({ ...project, archivedAt: null, updatedAt: new Date().toISOString() }, `${project.title} reactivated.`);
  }

  if (!hydrated) return <div className="project-detail-loading"><div /><div /><div /></div>;
  if (!project) return <div className="record-not-found"><div className="eyebrow">DELIVERY / PROJECT / 404 ──</div><h1>Project not found</h1><p>The requested delivery project does not exist in the current frontend dataset.</p><Link className="primary-button" href="/projects">Back to projects</Link></div>;

  return (
    <>
      <div className="detail-crumb"><Link href="/projects">← PROJECTS</Link><span>/</span><span>{project.title.toUpperCase()}</span></div>

      {project.archivedAt && <div className="archive-banner"><div><span className="status-dot" /><strong>Archived project</strong><span>Delivery history is retained but hidden from active portfolio views.</span></div><button className="secondary-button" type="button" onClick={reactivate}>Reactivate</button></div>}

      <div className="project-detail-hero">
        <div className="project-detail-symbol"><ProjectIcon /></div>
        <div className="project-detail-title"><div className="eyebrow">PROJECT / {project.id.toUpperCase()}</div><div className="project-title-line"><h1>{project.title}</h1><Badge tone={projectHealthTone(project.health)}>{projectHealthLabel(project.health)}</Badge></div><p>{account?.name ?? project.company} · owned by {project.owner}</p><div className="project-hero-meta"><span>{project.status.replaceAll("_", " ")}</span><span>{project.team} TEAM MEMBERS</span><span>TARGET {formatProjectDate(project.targetDate).toUpperCase()}</span>{linkedDeal && <span>SOURCE DEAL / {linkedDeal.id.toUpperCase()}</span>}</div></div>
        <div className="project-detail-actions"><select aria-label="Project status" value={project.status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>{PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select><button className="secondary-button" type="button" onClick={() => project.archivedAt ? reactivate() : setConfirmingArchive(true)}>{project.archivedAt ? "Reactivate" : "Archive"}</button><button className="primary-button" type="button" onClick={() => setEditing(true)}>Edit project</button></div>
      </div>

      <div className="project-detail-metrics">
        <div><span>PROGRESS</span><strong>{project.progress}%</strong><Progress value={project.progress} /></div>
        <div><span>OPEN TASKS</span><strong>{openTasks.length}</strong><small>{liveTasks.length} linked tasks</small></div>
        <div><span>MILESTONES</span><strong>{doneMilestones}/{project.milestones.length}</strong><small>Completed</small></div>
        <div><span>TARGET</span><strong className="project-target-strong">{formatProjectDate(project.targetDate)}</strong><small>Started {formatProjectDate(project.startDate)}</small></div>
      </div>

      <div className="project-progress-editor"><span>QUICK PROGRESS</span><input aria-label="Project progress" type="range" min={0} max={100} step={5} value={progressDraft} onChange={(event) => setProgressDraft(Number(event.target.value))} onPointerUp={() => progressDraft !== project.progress && setProgress(progressDraft)} onKeyUp={() => progressDraft !== project.progress && setProgress(progressDraft)} /><strong>{progressDraft}%</strong></div>

      <nav className="record-tabs project-tabs" aria-label="Project sections">{TABS.map((item) => <button type="button" key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}<span>{item === "milestones" ? project.milestones.length : item === "tasks" ? liveTasks.length : item === "activity" ? liveActivities.length : item === "team" ? teamMembers.length : ""}</span></button>)}</nav>

      {tab === "overview" && <>
        <div className="detail-grid project-overview-grid">
          <section className="panel"><SectionTitle eyebrow="Delivery context" title="Project brief" /><div className="context-block"><p>{project.description ?? "No delivery context has been added yet."}</p><div className="context-lines"><div className="context-line"><span>Health</span><Badge tone={projectHealthTone(project.health)}>{projectHealthLabel(project.health)}</Badge></div><div className="context-line"><span>Start</span><strong>{formatProjectDate(project.startDate)}</strong></div><div className="context-line"><span>Target</span><strong>{formatProjectDate(project.targetDate)}</strong></div><div className="context-line"><span>Owner</span><strong>{project.owner}</strong></div></div></div></section>
          <section className="panel"><SectionTitle eyebrow="Commercial provenance" title="Linked records" /><div className="deal-linked-records">{account && <Link href={`/companies/${account.id}` as Route} className="deal-linked-record"><span className="deal-linked-icon"><CompanyIcon /></span><span><strong>{account.name}</strong><small>Customer account · {account.industry}</small></span><ArrowIcon /></Link>}{linkedDeal ? <Link href={`/deals/${linkedDeal.id}` as Route} className="deal-linked-record"><span className="deal-linked-icon"><DealIcon /></span><span><strong>{linkedDeal.title}</strong><small>Won deal · source of delivery</small></span><ArrowIcon /></Link> : <div className="deal-linked-record muted"><span className="deal-linked-icon"><DealIcon /></span><span><strong>Manual project</strong><small>No source deal attached.</small></span></div>}</div></section>
        </div>
        <section className="panel section-space"><SectionTitle eyebrow="Execution" title="Milestone pulse" action={{ label: "All milestones", href: `${pathname}?tab=milestones` as Route }} />{project.milestones.length ? <div className="project-milestone-strip">{project.milestones.slice(0, 4).map((milestone) => <button type="button" className="project-milestone-card" key={milestone.id} onClick={() => setMilestoneEditor(milestone)}><span>{milestone.status === "DONE" ? <CheckIcon /> : <ProjectIcon />}</span><strong>{milestone.title}</strong><small>{formatProjectDate(milestone.dueDate)}</small><Badge tone={milestone.status === "DONE" ? "green" : milestone.status === "IN_PROGRESS" ? "yellow" : "neutral"}>{milestone.status.replaceAll("_", " ")}</Badge></button>)}</div> : <div className="data-empty small"><strong>No milestones yet.</strong><p>Add the major delivery checkpoints, not sprint-level tasks.</p></div>}</section>
      </>}

      {tab === "milestones" && <section className="panel tab-panel"><div className="section-heading"><div><div className="eyebrow">DELIVERY CHECKPOINTS ──</div><h2>Milestones</h2></div><button className="secondary-button" type="button" onClick={() => setMilestoneEditor("new")}>+ Add milestone</button></div>{project.milestones.length ? <div className="milestone-list">{project.milestones.map((milestone, index) => <button type="button" className="milestone-row" key={milestone.id} onClick={() => setMilestoneEditor(milestone)}><span className="milestone-index">{String(index + 1).padStart(2, "0")}</span><span><strong>{milestone.title}</strong><small>Due {formatProjectDate(milestone.dueDate)}</small></span><Badge tone={milestone.status === "DONE" ? "green" : milestone.status === "IN_PROGRESS" ? "yellow" : "neutral"}>{milestone.status.replaceAll("_", " ")}</Badge><ArrowIcon /></button>)}</div> : <div className="data-empty"><strong>No project milestones.</strong><p>Add major contractual or delivery checkpoints here.</p></div>}</section>}

      {tab === "tasks" && <section className="panel tab-panel"><SectionTitle eyebrow="Work queue" title="Project tasks" action={{ label: "New task", href: `/tasks?new=1&relationType=PROJECT&relationId=${project.id}` as Route }} />{liveTasks.length ? <div className="task-list">{liveTasks.map((task) => <div className="task-row" key={task.id}><div className="task-check">{task.status === "DONE" ? <CheckIcon /> : <TaskIcon />}</div><div><strong>{task.title}</strong><span>{task.assignee} · due {task.due}</span></div><Badge tone={taskTone(task.priority)}>{task.priority}</Badge><Badge>{task.status.replaceAll("_", " ")}</Badge></div>)}</div> : <div className="data-empty"><strong>No tasks linked.</strong><p>Project work items linked to this delivery context will appear here.</p></div>}</section>}

      {tab === "activity" && <section className="panel tab-panel"><SectionTitle eyebrow="Delivery history" title="Activity" action={{ label: "Log activity", href: `/activities?new=1&relationType=PROJECT&relationId=${project.id}` as Route }} />{liveActivities.length ? <div className="account-activity-list">{liveActivities.map((activity) => <div className="account-activity" key={activity.id}><div className="activity-icon"><ActivityIcon /></div><div><strong>{activity.title}</strong><p>{activity.detail}</p><span>{activity.actor} · {activity.time}</span></div><Badge>{activity.type}</Badge></div>)}</div> : <div className="data-empty"><strong>No project activity yet.</strong><p>Delivery notes and changes will appear here without duplicating engineering ticket history.</p></div>}</section>}

      {tab === "team" && <section className="panel tab-panel"><SectionTitle eyebrow="Delivery team" title="People" />{teamMembers.length ? <div className="project-team-list">{teamMembers.map((member) => <div className="project-team-row" key={member.id}><span className="mini-avatar">{member.initials}</span><span><strong>{member.name}</strong><small>{member.id === project.ownerId ? "Project owner" : "Delivery member"}</small></span>{member.id === project.ownerId && <Badge tone="green">OWNER</Badge>}</div>)}</div> : <div className="data-empty"><strong>No team members.</strong><p>Edit the project to assign a delivery team.</p></div>}</section>}

      {tab === "files" && <section className="panel tab-panel"><SectionTitle eyebrow="Delivery documents" title="Files" /><div className="files-placeholder"><div className="files-code">PROJECT ATTACHMENTS / RESERVED</div><h3>Project documents are ready for the attachment API.</h3><p>Requirements, architecture decisions, hand-off material and customer-provided files can later attach to this project while binary storage remains outside PostgreSQL.</p><button className="secondary-button" type="button" disabled>Upload file · Phase 06</button></div></section>}

      <EntityExtensionPoints entityType="project" entityId={project.id} />

      <Modal open={editing} onClose={() => setEditing(false)} eyebrow="DELIVERY / Project" title={`Edit ${project.title}`} size="lg" footer={<><button className="secondary-button" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button" type="submit" form="project-form">Save changes</button></>}>
        <ProjectForm key={project.updatedAt} project={project} companies={companies} wonDeals={wonDeals} owners={owners} onSubmit={save} />
      </Modal>

      <MilestoneModal open={Boolean(milestoneEditor)} milestone={milestoneEditor === "new" ? undefined : milestoneEditor ?? undefined} onClose={() => setMilestoneEditor(null)} onSubmit={saveMilestone} />
      <ConfirmDialog open={confirmingArchive} onClose={() => setConfirmingArchive(false)} onConfirm={archive} title="Archive project?" description={`${project.title} will leave active delivery views while tasks, milestones, activity and source-deal history remain retained.`} confirmLabel="Archive project" danger />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

function MilestoneModal({ open, milestone, onClose, onSubmit }: { open: boolean; milestone?: ProjectMilestone; onClose: () => void; onSubmit: (values: MilestonePayload) => void }) {
  const [title, setTitle] = useState(milestone?.title ?? "");
  const [dueDate, setDueDate] = useState(milestone?.dueDate ?? "");
  const [status, setStatus] = useState<MilestoneStatus>(milestone?.status ?? "PLANNED");
  const [error, setError] = useState("");

  useEffect(() => { if (open) { setTitle(milestone?.title ?? ""); setDueDate(milestone?.dueDate ?? ""); setStatus(milestone?.status ?? "PLANNED"); setError(""); } }, [open, milestone]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !dueDate) { setError("Title and due date are required."); return; }
    onSubmit({ title: title.trim(), dueDate, status });
  }

  return <Modal open={open} onClose={onClose} eyebrow="DELIVERY / Milestone" title={milestone ? "Edit milestone" : "Add milestone"} size="sm" footer={<><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit" form="milestone-form">{milestone ? "Save milestone" : "Add milestone"}</button></>}><form id="milestone-form" className="record-form" onSubmit={submit}><label className="field"><span>Milestone title *</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="field"><span>Due date *</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><label className="field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as MilestoneStatus)}><option value="PLANNED">PLANNED</option><option value="IN_PROGRESS">IN PROGRESS</option><option value="DONE">DONE</option></select></label>{error && <small className="field-error">{error}</small>}</form></Modal>;
}
