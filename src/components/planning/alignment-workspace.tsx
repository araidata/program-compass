"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecordHistory } from "./record-history";
import { Button } from "@/components/ui/button";
import { RecordEditor, type FieldSpec } from "./record-editor";
import { useMethods } from "./method-provider";
import { useHistorical } from "./historical-provider";
import { useUrlFilters, useHydrated } from "@/components/use-url-filters";
import { useScope } from "@/components/use-scope";
import { withScope, withCycle } from "@/lib/pillars";
import { downloadCsv } from "@/lib/domain/csv";
import {
  alignmentSummary,
  requirementCoverage,
  type AlignmentData,
  type RequirementView,
} from "@/lib/domain/alignment";
import { projectedLevel, type PlanningData } from "@/lib/domain/planning";
import type { CapabilityView } from "@/lib/domain/capabilities";
export type AlignmentTrend = {
  id: string;
  name: string;
  at: string;
  frameworkId: string;
  method: string;
  coverage: number | null;
  covered: number;
  applicable: number;
  unknown: number;
};
export function AlignmentWorkspace({
  initial,
  capabilities,
  planning,
  canEdit,
  trends,
}: {
  initial: AlignmentData;
  capabilities: CapabilityView[];
  planning: PlanningData | null;
  canEdit: boolean;
  trends: AlignmentTrend[];
}) {
  const [data, setData] = useState(initial);
  const [selected, setSelected] = useState<RequirementView | null>(null);
  const [status, setStatus] = useState("");
  const methods = useMethods();
  const historical = useHistorical();
  const router = useRouter();
  const scope = useScope();
  const { params, setFilters } = useUrlFilters();
  const hydrated = useHydrated();
  const framework =
    data.frameworks.find((f) => f.id === params.get("framework")) ??
    data.frameworks.find((f) => f.key === "nist-csf") ??
    data.frameworks[0];
  const view = params.get("view") ?? "requirements";
  const group = params.get("group") ?? "";
  const query = (params.get("search") ?? "").toLowerCase();
  const filter = params.get("status") ?? "";
  const date =
    params.get("asOf") ?? `${methods.values.planStartYear + 4}-12-31`;
  const frameworkRows = data.requirements.filter(
    (r) => r.frameworkId === framework?.id,
  );
  const parents = new Set(frameworkRows.map((r) => r.parentId).filter(Boolean));
  function under(r: RequirementView, id: string) {
    const seen = new Set<string>();
    let current: RequirementView | undefined = r;
    while (current) {
      if (current.id === id) return true;
      if (seen.has(current.id)) break;
      seen.add(current.id);
      current = frameworkRows.find((p) => p.id === current?.parentId);
    }
    return false;
  }
  const scopedCaps = scope
    ? capabilities.filter((c) => c.pillarKeys.includes(scope.id))
    : capabilities;
  const rows = frameworkRows.filter(
    (r) =>
      (!group || under(r, group)) &&
      (!query ||
        `${r.identifier} ${r.title} ${r.description}`
          .toLowerCase()
          .includes(query)) &&
      (!scope ||
        r.values.capabilityIds.some((id) =>
          scopedCaps.some((c) => c.id === id),
        )) &&
      (!filter ||
        requirementCoverage(r, capabilities, methods.values.coverageThreshold)
          .status === filter),
  );
  const selectedData = {
    ...data,
    requirements: scope
      ? data.requirements.filter((r) =>
          r.values.capabilityIds.some((id) =>
            scopedCaps.some((c) => c.id === id),
          ),
        )
      : data.requirements,
  };
  const summary = alignmentSummary(
    selectedData,
    capabilities,
    methods,
    framework?.id ?? "",
    data.requirements,
  );
  const projected = capabilities.map((c) => ({
    ...c,
    currentLevel: projectedLevel(
      c.currentLevel,
      planning?.rows ?? [],
      c.id,
      date,
      methods.values,
    ),
  }));
  const projection = alignmentSummary(
    selectedData,
    projected,
    methods,
    framework?.id ?? "",
    data.requirements,
  );
  const fields: FieldSpec[] = [
    {
      key: "applicability",
      label: "Organization applicability",
      type: "select",
      required: true,
      options: ["unknown", "applicable", "not-applicable"].map((id) => ({
        id,
        label: id,
      })),
    },
    {
      key: "implementation",
      label: "Observed implementation state",
      type: "select",
      required: true,
      options: [
        "unassessed",
        "not-started",
        "planned",
        "in-progress",
        "implemented",
      ].map((id) => ({ id, label: id })),
    },
    {
      key: "currentLevel",
      label: "Requirement-specific current maturity",
      type: "number",
      min: 1,
      max: 5,
    },
    {
      key: "targetLevel",
      label: "Requirement-specific target maturity",
      type: "number",
      min: 1,
      max: 5,
    },
    {
      key: "ownerId",
      label: "Requirement owner",
      type: "select",
      options: data.people,
    },
    {
      key: "applicableDeadline",
      label: "Applicable organizational deadline",
      type: "date",
    },
    {
      key: "notes",
      label: "Observations and assessment notes",
      type: "textarea",
    },
    {
      key: "capabilityIds",
      label: "Shared mapped capabilities",
      type: "multi",
      options: capabilities.map((c) => ({
        id: c.id,
        label: `${c.code} · ${c.name}`,
      })),
    },
    {
      key: "mappingRationale",
      label: "Mapping rationale and provenance",
      type: "textarea",
    },
    {
      key: "reviewed",
      label:
        "Organization reviewed these mappings (not compliance verification)",
      type: "checkbox",
    },
  ];
  const link = (href: string) =>
    withCycle(withScope(href, scope), historical?.cycleId ?? null);
  async function saved() {
    setSelected(null);
    setStatus(
      "Saved requirement assessment and mappings. Shared capability maturity is unchanged.",
    );
    try {
      const r = await fetch("/api/alignment", { cache: "no-store" });
      const p = await r.json();
      if (!r.ok) throw new Error();
      setData(p.data);
      router.refresh();
    } catch {
      setStatus("Saved. Reload to refresh the workspace.");
    }
  }
  function exportRows() {
    downloadCsv(`alignment-${framework?.key ?? "framework"}.csv`, [
      [
        "Framework",
        "Version",
        "Identifier",
        "Title",
        "Applicability",
        "Implementation",
        "Requirement current",
        "Requirement target",
        "Mapped minimum",
        "Mapped mean",
        "Indicative coverage",
        "Capability IDs",
        "Mapping reviewed",
        "Deadline",
        "Notes",
        "Source",
        "Scope",
        "Method version",
      ],
      ...rows.map((r) => {
        const m = requirementCoverage(
          r,
          capabilities,
          methods.values.coverageThreshold,
        );
        return [
          framework?.name,
          framework?.version,
          r.identifier,
          r.title,
          r.values.applicability,
          r.values.implementation,
          r.values.currentLevel,
          r.values.targetLevel,
          m.min,
          m.mean,
          m.status,
          r.values.capabilityIds.join(";"),
          r.values.reviewed,
          r.values.applicableDeadline,
          r.values.notes,
          r.sourceUrl,
          scope?.name ?? "Enterprise",
          methods.id,
        ];
      }),
    ]);
  }
  return (
    <fieldset
      disabled={!hydrated}
      className="min-w-0 space-y-4"
      aria-label="Framework alignment workspace"
    >
      <p className="rounded-md border bg-card p-3 text-sm">
        Maturity-based coverage and implementation observations support
        planning. They do not establish verified regulatory compliance.
        Requirement scores and shared capability scores are separate.
      </p>
      <div className="print-hidden flex flex-wrap items-center gap-3">
        <label>
          Framework
          <select
            className="form-input ml-2 w-80"
            value={framework?.id ?? ""}
            onChange={(e) =>
              setFilters({ framework: e.target.value, group: "", status: "" })
            }
          >
            {data.frameworks.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} {f.version}
              </option>
            ))}
          </select>
        </label>
        <Button variant="outline" onClick={exportRows}>
          Export CSV
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {[
          ["Applicable leaf requirements", summary.applicable],
          [
            "Indicative coverage",
            summary.coverage === null
              ? "Unknown"
              : `${summary.coverage.toFixed(0)}%`,
          ],
          ["Unknown applicability", summary.unknown],
          ["Not applicable", summary.notApplicable],
          ["Unmapped applicable", summary.unmapped],
          [
            "Implementation observed",
            `${summary.implemented}/${summary.applicable}`,
          ],
        ].map(([label, value]) => (
          <div className="rounded-md border bg-card p-3" key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Coverage denominator: applicable leaf requirements; unknown
        applicability is reported separately. Unmapped/unassessed applicable
        requirements remain uncovered. Threshold{" "}
        {methods.values.coverageThreshold}; method {methods.id}
        {methods.provisional ? " · provisional" : ""}. Draft mappings do not
        contribute.{" "}
        {scope
          ? "Pillar scope includes requirements mapped to this pillar; unmapped requirements are visible in Enterprise scope."
          : "Enterprise scope includes all reference requirements."}
      </p>
      <div className="print-hidden flex gap-2 border-b pb-2">
        {["requirements", "analysis", "trends", "projections"].map((v) => (
          <Button
            key={v}
            variant={view === v ? "secondary" : "ghost"}
            onClick={() => setFilters({ view: v })}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </Button>
        ))}
      </div>
      <div className="print-hidden flex flex-wrap gap-3">
        <label>
          Search
          <input
            className="form-input ml-2 w-60"
            value={params.get("search") ?? ""}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </label>
        <label>
          Hierarchy
          <select
            className="form-input ml-2 w-72"
            value={group}
            onChange={(e) => setFilters({ group: e.target.value })}
          >
            <option value="">All functions/categories</option>
            {frameworkRows
              .filter((r) => parents.has(r.id))
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.identifier} · {r.title}
                </option>
              ))}
          </select>
        </label>
        <label>
          Coverage status
          <select
            className="form-input ml-2 w-52"
            value={filter}
            onChange={(e) => setFilters({ status: e.target.value })}
          >
            <option value="">All</option>
            {[
              "Unknown applicability",
              "Not applicable",
              "Unmapped",
              "Incomplete",
              "Covered (indicative)",
              "Partly covered",
              "Gap",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <p role="status">{status}</p>
      <p className="print-only text-xs">
        {framework?.name} {framework?.version} · {scope?.name ?? "Enterprise"} ·
        method {methods.id}
      </p>
      {view === "trends" ? (
        <section className="rounded-md border bg-card p-4">
          <h2>Captured-cycle alignment trends</h2>
          <p className="my-2 text-xs text-muted-foreground">
            Latest 30 captured cycles. Each uses its captured applicability,
            mappings, capability observations and threshold; method changes are
            disclosed, never interpolated.
          </p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {[
                  "Cycle",
                  "Captured",
                  "Method",
                  "Covered/applicable",
                  "Coverage",
                  "Unknown applicability",
                ].map((h) => (
                  <th className="p-2" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trends
                .filter((t) => t.frameworkId === framework?.id)
                .map((t) => (
                  <tr className="border-t" key={t.id}>
                    <td className="p-2">
                      <Link
                        className="text-link hover:underline"
                        href={withScope(
                          `/compliance?cycle=${t.id}&framework=${framework?.id}&view=analysis`,
                          scope,
                        )}
                      >
                        {t.name}
                      </Link>
                    </td>
                    <td>{t.at.slice(0, 10)}</td>
                    <td>{t.method}</td>
                    <td>
                      {t.covered}/{t.applicable}
                    </td>
                    <td>
                      {t.coverage === null
                        ? "Unknown"
                        : `${t.coverage.toFixed(0)}%`}
                    </td>
                    <td>{t.unknown}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!trends.some((t) => t.frameworkId === framework?.id) && (
            <p className="mt-3 text-muted-foreground">
              No framework assessments captured yet. Legacy capability-only
              cycles cannot supply framework trends.
            </p>
          )}
        </section>
      ) : view === "projections" ? (
        <section className="space-y-3 rounded-md border bg-card p-4">
          <h2>Indicative future-state alignment</h2>
          <label>
            Projection as of
            <input
              type="date"
              className="form-input ml-2 w-48"
              value={date}
              onChange={(e) => setFilters({ asOf: e.target.value })}
            />
          </label>
          <p>
            Actual indicative coverage:{" "}
            {summary.coverage === null
              ? "Unknown"
              : `${summary.coverage.toFixed(0)}%`}{" "}
            · Projected:{" "}
            {projection.coverage === null
              ? "Unknown"
              : `${projection.coverage.toFixed(0)}%`}
          </p>
          <p className="text-xs text-muted-foreground">
            Initiatives eligible under the captured method version and finishing
            by this date contribute their strongest capability-specific uplift,
            capped by the configured limit, up to level 5. Unknown scores stay
            unknown. Requirement-specific current scores and implementation
            observations are never changed by projections.
          </p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-2">Requirement</th>
                <th>Actual mapped minimum</th>
                <th>Projected mapped minimum</th>
                <th>Projected coverage</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => !parents.has(r.id))
                .map((r) => {
                  const actual = requirementCoverage(
                    r,
                    capabilities,
                    methods.values.coverageThreshold,
                  );
                  const future = requirementCoverage(
                    r,
                    projected,
                    methods.values.coverageThreshold,
                  );
                  return (
                    <tr className="border-t" key={r.id}>
                      <th className="p-2 text-left font-normal">
                        {r.identifier}
                      </th>
                      <td>{actual.min ?? "Unknown"}</td>
                      <td>{future.min ?? "Unknown"}</td>
                      <td>{future.status}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      ) : view === "analysis" ? (
        <section className="space-y-4">
          <h2>Function/category maturity and coverage heatmap</h2>
          <div className="overflow-x-auto rounded-md border bg-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {[
                    "Group",
                    "Unique mapped capabilities",
                    "Current mean",
                    "Target mean",
                    "Applicable leaves",
                    "Covered leaves",
                  ].map((h) => (
                    <th className="p-2" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {frameworkRows
                  .filter((r) => parents.has(r.id))
                  .map((g) => {
                    const descendants = frameworkRows.filter((r) =>
                      under(r, g.id),
                    );
                    const ids = new Set(
                      descendants
                        .filter(
                          (r) =>
                            r.values.applicability === "applicable" &&
                            r.values.reviewed,
                        )
                        .flatMap((r) => r.values.capabilityIds),
                    );
                    const unique = scopedCaps.filter(
                      (c) => ids.has(c.id) && c.applicable,
                    );
                    const current = unique.filter(
                      (c) => c.currentLevel !== null,
                    );
                    const target = unique.filter((c) => c.targetLevel !== null);
                    const leaves = descendants.filter(
                      (r) =>
                        !parents.has(r.id) &&
                        r.values.applicability === "applicable",
                    );
                    return (
                      <tr className="border-t" key={g.id}>
                        <th className="p-2 text-left font-normal">
                          <button
                            className="text-link hover:underline"
                            onClick={() =>
                              setFilters({ group: g.id, view: "requirements" })
                            }
                          >
                            {g.identifier} · {g.title}
                          </button>
                        </th>
                        <td>{unique.length}</td>
                        <td>
                          {current.length
                            ? (
                                current.reduce(
                                  (s, c) => s + c.currentLevel!,
                                  0,
                                ) / current.length
                              ).toFixed(1)
                            : "Unknown"}
                        </td>
                        <td>
                          {target.length
                            ? (
                                target.reduce((s, c) => s + c.targetLevel!, 0) /
                                target.length
                              ).toFixed(1)
                            : "Unknown"}
                        </td>
                        <td>{leaves.length}</td>
                        <td>
                          {
                            leaves.filter(
                              (r) =>
                                requirementCoverage(
                                  r,
                                  capabilities,
                                  methods.values.coverageThreshold,
                                ).status === "Covered (indicative)",
                            ).length
                          }
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {rows
              .filter((r) => !parents.has(r.id))
              .map((r) => {
                const m = requirementCoverage(
                  r,
                  capabilities,
                  methods.values.coverageThreshold,
                );
                const color =
                  m.status === "Covered (indicative)"
                    ? "bg-status-good/10"
                    : m.status === "Gap"
                      ? "bg-status-bad/10"
                      : m.status === "Partly covered"
                        ? "bg-status-warn/10"
                        : "bg-muted";
                return (
                  <button
                    key={r.id}
                    className={`rounded-md border p-3 text-left ${color}`}
                    onClick={() => setSelected(r)}
                  >
                    <span className="block text-sm font-medium">
                      {r.identifier}
                    </span>
                    <span className="text-xs">
                      {m.status} · min {m.min ?? "unknown"}
                    </span>
                  </button>
                );
              })}
          </div>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {[
                  "Requirement and official reference",
                  "Organization observations",
                  "Shared capability alignment",
                  "Resources and initiative traces",
                ].map((h) => (
                  <th className="px-4 py-2" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = requirementCoverage(
                  r,
                  capabilities,
                  methods.values.coverageThreshold,
                );
                const traces =
                  planning?.rows.filter((p) =>
                    (p.values.requirementIds as string[]).includes(r.id),
                  ) ?? [];
                return (
                  <tr className="border-t" key={r.id}>
                    <td className="max-w-xl px-4 py-3 align-top">
                      <button
                        className="text-left font-medium text-link hover:underline"
                        onClick={() => setSelected(r)}
                      >
                        {r.identifier} · {r.title}
                      </button>
                      <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                        {r.description}
                      </p>
                      {r.sourceUrl && (
                        <a
                          className="text-xs text-link hover:underline"
                          href={r.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Official source
                          {r.sourcePage ? ` · PDF page ${r.sourcePage}` : ""}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-xs">
                      <p>
                        {r.values.applicability} · {r.values.implementation}
                      </p>
                      <p>
                        Requirement maturity{" "}
                        {r.values.currentLevel ?? "Unknown"} →{" "}
                        {r.values.targetLevel ?? "Unknown"}
                      </p>
                      <p>
                        Deadline:{" "}
                        {r.values.applicableDeadline ??
                          r.sourceDeadline ??
                          "Not recorded"}
                      </p>
                      <p>
                        {data.people.find((p) => p.id === r.values.ownerId)
                          ?.label ?? "Unassigned owner"}
                      </p>
                    </td>
                    <td className="max-w-64 px-4 py-3 align-top text-xs">
                      <p>
                        {m.status} · min {m.min ?? "Unknown"} · mean{" "}
                        {m.mean?.toFixed(1) ?? "Unknown"}
                      </p>
                      <p>
                        {r.values.reviewed
                          ? "Organization-reviewed mappings"
                          : "Draft/unreviewed mappings"}
                      </p>
                      <ul>
                        {r.values.capabilityIds.map((id) => {
                          const c = capabilities.find((c) => c.id === id);
                          return (
                            <li key={id}>
                              <Link
                                className="text-link hover:underline"
                                href={link(`/capabilities?topic=${id}`)}
                              >
                                {c?.code} · {c?.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </td>
                    <td className="max-w-64 px-4 py-3 align-top text-xs">
                      <Link
                        href={link(`/workforce/planning?requirement=${r.id}`)}
                        className="mb-2 block text-link underline"
                      >
                        Workload / workforce drivers
                      </Link>
                      {traces.length
                        ? traces.map((t) => (
                            <p key={t.id}>
                              <Link
                                className="text-link hover:underline"
                                href={link(
                                  `${t.kind === "initiative" ? "/roadmap" : t.kind === "technology" ? "/technology" : "/capabilities/planning"}?view=${t.kind}&search=${encodeURIComponent(String(t.values.title))}`,
                                )}
                              >
                                {String(t.values.title)} · {t.kind}
                              </Link>
                            </p>
                          ))
                        : "No linked resource/initiative recorded"}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={4} className="p-6 text-muted-foreground">
                    No matching requirements. Clear filters or select Enterprise
                    to inspect unmapped requirements.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <RecordEditor
          key={selected.id}
          draft={{
            kind: "assessment",
            id: selected.id,
            revision: selected.revision,
            values: { ...selected.values },
          }}
          fields={fields}
          title={`${selected.identifier} · Requirement assessment and mapping`}
          endpoint="/api/alignment"
          readOnly={!canEdit}
          onClose={() => setSelected(null)}
          onSaved={() => void saved()}
        >
          <details className="rounded border p-2 text-sm">
            <summary>Official requirement text and provenance</summary>
            <p className="mt-2 whitespace-pre-wrap">{selected.description}</p>
            <p className="mt-2 text-xs">
              Reference source is immutable; organizational applicability,
              observations and mappings are maintained separately.
            </p>
            {selected.sourceUrl && (
              <a
                className="text-link hover:underline"
                href={selected.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open official source
              </a>
            )}
          </details>
          <RecordHistory
            entityType="RequirementAssessment"
            id={selected.id}
            endpoint={`/api/alignment/${selected.id}/history`}
          />
        </RecordEditor>
      )}
    </fieldset>
  );
}
