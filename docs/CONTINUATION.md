# Claude / Codex continuation handoff

Updated 2026-11-24 (America/Chicago). **The site is not complete.** This checkpoint implements and validates additional partial R1/R2 workflows; the unfinished modules below still need development. Do not describe models, placeholders or this authorization as completion.

## Owner instructions and authority

1. Complete the remaining strategic-planning site/tools after reviewing status/docs and the concurrent authentication-removal chat. Keep a durable handoff throughout. This supersedes earlier documentation-only and slice-approval gates, while preserving all strategic scope exclusions.
2. **Permanent desktop-only rule:** support 1280 px and above. Do not develop/test mobile layouts, phone reading support, mobile navigation or mobile browser projects. AGENTS.md records this; Playwright has Desktop Chrome only. Existing accommodations can remain. Desktop keyboard access/contrast/labels remain required.
3. Keep authentication and access restrictions disabled until Aaron explicitly asks for restoration. Preserve accounts/infrastructure. No AI provider or enterprise GRC/evidence/audit/control-testing/acceptance/continuous-monitoring platform.
4. Read AGENTS.md, PROJECT_STATUS.md, ARCHITECTURE.md, PROJECT_SCOPE.md, FUNCTIONAL_REQUIREMENTS.md (especially 6/7), DECISION_LOG.md and IMPLEMENTATION_PLAN.md. Scope, function and architecture have separate authority. Preserve all work, including uncommitted files.

## Release operation — owner instruction 2026-11-24

Aaron explicitly requested **Push to main**. Application commit `c9ee854` was pushed and its native Vercel production deployment `dpl_HGyNE6idwadxo3oNWa4HjsgkX1Vz` reached READY. Both migrations applied successfully; seed preserved existing assessments/configuration and wrote no synthetic data. The stable production URL serves the new continuation features. Anonymous desktop verification passed all ten routes, migrated APIs, editor open/cancel and strict invalid-body rejection without creating production fixtures. Authentication remains suspended; no browser page errors. Error-level log scan showed only the known pg SSL-mode deprecation warning. This documentation follow-up records the release and is also being pushed to main; PROJECT_STATUS.md has details. Full remaining site completion is still unfinished.

## Repository / concurrent chat

- Workspace: `C:/Users/Aaron/Projects/program-compass`.
- Existing checkout: `codex/reference-alignment-review`. Application release `c9ee854` was pushed to main; this file is part of the release-documentation follow-up. No new worktree was created. Check git status and fetch origin/main before continuing; preserve any newer work.
- Codex chat **Remove site authentication**, ID `01a20bee-a6a0-7081-9152-74e9ae41b564`, completed successfully. Its final response reports the access/save fix deployed with 22 active browser checks passing under the former desktop/mobile configuration. Its public changes are already in HEAD.
- Auth login/role gates remain suspended. The shared API save guard skips Origin restrictions only while authenticationDisabled is true; JSON/strict-field validation and transactions remain. Do not undo this. Stable production URL: https://program-compass.vercel.app . Deployment-specific URLs remain immutable old builds.
- The continuation features below are now on the public site along with the preserved capability/authentication slice. The two additive migrations are applied in Development and Production.

## Completed code in this continuation

**Permanent desktop-only support:** AGENTS, architecture/scope/function/plan/IA/UX/testing/status/decision docs, README and Playwright configuration reconciled. Historical mobile test records are historical only.

**Personnel/position/ownership (partial R1 / initial Workforce):**

- Independent Person planning records, titles, active state, stable manager foreign keys; multiple roots allowed; self/descendant cycles rejected.
- Pillar-linked proposed/authorized/retired positions, optional incumbent (authorized only), vacancies, explicit position FTE, optional fully burdened annual cost/currency/start year/justification. Total authorized incumbent allocation cannot exceed 1 FTE. This is not workload-derived required FTE.
- Stale revision timestamps return 409; serialized transactional writes and field-name history. Archive via active/retired states; no destructive public endpoints.
- Capability Person ownership alongside preserved accountable function. Person is displayed first; functions remain fallback to preserve entered work. Ownership changes do not refresh assessment age.
- Workforce roster/positions/direct or unique descendant capability worklists, scope/URL filters, CSV and initial native print. Capability links work reciprocally.

