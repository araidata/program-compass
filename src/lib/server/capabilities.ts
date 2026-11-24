import "server-only";
import { db } from "./db";
import { HttpError } from "./access";
import type { Prisma } from "@/generated/prisma/client";
import type { CapabilityView, IndicatorView } from "@/lib/domain/capabilities";
import type {
  capabilityUpdateSchema,
  indicatorSchema,
  indicatorUpdateSchema,
} from "@/lib/validation";
import type { z } from "zod";

const capabilityInclude = {
  accountableFunction: { select: { name: true } },
  assessedBy: { select: { name: true } },
  pillars: { select: { pillar: { select: { key: true, sortOrder: true } } } },
  indicators: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
} satisfies Prisma.CapabilityInclude;

type CapabilityRecord = Prisma.CapabilityGetPayload<{
  include: typeof capabilityInclude;
}>;
type IndicatorRecord = CapabilityRecord["indicators"][number];

const day = (value: Date | null) =>
  value ? value.toISOString().slice(0, 10) : null;

function toIndicator(record: IndicatorRecord): IndicatorView {
  return {
    id: record.id,
    catalogueKey: record.catalogueKey,
    name: record.name,
    unit: record.unit,
    direction: record.direction,
    passThreshold: Number(record.passThreshold),
    failThreshold: Number(record.failThreshold),
    value: record.value == null ? null : Number(record.value),
    measuredAt: day(record.measuredAt),
  };
}

function toView(record: CapabilityRecord): CapabilityView {
  return {
    id: record.id,
    code: record.code,
    groupCode: record.groupCode,
    name: record.name,
    description: record.description,
    applicable: record.applicable,
    currentLevel: record.currentLevel,
    targetLevel: record.targetLevel,
    confidence: record.confidence,
    rationale: record.rationale,
    reviewState: record.reviewState,
    targetDate: day(record.targetDate),
    accountableFunctionId: record.accountableFunctionId,
    accountableFunctionName: record.accountableFunction?.name ?? null,
    assessedAt: record.assessedAt?.toISOString() ?? null,
    assessedByName: record.assessedBy?.name ?? null,
    pillarKeys: record.pillars
      .map((entry) => entry.pillar)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((pillar) => pillar.key),
    indicators: record.indicators.map(toIndicator),
  };
}

/** Thrown when the capability migration has not been applied to this database. */
export class SchemaPendingError extends Error {}

const isMissingTable = (error: unknown) =>
  (error as { code?: string })?.code === "P2021";

export async function listCapabilities(): Promise<CapabilityView[]> {
  try {
    const records = await db().capability.findMany({
      include: capabilityInclude,
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    });
    return records.map(toView);
  } catch (error) {
    if (isMissingTable(error)) throw new SchemaPendingError();
    throw error;
  }
}

/**
 * Capabilities, or null when the database has not been migrated yet, so
 * pages can explain the pending update instead of failing.
 */
export async function loadCapabilities(): Promise<CapabilityView[] | null> {
  try {
    return await listCapabilities();
  } catch (error) {
    if (error instanceof SchemaPendingError) return null;
    throw error;
  }
}

export async function listFunctionOptions() {
  const pillars = await db().pillar.findMany({
    orderBy: { sortOrder: "asc" },
    include: { functions: { orderBy: { name: "asc" } } },
  });
  return pillars.map((pillar) => ({
    key: pillar.key,
    name: pillar.name,
    functions: pillar.functions.map((fn) => ({ id: fn.id, name: fn.name })),
  }));
}

export type HistoryEntry = {
  id: string;
  at: string;
  actor: string | null;
  action: string;
  details: Record<string, unknown>;
};

