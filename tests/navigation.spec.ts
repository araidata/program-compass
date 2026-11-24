import { expect, test } from "@playwright/test";
import { loginPage } from "./helpers";

test.beforeEach(async ({ page }) => {
  await loginPage(page);
});

const modules = [
  ["Capabilities", "/capabilities"],
  ["Compliance", "/compliance"],
  ["Risks & Findings", "/risks"],
  ["Business Context", "/context"],
  ["Roadmap", "/roadmap"],
  ["Workforce", "/workforce"],
  ["Technology", "/technology"],
  ["Reports", "/reports"],
  ["Settings", "/settings"],
];

test("overview and all protected navigation modules work", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No organizational data is connected.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pillars" })).toBeVisible();
  for (const [title, path] of modules) {
    if (testInfo.project.name === "mobile")
      await page.getByRole("button", { name: "Open navigation" }).click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: title, exact: true })
      .click();
    await expect(page).toHaveURL(path);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    if (path !== "/settings")
      await expect(
        page.getByRole("heading", { name: "Not available yet" }),
      ).toBeVisible();
    if (testInfo.project.name === "mobile")
      await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("overview.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("pillar scope is held in the URL and kept across modules", async ({
  page,
}, testInfo) => {
  await page.goto("/capabilities");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("combobox", { name: "Scope" }).selectOption("grc");
  } else {
    await page
      .getByRole("navigation", { name: "Scope" })
      .getByRole("link", { name: "GRC" })
      .click();
  }
  await expect(page).toHaveURL("/capabilities?pillar=grc");
  await expect(
    page.getByRole("main").getByText("Governance, Risk & Compliance"),
  ).toBeVisible();
  if (testInfo.project.name === "mobile")
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Workforce", exact: true })
    .click();
  await expect(page).toHaveURL("/workforce?pillar=grc");
});

test("unknown modules return 404", async ({ page }) => {
  const response = await page.goto("/unknown-module");
  expect(response?.status()).toBe(404);
});
