import { z } from "zod";
import { Prisma } from "../../generated/prisma/browser";
import type { Methods } from "./methods";
import type { PlanningData } from "./planning";
import { projectedLevel } from "./planning";
import type { WorkforceData } from "./workforce";
import type { CapabilityView } from "./capabilities";
import type { AlignmentData } from "./alignment";
const id = z.string().min(1).max(150);
const source = z.string().trim().min(1).max(4000);
const title = z.string().trim().min(1).max(150);
const money = z
  .string()
  .regex(/^\d{1,12}(\.\d{1,2})?$/)
  .nullable();
const date = z.iso.date().nullable();
export const scenarioKinds = [
  "existing-funding",
  "minimum-requirements",
  "risk-prioritized",
  "target-maturity",
  "alternative-funding",
] as const;
export const scenarioInput = z
  .object({
    title,
    kind: z.enum(scenarioKinds),
    source,
    methodVersionId: id,
    startYear: z.number().int().min(2000).max(2196),
    fiscalStartMonth: z.number().int().min(1).max(12),
    currency: z.string().regex(/^[A-Z]{3}$/),
    active: z.boolean(),
  })
  .strict();
const resource = {
  initiativeId: id.nullable(),
  positionId: id.nullable(),
  technologyId: id.nullable(),
};
const linked = (v: {
  initiativeId: string | null;
  positionId: string | null;
  technologyId: string | null;
}) =>
  [v.initiativeId, v.positionId, v.technologyId].filter(Boolean).length === 1;
export const itemInput = z
  .object({
    title,
    scenarioId: id,
    ...resource,
    included: z.boolean(),
    startDate: date,
    endDate: date,
    source,
    deferral: source,
  })
  .strict()
  .refine(linked, "Select exactly one shared resource")
  .refine(
    (v) => !v.startDate || !v.endDate || v.endDate >= v.startDate,
    "End precedes start",
  );
export const targetInput = z
  .object({
    title,
    scenarioId: id,
    capabilityId: id,
    year: z.number().int(),
    level: z.number().int().min(1).max(5),
    source,
  })
  .strict();
export const budgetInput = z
  .object({
    title,
    scenarioId: id,
    year: z.number().int(),
    amount: money,
    source,
  })
  .strict();
export const costInput = z
  .object({
    title,
    identity: id,
    ...resource,
    capabilityId: id.nullable(),
    component: z.enum([
      "resource-once",
      "resource-recurring",
      "resource-license",
      "resource-operating",
      "additional",
    ]),
    category: z.enum([
      "salary",
      "licensing",
      "implementation",
      "operating",
      "training",
      "managed-service",
      "savings",
    ]),
    frequency: z.enum(["once", "annual"]),
    amount: money,
    currency: z.string().regex(/^[A-Z]{3}$/),
    startDate: date,
    endDate: date,
    escalationPercent: z.number().finite().min(-100).max(100).nullable(),
    baseline: z.boolean(),
    saving: z.boolean(),
    source,
    active: z.boolean(),
  })
  .strict()
  .refine(
    (v) =>
      [v.initiativeId, v.positionId, v.technologyId].filter(Boolean).length ===
      1,
    "Link exactly one shared initiative, position or technology",
  )
  .refine(
    (v) => v.component === "additional" || !v.capabilityId,
    "Resource override needs a resource",
  )
  .refine(
    (v) => v.component !== "resource-once" || v.frequency === "once",
    "One-time resource cost must occur once",
  )
  .refine(
    (v) =>
      ![
        "resource-recurring",
        "resource-license",
        "resource-operating",
      ].includes(v.component) || v.frequency === "annual",
    "Recurring resource cost must be annual",
  )
  .refine(
    (v) => !v.startDate || !v.endDate || v.endDate >= v.startDate,
    "End precedes start",
  );
export const financeSchemas = {
  scenario: scenarioInput,
  item: itemInput,
  target: targetInput,
  budget: budgetInput,
  cost: costInput,
};
export type FinanceKind = keyof typeof financeSchemas;
export const financeKinds = Object.keys(financeSchemas) as FinanceKind[];
export const financeEnvelope = z
  .object({
    kind: z.enum(["scenario", "item", "target", "budget", "cost"]),
    values: z.unknown(),
    revision: z.string().max(100).optional(),
  })
  .strict();
