# Project status

Last updated: 2026-11-24.

## Current authorization and delivery

Aaron authorized the first capability slice on 2026-11-24 in the project thread: build a working Capabilities assessment (decision card, then "continue your current implementation, including the backend and frontend", using the 30 reference topics, 60 KPIs and maturity scale from the reference review, and supporting future NIST CSF and CJIS mappings). This is a partial R1 slice. It does not authorize other R1 to R5 work, Framework Alignment screens, framework data import, navigation changes (S-05) or production rollout. Branch `claude/project-thread-jdje86` merges Codex's documentation branch `codex/reference-alignment-review` (908402c) so the implementation sits on the reconciled documents.

## Completed in this slice

- **Catalogue:** the original 30 topics (stable codes GV.01 to RR.03, five reference display groups with Respond & Recover combined) and 60 operational KPIs with their pass/fail boundaries and directions, seeded idempotently by `npm run db:seed` from `src/lib/domain/catalogue.ts`. Topic prose is not copied (provenance review pending). Default pillar involvement per topic is provisional and editable.
- **Schema (migration `202611240001_capability_assessment`, additive):** Capability (catalogue entry plus current assessment: applicability, current/target level, scale version, confidence, rationale, review state, target date, accountable OrganizationalFunction, assessor/time), CapabilityPillar (shared, non-exclusive pillar involvement), CapabilityIndicator (KPI with catalogue key, direction, pass/fail boundaries, value, measured date), and empty Framework, FrameworkRequirement (hierarchical) and CapabilityRequirementMapping tables for later NIST CSF 2.0 and CJIS 6.0 references. Check constraints enforce level range and boundary order.
- **API:** `PATCH /api/capabilities/[id]` (editor/admin), `GET /api/capabilities/[id]/history` (all roles), `POST /api/capabilities/[id]/indicators`, `PATCH`/`DELETE /api/indicators/[id]`. Strict Zod input, origin checks, transactional writes with ChangeEvent history (rationale text is recorded as changed, not copied). Catalogue KPIs cannot be deleted.
- **Capabilities screen:** clickable summary strip (assessed, average maturity, below target, KPIs passing, review due, no owner) that applies filters; four views held in the URL: Assessment (keyboard 1 to 5 rating grid grouped by display group, autosave with saved/error state, current-to-target profile, KPI status dots, owner and review age), Targets and gaps (sortable, quarter target dates), KPI performance (all KPIs with performance bands, inline value entry, status filters, worst first), Analysis (maturity by group and by pillar, distribution with table equivalent, strengths, largest gaps, deficiencies, failing KPIs). Search, group and quick filters live in the URL; CSV export of the filtered view; side panel per topic for rating, confidence, review state, rationale, accountable function, target date, pillars, applicability, KPI values and boundaries, local KPIs, framework reference placeholder and history. Viewers see everything read-only.
- **Overview:** rebuilt on recorded data only: summary strip linking into filtered Capabilities views, maturity by group, needs-attention list, maturity by pillar, largest gaps, strengths, distribution, and a compact planned-modules list. Empty state when nothing is assessed. Respects the pillar scope.
- **Visual system:** sequential maturity-level tokens (one hue, light to dark, never a status colour), hatched gap band and unassessed texture, KPI bands in muted status tints always paired with text labels. All colours remain tokens in `globals.css`.
- **Synthetic data:** `npm run db:seed:synthetic` writes deterministic, labelled synthetic ratings and KPI values to development or preview databases only and refuses production.

## Affected files

prisma/schema.prisma, new migration; scripts/seed-foundation.ts, new scripts/seed-synthetic.mts; package.json (script only); src/lib/domain/{catalogue,maturity,capabilities}.ts; src/lib/server/capabilities.ts; src/lib/validation.ts; API routes under src/app/api/capabilities and src/app/api/indicators; src/app/(protected)/capabilities/page.tsx, (protected)/page.tsx, [module]/page.tsx; src/components/analytics/_, src/components/capabilities/_; src/app/globals.css; tests/unit/capabilities.test.ts, tests/capabilities.spec.ts, tests/navigation.spec.ts; docs/ARCHITECTURE.md, DATA_MODEL.md, CALCULATION_METHODOLOGY.md, DECISION_LOG.md, PROJECT_STATUS.md.

## Checks

