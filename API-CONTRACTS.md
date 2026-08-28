# Frontend API contract assumptions

Base URL:

```text
/api/v1
```

The backend will be implemented later in NestJS. The frontend should only communicate through `src/lib/api-client.ts`.

## Conventions

List endpoints should support:

```text
?page=1&pageSize=25&search=&sortBy=updatedAt&sortOrder=desc
```

Typical list response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 0,
    "totalPages": 0
  }
}
```

Typical error response:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "issues": [
    { "path": "name", "message": "Name is required" }
  ],
  "requestId": "req_..."
}
```

## Planned resources

```text
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me

GET    /companies
POST   /companies
GET    /companies/:id
PATCH  /companies/:id
POST   /companies/:id/archive
POST   /companies/:id/reactivate

GET    /contacts
POST   /contacts
GET    /contacts/:id
PATCH  /contacts/:id

GET    /deals
POST   /deals
GET    /deals/:id
PATCH  /deals/:id
POST   /deals/:id/stage
POST   /deals/:id/mark-won
POST   /deals/:id/mark-lost
POST   /deals/:id/reopen
POST   /deals/:id/create-project

GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id

GET    /tasks
POST   /tasks
GET    /tasks/:id
PATCH  /tasks/:id
POST   /tasks/:id/complete

GET    /activities
POST   /activities

GET    /audit
GET    /dashboard
```

## Relationship rule

The frontend now keeps both a stable ID and a display snapshot where useful.

Example:

```json
{
  "companyId": "northstar-logistics",
  "company": "Northstar Logistics"
}
```

The backend relationship is always based on `companyId`. Display names are not relational keys.

## Companies — Phase 02 contract

### List

```text
GET /companies?page=1&pageSize=25&search=northstar&status=CUSTOMER&sortBy=updatedAt&sortOrder=desc
```

`status=ARCHIVED` is a frontend/API convenience filter. Archiving is **not** the same as setting business status to `INACTIVE`.

Suggested response item:

```json
{
  "id": "cmp_...",
  "name": "Northstar Logistics",
  "industry": "Logistics",
  "status": "CUSTOMER",
  "location": "Berlin, DE",
  "website": "northstar.example",
  "ownerId": "usr_...",
  "owner": "Alex Morgan",
  "description": "Strategic account context...",
  "archivedAt": null,
  "createdAt": "2026-08-01T09:00:00.000Z",
  "updatedAt": "2026-08-28T09:00:00.000Z",
  "openDeals": 2,
  "activeProjects": 3,
  "value": 180000,
  "lastContact": "2026-08-28T08:30:00.000Z"
}
```

`openDeals`, `activeProjects`, `value` (pipeline value) and `lastContact` are **read-model/computed fields**. They should not be duplicated as mutable columns on the Company database table.

### Create

```text
POST /companies
```

```json
{
  "name": "Northstar Logistics",
  "industry": "Logistics",
  "status": "PROSPECT",
  "location": "Berlin, DE",
  "website": "northstar.example",
  "ownerId": "usr_...",
  "description": "Initial commercial context."
}
```

### Update

```text
PATCH /companies/:id
```

Accepts a partial version of the create payload. Relationship changes use IDs (`ownerId`), never display names.

### Archive / reactivate

```text
POST /companies/:id/archive
POST /companies/:id/reactivate
```

Archiving sets/clears `archivedAt`; it does not delete dependent contacts, deals, projects, activities or audit history.

### Company detail associations

The detail UI is designed to compose normal resource endpoints rather than require a large company-specific payload:

```text
GET /companies/:id
GET /contacts?companyId=:id
GET /deals?companyId=:id
GET /projects?companyId=:id
GET /activities?companyId=:id&includeRelated=true
```

`includeRelated=true` means activity directly on the company plus activity on its contacts, deals and projects can be rolled up into the account timeline.


## Contacts — Phase 03 contract

### List

```text
GET /contacts?page=1&pageSize=25&search=anna&companyId=cmp_...&channel=EMAIL&primary=true&archived=false&sortBy=updatedAt&sortOrder=desc
```

Suggested response item:

```json
{
  "id": "con_...",
  "name": "Anna Keller",
  "role": "Program Manager",
  "department": "Digital Operations",
  "companyId": "cmp_...",
  "company": "Northstar Logistics",
  "email": "anna.keller@example.com",
  "phone": "+49 69 000 110",
  "preferredChannel": "EMAIL",
  "isPrimary": true,
  "linkedin": "linkedin.com/in/anna-keller",
  "notes": "Stable stakeholder context...",
  "lastContact": "2026-08-28T10:32:00.000Z",
  "archivedAt": null,
  "createdAt": "2026-08-01T09:00:00.000Z",
  "updatedAt": "2026-08-28T10:32:00.000Z"
}
```

