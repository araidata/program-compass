import { seedCycleSummaries } from "./seed-cycle-summaries";
import { database } from "./database";
import { seedReferences } from "./seed-references";
import { seedFoundation } from "./seed-foundation";

const client = database();
try {
  await seedFoundation(client);
  await seedReferences(client);
  await seedCycleSummaries(client);
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
