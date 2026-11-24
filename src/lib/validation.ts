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
