import { DealDetailView } from "./deal-detail-view";
import { companies, contacts, deals, projects, workspaceUsers } from "@/lib/mock-data";
import { getDealActivities, getDealById, getDealCompany, getDealContact, getDealProject, getDealTasks } from "@/lib/deal-queries";

export async function DealDetailData({ dealId }: { dealId: string }) {
  const [deal, company, contact, tasks, activities, project] = await Promise.all([
    getDealById(dealId),
    getDealCompany(dealId),
    getDealContact(dealId),
    getDealTasks(dealId),
    getDealActivities(dealId),
    getDealProject(dealId),
  ]);

  return (
    <DealDetailView
      dealId={dealId}
      seedDeal={deal}
      seedDeals={deals}
      seedCompanies={companies}
      seedContacts={contacts}
      seedProjects={projects}
      owners={workspaceUsers}
      company={company}
      contact={contact}
      tasks={tasks}
      activities={activities}
      project={project}
    />
  );
}
