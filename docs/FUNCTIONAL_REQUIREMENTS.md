# Functional requirements

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

### 5.5 Compliance Alignment

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
- Verified compliance assessment status.
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
