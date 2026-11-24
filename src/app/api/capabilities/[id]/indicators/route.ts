import { api, input, json } from "@/lib/server/api";
import { createIndicator } from "@/lib/server/capabilities";
import { indicatorSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(request, "write", async (actor) => {
    const data = await input(request, indicatorSchema);
    const { id } = await context.params;
    return json(await createIndicator(actor.id, id, data), 201);
  });
}
