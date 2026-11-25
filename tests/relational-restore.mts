import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { database } from "../scripts/database";
import {
  readBundle,
  parseBundle,
  tableMetadata,
  previewChanges,
  writeBundle,
  lockBusinessTables,
  bundleHash,
  ExchangeError,
  quoted,
} from "../src/lib/server/exchange-core";
import { validateReferenceBundle } from "../src/lib/server/exchange-references";
import { validateRestoredData } from "../src/lib/server/exchange-validation";
const source = database();
if (
  process.env.RUN_DATABASE_TESTS !== "true" ||
  process.env.DATABASE_ENVIRONMENT !== "development"
)
  throw new Error(
    "Restore checks require the isolated Development database and RUN_DATABASE_TESTS=true",
  );
const schema = `compass_restore_${randomUUID().replaceAll("-", "")}`;
if (!/^compass_restore_[a-f0-9]{32}$/.test(schema))
  throw new Error("Invalid isolated schema name");
const admin = new pg.Client({ connectionString: process.env.DIRECT_URL });
let target: PrismaClient | undefined;
let created = false;
try {
  await admin.connect();
  await admin.query(`CREATE SCHEMA ${quoted(schema)}`);
  created = true;
  await admin.query(`SET search_path TO ${quoted(schema)}`);
  for (const name of (
    await readdir("prisma/migrations", { withFileTypes: true })
  )
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort())
    await admin.query(
      await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"),
    );
  target = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: process.env.DIRECT_URL, max: 1 },
      { schema },
    ),
  });
  const bundle = await source.$transaction((tx) => readBundle(tx), {
    isolationLevel: "RepeatableRead",
    timeout: 60000,
  });
  validateReferenceBundle(bundle);
  const sourceHash = bundleHash(bundle);
  await target.$transaction(
    async (tx) => {
      const meta = await tableMetadata(tx, schema);
      parseBundle(bundle, meta);
      const empty = await readBundle(tx, schema, meta);
      const changes = previewChanges(empty, bundle, meta);
      await lockBusinessTables(tx, meta, schema);
      await writeBundle(tx, bundle, changes, meta, schema);
      await validateRestoredData(tx, bundle);
    },
    { timeout: 180000, maxWait: 10000 },
  );
  const restored = await target.$transaction((tx) => readBundle(tx, schema), {
    isolationLevel: "RepeatableRead",
    timeout: 60000,
  });
  assert.equal(
    bundleHash(restored),
    sourceHash,
    "Relational rows, money, history, captures and joins must round-trip exactly",
  );
  const bad = structuredClone(restored);
  const person = bad.tables.Person[0];
  if (person) {
    person.managerId = person.id;
    person.updatedAt = new Date().toISOString();
  } else {
    const cap = bad.tables.Capability[0];
    cap.ownerPersonId = "missing-person";
  }
  let rolledBack = false;
  try {
    await target.$transaction(
      async (tx) => {
        const meta = await tableMetadata(tx, schema);
        const parsed = parseBundle(bad, meta);
        const before = await readBundle(tx, schema, meta);
        await writeBundle(
          tx,
          parsed,
          previewChanges(before, parsed, meta),
          meta,
          schema,
        );
        await validateRestoredData(tx, parsed);
        throw new Error("Expected invalid restoration to fail");
      },
      { timeout: 180000 },
    );
  } catch (e) {
    const databaseError = e as {
      code?: string;
      meta?: { driverAdapterError?: { cause?: { code?: string } } };
    };
    rolledBack =
      e instanceof ExchangeError ||
      typeof (e as { status?: number }).status === "number" ||
      (databaseError.code === "P2010" &&
        ["23514", "23503"].includes(
          databaseError.meta?.driverAdapterError?.cause?.code ?? "",
        ));
    if (!rolledBack) throw e;
  }
  assert.ok(rolledBack, "Invalid references/hierarchy must be rejected");
  assert.equal(
    bundleHash(
      await target.$transaction((tx) => readBundle(tx, schema), {
        timeout: 60000,
      }),
    ),
    sourceHash,
    "Failed imports must roll back every table",
  );
  const meta = await target.$transaction((tx) => tableMetadata(tx, schema));
  const invalid = structuredClone(restored);
  invalid.schemaVersion = 2 as 1;
  assert.throws(() => parseBundle(invalid, meta), ExchangeError);
  const duplicate = structuredClone(restored);
  duplicate.tables.Capability.push(duplicate.tables.Capability[0]);
  assert.throws(() => parseBundle(duplicate, meta), ExchangeError);
  const tampered = structuredClone(restored);
  tampered.tables.FrameworkRequirement[0].description =
    "Locally changed official source";
  assert.throws(() => validateReferenceBundle(tampered), ExchangeError);
  assert.equal(
    bundleHash(
      await source.$transaction((tx) => readBundle(tx), { timeout: 60000 }),
    ),
    sourceHash,
    "The source Development workspace must remain unchanged",
  );
  console.log(
    JSON.stringify({
      result: "passed",
      tables: Object.keys(restored.tables).length,
      rows: Object.values(restored.tables).reduce((s, r) => s + r.length, 0),
      checks: [
        "isolated restore",
        "exact round trip",
        "rollback",
        "schema version",
        "duplicate identity",
        "pinned source",
        "source preservation",
      ],
    }),
  );
} finally {
  if (target) await target.$disconnect();
  await source.$disconnect();
  if (created) {
    if (!/^compass_restore_[a-f0-9]{32}$/.test(schema))
      throw new Error("Unsafe cleanup target");
    await admin.query(`DROP SCHEMA ${quoted(schema)} CASCADE`);
  }
  await admin.end();
}
