import { z } from "zod";
import { maturityLevels } from "./maturity";
const ordinal = z.number().int().min(1).max(5);
export const methodValuesSchema = z
  .object({
    levels: z
      .array(
        z
          .object({
            level: ordinal,
            name: z.string().trim().min(1).max(60),
            definition: z.string().trim().min(1).max(1000),
          })
          .strict(),
      )
      .length(5)
      .refine(
        (v) => v.every((l, i) => l.level === i + 1),
        "Preserve levels 1–5 in order",
      ),
    reviewDueMonths: z.number().int().min(1).max(120),
    reviewOverdueMonths: z.number().int().min(1).max(240),
    readinessDefended: ordinal,
    readinessPartial: ordinal,
    coverageThreshold: ordinal,
    projectionCap: ordinal.default(5),
    projectionRequiresApproval: z.boolean().default(true),
    projectionStatuses: z
      .array(z.enum(["planned", "in-progress", "on-hold"]))
      .min(1)
      .max(3)
      .refine((v) => new Set(v).size === v.length)
      .default(["planned", "in-progress"]),
    planStartYear: z.number().int().min(2000).max(2200),
    currency: z.string().regex(/^[A-Z]{3}$/),
    fiscalStartMonth: z.number().int().min(1).max(12),
    salaryEscalation: z.number().finite().min(-100).max(100),
    licensingEscalation: z.number().finite().min(-100).max(100),
  })
  .strict()
  .refine(
    (v) =>
      v.reviewDueMonths < v.reviewOverdueMonths &&
      v.readinessPartial < v.readinessDefended,
    "Overdue must follow due; defended must exceed partial",
  );
export type MethodValues = z.infer<typeof methodValuesSchema>;
export type Methods = {
  id: string;
  values: MethodValues;
  basis: string;
  effectiveDate: string;
  provisional: boolean;
  createdAt: string;
};
export const defaultMethodValues: MethodValues = {
  levels: maturityLevels.map((l) => ({ ...l })),
  reviewDueMonths: 6,
  reviewOverdueMonths: 12,
  readinessDefended: 3,
  readinessPartial: 2,
  coverageThreshold: 3,
  projectionCap: 5,
  projectionRequiresApproval: true,
  projectionStatuses: ["planned", "in-progress"],
  planStartYear: 2027,
  currency: "USD",
  fiscalStartMonth: 1,
  salaryEscalation: 0,
  licensingEscalation: 0,
};
export const defaultMethods: Methods = {
  id: "provisional-1",
  values: defaultMethodValues,
  basis:
    "Existing reference baseline; editable organizational planning estimates. Zero escalation means no assumed change, not a market forecast.",
  effectiveDate: "2026-11-24",
  provisional: true,
  createdAt: "2026-11-24T00:00:00.000Z",
};
export const methodInput = z
  .object({
    values: methodValuesSchema,
    basis: z.string().trim().min(1).max(4000),
    effectiveDate: z.iso.date(),
    provisional: z.boolean(),
    revision: z.string().min(1).max(100),
  })
  .strict();
