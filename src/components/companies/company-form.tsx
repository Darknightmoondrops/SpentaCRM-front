"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Company, CompanyStatus, WorkspaceUser } from "@/lib/types";
import type { CompanyPayload } from "@/lib/company-api";

const INDUSTRIES = [
  "B2B SaaS",
  "Financial Services",
  "Healthcare Technology",
  "Industrial Services",
  "Logistics",
  "Manufacturing",
  "Professional Services",
  "Energy",
  "Technology",
  "Other",
];

const STATUSES: CompanyStatus[] = ["PROSPECT", "CUSTOMER", "PARTNER", "INACTIVE"];

type Errors = Partial<Record<keyof CompanyPayload, string>>;

function initialValues(company?: Company): CompanyPayload {
  return {
    name: company?.name ?? "",
    industry: company?.industry ?? "",
    status: company?.status ?? "PROSPECT",
    location: company?.location ?? "",
    website: company?.website ?? "",
    ownerId: company?.ownerId ?? "",
    description: company?.description ?? "",
  };
}

export function CompanyForm({ company, owners, onSubmit }: { company?: Company; owners: WorkspaceUser[]; onSubmit: (values: CompanyPayload) => void }) {
  const [values, setValues] = useState<CompanyPayload>(() => initialValues(company));
  const [errors, setErrors] = useState<Errors>({});

  const ownerHint = useMemo(() => owners.find((owner) => owner.id === values.ownerId)?.name, [owners, values.ownerId]);

  function set<K extends keyof CompanyPayload>(key: K, value: CompanyPayload[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validate() {
    const next: Errors = {};
    if (!values.name.trim()) next.name = "Company name is required.";
    if (!values.industry.trim()) next.industry = "Industry is required.";
    if (!values.location.trim()) next.location = "Location is required.";
    if (!values.ownerId) next.ownerId = "Assign an account owner.";
    if (values.website.trim() && !/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(values.website.trim().replace(/^https?:\/\//, ""))) {
      next.website = "Use a domain such as example.com.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...values,
      name: values.name.trim(),
      industry: values.industry.trim(),
      location: values.location.trim(),
      website: values.website.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""),
      description: values.description?.trim(),
    });
  }

  return (
    <form id="company-form" className="record-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <label className="field form-span-2">
          <span>Company name *</span>
          <input autoFocus value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Northstar Logistics" />
          {errors.name && <small className="field-error">{errors.name}</small>}
        </label>

        <label className="field">
          <span>Status *</span>
          <select value={values.status} onChange={(e) => set("status", e.target.value as CompanyStatus)}>
            {STATUSES.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Industry *</span>
          <input list="company-industries" value={values.industry} onChange={(e) => set("industry", e.target.value)} placeholder="B2B SaaS" />
          <datalist id="company-industries">{INDUSTRIES.map((industry) => <option value={industry} key={industry} />)}</datalist>
          {errors.industry && <small className="field-error">{errors.industry}</small>}
        </label>

        <label className="field">
          <span>Location *</span>
          <input value={values.location} onChange={(e) => set("location", e.target.value)} placeholder="Berlin, DE" />
          {errors.location && <small className="field-error">{errors.location}</small>}
        </label>

        <label className="field">
          <span>Website</span>
          <input value={values.website} onChange={(e) => set("website", e.target.value)} placeholder="company.com" inputMode="url" />
          {errors.website && <small className="field-error">{errors.website}</small>}
        </label>

        <label className="field form-span-2">
          <span>Account owner *</span>
          <select value={values.ownerId} onChange={(e) => set("ownerId", e.target.value)}>
            <option value="">Select owner</option>
            {owners.map((owner) => <option value={owner.id} key={owner.id}>{owner.name}</option>)}
          </select>
          {errors.ownerId ? <small className="field-error">{errors.ownerId}</small> : ownerHint && <small className="field-hint">Relationship owner: {ownerHint}</small>}
        </label>

        <label className="field form-span-2">
          <span>Account context</span>
          <textarea value={values.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Commercial context, relationship goals, renewal risks, strategic notes..." rows={5} />
          <small className="field-hint">Keep this factual and account-level. Meeting notes belong in Activities.</small>
        </label>
      </div>
      <button type="submit" hidden aria-hidden="true" />
    </form>
  );
}
