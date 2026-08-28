"use client";

import dynamic from "next/dynamic";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ActivityIcon, CompanyIcon, ContactIcon, DealIcon, TaskIcon } from "@/components/icons";
import { Badge, SectionTitle } from "@/components/ui";
import { ConfirmDialog, Modal, Toast } from "@/components/overlay";
import { currency } from "@/lib/format";
import type { ContactPayload } from "@/lib/contact-api";
import { hydrateMockCompanies } from "@/lib/mock-company-store";
import { hydrateMockTasks } from "@/lib/mock-task-store";
import { hydrateMockActivities } from "@/lib/mock-activity-store";
import { findPersistedMockContact, hydrateMockContacts, persistMockContacts } from "@/lib/mock-contact-store";
import type { Activity, Company, Contact, Deal, Task } from "@/lib/types";

const ContactForm = dynamic(
  () => import("./contact-form").then((module) => module.ContactForm),
  { loading: () => <div className="form-loading" aria-hidden="true"><div /><div /><div /><div /></div> },
);

const TABS = ["overview", "activity", "deals", "tasks"] as const;
type Tab = (typeof TABS)[number];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function dealTone(stage: Deal["stage"]) {
  if (stage === "WON") return "green" as const;
  if (stage === "NEGOTIATION") return "yellow" as const;
  if (stage === "LOST") return "red" as const;
  return "neutral" as const;
}

function taskTone(priority: Task["priority"]) {
  if (priority === "CRITICAL") return "red" as const;
  if (priority === "HIGH") return "yellow" as const;
  return "neutral" as const;
}

