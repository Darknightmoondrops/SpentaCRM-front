import { Suspense } from "react";
import { AuthProvider } from "@/auth/auth-provider";
import { productConfig } from "@/config/product";
import { LoginForm } from "./login-form";

export default function LoginPage(){
  return <AuthProvider><div className="login-demo public-login"><div className="login-card">
    <div className="login-brand-public"><span className="brand-mark">{productConfig.shortName.slice(0, 1)}</span><div><strong>{productConfig.name}</strong><small>{productConfig.tagline}</small></div></div>
    <div className="eyebrow">WELCOME BACK</div>
    <h1>Keep every B2B relationship moving.</h1>
    <p>Sign in to manage accounts, opportunities, projects and follow-ups from one focused workspace.</p>
    <Suspense fallback={<div className="auth-form-loading" aria-busy="true"><span/><span/><span/></div>}><LoginForm /></Suspense>
    <div className="login-foot"><span className="status-dot"/>DEMO SESSION · BACKEND AUTH CONTRACT READY</div>
  </div></div></AuthProvider>;
}
