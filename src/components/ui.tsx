import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ArrowIcon, MoreIcon, PlusIcon } from "./icons";

export function PageHeader({ eyebrow, title, description, action = "New record" }: { eyebrow: string; title: string; description?: string; action?: ReactNode | null }) {
  const renderedAction = typeof action === "string" ? <button className="primary-button"><PlusIcon/>{action}</button> : action;
  return <div className="page-header"><div><div className="eyebrow">{eyebrow} ──</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{renderedAction}</div>;
}
export function Stat({ index, label, value, sub, accent, href }: { index:string; label:string; value:string; sub:string; accent?:boolean; href?:Route }) {
  const className = `stat-card ${accent ? "stat-accent" : ""} ${href ? "stat-link" : ""}`;
  const content = <><div className="stat-top"><span>KPI {index}</span><span>↗</span></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-sub">{sub}</div></>;
  return href ? <Link className={className} href={href}>{content}</Link> : <div className={className}>{content}</div>;
}
export function SectionTitle({ eyebrow, title, action }: { eyebrow:string; title:string; action?: { label:string; href:Route } }) {
  return <div className="section-heading"><div><div className="eyebrow">{eyebrow} ──</div><h2>{title}</h2></div>{action && <Link className="text-link" href={action.href}>{action.label}<ArrowIcon/></Link>}</div>;
}
export function Badge({ children, tone="neutral" }: { children:ReactNode; tone?:"neutral"|"green"|"yellow"|"red"|"blue" }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
export function Progress({ value }: { value:number }) { return <div className="progress"><span style={{width:`${value}%`}}/></div>; }
export function MoreButton() { return <button className="more-button" aria-label="More actions"><MoreIcon/></button>; }
