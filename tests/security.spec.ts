import { expect, test } from "@playwright/test";
import { authenticationDisabled } from "../src/lib/auth-mode";
import { clearLimits, fixture, loginPage, signIn } from "./helpers";
import { database } from "../scripts/database";

test.skip(
  authenticationDisabled,
  "Owner has temporarily disabled authentication",
);
const origin = { Origin: "http://127.0.0.1:3100" };

test("anonymous pages redirect and APIs reject access; registration is absent", async ({
  page,
  request,
}) => {
  await page.goto("/capabilities");
  await expect(page).toHaveURL(/\/login\?reason=expired/);
  for (const path of ["/api/users", "/api/settings", "/api/history"])
    expect((await request.get(path)).status()).toBe(401);
  expect(
    (
      await request.post("/api/auth/sign-up/email", {
        headers: origin,
        data: {
          email: "outsider@example.invalid",
          password: "not-a-real-password",
        },
      })
    ).status(),
  ).toBe(404);
});

test("incorrect credentials fail and login is persistently rate limited", async ({
  request,
}) => {
  await clearLimits();
  for (let attempt = 0; attempt < 5; attempt++)
    expect(
      (
        await request.post("/api/auth/sign-in/email", {
          headers: origin,
          data: {
            email: fixture().users.admin.email,
            password: "incorrect synthetic password",
          },
        })
      ).status(),
    ).toBe(401);
  expect(
    (
      await request.post("/api/auth/sign-in/email", {
        headers: origin,
        data: {
          email: fixture().users.admin.email,
          password: fixture().password,
        },
      })
    ).status(),
  ).toBe(429);
});

test("editor and viewer cannot administer accounts or configuration", async ({
  request,
  page,
}) => {
  for (const role of ["editor", "viewer"]) {
    await signIn(request, role);
    for (const path of ["/api/users", "/api/settings", "/api/history"])
      expect((await request.get(path)).status()).toBe(403);
    expect(
      (
        await request.post("/api/users", {
          headers: origin,
          data: { role: "admin" },
        })
      ).status(),
    ).toBe(403);
    await request.post("/api/auth/sign-out", { headers: origin, data: {} });
  }
  await signIn(page.request, "viewer");
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Access denied" }),
  ).toBeVisible();
});

test("admin creates persistent users; rejects invalid inputs and foreign-origin mutations", async ({
  request,
}) => {
  await signIn(request);
  const { users, password } = fixture();
  const email = `new-${Date.now()}-${users.admin.email}`;
  const adminCheck = database();
  let onlyAdministrator = false;
  try {
    onlyAdministrator =
      (await adminCheck.user.count({
        where: { role: "admin", active: true },
      })) === 1;
  } finally {
    await adminCheck.$disconnect();
  }
  if (onlyAdministrator) {
    expect(
      (
        await request.patch(`/api/users/${users.admin.id}`, {
          headers: origin,
          data: { role: "viewer", active: false },
        })
      ).status(),
    ).toBe(409);
  }
  const response = await request.post("/api/users", {
    headers: origin,
    data: { name: "Synthetic new account", email, password, role: "viewer" },
  });
  expect(response.status()).toBe(201);
  const id = (await response.json()).data.id;
  const client = database();
  try {
    const user = await client.user.findUnique({
      where: { id },
      include: { accounts: true },
    });
    expect(user?.role).toBe("viewer");
    expect(user?.accounts[0].password).not.toBe(password);
    expect(
      await client.changeEvent.count({
        where: { entityId: id, action: "user.created" },
      }),
    ).toBe(1);
  } finally {
    await client.$disconnect();
  }
  expect(
    (
      await request.post("/api/users", {
        headers: origin,
        data: {
          name: "Invalid",
          email: "bad",
          password: "short",
          role: "admin",
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/users", {
        headers: { Origin: "https://foreign.invalid" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/users", {
        headers: origin,
        data: {
          name: "Escalation",
          email: `other-${email}`,
          password,
          role: "owner",
          active: true,
        },
      })
    ).status(),
  ).toBe(400);
});

test("deactivation and expiry revoke access; logout clears the session", async ({
  playwright,
}) => {
  const admin = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  const viewer = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  await signIn(admin);
  await signIn(viewer, "viewer");
  const id = fixture().users.viewer.id;
  try {
    expect(
      (
        await admin.patch(`/api/users/${id}`, {
          headers: origin,
          data: { role: "viewer", active: false },
        })
      ).status(),
    ).toBe(200);
    expect((await viewer.get("/api/auth/get-session")).status()).toBe(200);
    expect(await (await viewer.get("/api/auth/get-session")).json()).toBeNull();
    await clearLimits();
    expect(
      (
        await viewer.post("/api/auth/sign-in/email", {
          headers: origin,
          data: {
            email: fixture().users.viewer.email,
            password: fixture().password,
          },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await admin.patch(`/api/users/${id}`, {
          headers: origin,
          data: { role: "viewer", active: true },
        })
      ).status(),
    ).toBe(200);
    await signIn(viewer, "viewer");
    const client = database();
    try {
      await client.session.updateMany({
        where: { userId: id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
    } finally {
      await client.$disconnect();
    }
    expect(await (await viewer.get("/api/auth/get-session")).json()).toBeNull();
    expect(
      (
        await admin.post("/api/auth/sign-out", { headers: origin, data: {} })
      ).status(),
    ).toBe(200);
    expect((await admin.get("/api/users")).status()).toBe(401);
  } finally {
    await admin.dispose();
    await viewer.dispose();
  }
});

test("login, settings and logout work through the browser", async ({
  page,
}, testInfo) => {
  await loginPage(page);
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Users and roles" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("settings.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL("/login");
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});
