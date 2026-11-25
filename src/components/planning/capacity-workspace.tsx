"use client";
import { useState } from "react";
import { SkillsMatrix } from "./skills-matrix";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RecordEditor, type RecordDraft } from "./record-editor";
import { RecordHistory } from "./record-history";
import { capacityFields, newCapacityDraft } from "./capacity-fields";
import { useHistorical } from "./historical-provider";
import { useMethods } from "./method-provider";
import { useScope } from "@/components/use-scope";
import { useUrlFilters, useHydrated } from "@/components/use-url-filters";
import { withScope, withCycle } from "@/lib/pillars";
import { downloadCsv } from "@/lib/domain/csv";
import {
  activityDemand,
  capacityReport,
  constraintStatus,
  type CapacityData,
  type CapacityKind,
  type Activity,
  type Constraint,
} from "@/lib/domain/capacity";
import type { WorkforceData } from "@/lib/domain/workforce";
import type { PlanningData } from "@/lib/domain/planning";
const models = {
  activity: "workActivity",
  assignment: "capacityAssignment",
  skill: "skillObservation",
  constraint: "workforceConstraint",
};
const display = (v: number | null, decimals = 2) =>
  v === null
    ? "Incomplete"
    : v.toLocaleString("en-US", { maximumFractionDigits: decimals });
