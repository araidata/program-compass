import { expect, test } from "@playwright/test";
import { fixture, loginPage, signIn } from "./helpers";
import { database } from "../scripts/database";
import { authenticationDisabled } from "../src/lib/auth-mode";

const login = async (page: Parameters<typeof loginPage>[0]) => {
  if (!authenticationDisabled) await loginPage(page);
};

const origin = { Origin: "http://127.0.0.1:3100" };
const startedAt = new Date();

async function topic(code: string) {
  const client = database();
  try {
    return await client.capability.findUniqueOrThrow({
      where: { code },
      include: { indicators: { orderBy: { sortOrder: "asc" } } },
    });
  } finally {
    await client.$disconnect();
  }
}

async function restore(
  code: string,
  data: {
    currentLevel: number | null;
    targetLevel: number | null;
    assessedAt: Date | null;
    assessedById: string | null;
  },
) {
  const client = database();
  try {
    await client.capability.update({
      where: { code },
      data: {
        currentLevel: data.currentLevel,
        targetLevel: data.targetLevel,
        assessedAt: data.assessedAt,
        assessedById: data.assessedById,
      },
    });
    // Remove only history for the topic this fixture changed.
    const restored = await client.capability.findUniqueOrThrow({
      where: { code },
      select: { id: true },
    });
    const { users } = fixture();
    await client.changeEvent.deleteMany({
      where: {
        entityType: "Capability",
        entityId: restored.id,
        createdAt: { gte: startedAt },
        OR: [
          { actorId: { in: Object.values(users).map((user) => user.id) } },
          { actorId: null, action: { not: "catalogue.seeded" } },
        ],
      },
    });
  } finally {
    await client.$disconnect();
  }
}

