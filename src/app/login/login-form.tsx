"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { productConfig } from "@/config/product";
import { useAuth } from "@/auth/auth-provider";
import { DEMO_PASSWORD } from "@/auth/mock-auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState(productConfig.demoUser.email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    setBusy(true);
    try {
      await signIn({ email: email.trim(), password });
      const returnTo = searchParams.get("returnTo");
      router.replace(returnTo?.startsWith("/") ? returnTo : "/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} noValidate>
    <label className="field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(error)} /></label>
    <label className="field"><span>Password</span><div className="password-field"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button></div></label>
    {error && <div className="auth-error" role="alert">{error}</div>}
    <div className="login-options"><label><input type="checkbox" defaultChecked /> Keep me signed in</label><button type="button" onClick={() => setError("Password recovery will be handled by the NestJS auth service in production.")}>Forgot password?</button></div>
    <button className="primary-button login-button" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in →"}</button>
    <div className="demo-credential"><strong>Demo account</strong><span>{productConfig.demoUser.email}</span><span>Password: <code>{DEMO_PASSWORD}</code></span></div>
  </form>;
}