export type Scenario = z.infer<typeof scenarioInput>;
export type ScenarioItem = z.infer<typeof itemInput>;
export type Cost = z.infer<typeof costInput>;
export type Target = z.infer<typeof targetInput>;
export type FinanceRow = {
  id: string;
  kind: FinanceKind;
  revision: string;
  values: Record<string, string | number | boolean | null>;
};
export type FinanceData = { rows: FinanceRow[]; methods: Methods[] };
export const resourceIdentity = (v: {
  initiativeId?: string | null;
  positionId?: string | null;
  technologyId?: string | null;
}) =>
  v.initiativeId
    ? `initiative:${v.initiativeId}`
    : v.positionId
      ? `position:${v.positionId}`
      : v.technologyId
        ? `technology:${v.technologyId}`
        : null;
export function costIdentity(v: Cost) {
  const resource = resourceIdentity(v);
  return v.component !== "additional" && resource
    ? `${resource}:${v.component}`
    : v.identity;
}
export type CostLine = Cost & { derived: boolean };
/** Primary resource amounts appear once. Explicit financial lines replace the same identity. */
export function costLines(
  data: FinanceData,
  planning: PlanningData,
  workforce: WorkforceData,
  scenario: Scenario,
): CostLine[] {
  const lines = new Map<string, CostLine>();
  const horizonStart = `${scenario.startYear}-${String(scenario.fiscalStartMonth).padStart(2, "0")}-01`;
  const add = (
    resource: {
      positionId: string | null;
      technologyId: string | null;
      initiativeId: string | null;
    },
    title: string,
    baseline: boolean,
    amount: string | null,
    frequency: "once" | "annual",
    startDate: string | null,
    category: Cost["category"],
    endDate: string | null = null,
    overrideComponent?: Cost["component"],
  ) => {
    const component =
      overrideComponent ??
      (frequency === "once" ? "resource-once" : "resource-recurring");
    const identity = `${resourceIdentity(resource)}:${component}`;
    lines.set(identity, {
      ...resource,
      capabilityId: null,
      title,
      identity,
      component,
      category,
      frequency,
      amount,
      currency: scenario.currency,
      startDate,
      endDate,
      escalationPercent: null,
      baseline,
      saving: false,
      source:
        "Shared resource estimate; baseline resources continue from planning horizon start unless explicitly dated. Unknown amounts remain incomplete.",
      active: true,
      derived: true,
    });
  };
  for (const p of workforce.positions.filter((p) => p.state !== "retired")) {
    add(
      { positionId: p.id, technologyId: null, initiativeId: null },
      p.title,
      p.state === "authorized",
      p.annualCost === null ? null : String(p.annualCost),
      "annual",
      p.state === "authorized" &&
        (!p.startYear || `${p.startYear}-01-01` < horizonStart)
        ? horizonStart
        : p.startYear
          ? `${p.startYear}-01-01`
          : p.state === "authorized"
            ? `${scenario.startYear}-${String(scenario.fiscalStartMonth).padStart(2, "0")}-01`
            : null,
      "salary",
    );
    lines.get(`position:${p.id}:resource-recurring`)!.currency = p.currency;
  }
  for (const r of planning.rows.filter(
    (r) => r.kind === "technology" || r.kind === "initiative",
  )) {
    const v = r.values;
    if (v.state === "retired" || v.status === "cancelled") continue;
    const baseline = r.kind === "technology" && v.state === "existing";
    const resource = {
      positionId: null,
      technologyId: r.kind === "technology" ? r.id : null,
      initiativeId: r.kind === "initiative" ? r.id : null,
    };
    const recordedStart =
      typeof v.startDate === "string"
        ? v.startDate
        : baseline
          ? `${scenario.startYear}-${String(scenario.fiscalStartMonth).padStart(2, "0")}-01`
          : null;
    const start =
      baseline && recordedStart && recordedStart < horizonStart
        ? horizonStart
        : recordedStart;
    // Existing recurring amounts are horizon-base estimates, not historical prices.
    // Existing portfolio acquisition is sunk unless a future acquisition is dated.
    if (
      !baseline ||
      (typeof v.startDate === "string" && v.startDate >= horizonStart)
    )
      add(
        resource,
        `${String(v.title)} · implementation`,
        baseline,
        (r.kind === "technology" ? v.implementationCost : v.oneTimeCost) == null
          ? null
          : String(
              r.kind === "technology" ? v.implementationCost : v.oneTimeCost,
            ),
        "once",
        start,
        "implementation",
      );
    if (r.kind === "technology") {
      add(
        resource,
        `${String(v.title)} · licensing`,
        baseline,
        v.annualLicenseCost == null ? null : String(v.annualLicenseCost),
        "annual",
        start,
        "licensing",
        typeof v.retirementDate === "string" ? v.retirementDate : null,
        "resource-license",
      );
      add(
        resource,
        `${String(v.title)} · operating`,
        baseline,
        v.annualOperatingCost == null ? null : String(v.annualOperatingCost),
        "annual",
        start,
        "operating",
        typeof v.retirementDate === "string" ? v.retirementDate : null,
        "resource-operating",
      );
    } else
      add(
        resource,
        `${String(v.title)} · annual`,
        baseline,
        v.recurringCost == null ? null : String(v.recurringCost),
        "annual",
        start,
        "operating",
      );
    for (const line of lines.values())
      if (resourceIdentity(line) === resourceIdentity(resource))
        line.currency = String(v.currency);
  }
  for (const r of data.rows.filter((r) => r.kind === "cost")) {
    const v = r.values as Cost;
    const identity = costIdentity(v);
    if (v.active) lines.set(identity, { ...v, identity, derived: false });
  }
  return [...lines.values()];
}
const month = (date: string) =>
  Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1;
