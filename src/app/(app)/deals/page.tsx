import { Suspense } from "react";
import { DealsWorkspace } from "@/components/deals/deals-workspace";
import { companies, contacts, deals, workspaceUsers } from "@/lib/mock-data";
import DealsLoading from "./loading";

export default function DealsPage() {
  return (
    <Suspense fallback={<DealsLoading />}>
      <DealsWorkspace seedDeals={deals} seedCompanies={companies} seedContacts={contacts} owners={workspaceUsers} />
    </Suspense>
  );
}
