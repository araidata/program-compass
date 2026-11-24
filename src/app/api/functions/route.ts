import { api, input, json } from "@/lib/server/api";
import { administrativeTransaction } from "@/lib/server/administration";
import { functionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return api(request, "administer", async (actor) => {
    const data = await input(request, functionSchema);
    return json(
      await administrativeTransaction(actor.id, async (tx) => {
        const result = await tx.organizationalFunction.create({ data });
        await tx.changeEvent.create({
          data: {
            actorId: actor.id,
            action: "function.created",
            entityType: "OrganizationalFunction",
            entityId: result.id,
            details: data,
          },
        });
        return result;
      }),
      201,
    );
  });
}
