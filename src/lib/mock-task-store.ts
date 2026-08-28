import type { Task } from "./types";

const KEY = "dt.crm.tasks.v6";

export function hydrateMockTasks(seed: Task[]): Task[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    const saved = JSON.parse(raw) as Task[];
    const savedById = new Map(saved.map((item) => [item.id, item]));
    const merged = seed.map((item) => savedById.get(item.id) ?? item);
    for (const item of saved) if (!seed.some((seedItem) => seedItem.id === item.id)) merged.push(item);
    return merged;
  } catch {
    return seed;
  }
}

export function persistMockTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(tasks));
}
