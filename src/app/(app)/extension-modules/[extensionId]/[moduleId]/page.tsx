import { ExtensionModuleHost } from "@/components/extensions/extension-module-host";
export default async function ExtensionModulePage({ params }: { params: Promise<{ extensionId:string; moduleId:string }> }) {
  const { extensionId, moduleId } = await params;
  return <ExtensionModuleHost extensionId={extensionId} moduleId={moduleId}/>;
}
