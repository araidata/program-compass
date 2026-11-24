import { api, json } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { listSchema } from "@/lib/validation";

export async function GET(request: Request) {
  return api(request, "administer", async () => {
    const { page, pageSize } = listSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return json(
      await db().changeEvent.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          actorId: true,
          details: true,
          createdAt: true,
        },
      }),
    );
  });
}