**Capability cycle snapshots (partial R1):**

- PlanningCycle captures all capability/KPI/owner/scope/catalogue/scale projections atomically under repeatable-read isolation. Payload format `capability-snapshot-1`; no public update/delete snapshot endpoints.
- Capability header selector shows current or a read-only captured cycle. Live edits cannot alter captured scores/KPIs. Review age uses capture time. Synthetic provenance derives from captured values.
- This is capability-only capture. The selector is module-local; global selection, explicit cycle comparison, broader plan/context/resource snapshots and fully historic detail history are incomplete. Detail panel says **Live record history**, including when viewing a snapshot.

**Business Context (partial R2):**

- Organization profile singleton: mission, sector, critical services/dependencies, public-safety consequences, drivers, complexity/growth assumptions. Nothing is automatically fabricated.
- Objectives with rationale/planning decision, priority, Person owner, active state and capability links; business threats with scenario, optional ordinal likelihood/impact, mandatory estimate basis/consequence, active state and objective/defending-capability joins. Threats require a planning link.
- Objective cards, threat table, dependency matrix, URL search/pillar scope, edit/archive/reload, CSV and initial print. Capability detail displays reciprocal objective/threat links.
- Provisional pure `reference-readiness-1`: unique applicable capability scores; missing = Incomplete; no mappings = Unmapped; all nonapplicable = Not applicable; otherwise weakest >=3 defended (indicative), 2 partly, lower exposed; mean displayed separately. Objective union includes direct capability links and active linked threats. No L×I enterprise risk engine or verified-compliance claim.
- Exports include method/scope/date and synthetic-assessment provenance. Shared accessible RecordEditor and optimistic URL-filter/hydration hooks support later modules.

## Files and database state

- New source: `src/lib/domain/{workforce,context,csv}.ts`; `src/lib/server/{workforce,context}.ts`; `src/components/workforce`, `src/components/context`, `src/components/planning/record-editor.tsx`, `src/components/use-url-filters.ts`; capability `cycle-control.tsx` and `context-links.tsx`; dedicated protected Workforce/Context pages; APIs under `/api/workforce`, `/api/context`, `/api/cycles`.
- Modified capability server/domain/validation/views/panel/workspace/page for ownership/snapshots/reciprocal context. Overview no longer calls Context/Workforce wholly unavailable. Placeholder route static-parameter list excludes their dedicated pages. Added print styles in globals.css. New unit/browser tests; desktop navigation assertions updated.
- Additive migrations `202611240002_people_cycles` and `202611240003_business_context` applied successfully to the configured isolated **Development** Neon database. Four migrations total; db:status reports up to date. Production application of both migrations was subsequently confirmed in the native release build logs. Do not edit applied migrations; use a new one for further schema changes.
- Seed reliability fix: `scripts/seed-foundation.ts` now preloads existing catalogue rows/KPI keys in two lookups instead of 90 sequential reads, with a bounded 30-second transaction (10-second max wait). The final run had exposed an existing five-second seed-transaction expiry before tests started; rerun passed after this fix. Existing values/identity/idempotency are preserved.
- No new dependencies, lockfile edits, env values, credentials or infrastructure replacements. Ignored .env.local was safely restored after credential-free checks; do not print it. It identifies Development.

## Validation and issues

