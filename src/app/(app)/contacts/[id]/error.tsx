"use client";

export default function ContactDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="record-not-found">
      <div className="eyebrow">CRM / CONTACT / ERROR ──</div>
      <h1>Stakeholder context could not be loaded.</h1>
      <p>The contact route has its own recovery boundary, so a failed request does not take down the CRM workspace.</p>
      <button className="primary-button" type="button" onClick={reset}>Retry contact</button>
    </div>
  );
}
