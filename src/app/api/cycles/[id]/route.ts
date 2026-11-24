import { api, json } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { HttpError } from "@/lib/server/access";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api(request, "read", async () => {
    const cycle = await db().planningCycle.findUnique({
      where: { id: (await params).id },
      include: { snapshots: true },
    });
    if (!cycle) throw new HttpError(404, "Cycle not found");
    return json(cycle);
  });
}
