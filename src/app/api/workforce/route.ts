import { api, input, json } from "@/lib/server/api";
import { workforceInput } from "@/lib/domain/workforce";
import { loadWorkforce, saveWorkforce } from "@/lib/server/workforce";
export async function GET(request: Request) {
  return api(request, "read", async () => json(await loadWorkforce()));
}
export async function POST(request: Request) {
  return api(request, "write", async (user) =>
    json(
      await saveWorkforce(user.id, null, await input(request, workforceInput)),
      201,
    ),
  );
}
