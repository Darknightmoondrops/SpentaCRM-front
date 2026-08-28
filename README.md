<div align="center">

# SpentaCRM

### A free, customizable B2B CRM foundation for teams that want to launch fast and make the product their own.

**Build once. Customize freely. Deploy anywhere.**

[English](#english) · [فارسی](#فارسی) · [Roadmap](./FRONTEND-ROADMAP.md) · [Extensions](./EXTENSIONS.md) · [API Contracts](./API-CONTRACTS.md)

![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.2.8-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.9-339933?logo=nodedotjs&logoColor=white)
![Project Status](https://img.shields.io/badge/status-active_development-orange)

</div>

---

# English

## What is SpentaCRM?

**SpentaCRM** is a free B2B Customer Relationship Management platform designed as a reusable foundation for building company-specific CRM systems quickly.

The idea is simple: most organizations need many of the same CRM building blocks—accounts, contacts, opportunities, tasks, activities, permissions, dashboards, auditability, and integrations—but their workflows, terminology, branding, modules, and business rules are rarely identical.

SpentaCRM aims to provide the common foundation once, so developers and organizations can focus on the parts that actually make their CRM unique.

Instead of rebuilding a CRM from zero for every company, you can use SpentaCRM as a starting point, configure the workspace, adapt the workflow, install or build extensions, customize the theme, connect your own backend, and evolve it into a dedicated product for your organization.

> SpentaCRM is not intended to force every company into one fixed CRM model. The long-term goal is to support multiple CRM models and extension-driven workflows for different B2B use cases.

The project is under active development. New CRM models, modules, integrations, automation capabilities, AI-assisted features, customization options, and developer tooling are expected to be introduced in future releases.

---

## Why SpentaCRM?

Building a custom CRM usually means spending significant time recreating infrastructure that has little to do with the company's unique business logic.

SpentaCRM is intended to reduce that repeated work by offering:

- a ready-to-extend B2B CRM foundation;
- fast setup for internal or customer-specific deployments;
- company-neutral and white-label product configuration;
- modular business surfaces rather than one monolithic workflow;
- an extension system inspired by modern developer platforms;
- customizable themes and workspace appearance;
- frontend contracts prepared for a separate production backend;
- a codebase that can grow from a lightweight CRM into a larger business platform.

Typical use cases include B2B SaaS, software companies, professional services, consultancies, logistics, industrial organizations, financial services, energy, healthcare technology, and other account-led businesses.

---

## Current product scope

The current frontend release covers the core operational foundation of a B2B CRM.

### Relationship management

- Companies / Accounts
- Contacts and stakeholder relationships
- Primary-contact management
- Account-level activity roll-ups
- Search, filtering, sorting, pagination-ready state
- Archive and reactivate lifecycle flows

### Sales and pipeline

- Deals / Opportunities
- Pipeline and list views
- Stage-based workflow
- Weighted pipeline and forecast calculations
- Deal value, probability, expected close date, and commercial context
- Won / lost / reopen transitions
- Required loss reasons
- Company, contact, and owner associations

### Delivery and projects

- Customer-facing Projects
- Won Deal → Project handoff
- Delivery owner and team assignment
- Project status, health, dates, and progress
- Milestones
- Account and source-deal relationships
- Archive and reactivate lifecycle

SpentaCRM intentionally keeps project management lightweight. It is designed to preserve customer delivery context inside the CRM rather than replace dedicated tools such as Jira or Linear.

### Tasks and activities

- Shared work queue
- Task priorities and due states
- Start, pause, complete, reopen, archive, and reactivate flows
- Tasks linked to Companies, Contacts, Deals, or Projects
- Activity timeline
- Calls, notes, meetings, emails, and other relationship events
- Context-aware task and activity creation

### Operational dashboard

- Active customer KPI
- Open pipeline
- Weighted forecast
- Delivery-health signals
- Due-work overview
- Pipeline breakdown
- Priority work queue
- Account attention radar
- Customer activity intelligence
- URL-backed account, team, and period scope

### Authentication and workspace administration

- Sign-in flow
- Mock and API authentication adapters
- Route protection
- Workspace settings
- User profile settings
- Member management
- Invite, suspend, and reactivate flows
- System and custom roles
- RBAC permission manifests
- Permission-aware navigation and pages

### Auditability

- Immutable read-only Audit Log UI
- Search and filters
- Actor, action, and entity filtering
- Event detail view
- Before/after diff presentation
- Backend-ready audit contracts

### Global productivity

- Global `Cmd/Ctrl + K` search
- Deep links to CRM records
- Responsive application shell
- Loading, error, recovery, and empty states
- Accessibility baseline
- Server Components by default
- Suspense and streaming boundaries
- Next.js Parallel Routes on dashboard surfaces

---

## Portable Module ZIPs

SpentaCRM can install optional company capabilities from ZIP packages at runtime. Each ZIP contains a validated `spenta-module.json` manifest and declares one of four complexity levels: **simple**, **medium**, **advanced**, or **professional**. Installed modules appear in the **Modules & Extensions** catalogue and can be enabled or disabled per workspace.

A module ZIP is a small project package: `spenta-module.json` is only the manifest, while browser-ready HTML/CSS/JS under `dist/` implements the actual page, dashboard widget or entity tab. Package files are persisted in IndexedDB and rendered in sandboxed iframes, so portable modules can be installed without rebuilding Next.js and without executing uploaded code in the parent CRM origin. Trusted React/TypeScript extensions continue to use the compile-time registry. See [`MODULES.md`](./MODULES.md).

---

## Extension platform

One of SpentaCRM's core goals is to make the CRM extensible instead of forcing every customization into the core codebase.

The current **Extension API v3** supports several contribution models.

### Portable runtime extensions

Portable JSON extensions can add themes and remote modules without rebuilding the application.

They can be installed at runtime while keeping uploaded packages away from unrestricted same-origin JavaScript execution.

### Trusted code extensions

Trusted React / TypeScript packages can contribute richer application functionality and are installed as deployment-trusted packages.

Supported contribution points currently include:

- themes;
- modules;
- extension-owned pages;
- dashboard widgets;
- sidebar navigation;
- command-palette actions;
- sandboxed remote modules.

Portable API v3 modules can also mount sandboxed pages, dashboard widgets and entity tabs. Entity host surfaces are currently wired for Company, Contact, Deal and Project records.

See [EXTENSIONS.md](./EXTENSIONS.md) and [extension-examples](./extension-examples/) for the extension model and examples.

---

## Theme Studio and white-label customization

SpentaCRM is designed to be rebranded and adapted for different organizations.

Workspace administrators can build custom visual themes without editing the core application code.

Current theme capabilities include:

- light and dark appearance;
- configurable product palette and accent colors;
- radius and glass-surface controls;
- typography presets and text scaling;
- remote background images using HTTPS URLs;
- background opacity, blur, position, and sizing;
- sidebar, topbar, and surface transparency;
- visual effect presets such as `aurora`, `soft-glow`, `cyber-grid`, `scanlines`, `starfield`, `embers`, and `blood-mist`;
- effect intensity and speed controls;
- grain and vignette controls;
- live preview;
- theme export as an installable extension package.

Product identity can also be configured using environment variables without changing application source files.

---

## Architecture direction

SpentaCRM currently focuses on completing the frontend product surface while keeping clear boundaries for a separate backend.

The intended production architecture is:

```text
┌─────────────────────────────────────┐
│            SpentaCRM Web            │
│      Next.js + React + TypeScript   │
└──────────────────┬──────────────────┘
                   │ Typed HTTP/API contracts
                   ▼
┌─────────────────────────────────────┐
│          SpentaCRM Backend          │
│       NestJS modular monolith       │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│             PostgreSQL              │
└─────────────────────────────────────┘
```

The frontend already defines integration boundaries for:

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

See [API-CONTRACTS.md](./API-CONTRACTS.md) for backend DTOs, permission keys, and invariants.

---

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 |
| UI | React 19 |
| Language | TypeScript 5.8 |
| Routing | Next.js App Router |
| Rendering | Server Components + Client Components where needed |
| Async UI | Suspense, streaming, loading/error boundaries |
| Extension SDK | `@spentacrm/extension-sdk` |
| Linting | ESLint 9 |
| Runtime | Node.js 20.9+ |
| Planned backend | NestJS |
| Planned database | PostgreSQL |

---

## Getting started

### Prerequisites

Make sure you have:

- **Node.js 20.9 or newer**
- **pnpm** recommended, or npm

### 1. Clone the repository

```bash
git clone <YOUR_SPENTACRM_REPOSITORY_URL>
cd spentaCRM
```

### 2. Install dependencies

Using pnpm:

```bash
pnpm install
```

or npm:

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

### 4. Start the development server

```bash
pnpm dev
```

or:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Unauthenticated sessions are redirected to `/login`.

---

## Demo account

```text
Email:    alex@example.com
Password: demo1234
```

Other seeded workspace-member emails can use the same demo password to preview different role permissions.

> Demo authentication exists only to support the standalone frontend experience. Production authentication should be handled by the backend using secure credentialed session/cookie infrastructure.

---

## Authentication modes

### Standalone frontend demo

```env
NEXT_PUBLIC_AUTH_ADAPTER=mock
```

### Backend API mode

```env
NEXT_PUBLIC_AUTH_ADAPTER=api
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

Do not move production access or refresh tokens into `localStorage` simply to mirror the demo adapter.

---

## White-label configuration

The application identity and workspace defaults can be configured using `.env.local`.

```env
NEXT_PUBLIC_APP_NAME=SpentaCRM
NEXT_PUBLIC_APP_SHORT_NAME=Spenta
NEXT_PUBLIC_APP_TAGLINE=Relationships, pipeline & delivery
NEXT_PUBLIC_APP_VERSION=v0.13
NEXT_PUBLIC_WORKSPACE_NAME=Demo Workspace
NEXT_PUBLIC_WORKSPACE_PLAN=Business
NEXT_PUBLIC_LOCALE=en-GB
NEXT_PUBLIC_DEFAULT_CURRENCY=EUR
NEXT_PUBLIC_DEFAULT_TIMEZONE=Europe/Amsterdam
```

The central product configuration lives in:

```text
src/config/product.ts
```

---

## Available scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the production frontend |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint and automatically fix supported issues |
| `pnpm typecheck` | Run TypeScript checks without emitting files |
| `pnpm check` | Run typecheck, lint, and production build |
| `pnpm extensions:sync` | Regenerate the trusted extension registry |
| `pnpm extension:add -- <package>` | Register a trusted code extension |
| `pnpm extension:remove -- <package>` | Remove a trusted code extension from the registry |

The extension registry is synchronized automatically before development and production builds.

---

## Project structure

```text
spentaCRM/
├── src/
│   ├── app/                 # App Router routes and route groups
│   ├── auth/                # Authentication providers and adapters
│   ├── components/          # CRM feature components
│   │   ├── activities/
│   │   ├── audit/
│   │   ├── companies/
│   │   ├── contacts/
│   │   ├── dashboard/
│   │   ├── deals/
│   │   ├── extensions/
│   │   ├── projects/
│   │   ├── settings/
│   │   └── tasks/
│   ├── config/              # Product and workspace configuration
│   ├── extensions/          # Built-in and generated extension registry
│   └── lib/                 # Shared domain/API utilities
├── packages/
│   └── extension-sdk/       # SpentaCRM extension SDK
├── extension-examples/      # Example themes, modules and widgets
├── scripts/                 # Extension management scripts
├── API-CONTRACTS.md
├── DESIGN-NOTES.md
├── EXTENSIONS.md
├── FRONTEND-ROADMAP.md
├── OPTIMIZATION.md
├── PUBLIC-PRODUCT.md
└── README.md
```

---

## Development status

The current frontend roadmap has completed the major foundation through **Phase 08**.

Completed areas include:

- application foundation;
- companies;
- contacts;
- deals and pipeline;
- projects;
- tasks and activities;
- public / white-label productization;
- Extension API v3 and Theme Studio;
- operational dashboard;
- authentication, workspace settings, RBAC, and audit log.

The next frontend phase focuses on production polish, including:

- consistent toast and error patterns;
- confirmation dialogs for destructive operations;
- deeper keyboard-navigation QA;
- responsive QA;
- API DTO mapping;
- removal of direct mock-data dependencies from pages;
- OpenAPI-generated/shared type integration.

For the detailed implementation history and roadmap, see [FRONTEND-ROADMAP.md](./FRONTEND-ROADMAP.md).

---

## Future direction

SpentaCRM is intended to evolve beyond a single predefined B2B CRM interface.

Areas planned or being explored for future releases include:

- multiple CRM models for different business scenarios;
- richer extension contribution points;
- organization-specific modules and workflows;
- extension discovery and marketplace-style distribution;
- workflow automation;
- external integrations;
- advanced analytics and reporting;
- notification infrastructure;
- stronger package permission and verification models;
- backend-driven extension installation;
- AI-assisted CRM workflows;
- agentic CRM capabilities;
- intelligent account, opportunity, and activity assistance;
- additional deployment and self-hosting tooling.

Ideas and architecture may evolve as the project develops.

---

## Security model

Frontend route protection and permission-aware UI improve the user experience, but the frontend must **never** be treated as the final security authority.

A production backend must validate, at minimum:

- authentication;
- workspace / tenant isolation;
- authorization and RBAC permissions;
- protected reads and writes;
- audit-event integrity;
- extension permissions and trust level.

The extension platform deliberately separates trust levels between data-only themes, sandboxed remote modules, and deployment-trusted code extensions.

Do not execute arbitrary uploaded JavaScript using `eval`, inject unrestricted scripts into the CRM origin, or expose privileged CRM tokens to third-party extensions.

---

## Contributing

SpentaCRM is being developed as an extensible CRM foundation, and contributions that improve the platform architecture, CRM workflows, accessibility, performance, extensions, documentation, integrations, and developer experience are welcome.

A typical contribution flow is:

```bash
git checkout -b feature/my-feature
# make your changes
pnpm typecheck
pnpm lint
pnpm build
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

Then open a Pull Request describing:

1. what was changed;
2. why the change is useful;
3. screenshots or recordings for UI changes when applicable;
4. any API, data-model, permission, or extension implications.

Before larger architectural changes, opening an issue or discussion first is recommended so the implementation stays aligned with the direction of the project.

---

## Documentation

| Document | Purpose |
| --- | --- |
| [FRONTEND-ROADMAP.md](./FRONTEND-ROADMAP.md) | Product implementation phases and current status |
| [API-CONTRACTS.md](./API-CONTRACTS.md) | Planned NestJS API contracts, DTOs, permissions, and invariants |
| [EXTENSIONS.md](./EXTENSIONS.md) | Extension API v3, installation models, themes, remote modules, and security |
| [MODULES.md](./MODULES.md) | Portable ZIP module format, complexity levels, limits, and security model |
| [OPTIMIZATION.md](./OPTIMIZATION.md) | Next.js performance and rendering architecture |
| [PUBLIC-PRODUCT.md](./PUBLIC-PRODUCT.md) | B2B productization and white-label decisions |
| [DESIGN-NOTES.md](./DESIGN-NOTES.md) | Product visual system and design direction |

---

## License

SpentaCRM is intended to be distributed as a free and open-source project. A repository license file should be added before the project is formally released or redistributed so that usage, modification, contribution, and distribution rights are legally explicit.

---

## Project philosophy

SpentaCRM is built around a straightforward idea:

> Do not rebuild the same CRM foundation for every organization.

Build the common foundation once, keep it modular, make it customizable, and let each organization turn it into the CRM it actually needs.

**SpentaCRM is still evolving — this is only the foundation.**

---

# فارسی

## SpentaCRM چیست؟

**SpentaCRM** یک پلتفرم رایگان مدیریت ارتباط با مشتری برای کسب‌وکارهای **B2B** است که با هدف ساخت سریع CRMهای اختصاصی و قابل توسعه طراحی شده است.

ایده اصلی پروژه ساده است: بیشتر شرکت‌ها به اجزای پایه مشابهی در CRM نیاز دارند؛ مانند شرکت‌ها و مشتریان سازمانی، مخاطبان، فرصت‌های فروش، وظایف، فعالیت‌ها، سطح دسترسی، داشبورد، تاریخچه تغییرات و یکپارچه‌سازی‌ها. اما فرآیندها، اصطلاحات، ظاهر، ماژول‌ها و قوانین تجاری هر سازمان می‌تواند کاملاً متفاوت باشد.

هدف SpentaCRM این است که این زیرساخت مشترک فقط یک‌بار ساخته شود تا توسعه‌دهندگان و سازمان‌ها بتوانند زمان خود را روی بخش‌هایی بگذارند که CRM آن‌ها را واقعاً اختصاصی می‌کند.

به‌جای اینکه برای هر شرکت یک CRM از صفر ساخته شود، می‌توان SpentaCRM را به‌عنوان نقطه شروع استفاده کرد، تنظیمات Workspace را تغییر داد، فرآیندهای موردنیاز را شخصی‌سازی کرد، Extensionهای جدید نصب یا توسعه داد، ظاهر سیستم را تغییر داد، Backend اختصاصی را متصل کرد و در نهایت آن را به یک محصول اختصاصی برای سازمان تبدیل کرد.

> SpentaCRM قرار نیست همه شرکت‌ها را مجبور به استفاده از یک مدل ثابت CRM کند. هدف بلندمدت پروژه پشتیبانی از مدل‌های مختلف CRM و Workflowهای قابل توسعه برای سناریوهای متفاوت B2B است.

این پروژه در حال توسعه فعال است و در نسخه‌های بعدی مدل‌های CRM جدید، ماژول‌ها، Integrationها، Automation، قابلیت‌های مبتنی بر هوش مصنوعی، گزینه‌های شخصی‌سازی و ابزارهای توسعه بیشتری به آن اضافه خواهند شد.

---

## چرا SpentaCRM؟

ساخت CRM اختصاصی معمولاً باعث می‌شود بخش زیادی از زمان توسعه صرف ساخت دوباره زیرساخت‌هایی شود که ارتباط مستقیمی با منطق اختصاصی کسب‌وکار ندارند.

SpentaCRM تلاش می‌کند این کار تکراری را کاهش دهد و یک پایه آماده برای موارد زیر فراهم کند:

- راه‌اندازی سریع CRMهای B2B؛
- استفاده به‌عنوان پایه یک CRM داخلی یا پروژه اختصاصی مشتری؛
- White-label و تغییر هویت محصول برای هر سازمان؛
- معماری ماژولار به‌جای یک Workflow ثابت و یکپارچه؛
- سیستم Extension برای توسعه قابلیت‌ها؛
- Theme و ظاهر کاملاً قابل شخصی‌سازی؛
- مرزهای مشخص برای اتصال Frontend به Backend مستقل؛
- امکان رشد از یک CRM سبک به یک پلتفرم تجاری بزرگ‌تر.

این پروژه می‌تواند برای شرکت‌های نرم‌افزاری و SaaS، خدمات حرفه‌ای، مشاوره، لجستیک، صنایع، خدمات مالی، انرژی، فناوری سلامت و سایر کسب‌وکارهای account-led مناسب باشد.

---

## امکانات فعلی

نسخه فعلی Frontend بخش‌های اصلی موردنیاز برای عملیات یک CRM B2B را پوشش می‌دهد.

### مدیریت ارتباط با مشتری

- Companies / Accounts
- Contacts و Stakeholderها
- مدیریت مخاطب اصلی هر شرکت
- نمایش Activityهای مرتبط با هر Account
- جستجو، فیلتر، مرتب‌سازی و ساختار آماده Pagination
- Archive و Reactivate کردن رکوردها

### فروش و Pipeline

- Deals / Opportunities
- نمای Pipeline و List
- Workflow مبتنی بر Stage
- محاسبه Weighted Pipeline و Forecast
- مبلغ Deal، Probability و Expected Close Date
- وضعیت Won / Lost / Reopen
- اجباری بودن Loss Reason برای Dealهای از دست‌رفته
- ارتباط Deal با Company، Contact و Owner

### Delivery و Projects

- پروژه‌های مرتبط با مشتری
- تبدیل Won Deal به Project
- Delivery Owner و اعضای تیم
- وضعیت، Health، تاریخ‌ها و Progress پروژه
- Milestoneها
- ارتباط Project با Account و Source Deal
- Archive و Reactivate

مدیریت پروژه در SpentaCRM عمداً سبک نگه داشته شده است. هدف آن حفظ Context مربوط به تحویل خدمات به مشتری در CRM است، نه جایگزین شدن با ابزارهایی مثل Jira یا Linear.

### Tasks و Activities

- Work Queue مشترک
- Priority و Due State
- Start، Pause، Complete، Reopen، Archive و Reactivate وظایف
- اتصال Task به Company، Contact، Deal یا Project
- Timeline فعالیت‌ها
- ثبت تماس، Note، جلسه، Email و سایر تعاملات
- ساخت Task و Activity مستقیماً از Context رکوردهای مختلف

### داشبورد عملیاتی

- KPI مشتریان فعال
- Open Pipeline
- Weighted Forecast
- وضعیت Delivery
- Due Work
- Pipeline Breakdown
- صف کارهای دارای اولویت
- Account Attention Radar
- Customer Activity Intelligence
- Scope مبتنی بر Account، Team Member و بازه زمانی

### احراز هویت و مدیریت Workspace

- Sign-in
- Mock و API Authentication Adapter
- Route Protection
- Workspace Settings
- User Profile Settings
- مدیریت اعضا
- Invite، Suspend و Reactivate اعضا
- Roleهای سیستمی و سفارشی
- RBAC Permission Manifest
- نمایش منوها و صفحات براساس سطح دسترسی

### Audit Log

- رابط Read-only برای Audit Log
- جستجو و فیلتر
- فیلتر بر اساس Actor، Action و Entity
- مشاهده جزئیات Event
- نمایش تغییرات Before / After
- قراردادهای آماده برای Backend

### قابلیت‌های عمومی

- جستجوی سراسری با `Cmd/Ctrl + K`
- Deep Link به رکوردهای CRM
- Responsive Application Shell
- Loading، Error، Recovery و Empty State
- Accessibility baseline
- استفاده از Server Components به‌صورت پیش‌فرض
- Suspense و Streaming
- Parallel Routes در بخش Dashboard

---

## ماژول‌های ZIP قابل نصب

SpentaCRM می‌تواند قابلیت‌های اختیاری هر شرکت را به‌صورت فایل ZIP دریافت و در بخش **Modules & Extensions** ثبت کند. هر پکیج دارای فایل `spenta-module.json` است و یکی از چهار سطح **simple**، **medium**، **advanced** یا **professional** را مشخص می‌کند. ماژول نصب‌شده را می‌توان برای هر Workspace فعال یا غیرفعال کرد.

فایل ZIP یک پروژه کوچک ماژول است: `spenta-module.json` فقط Manifest آن است و فایل‌های آماده مرورگر در `dist/` صفحه، Widget یا Tab واقعی را پیاده‌سازی می‌کنند. فایل‌های پکیج در IndexedDB ذخیره و داخل iframe sandbox اجرا می‌شوند؛ بنابراین ماژول Portable بدون Build مجدد Next.js نصب می‌شود و کد آپلودشده نیز در Origin اصلی CRM اجرا نمی‌شود. Extensionهای React/TypeScript دارای دسترسی مستقیم به Core همچنان به‌صورت Trusted و در زمان Build ثبت می‌شوند. جزئیات در [`MODULES.md`](./MODULES.md) آمده است.

---

## سیستم Extension

یکی از اهداف اصلی SpentaCRM این است که برای هر قابلیت جدید مجبور به تغییر Core پروژه نباشیم.

در حال حاضر **Extension API v3** چند مدل توسعه را پشتیبانی می‌کند.

### Portable Runtime Extensions

Extensionهای JSON می‌توانند بدون Build مجدد، Theme یا Remote Module به CRM اضافه کنند.

این مدل برای Extensionهایی طراحی شده که باید در Runtime نصب شوند، بدون اینکه JavaScript آپلودشده دسترسی unrestricted به Origin اصلی CRM داشته باشد.

### Trusted Code Extensions

Extensionهای React / TypeScript می‌توانند قابلیت‌های پیشرفته‌تری ایجاد کنند و به‌عنوان Package قابل اعتماد هنگام Deployment نصب می‌شوند.

Contribution Pointهای فعلی شامل موارد زیر هستند:

- Theme؛
- Module؛
- Page اختصاصی Extension؛
- Dashboard Widget؛
- Sidebar Navigation؛
- Command Palette Action؛
- Remote Moduleهای Sandbox شده.

برای جزئیات بیشتر [EXTENSIONS.md](./EXTENSIONS.md) و [extension-examples](./extension-examples/) را ببینید.

---

## Theme Studio و White-label

SpentaCRM از ابتدا به‌گونه‌ای طراحی شده که بتوان آن را برای سازمان‌های مختلف Rebrand و Customize کرد.

مدیر Workspace می‌تواند بدون تغییر کد اصلی Theme اختصاصی بسازد.

قابلیت‌های فعلی Theme Studio شامل موارد زیر است:

- Light و Dark mode؛
- تغییر Palette و Accent Color؛
- تنظیم Radius و Glass Surface؛
- Typography Preset و Text Scale؛
- تصویر پس‌زمینه از طریق HTTPS URL؛
- تنظیم Opacity، Blur، Position و Size پس‌زمینه؛
- Transparency برای Sidebar، Topbar و Surfaceها؛
- Effectهایی مانند `aurora`، `soft-glow`، `cyber-grid`، `scanlines`، `starfield`، `embers` و `blood-mist`؛
- تنظیم شدت و سرعت Effect؛
- Grain و Vignette؛
- Live Preview؛
- خروجی گرفتن Theme به‌صورت Extension قابل نصب.

هویت اصلی محصول نیز از طریق Environment Variable قابل تغییر است و برای تغییر نام یا اطلاعات Workspace نیازی به تغییر مستقیم Source Code نیست.

---

## معماری هدف

در وضعیت فعلی تمرکز پروژه روی تکمیل Frontend است، اما Boundaryهای موردنیاز برای Backend مستقل از قبل تعریف شده‌اند.

معماری هدف برای نسخه Production به شکل زیر است:

```text
┌─────────────────────────────────────┐
│            SpentaCRM Web            │
│      Next.js + React + TypeScript   │
└──────────────────┬──────────────────┘
                   │ Typed HTTP/API contracts
                   ▼
┌─────────────────────────────────────┐
│          SpentaCRM Backend          │
│       NestJS modular monolith       │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│             PostgreSQL              │
└─────────────────────────────────────┘
```

Frontend در حال حاضر Boundaryهای لازم را برای Endpointهای زیر در نظر گرفته است:

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

برای DTOها، Permission Keyها و Invariantهای Backend فایل [API-CONTRACTS.md](./API-CONTRACTS.md) را ببینید.

---

## تکنولوژی‌ها

| بخش | تکنولوژی |
| --- | --- |
| Framework | Next.js 16 |
| UI | React 19 |
| Language | TypeScript 5.8 |
| Routing | Next.js App Router |
| Rendering | Server Components + Client Components |
| Async UI | Suspense، Streaming، Loading/Error Boundaries |
| Extension SDK | `@spentacrm/extension-sdk` |
| Linting | ESLint 9 |
| Runtime | Node.js 20.9+ |
| Backend هدف | NestJS |
| Database هدف | PostgreSQL |

---

## راه‌اندازی پروژه

### پیش‌نیازها

- **Node.js 20.9 یا جدیدتر**
- ترجیحاً **pnpm** یا npm

### ۱. Clone کردن Repository

```bash
git clone <YOUR_SPENTACRM_REPOSITORY_URL>
cd spentaCRM
```

### ۲. نصب Dependencyها

```bash
pnpm install
```

یا:

```bash
npm install
```

### ۳. تنظیم Environment Variableها

```bash
cp .env.example .env.local
```

در PowerShell ویندوز:

```powershell
Copy-Item .env.example .env.local
```

### ۴. اجرای Development Server

```bash
pnpm dev
```

یا:

```bash
npm run dev
```

سپس آدرس زیر را باز کنید:

```text
http://localhost:3000
```

کاربرانی که Login نشده‌اند به `/login` منتقل می‌شوند.

---

## حساب Demo

```text
Email:    alex@example.com
Password: demo1234
```

برای مشاهده Permissionهای Roleهای مختلف می‌توان از Email سایر اعضای Seed شده Workspace با همان Password استفاده کرد.

> Authentication فعلی برای Demo مستقل Frontend است. در Production باید Authentication توسط Backend و Session/Cookie امن انجام شود.

---

## حالت‌های Authentication

### Demo مستقل Frontend

```env
NEXT_PUBLIC_AUTH_ADAPTER=mock
```

### اتصال به Backend

```env
NEXT_PUBLIC_AUTH_ADAPTER=api
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

در نسخه Production نباید Access Token یا Refresh Token فقط برای شبیه شدن به Demo Adapter داخل `localStorage` قرار داده شود.

---

## تنظیم White-label

نام برنامه و تنظیمات پیش‌فرض Workspace از طریق `.env.local` قابل تغییر است:

```env
NEXT_PUBLIC_APP_NAME=SpentaCRM
NEXT_PUBLIC_APP_SHORT_NAME=Spenta
NEXT_PUBLIC_APP_TAGLINE=Relationships, pipeline & delivery
NEXT_PUBLIC_APP_VERSION=v0.13
NEXT_PUBLIC_WORKSPACE_NAME=Demo Workspace
NEXT_PUBLIC_WORKSPACE_PLAN=Business
NEXT_PUBLIC_LOCALE=fa-IR
NEXT_PUBLIC_DEFAULT_CURRENCY=IRR
NEXT_PUBLIC_DEFAULT_TIMEZONE=Asia/Tehran
```

تنظیمات مرکزی محصول در مسیر زیر قرار دارد:

```text
src/config/product.ts
```

---

## Scriptهای پروژه

| Command | کاربرد |
| --- | --- |
| `pnpm dev` | اجرای Development Server |
| `pnpm build` | Production Build |
| `pnpm start` | اجرای Production Server |
| `pnpm lint` | اجرای ESLint |
| `pnpm lint:fix` | اجرای ESLint و اصلاح خودکار موارد قابل اصلاح |
| `pnpm typecheck` | بررسی TypeScript بدون ساخت فایل خروجی |
| `pnpm check` | اجرای Typecheck، Lint و Build |
| `pnpm extensions:sync` | ساخت مجدد Registry مربوط به Extensionهای Trusted |
| `pnpm extension:add -- <package>` | ثبت یک Trusted Code Extension |
| `pnpm extension:remove -- <package>` | حذف Extension از Registry |

Registry مربوط به Extensionها قبل از `dev` و `build` به‌صورت خودکار Sync می‌شود.

---

## ساختار پروژه

```text
spentaCRM/
├── src/
│   ├── app/                 # Routeها و Route Groupهای App Router
│   ├── auth/                # Provider و Adapterهای Authentication
│   ├── components/          # Componentهای قابلیت‌های CRM
│   │   ├── activities/
│   │   ├── audit/
│   │   ├── companies/
│   │   ├── contacts/
│   │   ├── dashboard/
│   │   ├── deals/
│   │   ├── extensions/
│   │   ├── projects/
│   │   ├── settings/
│   │   └── tasks/
│   ├── config/              # تنظیمات Product و Workspace
│   ├── extensions/          # Extensionهای Built-in و Registry
│   └── lib/                 # Domain و API Utilityهای مشترک
├── packages/
│   └── extension-sdk/       # SDK مربوط به Extensionهای SpentaCRM
├── extension-examples/      # نمونه Theme، Module و Widget
├── scripts/                 # Scriptهای مدیریت Extension
├── API-CONTRACTS.md
├── DESIGN-NOTES.md
├── EXTENSIONS.md
├── FRONTEND-ROADMAP.md
├── OPTIMIZATION.md
├── PUBLIC-PRODUCT.md
└── README.md
```

---

## وضعیت توسعه

Roadmap فعلی Frontend تا بخش‌های اصلی **Phase 08** تکمیل شده است.

بخش‌های تکمیل‌شده شامل موارد زیر هستند:

- Foundation؛
- Companies؛
- Contacts؛
- Deals و Pipeline؛
- Projects؛
- Tasks و Activities؛
- Public / White-label Productization؛
- Extension API v3 و Theme Studio؛
- Operational Dashboard؛
- Authentication، Workspace Settings، RBAC و Audit Log.

فاز بعدی Frontend روی Production Polish تمرکز دارد، از جمله:

- Toast و Error Pattern یکپارچه؛
- Confirm Dialog برای عملیات مخرب؛
- تکمیل Keyboard Navigation؛
- Responsive QA؛
- API DTO Mapping Layer؛
- حذف Import مستقیم Mock Data از Pageها؛
- نقطه اتصال برای Typeهای تولیدشده از OpenAPI.

جزئیات کامل در [FRONTEND-ROADMAP.md](./FRONTEND-ROADMAP.md) قرار دارد.

---

## مسیر آینده پروژه

هدف SpentaCRM این است که در آینده از یک رابط ثابت CRM فراتر برود و بتوان از یک Core مشترک، CRMهای مختلف ساخت.

مواردی که برای نسخه‌های آینده در نظر گرفته شده یا قابل بررسی هستند:

- مدل‌های مختلف CRM برای سناریوهای تجاری متفاوت؛
- Contribution Pointهای بیشتر برای Extensionها؛
- Module و Workflowهای اختصاصی سازمان‌ها؛
- Extension Discovery و Marketplace؛
- Workflow Automation؛
- Integration با سرویس‌های خارجی؛
- Analytics و Reporting پیشرفته؛
- Notification Infrastructure؛
- Permission و Verification قوی‌تر برای Packageها؛
- نصب Extension از طریق Backend؛
- قابلیت‌های CRM مبتنی بر هوش مصنوعی؛
- Agentic CRM؛
- دستیارهای هوشمند برای Account، Opportunity و Activity؛
- ابزارهای بیشتر برای Deployment و Self-hosting.

معماری و اولویت این قابلیت‌ها ممکن است همزمان با رشد پروژه تغییر کند.

---

## مدل امنیتی

Route Protection و Permission-aware UI در Frontend برای UX و جلوگیری از دسترسی تصادفی مفید هستند، اما **Frontend نباید مرجع نهایی امنیت باشد**.

Backend نسخه Production باید حداقل موارد زیر را روی تمام عملیات محافظت‌شده بررسی کند:

- Authentication؛
- جداسازی Workspace / Tenant؛
- Authorization و RBAC؛
- Read و Writeهای محافظت‌شده؛
- صحت Audit Eventها؛
- Permission و Trust Level مربوط به Extensionها.

سیستم Extension نیز بین Themeهای Data-only، Remote Moduleهای Sandbox شده و Code Extensionهای Trusted تفاوت قائل می‌شود.

JavaScript آپلودشده نباید با `eval` اجرا شود، Script دلخواه نباید به Origin اصلی CRM Inject شود و Tokenهای دارای سطح دسترسی بالا نباید بدون محدودیت در اختیار Extensionهای ثالث قرار بگیرند.

---

## مشارکت در توسعه

SpentaCRM به‌عنوان یک CRM Foundation قابل توسعه ساخته می‌شود. Contributionهایی که معماری پلتفرم، Workflowهای CRM، Accessibility، Performance، Extensionها، Documentation، Integrationها و Developer Experience را بهبود دهند می‌توانند به رشد پروژه کمک کنند.

Workflow پیشنهادی:

```bash
git checkout -b feature/my-feature
# changes
pnpm typecheck
pnpm lint
pnpm build
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

سپس یک Pull Request ایجاد کنید و در آن مشخص کنید:

1. چه چیزی تغییر کرده است؛
2. چرا این تغییر مفید است؛
3. در صورت تغییر UI، Screenshot یا Recording اضافه کنید؛
4. تأثیر تغییر روی API، Data Model، Permission یا Extensionها را توضیح دهید.

برای تغییرات بزرگ معماری بهتر است ابتدا Issue یا Discussion ایجاد شود.

---

## مستندات

| فایل | توضیح |
| --- | --- |
| [FRONTEND-ROADMAP.md](./FRONTEND-ROADMAP.md) | فازهای توسعه و وضعیت فعلی Frontend |
| [API-CONTRACTS.md](./API-CONTRACTS.md) | قراردادهای Backend، DTOها، Permissionها و Invariantها |
| [EXTENSIONS.md](./EXTENSIONS.md) | Extension API v3، مدل نصب، Theme، Remote Module و Security |
| [MODULES.md](./MODULES.md) | فرمت ماژول ZIP، سطح‌بندی، محدودیت‌ها و مدل امنیتی |
| [OPTIMIZATION.md](./OPTIMIZATION.md) | معماری Performance و Rendering در Next.js |
| [PUBLIC-PRODUCT.md](./PUBLIC-PRODUCT.md) | تصمیمات مربوط به B2B Productization و White-label |
| [DESIGN-NOTES.md](./DESIGN-NOTES.md) | Design System و جهت بصری محصول |

---

## License

هدف این است که SpentaCRM به‌صورت رایگان و Open Source منتشر شود. پیش از انتشار رسمی یا دریافت Contribution عمومی، باید یک فایل License مناسب به Repository اضافه شود تا حقوق استفاده، تغییر، انتشار و مشارکت به‌صورت حقوقی مشخص باشند.

---

## فلسفه پروژه

ایده اصلی SpentaCRM را می‌توان در یک جمله خلاصه کرد:

> برای هر سازمان، زیرساخت یکسان CRM را دوباره از صفر نساز.

یک Core مشترک بساز، آن را ماژولار و قابل توسعه نگه دار و اجازه بده هر سازمان آن را به CRM موردنیاز خودش تبدیل کند.

**SpentaCRM هنوز در حال رشد است — این فقط پایه کار است.**
