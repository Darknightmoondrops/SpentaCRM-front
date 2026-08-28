import { Suspense } from "react";
import { TasksWorkspace } from "@/components/tasks/tasks-workspace";
import { companies, contacts, deals, projects, tasks, workspaceUsers } from "@/lib/mock-data";

export default function TasksPage() {
  return <Suspense fallback={<div className="tasks-loading"><div /><div /><div /></div>}><TasksWorkspace seedTasks={tasks} seedCompanies={companies} seedContacts={contacts} seedDeals={deals} seedProjects={projects} owners={workspaceUsers} /></Suspense>;
}
