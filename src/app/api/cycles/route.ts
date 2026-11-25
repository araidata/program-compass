import { cycleSummary } from "@/lib/domain/cycle-summary";
import { api, input, json } from "@/lib/server/api";
import { cycleInput } from "@/lib/domain/workforce";
import { db } from "@/lib/server/db";
import { captureDataset } from "@/lib/server/snapshots";
import type { Prisma } from "@/generated/prisma/client";
export async function GET(request: Request) {
  return api(request, "read", async () =>
    json(
      await db().planningCycle.findMany({
        // The captured dataset is ~2 MB per cycle; the list never needs it.
        omit: { dataset: true },
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
        const dataset = await captureDataset(tx);
        const capabilities = dataset.capabilities;
        const cycle = await tx.planningCycle.create({
          data: {
            ...values,
            asOf: new Date(),
            dataset: dataset as unknown as Prisma.InputJsonObject,
            summary: cycleSummary(dataset) as unknown as Prisma.InputJsonObject,
          },
          omit: { dataset: true },
        });
        await tx.capabilitySnapshot.createMany({
          data: capabilities.map((c) => ({
            cycleId: cycle.id,
            capabilityId: c.id,
            assessment: JSON.parse(
              JSON.stringify({
                ...c,
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
      { isolationLevel: "RepeatableRead", timeout: 30_000, maxWait: 10_000 },
    );
    return json(result, 201);
  });
}
