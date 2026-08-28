"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { TaskPayload } from "@/lib/task-api";
import type { Priority, RelationType, Task, WorkspaceUser } from "@/lib/types";
import { toLocalDateTimeInput } from "@/lib/task-utils";
import type { RelationOption } from "@/lib/relation-options";

export function TaskForm({ task, relations, owners, defaultRelation, onSubmit }: { task?: Task; relations: RelationOption[]; owners: WorkspaceUser[]; defaultRelation?: { type: RelationType; id: string }; onSubmit: (values: TaskPayload) => void }) {
  const initialType = task?.relationType ?? defaultRelation?.type ?? "COMPANY";
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [relationType, setRelationType] = useState<RelationType>(initialType);
  const [relationId, setRelationId] = useState(task?.relationId ?? defaultRelation?.id ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? owners[0]?.id ?? "");
  const [dueAt, setDueAt] = useState(toLocalDateTimeInput(task));
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "MEDIUM");
  const [error, setError] = useState("");

  const filteredRelations = useMemo(() => relations.filter((item) => item.type === relationType), [relations, relationType]);
  useEffect(() => {
    if (!filteredRelations.some((item) => item.id === relationId)) setRelationId(filteredRelations[0]?.id ?? "");
  }, [filteredRelations, relationId]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !relationId || !assigneeId || !dueAt) { setError("Title, relation, assignee and due date are required."); return; }
    onSubmit({ title: title.trim(), description: description.trim() || undefined, relationType, relationId, assigneeId, dueAt: new Date(dueAt).toISOString(), priority, status: task?.status ?? "OPEN" });
  }

  return <form id="task-form" className="record-form" onSubmit={submit}>
    <label className="field field-span-2"><span>Task title *</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Send revised proposal" /></label>
    <label className="field field-span-2"><span>Description</span><textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Context, expected outcome or hand-off details..." /></label>
    <label className="field"><span>Relation type *</span><select value={relationType} onChange={(event) => setRelationType(event.target.value as RelationType)}><option value="COMPANY">Company</option><option value="CONTACT">Contact</option><option value="DEAL">Deal</option><option value="PROJECT">Project</option></select></label>
    <label className="field"><span>Related record *</span><select value={relationId} onChange={(event) => setRelationId(event.target.value)}>{filteredRelations.map((item) => <option value={item.id} key={`${item.type}-${item.id}`}>{item.label} — {item.meta}</option>)}</select></label>
    <label className="field"><span>Assignee *</span><select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>{owners.map((owner) => <option value={owner.id} key={owner.id}>{owner.name}</option>)}</select></label>
    <label className="field"><span>Due *</span><input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
    <label className="field"><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></label>
    {error && <small className="field-error field-span-2">{error}</small>}
  </form>;
}
