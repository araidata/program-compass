import test from "node:test";
import assert from "node:assert/strict";
import { referenceInputs } from "../../scripts/seed-references";
import {
  alignmentSummary,
  requirementCoverage,
  type RequirementView,
} from "../../src/lib/domain/alignment";
import { defaultMethods } from "../../src/lib/domain/methods";
import type { CapabilityView } from "../../src/lib/domain/capabilities";
const cap = { id: "c", applicable: true, currentLevel: 3 } as CapabilityView;
const req = (id: string, parentId: string | null = null): RequirementView => ({
  id,
  parentId,
  frameworkId: "f",
  identifier: id,
  title: id,
  description: null,
  kind: "requirement",
  sourceUrl: null,
  sourcePage: null,
  sourceDeadline: null,
  revision: "new",
  assessedAt: null,
  scaleVersion: "provisional-1",
  values: {
    applicability: "applicable",
    implementation: "unassessed",
    currentLevel: 1,
    targetLevel: 5,
    notes: null,
    ownerId: null,
    applicableDeadline: null,
    capabilityIds: ["c"],
    mappingRationale: "Reviewed source",
    reviewed: true,
  },
});
test("reference checksums and complete official hierarchies are repeatable", () => {
  const inputs = referenceInputs();
  const csf = inputs.get("nist-csf-2.0.json") as {
    requirements: { kind: string }[];
  };
  assert.equal(
    csf.requirements.filter((r) => r.kind === "subcategory").length,
    106,
  );
  const cjis = inputs.get("cjis-6.0.json") as {
    requirements: {
      identifier: string;
      parent: string | null;
      deadline: string | null;
    }[];
  };
  const ids = new Set(cjis.requirements.map((r) => r.identifier));
  assert.equal(ids.size, cjis.requirements.length);
  for (const r of cjis.requirements) assert.ok(!r.parent || ids.has(r.parent));
  assert.ok(ids.has("H.6.05"));
  assert.ok(cjis.requirements.some((r) => r.deadline === "2027-09-30"));
});
test("coverage separates requirement maturity, unknowns and draft mappings", () => {
  const r = req("r");
  assert.equal(requirementCoverage(r, [cap], 3).status, "Covered (indicative)");
  assert.equal(
    requirementCoverage(
      { ...r, values: { ...r.values, reviewed: false } },
      [cap],
      3,
    ).status,
    "Unmapped",
  );
  assert.equal(
    requirementCoverage(r, [{ ...cap, currentLevel: null }], 3).status,
    "Incomplete",
  );
  assert.equal(
    requirementCoverage(
      { ...r, values: { ...r.values, applicability: "unknown" } },
      [cap],
      3,
    ).status,
    "Unknown applicability",
  );
  assert.equal(r.values.currentLevel, 1);
  assert.equal(cap.currentLevel, 3);
});
test("denominators use applicable leaves and do not duplicate shared capability scores", () => {
  const rows = [
    req("parent"),
    req("a", "parent"),
    req("b", "parent"),
    req("unknown"),
  ];
  rows[3].values.applicability = "unknown";
  rows[2].values.capabilityIds = [];
  const s = alignmentSummary(
    { frameworks: [], requirements: rows, people: [] },
    [cap],
    defaultMethods,
    "f",
  );
  assert.deepEqual(
    {
      leaves: s.leaves,
      applicable: s.applicable,
      covered: s.covered,
      unknown: s.unknown,
      coverage: s.coverage,
    },
    { leaves: 3, applicable: 2, covered: 1, unknown: 1, coverage: 50 },
  );
});

test("pillar filtering does not convert an official parent into a leaf denominator", () => {
  const parent = req("parent");
  const child = req("child", "parent");
  const data = { frameworks: [], requirements: [parent], people: [] };
  const summary = alignmentSummary(data, [cap], defaultMethods, "f", [
    parent,
    child,
  ]);
  assert.equal(summary.leaves, 0);
  assert.equal(summary.applicable, 0);
});
