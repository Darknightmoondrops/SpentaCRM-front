"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { AuthSession, PermissionKey } from "@/lib/types";
import { authApi, type SignInPayload } from "@/lib/auth-api";
import { clearDemoSession, createDemoSession, DEMO_PASSWORD, persistDemoSession, readDemoSession } from "./mock-auth";

const AUTH_ADAPTER = process.env.NEXT_PUBLIC_AUTH_ADAPTER ?? "mock";

type AuthContextValue = {
  session: AuthSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (payload: SignInPayload) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: PermissionKey) => boolean;
  updateLocalSession: (session: AuthSession) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  const load = useCallback(async () => {
    try {
      const nextSession = AUTH_ADAPTER === "mock" ? readDemoSession() : await authApi.me();
      setSession(nextSession);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
    } catch {
      setSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const signIn = useCallback(async (payload: SignInPayload) => {
    let nextSession: AuthSession;
    if (AUTH_ADAPTER === "mock") {
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      if (payload.password !== DEMO_PASSWORD) throw new Error("Incorrect demo password. Use demo1234.");
      nextSession = createDemoSession(payload.email);
      persistDemoSession(nextSession);
    } else {
      nextSession = await authApi.signIn(payload);
    }
    setSession(nextSession);
    setStatus("authenticated");
    return nextSession;
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (AUTH_ADAPTER === "mock") clearDemoSession();
      else await authApi.signOut();
    } finally {
      setSession(null);
      setStatus("unauthenticated");
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  const updateLocalSession = useCallback((nextSession: AuthSession) => {
    setSession(nextSession);
    if (AUTH_ADAPTER === "mock") persistDemoSession(nextSession);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    status,
    signIn,
    signOut,
    refreshSession: load,
    hasPermission: (permission) => Boolean(session?.permissions.includes(permission)),
    updateLocalSession,
  }), [load, session, signIn, signOut, status, updateLocalSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
