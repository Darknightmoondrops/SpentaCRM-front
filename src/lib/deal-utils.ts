import type { DealStage } from "./types";

export const OPEN_DEAL_STAGES: DealStage[] = ["NEW", "CONTACTED", "PROPOSAL", "NEGOTIATION"];
export const PIPELINE_STAGES: DealStage[] = ["NEW", "CONTACTED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

export const STAGE_PROBABILITY: Record<DealStage, number> = {
  NEW: 20,
  CONTACTED: 35,
  PROPOSAL: 55,
  NEGOTIATION: 75,
  WON: 100,
  LOST: 0,
};

export function dealStageTone(stage: DealStage): "neutral" | "green" | "yellow" | "red" | "blue" {
  if (stage === "WON") return "green";
  if (stage === "LOST") return "red";
  if (stage === "NEGOTIATION") return "yellow";
  if (stage === "PROPOSAL") return "blue";
  return "neutral";
}

export function dateInputValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDealDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
