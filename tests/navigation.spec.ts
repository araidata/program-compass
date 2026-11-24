import { expect, test } from "@playwright/test";

const modules = [
  ["Business Context", "/business-context"],
  ["Current State", "/current-state"],
  ["Compliance", "/compliance"],
  ["People & Resources", "/people-resources"],
  ["Technology Portfolio", "/technology-portfolio"],
  ["Strategic Planning", "/strategic-planning"],
  ["Risks & Findings", "/risks-findings"],
  ["Reporting", "/reporting"],
  ["Settings", "/settings"],
];

test("dashboard and all navigation modules work without a database", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Program Compass is initialized.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Three cybersecurity pillars" }),
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
    await expect(
      page.getByText("Planned module", { exact: true }),
    ).toBeVisible();
    if (testInfo.project.name === "mobile")
      await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("link", { name: "Return to Dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("dashboard.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("unknown modules return 404", async ({ page }) => {
  const response = await page.goto("/unknown-module");
  expect(response?.status()).toBe(404);
});
