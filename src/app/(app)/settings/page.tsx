import { Suspense } from "react";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";

export default function SettingsPage() {
  return <Suspense fallback={<div className="settings-page-loading" aria-busy="true"><span/><span/><span/></div>}><SettingsWorkspace /></Suspense>;
}
