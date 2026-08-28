"use client";
import { DashboardSlotError } from "@/components/dashboard/dashboard-slot-error";
export default function AccountsError({ reset }: { reset: () => void }) { return <DashboardSlotError title="Account attention" reset={reset} />; }
