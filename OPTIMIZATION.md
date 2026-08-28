# Frontend optimization baseline

This baseline is intentionally optimized for an App Router CRM that will later consume a NestJS API.

## Implemented

- Server Components remain the default. Client Components are limited to interactive surfaces.
- Dashboard is split into true Parallel Route slots: `@stats`, `@pipeline`, `@priority`, `@projects`, and `@activity`.
- Each dashboard slot is rendered behind a granular `Suspense` boundary so future independent API calls can stream instead of creating a page-wide waterfall.
- Every named parallel route has `default.tsx`, making the structure safe on hard navigation and compatible with the stricter Next.js 16 convention.
- Route-level `loading.tsx` exists for the workspace, Companies, and Company detail.
- Route-level error boundaries exist for Companies and Company detail, plus a root `global-error.tsx`.
- `CompaniesWorkspace`, which reads `useSearchParams()`, is explicitly wrapped in Suspense.
- Dashboard data access is isolated in `dashboard-queries.ts`. When NestJS exists, mock reads can be replaced with parallel server fetches without rewriting dashboard UI.
- The HTTP boundary explicitly uses `no-store` for GET requests. CRM records are operational/user-specific and should not become stale due to accidental framework caching.
- Off-screen streamed dashboard sections use `content-visibility:auto` to reduce initial paint/layout work on long pages.
- Next.js route-level code splitting and Link prefetching are preserved; no SPA-style root bundle was introduced.

## Deliberately not used everywhere

Parallel Routes and Suspense are architectural tools, not decorations. CRUD pages do not get artificial parallel slots unless they contain independently navigable/renderable regions. Doing so would increase router complexity without reducing real latency.

When the NestJS backend is introduced, list/detail Server Components should call server-side API adapters and launch independent calls together (`Promise.all`) where one request does not depend on another.
- The global search implementation is dynamically imported; its cross-CRM mock index is no longer part of the initial topbar JavaScript chunk.
- Company create/edit form code is dynamically imported and only loaded when a drawer is opened.
- Companies query-string navigation is wrapped in a React transition so filtering/sorting does not block urgent input updates.
- Company detail launches independent Company/Contacts/Deals/Projects server queries with `Promise.all`, establishing the no-waterfall shape required when those become real NestJS HTTP calls.
- Parallel dashboard slots also include slot-local `loading.tsx` files, in addition to the parent Suspense boundaries.

## Runtime baseline

- Next.js `16.3.3` (Active LTS security release)
- React / React DOM `19.2.8`
- ESLint CLI with `core-web-vitals` + TypeScript rules (Next 16 removed `next lint`)
- Node.js `>=20.9.0`
- Company detail data loading is moved into an async Server Component under a Suspense boundary, so the route can stream its fallback while future NestJS calls resolve in parallel.
- React Compiler is enabled on Next.js 16 to automatically reduce unnecessary client re-renders; `babel-plugin-react-compiler@1.0.0` is pinned.
- Typed routes are enabled to catch invalid internal navigation at compile time.
- `x-powered-by` is disabled for a cleaner production surface.
- Each dashboard parallel slot has an independent error boundary, so a failed KPI/pipeline/project request does not collapse the whole dashboard.

## Phase 03 route/data notes

- `/contacts` is wrapped in Suspense because URL-backed client filtering uses `useSearchParams`.
- `/contacts/[id]` has route-level loading and error boundaries.
- Contact detail related datasets (contact, account summary, primary deals, direct tasks, direct activities) are requested through independent server query boundaries with `Promise.all`.
- Contact form code is dynamically imported and is not part of the initial Contacts list interaction path.
- The Contacts UI does not call `fetch()` directly; future NestJS calls stay behind `contactApi` / server query boundaries.


## Phase 05 additions

- `/projects/[id]` uses a Suspense route boundary and a server query boundary that resolves Project, Company, source Deal, members, Tasks and Activities concurrently with `Promise.all`.
- Project create/edit UI is dynamically imported and does not enter the initial Projects bundle until needed.
- Project state is isolated behind `mock-project-store`, `project-queries` and `projectApi`, allowing the mock adapter to be replaced without rewriting visual components.
- Project persistence is hydrated into Dashboard, Company detail, Deal delivery and Global Search surfaces to prevent inconsistent frontend read models during the backend-free MVP phase.
- Parallel Routes remain limited to the Dashboard where independent slot streaming is useful; the Project detail surface uses granular Suspense instead of unnecessary parallel slots.


## Phase 06 additions

- `/tasks` and `/activities` remain single route surfaces with granular Suspense/loading/error boundaries; artificial Parallel Routes were not added because their panels are not independently navigable dashboard slots.
- Task and Activity forms are dynamically imported so editor code is not part of the initial list/timeline interaction path.
- Task and Activity mutations remain isolated behind versioned browser adapters plus typed `taskApi` / `activityApi` boundaries.
- Dashboard task KPI, priority queue and recent Activity surfaces hydrate from the same persisted adapters, avoiding stale cross-module read models during the backend-free MVP.
- Contact, Deal and Project detail surfaces hydrate persisted Task/Activity relations; Company Activity rolls up direct and child-record trace entries.
- Task deadlines use `dueAt` timestamps for future timezone-safe backend sorting and overdue filters; human labels are presentation-only.
- Activity logging accepts `occurredAt` separately from record creation time, matching the future API/audit model.
- User-created Activity excludes the `UPDATE` type; system/business transitions can emit UPDATE records server-side later.

## Phase 07 dashboard architecture

The operational dashboard keeps Parallel Routes for independently streamable read models. Phase 07 adds an `@accounts` slot alongside stats, pipeline, priority work, projects and activity. Every slot retains independent `loading.tsx`, `error.tsx` and `default.tsx` boundaries.

Dashboard scope lives in URL search params (`period`, `ownerId`, `companyId`). Client dashboard surfaces read that scope and apply it to the persisted mock adapter today; future server query functions can forward exactly the same query to NestJS read-model endpoints.

`DashboardFilters` is isolated behind an explicit Suspense boundary because it consumes `useSearchParams`. Expensive/interactive dashboard sections remain client islands while route shells and data query boundaries stay server-side.

The dashboard does not introduce a chart library. Pipeline visualisation uses lightweight CSS bars so the initial dashboard bundle does not pay for a general-purpose charting runtime. Third-party analytics can still be contributed through Extension API dashboard zones.
