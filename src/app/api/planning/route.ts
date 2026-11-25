import { api, input, json } from "@/lib/server/api";
import { planningEnvelope } from "@/lib/domain/planning";
import { loadPlanning, savePlanning } from "@/lib/server/planning";
export async function GET(request: Request) {
  return api(request, "read", async () => json(await loadPlanning()));
}
export async function POST(request: Request) {
  return api(request, "write", async (user) => {
    const body = await input(request, planningEnvelope);
    return json(await savePlanning(user.id, body.kind, null, body.values), 201);
  });
}
