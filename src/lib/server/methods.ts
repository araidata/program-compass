import "server-only";
import { cache } from "react";
import { db } from "./db";
import {
  defaultMethods,
  methodValuesSchema,
  type Methods,
  type methodInput,
} from "@/lib/domain/methods";
import { HttpError } from "./errors";
import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";
export const loadMethods = cache(async (): Promise<Methods> => {
  try {
    const record = await db().planningMethodVersion.findFirst({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return record
      ? {
          ...record,
          values: methodValuesSchema.parse(record.values),
          effectiveDate: record.effectiveDate.toISOString().slice(0, 10),
          createdAt: record.createdAt.toISOString(),
        }
      : defaultMethods;
  } catch (error) {
    if (["P2021", "P2022"].includes((error as { code?: string }).code ?? ""))
      return defaultMethods;
    throw error;
  }
});
export async function saveMethods(
  actorId: string | null,
  input: z.infer<typeof methodInput>,
) {
  return db().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(731245, 3)`;
    const current = await tx.planningMethodVersion.findFirst({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    if (input.revision !== (current?.id ?? defaultMethods.id))
      throw new HttpError(409, "Methods changed. Reload before saving.");
    const { revision, ...fields } = input;
    const record = await tx.planningMethodVersion.create({
      data: {
        ...fields,
        values: fields.values as Prisma.InputJsonObject,
        effectiveDate: new Date(`${fields.effectiveDate}T00:00:00Z`),
      },
    });
    await tx.changeEvent.create({
      data: {
        actorId,
        entityType: "PlanningMethodVersion",
        entityId: record.id,
        action: "methods.versioned",
        details: { previousId: revision, provisional: fields.provisional },
      },
    });
    return { id: record.id };
  });
}
