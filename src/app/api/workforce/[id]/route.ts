import { api, input, json } from "@/lib/server/api";
import { workforceInput } from "@/lib/domain/workforce";
import { saveWorkforce } from "@/lib/server/workforce";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api(request, "write", async (user) =>
    json(
      await saveWorkforce(
        user.id,
        (await params).id,
        await input(request, workforceInput),
      ),
    ),
  );
}
