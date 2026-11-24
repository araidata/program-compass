# Architecture — authoritative requirements

> Governing update: the 2026-11-23 strategic scope correction and latest Framework Alignment requirements below supersede conflicting historical proposals. Dedicated framework assessment and implementation tracking are core; enterprise GRC workflows remain excluded. Current authorization: documentation review only.

This file is the single architectural source of truth for both Codex and Claude Code. Read it together with PROJECT_SCOPE.md before changes; update this file when an approved architectural decision changes.

- One Next.js application with App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui components, and npm. Use stable, mutually compatible versions and commit the lockfile.
- Host through native Vercel GitHub integration. Use Neon PostgreSQL via the Vercel Marketplace after repository import. Do not provision a database during Phase 0.
- Prisma is the ORM. Keep its schema in prisma/ and CLI connection settings in prisma.config.ts. Generate the client independently of connectivity; never run migrations during application builds.
- Phase 0 renders static initialization and module placeholders. Do not import or initialize a database client in routes until database-backed work is authorized. No runtime database connection is required.
- Native application authentication and server-side authorization must protect database-backed functionality before organizational data is introduced. No Microsoft Entra ID or external SSO dependencies. Authentication is not implemented in Phase 0.
- No hard-coded credentials, committed secrets, authoritative browser local storage, temporary production SQLite, unnecessary microservices, or fabricated organizational metrics. Use synthetic development data only.
- Preserve three cybersecurity pillars: Security Operations; Security Architecture & Engineering; Governance, Risk & Compliance.

## Application shell and UI conventions

Approved 2026-11-24 (DECISION_LOG P-01 to P-08, P-12, P-13); rationale in UX_REVIEW.md.

- Navigation is grouped: Overview; Assess (Capabilities, Compliance, Risks & Findings); Plan (Business Context, Roadmap); Resources (Workforce, Technology); Reports; Settings pinned last. Navigation is defined once in src/lib/navigation.ts. Active state matches the route prefix so nested pages keep their module highlighted.
- The organizational pillar is a global scope (Enterprise, Security Operations, Security Architecture & Engineering, Governance, Risk & Compliance) chosen in the header, held in the `pillar` URL search parameter, and kept across navigation. Pillar views are filters on shared pages, never separate page copies.
- A planning cycle selector sits beside the scope control once cycles exist in the Phase 1 schema.
- Every module uses one layout: one-line page header with at most one primary action; summary strip; view tabs; filters held in the URL; dense table; side panel for detail and editing. Modals are for confirmations only. Owners are chosen from person records, never typed.
- Visual system: light collapsible sidebar, 48 px header, Inter via next/font with tabular numerals for figures, neutral palette with a single accent, status colours used only for status and always labelled, a separate reserved colour per pillar. All colours are design tokens in src/app/globals.css; components do not hard-code palette utilities. Borders over shadows, compact spacing, full-width content. No taglines, logos, hero banners, decorative graphics, or promotional copy.
- Full functionality from 1280 px wide; smaller screens prioritize reading. Text contrast meets WCAG AA, every grid has a keyboard path, and colour never carries meaning alone.

## Code boundaries

src/app contains route entry points and metadata; src/components contains the application shell and reusable UI; src/lib contains shared navigation and utilities. Future business modules should keep domain logic separate from presentation. Server-only database access and authorization belong behind server boundaries, never in client components.

## Deployment boundary

Use Node.js 24 LTS. npm run build generates Prisma code and builds Next.js without querying a database. Runtime connections will use the pooled DATABASE_URL and a PostgreSQL driver adapter in a later phase; Prisma migrations use DIRECT_URL. No domain models or migrations are introduced in Phase 0.

## Tooling compatibility

Prisma CLI and client use stable 7.10.1 rather than the release candidate currently advertised by the CLI's latest tag. ESLint stays on 9.39.5 because the Next.js configuration's React, accessibility, and import plugins declare support through major 9; npm marks this ESLint line deprecated. Upgrade the lint stack together when those plugins support the current major. Targeted overrides select Effect 3.22.5 for Prisma configuration and minimatch 11.0.9 for shadcn's code-generation tooling to resolve published audit findings. Revalidate schema generation, linting, and production builds when changing these overrides.

## Shared requirements and interface boundary

PROJECT_SCOPE.md owns scope, FUNCTIONAL_REQUIREMENTS.md owns functional requirements, and this file owns technical architecture. PROJECT_STATUS.md records state; DECISION_LOG.md records rationale. The initial phase is Phase 0 here. UI/UX review precedes separately authorized persistence work. Use the application name alone: no logo, tagline, welcome banner or promotional copy. Keep the interface compact, accessible and operational; placeholders collect no data.

Future calculation logic belongs in domain modules separate from React with versioned inputs, provenance and independently tested formulas. AI assistance is a later separately authorized enhancement; do not select or integrate a provider in the foundation.

## Future security controls

Use secure password hashing, revocable server-managed sessions, server-side role authorization and input validation, least-privilege database access and attributable change history. Administrative, editing and read-only permissions require a reviewed matrix. Do not implement public registration or select external identity providers. Prevent sensitive organizational data in logs. No CJI, PHI, credentials, restricted incident evidence or real assessments in development; hosting, handling and application security need approval before actual organizational data. Initial public deployment contains only static placeholders. AI must reference supporting application data, separate facts from assumptions and never invent regulatory requirements, pricing or benchmark claims.

