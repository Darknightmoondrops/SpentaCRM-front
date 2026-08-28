"use client";

export default function DealsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="record-not-found">
      <div className="eyebrow">CRM / DEALS / ERROR ──</div>
      <h1>Pipeline could not be loaded</h1>
      <p>The commercial workspace has its own recovery boundary. Retry this route without taking down the rest of the CRM.</p>
      <button className="primary-button" type="button" onClick={reset}>Retry deals</button>
    </div>
  );
}
