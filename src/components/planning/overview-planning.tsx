import Link from "next/link";
import { alignmentSummary } from "@/lib/domain/alignment";
import { capacityReport } from "@/lib/domain/capacity";
import { scenarioReport } from "@/lib/domain/finance";
import type { SnapshotDataset } from "@/lib/server/snapshots";
import { withScope, withCycle, type Pillar } from "@/lib/pillars";
export function OverviewPlanning({
  data,
  scope,
  cycleId,
}: {
  data: SnapshotDataset | null;
  scope: Pillar | null;
  cycleId: string | null;
}) {
  if (!data)
    return (
      <section className="rounded border bg-card p-4">
        <h2>Planning workflow</h2>
        <p>
          This cycle did not capture the connected planning modules. Live data
          was not substituted.
        </p>
      </section>
    );
  const caps = data.capabilities.filter(
    (c) => !scope || c.pillarKeys.includes(scope.id),
  );
  const ids = new Set(caps.map((c) => c.id));
  const rows = data.planning?.rows ?? [];
  const scoped = rows.filter(
    (r) =>
      !scope ||
      (r.values.capabilityIds as string[] | undefined)?.some((id) =>
        ids.has(id),
      ),
  );
  const responsibilities = scoped.filter(
    (r) => r.kind === "responsibility" && r.values.active,
  );
  const issues = scoped.filter(
    (r) =>
      r.kind === "issue" &&
      !["resolved", "deferred"].includes(String(r.values.status)),
  );
  const overdue = issues.filter(
    (r) =>
      r.values.dueDate &&
      String(r.values.dueDate) < data.capturedAt.slice(0, 10),
  );
  const initiatives = scoped.filter(
    (r) =>
      r.kind === "initiative" &&
      !["cancelled", "completed"].includes(String(r.values.status)),
  );
  const capacity =
    data.capacity && data.workforce
      ? capacityReport(
          data.capacity,
          data.workforce,
          data.methods.values.planStartYear,
          responsibilities.map((r) => r.id),
        )
      : null;
  const selected = data.finance?.rows.find(
    (r) => r.kind === "scenario" && r.values.active,
  );
  const financial =
    selected &&
    data.finance &&
    data.planning &&
    data.workforce &&
    data.alignment
      ? scenarioReport(
          data.finance,
          data.planning,
          data.workforce,
          data.capabilities,
          data.alignment,
          selected,
        )
      : null;
  const href = (path: string) => withCycle(withScope(path, scope), cycleId);
  const cards = [
    {
      label: "Active objectives",
      value:
        data.context?.objectives.filter(
          (o) =>
            o.active && (!scope || o.capabilityIds.some((id) => ids.has(id))),
        ).length ?? "Not captured",
      detail: "Business drivers for capability investment",
      path: "/context",
    },
    {
      label: "Open planning issues",
      value: issues.length,
      detail: `${overdue.length} overdue · ${issues.filter((r) => !r.values.ownerId).length} unassigned`,
      path: "/capabilities/planning?view=issue",
    },
    {
      label: "Operational initiatives",
      value: initiatives.length,
      detail: `${initiatives.filter((r) => !r.values.startDate || !r.values.endDate).length} undated · ${initiatives.filter((r) => r.values.status === "in-progress").length} in progress`,
      path: "/roadmap",
    },
    {
      label: "Workforce shortfall",
      value:
        capacity?.shortfall === null
          ? "Incomplete"
          : capacity
            ? `${capacity.shortfall.toLocaleString("en-US", { maximumFractionDigits: 1 })} h`
            : "Not captured",
      detail: `Year ${data.methods.values.planStartYear}; sourced workload and productive capacity`,
      path: "/workforce/planning",
    },
    {
      label: "Technology portfolio",
      value: scoped.filter(
        (r) => r.kind === "technology" && r.values.state !== "retired",
      ).length,
      detail: `${scoped.filter((r) => r.kind === "technology" && r.values.deficiencyType === "underutilization").length} underutilization decisions`,
      path: "/technology",
    },
    {
      label: "Funding constraints",
      value: financial?.constraints.length ?? "No scenario",
      detail: financial
        ? `${financial.scenario.title}; Enterprise costs${financial.complete ? "" : " incomplete"}`
        : "Create a sourced five-year scenario",
      path: "/roadmap/plan",
    },
  ];
  return (
    <section className="space-y-4 rounded border bg-card p-4">
      <h2>Planning workflow</h2>
      <p className="text-xs text-muted-foreground">
        Business context → assessment → deficiencies / responsibilities →
        resources → initiatives → funding → leadership reporting. Scope shares
        authoritative records; mappings do not duplicate effort or spending.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <Link
            className="rounded border p-3 hover:bg-muted"
            href={href(c.path)}
            key={c.label}
          >
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-xl">{c.value}</p>
            <p className="mt-1 text-xs">{c.detail}</p>
          </Link>
        ))}
      </div>
      {data.alignment && (
        <table className="w-full text-left text-sm">
          <caption className="mb-2 text-left font-medium">
            Framework Alignment · indicative coverage
          </caption>
          <thead>
            <tr>
              <th className="p-2">Framework</th>
              <th>Covered / applicable leaves</th>
              <th>Unknown applicability</th>
              <th>Unmapped applicable</th>
            </tr>
          </thead>
          <tbody>
            {data.alignment.frameworks.map((f) => {
              const alignment = data.alignment!;
              const filtered = {
                ...alignment,
                requirements: scope
                  ? alignment.requirements.filter((r) =>
                      r.values.capabilityIds.some((id) => ids.has(id)),
                    )
                  : alignment.requirements,
              };
              const summary = alignmentSummary(
                filtered,
                data.capabilities,
                data.methods,
                f.id,
                alignment.requirements,
              );
              return (
                <tr className="border-t" key={f.id}>
                  <th className="p-2 font-normal">
                    <Link
                      className="text-link underline"
                      href={href(`/compliance?framework=${f.id}`)}
                    >
                      {f.name} {f.version}
                    </Link>
                  </th>
                  <td>
                    {summary.covered} / {summary.applicable}
                  </td>
                  <td>{summary.unknown}</td>
                  <td>{summary.unmapped}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="flex gap-5 text-sm">
        <Link className="text-link underline" href={href("/reports")}>
          Executive and management reports
        </Link>
        <Link className="text-link underline" href="/reports/data">
          Relational export / validated restore
        </Link>
      </div>
    </section>
  );
}
