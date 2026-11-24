import type { Prisma } from "../src/generated/prisma/client";
import { catalogueTopics } from "../src/lib/domain/catalogue";
import {
  DEMO_ACTION,
  DEMO_CLEARED_ACTION,
  DEMO_RATIONALE,
  SYSTEM_ACTIONS,
} from "./demo-data";

export async function clearDemoData(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(87341602)`;
  const markers = await tx.changeEvent.findMany({
    where: { action: DEMO_ACTION },
  });
  const marked = markers
    .filter((event) => event.entityType === "Capability")
    .map((event) => event.entityId);
  const legacy = marked.includes("catalogue");
  const edited = await tx.changeEvent.findMany({
    where: { entityType: "Capability", action: { notIn: SYSTEM_ACTIONS } },
    select: { entityId: true },
    distinct: ["entityId"],
  });
  const demo = await tx.capability.findMany({
    where: {
      id: { notIn: edited.map((event) => event.entityId) },
      OR: [
        { id: { in: marked.filter((id) => id !== "catalogue") } },
        ...(legacy
          ? [
              {
                code: { in: catalogueTopics.map((topic) => topic.code) },
                OR: [
                  { rationale: DEMO_RATIONALE },
                  { currentLevel: null, rationale: null, assessedAt: null },
                ],
              },
            ]
          : []),
      ],
    },
    select: { id: true },
  });
  const ids = demo.map((item) => item.id);
  await tx.capability.updateMany({
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
  });
  await tx.capabilityIndicator.updateMany({
    where: { capabilityId: { in: ids } },
    data: { value: null, measuredAt: null, updatedById: null },
  });
  // Delete only IDs the seed recorded as creating, never a matching name.
  const functions = markers
    .filter((event) => event.entityType === "OrganizationalFunction")
    .map((event) => event.entityId);
  const removed = await tx.organizationalFunction.deleteMany({
    where: { id: { in: functions }, accountableFor: { none: {} } },
  });
  await tx.changeEvent.create({
    data: {
      action: DEMO_CLEARED_ACTION,
      entityType: "Demo",
      entityId: "catalogue",
      details: { cleared: ids.length },
    },
  });
  return { cleared: ids.length, removedFunctions: removed.count };
}
