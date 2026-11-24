# Architecture — authoritative requirements

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
