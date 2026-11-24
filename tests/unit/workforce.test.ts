import test from "node:test";
import assert from "node:assert/strict";
import {
  reportingCycle,
  descendants,
  positionInput,
} from "../../src/lib/domain/workforce";
import { csv } from "../../src/lib/domain/csv";
test("reporting lines reject self and descendant cycles and support multiple roots", () => {
  const people = [
    { id: "a", managerId: null },
    { id: "b", managerId: "a" },
    { id: "c", managerId: "b" },
    { id: "d", managerId: null },
  ];
  assert.equal(reportingCycle(people, "a", "c"), true);
  assert.equal(reportingCycle(people, "a", "a"), true);
  assert.equal(reportingCycle(people, "b", "d"), false);
  assert.deepEqual([...descendants(people, "a")].sort(), ["a", "b", "c"]);
});
test("positions reject invalid FTE, costs and unsupported fields", () => {
  const p = {
    title: "Analyst",
    pillarId: "secops",
    personId: null,
    state: "proposed",
    fte: 1,
    annualCost: null,
    currency: "USD",
    startYear: null,
    justification: null,
  };
  assert.equal(positionInput.safeParse(p).success, true);
  for (const patch of [
    { fte: 0 },
    { fte: 1.1 },
    { annualCost: -1 },
    { currency: "dollars" },
    { role: "admin" },
  ])
    assert.equal(positionInput.safeParse({ ...p, ...patch }).success, false);
});
test("CSV escapes quotes/newlines and neutralizes spreadsheet formulas", () => {
  assert.equal(
    csv([["=SUM(A1)", 'a"b', "line\nnext", null]]),
    `"'=SUM(A1)","a""b","line\nnext",""`,
  );
});
