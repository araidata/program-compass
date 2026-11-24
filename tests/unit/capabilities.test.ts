import assert from "node:assert/strict";
import { test } from "node:test";
import {
  byGroup,
  byPillar,
  deficiencies,
  distribution,
  gap,
  indicatorStatus,
  matchesFilter,
  reviewStatus,
  strengths,
  summarize,
  weaknesses,
  type CapabilityView,
  type IndicatorView,
} from "../../src/lib/domain/capabilities";
import { catalogueTopics, displayGroups } from "../../src/lib/domain/catalogue";
import {
  capabilityUpdateSchema,
  indicatorSchema,
} from "../../src/lib/validation";

const now = new Date("2026-11-24T12:00:00Z");

function kpi(partial: Partial<IndicatorView> = {}): IndicatorView {
  return {
    id: crypto.randomUUID(),
    catalogueKey: null,
    name: "KPI",
    unit: "%",
    direction: "higher",
    passThreshold: 95,
    failThreshold: 80,
    value: null,
    measuredAt: null,
    ...partial,
  };
}

function topic(partial: Partial<CapabilityView> = {}): CapabilityView {
  return {
    id: crypto.randomUUID(),
    code: "GV.01",
    groupCode: "GV",
    name: "Topic",
    description: null,
    applicable: true,
    currentLevel: null,
    targetLevel: null,
    confidence: null,
    rationale: null,
    reviewState: "draft",
    targetDate: null,
    accountableFunctionId: "fn",
    accountableFunctionName: "Function",
    assessedAt: null,
    assessedByName: null,
    pillarKeys: ["grc"],
    indicators: [],
    ...partial,
  };
}

test("catalogue preserves the 30 reference topics and 60 KPIs", () => {
  assert.equal(catalogueTopics.length, 30);
  assert.equal(catalogueTopics.flatMap((entry) => entry.kpis).length, 60);
  assert.equal(new Set(catalogueTopics.map((entry) => entry.code)).size, 30);
  const groups = new Set(displayGroups.map((entry) => entry.code));
  for (const entry of catalogueTopics) {
    assert.ok(groups.has(entry.code.slice(0, 2) as never), entry.code);
    assert.ok(entry.pillars.length > 0, entry.code);
    for (const [, pass, fail, direction] of entry.kpis)
      assert.ok(
        direction === "lower" ? pass <= fail : pass >= fail,
        entry.code,
      );
  }
  const lower = catalogueTopics
    .flatMap((entry) => entry.kpis)
    .filter((entry) => entry[3] === "lower")
    .map((entry) => entry[0]);
  assert.deepEqual(lower, [
    "Budget variance",
    "Overly permissive rules",
    "Phishing click rate",
    "False positive rate",
  ]);
});

test("KPI status uses directional pass and fail boundaries", () => {
  // Reference fixture: policy review coverage 88 is at risk, 95 passes.
  assert.equal(indicatorStatus(kpi({ value: 88 })), "at-risk");
  assert.equal(indicatorStatus(kpi({ value: 95 })), "pass");
  assert.equal(indicatorStatus(kpi({ value: 80 })), "at-risk");
  assert.equal(indicatorStatus(kpi({ value: 79.9 })), "fail");
  assert.equal(indicatorStatus(kpi({ value: 0 })), "fail");
  assert.equal(indicatorStatus(kpi({ value: null })), "missing");
  const lower = {
    direction: "lower" as const,
    passThreshold: 5,
    failThreshold: 15,
  };
  assert.equal(indicatorStatus(kpi({ ...lower, value: 5 })), "pass");
  assert.equal(indicatorStatus(kpi({ ...lower, value: 15 })), "at-risk");
  assert.equal(indicatorStatus(kpi({ ...lower, value: 15.1 })), "fail");
  assert.equal(indicatorStatus(kpi({ ...lower, value: 0 })), "pass");
});

