# Architecture — authoritative requirements

This file is the single architectural source of truth for both Codex and Claude Code. Read it together with PROJECT_SCOPE.md before changes; update this file when an approved architectural decision changes.

- One Next.js application with App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui components, and npm. Use stable, mutually compatible versions and commit the lockfile.
- Host through native Vercel GitHub integration. Use Neon PostgreSQL via the Vercel Marketplace after repository import. Do not provision a database during Phase 0.
- Prisma is the ORM. Keep its schema in prisma/ and CLI connection settings in prisma.config.ts. Generate the client independently of connectivity; never run migrations during application builds.
- Phase 0 renders static initialization and module placeholders. Do not import or initialize a database client in routes until database-backed work is authorized. No runtime database connection is required.
- Native application authentication and server-side authorization must protect database-backed functionality before organizational data is introduced. No Microsoft Entra ID or external SSO dependencies. Authentication is not implemented in Phase 0.
- No hard-coded credentials, committed secrets, authoritative browser local storage, temporary production SQLite, unnecessary microservices, or fabricated organizational metrics. Use synthetic development data only.
- Preserve three cybersecurity pillars: Security Operations; Security Architecture & Engineering; Governance, Risk & Compliance.

## Code boundaries

src/app contains route entry points and metadata; src/components contains the application shell and reusable UI; src/lib contains shared navigation and utilities. Future business modules should keep domain logic separate from presentation. Server-only database access and authorization belong behind server boundaries, never in client components.

## Deployment boundary

Use Node.js 24 LTS. npm run build generates Prisma code and builds Next.js without querying a database. Runtime connections will use the pooled DATABASE_URL and a PostgreSQL driver adapter in a later phase; Prisma migrations use DIRECT_URL. No domain models or migrations are introduced in Phase 0.

## Tooling compatibility

Prisma CLI and client use stable 7.10.1 rather than the release candidate currently advertised by the CLI's latest tag. ESLint stays on 9.39.5 because the Next.js configuration's React, accessibility, and import plugins declare support through major 9; npm marks this ESLint line deprecated. Upgrade the lint stack together when those plugins support the current major. Targeted overrides select Effect 3.22.5 for Prisma configuration and minimatch 11.0.9 for shadcn's code-generation tooling to resolve published audit findings. Revalidate schema generation, linting, and production builds when changing these overrides.
