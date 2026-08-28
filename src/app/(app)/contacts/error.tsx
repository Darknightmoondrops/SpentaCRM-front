"use client";

export default function ContactsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="record-not-found">
      <div className="eyebrow">CRM / CONTACTS / ERROR ──</div>
      <h1>Contacts could not be loaded</h1>
      <p>The stakeholder workspace failed to render. Retry the route without losing the rest of the CRM shell.</p>
      <button className="primary-button" type="button" onClick={reset}>Retry contacts</button>
    </div>
  );
}
