import { defaultMethodValues, type MethodValues } from "./methods";
import { z } from "zod";
import type { CapabilityView } from "./capabilities";
const text = z.string().trim().max(4000);
const ids = z
  .array(z.string().min(1).max(100))
  .max(200)
  .refine((v) => new Set(v).size === v.length, "Duplicate links");
export const profileInput = z
  .object({
    mission: text.nullable(),
    sector: text.nullable(),
    criticalServices: text.nullable(),
    dependencies: text.nullable(),
    publicSafetyImpact: text.nullable(),
    regulatoryDrivers: text.nullable(),
    complexityNotes: text.nullable(),
  })
  .strict();
export const objectiveInput = z
  .object({
    title: z.string().trim().min(1).max(150),
    rationale: text.min(1),
    priority: z.number().int().min(1).max(5),
    ownerId: z.string().min(1).max(100).nullable(),
    active: z.boolean(),
    capabilityIds: ids,
  })
  .strict();
export const threatInput = z
  .object({
    title: z.string().trim().min(1).max(150),
    scenario: text.min(1),
    likelihood: z.number().int().min(1).max(5).nullable(),
    impact: z.number().int().min(1).max(5).nullable(),
    basis: text.min(1),
    active: z.boolean(),
    objectiveIds: ids,
    capabilityIds: ids,
  })
  .strict();
export const contextInput = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("profile"),
      values: profileInput,
      revision: z.string().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("objective"),
      values: objectiveInput,
      revision: z.string().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("threat"),
      values: threatInput,
      revision: z.string().optional(),
    })
    .strict(),
]);
export type Profile = z.infer<typeof profileInput> & {
  id: string;
  revision: string;
};
export type Objective = z.infer<typeof objectiveInput> & {
  id: string;
  revision: string;
};
export type Threat = z.infer<typeof threatInput> & {
  id: string;
  revision: string;
};
export type ContextData = {
  profile: Profile | null;
  objectives: Objective[];
  threats: Threat[];
  people: { id: string; name: string }[];
};
/** Provisional reference readiness: no missing input is treated as defended. */
export function readiness(
  capabilityIds: string[],
  capabilities: CapabilityView[],
  methods: MethodValues = defaultMethodValues,
) {
  const ids = new Set(capabilityIds);
  const mapped = capabilities.filter((c) => ids.has(c.id));
  const applicable = mapped.filter((c) => c.applicable);
  const assessed = applicable.filter((c) => c.currentLevel !== null);
  const missing = applicable.length - assessed.length;
  const minimum = assessed.length
    ? Math.min(...assessed.map((c) => c.currentLevel!))
    : null;
  const mean = assessed.length
    ? assessed.reduce((s, c) => s + c.currentLevel!, 0) / assessed.length
    : null;
  const state = !mapped.length
    ? "Unmapped"
    : !applicable.length
      ? "Not applicable"
      : missing
        ? "Incomplete"
        : minimum !== null && minimum >= methods.readinessDefended
          ? "Defended (indicative)"
          : minimum !== null && minimum >= methods.readinessPartial
            ? "Partly defended"
            : "Exposed";
  return { state, minimum, mean, missing, total: applicable.length };
}
export function objectiveCapabilities(objective: Objective, threats: Threat[]) {
  return [
    ...new Set([
      ...objective.capabilityIds,
      ...threats
        .filter((t) => t.active && t.objectiveIds.includes(objective.id))
        .flatMap((t) => t.capabilityIds),
    ]),
  ];
}
