// Build entry point. Every build generates the Prisma client and builds Next.js
// without needing a database. Vercel PREVIEW builds additionally apply pending
// migrations and seeds to the shared synthetic nonproduction database, at the
// owner's request (DECISION_LOG C-06). Production builds never touch the database.
import { spawnSync } from "node:child_process";

function run(command: string, args: string[], env = process.env) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npx", ["prisma", "generate"]);

if (process.env.VERCEL_ENV === "preview") {
  if (!process.env.DIRECT_URL)
    throw new Error(
      "Preview build: DIRECT_URL is required to update the preview database",
    );
  const env = { ...process.env, DATABASE_ENVIRONMENT: "preview" };
  run("npx", ["tsx", "scripts/migrate.mts", "deploy"], env);
  run("npx", ["tsx", "scripts/seed.mts"], env);
  run("npx", ["tsx", "scripts/seed-synthetic.mts", "--if-empty"], env);
}

run("npx", ["next", "build"]);
