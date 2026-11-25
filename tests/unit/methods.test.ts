import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultMethods,
  methodValuesSchema,
  methodInput,
} from "../../src/lib/domain/methods";
import { readiness } from "../../src/lib/domain/context";
import {
  reviewStatus,
  type CapabilityView,
} from "../../src/lib/domain/capabilities";
test("versioned method defaults preserve baseline and reject inconsistent thresholds/cadence", () => {
  assert.equal(
    methodValuesSchema.safeParse(defaultMethods.values).success,
    true,
  );
  for (const patch of [
    { reviewDueMonths: 12 },
    { readinessPartial: 3 },
    { coverageThreshold: 0 },
    { currency: "dollars" },
  ])
    assert.equal(
      methodValuesSchema.safeParse({ ...defaultMethods.values, ...patch })
        .success,
      false,
    );
  assert.equal(
    methodInput.safeParse({
      values: defaultMethods.values,
      basis: "estimate",
      effectiveDate: "2026-02-30",
      provisional: true,
      revision: "x",
    }).success,
    false,
  );
});
test("readiness and review calculations consume supplied method values without changing unknown rules", () => {
  const methods = {
    ...defaultMethods,
    values: {
      ...defaultMethods.values,
      reviewDueMonths: 1,
      reviewOverdueMonths: 2,
      readinessDefended: 4,
    },
  };
  const capability = {
    id: "a",
    applicable: true,
    currentLevel: 3,
    assessedAt: "2026-01-01T00:00:00Z",
    methods,
  } as CapabilityView;
  assert.equal(
    readiness(["a"], [capability], methods.values).state,
    "Partly defended",
  );
  assert.equal(
    reviewStatus(capability, new Date("2026-03-01T00:00:00Z")),
    "overdue",
  );
  assert.equal(
    readiness(["a"], [{ ...capability, currentLevel: null }], methods.values)
      .state,
    "Incomplete",
  );
});
