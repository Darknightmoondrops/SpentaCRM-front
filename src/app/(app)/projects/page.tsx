import { Suspense } from "react";
import { ProjectsWorkspace } from "@/components/projects/projects-workspace";
import { companies, deals, projects, workspaceUsers } from "@/lib/mock-data";
import ProjectsLoading from "./loading";

export default function ProjectsPage() {
  return <Suspense fallback={<ProjectsLoading />}><ProjectsWorkspace seedProjects={projects} seedCompanies={companies} seedDeals={deals} owners={workspaceUsers} /></Suspense>;
}
