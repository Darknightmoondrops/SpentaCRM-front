"use client";

import dynamic from "next/dynamic";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ActivityIcon, ArrowIcon, CompanyIcon, ContactIcon, DealIcon, ProjectIcon } from "@/components/icons";
import { Badge, Progress, SectionTitle } from "@/components/ui";
import { ConfirmDialog, Modal, Toast } from "@/components/overlay";
import { currency } from "@/lib/format";
import { productConfig } from "@/config/product";
import { formatDealDate } from "@/lib/deal-utils";
import { findPersistedMockCompany, hydrateMockCompanies, persistMockCompanies } from "@/lib/mock-company-store";
import { hydrateMockContacts } from "@/lib/mock-contact-store";
import { hydrateMockDeals } from "@/lib/mock-deal-store";
import { hydrateMockProjects } from "@/lib/mock-project-store";
import { hydrateMockActivities } from "@/lib/mock-activity-store";
import type { CompanyPayload } from "@/lib/company-api";
import type { Activity, Company, Contact, Deal, Project, WorkspaceUser } from "@/lib/types";
const CompanyForm = dynamic(
  () => import("./company-form").then((module) => module.CompanyForm),
  { loading: () => <div className="form-loading" aria-hidden="true"><div /><div /><div /><div /></div> },
);


const TABS = ["overview", "contacts", "deals", "projects", "activity", "files"] as const;
type Tab = (typeof TABS)[number];

function companyTone(status: Company["status"]) {
  if (status === "CUSTOMER") return "green" as const;
  if (status === "PROSPECT") return "yellow" as const;
  if (status === "PARTNER") return "blue" as const;
  return "neutral" as const;
}

function dealTone(stage: Deal["stage"]) {
  if (stage === "WON") return "green" as const;
  if (stage === "NEGOTIATION") return "yellow" as const;
  if (stage === "LOST") return "red" as const;
  return "neutral" as const;
}

