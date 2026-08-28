# Frontend completion roadmap

The frontend is intentionally being completed before the NestJS backend. Each phase leaves explicit API contracts so backend implementation does not require UI rewrites.

## Phase 01 — Foundation / workspace shell — DONE
- Public/auth routes separated from authenticated workspace routes with Next.js route groups.
- Responsive navigation shell.
- Route-aware top bar.
- Global command search surface.
- Notification and profile surfaces.
- Loading and 404 system states.
- Backend-ready relation IDs added to frontend domain models.
- Single API client boundary with typed API errors and query handling.
- Accessibility baseline: focus-visible states, aria-current, dialog semantics, screen-reader loading text.

## Phase 02 — Companies — DONE
- Search, status filters and sorting with URL search params.
- Pagination-ready state and page controls.
- Create/edit company drawer with client-side validation.
- Company detail tabs: overview, contacts, deals, projects, activity and files placeholder.
- Empty/error/loading/recovery states.
- Archive/reactivate actions with `archivedAt` separated from relationship status.
- Company contacts/deals/projects/activity associations and account activity roll-up.
- Browser-persisted mock adapter so Phase 02 interactions survive navigation before the backend exists.
- Typed `companyApi` boundary and explicit NestJS DTO/query contract.

## Phase 02.5 — Next.js optimization baseline — DONE

- Dashboard Parallel Routes
- Granular Suspense / streaming boundaries
- Per-route loading and recovery states
- Server/client boundary review
- Future server query boundary for NestJS
- Explicit CRM cache semantics

## Phase 03 — Contacts — DONE

- URL-backed search/filter/sort and pagination-ready state.
- Create/edit contact drawer with validation.
- Company association with stable `companyId`.
- Primary-contact invariant: one active primary stakeholder per company.
- Email/call direct actions and preferred communication channel.
- Archive/reactivate lifecycle without deleting relationship history.
- Contact detail route with overview/activity/deals/tasks tabs.
- Granular route loading/error boundaries and Suspense.
- Parallel server query boundary for contact context, related deals, tasks and activities.
- Browser-persisted mock adapter and typed `contactApi` contract.
- Global readability pass: slightly larger microcopy, tables, forms and navigation text.

## Phase 04 — Deals / pipeline — DONE
- Functional Pipeline/List modes with URL-backed view state.
- Search plus account/owner/outcome filters and list sorting/pagination.
- Create/edit deal with company/contact/owner relationship validation.
- Native lightweight drag/drop pipeline plus keyboard/mobile stage selector.
- Explicit won/lost/reopen state transitions; loss reason is mandatory.
- Value, probability, expected-close and commercial-context editing.
- Deal detail route with overview/activity/tasks/delivery tabs.
- Parallel server query boundary for account, stakeholder, tasks, activity and source project.
- Granular loading/error/Suspense boundaries and lazy-loaded deal form.
- Browser-persisted mock adapter integrated into Company detail, Global Search and Dashboard deal surfaces.
- Typed `dealApi` boundary and explicit NestJS transition invariants.
- Won-deal -> Project command contract reserved for Phase 05.

## Phase 05 — Projects — DONE
- URL-backed active/all/completed/archived portfolio views, search, account/owner/status/health filters and sorting.
- Portfolio and table list modes with pagination-ready state.
- Create/edit project with delivery owner, team, health, progress, dates and stable customer linkage.
- Won Deal -> Project handoff preserving immutable `sourceDealId`; duplicate active delivery project per source deal is prevented in the frontend adapter.
- Project detail route with overview, milestones, tasks, activity, team and files surfaces.
- Lightweight milestone create/edit flow for delivery checkpoints rather than sprint-level work.
- Quick project status/progress transitions, archive/reactivate lifecycle and health visibility.
- Parallel server query boundary for account, source deal, members, tasks and activity.
- Granular route loading/error/Suspense boundaries and lazy-loaded Project form.
- Browser-persisted project adapter integrated into Company detail, Deal delivery handoff, Global Search and Dashboard project surfaces.
- Typed `projectApi` boundary and explicit NestJS Project/team/milestone contracts.

