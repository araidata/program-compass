import { z } from "zod";
import { api, input, json } from "@/lib/server/api";
import { exportBusiness, createUpload } from "@/lib/server/exchange";
export const maxDuration = 300;
export async function GET(request: Request) {
  return api(request, "administer", async () => {
    const bundle = await exportBusiness();
    const bytes = new TextEncoder().encode(JSON.stringify(bundle));
    let offset = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (offset >= bytes.length) {
          controller.close();
          return;
        }
        controller.enqueue(bytes.slice(offset, offset + 256 * 1024));
        offset += 256 * 1024;
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "Content-Disposition": `attachment; filename="program-compass-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
export async function POST(request: Request) {
  return api(request, "administer", async () =>
    json(
      await createUpload(
        await input(
          request,
          z
            .object({
              byteLength: z.number().int().positive(),
              partCount: z.number().int().positive(),
              sha256: z.string().regex(/^[a-f0-9]{64}$/),
            })
            .strict(),
        ),
      ),
      201,
    ),
  );
}
