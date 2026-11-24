import { database } from "./database";
import { seedFoundation } from "./seed-foundation";

const client = database();
try {
  await seedFoundation(client);
  console.log(
    "Organizational foundation seeded. Existing configuration preserved.",
  );
} catch {
  console.error(
    "Seed failed. Check database configuration and migration status.",
  );
  process.exitCode = 1;
} finally {
  await client.$disconnect();
}