export function CompanyDetailView({
  companyId,
  seedCompany,
  seedCompanies,
  owners,
  contacts,
  deals,
  projects,
  activities,
}: {
  companyId: string;
  seedCompany: Company | null;
  seedCompanies: Company[];
  owners: WorkspaceUser[];
  contacts: Contact[];
  deals: Deal[];
  projects: Project[];
  activities: Activity[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [company, setCompany] = useState<Company | null>(seedCompany);
  const [accountContacts, setAccountContacts] = useState<Contact[]>(contacts);
  const [accountDeals, setAccountDeals] = useState<Deal[]>(deals);
  const [accountProjects, setAccountProjects] = useState<Project[]>(projects);
  const [hydrated, setHydrated] = useState(Boolean(seedCompany));
  const [liveActivities, setLiveActivities] = useState(activities);
  const [editing, setEditing] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setCompany(findPersistedMockCompany(companyId, seedCompany));
    const hydratedContacts = hydrateMockContacts(contacts).filter((contact) => contact.companyId === companyId && !contact.archivedAt);
    const hydratedDeals = hydrateMockDeals(deals).filter((deal) => deal.companyId === companyId);
    const hydratedProjects = hydrateMockProjects(projects).filter((project) => project.companyId === companyId && !project.archivedAt);
    setAccountContacts(hydratedContacts);
    setAccountDeals(hydratedDeals);
    setAccountProjects(hydratedProjects);
    const relationIds = new Set([companyId, ...hydratedContacts.map((item) => item.id), ...hydratedDeals.map((item) => item.id), ...hydratedProjects.map((item) => item.id)]);
    setLiveActivities(hydrateMockActivities(activities).filter((item) => relationIds.has(item.relationId)));
    setHydrated(true);
  }, [companyId, seedCompany, contacts, deals, projects, activities]);

  const tabParam = searchParams.get("tab");
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "overview";
  const setTab = useCallback((next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") params.delete("tab"); else params.set("tab", next);
    const query = params.toString();
    router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
  }, [pathname, router, searchParams]);

  const primaryContact = accountContacts.find((contact) => contact.isPrimary) ?? accountContacts[0];
  const openDeals = accountDeals.filter((deal) => !["WON", "LOST"].includes(deal.stage));
  const pipelineValue = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const activeProjects = accountProjects.filter((project) => project.status !== "COMPLETED");

  const accountSince = useMemo(() => {
    if (!company) return "—";
    return new Intl.DateTimeFormat(productConfig.locale, { month: "short", year: "numeric" }).format(new Date(company.createdAt));
  }, [company]);

  function persistCompany(nextCompany: Company, message: string) {
    const all = hydrateMockCompanies(seedCompanies);
    const found = all.some((item) => item.id === nextCompany.id);
    const nextAll = found ? all.map((item) => item.id === nextCompany.id ? nextCompany : item) : [nextCompany, ...all];
    persistMockCompanies(nextAll);
    setCompany(nextCompany);
    setToast(message);
  }

  function save(values: CompanyPayload) {
    if (!company) return;
    const owner = owners.find((item) => item.id === values.ownerId);
    if (!owner) return;
    const next = { ...company, ...values, owner: owner.name, updatedAt: new Date().toISOString() };
    persistCompany(next, `${values.name} updated.`);
    setEditing(false);
  }

  function archive() {
    if (!company) return;
    persistCompany({ ...company, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, `${company.name} archived.`);
    setConfirmingArchive(false);
  }

  function reactivate() {
    if (!company) return;
    persistCompany({ ...company, archivedAt: null, updatedAt: new Date().toISOString() }, `${company.name} reactivated.`);
  }

  if (!hydrated) {
    return <div className="company-detail-loading"><div /><div /><div /></div>;
  }

  if (!company) {
    return (
      <div className="record-not-found">
        <div className="eyebrow">CRM / COMPANY / 404 ──</div>
        <h1>Company not found</h1>
        <p>The requested company does not exist in the current frontend dataset.</p>
        <Link className="primary-button" href="/companies">Back to companies</Link>
      </div>
    );
  }

  return (
    <>
      <div className="detail-crumb"><Link href="/companies">← COMPANIES</Link><span>/</span><span>{company.name.toUpperCase()}</span></div>

      {company.archivedAt && (
        <div className="archive-banner">
          <div><span className="status-dot" /><strong>Archived account</strong><span>Hidden from active CRM views. Relationship history is retained.</span></div>
          <button className="secondary-button" type="button" onClick={reactivate}>Reactivate</button>
        </div>
      )}

      <div className="company-hero">
        <div className="company-symbol"><CompanyIcon /></div>
        <div className="company-identity">
          <div className="eyebrow">ACCOUNT / {company.id.toUpperCase()}</div>
          <h1>{company.name}</h1>
          <div className="company-meta">
            <Badge tone={companyTone(company.status)}>{company.status}</Badge>
            <span>{company.industry}</span><span>{company.location}</span>
            {company.website && <a href={`https://${company.website}`} target="_blank" rel="noreferrer">{company.website} ↗</a>}
          </div>
        </div>
        <div className="hero-actions">
          <button className="secondary-button" type="button" onClick={() => company.archivedAt ? reactivate() : setConfirmingArchive(true)}>{company.archivedAt ? "Reactivate" : "Archive"}</button>
          <button className="primary-button" type="button" onClick={() => setEditing(true)}>Edit account</button>
        </div>
      </div>

      <div className="metrics-row">
        <div><span>OPEN DEALS</span><strong>{openDeals.length}</strong></div>
        <div><span>ACTIVE PROJECTS</span><strong>{activeProjects.length}</strong></div>
        <div><span>PIPELINE VALUE</span><strong>{currency(pipelineValue)}</strong></div>
        <div><span>LAST CONTACT</span><strong className="small-strong">{company.lastContact}</strong></div>
      </div>

      <nav className="record-tabs" aria-label="Company sections">
        {TABS.map((item) => <button key={item} type="button" className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}<span>{item === "contacts" ? accountContacts.length : item === "deals" ? accountDeals.length : item === "projects" ? accountProjects.length : item === "activity" ? liveActivities.length : ""}</span></button>)}
      </nav>

      {tab === "overview" && (
        <>
          <div className="detail-grid">
            <section className="panel">
              <SectionTitle eyebrow="Contacts" title="Stakeholders" action={{ label: "All contacts", href: "/contacts" }} />
              <div className="compact-list">
                {accountContacts.length ? accountContacts.slice(0, 4).map((contact) => <div className="compact-item" key={contact.id}><div className="compact-icon"><ContactIcon /></div><div className="compact-copy"><strong>{contact.name}</strong><span>{contact.role}</span></div><div className="compact-meta"><small>{contact.email}</small><small>{contact.lastContact}</small></div></div>) : <div className="data-empty small"><strong>No stakeholders linked.</strong><p>Add contacts in the Contacts phase.</p></div>}
              </div>
            </section>
            <section className="panel">
              <SectionTitle eyebrow="Account" title="Context" />
              <div className="context-block">
                <p>{company.description ?? "No account context has been recorded yet."}</p>
                <div className="context-line"><span>Account owner</span><strong>{company.owner}</strong></div>
                <div className="context-line"><span>Primary contact</span><strong>{primaryContact?.name ?? "Not assigned"}</strong></div>
                <div className="context-line"><span>Industry</span><strong>{company.industry}</strong></div>
                <div className="context-line"><span>Relationship since</span><strong>{accountSince}</strong></div>
                <div className="context-line"><span>Last updated</span><strong>{new Date(company.updatedAt).toLocaleDateString(productConfig.locale)}</strong></div>
              </div>
            </section>
          </div>

          <section className="panel section-space">
            <SectionTitle eyebrow="Commercial" title="Open deals" action={{ label: "Open pipeline", href: "/deals" }} />
            <div className="deal-list">
              {openDeals.length ? openDeals.slice(0, 4).map((deal) => <div className="deal-row" key={deal.id}><div className="deal-icon"><DealIcon /></div><div><strong>{deal.title}</strong><span>{deal.owner} · close {formatDealDate(deal.closeDate)}</span></div><Badge tone={dealTone(deal.stage)}>{deal.stage}</Badge><strong className="mono">{currency(deal.value)}</strong><ArrowIcon /></div>) : <div className="data-empty small"><strong>No open deals.</strong><p>Commercial opportunities will appear here.</p></div>}
            </div>
          </section>

          <section className="panel section-space">
            <SectionTitle eyebrow="Delivery" title="Projects" action={{ label: "All projects", href: "/projects" }} />
            {accountProjects.length ? <div className="project-strip">{accountProjects.slice(0, 3).map((project) => <Link href={`/projects/${project.id}` as Route} className="project-card" key={project.id}><div className="project-card-top"><ProjectIcon /><Badge tone={project.status === "COMPLETED" ? "neutral" : "green"}>{project.status.replace("_", " ")}</Badge></div><h3>{project.title}</h3><p>{project.owner} · {project.team} people</p><div className="project-metrics"><span>{project.progress}% complete</span><span>{project.target}</span></div><Progress value={project.progress} /></Link>)}</div> : <div className="data-empty small"><strong>No delivery projects.</strong><p>Won work can later be converted from a deal to a project.</p></div>}
          </section>
        </>
      )}

      {tab === "contacts" && <section className="panel tab-panel"><SectionTitle eyebrow="Account network" title="Contacts" /><div className="detail-table"><div className="detail-table-head"><span>Name</span><span>Role</span><span>Email</span><span>Phone</span><span>Last contact</span></div>{accountContacts.length ? accountContacts.map((contact) => <div className="detail-table-row" key={contact.id}><strong><Link className="inline-link" href={`/contacts/${contact.id}`}>{contact.name}</Link>{contact.isPrimary ? " · PRIMARY" : ""}</strong><span>{contact.role}</span><a href={`mailto:${contact.email}`}>{contact.email}</a><a href={`tel:${contact.phone}`}>{contact.phone}</a><span>{contact.lastContact}</span></div>) : <div className="data-empty"><strong>No contacts yet.</strong><p>This account has no linked stakeholders.</p></div>}</div></section>}

      {tab === "deals" && <section className="panel tab-panel"><SectionTitle eyebrow="Commercial" title="Deals" /><div className="deal-list">{accountDeals.length ? accountDeals.map((deal) => <Link href={`/deals/${deal.id}` as Route} className="deal-row deal-row-wide" key={deal.id}><div className="deal-icon"><DealIcon /></div><div><strong>{deal.title}</strong><span>{deal.owner} · {deal.probability}% probability · close {formatDealDate(deal.closeDate)}</span></div><Badge tone={dealTone(deal.stage)}>{deal.stage}</Badge><strong className="mono">{currency(deal.value)}</strong><ArrowIcon /></Link>) : <div className="data-empty"><strong>No deals linked.</strong><p>Create a commercial opportunity from the Deals module.</p></div>}</div></section>}

      {tab === "projects" && <section className="panel tab-panel"><SectionTitle eyebrow="Delivery" title="Projects" />{accountProjects.length ? <div className="project-strip project-strip-wide">{accountProjects.map((project) => <Link href={`/projects/${project.id}` as Route} className="project-card" key={project.id}><div className="project-card-top"><ProjectIcon /><Badge tone={project.status === "COMPLETED" ? "neutral" : "green"}>{project.status.replace("_", " ")}</Badge></div><h3>{project.title}</h3><p>{project.owner} · {project.team} people</p><div className="project-metrics"><span>{project.progress}% complete</span><span>{project.target}</span></div><Progress value={project.progress} /></Link>)}</div> : <div className="data-empty"><strong>No projects linked.</strong><p>Delivery work will appear here after deal conversion or project creation.</p></div>}</section>}

      {tab === "activity" && <section className="panel tab-panel"><SectionTitle eyebrow="Relationship history" title="Activity" action={{ label: "Log activity", href: `/activities?new=1&relationType=COMPANY&relationId=${company.id}` as Route }} />{liveActivities.length ? <div className="account-activity-list">{liveActivities.map((activity) => <div className="account-activity" key={activity.id}><div className="activity-icon"><ActivityIcon /></div><div><strong>{activity.title}</strong><p>{activity.detail}</p><span>{activity.actor} · {activity.time} · {activity.relation}</span></div><Badge>{activity.type}</Badge></div>)}</div> : <div className="data-empty"><strong>No account activity yet.</strong><p>Meetings, calls, email notes and record updates will roll up here.</p></div>}</section>}

      {tab === "files" && <section className="panel tab-panel"><SectionTitle eyebrow="Account documents" title="Files" /><div className="files-placeholder"><div className="files-code">ATTACHMENTS / RESERVED</div><h3>Document surface is ready for the attachment API.</h3><p>Proposals, requirements, contracts and customer-provided files will be linked to this account without turning the CRM into a document management system.</p><button className="secondary-button" type="button" disabled>Upload file · Phase 06</button></div></section>}

      <Modal open={editing} onClose={() => setEditing(false)} eyebrow="CRM / Company" title={`Edit ${company.name}`} size="lg" footer={<><button className="secondary-button" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button" type="submit" form="company-form">Save changes</button></>}>
        <CompanyForm key={company.updatedAt} company={company} owners={owners} onSubmit={save} />
      </Modal>

      <ConfirmDialog open={confirmingArchive} onClose={() => setConfirmingArchive(false)} onConfirm={archive} title="Archive company?" description={`${company.name} will leave active views, while contacts, deals, projects, activities and audit history remain available.`} confirmLabel="Archive company" danger />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
