import { api, input, json } from "@/lib/server/api";
import { capacityEnvelope } from "@/lib/domain/capacity";
import { loadCapacity, saveCapacity } from "@/lib/server/capacity";
export async function GET(request: Request) {
  return api(request, "read", async () => json(await loadCapacity()));
}
export async function POST(request: Request) {
  return api(request, "write", async (user) => {
    const body = await input(request, capacityEnvelope);
    return json(await saveCapacity(user.id, body.kind, null, body.values), 201);
  });
}
