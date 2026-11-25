import { Prisma, type PrismaClient } from "../src/generated/prisma/client";
import { cycleSummary } from "../src/lib/domain/cycle-summary";
import type { SnapshotDataset } from "../src/lib/server/snapshots";
export async function seedCycleSummaries(client: PrismaClient) {
  const candidates = await client.planningCycle.findMany({
    where: {
      summary: { equals: Prisma.DbNull },
      dataset: { not: Prisma.DbNull },
    },
    select: { id: true },
  });
  for (const c of candidates) {
    const record = await client.planningCycle.findUniqueOrThrow({
      where: { id: c.id },
      select: { dataset: true },
    });
    const data = record.dataset as unknown as SnapshotDataset;
    if (data?.version === 2 && data.methods && data.capabilities)
      await client.planningCycle.update({
        where: { id: c.id },
        data: {
          summary: cycleSummary(data) as unknown as Prisma.InputJsonObject,
        },
      });
  }
}
