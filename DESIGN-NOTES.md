# SpentaCRM design notes

This frontend is intentionally product-neutral. It is designed as a reusable CRM for B2B companies rather than as a branded implementation for one customer.

## Product audience

- B2B SaaS and software companies
- Professional services and consultancies
- Logistics and industrial organisations
- Financial and regulated service businesses
- Energy, healthcare technology and other account-led teams

## Visual direction

- Neutral light workspace with a dark navy navigation rail
- Restrained blue product accent rather than customer-specific brand colors
- White cards, soft borders, subtle elevation and moderate radius
- Readable system-ui typography with a 15px desktop baseline
- Clear account / pipeline / delivery hierarchy
- Standard success, warning and risk colors
- Dense enough for daily operations, but not a control-room aesthetic

## Public / white-label readiness

Product identity is centralised in `src/config/product.ts` and can be overridden with `NEXT_PUBLIC_*` environment variables. The demo workspace, user identity and app name are not tied to a specific company.

Mock data is deliberately multi-industry and uses fictional B2B organisations. It exists only to demonstrate relationship, sales and delivery workflows before the NestJS backend is connected.

## Product boundary

The CRM keeps Projects and Tasks lightweight. It is intended to manage customer-facing delivery context, milestones and follow-up, not replace Jira, Linear or a full project-management suite.

## Extension / Theme Platform v2

The visual system is now token-driven and extension-safe. Theme v2 can change palette, safe local typography, radii, glass transparency, remote wallpaper URL/opacity/blur and CSS-only atmosphere presets. Core screens should keep using design tokens (`var(--surface)`, `var(--ink)`, `var(--line)`, `var(--accent)`) rather than hard-coded brand colors so third-party themes remain coherent.

Remote wallpaper images are loaded from HTTPS URLs only. Theme motion respects `prefers-reduced-motion`. Runtime remote modules are rendered in isolated iframes; trusted React modules use the extension SDK and generated registry.
