"use client";

import dynamic from "next/dynamic";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui";
import { MoreIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { ConfirmDialog, Modal, Toast } from "@/components/overlay";
import { currency } from "@/lib/format";
import { hydrateMockCompanies, persistMockCompanies } from "@/lib/mock-company-store";
import type { CompanyPayload } from "@/lib/company-api";
import type { Company, CompanyStatus, WorkspaceUser } from "@/lib/types";
const CompanyForm = dynamic(
  () => import("./company-form").then((module) => module.CompanyForm),
  { loading: () => <div className="form-loading" aria-hidden="true"><div /><div /><div /><div /></div> },
);


const PAGE_SIZE = 5;
const STATUS_ORDER: Array<CompanyStatus | "ARCHIVED"> = ["CUSTOMER", "PROSPECT", "PARTNER", "INACTIVE", "ARCHIVED"];

function statusTone(status: CompanyStatus) {
  if (status === "CUSTOMER") return "green" as const;
  if (status === "PROSPECT") return "yellow" as const;
  if (status === "PARTNER") return "blue" as const;
  return "neutral" as const;
}

function makeId(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "company";
  return `${slug}-${Date.now().toString(36)}`;
}

export function CompaniesWorkspace({ seedCompanies, owners }: { seedCompanies: Company[]; owners: WorkspaceUser[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState(seedCompanies);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [editor, setEditor] = useState<{ mode: "create" | "edit"; company?: Company } | null>(null);
  const [confirming, setConfirming] = useState<Company | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();

  useEffect(() => setRecords(hydrateMockCompanies(seedCompanies)), [seedCompanies]);

  const updateQuery = useCallback((changes: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "" || value === "ALL" || value === 1) params.delete(key);
      else params.set(key, String(value));
    });
    const query = params.toString();
    startTransition(() => {
      router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  const urlSearch = searchParams.get("search") ?? "";
  useEffect(() => {
    if (search === urlSearch) return;
    const timer = window.setTimeout(() => updateQuery({ search: search.trim(), page: 1 }), 250);
    return () => window.clearTimeout(timer);
  }, [search, updateQuery, urlSearch]);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  const rawStatus = searchParams.get("status");
  const activeFilter: CompanyStatus | "ARCHIVED" | "ALL" = rawStatus === "ARCHIVED" || STATUS_ORDER.includes(rawStatus as CompanyStatus | "ARCHIVED")
    ? (rawStatus as CompanyStatus | "ARCHIVED")
    : "ALL";
  const ownerId = searchParams.get("ownerId") ?? "";
  const companyId = searchParams.get("companyId") ?? "";
  const requestedSort = searchParams.get("sort") ?? "updatedAt-desc";
  const validSorts = ["updatedAt-desc", "updatedAt-asc", "name-asc", "name-desc", "value-desc", "value-asc", "openDeals-desc"] as const;
  const sort = validSorts.includes(requestedSort as (typeof validSorts)[number]) ? requestedSort : "updatedAt-desc";
  const [sortBy, sortOrder] = sort.split("-") as ["updatedAt" | "name" | "value" | "openDeals", "asc" | "desc"];
  const requestedPage = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const counts = useMemo(() => {
    const base = Object.fromEntries(STATUS_ORDER.map((status) => [status, 0])) as Record<CompanyStatus | "ARCHIVED", number>;
    for (const company of records) {
      if (company.archivedAt) base.ARCHIVED += 1;
      else base[company.status] += 1;
    }
    return base;
  }, [records]);

  const filtered = useMemo(() => {
    const needle = urlSearch.trim().toLowerCase();
    const list = records.filter((company) => {
      const statusMatch = activeFilter === "ARCHIVED"
        ? Boolean(company.archivedAt)
        : activeFilter === "ALL"
          ? !company.archivedAt
          : !company.archivedAt && company.status === activeFilter;
      if (!statusMatch) return false;
      if (companyId && company.id !== companyId) return false;
      if (ownerId && company.ownerId !== ownerId) return false;
      if (!needle) return true;
      return [company.name, company.industry, company.location, company.owner, company.website]
        .some((value) => value.toLowerCase().includes(needle));
    });
    return [...list].sort((a, b) => {
      let result = 0;
      if (sortBy === "name") result = a.name.localeCompare(b.name);
      if (sortBy === "value") result = a.value - b.value;
      if (sortBy === "openDeals") result = a.openDeals - b.openDeals;
      if (sortBy === "updatedAt") result = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sortOrder === "asc" ? result : -result;
    });
  }, [records, activeFilter, companyId, ownerId, urlSearch, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (requestedPage > totalPages) updateQuery({ page: totalPages });
  }, [requestedPage, totalPages, updateQuery]);

  function commit(next: Company[], message: string) {
    setRecords(next);
    persistMockCompanies(next);
    setToast(message);
  }

  function saveCompany(values: CompanyPayload) {
    const owner = owners.find((item) => item.id === values.ownerId);
    if (!owner) return;
    const now = new Date().toISOString();
    if (editor?.mode === "edit" && editor.company) {
      const next = records.map((company) => company.id === editor.company?.id
        ? { ...company, ...values, owner: owner.name, updatedAt: now }
        : company);
      commit(next, `${values.name} updated.`);
    } else {
      const company: Company = {
        id: makeId(values.name),
        ...values,
        owner: owner.name,
        openDeals: 0,
        activeProjects: 0,
        value: 0,
        lastContact: "No activity yet",
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      commit([company, ...records], `${values.name} created.`);
      setSearch("");
      updateQuery({ status: "ALL", search: null, page: 1, sort: "updatedAt-desc" });
    }
    setEditor(null);
  }

  function archive(company: Company) {
    const now = new Date().toISOString();
    const next = records.map((item) => item.id === company.id ? { ...item, archivedAt: now, updatedAt: now } : item);
    commit(next, `${company.name} archived.`);
    setConfirming(null);
  }

  function reactivate(company: Company) {
    const now = new Date().toISOString();
    const next = records.map((item) => item.id === company.id ? { ...item, archivedAt: null, updatedAt: now } : item);
    commit(next, `${company.name} reactivated.`);
  }

  const start = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">CRM / 01 ──</div>
          <h1>Companies</h1>
          <p>Accounts, prospects and partners — searchable, sortable and ready for the future NestJS company endpoints.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setEditor({ mode: "create" })}><PlusIcon />New company</button>
      </div>

      <div className="company-toolbar" aria-label="Company filters" aria-busy={isNavigating}>
        <div className="filter-tabs">
          <button className={`filter ${activeFilter === "ALL" ? "active" : ""}`} type="button" onClick={() => updateQuery({ status: "ALL", page: 1 })}>All <span>{records.filter((c) => !c.archivedAt).length}</span></button>
          {STATUS_ORDER.map((status) => (
            <button className={`filter ${activeFilter === status ? "active" : ""}`} type="button" key={status} onClick={() => updateQuery({ status, page: 1 })}>
              {status.replace("_", " ")} <span>{counts[status]}</span>
            </button>
          ))}
        </div>
        <div className="company-toolbar-tools">
          <label className="inline-search">
            <SearchIcon />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, industry, owner..." aria-label="Search companies" />
            {urlSearch && <button type="button" onClick={() => { setSearch(""); updateQuery({ search: null, page: 1 }); }}>Clear</button>}
          </label>
          <label className="sort-control">
            <span>Owner</span>
            <select value={ownerId} onChange={(event) => updateQuery({ ownerId: event.target.value || null, page: 1 })}>
              <option value="">All owners</option>
              {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
            </select>
          </label>
          <label className="sort-control">
            <span>Sort</span>
            <select value={sort} onChange={(event) => updateQuery({ sort: event.target.value, page: 1 })}>
              <option value="updatedAt-desc">Recently updated</option>
              <option value="updatedAt-asc">Oldest updated</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="value-desc">Pipeline high–low</option>
              <option value="value-asc">Pipeline low–high</option>
              <option value="openDeals-desc">Most open deals</option>
            </select>
          </label>
        </div>
      </div>

      <div className="table-panel companies-table-panel">
        <table className="companies-table">
          <thead><tr><th>Company</th><th>Status</th><th>Industry</th><th>Owner</th><th>Open deals</th><th>Active projects</th><th>Pipeline</th><th>Last contact</th><th aria-label="Actions" /></tr></thead>
          <tbody>
            {pageRecords.map((company) => (
              <tr key={company.id} className={company.archivedAt ? "row-archived" : ""}>
                <td><Link className="entity-link" href={`/companies/${company.id}`}><strong>{company.name}</strong><span>{company.location}</span></Link></td>
                <td><div className="status-stack"><Badge tone={statusTone(company.status)}>{company.status}</Badge>{company.archivedAt && <span className="archived-label">Archived</span>}</div></td>
                <td>{company.industry}</td>
                <td>{company.owner}</td>
                <td className="mono">{company.openDeals}</td>
                <td className="mono">{company.activeProjects}</td>
                <td className="mono">{currency(company.value)}</td>
                <td>{company.lastContact}</td>
                <td>
                  <details className="table-actions">
                    <summary aria-label={`Actions for ${company.name}`}><MoreIcon /></summary>
                    <div className="table-action-menu">
                      <Link href={`/companies/${company.id}`}>Open account</Link>
                      <button type="button" onClick={() => setEditor({ mode: "edit", company })}>Edit</button>
                      {company.archivedAt
                        ? <button type="button" onClick={() => reactivate(company)}>Reactivate</button>
                        : <button className="menu-danger" type="button" onClick={() => setConfirming(company)}>Archive</button>}
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!pageRecords.length && (
          <div className="data-empty">
            <span className="empty-code">NO_MATCH / 00</span>
            <strong>No companies match this view.</strong>
            <p>Adjust the filters or create a new company account.</p>
            <button className="secondary-button" type="button" onClick={() => { setSearch(""); updateQuery({ status: "ALL", companyId: null, ownerId: null, search: null, page: 1 }); }}>Reset filters</button>
          </div>
        )}
      </div>

      <div className="pagination-bar">
        <div><span className="mono">{start}–{end}</span> of <span className="mono">{filtered.length}</span> companies</div>
        <div className="pagination-controls">
          <button type="button" disabled={page <= 1} onClick={() => updateQuery({ page: page - 1 })}>Previous</button>
          <span>Page <strong>{page}</strong> / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => updateQuery({ page: page + 1 })}>Next</button>
        </div>
      </div>

      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        eyebrow={editor?.mode === "edit" ? "CRM / Company" : "CRM / New record"}
        title={editor?.mode === "edit" ? `Edit ${editor.company?.name}` : "Create company"}
        size="lg"
        footer={<>
          <button className="secondary-button" type="button" onClick={() => setEditor(null)}>Cancel</button>
          <button className="primary-button" type="submit" form="company-form">{editor?.mode === "edit" ? "Save changes" : "Create company"}</button>
        </>}
      >
        {editor && <CompanyForm key={`${editor.mode}-${editor.company?.id ?? "new"}`} company={editor.company} owners={owners} onSubmit={saveCompany} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Archive company?"
        description={`${confirming?.name ?? "This account"} will be removed from active CRM views, but its contacts, deals, projects and history remain intact.`}
        confirmLabel="Archive company"
        danger
        onClose={() => setConfirming(null)}
        onConfirm={() => confirming && archive(confirming)}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
