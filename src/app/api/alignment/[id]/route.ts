import { z } from "zod";
import { api, input, json } from "@/lib/server/api";
import { requirementInput } from "@/lib/domain/alignment";
import { saveRequirement } from "@/lib/server/alignment";
const schema = z
  .object({
    kind: z.literal("assessment"),
    values: requirementInput,
    revision: z.string().max(100),
  })
  .strict();
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api(request, "write", async (user) => {
    const body = await input(request, schema);
    return json(
      await saveRequirement(
        user.id,
        (await params).id,
        body.values,
        body.revision,
      ),
    );
  });
}
