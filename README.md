# B2B CRM — Frontend MVP

A continuation-ready public B2B CRM frontend built with Next.js + TypeScript. It is intentionally company-neutral and designed for account-led B2B SaaS, services, logistics, industrial, finance, energy and similar teams.

## Current scope — Phase 08

- Public/white-label B2B design system and central product configuration.
- Next.js App Router with Server Components by default, Suspense/error/loading boundaries and Parallel Routes on the operational Dashboard.
- Companies, Contacts, Deals/Pipeline, Projects, Tasks and Activities with persisted frontend demo adapters.
- Operational Dashboard with URL-backed team/account/period scope, weighted pipeline, due work and account attention signals.
- Extension API v2 with Theme Studio, runtime JSON themes/remote modules, commands and trusted code contributions.
- Authentication frontend contract with `mock` and future `api` adapters.
- Next.js 16 `proxy.ts` route protection plus a client session boundary.
- Permission-aware administrative surfaces.
- Workspace settings, user profile, member access and RBAC role management.
- Read-only immutable Audit Log UI with filters and event detail/diff drawer.
- Global Cmd/Ctrl+K search.
- Typed HTTP/API boundaries for the future separate NestJS backend.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The app now redirects unauthenticated sessions to `/login`.

### Demo sign-in

```text
Email:    alex@example.com
Password: demo1234
```

You can also use another seeded workspace member email with the same demo password to preview different role permissions.

## Authentication modes

Standalone frontend demo:

```env
NEXT_PUBLIC_AUTH_ADAPTER=mock
```

Future NestJS integration:

```env
NEXT_PUBLIC_AUTH_ADAPTER=api
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

The production design assumes credentialed cookies/session infrastructure. Do not move refresh/access tokens into localStorage merely to match the demo adapter.

## Public / white-label configuration

Copy `.env.example` to `.env.local` and customize product/workspace presentation:

```env
NEXT_PUBLIC_APP_NAME=B2B CRM
NEXT_PUBLIC_APP_SHORT_NAME=B2B
NEXT_PUBLIC_APP_TAGLINE=Customer relationships & delivery
NEXT_PUBLIC_APP_VERSION=v0.11
NEXT_PUBLIC_WORKSPACE_NAME=Demo Workspace
NEXT_PUBLIC_WORKSPACE_PLAN=Business
NEXT_PUBLIC_LOCALE=en-GB
NEXT_PUBLIC_DEFAULT_CURRENCY=EUR
NEXT_PUBLIC_DEFAULT_TIMEZONE=Europe/Berlin
```

## Extension platform

Extension API v2 supports runtime-safe JSON theme/remote-module packages, an advanced Theme Studio, sandboxed external modules, extension commands, dashboard widgets, pages, modules, settings and record contribution points. See `EXTENSIONS.md` and `extension-examples/`.

## Backend integration

The intended backend remains a separate NestJS modular monolith. Existing boundaries cover:

```text
/auth
/users
/workspace/settings
/workspace/members
/workspace/roles
/companies
/contacts
/deals
/projects
/tasks
/activities
/audit
/dashboard
/extensions
```

See `API-CONTRACTS.md` for DTOs, permission keys and backend invariants.

## Security boundary

Frontend route/permission gates improve navigation and prevent accidental UI access. They are not the security authority. NestJS must validate authentication, workspace isolation and authorization on every protected read/write command.

## Documentation

- `FRONTEND-ROADMAP.md` — phased product implementation.
- `API-CONTRACTS.md` — backend endpoints and invariants.
- `EXTENSIONS.md` — extension authoring/installation model.
- `OPTIMIZATION.md` — Next.js performance architecture.
- `PUBLIC-PRODUCT.md` — public B2B productization decisions.
- `DESIGN-NOTES.md` — visual system notes.
