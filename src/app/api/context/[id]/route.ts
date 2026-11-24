import { api, input, json } from "@/lib/server/api";
import { contextInput } from "@/lib/domain/context";
import { saveContext } from "@/lib/server/context";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api(request, "write", async (user) =>
    json(
      await saveContext(
        user.id,
        (await params).id,
        await input(request, contextInput),
      ),
    ),
  );
}
