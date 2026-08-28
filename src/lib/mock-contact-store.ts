import type { Contact } from "./types";

const KEY = "dt.crm.contacts.v3";

export function hydrateMockContacts(seed: Contact[]): Contact[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    const saved = JSON.parse(raw) as Contact[];
    const savedById = new Map(saved.map((contact) => [contact.id, contact]));
    const merged = seed.map((contact) => savedById.get(contact.id) ?? contact);
    for (const contact of saved) if (!seed.some((seedContact) => seedContact.id === contact.id)) merged.push(contact);
    return merged;
  } catch {
    return seed;
  }
}

export function persistMockContacts(contacts: Contact[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(contacts));
}

export function findPersistedMockContact(id: string, seed?: Contact | null): Contact | null {
  if (typeof window === "undefined") return seed ?? null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed ?? null;
    const saved = JSON.parse(raw) as Contact[];
    return saved.find((contact) => contact.id === id) ?? seed ?? null;
  } catch {
    return seed ?? null;
  }
}
