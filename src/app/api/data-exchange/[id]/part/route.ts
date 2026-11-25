import { z } from "zod";
import { api, json } from "@/lib/server/api";
import { saveUploadPart } from "@/lib/server/exchange";
import { HttpError } from "@/lib/server/access";
export const maxDuration = 300;
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api(request, "administer", async () => {
    const body = await request.text();
    if (body.length > 400000)
      throw new HttpError(413, "Chunk request too large");
    const v = z
      .object({ part: z.number().int(), base64: z.string() })
      .strict()
      .parse(JSON.parse(body));
    return json(await saveUploadPart((await params).id, v.part, v.base64));
  });
}
