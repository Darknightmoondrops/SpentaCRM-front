import { AuthProvider } from "@/auth/auth-provider";
import { SessionBoundary } from "@/auth/session-boundary";
import { AppShell } from "@/components/app-shell";
import { ExtensionProvider } from "@/extensions/extension-provider";

export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthProvider><SessionBoundary><ExtensionProvider><AppShell>{children}</AppShell></ExtensionProvider></SessionBoundary></AuthProvider>;
}
