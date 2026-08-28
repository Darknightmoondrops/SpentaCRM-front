import Link from "next/link";
import { productConfig } from "@/config/product";

export default function NotFound() {
  return <main className="system-page">
    <div className="system-card">
      <div className="login-brand-public"><span className="brand-mark">{productConfig.shortName.slice(0, 1)}</span><div><strong>{productConfig.name}</strong><small>{productConfig.tagline}</small></div></div>
      <div className="eyebrow">404 · NOT FOUND</div>
      <h1>This page is not in the workspace.</h1>
      <p>The record may have moved, been archived, or the URL may be incorrect.</p>
      <Link className="primary-button" href="/">Back to dashboard →</Link>
    </div>
  </main>;
}
