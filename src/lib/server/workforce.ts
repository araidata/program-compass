import "server-only";
import { allocationExceeded } from "@/lib/domain/capacity";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { HttpError } from "./errors";
import {
  reportingCycle,
  type WorkforceData,
  type workforceInput,
} from "@/lib/domain/workforce";
import type { z } from "zod";

export async function loadWorkforce(
  client: Prisma.TransactionClient = db(),
): Promise<WorkforceData | null> {
  try {
    const [people, positions, pillars, capabilities] = await Promise.all([
      client.person.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] }),
      client.position.findMany({ orderBy: [{ title: "asc" }, { id: "asc" }] }),
      client.pillar.findMany({ orderBy: { sortOrder: "asc" } }),
      client.capability.findMany({
        include: { pillars: { include: { pillar: true } } },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
    return {
      people: people.map((p) => ({
        id: p.id,
        name: p.name,
        title: p.title,
        managerId: p.managerId,
        active: p.active,
        revision: p.updatedAt.toISOString(),
      })),
      positions: positions.map((p) => ({
        id: p.id,
        title: p.title,
        pillarId: p.pillarId,
        personId: p.personId,
        state: p.state,
        fte: Number(p.fte),
        annualCost: p.annualCost === null ? null : Number(p.annualCost),
        currency: p.currency,
        startYear: p.startYear,
        justification: p.justification,
        revision: p.updatedAt.toISOString(),
      })),
      pillars: pillars.map(({ id, key, name }) => ({ id, key, name })),
      ownership: capabilities.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        ownerPersonId: c.ownerPersonId,
        pillarKeys: c.pillars.map((p) => p.pillar.key),
        targetDate: c.targetDate?.toISOString().slice(0, 10) ?? null,
        currentLevel: c.currentLevel,
        targetLevel: c.targetLevel,
      })),
    };
  } catch (error) {
    if (["P2021", "P2022"].includes((error as { code?: string }).code ?? ""))
      return null;
    throw error;
  }
}
export async function saveWorkforce(
  actorId: string | null,
  id: string | null,
  input: z.infer<typeof workforceInput>,
) {
  return db().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(731245, 1)`;
    const before = id
      ? input.kind === "person"
        ? await tx.person.findUnique({ where: { id } })
        : await tx.position.findUnique({ where: { id } })
      : null;
    if (id && !before) throw new HttpError(404, "Record not found");
    if (before && input.revision !== before.updatedAt.toISOString())
      throw new HttpError(409, "This record changed. Reload before saving.");
    let record;
    if (input.kind === "person") {
      const values = input.values;
      const people = await tx.person.findMany({
        select: { id: true, managerId: true },
      });
      if (values.managerId && !people.some((p) => p.id === values.managerId))
        throw new HttpError(400, "Manager not found");
      if (reportingCycle(people, id ?? "new", values.managerId))
        throw new HttpError(400, "Reporting lines cannot contain a cycle");
      record = id
        ? await tx.person.update({ where: { id }, data: values })
        : await tx.person.create({ data: values });
    } else {
      const values = input.values;
      if (!(await tx.pillar.findUnique({ where: { id: values.pillarId } })))
        throw new HttpError(400, "Pillar not found");
      if (
        values.personId &&
        !(await tx.person.findFirst({
          where: { id: values.personId, active: true },
        }))
      )
        throw new HttpError(400, "Choose an active person");
      if (values.state !== "authorized" && values.personId)
        throw new HttpError(
          400,
          "Only authorized positions can have an incumbent",
        );
      if (values.personId) {
        const others = await tx.position.findMany({
          where: {
            personId: values.personId,
            state: "authorized",
            ...(id ? { id: { not: id } } : {}),
          },
        });
        if (others.reduce((s, p) => s + Number(p.fte), values.fte) > 1.00001)
          throw new HttpError(
            400,
            "A person's total authorized allocation cannot exceed 1 FTE",
          );
      }
      if (id) {
        const assignments = await tx.capacityAssignment.findMany({
          where: { positionId: id },
        });
        if (
          allocationExceeded(
            assignments.map((a) => ({
              ...a,
              startDate: a.startDate.toISOString().slice(0, 10),
              endDate: a.endDate?.toISOString().slice(0, 10) ?? null,
              allocatedFte: Number(a.allocatedFte),
            })),
            values.fte,
          )
        )
          throw new HttpError(
            400,
            "Position FTE cannot fall below overlapping responsibility assignments",
          );
      }
      record = id
        ? await tx.position.update({ where: { id }, data: values })
        : await tx.position.create({ data: values });
    }
    await tx.changeEvent.create({
      data: {
        actorId,
        entityType: input.kind === "person" ? "Person" : "Position",
        entityId: record.id,
        action: `${input.kind}.${id ? "updated" : "created"}`,
        details: { fields: Object.keys(input.values) },
      },
    });
    return { id: record.id };
  });
}
