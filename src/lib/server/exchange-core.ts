/** Relational interchange engine. No app globals: callers supply a transaction/schema. */
import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
export class ExchangeError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const businessTables = [
  "Organization",
  "ApplicationSettings",
  "Pillar",
  "OrganizationalFunction",
  "PlanningMethodVersion",
  "Person",
  "Capability",
  "CapabilityPillar",
  "CapabilityIndicator",
  "Framework",
  "FrameworkRequirement",
  "CapabilityRequirementMapping",
  "Position",
  "OrganizationProfile",
  "BusinessObjective",
  "BusinessThreat",
  "ObjectiveCapability",
  "ThreatObjective",
  "ThreatCapability",
  "Responsibility",
  "PlanningIssue",
  "Technology",
  "Initiative",
  "InitiativeCapability",
  "RequirementAssessment",
  "NiceElement",
  "NiceRelation",
  "WorkActivity",
  "CapacityAssignment",
  "SkillObservation",
  "WorkforceConstraint",
  "PlanningScenario",
  "ScenarioItem",
  "AnnualCapabilityTarget",
  "ScenarioBudget",
  "FinancialCost",
  "PlanningCycle",
  "CapabilitySnapshot",
  "ChangeEvent",
] as const;
const immutable = new Set([
  "PlanningMethodVersion",
  "Framework",
  "FrameworkRequirement",
  "NiceElement",
  "NiceRelation",
  "PlanningCycle",
  "CapabilitySnapshot",
  "ChangeEvent",
]);
const authColumns = new Set(["assessedById", "updatedById", "actorId"]);
const mutableJoins: Record<string, { field: string; target: string }> = {
  CapabilityPillar: { field: "capabilityId", target: "Capability" },
  CapabilityRequirementMapping: {
    field: "capabilityId",
    target: "Capability",
  },
  ObjectiveCapability: { field: "objectiveId", target: "BusinessObjective" },
  ThreatObjective: { field: "threatId", target: "BusinessThreat" },
  ThreatCapability: { field: "threatId", target: "BusinessThreat" },
  InitiativeCapability: { field: "initiativeId", target: "Initiative" },
};

export type RelationalRow = Record<string, unknown>;
export type RelationalBundle = {
  format: "program-compass-relational";
  schemaVersion: 1;
  schemaHash: string;
  exportedAt: string;
  tables: Record<string, RelationalRow[]>;
};
export type ImportChange = {
  table: string;
  identity: string;
  action: "create" | "update" | "relationships" | "unlink";
  fields: string[];
  before: RelationalRow | null;
  after: RelationalRow;
};
export type TableMeta = {
  name: string;
  columns: {
    name: string;
    type: string;
    typeSchema: string;
    nullable: boolean;
    dataType: string;
    precision: number | null;
    scale: number | null;
  }[];
  keys: string[];
  references: { field: string; target: string }[];
};
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "undefined";
}
export const sha256 = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
export const bundleHash = (bundle: RelationalBundle) =>
  sha256(canonical(bundle.tables));
export const quoted = (name: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
    throw new ExchangeError(400, "Invalid database identity");
  return `"${name}"`;
};
export async function tableMetadata(
  tx: Prisma.TransactionClient,
  schema = "public",
): Promise<TableMeta[]> {
  quoted(schema);
  const columns = await tx.$queryRawUnsafe<
    {
      table: string;
      name: string;
      type: string;
      typeSchema: string;
      nullable: boolean;
      dataType: string;
      precision: number | null;
      scale: number | null;
    }[]
  >(
    `SELECT table_name AS "table",column_name AS name,udt_name AS type,udt_schema AS "typeSchema",is_nullable='YES' AS nullable,data_type AS "dataType",numeric_precision AS precision,numeric_scale AS scale FROM information_schema.columns WHERE table_schema=$1 ORDER BY table_name,ordinal_position`,
    schema,
  );
  const foreign = await tx.$queryRawUnsafe<
    { table: string; target: string; field: string }[]
  >(
    `SELECT tc.table_name AS "table",ccu.table_name AS target,kcu.column_name AS field FROM information_schema.table_constraints tc JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.constraint_schema=tc.constraint_schema JOIN information_schema.key_column_usage kcu ON kcu.constraint_name=tc.constraint_name AND kcu.constraint_schema=tc.constraint_schema WHERE tc.table_schema=$1 AND tc.constraint_type='FOREIGN KEY'`,
    schema,
  );
  const known = new Set<string>(businessTables);
  const joins = [...new Set(columns.map((c) => c.table))]
    .filter(
      (t) =>
        t.startsWith("_") &&
        foreign.some((f) => f.table === t) &&
        foreign.filter((f) => f.table === t).every((f) => known.has(f.target)),
    )
    .sort();
  const keys = await tx.$queryRawUnsafe<{ table: string; column: string }[]>(
    `SELECT tc.table_name AS "table",kcu.column_name AS column FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON kcu.constraint_name=tc.constraint_name AND kcu.constraint_schema=tc.constraint_schema AND kcu.table_name=tc.table_name WHERE tc.table_schema=$1 AND tc.constraint_type='PRIMARY KEY' ORDER BY tc.table_name,kcu.ordinal_position`,
    schema,
  );
  return [...businessTables, ...joins].map((name) => {
    const c = columns
      .filter((c) => c.table === name)
      .map(
        ({ name, type, typeSchema, nullable, dataType, precision, scale }) => ({
          name,
          type,
          typeSchema: typeSchema === schema ? "$business" : typeSchema,
          nullable,
          dataType,
          precision,
          scale,
        }),
      );
    const k = keys.filter((k) => k.table === name).map((k) => k.column);
    if (!c.length || !k.length)
      throw new ExchangeError(
        409,
        "Database schema is not ready for relational interchange",
      );
    return {
      name,
      columns: c,
      keys: k,
      references: foreign
        .filter((f) => f.table === name)
        .map(({ field, target }) => ({ field, target }))
        .sort((a, b) => (a.field < b.field ? -1 : a.field > b.field ? 1 : 0)),
    };
  });
}
const schemaHash = (meta: TableMeta[]) => sha256(canonical(meta));
const key = (row: RelationalRow, meta: TableMeta) =>
  canonical(Object.fromEntries(meta.keys.map((k) => [k, row[k]])));
