# Implementation plan

1. **Phase 0 — Foundation:** application shell, placeholders, development tooling, deployment readiness, shared instructions. Stop here until further authorization.
2. **UI/UX review gate:** Claude Code reviews navigation, density, accessibility and proposed design documents before substantive frontend work. Review does not authorize infrastructure or business functionality.
3. **Phase 1 — Secure persistence:** provision Neon through Vercel, approve domain schema and migrations, implement native authentication and server-side authorization before organizational data is introduced.
4. **Phase 2 — Assessment:** business context, current state, and compliance across the three cybersecurity pillars.
5. **Phase 3 — Resources and portfolio:** people, capacity, and technology planning.
6. **Phase 4 — Strategy and findings:** strategic plans, risk tracking, and prioritization.
7. **Phase 5 — Reporting and hardening:** reporting, accessibility, operational monitoring, and release validation.

Each phase requires separately approved scope and meaningful validation. Follow [ARCHITECTURE.md](ARCHITECTURE.md).

## Acceptance gates

- Foundation: shared documents, evidence-limited reference review, shell, all routes, responsive navigation, no DB dependency, clean lint/types/format/schema/build/browser checks, reviewed commit and GitHub delivery.
- Persistence: separately approve hosting/security, schema, migrations, native authentication and server authorization; isolate preview/production.
- Assessment: approve maturity methodology, applicability states, capability deduplication, authoritative framework/NICE versions and mappings.
- Resources: approve sourced assumptions and independently test workload, productive capacity, minimum coverage, technology utilization and deduplication.
- Strategy: verify unified three/five-year plan, scenario isolation, recurring costs, dependency sequencing, deadlines and deferral.
- Reporting/hardening: reproduce calculations, validate access control, accessibility and reports. AI assistance requires separate approval.

Stop at Phase 0 (initial Phase 1 in the supplied request). Schema, datasets and workload assumptions remain pending review.
