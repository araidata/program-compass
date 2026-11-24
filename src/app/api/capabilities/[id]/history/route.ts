import { api, json } from "@/lib/server/api";
import { capabilityHistory } from "@/lib/server/capabilities";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(request, "read", async () => {
    const { id } = await context.params;
    return json(await capabilityHistory(id));
  });
}
