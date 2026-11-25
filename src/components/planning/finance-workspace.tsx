"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RecordEditor, type RecordDraft } from "./record-editor";
import { RecordHistory } from "./record-history";
import { financeFields, newFinanceDraft } from "./finance-fields";
import { useMethods } from "./method-provider";
import { useHistorical } from "./historical-provider";
import { useUrlFilters, useHydrated } from "@/components/use-url-filters";
import { downloadCsv } from "@/lib/domain/csv";
import {
  scenarioReport,
  type FinanceData,
  type FinanceKind,
  type FinanceRow,
  type CostLine,
} from "@/lib/domain/finance";
import type { PlanningData } from "@/lib/domain/planning";
import type { WorkforceData } from "@/lib/domain/workforce";
import type { CapabilityView } from "@/lib/domain/capabilities";
import type { AlignmentData } from "@/lib/domain/alignment";
const models = {
  scenario: "planningScenario",
  item: "scenarioItem",
  target: "annualCapabilityTarget",
  budget: "scenarioBudget",
  cost: "financialCost",
};
export function FinanceWorkspace({
  initial,
  planning,
  workforce,
  capabilities,
  alignment,
  canEdit,
}: {
  initial: FinanceData;
  planning: PlanningData;
  workforce: WorkforceData;
  capabilities: CapabilityView[];
  alignment: AlignmentData;
  canEdit: boolean;
}) {
  const [data, setData] = useState(initial);
  const [draft, setDraft] = useState<RecordDraft | null>(null);
  const [status, setStatus] = useState("");
  const router = useRouter();
  const methods = useMethods();
  const historical = useHistorical();
  const hydrated = useHydrated();
  const { params, setFilters } = useUrlFilters();
  const scenarios = data.rows.filter((r) => r.kind === "scenario");
  const selected =
    scenarios.find((r) => r.id === params.get("scenario")) ??
    scenarios.find((r) => r.values.active) ??
    scenarios[0];
  const compare = scenarios.find((r) => r.id === params.get("compare"));
  const query = (params.get("search") ?? "").toLowerCase();
  const view = params.get("view") ?? "plan";
  const report = selected
    ? scenarioReport(
        data,
        planning,
        workforce,
        capabilities,
        alignment,
        selected,
      )
    : null;
  const comparison = compare
    ? scenarioReport(
        data,
        planning,
        workforce,
        capabilities,
        alignment,
        compare,
      )
    : null;
  const rows = data.rows.filter(
    (r) =>
      r.kind !== "scenario" &&
      (r.kind === "cost" || r.values.scenarioId === selected?.id) &&
      `${r.values.title} ${r.values.source}`.toLowerCase().includes(query),
  );
  const edit = (r: FinanceRow) =>
    setDraft({
      kind: r.kind,
      id: r.id,
      revision: r.revision,
      values: r.values,
    });
  function editCost(line: CostLine) {
    const r = data.rows.find(
      (r) => r.kind === "cost" && r.values.identity === line.identity,
    );
    if (r) return edit(r);
    const { derived, ...values } = line;
    void derived;
    setDraft({ kind: "cost", values });
  }
  async function saved() {
    setDraft(null);
    try {
      const r = await fetch("/api/finance", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setData((await r.json()).data);
      setStatus(
        "Saved scenario planning record; shared baseline records are unchanged.",
      );
      router.refresh();
    } catch {
      setStatus("Saved. Reload to refresh this view.");
    }
  }
  function add(kind: FinanceKind) {
    const draft = newFinanceDraft(
      kind,
      report?.methods ?? methods,
      selected?.id ?? "",
    );
    if (report && ["target", "budget"].includes(kind))
      draft.values.year = report.scenario.startYear;
    setDraft(draft);
  }
  function exportPlan() {
    if (!report) return;
    downloadCsv(`five-year-plan-${selected.id}.csv`, [
      [
        "Scenario",
        report.scenario.title,
        "Currency",
        report.scenario.currency,
        "Method",
        report.methods.id,
        "Fiscal start",
        report.scenario.fiscalStartMonth,
      ],
      [
        "Year",
        "Detail",
        "Known baseline",
        "Known incremental",
        "Known total",
        "Budget",
        "Incomplete lines",
      ],
      ...report.annual.map((a) => [
        a.year,
        a.detail,
        a.baseline,
        a.incremental,
        a.total,
        a.budget,
        a.missing
          .map((m) => `${m.identity}: ${m.fields.join("; ")}`)
          .join(" | "),
      ]),
      [],
      ["Constraint", "Record", "Consequence"],
      ...report.constraints.map((c) => [c.type, c.recordId, c.message]),
      [],
      [
        "Cost identity",
        "Title",
        "Category",
        "Amount",
        "Frequency",
        "Currency",
        "Start",
        "End",
        "Source",
      ],
      ...report.lines.map((l) => [
        l.identity,
        l.title,
        l.category,
        l.amount,
        l.frequency,
        l.currency,
        l.startDate,
        l.endDate,
        l.source,
      ]),
    ]);
  }
  const link = (path: string) =>
    historical
      ? `${path}${path.includes("?") ? "&" : "?"}cycle=${historical.cycleId}`
      : path;
  return (
    <fieldset disabled={!hydrated} className="min-w-0 space-y-4">
      <p role="status" aria-live="polite">
        {status}
      </p>
      <div className="print-hidden flex flex-wrap items-end gap-3">
        <label>
          Scenario
          <select
            className="form-input"
            value={selected?.id ?? ""}
            onChange={(e) => setFilters({ scenario: e.target.value })}
          >
            <option value="">Select scenario</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {String(s.values.title)}
                {!s.values.active ? " (archived)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Compare with
          <select
            className="form-input"
            value={compare?.id ?? ""}
            onChange={(e) => setFilters({ compare: e.target.value })}
          >
            <option value="">None</option>
            {scenarios
              .filter((s) => s.id !== selected?.id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {String(s.values.title)}
                </option>
              ))}
          </select>
        </label>
        {canEdit && (
          <Button onClick={() => add("scenario")}>Add scenario</Button>
        )}
        {selected && (
          <Button variant="outline" onClick={() => edit(selected)}>
            Scenario assumptions
          </Button>
        )}
        <Button variant="outline" onClick={exportPlan} disabled={!report}>
          Export planning CSV
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print plan
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Enterprise financial scope · Five years with detailed years 1–3 and
        directional years 4–5. Scenario membership changes inclusion/timing
        only; assessed maturity and shared resource estimates stay unchanged.
        Unknown costs produce incomplete known subtotals, never an assumed zero.
        No automatic currency conversion or optimization.
      </p>
      {!report ? (
        <p className="rounded border bg-card p-5">
          Create an editable scenario for existing funding, minimum
          requirements, risk-prioritized investment, target maturity or
          alternative funding. Enter sourced budgets and shared resource
          inclusion; no funding is invented.
        </p>
      ) : (
        <>
          <section className="rounded border bg-card p-4">
            <h2>{report.scenario.title}</h2>
            <p>
              {report.scenario.kind} · {report.scenario.startYear}–
              {report.scenario.startYear + 4} · {report.scenario.currency} ·
              fiscal month {report.scenario.fiscalStartMonth}
            </p>
            <p className="text-xs">
              Assumption version {report.methods.id} ·{" "}
              {report.methods.provisional
                ? "Provisional"
                : "Organization approved"}{" "}
              · {report.methods.basis}
            </p>
            <p className="mt-2">
              Five-year{" "}
              {report.complete ? "total" : "known subtotal (incomplete)"}:{" "}
              {report.scenario.currency} {report.cumulative}. Remaining
              capability deficiencies: {report.remainingDeficiencies.length}.
            </p>
          </section>
          <div className="print-hidden flex gap-2">
            {["plan", "resources", "targets", "costs", "constraints"].map(
              (v) => (
                <Button
                  key={v}
                  variant={view === v ? "secondary" : "ghost"}
                  onClick={() => setFilters({ view: v })}
                >
                  {v[0].toUpperCase() + v.slice(1)}
                </Button>
              ),
            )}
            {canEdit && (
              <>
                <Button variant="outline" onClick={() => add("item")}>
                  Include / defer resource
                </Button>
                <Button variant="outline" onClick={() => add("target")}>
                  Add annual target
                </Button>
                <Button variant="outline" onClick={() => add("budget")}>
                  Set annual budget
                </Button>
                <Button variant="outline" onClick={() => add("cost")}>
                  Add distinct cost / savings
                </Button>
              </>
            )}
          </div>
          <section className="overflow-x-auto rounded border bg-card">
            <table className="w-full text-left text-sm">
              <caption className="p-3 text-left">
                Annual finances · Decimal arithmetic, calendar-month proration
                and anniversary escalation. Round each line annually to cents;
                totals reconcile to those displayed lines.
              </caption>
              <thead className="bg-muted">
                <tr>
                  <th className="p-3">Year</th>
                  <th>Baseline</th>
                  <th>Incremental / savings</th>
                  <th>Scenario total</th>
                  <th>Budget</th>
                  <th>Input status</th>
                  {comparison && (
                    <th>
                      {comparison.scenario.title} (
                      {comparison.scenario.currency})
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {report.annual.map((a, i) => (
                  <tr className="border-t" key={a.year}>
                    <th className="p-3">
                      {a.year} · {a.detail}
                    </th>
                    <td>{a.baseline}</td>
                    <td>{a.incremental}</td>
                    <td>{a.total}</td>
                    <td>
                      {a.budget ?? "Not supplied"}
                      {a.overBudget ? " · EXCEEDED" : ""}
                    </td>
                    <td>
                      {a.missing.length
                        ? `${a.missing.length} incomplete lines`
                        : "Complete inputs"}
                    </td>
                    {comparison && (
                      <td>
                        {comparison.annual[i].year}:{" "}
                        {comparison.annual[i].total}
                        {comparison.annual[i].missing.length
                          ? " · incomplete"
                          : ""}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {view === "costs" ? (
            <section className="overflow-x-auto rounded border bg-card">
              <h2 className="p-3">Unique cost identities</h2>
              <p className="px-3 text-xs">
                Primary lines derive from shared positions, technology and
                initiatives. Financial overrides replace that identity once;
                they do not duplicate the underlying amount. Additional lines
                require a distinct sourced identity. Unselected proposals are
                shown for review and excluded from totals.
              </p>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-3">Identity / source</th>
                    <th>Amount</th>
                    <th>Timing / baseline</th>
                    {report.annual.map((a) => (
                      <th key={a.year}>{a.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.lines
                    .filter((l) =>
                      `${l.title} ${l.identity}`.toLowerCase().includes(query),
                    )
                    .map((l) => (
                      <tr key={l.identity} className="border-t align-top">
                        <td className="max-w-sm p-3">
                          <button
                            className="text-left text-link underline"
                            onClick={() => editCost(l)}
                          >
                            {l.title}
                          </button>
                          <p className="break-all text-xs">
                            {l.identity} ·{" "}
                            {l.derived
                              ? "Shared resource estimate"
                              : "Financial override / distinct line"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {l.source}
                          </p>
                        </td>
                        <td>
                          {l.amount ?? "Unknown"} {l.currency} / {l.frequency}
                          {l.saving ? " savings" : ""}
                        </td>
                        <td>
                          {l.startDate ?? "Unscheduled"} →{" "}
                          {l.endDate ?? "ongoing"} ·{" "}
                          {l.baseline ? "Baseline" : "Incremental"}
                        </td>
                        {report.annual.map((a) => {
                          const d = a.details.find(
                            (d) => d.identity === l.identity,
                          );
                          return (
                            <td key={a.year}>
                              {d ? (d.total ?? "Incomplete") : "Not included"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          ) : view === "constraints" ? (
            <section className="rounded border bg-card p-4">
              <h2>
                Infeasibility, incomplete inputs and unfunded requirements
              </h2>
              <p className="text-xs">
                Constraints remain explicit; funding limits do not silently
                remove mandatory requirements or dependencies.
              </p>
              <ul className="mt-3 space-y-2">
                {report.constraints.map((c, i) => (
                  <li key={`${c.type}-${c.recordId}-${i}`}>
                    <strong>{c.type}</strong>: {c.message}
                  </li>
                ))}
              </ul>
              {report.annual.map(
                (a) =>
                  a.missing.length > 0 && (
                    <details className="mt-3" key={a.year}>
                      <summary>{a.year} missing cost inputs</summary>
                      {a.missing.map((m) => (
                        <p className="text-sm" key={m.identity}>
                          {m.title} ({m.identity}): {m.fields.join(", ")}
                        </p>
                      ))}
                    </details>
                  ),
              )}
            </section>
          ) : view === "resources" ? (
            <section className="rounded border bg-card p-4">
              <h2>Scenario inclusion and timing</h2>
              {rows
                .filter((r) => r.kind === "item")
                .map((r) => (
                  <div className="mt-3 border-t pt-3" key={r.id}>
                    <button
                      className="text-link underline"
                      onClick={() => edit(r)}
                    >
                      {String(r.values.title)}
                    </button>
                    <p className="text-sm">
                      {r.values.included ? "Included" : "Excluded / deferred"} ·{" "}
                      {String(r.values.startDate ?? "shared activation date")} →{" "}
                      {String(r.values.endDate ?? "shared end / ongoing")} ·
                      Consequence: {String(r.values.deferral)}
                    </p>
                  </div>
                ))}
              <h3 className="mt-5">Shared initiative schedule</h3>
              {report.planningRows
                .filter((r) => r.kind === "initiative")
                .map((r) => (
                  <p className="mt-2 text-sm" key={r.id}>
                    <Link
                      className="text-link underline"
                      href={link(
                        `/roadmap?search=${encodeURIComponent(String(r.values.title))}`,
                      )}
                    >
                      {String(r.values.title)}
                    </Link>{" "}
                    · {String(r.values.investmentState)} /{" "}
                    {String(r.values.status)} ·{" "}
                    {String(r.values.startDate ?? "undated")} →{" "}
                    {String(r.values.endDate ?? "undated")}
                  </p>
                ))}
            </section>
          ) : (
            <section className="overflow-x-auto rounded border bg-card">
              <h2 className="p-3">
                Annual capability targets and projected deficiencies
              </h2>
              <p className="px-3 text-xs">
                Actual observations never change from initiative completion.
                Projection uses the strongest uplift eligible under the scenario
                method version, capped at{" "}
                {report.methods.values.projectionCap ?? 5}; unknown actual
                maturity remains unknown.
              </p>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-3">Capability / actual</th>
                    {report.annual.map((a) => (
                      <th key={a.year}>{a.year} projected → target</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {capabilities
                    .filter(
                      (c) =>
                        c.applicable &&
                        `${c.code} ${c.name}`.toLowerCase().includes(query),
                    )
                    .map((c) => (
                      <tr className="border-t" key={c.id}>
                        <th className="max-w-sm p-3 font-normal">
                          <Link
                            className="text-link underline"
                            href={link(`/capabilities?topic=${c.id}`)}
                          >
                            {c.code} · {c.name}
                          </Link>{" "}
                          · {c.currentLevel ?? "unknown"}
                        </th>
                        {report.annual.map((a) => {
                          const g = a.gaps.find((g) => g.id === c.id)!;
                          const t = rows.find(
                            (r) =>
                              r.kind === "target" &&
                              r.values.capabilityId === c.id &&
                              r.values.year === a.year,
                          );
                          return (
                            <td key={a.year}>
                              {t ? (
                                <button
                                  className="text-link underline"
                                  onClick={() => edit(t)}
                                >
                                  {g.projected ?? "?"} → {g.target ?? "?"}
                                </button>
                              ) : (
                                <span>
                                  {g.projected ?? "?"} → {g.target ?? "?"}
                                </span>
                              )}
                              {g.target !== null &&
                              (g.projected === null || g.projected < g.target)
                                ? " · gap"
                                : ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          )}
          {view !== "constraints" && report.constraints.length > 0 && (
            <p className="rounded border border-status-warn p-3">
              {report.constraints.length} constraints / missing-input warnings.
              Open Constraints to review dependency, deadline, funding and
              completeness problems.
            </p>
          )}
          <label className="print-hidden block max-w-sm">
            Filter displayed records
            <input
              className="form-input"
              value={query}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </label>
          <details className="rounded border bg-card p-3">
            <summary>
              Saved annual budgets, targets and financial records
            </summary>
            {rows
              .filter((r) => r.kind !== "item")
              .map((r) => (
                <p className="mt-2 text-sm" key={r.id}>
                  <button
                    className="text-link underline"
                    onClick={() => edit(r)}
                  >
                    {r.kind} · {String(r.values.title)}
                  </button>
                </p>
              ))}
          </details>
        </>
      )}
      {draft && (
        <RecordEditor
          key={draft.id ?? draft.kind}
          draft={draft}
          fields={financeFields(
            draft.kind as FinanceKind,
            data,
            planning,
            workforce,
          )}
          title={`${draft.id ? "Edit" : "Add"} ${draft.kind}`}
          endpoint="/api/finance"
          readOnly={!canEdit}
          onClose={() => setDraft(null)}
          onSaved={() => void saved()}
        >
          {draft.id && (
            <RecordHistory
              entityType={models[draft.kind as FinanceKind]}
              id={draft.id}
              endpoint={`/api/finance/${draft.id}/history`}
            />
          )}
        </RecordEditor>
      )}
    </fieldset>
  );
}
