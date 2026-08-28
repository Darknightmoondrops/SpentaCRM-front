"use client";
import Link from "next/link";
export default function ProjectDetailError({ reset }: { reset: () => void }) {
  return <div className="route-error"><div className="eyebrow">DELIVERY / PROJECT / ERROR ──</div><h1>Project context could not be loaded.</h1><p>The project detail boundary failed without taking down the rest of the CRM workspace.</p><div className="route-error-actions"><button className="primary-button" type="button" onClick={reset}>Retry project</button><Link className="secondary-button" href="/projects">Back to projects</Link></div></div>;
}
