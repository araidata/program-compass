# Program Compass scope

Program Compass supports cybersecurity strategic planning, capability assessment, and resource planning.

## Phase 0

Establish a deployable application foundation: responsive navigation, header, initialization dashboard, module placeholders, tooling, Prisma configuration, and deployment documentation. No business workflows, authentication implementation, persistence, or organizational metrics are included.

Modules (approved 2026-11-24, DECISION_LOG P-01 and P-11), grouped in navigation:

- Overview (`/`)
- Assess: Capabilities (`/capabilities`), Compliance (`/compliance`), Risks & Findings (`/risks`)
- Plan: Business Context (`/context`), Roadmap (`/roadmap`)
- Resources: Workforce (`/workforce`), Technology (`/technology`)
- Reports (`/reports`) and Settings (`/settings`)

These replace the earlier names Dashboard, Current State, Strategic Planning, People & Resources, Technology Portfolio, and Reporting. Workforce covers roster and positions, FTE allocation, supply versus demand by pillar and quarter, and skills (P-09). Every module offers CSV export of its current view; Reports composes multi-module packs (P-12).

The organizational model has three pillars: Security Operations; Security Architecture & Engineering; Governance, Risk & Compliance. Future capability, staffing, technology, and planning work must retain this model.

The information architecture, layout, and visual direction come from the review in [UX_REVIEW.md](UX_REVIEW.md), approved 2026-11-24 and recorded in [DECISION_LOG.md](DECISION_LOG.md). Current state is in [PROJECT_STATUS.md](PROJECT_STATUS.md).

Architectural requirements are maintained only in [ARCHITECTURE.md](ARCHITECTURE.md).
