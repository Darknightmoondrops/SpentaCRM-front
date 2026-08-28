export default function DealsLoading() {
  return (
    <div className="companies-loading" role="status" aria-live="polite">
      <div className="eyebrow">CRM / 03 ──</div>
      <div className="skeleton-line skeleton-line-heading" />
      <div className="deal-metrics-loading"><div /><div /><div /><div /></div>
      <div className="loading-toolbar" />
      <div className="deal-board-loading">{Array.from({ length: 4 }).map((_, index) => <div key={index}><span /><span /><span /></div>)}</div>
      <span className="sr-only">Loading deals</span>
    </div>
  );
}
