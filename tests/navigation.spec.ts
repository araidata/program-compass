import { expect, test } from "@playwright/test";
import { loginPage } from "./helpers";
import { authenticationDisabled } from "../src/lib/auth-mode";

test.beforeEach(async ({ page }) => {
  if (!authenticationDisabled) await loginPage(page);
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
    page
      .getByRole("heading", { name: "No assessments recorded yet" })
      .or(page.getByRole("heading", { name: "Maturity by group" })),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Planned modules" }),
  ).toBeVisible();
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
    if (path !== "/settings" && path !== "/capabilities")
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
    await expect(async () => {
      await page.getByRole("combobox", { name: "Scope" }).selectOption("grc");
      await expect(page).toHaveURL("/capabilities?pillar=grc", {
        timeout: 1000,
      });
    }).toPass();
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

test("suspended authentication redirects login and hides sign-out", async ({
  page,
  request,
}) => {
  test.skip(!authenticationDisabled, "Authentication has been restored");
  await page.goto("/login?reason=expired");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  const response = await request.get("/api/auth/get-session");
  expect(response.status()).toBe(404);
  const settings = await request.get("/api/settings");
  expect(settings.status()).toBe(200);
});
