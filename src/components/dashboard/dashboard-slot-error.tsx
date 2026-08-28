"use client";

export function DashboardSlotError({ title, reset }: { title: string; reset: () => void }) {
  return (
    <section className="panel dashboard-slot-error" role="alert">
      <div className="eyebrow">PARTIAL DATA FAILURE ──</div>
      <h2>{title} is temporarily unavailable.</h2>
      <p>The rest of the dashboard remains usable because this surface has an independent route boundary.</p>
      <button className="secondary-button" type="button" onClick={reset}>Retry section</button>
    </section>
  );
}
