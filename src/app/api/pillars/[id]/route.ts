import { api, input, json } from "@/lib/server/api";
import { administrativeTransaction } from "@/lib/server/administration";
import { pillarSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(request, "administer", async (actor) => {
    const data = await input(request, pillarSchema);
    const { id } = await context.params;
    return json(
      await administrativeTransaction(actor.id, async (tx) => {
        const result = await tx.pillar.update({ where: { id }, data });
        await tx.changeEvent.create({
          data: {
            actorId: actor.id,
            action: "pillar.updated",
            entityType: "Pillar",
            entityId: id,
            details: data,
          },
        });
        return result;
      }),
    );
  });
}
