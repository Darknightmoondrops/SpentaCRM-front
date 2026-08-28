"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { DealPayload } from "@/lib/deal-api";
import { dateInputValue, PIPELINE_STAGES, STAGE_PROBABILITY } from "@/lib/deal-utils";
import type { Company, Contact, Deal, DealStage, WorkspaceUser } from "@/lib/types";

type Errors = Partial<Record<keyof DealPayload, string>>;

function initialValues(deal?: Deal, defaultCompanyId?: string): DealPayload {
  return {
    title: deal?.title ?? "",
    companyId: deal?.companyId ?? defaultCompanyId ?? "",
    primaryContactId: deal?.primaryContactId ?? "",
    stage: deal?.stage ?? "NEW",
    value: deal?.value ?? 0,
    ownerId: deal?.ownerId ?? "",
    closeDate: dateInputValue(deal?.closeDate ?? ""),
    probability: deal?.probability ?? STAGE_PROBABILITY.NEW,
    description: deal?.description ?? "",
  };
}

export function DealForm({
  deal,
  companies,
  contacts,
  owners,
  defaultCompanyId,
  onSubmit,
}: {
  deal?: Deal;
  companies: Company[];
  contacts: Contact[];
  owners: WorkspaceUser[];
  defaultCompanyId?: string;
  onSubmit: (values: DealPayload) => void;
}) {
  const [values, setValues] = useState<DealPayload>(() => initialValues(deal, defaultCompanyId));
  const [errors, setErrors] = useState<Errors>({});
  const availableContacts = useMemo(() => contacts.filter((contact) => contact.companyId === values.companyId && !contact.archivedAt), [contacts, values.companyId]);
  const company = useMemo(() => companies.find((item) => item.id === values.companyId), [companies, values.companyId]);

  function set<K extends keyof DealPayload>(key: K, value: DealPayload[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function setStage(stage: DealStage) {
    setValues((current) => ({ ...current, stage, probability: STAGE_PROBABILITY[stage] }));
    setErrors((current) => ({ ...current, stage: undefined, probability: undefined }));
  }

  function setCompany(companyId: string) {
    setValues((current) => ({ ...current, companyId, primaryContactId: "" }));
    setErrors((current) => ({ ...current, companyId: undefined, primaryContactId: undefined }));
  }

  function validate() {
    const next: Errors = {};
    if (!values.title.trim()) next.title = "Deal title is required.";
    if (!values.companyId) next.companyId = "Link the deal to a company.";
    if (!values.ownerId) next.ownerId = "Assign an owner.";
    if (!values.closeDate) next.closeDate = "Expected close date is required.";
    if (!Number.isFinite(values.value) || values.value < 0) next.value = "Enter a valid non-negative deal value.";
    if (!Number.isFinite(values.probability) || values.probability < 0 || values.probability > 100) next.probability = "Probability must be between 0 and 100.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...values,
      title: values.title.trim(),
      primaryContactId: values.primaryContactId || undefined,
      description: values.description?.trim() || undefined,
      value: Number(values.value),
      probability: Number(values.probability),
    });
  }

  return (
    <form id="deal-form" className="record-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <label className="field form-span-2">
          <span>Opportunity / deal title *</span>
          <input autoFocus value={values.title} onChange={(event) => set("title", event.target.value)} placeholder="e.g. Ground Operations Dashboard" />
          {errors.title && <small className="field-error">{errors.title}</small>}
        </label>

        <label className="field form-span-2">
          <span>Company *</span>
          <select value={values.companyId} onChange={(event) => setCompany(event.target.value)}>
            <option value="">Select company</option>
            {companies.filter((item) => !item.archivedAt).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          {errors.companyId ? <small className="field-error">{errors.companyId}</small> : company && <small className="field-hint">Account: {company.name} · {company.industry}</small>}
        </label>

        <label className="field">
          <span>Primary contact</span>
          <select value={values.primaryContactId ?? ""} onChange={(event) => set("primaryContactId", event.target.value || undefined)} disabled={!values.companyId}>
            <option value="">No primary contact</option>
            {availableContacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.role}</option>)}
          </select>
          <small className="field-hint">Only active contacts linked to the selected account are shown.</small>
        </label>

        <label className="field">
          <span>Owner *</span>
          <select value={values.ownerId} onChange={(event) => set("ownerId", event.target.value)}>
            <option value="">Select owner</option>
            {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
          </select>
          {errors.ownerId && <small className="field-error">{errors.ownerId}</small>}
        </label>

        <label className="field">
          <span>Stage</span>
          <select value={values.stage} onChange={(event) => setStage(event.target.value as DealStage)}>
            {PIPELINE_STAGES.map((stage) => <option key={stage} value={stage} disabled={stage === "LOST"}>{stage === "LOST" ? "LOST — use Mark lost action" : stage}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Probability</span>
          <input type="number" min={0} max={100} step={5} value={values.probability} onChange={(event) => set("probability", Number(event.target.value))} />
          {errors.probability ? <small className="field-error">{errors.probability}</small> : <small className="field-hint">Changing the stage applies a sensible default; you can override it.</small>}
        </label>

        <label className="field">
          <span>Deal value · EUR</span>
          <input type="number" min={0} step={1000} value={values.value} onChange={(event) => set("value", Number(event.target.value))} inputMode="numeric" />
          {errors.value && <small className="field-error">{errors.value}</small>}
        </label>

        <label className="field">
          <span>Expected close *</span>
          <input type="date" value={values.closeDate} onChange={(event) => set("closeDate", event.target.value)} />
          {errors.closeDate && <small className="field-error">{errors.closeDate}</small>}
        </label>

        <label className="field form-span-2">
          <span>Commercial context</span>
          <textarea value={values.description ?? ""} onChange={(event) => set("description", event.target.value)} placeholder="Scope, outcome, buying context, constraints or commercial notes..." rows={5} />
          <small className="field-hint">Keep chronological interactions in Activities. Use this field for stable opportunity context.</small>
        </label>
      </div>
      <button type="submit" hidden aria-hidden="true" />
    </form>
  );
}
