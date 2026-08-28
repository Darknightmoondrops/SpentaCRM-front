import { Suspense } from "react";
import { AuditWorkspace } from "@/components/audit/audit-workspace";
export default function AuditPage(){ return <Suspense fallback={<div className="audit-page-loading" aria-busy="true"><span/><span/><span/></div>}><AuditWorkspace/></Suspense>; }
