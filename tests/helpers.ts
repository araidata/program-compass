import { expect, type Page, type APIRequestContext } from "@playwright/test";
import { database } from "../scripts/database";
export const fixture = () =>
  JSON.parse(process.env.E2E_FIXTURE!) as {
    password: string;
    users: Record<string, { id: string; email: string }>;
  };
export async function clearLimits() {
  const client = database();
  try {
    await client.rateLimit.deleteMany();
  } finally {
    await client.$disconnect();
  }
}
export async function signIn(request: APIRequestContext, role = "admin") {
  await clearLimits();
  const { users, password } = fixture();
  const response = await request.post("/api/auth/sign-in/email", {
    headers: { Origin: "http://127.0.0.1:3100" },
    data: { email: users[role].email, password },
  });
  expect(response.status()).toBe(200);
}
export async function loginPage(page: Page) {
  await clearLimits();
  await page.goto("/login");
  const { users, password } = fixture();
  await page.getByLabel("Email", { exact: true }).fill(users.admin.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/");
}
