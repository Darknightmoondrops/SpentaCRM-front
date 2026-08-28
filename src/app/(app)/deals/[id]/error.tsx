"use client";

export default function DealDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="record-not-found">
      <div className="eyebrow">CRM / DEAL / ERROR ──</div>
      <h1>Commercial record could not be loaded.</h1>
      <p>The opportunity route has an isolated recovery boundary, so a failed deal request does not take down the CRM workspace.</p>
      <button className="primary-button" type="button" onClick={reset}>Retry deal</button>
    </div>
  );
}
