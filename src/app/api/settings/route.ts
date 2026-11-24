import { api, input, json } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { administrativeTransaction } from "@/lib/server/administration";
import { settingsSchema } from "@/lib/validation";

export async function GET(request: Request) {
  return api(request, "administer", async () =>
    json({
      organization: await db().organization.findUnique({
        where: { id: "organization" },
        include: {
          pillars: {
            orderBy: { sortOrder: "asc" },
            include: { functions: { orderBy: { name: "asc" } } },
          },
        },
      }),
      settings: await db().applicationSettings.findUnique({
        where: { id: "application" },
      }),
    }),
  );
}
export async function PATCH(request: Request) {
  return api(request, "administer", async (actor) => {
    const data = await input(request, settingsSchema);
    await administrativeTransaction(actor.id, async (tx) => {
      await tx.organization.update({
        where: { id: "organization" },
        data: { name: data.name },
      });
      await tx.applicationSettings.update({
        where: { id: "application" },
        data: { dateFormat: data.dateFormat },
      });
      await tx.changeEvent.create({
        data: {
          actorId: actor.id,
          action: "settings.updated",
          entityType: "ApplicationSettings",
          entityId: "application",
          details: data,
        },
      });
    });
    return json({ saved: true });
  });
}
