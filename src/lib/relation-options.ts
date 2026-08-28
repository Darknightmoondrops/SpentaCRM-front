import type { Company, Contact, Deal, Project, RelationType } from "./types";

export interface RelationOption {
  type: RelationType;
  id: string;
  label: string;
  meta: string;
  companyId: string;
}

export function buildRelationOptions({ companies, contacts, deals, projects }: { companies: Company[]; contacts: Contact[]; deals: Deal[]; projects: Project[] }): RelationOption[] {
  return [
    ...companies.filter((item) => !item.archivedAt).map((item) => ({ type: "COMPANY" as const, id: item.id, label: item.name, meta: item.industry, companyId: item.id })),
    ...contacts.filter((item) => !item.archivedAt).map((item) => ({ type: "CONTACT" as const, id: item.id, label: item.name, meta: item.company, companyId: item.companyId })),
    ...deals.map((item) => ({ type: "DEAL" as const, id: item.id, label: item.title, meta: item.company, companyId: item.companyId })),
    ...projects.filter((item) => !item.archivedAt).map((item) => ({ type: "PROJECT" as const, id: item.id, label: item.title, meta: item.company, companyId: item.companyId })),
  ];
}
