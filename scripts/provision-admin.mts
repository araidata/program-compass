import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "better-auth/crypto";
import { database } from "./database";
import { createUserSchema } from "../src/lib/validation";

// No HTTP bootstrap endpoint. The operator must already possess database access.
const prompt = createInterface({
  input: process.stdin,
  output: process.stdout,
});
async function hiddenPassword() {
  if (!process.stdin.isTTY)
    throw new Error(
      "Use a terminal or INITIAL_ADMIN_PASSWORD supplied securely through the environment",
    );
  prompt.close();
  process.stdout.write("Initial password (15–128 characters; hidden): ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise<string>((resolve, reject) => {
    let value = "";
    const listener = (chunk: Buffer) => {
      for (const character of chunk.toString()) {
        if (character === "\u0003") {
          finish();
          reject(new Error("Cancelled"));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b")
          value = value.slice(0, -1);
        else if (character >= " ") value += character;
      }
    };
    function finish() {
      process.stdin.off("data", listener);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    }
    process.stdin.on("data", listener);
  });
}

let client: ReturnType<typeof database> | undefined;
try {
  const name =
    process.env.INITIAL_ADMIN_NAME ??
    (await prompt.question("Administrator name: "));
  const email =
    process.env.INITIAL_ADMIN_EMAIL ??
    (await prompt.question("Administrator email: "));
  const password =
    process.env.INITIAL_ADMIN_PASSWORD ?? (await hiddenPassword());
  prompt.close();
  const data = createUserSchema.parse({ name, email, password, role: "admin" });
  const hashed = await hashPassword(data.password);
  client = database();
  await client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(87341602)`;
    if (await tx.user.count())
      throw new Error(
        "Users already exist; use administrator-controlled user management",
      );
    const id = randomUUID();
    await tx.user.create({
      data: {
        id,
        name: data.name,
        email: data.email,
        role: "admin",
        accounts: {
          create: { accountId: id, providerId: "credential", password: hashed },
        },
      },
    });
    await tx.changeEvent.create({
      data: {
        actorId: id,
        action: "administrator.provisioned",
        entityType: "User",
        entityId: id,
        details: { role: "admin", method: "operator-cli" },
      },
    });
  });
  console.log(
    "Initial administrator provisioned. Sign in using the supplied credentials.",
  );
} catch {
  console.error(
    "Administrator provisioning failed. Check inputs, database configuration, and whether users already exist.",
  );
  process.exitCode = 1;
} finally {
  prompt.close();
  await client?.$disconnect();
}
