# Project status

Last updated: 2026-11-23 (America/Chicago).

## Current phase

The user’s Phase 4 request authorizes repository Phase 1 secure persistence only. Claude’s merged IA/UI shell from main at b250020 is preserved; merged into delivery branch codex/foundation-completion before development. No assessment, compliance dataset, workforce calculation, technology or strategy workflows implemented.

## Completed implementation

- Better Auth native login/logout, scrypt passwords, revocable eight-hour database sessions, database login rate limiting, no public registration/SSO/social providers.
- Current-account server role/activation checks on pages and APIs. Administrator, Editor and Viewer permission matrix. Administrator-only accounts/configuration/history, account activation/deactivation and session revocation, last-administrator protection. Operator-only first-admin CLI.
- Prisma foundational models: User, Account, Session, Verification, RateLimit, Organization, Pillar, OrganizationalFunction, ApplicationSettings, ChangeEvent. Reviewed additive migration 202611230001_foundation; applied to isolated nonproduction Neon and seeded without real organizational data.
- Three seeded pillars; Architecture and Engineering are distinct functions. Configurable names, new functions and singleton basic settings. Administrative writes/history are transactional and inputs strictly validated.
- Vercel native Neon integration configured on Free plan in iad1: program-compass-db (production), program-compass-nonproduction-db (Preview/Development). Verified all pooled/direct connections and distinct production/nonproduction endpoints. DIRECT_URL and distinct auth secrets/origins configured per environment; local secrets ignored. Node 24, npm ci and npm run build configured.

## Affected files

Prisma schema/migration/config; scripts for migrations, seed and first admin; server auth/access/API/administration helpers; protected route group, login, settings and API routes; modular authentication/settings/user UI; shell sign-out and response headers; npm manifest/lockfile; Playwright and unit tests; README, AGENTS and shared architecture/scope/data model/deployment/testing/plan/decision/status docs.

## Checks

Passed: lint (zero warnings), TypeScript, formatting, Prisma validation and production build with local environment file removed and no database credentials; 3 unit tests; runtime dependency audit (zero vulnerabilities); Neon pooled/direct SELECT connectivity for Production/Preview/Development; additive migration and idempotent seed on nonproduction.

Initial browser run: 17/18 passed; a duplicate synthetic account across desktop/mobile correctly returned 409. Test fixture corrected and final 18-case browser suite is running; final results will be recorded before handoff. Navigation, responsive drawer/scope/overflow, anonymous denial, login failure/rate limiting, role restrictions, deactivation, expiration, logout and account persistence are covered. Mobile settings screenshot inspected.

## Delivery/configuration state

Preparing reviewed commit and native Git preview; production application remains the existing foundation until PR merge. Production database schema/seed and initial account provisioning are not yet reported complete. No database reset/destructive migration executed. Secrets are excluded from staging.

## Known limitations and next task

Preview/Development share synthetic data; per-feature branches are not configured. Preview auth origin is bound to the delivery branch alias; other branches need their own scoped origin. Runtime still uses provider-issued ownership credentials: restrict database permissions and review audit retention before real organizational data. No email password recovery; authenticated password-change endpoint exists. Pillar scope labels remain canonical foundation labels even if configuration names are edited. Date format is a stored preference for future modules. Person ownership and planning cycles remain designed/deferred.

Next: finish preview verification and first administrator handoff, review PR, then approve production rollout through main. Further business modules require separate authorization and methodology decisions.
