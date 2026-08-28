"use client";
export default function ActivitiesError({ reset }: { reset: () => void }) { return <div className="route-error"><div className="eyebrow">TRACEABILITY / ACTIVITY / ERROR ──</div><h1>Activity stream unavailable</h1><p>The CRM trace could not be rendered. No logged activity has been changed.</p><button className="primary-button" type="button" onClick={reset}>Retry</button></div>; }
