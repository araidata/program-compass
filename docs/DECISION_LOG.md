# Decision log

Each entry records a decision, its status, and its rationale. Statuses: **Accepted** (approved, reflected in [ARCHITECTURE.md](ARCHITECTURE.md) or [PROJECT_SCOPE.md](PROJECT_SCOPE.md)), **Proposed** (awaiting Aaron's approval, not to be implemented), **Rejected**, **Superseded**. ARCHITECTURE.md stays the single authoritative source; when a proposal is accepted, update that file and change the status here.

## Accepted baseline (recorded from existing documentation)

| ID    | Date    | Decision                                                                                                     | Source           |
| ----- | ------- | ------------------------------------------------------------------------------------------------------------ | ---------------- |
| D-001 | Phase 0 | One Next.js App Router application, TypeScript strict, Tailwind CSS, shadcn/ui, npm with committed lockfile. | ARCHITECTURE.md  |
| D-002 | Phase 0 | Vercel via native GitHub integration; Neon PostgreSQL via Vercel Marketplace, not provisioned in Phase 0.    | ARCHITECTURE.md  |
| D-003 | Phase 0 | Prisma ORM; client generated without connectivity; migrations never run during builds.                       | ARCHITECTURE.md  |
| D-004 | Phase 0 | Native authentication and server-side authorization before any organizational data; no external SSO.         | ARCHITECTURE.md  |
| D-005 | Phase 0 | No browser storage as source of truth, no committed secrets, no fabricated metrics; synthetic data only.     | ARCHITECTURE.md  |
| D-006 | Phase 0 | Three pillars: Security Operations; Security Architecture & Engineering; Governance, Risk & Compliance.      | ARCHITECTURE.md  |
| D-007 | Phase 0 | Nine future modules plus Dashboard. Superseded by P-01 and P-11 (renamed and grouped; same module set).      | PROJECT_SCOPE.md |

## Accepted — from the IA and UI/UX review (approved by Aaron 2026-11-24)

Details and rationale for each are in [UX_REVIEW.md](UX_REVIEW.md). Aaron approved all thirteen proposals on 2026-11-24. Approval covers the direction; these specifics remain open and still need separate approval before implementation:

- P-03 and P-07 constrain the Phase 1 schema design, but the schema itself is approved in Phase 1.
- P-09: how workforce demand is calculated.
- P-10: the rule that derives compliance status (for example weakest mapped capability) and its threshold.
- P-13: the assessment review cadence.
- The open questions in UX_REVIEW.md section 8 (capability catalogue, maturity scale, workforce granularity, concurrent editing).

| ID   | Decision                                                                                                                                                                                                                                                                                              | Affects                                            | Status   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------- |
| P-01 | Group navigation into Overview, Assess, Plan, Resources, Reports, Settings. Rename Dashboard → Overview, Current State → Capabilities, Strategic Planning → Roadmap, People & Resources → Workforce, Technology Portfolio → Technology, Reporting → Reports; shorten routes. Module set is unchanged. | Navigation, routes, tests                          | Accepted |
| P-02 | Pillar as a global scope switcher in the header (Enterprise or one pillar), stored in the URL and kept across modules, instead of separate pillar pages.                                                                                                                                              | Shell, all modules                                 | Accepted |
| P-03 | Planning cycle selector in the header for viewing and comparing past cycles.                                                                                                                                                                                                                          | **Phase 1 schema** (cycles or snapshots)           | Accepted |
| P-04 | One standard module layout: header, summary strip, view tabs, URL filters, dense table, side panel for detail and editing. Modals only for confirmations.                                                                                                                                             | All modules                                        | Accepted |
| P-05 | New visual direction: light collapsible sidebar, 48 px header, Inter or IBM Plex Sans with tabular numerals, neutral palette with one accent, separate status and pillar colour sets, token-only colours, high density.                                                                               | Shell, global styles                               | Accepted |
| P-06 | Remove taglines, logo tile, hero banner, watermark graphics, eyebrow labels, and the "Foundation" status pill from the UI. Drop the tagline line from PROJECT_SCOPE.md and README.md.                                                                                                                 | Shell, dashboard, docs                             | Accepted |
| P-07 | Owners and assignees reference person records through pickers, never free text.                                                                                                                                                                                                                       | **Phase 1 schema**                                 | Accepted |
| P-08 | Desktop-first for data entry (full function from 1280 px); phones optimized for reading.                                                                                                                                                                                                              | Responsive requirements                            | Accepted |
| P-09 | Workforce module scope: roster with positions and vacancies, FTE allocation across run and change work, supply versus demand by pillar and quarter, skills matrix. Demand calculation not decided.                                                                                                    | **Business requirements**                          | Accepted |
| P-10 | Compliance status derived from mapped capability maturity against a threshold. The derivation rule (for example weakest mapped capability) is a calculation method still to be chosen.                                                                                                                | **Calculation method**                             | Accepted |
| P-11 | Keep Business Context as its own module under Plan (alternative: a tab within Roadmap).                                                                                                                                                                                                               | Navigation, scope                                  | Accepted |
| P-12 | Single-module CSV export and print layout in every module; Reports composes multi-module packs.                                                                                                                                                                                                       | Reporting scope                                    | Accepted |
| P-13 | Capability assessment uses a keyboard-driven rating grid with autosave, level definitions in a legend, review states, and a staleness cadence (cadence value to be set by Aaron).                                                                                                                     | Assessment workflow, **business rule** for cadence | Accepted |
