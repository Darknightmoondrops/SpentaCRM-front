import { ExtensionPageHost } from "@/components/extensions/extension-page-host";

export default async function ExtensionPage({ params }: { params: Promise<{ extensionId: string; pageId: string }> }) {
  const { extensionId, pageId } = await params;
  return <ExtensionPageHost extensionId={extensionId} pageId={pageId} />;
}
