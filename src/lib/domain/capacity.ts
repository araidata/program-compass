import { z } from "zod";
import type { WorkforceData } from "./workforce";
const id = z.string().min(1).max(100);
const source = z.string().trim().min(1).max(4000);
const amount = z.number().finite().min(0).max(1e10).nullable();
const ids = z
  .array(id)
  .max(100)
  .refine((v) => new Set(v).size === v.length, "Duplicate relationship");
const base = {
  title: z.string().trim().min(1).max(150),
  source,
  active: z.boolean(),
};
export const activityInput = z
  .object({
    ...base,
    workKey: z.string().trim().min(1).max(100),
    responsibilityId: id,
    effectiveDate: z.iso.date(),
    provisional: z.boolean(),
    year: z.number().int().min(2000).max(2200),
    volume: amount,
    frequency: amount,
    hoursPerUnit: amount,
    fixedHours: amount,
    projectHours: amount,
    growth: z.number().finite().min(0).max(100).nullable(),
    outsourcedHours: amount,
    automatedHours: amount,
    productiveHoursPerFte: z.number().finite().positive().max(8784).nullable(),
    workType: z.enum(["run", "change"]),
    capabilityIds: ids,
    requirementIds: ids,
    niceIds: ids,
  })
  .strict()
  .refine((v) => {
    const r = activityDemand(v);
    return (
      r.gross === null ||
      v.outsourcedHours === null ||
      v.automatedHours === null ||
      v.outsourcedHours + v.automatedHours <= r.gross + 1e-8
    );
  }, "Distinct reductions cannot exceed gross workload");
export const assignmentInput = z
  .object({
    ...base,
    positionId: id,
    personId: id.nullable(),
    responsibilityId: id,
    startDate: z.iso.date(),
    endDate: z.iso.date().nullable(),
    allocatedFte: z.number().finite().positive().max(1),
    paidHours: z.number().finite().min(0).max(8784).nullable(),
    productiveHours: z.number().finite().min(0).max(8784).nullable(),
    runShare: z.number().finite().min(0).max(1),
  })
  .strict()
  .refine((v) => !v.endDate || v.endDate >= v.startDate, "End precedes start")
  .refine(
    (v) =>
      v.paidHours === null ||
      v.productiveHours === null ||
      v.productiveHours <= v.paidHours,
    "Productive hours exceed paid hours",
  );
export const skillInput = z
  .object({
    ...base,
    personId: id,
    niceElementId: id,
    currentLevel: z.number().int().min(1).max(5).nullable(),
    targetLevel: z.number().int().min(1).max(5).nullable(),
    assessedDate: z.iso.date(),
    notes: z.string().trim().max(4000),
  })
  .strict();
export const constraintInput = z
  .object({
    ...base,
    responsibilityId: id,
    conflictingResponsibilityId: id.nullable(),
    kind: z.enum([
      "minimum-coverage",
      "continuity",
      "expertise",
      "separation-of-duties",
    ]),
    minimumPeople: z.number().int().min(1).max(10000).nullable(),
    minimumFte: z.number().finite().min(0).max(10000).nullable(),
    niceElementId: id.nullable(),
    minimumSkill: z.number().int().min(1).max(5).nullable(),
    consequence: source,
    alternatives: source,
  })
  .strict()
  .refine(
    (v) =>
      v.kind !== "separation-of-duties" ||
      (v.conflictingResponsibilityId !== null &&
        v.conflictingResponsibilityId !== v.responsibilityId),
    "Choose distinct responsibilities",
  )
  .refine(
    (v) =>
      v.kind !== "expertise" ||
      (v.niceElementId !== null && v.minimumSkill !== null),
    "Expertise needs a NICE element and level",
  )
  .refine(
    (v) =>
      v.kind === "separation-of-duties" ||
      v.minimumPeople !== null ||
      v.minimumFte !== null,
    "Enter a coverage requirement",
  );
export const capacitySchemas = {
  activity: activityInput,
  assignment: assignmentInput,
  skill: skillInput,
  constraint: constraintInput,
};
export type CapacityKind = keyof typeof capacitySchemas;
export const capacityKinds = Object.keys(capacitySchemas) as CapacityKind[];
export const capacityEnvelope = z
  .object({
    kind: z.enum(["activity", "assignment", "skill", "constraint"]),
    values: z.unknown(),
    revision: z.string().max(100).optional(),
  })
  .strict();
