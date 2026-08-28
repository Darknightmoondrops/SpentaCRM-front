"use client";

export default function CompaniesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="record-not-found">
      <div className="eyebrow">CRM / COMPANIES / ERROR ──</div>
      <h1>Companies could not be loaded.</h1>
      <p>The frontend has a dedicated recovery state ready for API failures and request retries.</p>
      <button className="primary-button" type="button" onClick={reset}>Retry request</button>
    </div>
  );
}
