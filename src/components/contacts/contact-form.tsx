"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { ContactPayload } from "@/lib/contact-api";
import type { Company, Contact, ContactChannel } from "@/lib/types";

const CHANNELS: ContactChannel[] = ["EMAIL", "PHONE", "MEETING"];
type Errors = Partial<Record<keyof ContactPayload, string>>;

function initialValues(contact?: Contact, defaultCompanyId?: string): ContactPayload {
  return {
    name: contact?.name ?? "",
    role: contact?.role ?? "",
    department: contact?.department ?? "",
    companyId: contact?.companyId ?? defaultCompanyId ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    preferredChannel: contact?.preferredChannel ?? "EMAIL",
    isPrimary: contact?.isPrimary ?? false,
    linkedin: contact?.linkedin ?? "",
    notes: contact?.notes ?? "",
  };
}

export function ContactForm({ contact, companies, defaultCompanyId, onSubmit }: { contact?: Contact; companies: Company[]; defaultCompanyId?: string; onSubmit: (values: ContactPayload) => void }) {
  const [values, setValues] = useState<ContactPayload>(() => initialValues(contact, defaultCompanyId));
  const [errors, setErrors] = useState<Errors>({});
  const company = useMemo(() => companies.find((item) => item.id === values.companyId), [companies, values.companyId]);

  function set<K extends keyof ContactPayload>(key: K, value: ContactPayload[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validate() {
    const next: Errors = {};
    if (!values.name.trim()) next.name = "Contact name is required.";
    if (!values.role.trim()) next.role = "Role or job title is required.";
    if (!values.companyId) next.companyId = "Link the contact to a company.";
    if (!values.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = "Enter a valid email address.";
    if (values.linkedin?.trim() && !/^(https?:\/\/)?(www\.)?linkedin\.com\//i.test(values.linkedin.trim())) next.linkedin = "Use a LinkedIn profile URL.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...values,
      name: values.name.trim(),
      role: values.role.trim(),
      department: values.department?.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      linkedin: values.linkedin?.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""),
      notes: values.notes?.trim(),
    });
  }

  return (
    <form id="contact-form" className="record-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <label className="field form-span-2">
          <span>Full name *</span>
          <input autoFocus value={values.name} onChange={(event) => set("name", event.target.value)} placeholder="e.g. Anna Keller" autoComplete="name" />
          {errors.name && <small className="field-error">{errors.name}</small>}
        </label>

        <label className="field">
          <span>Role / title *</span>
          <input value={values.role} onChange={(event) => set("role", event.target.value)} placeholder="Program Manager" />
          {errors.role && <small className="field-error">{errors.role}</small>}
        </label>

        <label className="field">
          <span>Department</span>
          <input value={values.department ?? ""} onChange={(event) => set("department", event.target.value)} placeholder="Digital Operations" />
        </label>

        <label className="field form-span-2">
          <span>Company *</span>
          <select value={values.companyId} onChange={(event) => set("companyId", event.target.value)}>
            <option value="">Select company</option>
            {companies.filter((item) => !item.archivedAt).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          {errors.companyId ? <small className="field-error">{errors.companyId}</small> : company && <small className="field-hint">Account: {company.name} · {company.industry}</small>}
        </label>

        <label className="field">
          <span>Email *</span>
          <input type="email" value={values.email} onChange={(event) => set("email", event.target.value)} placeholder="anna@company.com" autoComplete="email" />
          {errors.email && <small className="field-error">{errors.email}</small>}
        </label>

        <label className="field">
          <span>Phone</span>
          <input type="tel" value={values.phone} onChange={(event) => set("phone", event.target.value)} placeholder="+49 ..." autoComplete="tel" />
        </label>

        <label className="field">
          <span>Preferred channel</span>
          <select value={values.preferredChannel} onChange={(event) => set("preferredChannel", event.target.value as ContactChannel)}>
            {CHANNELS.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
          </select>
        </label>

        <label className="field">
          <span>LinkedIn</span>
          <input value={values.linkedin ?? ""} onChange={(event) => set("linkedin", event.target.value)} placeholder="linkedin.com/in/..." inputMode="url" />
          {errors.linkedin && <small className="field-error">{errors.linkedin}</small>}
        </label>

        <label className="field form-span-2 checkbox-field">
          <input type="checkbox" checked={values.isPrimary} onChange={(event) => set("isPrimary", event.target.checked)} />
          <span><strong>Primary company contact</strong><small>If enabled, any existing primary contact for this company will be replaced.</small></span>
        </label>

        <label className="field form-span-2">
          <span>Contact context</span>
          <textarea value={values.notes ?? ""} onChange={(event) => set("notes", event.target.value)} placeholder="Stakeholder context, decision role, communication preferences..." rows={5} />
          <small className="field-hint">Keep interaction history in Activities; use this field for stable stakeholder context.</small>
        </label>
      </div>
      <button type="submit" hidden aria-hidden="true" />
    </form>
  );
}
