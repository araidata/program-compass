import { defaultMethodValues, type MethodValues } from "./methods";
import { z } from "zod";
export type FieldValue = string | number | boolean | null | string[];
const id = z.string().min(1).max(100);
const text = z.string().trim().max(4000);
const title = z.string().trim().min(1).max(150);
const ids = z
  .array(id)
  .max(500)
  .refine((v) => new Set(v).size === v.length, "Duplicate relationships");
const date = z.iso.date().nullable();
const measure = z.number().finite().min(0).max(1e10).nullable();
const money = measure;
const currency = z.string().regex(/^[A-Z]{3}$/);
export const planningKinds = [
  "responsibility",
  "issue",
  "initiative",
  "technology",
] as const;
export type PlanningKind = (typeof planningKinds)[number];
export const planningSchemas = {
  responsibility: z
    .object({
      title,
      description: text.min(1),
      source: text.min(1),
      functionId: id,
      ownerId: id.nullable(),
      active: z.boolean(),
      capabilityIds: ids.min(1),
      positionIds: ids,
      requirementIds: ids,
    })
    .strict(),
  issue: z
    .object({
      title,
      description: text.min(1),
      source: text.min(1),
      consequence: text.min(1),
      ownerId: id.nullable(),
      openedDate: z.iso.date(),
      dueDate: date,
      status: z.enum(["open", "in-progress", "resolved", "deferred"]),
      capabilityIds: ids,
      requirementIds: ids,
      initiativeIds: ids,
    })
    .strict()
    .refine(
      (v) => v.capabilityIds.length + v.initiativeIds.length > 0,
      "Link a capability or initiative planning decision",
    )
    .refine(
      (v) => !v.dueDate || v.dueDate >= v.openedDate,
      "Due date precedes opened date",
    ),
  initiative: z
    .object({
      title,
      description: text.min(1),
      justification: text.min(1),
      outcomes: text.min(1),
      deferral: text.min(1),
      ownerId: id.nullable(),
      investmentState: z.enum(["proposed", "approved"]),
      status: z.enum([
        "planned",
        "in-progress",
        "on-hold",
        "completed",
        "cancelled",
      ]),
      priority: z.number().int().min(1).max(5),
      startDate: date,
      endDate: date,
      effortHours: measure,
      oneTimeCost: money,
      recurringCost: money,
      currency,
      capabilityIds: ids.min(1),
      issueIds: ids,
      objectiveIds: ids,
      requirementIds: ids,
      positionIds: ids,
      technologyIds: ids,
      dependencyIds: ids,
    })
    .strict()
    .refine(
      (v) => !v.startDate || !v.endDate || v.endDate >= v.startDate,
      "Completion precedes start",
    ),
  technology: z
    .object({
      title,
      vendor: z.string().trim().max(150),
      category: title,
      description: text.min(1),
      source: text.min(1),
      alternatives: text.min(1),
      decision: z
        .enum([
          "inventory",
          "optimization",
          "expansion",
          "consolidation",
          "replacement",
          "retirement",
          "acquisition",
          "managed-service",
        ])
        .default("inventory"),
      deploymentState: z
        .enum(["unknown", "planned", "pilot", "partial", "deployed", "offline"])
        .default("unknown"),
      retirementDate: date.default(null),
      alternativeIds: ids.default([]),
      deficiencyType: z.enum([
        "technology",
        "underutilization",
        "staffing",
        "process",
        "none",
      ]),
      state: z.enum(["existing", "proposed", "retired"]),
      ownerId: id.nullable(),
      coveragePercent: z.number().finite().min(0).max(100).nullable(),
      utilizationPercent: z.number().finite().min(0).max(100).nullable(),
      startDate: date,
      renewalDate: date,
      annualLicenseCost: money,
      annualOperatingCost: money,
      implementationCost: money,
      currency,
      capabilityIds: ids.min(1),
      requirementIds: ids,
      responsibilityIds: ids,
      dependencyIds: ids,
    })
    .strict(),
};
export const planningEnvelope = z
  .object({
    kind: z.enum(planningKinds),
    values: z.unknown(),
    revision: z.string().max(100).optional(),
  })
  .strict();
export type PlanningRow = {
  id: string;
  kind: PlanningKind;
  revision: string;
  values: Record<string, FieldValue>;
  uplifts?: { capabilityId: string; uplift: number; rationale: string }[];
};
export type PlanningData = {
  rows: PlanningRow[];
  options: {
    people: { id: string; label: string }[];
    functions: { id: string; label: string }[];
    positions: { id: string; label: string }[];
    capabilities: {
      id: string;
      label: string;
      current: number | null;
      target: number | null;
      applicable: boolean;
      pillars: string[];
    }[];
    requirements: { id: string; label: string }[];
    objectives: { id: string; label: string }[];
  };
};
export function dependencyCycle(
  rows: { id: string; dependencies: string[] }[],
  id: string,
  dependencies: string[],
) {
  const graph = new Map(rows.map((r) => [r.id, r.dependencies]));
  graph.set(id, dependencies);
  const path = new Set<string>();
  const done = new Set<string>();
  function visit(next: string): boolean {
    if (path.has(next)) return true;
    if (done.has(next)) return false;
    path.add(next);
    if ((graph.get(next) ?? []).some(visit)) return true;
    path.delete(next);
    done.add(next);
    return false;
  }
  return visit(id);
}
export function projectedLevel(
  current: number | null,
  rows: PlanningRow[],
  capabilityId: string,
  asOf: string,
  methods: MethodValues = defaultMethodValues,
) {
  if (current === null) return null;
  const uplift = Math.max(
    0,
    ...rows
      .filter(
        (r) =>
          r.kind === "initiative" &&
          (!(methods.projectionRequiresApproval ?? true) ||
            r.values.investmentState === "approved") &&
          (methods.projectionStatuses ?? ["planned", "in-progress"]).some(
            (s) => s === r.values.status,
          ) &&
          typeof r.values.endDate === "string" &&
          r.values.endDate <= asOf,
      )
      .flatMap(
        (r) =>
          r.uplifts
            ?.filter((u) => u.capabilityId === capabilityId)
            .map((u) => u.uplift) ?? [],
      ),
  );
  return Math.max(
    current,
    Math.min(methods.projectionCap ?? 5, 5, current + uplift),
  );
}
