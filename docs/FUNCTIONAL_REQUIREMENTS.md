# Functional requirements

> Governing update: the 2026-11-23 strategic scope correction and latest Framework Alignment requirements below supersede conflicting historical proposals. Dedicated framework assessment and implementation tracking are core; enterprise GRC workflows remain excluded. Current implementation authorization and state are recorded below.

> Current authorization (owner instruction 2026-11-24): complete the remaining strategic-planning site and tools, preserving existing infrastructure and scope exclusions. Earlier documentation-only and slice-approval gates are historical and superseded by this instruction. Desktop-only support: 1280 px and above; no mobile work. See CONTINUATION.md and PROJECT_STATUS.md for actual completion state.

The following user-supplied requirements define future business functionality. None is implemented in Phase 0. Scope classifications are in PROJECT_SCOPE.md; technical decisions are in ARCHITECTURE.md.

## 4. Security Operating Framework

The application must support three primary cybersecurity organizational pillars.

### Security Operations

Responsible for identifying, investigating, validating, and prioritizing operational cybersecurity risks.

Responsibilities include:

- Security monitoring.
- Threat detection.
- Threat intelligence.
- Threat hunting.
- Security investigations.
- Incident response.
- Vulnerability identification and assessment.
- Threat modeling.
- Attack surface and exposure identification.
- Operational risk assessment.
- Risk prioritization.
- Detection requirements.
- Operational validation of remediation.
- Security operations performance measurement.

### Security Architecture & Engineering

Responsible for designing, implementing, maintaining, and improving cybersecurity solutions.

Architecture responsibilities include:

- Security architecture.
- Secure solution design.
- Architecture reviews.
- Technical security standards.
- Secure design patterns.
- Technology strategy.
- Security capability development.
- Architectural risk reduction.
- Prevention of recurring security deficiencies.

Engineering responsibilities include:

- Security control implementation.
- Security technology deployment.
- Configuration and maintenance.
- Technical remediation.
- Security automation.
- Technology integration.
- Technical control validation.
- Security infrastructure management.
- Security technology optimization.

### Governance, Risk & Compliance

Responsible for cybersecurity governance, regulatory alignment, risk governance, performance measurement, and compliance assurance.

Responsibilities include:

- Cybersecurity governance.
- Policies and standards governance.
- Regulatory compliance.
- Enterprise cybersecurity risk governance.
- Third-party risk management.
- Compliance assessments.
- Control assurance.
- Audit coordination.
- Exception management.
- Risk acceptance governance.
- AI governance.
- Security awareness governance.
- Program performance measurement.
- Executive reporting.

### Organizational Modeling Requirements

Distinguish between:

- Organizational pillars.
- Organizational functions.
- Security capabilities.
- Functional responsibilities.
- Workforce work roles.
- Individual positions.
- Individual personnel.
- Regulatory requirements.
- Technology capabilities.

Security capabilities may span multiple organizational pillars.

Do not force exclusive pillar ownership of a security capability when its responsibilities are shared across multiple functions.

Individual functional responsibilities should have clearly defined ownership.

The organizational structure and responsibility assignments must remain configurable.

Support the following program development principles as configurable strategic objectives:

- Structured.
- Measurable.
- Efficient.

## 5. Core Functional Requirements

The following sections describe functional requirements, not mandatory navigation items or independent application modules.

Related functionality may be consolidated to simplify the application.

### 5.1 Executive Overview

Provide leadership visibility into:

- Enterprise cybersecurity posture.
- Current and target maturity.
- Capability deficiencies.
- Strategic priorities.
- Strategic initiative progress.
- Workforce capacity.
- Workforce requirements.
- Technology investment requirements.
- Budget outlook.
- Key performance indicators.

Support enterprise-wide and organizational pillar views.

Do not populate dashboards with fabricated organizational metrics.

### 5.2 Organizational Profile

Support configurable organizational characteristics, including:

- Organization name.
- Organization type.
- Number of employees and users.
- Number of endpoints.
- Number of servers.
- Number of applications.
- Number of cloud environments.
- Number of departments and business units.
- Number of third-party vendors.
- Number of critical systems.
- Number of AI systems.
- Critical business functions.
- Regulatory obligations.
- Operational complexity.
- Business criticality.
- Operating hours and availability requirements.
- Current cybersecurity workforce.
- Current cybersecurity budget.
- Outsourced security services.
- Anticipated organizational growth.

