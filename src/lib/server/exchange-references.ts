import { referenceInputs } from "../../../scripts/seed-references";
import {
  ExchangeError,
  canonical,
  type RelationalBundle,
} from "./exchange-core";
/** Validate imported official content against committed, checksum-checked sources. */
export function validateReferenceBundle(bundle: RelationalBundle) {
  const inputs = referenceInputs();
  for (const filename of ["nist-csf-2.0.json", "cjis-6.0.json"]) {
    const source = inputs.get(filename) as {
      key: string;
      version: string;
      sourceSha256: string;
      requirements: {
        identifier: string;
        title: string;
        description: string;
        parent: string | null;
        kind: string;
        sourcePage: number | null;
        sourceUrl: string;
        deadline: string | null;
      }[];
    };
    const framework = bundle.tables.Framework.find(
      (f) => f.key === source.key && f.version === source.version,
    );
    if (!framework || framework.sourceHash !== source.sourceSha256)
      throw new ExchangeError(
        409,
        `Pinned framework version/source missing: ${filename}`,
      );
    const rows = bundle.tables.FrameworkRequirement.filter(
      (r) => r.frameworkId === framework.id,
    );
    if (rows.length !== source.requirements.length)
      throw new ExchangeError(409, `Incomplete pinned reference: ${filename}`);
    for (let i = 0; i < source.requirements.length; i++) {
      const expected = source.requirements[i];
      const r = rows.find((r) => r.identifier === expected.identifier);
      const expectedId = `${framework.id}:${expected.identifier}`;
      if (
        !r ||
        r.id !== expectedId ||
        r.title !== expected.title ||
        r.description !== expected.description ||
        r.kind !== expected.kind ||
        r.parentId !==
          (expected.parent ? `${framework.id}:${expected.parent}` : null) ||
        r.sourceUrl !== expected.sourceUrl ||
        r.sourcePage !== expected.sourcePage ||
        r.deadline !== expected.deadline ||
        r.sortOrder !== i
      )
        throw new ExchangeError(
          409,
          `Official reference differs: ${source.key} ${expected.identifier}`,
        );
    }
  }
  if (bundle.tables.Framework.length !== 2)
    throw new ExchangeError(
      409,
      "Only the pinned official framework versions are supported by this interchange version",
    );
  const nice = inputs.get("nice-2.2.0.json") as {
    version: string;
    sourceUrl: string;
    sourceSha256: string;
    elements: {
      element_identifier: string;
      element_type: string;
      title: string;
      text: string;
    }[];
    relationships: {
      source_element_identifier: string;
      dest_element_identifier: string;
    }[];
  };
  if (
    bundle.tables.NiceElement.length !== nice.elements.length ||
    bundle.tables.NiceRelation.length !== nice.relationships.length
  )
    throw new ExchangeError(409, "Incomplete pinned NICE version");
  const byId = new Map(bundle.tables.NiceElement.map((r) => [r.id, r]));
  for (const e of nice.elements) {
    const row = byId.get(`nice@${nice.version}:${e.element_identifier}`);
    if (
      !row ||
      row.version !== nice.version ||
      row.identifier !== e.element_identifier ||
      row.kind !== e.element_type ||
      row.title !== (e.title || e.element_identifier) ||
      row.description !== e.text ||
      row.sourceHash !== nice.sourceSha256 ||
      row.sourceUrl !== nice.sourceUrl
    )
      throw new ExchangeError(
        409,
        `NICE source differs: ${e.element_identifier}`,
      );
  }
  const relationships = new Set(
    bundle.tables.NiceRelation.map((r) => canonical([r.sourceId, r.targetId])),
  );
  for (const r of nice.relationships)
    if (
      !relationships.has(
        canonical([
          `nice@${nice.version}:${r.source_element_identifier}`,
          `nice@${nice.version}:${r.dest_element_identifier}`,
        ]),
      )
    )
      throw new ExchangeError(
        409,
        "NICE relationship differs from pinned source",
      );
}
