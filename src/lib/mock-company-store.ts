import type { Company } from "./types";

const KEY = "dt.crm.companies.v2";

export function hydrateMockCompanies(seed: Company[]): Company[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    const saved = JSON.parse(raw) as Company[];
    const savedById = new Map(saved.map((company) => [company.id, company]));
    const merged = seed.map((company) => savedById.get(company.id) ?? company);
    for (const company of saved) if (!seed.some((seedCompany) => seedCompany.id === company.id)) merged.push(company);
    return merged;
  } catch {
    return seed;
  }
}

export function persistMockCompanies(companies: Company[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(companies));
}

export function findPersistedMockCompany(id: string, seed?: Company | null): Company | null {
  if (typeof window === "undefined") return seed ?? null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed ?? null;
    const saved = JSON.parse(raw) as Company[];
    return saved.find((company) => company.id === id) ?? seed ?? null;
  } catch {
    return seed ?? null;
  }
}
