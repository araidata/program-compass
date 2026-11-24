import { api, input, json } from "@/lib/server/api";
import { updateUser } from "@/lib/server/administration";
import { updateUserSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(request, "administer", async (actor) =>
    json(
      await updateUser(
        actor.id,
        (await context.params).id,
        await input(request, updateUserSchema),
      ),
    ),
  );
}
