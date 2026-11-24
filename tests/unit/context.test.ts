import assert from "node:assert/strict";
import test from "node:test";
import {
  readiness,
  objectiveCapabilities,
  contextInput,
} from "../../src/lib/domain/context";
import type { CapabilityView } from "../../src/lib/domain/capabilities";
const cap = (id: string, currentLevel: number | null, applicable = true) =>
  ({ id, currentLevel, applicable }) as CapabilityView;
test("readiness deduplicates mapped capabilities and discloses unknown/nonapplicable/unmapped", () => {
  const capabilities = [
    cap("a", 3),
    cap("b", 2),
    cap("c", null),
    cap("d", 5, false),
  ];
  assert.equal(readiness(["a", "a"], capabilities).mean, 3);
  assert.equal(readiness(["a", "b"], capabilities).state, "Partly defended");
  assert.equal(readiness(["a", "c"], capabilities).state, "Incomplete");
  assert.equal(readiness(["d"], capabilities).state, "Not applicable");
  assert.equal(readiness([], capabilities).state, "Unmapped");
});
test("objective readiness uses a union of direct links and active threats", () => {
  const o = { id: "o", capabilityIds: ["a"] } as Parameters<
    typeof objectiveCapabilities
  >[0];
  const threats = [
    { active: true, objectiveIds: ["o"], capabilityIds: ["a", "b"] },
    { active: false, objectiveIds: ["o"], capabilityIds: ["c"] },
  ] as Parameters<typeof objectiveCapabilities>[1];
  assert.deepEqual(objectiveCapabilities(o, threats), ["a", "b"]);
});
test("context rejects duplicate links, invented fields and out-of-range estimates", () => {
  const input = {
    kind: "threat",
    values: {
      title: "Disruption",
      scenario: "Business service disruption",
      basis: "Organizational estimate for investment prioritization",
      active: true,
      likelihood: 3,
      impact: 5,
      objectiveIds: [],
      capabilityIds: ["a"],
    },
  };
  assert.equal(contextInput.safeParse(input).success, true);
  for (const patch of [
    { capabilityIds: ["a", "a"] },
    { likelihood: 0 },
    { impact: 6 },
    { riskAcceptance: true },
  ])
    assert.equal(
      contextInput.safeParse({
        ...input,
        values: { ...input.values, ...patch },
      }).success,
      false,
    );
});
