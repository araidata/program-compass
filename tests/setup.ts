import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { database } from "../scripts/database";
import { seedFoundation } from "../scripts/seed-foundation";
import { seedReferences } from "../scripts/seed-references";

export default async function setup() {
  if (
    process.env.RUN_DATABASE_TESTS !== "true" ||
    process.env.DATABASE_ENVIRONMENT !== "development"
  )
    throw new Error(
      "Tests require RUN_DATABASE_TESTS=true and the isolated development database",
    );
  const client = database();
  const run = randomUUID();
  const password = randomBytes(24).toString("base64url");
  const hashed = await hashPassword(password);
  const users: Record<string, { id: string; email: string }> = {};
  try {
    await seedFoundation(client);
    await seedReferences(client);
    for (const role of ["admin", "editor", "viewer"] as const) {
      const id = randomUUID();
      const email = `${role}-${run}@example.invalid`;
      await client.user.create({
        data: {
          id,
          name: `Synthetic ${role}`,
          email,
          role,
          accounts: {
            create: {
              accountId: id,
              providerId: "credential",
              password: hashed,
            },
          },
        },
      });
      users[role] = { id, email };
    }
    process.env.E2E_FIXTURE = JSON.stringify({ password, users });
  } finally {
    await client.$disconnect();
  }
  return async () => {
    const cleanup = database();
    try {
      const ids = (
        await cleanup.user.findMany({
          where: { email: { endsWith: `${run}@example.invalid` } },
          select: { id: true },
        })
      ).map((user) => user.id);
      await cleanup.changeEvent.deleteMany({
        where: { OR: [{ actorId: { in: ids } }, { entityId: { in: ids } }] },
      });
      await cleanup.user.deleteMany({ where: { id: { in: ids } } });
    } finally {
      await cleanup.$disconnect();
    }
  };
}
