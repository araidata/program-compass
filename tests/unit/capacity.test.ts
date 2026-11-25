import test from "node:test";
import assert from "node:assert/strict";
import {
  activityDemand,
  activityInput,
  allocationExceeded,
  yearFraction,
  capacityReport,
  constraintStatus,
  type Activity,
  type Assignment,
  type CapacityData,
  type Constraint,
} from "../../src/lib/domain/capacity";
import type { WorkforceData } from "../../src/lib/domain/workforce";
const activity: Activity = {
  title: "Unique service",
  source: "Synthetic estimate",
  active: true,
  workKey: "fixture",
  responsibilityId: "r",
  effectiveDate: "2026-11-24",
  provisional: true,
  year: 2027,
  volume: 10,
  frequency: 12,
  hoursPerUnit: 2,
  fixedHours: 60,
  projectHours: 100,
  growth: 1.1,
  outsourcedHours: 20,
  automatedHours: 20,
  productiveHoursPerFte: 1000,
  workType: "run",
  capabilityIds: ["a", "b"],
  requirementIds: ["x", "y"],
  niceIds: [],
};
const assignment: Assignment = {
  title: "Assignment",
  source: "Synthetic sourced hours",
  active: true,
  positionId: "p",
  personId: "person",
  responsibilityId: "r",
  startDate: "2027-01-01",
  endDate: null,
  allocatedFte: 0.5,
  paidHours: 2000,
  productiveHours: 1000,
  runShare: 0.8,
};
const workforce: WorkforceData = {
  people: [
    {
      id: "person",
      active: true,
      name: "Person",
      title: "Engineer",
      managerId: null,
      revision: "fixture",
    },
  ],
  positions: [
    {
      id: "p",
      state: "authorized",
      personId: "person",
      fte: 1,
      title: "Position",
      pillarId: "pillar",
      annualCost: null,
      currency: "USD",
      startYear: null,
      justification: null,
      revision: "fixture",
    },
  ],
  pillars: [],
  ownership: [],
};
function data(): CapacityData {
  return {
    rows: [
      { id: "a", kind: "activity", revision: "r", values: { ...activity } },
      { id: "b", kind: "assignment", revision: "r", values: { ...assignment } },
    ],
    nice: [],
    niceRelations: [],
  };
}
test("workload uses unique inputs and explicit reductions; unknown is never zero", () => {
  const d = activityDemand(activity);
  assert.equal(d.gross, 440.00000000000006);
  assert.ok(Math.abs(d.hours! - 400) < 1e-8);
  assert.ok(Math.abs(d.fte! - 0.4) < 1e-8);
  assert.equal(activityDemand({ ...activity, volume: null }).hours, null);
  assert.equal(
    activityDemand({ ...activity, productiveHoursPerFte: null }).fte,
    null,
  );
  assert.equal(
    activityInput.safeParse({ ...activity, outsourcedHours: 500 }).success,
    false,
  );
  assert.equal(
    activityInput.safeParse({ ...activity, capabilityIds: ["a", "a"] }).success,
    false,
  );
});
test("dated allocations use inclusive boundaries and detect only overlapping FTE", () => {
  assert.equal(yearFraction("2028-01-01", "2028-12-31", 2028), 1);
  assert.equal(yearFraction("2028-02-29", "2028-02-29", 2028), 1 / 366);
  assert.equal(yearFraction("2029-01-01", null, 2028), 0);
  assert.equal(
    allocationExceeded(
      [
        { ...assignment, allocatedFte: 0.6 },
        { ...assignment, allocatedFte: 0.5 },
      ],
      1,
    ),
    true,
  );
  assert.equal(
    allocationExceeded(
      [
        { ...assignment, endDate: "2027-06-30", allocatedFte: 1 },
        { ...assignment, startDate: "2027-07-01", allocatedFte: 1 },
      ],
      1,
    ),
    false,
  );
  assert.equal(
    allocationExceeded(
      [
        { ...assignment, endDate: "2027-07-01", allocatedFte: 1 },
        { ...assignment, startDate: "2027-07-01", allocatedFte: 1 },
      ],
      1,
    ),
    true,
  );
});
test("mapping counts do not multiply workload; vacancy and proposal capacity stay zero", () => {
  const result = capacityReport(data(), workforce, 2027);
  assert.ok(Math.abs(result.knownHours - 400) < 1e-8);
  assert.equal(result.knownCapacity, 500);
  assert.equal(result.runCapacity, 400);
  assert.ok(Math.abs(result.changeCapacity - 100) < 1e-8);
  assert.equal(result.paidHours, 1000);
  const vacant = {
    ...workforce,
    positions: workforce.positions.map((p) => ({ ...p, personId: null })),
  };
  assert.equal(capacityReport(data(), vacant, 2027).knownCapacity, 0);
  const proposed = {
    ...workforce,
    positions: workforce.positions.map((p) => ({
      ...p,
      state: "proposed" as const,
    })),
  };
  assert.equal(capacityReport(data(), proposed, 2027).knownCapacity, 0);
  const incomplete = data();
  incomplete.rows[1].values.productiveHours = null;
  assert.equal(capacityReport(incomplete, workforce, 2027).shortfall, null);
});
test("minimum coverage, expertise and separation remain independent of workload FTE", () => {
  const c: Constraint = {
    title: "Continuity",
    source: "Synthetic coverage need",
    active: true,
    responsibilityId: "r",
    conflictingResponsibilityId: null,
    kind: "continuity",
    minimumPeople: 2,
    minimumFte: null,
    niceElementId: null,
    minimumSkill: null,
    consequence: "No backup",
    alternatives: "Managed service",
  };
  assert.equal(
    constraintStatus(c, data(), workforce, "2027-12-31").status,
    "Unmet",
  );
  assert.equal(
    constraintStatus(
      { ...c, minimumPeople: 1 },
      data(),
      workforce,
      "2027-12-31",
    ).status,
    "Met (planning)",
  );
  assert.equal(
    constraintStatus(
      {
        ...c,
        kind: "expertise",
        minimumPeople: 1,
        niceElementId: "nice",
        minimumSkill: 3,
      },
      data(),
      workforce,
      "2027-12-31",
    ).status,
    "Unmet",
  );
  const d = data();
  d.rows.push({
    id: "other",
    kind: "assignment",
    revision: "r",
    values: { ...assignment, responsibilityId: "r2" },
  });
  assert.equal(
    constraintStatus(
      { ...c, kind: "separation-of-duties", conflictingResponsibilityId: "r2" },
      d,
      workforce,
      "2027-12-31",
    ).status,
    "Conflict",
  );
  assert.equal(
    capacityReport(data(), workforce, 2027).requiredFte,
    activityDemand(activity).fte,
  );
});
