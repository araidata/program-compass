/** Shared, task-oriented instructions. Guidance never creates or assesses records. */
export const planningSteps = [
  {
    id: "context",
    title: "Explain what the business needs",
    area: "Business Context",
    href: "/context",
    first: "Add one business objective and select the capabilities it needs.",
    steps: [
      "Describe the outcome you need to protect or enable, and why it matters.",
      "Choose the required capabilities. Add a business owner once that person is in Workforce.",
      "Add relevant threats only where they explain a planning priority.",
    ],
    result: "A business reason for improving specific capabilities.",
    next: "/capabilities",
    nextLabel: "Assess those capabilities",
  },
  {
    id: "assessment",
    title: "Record where you are and where you need to be",
    area: "Capabilities",
    href: "/capabilities",
    first:
      "Open a capability, record its current maturity, then set a target and explain your rating.",
    steps: [
      "Use Cards to explore the topics or Assessment to enter ratings. Open a topic for its details and level definitions.",
      "Current means assessed today; target means the level you want to reach. Leave unknown values unassessed.",
      "Record KPI measurements separately. Use Gaps to find the difference between current and target.",
    ],
    result: "An assessed gap you can explain and prioritize.",
    next: "/capabilities/planning?view=issue",
    nextLabel: "Describe the planning issue",
  },
  {
    id: "alignment",
    title: "Identify the requirements that drive the work",
    area: "Framework Alignment",
    href: "/compliance",
    first:
      "Choose a framework and open a requirement to record whether it applies to your organization.",
    steps: [
      "Read the official reference, then record applicability, implementation status, notes, and an owner.",
      "Map the relevant capabilities and explain the mapping. Review suggested mappings before relying on them.",
      "Use requirement maturity for that requirement's own assessment. It stays separate from capability maturity.",
    ],
    result:
      "Traceable requirement drivers and visible unknown or uncovered requirements. Coverage is indicative; it does not establish verified compliance.",
    next: "/capabilities/planning?view=responsibility",
    nextLabel: "Assign responsibility",
  },
  {
    id: "ownership",
    title: "Describe the gap and who will address it",
    area: "Responsibilities & planning issues",
    href: "/capabilities/planning?view=issue",
    first:
      "Add a planning issue linked to the capability, with its consequence, owner, and due date.",
    steps: [
      "Use Planning issues for a specific deficiency that affects a capability or investment decision.",
      "Use Responsibilities for ongoing work: connect the function, person or position, capability, and requirement drivers.",
      "Reuse the same responsibility across mappings. Add people and positions in Workforce when an owner is missing.",
    ],
    result: "An owned deficiency with a clear consequence if work is deferred.",
    next: "/workforce",
    nextLabel: "Identify the resources needed",
  },
  {
    id: "people",
    title: "Record the people and positions you have",
    area: "Workforce",
    href: "/workforce",
    first:
      "Add the people and authorized positions involved in your plan, including vacancies.",
    steps: [
      "People are individuals; positions are jobs that may be filled, vacant, or proposed.",
      "Record reporting relationships and position allocations. Link owners to capabilities and responsibilities.",
      "Then open workload and capacity to calculate whether available productive time can meet the work.",
    ],
    result:
      "A reusable roster and position structure, with actual vacancies distinguished from available capacity.",
    next: "/workforce/planning",
    nextLabel: "Calculate workload and capacity",
  },
  {
    id: "capacity",
    title: "Calculate whether you have enough capacity",
    area: "Workload & capacity",
    href: "/workforce/planning",
    first:
      "Add a sourced work activity, then enter productive hours and dated allocations for the people doing it.",
    steps: [
      "Describe each activity once. Enter its volume, annual frequency, hours per unit, fixed or project hours, and the basis for your estimate.",
      "Enter productive hours and allocated FTE for the planning year. Vacant positions contribute no actual capacity.",
      "Review demand, capacity, and shortfall. Add coverage constraints separately, then use the justification view to explain a proposed position.",
    ],
    result:
      "A staffing justification tied to work and available time. Missing inputs remain incomplete; NICE roles are not staffing ratios.",
    next: "/technology",
    nextLabel: "Review technology needs",
  },
  {
    id: "technology",
    title: "Decide what technology investment is needed",
    area: "Technology",
    href: "/technology",
    first:
      "Record what you already use and which capabilities it supports before proposing another investment.",
    steps: [
      "Add ownership, deployment, utilization, lifecycle dates, and sourced costs for existing tools.",
      "Explain whether the gap is missing technology, underutilization, staffing, or process.",
      "Compare an investment with optimization, consolidation, replacement, retirement, or managed services. Link the relevant capabilities and requirements.",
    ],
    result:
      "A technology decision justified against existing coverage and alternatives.",
    next: "/roadmap",
    nextLabel: "Create the initiative",
  },
  {
    id: "initiatives",
    title: "Turn the gap into scheduled work",
    area: "Roadmap",
    href: "/roadmap",
    first:
      "Choose Add initiative and link the objective, capability gap, issue, and resources it will address.",
    steps: [
      "Set an owner, dates, priority, outcomes, dependencies, effort, and the consequence of deferral.",
      "Investment approval and execution status are separate: approval says whether to fund it; execution says how the work is progressing.",
      "Record expected capability uplift with a rationale. Check the timeline, uncovered gaps, and unmet dependencies.",
    ],
    result:
      "A sequenced proposal with resource needs. Completing it does not change actual maturity; reassess the capability after validating the outcome.",
    next: "/roadmap/plan",
    nextLabel: "Compare funding scenarios",
  },
  {
    id: "funding",
    title: "Choose what to fund and when",
    area: "Five-year plan & scenarios",
    href: "/roadmap/plan",
    first:
      "Choose Add scenario, then include the initiatives, positions, and technology you want to fund.",
    steps: [
      "Set scenario-specific inclusion and timing. The shared initiative and resource records stay reusable across alternatives.",
      "Enter annual targets, budget limits, and sourced cost or savings lines. Give each distinct cost one identity; do not enter a resource's same cost again as an initiative cost.",
      "Create a second scenario with different timing or funding. Compare annual costs, projected gaps, missed deadlines, and unfunded requirements.",
    ],
    result:
      "A five-year decision: detailed years 1–3 and directional years 4–5. Incomplete costs and infeasible deadlines remain visible.",
    next: "/reports",
    nextLabel: "Prepare the leadership report",
  },
  {
    id: "reports",
    title: "Explain the plan and track progress",
    area: "Reports",
    href: "/reports",
    first:
      "Choose an executive or management pack and the scenario you want to explain.",
    steps: [
      "Review the scope, assumptions, maturity gaps, capacity, initiatives, annual costs, and unresolved deficiencies.",
      "Follow source links to correct incomplete inputs. Export the filtered CSV or use Print for a leadership pack.",
      "At a review checkpoint, open Capabilities and choose Capture cycle. Later select that frozen record using Planning cycle, or compare cycles in Capabilities.",
    ],
    result:
      "A report backed by linked records, plus a repeatable review process.",
    next: "/",
    nextLabel: "Review the Overview",
  },
] as const;

export type PlanningStep = (typeof planningSteps)[number];
