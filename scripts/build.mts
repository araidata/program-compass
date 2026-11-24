// Build entry point. Every build generates the Prisma client and builds Next.js.
// Local and CI builds never need a database. At the owner's request, Vercel
// builds also update their database before building (DECISION_LOG C-06, C-07):
// pending migrations, the idempotent catalogue seed, and demo data only when no
// topic has a rating yet. Demo data is removed with `npm run db:demo:clear`.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

function run(command: string, args: string[], env = process.env) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const executable =
    command === "prisma"
      ? require.resolve("prisma/build/index.js")
      : command === "tsx"
        ? require.resolve("tsx/cli")
        : require.resolve("next/dist/bin/next");
  const result = spawnSync(process.execPath, [executable, ...args], {
    stdio: "inherit",
    env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("prisma", ["generate"]);

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
  run("tsx", ["scripts/migrate.mts", "deploy"], env);
  run("tsx", ["scripts/seed.mts"], env);
  run(
    "tsx",
    [
      "scripts/seed-synthetic.mts",
      "--if-empty",
      ...(target === "production" ? ["--allow-production"] : []),
    ],
    env,
  );
}

run("next", ["build"]);
