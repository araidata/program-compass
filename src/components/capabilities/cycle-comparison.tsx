import type { CapabilityView } from "@/lib/domain/capabilities";
export function CycleComparison({
  captured,
  current,
}: {
  captured: CapabilityView[];
  current: CapabilityView[];
}) {
  const rows = captured.map((before) => ({
    before,
    after: current.find((c) => c.id === before.id),
  }));
  return (
    <details className="rounded-md border bg-card p-3">
      <summary className="cursor-pointer font-medium">
        Compare captured cycle with current assessment
      </summary>
      <p className="my-2 text-xs text-muted-foreground">
        Recorded values only. Different assessment scale versions are not
        subtracted.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Capability",
                "Captured current",
                "Live current",
                "Change",
                "Captured target",
                "Live target",
              ].map((h) => (
                <th className="p-2" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ before, after }) => (
              <tr key={before.id} className="border-t">
                <th className="p-2 text-left font-normal">
                  {before.code} · {before.name}
                </th>
                <td>{before.currentLevel ?? "Unknown"}</td>
                <td>{after?.currentLevel ?? "Unknown"}</td>
                <td>
                  {before.scaleVersion !== after?.scaleVersion
                    ? "Different scale versions"
                    : before.currentLevel == null || after?.currentLevel == null
                      ? "Unknown"
                      : after.currentLevel - before.currentLevel}
                </td>
                <td>{before.targetLevel ?? "Unknown"}</td>
                <td>{after?.targetLevel ?? "Unknown"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
