import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { HttpError } from "./access";
import {
  ExchangeError,
  tableMetadata,
  readBundle,
  parseBundle,
  previewChanges,
  writeBundle,
  lockBusinessTables,
  bundleHash,
  sha256,
  canonical,
  type RelationalBundle,
  type ImportChange,
} from "./exchange-core";
import { validateReferenceBundle } from "./exchange-references";
import { validateRestoredData } from "./exchange-validation";
export const PART_BYTES = 256 * 1024;
export const MAX_TRANSFER_BYTES = 128 * 1024 * 1024;
class PreviewRollback extends Error {
  constructor(
    public result: {
      bundle: RelationalBundle;
      baseHash: string;
      changes: ImportChange[];
    },
  ) {
    super("Preview rolled back");
  }
}
function transferError(error: unknown): never {
  if (error instanceof ExchangeError)
    throw new HttpError(error.status, error.message);
  if ((error as { code?: string }).code === "P2034")
    throw new HttpError(
      409,
      "The workspace changed during import. Preview again.",
    );
  if ((error as { code?: string }).code?.startsWith("P"))
    throw new HttpError(
      400,
      "Import failed identity, reference or database validation. Nothing was applied.",
    );
  throw error;
}
export async function exportBusiness() {
  return db().$transaction((tx) => readBundle(tx), {
    isolationLevel: "RepeatableRead",
    timeout: 60_000,
    maxWait: 10_000,
  });
}
export async function createUpload(input: {
  byteLength: number;
  partCount: number;
  sha256: string;
}) {
  if (
    input.byteLength < 1 ||
    input.byteLength > MAX_TRANSFER_BYTES ||
    input.partCount !== Math.ceil(input.byteLength / PART_BYTES)
  )
    throw new HttpError(
      400,
      "Invalid file size or chunk count (maximum 128 MiB)",
    );
  const now = new Date();
  await db().dataUpload.deleteMany({ where: { expiresAt: { lt: now } } });
  await db().importPreview.deleteMany({ where: { expiresAt: { lt: now } } });
  const upload = await db().dataUpload.create({
    data: { ...input, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  return { id: upload.id, partBytes: PART_BYTES };
}
export async function saveUploadPart(id: string, part: number, base64: string) {
  if (
    base64.length > Math.ceil(PART_BYTES / 3) * 4 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)
  )
    throw new HttpError(400, "Invalid upload chunk");
  return db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "DataUpload" WHERE id=${id} FOR UPDATE`;
    const upload = await tx.dataUpload.findUnique({ where: { id } });
    if (!upload || upload.expiresAt < new Date() || upload.finalizedAt)
      throw new HttpError(409, "Upload expired or already finalized");
    if (part < 0 || part >= upload.partCount || !Number.isInteger(part))
      throw new HttpError(400, "Invalid chunk number");
    const buffer = Buffer.from(base64, "base64");
    const expected =
      part === upload.partCount - 1
        ? upload.byteLength - part * PART_BYTES
        : PART_BYTES;
    if (buffer.length !== expected || buffer.toString("base64") !== base64)
      throw new HttpError(400, "Chunk length/content is invalid");
    const existing = await tx.dataUploadPart.findUnique({
      where: { uploadId_part: { uploadId: id, part } },
    });
    if (existing && existing.base64 !== base64)
      throw new HttpError(
        409,
        "A different chunk already occupies this identity",
      );
    if (!existing)
      await tx.dataUploadPart.create({ data: { uploadId: id, part, base64 } });
    return { part, received: true };
  });
}
export async function previewUpload(id: string) {
  try {
    const upload = await db().dataUpload.findUnique({
      where: { id },
      include: { parts: { orderBy: { part: "asc" } } },
    });
    if (!upload || upload.expiresAt < new Date() || upload.finalizedAt)
      throw new HttpError(409, "Upload expired or finalized");
    if (
      upload.parts.length !== upload.partCount ||
      upload.parts.some((p, i) => p.part !== i)
    )
      throw new HttpError(400, "Upload is incomplete");
    const bytes = Buffer.concat(
      upload.parts.map((p) => Buffer.from(p.base64, "base64")),
    );
    if (bytes.length !== upload.byteLength || sha256(bytes) !== upload.sha256)
      throw new HttpError(400, "Upload checksum mismatch");
    const input = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    let result: PreviewRollback["result"] | undefined;
    try {
      await db().$transaction(
        async (tx) => {
          const meta = await tableMetadata(tx);
          await lockBusinessTables(tx, meta);
          const bundle = parseBundle(input, meta);
          validateReferenceBundle(bundle);
          const current = await readBundle(tx, "public", meta);
          const changes = previewChanges(current, bundle, meta);
          await writeBundle(tx, bundle, changes, meta);
          await validateRestoredData(tx, bundle);
          throw new PreviewRollback({
            bundle,
            changes,
            baseHash: bundleHash(current),
          });
        },
        { isolationLevel: "Serializable", timeout: 180_000, maxWait: 10_000 },
      );
    } catch (error) {
      if (error instanceof PreviewRollback) result = error.result;
      else throw error;
    }
    if (!result) throw new HttpError(503, "Preview could not complete");
    const preview = await db().importPreview.create({
      data: {
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        schemaHash: result.bundle.schemaHash,
        payloadHash: sha256(canonical(result.bundle)),
        baseHash: result.baseHash,
        payload: result.bundle as unknown as Prisma.InputJsonObject,
        changes: result.changes as unknown as Prisma.InputJsonArray,
      },
    });
    await db().dataUpload.update({
      where: { id },
      data: { finalizedAt: new Date() },
    });
    return {
      id: preview.id,
      expiresAt: preview.expiresAt.toISOString(),
      changes: result.changes,
      baseHash: preview.baseHash,
      counts: {
        create: result.changes.filter((c) => c.action === "create").length,
        update: result.changes.filter((c) => c.action === "update").length,
        relationships: result.changes.filter((c) =>
          ["relationships", "unlink"].includes(c.action),
        ).length,
      },
    };
  } catch (error) {
    transferError(error);
  }
}
export async function applyPreview(id: string, actorId: string | null) {
  try {
    return await db().$transaction(
      async (tx) => {
        const preview = await tx.importPreview.findUnique({ where: { id } });
        if (!preview || preview.expiresAt < new Date() || preview.appliedAt)
          throw new HttpError(
            409,
            "Preview expired or already applied. Preview again.",
          );
        const meta = await tableMetadata(tx);
        await lockBusinessTables(tx, meta);
        const bundle = parseBundle(preview.payload, meta);
        if (sha256(canonical(bundle)) !== preview.payloadHash)
          throw new HttpError(409, "Preview content no longer matches");
        const current = await readBundle(tx, "public", meta);
        if (bundleHash(current) !== preview.baseHash)
          throw new HttpError(
            409,
            "The workspace changed after preview. Nothing was applied; preview again.",
          );
        validateReferenceBundle(bundle);
        const changes = previewChanges(current, bundle, meta);
        await writeBundle(tx, bundle, changes, meta);
        await validateRestoredData(tx, bundle);
        await tx.importPreview.update({
          where: { id },
          data: { appliedAt: new Date() },
        });
        await tx.changeEvent.create({
          data: {
            actorId,
            entityType: "DataExchange",
            entityId: id,
            action: "data.imported",
            details: {
              schemaVersion: 1,
              payloadHash: preview.payloadHash,
              changes: changes.length,
            },
          },
        });
        return { applied: true, changes: changes.length };
      },
      { isolationLevel: "Serializable", timeout: 180_000, maxWait: 10_000 },
    );
  } catch (error) {
    transferError(error);
  }
}
