// Build entry point. Every build generates the Prisma client and builds Next.js.
// Local and CI builds never need a database. At the owner's request, Vercel
// builds also update their database before building (DECISION_LOG C-06, C-07):
// pending migrations, the idempotent catalogue seed, and demo data only when no
// topic has a rating yet. Demo data is removed with `npm run db:demo:clear`.
import { spawnSync } from "node:child_process";

function run(command: string, args: string[], env = process.env) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npx", ["prisma", "generate"]);

const target = process.env.VERCEL_ENV;
if (target === "preview" || target === "production") {
  if (!process.env.DIRECT_URL)
    throw new Error(
      `Vercel ${target} build: DIRECT_URL is required to update the database`,
    );
  const env = {
    ...process.env,
    DATABASE_ENVIRONMENT: target,
    ...(target === "production" ? { ALLOW_PRODUCTION_MIGRATION: "true" } : {}),
  };
  run("npx", ["tsx", "scripts/migrate.mts", "deploy"], env);
  run("npx", ["tsx", "scripts/seed.mts"], env);
  run(
    "npx",
    [
      "tsx",
      "scripts/seed-synthetic.mts",
      "--if-empty",
      ...(target === "production" ? ["--allow-production"] : []),
    ],
    env,
  );
}

run("npx", ["next", "build"]);
