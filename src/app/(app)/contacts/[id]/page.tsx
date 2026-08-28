import { Suspense } from "react";
import { ContactDetailData } from "@/components/contacts/contact-detail-data";
import ContactDetailLoading from "./loading";

export default async function ContactDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ContactDetailLoading />}>
      <ContactDetailData contactId={id} />
    </Suspense>
  );
}
