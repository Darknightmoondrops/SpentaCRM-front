"use client";

import dynamic from "next/dynamic";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActivityIcon, ArrowIcon, CheckIcon, DealIcon, ProjectIcon, TaskIcon } from "@/components/icons";
import { Modal, Toast } from "@/components/overlay";
import { Badge, Progress, SectionTitle } from "@/components/ui";
import type { DealPayload } from "@/lib/deal-api";
import { dealStageTone, formatDealDate, OPEN_DEAL_STAGES, PIPELINE_STAGES, STAGE_PROBABILITY } from "@/lib/deal-utils";
import { currency } from "@/lib/format";
import { hydrateMockCompanies } from "@/lib/mock-company-store";
import { hydrateMockContacts } from "@/lib/mock-contact-store";
import { findPersistedMockDeal, hydrateMockDeals, persistMockDeals } from "@/lib/mock-deal-store";
import { hydrateMockProjects } from "@/lib/mock-project-store";
import { hydrateMockTasks } from "@/lib/mock-task-store";
import { hydrateMockActivities } from "@/lib/mock-activity-store";
import type { Activity, Company, Contact, Deal, DealStage, Project, Task, WorkspaceUser } from "@/lib/types";

const DealForm = dynamic(
  () => import("./deal-form").then((module) => module.DealForm),
  { loading: () => <div className="form-loading" aria-hidden="true"><div /><div /><div /><div /></div> },
);

const TABS = ["overview", "activity", "tasks", "delivery"] as const;
type Tab = (typeof TABS)[number];

