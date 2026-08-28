"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { ActivityPayload, ActivityType } from "@/lib/activity-api";
import type { RelationType, WorkspaceUser } from "@/lib/types";
import type { RelationOption } from "@/lib/relation-options";

export function ActivityForm({ relations, owners, defaultRelation, onSubmit }: { relations: RelationOption[]; owners: WorkspaceUser[]; defaultRelation?: { type: RelationType; id: string }; onSubmit: (values: ActivityPayload) => void }) {
  const [type, setType] = useState<ActivityType>("MEETING");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [actorId, setActorId] = useState(owners[0]?.id ?? "");
  const [relationType, setRelationType] = useState<RelationType>(defaultRelation?.type ?? "COMPANY");
  const [relationId, setRelationId] = useState(defaultRelation?.id ?? "");
  const [occurredAt, setOccurredAt] = useState(() => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); });
  const [error, setError] = useState("");
  const filteredRelations = useMemo(() => relations.filter((item) => item.type === relationType), [relations, relationType]);
  useEffect(() => { if (!filteredRelations.some((item) => item.id === relationId)) setRelationId(filteredRelations[0]?.id ?? ""); }, [filteredRelations, relationId]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !detail.trim() || !actorId || !relationId) { setError("Type, title, detail, actor and related record are required."); return; }
    onSubmit({ type, title: title.trim(), detail: detail.trim(), actorId, relationType, relationId, occurredAt: new Date(occurredAt).toISOString() });
  }

  return <form id="activity-form" className="record-form" onSubmit={submit}>
    <label className="field"><span>Activity type *</span><select value={type} onChange={(event) => setType(event.target.value as ActivityType)}><option value="MEETING">Meeting</option><option value="CALL">Call</option><option value="EMAIL">Email</option><option value="NOTE">Note</option></select></label>
    <label className="field"><span>Occurred at *</span><input type="datetime-local" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} /></label>
    <label className="field"><span>Actor *</span><select value={actorId} onChange={(event) => setActorId(event.target.value)}>{owners.map((owner) => <option value={owner.id} key={owner.id}>{owner.name}</option>)}</select></label>
    <label className="field field-span-2"><span>Title *</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Requirements meeting" /></label>
    <label className="field field-span-2"><span>Detail *</span><textarea rows={4} value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="Capture the material outcome, decision or customer context..." /></label>
    <label className="field"><span>Relation type *</span><select value={relationType} onChange={(event) => setRelationType(event.target.value as RelationType)}><option value="COMPANY">Company</option><option value="CONTACT">Contact</option><option value="DEAL">Deal</option><option value="PROJECT">Project</option></select></label>
    <label className="field"><span>Related record *</span><select value={relationId} onChange={(event) => setRelationId(event.target.value)}>{filteredRelations.map((item) => <option value={item.id} key={`${item.type}-${item.id}`}>{item.label} — {item.meta}</option>)}</select></label>
    {error && <small className="field-error field-span-2">{error}</small>}
  </form>;
}
