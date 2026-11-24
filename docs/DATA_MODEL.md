# Preliminary relational data model

Proposal only; review required before schema implementation. Prisma intentionally has no domain models or migrations.

| Entities                                                             | Proposed relationships                                                                                                                                                     |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organization, Profile, Objective, BusinessFunction, Threat           | Versioned profile; threats link to objectives and capabilities                                                                                                             |
| Pillar, Function, Responsibility, Capability                         | Configurable functions within pillars; one accountable function per responsibility; capabilities span functions/pillars through joins                                      |
| Assessment, AssessmentItem, MaturityScale, Target, KPI               | Dated observations reference capability, assessor and scale version; targets separate from observations; null is unassessed, not zero                                      |
| Framework, Requirement, Applicability, Mapping, ComplianceAssessment | Versioned hierarchical requirements/deadlines; unique capability/requirement and responsibility/requirement joins; verified status separate from maturity-derived coverage |
| NiceVersion, WorkRole, Task, Knowledge, Skill                        | Authoritative versioned definitions, provenance and role/task links                                                                                                        |
| Position, Person, PositionAssignment, PositionRole                   | Separate authorized/filled/vacant/proposed positions, personnel and dated assignments; many roles per position                                                             |
| WorkActivity, WorkloadAssumption, CapacityAssumption, Allocation     | Unique responsibility-based activities, units, source and effective date; outsourcing/automation allocation prevents duplicated credited hours                             |
| Technology, Vendor, CapabilityCoverage, TechnologyCost               | Many capabilities per technology; utilization, scope, ownership and cost types                                                                                             |
| Risk, Finding, TreatmentLink                                         | Capability/requirement/function and initiative links; no enterprise evidence/acceptance engine                                                                             |
| Initiative, Dependency, ResourceNeed                                 | Links to capabilities, risks and requirements; workforce/technology demands; proposed/approved state                                                                       |
| Plan, PlanYear, Scenario, ScenarioAllocation, CostLine               | One five-year horizon; detailed first three years; scenarios reference shared initiatives and unique costs                                                                 |
| User, Session, Role, ChangeEvent                                     | Native authentication, server authorization and attributable history before organizational data                                                                            |

Use explicit join entities for dates, ownership and provenance. Money requires decimals and currency; capacity requires hours, FTE and period. Preserve inputs/calculation versions for reproducibility. Reject duplicate mapping pairs and dependency cycles. Shared mappings do not generate additional workload, budget or maturity facts.

Pending review: cardinalities, identifiers, tenancy, deletion/retention, assessment versioning, authentication library, role matrix, monetary conventions, scenario baselines and schema approval. No domain schema is approved by this document.
