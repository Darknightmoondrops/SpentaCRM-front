"use client";

import dynamic from "next/dynamic";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition, type DragEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { Modal, Toast } from "@/components/overlay";
import { Badge } from "@/components/ui";
import type { DealPayload } from "@/lib/deal-api";
import { dealStageTone, formatDealDate, OPEN_DEAL_STAGES, PIPELINE_STAGES, STAGE_PROBABILITY } from "@/lib/deal-utils";
import { currency } from "@/lib/format";
import { hydrateMockCompanies } from "@/lib/mock-company-store";
import { hydrateMockContacts } from "@/lib/mock-contact-store";
import { hydrateMockDeals, persistMockDeals } from "@/lib/mock-deal-store";
import type { Company, Contact, Deal, DealStage, WorkspaceUser } from "@/lib/types";

const DealForm = dynamic(
  () => import("./deal-form").then((module) => module.DealForm),
  { loading: () => <div className="form-loading" aria-hidden="true"><div /><div /><div /><div /></div> },
);

const PAGE_SIZE = 7;
type DealView = "OPEN" | "ALL" | "WON" | "LOST";
type DisplayMode = "PIPELINE" | "LIST";

function makeId(title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "deal";
  return `${slug}-${Date.now().toString(36)}`;
}

function matchesView(deal: Deal, view: DealView) {
  if (view === "ALL") return true;
  if (view === "OPEN") return OPEN_DEAL_STAGES.includes(deal.stage);
  return deal.stage === view;
}

