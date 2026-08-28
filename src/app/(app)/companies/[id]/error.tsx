"use client";

export default function CompanyDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="record-not-found">
      <div className="eyebrow">CRM / COMPANY / ERROR ──</div>
      <h1>Account context could not be loaded.</h1>
      <p>The detail route has its own recovery boundary so a failed account request does not take down the rest of the CRM workspace.</p>
      <button className="primary-button" type="button" onClick={reset}>Retry request</button>
    </div>
  );
}
