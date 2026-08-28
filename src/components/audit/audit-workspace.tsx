"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AccessBoundary } from "@/auth/access-boundary";
import { auditEvents } from "@/lib/mock-audit-data";
import type { AuditAction, AuditEvent } from "@/lib/types";
import { Modal } from "@/components/overlay";
import { Badge, PageHeader } from "@/components/ui";

const PAGE_SIZE = 6;
const actions: (AuditAction | "ALL")[] = ["ALL", "LOGIN", "CREATE", "UPDATE", "STATUS_CHANGE", "ARCHIVE", "ROLE_CHANGE", "SETTINGS_UPDATE", "EXTENSION_CHANGE"];

function actionTone(action: AuditAction): "neutral" | "green" | "red" | "blue" { return action === "ARCHIVE" ? "red" : action === "LOGIN" ? "green" : action === "ROLE_CHANGE" || action === "SETTINGS_UPDATE" ? "blue" : "neutral"; }

export function AuditWorkspace() {
  const search = useSearchParams(); const router = useRouter(); const pathname = usePathname();
  const [query, setQuery] = useState(search.get("q") ?? ""); const deferredQuery = useDeferredValue(query);
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const actorId = search.get("actorId") ?? "ALL"; const action = (search.get("action") ?? "ALL") as AuditAction | "ALL"; const entityType = search.get("entityType") ?? "ALL"; const page = Math.max(1, Number(search.get("page") ?? 1));
  const actors = useMemo(() => Array.from(new Map(auditEvents.map((event) => [event.actorId, event.actor])).entries()), []);
  const entities = useMemo(() => Array.from(new Set(auditEvents.map((event) => event.entityType))).sort(), []);

  function setParam(key: string, value: string) { const params = new URLSearchParams(search.toString()); if (!value || value === "ALL") params.delete(key); else params.set(key, value); params.set("page", "1"); router.replace(`${pathname}?${params.toString()}`, { scroll: false }); }
  function setPage(nextPage: number) { const params = new URLSearchParams(search.toString()); params.set("page", String(nextPage)); router.replace(`${pathname}?${params.toString()}`, { scroll: false }); }
  function commitSearch(value: string) { const params = new URLSearchParams(search.toString()); if (value.trim()) params.set("q", value.trim()); else params.delete("q"); params.set("page", "1"); router.replace(`${pathname}?${params.toString()}`, { scroll: false }); }

  const filtered = useMemo(() => auditEvents.filter((event) => {
    const needle = deferredQuery.trim().toLowerCase();
    return (!needle || [event.actor, event.actorEmail, event.entityLabel, event.summary, event.requestId].some((value) => value?.toLowerCase().includes(needle))) && (actorId === "ALL" || event.actorId === actorId) && (action === "ALL" || event.action === action) && (entityType === "ALL" || event.entityType === entityType);
  }), [action, actorId, deferredQuery, entityType]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return <AccessBoundary permission="audit:read"><PageHeader eyebrow="GOVERNANCE" title="Audit log" description="Read-only history of security, access and business-record changes. The backend will own append-only audit persistence." action={null}/>
    <div className="audit-summary"><div><span>Events</span><strong>{auditEvents.length}</strong></div><div><span>Actors</span><strong>{actors.length}</strong></div><div><span>Security events</span><strong>{auditEvents.filter((event) => ["LOGIN", "LOGOUT", "ROLE_CHANGE"].includes(event.action)).length}</strong></div><div><span>Retention</span><strong>365d</strong></div></div>
    <section className="audit-toolbar"><div className="inline-search audit-search"><input value={query} onChange={(e) => setQuery(e.target.value)} onBlur={() => commitSearch(query)} onKeyDown={(e) => e.key === "Enter" && commitSearch(query)} placeholder="Search actor, entity, request ID..." /></div><select value={actorId} onChange={(e) => setParam("actorId", e.target.value)}><option value="ALL">All actors</option>{actors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><select value={action} onChange={(e) => setParam("action", e.target.value)}>{actions.map((item) => <option key={item} value={item}>{item === "ALL" ? "All actions" : item.replaceAll("_", " ")}</option>)}</select><select value={entityType} onChange={(e) => setParam("entityType", e.target.value)}><option value="ALL">All entity types</option>{entities.map((entity) => <option key={entity}>{entity}</option>)}</select></section>
    <div className="table-panel audit-table-panel"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Summary</th><th>Request</th></tr></thead><tbody>{rows.map((event) => <tr key={event.id} onClick={() => setSelected(event)} className="clickable-row"><td className="mono-cell">{new Date(event.occurredAt).toLocaleString()}</td><td><div className="audit-actor"><strong>{event.actor}</strong><span>{event.actorEmail}</span></div></td><td><Badge tone={actionTone(event.action)}>{event.action.replaceAll("_", " ")}</Badge></td><td><strong>{event.entityType}</strong><span className="audit-entity-label">{event.entityLabel}</span></td><td>{event.summary}</td><td className="mono-cell">{event.requestId}</td></tr>)}</tbody></table>{rows.length === 0 && <div className="data-empty"><strong>No audit events match these filters.</strong><span>Change the filters or search query to widen the result set.</span></div>}</div>
    <div className="pagination"><span>{filtered.length} events</span><div><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>{Math.min(page, totalPages)} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button></div></div>
    <AuditDetail event={selected} onClose={() => setSelected(null)} />
  </AccessBoundary>;
}

function AuditDetail({ event, onClose }: { event: AuditEvent | null; onClose: () => void }) {
  return <Modal open={Boolean(event)} onClose={onClose} title="Audit event" eyebrow="Immutable record" size="lg">{event && <div className="audit-detail"><div className="audit-detail-hero"><Badge tone={actionTone(event.action)}>{event.action.replaceAll("_", " ")}</Badge><h3>{event.summary}</h3><p>{event.entityType} · {event.entityLabel}</p></div><dl className="audit-meta"><div><dt>Event ID</dt><dd>{event.id}</dd></div><div><dt>Occurred</dt><dd>{new Date(event.occurredAt).toLocaleString()}</dd></div><div><dt>Actor</dt><dd>{event.actor}<br/><span>{event.actorEmail}</span></dd></div><div><dt>Request ID</dt><dd>{event.requestId}</dd></div><div><dt>IP address</dt><dd>{event.ipAddress}</dd></div><div><dt>User agent</dt><dd>{event.userAgent}</dd></div></dl><div className="audit-diff-grid"><AuditJson title="Before" value={event.before}/><AuditJson title="After" value={event.after}/></div>{event.metadata && <AuditJson title="Metadata" value={event.metadata}/>}<div className="audit-integrity"><span className="status-dot"/><div><strong>Read-only event</strong><p>The production API must never expose update/delete endpoints for audit records.</p></div></div></div>}</Modal>;
}

function AuditJson({ title, value }: { title: string; value?: Record<string, unknown> | null }) { return <section className="audit-json"><div className="eyebrow">{title}</div><pre>{value ? JSON.stringify(value, null, 2) : "—"}</pre></section>; }