export function DealsWorkspace({
  seedDeals,
  seedCompanies,
  seedContacts,
  owners,
}: {
  seedDeals: Deal[];
  seedCompanies: Company[];
  seedContacts: Contact[];
  owners: WorkspaceUser[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState(seedDeals);
  const [companies, setCompanies] = useState(seedCompanies);
  const [contacts, setContacts] = useState(seedContacts);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [editor, setEditor] = useState<{ mode: "create" | "edit"; deal?: Deal } | null>(null);
  const [lostTarget, setLostTarget] = useState<{ deal: Deal; previousStage?: DealStage } | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();

  useEffect(() => {
    setRecords(hydrateMockDeals(seedDeals));
    setCompanies(hydrateMockCompanies(seedCompanies));
    setContacts(hydrateMockContacts(seedContacts));
  }, [seedDeals, seedCompanies, seedContacts]);

  const updateQuery = useCallback((changes: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "" || value === "OPEN" || value === "PIPELINE" || value === 1) params.delete(key);
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
  const view: DealView = rawView === "ALL" || rawView === "WON" || rawView === "LOST" ? rawView : "OPEN";
  const mode: DisplayMode = searchParams.get("mode") === "LIST" ? "LIST" : "PIPELINE";
  const companyId = searchParams.get("companyId") ?? "";
  const ownerId = searchParams.get("ownerId") ?? "";
  const requestedStage = searchParams.get("stage") as DealStage | null;
  const stageFilter: DealStage | "" = requestedStage && PIPELINE_STAGES.includes(requestedStage) ? requestedStage : "";
  const requestedSort = searchParams.get("sort") ?? "updatedAt-desc";
  const validSorts = ["updatedAt-desc", "updatedAt-asc", "value-desc", "value-asc", "closeDate-asc", "closeDate-desc", "probability-desc", "probability-asc"] as const;
  const sort = validSorts.includes(requestedSort as (typeof validSorts)[number]) ? requestedSort : "updatedAt-desc";
  const [sortBy, sortOrder] = sort.split("-") as ["updatedAt" | "value" | "closeDate" | "probability", "asc" | "desc"];
  const requestedPage = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const companyNameById = useMemo(() => new Map(companies.map((company) => [company.id, company.name])), [companies]);
  const ownerNameById = useMemo(() => new Map(owners.map((owner) => [owner.id, owner.name])), [owners]);

  const counts = useMemo(() => ({
    open: records.filter((deal) => OPEN_DEAL_STAGES.includes(deal.stage)).length,
    won: records.filter((deal) => deal.stage === "WON").length,
    lost: records.filter((deal) => deal.stage === "LOST").length,
    all: records.length,
  }), [records]);

  const metrics = useMemo(() => {
    const open = records.filter((deal) => OPEN_DEAL_STAGES.includes(deal.stage));
    const openValue = open.reduce((sum, deal) => sum + deal.value, 0);
    const weighted = open.reduce((sum, deal) => sum + deal.value * (deal.probability / 100), 0);
    const avgProbability = open.length ? Math.round(open.reduce((sum, deal) => sum + deal.probability, 0) / open.length) : 0;
    return { openValue, weighted, avgProbability };
  }, [records]);

  const filtered = useMemo(() => {
    const needle = urlSearch.trim().toLowerCase();
    const list = records.filter((deal) => {
      if (!matchesView(deal, view)) return false;
      if (companyId && deal.companyId !== companyId) return false;
      if (ownerId && deal.ownerId !== ownerId) return false;
      if (stageFilter && deal.stage !== stageFilter) return false;
      if (!needle) return true;
      return [deal.title, companyNameById.get(deal.companyId) ?? deal.company, ownerNameById.get(deal.ownerId) ?? deal.owner, deal.description ?? ""]
        .some((value) => value.toLowerCase().includes(needle));
    });
    return [...list].sort((a, b) => {
      let result = 0;
      if (sortBy === "updatedAt") result = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === "value") result = a.value - b.value;
      if (sortBy === "probability") result = a.probability - b.probability;
      if (sortBy === "closeDate") result = new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
      return sortOrder === "asc" ? result : -result;
    });
  }, [records, view, companyId, ownerId, stageFilter, urlSearch, sortBy, sortOrder, companyNameById, ownerNameById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (requestedPage > totalPages) updateQuery({ page: totalPages });
  }, [requestedPage, totalPages, updateQuery]);

  function commit(next: Deal[], message: string) {
    setRecords(next);
    persistMockDeals(next);
    setToast(message);
  }

  function saveDeal(values: DealPayload) {
    const company = companies.find((item) => item.id === values.companyId);
    const owner = owners.find((item) => item.id === values.ownerId);
    if (!company || !owner) return;
    const now = new Date().toISOString();
    if (editor?.mode === "edit" && editor.deal) {
      const next = records.map((item) => item.id === editor.deal?.id ? {
        ...item,
        ...values,
        company: company.name,
        owner: owner.name,
        lostReason: values.stage === "LOST" ? item.lostReason : undefined,
        closedAt: values.stage === "WON" || values.stage === "LOST" ? item.closedAt ?? now : null,
        updatedAt: now,
      } : item);
      commit(next, `${values.title} updated.`);
    } else {
      const deal: Deal = {
        id: makeId(values.title),
        ...values,
        company: company.name,
        owner: owner.name,
        lostReason: undefined,
        closedAt: values.stage === "WON" || values.stage === "LOST" ? now : null,
        createdAt: now,
        updatedAt: now,
      };
      commit([deal, ...records], `${values.title} created.`);
      setSearch("");
      updateQuery({ view: "OPEN", search: null, page: 1, sort: "updatedAt-desc" });
    }
    setEditor(null);
  }

  function moveDeal(deal: Deal, stage: DealStage) {
    if (stage === deal.stage) return;
    if (stage === "LOST") {
      setLostReason(deal.lostReason ?? "");
      setLostTarget({ deal, previousStage: deal.stage });
      return;
    }
    const now = new Date().toISOString();
    const next = records.map((item) => item.id === deal.id ? {
      ...item,
      stage,
      probability: STAGE_PROBABILITY[stage],
      lostReason: undefined,
      closedAt: stage === "WON" ? now : null,
      updatedAt: now,
    } : item);
    commit(next, `${deal.title} moved to ${stage}.`);
  }

  function confirmLost() {
    if (!lostTarget || !lostReason.trim()) return;
    const now = new Date().toISOString();
    const next = records.map((item) => item.id === lostTarget.deal.id ? {
      ...item,
      stage: "LOST" as const,
      probability: 0,
      lostReason: lostReason.trim(),
      closedAt: now,
      updatedAt: now,
    } : item);
    commit(next, `${lostTarget.deal.title} marked lost.`);
    setLostTarget(null);
    setLostReason("");
  }

  function onDragStart(event: DragEvent<HTMLElement>, deal: Deal) {
    setDraggedId(deal.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", deal.id);
  }

  function onDrop(event: DragEvent<HTMLElement>, stage: DealStage) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain") || draggedId;
    const deal = records.find((item) => item.id === id);
    setDraggedId(null);
    setDragOverStage(null);
    if (deal) moveDeal(deal, stage);
  }

  const start = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <>
      <div className="page-header deals-page-header">
        <div>
          <div className="eyebrow">CRM / 03 ──</div>
          <h1>Deals</h1>
          <p>Commercial opportunities from first signal to committed delivery, with a deliberately compact pipeline model.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setEditor({ mode: "create" })}><PlusIcon />New deal</button>
      </div>

      <section className="deal-metrics" aria-label="Pipeline metrics">
        <div><span>Open pipeline</span><strong>{currency(metrics.openValue)}</strong><small>{counts.open} active opportunities</small></div>
        <div><span>Weighted pipeline</span><strong>{currency(metrics.weighted)}</strong><small>Value × current probability</small></div>
        <div><span>Average probability</span><strong>{metrics.avgProbability}%</strong><small>Across open opportunities</small></div>
        <div><span>Closed</span><strong>{counts.won} / {counts.lost}</strong><small>Won / lost opportunities</small></div>
      </section>

      <div className="company-toolbar deals-toolbar" aria-label="Deal filters" aria-busy={isNavigating}>
        <div className="filter-tabs">
          <button className={`filter ${view === "OPEN" ? "active" : ""}`} type="button" onClick={() => updateQuery({ view: "OPEN", stage: null, page: 1 })}>Open <span>{counts.open}</span></button>
          <button className={`filter ${view === "ALL" ? "active" : ""}`} type="button" onClick={() => updateQuery({ view: "ALL", stage: null, page: 1 })}>All <span>{counts.all}</span></button>
          <button className={`filter ${view === "WON" ? "active" : ""}`} type="button" onClick={() => updateQuery({ view: "WON", stage: null, page: 1 })}>Won <span>{counts.won}</span></button>
          <button className={`filter ${view === "LOST" ? "active" : ""}`} type="button" onClick={() => updateQuery({ view: "LOST", stage: null, page: 1 })}>Lost <span>{counts.lost}</span></button>
        </div>

        <div className="company-toolbar-tools deal-toolbar-tools">
          <label className="inline-search deal-search">
            <SearchIcon />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search opportunity, account, owner..." aria-label="Search deals" />
            {urlSearch && <button type="button" onClick={() => { setSearch(""); updateQuery({ search: null, page: 1 }); }}>Clear</button>}
          </label>
          <label className="sort-control deal-select-control">
            <span>Account</span>
            <select value={companyId} onChange={(event) => updateQuery({ companyId: event.target.value || null, page: 1 })}>
              <option value="">All companies</option>
              {companies.filter((item) => !item.archivedAt).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
          <label className="sort-control deal-select-control compact-control">
            <span>Owner</span>
            <select value={ownerId} onChange={(event) => updateQuery({ ownerId: event.target.value || null, page: 1 })}>
              <option value="">All owners</option>
              {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
            </select>
          </label>
          <label className="sort-control deal-select-control compact-control">
            <span>Stage</span>
            <select value={stageFilter} onChange={(event) => updateQuery({ stage: event.target.value || null, view: "OPEN", page: 1 })}>
              <option value="">All stages</option>
              {OPEN_DEAL_STAGES.map((stage) => <option key={stage} value={stage}>{stage.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label className="sort-control deal-select-control compact-control">
            <span>Sort</span>
            <select value={sort} onChange={(event) => updateQuery({ sort: event.target.value, page: 1 })}>
              <option value="updatedAt-desc">Recently updated</option>
              <option value="value-desc">Highest value</option>
              <option value="value-asc">Lowest value</option>
              <option value="probability-desc">Highest probability</option>
              <option value="closeDate-asc">Closing soonest</option>
              <option value="closeDate-desc">Closing latest</option>
            </select>
          </label>
          <div className="segmented deal-view-toggle" aria-label="Deal view">
            <button className={mode === "PIPELINE" ? "active" : ""} type="button" onClick={() => updateQuery({ mode: "PIPELINE", page: 1 })}>Pipeline</button>
            <button className={mode === "LIST" ? "active" : ""} type="button" onClick={() => updateQuery({ mode: "LIST", page: 1 })}>List</button>
          </div>
        </div>
      </div>

      {mode === "PIPELINE" ? (
        <div className="kanban deal-kanban" aria-label="Deal pipeline">
          {PIPELINE_STAGES.filter((stage) => view === "ALL" || view === "OPEN" ? (view === "ALL" || OPEN_DEAL_STAGES.includes(stage)) : stage === view).map((stage) => {
            const stageDeals = filtered.filter((deal) => deal.stage === stage);
            return (
              <section
                className={`kanban-column ${dragOverStage === stage ? "drag-over" : ""}`}
                key={stage}
                onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDragOverStage(stage); }}
                onDragLeave={() => setDragOverStage((current) => current === stage ? null : current)}
                onDrop={(event) => onDrop(event, stage)}
              >
                <div className="kanban-head">
                  <div><strong>{stage}</strong><span>{stageDeals.length}</span></div>
                  <small>{currency(stageDeals.reduce((sum, deal) => sum + deal.value, 0))}</small>
                </div>
                <div className="kanban-stack">
                  {stageDeals.map((deal) => (
                    <article className={`deal-card ${draggedId === deal.id ? "is-dragging" : ""}`} key={deal.id} draggable onDragStart={(event) => onDragStart(event, deal)} onDragEnd={() => { setDraggedId(null); setDragOverStage(null); }}>
                      <div className="deal-card-top"><span className="deal-id">{deal.id.toUpperCase()}</span><Badge tone={dealStageTone(deal.stage)}>{deal.stage}</Badge></div>
                      <Link href={`/deals/${deal.id}` as Route} className="deal-card-title"><h3>{deal.title}</h3></Link>
                      <p>{companyNameById.get(deal.companyId) ?? deal.company}</p>
                      <div className="deal-value">{currency(deal.value)}</div>
                      <div className="deal-card-foot"><span>{ownerNameById.get(deal.ownerId) ?? deal.owner}</span><span>{deal.probability}%</span></div>
                      <div className="probability"><span style={{ width: `${deal.probability}%` }} /></div>
                      <small>Expected close · {formatDealDate(deal.closeDate)}</small>
                      <div className="deal-card-actions">
                        <label><span className="sr-only">Move {deal.title}</span><select value={deal.stage} onChange={(event) => moveDeal(deal, event.target.value as DealStage)}>{PIPELINE_STAGES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                        <button type="button" onClick={() => setEditor({ mode: "edit", deal })}>Edit</button>
                        <Link href={`/deals/${deal.id}` as Route} aria-label={`Open ${deal.title}`}><ArrowIcon /></Link>
                      </div>
                    </article>
                  ))}
                  {!stageDeals.length && <div className="kanban-empty">Drop opportunity here</div>}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="table-panel deals-table-panel">
          <table className="deals-table">
            <thead><tr><th>Deal</th><th>Company</th><th>Stage</th><th>Value</th><th>Probability</th><th>Owner</th><th>Expected close</th><th /></tr></thead>
            <tbody>
              {pageRecords.map((deal) => <tr key={deal.id}>
                <td><Link className="entity-link" href={`/deals/${deal.id}` as Route}><span><strong>{deal.title}</strong><small>{deal.id.toUpperCase()}</small></span></Link></td>
                <td><Link href={`/companies/${deal.companyId}` as Route}>{companyNameById.get(deal.companyId) ?? deal.company}</Link></td>
                <td><Badge tone={dealStageTone(deal.stage)}>{deal.stage}</Badge></td>
                <td className="mono">{currency(deal.value)}</td>
                <td className="mono">{deal.probability}%</td>
                <td>{ownerNameById.get(deal.ownerId) ?? deal.owner}</td>
                <td>{formatDealDate(deal.closeDate)}</td>
                <td><button className="table-edit-button" type="button" onClick={() => setEditor({ mode: "edit", deal })}>Edit</button></td>
              </tr>)}
            </tbody>
          </table>
          {!pageRecords.length && <div className="data-empty"><span className="empty-code">NO_MATCHING_DEALS</span><strong>No opportunities match this view.</strong><p>Adjust the commercial filters or create a new deal.</p></div>}
          <div className="pagination-bar">
            <span>Showing {start}–{end} of {filtered.length}</span>
            <div className="pagination-controls">
              <button type="button" disabled={page <= 1} onClick={() => updateQuery({ page: page - 1 })}>Previous</button>
              <span>Page {page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => updateQuery({ page: page + 1 })}>Next</button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor?.mode === "edit" ? "Edit deal" : "Create deal"}
        eyebrow="Commercial record"
        size="lg"
        footer={<><button className="secondary-button" type="button" onClick={() => setEditor(null)}>Cancel</button><button className="primary-button" type="submit" form="deal-form">{editor?.mode === "edit" ? "Save changes" : "Create deal"}</button></>}
      >
        {editor && <DealForm deal={editor.deal} companies={companies} contacts={contacts} owners={owners} onSubmit={saveDeal} />}
      </Modal>

      <Modal
        open={Boolean(lostTarget)}
        onClose={() => { setLostTarget(null); setLostReason(""); }}
        title="Mark deal as lost"
        eyebrow="Commercial outcome"
        size="sm"
        footer={<><button className="secondary-button" type="button" onClick={() => { setLostTarget(null); setLostReason(""); }}>Cancel</button><button className="danger-button" type="button" disabled={!lostReason.trim()} onClick={confirmLost}>Mark lost</button></>}
      >
        <p className="confirm-copy">Capture a short reason so the closed pipeline stays useful for later review.</p>
        <label className="field lost-reason-field"><span>Loss reason *</span><textarea autoFocus rows={4} value={lostReason} onChange={(event) => setLostReason(event.target.value)} placeholder="e.g. Budget deferred, internal build selected, timing mismatch..." /></label>
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
