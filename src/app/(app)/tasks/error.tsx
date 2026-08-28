"use client";
export default function TasksError({ reset }: { reset: () => void }) { return <div className="route-error"><div className="eyebrow">DELIVERY / TASKS / ERROR ──</div><h1>Task queue unavailable</h1><p>The work queue could not be rendered. Existing CRM records are unaffected.</p><button className="primary-button" type="button" onClick={reset}>Retry</button></div>; }
