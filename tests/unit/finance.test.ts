import test from "node:test";
import assert from "node:assert/strict";
import {
  annualCost,
  scheduledCost,
  costLines,
  scenarioReport,
  type Scenario,
  type CostLine,
  type FinanceData,
  type FinanceRow,
} from "../../src/lib/domain/finance";
import { defaultMethods } from "../../src/lib/domain/methods";
import type { PlanningData, PlanningRow } from "../../src/lib/domain/planning";
import type { WorkforceData } from "../../src/lib/domain/workforce";
import type { CapabilityView } from "../../src/lib/domain/capabilities";
const scenario: Scenario = {
  title: "Plan",
  kind: "existing-funding",
  source: "Synthetic planning basis",
  methodVersionId: defaultMethods.id,
  startYear: 2027,
  fiscalStartMonth: 1,
  currency: "USD",
  active: true,
};
const line: CostLine = {
  identity: "additional:test",
  title: "Annual service",
  initiativeId: "i",
  positionId: null,
  technologyId: null,
  capabilityId: null,
  component: "additional",
  category: "operating",
  frequency: "annual",
  amount: "1200.00",
  currency: "USD",
  startDate: "2027-07-01",
  endDate: null,
  escalationPercent: 10,
  baseline: false,
  saving: false,
  source: "Synthetic quote",
  active: true,
  derived: false,
};
const workforce: WorkforceData = {
  people: [],
  positions: [],
  ownership: [],
  pillars: [],
};
const planning: PlanningData = {
  rows: [],
  options: {
    people: [],
    positions: [],
    functions: [],
    capabilities: [],
    requirements: [],
    objectives: [],
  },
};
const cap: CapabilityView = {
  id: "c",
  code: "C",
  groupCode: "G",
  name: "Capability",
  description: null,
  applicable: true,
  currentLevel: 2,
  targetLevel: 4,
  confidence: null,
  rationale: null,
  reviewState: "draft",
  targetDate: null,
  accountableFunctionId: null,
  accountableFunctionName: null,
  assessedAt: null,
  assessedByName: null,
  pillarKeys: [],
  indicators: [],
};
const row = (
  id: string,
  kind: FinanceRow["kind"],
  values: FinanceRow["values"],
): FinanceRow => ({ id, kind, values, revision: "fixture" });
const member = (
  id: string,
  scenarioId: string,
  startDate: string,
  endDate: string,
): FinanceRow =>
  row(id, "item", {
    title: "Include investment",
    scenarioId,
    initiativeId: "i",
    positionId: null,
    technologyId: null,
    included: true,
    startDate,
    endDate,
    source: "Synthetic schedule",
    deferral: "Gap persists",
  });
