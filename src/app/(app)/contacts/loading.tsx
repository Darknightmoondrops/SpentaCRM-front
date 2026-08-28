export default function ContactsLoading() {
  return (
    <div className="companies-loading" role="status" aria-live="polite">
      <div className="eyebrow">CRM / 02 ──</div>
      <div className="skeleton-line skeleton-line-heading" />
      <div className="loading-toolbar" />
      <div className="loading-table">{Array.from({ length: 6 }).map((_, index) => <div key={index} />)}</div>
      <span className="sr-only">Loading contacts</span>
    </div>
  );
}
