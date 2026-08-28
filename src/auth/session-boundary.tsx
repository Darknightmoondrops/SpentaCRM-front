"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function SessionBoundary({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`/login?returnTo=${encodeURIComponent(pathname || "/")}`);
  }, [pathname, router, status]);

  if (status === "loading") return <div className="workspace-auth-loading" aria-busy="true" aria-label="Restoring session"><div className="workspace-auth-sidebar"/><div className="workspace-auth-main"><span/><span/><span/></div></div>;
  if (status === "unauthenticated") return null;
  return children;
}
