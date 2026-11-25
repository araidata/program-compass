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
          entityType: "RequirementAssessment",
          entityId: (await params).id,
        },
        include: { actor: { select: { name: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 30,
      }),
    ),
  );
}
