import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Undefined is intentional before Neon provisioning; generation needs no URL.
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
});
