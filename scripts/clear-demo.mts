// Clear recorded demo values only; keep edited topics and a lifecycle marker
// so a subsequent deployment cannot silently put the demo back.
import { database } from "./database";
import { clearDemoData } from "./clear-demo-data";
const client = database();
try {
  const result = await client.$transaction(clearDemoData, { timeout: 60_000 });
  console.log(
    `Cleared ${result.cleared} demo topics; removed ${result.removedFunctions} demo functions.`,
  );
} finally {
  await client.$disconnect();
}
