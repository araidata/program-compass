import { spawnSync } from "node:child_process";
import { database } from "./database";

const command = process.argv[2];
if (!["dev", "deploy", "status"].includes(command))
  throw new Error("Choose dev, deploy, or status");
if (command === "dev" && process.env.DATABASE_ENVIRONMENT !== "development")
  throw new Error("Development migrations require a development database");
// Validate target and production acknowledgement before the Prisma process starts.
const client = database();
await client.$disconnect();
const result = spawnSync(
  process.execPath,
  [
    "node_modules/prisma/build/index.js",
    "migrate",
    command,
    ...process.argv.slice(3),
  ],
  { stdio: "inherit", env: process.env },
);
process.exitCode = result.status ?? 1;