export type Activity = z.infer<typeof activityInput>;
export type Assignment = z.infer<typeof assignmentInput>;
export type Skill = z.infer<typeof skillInput>;
export type Constraint = z.infer<typeof constraintInput>;
export type CapacityRow = {
  id: string;
  kind: CapacityKind;
  revision: string;
  values: Record<string, string | number | boolean | null | string[]>;
};
export type CapacityData = {
  rows: CapacityRow[];
  nice: {
    id: string;
    identifier: string;
    kind: string;
    title: string;
    description: string;
    sourceUrl: string;
    version: string;
  }[];
  niceRelations: { sourceId: string; targetId: string }[];
};
const demandKeys = [
  "volume",
  "frequency",
  "hoursPerUnit",
  "fixedHours",
  "projectHours",
  "growth",
  "outsourcedHours",
  "automatedHours",
] as const;
/** Missing inputs remain missing: explicit zero is a valid sourced observation. */
export function activityDemand(
  v: Record<
    (typeof demandKeys)[number] | "productiveHoursPerFte",
    number | null
  >,
) {
  const missing = demandKeys.filter((k) => v[k] === null);
  const gross = [
    "volume",
    "frequency",
    "hoursPerUnit",
    "fixedHours",
    "projectHours",
    "growth",
  ].some((k) => v[k as keyof typeof v] === null)
    ? null
    : (v.volume! * v.frequency! * v.hoursPerUnit! +
        v.fixedHours! +
        v.projectHours!) *
      v.growth!;
  const hours =
    missing.length || gross === null
      ? null
      : gross - v.outsourcedHours! - v.automatedHours!;
  return {
    gross,
    hours,
    fte:
      hours === null || v.productiveHoursPerFte === null
        ? null
        : hours / v.productiveHoursPerFte,
    missing: [
      ...missing,
      ...(v.productiveHoursPerFte === null ? ["productiveHoursPerFte"] : []),
    ],
  };
}
export function yearFraction(start: string, end: string | null, year: number) {
  const lo = Date.UTC(year, 0, 1),
    hi = Date.UTC(year + 1, 0, 1);
  return (
    Math.max(
      0,
      Math.min(hi, end ? Date.parse(end) + 86400000 : hi) -
        Math.max(lo, Date.parse(start)),
    ) /
    (hi - lo)
  );
}
export function allocationExceeded(
  rows: Pick<Assignment, "startDate" | "endDate" | "allocatedFte" | "active">[],
  limit: number,
) {
  const points = rows
    .filter((r) => r.active)
    .flatMap((r) => [
      { at: Date.parse(r.startDate), delta: r.allocatedFte },
      ...(r.endDate
        ? [{ at: Date.parse(r.endDate) + 86400000, delta: -r.allocatedFte }]
        : []),
    ]);
  const daily = new Map<number, number>();
  for (const p of points) daily.set(p.at, (daily.get(p.at) ?? 0) + p.delta);
  let allocated = 0;
  for (const [, delta] of [...daily].sort((a, b) => a[0] - b[0])) {
    allocated += delta;
    if (allocated > limit + 1e-8) return true;
  }
  return false;
}
export function capacityReport(
  data: CapacityData,
  workforce: WorkforceData,
  year: number,
  responsibilityIds?: string[],
) {
  const accepts = (id: string) =>
    !responsibilityIds || responsibilityIds.includes(id);
  const activities = data.rows.filter(
    (r) =>
      r.kind === "activity" &&
      r.values.active &&
      r.values.year === year &&
      accepts(String(r.values.responsibilityId)),
  );
  const assignments = data.rows.filter(
    (r) =>
      r.kind === "assignment" &&
      r.values.active &&
      accepts(String(r.values.responsibilityId)),
  );
  const demands = activities.map((r) => ({
    id: r.id,
    ...activityDemand(r.values as Activity),
  }));
  const capacity = assignments.map((r) => {
    const v = r.values as Assignment;
    const p = workforce.positions.find((p) => p.id === v.positionId);
    const person = workforce.people.find((p) => p.id === v.personId);
    const fraction = yearFraction(v.startDate, v.endDate, year);
    const actual = !!(
      p &&
      p.state === "authorized" &&
      p.personId === v.personId &&
      v.personId &&
      person?.active
    );
    return {
      id: r.id,
      personId: v.personId,
      responsibilityId: v.responsibilityId,
      fraction,
      actual,
      fte: actual ? v.allocatedFte * fraction : 0,
      paid: !actual
        ? 0
        : v.paidHours === null
          ? null
          : v.paidHours * v.allocatedFte * fraction,
      productive: !actual
        ? 0
        : v.productiveHours === null
          ? null
          : v.productiveHours * v.allocatedFte * fraction,
      runShare: v.runShare,
    };
  });
  const knownHours = demands.reduce((s, d) => s + (d.hours ?? 0), 0);
  const knownCapacity = capacity.reduce((s, c) => s + (c.productive ?? 0), 0);
  const missingDemand = demands
    .filter((d) => d.hours === null)
    .map((d) => d.id);
  const missingCapacity = capacity
    .filter((c) => c.actual && c.fraction > 0 && c.productive === null)
    .map((c) => c.id);
  const runDemand = activities
    .filter((r) => r.values.workType === "run")
    .reduce((s, r) => s + (activityDemand(r.values as Activity).hours ?? 0), 0);
  return {
    activities,
    demands,
    capacity,
    knownHours,
    knownCapacity,
    missingDemand,
    missingCapacity,
    requiredFte: demands.some((d) => d.fte === null)
      ? null
      : demands.reduce((s, d) => s + d.fte!, 0),
    availableFte: capacity.reduce((s, c) => s + c.fte, 0),
    paidHours: capacity.some(
      (c) => c.actual && c.fraction > 0 && c.paid === null,
    )
      ? null
      : capacity.reduce((s, c) => s + (c.paid ?? 0), 0),
    runDemand,
    changeDemand: knownHours - runDemand,
    runCapacity: capacity.reduce(
      (s, c) => s + (c.productive ?? 0) * c.runShare,
      0,
    ),
    changeCapacity: capacity.reduce(
      (s, c) => s + (c.productive ?? 0) * (1 - c.runShare),
      0,
    ),
    shortfall:
      missingDemand.length || missingCapacity.length
        ? null
        : Math.max(0, knownHours - knownCapacity),
  };
}
/** Coverage is a separate constraint, never an extra additive staffing ratio. */
export function constraintStatus(
  v: Constraint,
  data: CapacityData,
  workforce: WorkforceData,
  asOf: string,
) {
  const assignments = data.rows
    .filter((r) => r.kind === "assignment" && r.values.active)
    .map((r) => r.values as Assignment)
    .filter(
      (a) =>
        a.startDate <= asOf &&
        (!a.endDate || a.endDate >= asOf) &&
        workforce.positions.some(
          (p) =>
            p.id === a.positionId &&
            p.state === "authorized" &&
            p.personId === a.personId,
        ) &&
        workforce.people.some((p) => p.id === a.personId && p.active),
    );
  const applicable = assignments.filter(
    (a) => a.responsibilityId === v.responsibilityId,
  );
  const people = [
    ...new Set(applicable.map((a) => a.personId).filter(Boolean)),
  ];
  const fte = applicable.reduce((s, a) => s + a.allocatedFte, 0);
  if (v.kind === "separation-of-duties") {
    const shared = people.filter((id) =>
      assignments.some(
        (a) =>
          a.personId === id &&
          a.responsibilityId === v.conflictingResponsibilityId,
      ),
    );
    return {
      people: people.length,
      fte,
      status: shared.length ? "Conflict" : "No overlapping assignees",
      detail: shared.join(", "),
    };
  }
  const qualified =
    v.kind === "expertise"
      ? people.filter((id) =>
          data.rows.some(
            (r) =>
              r.kind === "skill" &&
              r.values.active &&
              r.values.personId === id &&
              r.values.niceElementId === v.niceElementId &&
              String(r.values.assessedDate) <= asOf &&
              typeof r.values.currentLevel === "number" &&
              r.values.currentLevel >= v.minimumSkill!,
          ),
        )
      : people;
  const qualifiedFte = applicable
    .filter((a) => qualified.includes(a.personId))
    .reduce((s, a) => s + a.allocatedFte, 0);
  const met =
    (v.minimumPeople === null || qualified.length >= v.minimumPeople) &&
    (v.minimumFte === null || qualifiedFte >= v.minimumFte);
  return {
    people: qualified.length,
    fte: qualifiedFte,
    status: met ? "Met (planning)" : "Unmet",
    detail:
      v.kind === "expertise"
        ? "Only observed current skills count"
        : "Not added to workload FTE",
  };
}
