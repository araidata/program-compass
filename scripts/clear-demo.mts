// Removes synthetic (demo) assessment data. A topic that anyone has edited
// through the application (it has a change event other than seeding) is left
// exactly as it is; every other topic goes back to unassessed with empty KPI
// values. Demo-created functions that no longer own a topic are deleted.
// Usage: DATABASE_ENVIRONMENT=production ALLOW_PRODUCTION_MIGRATION=true \
//          npm run db:demo:clear
import { database } from "./database";
import { DEMO_ACTION, DEMO_FUNCTIONS, SYSTEM_ACTIONS } from "./demo-data";

const client = database();
try {
  const edited = new Set(
    (
      await client.changeEvent.findMany({
        where: { entityType: "Capability", action: { notIn: SYSTEM_ACTIONS } },
        select: { entityId: true },
        distinct: ["entityId"],
      })
    ).map((event) => event.entityId),
  );
  const capabilities = await client.capability.findMany({
    select: { id: true, code: true },
  });
  const demo = capabilities.filter((item) => !edited.has(item.id));
  const ids = demo.map((item) => item.id);
  await client.$transaction([
    client.capability.updateMany({
      where: { id: { in: ids } },
      data: {
        currentLevel: null,
        targetLevel: null,
        confidence: null,
        rationale: null,
        reviewState: "draft",
        assessedAt: null,
        assessedById: null,
        targetDate: null,
        accountableFunctionId: null,
      },
    }),
    client.capabilityIndicator.updateMany({
      where: { capabilityId: { in: ids } },
      data: { value: null, measuredAt: null, updatedById: null },
    }),
    client.changeEvent.deleteMany({ where: { action: DEMO_ACTION } }),
  ]);
  let removedFunctions = 0;
  for (const [pillarKey, names] of Object.entries(DEMO_FUNCTIONS))
    removedFunctions += (
      await client.organizationalFunction.deleteMany({
        where: {
          pillar: { key: pillarKey },
          name: { in: names },
          accountableFor: { none: {} },
        },
      })
    ).count;
  console.log(
    `Cleared demo data from ${demo.length} topics; kept ${
      capabilities.length - demo.length
    } edited topics; removed ${removedFunctions} demo functions.`,
  );
} finally {
  await client.$disconnect();
}