`company` and `lastContact` are read-model/display fields. The relation is always keyed by `companyId`; `lastContact` should be derived from activity rather than maintained independently when the backend is implemented.

### Create

```text
POST /contacts
```

```json
{
  "name": "Anna Keller",
  "role": "Program Manager",
  "department": "Digital Operations",
  "companyId": "cmp_...",
  "email": "anna.keller@example.com",
  "phone": "+49 69 000 110",
  "preferredChannel": "EMAIL",
  "isPrimary": true,
  "linkedin": "linkedin.com/in/anna-keller",
  "notes": "Primary commercial and delivery coordination contact."
}
```

### Primary-contact invariant

When `isPrimary=true`, the backend should set every other **active** contact for the same `companyId` to `isPrimary=false` in the same database transaction. Do not rely on the frontend checkbox to enforce this rule.

### Update

```text
PATCH /contacts/:id
```

Accepts a partial version of the create payload. Moving a contact to another company must re-evaluate the primary-contact invariant for both the old and new account.

### Archive / reactivate

```text
POST /contacts/:id/archive
POST /contacts/:id/reactivate
```

Archiving clears `isPrimary` and sets `archivedAt`; it must not delete activities, tasks, deal references or audit history.

### Contact detail composition

The Phase 03 detail route is designed around independently fetchable resources so the frontend can resolve them in parallel:

```text
GET /contacts/:id
GET /deals?primaryContactId=:id
GET /tasks?relationType=CONTACT&relationId=:id
GET /activities?relationType=CONTACT&relationId=:id
```

The contact response may include a small company summary, or the frontend can resolve `companyId` through the normal company resource when richer account context is required.

## Deals / Pipeline — Phase 04 contract

### List

```text
GET /deals?page=1&pageSize=25&search=dashboard&companyId=cmp_...&ownerId=usr_...&stage=PROPOSAL&open=true&sortBy=updatedAt&sortOrder=desc
```

Suggested response item:

```json
{
  "id": "deal_...",
  "title": "Ground Operations Dashboard",
  "companyId": "cmp_...",
  "company": "Northstar Logistics",
  "primaryContactId": "con_...",
  "stage": "NEGOTIATION",
  "value": 85000,
  "ownerId": "usr_...",
  "owner": "Maya Chen",
  "closeDate": "2026-09-18",
  "probability": 75,
  "description": "Stable opportunity context...",
  "lostReason": null,
  "closedAt": null,
  "createdAt": "2026-08-01T09:00:00.000Z",
  "updatedAt": "2026-08-28T09:00:00.000Z"
}
```

`company` and `owner` are display/read-model fields. Relations are keyed by `companyId`, `primaryContactId` and `ownerId`.

### Create / update

```text
POST  /deals
PATCH /deals/:id
```

```json
{
  "title": "Ground Operations Dashboard",
  "companyId": "cmp_...",
  "primaryContactId": "con_...",
  "stage": "NEGOTIATION",
  "value": 85000,
  "ownerId": "usr_...",
  "closeDate": "2026-09-18",
  "probability": 75,
  "description": "Commercial context..."
}
```

The backend should validate that `primaryContactId`, when supplied, belongs to the same `companyId` and is not archived.

### Stage transition

```text
POST /deals/:id/stage
```

```json
{ "stage": "PROPOSAL" }
```

Normal stage movement may apply the workspace's default probability for that stage. The frontend currently uses:

```text
NEW          20
CONTACTED    35
PROPOSAL     55
NEGOTIATION  75
WON         100
LOST          0
```

These defaults should eventually be workspace settings rather than hard-coded business rules.

### Terminal outcomes

Do not treat `LOST` as a normal generic PATCH. Use explicit business actions:

```text
POST /deals/:id/mark-won
POST /deals/:id/mark-lost
POST /deals/:id/reopen
```

Lost payload:

```json
{ "reason": "Budget deferred" }
```

Backend invariants:
- `mark-won` => `stage=WON`, `probability=100`, set `closedAt`.
- `mark-lost` => require non-empty reason, `stage=LOST`, `probability=0`, set `lostReason` and `closedAt`.
- `reopen` => move to an open stage, clear `lostReason` and `closedAt`.
- Every transition should write audit history; a user-facing Activity event can also be generated.

### Deal detail composition

The Phase 04 detail route resolves independent resources in parallel:

```text
GET /deals/:id
GET /companies/:companyId
GET /contacts/:primaryContactId
GET /tasks?relationType=DEAL&relationId=:id
GET /activities?relationType=DEAL&relationId=:id
GET /projects?sourceDealId=:id
```