## Authorized secure persistence — 2026-11-23

The user’s Phase 4 request maps to repository Phase 1, not the later strategy phase. Earlier Phase 0 statements describe the completed historical foundation. Preserve Claude’s approved shell and all deferred business-module boundaries.

- Better Auth 1.7 native email/password with scrypt hashing, disabled public registration, no external providers, database rate limiting (5 login attempts per minute per trusted Vercel client IP), HttpOnly SameSite=Lax cookies and HTTPS Secure cookies. Sessions are stored in PostgreSQL, capped at eight hours, not refreshed, and immediately revoked on account/role changes. No cookie session cache.
- Server-only Prisma 7 PostgreSQL adapter, lazy reusable client with a bounded pool. Prisma generates CommonJS-compatible client output for the Next.js and Playwright toolchains. DATABASE_URL is pooled runtime access; DIRECT_URL is unpooled migration/operator access. Builds never query or migrate.
- Roles are a fixed enum and explicit permission matrix: administrator reads/writes/administers; editor reads/writes future records; viewer reads. Configuration, users and history are administrator-only. API guards validate current database role/activation on every request. Page boundaries also validate sessions; client controls are supplemental.
- User, Account, Session, Verification and RateLimit support the maintained auth adapter. Organization and ApplicationSettings are singletons; Pillar and OrganizationalFunction are configurable. ChangeEvent records allowlisted administrative fields in the same transaction as each mutation. No workforce, assessments, framework datasets or planning tables yet.
- Thin route handlers use strict Zod inputs, origin checks on mutations, no-store JSON responses, sanitized errors, bounded pagination and allowlisted sorts. Administration serializes mutations with a transaction advisory lock and rechecks the actor. The last active administrator cannot be removed or demoted.
- Production uses program-compass-db. Development and Preview share a dedicated synthetic-only program-compass-nonproduction-db, isolated from production. Both are native Vercel Marketplace Neon Free resources in iad1. Preview credentials never target production. Per-feature branch isolation can be added later.
- No HTTP bootstrap route. The operator CLI provisions the first administrator only when no users exist, hashes its supplied password and records history atomically. Production commands require an explicit acknowledgement.
- Actual organizational security data still requires a hosting/handling security review. Runtime currently uses integration-managed database ownership credentials; a separate restricted runtime role and external audit retention are future hardening requirements before that review is approved.

## Strategic planning boundary — 2026-11-23

The latest strategic scope correction supersedes earlier architecture language implying standalone compliance/risk business modules or a mandatory universal table-only presentation. Keep the existing Next.js/Prisma/PostgreSQL/authentication infrastructure. No rewrite, service split, new identity provider or infrastructure replacement is required.

Framework/requirement/mapping reference records preserve official identifiers, hierarchy, descriptions, versions, sources and deadlines. Organization-specific requirement applicability, implementation status, current/target maturity, notes/observations and history are separate assessment records. Dedicated Framework Alignment supports these core assessments and analytics. Do not introduce evidence platforms, attestation, audit lifecycle, formal control testing, compliance exception approvals, formal risk acceptance, continuous compliance monitoring or comprehensive GRC engines. Lightweight planning issues may hold a source-system reference, impact rationale, owner, target date and capability/initiative/resource links. Broad risk scoring/risk heat maps require a demonstrated strategic need and separate method approval; they are not a default subsystem. Required framework coverage heat maps remain core assessment functionality.

The proposed IA relabels Compliance as a dedicated Framework Alignment section, retains its route for compatibility, and integrates lightweight planning issues into capabilities/initiatives instead of a standalone enterprise risk module. This review changes documents only. Reuse the shell, URL scope, server authorization, validation and transactional history. Future domain additions are additive, separately reviewed migrations; Person/Position ownership is independent of login User. Versioned pure domain functions calculate maturity, performance, framework coverage/gaps/trends/projections, readiness, workload, capacity and budgets consistently across views/exports. Capability maturity is authoritative and shared across framework mappings; requirement-specific assessments cannot overwrite or duplicate it. Assessed, target, projected, implementation status, coverage and verified compliance are distinct concepts; the application does not certify compliance. No AI provider or authoritative browser storage.

## Capability assessment slice — 2026-11-24

- Domain calculations live in `src/lib/domain/capabilities.ts` (pure, unit tested); the catalogue and scale are reference data in `src/lib/domain/catalogue.ts` and `maturity.ts`. Server reads and transactional writes live in `src/lib/server/capabilities.ts`; route handlers stay thin and reuse the `api()` guard.
- Capability rows hold the current assessment; every write records a ChangeEvent in the same transaction. Unknown values are null, never zero. The scale version is stored with each row.
- Framework references are separate versioned tables mapped to capabilities; organizational maturity is never stored on a requirement mapping.
- Analytical components (`src/components/analytics`) take a `TopicLink` so the same charts render in server pages (links) and client views (side panel). Maturity levels use a dedicated sequential token ramp; status colours stay reserved for status.