Organizational profile information should inform workforce, capability, technology, and financial planning.

Do not rely exclusively on organization size or employee count to determine resource requirements.

### 5.3 Business Context

Support:

- Business objectives.
- Critical business functions.
- Business threats.
- Threat likelihood and impact.
- Relationships between threats and security capabilities.
- Business and operational dependencies.
- Security implications of organizational changes.

Business context should inform strategic priorities and investment recommendations.

### 5.4 Security Capabilities and Maturity

Maintain a configurable security capability catalog aligned with NIST Cybersecurity Framework 2.0.

Support:

- Security capability descriptions.
- Capability applicability.
- Current maturity.
- Target maturity.
- Maturity gaps.
- Functional responsibilities.
- Organizational ownership.
- Performance indicators.
- Related risks and findings.
- Supporting technologies.
- Supporting workforce roles.
- Improvement requirements.
- Strategic initiatives.

Use a documented and configurable maturity assessment methodology.

Clearly distinguish unassessed capabilities from capabilities assessed at a low maturity level.

Avoid double-counting capabilities shared across organizational pillars or mapped to multiple frameworks.

### 5.5 Framework Alignment (extended by section 7)

Initially support:

- NIST Cybersecurity Framework 2.0.
- FBI CJIS Security Policy Version 6.0.

Provide an extensible framework structure for future regulatory and security frameworks.

Support:

- Framework requirements.
- Control families and categories.
- Requirement applicability.
- Capability-to-requirement mappings.
- Responsibility-to-requirement mappings.
- Requirement ownership.
- Coverage deficiencies.
- Regulatory drivers for strategic initiatives.
- Applicable implementation deadlines.
- Compliance-related resource requirements.

Use authoritative framework source material.

CJIS requirements must be based on the actual CJIS Security Policy Version 6.0, not a generic substitution of NIST SP 800-53 controls.

Distinguish between:

- Maturity-based requirement coverage.
- Requirement implementation status (distinct from verified regulatory compliance, which the application does not establish).
- Unassessed requirements.
- Non-applicable requirements.
- Unmapped requirements.

Maturity-based coverage must never be represented as verified regulatory compliance.

Do not implement a comprehensive evidence management, audit management, or formal risk acceptance platform.

Compliance functionality should primarily support capability assessment and strategic planning.

### 5.6 Workforce and Resource Planning

Integrate the NICE Workforce Framework using authoritative work role and task definitions.

Support:

- Existing authorized positions.
- Filled positions.
- Vacant positions.
- Proposed positions.
- Organizational pillar assignments.
- Functional responsibilities.
- NICE work role mappings.
- Workload drivers.
- Task frequency.
- Estimated effort.
- Annual workload.
- Available productive capacity.
- Staffing deficiencies.
- Outsourced service capacity.
- Automation opportunities.
- Future staffing requirements.
- Workforce cost projections.

A single position may perform multiple NICE work roles.

A NICE work role does not automatically represent a dedicated full-time position.

NICE provides workforce roles, tasks, knowledge, and skills. Do not assume it provides standardized staffing ratios, task durations, or staffing requirements.

Additional workforce planning references and datasets will be provided during the appropriate implementation phase.

#### Resource Calculation Methodology

Workforce recommendations should consider four complementary methods:

1. Workload-based resource requirements.
2. Capability-based resource requirements.
3. Minimum operational coverage and continuity requirements.
4. Relevant organizational and industry benchmarks.

The primary calculation methodology should be workload-based.

For each applicable responsibility or activity, support:

- Workload volume.
- Frequency.
- Estimated effort per activity.
- Fixed recurring workload.
- Project-related workload.
- Anticipated workload growth.
- Outsourced workload.
- Automation-related workload reduction.
- Available productive personnel hours.

Calculate annual workload, required capacity, available capacity, and capacity deficiencies.

Distinguish between total paid working hours and productive working hours.

Account for leave, holidays, training, administrative responsibilities, meetings, and other nonproductive capacity assumptions.

Avoid double-counting responsibilities mapped to multiple frameworks or work roles.

Account for minimum staffing, operational continuity, specialized expertise, and separation-of-duties requirements where applicable.

