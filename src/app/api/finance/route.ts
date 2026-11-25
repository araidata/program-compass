import { api, input, json } from "@/lib/server/api";
import { financeEnvelope } from "@/lib/domain/finance";
import { loadFinance, saveFinance } from "@/lib/server/finance";
export async function GET(request: Request) {
  return api(request, "read", async () => json(await loadFinance()));
}
export async function POST(request: Request) {
  return api(request, "write", async (user) => {
    const body = await input(request, financeEnvelope);
    return json(await saveFinance(user.id, body.kind, null, body.values), 201);
  });
}
