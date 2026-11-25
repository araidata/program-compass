import test from "node:test";
import { defaultMethodValues } from "../../src/lib/domain/methods";
import assert from "node:assert/strict";
import {
  dependencyCycle,
  projectedLevel,
  planningSchemas,
  type PlanningRow,
} from "../../src/lib/domain/planning";
test("dependency validation rejects self and indirect cycles", () => {
  assert.equal(
    dependencyCycle(
      [
        { id: "a", dependencies: ["b"] },
        { id: "b", dependencies: [] },
      ],
      "b",
      ["a"],
    ),
    true,
  );
  assert.equal(dependencyCycle([], "a", ["a"]), true);
  assert.equal(
    dependencyCycle([{ id: "a", dependencies: [] }], "b", ["a"]),
    false,
  );
});
test("forecasts use strongest eligible uplift, preserve unknowns and exclude completed/proposed/undated work", () => {
  const row = (
    id: string,
    uplift: number,
    patch: Record<string, unknown> = {},
  ) =>
    ({
      id,
      revision: "fixture",
      kind: "initiative",
      values: {
        investmentState: "approved",
        status: "planned",
        endDate: "2027-06-01",
        ...patch,
      },
      uplifts: [{ capabilityId: "c", uplift, rationale: "estimate" }],
    }) as PlanningRow;
  const rows = [
    row("a", 1),
    row("b", 2),
    row("c", 4, { status: "completed" }),
    row("d", 4, { investmentState: "proposed" }),
    row("e", 4, { endDate: null }),
  ];
  assert.equal(projectedLevel(2, rows, "c", "2027-12-31"), 4);
  assert.equal(projectedLevel(4, rows, "c", "2027-12-31"), 5);
  assert.equal(projectedLevel(null, rows, "c", "2027-12-31"), null);
  assert.equal(projectedLevel(2, rows, "c", "2027-01-01"), 2);
});
test("planning issues need a real strategic link and valid dates", () => {
  const v = {
    title: "Deficiency",
    description: "Gap",
    source: "Source",
    consequence: "Investment",
    ownerId: null,
    openedDate: "2026-01-01",
    dueDate: null,
    status: "open",
    capabilityIds: [],
    requirementIds: [],
    initiativeIds: [],
  };
  assert.equal(planningSchemas.issue.safeParse(v).success, false);
  assert.equal(
    planningSchemas.issue.safeParse({ ...v, capabilityIds: ["c"] }).success,
    true,
  );
  assert.equal(
    planningSchemas.issue.safeParse({
      ...v,
      capabilityIds: ["c"],
      dueDate: "2025-12-31",
    }).success,
    false,
  );
});

test("projection eligibility is saved configuration and never lowers actual maturity", () => {
  const row: PlanningRow = {
    id: "i",
    kind: "initiative",
    revision: "fixture",
    values: {
      investmentState: "proposed",
      status: "on-hold",
      endDate: "2027-01-01",
    },
    uplifts: [{ capabilityId: "c", uplift: 4, rationale: "provisional" }],
  };
  assert.equal(projectedLevel(2, [row], "c", "2027-12-31"), 2);
  const methods = {
    ...defaultMethodValues,
    projectionRequiresApproval: false,
    projectionStatuses: ["on-hold" as const],
    projectionCap: 3,
  };
  assert.equal(projectedLevel(2, [row], "c", "2027-12-31", methods), 3);
  assert.equal(projectedLevel(4, [row], "c", "2027-12-31", methods), 4);
});
