import { api, json } from "@/lib/server/api";
import { loadAlignment } from "@/lib/server/alignment";
export async function GET(request: Request) {
  return api(request, "read", async () => json(await loadAlignment()));
}
