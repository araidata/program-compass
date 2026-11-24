import { api, input, json } from "@/lib/server/api";
import { contextInput } from "@/lib/domain/context";
import { loadContext, saveContext } from "@/lib/server/context";
export async function GET(request: Request) {
  return api(request, "read", async () => json(await loadContext()));
}
export async function POST(request: Request) {
  return api(request, "write", async (user) =>
    json(
      await saveContext(user.id, null, await input(request, contextInput)),
      201,
    ),
  );
}
