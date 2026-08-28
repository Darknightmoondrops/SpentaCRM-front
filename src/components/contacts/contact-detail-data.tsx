import { ContactDetailView } from "./contact-detail-view";
import { companies, contacts } from "@/lib/mock-data";
import { getContactActivities, getContactById, getContactCompany, getContactDeals, getContactTasks } from "@/lib/contact-queries";

export async function ContactDetailData({ contactId }: { contactId: string }) {
  const [contact, company, deals, tasks, activities] = await Promise.all([
    getContactById(contactId),
    getContactCompany(contactId),
    getContactDeals(contactId),
    getContactTasks(contactId),
    getContactActivities(contactId),
  ]);

  return (
    <ContactDetailView
      contactId={contactId}
      seedContact={contact}
      seedContacts={contacts}
      seedCompanies={companies}
      company={company}
      deals={deals}
      tasks={tasks}
      activities={activities}
    />
  );
}
