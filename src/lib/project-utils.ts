import type { ProjectHealth, ProjectStatus } from "./types";

export const PROJECT_STATUSES: ProjectStatus[] = ["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED"];
export const PROJECT_HEALTH: ProjectHealth[] = ["ON_TRACK", "AT_RISK", "BLOCKED"];

export function projectStatusTone(status: ProjectStatus) {
  if (status === "IN_PROGRESS") return "green" as const;
  if (status === "ON_HOLD") return "yellow" as const;
  if (status === "COMPLETED") return "blue" as const;
  return "neutral" as const;
}

export function projectHealthTone(health: ProjectHealth) {
  if (health === "ON_TRACK") return "green" as const;
  if (health === "AT_RISK") return "yellow" as const;
  return "red" as const;
}

export function projectHealthLabel(health: ProjectHealth) {
  return health.replace("_", " ");
}

export function formatProjectDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
