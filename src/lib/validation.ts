import { z } from "zod";
import { roles } from "./permissions";

export const passwordSchema = z.string().min(15).max(128);
export const createUserSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    password: passwordSchema,
    role: z.enum(roles),
  })
  .strict();
export const updateUserSchema = z
  .object({ role: z.enum(roles), active: z.boolean() })
  .strict();
export const settingsSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    dateFormat: z.enum(["YYYY-MM-DD", "MM/DD/YYYY"]),
  })
  .strict();
export const pillarSchema = z
  .object({ name: z.string().trim().min(1).max(100) })
  .strict();
export const functionSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    pillarId: z.string().min(1).max(100),
  })
  .strict();
export const listSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().max(100).default(""),
  sort: z.enum(["name", "email", "createdAt"]).default("name"),
  direction: z.enum(["asc", "desc"]).default("asc"),
});

const level = z.number().int().min(1).max(5).nullable();
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  });
export const capabilityUpdateSchema = z
  .object({
    currentLevel: level,
    targetLevel: level,
    applicable: z.boolean(),
    confidence: z.enum(["low", "medium", "high"]).nullable(),
    rationale: z.string().trim().max(4000).nullable(),
    description: z.string().trim().max(2000).nullable(),
    reviewState: z.enum(["draft", "submitted", "reviewed"]),
    targetDate: isoDate.nullable(),
    ownerPersonId: z.string().min(1).max(100).nullable(),
    accountableFunctionId: z.string().min(1).max(100).nullable(),
    pillarKeys: z
      .array(z.enum(["secops", "sae", "grc"]))
      .min(1)
      .max(3)
      .refine((keys) => new Set(keys).size === keys.length),
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0);
const measure = z.number().finite().min(-1e9).max(1e9);
const indicatorFields = z
  .object({
    name: z.string().trim().min(1).max(120),
    unit: z.string().trim().min(1).max(30),
    direction: z.enum(["higher", "lower"]),
    passThreshold: measure,
    failThreshold: measure,
    value: measure.nullable(),
    measuredAt: isoDate.nullable(),
  })
  .strict();
export const indicatorSchema = indicatorFields.refine(
  (value) =>
    value.direction === "higher"
      ? value.passThreshold >= value.failThreshold
      : value.passThreshold <= value.failThreshold,
  { message: "Pass and fail boundaries are out of order" },
);
// Catalogue KPIs keep their name; boundary order is rechecked on the server.
export const indicatorUpdateSchema = indicatorFields
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0);
