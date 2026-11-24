# Reference application review

Reviewed 2026-11-23: [CISO Security Program Management](https://spm.threat-modeling.com/). Public rendered content and browser interactions were inspected; no source code, branding or protected assets were copied. The default browser session displayed the explicitly fictional Example Corp. dataset. None of its values are Program Compass organizational data.

## Observable functionality

| Area           | Observation                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Context        | Objectives include priority and business owner; threats link objectives and defending topics; likelihood, impact, weakest/average maturity and readiness appear together              |
| Capabilities   | Thirty topics across five display groups; Respond and Recover are combined. This grouping must not be mistaken for the authoritative six CSF 2.0 functions                            |
| Maturity       | Five displayed levels from Initial through Optimized; current and target values, unassessed state, distributions and per-function summaries                                           |
| KPIs           | Two indicators per topic; visible definition, unit, favorable direction, pass/fail thresholds, editable values and missing-data status                                                |
| Roadmap        | Targets, dates, ownership and review age; sortable/filterable topic table; initiative list/roadmap controls, budget, status, dates, expected uplift and topic/risk/finding links      |
| Risks/findings | Inherent/residual views, heat map, finding age, topic-linked register, likelihood/impact, treatment, severity, owner and due date                                                     |
| Compliance     | NIS2, DORA, selected ISO 27001 controls and CSF category mappings; configurable maturity threshold, weakest/average topic values and indicative coverage statuses                     |
| People         | Reporting hierarchy, role/name, topic ownership and linked risks/findings/initiatives; workload displayed as counts of assigned records rather than measured FTE                      |
| Reporting      | Executive and management selectors, live summaries, maturity/coverage/roadmap/risk tables and print/PDF control                                                                       |
| Editing        | Add/edit controls and dialogs; objective editor exposes objective, rationale, priority and business owner; threat, person, initiative and risk editors expose relationship selections |
| Data           | Blank, Example Corp. and Saved modes, reset, CSV and print controls; page says data stays in the browser                                                                              |

Browser checks switched through Business context, Direction & roadmap, Risks & findings, Compliance, People and Reporting and observed the corresponding rendered views. In Blank mode a synthetic objective was saved and appeared in the list; after reload it was absent. Thus saving an editor in Blank mode did not establish durable persistence in that test. Saved-mode retention, switching and recovery semantics were not verified. No contact form was submitted.

## Calculations and verification limits

Rendered threat examples show likelihood multiplied by impact (for example 4 × 5 produces 20). The interface describes weakest-topic readiness and minimum-topic maturity coverage; visible compliance rows were consistent with a threshold of three. KPI threshold direction and target/current gap displays are observable. Review-age help describes due at six months and overdue at twelve. These are interface observations, not independently audited formulas or validated regulatory mappings. Rounding, missing-data aggregation, boundary cases, initiative uplift effects and risk category cutoffs were not exhaustively tested.

CSV file contents, print fidelity, all edit/delete paths, Saved-mode persistence, org-chart rename propagation and completed-initiative side effects remain unverified. No CJIS-specific mapping, NICE workload engine or defensible position-capacity model was observed. Their absence from reviewed views is not proof of absence elsewhere.

## Program Compass disposition

Retain linked context/capability/risk/initiative records, separate current/target states, compact filters, traceable indicators and practical reporting. Enhance with configurable shared responsibilities, authoritative source versions, separate verified compliance, measured workload/capacity, technology utilization and annual scenario costs. Consolidate roadmap and investment requirements into one plan with three/five-year views. Exclude marketing/contact capture, copied branding, authoritative browser-only storage and unsupported staffing/compliance claims. Keep initial frameworks limited to NIST CSF 2.0 and actual CJIS 6.0; additional frameworks are optional later work.
