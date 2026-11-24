import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { database } from "../scripts/database";
import { authenticationDisabled } from "../src/lib/auth-mode";
import { loginPage } from "./helpers";
test("business objectives and threats persist, matrix and reciprocal capability links reconcile", async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(90_000);
  if (!authenticationDisabled) await loginPage(page);
  const run = randomUUID();
  const objectiveName = `Synthetic service continuity ${run}`;
  const threatName = `Synthetic disruption ${run}`;
  const client = database();
  const capability = await client.capability.findUniqueOrThrow({
    where: { code: "GV.01" },
  });
  try {
    await page.goto("/context");
    await page
      .getByRole("button", { name: "Add objective", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Objective", exact: true })
      .fill(objectiveName);
    await page
      .getByRole("textbox", {
        name: "Business rationale and planning decision",
        exact: true,
      })
      .fill("Prioritize continuity investment for critical services.");
    await page.getByRole("checkbox", { name: /GV.01/ }).check();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: objectiveName, exact: true }),
    ).toBeVisible();
    await client.businessObjective.findFirstOrThrow({
      where: { title: objectiveName },
    });
    await page.goto("/context?view=threats");
    await page.getByRole("button", { name: "Add threat", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Threat title", exact: true })
      .fill(threatName);
    await page
      .getByRole("textbox", { name: "Business threat scenario", exact: true })
      .fill("Critical service is unavailable, affecting operational delivery.");
    await page
      .getByRole("textbox", {
        name: "Estimate basis, source and planning consequence",
        exact: true,
      })
      .fill(
        "Synthetic planning estimate: prioritize service resilience investment.",
      );
    await page
      .getByRole("checkbox", { name: objectiveName, exact: true })
      .check();
    await page.getByRole("checkbox", { name: /GV.01/ }).check();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await client.businessThreat.findFirstOrThrow({
      where: { title: threatName },
    });
    await page.goto(
      `/context?view=matrix&search=${encodeURIComponent("Synthetic")}`,
    );
    await expect(
      page.getByRole("cell", { name: "Linked", exact: true }).first(),
    ).toBeVisible();
    await page.goto(`/capabilities?topic=${capability.id}`);
    await expect(
      page.getByRole("link", { name: objectiveName, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: threatName, exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: objectiveName, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: objectiveName, exact: true }),
    ).toBeVisible();
    const invalid = await request.post("/api/context", {
      data: {
        kind: "threat",
        values: {
          title: "Invalid",
          scenario: "Invalid",
          basis: "Invalid",
          likelihood: 7,
          impact: 1,
          active: true,
          objectiveIds: [],
          capabilityIds: [],
        },
      },
    });
    expect(invalid.status()).toBe(400);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV", exact: true }).click();
    expect((await download).suggestedFilename()).toBe(
      "business-objectives.csv",
    );
    await page.screenshot({
      path: testInfo.outputPath("context.png"),
      fullPage: true,
    });
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("aside")).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: objectiveName, exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("context-print.png"),
      fullPage: true,
    });
  } finally {
    const threats = await client.businessThreat.findMany({
      where: { title: threatName },
      select: { id: true },
    });
    const objectives = await client.businessObjective.findMany({
      where: { title: objectiveName },
      select: { id: true },
    });
    await client.changeEvent.deleteMany({
      where: {
        entityType: { in: ["BusinessObjective", "BusinessThreat"] },
        entityId: { in: [...objectives, ...threats].map((r) => r.id) },
      },
    });
    await client.businessThreat.deleteMany({
      where: { id: { in: threats.map((t) => t.id) } },
    });
    await client.businessObjective.deleteMany({
      where: { id: { in: objectives.map((o) => o.id) } },
    });
    await client.$disconnect();
  }
});
