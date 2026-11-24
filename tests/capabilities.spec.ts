import { expect, test } from "@playwright/test";
import { fixture, loginPage, signIn } from "./helpers";
import { database } from "../scripts/database";
import { authenticationDisabled } from "../src/lib/auth-mode";

const login = async (page: Parameters<typeof loginPage>[0]) => {
  if (!authenticationDisabled) await login(page);
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
    // Synthetic fixture actors are deleted after the run; keep history clean.
    const { users } = fixture();
    await client.changeEvent.deleteMany({
      where: {
        entityType: "Capability",
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
        data: { currentLevel: 3 },
      })
    ).status(),
  ).toBe(403);
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
