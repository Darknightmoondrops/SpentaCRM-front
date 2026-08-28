"use client";

import { DashboardSlotError } from "@/components/dashboard/dashboard-slot-error";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardSlotError title="Recent activity" reset={reset} />;
}
