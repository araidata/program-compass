import { api, input, json } from "@/lib/server/api";
import { financeEnvelope } from "@/lib/domain/finance";
import { saveFinance } from "@/lib/server/finance";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api(request, "write", async (user) => {
    const body = await input(request, financeEnvelope);
    return json(
      await saveFinance(
        user.id,
        body.kind,
        (await params).id,
        body.values,
        body.revision,
      ),
    );
  });
}
