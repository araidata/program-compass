import { z } from "zod";
import type { CapabilityView } from "./capabilities";
import type { Methods } from "./methods";
export const requirementInput = z
  .object({
    applicability: z.enum(["unknown", "applicable", "not-applicable"]),
    implementation: z.enum([
      "unassessed",
      "not-started",
      "planned",
      "in-progress",
      "implemented",
    ]),
    currentLevel: z.number().int().min(1).max(5).nullable(),
    targetLevel: z.number().int().min(1).max(5).nullable(),
    notes: z.string().trim().max(4000).nullable(),
    ownerId: z.string().min(1).max(100).nullable(),
    applicableDeadline: z.iso.date().nullable(),
    capabilityIds: z
      .array(z.string().min(1).max(100))
      .max(100)
      .refine((v) => new Set(v).size === v.length),
    mappingRationale: z.string().trim().max(4000),
    reviewed: z.boolean(),
  })
  .strict()
  .refine(
    (v) => v.capabilityIds.length === 0 || v.mappingRationale.length > 0,
    "Mapping rationale required",
  );
export type RequirementValues = z.infer<typeof requirementInput>;
export type RequirementView = {
  id: string;
  frameworkId: string;
  identifier: string;
  title: string;
  description: string | null;
  parentId: string | null;
  kind: string;
  sourceUrl: string | null;
  sourcePage: number | null;
  sourceDeadline: string | null;
  revision: string;
  values: RequirementValues;
  assessedAt: string | null;
  scaleVersion: string;
};
export type AlignmentData = {
  frameworks: {
    id: string;
    key: string;
    name: string;
    version: string;
    sourceUrl: string | null;
    sourceHash: string | null;
  }[];
  requirements: RequirementView[];
  people: { id: string; label: string }[];
};
export function requirementCoverage(
  r: RequirementView,
  capabilities: CapabilityView[],
  threshold: number,
) {
  const unique = new Set(r.values.reviewed ? r.values.capabilityIds : []);
  const mapped = capabilities.filter((c) => unique.has(c.id));
  const applicable = mapped.filter((c) => c.applicable);
  const assessed = applicable.filter((c) => c.currentLevel !== null);
  const missing = applicable.length - assessed.length;
  const min = assessed.length
    ? Math.min(...assessed.map((c) => c.currentLevel!))
    : null;
  const mean = assessed.length
    ? assessed.reduce((s, c) => s + c.currentLevel!, 0) / assessed.length
    : null;
  const status =
    r.values.applicability === "unknown"
      ? "Unknown applicability"
      : r.values.applicability === "not-applicable"
        ? "Not applicable"
        : !mapped.length
          ? "Unmapped"
          : !applicable.length || missing
            ? "Incomplete"
            : min !== null && min >= threshold
              ? "Covered (indicative)"
              : min !== null && min >= threshold - 1
                ? "Partly covered"
                : "Gap";
  return {
    status,
    min,
    mean,
    missing,
    mapped: mapped.length,
    applicable: applicable.length,
  };
}
export function alignmentSummary(
  data: AlignmentData,
  capabilities: CapabilityView[],
  methods: Methods,
  frameworkId: string,
  leafUniverse: RequirementView[] = data.requirements,
) {
  const children = new Set(leafUniverse.map((r) => r.parentId).filter(Boolean));
  const leaves = data.requirements.filter(
    (r) => r.frameworkId === frameworkId && !children.has(r.id),
  );
  const applicable = leaves.filter(
    (r) => r.values.applicability === "applicable",
  );
  const metrics = applicable.map((r) =>
    requirementCoverage(r, capabilities, methods.values.coverageThreshold),
  );
  const covered = metrics.filter(
    (m) => m.status === "Covered (indicative)",
  ).length;
  return {
    leaves: leaves.length,
    applicable: applicable.length,
    unknown: leaves.filter((r) => r.values.applicability === "unknown").length,
    notApplicable: leaves.filter(
      (r) => r.values.applicability === "not-applicable",
    ).length,
    covered,
    unmapped: metrics.filter((m) => m.status === "Unmapped").length,
    incomplete: metrics.filter((m) => m.status === "Incomplete").length,
    coverage: applicable.length ? (covered / applicable.length) * 100 : null,
    implemented: applicable.filter(
      (r) => r.values.implementation === "implemented",
    ).length,
  };
}
