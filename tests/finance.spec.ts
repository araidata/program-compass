import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { database } from "../scripts/database";
import { authenticationDisabled } from "../src/lib/auth-mode";
import { loginPage, signIn } from "./helpers";
test("two saved scenarios isolate timing/funding, reconcile Decimal costs and freeze captures", async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(240_000);
  if (!authenticationDisabled) {
    await loginPage(page);
    await signIn(request);
  }
  const client = database();
  const run = randomUUID();
  const ids: string[] = [];
  let initiativeId = "";
  let positionId = "";
  let objectiveId = "",
    responsibilityId = "",
    issueId = "",
    technologyId = "",
    activityId = "",
    personId = "";
  let cycleId: string | undefined;
  async function create(kind: string, values: unknown) {
    const r = await request.post("/api/finance", { data: { kind, values } });
    expect(r.status(), await r.text()).toBe(201);
    const id = (await r.json()).data.id;
    ids.push(id);
    return id;
  }
  try {
    const methods = (await (await request.get("/api/methods")).json()).data;
    const cap = await client.capability.findUniqueOrThrow({
      where: { code: "GV.01" },
    });
    const pillar = await client.pillar.findFirstOrThrow();
    const position = await client.position.create({
      data: {
        title: `Synthetic financial position ${run}`,
        pillarId: pillar.id,
        state: "proposed",
        fte: 1,
        annualCost: 12000,
        currency: "USD",
        startYear: 2027,
      },
    });
    positionId = position.id;
    const owner = await client.person.create({
      data: {
        name: `Synthetic integrated owner ${run}`,
        title: "Planning owner",
      },
    });
    personId = owner.id;
    const objective = await client.businessObjective.create({
      data: {
        title: `Synthetic integrated objective ${run}`,
        rationale: "Prioritize continuity investment from a business service",
        priority: 4,
        ownerId: personId,
        capabilities: { create: { capabilityId: cap.id } },
      },
    });
    objectiveId = objective.id;
    const fn = await client.organizationalFunction.findFirstOrThrow({
      where: { pillarId: pillar.id },
    });
    const responsibility = await client.responsibility.create({
      data: {
        title: `Synthetic integrated responsibility ${run}`,
        description: "Operate the supported service",
        source: "Synthetic business driver",
        functionId: fn.id,
        ownerId: personId,
        positions: { connect: [{ id: positionId }] },
        capabilities: { connect: [{ id: cap.id }] },
      },
    });
    responsibilityId = responsibility.id;
    const req = await client.frameworkRequirement.findFirstOrThrow({
      where: { kind: "subcategory" },
    });
    const tech = await client.technology.create({
      data: {
        title: `Synthetic integrated technology ${run}`,
        vendor: "Synthetic",
        category: "Service continuity",
        description: "Planning option",
        source: "Synthetic sourced quote",
        alternatives: "Existing service lacks coverage",
        decision: "acquisition",
        state: "proposed",
        ownerId: personId,
        startDate: new Date("2027-01-01"),
        annualLicenseCost: 0,
        annualOperatingCost: 0,
        implementationCost: 0,
        currency: "USD",
        capabilities: { connect: [{ id: cap.id }] },
        requirements: { connect: [{ id: req.id }] },
        responsibilities: { connect: [{ id: responsibilityId }] },
      },
    });
    technologyId = tech.id;
    const issue = await client.planningIssue.create({
      data: {
        title: `Synthetic integrated deficiency ${run}`,
        description: "Service coverage shortfall",
        source: "Synthetic capability assessment",
        consequence: "Unfunded continuity work remains",
        ownerId: personId,
        openedDate: new Date("2026-01-01"),
        dueDate: new Date("2027-06-30"),
        status: "open",
        capabilities: { connect: [{ id: cap.id }] },
      },
    });
    issueId = issue.id;
    const activity = await client.workActivity.create({
      data: {
        workKey: `integrated-${run}`,
        title: `Synthetic integrated workload ${run}`,
        responsibilityId,
        source: "Synthetic sourced annual service estimate",
        effectiveDate: new Date("2026-11-24"),
        provisional: true,
        year: 2027,
        volume: 10,
        frequency: 12,
        hoursPerUnit: 1,
        fixedHours: 0,
        projectHours: 0,
        growth: 1,
        outsourcedHours: 0,
        automatedHours: 0,
        productiveHoursPerFte: 1000,
        workType: "run",
        capabilities: { connect: [{ id: cap.id }] },
        requirements: { connect: [{ id: req.id }] },
      },
    });
    activityId = activity.id;
    const initiative = await client.initiative.create({
      data: {
        title: `Synthetic financial initiative ${run}`,
        description: "Synthetic business investment",
        justification: "Improve business capability",
        outcomes: "Close gap",
        deferral: "Gap persists",
        investmentState: "approved",
        status: "planned",
        priority: 4,
        startDate: new Date("2027-01-01"),
        endDate: new Date("2027-06-30"),
        oneTimeCost: 120,
        recurringCost: 1200,
        currency: "USD",
        positions: { connect: [{ id: positionId }] },
        objectives: { connect: [{ id: objectiveId }] },
        issues: { connect: [{ id: issueId }] },
        technologies: { connect: [{ id: technologyId }] },
        requirements: { connect: [{ id: req.id }] },
        ownerId: personId,
        capabilities: {
          create: {
            capabilityId: cap.id,
            uplift: 1,
            rationale: "Synthetic estimate",
          },
        },
      },
    });
    initiativeId = initiative.id;
    const base = {
      title: `Synthetic funded ${run}`,
      kind: "target-maturity",
      source: "Synthetic scenario basis",
      methodVersionId: methods.id,
      startYear: 2027,
      fiscalStartMonth: 1,
      currency: "USD",
      active: true,
    };
    const s1 = await create("scenario", base);
    const s2 = await create("scenario", {
      ...base,
      title: `Synthetic deferred ${run}`,
      kind: "alternative-funding",
    });
    const member = {
      title: `Synthetic initiative membership ${run}`,
      scenarioId: s1,
      initiativeId,
      positionId: null,
      technologyId: null,
      included: true,
      startDate: "2027-01-01",
      endDate: "2027-06-30",
      source: "Synthetic schedule",
      deferral: "Capability gap persists while deferred",
    };
    const m1 = await create("item", member);
    await create("item", {
      ...member,
      title: `Synthetic technology inclusion ${run}`,
      initiativeId: null,
      technologyId,
      endDate: null,
    });
    await create("item", {
      ...member,
      scenarioId: s2,
      startDate: "2028-01-01",
      endDate: "2028-06-30",
    });
    await create("item", {
      ...member,
      title: `Synthetic position membership ${run}`,
      initiativeId: null,
      positionId,
      endDate: null,
    });
    await create("budget", {
      title: `Synthetic budget ${run}`,
      scenarioId: s1,
      year: 2027,
      amount: "100.00",
      source: "Synthetic funding limit",
    });
    await create("target", {
      title: `Synthetic annual target ${run}`,
      scenarioId: s1,
      capabilityId: cap.id,
      year: 2027,
      level: 4,
      source: "Synthetic target",
    });
    const duplicate = await request.post("/api/finance", {
      data: { kind: "item", values: member },
    });
    expect(duplicate.status()).toBe(409);
    const outside = await request.post("/api/finance", {
      data: {
        kind: "target",
        values: {
          title: "Invalid outside horizon",
          scenarioId: s1,
          capabilityId: cap.id,
          year: 2032,
          level: 4,
          source: "Synthetic invalid",
        },
      },
    });
    expect(outside.status()).toBe(400);
    const cost = {
      title: `Synthetic training ${run}`,
      identity: `additional:${run}`,
      initiativeId,
      positionId: null,
      technologyId: null,
      capabilityId: null,
      component: "additional",
      category: "training",
      frequency: "once",
      amount: "0.10",
      currency: "USD",
      startDate: "2027-01-01",
      endDate: null,
      escalationPercent: 0,
      baseline: false,
      saving: false,
      source: "Synthetic training quote",
      active: true,
    };
    await create("cost", cost);
    expect(
      (
        await request.post("/api/finance", {
          data: { kind: "cost", values: cost },
        })
      ).status(),
    ).toBe(409);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/roadmap/plan?scenario=${s1}&compare=${s2}`);
    await expect(
      page.getByRole("heading", { name: base.title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "EXCEEDED", exact: false }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Costs", exact: true }).click();
    const costrow = page.getByRole("row").filter({
      has: page.getByRole("button", { name: cost.title, exact: true }),
    });
    await expect(costrow).toContainText("0.10");
    await page.getByRole("button", { name: cost.title, exact: true }).click();
    await page
      .getByLabel("Amount (exact decimal; blank = unknown)", { exact: true })
      .fill("0.20");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole("row").filter({
        has: page.getByRole("button", { name: cost.title, exact: true }),
      }),
    ).toContainText("0.20");
    await page
      .getByRole("button", { name: "Constraints", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Infeasibility, incomplete inputs and unfunded requirements",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/2027: known costs.*exceed limit/),
    ).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export planning CSV" }).click();
    expect((await download).suggestedFilename()).toContain(s1);
    const before = await client.initiative.findUniqueOrThrow({
      where: { id: initiativeId },
    });
    const finance = (await (await request.get("/api/finance")).json()).data;
    const m = finance.rows.find((r: { id: string }) => r.id === m1);
    expect(
      (
        await request.patch(`/api/finance/${m1}`, {
          data: { kind: "item", revision: "stale", values: m.values },
        })
      ).status(),
    ).toBe(409);
    const leadership = await request.get(
      `/api/reports?pack=management&scenario=${s1}`,
    );
    expect(leadership.status(), await leadership.text()).toBe(200);
    const pack = (await leadership.json()).data;
    for (const title of [
      objective.title,
      responsibility.title,
      issue.title,
      tech.title,
      activity.title,
    ])
      expect(JSON.stringify(pack.sections)).toContain(title);
    const restore = execFileSync(
      process.execPath,
      [
        "--conditions=react-server",
        "--import",
        "tsx",
        "tests/relational-restore.mts",
      ],
      {
        env: { ...process.env, RUN_DATABASE_TESTS: "true" },
        encoding: "utf8",
        timeout: 120000,
      },
    );
    expect(restore).toContain('"result":"passed"');
    const capture = await request.post("/api/cycles", {
      data: {
        name: `Synthetic financial cycle ${run}`,
        notes: "Freeze funding and costs",
      },
    });
    expect(capture.status(), await capture.text()).toBe(201);
    cycleId = (await capture.json()).data.id;
    expect(
      (
        await request.patch(`/api/finance/${m1}`, {
          data: {
            kind: "item",
            revision: m.revision,
            values: {
              ...m.values,
              startDate: "2029-01-01",
              endDate: "2029-06-30",
            },
          },
        })
      ).status(),
    ).toBe(200);
    await page.goto(
      `/roadmap/plan?scenario=${s1}&cycle=${cycleId}&view=resources`,
    );
    await expect(
      page.getByText(/Included · 2027-01-01 → 2027-06-30/),
    ).toBeVisible();
    await page.getByRole("button", { name: member.title, exact: true }).click();
    await expect(
      page.getByLabel("Activation / implementation start", { exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByLabel("Activation / implementation start", { exact: true }),
    ).toHaveValue("2027-01-01");
    expect(
      (
        await client.initiative.findUniqueOrThrow({
          where: { id: initiativeId },
        })
      ).startDate?.toISOString(),
    ).toBe(before.startDate?.toISOString());
    expect(
      (await client.capability.findUniqueOrThrow({ where: { id: cap.id } }))
        .currentLevel,
    ).toBe(cap.currentLevel);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.screenshot({
      path: testInfo.outputPath("scenario-1280.png"),
      fullPage: true,
    });
  } finally {
    if (cycleId) await client.planningCycle.delete({ where: { id: cycleId } });
    await client.changeEvent.deleteMany({
      where: { entityId: { in: [...ids, ...(cycleId ? [cycleId] : [])] } },
    });
    await client.scenarioItem.deleteMany({ where: { id: { in: ids } } });
    await client.annualCapabilityTarget.deleteMany({
      where: { id: { in: ids } },
    });
    await client.scenarioBudget.deleteMany({ where: { id: { in: ids } } });
    await client.financialCost.deleteMany({ where: { id: { in: ids } } });
    await client.planningScenario.deleteMany({ where: { id: { in: ids } } });
    if (initiativeId)
      await client.initiative.delete({ where: { id: initiativeId } });
    if (activityId)
      await client.workActivity.delete({ where: { id: activityId } });
    if (technologyId)
      await client.technology.delete({ where: { id: technologyId } });
    if (issueId) await client.planningIssue.delete({ where: { id: issueId } });
    if (responsibilityId)
      await client.responsibility.delete({ where: { id: responsibilityId } });
    if (objectiveId)
      await client.businessObjective.delete({ where: { id: objectiveId } });
    if (positionId) await client.position.delete({ where: { id: positionId } });
    if (personId) await client.person.delete({ where: { id: personId } });
    await client.$disconnect();
  }
});
