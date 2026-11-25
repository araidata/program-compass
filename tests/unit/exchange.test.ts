import test from "node:test";
import assert from "node:assert/strict";
import {
  canonical,
  sha256,
  parseBundle,
  previewChanges,
  ExchangeError,
  quoted,
  type TableMeta,
  type RelationalBundle,
} from "../../src/lib/server/exchange-core";
const column = (name: string, type = "text", nullable = false) => ({
  name,
  type,
  nullable,
  typeSchema: "pg_catalog",
  dataType: type,
  precision: type === "numeric" ? 16 : null,
  scale: type === "numeric" ? 2 : null,
});
const meta: TableMeta[] = [
  {
    name: "Person",
    columns: [
      column("id"),
      column("managerId", "text", true),
      column("updatedAt", "timestamp"),
    ],
    keys: ["id"],
    references: [{ field: "managerId", target: "Person" }],
  },
];
function bundle(): RelationalBundle {
  return {
    format: "program-compass-relational",
    schemaVersion: 1,
    schemaHash: sha256(canonical(meta)),
    exportedAt: "2026-11-24T18:00:00.000Z",
    tables: {
      Person: [
        { id: "p", managerId: null, updatedAt: "2026-11-24T17:00:00.000Z" },
      ],
    },
  };
}
test("relational parsing rejects duplicate identities, dangling references, auth tables and schema mismatches", () => {
  assert.equal(parseBundle(bundle(), meta).tables.Person.length, 1);
  const duplicate = bundle();
  duplicate.tables.Person.push(duplicate.tables.Person[0]);
  assert.throws(() => parseBundle(duplicate, meta), ExchangeError);
  const missing = bundle();
  missing.tables.Person[0].managerId = "missing";
  assert.throws(() => parseBundle(missing, meta), /Dangling reference/);
  const auth = bundle();
  auth.tables.Account = [];
  assert.throws(
    () => parseBundle(auth, meta),
    /authentication data is excluded/,
  );
  const version = bundle();
  version.schemaHash = "unsupported";
  assert.throws(() => parseBundle(version, meta), /schema\/version/);
  assert.throws(() => quoted('Person"; DROP TABLE User'), ExchangeError);
});
test("import preview rejects stale and immutable replacements and shows actual changed fields", () => {
  const current = bundle(),
    incoming = bundle();
  incoming.tables.Person[0].managerId = "p";
  incoming.tables.Person[0].updatedAt = "2026-11-24T16:00:00.000Z";
  assert.throws(() => previewChanges(current, incoming, meta), /Stale/);
  incoming.tables.Person[0].updatedAt = "2026-11-24T18:00:00.000Z";
  const changes = previewChanges(current, incoming, meta);
  assert.equal(changes[0].action, "update");
  assert.deepEqual(changes[0].fields, ["managerId", "updatedAt"]);
  const immutableMeta: TableMeta[] = [
    {
      name: "PlanningMethodVersion",
      columns: [column("id"), column("values", "jsonb")],
      keys: ["id"],
      references: [],
    },
  ];
  const a = {
    ...bundle(),
    tables: { PlanningMethodVersion: [{ id: "v", values: { threshold: 3 } }] },
  };
  const b = structuredClone(a);
  b.tables.PlanningMethodVersion[0].values.threshold = 4;
  assert.throws(() => previewChanges(a, b, immutableMeta), /Immutable/);
});
test("decimal import inputs reject excess scale and canonical fingerprints preserve types and nulls", () => {
  const m: TableMeta[] = [
    {
      name: "FinancialCost",
      columns: [column("id"), column("amount", "numeric", true)],
      keys: ["id"],
      references: [],
    },
  ];
  const b = {
    ...bundle(),
    schemaHash: sha256(canonical(m)),
    tables: { FinancialCost: [{ id: "c", amount: "0.10" }] },
  };
  assert.equal(parseBundle(b, m).tables.FinancialCost[0].amount, "0.10");
  b.tables.FinancialCost[0].amount = "0.123";
  assert.throws(() => parseBundle(b, m), /precision/);
  assert.equal(canonical({ b: null, a: 0 }), canonical({ a: 0, b: null }));
  assert.notEqual(sha256(canonical({ a: null })), sha256(canonical({ a: 0 })));
});
