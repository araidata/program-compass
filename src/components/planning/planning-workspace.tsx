"use client";
import { RecordHistory } from "./record-history";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RecordEditor, type RecordDraft } from "./record-editor";
import { planningFields, newPlanningValues } from "./planning-fields";
import { useMethods } from "./method-provider";
import { useHistorical } from "./historical-provider";
import { useUrlFilters, useHydrated } from "@/components/use-url-filters";
import { useScope } from "@/components/use-scope";
import { withScope, withCycle } from "@/lib/pillars";
import { downloadCsv } from "@/lib/domain/csv";
import {
  projectedLevel,
  type PlanningKind,
  type PlanningData,
  type PlanningRow,
} from "@/lib/domain/planning";
const labels: Record<PlanningKind, string> = {
  responsibility: "Responsibilities",
  issue: "Planning issues",
  initiative: "Initiatives",
  technology: "Technology portfolio",
};
export function PlanningWorkspace({
  initial,
  kinds,
  canEdit,
  now,
}: {
  initial: PlanningData;
  kinds: PlanningKind[];
  canEdit: boolean;
  now: string;
}) {
  const [data, setData] = useState(initial);
  const [draft, setDraft] = useState<RecordDraft | null>(null);
  const [status, setStatus] = useState("");
  const methods = useMethods();
  const historical = useHistorical();
  const scope = useScope();
  const { params, setFilters } = useUrlFilters();
  const router = useRouter();
  const hydrated = useHydrated();
  const kind = kinds.includes(params.get("view") as PlanningKind)
    ? (params.get("view") as PlanningKind)
    : kinds[0];
  const search = params.get("search") ?? "";
  const state = params.get("state") ?? "";
  const capability = params.get("capability") ?? "";
  const owner = params.get("owner") ?? "";
  const mode = params.get("mode") ?? "list";
  const scopedCapIds = new Set(
    data.options.capabilities
      .filter((c) => !scope || c.pillars.includes(scope.id))
      .map((c) => c.id),
  );
  const scopedRows = data.rows.filter(
    (r) =>
      !scope ||
      (r.values.capabilityIds as string[]).some((id) => scopedCapIds.has(id)),
  );
  const rows = scopedRows.filter(
    (r) =>
      r.kind === kind &&
      (!capability ||
        (r.values.capabilityIds as string[]).includes(capability)) &&
      (!owner || r.values.ownerId === owner) &&
      `${r.values.title} ${r.values.description}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!state ||
        String(
          r.values.status ??
            r.values.state ??
            (r.values.active ? "active" : "inactive"),
        ) === state),
  );
  const link = (href: string) =>
    withCycle(withScope(href, scope), historical?.cycleId ?? null);
  async function refresh() {
    setDraft(null);
    setStatus("Saved");
    try {
      const r = await fetch("/api/planning", { cache: "no-store" });
      const result = await r.json();
      if (!r.ok) throw new Error();
      setData(result.data);
      router.refresh();
    } catch {
      setStatus("Saved. Reload to refresh the workspace.");
    }
  }
  function edit(row?: PlanningRow) {
    setStatus("");
    setDraft(
      row
        ? {
            kind: row.kind,
            id: row.id,
            revision: row.revision,
            values: { ...row.values },
          }
        : {
            kind,
            values: newPlanningValues(kind, methods.values, now.slice(0, 10)),
          },
    );
  }
  const overdue = (r: PlanningRow) =>
    r.kind === "issue" &&
    ["open", "in-progress"].includes(String(r.values.status)) &&
    typeof r.values.dueDate === "string" &&
    r.values.dueDate < now.slice(0, 10);
  function alerts(r: PlanningRow) {
    const found: string[] = [];
    if (overdue(r)) found.push("Overdue");
    if (!r.values.ownerId) found.push("No owner");
    if (r.kind === "initiative") {
      if (!r.values.startDate || !r.values.endDate) found.push("Undated");
      if (
        r.values.status !== "completed" &&
        r.values.status !== "cancelled" &&
        typeof r.values.endDate === "string" &&
        r.values.endDate < now.slice(0, 10)
      )
        found.push("Past planned finish");
      for (const id of r.values.dependencyIds as string[]) {
        const dep = data.rows.find((d) => d.id === id);
        if (dep && dep.values.status !== "completed")
          found.push(`Prerequisite outstanding: ${dep.values.title}`);
        if (
          dep &&
          (!dep.values.endDate ||
            !r.values.startDate ||
            String(dep.values.endDate) > String(r.values.startDate))
        )
          found.push(`Dependency timing unresolved: ${dep.values.title}`);
      }
    }
    return found.join(" · ") || "No planning flags";
  }
  function exportRows() {
    downloadCsv(`${kind}.csv`, [
      [
        "ID",
        "Title",
        "Owner",
        "State",
        "Capabilities",
        "Planning flags",
        "Details JSON",
        "Scope",
        "Method version",
        "As of",
      ],
      ...rows.map((r) => [
        r.id,
        r.values.title,
        data.options.people.find((p) => p.id === r.values.ownerId)?.label,
        r.values.status ??
          r.values.state ??
          (r.values.active ? "active" : "inactive"),
        (r.values.capabilityIds as string[]).join(";"),
        alerts(r),
        JSON.stringify(r.values),
        scope?.name ?? "Enterprise",
        methods.id,
        now,
      ]),
    ]);
  }
  return (
    <fieldset
      disabled={!hydrated}
      className="min-w-0 space-y-4"
      aria-label="Planning workspace"
    >
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Matching records", rows.length],
          ["Unassigned", rows.filter((r) => !r.values.ownerId).length],
          ["Overdue planning issues", scopedRows.filter(overdue).length],
        ].map(([label, value]) => (
          <div className="rounded-md border bg-card p-3" key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="print-hidden flex flex-wrap items-center gap-2 border-b pb-2">
        {kinds.map((k) => (
          <Button
            key={k}
            variant={kind === k ? "secondary" : "ghost"}
            aria-pressed={kind === k}
            onClick={() => setFilters({ view: k, state: "", mode: "list" })}
          >
            {labels[k]}
          </Button>
        ))}
        {kind === "initiative" &&
          ["list", "timeline", "gaps"].map((m) => (
            <Button
              key={m}
              variant={mode === m ? "secondary" : "ghost"}
              onClick={() => setFilters({ mode: m })}
            >
              {m === "gaps"
                ? "Gap coverage"
                : m === "timeline"
                  ? "Timeline"
                  : "List"}
            </Button>
          ))}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportRows}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
          {canEdit && <Button onClick={() => edit()}>Add {kind}</Button>}
        </div>
      </div>
      <div className="print-hidden flex gap-3">
        <label>
          Search
          <input
            className="form-input ml-2 w-64"
            value={search}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </label>
        <label>
          Capability
          <select
            className="form-input ml-2 w-64"
            value={capability}
            onChange={(e) => setFilters({ capability: e.target.value })}
          >
            <option value="">All capabilities</option>
            {data.options.capabilities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            className="form-input ml-2 w-48"
            value={state}
            onChange={(e) => setFilters({ state: e.target.value })}
          >
            <option value="">All states</option>
            {[
              ...new Set(
                scopedRows
                  .filter((r) => r.kind === kind)
                  .map((r) =>
                    String(
                      r.values.status ??
                        r.values.state ??
                        (r.values.active ? "active" : "inactive"),
                    ),
                  ),
              ),
            ]
              .sort()
              .map((s) => (
                <option key={s}>{s}</option>
              ))}
          </select>
        </label>
      </div>
      <p role="status" className="text-sm">
        {status}
      </p>
      <p className="print-only text-xs">
        {labels[kind]} · {scope?.name ?? "Enterprise"} · Method {methods.id} ·
        As of {now.slice(0, 10)}
      </p>
      {kind === "initiative" && mode === "gaps" ? (
        <section className="overflow-x-auto rounded-md border bg-card p-4">
          <h2>Planned maturity coverage</h2>
          <p className="my-2 text-xs text-muted-foreground">
            Configured eligible initiative states only; strongest uplift per
            capability, capped at {methods.values.projectionCap ?? 5}. Completed
            work does not change observed maturity. Unknown current scores
            remain unknown.
          </p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {[
                  "Capability",
                  "Current",
                  "Target",
                  `Projected ${methods.values.planStartYear + 4}`,
                  "Remaining gap",
                ].map((h) => (
                  <th className="p-2" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.options.capabilities
                .filter((c) => scopedCapIds.has(c.id) && c.applicable)
                .map((c) => {
                  const projected = projectedLevel(
                    c.current,
                    rows,
                    c.id,
                    `${methods.values.planStartYear + 4}-12-31`,
                    methods.values,
                  );
                  return (
                    <tr className="border-t" key={c.id}>
                      <th className="p-2 text-left font-normal">
                        <Link
                          className="text-link hover:underline"
                          href={link(`/capabilities?topic=${c.id}`)}
                        >
                          {c.label}
                        </Link>
                      </th>
                      <td>{c.current ?? "Unknown"}</td>
                      <td>{c.target ?? "Unknown"}</td>
                      <td>{projected ?? "Unknown"}</td>
                      <td>
                        {projected === null || c.target === null
                          ? "Unknown"
                          : Math.max(0, c.target - projected)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      ) : kind === "initiative" && mode === "timeline" ? (
        <section className="rounded-md border bg-card p-4">
          <h2>Initiative timeline</h2>
          <div className="mt-3 grid grid-cols-[260px_repeat(5,1fr)] gap-2 text-xs">
            <span>Initiative / planned dates</span>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i}>
                {methods.values.planStartYear + i}
                {i > 2 ? " · directional" : ""}
              </span>
            ))}
            {rows.map((r) => (
              <div className="contents" key={r.id}>
                <button
                  className="text-left text-link hover:underline"
                  disabled={!canEdit}
                  onClick={() => edit(r)}
                >
                  {String(r.values.title)}
                  <span className="block text-muted-foreground">
                    {String(r.values.startDate ?? "Undated")} →{" "}
                    {String(r.values.endDate ?? "Undated")}
                  </span>
                </button>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = methods.values.planStartYear + i;
                  const touches =
                    r.values.startDate &&
                    r.values.endDate &&
                    String(r.values.startDate) <= `${year}-12-31` &&
                    String(r.values.endDate) >= `${year}-01-01`;
                  return (
                    <div key={year} className="min-h-12 rounded border p-2">
                      {touches ? String(r.values.status) : "—"}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {!rows.length && (
            <p className="mt-4 text-muted-foreground">
              No matching initiatives.
            </p>
          )}
        </section>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {[
                  "Title and planning scope",
                  "Owner / state",
                  "Capabilities and drivers",
                  "Planning flags",
                ].map((h) => (
                  <th className="px-4 py-2" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr className="border-b last:border-0" key={r.id}>
                  <td className="max-w-96 px-4 py-3 align-top">
                    <button
                      className="text-left font-medium text-link hover:underline"
                      onClick={() => edit(r)}
                    >
                      {String(r.values.title)}
                    </button>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {String(r.values.description)}
                    </p>
                    <details className="mt-2">
                      <summary>Details and relationships</summary>
                      <dl className="mt-2 space-y-1">
                        {Object.entries(r.values)
                          .filter(
                            ([k]) => !["title", "description"].includes(k),
                          )
                          .map(([key, value]) => (
                            <div key={key}>
                              <dt className="inline text-xs text-muted-foreground">
                                {key.replace(/([A-Z])/g, " $1")}:{" "}
                              </dt>
                              <dd className="inline text-xs">
                                {Array.isArray(value)
                                  ? value
                                      .map(
                                        (id) =>
                                          [
                                            ...data.options.positions,
                                            ...data.options.objectives,
                                            ...data.options.functions,
                                            ...data.options.requirements,
                                            ...data.rows.map((x) => ({
                                              id: x.id,
                                              label: String(x.values.title),
                                            })),
                                          ].find((o) => o.id === id)?.label ??
                                          id,
                                      )
                                      .join("; ")
                                  : value === null
                                    ? "Unknown"
                                    : String(value)}
                              </dd>
                            </div>
                          ))}
                      </dl>
                    </details>
                    {r.kind === "initiative" && (
                      <Uplifts
                        row={r}
                        data={data}
                        canEdit={canEdit}
                        onSaved={() => void refresh()}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {data.options.people.find((p) => p.id === r.values.ownerId)
                      ?.label ?? "Unassigned"}
                    <p className="text-xs text-muted-foreground">
                      {String(
                        r.values.status ??
                          r.values.state ??
                          (r.values.active ? "active" : "inactive"),
                      )}
                      {r.kind === "initiative"
                        ? ` · ${r.values.investmentState}`
                        : ""}
                    </p>
                  </td>
                  <td className="max-w-72 px-4 py-3 align-top">
                    <ul className="space-y-1">
                      {(r.values.capabilityIds as string[]).map((id) => (
                        <li key={id}>
                          <Link
                            className="text-xs text-link hover:underline"
                            href={link(`/capabilities?topic=${id}`)}
                          >
                            {data.options.capabilities.find((c) => c.id === id)
                              ?.label ?? id}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-xs">
                      {(r.values.requirementIds as string[]).length} requirement
                      drivers
                    </p>
                  </td>
                  <td className="max-w-64 px-4 py-3 align-top text-xs">
                    {alerts(r)}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="px-4 py-8 text-muted-foreground" colSpan={4}>
                    No matching {labels[kind].toLowerCase()}. Add a linked
                    planning record to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {kind === "technology" && (
        <section className="overflow-x-auto rounded border bg-card p-4">
          <h2>Investment alternative comparison</h2>
          <p className="text-xs">
            Compare optimization, expansion, consolidation, replacement,
            retirement, acquisition and managed services against existing
            coverage. Include the selected option once in a funding scenario;
            schedule baseline retirement separately to expose savings.
          </p>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-2">Option / decision</th>
                <th>Compared with</th>
                <th>Deployment / lifecycle</th>
                <th>Licensing / operating / implementation</th>
                <th>Planning rationale</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => r.kind === "technology")
                .map((r) => (
                  <tr className="border-t align-top" key={r.id}>
                    <th className="p-2 text-left font-normal">
                      {String(r.values.title)} �{" "}
                      {String(r.values.decision ?? "inventory")}
                    </th>
                    <td>
                      {(r.values.alternativeIds as string[] | undefined)
                        ?.map(
                          (id) =>
                            data.rows.find((t) => t.id === id)?.values.title ??
                            id,
                        )
                        .join("; ") || "No explicit comparison linked"}
                    </td>
                    <td>
                      {String(r.values.deploymentState ?? "unknown")} � renewal{" "}
                      {String(r.values.renewalDate ?? "unknown")} � retirement{" "}
                      {String(r.values.retirementDate ?? "not scheduled")}
                    </td>
                    <td>
                      {String(r.values.currency)}{" "}
                      {String(r.values.annualLicenseCost ?? "unknown")} /{" "}
                      {String(r.values.annualOperatingCost ?? "unknown")} /{" "}
                      {String(r.values.implementationCost ?? "unknown")}
                    </td>
                    <td>{String(r.values.alternatives)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}
      {kind === "technology" && (
        <section className="rounded-md border bg-card p-4">
          <h2>Existing coverage and overlap</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {data.options.capabilities
              .filter((c) => scopedCapIds.has(c.id))
              .map((c) => {
                const tools = scopedRows.filter(
                  (r) =>
                    r.kind === "technology" &&
                    r.values.state === "existing" &&
                    (r.values.capabilityIds as string[]).includes(c.id),
                );
                return (
                  <li key={c.id}>
                    {c.label}:{" "}
                    {tools.length
                      ? tools
                          .map(
                            (t) =>
                              `${t.values.title} (coverage ${t.values.coveragePercent ?? "unknown"}%, utilization ${t.values.utilizationPercent ?? "unknown"}%)`,
                          )
                          .join("; ")
                      : "No existing technology recorded"}
                    {tools.length > 1
                      ? " · Review overlap before acquisition"
                      : ""}
                  </li>
                );
              })}
          </ul>
        </section>
      )}
      {kind === "initiative" && (
        <p className="text-xs text-muted-foreground">
          Initiative costs cover additional work only. Linked personnel and
          technology costs belong to their own source records and must not be
          entered again here.
        </p>
      )}
      {draft && (
        <RecordEditor
          key={`${draft.kind}-${draft.id ?? "new"}`}
          draft={draft}
          fields={planningFields(draft.kind as PlanningKind, data)}
          title={`${draft.id ? "Edit" : "Add"} ${draft.kind}`}
          endpoint="/api/planning"
          readOnly={!canEdit}
          onClose={() => setDraft(null)}
          onSaved={() => void refresh()}
        >
          {draft.id && (
            <RecordHistory
              entityType={draft.kind === "issue" ? "planningIssue" : draft.kind}
              id={draft.id}
              endpoint={`/api/planning/${draft.id}/history`}
            />
          )}
        </RecordEditor>
      )}
    </fieldset>
  );
}
function Uplifts({
  row,
  data,
  canEdit,
  onSaved,
}: {
  row: PlanningRow;
  data: PlanningData;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <details className="mt-3">
      <summary>Capability-specific expected uplift</summary>
      {row.uplifts?.map((u) => (
        <form
          className="mt-2 space-y-2 rounded border p-2"
          key={u.capabilityId}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const form = new FormData(e.currentTarget);
            try {
              const r = await fetch(`/api/planning/${row.id}/uplift`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  capabilityId: u.capabilityId,
                  uplift: Number(form.get("uplift")),
                  rationale: String(form.get("rationale")),
                  revision: row.revision,
                }),
              });
              const p = await r.json();
              if (!r.ok) throw new Error(p.error?.message ?? "Save failed");
              onSaved();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Save failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="text-xs">
            {
              data.options.capabilities.find((c) => c.id === u.capabilityId)
                ?.label
            }
          </p>
          <label className="block text-xs">
            Expected uplift (levels)
            <input
              name="uplift"
              disabled={!canEdit || busy}
              required
              type="number"
              min={0}
              max={4}
              step={1}
              defaultValue={u.uplift}
              className="form-input mt-1"
            />
          </label>
          <label className="block text-xs">
            Uplift rationale
            <textarea
              name="rationale"
              disabled={!canEdit || busy}
              required
              maxLength={4000}
              defaultValue={u.rationale}
              className="form-input mt-1"
            />
          </label>
          {canEdit && (
            <Button type="submit" size="sm" disabled={busy}>
              Save uplift
            </Button>
          )}
        </form>
      ))}
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