Passed: `npm run lint` (zero warnings), `npm run typecheck`, `npm run format:check`, `npm run db:validate`, `npm run build` with `.env.local` removed and no database credentials. Unit tests 10/10 (7 new: catalogue counts and boundary order, KPI status at exact boundaries in both directions including the reference 88 at risk / 95 pass fixture, unknown gaps, review cadence calendar boundaries, summary/distribution reconciliation, selectors, input validation). Browser suite 23 passed, 1 skipped (keyboard rating is desktop-only by P-08) against a local synthetic PostgreSQL 16 database at desktop and mobile widths: catalogue loads 30 topics and 60 KPIs; keyboard rating autosaves, survives reload, records assessor and history; anonymous 401, viewer 403, foreign origin 403, invalid levels 400, unknown topic 404, KPI boundary order 400, catalogue KPI delete 409, duplicate local KPI 409; all navigation, overflow and security tests still pass. Screens were inspected at 1440 px for admin and viewer roles.

## Merge with authentication suspension (84a41a1)

Main gained Aaron's temporary authentication suspension after this slice was written. The branch merges it: capability writes accept a null actor (history and assessor are then recorded as System), and capability tests skip login and role assertions while `authenticationDisabled` is true; validation, origin, 404 and KPI rule assertions still run. Re-run after merge: unit 10/10; browser 17 passed, 13 skipped (12 security tests skipped by the suspension, 1 desktop-only), 0 failed. While authentication is suspended anyone who can reach a deployment can change assessments.

## Known limitations and open decisions

- **Provisional, not approved:** scale level names other than Initial and Optimized (Developing, Defined, Managed); unweighted mean aggregation; six/twelve month review cadence (taken from the reference); deficiency = level 1 or 2; default pillar involvement per topic. Each is isolated in `src/lib/domain` and labelled in the UI.
- Owner is the accountable organizational function until person records exist (P-07). No planning cycles yet (P-03): one current assessment per topic, with history in ChangeEvent. Concurrent edits are last write wins.
- Framework tables are empty: no NIST CSF 2.0 or CJIS 6.0 data, mappings or Framework Alignment screens yet.
- **Preview database:** preview builds now migrate and seed the nonproduction database automatically (C-06). If tables are ever missing, Overview and Capabilities show "Database update pending" instead of failing.
- **Production (C-07):** production builds migrate, seed the catalogue and, only into an empty database, load demo data. Remove demo data with `DATABASE_ENVIRONMENT=production ALLOW_PRODUCTION_MIGRATION=true DIRECT_URL=<production direct URL> npm run db:demo:clear`; topics edited in the application are kept.
- **Small screens:** wide tables scroll inside their panels, so phones and narrow laptops no longer zoom out or scroll sideways.

## Next task

Aaron reviews the PR and preview. Then decide the open methodology items above and authorize the next slice (likely person records and planning cycles, then Framework Alignment with authoritative NIST CSF 2.0 and CJIS 6.0 references).

## Previous status — reference alignment review (preserved)

## Authentication suspension - current work

Owner authorized temporary removal of authentication after lockout, including deployment. Changes: shared auth-mode switch; page/API access guards; administrative transaction anonymous actor handling; login redirect; hidden sign-out; disabled auth endpoints; documentation. All visitors have administrative access while disabled. Existing accounts, schema and infrastructure are preserved. R1-R5 remain unapproved. Validation: lint, typecheck, Prisma validation and production build pass without database credentials; all three unit tests and eight anonymous desktop/mobile navigation/access checks pass. Full format:check reports existing issues in 48 untouched files; changed files pass Prettier. Mobile scope test retries its interaction until hydration completes. Authentication-enforcement browser tests are explicitly skipped while the owner-requested suspension is active. Reviewed scoped changes for secrets; no environment files staged. Pushed application commit `84a41a1` to main at the owner's explicit request; native Vercel production deployment reached READY. Verified https://program-compass.vercel.app without cookies: overview and all nine module routes return 200, login redirects to overview, settings API returns 200, auth session endpoint returns 404. Full browser suite: eight passed, twelve authentication-enforcement cases intentionally skipped during suspension. Next task: restore authentication only when explicitly requested; no additional configuration or migration required.

## Prior review authorization and delivery (superseded for authentication only)

Documentation-only reference alignment/corrective review incorporating the subsequent Strategic Planning Scope Correction and latest Framework Alignment and Maturity Assessment Requirements. Stop at plan review. No business development, navigation mutation, migration, infrastructure replacement or production rollout authorized by this review. Foundation Phase 1 is merged on main at `35465f6`; historical preview/merge instructions below are superseded by this verified repository state.

## Completed review work

