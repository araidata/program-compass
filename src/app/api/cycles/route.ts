import { api, input, json } from "@/lib/server/api";
import { cycleInput } from "@/lib/domain/workforce";
import { db } from "@/lib/server/db";
import { capabilityInclude, toView } from "@/lib/server/capabilities";
import type { Prisma } from "@/generated/prisma/client";
export async function GET(request: Request) {
  return api(request, "read", async () =>
    json(
      await db().planningCycle.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 100,
      }),
    ),
  );
}
export async function POST(request: Request) {
  return api(request, "write", async (user) => {
    const values = await input(request, cycleInput);
    // Capture a consistent database snapshot; the as-of instant is server time.
    const result = await db().$transaction(
      async (tx) => {
        const capabilities = await tx.capability.findMany({
          include: capabilityInclude,
          orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
        });
        const cycle = await tx.planningCycle.create({
          data: { ...values, asOf: new Date() },
        });
        await tx.capabilitySnapshot.createMany({
          data: capabilities.map((c) => ({
            cycleId: cycle.id,
            capabilityId: c.id,
            assessment: JSON.parse(
              JSON.stringify({
                ...toView(c),
                snapshotVersion: "capability-snapshot-1",
              }),
            ) as Prisma.InputJsonObject,
          })),
        });
        await tx.changeEvent.create({
          data: {
            actorId: user.id,
            entityType: "PlanningCycle",
            entityId: cycle.id,
            action: "cycle.captured",
            details: { count: capabilities.length },
          },
        });
        return cycle;
      },
      { isolationLevel: "RepeatableRead" },
    );
    return json(result, 201);
  });
}
