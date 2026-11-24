import type { PrismaClient } from "../src/generated/prisma/client";
import {
  CATALOGUE_VERSION,
  catalogueTopics,
} from "../src/lib/domain/catalogue";

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
    await seedCapabilityCatalogue(tx);
  });
}

type Transaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Adds missing reference-baseline topics and KPIs. Existing records and any
 * organizational edits are kept, so the seed is idempotent.
 */
async function seedCapabilityCatalogue(tx: Transaction) {
  const pillars = await tx.pillar.findMany({ select: { id: true, key: true } });
  const pillarId = new Map(pillars.map((pillar) => [pillar.key, pillar.id]));
  for (const [index, topic] of catalogueTopics.entries()) {
    let capability = await tx.capability.findUnique({
      where: { code: topic.code },
    });
    if (!capability) {
      capability = await tx.capability.create({
        data: {
          code: topic.code,
          groupCode: topic.code.slice(0, 2),
          name: topic.name,
          catalogue: CATALOGUE_VERSION,
          sortOrder: index,
          pillars: {
            create: topic.pillars
              .filter((key) => pillarId.has(key))
              .map((key) => ({ pillarId: pillarId.get(key)! })),
          },
        },
      });
      await tx.changeEvent.create({
        data: {
          action: "catalogue.seeded",
          entityType: "Capability",
          entityId: capability.id,
          details: { code: topic.code, catalogue: CATALOGUE_VERSION },
        },
      });
    }
    for (const [position, kpi] of topic.kpis.entries()) {
      const catalogueKey = `${topic.code}-${position + 1}`;
      if (await tx.capabilityIndicator.findUnique({ where: { catalogueKey } }))
        continue;
      const [name, pass, fail, direction] = kpi;
      await tx.capabilityIndicator.create({
        data: {
          capabilityId: capability.id,
          catalogueKey,
          sortOrder: position,
          name,
          unit: "%",
          direction: direction ?? "higher",
          passThreshold: pass,
          failThreshold: fail,
        },
      });
    }
  }
}
