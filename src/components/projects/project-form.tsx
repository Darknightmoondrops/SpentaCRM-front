"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { ProjectPayload } from "@/lib/project-api";
import { PROJECT_HEALTH, PROJECT_STATUSES } from "@/lib/project-utils";
import type { Company, Deal, Project, ProjectHealth, ProjectStatus, WorkspaceUser } from "@/lib/types";

type Errors = Partial<Record<keyof ProjectPayload, string>>;

function initialValues(project?: Project, sourceDeal?: Deal): ProjectPayload {
  return {
    title: project?.title ?? sourceDeal?.title ?? "",
    companyId: project?.companyId ?? sourceDeal?.companyId ?? "",
    sourceDealId: project?.sourceDealId ?? sourceDeal?.id ?? "",
    status: project?.status ?? "PLANNED",
    health: project?.health ?? "ON_TRACK",
    ownerId: project?.ownerId ?? sourceDeal?.ownerId ?? "",
    memberIds: project?.memberIds ?? (sourceDeal?.ownerId ? [sourceDeal.ownerId] : []),
    progress: project?.progress ?? 0,
    startDate: project?.startDate ?? new Date().toISOString().slice(0, 10),
    targetDate: project?.targetDate ?? "",
    description: project?.description ?? sourceDeal?.description ?? "",
  };
}

