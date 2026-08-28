import { Suspense } from "react";
import { ActivitiesWorkspace } from "@/components/activities/activities-workspace";
import { activities, companies, contacts, deals, projects, workspaceUsers } from "@/lib/mock-data";

export default function ActivitiesPage() {
  return <Suspense fallback={<div className="activities-loading"><div /><div /><div /></div>}><ActivitiesWorkspace seedActivities={activities} seedCompanies={companies} seedContacts={contacts} seedDeals={deals} seedProjects={projects} owners={workspaceUsers} /></Suspense>;
}
