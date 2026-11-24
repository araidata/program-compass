import "server-only";
import { db } from "./db";
import { HttpError } from "./access";
import type { contextInput, ContextData } from "@/lib/domain/context";
import type { z } from "zod";
export async function loadContext(): Promise<ContextData | null> {
  try {
    const [profile, objectives, threats, people] = await Promise.all([
      db().organizationProfile.findUnique({ where: { id: "organization" } }),
      db().businessObjective.findMany({
        include: { capabilities: true },
        orderBy: [{ priority: "desc" }, { title: "asc" }, { id: "asc" }],
      }),
      db().businessThreat.findMany({
        include: { capabilities: true, objectives: true },
        orderBy: [{ title: "asc" }, { id: "asc" }],
      }),
      db().person.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return {
      profile: profile
        ? {
            id: profile.id,
            revision: profile.updatedAt.toISOString(),
            mission: profile.mission,
            sector: profile.sector,
            criticalServices: profile.criticalServices,
            dependencies: profile.dependencies,
            publicSafetyImpact: profile.publicSafetyImpact,
            regulatoryDrivers: profile.regulatoryDrivers,
            complexityNotes: profile.complexityNotes,
          }
        : null,
      objectives: objectives.map((o) => ({
        id: o.id,
        revision: o.updatedAt.toISOString(),
        title: o.title,
        rationale: o.rationale,
        priority: o.priority,
        ownerId: o.ownerId,
        active: o.active,
        capabilityIds: o.capabilities.map((c) => c.capabilityId),
      })),
      threats: threats.map((t) => ({
        id: t.id,
        revision: t.updatedAt.toISOString(),
        title: t.title,
        scenario: t.scenario,
        likelihood: t.likelihood,
        impact: t.impact,
        basis: t.basis,
        active: t.active,
        objectiveIds: t.objectives.map((o) => o.objectiveId),
        capabilityIds: t.capabilities.map((c) => c.capabilityId),
      })),
      people,
    };
  } catch (e) {
    if (["P2021", "P2022"].includes((e as { code?: string }).code ?? ""))
      return null;
    throw e;
  }
}
export async function saveContext(
  actorId: string | null,
  id: string | null,
  input: z.infer<typeof contextInput>,
) {
  return db().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(731245, 2)`;
    const kind = input.kind;
    const before =
      kind === "profile"
        ? await tx.organizationProfile.findUnique({
            where: { id: "organization" },
          })
        : id
          ? kind === "objective"
            ? await tx.businessObjective.findUnique({ where: { id } })
            : await tx.businessThreat.findUnique({ where: { id } })
          : null;
    if (id && !before && kind !== "profile")
      throw new HttpError(404, "Record not found");
    if (before && input.revision !== before.updatedAt.toISOString())
      throw new HttpError(409, "This record changed. Reload before saving.");
    let record: { id: string };
    if (input.kind === "profile") {
      record = await tx.organizationProfile.upsert({
        where: { id: "organization" },
        create: input.values,
        update: input.values,
      });
    } else {
      const capabilityIds = input.values.capabilityIds;
      if (
        (await tx.capability.count({
          where: { id: { in: capabilityIds } },
        })) !== capabilityIds.length
      )
        throw new HttpError(400, "Capability not found");
      if (input.kind === "objective") {
        const { capabilityIds: links, ...fields } = input.values;
        if (
          fields.ownerId &&
          !(await tx.person.findFirst({
            where: { id: fields.ownerId, active: true },
          }))
        )
          throw new HttpError(400, "Choose an active owner");
        record = id
          ? await tx.businessObjective.update({ where: { id }, data: fields })
          : await tx.businessObjective.create({ data: fields });
        await tx.objectiveCapability.deleteMany({
          where: { objectiveId: record.id },
        });
        await tx.objectiveCapability.createMany({
          data: links.map((capabilityId) => ({
            objectiveId: record.id,
            capabilityId,
          })),
        });
      } else {
        const { capabilityIds: links, objectiveIds, ...fields } = input.values;
        if (!links.length && !objectiveIds.length)
          throw new HttpError(
            400,
            "Link a threat to an objective or capability planning decision",
          );
        if (
          (await tx.businessObjective.count({
            where: { id: { in: objectiveIds } },
          })) !== objectiveIds.length
        )
          throw new HttpError(400, "Objective not found");
        record = id
          ? await tx.businessThreat.update({ where: { id }, data: fields })
          : await tx.businessThreat.create({ data: fields });
        await tx.threatObjective.deleteMany({ where: { threatId: record.id } });
        await tx.threatCapability.deleteMany({
          where: { threatId: record.id },
        });
        await tx.threatObjective.createMany({
          data: objectiveIds.map((objectiveId) => ({
            threatId: record.id,
            objectiveId,
          })),
        });
        await tx.threatCapability.createMany({
          data: links.map((capabilityId) => ({
            threatId: record.id,
            capabilityId,
          })),
        });
      }
    }
    await tx.changeEvent.create({
      data: {
        actorId,
        entityType:
          kind === "profile"
            ? "OrganizationProfile"
            : kind === "objective"
              ? "BusinessObjective"
              : "BusinessThreat",
        entityId: record.id,
        action: `context.${kind}.${before ? "updated" : "created"}`,
        details: { fields: Object.keys(input.values) },
      },
    });
    return { id: record.id };
  });
}
