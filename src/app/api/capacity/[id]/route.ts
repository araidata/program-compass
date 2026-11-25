import { api, input, json } from "@/lib/server/api";
import { capacityEnvelope } from "@/lib/domain/capacity";
import { saveCapacity } from "@/lib/server/capacity";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api(request, "write", async (user) => {
    const body = await input(request, capacityEnvelope);
    return json(
      await saveCapacity(
        user.id,
        body.kind,
        (await params).id,
        body.values,
        body.revision,
      ),
    );
  });
}
