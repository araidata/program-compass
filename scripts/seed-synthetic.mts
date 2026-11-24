// Synthetic (demo) assessment data. Values are generated, labelled synthetic,
// and never organizational data. Production requires --allow-production, which
// only the Vercel production build passes, at the owner's request (C-07).
// Remove it again with `npm run db:demo:clear`.
import { database } from "./database";
import { seedFoundation } from "./seed-foundation";
import { DEMO_ACTION, DEMO_FUNCTIONS, DEMO_RATIONALE } from "./demo-data";

const environment = process.env.DATABASE_ENVIRONMENT ?? "";
if (
  !["development", "preview"].includes(environment) &&
  !(environment === "production" && process.argv.includes("--allow-production"))
)
  throw new Error(
    "Synthetic data is limited to development and preview unless --allow-production is passed",
  );

// Deterministic pseudo-random sequence so every run produces the same data.
let state = 20261124;
const random = () => {
  state = (state * 1103515245 + 12345) % 2147483648;
  return state / 2147483648;
};
const pick = <T,>(items: readonly T[]) =>
  items[Math.floor(random() * items.length)];

const functions = DEMO_FUNCTIONS;
const owners: Record<string, string> = {
  secops: "Security Monitoring",
  sae: "Engineering",
  grc: "Governance",
};
const unassessed = new Set(["PR.14", "PR.17"]);
const noOwner = new Set(["PR.06"]);

const client = database();
try {
  await seedFoundation(client);
  // --if-empty: only fill a database with no ratings, so automated preview
  // builds never overwrite assessments someone has entered.
  if (
    process.argv.includes("--if-empty") &&
    (await client.capability.count({
      where: { currentLevel: { not: null } },
    })) > 0
  ) {
    console.log("Ratings already exist; synthetic data not written.");
    process.exit(0);
  }
  const pillars = await client.pillar.findMany({
    include: { functions: true },
  });
  for (const pillar of pillars)
    for (const name of functions[pillar.key] ?? [])
      if (!pillar.functions.some((fn) => fn.name === name))
        await client.organizationalFunction.create({
          data: { name, pillarId: pillar.id },
        });
  const allFunctions = await client.organizationalFunction.findMany();
  const capabilities = await client.capability.findMany({
    include: { pillars: { include: { pillar: true } }, indicators: true },
    orderBy: { sortOrder: "asc" },
  });
  const now = Date.now();
  for (const capability of capabilities) {
    const current = unassessed.has(capability.code)
      ? null
      : pick([1, 2, 2, 3, 3, 3, 4, 4, 5]);
    const target = Math.min(
      5,
      Math.max(3, (current ?? 2) + pick([0, 1, 1, 1, 2])),
    );
    const months = pick([0, 1, 2, 3, 4, 5, 7, 8, 13, 15]);
    const pillarKey = capability.pillars[0]?.pillar.key ?? "sae";
    await client.capability.update({
      where: { id: capability.id },
      data: {
        currentLevel: current,
        targetLevel: target,
        confidence:
          current == null ? null : pick(["low", "medium", "high"] as const),
        reviewState:
          current == null ? "draft" : months > 6 ? "reviewed" : "submitted",
        rationale: current == null ? null : DEMO_RATIONALE,
        assessedAt:
          current == null ? null : new Date(now - months * 30.4 * 86_400_000),
        assessedById: null,
        targetDate: new Date(
          Date.UTC(
            2027 + (target - (current ?? 1) > 1 ? 1 : 0),
            pick([2, 5, 8, 11]),
            28,
          ),
        ),
        accountableFunctionId: noOwner.has(capability.code)
          ? null
          : (allFunctions.find((fn) => fn.name === owners[pillarKey])?.id ??
            null),
      },
    });
    for (const indicator of capability.indicators) {
      const pass = Number(indicator.passThreshold);
      const fail = Number(indicator.failThreshold);
      const outcome = pick(["pass", "pass", "risk", "risk", "fail", "none"]);
      const higher = indicator.direction === "higher";
      const value =
        outcome === "none"
          ? null
          : outcome === "pass"
            ? higher
              ? Math.min(100, pass + Math.round(random() * 3))
              : Math.max(0, pass - Math.round(random() * pass))
            : outcome === "risk"
              ? Math.round(
                  Math.min(pass, fail) + random() * Math.abs(pass - fail),
                )
              : higher
                ? Math.max(0, fail - 1 - Math.round(random() * 10))
                : fail + 1 + Math.round(random() * 10);
      await client.capabilityIndicator.update({
        where: { id: indicator.id },
        data: {
          value,
          measuredAt:
            value == null
              ? null
              : new Date(now - pick([5, 12, 20, 40]) * 86_400_000),
        },
      });
    }
  }
  await client.changeEvent.create({
    data: {
      action: DEMO_ACTION,
      entityType: "Capability",
      entityId: "catalogue",
      details: { note: "Synthetic demo data; remove with db:demo:clear" },
    },
  });
  console.log(
    "Synthetic assessment data written to the",
    process.env.DATABASE_ENVIRONMENT,
    "database.",
  );
} finally {
  await client.$disconnect();
}
