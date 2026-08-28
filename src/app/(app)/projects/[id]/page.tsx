import { Suspense } from "react";
import { ProjectDetailData } from "@/components/projects/project-detail-data";
import ProjectDetailLoading from "./loading";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense fallback={<ProjectDetailLoading />}><ProjectDetailData projectId={id} /></Suspense>;
}
