# Project status

Last updated: 2026-11-24.

## Current phase

**Phase 0 — Foundation: complete, with the shell rebuilt to the approved IA.** A deployable Next.js application shell, an Overview page and nine module placeholders, tooling, Prisma configuration without domain models, and deployment documentation. No authentication, persistence, organizational data or business workflows exist.

**IA and UI/UX review: approved 2026-11-24.** Findings are in [UX_REVIEW.md](UX_REVIEW.md). Aaron accepted all thirteen proposals ([DECISION_LOG.md](DECISION_LOG.md) P-01 to P-13), and the resulting conventions are in [ARCHITECTURE.md](ARCHITECTURE.md).

## Implementation state

| Area                  | State                                                                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application shell     | Rebuilt to P-01, P-02, P-05, P-06 and P-08: grouped navigation, a sidebar that collapses, a 48 px header, a pillar scope switch held in `?pillar=`, Inter, and token-only colours. Taglines and decoration removed. |
| Overview and modules  | Overview lists modules, planned views and phases, plus the pillars. Each module placeholder uses the standard page header with its scope and planned views. No data or workflows.                                   |
| Planning cycle (P-03) | Not built. It waits for cycles in the Phase 1 schema.                                                                                                                                                               |
| Database              | Prisma is configured. There are no models or migrations, and Neon is not provisioned.                                                                                                                               |
| Authentication        | Not implemented. Required before organizational data arrives in Phase 1.                                                                                                                                            |
| Tests                 | Playwright covers navigation of every route, the pillar scope kept across modules, and the 404 page, at desktop and mobile widths.                                                                                  |
| Deployment            | The Vercel project exists and deploys without database variables.                                                                                                                                                   |

## Open decisions

These are listed in DECISION_LOG.md and UX_REVIEW.md section 8:

- Capability catalogue and maturity scale.
- Workforce granularity and how demand is calculated.
- The rule for deriving compliance status.
- The review cadence.
- Concurrent editing.

None of them block Phase 0. The catalogue and scale are needed before Phase 2.

## Next steps

1. Review and merge the shell rebuild.
2. Answer the open decisions above.
3. Phase 1 (secure persistence) when authorized. Its schema design takes in P-03 and P-07.
