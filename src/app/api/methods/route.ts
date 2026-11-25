import { db } from "@/lib/server/db";
import { methodValuesSchema } from "@/lib/domain/methods";
import { api, input, json } from "@/lib/server/api";
import { loadMethods, saveMethods } from "@/lib/server/methods";
import { methodInput } from "@/lib/domain/methods";
export async function GET(request: Request) {
  return api(request, "read", async () => {
    if (new URL(request.url).searchParams.get("history") === "true")
      return json(
        (
          await db().planningMethodVersion.findMany({
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          })
        ).map((m) => ({
          ...m,
          values: methodValuesSchema.parse(m.values),
          effectiveDate: m.effectiveDate.toISOString().slice(0, 10),
          createdAt: m.createdAt.toISOString(),
        })),
      );
    return json(await loadMethods());
  });
}
export async function POST(request: Request) {
  return api(request, "administer", async (user) =>
    json(await saveMethods(user.id, await input(request, methodInput)), 201),
  );
}
