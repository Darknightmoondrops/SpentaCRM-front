import { Suspense } from "react";
import { ContactsWorkspace } from "@/components/contacts/contacts-workspace";
import { companies, contacts } from "@/lib/mock-data";
import ContactsLoading from "./loading";

export default function ContactsPage() {
  return (
    <Suspense fallback={<ContactsLoading />}>
      <ContactsWorkspace seedContacts={contacts} seedCompanies={companies} />
    </Suspense>
  );
}
