import { Suspense } from "react";
import { DashboardPanelSkeleton, DashboardSectionSkeleton, DashboardStatsSkeleton } from "@/components/dashboard/dashboard-skeletons";
import { ExtensionZone } from "@/components/extensions/extension-zone";

export default function DashboardLayout({
  children,
  stats,
  pipeline,
  priority,
  projects,
  accounts,
  activity,
}: Readonly<{
  children: React.ReactNode;
  stats: React.ReactNode;
  pipeline: React.ReactNode;
  priority: React.ReactNode;
  projects: React.ReactNode;
  accounts: React.ReactNode;
  activity: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <Suspense fallback={<DashboardStatsSkeleton />}>{stats}</Suspense>
      <ExtensionZone zone="dashboard.afterStats" />
      <div className="dashboard-grid dashboard-revenue-grid">
        <Suspense fallback={<DashboardPanelSkeleton large />}>{pipeline}</Suspense>
        <Suspense fallback={<DashboardPanelSkeleton />}>{priority}</Suspense>
      </div>
      <ExtensionZone zone="dashboard.afterPipeline" />
      <div className="dashboard-grid dashboard-operations-grid">
        <Suspense fallback={<DashboardSectionSkeleton />}>{projects}</Suspense>
        <Suspense fallback={<DashboardPanelSkeleton />}>{accounts}</Suspense>
      </div>
      <Suspense fallback={<DashboardSectionSkeleton />}>{activity}</Suspense>
      <ExtensionZone zone="dashboard.afterActivity" />
    </>
  );
}