## Phase 06 — Tasks + activities — DONE
- URL-backed work queue views with search, due/priority/relation/assignee filters and pagination-ready state.
- Task create/edit/start/pause/complete/reopen/archive/reactivate lifecycle with browser-persisted mock state.
- Relation picker covering Company, Contact, Deal and Project records with stable `relationType + relationId` linkage.
- Context-aware "New task" actions from Contact, Deal and Project detail screens.
- Append-oriented Activity logging with type, actor and related-record filters plus chronological timeline.
- Context-aware "Log activity" actions from Company, Contact, Deal and Project detail screens.
- Dashboard pending-task KPI, priority queue and recent activity hydrate from persisted task/activity adapters.
- Global Search resolves persisted Tasks and deep-links to the task editor.
- Granular route loading/error/Suspense boundaries and lazy-loaded Task/Activity forms.
- Typed `taskApi` and `activityApi` boundaries with explicit NestJS lifecycle/audit invariants.

## Phase 06.5 — Public B2B productisation — DONE
- Removed customer-specific branding, names, emails, aviation language and company-specific visual cues.
- Reframed the product for account-led B2B SaaS, services, logistics, industrial, financial, energy and healthcare-technology teams.
- Added central white-label product configuration via `src/config/product.ts` and `NEXT_PUBLIC_*` environment variables.
- Replaced the original industrial/control-room theme with a neutral B2B product system: light workspace, navy navigation, restrained blue accent, softer cards and clearer status colors.
- Raised typography/readability and switched to a reliable system font stack with no external font dependency.
- Replaced seed content with fictional multi-industry B2B companies, contacts, opportunities, projects, tasks and activities.
- Made locale, currency and timezone presentation configurable.

## Phase 06.6 — Extension platform — DONE
- Added Extension API v3 with Theme Studio, project-ZIP runtime modules, IndexedDB package storage, sandboxing, commands, page/widget/entity-tab contributions, custom themes and advanced visual effects.
- Added workspace-level `ExtensionProvider` with enable/disable state and active-theme selection.
- Added runtime-safe portable Theme Extensions installable from JSON without executing uploaded JavaScript.
- Added token whitelist/sanitisation for portable theme packages.
- Added built-in Clean, Graphite and Midnight theme extensions plus an installable Oceanic example package.
- Added trusted code-extension registry for dashboard widgets and future sidebar contributions.
- Added Dashboard extension zones and a disabled-by-default Account Health sample code extension.
- Added `/extensions` management UI with installed/theme/developer views, theme import, activation and uninstall.
- Added `EXTENSIONS.md` and extension examples for third-party extension authors.
- Kept code extensions build-time/trusted in the frontend MVP; future NestJS marketplace installation will own package verification, rollout and permission grants.

## Phase 07 — Dashboard — DONE
- URL-backed shared scope controls for period, team member and account.
- KPI cards calculated from shared CRM selectors rather than hard-coded presentation values.
- Five drillable KPIs: active customers, open pipeline, weighted forecast, delivery health and work due.
- Pipeline breakdown with stage value, weighted value, deal count and stage-level drill-down.
- Due-work queue prioritised by overdue/today state, priority and exact due timestamp.
- Delivery-health surface with average progress and attention-first project ordering.
- B2B account attention radar using delivery, overdue-work and relationship activity signals.
- Customer activity intelligence with touchpoint/type summaries and recent relationship timeline.
- Added a dedicated `@accounts` Parallel Route with independent loading/error/default boundaries.
- Drill-down context now works end-to-end: Companies support owner/company filters, Deals support stage, Tasks and Activities support account roll-up filters.
- Added typed future NestJS dashboard read-model API boundary.

## Phase 08 — Auth + settings + audit — DONE
- Stateful sign-in UX with validation/loading/error/password visibility, demo credentials and return-to navigation.
- `AuthProvider` session contract with mock/API adapters; production API mode uses credentialed `/auth/*` endpoints instead of localStorage access tokens.
- Next.js 16 `proxy.ts` route gate plus client `SessionBoundary` for stale/expired-session recovery.
- Permission-aware navigation and access boundaries for Audit, Extensions and administrative Settings surfaces.
- Workspace settings for currency, locale, timezone, fiscal year and week defaults with a persisted frontend adapter.
- User profile settings tied to the active session.
- Workspace member management with invite, role assignment and suspend/reactivate demo flows.
- System RBAC roles plus custom-role creation and explicit permission manifests.
- Read-only audit log with URL-backed search/actor/action/entity filters, pagination and immutable event detail/diff drawer.
- Typed `authApi`, `workspaceApi` and `auditApi` contracts reserved for NestJS.

## Phase 09 — Production polish
- Consistent toast/error patterns.
- Confirm dialogs for destructive operations.
- Keyboard navigation pass.
- Responsive QA.
- API DTO mapping layer.
- Removal of mock data imports from pages.
- OpenAPI-generated/shared types integration point.
