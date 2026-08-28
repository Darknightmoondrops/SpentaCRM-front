import { AccessBoundary } from "@/auth/access-boundary";
import { ExtensionsWorkspace } from "@/components/extensions/extensions-workspace";

export default function ExtensionsPage() {
  return <AccessBoundary permission="extensions:manage"><ExtensionsWorkspace /></AccessBoundary>;
}
