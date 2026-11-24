import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: [".env.local", ".env"], quiet: true });
export function database() {
  if (!process.env.DIRECT_URL) throw new Error("DIRECT_URL is required");
  if (
    !["development", "preview", "production"].includes(
      process.env.DATABASE_ENVIRONMENT ?? "",
    )
  )
    throw new Error("Set DATABASE_ENVIRONMENT explicitly");
  if (
    process.env.DATABASE_ENVIRONMENT === "production" &&
    process.env.ALLOW_PRODUCTION_MIGRATION !== "true"
  )
    throw new Error(
      "Production operations require ALLOW_PRODUCTION_MIGRATION=true",
    );
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DIRECT_URL,
      max: 1,
      connectionTimeoutMillis: 15_000,
    }),
  });
}
