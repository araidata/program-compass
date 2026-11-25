import "server-only";
import { db } from "./db";
import { loadMethods } from "./methods";
import { HttpError } from "./errors";
import type { Prisma } from "@/generated/prisma/client";
import type { AlignmentData, RequirementValues } from "@/lib/domain/alignment";
export async function loadAlignment(
  tx: Prisma.TransactionClient = db(),
): Promise<AlignmentData> {
  const [frameworks, requirements, people] = await Promise.all([
    tx.framework.findMany({ orderBy: { key: "asc" } }),
    tx.frameworkRequirement.findMany({
      include: { assessment: true, mappings: true },
      orderBy: [{ sortOrder: "asc" }, { identifier: "asc" }],
    }),
    tx.person.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return {
    frameworks: frameworks.map(
      ({ id, key, name, version, sourceUrl, sourceHash }) => ({
        id,
        key,
        name,
        version,
        sourceUrl,
        sourceHash,
      }),
    ),
    people: people.map((p) => ({ id: p.id, label: p.name })),
    requirements: requirements.map((r) => ({
      id: r.id,
      frameworkId: r.frameworkId,
      identifier: r.identifier,
      title: r.title,
      description: r.description,
      parentId: r.parentId,
      kind: r.kind,
      sourceUrl: r.sourceUrl,
      sourcePage: r.sourcePage,
      sourceDeadline: r.deadline?.toISOString().slice(0, 10) ?? null,
      revision: r.assessment?.updatedAt.toISOString() ?? "new",
      assessedAt: r.assessment?.assessedAt?.toISOString() ?? null,
      scaleVersion: r.assessment?.scaleVersion ?? "provisional-1",
      values: {
        applicability: (r.assessment?.applicability ??
          "unknown") as RequirementValues["applicability"],
        implementation: (r.assessment?.implementation ??
          "unassessed") as RequirementValues["implementation"],
        currentLevel: r.assessment?.currentLevel ?? null,
        targetLevel: r.assessment?.targetLevel ?? null,
        notes: r.assessment?.notes ?? null,
        ownerId: r.assessment?.ownerId ?? null,
        applicableDeadline:
          r.assessment?.applicableDeadline?.toISOString().slice(0, 10) ?? null,
        capabilityIds: r.mappings.map((m) => m.capabilityId),
        mappingRationale: r.mappings
          .map((m) => m.rationale)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join("\n"),
        reviewed: r.mappings.length > 0 && r.mappings.every((m) => m.reviewed),
      },
    })),
  };
}
export async function saveRequirement(
  actorId: string | null,
  id: string,
  input: RequirementValues,
  revision: string,
) {
  const methods = await loadMethods();
  return db().$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(731245, 6)`;
      const reference = await tx.frameworkRequirement.findUnique({
        where: { id },
      });
      if (!reference) throw new HttpError(404, "Requirement not found");
      const before = await tx.requirementAssessment.findUnique({
        where: { requirementId: id },
      });
      if (revision !== (before?.updatedAt.toISOString() ?? "new"))
        throw new HttpError(409, "Requirement changed. Reload before saving.");
      if (
        input.ownerId &&
        !(await tx.person.findUnique({ where: { id: input.ownerId } }))
      )
        throw new HttpError(400, "Owner not found");
      if (
        (await tx.capability.count({
          where: { id: { in: input.capabilityIds } },
        })) !== input.capabilityIds.length
      )
        throw new HttpError(400, "Capability not found");
      const {
        capabilityIds,
        mappingRationale,
        reviewed,
        applicableDeadline,
        ...values
      } = input;
      const rated =
        input.currentLevel !== before?.currentLevel &&
        !(input.currentLevel === null && !before);
      const data = {
        ...values,
        applicableDeadline: applicableDeadline
          ? new Date(`${applicableDeadline}T00:00:00Z`)
          : null,
        ...(rated
          ? {
              assessedAt: input.currentLevel === null ? null : new Date(),
              scaleVersion: methods.id,
            }
          : {}),
      };
      const result = await tx.requirementAssessment.upsert({
        where: { requirementId: id },
        create: { ...data, requirementId: id, scaleVersion: methods.id },
        update: data,
      });
      await tx.capabilityRequirementMapping.deleteMany({
        where: { requirementId: id },
      });
      await tx.capabilityRequirementMapping.createMany({
        data: capabilityIds.map((capabilityId) => ({
          capabilityId,
          requirementId: id,
          rationale: mappingRationale,
          reviewed,
        })),
      });
      await tx.changeEvent.create({
        data: {
          actorId,
          entityType: "RequirementAssessment",
          entityId: id,
          action: "requirement.assessed",
          details: {
            before: before
              ? {
                  applicability: before.applicability,
                  implementation: before.implementation,
                  currentLevel: before.currentLevel,
                  targetLevel: before.targetLevel,
                  notes: before.notes,
                }
              : null,
            after: input,
            methodVersion: methods.id,
          } as Prisma.InputJsonObject,
        },
      });
      return { id: result.id };
    },
    { timeout: 30_000, maxWait: 10_000 },
  );
}
