"use client";
export default function ProjectsError({ reset }: { reset: () => void }) {
  return <div className="route-error"><div className="eyebrow">DELIVERY / PROJECTS / ERROR ──</div><h1>Projects could not be loaded.</h1><p>The delivery workspace failed at its route boundary. Other CRM modules remain available.</p><button className="primary-button" type="button" onClick={reset}>Retry projects</button></div>;
}
