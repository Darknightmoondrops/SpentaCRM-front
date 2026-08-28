export function DashboardStatsSkeleton() {
  return (
    <div className="stats-grid dashboard-skeleton-grid" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => <div className="dashboard-stat-skeleton" key={index} />)}
    </div>
  );
}

export function DashboardPanelSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div className={`panel dashboard-panel-skeleton ${large ? "dashboard-panel-skeleton-large" : ""}`} aria-hidden="true">
      <div className="skeleton-line skeleton-line-short" />
      <div className="skeleton-line skeleton-line-heading" />
      <div className="skeleton-list">
        {Array.from({ length: large ? 5 : 4 }, (_, index) => <div className="skeleton-row" key={index} />)}
      </div>
    </div>
  );
}

export function DashboardSectionSkeleton() {
  return <div className="panel section-space dashboard-section-skeleton" aria-hidden="true"><div className="skeleton-line skeleton-line-short" /><div className="skeleton-line skeleton-line-heading" /><div className="skeleton-block" /></div>;
}
