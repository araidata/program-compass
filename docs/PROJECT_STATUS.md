# Project status

## 2026-11-23 — Phase 0 foundation

Initial request calls this Phase 1; the repository retains Phase 0 terminology. Business functionality and infrastructure remain unauthorized.

Completed: existing repository/private status inspected, main initially clean at 88f7e64; GitHub viewer permission ADMIN. Preserved stack, lockfile and routes. Removed logo/slogans/welcome banner; compact dashboard and placeholders collect no data. Added shared requirements, reference review, proposed navigation, preliminary data model/formulas, decisions and testing/handoff documentation. Existing Prisma schema has no domain models; no infrastructure provisioned.

Affected: README, AGENTS, CLAUDE; architecture/scope/plan and new requirements/review/design/calculation/status/decision/testing docs; application shell, dashboard, module template, icon, typography and navigation descriptions. No dependencies added. npm ci installed 701 packages and audited 702 with zero vulnerabilities. Existing ESLint 9 deprecation remains documented in ARCHITECTURE.md.

Validation: npm ci, typecheck, Prisma schema validation, database-free production build and all four desktop/mobile Playwright tests passed. Navigation checks cover dashboard, all nine modules, mobile drawer closure, overflow, console errors and unknown-route 404. Final lint and format checks passed. Desktop/mobile production screenshots reviewed; one residual footer tagline was removed and validation repeated. No database credentials or active database connection were used. A temporary reference-review script caused an initial lint failure; it was removed and the rerun passed.

Partial/planned: business modules are notices only. Reference review covers rendered views and one synthetic objective editor test; Saved-mode durability and full calculation boundaries remain unverified. Schema, framework mappings and formulas are proposals, not approved specifications.

Outstanding decisions: Claude Code UI/UX/navigation review; schema/authentication/session/permission design; actual CJIS 6.0, NIST CSF and NICE source versions/licensing; later workforce datasets; capacity assumptions, currency/escalation/rounding, planning baselines and data-handling requirements. Main protection inspection returned GitHub HTTP 403 because the private repository requires an upgraded plan for that feature; do not infer configured protection from this response.

Complexity risks: shared-capability/workload/cost double counting; conflating maturity coverage with verified compliance; unsourced NICE staffing assumptions; mandatory deadlines and dependency scheduling; future-year uncertainty. These are addressed in proposed design boundaries and require later independent validation.

Configuration: Node.js 24 LTS/npm; Chromium for browser tests. Foundation needs no environment variables. See DEPLOYMENT.md for GitHub import and later, separately authorized Neon integration. Keep credentials out of Git and preview data isolated from production.

Recommended next task: Claude Code reviews UI/UX, information architecture, data model and calculation proposals using README and shared documents. Review does not authorize implementation of later phases. Stop after foundation delivery. Delivery branch: codex/foundation-completion, based on main at 88f7e64. Use git log -1 on this branch for the delivery commit. GitHub delivery uses a review pull request; all changes stay within the foundation.
