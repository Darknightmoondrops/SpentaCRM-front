import type { Deal } from "./types";

const KEY = "dt.crm.deals.v4";

export function hydrateMockDeals(seed: Deal[]): Deal[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    const saved = JSON.parse(raw) as Deal[];
    const savedById = new Map(saved.map((deal) => [deal.id, deal]));
    const merged = seed.map((deal) => savedById.get(deal.id) ?? deal);
    for (const deal of saved) if (!seed.some((seedDeal) => seedDeal.id === deal.id)) merged.push(deal);
    return merged;
  } catch {
    return seed;
  }
}

export function persistMockDeals(deals: Deal[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(deals));
}

export function findPersistedMockDeal(id: string, seed?: Deal | null): Deal | null {
  if (typeof window === "undefined") return seed ?? null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed ?? null;
    const saved = JSON.parse(raw) as Deal[];
    return saved.find((deal) => deal.id === id) ?? seed ?? null;
  } catch {
    return seed ?? null;
  }
}