export function DealDetailView({
  dealId,
  seedDeal,
  seedDeals,
  seedCompanies,
  seedContacts,
  seedProjects,
  owners,
  company: seedCompany,
  contact: seedContact,
  tasks,
  activities,
  project: seedProject,
}: {
  dealId: string;
  seedDeal: Deal | null;
  seedDeals: Deal[];
  seedCompanies: Company[];
  seedContacts: Contact[];
  seedProjects: Project[];
  owners: WorkspaceUser[];
  company: Company | null;
  contact: Contact | null;
  tasks: Task[];
  activities: Activity[];
  project: Project | null;
}) {
  const [deal, setDeal] = useState(seedDeal);
  const [allDeals, setAllDeals] = useState(seedDeals);
  const [companies, setCompanies] = useState(seedCompanies);
  const [contacts, setContacts] = useState(seedContacts);
  const [linkedProject, setLinkedProject] = useState<Project | null>(seedProject);
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [liveTasks, setLiveTasks] = useState(tasks);
  const [liveActivities, setLiveActivities] = useState(activities);

  useEffect(() => {
    setDeal(findPersistedMockDeal(dealId, seedDeal));
    setAllDeals(hydrateMockDeals(seedDeals));
    setCompanies(hydrateMockCompanies(seedCompanies));
    setContacts(hydrateMockContacts(seedContacts));
    setLinkedProject(hydrateMockProjects(seedProjects).find((item) => item.sourceDealId === dealId && !item.archivedAt) ?? seedProject);
    setLiveTasks(hydrateMockTasks(tasks).filter((item) => item.relationType === "DEAL" && item.relationId === dealId && !item.archivedAt));
    setLiveActivities(hydrateMockActivities(activities).filter((item) => item.relationType === "DEAL" && item.relationId === dealId));
  }, [dealId, seedDeal, seedDeals, seedCompanies, seedContacts, seedProjects, seedProject, tasks, activities]);

  const company = useMemo(() => deal ? companies.find((item) => item.id === deal.companyId) ?? seedCompany : seedCompany, [companies, deal, seedCompany]);
  const contact = useMemo(() => deal?.primaryContactId ? contacts.find((item) => item.id === deal.primaryContactId) ?? seedContact : null, [contacts, deal, seedContact]);
  const owner = useMemo(() => deal ? owners.find((item) => item.id === deal.ownerId) : undefined, [deal, owners]);

  if (!deal) {
    return <div className="record-not-found"><div className="eyebrow">CRM / DEAL / 404 ──</div><h1>Deal not found.</h1><p>This opportunity does not exist in the current workspace or is no longer available.</p><Link className="primary-button" href="/deals">Back to deals</Link></div>;
  }

  function commit(nextDeal: Deal, message: string) {
    const next = allDeals.map((item) => item.id === nextDeal.id ? nextDeal : item);
    if (!next.some((item) => item.id === nextDeal.id)) next.unshift(nextDeal);
    setDeal(nextDeal);
    setAllDeals(next);
    persistMockDeals(next);
    setToast(message);
  }

  function save(values: DealPayload) {
    const linkedCompany = companies.find((item) => item.id === values.companyId);
    const linkedOwner = owners.find((item) => item.id === values.ownerId);
    if (!linkedCompany || !linkedOwner) return;
    const now = new Date().toISOString();
    const next: Deal = {
      ...deal,
      ...values,
      company: linkedCompany.name,
      owner: linkedOwner.name,
      lostReason: values.stage === "LOST" ? deal.lostReason : undefined,
      closedAt: values.stage === "WON" || values.stage === "LOST" ? deal.closedAt ?? now : null,
      updatedAt: now,
    };
    commit(next, `${values.title} updated.`);
    setEditing(false);
  }

  function move(stage: DealStage) {
    if (stage === deal.stage) return;
    if (stage === "LOST") {
      setLostReason(deal.lostReason ?? "");
      setLostOpen(true);
      return;
    }
    const now = new Date().toISOString();
    commit({
      ...deal,
      stage,
      probability: STAGE_PROBABILITY[stage],
      lostReason: undefined,
      closedAt: stage === "WON" ? now : null,
      updatedAt: now,
    }, `${deal.title} moved to ${stage}.`);
  }

  function markLost() {
    if (!lostReason.trim()) return;
    const now = new Date().toISOString();
    commit({ ...deal, stage: "LOST", probability: 0, lostReason: lostReason.trim(), closedAt: now, updatedAt: now }, `${deal.title} marked lost.`);
    setLostOpen(false);
    setLostReason("");
  }

  const isOpen = OPEN_DEAL_STAGES.includes(deal.stage);
  const openTasks = liveTasks.filter((task) => task.status !== "DONE");

  return (
    <>
      <div className="detail-crumb"><Link href="/deals">Deals</Link><span>/</span><span>{deal.id.toUpperCase()}</span></div>

      <section className="deal-detail-hero">
        <div className="deal-detail-symbol"><DealIcon /></div>
        <div className="deal-detail-title">
          <div className="deal-title-line"><h1>{deal.title}</h1><Badge tone={dealStageTone(deal.stage)}>{deal.stage}</Badge></div>
          <p>{company?.name ?? deal.company} · owned by {owner?.name ?? deal.owner}</p>
          <div className="deal-hero-meta"><span>{currency(deal.value)}</span><span>{deal.probability}% probability</span><span>Close {formatDealDate(deal.closeDate)}</span></div>
        </div>
        <div className="deal-detail-actions">
          <button className="secondary-button" type="button" onClick={() => setEditing(true)}>Edit</button>
          {isOpen ? <>
            <button className="secondary-button" type="button" onClick={() => setLostOpen(true)}>Mark lost</button>
            <button className="primary-button" type="button" onClick={() => move("WON")}><CheckIcon />Mark won</button>
          </> : <button className="primary-button" type="button" onClick={() => move("NEGOTIATION")}>Reopen deal</button>}
        </div>
      </section>

      <section className="deal-stage-strip" aria-label="Deal stage">
        {PIPELINE_STAGES.map((stage, index) => <button key={stage} type="button" className={`${deal.stage === stage ? "active" : ""} ${stage === "LOST" ? "lost" : ""}`} onClick={() => move(stage)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage}</strong></button>)}
      </section>

      <section className="deal-detail-metrics">
        <div><span>Deal value</span><strong>{currency(deal.value)}</strong></div>
        <div><span>Weighted value</span><strong>{currency(deal.value * deal.probability / 100)}</strong></div>
        <div><span>Probability</span><strong>{deal.probability}%</strong><Progress value={deal.probability} /></div>
        <div><span>Open tasks</span><strong>{openTasks.length}</strong></div>
      </section>

      {deal.stage === "LOST" && deal.lostReason && <div className="loss-banner"><strong>Loss reason</strong><span>{deal.lostReason}</span></div>}

      <nav className="record-tabs deal-tabs" aria-label="Deal detail sections">
        {TABS.map((item) => <button key={item} type="button" className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}<span>{item === "activity" ? liveActivities.length : item === "tasks" ? liveTasks.length : item === "delivery" ? (linkedProject ? 1 : 0) : ""}</span></button>)}
      </nav>

      {tab === "overview" && <div className="detail-grid deal-overview-grid">
        <section className="panel">
          <SectionTitle eyebrow="Commercial" title="Opportunity context" />
          <div className="context-block"><p>{deal.description || "No stable commercial context has been added yet."}</p></div>
          <div className="context-lines">
            <div className="context-line"><span>Owner</span><strong>{owner?.name ?? deal.owner}</strong></div>
            <div className="context-line"><span>Expected close</span><strong>{formatDealDate(deal.closeDate)}</strong></div>
            <div className="context-line"><span>Created</span><strong>{new Date(deal.createdAt).toLocaleDateString("en-GB")}</strong></div>
            <div className="context-line"><span>Updated</span><strong>{new Date(deal.updatedAt).toLocaleDateString("en-GB")}</strong></div>
          </div>
        </section>
        <section className="panel">
          <SectionTitle eyebrow="Account" title="Stakeholders" />
          {company ? <Link href={`/companies/${company.id}` as Route} className="deal-linked-record"><span className="deal-linked-icon"><span>CO</span></span><span><strong>{company.name}</strong><small>{company.industry} · {company.location}</small></span><ArrowIcon /></Link> : <div className="data-empty small"><strong>Account unavailable.</strong></div>}
          {contact ? <Link href={`/contacts/${contact.id}` as Route} className="deal-linked-record"><span className="deal-linked-icon"><span>{contact.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}</span></span><span><strong>{contact.name}</strong><small>{contact.role} · primary deal contact</small></span><ArrowIcon /></Link> : <div className="deal-linked-record muted"><span className="deal-linked-icon"><span>--</span></span><span><strong>No primary deal contact</strong><small>Assign one from Edit deal.</small></span></div>}
        </section>
      </div>}

      {tab === "activity" && <section className="panel tab-panel">
        <SectionTitle eyebrow="History" title="Deal activity" action={{ label: "Log activity", href: `/activities?new=1&relationType=DEAL&relationId=${deal.id}` as Route }} />
        <div className="account-activity-list">{liveActivities.length ? liveActivities.map((activity) => <div className="account-activity" key={activity.id}><div className="activity-icon"><ActivityIcon /></div><div><strong>{activity.title}</strong><p>{activity.detail}</p><span>{activity.actor} · {activity.time}</span></div></div>) : <div className="data-empty"><strong>No direct deal activity yet.</strong><p>Emails, meetings, notes and stage updates linked to this opportunity will appear here.</p></div>}</div>
      </section>}

      {tab === "tasks" && <section className="panel tab-panel">
        <SectionTitle eyebrow="Follow-up" title="Deal tasks" action={{ label: "New task", href: `/tasks?new=1&relationType=DEAL&relationId=${deal.id}` as Route }} />
        <div className="contact-task-list">{liveTasks.length ? liveTasks.map((task) => <div className="contact-task" key={task.id}><div className="activity-icon"><TaskIcon /></div><div><strong>{task.title}</strong><span>{task.assignee} · due {task.due}</span></div><Badge tone={task.priority === "CRITICAL" ? "red" : task.priority === "HIGH" ? "yellow" : "neutral"}>{task.priority}</Badge><Badge tone={task.status === "DONE" ? "green" : "neutral"}>{task.status}</Badge></div>) : <div className="data-empty"><strong>No tasks linked.</strong><p>Commercial follow-ups linked directly to this deal will appear here.</p></div>}</div>
      </section>}

      {tab === "delivery" && <section className="panel tab-panel">
        <SectionTitle eyebrow="Handoff" title="Delivery connection" action={linkedProject ? { label: "Project portfolio", href: "/projects" } : undefined} />
        {linkedProject ? <Link href={`/projects/${linkedProject.id}` as Route} className="delivery-card delivery-card-link"><div className="deal-linked-icon"><ProjectIcon /></div><div><Badge tone="blue">{linkedProject.status.replaceAll("_", " ")}</Badge><h3>{linkedProject.title}</h3><p>{linkedProject.owner} · team {linkedProject.team} · target {linkedProject.target}</p><Progress value={linkedProject.progress} /></div><strong>{linkedProject.progress}%</strong></Link> : <div className="delivery-empty"><div className="deal-linked-icon"><ProjectIcon /></div><div><strong>No project created from this deal.</strong><p>{deal.stage === "WON" ? "Create delivery work while retaining this deal as the immutable commercial source." : "Only a won opportunity can be converted into a delivery project."}</p>{deal.stage === "WON" && <Link className="primary-button compact-action" href={`/projects?new=1&sourceDealId=${deal.id}` as Route}>Create project <ArrowIcon /></Link>}</div></div>}
      </section>}

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit deal" eyebrow="Commercial record" size="lg" footer={<><button className="secondary-button" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button" type="submit" form="deal-form">Save changes</button></>}>
        {editing && <DealForm deal={deal} companies={companies} contacts={contacts} owners={owners} onSubmit={save} />}
      </Modal>

      <Modal open={lostOpen} onClose={() => { setLostOpen(false); setLostReason(""); }} title="Mark deal as lost" eyebrow="Commercial outcome" size="sm" footer={<><button className="secondary-button" type="button" onClick={() => { setLostOpen(false); setLostReason(""); }}>Cancel</button><button className="danger-button" type="button" disabled={!lostReason.trim()} onClick={markLost}>Mark lost</button></>}>
        <p className="confirm-copy">Capture the reason before closing the opportunity. This becomes part of the commercial record.</p>
        <label className="field lost-reason-field"><span>Loss reason *</span><textarea autoFocus rows={4} value={lostReason} onChange={(event) => setLostReason(event.target.value)} placeholder="Budget deferred, internal build selected, timing mismatch..." /></label>
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
