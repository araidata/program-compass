# Preliminary relational data model

The future domain relationships below remain proposals. The implemented secure persistence foundation is described first.

## Implemented foundation

User (fixed admin/editor/viewer role, active flag) has many credential Accounts and revocable Sessions. Verification and RateLimit support Better Auth’s adapter. Email is unique/normalized. Passwords are salted hashes in Account; session tokens are server-managed credentials and never returned by application admin APIs.

Organization and ApplicationSettings are constrained singletons. Organization has three configurable Pillars, each with many OrganizationalFunctions (unique name per pillar). The Architecture and Engineering functions are distinct under the SA&E pillar. ChangeEvent optionally references its actor User and records entity/action/time plus allowlisted JSON details. Foreign keys restrict deletion of referenced configuration/history actors; sessions/accounts cascade on user deletion. There is no tenant model.

UUID string identifiers, createdAt/updatedAt on mutable records, indexes for sessions and chronological history, explicit role enum and migration SQL check constraints. Migration: 202611230001_foundation. No organization metrics/personnel or real assessments seeded.

## Future relationship design (not implemented)

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

Future review: domain cardinalities, retention, assessment versioning, money/currency and scenario baselines. No multi-tenancy. Planning cycles own dated snapshots/assessments and future plan/scenario views (P-03); future person records, separate from login Users, provide owner/assignee references (P-07). These future domain tables remain deferred.