- Passed without DATABASE_URL/DIRECT_URL/VERCEL_ENV/local env files: lint, typecheck, format:check, db:validate and production build. 19 unit tests pass.
- Full desktop browser/database suite: **15 passed, 6 intentionally skipped** for suspended authentication. Covers existing navigation, scope, validation, rating autosave/reload/history/export/demo lifecycle plus the new connected workflows.
- Focused Context/Workforce/cycle rerun with print-media assertions: **3 passed** before final print-transition correction; final focused rerun after the print-transition correction also passed (3/3); screenshots inspected with sidebar spacing removed.
- Desktop screenshots inspected at 1280 px. Print screenshots exposed animated sidebar padding and empty control labels; print transitions now disabled, controls hidden and view/scope/filter metadata retained. Actual multipage PDF pagination/report packs remain unverified/unimplemented.
- Initial browser failures came from ambiguous nested-label selectors, premature snapshot completion detection and a real URL-checkbox pending-state issue. Fixed using role-based control selection, actual form disappearance after commit, optimistic URL state and hydration gating. Five precisely identified orphan test fixtures from timed-out initial runs were removed from Development after checking they had no external links. Successful reruns clean their own fixtures.
- Credential-pattern scan found zero matches across 55 changed/new files including the seed fix; no staged files/env files. Recheck before any commit. Existing pg SSL-mode and query-serialization deprecation warnings remain; tests have no resulting failures. Do not change connection secrets to silence warnings.

## Exact remaining work / next task

1. Add persistent editable provisional-method settings (with source/basis, units, effective dates and versions) for existing/future calculation tools, then finish remaining R1/R2 relationships: named responsibilities tied to functions/capabilities/people; lightweight planning issues with mandatory consequence/source/owner/date and capability/initiative/resource links. Add reciprocal panels and history. Preserve enterprise GRC exclusions.
2. Add initiatives/owners/dates/dependencies/status/proposal-vs-approved state, timeline/list, capability-specific expected uplift and deficiency coverage; completion never changes actual maturity. Add dependency-cycle checks and open/closed/date/unknown fixtures.
3. Implement dedicated Framework Alignment on compatible `/compliance`, then correct navigation/legacy `/risks` only with functional destinations. Obtain authoritative NIST CSF 2.0 and **actual FBI CJIS Security Policy 6.0** references first; preserve identifiers/hierarchy/descriptions/version/source/deadlines. No reference mappings have been loaded or claimed authoritative here. Implement separate requirement applicability/implementation/current-target observations/notes/history, editable mappings, distinct capability-vs-requirement analytics, coverage/heatmaps/gaps/unmapped/trends/projections. No certification claims.
4. Complete Workforce: authoritative versioned NICE roles/tasks/knowledge/skills; sourced unique activities/workload, paid vs productive capacity, outsourcing/automation without double credit, minimum coverage/expertise constraints, position justification and skills. No invented staffing ratios/benchmarks.
5. Technology portfolio, coverage/utilization/ownership/lifecycle/cost/alternatives tied to capability/resource deficiencies. Explain missing tool vs staffing/process deficiency.
6. Unified five-year plan/scenarios with detailed years 1–3 and directional 4–5; unique baseline vs incremental money lines, annual/cumulative costs, editable sourced assumptions, escalation/savings, deadlines/infeasibility/deferrals and progress. Do not double count existing position/tool costs as initiative costs.
7. Real executive/management Reports and safe current-view CSV/print, schema-versioned relational import preview/validation/atomic application/restore; full end-to-end strategy/investment flow and production release verification.
8. Cards/expanded subject inventory/provenance, full cycle comparisons/global selection, methodology decisions and all previously documented limitations remain open.

Aaron subsequently answered the method question: **Use editable provisional assumptions.** Proceed with undecided methods using clearly labelled persistent organization-editable assumptions, with units, source/basis, effective date and calculation version. Preserve historic inputs/results. This approves the approach, not particular numeric defaults or unsupported benchmark/standards claims. Existing fixed maturity/readiness constants still need an editable settings workflow; do not claim that workflow exists merely because this approval is recorded. No new mobile work. Update this handoff, PROJECT_STATUS and decision/architecture docs after each substantive slice; rerun appropriate checks. All production/release work must preserve open access until explicit restoration.
