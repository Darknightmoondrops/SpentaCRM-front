"use client";

import dynamic from "next/dynamic";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowIcon, PlusIcon, SearchIcon, TaskIcon } from "@/components/icons";
import { ConfirmDialog, Modal, Toast } from "@/components/overlay";
import { Badge } from "@/components/ui";
import { buildRelationOptions } from "@/lib/relation-options";
import { hydrateMockCompanies } from "@/lib/mock-company-store";
import { hydrateMockContacts } from "@/lib/mock-contact-store";
import { hydrateMockDeals } from "@/lib/mock-deal-store";
import { hydrateMockProjects } from "@/lib/mock-project-store";
import { hydrateMockTasks, persistMockTasks } from "@/lib/mock-task-store";
import { formatTaskDue, taskDueBucket, taskPriorityTone, taskStatusTone } from "@/lib/task-utils";
import type { TaskPayload } from "@/lib/task-api";
import type { Company, Contact, Deal, Priority, Project, RelationType, Task, TaskStatus, WorkspaceUser } from "@/lib/types";

const TaskForm = dynamic(() => import("./task-form").then((module) => module.TaskForm), { loading: () => <div className="form-loading" aria-hidden="true"><div /><div /><div /><div /></div> });
const PAGE_SIZE = 10;
type View = "OPEN" | "MY_WORK" | "DONE" | "ARCHIVED" | "ALL";

function makeId() { return `task-${Date.now().toString(36)}`; }
function relationHref(type: RelationType, id: string): Route {
  if (type === "COMPANY") return `/companies/${id}` as Route;
  if (type === "CONTACT") return `/contacts/${id}` as Route;
  if (type === "DEAL") return `/deals/${id}` as Route;
  return `/projects/${id}` as Route;
}