All workload assumptions must be editable and attributable to a documented source, organizational estimate, or actual measurement.

Do not fabricate industry benchmarks or present unsupported assumptions as established standards.

#### Workforce Recommendation Output

Each proposed position should include:

- Proposed position title.
- Organizational pillar.
- Proposed implementation year.
- Required functional responsibilities.
- Relevant NICE work roles.
- Supporting capability deficiencies.
- Estimated annual workload.
- Existing available capacity.
- Calculated capacity deficiency.
- Recommended FTE requirement.
- Regulatory and business drivers.
- Estimated annual cost.
- Outsourcing or automation alternatives.
- Consequences of deferring the position.
- Supporting assumptions and calculation methodology.

### 5.7 Technology Portfolio

Support:

- Existing security technologies.
- Technology vendors.
- Technology categories.
- Supported security capabilities.
- Technology ownership.
- Deployment coverage.
- Existing utilization.
- Annual licensing costs.
- Implementation costs.
- Operational costs.
- Contract renewal dates.
- Technology dependencies.
- Technology deficiencies.
- Planned technology investments.

Identify opportunities to:

- Optimize existing technologies.
- Expand existing capabilities.
- Consolidate overlapping technologies.
- Replace ineffective technologies.
- Retire unnecessary technologies.
- Acquire missing capabilities.
- Utilize managed security services.

Technology recommendations should evaluate existing technology coverage before recommending new acquisitions.

Distinguish between a missing technology, an underutilized technology, and a capability deficiency caused by insufficient staffing or ineffective processes.

### 5.8 Risks and Findings

Retain lightweight risk and finding management functionality sufficient to support strategic planning.

Support:

- Risk descriptions.
- Likelihood and impact.
- Inherent and residual risk.
- Related capabilities.
- Related regulatory requirements.
- Related findings.
- Responsible organizational functions.
- Remediation initiatives.
- Treatment status.
- Target dates.

Risks and findings should inform strategic priorities and investment justification.

Do not recreate an enterprise risk management platform or formal risk acceptance workflow.

### 5.9 Strategic Initiatives and Roadmap

Support a unified strategic initiative portfolio.

Each initiative should include:

- Initiative name and description.
- Business justification.
- Organizational pillar.
- Responsible owner.
- Related security capabilities.
- Related maturity deficiencies.
- Related risks and findings.
- Related regulatory requirements.
- Expected outcomes.
- Required workforce.
- Required technologies.
- Estimated implementation effort.
- One-time costs.
- Recurring costs.
- Dependencies.
- Proposed start and completion dates.
- Proposed implementation year.
- Priority.
- Status.
- Consequences of deferral.

Distinguish between current conditions, approved future initiatives, proposed initiatives, and hypothetical planning scenarios.

Completing an initiative must not automatically increase assessed maturity or establish verified regulatory compliance without validation.

### 5.10 Three- and Five-Year Strategic Planning

The primary application deliverable is a defensible cybersecurity strategic plan.

Support:

- Detailed three-year strategic planning.
- Directional five-year strategic planning.
- Annual capability development objectives.
- Annual maturity targets.
- Workforce additions.
- Technology investments.
- Strategic initiatives.
- Annual budget projections.
- Implementation sequencing.
- Business justifications.
- Alternative funding scenarios.
- Deferred investments.
- Remaining capability deficiencies and risks.

Use a single planning model with three- and five-year views rather than maintaining disconnected plans.

Years one through three should support detailed actionable planning.

Years four and five should support directional planning with appropriate uncertainty.

Strategic recommendations should consider:

- Business criticality.
- Public safety and operational consequences.
- Regulatory requirements.
- Mandatory implementation deadlines.
- Risk reduction.
- Current and target maturity.
- Capability deficiencies.
- Workforce capacity.
- Technology deficiencies.
- Implementation effort.
- Budget constraints.
- Initiative dependencies.
- Organizational growth.

Mandatory regulatory deadlines must be treated as planning constraints rather than simply discretionary prioritization factors.

If mandatory requirements cannot be achieved within available resources, identify the resulting deficiency rather than silently producing an infeasible plan.

### 5.11 Financial Planning

Support:

