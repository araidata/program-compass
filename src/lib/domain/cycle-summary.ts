import { alignmentSummary } from "./alignment";
import type { SnapshotDataset } from "../server/snapshots";
export type CycleSummary = {
  version: 1;
  method: string;
  alignment: {
    frameworkId: string;
    coverage: number | null;
    covered: number;
    applicable: number;
    unknown: number;
  }[];
};
export function cycleSummary(data: SnapshotDataset): CycleSummary {
  return {
    version: 1,
    method: data.methods.id,
    alignment:
      data.alignment?.frameworks.map((f) => {
        const s = alignmentSummary(
          data.alignment!,
          data.capabilities,
          data.methods,
          f.id,
        );
        return {
          frameworkId: f.id,
          coverage: s.coverage,
          covered: s.covered,
          applicable: s.applicable,
          unknown: s.unknown,
        };
      }) ?? [],
  };
}