test("gaps treat unassessed and non-applicable topics as unknown", () => {
  assert.equal(gap(topic({ currentLevel: 2, targetLevel: 4 })), 2);
  assert.equal(gap(topic({ currentLevel: 4, targetLevel: 3 })), -1);
  assert.equal(gap(topic({ currentLevel: null, targetLevel: 4 })), null);
  assert.equal(gap(topic({ currentLevel: 2, targetLevel: null })), null);
  assert.equal(
    gap(topic({ currentLevel: 1, targetLevel: 5, applicable: false })),
    null,
  );
});

test("review status follows the six and twelve month cadence at calendar boundaries", () => {
  assert.equal(reviewStatus({ assessedAt: null }, now), "never");
  assert.equal(
    reviewStatus({ assessedAt: "2026-05-25T12:00:00Z" }, now),
    "current",
  );
  assert.equal(
    reviewStatus({ assessedAt: "2026-05-24T12:00:00Z" }, now),
    "due",
  );
  assert.equal(
    reviewStatus({ assessedAt: "2025-11-25T12:00:00Z" }, now),
    "due",
  );
  assert.equal(
    reviewStatus({ assessedAt: "2025-11-24T12:00:00Z" }, now),
    "overdue",
  );
});

test("summary excludes unknowns from means and reconciles counts", () => {
  const items = [
    topic({
      currentLevel: 1,
      targetLevel: 3,
      assessedAt: "2026-10-01T00:00:00Z",
      indicators: [kpi({ value: 99 }), kpi({ value: 50 })],
    }),
    topic({
      currentLevel: 4,
      targetLevel: 4,
      assessedAt: "2025-01-01T00:00:00Z",
      accountableFunctionId: null,
      indicators: [kpi({ value: 85 })],
    }),
    topic({ currentLevel: null, targetLevel: 3 }),
    topic({
      currentLevel: 2,
      targetLevel: null,
      assessedAt: "2026-04-01T00:00:00Z",
    }),
    topic({
      currentLevel: 5,
      targetLevel: 5,
      applicable: false,
      indicators: [kpi({ value: 10 })],
    }),
  ];
  const summary = summarize(items, now);
  assert.equal(summary.total, 5);
  assert.equal(summary.applicable, 4);
  assert.equal(summary.notApplicable, 1);
  assert.equal(summary.assessed, 3);
  assert.equal(summary.unassessed, 1);
  assert.equal(summary.averageCurrent, (1 + 4 + 2) / 3);
  assert.equal(summary.averageTarget, (3 + 4 + 3) / 3);
  assert.equal(summary.averageGap, (2 + 0) / 2);
  assert.equal(summary.belowTarget, 1);
  assert.equal(summary.levelsToClose, 2);
  assert.equal(summary.noTarget, 1);
  assert.equal(summary.noOwner, 1);
  assert.equal(summary.reviewDue, 1);
  assert.equal(summary.reviewOverdue, 1);
  assert.deepEqual(summary.indicators, {
    total: 3,
    pass: 1,
    atRisk: 1,
    fail: 1,
    missing: 0,
  });

  const counts = distribution(items);
  assert.deepEqual(counts.current, [1, 1, 0, 1, 0]);
  assert.equal(counts.unassessed, 1);
  assert.equal(counts.noTarget, 1);
  assert.equal(
    counts.current.reduce((sum, value) => sum + value, 0) + counts.unassessed,
    summary.applicable,
  );
  assert.equal(summarize([], now).averageCurrent, null);
});