test("catalogue is loaded with 30 topics and 60 KPIs", async ({ page }) => {
  await login(page);
  await page.goto("/capabilities?view=gaps");
  await expect(
    page.getByRole("heading", { name: "Capabilities", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("30 of 30 topics")).toBeVisible();
  await page.goto("/capabilities?view=performance");
  await expect(
    page.getByRole("tab", { name: "KPI performance" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("tbody tr")).toHaveCount(60);
});

test("keyboard rating autosaves, survives reload and records history", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Data entry is desktop-first (P-08)",
  );
  const before = await topic("GV.02");
  const next = before.currentLevel === 2 ? 3 : 2;
  try {
    await login(page);
    await page.goto("/capabilities?group=GV");
    const rating = page.getByRole("radiogroup", {
      name: /Current maturity for GV\.02/,
    });
    await rating.locator('[tabindex="0"]').focus();
    await page.keyboard.press(String(next));
    await expect(page.getByText("All changes saved")).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByRole("radiogroup", { name: /Current maturity for GV\.02/ })
        .getByRole("radio", { name: new RegExp(`^${next} `) }),
    ).toHaveAttribute("aria-checked", "true");
    await page
      .getByRole("button", { name: /GV\.02/ })
      .first()
      .click();
    const panel = page.getByRole("dialog");
    await expect(panel.getByRole("heading", { name: "History" })).toBeVisible();
    await expect(
      panel.getByText(new RegExp(`current → ${next}`)),
    ).toBeVisible();
    const after = await topic("GV.02");
    expect(after.currentLevel).toBe(next);
    expect(after.assessedById).toBe(
      authenticationDisabled ? null : fixture().users.admin.id,
    );
  } finally {
    await restore("GV.02", before);
  }
});

test("assessment API enforces roles, validation and KPI rules", async ({
  request,
  playwright,
}) => {
  const target = await topic("ID.01");
  const kpi = target.indicators[0];
  // Role checks only apply while authentication is enforced.
  if (!authenticationDisabled) {
    const anonymous = await playwright.request.newContext({
      baseURL: "http://127.0.0.1:3100",
    });
    expect(
      (
        await anonymous.patch(`/api/capabilities/${target.id}`, {
          headers: origin,
          data: { currentLevel: 3 },
        })
      ).status(),
    ).toBe(401);
    await anonymous.dispose();

    await signIn(request, "viewer");
    expect(
      (
        await request.patch(`/api/capabilities/${target.id}`, {
          headers: origin,
          data: { currentLevel: 3 },
        })
      ).status(),
    ).toBe(403);
    expect(
      (await request.get(`/api/capabilities/${target.id}/history`)).status(),
    ).toBe(200);
    await signIn(request, "editor");
  }
  for (const data of [
    { currentLevel: 6 },
    { currentLevel: 0 },
    {},
    { assessedById: "x" },
    { targetDate: "2027-02-30" },
    { pillarKeys: ["grc", "grc"] },
  ])
    expect(
      (
        await request.patch(`/api/capabilities/${target.id}`, {
          headers: origin,
          data,
        })
      ).status(),
    ).toBe(400);
  expect(
    (
      await request.patch(`/api/capabilities/${target.id}`, {
        data: { currentLevel: authenticationDisabled ? 6 : 3 },
      })
    ).status(),
  ).toBe(authenticationDisabled ? 400 : 403);
  expect(
    (
      await request.patch(
        `/api/capabilities/00000000-0000-0000-0000-000000000000`,
        { headers: origin, data: { currentLevel: 3 } },
      )
    ).status(),
  ).toBe(404);

  try {
    const saved = await request.patch(`/api/indicators/${kpi.id}`, {
      headers: origin,
      data: { value: Number(kpi.passThreshold), measuredAt: "2026-11-01" },
    });
    expect(saved.status()).toBe(200);
    expect((await saved.json()).data.value).toBe(Number(kpi.passThreshold));
    expect(
      (
        await request.patch(`/api/indicators/${kpi.id}`, {
          headers: origin,
          data: { passThreshold: 10, failThreshold: 90 },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await request.delete(`/api/indicators/${kpi.id}`, {
          headers: origin,
          data: {},
        })
      ).status(),
    ).toBe(409);
    const created = await request.post(
      `/api/capabilities/${target.id}/indicators`,
      {
        headers: origin,
        data: {
          name: "Synthetic local KPI",
          unit: "%",
          direction: "lower",
          passThreshold: 5,
          failThreshold: 10,
          value: 7,
          measuredAt: null,
        },
      },
    );
    expect(created.status()).toBe(201);
    const local = (await created.json()).data;
    expect(
      (
        await request.post(`/api/capabilities/${target.id}/indicators`, {
          headers: origin,
          data: {
            name: "Synthetic local KPI",
            unit: "%",
            direction: "lower",
            passThreshold: 5,
            failThreshold: 10,
            value: null,
            measuredAt: null,
          },
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await request.delete(`/api/indicators/${local.id}`, {
          headers: origin,
          data: {},
        })
      ).status(),
    ).toBe(200);
  } finally {
    const client = database();
    try {
      await client.capabilityIndicator.update({
        where: { id: kpi.id },
        data: {
          value: kpi.value,
          measuredAt: kpi.measuredAt,
          updatedById: null,
        },
      });
    } finally {
      await client.$disconnect();
    }
    await restore("ID.01", target);
  }
});

test("rapid rating edits retain the final saved value", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Keyboard entry is desktop-first",
  );
  const before = await topic("GV.02");
  try {
    await login(page);
    await page.goto("/capabilities?group=GV");
    const rating = page.getByRole("radiogroup", {
      name: /Current maturity for GV\.02/,
    });
    await rating.locator('[tabindex="0"]').focus();
    await page.route("**/api/capabilities/*", async (route) => {
      if (route.request().method() === "PATCH") {
        const response = await route.fetch();
        await new Promise((resolve) => setTimeout(resolve, 250));
        await route.fulfill({ response });
      } else await route.continue();
    });
    await page.keyboard.press("2");
    await page.keyboard.press("4");
    await page.keyboard.press("3");
    await expect(page.getByText("All changes saved")).toBeVisible();
    await expect(rating.getByRole("radio", { name: /^3 / })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.reload();
    await expect(
      page
        .getByRole("radiogroup", { name: /Current maturity for GV\.02/ })
        .getByRole("radio", { name: /^3 / }),
    ).toHaveAttribute("aria-checked", "true");
  } finally {
    await restore("GV.02", before);
  }
});

test("setting a target does not make an old assessment look current", async ({
  request,
}) => {
  if (!authenticationDisabled) await signIn(request, "editor");
  const before = await topic("GV.02");
  try {
    const response = await request.patch(`/api/capabilities/${before.id}`, {
      headers: origin,
      data: { targetLevel: before.targetLevel === 4 ? 5 : 4 },
    });
    expect(response.status()).toBe(200);
    const after = await topic("GV.02");
    expect(after.assessedAt).toEqual(before.assessedAt);
    expect(after.assessedById).toBe(before.assessedById);
  } finally {
    await restore("GV.02", before);
  }
});

test("KPI filters survive reload and exports match the displayed rows", async ({
  page,
}) => {
  await login(page);
  await page.goto("/capabilities?view=performance");
  await page
    .getByRole("group", { name: "KPI status" })
    .getByRole("button", { name: "No data", exact: true })
    .click();
  await expect(page).toHaveURL(/kpiStatus=missing/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "No data", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const count = await page
    .locator("tbody tr")
    .filter({ hasNotText: "No KPIs match" })
    .count();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const stream = await (await download).createReadStream();
  let csv = "";
  for await (const chunk of stream!) csv += chunk.toString();
  expect(csv.split("\r\n")).toHaveLength(count + 1);
  expect(csv).toContain('"Data source"');
  expect(csv).toContain('"Measured"');
});

test("open access saves without canonical Origin restrictions", async ({
  request,
}) => {
  test.skip(
    !authenticationDisabled,
    "Origin restrictions return when authentication is restored",
  );
  const before = await topic("GV.02");
  const next = before.targetLevel === 3 ? 4 : 3;
  try {
    const testOrigins: Record<string, string>[] = [
      {},
      { Origin: "https://unrelated.example.invalid" },
    ];
    for (const headers of testOrigins) {
      const response = await request.patch(`/api/capabilities/${before.id}`, {
        headers,
        data: { targetLevel: next },
      });
      expect(response.status()).toBe(200);
      expect((await topic("GV.02")).targetLevel).toBe(next);
    }
  } finally {
    await restore("GV.02", before);
  }
});
