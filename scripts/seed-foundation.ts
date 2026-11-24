import type { PrismaClient } from "../src/generated/prisma/client";

export async function seedFoundation(client: PrismaClient) {
  await client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(87341602)`;
    await tx.organization.upsert({
      where: { id: "organization" },
      create: { id: "organization" },
      update: {},
    });
    await tx.applicationSettings.upsert({
      where: { id: "application" },
      create: { id: "application" },
      update: {},
    });
    const definitions = [
      { key: "secops", name: "Security Operations", sortOrder: 0 },
      { key: "sae", name: "Security Architecture & Engineering", sortOrder: 1 },
      { key: "grc", name: "Governance, Risk & Compliance", sortOrder: 2 },
    ];
    for (const definition of definitions) {
      const existing = await tx.pillar.findUnique({
        where: { key: definition.key },
      });
      if (existing) continue;
      const pillar = await tx.pillar.create({
        data: {
          ...definition,
          functions:
            definition.key === "sae"
              ? { create: [{ name: "Architecture" }, { name: "Engineering" }] }
              : undefined,
        },
      });
      await tx.changeEvent.create({
        data: {
          action: "foundation.seeded",
          entityType: "Pillar",
          entityId: pillar.id,
          details: definition,
        },
      });
    }
  });
}