### Won deal -> project handoff

Phase 05 will implement the full project creation UI. The backend command is reserved now so the domain boundary does not change later:

```text
POST /deals/:id/create-project
```

Suggested behavior: only a `WON` deal can create a project; creation is idempotent per source deal unless the backend explicitly supports multiple delivery projects. The new Project stores `sourceDealId`.

---

## Phase 05 — Projects / delivery

Projects remain delivery context inside the CRM, not a replacement for Jira/Linear. The CRM owns customer/commercial provenance, project health, key milestones, ownership and relationship history.

### Project model

```ts
Project {
  id: string
  organizationId: string
  title: string
  companyId: string
  sourceDealId?: string
  status: "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED"
  health: "ON_TRACK" | "AT_RISK" | "BLOCKED"
  ownerId: string
  progress: number // 0..100
  startDate: string
  targetDate: string
  description?: string
  archivedAt?: string | null
  createdAt: string
  updatedAt: string
}
```

`company`, `owner`, `team`, formatted target labels, milestone counts and task counts are read-model fields and should not be maintained as duplicate mutable database columns.

### Project endpoints

```text
GET    /projects
GET    /projects/:id
POST   /projects
PATCH  /projects/:id
POST   /projects/:id/status
POST   /projects/:id/progress
PUT    /projects/:id/team
POST   /projects/:id/archive
POST   /projects/:id/reactivate
```

Suggested list query:

```text
?page=1
&pageSize=20
&search=ops
&companyId=northstar-logistics
&ownerId=u-maya
&status=IN_PROGRESS
&health=AT_RISK
&active=true
&sortBy=targetDate
&sortOrder=asc
```

### Won Deal -> Project

```text
POST /deals/:id/create-project
```

Suggested request body:

```json
{
  "title": "Asset Intelligence Extension",
  "ownerId": "u-emma",
  "memberIds": ["u-emma", "u-noah"],
  "startDate": "2026-08-18",
  "targetDate": "2026-10-04",
  "health": "ON_TRACK",
  "description": "Delivery context..."
}
```

Backend invariants:
- Deal must be `WON`.
- Project company must equal the source deal company.
- `sourceDealId` is set by the backend from the route deal and is not subsequently mutable.
- By default, one non-archived Project per source Deal. Make the command idempotent or return `409 PROJECT_ALREADY_EXISTS` with the existing Project id.
- Project owner must be an active workspace member and must also be included in the Project team.
- Creating a Project must not delete or transform the Deal; the Deal remains the immutable commercial record.

### Team

```text
PUT /projects/:id/team
```

```json
{
  "memberIds": ["u-maya", "u-emma", "u-alex"]
}
```

Use a join table such as `ProjectMember(projectId, userId, createdAt)` rather than serializing user IDs into a single database column. The frontend currently nests ids only in its mock adapter.

### Milestones

```text
GET    /projects/:id/milestones
POST   /projects/:id/milestones
PATCH  /projects/:id/milestones/:milestoneId
DELETE /projects/:id/milestones/:milestoneId   // optional later
```

```ts
ProjectMilestone {
  id: string
  projectId: string
  title: string
  dueDate: string
  status: "PLANNED" | "IN_PROGRESS" | "DONE"
  createdAt: string
  updatedAt: string
}
```

Milestones are high-level delivery checkpoints only. Sprint issues and engineering work items should stay in the team’s dedicated delivery tool and can later be linked through integrations.

### Project detail read model

The frontend currently resolves these independently and in parallel:

```text
GET /projects/:id
GET /companies/:companyId
GET /deals/:sourceDealId          (optional)
GET /projects/:id/team
GET /tasks?relationType=PROJECT&relationId=:id
GET /activities?relationType=PROJECT&relationId=:id
GET /projects/:id/milestones
```

NestJS may expose the resources independently or provide an optimized detail/read-model endpoint later. Keep domain write commands separate even if reads become aggregated.

## Phase 06 — Tasks

`Task` is a mutable work item linked to exactly one CRM record through `relationType + relationId`.

### Endpoints

- `GET /api/v1/tasks?page=&pageSize=&search=&status=&priority=&assigneeId=&relationType=&relationId=&due=`
- `GET /api/v1/tasks/:id`
- `POST /api/v1/tasks`
- `PATCH /api/v1/tasks/:id`
- `POST /api/v1/tasks/:id/status` body `{ status: OPEN | IN_PROGRESS | DONE }`
- `POST /api/v1/tasks/:id/archive`
- `POST /api/v1/tasks/:id/reactivate`

