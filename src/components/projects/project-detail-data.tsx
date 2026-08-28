import { ProjectDetailView } from "./project-detail-view";
import { companies, deals, projects, workspaceUsers } from "@/lib/mock-data";
import { getProjectActivities, getProjectById, getProjectCompany, getProjectMembers, getProjectSourceDeal, getProjectTasks } from "@/lib/project-queries";

export async function ProjectDetailData({ projectId }: { projectId: string }) {
  const [project, company, sourceDeal, tasks, activities, members] = await Promise.all([
    getProjectById(projectId),
    getProjectCompany(projectId),
    getProjectSourceDeal(projectId),
    getProjectTasks(projectId),
    getProjectActivities(projectId),
    getProjectMembers(projectId),
  ]);

  return (
    <ProjectDetailView
      projectId={projectId}
      seedProject={project}
      seedProjects={projects}
      seedCompanies={companies}
      seedDeals={deals}
      owners={workspaceUsers}
      company={company}
      sourceDeal={sourceDeal}
      tasks={tasks}
      activities={activities}
      members={members}
    />
  );
}