- Current annual cybersecurity budget.
- Existing personnel costs.
- Existing technology costs.
- Existing managed service costs.
- Proposed workforce costs.
- Fully burdened personnel costs.
- Proposed technology costs.
- One-time implementation costs.
- Recurring operational costs.
- Training costs.
- Salary escalation.
- Licensing escalation.
- Technology retirement savings.
- Consolidation savings.
- Annual and cumulative budget projections.

Distinguish between baseline costs and incremental investments.

Prevent double-counting of existing personnel and technology expenses.

Support configurable assumptions and planning scenarios.

Initially prioritize straightforward scenario comparisons, including:

- Existing funding.
- Minimum regulatory and operational requirements.
- Risk-prioritized investment.
- Target maturity investment.
- Alternative funding levels.

Avoid developing a complex financial modeling or mathematical optimization platform.

### 5.12 AI-Assisted Analysis

The application should eventually support AI-assisted:

- Capability gap analysis.
- Strategic recommendations.
- Workforce recommendations.
- Technology investment recommendations.
- Alternative approaches.
- Business justification narratives.
- Executive summaries.
- Strategic plan generation.

AI must not serve as the authoritative calculation engine.

Deterministic application logic must perform staffing, maturity, budget, coverage, and other quantitative calculations.

AI-generated recommendations must reference supporting application data and distinguish facts from assumptions.

AI must not fabricate regulatory requirements, staffing benchmarks, technology pricing, organizational information, or calculated results.

AI integration is a subsequent implementation phase. Do not select or integrate an AI provider during initial application foundation development.

### 5.13 Reporting

Support practical reporting outputs, including:

- Executive cybersecurity program summary.
- Current and target maturity.
- Capability gap analysis.
- Compliance alignment.
- Workforce capacity and staffing requirements.
- Individual position justifications.
- Technology investment requirements.
- Strategic initiatives.
- Three-year strategic plan.
- Five-year strategic outlook.
- Annual budget forecasts.
- Alternative funding scenarios.

Reports should be suitable for leadership discussions, strategic planning, and budget justification.

Prioritize practical tabular exports and print-ready reporting before implementing sophisticated report designers.

## 6. Governing strategic planning correction — 2026-11-23

This section, reconciled with section 7 below, supersedes conflicting requirements above, especially any comprehensive enterprise risk/finding interpretation. Each feature must satisfy the scope test in PROJECT_SCOPE.md. Reference baseline evidence and feature dispositions are in REFERENCE_APPLICATION_REVIEW.md and REFERENCE_FUNCTIONAL_PARITY.md.

### 6.1 Reference baseline supporting planning

Preserve the original 30 topics and 60 operational KPIs as an inventoried baseline before modifying the catalog (inventory in the review). Support expandable topic details/subject areas, search/filter, level definitions, current maturity, missing assessment, distribution/aggregate maturity, directional KPI thresholds/status, current/target comparisons, dates, person owners, last review and due/overdue indicators. Extend via versioned catalogs without losing original IDs or silently changing historic calculations. Future scope/cadence/scale decisions require approval.

Business objectives and threats link to capabilities. Present likelihood/impact, readiness, weakest/average maturity and threat-to-objective relationships where they explain strategic priority; keep high-level business threats distinct from a comprehensive enterprise risk register. Connected deficiency and initiative views must show why an investment is needed. Initiatives retain expected uplift, owners, budgets, dates, capability/issue links and timeline/list views; expected uplift never overwrites actual assessed maturity.

### 6.2 Framework reference integration

Support NIST CSF 2.0, actual CJIS Security Policy v6.0 and authoritative NICE for their respective purposes. Framework references answer which capabilities are needed, why, which requirements/deadlines drive them, what responsibilities/workforce/technologies are needed, what gaps remain and which investments to prioritize. Store version, source, mapping rationale, applicability and deadlines. Show references within capability views/strategic justification and provide the dedicated Framework Alignment assessment section defined in section 7.

Indicative mapped-capability maturity, weakest/average maturity and alignment coverage may aid planning. Label them as indicative, disclose unmapped/unassessed/non-applicable items, and never label them verified compliance. Requirement-specific assessment, implementation tracking and framework analytics are in scope under section 7. Exclude certification/attestation, evidence platforms, audit lifecycle management, formal control testing, exception approval, compensating control management, formal risk acceptance, continuous compliance monitoring and comprehensive enterprise GRC. A verified-status/certification workflow is not authorized.

