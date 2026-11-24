import { api, input, json } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { createUser, publicUser } from "@/lib/server/administration";
import { createUserSchema, listSchema } from "@/lib/validation";

export const runtime = "nodejs";
export async function GET(request: Request) {
  return api(request, "administer", async () => {
    const { page, pageSize, search, sort, direction } = listSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const where = {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    };
    const [items, total] = await db().$transaction([
      db().user.findMany({
        where,
        select: publicUser,
        orderBy: [{ [sort]: direction }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db().user.count({ where }),
    ]);
    return json({ items, total, page, pageSize });
  });
}
export async function POST(request: Request) {
  return api(request, "administer", async (actor) =>
    json(
      await createUser(actor.id, await input(request, createUserSchema)),
      201,
    ),
  );
}