export async function readBundle(
  tx: Prisma.TransactionClient,
  schema = "public",
  providedMeta?: TableMeta[],
): Promise<RelationalBundle> {
  const meta = providedMeta ?? (await tableMetadata(tx, schema));
  const tables: RelationalBundle["tables"] = {};
  for (const m of meta) {
    const fields = m.columns.map((c) => {
      const q = `t.${quoted(c.name)}`;
      if (authColumns.has(c.name)) return `NULL::text AS ${quoted(c.name)}`;
      if (m.name === "Capability" && c.name === "assessorLabel")
        return `COALESCE((SELECT u.name FROM ${quoted(schema)}."User" u WHERE u.id=t."assessedById"),${q}) AS "assessorLabel"`;
      if (m.name === "ChangeEvent" && c.name === "details")
        return `CASE WHEN t."actorId" IS NOT NULL THEN (CASE WHEN jsonb_typeof(${q})='object' THEN ${q} ELSE jsonb_build_object('originalDetails',${q}) END)||jsonb_build_object('exportedActorName',(SELECT u.name FROM ${quoted(schema)}."User" u WHERE u.id=t."actorId")) ELSE ${q} END AS details`;
      return `${["numeric", "date", "timestamp", "timestamptz"].includes(c.type) ? `${q}::text` : q} AS ${quoted(c.name)}`;
    });
    const where =
      m.name === "ChangeEvent"
        ? ` WHERE lower(t."entityType") NOT IN ('user','account','session','verification','ratelimit')`
        : "";
    tables[m.name] = await tx.$queryRawUnsafe<RelationalRow[]>(
      `SELECT ${fields.join(",")} FROM ${quoted(schema)}.${quoted(m.name)} t${where} ORDER BY ${m.keys.map((k) => `t.${quoted(k)}::text`).join(",")}`,
    );
    for (const row of tables[m.name])
      for (const c of m.columns)
        if (
          row[c.name] !== null &&
          ["timestamp", "timestamptz"].includes(c.type)
        )
          row[c.name] = new Date(
            String(row[c.name]).replace(" ", "T") +
              (c.type === "timestamp" ? "Z" : ""),
          ).toISOString();
  }
  return {
    format: "program-compass-relational",
    schemaVersion: 1,
    schemaHash: schemaHash(meta),
    exportedAt: new Date().toISOString(),
    tables,
  };
}
export function parseBundle(
  input: unknown,
  meta: TableMeta[],
): RelationalBundle {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new ExchangeError(400, "A relational JSON object is required");
  const b = input as RelationalBundle;
  if (
    Object.keys(b).sort().join() !==
      ["exportedAt", "format", "schemaHash", "schemaVersion", "tables"]
        .sort()
        .join() ||
    b.format !== "program-compass-relational" ||
    b.schemaVersion !== 1 ||
    b.schemaHash !== schemaHash(meta)
  )
    throw new ExchangeError(
      409,
      "Unsupported or mismatched relational schema/version",
    );
  if (
    typeof b.exportedAt !== "string" ||
    !/^\d{4}-\d\d-\d\dT/.test(b.exportedAt) ||
    !Number.isFinite(Date.parse(b.exportedAt))
  )
    throw new ExchangeError(400, "Invalid export timestamp");
  if (
    !b.tables ||
    typeof b.tables !== "object" ||
    Object.keys(b.tables).sort().join() !==
      meta
        .map((m) => m.name)
        .sort()
        .join()
  )
    throw new ExchangeError(
      400,
      "Table identities do not match this business schema; authentication data is excluded",
    );
  let count = 0;
  for (const m of meta) {
    const rows = b.tables[m.name];
    if (!Array.isArray(rows) || rows.length > 200_000)
      throw new ExchangeError(400, "Invalid relational table");
    const ids = new Set<string>();
    for (const row of rows) {
      if (
        !row ||
        typeof row !== "object" ||
        Array.isArray(row) ||
        Object.keys(row).sort().join() !==
          m.columns
            .map((c) => c.name)
            .sort()
            .join()
      )
        throw new ExchangeError(400, `Invalid fields in ${m.name}`);
      for (const c of m.columns) {
        const v = row[c.name];
        if (v === null) {
          if (!c.nullable)
            throw new ExchangeError(400, `Missing ${m.name}.${c.name}`);
          continue;
        }
        const valid =
          c.type === "bool"
            ? typeof v === "boolean"
            : ["int2", "int4"].includes(c.type)
              ? typeof v === "number" && Number.isSafeInteger(v)
              : c.type === "numeric"
                ? typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v)
                : ["json", "jsonb"].includes(c.type)
                  ? true
                  : typeof v === "string";
        if (
          c.type === "numeric" &&
          typeof v === "string" &&
          c.scale !== null &&
          (v.split(".")[1]?.length ?? 0) > c.scale
        )
          throw new ExchangeError(
            400,
            `Excess decimal precision: ${m.name}.${c.name}`,
          );
        if (!valid)
          throw new ExchangeError(
            400,
            `Invalid value type: ${m.name}.${c.name}`,
          );
        if (
          ["date", "timestamp", "timestamptz"].includes(c.type) &&
          !Number.isFinite(Date.parse(String(v)))
        )
          throw new ExchangeError(400, `Invalid date: ${m.name}.${c.name}`);
        if (authColumns.has(c.name) && v !== null)
          throw new ExchangeError(
            400,
            "Login-account references are excluded from import",
          );
      }
      const identity = key(row, m);
      if (ids.has(identity))
        throw new ExchangeError(400, `Duplicate identity in ${m.name}`);
      ids.add(identity);
      if (
        typeof row.updatedAt === "string" &&
        Date.parse(row.updatedAt) > Date.parse(b.exportedAt) + 300_000
      )
        throw new ExchangeError(400, `Future revision in ${m.name}`);
    }
    count += rows.length;
  }
  if (count > 500_000)
    throw new ExchangeError(413, "Relational row limit exceeded");
  const identifiers = new Map(
    meta.map((m) => [m.name, new Set(b.tables[m.name].map((r) => r.id))]),
  );
  for (const m of meta)
    for (const ref of m.references)
      if (identifiers.has(ref.target))
        for (const row of b.tables[m.name])
          if (
            row[ref.field] !== null &&
            !identifiers.get(ref.target)!.has(row[ref.field])
          )
            throw new ExchangeError(
              400,
              `Dangling reference: ${m.name}.${ref.field}`,
            );
  return b;
}
export function previewChanges(
  current: RelationalBundle,
  incoming: RelationalBundle,
  meta: TableMeta[],
): ImportChange[] {
  const changes: ImportChange[] = [];
  for (const m of meta) {
    const existing = new Map(
      current.tables[m.name].map((row) => [key(row, m), row]),
    );
    for (const row of incoming.tables[m.name]) {
      const identity = key(row, m);
      const before = existing.get(identity);
      if (before && canonical(before) === canonical(row)) continue;
      if (
        before &&
        m.name === "Capability" &&
        (before.code !== row.code || before.catalogue !== row.catalogue)
      )
        throw new ExchangeError(
          409,
          "Original capability identity/catalogue cannot be replaced",
        );
      if (before && immutable.has(m.name))
        throw new ExchangeError(
          409,
          `Immutable historical/reference identity differs: ${m.name} ${identity}`,
        );
      if (
        before &&
        typeof before.updatedAt === "string" &&
        typeof row.updatedAt === "string" &&
        Date.parse(before.updatedAt) > Date.parse(row.updatedAt)
      )
        throw new ExchangeError(
          409,
          `Stale imported revision: ${m.name} ${identity}`,
        );
      const fields = m.columns
        .filter((c) => canonical(before?.[c.name]) !== canonical(row[c.name]))
        .map((c) => c.name);
      changes.push({
        table: m.name,
        identity,
        action: before
          ? m.name.startsWith("_")
            ? "relationships"
            : "update"
          : "create",
        fields,
        before: before ?? null,
        after: row,
      });
    }
  }
  for (const m of meta.filter(
    (m) => m.name.startsWith("_") || m.name in mutableJoins,
  )) {
    const anchor =
      mutableJoins[m.name] ?? m.references.find((r) => r.field === m.keys[0]);
    if (!anchor) throw new ExchangeError(409, "Missing relationship metadata");
    const importedAnchors = new Set(
      incoming.tables[anchor.target].map((r) => r.id),
    );
    const desired = new Set(incoming.tables[m.name].map((r) => key(r, m)));
    for (const row of current.tables[m.name])
      if (importedAnchors.has(row[anchor.field]) && !desired.has(key(row, m)))
        changes.push({
          table: m.name,
          identity: key(row, m),
          action: "unlink",
          fields: m.keys,
          before: row,
          after: {},
        });
  }
  return changes;
}
export async function lockBusinessTables(
  tx: Prisma.TransactionClient,
  meta: TableMeta[],
  schema = "public",
) {
  for (let n = 1; n <= 7; n++)
    await tx.$executeRawUnsafe(
      "SELECT pg_advisory_xact_lock(731245,$1::int)",
      n,
    );
  await tx.$executeRawUnsafe(
    `LOCK TABLE ${meta.map((m) => `${quoted(schema)}.${quoted(m.name)}`).join(",")} IN SHARE ROW EXCLUSIVE MODE`,
  );
}
export async function writeBundle(
  tx: Prisma.TransactionClient,
  incoming: RelationalBundle,
  changes: ImportChange[],
  meta: TableMeta[],
  schema = "public",
) {
  const deferred: ImportChange[] = [];
  async function upsert(m: TableMeta, entries: ImportChange[]) {
    for (const isExisting of [false, true]) {
      const group = entries.filter((c) => !!c.before === isExisting);
      const cols = m.columns.filter(
        (c) => !isExisting || !authColumns.has(c.name),
      );
      const names = cols.map((c) => c.name);
      for (let offset = 0; offset < group.length; offset += 200) {
        const batch = group.slice(offset, offset + 200);
        const params: unknown[] = [];
        const values = batch.map(
          (change) =>
            `(${cols
              .map((c) => {
                const value = change.after[c.name];
                params.push(
                  ["json", "jsonb"].includes(c.type) && value !== null
                    ? JSON.stringify(value)
                    : value,
                );
                return `$${params.length}::${c.typeSchema === "$business" ? quoted(schema) : quoted(c.typeSchema)}.${quoted(c.type)}`;
              })
              .join(",")})`,
        );
        const update =
          names
            .filter((k) => !m.keys.includes(k))
            .map((k) => `${quoted(k)}=EXCLUDED.${quoted(k)}`)
            .join(",") || `${quoted(m.keys[0])}=EXCLUDED.${quoted(m.keys[0])}`;
        await tx.$executeRawUnsafe(
          `INSERT INTO ${quoted(schema)}.${quoted(m.name)} (${names.map(quoted).join(",")}) VALUES ${values.join(",")} ON CONFLICT (${m.keys.map(quoted).join(",")}) DO UPDATE SET ${update}`,
          ...params,
        );
      }
    }
  }
  for (const m of meta) {
    const entries = changes
      .filter((c) => c.table === m.name && c.action !== "unlink")
      .map((change) => {
        const row = { ...change.after };
        if (
          !change.before &&
          ["Person", "FrameworkRequirement"].includes(m.name)
        ) {
          const field = m.name === "Person" ? "managerId" : "parentId";
          if (row[field]) {
            row[field] = null;
            deferred.push(change);
          }
        }
        return { ...change, after: row };
      });
    await upsert(m, entries);
  }
  for (const m of meta)
    await upsert(
      m,
      deferred.filter((c) => c.table === m.name),
    );
  // Replace mutable current joins for all imported anchors, including zero-link sets.
  for (const m of meta.filter(
    (m) => m.name.startsWith("_") || m.name in mutableJoins,
  )) {
    const anchor =
      mutableJoins[m.name] ?? m.references.find((r) => r.field === m.keys[0]);
    if (!anchor)
      throw new ExchangeError(409, "Relationship metadata unavailable");
    const rows = incoming.tables[m.name];
    const current = await tx.$queryRawUnsafe<RelationalRow[]>(
      `SELECT * FROM ${quoted(schema)}.${quoted(m.name)}`,
    );
    const desired = new Set(rows.map((r) => key(r, m)));
    const importedAnchors = new Set(
      incoming.tables[anchor.target].map((r) => r.id),
    );
    for (const row of current)
      if (importedAnchors.has(row[anchor.field]) && !desired.has(key(row, m)))
        await tx.$executeRawUnsafe(
          `DELETE FROM ${quoted(schema)}.${quoted(m.name)} WHERE ${m.keys.map((k, i) => `${quoted(k)}=$${i + 1}`).join(" AND ")}`,
          ...m.keys.map((k) => row[k]),
        );
  }
}
