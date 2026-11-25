import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { HttpError } from "./errors";
import {
  capacityKinds,
  capacitySchemas,
  allocationExceeded,
  type CapacityKind,
  type CapacityData,
  type CapacityRow,
  type Assignment,
} from "@/lib/domain/capacity";
type Raw = Record<string, unknown> & { id: string; updatedAt: Date };
type Store = {
  findUnique: (q: unknown) => Promise<Raw | null>;
  findMany: (q?: unknown) => Promise<Raw[]>;
  create: (q: unknown) => Promise<Raw>;
  update: (q: unknown) => Promise<Raw>;
};
const models = {
  activity: "workActivity",
  assignment: "capacityAssignment",
  skill: "skillObservation",
  constraint: "workforceConstraint",
} as const;
const activityRelations = {
  capabilityIds: { relation: "capabilities", model: "capability" },
  requirementIds: { relation: "requirements", model: "frameworkRequirement" },
  niceIds: { relation: "niceElements", model: "niceElement" },
};
function store(tx: Prisma.TransactionClient, name: string) {
  return (tx as unknown as Record<string, unknown>)[name] as Store;
}
const includes = (kind: CapacityKind) =>
  kind === "activity"
    ? Object.fromEntries(
        Object.values(activityRelations).map((r) => [
          r.relation,
          { select: { id: true } },
        ]),
      )
    : {};
function view(kind: CapacityKind, raw: Raw): CapacityRow {
  const values: CapacityRow["values"] = {};
  for (const [k, v] of Object.entries(raw)) {
    if (
      [
        "id",
        "updatedAt",
        "createdAt",
        ...Object.values(activityRelations).map((r) => r.relation),
      ].includes(k)
    )
      continue;
    values[k] =
      v instanceof Date
        ? v.toISOString().slice(0, 10)
        : v !== null && typeof v === "object"
          ? Number(v)
          : (v as CapacityRow["values"][string]);
  }
  if (kind === "activity")
    for (const [key, r] of Object.entries(activityRelations))
      values[key] = (raw[r.relation] as { id: string }[]).map((r) => r.id);
  return { id: raw.id, kind, revision: raw.updatedAt.toISOString(), values };
}
export async function loadCapacity(
  tx: Prisma.TransactionClient = db(),
): Promise<CapacityData> {
  const rows: CapacityRow[] = [];
  for (const kind of capacityKinds)
    rows.push(
      ...(
        await store(tx, models[kind]).findMany({
          include: includes(kind),
          orderBy: [{ title: "asc" }, { id: "asc" }],
        })
      ).map((r) => view(kind, r)),
    );
  const [nice, niceRelations] = await Promise.all([
    tx.niceElement.findMany({
      select: {
        id: true,
        identifier: true,
        kind: true,
        title: true,
        description: true,
        sourceUrl: true,
        version: true,
      },
      orderBy: [{ kind: "asc" }, { identifier: "asc" }],
    }),
    tx.niceRelation.findMany(),
  ]);
  return { rows, nice, niceRelations };
}
export async function saveCapacity(
  actorId: string | null,
  kind: CapacityKind,
  id: string | null,
  input: unknown,
  revision?: string,
) {
  const values = capacitySchemas[kind].parse(input) as CapacityRow["values"];
  try {
    return await db().$transaction(
      async (tx) => {
        // Shared with roster edits: an incumbent/FTE change cannot race assignment validation.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(731245, 1)`;
        const target = store(tx, models[kind]);
        const before = id
          ? await target.findUnique({ where: { id }, include: includes(kind) })
          : null;
        if (id && !before)
          throw new HttpError(404, "Workforce planning record not found");
        if (before && revision !== before.updatedAt.toISOString())
          throw new HttpError(
            409,
            "Record changed. Reload before saving; entered work is retained.",
          );
        const data: Record<string, unknown> = {};
        const singles = {
          personId: "person",
          positionId: "position",
          responsibilityId: "responsibility",
          conflictingResponsibilityId: "responsibility",
          niceElementId: "niceElement",
        };
        for (const [key, value] of Object.entries(values)) {
          const relation =
            kind === "activity"
              ? activityRelations[key as keyof typeof activityRelations]
              : undefined;
          if (relation) {
            const ids = value as string[];
            const found = await store(tx, relation.model).findMany({
              where: { id: { in: ids } },
              select: { id: true },
            });
            if (found.length !== ids.length)
              throw new HttpError(400, `Invalid relationship: ${key}`);
            data[relation.relation] = {
              [id ? "set" : "connect"]: ids.map((id) => ({ id })),
            };
          } else {
            if (
              key in singles &&
              value &&
              !(await store(
                tx,
                singles[key as keyof typeof singles],
              ).findUnique({ where: { id: value } }))
            )
              throw new HttpError(400, `Invalid relationship: ${key}`);
            data[key] =
              key.endsWith("Date") && typeof value === "string"
                ? new Date(`${value}T00:00:00Z`)
                : value;
          }
        }
        if (kind === "assignment") {
          const v = values as Assignment;
          const position = await tx.position.findUniqueOrThrow({
            where: { id: v.positionId },
          });
          if (
            v.personId &&
            (position.state !== "authorized" ||
              position.personId !== v.personId)
          )
            throw new HttpError(
              400,
              "Actual assignments require the position's authorized incumbent; leave person blank for a vacancy/proposal",
            );
          const others = (
            await tx.capacityAssignment.findMany({
              where: { id: { not: id ?? "" } },
            })
          ).map((r) => ({
            ...r,
            startDate: r.startDate.toISOString().slice(0, 10),
            endDate: r.endDate?.toISOString().slice(0, 10) ?? null,
            allocatedFte: Number(r.allocatedFte),
          }));
          if (
            allocationExceeded(
              [...others.filter((a) => a.positionId === v.positionId), v],
              Number(position.fte),
            )
          )
            throw new HttpError(
              400,
              "Overlapping assignments exceed position FTE",
            );
          if (
            v.personId &&
            allocationExceeded(
              [...others.filter((a) => a.personId === v.personId), v],
              1,
            )
          )
            throw new HttpError(
              400,
              "Overlapping assignments exceed person FTE",
            );
        }
        if (kind === "skill") {
          const nice = await tx.niceElement.findUniqueOrThrow({
            where: { id: String(values.niceElementId) },
          });
          if (
            ![
              "skill",
              "knowledge",
              "task",
              "work_role",
              "competency_area",
            ].includes(nice.kind)
          )
            throw new HttpError(
              400,
              "Choose a NICE skill, knowledge, task, role or competency element",
            );
        }
        const record = id
          ? await target.update({
              where: { id },
              data,
              include: includes(kind),
            })
          : await target.create({
              data: { id: randomUUID(), ...data },
              include: includes(kind),
            });
        await tx.changeEvent.create({
          data: {
            actorId,
            entityType: models[kind],
            entityId: record.id,
            action: `${models[kind]}.${id ? "updated" : "created"}`,
            details: {
              before: before ? view(kind, before).values : null,
              after: view(kind, record).values,
            } as Prisma.InputJsonObject,
          },
        });
        return { id: record.id };
      },
      { timeout: 30_000, maxWait: 10_000 },
    );
  } catch (error) {
    if ((error as { code?: string }).code === "P2002")
      throw new HttpError(
        409,
        "That work identity or person/NICE observation already exists. Edit the existing record.",
      );
    throw error;
  }
}
