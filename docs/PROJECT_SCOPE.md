# Program Compass scope

> Governing update: the 2026-11-23 strategic scope correction and latest Framework Alignment requirements below supersede conflicting historical proposals. Dedicated framework assessment and implementation tracking are core; enterprise GRC workflows remain excluded. Current implementation authorization and state are recorded below.

> Current authorization (owner instruction 2026-11-24): complete the remaining strategic-planning site and tools, preserving existing infrastructure and scope exclusions. Earlier documentation-only and slice-approval gates are historical and superseded by this instruction. Desktop-only support: 1280 px and above; no mobile work. See CONTINUATION.md and PROJECT_STATUS.md for actual completion state.

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

## Future scope classification

MVP: organization profile/business context; configurable pillars/functions/responsibilities; capabilities and maturity; NIST CSF 2.0 and actual CJIS 6.0 alignment; authoritative NICE roles/tasks; workload/capacity; technology coverage/investment; lightweight risks/findings; unified initiatives and three/five-year scenarios; annual financial projections and practical reports. FUNCTIONAL_REQUIREMENTS.md contains the authoritative details.

Subsequent: AI-assisted narrative/reporting with human validation. Required maturity/performance/framework analytics and straightforward funding scenarios belong in the core roadmap, as corrected below. Optional: additional frameworks beyond the initial NIST/CJIS/NICE set.

Excluded: marketing/branding, subscriptions, public registration, external SSO, enterprise GRC/evidence/audit/acceptance platforms, HR/project-management replacements, unsupported benchmark claims and automated compliance claims. No restricted or actual organizational data in development.

## Historical authorization — completed secure persistence

The user’s 2026-11-23 Phase 4 request authorizes database/authentication/backend foundation (repository Phase 1), including login/logout, three roles, administrator-managed accounts, basic organization settings, pillars/functions and change history. The user explicitly authorized new dedicated Neon resources after confirming none of the existing team databases were suitable. No assessment, framework import, workforce calculations, technology inventory or strategic planning is authorized.

## Corrected governing scope — 2026-11-23

This section, reconciled with the latest Framework Alignment and Maturity Assessment Requirements, supersedes conflicting earlier future-scope and reference-parity statements. Program Compass is a cybersecurity program development, strategic planning and resource justification application. Existing enterprise systems retain compliance, enterprise risk, audit and security operations management. Reference parity is an established baseline **only for features serving strategic planning**, not a mandate to reproduce every reference module.

Required objectives: program development, capability assessment, maturity improvement, performance measurement, responsibility alignment, workforce planning, resource justification, technology investment planning, prioritization, financial forecasting and multiyear strategic planning. Every proposed feature must name at least one objective and a concrete planning decision it supports; otherwise exclude it pending explicit approval.

Retain reference capability/maturity/KPI, business context, ownership, targets, roadmap and executive/management reporting concepts. NIST CSF 2.0 and CJIS Security Policy v6.0 are versioned reference inputs to capabilities, responsibilities, targets, resources, deficiencies, priorities and deadlines. NICE supplies workforce roles/tasks/knowledge/skills, not staffing ratios. Provide a dedicated Framework Alignment section and contextual mappings within capabilities. Framework assessment, requirement applicability/implementation tracking, current/target maturity, notes, history, coverage and gap analysis are core scope. Never assert that maturity/coverage proves compliance. Reference NIS2/DORA/ISO datasets are not required parity under this correction; adding other framework reference data requires separate justification/approval.

Exclude formal certification/attestation, evidence management platforms, audit lifecycle management, formal control testing, compliance exception approval, compensating control management, formal risk acceptance, continuous compliance monitoring and comprehensive enterprise GRC. Requirement-specific assessments and implementation tracking remain in scope; these are not certification or formal control testing. Lightweight risks/findings/deficiencies may be recorded or referenced only when linked to a capability development, priority, resource or technology decision; no comprehensive risk register or audit finding system. Do not recreate external enterprise systems or integrate them without a defined need.

Current authorization is documentation review, functional gap analysis and a corrective implementation proposal. Stop after presenting it. No business implementation, migrations, navigation changes, production rollout or major architecture changes are authorized by this review. Preserve GitHub, Vercel, Neon, native authentication and existing working components. Completed Phase 1 remains historical; proposed R1–R5 slices do not authorize development.

## Desktop-only support — owner correction 2026-11-24

Supported desktop viewport widths are 1280 px and above. Mobile site development, mobile navigation, mobile QA and phone reading support are excluded permanently unless Aaron explicitly requests reinstatement. This supersedes prior responsive/mobile scope language; historical completion records remain historical. Desktop accessibility remains required.