function shiftMonth(date: string | null, delta: number) {
  if (!date) return null;
  const value = month(date) + delta;
  return `${Math.floor(value / 12)}-${String((value % 12) + 1).padStart(2, "0")}-01`;
}
/** Preserve the offset of distinct training/service costs when an investment moves. */
export function scheduledCost(
  line: CostLine,
  member: ScenarioItem | undefined,
  planning: PlanningData,
  workforce: WorkforceData,
  scenario: Scenario,
): CostLine {
  if (!member) return line;
  const resource = planning.rows.find(
    (r) => r.id === (line.initiativeId ?? line.technologyId),
  );
  const position = workforce.positions.find((p) => p.id === line.positionId);
  const horizon = `${scenario.startYear}-${String(scenario.fiscalStartMonth).padStart(2, "0")}-01`;
  const recordedAnchor = resource
    ? typeof resource.values.startDate === "string"
      ? resource.values.startDate
      : line.baseline
        ? horizon
        : null
    : position?.startYear
      ? `${position.startYear}-01-01`
      : line.baseline
        ? horizon
        : null;
  const anchor =
    line.baseline && recordedAnchor && recordedAnchor < horizon
      ? horizon
      : recordedAnchor;
  const delta =
    member.startDate && anchor ? month(member.startDate) - month(anchor) : 0;
  const startDate = member.startDate
    ? anchor
      ? shiftMonth(line.startDate, delta)
      : line.component === "additional"
        ? line.startDate
        : member.startDate
    : line.startDate;
  const shiftedEnd = member.startDate
    ? shiftMonth(line.endDate, delta)
    : line.endDate;
  return {
    ...line,
    startDate,
    endDate: line.initiativeId ? shiftedEnd : (member.endDate ?? shiftedEnd),
  };
}
const moneyString = (v: InstanceType<typeof Prisma.Decimal>) => v.toFixed(2);
export function annualCost(
  line: CostLine,
  scenario: Scenario,
  year: number,
  methods: Methods,
) {
  const firstMonth = year * 12 + scenario.fiscalStartMonth - 1;
  if (line.startDate) {
    const activation = month(line.startDate),
      end = line.endDate ? month(line.endDate) : Infinity;
    if (
      activation > firstMonth + 11 ||
      end < firstMonth ||
      (line.frequency === "once" &&
        (activation < firstMonth || activation > firstMonth + 11))
    )
      return { amount: "0.00", missing: [] };
  }
  const missing = [
    ...(line.amount === null ? ["amount"] : []),
    ...(!line.startDate ? ["activation date"] : []),
    ...(line.currency !== scenario.currency
      ? [`currency ${line.currency} differs from ${scenario.currency}`]
      : []),
  ];
  if (missing.length) return { amount: null, missing };
  const start = month(line.startDate!),
    end = line.endDate ? month(line.endDate) : Infinity;
  const first = year * 12 + scenario.fiscalStartMonth - 1;
  const escalation =
    line.escalationPercent ??
    (line.category === "salary"
      ? methods.values.salaryEscalation
      : line.category === "licensing"
        ? methods.values.licensingEscalation
        : 0);
  let total = new Prisma.Decimal(0);
  const base = new Prisma.Decimal(line.amount!);
  const factor = new Prisma.Decimal(1).plus(
    new Prisma.Decimal(escalation).div(100),
  );
  for (let m = first; m < first + 12; m++)
    if (m >= start && m <= end) {
      if (line.frequency === "once") {
        if (m === start) total = total.plus(base);
      } else
        total = total.plus(
          base.div(12).mul(factor.pow(Math.floor((m - start) / 12))),
        );
    }
  if (line.saving) total = total.negated();
  return { amount: moneyString(total), missing };
}
export function scenarioPlanning(
  data: FinanceData,
  planning: PlanningData,
  scenarioId: string,
) {
  const members = data.rows
    .filter((r) => r.kind === "item" && r.values.scenarioId === scenarioId)
    .map((r) => r.values as ScenarioItem);
  return planning.rows
    .filter(
      (r) =>
        r.kind !== "initiative" ||
        members.some((m) => m.initiativeId === r.id && m.included),
    )
    .map((r) => {
      if (r.kind !== "initiative") return r;
      const m = members.find((m) => m.initiativeId === r.id)!;
      return {
        ...r,
        values: {
          ...r.values,
          startDate: m.startDate ?? r.values.startDate,
          endDate: m.endDate ?? r.values.endDate,
        },
      };
    });
}
export function scenarioReport(
  data: FinanceData,
  planning: PlanningData,
  workforce: WorkforceData,
  capabilities: CapabilityView[],
  alignment: AlignmentData,
  scenarioRow: FinanceRow,
) {
  const scenario = scenarioRow.values as Scenario;
  const methods = data.methods.find((m) => m.id === scenario.methodVersionId);
  if (!methods) throw new Error("Scenario method version unavailable");
  const members = data.rows
    .filter((r) => r.kind === "item" && r.values.scenarioId === scenarioRow.id)
    .map((r) => r.values as ScenarioItem);
  const lines = costLines(data, planning, workforce, scenario);
  const projectedRows = scenarioPlanning(data, planning, scenarioRow.id);
  const selected = (line: CostLine) => {
    const key = resourceIdentity(line);
    const member = members.find((m) => resourceIdentity(m) === key);
    return member ? member.included : line.baseline;
  };
  const annual = Array.from({ length: 5 }, (_, i) => {
    const year = scenario.startYear + i;
    const missing: { identity: string; title: string; fields: string[] }[] = [];
    let baseline = new Prisma.Decimal(0),
      total = new Prisma.Decimal(0);
    const details = lines
      .filter((l) => l.baseline || selected(l))
      .map((line) => {
        const original = line.baseline
          ? annualCost(line, scenario, year, methods)
          : { amount: "0.00", missing: [] };
        const member = members.find(
          (m) => resourceIdentity(m) === resourceIdentity(line),
        );
        const adjusted = selected(line)
          ? annualCost(
              scheduledCost(line, member, planning, workforce, scenario),
              scenario,
              year,
              methods,
            )
          : { amount: "0.00", missing: [] };
        if (original.amount === null || adjusted.amount === null)
          missing.push({
            identity: line.identity,
            title: line.title,
            fields: [...new Set([...original.missing, ...adjusted.missing])],
          });
        baseline = baseline.plus(original.amount ?? 0);
        total = total.plus(adjusted.amount ?? 0);
        return {
          identity: line.identity,
          title: line.title,
          baseline: original.amount,
          total: adjusted.amount,
          currency: line.currency,
        };
      });
    const budget = data.rows.find(
      (r) =>
        r.kind === "budget" &&
        r.values.scenarioId === scenarioRow.id &&
        r.values.year === year,
    )?.values.amount as string | null | undefined;
    const end = new Date(Date.UTC(year + 1, scenario.fiscalStartMonth - 1, 0))
      .toISOString()
      .slice(0, 10);
    const targets = data.rows
      .filter(
        (r) =>
          r.kind === "target" &&
          r.values.scenarioId === scenarioRow.id &&
          r.values.year === year,
      )
      .map((r) => r.values as Target);
    const gaps = capabilities
      .filter((c) => c.applicable)
      .map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        actual: c.currentLevel,
        projected: projectedLevel(
          c.currentLevel,
          projectedRows,
          c.id,
          end,
          methods.values,
        ),
        target:
          targets.find((t) => t.capabilityId === c.id)?.level ?? c.targetLevel,
      }));
    return {
      year,
      end,
      detail: i < 3 ? "Detailed" : "Directional",
      baseline: moneyString(baseline),
      incremental: moneyString(total.minus(baseline)),
      total: moneyString(total),
      budget: budget ?? null,
      overBudget:
        budget === null || budget === undefined
          ? null
          : total.greaterThan(budget),
      missing,
      details,
      gaps,
    };
  });
  const constraints: { type: string; recordId: string; message: string }[] = [];
  const selectedInitiatives = projectedRows.filter(
    (r) => r.kind === "initiative",
  );
  for (const r of selectedInitiatives) {
    const v = r.values;
    const start = v.startDate as string | null,
      end = v.endDate as string | null;
    if (!start || !end)
      constraints.push({
        type: "Undated",
        recordId: r.id,
        message: `${v.title}: implementation dates missing`,
      });
    for (const dependency of v.dependencyIds as string[]) {
      const d =
        selectedInitiatives.find((i) => i.id === dependency) ||
        planning.rows.find(
          (i) => i.id === dependency && i.values.status === "completed",
        );
      if (!d)
        constraints.push({
          type: "Dependency omitted",
          recordId: r.id,
          message: `${v.title}: dependency ${dependency} is not included/completed`,
        });
      else if (!d.values.endDate || !start || String(d.values.endDate) > start)
        constraints.push({
          type: "Dependency timing",
          recordId: r.id,
          message: `${v.title}: dependency ${d.values.title} is undated or finishes after planned start`,
        });
    }
    for (const [field, key] of [
      ["positionIds", "positionId"],
      ["technologyIds", "technologyId"],
    ] as const)
      for (const resource of v[field] as string[]) {
        const existing =
          key === "positionId"
            ? workforce.positions.some(
                (p) => p.id === resource && p.state === "authorized",
              )
            : planning.rows.some(
                (p) => p.id === resource && p.values.state === "existing",
              );
        if (
          !existing &&
          !members.some((m) => m[key] === resource && m.included)
        )
          constraints.push({
            type: "Unfunded resource",
            recordId: r.id,
            message: `${v.title}: required ${key} ${resource} is not included`,
          });
      }
  }
  const parents = new Set(alignment.requirements.map((r) => r.parentId));
  for (const r of alignment.requirements.filter(
    (r) =>
      !parents.has(r.id) &&
      r.values.applicability === "applicable" &&
      r.values.implementation !== "implemented",
  )) {
    const deadline = r.values.applicableDeadline ?? r.sourceDeadline;
    if (!deadline) continue;
    const covering = selectedInitiatives.filter((i) =>
      (i.values.requirementIds as string[]).includes(r.id),
    );
    if (
      !covering.some(
        (i) => i.values.endDate && String(i.values.endDate) <= deadline,
      )
    )
      constraints.push({
        type: "Mandatory deadline",
        recordId: r.id,
        message: `${r.identifier}: no selected initiative scheduled by ${deadline}`,
      });
  }
  for (const a of annual) {
    if (a.overBudget)
      constraints.push({
        type: "Budget exceeded",
        recordId: scenarioRow.id,
        message: `${a.year}: known costs ${a.total} exceed limit ${a.budget} ${scenario.currency}`,
      });
    if (a.missing.length)
      constraints.push({
        type: "Incomplete costs",
        recordId: scenarioRow.id,
        message: `${a.year}: ${a.missing.length} cost lines have missing inputs`,
      });
  }
  return {
    scenario,
    methods,
    annual,
    lines,
    members,
    planningRows: projectedRows,
    constraints,
    cumulative: moneyString(
      annual.reduce((s, a) => s.plus(a.total), new Prisma.Decimal(0)),
    ),
    complete: annual.every((a) => !a.missing.length),
    remainingDeficiencies: annual[4].gaps.filter(
      (g) =>
        g.target !== null && (g.projected === null || g.projected < g.target),
    ),
  };
}
