import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { HttpError } from "./errors";
import {
  planningSchemas,
  planningKinds,
  dependencyCycle,
  type PlanningKind,
  type PlanningData,
  type PlanningRow,
} from "@/lib/domain/planning";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldValue } from "@/lib/domain/planning";
type Raw = Record<string, unknown> & { id: string; updatedAt: Date };
type Store = {
  findUnique: (q: unknown) => Promise<Raw | null>;
  findMany: (q?: unknown) => Promise<Raw[]>;
  create: (q: unknown) => Promise<Raw>;
  update: (q: unknown) => Promise<Raw>;
};
const models = {
  responsibility: "responsibility",
  issue: "planningIssue",
  initiative: "initiative",
  technology: "technology",
} as const;
const relations: Record<
  PlanningKind,
  Record<string, { relation: string; model: string }>
> = {
  responsibility: {
    capabilityIds: { relation: "capabilities", model: "capability" },
    positionIds: { relation: "positions", model: "position" },
    requirementIds: { relation: "requirements", model: "frameworkRequirement" },
  },
  issue: {
    capabilityIds: { relation: "capabilities", model: "capability" },
    requirementIds: { relation: "requirements", model: "frameworkRequirement" },
    initiativeIds: { relation: "initiatives", model: "initiative" },
  },
  initiative: {
    issueIds: { relation: "issues", model: "planningIssue" },
    objectiveIds: { relation: "objectives", model: "businessObjective" },
    requirementIds: { relation: "requirements", model: "frameworkRequirement" },
    positionIds: { relation: "positions", model: "position" },
    technologyIds: { relation: "technologies", model: "technology" },
    dependencyIds: { relation: "dependencies", model: "initiative" },
  },
  technology: {
    alternativeIds: { relation: "alternativesFor", model: "technology" },
    capabilityIds: { relation: "capabilities", model: "capability" },
    requirementIds: { relation: "requirements", model: "frameworkRequirement" },
    responsibilityIds: {
      relation: "responsibilities",
      model: "responsibility",
    },
    dependencyIds: { relation: "dependencies", model: "technology" },
  },
};
function store(tx: Prisma.TransactionClient, name: string) {
  return (tx as unknown as Record<string, unknown>)[name] as Store;
}
function include(kind: PlanningKind) {
  return Object.fromEntries([
    ...Object.values(relations[kind]).map((r) => [
      r.relation,
      { select: { id: true } },
    ]),
    ...(kind === "initiative" ? [["capabilities", true]] : []),
  ]);
}
function view(kind: PlanningKind, raw: Raw): PlanningRow {
  const values: Record<string, FieldValue> = {};
  const joins = new Set(Object.values(relations[kind]).map((r) => r.relation));
  for (const [key, v] of Object.entries(raw)) {
    if (
      ["id", "createdAt", "updatedAt"].includes(key) ||
      joins.has(key) ||
      (key === "capabilities" && kind === "initiative")
    )
      continue;
    values[key] =
      v instanceof Date
        ? v.toISOString().slice(0, 10)
        : v !== null && typeof v === "object"
          ? Number(v)
          : (v as FieldValue);
  }
  for (const [key, r] of Object.entries(relations[kind]))
    values[key] = (raw[r.relation] as { id: string }[]).map((v) => v.id);
  const uplifts =
    kind === "initiative"
      ? (raw.capabilities as {
          capabilityId: string;
          uplift: number;
          rationale: string;
        }[])
      : undefined;
  if (uplifts) values.capabilityIds = uplifts.map((u) => u.capabilityId);
  return {
    id: raw.id,
    kind,
    revision: raw.updatedAt.toISOString(),
    values,
    ...(uplifts
      ? {
          uplifts: uplifts.map(({ capabilityId, uplift, rationale }) => ({
            capabilityId,
            uplift,
            rationale,
          })),
        }
      : {}),
  };
}
export async function loadPlanning(
  tx: Prisma.TransactionClient = db(),
): Promise<PlanningData> {
  const rows: PlanningRow[] = [];
  for (const kind of planningKinds) {
    const records = await store(tx, models[kind]).findMany({
      include: include(kind),
      orderBy: [{ title: "asc" }, { id: "asc" }],
    });
    rows.push(...records.map((r) => view(kind, r)));
  }
  const [people, functions, positions, capabilities, requirements, objectives] =
    await Promise.all([
      tx.person.findMany({ select: { id: true, name: true } }),
      tx.organizationalFunction.findMany({ include: { pillar: true } }),
      tx.position.findMany({ select: { id: true, title: true } }),
      tx.capability.findMany({
        include: { pillars: { include: { pillar: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      tx.frameworkRequirement.findMany({
        include: { framework: true },
        orderBy: { sortOrder: "asc" },
      }),
      tx.businessObjective.findMany({ select: { id: true, title: true } }),
    ]);
  return {
    rows,
    options: {
      people: people.map((p) => ({ id: p.id, label: p.name })),
      functions: functions.map((f) => ({
        id: f.id,
        label: `${f.pillar.name} · ${f.name}`,
      })),
      positions: positions.map((p) => ({ id: p.id, label: p.title })),
      capabilities: capabilities.map((c) => ({
        id: c.id,
        label: `${c.code} · ${c.name}`,
        current: c.currentLevel,
        target: c.targetLevel,
        applicable: c.applicable,
        pillars: c.pillars.map((p) => p.pillar.key),
      })),
      requirements: requirements.map((r) => ({
        id: r.id,
        label: `${r.framework.name} ${r.identifier} · ${r.title}`,
      })),
      objectives: objectives.map((o) => ({ id: o.id, label: o.title })),
    },
  };
}
export async function savePlanning(
  actorId: string | null,
  kind: PlanningKind,
  id: string | null,
  input: unknown,
  revision?: string,
) {
  const values = planningSchemas[kind].parse(input) as Record<
    string,
    FieldValue
  >;
  return db().$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(731245, 4)`;
      const target = store(tx, models[kind]);
      const before = id
        ? await target.findUnique({ where: { id }, include: include(kind) })
        : null;
      if (id && !before) throw new HttpError(404, "Planning record not found");
      if (before && revision !== before.updatedAt.toISOString())
        throw new HttpError(409, "Record changed. Reload before saving.");
      const recordId = id ?? randomUUID();
      if (kind === "technology") {
        if ((values.alternativeIds as string[] | undefined)?.includes(recordId))
          throw new HttpError(
            400,
            "A technology cannot be its own alternative",
          );
        if (
          typeof values.startDate === "string" &&
          typeof values.retirementDate === "string" &&
          values.retirementDate < values.startDate
        )
          throw new HttpError(400, "Retirement cannot precede deployment");
      }
      const data: Record<string, unknown> = {};
      if (
        values.ownerId &&
        !(await tx.person.findUnique({ where: { id: String(values.ownerId) } }))
      )
        throw new HttpError(400, "Owner not found");
      if (
        values.functionId &&
        !(await tx.organizationalFunction.findUnique({
          where: { id: String(values.functionId) },
        }))
      )
        throw new HttpError(400, "Function not found");
      for (const [key, value] of Object.entries(values)) {
        const r = relations[kind][key];
        if (r) {
          const keys = value as string[];
          const found = await store(tx, r.model).findMany({
            where: { id: { in: keys } },
            select: { id: true },
          });
          if (found.length !== keys.length)
            throw new HttpError(400, `Invalid relationship: ${key}`);
          data[r.relation] = {
            [id ? "set" : "connect"]: keys.map((id) => ({ id })),
          };
        } else if (key === "capabilityIds" && kind === "initiative") continue;
        else
          data[key] =
            key.endsWith("Date") && typeof value === "string"
              ? new Date(`${value}T00:00:00Z`)
              : value;
      }
      if (values.dependencyIds) {
        const existing = await target.findMany({
          include: { dependencies: { select: { id: true } } },
        });
        if (
          dependencyCycle(
            existing.map((r) => ({
              id: r.id,
              dependencies: (r.dependencies as { id: string }[]).map(
                (v) => v.id,
              ),
            })),
            recordId,
            values.dependencyIds as string[],
          )
        )
          throw new HttpError(400, "Dependencies cannot contain a cycle");
      }
      const record = id
        ? await target.update({ where: { id }, data })
        : await target.create({ data: { ...data, id: recordId } });
      if (kind === "initiative") {
        const ids = values.capabilityIds as string[];
        if (
          (await tx.capability.count({ where: { id: { in: ids } } })) !==
          ids.length
        )
          throw new HttpError(400, "Capability not found");
        const old = await tx.initiativeCapability.findMany({
          where: { initiativeId: recordId },
        });
        await tx.initiativeCapability.deleteMany({
          where: { initiativeId: recordId },
        });
        await tx.initiativeCapability.createMany({
          data: ids.map((capabilityId) => {
            const prior = old.find((v) => v.capabilityId === capabilityId);
            return {
              initiativeId: recordId,
              capabilityId,
              uplift: prior?.uplift ?? 0,
              rationale: prior?.rationale ?? String(values.justification),
            };
          }),
        });
      }
      await tx.changeEvent.create({
        data: {
          actorId,
          entityType: models[kind],
          entityId: recordId,
          action: `${kind}.${id ? "updated" : "created"}`,
          details: {
            before: before ? view(kind, before).values : null,
            after: values,
          } as Prisma.InputJsonObject,
        },
      });
      return { id: record.id };
    },
    { timeout: 30_000, maxWait: 10_000 },
  );
}
