import assert from "node:assert/strict";
import { test } from "node:test";
import { permits } from "../../src/lib/permissions";
import {
  createUserSchema,
  listSchema,
  updateUserSchema,
} from "../../src/lib/validation";
import { hashPassword, verifyPassword } from "better-auth/crypto";

test("the role matrix fails closed", () => {
  for (const role of ["admin", "editor", "viewer"])
    assert.equal(permits(role, "read"), true);
  assert.equal(permits("viewer", "write"), false);
  assert.equal(permits("editor", "write"), true);
  assert.equal(permits("editor", "administer"), false);
  assert.equal(permits("admin", "administer"), true);
  assert.equal(permits("owner", "read"), false);
});
test("untrusted inputs cannot smuggle account permissions", () => {
  assert.equal(
    updateUserSchema.safeParse({
      role: "admin",
      active: true,
      emailVerified: true,
    }).success,
    false,
  );
  assert.equal(
    createUserSchema.safeParse({
      name: "Synthetic",
      email: "test@example.invalid",
      password: "short",
      role: "admin",
    }).success,
    false,
  );
  assert.equal(
    listSchema.safeParse({ page: -1, pageSize: 100000, sort: "password" })
      .success,
    false,
  );
});
test("password hashes are salted and reject incorrect passwords", async () => {
  const password = "Synthetic password for unit tests only";
  const hash = await hashPassword(password);
  assert.notEqual(hash, await hashPassword(password));
  assert.equal(await verifyPassword({ hash, password }), true);
  assert.equal(await verifyPassword({ hash, password: "incorrect" }), false);
});
