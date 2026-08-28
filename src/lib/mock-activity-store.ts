import type { Activity } from "./types";

const KEY = "dt.crm.activities.v6";

export function hydrateMockActivities(seed: Activity[]): Activity[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    const saved = JSON.parse(raw) as Activity[];
    const savedById = new Map(saved.map((item) => [item.id, item]));
    const merged = seed.map((item) => savedById.get(item.id) ?? item);
    for (const item of saved) if (!seed.some((seedItem) => seedItem.id === item.id)) merged.push(item);
    return merged.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  } catch {
    return seed;
  }
}

export function persistMockActivities(activities: Activity[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(activities));
}
