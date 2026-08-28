"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { PermissionKey } from "@/lib/types";
import { useAuth } from "./auth-provider";

export function PermissionGate({ permission, children, fallback = null }: { permission: PermissionKey; children: ReactNode; fallback?: ReactNode }) {
  const { hasPermission, status } = useAuth();
  if (status === "loading") return null;
  return hasPermission(permission) ? children : fallback;
}

export function AccessBoundary({ permission, children }: { permission: PermissionKey; children: ReactNode }) {
  const { hasPermission, status, session } = useAuth();
  if (status === "loading") return <div className="access-loading" aria-busy="true"><span /><span /><span /></div>;
  if (!hasPermission(permission)) return <section className="access-denied"><div className="access-denied-icon">!</div><div className="eyebrow">ACCESS CONTROL</div><h2>You do not have access to this area.</h2><p>Your current role is <strong>{session?.user.role ?? "Unknown"}</strong>. Ask a workspace administrator if you need this permission.</p><Link href="/" className="secondary-button">Return to dashboard</Link></section>;
  return children;
}
