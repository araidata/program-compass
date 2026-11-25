import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { database } from "../scripts/database";
import { authenticationDisabled } from "../src/lib/auth-mode";
import { loginPage, signIn } from "./helpers";
test("sourced workload, dated capacity, skills and position justification persist without duplicate demand", async ({
  page,
  request,
  browser,
}, testInfo) => {
  test.setTimeout(120_000);
  if (!authenticationDisabled) {
    await loginPage(page);
    await signIn(request);
  }
  const client = database();
  const run = randomUUID();
  const ids: string[] = [];
  let cycleId: string | undefined;
  let personId = "";
  let positionId = "";
  let proposalId = "";
  let responsibilityId = "";
  async function create(kind: string, values: unknown) {
    const r = await request.post("/api/capacity", { data: { kind, values } });
    expect(r.status(), await r.text()).toBe(201);
    const id = (await r.json()).data.id;
    ids.push(id);
    return id;
  }
  try {
    const pillar = await client.pillar.findFirstOrThrow();
    const fn = await client.organizationalFunction.findFirstOrThrow({
      where: { pillarId: pillar.id },
    });
    const caps = await client.capability.findMany({ take: 2 });
    const req = await client.frameworkRequirement.findFirstOrThrow({
      where: { kind: "subcategory" },
    });
    const skill = await client.niceElement.findFirstOrThrow({
      where: { kind: "skill" },
    });
    const person = await client.person.create({
      data: { name: `Synthetic capacity person ${run}`, title: "Engineer" },
    });
    personId = person.id;
    const position = await client.position.create({
      data: {
        title: `Synthetic authorized position ${run}`,
        pillarId: pillar.id,
        personId,
        state: "authorized",
        fte: 1,
      },
    });
    positionId = position.id;
    const proposal = await client.position.create({
      data: {
        title: `Synthetic proposal ${run}`,
        pillarId: pillar.id,
        state: "proposed",
        fte: 1,
        annualCost: 123456,
        currency: "USD",
        startYear: 2027,
        justification:
          "Unique sourced demand exceeds available productive capacity",
      },
    });
    proposalId = proposal.id;
    const responsibility = await client.responsibility.create({
      data: {
        title: `Synthetic capacity responsibility ${run}`,
        description: "Service",
        source: "Synthetic business objective",
        functionId: fn.id,
        ownerId: personId,
        positions: { connect: [{ id: positionId }, { id: proposalId }] },
        capabilities: { connect: caps.map((c) => ({ id: c.id })) },
        requirements: { connect: [{ id: req.id }] },
      },
    });
    responsibilityId = responsibility.id;
    const activity = {
      title: `Synthetic work ${run}`,
      workKey: `fixture-${run}`,
      source: "Synthetic service-volume estimate, hours/year",
      active: true,
      responsibilityId,
      effectiveDate: "2026-11-24",
      provisional: true,
      year: 2027,
      volume: 100,
      frequency: 12,
      hoursPerUnit: 1,
      fixedHours: 200,
      projectHours: 100,
      growth: 1,
      outsourcedHours: 100,
      automatedHours: 100,
      productiveHoursPerFte: 1000,
      workType: "run",
      capabilityIds: caps.map((c) => c.id),
      requirementIds: [req.id],
      niceIds: [skill.id],
    };
    const activityId = await create("activity", activity);
    const assignment = {
      title: `Synthetic assignment ${run}`,
      source: "Synthetic capacity estimate, annual hours per FTE",
      active: true,
      positionId,
      personId,
      responsibilityId,
      startDate: "2027-01-01",
      endDate: "2027-12-31",
      allocatedFte: 0.5,
      paidHours: 2000,
      productiveHours: 1000,
      runShare: 0.8,
    };
    await create("assignment", assignment);
    const over = await request.post("/api/capacity", {
      data: {
        kind: "assignment",
        values: { ...assignment, allocatedFte: 0.6 },
      },
    });
    expect(over.status()).toBe(400);
    const duplicate = await request.post("/api/capacity", {
      data: { kind: "activity", values: activity },
    });
    expect(duplicate.status()).toBe(409);
    const bad = await request.post("/api/capacity", {
      data: {
        kind: "activity",
        values: {
          ...activity,
          workKey: `invalid-${run}`,
          automatedHours: 10000,
        },
      },
    });
    expect(bad.status()).toBe(400);
    await create("skill", {
      title: `Synthetic skill ${run}`,
      source: "Synthetic observed skill",
      active: true,
      personId,
      niceElementId: skill.id,
      currentLevel: 3,
      targetLevel: 4,
      assessedDate: "2026-11-24",
      notes: "Organization skill scale",
    });
    await create("constraint", {
      title: `Synthetic continuity ${run}`,
      source: "Synthetic service continuity requirement",
      active: true,
      responsibilityId,
      conflictingResponsibilityId: null,
      kind: "continuity",
      minimumPeople: 2,
      minimumFte: null,
      niceElementId: null,
      minimumSkill: null,
      consequence: "No backup operator",
      alternatives: "Managed service or cross-training",
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(
      `/workforce/planning?responsibility=${responsibilityId}&year=2027`,
    );
    await expect(
      page.getByRole("button", { name: `Synthetic work ${run}`, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("1,300 hours · 1.3 FTE", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: `Synthetic work ${run}`, exact: true })
      .click();
    await page.getByLabel("Units per occurrence", { exact: true }).fill("110");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByText("1,420 hours · 1.42 FTE", { exact: true }),
    ).toBeVisible();
    const live = (
      await (await request.get("/api/capacity")).json()
    ).data.rows.find((r: { id: string }) => r.id === activityId);
    expect(
      (
        await request.patch(`/api/capacity/${activityId}`, {
          data: { kind: "activity", values: live.values, revision: "stale" },
        })
      ).status(),
    ).toBe(409);
    const downloaded = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV", exact: true }).click();
    expect((await downloaded).suggestedFilename()).toContain(
      "workforce-workload-2027",
    );
    await page.getByRole("button", { name: "Coverage", exact: true }).click();
    await expect(
      page.getByText(/Unmet · 1 qualified\/distinct people/),
    ).toBeVisible();
    await page.getByRole("button", { name: "Skills", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Skills matrix", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: new RegExp(`${skill.identifier}: current 3, target 4`),
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Justifications", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: `${proposal.title} · position justification`,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        /Managed service or cross-training · Deferral: No backup operator/,
      ),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("position-justification-1280.png"),
      fullPage: true,
    });
    const captured = await request.post("/api/cycles", {
      data: {
        name: `Synthetic capacity cycle ${run}`,
        notes: "Frozen estimates and allocations",
      },
    });
    expect(captured.status(), await captured.text()).toBe(201);
    cycleId = (await captured.json()).data.id;
    expect(
      (
        await request.patch(`/api/capacity/${activityId}`, {
          data: {
            kind: "activity",
            revision: live.revision,
            values: { ...live.values, volume: 200 },
          },
        })
      ).status(),
    ).toBe(200);
    await page.goto(
      `/workforce/planning?cycle=${cycleId}&responsibility=${responsibilityId}&year=2027`,
    );
    await expect(
      page.getByText("1,420 hours · 1.42 FTE", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: `Synthetic work ${run}`, exact: true })
      .click();
    await expect(
      page.getByLabel("Units per occurrence", { exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByLabel("Units per occurrence", { exact: true }),
    ).toHaveValue("110");
    const fresh = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    try {
      const tab = await fresh.newPage();
      if (!authenticationDisabled) await loginPage(tab);
      await tab.goto(
        `/workforce/planning?responsibility=${responsibilityId}&year=2027`,
      );
      await expect(
        tab.getByText("2,500 hours · 2.5 FTE", { exact: true }),
      ).toBeVisible();
      expect(
        await tab.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await tab.screenshot({
        path: testInfo.outputPath("workload-1440.png"),
        fullPage: true,
      });
    } finally {
      await fresh.close();
    }
  } finally {
    if (cycleId) await client.planningCycle.delete({ where: { id: cycleId } });
    await client.changeEvent.deleteMany({
      where: { entityId: { in: [...ids, ...(cycleId ? [cycleId] : [])] } },
    });
    await client.workforceConstraint.deleteMany({ where: { id: { in: ids } } });
    await client.skillObservation.deleteMany({ where: { id: { in: ids } } });
    await client.capacityAssignment.deleteMany({ where: { id: { in: ids } } });
    await client.workActivity.deleteMany({ where: { id: { in: ids } } });
    if (responsibilityId)
      await client.responsibility.delete({ where: { id: responsibilityId } });
    if (positionId || proposalId)
      await client.position.deleteMany({
        where: { id: { in: [positionId, proposalId].filter(Boolean) } },
      });
    if (personId) await client.person.delete({ where: { id: personId } });
    await client.$disconnect();
  }
});
