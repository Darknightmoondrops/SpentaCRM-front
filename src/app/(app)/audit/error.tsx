"use client";
export default function Error({ reset }: { reset: () => void }){ return <section className="route-error"><div className="eyebrow">AUDIT ERROR</div><h2>Audit history could not be loaded.</h2><p>Retry this read-only governance surface.</p><button className="primary-button" onClick={reset}>Try again</button></section>; }
