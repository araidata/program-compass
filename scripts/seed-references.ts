import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { z } from "zod";
import type { PrismaClient } from "../src/generated/prisma/client";
const requirement = z.object({
  identifier: z.string(),
  title: z.string(),
  description: z.string(),
  parent: z.string().nullable(),
  kind: z.string(),
  sourceUrl: z.url(),
  sourcePage: z.number().int().nullable(),
  deadline: z.iso.date().nullable(),
});
const framework = z.object({
  key: z.string(),
  name: z.string(),
  version: z.string(),
  sourceUrl: z.url(),
  sourceSha256: z.string().length(64),
  requirements: z.array(requirement),
});
const manifestSchema = z.object({
  normalizerVersion: z.literal(1),
  sources: z.array(
    z.object({
      file: z.string(),
      sourceUrl: z.string(),
      sourceSha256: z.string(),
      normalizedSha256: z.string(),
    }),
  ),
});
function read(name: string) {
  return JSON.parse(readFileSync(resolve("data/references", name), "utf8"));
}
export function referenceInputs() {
  const manifest = manifestSchema.parse(read("manifest.json"));
  const inputs = new Map<string, unknown>();
  for (const entry of manifest.sources) {
    if (!/^[a-z0-9.-]+\.json$/.test(entry.file))
      throw new Error("Invalid reference filename");
    const data = read(entry.file);
    const hash = createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
    if (hash !== entry.normalizedSha256)
      throw new Error(`Reference checksum mismatch: ${entry.file}`);
    inputs.set(entry.file, data);
  }
  return inputs;
}
export async function seedReferences(client: PrismaClient) {
  const inputs = referenceInputs();
  await client.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(731245, 5)`;
      for (const filename of ["nist-csf-2.0.json", "cjis-6.0.json"]) {
        const source = framework.parse(inputs.get(filename));
        const known = await tx.framework.findUnique({
          where: { key_version: { key: source.key, version: source.version } },
          include: { _count: { select: { requirements: true } } },
        });
        if (known?.sourceHash && known.sourceHash !== source.sourceSha256)
          throw new Error(
            `Changed authoritative source for pinned ${filename}`,
          );
        if (known?._count.requirements) {
          if (
            !known.sourceHash ||
            known._count.requirements !== source.requirements.length
          )
            throw new Error(
              `Existing reference content needs review: ${filename}`,
            );
          continue;
        }
        const record = await tx.framework.upsert({
          where: { key_version: { key: source.key, version: source.version } },
          create: {
            id: `${source.key}@${source.version}`,
            key: source.key,
            name: source.name,
            version: source.version,
            sourceUrl: source.sourceUrl,
            sourceHash: source.sourceSha256,
          },
          update: {
            sourceUrl: source.sourceUrl,
            sourceHash: source.sourceSha256,
          },
        });
        const identifiers = new Set(
          source.requirements.map((r) => r.identifier),
        );
        if (identifiers.size !== source.requirements.length)
          throw new Error("Duplicate reference identifiers");
        const inserted = new Set<string>();
        let pending = [...source.requirements];
        while (pending.length) {
          const ready = pending.filter(
            (r) => r.parent === null || inserted.has(r.parent),
          );
          if (!ready.length) throw new Error("Invalid reference hierarchy");
          await tx.frameworkRequirement.createMany({
            data: ready.map((r) => ({
              id: `${record.id}:${r.identifier}`,
              frameworkId: record.id,
              identifier: r.identifier,
              title: r.title,
              description: r.description,
              parentId: r.parent ? `${record.id}:${r.parent}` : null,
              kind: r.kind,
              sourceUrl: r.sourceUrl,
              sourcePage: r.sourcePage,
              deadline: r.deadline ? new Date(`${r.deadline}T00:00:00Z`) : null,
              sortOrder: source.requirements.indexOf(r),
            })),
          });
          for (const r of ready) inserted.add(r.identifier);
          pending = pending.filter((r) => !inserted.has(r.identifier));
        }
        await tx.changeEvent.create({
          data: {
            entityType: "Framework",
            entityId: record.id,
            action: "framework.referenceImported",
            details: {
              version: source.version,
              sourceHash: source.sourceSha256,
              count: source.requirements.length,
            },
          },
        });
      }
      const nice = z
        .object({
          version: z.literal("2.2.0"),
          sourceUrl: z.url(),
          sourceSha256: z.string().length(64),
          elements: z.array(
            z.object({
              element_identifier: z.string(),
              element_type: z.string(),
              title: z.string(),
              text: z.string(),
            }),
          ),
          relationships: z.array(
            z.object({
              source_element_identifier: z.string(),
              dest_element_identifier: z.string(),
            }),
          ),
        })
        .parse(inputs.get("nice-2.2.0.json"));
      const existing = await tx.niceElement.findMany({
        where: { version: nice.version },
        select: { sourceHash: true },
      });
      if (existing.length) {
        if (
          existing.length !== nice.elements.length ||
          existing.some((e) => e.sourceHash !== nice.sourceSha256)
        )
          throw new Error("Existing NICE version/source needs review");
      } else {
        await tx.niceElement.createMany({
          data: nice.elements.map((e) => ({
            id: `nice@${nice.version}:${e.element_identifier}`,
            version: nice.version,
            identifier: e.element_identifier,
            kind: e.element_type,
            title: e.title || e.element_identifier,
            description: e.text,
            sourceUrl: nice.sourceUrl,
            sourceHash: nice.sourceSha256,
          })),
        });
        await tx.niceRelation.createMany({
          data: nice.relationships.map((r) => ({
            sourceId: `nice@${nice.version}:${r.source_element_identifier}`,
            targetId: `nice@${nice.version}:${r.dest_element_identifier}`,
          })),
          skipDuplicates: true,
        });
        await tx.changeEvent.create({
          data: {
            entityType: "NiceReferenceVersion",
            entityId: nice.version,
            action: "nice.referenceImported",
            details: {
              version: nice.version,
              sourceHash: nice.sourceSha256,
              count: nice.elements.length,
            },
          },
        });
      }
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
}
