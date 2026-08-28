"use client";

import dynamic from "next/dynamic";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MoreIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import { ConfirmDialog, Modal, Toast } from "@/components/overlay";
import type { ContactPayload } from "@/lib/contact-api";
import { hydrateMockCompanies } from "@/lib/mock-company-store";
import { hydrateMockContacts, persistMockContacts } from "@/lib/mock-contact-store";
import type { Company, Contact, ContactChannel } from "@/lib/types";

const ContactForm = dynamic(
  () => import("./contact-form").then((module) => module.ContactForm),
  { loading: () => <div className="form-loading" aria-hidden="true"><div /><div /><div /><div /></div> },
);

const PAGE_SIZE = 6;
const CHANNELS: ContactChannel[] = ["EMAIL", "PHONE", "MEETING"];

type ContactView = "ALL" | "PRIMARY" | "ARCHIVED";

function makeId(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "contact";
  return `${slug}-${Date.now().toString(36)}`;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function ContactsWorkspace({ seedContacts, seedCompanies }: { seedContacts: Contact[]; seedCompanies: Company[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState(seedContacts);
  const [companies, setCompanies] = useState(seedCompanies);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [editor, setEditor] = useState<{ mode: "create" | "edit"; contact?: Contact } | null>(null);
  const [confirming, setConfirming] = useState<Contact | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();

  useEffect(() => {
    setRecords(hydrateMockContacts(seedContacts));
    setCompanies(hydrateMockCompanies(seedCompanies));
  }, [seedContacts, seedCompanies]);

  const updateQuery = useCallback((changes: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "" || value === "ALL" || value === 1) params.delete(key);
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

  const rawView = searchParams.get("view");
  const view: ContactView = rawView === "PRIMARY" || rawView === "ARCHIVED" ? rawView : "ALL";
  const companyId = searchParams.get("companyId") ?? "";
  const rawChannel = searchParams.get("channel");
  const channel: ContactChannel | "ALL" = CHANNELS.includes(rawChannel as ContactChannel) ? rawChannel as ContactChannel : "ALL";
  const requestedSort = searchParams.get("sort") ?? "updatedAt-desc";
  const validSorts = ["updatedAt-desc", "updatedAt-asc", "name-asc", "name-desc", "company-asc", "company-desc"] as const;
  const sort = validSorts.includes(requestedSort as (typeof validSorts)[number]) ? requestedSort : "updatedAt-desc";
  const [sortBy, sortOrder] = sort.split("-") as ["updatedAt" | "name" | "company", "asc" | "desc"];
  const requestedPage = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const counts = useMemo(() => ({
    active: records.filter((item) => !item.archivedAt).length,
    primary: records.filter((item) => !item.archivedAt && item.isPrimary).length,
    archived: records.filter((item) => Boolean(item.archivedAt)).length,
  }), [records]);

  const companyNameById = useMemo(() => new Map(companies.map((company) => [company.id, company.name])), [companies]);

  const filtered = useMemo(() => {
    const needle = urlSearch.trim().toLowerCase();
    const list = records.filter((contact) => {
      if (view === "ARCHIVED" ? !contact.archivedAt : Boolean(contact.archivedAt)) return false;
      if (view === "PRIMARY" && !contact.isPrimary) return false;
      if (companyId && contact.companyId !== companyId) return false;
      if (channel !== "ALL" && contact.preferredChannel !== channel) return false;
      if (!needle) return true;
      return [contact.name, contact.role, contact.department ?? "", companyNameById.get(contact.companyId) ?? contact.company, contact.email, contact.phone]
        .some((value) => value.toLowerCase().includes(needle));
    });
    return [...list].sort((a, b) => {
      let result = 0;
      if (sortBy === "name") result = a.name.localeCompare(b.name);
      if (sortBy === "company") result = (companyNameById.get(a.companyId) ?? a.company).localeCompare(companyNameById.get(b.companyId) ?? b.company);
      if (sortBy === "updatedAt") result = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sortOrder === "asc" ? result : -result;
    });
  }, [records, view, companyId, channel, urlSearch, sortBy, sortOrder, companyNameById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (requestedPage > totalPages) updateQuery({ page: totalPages });
  }, [requestedPage, totalPages, updateQuery]);

  function commit(next: Contact[], message: string) {
    setRecords(next);
    persistMockContacts(next);
    setToast(message);
  }

  function saveContact(values: ContactPayload) {
    const company = companies.find((item) => item.id === values.companyId);
    if (!company) return;
    const now = new Date().toISOString();
    const editingId = editor?.mode === "edit" ? editor.contact?.id : undefined;
    let next = records.map((item) => values.isPrimary && item.companyId === values.companyId && item.id !== editingId ? { ...item, isPrimary: false, updatedAt: now } : item);

    if (editor?.mode === "edit" && editor.contact) {
      next = next.map((item) => item.id === editor.contact?.id
        ? { ...item, ...values, company: company.name, updatedAt: now }
        : item);
      commit(next, `${values.name} updated.`);
    } else {
      const contact: Contact = {
        id: makeId(values.name),
        ...values,
        company: company.name,
        lastContact: "No activity yet",
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      commit([contact, ...next], `${values.name} created.`);
      setSearch("");
      updateQuery({ view: "ALL", search: null, page: 1, sort: "updatedAt-desc" });
    }
    setEditor(null);
  }

  function archive(contact: Contact) {
    const now = new Date().toISOString();
    const next = records.map((item) => item.id === contact.id ? { ...item, archivedAt: now, isPrimary: false, updatedAt: now } : item);
    commit(next, `${contact.name} archived.`);
    setConfirming(null);
  }

  function reactivate(contact: Contact) {
    const now = new Date().toISOString();
    const next = records.map((item) => item.id === contact.id ? { ...item, archivedAt: null, updatedAt: now } : item);
    commit(next, `${contact.name} reactivated.`);
  }

  const start = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">CRM / 02 ──</div>
          <h1>Contacts</h1>
          <p>Stakeholders, decision-makers and day-to-day customer contacts linked to the account model.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setEditor({ mode: "create" })}><PlusIcon />New contact</button>
      </div>

      <div className="company-toolbar contacts-toolbar" aria-label="Contact filters" aria-busy={isNavigating}>
        <div className="filter-tabs">
          <button className={`filter ${view === "ALL" ? "active" : ""}`} type="button" onClick={() => updateQuery({ view: "ALL", page: 1 })}>All <span>{counts.active}</span></button>
          <button className={`filter ${view === "PRIMARY" ? "active" : ""}`} type="button" onClick={() => updateQuery({ view: "PRIMARY", page: 1 })}>Primary <span>{counts.primary}</span></button>
          <button className={`filter ${view === "ARCHIVED" ? "active" : ""}`} type="button" onClick={() => updateQuery({ view: "ARCHIVED", page: 1 })}>Archived <span>{counts.archived}</span></button>
        </div>

        <div className="company-toolbar-tools contact-toolbar-tools">
          <label className="inline-search contact-search">
            <SearchIcon />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contact, role, email..." aria-label="Search contacts" />
            {urlSearch && <button type="button" onClick={() => { setSearch(""); updateQuery({ search: null, page: 1 }); }}>Clear</button>}
          </label>
          <label className="sort-control contact-select-control">
            <span>Company</span>
            <select value={companyId} onChange={(event) => updateQuery({ companyId: event.target.value || null, page: 1 })}>
              <option value="">All companies</option>
              {companies.filter((item) => !item.archivedAt).map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}
            </select>
          </label>
          <label className="sort-control contact-select-control compact-control">
            <span>Channel</span>
            <select value={channel} onChange={(event) => updateQuery({ channel: event.target.value === "ALL" ? null : event.target.value, page: 1 })}>
              <option value="ALL">All</option>
              {CHANNELS.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          <label className="sort-control contact-select-control compact-control">
            <span>Sort</span>
            <select value={sort} onChange={(event) => updateQuery({ sort: event.target.value, page: 1 })}>
              <option value="updatedAt-desc">Recently updated</option>
              <option value="updatedAt-asc">Oldest updated</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="company-asc">Company A–Z</option>
              <option value="company-desc">Company Z–A</option>
            </select>
          </label>
        </div>
      </div>

      <div className="table-panel contacts-table-panel">
        <table className="contacts-table">
          <thead><tr><th>Contact</th><th>Company</th><th>Role</th><th>Department</th><th>Channel</th><th>Direct</th><th>Last contact</th><th aria-label="Actions" /></tr></thead>
          <tbody>
            {pageRecords.map((contact) => (
              <tr key={contact.id} className={contact.archivedAt ? "row-archived" : ""}>
                <td><Link className="contact-entity" href={`/contacts/${contact.id}`}><span className="mini-avatar">{initials(contact.name)}</span><span><strong>{contact.name}</strong><small>{contact.email}</small></span>{contact.isPrimary && <Badge tone="green">Primary</Badge>}</Link></td>
                <td><Link className="inline-link" href={`/companies/${contact.companyId}`}>{companyNameById.get(contact.companyId) ?? contact.company}</Link></td>
                <td>{contact.role}</td>
                <td>{contact.department || "—"}</td>
                <td><Badge tone={contact.preferredChannel === "MEETING" ? "blue" : contact.preferredChannel === "PHONE" ? "yellow" : "neutral"}>{contact.preferredChannel}</Badge></td>
                <td><div className="direct-actions"><a href={`mailto:${contact.email}`}>Email</a>{contact.phone && <a href={`tel:${contact.phone}`}>Call</a>}</div></td>
                <td>{contact.lastContact}</td>
                <td>
                  <details className="table-actions">
                    <summary aria-label={`Actions for ${contact.name}`}><MoreIcon /></summary>
                    <div className="table-action-menu">
                      <Link href={`/contacts/${contact.id}`}>Open contact</Link>
                      <button type="button" onClick={() => setEditor({ mode: "edit", contact })}>Edit</button>
                      {contact.archivedAt
                        ? <button type="button" onClick={() => reactivate(contact)}>Reactivate</button>
                        : <button className="menu-danger" type="button" onClick={() => setConfirming(contact)}>Archive</button>}
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!pageRecords.length && (
          <div className="data-empty">
            <span className="empty-code">NO_CONTACTS / 00</span>
            <strong>No contacts match this view.</strong>
            <p>Adjust the company/channel filters or create a new stakeholder record.</p>
            <button className="secondary-button" type="button" onClick={() => { setSearch(""); updateQuery({ view: "ALL", companyId: null, channel: null, search: null, page: 1 }); }}>Reset filters</button>
          </div>
        )}
      </div>

      <div className="pagination-bar">
        <div><span className="mono">{start}–{end}</span> of <span className="mono">{filtered.length}</span> contacts</div>
        <div className="pagination-controls">
          <button type="button" disabled={page <= 1} onClick={() => updateQuery({ page: page - 1 })}>Previous</button>
          <span>Page <strong>{page}</strong> / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => updateQuery({ page: page + 1 })}>Next</button>
        </div>
      </div>

      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        eyebrow={editor?.mode === "edit" ? "CRM / Contact" : "CRM / New stakeholder"}
        title={editor?.mode === "edit" ? `Edit ${editor.contact?.name}` : "Create contact"}
        size="lg"
        footer={<><button className="secondary-button" type="button" onClick={() => setEditor(null)}>Cancel</button><button className="primary-button" type="submit" form="contact-form">{editor?.mode === "edit" ? "Save changes" : "Create contact"}</button></>}
      >
        {editor && <ContactForm key={`${editor.mode}-${editor.contact?.id ?? "new"}`} contact={editor.contact} companies={companies} onSubmit={saveContact} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Archive contact?"
        description={`${confirming?.name ?? "This contact"} will be removed from active stakeholder views. Historical activity remains available.`}
        confirmLabel="Archive contact"
        danger
        onConfirm={() => confirming && archive(confirming)}
        onClose={() => setConfirming(null)}
      />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
