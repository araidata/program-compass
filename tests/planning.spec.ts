import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { database } from "../scripts/database";
import { authenticationDisabled } from "../src/lib/auth-mode";
import { loginPage, signIn } from "./helpers";
test("deficiency-to-responsibility-to-initiative/technology links persist, reject cycles/stale edits and preserve assessments", async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(90_000);
  if (!authenticationDisabled) {
    await loginPage(page);
    await signIn(request);
  }
  const client = database();
  const run = randomUUID();
  const ids: string[] = [];
  const cap = await client.capability.findUniqueOrThrow({
    where: { code: "GV.01" },
  });
  const fn = await client.organizationalFunction.findFirstOrThrow();
  let ownerId = "";
  async function create(kind: string, values: unknown) {
    const r = await request.post("/api/planning", { data: { kind, values } });
    expect(r.status(), await r.text()).toBe(201);
    const id = (await r.json()).data.id;
    ids.push(id);
    return id;
  }
  const base = {
    title: `Synthetic planning ${run}`,
    description: "Synthetic linked strategic planning record",
    ownerId: null as string | null,
    capabilityIds: [cap.id],
    requirementIds: [],
  };
  const initiativeValues = {
    ...base,
    title: `Synthetic initiative ${run}`,
    justification: "Invest in capability improvement",
    outcomes: "Improve resilience",
    deferral: "Capability gap persists",
    investmentState: "approved",
    status: "planned",
    priority: 4,
    startDate: "2027-01-01",
    endDate: "2027-06-01",
    effortHours: 20,
    oneTimeCost: 0,
    recurringCost: 0,
    currency: "USD",
    issueIds: [],
    objectiveIds: [],
    positionIds: [],
    technologyIds: [],
    dependencyIds: [],
  };
  try {
    const owner = await client.person.create({
      data: { name: `Synthetic planning owner ${run}`, title: "Owner" },
    });
    ownerId = owner.id;
    base.ownerId = ownerId;
    initiativeValues.ownerId = ownerId;
    const responsibility = await create("responsibility", {
      ...base,
      title: `Synthetic responsibility ${run}`,
      source: "Synthetic source",
      functionId: fn.id,
      positionIds: [],
      active: true,
    });
    const issue = await create("issue", {
      ...base,
      title: `Synthetic issue ${run}`,
      source: "Synthetic external reference",
      consequence: "Delaying investment leaves the maturity gap",
      openedDate: "2025-01-01",
      dueDate: "2025-02-01",
      status: "open",
      initiativeIds: [],
    });
    const technology = await create("technology", {
      ...base,
      title: `Synthetic technology ${run}`,
      vendor: "Synthetic vendor",
      category: "Monitoring",
      source: "Synthetic organization estimate",
      alternatives: "Optimize existing coverage before acquisition",
      deficiencyType: "underutilization",
      state: "existing",
      coveragePercent: 60,
      utilizationPercent: 30,
      startDate: "2026-01-01",
      renewalDate: "2027-01-01",
      annualLicenseCost: 0,
      annualOperatingCost: 0,
      implementationCost: 0,
      currency: "USD",
      responsibilityIds: [responsibility],
      dependencyIds: [],
    });
    const initiative = await create("initiative", {
      ...initiativeValues,
      issueIds: [issue],
      technologyIds: [technology],
    });
    const second = await create("initiative", {
      ...initiativeValues,
      title: `Synthetic dependent ${run}`,
      dependencyIds: [initiative],
    });
    let data = (await (await request.get("/api/planning")).json()).data;
    let row = data.rows.find((r: { id: string }) => r.id === initiative);
    const cycle = await request.patch(`/api/planning/${initiative}`, {
      data: {
        kind: "initiative",
        values: { ...row.values, dependencyIds: [second] },
        revision: row.revision,
      },
    });
    expect(cycle.status()).toBe(400);
    const stale = await request.patch(`/api/planning/${initiative}`, {
      data: { kind: "initiative", values: row.values, revision: "stale" },
    });
    expect(stale.status()).toBe(409);
    const uplift = await request.patch(`/api/planning/${initiative}/uplift`, {
      data: {
        capabilityId: cap.id,
        uplift: 2,
        rationale: "Synthetic expected improvement, not an assessment",
        revision: row.revision,
      },
    });
    expect(uplift.status()).toBe(200);
    data = (await (await request.get("/api/planning")).json()).data;
    row = data.rows.find((r: { id: string }) => r.id === initiative);
    const complete = await request.patch(`/api/planning/${initiative}`, {
      data: {
        kind: "initiative",
        values: { ...row.values, status: "completed" },
        revision: row.revision,
      },
    });
    expect(complete.status()).toBe(200);
    expect(
      (await client.capability.findUniqueOrThrow({ where: { id: cap.id } }))
        .currentLevel,
    ).toBe(cap.currentLevel);
    const issueHistory = await request.get(`/api/planning/${issue}/history`);
    expect(issueHistory.status()).toBe(200);
    expect((await issueHistory.json()).data[0].details.after.title).toBe(
      `Synthetic issue ${run}`,
    );
    await page.goto(`/capabilities/planning?view=issue&search=${run}`);
    await expect(
      page.getByRole("button", { name: `Synthetic issue ${run}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: /Overdue/ })).toBeVisible();
    await page.goto(`/capabilities?topic=${cap.id}`);
    await expect(
      page.getByRole("link", {
        name: `Synthetic responsibility ${run} · responsibility`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: `Synthetic initiative ${run} · initiative`,
        exact: true,
      }),
    ).toBeVisible();
    await page.goto(`/roadmap?mode=timeline&search=${run}`);
    await expect(
      page.getByRole("heading", { name: "Initiative timeline", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", {
        name: new RegExp(`Synthetic initiative ${run}`),
      }),
    ).toBeVisible();
    await page.goto(`/technology?search=${run}`);
    await expect(
      page.getByRole("button", {
        name: `Synthetic technology ${run}`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Existing coverage and overlap" }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("technology.png"),
      fullPage: true,
    });
  } finally {
    await client.changeEvent.deleteMany({
      where: {
        entityId: { in: ids },
        entityType: {
          in: ["responsibility", "planningIssue", "initiative", "technology"],
        },
      },
    });
    await client.initiative.deleteMany({ where: { id: { in: ids } } });
    await client.technology.deleteMany({ where: { id: { in: ids } } });
    await client.planningIssue.deleteMany({ where: { id: { in: ids } } });
    await client.responsibility.deleteMany({ where: { id: { in: ids } } });
    if (ownerId) await client.person.delete({ where: { id: ownerId } });
    await client.$disconnect();
  }
});
