"use client";
export default function ExtensionModuleError({ reset }: { reset:()=>void }) { return <div className="record-not-found"><span className="eyebrow">EXTENSION MODULE</span><h2>The module failed to load.</h2><p>Retry the isolated extension host.</p><button className="primary-button" onClick={reset}>Retry</button></div>; }
