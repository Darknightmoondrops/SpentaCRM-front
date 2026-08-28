import { api } from "./api-client";
import type { PaginatedResponse } from "./api-types";
import type { Contact, ContactChannel } from "./types";

export type ContactSortBy = "updatedAt" | "name" | "lastContact" | "company";
export type SortOrder = "asc" | "desc";

export interface ContactListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  companyId?: string;
  channel?: ContactChannel;
  primary?: boolean;
  archived?: boolean;
  sortBy?: ContactSortBy;
  sortOrder?: SortOrder;
}

export interface ContactPayload {
  name: string;
  role: string;
  department?: string;
  companyId: string;
  email: string;
  phone: string;
  preferredChannel: ContactChannel;
  isPrimary: boolean;
  linkedin?: string;
  notes?: string;
}

export type CreateContactPayload = ContactPayload;
export type UpdateContactPayload = Partial<ContactPayload>;

export const contactApi = {
  list(query: ContactListQuery = {}) {
    return api<PaginatedResponse<Contact>>("/contacts", {
      query: {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        companyId: query.companyId,
        channel: query.channel,
        primary: query.primary,
        archived: query.archived,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });
  },
  get(id: string) {
    return api<Contact>(`/contacts/${id}`);
  },
  create(payload: CreateContactPayload) {
    return api<Contact>("/contacts", { method: "POST", body: JSON.stringify(payload) });
  },
  update(id: string, payload: UpdateContactPayload) {
    return api<Contact>(`/contacts/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  },
  archive(id: string) {
    return api<Contact>(`/contacts/${id}/archive`, { method: "POST" });
  },
  reactivate(id: string) {
    return api<Contact>(`/contacts/${id}/reactivate`, { method: "POST" });
  },
};
