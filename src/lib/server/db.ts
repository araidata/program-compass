import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseUrl } from "./config";

const globalDatabase = globalThis as unknown as { compassDb?: PrismaClient };

export function db() {
  if (!globalDatabase.compassDb) {
    const adapter = new PrismaPg({
      connectionString: databaseUrl(),
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    globalDatabase.compassDb = new PrismaClient({ adapter });
  }
  return globalDatabase.compassDb;
}
