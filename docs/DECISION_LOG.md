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

## 2026-11-23 — Secure persistence (accepted implementation decisions)

- Reconcile the request’s Phase 4 label to repository Phase 1 secure persistence. Preserve main’s merged Claude shell by merging origin/main before development.
- Use Better Auth with Prisma and fixed admin/editor/viewer roles; no hosted identity provider or public registration. Use transactional administrative history and guard the last active administrator.
- The user explicitly requested new Neon databases after the dashboard showed no database connected and rejected reuse of unrelated team resources. Use one production resource and one shared nonproduction resource on the Free plan, with no production credentials in previews.
- Vercel connector returned empty resources/404 despite the correct account, team, exact project ID and renewed consent. Authenticated Vercel CLI 66.6.0 resolved access and successfully provisioned resources. Prefer it for this handoff until the connector discrepancy is resolved.
- Align Vercel from Node 26 to repository Node 24, npm ci and npm run build. No migrations in builds.
- Defer cycles/snapshots and person ownership tables until their actual modules; retain P-03/P-07 as relationship constraints in DATA_MODEL.

## 2026-11-23 — Reference alignment and strategic scope correction

- **Accepted — S-01:** Reference functional parity is a baseline only for program development, assessment, performance, ownership, resource justification and strategic planning. The latest user correction supersedes earlier broad parity language.
- **Accepted — S-02:** NIST CSF 2.0/CJIS v6.0/NICE are reference inputs for their respective purposes. Capability mappings/coverage never establish verified compliance. The latest framework requirements supersede the earlier exclusion of dedicated framework views and requirement-specific assessments. Provide dedicated Framework Alignment, applicability/implementation tracking, maturity assessments, notes/history and analytics. Exclude formal certification, evidence platforms, audit lifecycle, formal control testing, exception approval, compensating control management, formal acceptance, continuous monitoring and comprehensive GRC. Verified-status/certification workflows remain excluded.
- **Accepted — S-03:** Risks/findings are lightweight planning issues or references linked to a development/resource/investment decision. No comprehensive enterprise risk register or audit finding management system. Broad risk heat maps/scoring are inventoried reference features, not required implementation.
- **Accepted — S-04:** Preserve all functioning infrastructure and stop at the documentation/plan review gate. Latest authorization is review only; no new business implementation or major architectural changes.
- **Proposed — S-05:** Relabel Compliance as Framework Alignment on the compatible route; retire standalone Risks & Findings navigation and integrate planning issues inside capabilities/initiatives with scoped legacy redirects. Supersedes P-01's module set in the proposed IA; no code changed yet.
- **Proposed — S-06:** R1–R3 deliver connected capability/context/direction/reporting baseline before R4–R5 resource/multiyear extensions. Methods, domain schema and each slice require approval. Retain useful analytical presentations alongside tables; no shell rewrite.

P-10 covers indicative alignment, extended by the latest explicit framework assessment requirements; it does not authorize verified compliance claims or GRC lifecycle management. P-04 is a consistent layout default, not a prohibition on capability cards, org charts or timelines. Historical 2026-11-24 approval dates above are preserved as recorded; this review uses the client date 2026-11-23 and does not infer new approvals from those dates.

## 2026-11-24 — First capability assessment slice (Claude Code)

- **Accepted — C-01:** Aaron authorized a working Capabilities assessment on 2026-11-24 (thread decision card, then explicit instruction to continue backend and frontend). Scope is a partial R1 slice: catalogue, assessment, KPIs, analysis and Overview. Other R1 to R5 work, Framework Alignment screens and S-05 navigation changes remain unauthorized.
- **Accepted — C-02:** Use the original 30 reference topics and 60 KPIs (REFERENCE_APPLICATION_REVIEW.md inventory) as catalogue version `reference-baseline-1`, preserving topic codes and per-KPI catalogue keys (for example GV.01-1). This replaced an initial NIST CSF 2.0 category catalogue at Aaron's direction. Reference display groups are not official CSF functions.
- **Accepted — C-03:** A topic is assessed once. Framework, FrameworkRequirement and CapabilityRequirementMapping tables exist (empty) so NIST CSF 2.0 and CJIS 6.0 requirements map to topics without creating a second maturity value.
- **Provisional — C-04:** 1 to 5 scale (Initial, Developing, Defined, Managed, Optimized; only the end names are evidenced by the reference review), unweighted means over assessed applicable topics, six/twelve month review cadence, deficiency at level 1 or 2, default pillar involvement per topic. Implemented as isolated, labelled constants pending approval.
- **Accepted — C-05:** Accountable owner is an OrganizationalFunction until person records exist (P-07). History uses ChangeEvent until planning cycles exist (P-03).

## 2026-11-23 � Authentication suspension (accepted)

The owner explicitly requested removal of authentication after account lockout until further instruction. Suspend page and API identity/role enforcement through one shared switch, retain accounts and auth implementation for restoration, and record anonymous administrative writes with null actor IDs. This narrow authorization supersedes the prior documentation-only/auth-preservation gate; it does not authorize business slices.

- **Accepted — C-06:** At Aaron's request (2026-11-24, he does not want manual database steps), Vercel **preview** builds run `migrate deploy`, the catalogue seed and the synthetic seed (`--if-empty`, so entered ratings are never overwritten) against the shared synthetic nonproduction database before `next build`. This is a deliberate exception to "never migrate during builds" for previews only. Production and local builds still never touch the database; how production is migrated at merge needs Aaron's decision.
- **Accepted — C-07:** At Aaron's request (2026-11-24: "push to main", demo data acceptable in production as long as it can be removed later), Vercel **production** builds also run `migrate deploy`, the catalogue seed and the synthetic demo seed with `--if-empty --allow-production` before `next build`. Demo data is written only when no topic has a rating, is marked (rationale "Synthetic development rating.", a `demo.seeded` change event), and is removed with `npm run db:demo:clear` (with `DATABASE_ENVIRONMENT=production ALLOW_PRODUCTION_MIGRATION=true`), which leaves any topic someone edited in the application untouched. Local and CI builds still never touch a database.
