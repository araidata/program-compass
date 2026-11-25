import { api, input, json } from "@/lib/server/api";
import { planningEnvelope } from "@/lib/domain/planning";
import { savePlanning } from "@/lib/server/planning";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api(request, "write", async (user) => {
    const body = await input(request, planningEnvelope);
    return json(
      await savePlanning(
        user.id,
        body.kind,
        (await params).id,
        body.values,
        body.revision,
      ),
    );
  });
}
