import { api, json } from "@/lib/server/api";
import { applyPreview } from "@/lib/server/exchange";
export const maxDuration = 300;
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api(request, "administer", async (user) =>
    json(await applyPreview((await params).id, user.id)),
  );
}