export function ContactDetailView({
  contactId,
  seedContact,
  seedContacts,
  seedCompanies,
  company,
  deals,
  tasks,
  activities,
}: {
  contactId: string;
  seedContact: Contact | null;
  seedContacts: Contact[];
  seedCompanies: Company[];
  company: Company | null;
  deals: Deal[];
  tasks: Task[];
  activities: Activity[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [contact, setContact] = useState<Contact | null>(seedContact);
  const [hydrated, setHydrated] = useState(Boolean(seedContact));
  const [liveTasks, setLiveTasks] = useState(tasks);
  const [liveActivities, setLiveActivities] = useState(activities);
  const [editing, setEditing] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [companies, setCompanies] = useState(seedCompanies);

  useEffect(() => {
    setContact(findPersistedMockContact(contactId, seedContact));
    setCompanies(hydrateMockCompanies(seedCompanies));
    setLiveTasks(hydrateMockTasks(tasks).filter((item) => item.relationType === "CONTACT" && item.relationId === contactId && !item.archivedAt));
    setLiveActivities(hydrateMockActivities(activities).filter((item) => item.relationType === "CONTACT" && item.relationId === contactId));
    setHydrated(true);
  }, [contactId, seedContact, seedCompanies, tasks, activities]);

  const tabParam = searchParams.get("tab");
  const tab: Tab = TABS.includes(tabParam as Tab) ? tabParam as Tab : "overview";
  const setTab = useCallback((next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") params.delete("tab"); else params.set("tab", next);
    const query = params.toString();
    router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
  }, [pathname, router, searchParams]);

  function persistContact(nextContact: Contact, message: string) {
    const all = hydrateMockContacts(seedContacts);
    const now = new Date().toISOString();
    const normalised = nextContact.isPrimary
      ? all.map((item) => item.companyId === nextContact.companyId && item.id !== nextContact.id ? { ...item, isPrimary: false, updatedAt: now } : item)
      : all;
    const found = normalised.some((item) => item.id === nextContact.id);
    const nextAll = found ? normalised.map((item) => item.id === nextContact.id ? nextContact : item) : [nextContact, ...normalised];
    persistMockContacts(nextAll);
    setContact(nextContact);
    setToast(message);
  }

  function save(values: ContactPayload) {
    if (!contact) return;
    const nextCompany = companies.find((item) => item.id === values.companyId);
    if (!nextCompany) return;
    const next = { ...contact, ...values, company: nextCompany.name, updatedAt: new Date().toISOString() };
    persistContact(next, `${values.name} updated.`);
    setEditing(false);
  }

  function archive() {
    if (!contact) return;
    const now = new Date().toISOString();
    persistContact({ ...contact, archivedAt: now, isPrimary: false, updatedAt: now }, `${contact.name} archived.`);
    setConfirmingArchive(false);
  }

  function reactivate() {
    if (!contact) return;
    persistContact({ ...contact, archivedAt: null, updatedAt: new Date().toISOString() }, `${contact.name} reactivated.`);
  }

  if (!hydrated) return <div className="company-detail-loading"><div /><div /><div /></div>;

  if (!contact) {
    return (
      <div className="record-not-found">
        <div className="eyebrow">CRM / CONTACT / 404 ──</div>
        <h1>Contact not found</h1>
        <p>The requested stakeholder does not exist in the current frontend dataset.</p>
        <Link className="primary-button" href="/contacts">Back to contacts</Link>
      </div>
    );
  }

  const currentCompany = companies.find((item) => item.id === contact.companyId) ?? company;
  const openTasks = liveTasks.filter((task) => task.status !== "DONE");

  return (
    <>
      <div className="detail-crumb"><Link href="/contacts">← CONTACTS</Link><span>/</span><span>{contact.name.toUpperCase()}</span></div>

      {contact.archivedAt && (
        <div className="archive-banner">
          <div><span className="status-dot" /><strong>Archived contact</strong><span>Removed from active stakeholder views. Historical relationship data is retained.</span></div>
          <button className="secondary-button" type="button" onClick={reactivate}>Reactivate</button>
        </div>
      )}

      <div className="contact-hero">
        <div className="contact-symbol">{initials(contact.name)}</div>
        <div className="company-identity">
          <div className="eyebrow">STAKEHOLDER / {contact.id.toUpperCase()}</div>
          <h1>{contact.name}</h1>
          <div className="company-meta">
            {contact.isPrimary && <Badge tone="green">Primary contact</Badge>}
            <span>{contact.role}</span>
            {contact.department && <span>{contact.department}</span>}
            <Link href={`/companies/${contact.companyId}`}>{currentCompany?.name ?? contact.company} ↗</Link>
          </div>
        </div>
        <div className="hero-actions contact-hero-actions">
          <a className="secondary-button" href={`mailto:${contact.email}`}>Email</a>
          {contact.phone && <a className="secondary-button" href={`tel:${contact.phone}`}>Call</a>}
          <button className="secondary-button" type="button" onClick={() => contact.archivedAt ? reactivate() : setConfirmingArchive(true)}>{contact.archivedAt ? "Reactivate" : "Archive"}</button>
          <button className="primary-button" type="button" onClick={() => setEditing(true)}>Edit contact</button>
        </div>
      </div>

      <div className="metrics-row contact-metrics">
        <div><span>PREFERRED CHANNEL</span><strong className="small-strong">{contact.preferredChannel}</strong></div>
        <div><span>LINKED DEALS</span><strong>{deals.length}</strong></div>
        <div><span>OPEN TASKS</span><strong>{openTasks.length}</strong></div>
        <div><span>LAST CONTACT</span><strong className="small-strong">{contact.lastContact}</strong></div>
      </div>

      <nav className="record-tabs" aria-label="Contact sections">
        {TABS.map((item) => <button key={item} type="button" className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}<span>{item === "activity" ? liveActivities.length : item === "deals" ? deals.length : item === "tasks" ? liveTasks.length : ""}</span></button>)}
      </nav>

      {tab === "overview" && (
        <div className="detail-grid contact-overview-grid">
          <section className="panel">
            <SectionTitle eyebrow="Stakeholder" title="Contact details" />
            <div className="context-block">
              <div className="context-line"><span>Email</span><strong><a className="inline-link" href={`mailto:${contact.email}`}>{contact.email}</a></strong></div>
              <div className="context-line"><span>Phone</span><strong>{contact.phone ? <a className="inline-link" href={`tel:${contact.phone}`}>{contact.phone}</a> : "Not recorded"}</strong></div>
              <div className="context-line"><span>Preferred channel</span><strong>{contact.preferredChannel}</strong></div>
              <div className="context-line"><span>LinkedIn</span><strong>{contact.linkedin ? <a className="inline-link" href={`https://${contact.linkedin}`} target="_blank" rel="noreferrer">Open profile ↗</a> : "Not recorded"}</strong></div>
              <div className="context-line"><span>Primary</span><strong>{contact.isPrimary ? "Yes" : "No"}</strong></div>
            </div>
          </section>

          <section className="panel">
            <SectionTitle eyebrow="Account" title="Company context" />
            {currentCompany ? <div className="contact-account-card"><div className="compact-icon"><CompanyIcon /></div><div><Link href={`/companies/${currentCompany.id}`}><strong>{currentCompany.name}</strong></Link><p>{currentCompany.industry} · {currentCompany.location}</p></div><Badge tone={currentCompany.status === "CUSTOMER" ? "green" : currentCompany.status === "PROSPECT" ? "yellow" : "blue"}>{currentCompany.status}</Badge></div> : <div className="data-empty small"><strong>Company unavailable.</strong><p>The linked account could not be resolved.</p></div>}
            <div className="contact-notes"><span>STAKEHOLDER CONTEXT</span><p>{contact.notes || "No stable stakeholder context has been recorded yet."}</p></div>
          </section>

          <section className="panel contact-span-full">
            <SectionTitle eyebrow="Commercial" title="Primary deals" action={{ label: "Open pipeline", href: "/deals" }} />
            {deals.length ? <div className="deal-list">{deals.map((deal) => <div className="deal-row deal-row-wide" key={deal.id}><div className="deal-icon"><DealIcon /></div><div><strong>{deal.title}</strong><span>{deal.owner} · {deal.probability}% probability · close {deal.closeDate}</span></div><Badge tone={dealTone(deal.stage)}>{deal.stage}</Badge><strong className="mono">{currency(deal.value)}</strong><span /></div>)}</div> : <div className="data-empty small"><strong>No primary deals.</strong><p>This contact is not assigned as the primary stakeholder on an opportunity.</p></div>}
          </section>
        </div>
      )}

      {tab === "activity" && <section className="panel tab-panel"><SectionTitle eyebrow="Relationship history" title="Direct activity" action={{ label: "Log activity", href: `/activities?new=1&relationType=CONTACT&relationId=${contact.id}` as Route }} />{liveActivities.length ? <div className="account-activity-list">{liveActivities.map((activity) => <div className="account-activity" key={activity.id}><div className="activity-icon"><ActivityIcon /></div><div><strong>{activity.title}</strong><p>{activity.detail}</p><span>{activity.actor} · {activity.time}</span></div><Badge>{activity.type}</Badge></div>)}</div> : <div className="data-empty"><strong>No direct contact activity yet.</strong><p>Calls, emails, meetings and notes linked to this stakeholder will appear here.</p></div>}</section>}

      {tab === "deals" && <section className="panel tab-panel"><SectionTitle eyebrow="Commercial" title="Deals where this is the primary contact" />{deals.length ? <div className="deal-list">{deals.map((deal) => <div className="deal-row deal-row-wide" key={deal.id}><div className="deal-icon"><DealIcon /></div><div><strong>{deal.title}</strong><span>{deal.owner} · {deal.probability}% probability · close {deal.closeDate}</span></div><Badge tone={dealTone(deal.stage)}>{deal.stage}</Badge><strong className="mono">{currency(deal.value)}</strong><span /></div>)}</div> : <div className="data-empty"><strong>No linked deals.</strong><p>Set this stakeholder as a deal's primary contact to create a direct commercial relationship.</p></div>}</section>}

      {tab === "tasks" && <section className="panel tab-panel"><SectionTitle eyebrow="Follow-up" title="Contact tasks" action={{ label: "New task", href: `/tasks?new=1&relationType=CONTACT&relationId=${contact.id}` as Route }} />{liveTasks.length ? <div className="contact-task-list">{liveTasks.map((task) => <div className="contact-task" key={task.id}><div className="compact-icon"><TaskIcon /></div><div><strong>{task.title}</strong><span>{task.assignee} · due {task.due}</span></div><Badge tone={taskTone(task.priority)}>{task.priority}</Badge><Badge tone={task.status === "DONE" ? "green" : "neutral"}>{task.status.replace("_", " ")}</Badge></div>)}</div> : <div className="data-empty"><strong>No contact tasks.</strong><p>Follow-up work linked directly to this stakeholder will appear here.</p></div>}</section>}

      <Modal open={editing} onClose={() => setEditing(false)} eyebrow="CRM / Contact" title={`Edit ${contact.name}`} size="lg" footer={<><button className="secondary-button" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button" type="submit" form="contact-form">Save changes</button></>}>
        <ContactForm key={contact.updatedAt} contact={contact} companies={companies} onSubmit={save} />
      </Modal>

      <ConfirmDialog open={confirmingArchive} onClose={() => setConfirmingArchive(false)} onConfirm={archive} title="Archive contact?" description={`${contact.name} will leave active stakeholder views. Direct activities and commercial history will remain available.`} confirmLabel="Archive contact" danger />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