### Task payload

```json
{
  "title": "Send revised milestone plan",
  "description": "Include the revised stakeholder review cadence.",
  "relationType": "CONTACT",
  "relationId": "c1",
  "assigneeId": "u-maya",
  "dueAt": "2026-08-29T16:30:00+02:00",
  "priority": "HIGH"
}
```

Backend invariants:
- Task `dueAt` is stored as a timezone-aware timestamp; human labels such as `Today` are presentation-only.
- `relationId` must exist for the supplied `relationType` and belong to the same organization.
- assignee must be an active organization member.
- setting `DONE` writes `completedAt`; reopening clears it.
- archive is soft-state only; historical relations are retained.
- status transitions and reassignment should emit audit events.

## Phase 06 — Activities

Activity is an append-oriented CRM trace record. The MVP logs activities but does not expose destructive editing from the UI.

### Endpoints

- `GET /api/v1/activities?page=&pageSize=&search=&type=&actorId=&relationType=&relationId=`
- `POST /api/v1/activities`

### Activity payload

```json
{
  "type": "MEETING",
  "title": "Milestone alignment",
  "detail": "Confirmed the revised stakeholder review cadence.",
  "actorId": "u-maya",
  "relationType": "PROJECT",
  "relationId": "p2",
  "occurredAt": "2026-08-28T10:32:00+02:00"
}
```

Backend invariants:
- actor and relation must belong to the current organization.
- `occurredAt` is distinct from server-side `createdAt`.
- business actions such as deal-stage transitions may create `UPDATE` activities server-side.
- activity deletion should not be part of the normal member role; corrections should be auditable.

## Future extension platform API (backend phase)

Extension API v3 currently persists portable runtime packages, custom themes and enabled state locally. Portable packages may contain validated themes, sandboxed remote modules, and project-ZIP runtime pages/widgets/entity tabs whose files are stored in IndexedDB; trusted code packages remain deployment artifacts. When NestJS is introduced, workspace extension state should move to backend resources without changing the frontend SDK contract.

Suggested resources:

```text
GET    /api/v1/extensions/catalog
GET    /api/v1/workspace/extensions
POST   /api/v1/workspace/extensions/install
PATCH  /api/v1/workspace/extensions/:extensionId
DELETE /api/v1/workspace/extensions/:extensionId
PUT    /api/v1/workspace/theme
POST   /api/v1/workspace/themes
PATCH  /api/v1/workspace/themes/:themeId
DELETE /api/v1/workspace/themes/:themeId
GET    /api/v1/workspace/extensions/:extensionId/permissions
PUT    /api/v1/workspace/extensions/:extensionId/permissions
```

Suggested backend entities:

```text
ExtensionPackage
- id
- extensionId
- version
- publisher
- manifestJson
- packageDigest
- signature
- status

WorkspaceExtension
- workspaceId
- extensionId
- installedVersion
- enabled
- installedBy
- installedAt

ExtensionPermissionGrant
- workspaceId
- extensionId
- permission
- grantedBy
- grantedAt

WorkspaceTheme
- workspaceId
- themeId
- extensionId
- themeJson            # tokens + validated visual profile
- backgroundImageUrl   # HTTPS URL only; do not proxy arbitrary private-network URLs
- updatedBy
- updatedAt

ExtensionRuntimeModule
- workspaceId
- extensionId
- moduleId
- remoteUrl            # HTTPS only, allowlist/CSP controlled
- enabled
- installedBy
- installedAt
```

Code-extension packages must be verified/signed before rollout. The backend should never grant an extension a broader CRM scope than the manifest requests and the administrator explicitly approves. Portable remote modules must remain origin-isolated, use HTTPS, be covered by an explicit `frame-src` Content-Security-Policy, and never receive CRM session cookies. Theme background URLs should reject `data:`, `javascript:`, credential-bearing URLs and private-network SSRF targets if the backend ever proxies/fetches them.

## Phase 07 — Operational dashboard read models

Dashboard filters are URL/API query parameters shared across every dashboard surface:

```text
period=30D | 90D | ALL
ownerId=usr_...
companyId=cmp_...
```

The frontend uses independent Parallel Routes, so the recommended NestJS design is a set of read-model endpoints rather than forcing every slot to load one large payload:

```text
GET /api/v1/dashboard/kpis?period=30D&ownerId=&companyId=
GET /api/v1/dashboard/pipeline?period=30D&ownerId=&companyId=
GET /api/v1/dashboard/work?period=30D&ownerId=&companyId=
GET /api/v1/dashboard/delivery?period=30D&ownerId=&companyId=
GET /api/v1/dashboard/accounts?period=30D&ownerId=&companyId=
GET /api/v1/dashboard/activity?period=30D&ownerId=&companyId=
```

