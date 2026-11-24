import { api, input, json } from "@/lib/server/api";
import { updateCapability } from "@/lib/server/capabilities";
import { capabilityUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(request, "write", async (actor) => {
    const data = await input(request, capabilityUpdateSchema);
    const { id } = await context.params;
    return json(await updateCapability(actor.id, id, data));
  });
}
