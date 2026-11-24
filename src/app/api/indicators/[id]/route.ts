import { api, input, json } from "@/lib/server/api";
import { deleteIndicator, updateIndicator } from "@/lib/server/capabilities";
import { indicatorUpdateSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return api(request, "write", async (actor) => {
    const data = await input(request, indicatorUpdateSchema);
    const { id } = await context.params;
    return json(await updateIndicator(actor.id, id, data));
  });
}

export async function DELETE(request: Request, context: Context) {
  return api(request, "write", async (actor) => {
    const { id } = await context.params;
    return json(await deleteIndicator(actor.id, id));
  });
}