test("Decimal cost arithmetic uses monthly activation and anniversary escalation without binary currency errors", () => {
  assert.equal(
    annualCost(line, scenario, 2027, defaultMethods).amount,
    "600.00",
  );
  assert.equal(
    annualCost(line, scenario, 2028, defaultMethods).amount,
    "1260.00",
  );
  assert.equal(
    annualCost(line, scenario, 2029, defaultMethods).amount,
    "1386.00",
  );
  assert.equal(
    annualCost(
      {
        ...line,
        amount: "0.10",
        escalationPercent: 0,
        startDate: "2027-01-01",
      },
      scenario,
      2027,
      defaultMethods,
    ).amount,
    "0.10",
  );
  assert.equal(
    annualCost(
      { ...line, frequency: "once", amount: "0.10" },
      scenario,
      2027,
      defaultMethods,
    ).amount,
    "0.10",
  );
  assert.equal(
    annualCost({ ...line, frequency: "once" }, scenario, 2028, defaultMethods)
      .amount,
    "0.00",
  );
  assert.equal(
    annualCost({ ...line, saving: true }, scenario, 2027, defaultMethods)
      .amount,
    "-600.00",
  );
  assert.equal(
    annualCost(
      { ...line, startDate: "2027-10-01", escalationPercent: 0 },
      { ...scenario, fiscalStartMonth: 7 },
      2027,
      defaultMethods,
    ).amount,
    "900.00",
  );
  assert.equal(
    annualCost(
      { ...line, endDate: "2027-08-31" },
      scenario,
      2027,
      defaultMethods,
    ).amount,
    "200.00",
  );
});
test("unknown amounts, dates and mismatched currency stay incomplete", () => {
  for (const v of [{ amount: null }, { startDate: null }, { currency: "CAD" }])
    assert.equal(
      annualCost({ ...line, ...v }, scenario, 2027, defaultMethods).amount,
      null,
    );
});
test("resource costs have unique identities, technology licensing and operating stay separate and explicit overrides replace once", () => {
  const technology: PlanningRow = {
    id: "t",
    kind: "technology",
    revision: "fixture",
    values: {
      title: "Existing tool",
      state: "existing",
      startDate: "2020-01-01",
      annualLicenseCost: 1200,
      annualOperatingCost: 200,
      implementationCost: 999,
      currency: "USD",
    },
  };
  const data: FinanceData = { methods: [defaultMethods], rows: [] };
  let lines = costLines(
    data,
    { ...planning, rows: [technology] },
    workforce,
    scenario,
  );
  assert.equal(lines.length, 2);
  assert.equal(new Set(lines.map((l) => l.identity)).size, 2);
  assert.ok(lines.every((l) => l.startDate === "2027-01-01"));
  data.rows.push(
    row("override", "cost", {
      ...line,
      identity: "technology:t:resource-license",
      initiativeId: null,
      technologyId: "t",
      component: "resource-license",
      category: "licensing",
      amount: "900.00",
      startDate: "2027-01-01",
      escalationPercent: 0,
      baseline: true,
    }),
  );
  lines = costLines(
    data,
    { ...planning, rows: [technology] },
    workforce,
    scenario,
  );
  assert.equal(lines.length, 2);
  assert.equal(
    lines.find((l) => l.identity === "technology:t:resource-license")?.amount,
    "900.00",
  );
});
test("scenario timing and budgets are isolated; initiative completion dates do not stop recurring operational spending", () => {
  const s1 = row("s1", "scenario", { ...scenario });
  const s2 = row("s2", "scenario", { ...scenario, title: "Deferred" });
  const initiative: PlanningRow = {
    id: "i",
    kind: "initiative",
    revision: "fixture",
    values: {
      title: "Investment",
      investmentState: "approved",
      status: "planned",
      startDate: "2027-01-01",
      endDate: "2027-06-30",
      oneTimeCost: 120,
      recurringCost: 1200,
      currency: "USD",
      dependencyIds: ["unfunded"],
      positionIds: [],
      technologyIds: [],
      requirementIds: [],
    },
    uplifts: [{ capabilityId: "c", uplift: 1, rationale: "Synthetic uplift" }],
  };
  const p = { ...planning, rows: [initiative] };
  const d: FinanceData = {
    methods: [defaultMethods],
    rows: [
      s1,
      s2,
      member("m1", "s1", "2027-01-01", "2027-06-30"),
      member("m2", "s2", "2028-01-01", "2028-06-30"),
      row("budget", "budget", {
        title: "Limit",
        source: "Synthetic budget",
        scenarioId: "s1",
        year: 2027,
        amount: "100.00",
      }),
    ],
  };
  const saved = JSON.stringify({ d, p, cap });
  const a = scenarioReport(
    d,
    p,
    workforce,
    [cap],
    { frameworks: [], requirements: [], people: [] },
    s1,
  );
  const b = scenarioReport(
    d,
    p,
    workforce,
    [cap],
    { frameworks: [], requirements: [], people: [] },
    s2,
  );
  assert.equal(a.annual[0].total, "1320.00");
  assert.equal(a.annual[1].total, "1200.00");
  assert.equal(b.annual[0].total, "0.00");
  assert.equal(b.annual[1].total, "1320.00");
  assert.equal(a.annual[0].gaps[0].projected, 3);
  assert.equal(b.annual[0].gaps[0].projected, 2);
  assert.equal(a.annual[0].overBudget, true);
  assert.ok(a.constraints.some((c) => c.type === "Dependency omitted"));
  assert.equal(JSON.stringify({ d, p, cap }), saved);
});

test("rescheduling preserves distinct cost offsets and baseline horizon assumptions", () => {
  const p: PlanningData = {
    ...planning,
    rows: [
      {
        id: "i",
        kind: "initiative",
        revision: "fixture",
        values: { startDate: "2027-01-01" },
      },
    ],
  };
  const m = {
    title: "Schedule",
    scenarioId: "s",
    initiativeId: "i",
    positionId: null,
    technologyId: null,
    included: true,
    startDate: "2028-01-01",
    endDate: "2028-06-30",
    source: "Source",
    deferral: "Deferral",
  };
  const shifted = scheduledCost(
    { ...line, startDate: "2029-03-01" },
    m,
    p,
    workforce,
    scenario,
  );
  assert.equal(shifted.startDate, "2030-03-01");
  assert.equal(shifted.endDate, null);
  const t = {
    ...planning,
    rows: [
      {
        id: "t",
        kind: "technology" as const,
        revision: "fixture",
        values: { startDate: "2020-01-01" },
      },
    ],
  };
  const baseline = scheduledCost(
    {
      ...line,
      baseline: true,
      initiativeId: null,
      technologyId: "t",
      startDate: "2027-01-01",
    },
    { ...m, initiativeId: null, technologyId: "t" },
    t,
    workforce,
    scenario,
  );
  assert.equal(baseline.startDate, "2028-01-01");
  assert.equal(baseline.endDate, "2028-06-30");
});
