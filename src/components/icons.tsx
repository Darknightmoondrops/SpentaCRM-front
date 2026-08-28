import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;
const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const GridIcon = (p: Props) => <svg {...base} {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
export const CompanyIcon = (p: Props) => <svg {...base} {...p}><path d="M3 21h18M5 21V5l7-2v18M19 21V9l-7-2"/><path d="M8 8h1M8 12h1M8 16h1M15 12h1M15 16h1"/></svg>;
export const ContactIcon = (p: Props) => <svg {...base} {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
export const DealIcon = (p: Props) => <svg {...base} {...p}><path d="M4 7h16M7 4v6M17 4v6M5 11h14v9H5z"/><path d="M9 15h6"/></svg>;
export const ProjectIcon = (p: Props) => <svg {...base} {...p}><path d="M4 4h6l2 3h8v13H4z"/><path d="M8 12h8M8 16h5"/></svg>;
export const TaskIcon = (p: Props) => <svg {...base} {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 2 2 4-4M8 16h8"/></svg>;
export const ActivityIcon = (p: Props) => <svg {...base} {...p}><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>;
export const AuditIcon = (p: Props) => <svg {...base} {...p}><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>;
export const SettingsIcon = (p: Props) => <svg {...base} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.1H9.6V21a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4h-.1V9.6H3a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1v-.1h4V3a1.7 1.7 0 0 0 1.1 1.6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.25.3.46.64.6 1 .15.35.22.73.22 1.1v1.8c0 .38-.07.75-.22 1.1-.14.36-.35.7-.6 1Z"/></svg>;
export const SearchIcon = (p: Props) => <svg {...base} {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
export const PlusIcon = (p: Props) => <svg {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>;
export const ArrowIcon = (p: Props) => <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
export const MenuIcon = (p: Props) => <svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
export const CloseIcon = (p: Props) => <svg {...base} {...p}><path d="m6 6 12 12M18 6 6 18"/></svg>;
export const MoreIcon = (p: Props) => <svg {...base} {...p}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></svg>;
export const BellIcon = (p: Props) => <svg {...base} {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
export const ChevronDownIcon = (p: Props) => <svg {...base} {...p}><path d="m6 9 6 6 6-6"/></svg>;
export const UserIcon = (p: Props) => <svg {...base} {...p}><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>;
export const LogoutIcon = (p: Props) => <svg {...base} {...p}><path d="M10 17l5-5-5-5M15 12H3"/><path d="M13 3h8v18h-8"/></svg>;
export const CheckIcon = (p: Props) => <svg {...base} {...p}><path d="m5 12 4 4L19 6"/></svg>;

export const ExtensionIcon = (p: Props) => <svg {...base} {...p}><path d="M8 3h4v5h5v4h-5v5H8v-5H3V8h5z"/><path d="M17 17h4v4h-4z"/></svg>;
