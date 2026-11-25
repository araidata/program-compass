import type { SnapshotDataset } from "../server/snapshots";
import { summarize, indicatorStatus } from "./capabilities";
import { alignmentSummary } from "./alignment";
import { objectiveCapabilities, readiness } from "./context";
import {
  capacityReport,
  activityDemand,
  constraintStatus,
  type Activity,
  type Constraint,
} from "./capacity";
import { scenarioReport } from "./finance";
export type ReportCell =
  string | number | null | { label: string; href: string };
export type ReportSection = {
  id: string;
  title: string;
  note: string;
  columns: string[];
  rows: ReportCell[][];
};
export const cellText = (cell: ReportCell) =>
  typeof cell === "object" && cell !== null
    ? cell.label
    : cell === null
      ? "Unknown"
      : String(cell);
export function buildReport(
  data: SnapshotDataset,
  options: {
    scope: string | null;
    pack: "executive" | "management";
    scenarioId: string | null;
    year: number;
  },
) {
  const caps = data.capabilities.filter(
    (c) => !options.scope || c.pillarKeys.includes(options.scope),
  );
  const capIds = new Set(caps.map((c) => c.id));
  const sections: ReportSection[] = [];
  const add = (
    id: string,
    title: string,
    note: string,
    columns: string[],
    rows: ReportCell[][],
  ) => sections.push({ id, title, note, columns, rows });
  const link = (label: string, href: string): ReportCell => ({ label, href });
  const n = (value: number | null) =>
    value === null ? null : Math.round(value * 100) / 100;
  const summary = summarize(caps, new Date(data.capturedAt));
  add(
    "summary",
    "Leadership summary",
    "Scope totals exclude unknown observations from means and disclose them separately; framework alignment is indicative planning coverage, not verified compliance.",
    ["Measure", "Value"],
    [
      ["Applicable capabilities", summary.applicable],
      ["Assessed capabilities", summary.assessed],
      [
        "KPIs passing / at risk",
        `${summary.indicators.pass} / ${summary.indicators.atRisk}`,
      ],
      [
        "KPIs failing / missing",
        `${summary.indicators.fail} / ${summary.indicators.missing}`,
      ],
      ["Unknown maturity", summary.unassessed],
      ["Mean current maturity", n(summary.averageCurrent)],
      ["Mean target maturity", n(summary.averageTarget)],
      ["Selected year", options.year],
      ["Captured / generated UTC", data.capturedAt],
      ["Method version", data.methods.id],
      ["Method basis", data.methods.basis],
    ],
  );
  if (data.context) {
    const profile = data.context.profile;
    add(
      "context",
      "Business context and objectives",
      "Organization-entered facts and strategic planning consequences.",
      ["Driver", "Planning decision / consequence", "Indicative readiness"],
      [
        ["Mission", profile?.mission ?? null, null],
        ["Critical services", profile?.criticalServices ?? null, null],
        ["Dependencies", profile?.dependencies ?? null, null],
        [
          "Public-safety consequences",
          profile?.publicSafetyImpact ?? null,
          null,
        ],
        ...data.context.objectives
          .filter(
            (o) =>
              o.active &&
              (!options.scope || o.capabilityIds.some((id) => capIds.has(id))),
          )
          .map((o) => {
            const r = readiness(
              objectiveCapabilities(o, data.context!.threats),
              data.capabilities,
              data.methods.values,
            );
            return [
              link(o.title, `/context?search=${encodeURIComponent(o.title)}`),
              o.rationale,
              `${r.state}; minimum ${r.minimum ?? "unknown"}, mean ${n(r.mean) ?? "unknown"}`,
            ];
          }),
      ],
    );
  }
  add(
    "maturity",
    "Capability maturity and accountability",
    "Authoritative capability observations are shared across all mappings; initiative projections do not replace assessments.",
    [
      "Capability",
      "Current → target",
      "Owner / function",
      "Assessment date",
      "Planning rationale",
    ],
    caps.map((c) => [
      link(`${c.code} · ${c.name}`, `/capabilities?topic=${c.id}`),
      `${c.currentLevel ?? "unknown"} → ${c.targetLevel ?? "unknown"}`,
      c.ownerPersonName ?? c.accountableFunctionName ?? "Unassigned",
      c.assessedAt,
      c.rationale,
    ]),
  );
  if (options.pack === "management")
    add(
      "kpis",
      "Operational performance indicators",
      "Original reference KPIs and local indicators; missing measurements remain unknown.",
      [
        "Capability / KPI",
        "Measured value",
        "Thresholds / direction",
        "Result",
        "Measured date",
      ],
      caps.flatMap((c) =>
        c.indicators.map((k) => [
          link(`${c.code} · ${k.name}`, `/capabilities?topic=${c.id}`),
          k.value === null ? null : `${k.value} ${k.unit}`,
          `pass ${k.passThreshold}, fail ${k.failThreshold} (${k.direction} is better)`,
          indicatorStatus(k),
          k.measuredAt,
        ]),
      ),
    );
  if (data.alignment) {
    const alignment = data.alignment;
    const scoped = {
      ...alignment,
      requirements: options.scope
        ? alignment.requirements.filter((r) =>
            r.values.capabilityIds.some((id) => capIds.has(id)),
          )
        : alignment.requirements,
    };
    add(
      "alignment",
      "Framework Alignment summaries",
      "Applicable leaf requirements form the denominator. Unknown applicability and draft/unmapped requirements are separately disclosed. Pillar scope includes mapped requirements only; Enterprise shows all unmapped requirements.",
      [
        "Official framework/version",
        "Covered / applicable leaves",
        "Unknown applicability",
        "Unmapped applicable",
        "Implemented applicable",
      ],
      alignment.frameworks.map((f) => {
        const s = alignmentSummary(
          scoped,
          data.capabilities,
          data.methods,
          f.id,
          alignment.requirements,
        );
        return [
          link(`${f.name} ${f.version}`, `/compliance?framework=${f.id}`),
          `${s.covered} / ${s.applicable} (${s.coverage === null ? "unknown" : n(s.coverage) + "%"})`,
          s.unknown,
          s.unmapped,
          s.implemented,
        ];
      }),
    );
    if (options.pack === "management")
      add(
        "requirements",
        "Requirement observations and mappings",
        "Independent requirement maturity never overwrites shared capability maturity. Unreviewed mappings do not contribute coverage.",
        [
          "Requirement",
          "Applicability / implementation",
          "Current → target",
          "Mapped capabilities / review",
          "Deadline / notes",
        ],
        scoped.requirements
          .filter(
            (r) => !alignment.requirements.some((c) => c.parentId === r.id),
          )
          .map((r) => [
            link(
              `${r.identifier} · ${r.title}`,
              `/compliance?framework=${r.frameworkId}&search=${encodeURIComponent(r.identifier)}`,
            ),
            `${r.values.applicability} / ${r.values.implementation}`,
            `${r.values.currentLevel ?? "unknown"} → ${r.values.targetLevel ?? "unknown"}`,
            `${r.values.capabilityIds.map((id) => data.capabilities.find((c) => c.id === id)?.code ?? id).join(", ")} · ${r.values.reviewed ? "reviewed" : "draft"}`,
            `${r.values.applicableDeadline ?? r.sourceDeadline ?? "no source deadline"} · ${r.values.notes ?? ""}`,
          ]),
      );
  }
  const planning = data.planning;
  const responsibilities =
    planning?.rows.filter(
      (r) =>
        r.kind === "responsibility" &&
        r.values.active &&
        (!options.scope ||
          (r.values.capabilityIds as string[]).some((id) => capIds.has(id))),
    ) ?? [];
  if (planning) {
    add(
      "ownership",
      "Responsibilities and ownership",
      "Shared responsibilities are counted once across capability/framework mappings.",
      [
        "Responsibility",
        "Function / person",
        "Capability drivers",
        "Responsible positions",
        "Source",
      ],
      responsibilities.map((r) => [
        link(
          String(r.values.title),
          `/capabilities/planning?view=responsibility&search=${encodeURIComponent(String(r.values.title))}`,
        ),
        `${planning.options.functions.find((f) => f.id === r.values.functionId)?.label ?? "Unknown"} / ${planning.options.people.find((p) => p.id === r.values.ownerId)?.label ?? "Unassigned"}`,
        (r.values.capabilityIds as string[])
          .map(
            (id) =>
              planning.options.capabilities.find((c) => c.id === id)?.label ??
              id,
          )
          .join("; "),
        (r.values.positionIds as string[])
          .map(
            (id) =>
              planning.options.positions.find((p) => p.id === id)?.label ?? id,
          )
          .join("; "),
        String(r.values.source),
      ]),
    );
    const issues = planning.rows.filter(
      (r) =>
        r.kind === "issue" &&
        (!options.scope ||
          (r.values.capabilityIds as string[]).some((id) => capIds.has(id))),
    );
    add(
      "deficiencies",
      "Unresolved planning deficiencies",
      "Lightweight strategic-planning issues; unrelated enterprise risk/audit records are excluded.",
      [
        "Deficiency",
        "State / due date",
        "Owner",
        "Planning consequence",
        "Source",
      ],
      issues
        .filter((r) => !["resolved"].includes(String(r.values.status)))
        .map((r) => [
          link(
            String(r.values.title),
            `/capabilities/planning?view=issue&search=${encodeURIComponent(String(r.values.title))}`,
          ),
          `${r.values.status} · ${r.values.dueDate ?? "undated"}${r.values.dueDate && String(r.values.dueDate) < data.capturedAt.slice(0, 10) && r.values.status !== "deferred" ? " · overdue" : ""}`,
          planning.options.people.find((p) => p.id === r.values.ownerId)
            ?.label ?? "Unassigned",
          String(r.values.consequence),
          String(r.values.source),
        ]),
    );
    add(
      "technology",
      "Technology portfolio and investment alternatives",
      "Separate missing technology from utilization, staffing and process deficiencies. Costs are reconciled through unique financial identities below.",
      [
        "Technology",
        "State / deficiency",
        "Coverage / utilization",
        "Alternatives",
        "Source",
      ],
      planning.rows
        .filter(
          (r) =>
            r.kind === "technology" &&
            (!options.scope ||
              (r.values.capabilityIds as string[]).some((id) =>
                capIds.has(id),
              )),
        )
        .map((r) => [
          link(
            String(r.values.title),
            `/technology?search=${encodeURIComponent(String(r.values.title))}`,
          ),
          `${r.values.state} / ${r.values.deficiencyType}`,
          `${r.values.coveragePercent ?? "unknown"}% / ${r.values.utilizationPercent ?? "unknown"}%`,
          String(r.values.alternatives),
          String(r.values.source),
        ]),
    );
  }
  if (data.capacity && data.workforce) {
    const capacity = data.capacity,
      workforce = data.workforce;
    const ids = responsibilities.map((r) => r.id);
    const r = capacityReport(capacity, workforce, options.year, ids);
    add(
      "capacity",
      "Workforce capacity and position justification",
      "Unique workload, entered productive hours and dated allocations; vacancies have no actual capacity. Coverage requirements remain separate from workload FTE.",
      ["Measure", "Value / input completeness"],
      [
        ["Known demand hours", n(r.knownHours)],
        ["Known productive capacity hours", n(r.knownCapacity)],
        ["Workload FTE", n(r.requiredFte)],
        ["Actual allocated FTE-years", n(r.availableFte)],
        ["Paid hours", n(r.paidHours)],
        ["Demand shortfall hours", n(r.shortfall)],
        [
          "Incomplete activities / capacity assignments",
          `${r.missingDemand.length} / ${r.missingCapacity.length}`,
        ],
        ["Run demand / capacity", `${n(r.runDemand)} / ${n(r.runCapacity)}`],
        [
          "Change demand / capacity",
          `${n(r.changeDemand)} / ${n(r.changeCapacity)}`,
        ],
      ],
    );
    add(
      "coverage",
      "Coverage, continuity, expertise and separation constraints",
      "These constraints are not summed into required workload FTE. Status at selected year-end, using current observed skills.",
      ["Constraint", "Planning status", "Alternatives", "Deferral consequence"],
      capacity.rows
        .filter(
          (c) =>
            c.kind === "constraint" &&
            c.values.active &&
            ids.includes(String(c.values.responsibilityId)),
        )
        .map((c) => {
          const s = constraintStatus(
            c.values as Constraint,
            capacity,
            workforce,
            `${options.year}-12-31`,
          );
          return [
            link(String(c.values.title), "/workforce/planning?view=coverage"),
            `${s.status}; ${s.people} people / ${n(s.fte)} FTE`,
            String(c.values.alternatives),
            String(c.values.consequence),
          ];
        }),
    );
    add(
      "positions",
      "Proposed positions",
      "Service-level shortfalls are not additive across overlapping proposals. Missing justification/cost is disclosed rather than invented.",
      [
        "Proposed position",
        "Business justification",
        "Unique workload / shortfall",
        "Cost / implementation",
        "Alternatives and consequences",
      ],
      workforce.positions
        .filter(
          (p) =>
            p.state === "proposed" &&
            (!options.scope ||
              workforce.pillars.some(
                (k) => k.id === p.pillarId && k.key === options.scope,
              )),
        )
        .map((p) => {
          const linked = responsibilities.filter(
            (r) =>
              (r.values.positionIds as string[]).includes(p.id) ||
              capacity.rows.some(
                (a) =>
                  a.kind === "assignment" &&
                  a.values.positionId === p.id &&
                  a.values.responsibilityId === r.id,
              ),
          );
          const result = capacityReport(
            capacity,
            workforce,
            options.year,
            linked.map((r) => r.id),
          );
          const constraints = capacity.rows.filter(
            (c) =>
              c.kind === "constraint" &&
              c.values.active &&
              linked.some((l) => l.id === c.values.responsibilityId),
          );
          return [
            link(p.title, "/workforce/planning?view=justifications"),
            p.justification,
            `${n(result.knownHours)} hours / ${n(result.shortfall) ?? "incomplete"} shortfall; workload FTE ${n(result.requiredFte) ?? "unknown"}`,
            `${p.annualCost === null ? "unknown" : p.annualCost} ${p.currency} / ${p.startYear ?? "unscheduled"}`,
            constraints
              .map((c) => `${c.values.alternatives}; ${c.values.consequence}`)
              .join(" | ") || "Not supplied",
          ];
        }),
    );
    if (options.pack === "management")
      add(
        "workload",
        "Reproducible workload inputs",
        "(volume × frequency × hours/unit + fixed + project) × growth − distinct outsourced − distinct automated hours. Unknowns are not zero.",
        [
          "Unique activity",
          "Formula inputs",
          "Demand / FTE",
          "Source / effective date",
        ],
        r.activities.map((a) => {
          const d = activityDemand(a.values as Activity);
          return [
            link(
              `${a.values.workKey} · ${a.values.title}`,
              `/workforce/planning?year=${options.year}&search=${encodeURIComponent(String(a.values.title))}`,
            ),
            `${a.values.volume ?? "?"} × ${a.values.frequency ?? "?"} × ${a.values.hoursPerUnit ?? "?"}; fixed ${a.values.fixedHours ?? "?"}, project ${a.values.projectHours ?? "?"}, growth ${a.values.growth ?? "?"}, outsourced ${a.values.outsourcedHours ?? "?"}, automated ${a.values.automatedHours ?? "?"}, hours/FTE ${a.values.productiveHoursPerFte ?? "?"}`,
            `${n(d.hours) ?? "unknown"} hours / ${n(d.fte) ?? "unknown"} FTE`,
            `${a.values.source} / ${a.values.effectiveDate}`,
          ];
        }),
      );
  }
  const selected = data.finance?.rows.find(
    (r) => r.kind === "scenario" && r.id === options.scenarioId,
  );
  let financial: ReturnType<typeof scenarioReport> | null = null;
  if (
    selected &&
    data.finance &&
    planning &&
    data.workforce &&
    data.alignment
  ) {
    financial = scenarioReport(
      data.finance,
      planning,
      data.workforce,
      data.capabilities,
      data.alignment,
      selected,
    );
    add(
      "finances",
      "Five-year funding and strategic plan — Enterprise costs",
      "Financial totals cover the Enterprise. Shared costs are not arbitrarily prorated to a pillar. Exact Decimal arithmetic, monthly proration, line-year cent rounding; incomplete subtotals are identified.",
      [
        "Year / detail",
        "Baseline",
        "Incremental / savings",
        "Known total / currency",
        "Budget / missing inputs",
      ],
      financial.annual.map((a) => [
        `${a.year} / ${a.detail}`,
        a.baseline,
        a.incremental,
        `${a.total} ${financial!.scenario.currency}`,
        `${a.budget ?? "unknown"}; ${a.missing.length} incomplete lines${a.overBudget ? "; exceeded" : ""}`,
      ]),
    );
    add(
      "constraints",
      "Unfunded, infeasible and incomplete plan requirements",
      "Dependencies, mandatory deadlines, deferrals and unknown costs remain explicit; no silent optimization.",
      ["Constraint", "Consequence"],
      financial.constraints.map((c) => [c.type, c.message]),
    );
    if (options.pack === "management")
      add(
        "cost-lines",
        "Financial cost identity reconciliation — Enterprise",
        "Each identity appears once per year. Shared positions/tools must not also be claimed inside another initiative's lump-sum estimate.",
        [
          "Year",
          "Cost identity / source",
          "Baseline",
          "Scenario total",
          "Currency",
        ],
        financial.annual.flatMap((a) =>
          a.details.map((d) => [
            a.year,
            link(
              `${d.title} · ${d.identity}`,
              `/roadmap/plan?scenario=${selected.id}&view=costs`,
            ),
            d.baseline,
            d.total,
            d.currency,
          ]),
        ),
      );
    add(
      "projected-gaps",
      "Remaining capability deficiencies at five-year horizon",
      "Unknown actual maturity is not projected as zero. Requirement-specific observations are separate from capability projections.",
      ["Capability", "Actual", "Projected → target"],
      financial.remainingDeficiencies
        .filter((g) => capIds.has(g.id))
        .map((g) => [
          link(`${g.code} · ${g.name}`, `/capabilities?topic=${g.id}`),
          g.actual,
          `${g.projected ?? "unknown"} → ${g.target ?? "unknown"}`,
        ]),
    );
  }
  if (planning) {
    const initiatives = (financial?.planningRows ?? planning.rows).filter(
      (r) =>
        r.kind === "initiative" &&
        (!options.scope ||
          (r.values.capabilityIds as string[]).some((id) => capIds.has(id))),
    );
    add(
      "initiatives",
      "Initiatives and operational progress",
      selected
        ? "Selected scenario schedule. Investment approval and execution status are separate; completion never changes assessed maturity."
        : "Shared initiative schedule; select a scenario for funding-dependent projections.",
      [
        "Initiative",
        "Approval / execution",
        "Start → finish",
        "Outcomes",
        "Deferral consequence",
      ],
      initiatives.map((r) => [
        link(
          String(r.values.title),
          `/roadmap?search=${encodeURIComponent(String(r.values.title))}`,
        ),
        `${r.values.investmentState} / ${r.values.status}`,
        `${r.values.startDate ?? "undated"} → ${r.values.endDate ?? "undated"}`,
        String(r.values.outcomes),
        String(r.values.deferral),
      ]),
    );
  }
  add(
    "assumptions",
    "Assumptions and source provenance",
    "Captured definitions and provisional inputs; framework observations are not certification. NICE describes work, not headcount benchmarks.",
    ["Assumption", "Value / provenance"],
    [
      ["Method version", data.methods.id],
      ["Provisional", data.methods.provisional ? "Yes" : "No"],
      ["Effective date", data.methods.effectiveDate],
      ["Basis", data.methods.basis],
      ...data.methods.values.levels.map((l) => [
        `Maturity ${l.level}`,
        `${l.name}: ${l.definition}`,
      ]),
      [
        "Review cadence",
        `${data.methods.values.reviewDueMonths}/${data.methods.values.reviewOverdueMonths} months`,
      ],
      [
        "Readiness / coverage",
        `${data.methods.values.readinessDefended}/${data.methods.values.readinessPartial}; coverage ${data.methods.values.coverageThreshold}`,
      ],
      ...(financial
        ? [
            ["Scenario method version", financial.methods.id],
            ["Scenario method basis", financial.methods.basis],
          ]
        : []),
      ...(data.alignment?.frameworks.map((f) => [
        f.name + " " + f.version,
        f.sourceUrl ?? "Source missing",
      ]) ?? []),
    ],
  );
  return {
    sections,
    summary,
    financial,
    completeModules: {
      context: !!data.context,
      planning: !!planning,
      alignment: !!data.alignment,
      capacity: !!data.capacity,
      finance: !!data.finance,
    },
  };
}