export function CapacityWorkspace({
  initial,
  workforce,
  planning,
  canEdit,
}: {
  initial: CapacityData;
  workforce: WorkforceData;
  planning: PlanningData;
  canEdit: boolean;
}) {
  const [data, setData] = useState(initial);
  const [draft, setDraft] = useState<RecordDraft | null>(null);
  const [status, setStatus] = useState("");
  const router = useRouter();
  const historical = useHistorical();
  const methods = useMethods();
  const scope = useScope();
  const hydrated = useHydrated();
  const { params, setFilters } = useUrlFilters();
  const view = params.get("view") ?? "workload";
  const query = (params.get("search") ?? "").toLowerCase();
  const year = Number(params.get("year") ?? methods.values.planStartYear);
  const safeYear =
    Number.isInteger(year) && year >= 2000 && year <= 2200
      ? year
      : methods.values.planStartYear;
  const asOf = params.get("asOf") ?? `${safeYear}-12-31`;
  const responsibilities = planning.rows.filter(
    (r) => r.kind === "responsibility",
  );
  const scopedResponsibilities = responsibilities.filter(
    (r) =>
      !scope ||
      (r.values.capabilityIds as string[]).some((id) =>
        planning.options.capabilities.some(
          (c) => c.id === id && c.pillars.includes(scope.id),
        ),
      ) ||
      (r.values.positionIds as string[]).some((id) =>
        workforce.positions.some(
          (p) =>
            p.id === id &&
            workforce.pillars.some(
              (k) => k.id === p.pillarId && k.key === scope.id,
            ),
        ),
      ),
  );
  const selectedResponsibility = params.get("responsibility") ?? "";
  const driverRequirement = params.get("requirement");
  const driverResponsibilities = new Set([
    ...responsibilities
      .filter((r) =>
        (r.values.requirementIds as string[]).includes(driverRequirement ?? ""),
      )
      .map((r) => r.id),
    ...data.rows
      .filter(
        (r) =>
          r.kind === "activity" &&
          (r.values.requirementIds as string[]).includes(
            driverRequirement ?? "",
          ),
      )
      .map((r) => String(r.values.responsibilityId)),
  ]);
  const matchedResponsibilities = driverRequirement
    ? scopedResponsibilities.filter((r) => driverResponsibilities.has(r.id))
    : scopedResponsibilities;
  const responsibilityIds = selectedResponsibility
    ? matchedResponsibilities
        .filter((r) => r.id === selectedResponsibility)
        .map((r) => r.id)
    : matchedResponsibilities.map((r) => r.id);
  const scopedPeople = new Set(
    workforce.positions
      .filter(
        (p) =>
          !scope ||
          workforce.pillars.some(
            (k) => k.id === p.pillarId && k.key === scope.id,
          ),
      )
      .map((p) => p.personId)
      .filter(Boolean),
  );
  const scopedData = {
    ...data,
    rows: data.rows.filter((r) =>
      r.kind === "skill"
        ? !scope || scopedPeople.has(String(r.values.personId))
        : responsibilityIds.includes(String(r.values.responsibilityId)),
    ),
  };
  const report = capacityReport(scopedData, workforce, safeYear);
  const kinds: Record<string, CapacityKind> = {
    workload: "activity",
    assignments: "assignment",
    skills: "skill",
    coverage: "constraint",
  };
  const kind = kinds[view];
  const rows = scopedData.rows.filter(
    (r) =>
      (!kind || r.kind === kind) &&
      (r.kind !== "activity" || r.values.year === safeYear) &&
      `${r.values.title} ${r.values.source}`.toLowerCase().includes(query),
  );
  const label = (id: unknown) =>
    responsibilities.find((r) => r.id === id)?.values.title ??
    workforce.people.find((r) => r.id === id)?.name ??
    workforce.positions.find((r) => r.id === id)?.title ??
    data.nice.find((r) => r.id === id)?.identifier ??
    String(id ?? "Unknown");
  const href = (path: string) =>
    withCycle(withScope(path, scope), historical?.cycleId ?? null);
  async function saved() {
    setDraft(null);
    setStatus("Saved workforce planning record.");
    try {
      const r = await fetch("/api/capacity", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setData((await r.json()).data);
      router.refresh();
    } catch {
      setStatus("Saved; reload to refresh the workspace.");
    }
  }
  function exportRows() {
    downloadCsv(`workforce-${view}-${safeYear}.csv`, [
      [
        "Method",
        methods.id,
        "Year",
        safeYear,
        "Scope",
        scope?.id ?? "Enterprise",
      ],
      ["Kind", "Identity", "Title", "Source", "Values / units"],
      ...rows.map((r) => [
        r.kind,
        r.id,
        r.values.title,
        r.values.source,
        JSON.stringify(r.values),
      ]),
    ]);
  }
  function personTree(
    managerId: string | null,
    seen = new Set<string>(),
  ): React.ReactNode {
    return (
      <ol className="ml-5 space-y-2 border-l pl-4">
        {workforce.people
          .filter(
            (p) =>
              (p.managerId === managerId ||
                (managerId === null &&
                  scope &&
                  p.managerId &&
                  !scopedPeople.has(p.managerId))) &&
              (!scope || scopedPeople.has(p.id)),
          )
          .map((p) => (
            <li key={p.id}>
              <p>
                <Link
                  className="text-link underline"
                  href={href(`/workforce?view=ownership&person=${p.id}`)}
                >
                  {p.name}
                </Link>{" "}
                · {p.title}
                {!p.active ? " · inactive" : ""}
              </p>
              {!seen.has(p.id) && personTree(p.id, new Set([...seen, p.id]))}
            </li>
          ))}
      </ol>
    );
  }
  return (
    <fieldset disabled={!hydrated} className="min-w-0 space-y-4">
      <p role="status" aria-live="polite" className="text-sm">
        {status}
      </p>
      <div className="print-hidden flex flex-wrap gap-2">
        {[
          "workload",
          "assignments",
          "coverage",
          "skills",
          "chart",
          "nice",
          "justifications",
        ].map((v) => (
          <Button
            key={v}
            variant={view === v ? "secondary" : "ghost"}
            onClick={() => setFilters({ view: v })}
          >
            {v[0].toUpperCase() + v.slice(1)}
          </Button>
        ))}
      </div>
      <div className="print-hidden flex items-end gap-3">
        <label>
          Planning year
          <input
            aria-label="Planning year"
            className="form-input"
            type="number"
            min="2000"
            max="2200"
            value={safeYear}
            onChange={(e) => setFilters({ year: e.target.value })}
          />
        </label>
        <label>
          Search
          <input
            className="form-input"
            value={query}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </label>
        <label>
          Responsibility
          <select
            className="form-input"
            value={selectedResponsibility}
            onChange={(e) => setFilters({ responsibility: e.target.value })}
          >
            <option value="">All in scope</option>
            {scopedResponsibilities.map((r) => (
              <option value={r.id} key={r.id}>
                {String(r.values.title)}
              </option>
            ))}
          </select>
        </label>
        {kind && canEdit && (
          <Button onClick={() => setDraft(newCapacityDraft(kind, safeYear))}>
            Add {kind}
          </Button>
        )}
        <Button variant="outline" onClick={exportRows}>
          Export CSV
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Year {safeYear} · {scope?.id ?? "Enterprise"} · method {methods.id}.
        Sourced estimates, no staffing benchmark. Workload counts unique
        activities once; mapping counts never multiply demand. Unknown inputs
        remain incomplete. Coverage constraints are separate, not added to
        workload FTE.
      </p>
      <div className="grid grid-cols-6 gap-3">
        {[
          ["Known demand hours", report.knownHours],
          ["Known productive hours", report.knownCapacity],
          ["Required workload FTE", report.requiredFte],
          ["Actual allocated FTE-years", report.availableFte],
          ["Paid hours", report.paidHours],
          ["Demand shortfall hours", report.shortfall],
        ].map(([title, v]) => (
          <div className="rounded border bg-card p-3" key={String(title)}>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-xl">{display(v as number | null)}</p>
          </div>
        ))}
      </div>
      {(report.missingDemand.length > 0 ||
        report.missingCapacity.length > 0) && (
        <p className="rounded border border-status-warn p-3 text-sm">
          Incomplete inputs: {report.missingDemand.length} activities and{" "}
          {report.missingCapacity.length} actual capacity assignments. Known
          subtotals above exclude these records.
        </p>
      )}
      <p className="text-sm">
        Run demand/capacity: {display(report.runDemand)} /{" "}
        {display(report.runCapacity)} hours · Change demand/capacity:{" "}
        {display(report.changeDemand)} / {display(report.changeCapacity)} hours.
        Dated capacity uses actual calendar-day fractions, including leap years.
      </p>
      {view === "skills" && (
        <SkillsMatrix
          data={scopedData}
          workforce={workforce}
          onSelect={(r) =>
            setDraft({
              kind: r.kind,
              id: r.id,
              revision: r.revision,
              values: r.values,
            })
          }
        />
      )}
      {view === "chart" ? (
        <section className="rounded border bg-card p-4">
          <h2>Organization chart / accessible reporting tree</h2>
          {personTree(null)}
          <p className="mt-3 text-xs">
            Shared personnel records; this hierarchy assigns no additional
            workload or headcount.
          </p>
        </section>
      ) : view === "nice" ? (
        <section className="rounded border bg-card p-4">
          <h2>NICE Framework Components 2.2.0</h2>
          <p className="text-xs">
            Official workforce reference, not a staffing ratio. Roles may span
            positions; a role is not automatically one job. Showing first 150
            matches; narrow Search.
          </p>
          <div className="mt-3 space-y-3">
            {data.nice
              .filter((n) =>
                `${n.identifier} ${n.title} ${n.description}`
                  .toLowerCase()
                  .includes(query),
              )
              .slice(0, 150)
              .map((n) => (
                <details className="rounded border p-3" key={n.id}>
                  <summary>
                    {n.identifier} · {n.kind} · {n.title}
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {n.description}
                  </p>
                  <a className="text-xs text-link underline" href={n.sourceUrl}>
                    Official {n.version} source
                  </a>
                  <ul className="mt-2 text-xs">
                    {data.niceRelations
                      .filter((r) => r.sourceId === n.id || r.targetId === n.id)
                      .map((r) => {
                        const linked = data.nice.find(
                          (e) =>
                            e.id ===
                            (r.sourceId === n.id ? r.targetId : r.sourceId),
                        );
                        return linked ? (
                          <li key={`${r.sourceId}-${r.targetId}`}>
                            {linked.identifier} · {linked.kind} · {linked.title}
                          </li>
                        ) : null;
                      })}
                  </ul>
                </details>
              ))}
          </div>
        </section>
      ) : view === "justifications" ? (
        <div className="space-y-4">
          {workforce.positions
            .filter(
              (p) =>
                p.state === "proposed" &&
                (!scope ||
                  workforce.pillars.some(
                    (k) => k.id === p.pillarId && k.key === scope.id,
                  )) &&
                p.title.toLowerCase().includes(query),
            )
            .map((p) => {
              const linked = responsibilities.filter(
                (r) =>
                  (r.values.positionIds as string[]).includes(p.id) ||
                  data.rows.some(
                    (a) =>
                      a.kind === "assignment" &&
                      a.values.positionId === p.id &&
                      a.values.responsibilityId === r.id,
                  ),
              );
              const result = capacityReport(
                data,
                workforce,
                safeYear,
                linked.map((r) => r.id),
              );
              const initiatives = planning.rows.filter(
                (r) =>
                  r.kind === "initiative" &&
                  (r.values.positionIds as string[]).includes(p.id),
              );
              const constraints = data.rows.filter(
                (r) =>
                  r.kind === "constraint" &&
                  r.values.active &&
                  linked.some((l) => l.id === r.values.responsibilityId),
              );
              return (
                <section className="rounded border bg-card p-4" key={p.id}>
                  <h2>{p.title} · position justification</h2>
                  <p className="mt-2">
                    {p.justification ?? "Business justification not supplied"}
                  </p>
                  <p>
                    Implementation year: {p.startYear ?? "Unscheduled"} ·
                    Proposed {p.fte} FTE · Annual cost:{" "}
                    {p.annualCost === null
                      ? "Missing financial input"
                      : `${p.currency} ${display(p.annualCost)}`}
                  </p>
                  <p>
                    Unique workload: {display(result.knownHours)} hours ·
                    Available productive capacity:{" "}
                    {display(result.knownCapacity)} · Shortfall:{" "}
                    {display(result.shortfall)} · Workload FTE:{" "}
                    {display(result.requiredFte)}
                  </p>
                  <p className="text-xs">
                    This is a linked-service shortfall, not a claim that this
                    position alone supplies every listed skill or covers every
                    gap. Shared responsibilities are not additive across
                    position proposals.
                  </p>
                  <ul className="mt-2 text-sm">
                    {linked.map((r) => (
                      <li key={r.id}>
                        <Link
                          className="text-link underline"
                          href={href(
                            `/capabilities/planning?view=responsibility&search=${encodeURIComponent(String(r.values.title))}`,
                          )}
                        >
                          {String(r.values.title)}
                        </Link>{" "}
                        · Capability/requirement drivers:{" "}
                        {[
                          ...(r.values.capabilityIds as string[]),
                          ...(r.values.requirementIds as string[]),
                        ]
                          .map(
                            (id) =>
                              planning.options.capabilities.find(
                                (c) => c.id === id,
                              )?.label ??
                              planning.options.requirements.find(
                                (c) => c.id === id,
                              )?.label ??
                              id,
                          )
                          .join("; ")}
                      </li>
                    ))}
                  </ul>
                  <details className="mt-2">
                    <summary>Workload calculation and inputs</summary>
                    {result.activities.map((a) => (
                      <p className="text-xs" key={a.id}>
                        {String(a.values.title)} · {String(a.values.source)} ·{" "}
                        {JSON.stringify(a.values)} · Result{" "}
                        {display(activityDemand(a.values as Activity).hours)}{" "}
                        hours
                      </p>
                    ))}
                  </details>
                  <p className="mt-2 text-sm">
                    Alternatives / deferral consequences:{" "}
                    {constraints.length === 0 && initiatives.length === 0
                      ? "Not supplied — complete the linked coverage constraints or initiatives before relying on this justification."
                      : null}
                  </p>
                  {constraints.map((c) => (
                    <p key={c.id} className="text-sm">
                      {String(c.values.alternatives)} · Deferral:{" "}
                      {String(c.values.consequence)}
                    </p>
                  ))}
                  {initiatives.map((i) => (
                    <p key={i.id} className="text-sm">
                      <Link
                        className="text-link underline"
                        href={href(
                          `/roadmap?search=${encodeURIComponent(String(i.values.title))}`,
                        )}
                      >
                        {String(i.values.title)}
                      </Link>{" "}
                      · Deferral: {String(i.values.deferral)}
                    </p>
                  ))}
                </section>
              );
            })}
        </div>
      ) : (
        <section className="overflow-x-auto rounded border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Record / source</th>
                <th>Relationship</th>
                <th>
                  {view === "workload"
                    ? "Demand / calculation"
                    : "Planning observation"}
                </th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const demand =
                  r.kind === "activity"
                    ? activityDemand(r.values as Activity)
                    : null;
                const coverage =
                  r.kind === "constraint"
                    ? constraintStatus(
                        r.values as Constraint,
                        data,
                        workforce,
                        asOf,
                      )
                    : null;
                return (
                  <tr className="border-t align-top" key={r.id}>
                    <td className="max-w-md p-3">
                      <button
                        className="text-left text-link underline"
                        onClick={() =>
                          setDraft({
                            kind: r.kind,
                            id: r.id,
                            revision: r.revision,
                            values: r.values,
                          })
                        }
                      >
                        {String(r.values.title)}
                      </button>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {String(r.values.source)}
                      </p>
                      {r.kind === "activity" && (
                        <p className="text-xs">
                          {String(r.values.workKey)} · {String(r.values.year)} ·{" "}
                          {r.values.provisional
                            ? "provisional"
                            : "organization approved"}{" "}
                          · effective {String(r.values.effectiveDate)}
                        </p>
                      )}
                    </td>
                    <td className="max-w-md p-3">
                      {String(
                        label(r.values.responsibilityId ?? r.values.personId),
                      )}
                      {r.kind === "assignment" && (
                        <p>
                          {String(label(r.values.positionId))} ·{" "}
                          {r.values.personId
                            ? String(label(r.values.personId))
                            : "Vacancy/proposal — no actual capacity"}
                        </p>
                      )}
                      {r.kind === "skill" && (
                        <p>{String(label(r.values.niceElementId))}</p>
                      )}
                      {r.kind === "activity" && (
                        <ul className="text-xs">
                          {(r.values.niceIds as string[]).map((id) => (
                            <li key={id}>{String(label(id))}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="max-w-xl p-3">
                      {demand ? (
                        <>
                          <p>
                            {display(demand.hours)} hours ·{" "}
                            {display(demand.fte)} FTE
                          </p>
                          <p className="text-xs">
                            ({String(r.values.volume ?? "?")} ×{" "}
                            {String(r.values.frequency ?? "?")} ×{" "}
                            {String(r.values.hoursPerUnit ?? "?")} +{" "}
                            {String(r.values.fixedHours ?? "?")} +{" "}
                            {String(r.values.projectHours ?? "?")}) ×{" "}
                            {String(r.values.growth ?? "?")} −{" "}
                            {String(r.values.outsourcedHours ?? "?")} −{" "}
                            {String(r.values.automatedHours ?? "?")}
                          </p>
                          {demand.missing.length > 0 && (
                            <p className="text-xs">
                              Missing: {demand.missing.join(", ")}
                            </p>
                          )}
                        </>
                      ) : coverage ? (
                        <>
                          <p>
                            {coverage.status} · {coverage.people}{" "}
                            qualified/distinct people · {display(coverage.fte)}{" "}
                            allocated FTE
                          </p>
                          <p className="text-xs">
                            {coverage.detail} · {String(r.values.consequence)}
                          </p>
                        </>
                      ) : r.kind === "skill" ? (
                        <p>
                          Current {String(r.values.currentLevel ?? "unknown")} →
                          target {String(r.values.targetLevel ?? "unknown")} ·
                          Observed {String(r.values.assessedDate)}
                        </p>
                      ) : (
                        <p>
                          {String(r.values.startDate)} →{" "}
                          {String(r.values.endDate ?? "ongoing")} ·{" "}
                          {String(r.values.allocatedFte)} FTE · Paid/productive
                          hours per FTE:{" "}
                          {String(r.values.paidHours ?? "unknown")} /{" "}
                          {String(r.values.productiveHours ?? "unknown")} · Run
                          share {String(r.values.runShare)}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      {r.values.active ? "Active" : "Archived"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="p-4">
              No matching records. Enter sourced planning inputs to calculate
              this view.
            </p>
          )}
        </section>
      )}
      {view === "coverage" && (
        <label className="print-hidden block max-w-xs">
          Coverage as of
          <input
            className="form-input"
            type="date"
            value={asOf}
            onChange={(e) => setFilters({ asOf: e.target.value })}
          />
        </label>
      )}
      {draft && (
        <RecordEditor
          key={draft.id ?? draft.kind}
          draft={draft}
          title={`${draft.id ? "Edit" : "Add"} ${draft.kind}`}
          fields={capacityFields(
            draft.kind as CapacityKind,
            data,
            workforce,
            planning,
          )}
          endpoint="/api/capacity"
          readOnly={!canEdit}
          onClose={() => setDraft(null)}
          onSaved={() => void saved()}
        >
          {draft.id && (
            <RecordHistory
              entityType={models[draft.kind as CapacityKind]}
              id={draft.id}
              endpoint={`/api/capacity/${draft.id}/history`}
            />
          )}
        </RecordEditor>
      )}
    </fieldset>
  );
}
