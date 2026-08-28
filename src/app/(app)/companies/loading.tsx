export default function CompaniesLoading() {
  return (
    <div className="companies-loading" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading companies</span>
      <div className="loading-rule" />
      <div className="loading-heading" />
      <div className="loading-copy" />
      <div className="loading-toolbar" />
      <div className="loading-table">
        {Array.from({ length: 6 }, (_, index) => <div key={index} />)}
      </div>
    </div>
  );
}
