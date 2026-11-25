import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { database } from "../scripts/database";
import { authenticationDisabled } from "../src/lib/auth-mode";
import { loginPage, signIn } from "./helpers";
test("method versions, captured context/people and shared cycle selection preserve historical facts", async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);
  if (!authenticationDisabled) {
    await loginPage(page);
    await signIn(request);
  }
  const client = database();
  const run = randomUUID();
  const versionIds: string[] = [];
  let cycleId = "";
  let objectiveId = "";
  let personId = "";
  const initial = (await (await request.get("/api/methods")).json()).data;
  try {
    const person = await client.person.create({
      data: { name: `Synthetic historic owner ${run}`, title: "Owner" },
    });
    personId = person.id;
    const objective = await client.businessObjective.create({
      data: {
        title: `Synthetic original objective ${run}`,
        rationale: "Snapshot planning decision",
        priority: 3,
        ownerId: person.id,
      },
    });
    objectiveId = objective.id;
    const values = structuredClone(initial.values);
    values.levels[0].name = `Captured initial ${run.slice(0, 8)}`;
    values.reviewDueMonths = 2;
    values.reviewOverdueMonths = 4;
    const saved = await request.post("/api/methods", {
      data: {
        values,
        basis: `Synthetic method fixture ${run}`,
        effectiveDate: "2026-11-24",
        provisional: true,
        revision: initial.id,
      },
    });
    expect(saved.status()).toBe(201);
    const first = (await saved.json()).data.id;
    versionIds.push(first);
    const stale = await request.post("/api/methods", {
      data: {
        values,
        basis: "Stale fixture",
        effectiveDate: "2026-11-24",
        provisional: true,
        revision: initial.id,
      },
    });
    expect(stale.status()).toBe(409);
    const capture = await request.post("/api/cycles", {
      data: { name: `Synthetic full cycle ${run}`, notes: null },
    });
    expect(capture.status()).toBe(201);
    cycleId = (await capture.json()).data.id;
    const secondValues = structuredClone(values);
    secondValues.levels[0].name = "Changed live definition";
    const changed = await request.post("/api/methods", {
      data: {
        values: secondValues,
        basis: `Synthetic second method ${run}`,
        effectiveDate: "2026-11-24",
        provisional: true,
        revision: first,
      },
    });
    expect(changed.status()).toBe(201);
    versionIds.push((await changed.json()).data.id);
    await client.businessObjective.update({
      where: { id: objective.id },
      data: { title: `Changed live objective ${run}` },
    });
    await client.person.update({
      where: { id: person.id },
      data: { name: `Changed live owner ${run}` },
    });
    await page.goto(`/capabilities?cycle=${cycleId}`);
    await expect(
      page
        .getByRole("cell", { name: `1 ${values.levels[0].name}`, exact: true })
        .first(),
    ).toBeVisible();
    const cycle = await client.planningCycle.findUniqueOrThrow({
      where: { id: cycleId },
    });
    const dataset = cycle.dataset as {
      methods: { id: string; values: { levels: { name: string }[] } };
    };
    expect(dataset.methods.id).toBe(first);
    expect(dataset.methods.values.levels[0].name).toBe(values.levels[0].name);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Business Context", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`cycle=${cycleId}`));
    await expect(
      page.getByRole("heading", { name: objective.title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add objective", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Workforce", exact: true })
      .click();
    await page.goto(`/workforce?cycle=${cycleId}&view=people`);
    await expect(
      page.getByRole("button", { name: person.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: person.name, exact: true }),
    ).toBeDisabled();
    await page.goto("/settings");
    await expect(
      page.getByRole("textbox", { name: "Level 1 name", exact: true }),
    ).toHaveValue("Changed live definition");
  } finally {
    if (cycleId) {
      await client.changeEvent.deleteMany({
        where: { entityType: "PlanningCycle", entityId: cycleId },
      });
      await client.planningCycle.delete({ where: { id: cycleId } });
    }
    if (objectiveId)
      await client.businessObjective.delete({ where: { id: objectiveId } });
    if (personId) await client.person.delete({ where: { id: personId } });
    await client.changeEvent.deleteMany({
      where: {
        entityType: "PlanningMethodVersion",
        entityId: { in: versionIds },
      },
    });
    await client.planningMethodVersion.deleteMany({
      where: { id: { in: versionIds } },
    });
    await client.$disconnect();
  }
});