### 6.3 Planning issues and ownership

Support a lightweight issue/deficiency or external risk/finding reference only with documented effect on capability development, priorities, resources or technology investment. Keep source/reference, description, planning consequence, owner, relevant dates, simple planning state and capability/initiative/resource links. Do not create an enterprise risk register, audit lifecycle, risk acceptance workflow or evidence repository. Finding ageing/overdue flags may support prioritization; broad risk scoring/heat maps are optional proposals requiring a concrete strategic use and approved methodology.

People/positions, reporting relationships, responsibility ownership and outstanding/overdue planning work support resource justification. Record-count workload is distinct from measured hours/FTE. Preserve three SOF pillars; Architecture and Engineering remain distinct functions. NICE mappings never multiply workload or imply one role equals one position.

### 6.4 End-to-end completion

The required flow is: establish context/complexity; identify applicable capabilities; assess maturity/performance; set targets; identify deficiencies; determine responsibilities; calculate workload/capacity; identify technology requirements/gaps; prioritize initiatives; forecast workforce/technology investments; generate detailed three-year and directional five-year plans; measure progress. Reuse one plan, shared records and deterministic calculations.

Every completed feature requires usable accessible UI, persistent authorized data, meaningful reciprocal relationships, correct approved calculations, error/empty states and validated workflows. Navigation, placeholders, models, CRUD or summary cards alone are not completion. Reports provide executive/management maturity/performance, investment rationale, workforce capacity, initiatives, annual costs, assumptions and remaining deficiencies; safe CSV and print-ready output precede elaborate report designers. No regulatory audit reporting.

## 7. Framework Alignment and Maturity Assessment — latest governing requirements

These latest user requirements supersede prior exclusions of framework-level assessment, requirement implementation tracking or a dedicated framework section. Framework assessment is core strategic planning functionality. Preserve existing infrastructure; this review authorizes documentation and planning, not a rewrite or new business implementation.

Initially support authoritative NIST CSF 2.0, FBI CJIS Security Policy v6.0 and NICE Workforce Framework for their distinct purposes. Keep an extensible versioned model preserving official identifiers, hierarchy, descriptions and source links. NICE work roles/tasks/knowledge/skills support workforce relationships; do not falsely treat NICE as regulatory controls or a prescribed maturity/FTE standard.

Provide dedicated Framework Alignment with framework selection/hierarchy navigation, requirement/control listings, applicability, implementation status, current/target maturity assessments, notes/observations, strengths/weaknesses, capability and responsibility mappings, technology/workforce relationships, initiatives, applicable deadlines, references and assessment history. Users can create/edit/maintain assessments and mappings. Reference versions are separate from organizational assessment records.

Required analytical views: NIST maturity by function/category; CJIS implementation status; coverage summaries and heat maps; current/target comparison and gaps; capability strengths/weaknesses; pillar maturity; unmapped requirements; historic maturity trends; projected future-state maturity. These must provide linked analytical decisions, not just forms/tables. Supply accessible table/text equivalents.

Capabilities are the central link among requirements, authoritative maturity, KPIs, responsibilities, SOF pillars, NICE roles/tasks, workforce capacity, technology coverage, planning issues, initiatives and costs. Assess a shared capability once across framework mappings. Where a requirement needs a specific assessment, store its own applicability/status/notes/maturity separately; never duplicate or silently overwrite capability maturity. Define how these facts appear in analytics before implementing calculations.

Trace each proposed position, technology investment or initiative to its capability deficiencies and applicable requirement drivers. Assessments inform targets, strengths/weaknesses, responsibilities/resources, priorities, detailed three-year plans, directional five-year outlook and annual financial justification.

Keep assessed capability maturity, target maturity, projected maturity, requirement implementation status, framework coverage and verified regulatory compliance distinct. Maturity/coverage never imply compliance; completing initiatives never changes assessed maturity automatically. Deduplicate capabilities, responsibilities, workload and cost across mappings. Document every aggregation/coverage/projection method, unknown handling, denominators and version.

Excluded: formal certification/attestation, evidence platforms, audit lifecycle management, formal control testing, compliance exception approval, formal risk acceptance, continuous compliance monitoring and comprehensive enterprise GRC. These exclusions do not remove framework assessment, implementation tracking, maturity/coverage analysis or gap identification.