test("group, pillar and ranking selectors", () => {
  const a = topic({
    code: "GV.01",
    currentLevel: 2,
    targetLevel: 4,
    pillarKeys: ["grc", "sae"],
  });
  const b = topic({
    code: "PR.01",
    groupCode: "PR",
    currentLevel: 4,
    targetLevel: 4,
    pillarKeys: ["sae"],
  });
  const c = topic({
    code: "PR.02",
    groupCode: "PR",
    currentLevel: 1,
    targetLevel: 2,
    pillarKeys: ["sae"],
  });
  const groups = byGroup([a, b, c]);
  assert.equal(groups.length, 5);
  const protect = groups.find((entry) => entry.key === "PR")!;
  assert.equal(protect.averageCurrent, 2.5);
  assert.equal(protect.weakest?.code, "PR.02");
  assert.equal(
    groups.find((entry) => entry.key === "DE")!.averageCurrent,
    null,
  );
  const pillars = byPillar(
    [a, b, c],
    [
      { key: "sae", name: "SA&E" },
      { key: "grc", name: "GRC" },
    ],
  );
  assert.equal(pillars[0].count, 3);
  assert.equal(pillars[1].count, 1);
  assert.deepEqual(
    weaknesses([a, b, c]).map((entry) => entry.code),
    ["GV.01", "PR.02"],
  );
  assert.deepEqual(
    strengths([a, b, c]).map((entry) => entry.code),
    ["PR.01"],
  );
  assert.deepEqual(
    deficiencies([a, b, c]).map((entry) => entry.code),
    ["PR.02", "GV.01"],
  );
  assert.equal(matchesFilter(a, "below", now), true);
  assert.equal(matchesFilter(b, "below", now), false);
  assert.equal(matchesFilter(topic(), "unassessed", now), true);
  assert.equal(
    matchesFilter(topic({ applicable: false }), "unassessed", now),
    false,
  );
});

test("assessment and KPI inputs are strictly validated", () => {
  assert.ok(capabilityUpdateSchema.safeParse({ currentLevel: 3 }).success);
  assert.ok(capabilityUpdateSchema.safeParse({ currentLevel: null }).success);
  assert.equal(
    capabilityUpdateSchema.safeParse({ currentLevel: 0 }).success,
    false,
  );
  assert.equal(
    capabilityUpdateSchema.safeParse({ currentLevel: 6 }).success,
    false,
  );
  assert.equal(
    capabilityUpdateSchema.safeParse({ currentLevel: 2.5 }).success,
    false,
  );
  assert.equal(capabilityUpdateSchema.safeParse({}).success, false);
  assert.equal(
    capabilityUpdateSchema.safeParse({ assessedById: "x" }).success,
    false,
  );
  assert.equal(
    capabilityUpdateSchema.safeParse({ targetDate: "2027-02-30x" }).success,
    false,
  );
  assert.equal(
    capabilityUpdateSchema.safeParse({ pillarKeys: [] }).success,
    false,
  );
  const valid = {
    name: "Local",
    unit: "%",
    direction: "higher",
    passThreshold: 90,
    failThreshold: 70,
    value: null,
    measuredAt: null,
  };
  assert.ok(indicatorSchema.safeParse(valid).success);
  assert.equal(
    indicatorSchema.safeParse({ ...valid, passThreshold: 60 }).success,
    false,
  );
  assert.ok(
    indicatorSchema.safeParse({
      ...valid,
      direction: "lower",
      passThreshold: 5,
      failThreshold: 15,
    }).success,
  );
});

test("dates reject impossible days and pillar lists reject duplicates", () => {
  for (const targetDate of [
    "2027-02-30",
    "2027-02-29",
    "2026-04-31",
    "2026-13-01",
  ])
    assert.equal(
      capabilityUpdateSchema.safeParse({ targetDate }).success,
      false,
    );
  assert.ok(
    capabilityUpdateSchema.safeParse({ targetDate: "2028-02-29" }).success,
  );
  assert.equal(
    capabilityUpdateSchema.safeParse({ pillarKeys: ["grc", "grc"] }).success,
    false,
  );
});

test("review cadence clamps month-end dates to the last calendar day", () => {
  assert.equal(
    reviewStatus(
      { assessedAt: "2026-08-31T12:00:00Z" },
      new Date("2027-02-28T11:59:59Z"),
    ),
    "current",
  );
  assert.equal(
    reviewStatus(
      { assessedAt: "2026-08-31T12:00:00Z" },
      new Date("2027-02-28T12:00:00Z"),
    ),
    "due",
  );
});
