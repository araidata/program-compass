"use client";
import { useScope } from "@/components/use-scope";
import { useUrlFilters, useHydrated } from "@/components/use-url-filters";
import { Button } from "@/components/ui/button";
import { ScopedLink } from "@/components/scoped-link";
import {
  buildReport,
  cellText,
  type ReportSection,
} from "@/lib/domain/reports";
import { downloadCsv } from "@/lib/domain/csv";
import type { SnapshotDataset } from "@/lib/server/snapshots";
function ReportTable({ section }: { section: ReportSection }) {
  return (
    <section
      id={`report-${section.id}`}
      className="report-section overflow-x-auto rounded border bg-card p-4"
    >
      <h2 className="report-heading">{section.title}</h2>
      <p className="mb-3 mt-1 text-xs text-muted-foreground">{section.note}</p>
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            {section.columns.map((c) => (
              <th className="border-b p-2 align-bottom" key={c}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.rows.map((row, i) => (
            <tr className="border-b align-top last:border-b-0" key={i}>
              {row.map((cell, k) => (
                <td className="p-2 whitespace-pre-wrap break-words" key={k}>
                  {typeof cell === "object" && cell !== null ? (
                    <ScopedLink
                      className="text-link underline"
                      href={cell.href}
                    >
                      {cell.label}
                    </ScopedLink>
                  ) : (
                    cellText(cell)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {section.rows.length === 0 && (
        <p className="mt-3 text-sm">
          No records in this scope/filter. This does not establish that
          requirements are satisfied.
        </p>
      )}
    </section>
  );
}
export function ReportsWorkspace({ data }: { data: SnapshotDataset }) {
  const scope = useScope();
  const hydrated = useHydrated();
  const { params, setFilters } = useUrlFilters();
  const pack = params.get("pack") === "management" ? "management" : "executive";
  const year = Number(params.get("year") ?? data.methods.values.planStartYear);
  const safeYear =
    Number.isInteger(year) && year >= 2000 && year <= 2200
      ? year
      : data.methods.values.planStartYear;
  const scenarios =
    data.finance?.rows.filter((r) => r.kind === "scenario") ?? [];
  const scenarioId =
    params.get("scenario") === "none"
      ? null
      : (params.get("scenario") ??
        scenarios.find((r) => r.values.active)?.id ??
        null);
  const report = buildReport(data, {
    scope: scope?.id ?? null,
    pack,
    year: safeYear,
    scenarioId,
  });
  const query = (params.get("search") ?? "").toLowerCase();
  const sections = query
    ? report.sections.map((s) => ({
        ...s,
        rows: s.rows.filter((r) =>
          r.some((c) => cellText(c).toLowerCase().includes(query)),
        ),
      }))
    : report.sections;
  function exportPack() {
    downloadCsv(`program-compass-${pack}-${safeYear}.csv`, [
      [
        "Pack",
        pack,
        "Scope",
        scope?.id ?? "Enterprise",
        "Year",
        safeYear,
        "Captured / generated",
        data.capturedAt,
        "Method",
        data.methods.id,
        "Filter",
        query,
      ],
      ...sections.flatMap((s) => [
        [s.title],
        [s.note],
        s.columns,
        ...s.rows.map((r) => r.map(cellText)),
        [],
      ]),
    ]);
  }
  return (
    <div className="space-y-4">
      <fieldset
        disabled={!hydrated}
        className="print-hidden min-w-0 flex flex-wrap items-end gap-3"
      >
        <label>
          Leadership pack
          <select
            className="form-input"
            value={pack}
            onChange={(e) => setFilters({ pack: e.target.value })}
          >
            <option value="executive">Executive</option>
            <option value="management">Management</option>
          </select>
        </label>
        <label>
          Planning year
          <input
            className="form-input"
            type="number"
            min="2000"
            max="2200"
            value={safeYear}
            onChange={(e) => setFilters({ year: e.target.value })}
          />
        </label>
        <label>
          Funding scenario
          <select
            className="form-input"
            value={scenarioId ?? "none"}
            onChange={(e) => setFilters({ scenario: e.target.value })}
          >
            <option value="none">No selected scenario</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {String(s.values.title)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Filter detail rows
          <input
            className="form-input"
            value={query}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </label>
        <Button variant="outline" onClick={exportPack}>
          Export report CSV
        </Button>
        <Button onClick={() => window.print()}>Print leadership pack</Button>
      </fieldset>
      <div className="rounded border bg-card p-4">
        <h2>
          {pack === "executive" ? "Executive" : "Management"} leadership
          planning pack
        </h2>
        <p>
          {scope?.name ?? "Enterprise"} · Year {safeYear} · Generated / captured{" "}
          {data.capturedAt} UTC · Method {data.methods.id}
        </p>
        <p className="mt-2 text-xs">
          Filter: {query || "All detail rows"}. Summary totals cover the
          selected pillar/Enterprise; text search filters detail rows only.
          Financial sections retain Enterprise costs. Source links lead to the
          same cycle when one is selected. Missing historical modules are
          disclosed.
        </p>
        {!scenarioId && (
          <p className="mt-2">
            No scenario selected. Configure a funding scenario to include
            reconciled financial constraints and projected deficiencies.
          </p>
        )}
        {Object.entries(report.completeModules)
          .filter(([, present]) => !present)
          .map(([name]) => (
            <p key={name} className="mt-1">
              Module absent from this capture: {name}. Current-day data was not
              substituted.
            </p>
          ))}
      </div>
      <nav
        aria-label="Report sections"
        className="print-hidden flex flex-wrap gap-3 text-sm"
      >
        {sections.map((s) => (
          <a
            className="text-link underline"
            key={s.id}
            href={`#report-${s.id}`}
          >
            {s.title}
          </a>
        ))}
      </nav>
      {sections.map((s) => (
        <ReportTable section={s} key={s.id} />
      ))}
      <p className="text-xs">
        Program Compass strategic planning · {data.capturedAt} · {pack} pack ·{" "}
        {scope?.name ?? "Enterprise"}. Source observations, estimates, dates and
        unknowns retain their distinct meaning.
      </p>
    </div>
  );
}