export async function capabilityHistory(id: string): Promise<HistoryEntry[]> {
  const events = await db().changeEvent.findMany({
    where: { entityType: "Capability", entityId: id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 30,
    include: { actor: { select: { name: true } } },
  });
  return events.map((event) => ({
    id: event.id,
    at: event.createdAt.toISOString(),
    actor: event.actor?.name ?? null,
    action: event.action,
    details: (event.details ?? {}) as Record<string, unknown>,
  }));
}

const ratingFields = [
  "currentLevel",
  "targetLevel",
  "confidence",
  "reviewState",
] as const;

export async function updateCapability(
  actorId: string | null,
  id: string,
  input: z.infer<typeof capabilityUpdateSchema>,
): Promise<CapabilityView> {
  return db().$transaction(async (tx) => {
    const before = await tx.capability.findUnique({ where: { id } });
    if (!before) throw new HttpError(404, "Capability not found");
    if (input.accountableFunctionId) {
      const exists = await tx.organizationalFunction.findUnique({
        where: { id: input.accountableFunctionId },
      });
      if (!exists) throw new HttpError(400, "Invalid request");
    }
    const { pillarKeys, targetDate, ...fields } = input;
    const data: Prisma.CapabilityUncheckedUpdateInput = { ...fields };
    if (targetDate !== undefined)
      data.targetDate = targetDate ? new Date(`${targetDate}T00:00:00Z`) : null;
    const rated = ratingFields.some((field) => field in input);
    if (rated) {
      const current =
        input.currentLevel !== undefined
          ? input.currentLevel
          : before.currentLevel;
      data.assessedAt = current == null ? null : new Date();
      data.assessedById = current == null ? null : actorId;
    }
    await tx.capability.update({ where: { id }, data });
    if (pillarKeys) {
      const pillars = await tx.pillar.findMany({
        where: { key: { in: pillarKeys } },
        select: { id: true },
      });
      await tx.capabilityPillar.deleteMany({ where: { capabilityId: id } });
      await tx.capabilityPillar.createMany({
        data: pillars.map((pillar) => ({
          capabilityId: id,
          pillarId: pillar.id,
        })),
      });
    }
    // History keeps rating fields and structural changes; rationale text is
    // recorded as changed without copying its content.
    const details: Record<string, unknown> = { ...input };
    if ("rationale" in details) details.rationale = "changed";
    if ("description" in details) details.description = "changed";
    await tx.changeEvent.create({
      data: {
        actorId,
        action: "capability.assessed",
        entityType: "Capability",
        entityId: id,
        details: details as Prisma.InputJsonObject,
      },
    });
    return toView(
      await tx.capability.findUniqueOrThrow({
        where: { id },
        include: capabilityInclude,
      }),
    );
  });
}

function indicatorData(
  input: Partial<z.infer<typeof indicatorSchema>>,
): Prisma.CapabilityIndicatorUncheckedUpdateInput {
  const { measuredAt, ...rest } = input;
  const data: Prisma.CapabilityIndicatorUncheckedUpdateInput = { ...rest };
  if (measuredAt !== undefined)
    data.measuredAt = measuredAt ? new Date(`${measuredAt}T00:00:00Z`) : null;
  return data;
}

async function indicatorWrite<T>(
  action: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  try {
    return await db().$transaction(action);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002")
      throw new HttpError(409, "An indicator with that name already exists");
    throw error;
  }
}

export async function createIndicator(
  actorId: string | null,
  capabilityId: string,
  input: z.infer<typeof indicatorSchema>,
): Promise<IndicatorView> {
  return indicatorWrite(async (tx) => {
    const capability = await tx.capability.findUnique({
      where: { id: capabilityId },
    });
    if (!capability) throw new HttpError(404, "Capability not found");
    const record = await tx.capabilityIndicator.create({
      data: {
        ...(indicatorData(
          input,
        ) as Prisma.CapabilityIndicatorUncheckedCreateInput),
        name: input.name,
        unit: input.unit,
        direction: input.direction,
        passThreshold: input.passThreshold,
        failThreshold: input.failThreshold,
        sortOrder: 100,
        capabilityId,
        updatedById: actorId,
      },
    });
    await tx.changeEvent.create({
      data: {
        actorId,
        action: "indicator.created",
        entityType: "Capability",
        entityId: capabilityId,
        details: { indicator: input.name },
      },
    });
    return toIndicator(record);
  });
}

export async function updateIndicator(
  actorId: string | null,
  id: string,
  input: z.infer<typeof indicatorUpdateSchema>,
): Promise<IndicatorView> {
  return indicatorWrite(async (tx) => {
    const before = await tx.capabilityIndicator.findUnique({ where: { id } });
    if (!before) throw new HttpError(404, "Indicator not found");
    const direction = input.direction ?? before.direction;
    const pass = input.passThreshold ?? Number(before.passThreshold);
    const fail = input.failThreshold ?? Number(before.failThreshold);
    if (direction === "higher" ? pass < fail : pass > fail)
      throw new HttpError(400, "Pass and fail boundaries are out of order");
    const record = await tx.capabilityIndicator.update({
      where: { id },
      data: { ...indicatorData(input), updatedById: actorId },
    });
    await tx.changeEvent.create({
      data: {
        actorId,
        action: "indicator.updated",
        entityType: "Capability",
        entityId: before.capabilityId,
        details: { indicator: record.name, ...input } as Prisma.InputJsonObject,
      },
    });
    return toIndicator(record);
  });
}

export async function deleteIndicator(actorId: string | null, id: string) {
  return indicatorWrite(async (tx) => {
    const before = await tx.capabilityIndicator.findUnique({ where: { id } });
    if (!before) throw new HttpError(404, "Indicator not found");
    if (before.catalogueKey)
      throw new HttpError(409, "Catalogue KPIs cannot be deleted");
    await tx.capabilityIndicator.delete({ where: { id } });
    await tx.changeEvent.create({
      data: {
        actorId,
        action: "indicator.deleted",
        entityType: "Capability",
        entityId: before.capabilityId,
        details: { indicator: before.name },
      },
    });
    return { id };
  });
}