export function ProjectForm({
  project,
  companies,
  wonDeals,
  owners,
  defaultSourceDealId,
  onSubmit,
}: {
  project?: Project;
  companies: Company[];
  wonDeals: Deal[];
  owners: WorkspaceUser[];
  defaultSourceDealId?: string;
  onSubmit: (values: ProjectPayload) => void;
}) {
  const defaultDeal = wonDeals.find((deal) => deal.id === defaultSourceDealId);
  const [values, setValues] = useState<ProjectPayload>(() => initialValues(project, defaultDeal));
  const [errors, setErrors] = useState<Errors>({});
  const company = useMemo(() => companies.find((item) => item.id === values.companyId), [companies, values.companyId]);

  function set<K extends keyof ProjectPayload>(key: K, value: ProjectPayload[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function chooseSourceDeal(sourceDealId: string) {
    const deal = wonDeals.find((item) => item.id === sourceDealId);
    setValues((current) => ({
      ...current,
      sourceDealId: sourceDealId || undefined,
      companyId: deal?.companyId ?? current.companyId,
      title: deal && !current.title.trim() ? deal.title : current.title,
      ownerId: deal?.ownerId ?? current.ownerId,
      memberIds: deal?.ownerId && !current.memberIds.length ? [deal.ownerId] : current.memberIds,
      description: deal && !current.description?.trim() ? deal.description : current.description,
    }));
    setErrors((current) => ({ ...current, sourceDealId: undefined, companyId: undefined, ownerId: undefined }));
  }

  function toggleMember(id: string) {
    set("memberIds", values.memberIds.includes(id) ? values.memberIds.filter((item) => item !== id) : [...values.memberIds, id]);
  }

  function validate() {
    const next: Errors = {};
    if (!values.title.trim()) next.title = "Project title is required.";
    if (!values.companyId) next.companyId = "Link the project to a company.";
    if (!values.ownerId) next.ownerId = "Assign a project owner.";
    if (!values.startDate) next.startDate = "Start date is required.";
    if (!values.targetDate) next.targetDate = "Target date is required.";
    if (values.startDate && values.targetDate && new Date(values.targetDate) < new Date(values.startDate)) next.targetDate = "Target date must be on or after the start date.";
    if (!Number.isFinite(values.progress) || values.progress < 0 || values.progress > 100) next.progress = "Progress must be between 0 and 100.";
    if (!values.memberIds.includes(values.ownerId) && values.ownerId) next.memberIds = "The project owner must also be part of the delivery team.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...values,
      title: values.title.trim(),
      sourceDealId: values.sourceDealId || undefined,
      description: values.description?.trim() || undefined,
      progress: Number(values.progress),
    });
  }

  return (
    <form id="project-form" className="record-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <label className="field form-span-2">
          <span>Project title *</span>
          <input autoFocus value={values.title} onChange={(event) => set("title", event.target.value)} placeholder="e.g. Ground Operations Dashboard delivery" />
          {errors.title && <small className="field-error">{errors.title}</small>}
        </label>

        <label className="field form-span-2">
          <span>Source won deal</span>
          <select value={values.sourceDealId ?? ""} onChange={(event) => chooseSourceDeal(event.target.value)} disabled={Boolean(project?.sourceDealId)}>
            <option value="">Manual project / no source deal</option>
            {wonDeals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title} · {deal.company}</option>)}
          </select>
          <small className="field-hint">A source deal preserves commercial provenance. Existing source links are immutable in the frontend contract.</small>
        </label>

        <label className="field form-span-2">
          <span>Company *</span>
          <select value={values.companyId} onChange={(event) => set("companyId", event.target.value)} disabled={Boolean(values.sourceDealId)}>
            <option value="">Select company</option>
            {companies.filter((item) => !item.archivedAt).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          {errors.companyId ? <small className="field-error">{errors.companyId}</small> : company && <small className="field-hint">Delivery account: {company.name} · {company.industry}</small>}
        </label>

        <label className="field">
          <span>Owner *</span>
          <select value={values.ownerId} onChange={(event) => {
            const ownerId = event.target.value;
            setValues((current) => ({ ...current, ownerId, memberIds: ownerId && !current.memberIds.includes(ownerId) ? [...current.memberIds, ownerId] : current.memberIds }));
            setErrors((current) => ({ ...current, ownerId: undefined, memberIds: undefined }));
          }}>
            <option value="">Select owner</option>
            {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
          </select>
          {errors.ownerId && <small className="field-error">{errors.ownerId}</small>}
        </label>

        <label className="field">
          <span>Status</span>
          <select value={values.status} onChange={(event) => set("status", event.target.value as ProjectStatus)}>
            {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Delivery health</span>
          <select value={values.health} onChange={(event) => set("health", event.target.value as ProjectHealth)}>
            {PROJECT_HEALTH.map((health) => <option key={health} value={health}>{health.replaceAll("_", " ")}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Progress</span>
          <input type="number" min={0} max={100} step={5} value={values.progress} onChange={(event) => set("progress", Number(event.target.value))} />
          {errors.progress && <small className="field-error">{errors.progress}</small>}
        </label>

        <label className="field">
          <span>Start date *</span>
          <input type="date" value={values.startDate} onChange={(event) => set("startDate", event.target.value)} />
          {errors.startDate && <small className="field-error">{errors.startDate}</small>}
        </label>

        <label className="field">
          <span>Target date *</span>
          <input type="date" value={values.targetDate} onChange={(event) => set("targetDate", event.target.value)} />
          {errors.targetDate && <small className="field-error">{errors.targetDate}</small>}
        </label>

        <fieldset className="field form-span-2 project-team-picker">
          <legend>Delivery team</legend>
          <div className="project-team-options">
            {owners.map((owner) => <label key={owner.id} className={values.memberIds.includes(owner.id) ? "selected" : ""}><input type="checkbox" checked={values.memberIds.includes(owner.id)} onChange={() => toggleMember(owner.id)} /><span className="mini-avatar">{owner.initials}</span><span>{owner.name}</span></label>)}
          </div>
          {errors.memberIds ? <small className="field-error">{errors.memberIds}</small> : <small className="field-hint">Keep this lightweight: team membership here provides CRM delivery context, not resource planning.</small>}
        </fieldset>

        <label className="field form-span-2">
          <span>Delivery context</span>
          <textarea rows={5} value={values.description ?? ""} onChange={(event) => set("description", event.target.value)} placeholder="Outcome, delivery boundary, dependencies, deployment context..." />
          <small className="field-hint">Use Tasks and Activities for changing work. Keep stable project context here.</small>
        </label>
      </div>
      <button type="submit" hidden aria-hidden="true" />
    </form>
  );
}