- Interactively reviewed all seven reference views with Example Corp., all 30 topics/60 KPI names/thresholds, six editor types, roadmap/list, both reports, four framework views, representative filters, KPI recalculation, heat-map drilldown, org-chart owner detail, blank/example switching and one downloaded CSV's columns/rows.
- Created feature-level parity matrix separating implemented foundation, placeholders, missing business features, approved strategic exclusions and unverifiable reference print output. No placeholder is represented as completed functionality.
- Reconciled governing scope: dedicated Framework Alignment with editable requirement applicability/implementation, current/target maturity, observations/history/mappings and full analytical views is core. Reference versions are separate from organizational assessments; shared capability maturity remains authoritative. Enterprise GRC, evidence platforms, audit lifecycles, formal control testing, formal acceptance and continuous compliance monitoring remain excluded; framework assessment/implementation tracking are included.
- Proposed preserving shell/auth/database/deployment and additive domain development; lightweight planning issues replace a standalone enterprise risk module. R1–R5 sequence connects capabilities, context, framework assessment, resources and one three/five-year plan. Estimate 25–40 person-weeks including design/review, subject to documented assumptions.

## Affected files

AGENTS.md, CLAUDE.md; docs/ARCHITECTURE.md, PROJECT_SCOPE.md, FUNCTIONAL_REQUIREMENTS.md, REFERENCE_APPLICATION_REVIEW.md, REFERENCE_FUNCTIONAL_PARITY.md, INFORMATION_ARCHITECTURE.md, DATA_MODEL.md, CALCULATION_METHODOLOGY.md, IMPLEMENTATION_PLAN.md, DECISION_LOG.md, PROJECT_STATUS.md. No application/config/schema/lockfile changes.

## Validation and limits

Passed this delivery: npm run lint, npm run typecheck, npm run db:validate and npm run build with local environment file temporarily removed and database credential variables absent; local file restored afterward. All six existing navigation tests passed against synthetic nonproduction fixtures at desktop/mobile widths: all module routes, drawer dismissal, horizontal overflow, pillar scope preservation and unknown-route 404. All 13 changed documentation files pass targeted Prettier. Full npm run format:check failed on 53 untouched baseline files (including source/config/tests and other docs); no repository-wide reformat was performed. No application/schema/config changes or new tests. Staged documentation is reviewed for secret values and credential files before commit; environment files and initial credentials are excluded.

Reference review is broad but not exhaustive workflow certification. Saved retention/recovery, all valid/invalid save/delete/rename paths, all filter combinations, every export and final print pagination remain unverified. See review log for follow-up evidence. Framework source import/licensing/mapping verification and exact formula choices remain next-phase gates; this review does not claim official mapping accuracy.

## Decisions, configuration and next task

Accepted user scope S-01–S-04 and latest framework clarification; proposed navigation/implementation slices S-05–S-06. No new configuration required. Preserve production/nonproduction separation and existing hardening limitations below. Next: user reviews the corrective plan, closes methodology/schema decisions and explicitly authorizes R1. Claude Code should read the governing corrections and parity matrix before implementation. Do not automatically resume the historical rollout instruction.

## Historical secure persistence record (preserved)

# Previous status

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

Final browser run: 18/18 passed at desktop/mobile widths after correcting the duplicate synthetic account fixture. The last-administrator denial was exercised before initial operator account provisioning; future runs only exercise that assertion when their synthetic admin is the sole active administrator. Navigation, responsive drawer/scope/overflow, anonymous denial, login failure/rate limiting, role restrictions, deactivation, expiration, logout and account persistence are covered. Mobile settings screenshot inspected.

## Delivery/configuration state

Implementation committed and pushed as bc1f501. Native Git preview is READY at https://program-compass-git-codex-foundation-60b971-araidatas-projects.vercel.app/login. Production application remains the existing foundation until PR merge. The reviewed additive migration and idempotent seed are applied to both database resources. Hosted preview checks passed: login page, anonymous API denial, administrator sign-in, Settings and logout. Initial Aaron administrator accounts provisioned in both with independent random passwords saved only in ignored .vercel/initial-admin.credentials.txt. No destructive migration/reset executed; secrets excluded from commits.

## Known limitations and next task

Preview/Development share synthetic data; per-feature branches are not configured. Preview auth origin is bound to the delivery branch alias; other branches need their own scoped origin. Runtime still uses provider-issued ownership credentials: restrict database permissions and review audit retention before real organizational data. No email password recovery; authenticated password-change endpoint exists. Pillar scope labels remain canonical foundation labels even if configuration names are edited. Date format is a stored preference for future modules. Person ownership and planning cycles remain designed/deferred.

Next: review PR and perform production application rollout through main. Initial credentials are available in the ignored local file referenced above; no additional infrastructure configuration is required for the delivery branch. Further business modules require separate authorization and methodology decisions.
