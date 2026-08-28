"use client";
export default function ExtensionsError({ reset }: { reset: () => void }) {
  return <div className="record-not-found"><span className="eyebrow">EXTENSION HOST</span><h2>Extensions could not be loaded.</h2><p>Retry the extension workspace. Installed runtime themes are stored separately from core CRM data.</p><button className="primary-button" onClick={reset}>Retry</button></div>;
}
