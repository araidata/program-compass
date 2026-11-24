import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { database } from "../scripts/database";
import { authenticationDisabled } from "../src/lib/auth-mode";
import { loginPage } from "./helpers";

test("person, reporting line, vacancy and ownership persist; stale edits and cycles are rejected", async ({
  page,
  request,
}, testInfo) => {
  if (!authenticationDisabled) await loginPage(page);
  test.setTimeout(90_000);
  const run = randomUUID();
  const ids: string[] = [];
  const start = new Date();
  const client = database();
  const capability = await client.capability.findUniqueOrThrow({
    where: { code: "GV.01" },
  });
  try {
    await page.goto("/workforce?view=people");
    await page.getByRole("button", { name: "Add person", exact: true }).click();
    await page
      .getByLabel("Name", { exact: true })
      .fill(`Synthetic manager ${run}`);
    await page.getByLabel("Title", { exact: true }).fill("Program manager");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    const person = await client.person.findFirstOrThrow({
      where: { name: `Synthetic manager ${run}` },
    });
    ids.push(person.id);
    await page.reload();
    await expect(
      page.getByRole("button", { name: person.name, exact: true }),
    ).toBeVisible();
    const child = await client.person.create({
      data: {
        name: `Synthetic analyst ${run}`,
        title: "Analyst",
        managerId: person.id,
      },
    });
    ids.push(child.id);
    const input = {
      kind: "person",
      revision: person.updatedAt.toISOString(),
      values: {
        name: person.name,
        title: person.title,
        managerId: child.id,
        active: true,
      },
    };
    const cycle = await request.patch(`/api/workforce/${person.id}`, {
      data: input,
    });
    expect(cycle.status()).toBe(400);
    const stale = await request.patch(`/api/workforce/${person.id}`, {
      data: {
        ...input,
        revision: "stale",
        values: { ...input.values, managerId: null },
      },
    });
    expect(stale.status()).toBe(409);
    await page.goto("/workforce");
    await page
      .getByRole("button", { name: "Add position", exact: true })
      .click();
    await page
      .getByLabel("Position title", { exact: true })
      .fill(`Synthetic vacant role ${run}`);
    await page
      .getByRole("combobox", { name: "Position state", exact: true })
      .selectOption("authorized");
    await page.getByLabel("Position FTE", { exact: true }).fill("0.5");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", {
        name: `Synthetic vacant role ${run}`,
        exact: true,
      }),
    ).toBeVisible();
    await page.goto(`/capabilities?topic=${capability.id}`);
    await page
      .getByRole("combobox", { name: "Accountable person", exact: true })
      .selectOption(person.id);
    await expect
      .poll(
        async () =>
          (
            await client.capability.findUniqueOrThrow({
              where: { id: capability.id },
            })
          ).ownerPersonId,
      )
      .toBe(person.id);
    await page.goto(`/workforce?view=ownership&person=${person.id}`);
    await expect(page.getByRole("link", { name: /GV.01/ })).toBeVisible();
    await page.getByLabel("Include reports").check();
    await expect(page).toHaveURL(/rollup=true/);
    await page.screenshot({
      path: testInfo.outputPath("workforce.png"),
      fullPage: true,
    });
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("aside")).not.toBeVisible();
    await expect(page.getByRole("link", { name: /GV.01/ })).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("workforce-print.png"),
      fullPage: true,
    });
  } finally {
    await client.capability.update({
      where: { id: capability.id },
      data: { ownerPersonId: capability.ownerPersonId },
    });
    await client.changeEvent.deleteMany({
      where: {
        createdAt: { gte: start },
        OR: [
          { entityType: "Person", entityId: { in: ids } },
          {
            entityType: "Position",
            entityId: {
              in: (
                await client.position.findMany({
                  where: { title: `Synthetic vacant role ${run}` },
                  select: { id: true },
                })
              ).map((p) => p.id),
            },
          },
          {
            entityType: "Capability",
            entityId: capability.id,
            action: "capability.assessed",
            details: { path: ["ownerPersonId"], equals: ids[0] ?? "missing" },
          },
        ],
      },
    });
    await client.position.deleteMany({
      where: { title: `Synthetic vacant role ${run}` },
    });
    await client.person.updateMany({
      where: { id: { in: ids } },
      data: { managerId: null },
    });
    await client.person.deleteMany({ where: { id: { in: ids } } });
    await client.$disconnect();
  }
});

test("captured cycles preserve scores and KPI values and remain read only", async ({
  page,
  request,
}) => {
  if (!authenticationDisabled) await loginPage(page);
  const name = `Synthetic cycle ${randomUUID()}`;
  const client = database();
  let cycleId = "";
  const before = await client.capability.findUniqueOrThrow({
    where: { code: "GV.01" },
  });
  try {
    await page.goto("/capabilities");
    await page.getByRole("button", { name: "Capture cycle" }).click();
    await page.getByLabel("Cycle name", { exact: true }).fill(name);
    await page.getByRole("button", { name: "Save snapshot" }).click();
    await expect(
      page.getByLabel("Cycle name", { exact: true }),
    ).not.toBeVisible();
    const cycle = await client.planningCycle.findFirstOrThrow({
      where: { name },
      include: { snapshots: true },
    });
    cycleId = cycle.id;
    expect(cycle.snapshots).toHaveLength(30);
    const snapshot = cycle.snapshots.find((s) => s.capabilityId === before.id)!
      .assessment as {
      currentLevel: number | null;
      scaleVersion: string;
      indicators: unknown[];
    };
    expect(snapshot.currentLevel).toBe(before.currentLevel);
    expect(snapshot.scaleVersion).toBeTruthy();
    expect(snapshot.indicators.length).toBeGreaterThanOrEqual(2);
    await client.capability.update({
      where: { id: before.id },
      data: { currentLevel: before.currentLevel === 5 ? 1 : 5 },
    });
    await page
      .getByRole("combobox", { name: "Planning cycle", exact: true })
      .selectOption(cycle.id);
    await expect(page).toHaveURL(new RegExp(`cycle=${cycle.id}`));
    await expect(page.getByText(/Historical snapshot/)).toBeVisible();
    await page.goto(`/capabilities?cycle=${cycle.id}&topic=${before.id}`);
    await expect(
      page.getByRole("combobox", { name: "Accountable person", exact: true }),
    ).toBeDisabled();
    const result = await request.get(`/api/cycles/${cycle.id}`);
    expect(result.status()).toBe(200);
    await page.reload();
    await expect(page.getByText(/Historical snapshot/)).toBeVisible();
  } finally {
    await client.capability.update({
      where: { id: before.id },
      data: { currentLevel: before.currentLevel },
    });
    if (cycleId) {
      await client.changeEvent.deleteMany({
        where: { entityType: "PlanningCycle", entityId: cycleId },
      });
      await client.planningCycle.delete({ where: { id: cycleId } });
    }
    await client.$disconnect();
  }
});
