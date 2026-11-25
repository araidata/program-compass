import { api, json } from "@/lib/server/api";
import { db } from "@/lib/server/db";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api(request, "read", async () =>
    json(
      await db().changeEvent.findMany({
        where: {
          entityId: (await params).id,
          entityType: {
            in: ["responsibility", "planningIssue", "initiative", "technology"],
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 30,
        include: { actor: { select: { name: true } } },
      }),
    ),
  );
}
