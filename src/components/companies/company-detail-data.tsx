import { CompanyDetailView } from "./company-detail-view";
import { companies, workspaceUsers } from "@/lib/mock-data";
import { getCompanyActivities, getCompanyById, getCompanyContacts, getCompanyDeals, getCompanyProjects } from "@/lib/company-queries";

export async function CompanyDetailData({ companyId }: { companyId: string }) {
  const [company, companyContacts, companyDeals, companyProjects] = await Promise.all([
    getCompanyById(companyId),
    getCompanyContacts(companyId),
    getCompanyDeals(companyId),
    getCompanyProjects(companyId),
  ]);

  const relationIds = new Set([
    companyId,
    ...companyContacts.map((item) => item.id),
    ...companyDeals.map((item) => item.id),
    ...companyProjects.map((item) => item.id),
  ]);
  const accountActivities = await getCompanyActivities(relationIds);

  return (
    <CompanyDetailView
      companyId={companyId}
      seedCompany={company}
      seedCompanies={companies}
      owners={workspaceUsers}
      contacts={companyContacts}
      deals={companyDeals}
      projects={companyProjects}
      activities={accountActivities}
    />
  );
}
