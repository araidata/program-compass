# Program Compass

**Cybersecurity strategy and resource planning**

An enterprise application foundation for cybersecurity strategic planning, capability assessment, and resource planning. Phase 0 includes a responsive application shell, initialization dashboard, and nine module placeholders. No authentication, database-backed functionality, organizational data, or business workflows are implemented.

## Local development

Use Node.js 24 LTS and npm (see `.nvmrc`).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No environment file or database is needed. When database development is authorized, copy `.env.example` to an ignored `.env` file and configure Neon credentials securely.

## Commands

```sh
npm run lint
npm run typecheck
npm run format:check
npm run db:validate
npm run build
npx playwright install chromium
npm run test:e2e
npm start
```

`npm run format` formats source and documentation. The production build generates the Prisma client without database connectivity and never executes migrations. The schema intentionally contains no domain models. Browser tests exercise all navigation entries at desktop and mobile widths, initialization text, drawer behavior, overflow, browser errors, and unknown-route handling.

## Structure

- `src/app/` — App Router layout, dashboard, and statically generated module placeholders.
- `src/components/` — shared application shell and shadcn/ui components.
- `src/lib/` — navigation definitions and utilities.
- `prisma/` and `prisma.config.ts` — PostgreSQL schema foundation and Prisma CLI configuration.
- `tests/` — production browser navigation checks.
- `docs/` — architecture, scope, phased plan, and deployment guidance.

## Shared project requirements

[Architecture](docs/ARCHITECTURE.md) is the authoritative requirements source for both Codex and Claude Code. Read [scope](docs/PROJECT_SCOPE.md) and the [implementation plan](docs/IMPLEMENTATION_PLAN.md) before extending the application. The three organizational pillars are Security Operations; Security Architecture & Engineering; and Governance, Risk & Compliance.

## Deployment

Import the existing private [GitHub repository](https://github.com/araidata/program-compass) into Vercel using the Next.js preset, repository root, Node.js 24.x, `npm ci`, and `npm run build`. Deploy the foundation without database variables. After import, connect Neon PostgreSQL through the native Vercel Marketplace integration. Follow [DEPLOYMENT.md](docs/DEPLOYMENT.md) for environment mapping and later migration steps. No database has been provisioned as part of Phase 0.

Native application authentication and server-side authorization must be implemented before introducing organizational data or enabling database-backed functionality. Keep credentials in ignored environment files or Vercel settings. Phase 0 stops at the application foundation.
