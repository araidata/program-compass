import { z } from "zod";
import { api, input, json } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { HttpError } from "@/lib/server/access";
const schema = z
  .object({
    capabilityId: z.string().min(1).max(100),
    uplift: z.number().int().min(0).max(4),
    rationale: z.string().trim().min(1).max(4000),
    revision: z.string().max(100),
  })
  .strict();
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api(request, "write", async (user) => {
    const body = await input(request, schema);
    const id = (await params).id;
    return json(
      await db().$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(731245, 4)`;
        const before = await tx.initiative.findUnique({ where: { id } });
        if (!before) throw new HttpError(404, "Initiative not found");
        if (before.updatedAt.toISOString() !== body.revision)
          throw new HttpError(409, "Initiative changed. Reload before saving.");
        const link = await tx.initiativeCapability.findUnique({
          where: {
            initiativeId_capabilityId: {
              initiativeId: id,
              capabilityId: body.capabilityId,
            },
          },
        });
        if (!link)
          throw new HttpError(
            400,
            "Capability is not linked to this initiative",
          );
        await tx.initiativeCapability.update({
          where: {
            initiativeId_capabilityId: {
              initiativeId: id,
              capabilityId: body.capabilityId,
            },
          },
          data: { uplift: body.uplift, rationale: body.rationale },
        });
        await tx.initiative.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
        await tx.changeEvent.create({
          data: {
            actorId: user.id,
            entityType: "initiative",
            entityId: id,
            action: "initiative.uplift",
            details: {
              capabilityId: body.capabilityId,
              before: link.uplift,
              after: body.uplift,
              rationale: body.rationale,
            },
          },
        });
        return { id };
      }),
    );
  });
}
