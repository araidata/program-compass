import { z } from "zod";

const id = z.string().min(1).max(100);
export const personInput = z
  .object({
    name: z.string().trim().min(1).max(150),
    title: z.string().trim().min(1).max(150),
    managerId: id.nullable(),
    active: z.boolean(),
  })
  .strict();
export const positionInput = z
  .object({
    title: z.string().trim().min(1).max(150),
    pillarId: id,
    personId: id.nullable(),
    state: z.enum(["authorized", "proposed", "retired"]),
    fte: z.number().finite().min(0.01).max(1),
    annualCost: z.number().finite().min(0).max(1e10).nullable(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    startYear: z.number().int().min(2000).max(2200).nullable(),
    justification: z.string().trim().max(4000).nullable(),
  })
  .strict();
export const workforceInput = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("person"),
      values: personInput,
      revision: z.string().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("position"),
      values: positionInput,
      revision: z.string().optional(),
    })
    .strict(),
]);
export const cycleInput = z
  .object({
    name: z.string().trim().min(1).max(150),
    notes: z.string().trim().max(4000).nullable(),
  })
  .strict();
export type PersonView = z.infer<typeof personInput> & {
  id: string;
  revision: string;
};
export type PositionView = z.infer<typeof positionInput> & {
  id: string;
  revision: string;
};
export type WorkforceData = {
  people: PersonView[];
  positions: PositionView[];
  pillars: { id: string; key: string; name: string }[];
  ownership: {
    id: string;
    code: string;
    name: string;
    ownerPersonId: string | null;
    pillarKeys: string[];
    targetDate: string | null;
    currentLevel: number | null;
    targetLevel: number | null;
  }[];
};
/** A reporting line must be a forest, including when the proposed manager is a descendant. */
export function reportingCycle(
  people: Pick<PersonView, "id" | "managerId">[],
  id: string,
  managerId: string | null,
) {
  const managers = new Map(people.map((p) => [p.id, p.managerId]));
  managers.set(id, managerId);
  const seen = new Set<string>([id]);
  let next = managerId;
  while (next) {
    if (seen.has(next)) return true;
    seen.add(next);
    next = managers.get(next) ?? null;
  }
  return false;
}
export function descendants(
  people: Pick<PersonView, "id" | "managerId">[],
  id: string,
) {
  const result = new Set<string>([id]);
  let size = 0;
  while (size !== result.size) {
    size = result.size;
    for (const p of people)
      if (p.managerId && result.has(p.managerId)) result.add(p.id);
  }
  return result;
}
