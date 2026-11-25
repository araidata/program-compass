"use client";
import type { CapacityData, CapacityRow } from "@/lib/domain/capacity";
import type { WorkforceData } from "@/lib/domain/workforce";
export function SkillsMatrix({
  data,
  workforce,
  onSelect,
}: {
  data: CapacityData;
  workforce: WorkforceData;
  onSelect: (r: CapacityRow) => void;
}) {
  const rows = data.rows.filter((r) => r.kind === "skill" && r.values.active);
  const columns = data.nice.filter((n) =>
    rows.some((r) => r.values.niceElementId === n.id),
  );
  const people = workforce.people.filter((p) =>
    rows.some((r) => r.values.personId === p.id),
  );
  return (
    <section className="overflow-x-auto rounded border bg-card p-4">
      <h2>Skills matrix</h2>
      <p className="text-xs">
        Observed → target; unknown observations stay unknown. Organization 1–5
        skills scale; NICE defines work, not required headcount. Select a cell
        for its sourced observation.
      </p>
      <table className="mt-3 w-full text-left text-sm">
        <thead>
          <tr>
            <th className="p-2">Person</th>
            {columns.map((n) => (
              <th className="p-2" key={n.id}>
                <abbr title={n.title}>{n.identifier}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr className="border-t" key={p.id}>
              <th className="p-2">{p.name}</th>
              {columns.map((n) => {
                const r = rows.find(
                  (r) =>
                    r.values.personId === p.id &&
                    r.values.niceElementId === n.id,
                );
                return (
                  <td className="p-2" key={n.id}>
                    {r ? (
                      <button
                        className="text-link underline"
                        onClick={() => onSelect(r)}
                        aria-label={`${p.name}, ${n.identifier}: current ${r.values.currentLevel ?? "unknown"}, target ${r.values.targetLevel ?? "unknown"}`}
                      >
                        {String(r.values.currentLevel ?? "?")} →{" "}
                        {String(r.values.targetLevel ?? "?")}
                      </button>
                    ) : (
                      "Unassessed"
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="mt-2 text-sm">No skill observations entered.</p>
      )}
    </section>
  );
}
