"use client";
export default function Error({ reset }: { reset: () => void }){ return <section className="route-error"><div className="eyebrow">SETTINGS ERROR</div><h2>Settings could not be loaded.</h2><p>Retry the workspace settings surface without leaving the CRM.</p><button className="primary-button" onClick={reset}>Try again</button></section>; }
