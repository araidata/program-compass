import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { database } from "../scripts/database";
import { authenticationDisabled } from "../src/lib/auth-mode";
import { loginPage, signIn } from "./helpers";
test("relational browser preview applies atomically, rejects stale workspace and excludes login records", async ({
  page,
  request,
}) => {
  test.setTimeout(180000);
  if (!authenticationDisabled) {
    await loginPage(page);
    await signIn(request);
  }
  const client = database();
  const uploads: string[] = [];
  const previews: string[] = [];
  let personId = "";
  const run = randomUUID();
  page.on("response", async (r) => {
    if (
      r.request().method() === "POST" &&
      r.ok() &&
      r.url().endsWith("/api/data-exchange")
    ) {
      uploads.push((await r.json()).data.id);
    }
  });
  try {
    const accounts = await client.account.count();
    const caps = await client.capability.findMany({
      select: { id: true, currentLevel: true, targetLevel: true },
    });
    const exported = await request.get("/api/data-exchange");
    expect(exported.status()).toBe(200);
    const bytes = await exported.body();
    const bundle = JSON.parse(bytes.toString("utf8"));
    expect(bundle.format).toBe("program-compass-relational");
    expect(bundle.tables.Account).toBeUndefined();
    expect(bundle.tables.User).toBeUndefined();
    expect(bundle.tables.Session).toBeUndefined();
    expect(
      bundle.tables.Capability.every(
        (r: { assessedById: string | null }) => r.assessedById === null,
      ),
    ).toBe(true);
    await page.goto("/reports/data");
    await page.getByLabel("Relational JSON file").setInputFiles({
      name: "synthetic-roundtrip.json",
      mimeType: "application/json",
      buffer: bytes,
    });
    async function preview() {
      const ready = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          /\/api\/data-exchange\/[^/]+\/preview$/.test(
            new URL(r.url()).pathname,
          ),
        { timeout: 120000 },
      );
      await page
        .getByRole("button", { name: "Upload and preview changes" })
        .click();
      const response = await ready;
      expect(response.status(), await response.text()).toBe(200);
      const data = (await response.json()).data;
      previews.push(data.id);
      await expect(
        page.getByRole("heading", { name: "Reviewable change preview" }),
      ).toBeVisible();
      expect(data.changes).toHaveLength(0);
      return data.id;
    }
    const first = await preview();
    const person = await client.person.create({
      data: {
        name: `Synthetic import-stale ${run}`,
        title: "Synthetic import test",
      },
    });
    personId = person.id;
    const stale = await request.post(
      `/api/data-exchange/preview/${first}/apply`,
      { data: {} },
    );
    expect(stale.status()).toBe(409);
    expect((await stale.json()).error.message).toContain("workspace changed");
    await client.person.delete({ where: { id: personId } });
    personId = "";
    await preview();
    await page
      .getByRole("button", { name: "Apply reviewed import atomically" })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Applied atomically: 0 reviewed changes",
      { timeout: 120000 },
    );
    expect(await client.account.count()).toBe(accounts);
    expect(
      await client.capability.findMany({
        select: { id: true, currentLevel: true, targetLevel: true },
      }),
    ).toEqual(caps);
  } finally {
    if (personId) await client.person.delete({ where: { id: personId } });
    await client.changeEvent.deleteMany({
      where: { entityType: "DataExchange", entityId: { in: previews } },
    });
    await client.importPreview.deleteMany({ where: { id: { in: previews } } });
    await client.dataUpload.deleteMany({ where: { id: { in: uploads } } });
    await client.$disconnect();
  }
});
test("leadership reports reconcile with domain APIs and print a readable multipage management pack", async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(180000);
  if (!authenticationDisabled) {
    await loginPage(page);
    await signIn(request);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/reports?pack=management");
  await expect(
    page.getByRole("heading", {
      name: "Management leadership planning pack",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Funding scenario", exact: true }),
  ).toBeEnabled();
  const selected = await page
    .getByRole("combobox", { name: "Funding scenario", exact: true })
    .inputValue();
  const api = await request.get(
    `/api/reports?pack=management${selected ? `&scenario=${selected}` : ""}`,
  );
  expect(api.status()).toBe(200);
  const report = (await api.json()).data;
  const client = database();
  try {
    const count = await client.capability.count();
    const mean = await client.capability.aggregate({
      where: { applicable: true, currentLevel: { not: null } },
      _avg: { currentLevel: true },
    });
    expect(report.summary.total).toBe(count);
    expect(report.summary.averageCurrent).toBe(mean._avg.currentLevel);
  } finally {
    await client.$disconnect();
  }
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report CSV" }).click();
  expect((await download).suggestedFilename()).toContain("management");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("report-1280.png"),
    fullPage: false,
  });
  const path = testInfo.outputPath("management-pack.pdf");
  await page.pdf({ path, preferCSSPageSize: true, printBackground: true });
  const info = JSON.parse(
    execFileSync(
      "python",
      [
        "-c",
        "import json,sys;from pypdf import PdfReader;r=PdfReader(sys.argv[1]);t=[p.extract_text() or '' for p in r.pages];print(json.dumps({'pages':len(t),'minimumText':min(map(len,t)),'hasAssumptions':any('Assumptions and source provenance' in x for x in t)}))",
        path,
      ],
      { encoding: "utf8" },
    ),
  );
  expect(info.pages).toBeGreaterThan(2);
  expect(info.minimumText).toBeGreaterThan(40);
  expect(info.hasAssumptions).toBe(true);
  await page.goto("/risks?pillar=grc");
  await expect(page).toHaveURL("/capabilities/planning?view=issue&pillar=grc");
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Risks & Findings" }),
  ).toHaveCount(0);
});