The backend should calculate dashboard values from the same source-of-truth domain records used by list/detail endpoints. Do not persist duplicated KPI totals as authoritative CRM data.

Suggested KPI payload:

```json
{
  "activeCustomers": 18,
  "openPipelineValue": 585000,
  "weightedForecast": 326750,
  "activeProjects": 7,
  "projectsNeedingAttention": 2,
  "deliveryRate": 71,
  "overdueTasks": 3,
  "dueTodayTasks": 5
}
```

Suggested pipeline stage item:

```json
{
  "stage": "PROPOSAL",
  "dealCount": 4,
  "value": 240000,
  "weightedValue": 132000
}
```

Dashboard scope semantics:
- `ownerId` maps to account/deal/project owner, task assignee and activity actor for the corresponding read model.
- `companyId` rolls up records linked through Company, Contact, Deal and Project relations.
- `period` applies to the operational record timestamp used by each read model (`updatedAt` for mutable records and `occurredAt/createdAt` for activity).
- dashboard drill-down links reuse the same `ownerId` and `companyId` values on resource list endpoints.
- list endpoints now accept dashboard drill-down helpers: Companies `ownerId/companyId`, Deals `stage`, Tasks `companyId`, Activities `companyId`.

These endpoints are read-only aggregations. Deal stage changes, project health updates, task completion and activity creation remain domain commands on their own modules.

## Phase 08 — Authentication and session contract

The frontend supports a `mock` adapter for the standalone demo and an `api` adapter for the future NestJS identity service. Production must not persist access or refresh tokens in browser localStorage.

Recommended endpoints:

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
PATCH /api/v1/users/me
```

Example `GET /auth/me` / successful login response:

```json
{
  "user": {
    "id": "u-alex",
    "name": "Alex Morgan",
    "initials": "AM",
    "email": "alex@example.com",
    "roleId": "OWNER",
    "role": "Owner",
    "title": "Revenue Operations Lead"
  },
  "workspace": {
    "id": "workspace-demo",
    "name": "Demo Workspace",
    "plan": "Business"
  },
  "permissions": ["crm:read", "crm:write", "workspace:manage", "audit:read"],
  "expiresAt": "2026-08-28T20:24:00Z"
}
```

Production auth invariants:
- password verification, rate limiting, MFA and recovery belong to NestJS/identity infrastructure.
- use `Secure`, `HttpOnly` and appropriate `SameSite` settings for refresh/session cookies.
- every API command independently authorizes workspace membership and permission scope; frontend gates are UX only.
- session/refresh rotation and logout must invalidate server-side credentials.
- authentication and role changes append immutable audit events.

## Phase 08 — Workspace, members and RBAC

```text
GET   /api/v1/workspace/settings
PATCH /api/v1/workspace/settings
GET   /api/v1/workspace/members
POST  /api/v1/workspace/members
PATCH /api/v1/workspace/members/:userId
GET   /api/v1/workspace/roles
POST  /api/v1/workspace/roles
PATCH /api/v1/workspace/roles/:roleId
DELETE /api/v1/workspace/roles/:roleId
```

Core permission keys currently expected by the frontend:

```text
crm:read
crm:write
crm:archive
workspace:manage
members:manage
roles:manage
audit:read
extensions:manage
```

Backend invariants:
- every member and role is scoped to one workspace/organization.
- workspace owner role cannot be suspended/deleted through ordinary member commands.
- system roles may be immutable; custom roles can have editable permission sets.
- a role cannot be deleted while members still reference it unless an explicit reassignment is supplied.
- role/member/settings mutations create audit events.

## Phase 08 — Immutable audit API

```text
GET /api/v1/audit?q=&actorId=&action=&entityType=&from=&to=&page=&pageSize=
GET /api/v1/audit/:eventId
```

Audit events are append-only. Do **not** expose update/delete endpoints through the normal application API.

Suggested event shape:

```json
{
  "id": "aud_01J6BZR1",
  "occurredAt": "2026-08-28T09:14:00Z",
  "actorId": "u-maya",
  "actor": "Maya Chen",
  "action": "STATUS_CHANGE",
  "entityType": "DEAL",
  "entityId": "d1",
  "entityLabel": "Fleet Visibility Platform",
  "summary": "Deal stage changed from Proposal to Negotiation.",
  "requestId": "req_01J6BZR1",
  "ipAddress": "198.51.100.42",
  "before": { "stage": "PROPOSAL" },
  "after": { "stage": "NEGOTIATION" }
}
```
