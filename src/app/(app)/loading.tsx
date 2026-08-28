export default function WorkspaceLoading() {
  return (
    <div className="workspace-loading" role="status" aria-live="polite">
      <div className="loading-rule" />
      <div className="loading-heading" />
      <div className="loading-copy" />
      <div className="loading-grid">
        {Array.from({ length: 4 }).map((_, index) => <div className="loading-card" key={index} />)}
      </div>
      <span className="sr-only">Loading CRM workspace</span>
    </div>
  );
}