export function TasksWorkspace({ seedTasks, seedCompanies, seedContacts, seedDeals, seedProjects, owners }: { seedTasks: Task[]; seedCompanies: Company[]; seedContacts: Contact[]; seedDeals: Deal[]; seedProjects: Project[]; owners: WorkspaceUser[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState(seedTasks);
  const [companies, setCompanies] = useState(seedCompanies);
  const [contacts, setContacts] = useState(seedContacts);
  const [deals, setDeals] = useState(seedDeals);
  const [projects, setProjects] = useState(seedProjects);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [editor, setEditor] = useState<{ task?: Task; defaultRelation?: { type: RelationType; id: string } } | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Task | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [handledQueryKey, setHandledQueryKey] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();

  useEffect(() => {
    setRecords(hydrateMockTasks(seedTasks));
    setCompanies(hydrateMockCompanies(seedCompanies));
    setContacts(hydrateMockContacts(seedContacts));
    setDeals(hydrateMockDeals(seedDeals));
    setProjects(hydrateMockProjects(seedProjects));
  }, [seedTasks, seedCompanies, seedContacts, seedDeals, seedProjects]);

  const relations = useMemo(() => buildRelationOptions({ companies, contacts, deals, projects }), [companies, contacts, deals, projects]);
  const relationByKey = useMemo(() => new Map(relations.map((item) => [`${item.type}:${item.id}`, item])), [relations]);
  const ownerById = useMemo(() => new Map(owners.map((item) => [item.id, item.name])), [owners]);

  const updateQuery = useCallback((changes: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "" || value === 1 || (key === "view" && value === "OPEN")) params.delete(key); else params.set(key, String(value));
    });
    const query = params.toString();
    startTransition(() => router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false }));
  }, [pathname, router, searchParams]);

  const urlSearch = searchParams.get("search") ?? "";
  useEffect(() => { if (search === urlSearch) return; const timer = window.setTimeout(() => updateQuery({ search: search.trim(), page: 1 }), 250); return () => window.clearTimeout(timer); }, [search, updateQuery, urlSearch]);
  useEffect(() => setSearch(urlSearch), [urlSearch]);

  const taskId = searchParams.get("task");
  const newTask = searchParams.get("new") === "1";
  const defaultType = searchParams.get("relationType") as RelationType | null;
  const defaultId = searchParams.get("relationId");
  useEffect(() => {
    const key = taskId ? `task:${taskId}` : newTask ? `new:${defaultType ?? ""}:${defaultId ?? ""}` : null;
    if (!key) { if (handledQueryKey) setHandledQueryKey(null); return; }
    if (editor || handledQueryKey === key) return;
    if (taskId) {
      const task = hydrateMockTasks(seedTasks).find((item) => item.id === taskId);
      if (task) setEditor({ task });
    } else setEditor({ defaultRelation: defaultType && defaultId ? { type: defaultType, id: defaultId } : undefined });
    setHandledQueryKey(key);
  }, [taskId, newTask, editor, defaultType, defaultId, seedTasks, handledQueryKey]);

  const rawView = searchParams.get("view");
  const view: View = rawView === "MY_WORK" || rawView === "DONE" || rawView === "ARCHIVED" || rawView === "ALL" ? rawView : "OPEN";
  const status = searchParams.get("status") as TaskStatus | "";
  const priority = searchParams.get("priority") as Priority | "";
  const assigneeId = searchParams.get("assigneeId") ?? "";
  const companyId = searchParams.get("companyId") ?? "";
  const relationType = searchParams.get("relationTypeFilter") as RelationType | "";
  const due = searchParams.get("due") ?? "";
  const requestedPage = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const counts = useMemo(() => ({
    open: records.filter((item) => !item.archivedAt && item.status !== "DONE").length,
    inProgress: records.filter((item) => !item.archivedAt && item.status === "IN_PROGRESS").length,
    done: records.filter((item) => !item.archivedAt && item.status === "DONE").length,
    overdue: records.filter((item) => !item.archivedAt && taskDueBucket(item) === "OVERDUE").length,
  }), [records]);

  const filtered = useMemo(() => records.filter((task) => {
    const q = urlSearch.toLowerCase();
    const label = relationByKey.get(`${task.relationType}:${task.relationId}`)?.label ?? task.relation;
    if (q && !`${task.title} ${task.description ?? ""} ${label} ${task.assignee}`.toLowerCase().includes(q)) return false;
    if (view === "OPEN" && (task.archivedAt || task.status === "DONE")) return false;
    if (view === "MY_WORK" && (task.archivedAt || task.status === "DONE" || task.assigneeId !== owners[0]?.id)) return false;
    if (view === "DONE" && (task.archivedAt || task.status !== "DONE")) return false;
    if (view === "ARCHIVED" && !task.archivedAt) return false;
    if (view === "ALL" && task.archivedAt) return false;
    if (status && task.status !== status) return false;
    if (priority && task.priority !== priority) return false;
    if (assigneeId && task.assigneeId !== assigneeId) return false;
    if (companyId && relationByKey.get(`${task.relationType}:${task.relationId}`)?.companyId !== companyId) return false;
    if (relationType && task.relationType !== relationType) return false;
    if (due && taskDueBucket(task) !== due) return false;
    return true;
  }).sort((a, b) => {
    const rank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    if (a.status === "DONE" && b.status !== "DONE") return 1;
    if (a.status !== "DONE" && b.status === "DONE") return -1;
    return rank[a.priority] - rank[b.priority] || +new Date(b.updatedAt) - +new Date(a.updatedAt);
  }), [records, urlSearch, relationByKey, view, status, priority, assigneeId, companyId, relationType, due, owners]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function persist(next: Task[], message: string) { persistMockTasks(next); setRecords(next); setToast(message); }
  function save(values: TaskPayload) {
    const relation = relationByKey.get(`${values.relationType}:${values.relationId}`);
    const assignee = owners.find((item) => item.id === values.assigneeId);
    if (!relation || !assignee) return;
    const now = new Date().toISOString();
    if (editor?.task) {
      const nextTask: Task = { ...editor.task, ...values, due: formatTaskDue(values.dueAt), dueAt: values.dueAt, relation: relation.label, assignee: assignee.name, updatedAt: now };
      persist(records.map((item) => item.id === nextTask.id ? nextTask : item), `${nextTask.title} updated.`);
    } else {
      const nextTask: Task = { id: makeId(), createdAt: now, updatedAt: now, title: values.title, description: values.description, relationType: values.relationType, relationId: values.relationId, relation: relation.label, assigneeId: values.assigneeId, assignee: assignee.name, due: formatTaskDue(values.dueAt), dueAt: values.dueAt, status: values.status ?? "OPEN", priority: values.priority, completedAt: null, archivedAt: null };
      persist([nextTask, ...records], `${nextTask.title} created.`);
    }
    closeEditor();
  }
  function closeEditor() { setEditor(null); updateQuery({ task: null, new: null, relationId: null, relationType: null }); }
  function setTaskStatus(task: Task, nextStatus: TaskStatus) {
    const now = new Date().toISOString();
    persist(records.map((item) => item.id === task.id ? { ...item, status: nextStatus, completedAt: nextStatus === "DONE" ? now : null, updatedAt: now } : item), nextStatus === "DONE" ? `${task.title} completed.` : `${task.title} moved to ${nextStatus.replaceAll("_", " ")}.`);
  }
  function archive(task: Task) { const now = new Date().toISOString(); persist(records.map((item) => item.id === task.id ? { ...item, archivedAt: now, updatedAt: now } : item), `${task.title} archived.`); setConfirmArchive(null); }
  function reactivate(task: Task) { const now = new Date().toISOString(); persist(records.map((item) => item.id === task.id ? { ...item, archivedAt: null, updatedAt: now } : item), `${task.title} reactivated.`); }

  return <>
    <div className="page-header"><div><div className="eyebrow">DELIVERY / 02 ──</div><h1>Tasks</h1><p>One work queue for commercial follow-ups and delivery actions, always anchored to CRM context.</p></div><button className="primary-button" type="button" onClick={() => setEditor({})}><PlusIcon />New task</button></div>

    <div className="task-metrics">
      <div><span>OPEN</span><strong>{counts.open}</strong><small>Actionable work</small></div><div><span>IN PROGRESS</span><strong>{counts.inProgress}</strong><small>Currently owned</small></div><div className={counts.overdue ? "metric-alert" : ""}><span>OVERDUE</span><strong>{counts.overdue}</strong><small>Needs attention</small></div><div><span>COMPLETED</span><strong>{counts.done}</strong><small>Retained history</small></div>
    </div>

    <div className={`records-toolbar ${isNavigating ? "is-navigating" : ""}`}>
      <div className="filter-row task-filter-row">{(["OPEN", "MY_WORK", "DONE", "ALL", "ARCHIVED"] as View[]).map((item) => <button key={item} className={`filter ${view === item ? "active" : ""}`} type="button" onClick={() => updateQuery({ view: item, page: 1 })}>{item.replaceAll("_", " ")}</button>)}</div>
      <div className="toolbar-tools task-toolbar-tools">
        <label className="inline-search"><SearchIcon /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks, records or assignees..." /></label>
        <label className="sort-control"><span>DUE</span><select value={due} onChange={(event) => updateQuery({ due: event.target.value, page: 1 })}><option value="">Any due</option><option value="OVERDUE">Overdue</option><option value="TODAY">Today</option><option value="UPCOMING">Upcoming</option></select></label>
        <label className="sort-control"><span>PRIORITY</span><select value={priority} onChange={(event) => updateQuery({ priority: event.target.value, page: 1 })}><option value="">Any priority</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></label>
        <label className="sort-control"><span>RELATION</span><select value={relationType} onChange={(event) => updateQuery({ relationTypeFilter: event.target.value, page: 1 })}><option value="">Any relation</option><option value="COMPANY">Company</option><option value="CONTACT">Contact</option><option value="DEAL">Deal</option><option value="PROJECT">Project</option></select></label>
        <label className="sort-control"><span>ACCOUNT</span><select value={companyId} onChange={(event) => updateQuery({ companyId: event.target.value, page: 1 })}><option value="">All accounts</option>{companies.filter((company) => !company.archivedAt).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label className="sort-control"><span>ASSIGNEE</span><select value={assigneeId} onChange={(event) => updateQuery({ assigneeId: event.target.value, page: 1 })}><option value="">Anyone</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</select></label>
      </div>
    </div>

    {pageRecords.length ? <div className="task-queue">
      {pageRecords.map((task) => {
        const relation = relationByKey.get(`${task.relationType}:${task.relationId}`);
        const bucket = taskDueBucket(task);
        return <article className={`task-row-card task-${bucket.toLowerCase()}`} key={task.id}>
          <button className={`task-check ${task.status === "DONE" ? "done" : ""}`} type="button" aria-label={task.status === "DONE" ? "Reopen task" : "Complete task"} onClick={() => setTaskStatus(task, task.status === "DONE" ? "OPEN" : "DONE")}><span>{task.status === "DONE" ? "✓" : ""}</span></button>
          <div className="task-row-main"><button className="task-title-button" type="button" onClick={() => setEditor({ task })}><strong>{task.title}</strong></button><p>{task.description ?? "No additional task context."}</p><div className="task-context"><Badge>{task.relationType}</Badge><Link href={relationHref(task.relationType, task.relationId)}>{relation?.label ?? task.relation}<ArrowIcon /></Link><span>{ownerById.get(task.assigneeId) ?? task.assignee}</span></div></div>
          <div className="task-row-status"><Badge tone={taskPriorityTone(task.priority)}>{task.priority}</Badge><Badge tone={taskStatusTone(task.status)}>{task.status.replaceAll("_", " ")}</Badge><span className={`task-due due-${bucket.toLowerCase()}`}>{task.due}</span></div>
          <div className="task-row-actions"><button type="button" onClick={() => setTaskStatus(task, task.status === "OPEN" ? "IN_PROGRESS" : "OPEN")}>{task.status === "OPEN" ? "Start" : task.status === "IN_PROGRESS" ? "Pause" : "Reopen"}</button>{task.archivedAt ? <button type="button" onClick={() => reactivate(task)}>Reactivate</button> : <button type="button" onClick={() => setConfirmArchive(task)}>Archive</button>}</div>
        </article>;
      })}
    </div> : <div className="data-empty task-empty"><TaskIcon /><strong>No tasks match this queue.</strong><p>Adjust the filters or add a CRM follow-up.</p><button className="secondary-button" type="button" onClick={() => { setSearch(""); updateQuery({ view: "OPEN", priority: null, assigneeId: null, companyId: null, relationTypeFilter: null, due: null, search: null, page: 1 }); }}>Reset filters</button></div>}

    <div className="pagination-bar"><span>Showing {(page - 1) * PAGE_SIZE + (filtered.length ? 1 : 0)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span><div className="pagination-controls"><button type="button" disabled={page <= 1} onClick={() => updateQuery({ page: page - 1 })}>← Previous</button><span>{page} / {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => updateQuery({ page: page + 1 })}>Next →</button></div></div>

    <Modal open={Boolean(editor)} onClose={closeEditor} eyebrow="DELIVERY / Task" title={editor?.task ? `Edit ${editor.task.title}` : "Create task"} size="lg" footer={<><button className="secondary-button" type="button" onClick={closeEditor}>Cancel</button><button className="primary-button" type="submit" form="task-form">{editor?.task ? "Save changes" : "Create task"}</button></>}>
      {editor && <TaskForm task={editor.task} relations={relations} owners={owners} defaultRelation={editor.defaultRelation} onSubmit={save} />}
    </Modal>
    <ConfirmDialog open={Boolean(confirmArchive)} onClose={() => setConfirmArchive(null)} onConfirm={() => confirmArchive && archive(confirmArchive)} title="Archive task?" description={`${confirmArchive?.title ?? "This task"} will leave active work queues while its CRM history remains retained.`} confirmLabel="Archive task" danger />
    {toast && <Toast message={toast} onClose={() => setToast(null)} />}
  </>;
}
