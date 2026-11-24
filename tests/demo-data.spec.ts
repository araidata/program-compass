import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { database } from "../scripts/database";
import { clearDemoData } from "../scripts/clear-demo-data";
import {
  DEMO_ACTION,
  DEMO_CLEARED_ACTION,
  DEMO_RATIONALE,
} from "../scripts/demo-data";

test("demo cleanup keeps unmarked data, edited topics and existing functions", async () => {
  const client = database();
  const rollback = new Error("Rollback isolated demo cleanup fixture");
  try {
    await client.$transaction(
      async (tx) => {
        const code = randomUUID();
        const create = (suffix: string) =>
          tx.capability.create({
            data: {
              code: `${code}-${suffix}`,
              groupCode: "GV",
              name: `Synthetic cleanup ${suffix}`,
              currentLevel: 2,
              targetLevel: 4,
              rationale: DEMO_RATIONALE,
              indicators: {
                create: {
                  name: "Synthetic cleanup KPI",
                  passThreshold: 90,
                  failThreshold: 70,
                  value: 85,
                },
              },
            },
          });
        const demo = await create("demo");
        const edited = await create("edited");
        const unmarked = await create("unmarked");
        const pillar = await tx.pillar.findFirstOrThrow();
        const existingFunction = await tx.organizationalFunction.create({
          data: { name: `Existing ${code}`, pillarId: pillar.id },
        });
        const demoFunction = await tx.organizationalFunction.create({
          data: { name: `Demo ${code}`, pillarId: pillar.id },
        });
        await tx.changeEvent.createMany({
          data: [
            {
              action: DEMO_ACTION,
              entityType: "Capability",
              entityId: demo.id,
              details: {},
            },
            {
              action: DEMO_ACTION,
              entityType: "Capability",
              entityId: edited.id,
              details: {},
            },
            {
              action: "capability.assessed",
              entityType: "Capability",
              entityId: edited.id,
              details: {},
            },
            {
              action: DEMO_ACTION,
              entityType: "OrganizationalFunction",
              entityId: demoFunction.id,
              details: {},
            },
          ],
        });
        await clearDemoData(tx);
        expect(
          (await tx.capability.findUniqueOrThrow({ where: { id: demo.id } }))
            .currentLevel,
        ).toBeNull();
        expect(
          (await tx.capability.findUniqueOrThrow({ where: { id: edited.id } }))
            .currentLevel,
        ).toBe(2);
        expect(
          (
            await tx.capability.findUniqueOrThrow({
              where: { id: unmarked.id },
            })
          ).currentLevel,
        ).toBe(2);
        expect(
          (
            await tx.capabilityIndicator.findFirstOrThrow({
              where: { capabilityId: demo.id },
            })
          ).value,
        ).toBeNull();
        expect(
          await tx.organizationalFunction.findUnique({
            where: { id: existingFunction.id },
          }),
        ).not.toBeNull();
        expect(
          await tx.organizationalFunction.findUnique({
            where: { id: demoFunction.id },
          }),
        ).toBeNull();
        expect(
          await tx.changeEvent.count({
            where: { action: DEMO_CLEARED_ACTION },
          }),
        ).toBeGreaterThan(0);
        throw rollback;
      },
      { timeout: 60_000 },
    );
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await client.$disconnect();
  }
});
