"use client";
import { useMethods } from "@/components/planning/method-provider";
import { ScopedLink } from "@/components/scoped-link";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUrlFilters, useHydrated } from "@/components/use-url-filters";
import {
  RecordEditor,
  type RecordDraft,
  type FieldSpec,
} from "@/components/planning/record-editor";
import { Button } from "@/components/ui/button";
import { useScope } from "@/components/use-scope";
import { withScope } from "@/lib/pillars";
import {
  readiness,
  objectiveCapabilities,
  type ContextData,
  type Objective,
  type Threat,
} from "@/lib/domain/context";
import type { CapabilityView } from "@/lib/domain/capabilities";
import { downloadCsv as saveCsv } from "@/lib/domain/csv";

const profileLabels = {
  mission: "Mission",
  sector: "Sector",
  criticalServices: "Critical services",
  dependencies: "Critical dependencies",
  publicSafetyImpact: "Public safety and operational consequences",
  regulatoryDrivers: "Regulatory and business drivers",
  complexityNotes: "Complexity and growth assumptions",
};
export function ContextWorkspace({
  initial,
  capabilities,
  canEdit,
  synthetic,
}: {
  initial: ContextData;
  capabilities: CapabilityView[];
  canEdit: boolean;
  synthetic: boolean;
}) {
  const methods = useMethods();
  const ready = (ids: string[], items: CapabilityView[]) =>
    readiness(ids, items, methods.values);
  const [data, setData] = useState(initial);
  const [draft, setDraft] = useState<RecordDraft | null>(null);
  const [status, setStatus] = useState("");
  const scope = useScope();
  const router = useRouter();
  const { params, setFilters } = useUrlFilters();
  const hydrated = useHydrated();
  const view = ["objectives", "threats", "matrix", "profile"].includes(
    params.get("view") ?? "",
  )
    ? params.get("view")!
    : "objectives";
  const search = (params.get("search") ?? "").toLowerCase();
  const archived = params.get("archived") === "true";
  function filter(key: string, value: string) {
    setFilters({ [key]: value });
  }
  const inScope = (ids: string[]) =>
    !scope ||
    capabilities.some(
      (c) => ids.includes(c.id) && c.pillarKeys.includes(scope.id),
    );
  const threats = data.threats.filter(
    (t) =>
      (archived || t.active) &&
      `${t.title} ${t.scenario}`.toLowerCase().includes(search) &&
      inScope(t.capabilityIds),
  );
  const objectives = data.objectives.filter(
    (o) =>
      (archived || o.active) &&
      `${o.title} ${o.rationale}`.toLowerCase().includes(search) &&
      inScope(objectiveCapabilities(o, data.threats)),
  );
  const capOptions = capabilities.map((c) => ({
    id: c.id,
    label: `${c.code} · ${c.name}`,
  }));
  const fields: FieldSpec[] =
    draft?.kind === "profile"
      ? Object.entries(profileLabels).map(([key, label]) => ({
          key,
          label,
          type: key === "sector" ? "text" : "textarea",
        }))
      : draft?.kind === "objective"
        ? [
            { key: "title", label: "Objective", required: true },
            {
              key: "rationale",
              label: "Business rationale and planning decision",
              type: "textarea",
              required: true,
            },
            {
              key: "priority",
              label: "Priority (5 highest)",
              type: "number",
              min: 1,
              max: 5,
              required: true,
            },
            {
              key: "ownerId",
              label: "Business owner",
              type: "select",
              options: data.people.map((p) => ({ id: p.id, label: p.name })),
            },
            {
              key: "capabilityIds",
              label: "Required capabilities",
              type: "multi",
              options: capOptions,
            },
            { key: "active", label: "Active", type: "checkbox" },
          ]
        : [
            { key: "title", label: "Threat title", required: true },
            {
              key: "scenario",
              label: "Business threat scenario",
              type: "textarea",
              required: true,
            },
            {
              key: "likelihood",
              label: "Likelihood estimate (1 low – 5 high)",
              type: "number",
              min: 1,
              max: 5,
            },
            {
              key: "impact",
              label: "Business impact estimate (1 low – 5 high)",
              type: "number",
              min: 1,
              max: 5,
            },
            {
              key: "basis",
              label: "Estimate basis, source and planning consequence",
              type: "textarea",
              required: true,
            },
            {
              key: "objectiveIds",
              label: "Affected objectives",
              type: "multi",
              options: data.objectives.map((o) => ({
                id: o.id,
                label: o.title,
              })),
            },
            {
              key: "capabilityIds",
              label: "Defending capabilities",
              type: "multi",
              options: capOptions,
            },
            { key: "active", label: "Active", type: "checkbox" },
          ];
  function editObjective(o?: Objective) {
    const { id, revision, ...values } = o ?? {
      id: "",
      revision: "",
      title: "",
      rationale: "",
      priority: 3,
      ownerId: null,
      active: true,
      capabilityIds: [],
    };
    setDraft({ kind: "objective", id: id || undefined, revision, values });
  }
  function editThreat(t?: Threat) {
    const { id, revision, ...values } = t ?? {
      id: "",
      revision: "",
      title: "",
      scenario: "",
      likelihood: null,
      impact: null,
      basis: "",
      active: true,
      objectiveIds: [],
      capabilityIds: [],
    };
    setDraft({ kind: "threat", id: id || undefined, revision, values });
  }
  function editProfile() {
    const { id, revision, ...values } = data.profile ?? {
      id: "",
      revision: "",
      mission: null,
      sector: null,
      criticalServices: null,
      dependencies: null,
      publicSafetyImpact: null,
      regulatoryDrivers: null,
      complexityNotes: null,
    };
    setDraft({ kind: "profile", id: id || undefined, revision, values });
  }
  async function saved() {
    setDraft(null);
    setStatus("Saved");
    try {
      const response = await fetch("/api/context", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.data) throw new Error();
      setData(result.data);
      router.refresh();
    } catch {
      setStatus("Saved. Reload to refresh the workspace.");
    }
  }
  function links(ids: string[]) {
    return (
      <ul className="flex flex-wrap gap-2">
        {capabilities
          .filter((c) => ids.includes(c.id))
          .map((c) => (
            <li key={c.id}>
              <Link
                className="inline-block rounded border px-2 py-1 text-xs text-link hover:underline"
                href={withScope(`/capabilities?topic=${c.id}`, scope)}
                title={c.name}
              >
                {c.code} · {c.currentLevel ?? "?"} → {c.targetLevel ?? "?"}
              </Link>
            </li>
          ))}
      </ul>
    );
  }
  function downloadCsv(name: string, rows: unknown[][]) {
    const [header, ...body] = rows;
    const at = new Date().toISOString();
    saveCsv(name, [
      [
        ...header,
        "Scope",
        "Exported at (UTC)",
        "Readiness method",
        "Assessment provenance",
      ],
      ...body.map((row) => [
        ...row,
        scope?.name ?? "Enterprise",
        at,
        `${methods.id} (${methods.provisional ? "provisional" : "organization approved"})`,
        synthetic
          ? "Contains synthetic demo assessments"
          : "Recorded assessments",
      ]),
    ]);
  }
  function exportView() {
    if (view === "profile")
      downloadCsv("organization-context.csv", [
        ["Field", "Value"],
        ...Object.entries(profileLabels).map(([key, label]) => [
          label,
          data.profile?.[key as keyof typeof profileLabels],
        ]),
      ]);
    else if (view === "matrix")
      downloadCsv("threat-objective-matrix.csv", [
        ["Threat", ...objectives.map((o) => o.title)],
        ...threats.map((t) => [
          t.title,
          ...objectives.map((o) =>
            t.objectiveIds.includes(o.id) ? "Linked" : "",
          ),
        ]),
      ]);
    else if (view === "threats")
      downloadCsv("business-threats.csv", [
        [
          "ID",
          "Title",
          "Scenario",
          "Likelihood",
          "Impact",
          "Basis",
          "Objectives",
          "Capabilities",
          "Readiness",
          "Missing",
        ],
        ...threats.map((t) => {
          const r = ready(t.capabilityIds, capabilities);
          return [
            t.id,
            t.title,
            t.scenario,
            t.likelihood,
            t.impact,
            t.basis,
            t.objectiveIds.join(";"),
            t.capabilityIds.join(";"),
            r.state,
            r.missing,
          ];
        }),
      ]);
    else
      downloadCsv("business-objectives.csv", [
        [
          "ID",
          "Objective",
          "Rationale",
          "Priority",
          "Owner",
          "Capabilities",
          "Readiness",
          "Weakest",
          "Mean",
          "Missing",
        ],
        ...objectives.map((o) => {
          const ids = objectiveCapabilities(o, data.threats);
          const r = ready(ids, capabilities);
          return [
            o.id,
            o.title,
            o.rationale,
            o.priority,
            data.people.find((p) => p.id === o.ownerId)?.name,
            ids.join(";"),
            r.state,
            r.minimum,
            r.mean,
            r.missing,
          ];
        }),
      ]);
  }
  return (
    <fieldset
      disabled={!hydrated}
      aria-label="Context workspace"
      className="min-w-0 space-y-4"
    >
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Business objectives", objectives.length],
          ["Business threats", threats.length],
          [
            "Objectives needing attention",
            objectives.filter(
              (o) =>
                ready(objectiveCapabilities(o, data.threats), capabilities)
                  .state !== "Defended (indicative)",
            ).length,
          ],
        ].map(([label, value]) => (
          <div className="rounded-md border bg-card p-3" key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="print-hidden flex items-center gap-2 border-b pb-2">
        {[
          ["objectives", "Objectives"],
          ["threats", "Business threats"],
          ["matrix", "Dependencies"],
          ["profile", "Organization profile"],
        ].map(([key, label]) => (
          <Button
            variant={view === key ? "secondary" : "ghost"}
            key={key}
            aria-pressed={view === key}
            onClick={() => filter("view", key)}
          >
            {label}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportView}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
          {canEdit && view !== "matrix" && (
            <Button
              onClick={() =>
                view === "profile"
                  ? editProfile()
                  : view === "threats"
                    ? editThreat()
                    : editObjective()
              }
            >
              {view === "profile"
                ? "Edit profile"
                : view === "threats"
                  ? "Add threat"
                  : "Add objective"}
            </Button>
          )}
        </div>
      </div>
      <div className="print-hidden flex items-center gap-4">
        <label>
          Search
          <input
            className="form-input ml-2 w-64"
            value={params.get("search") ?? ""}
            onChange={(e) => filter("search", e.target.value)}
          />
        </label>
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => filter("archived", e.target.checked ? "true" : "")}
          />
          Include inactive
        </label>
      </div>
      <p className="text-xs text-muted-foreground" role="status">
        {status}
      </p>
      <p className="print-only text-xs">
        View: {view} · Scope: {scope?.name ?? "Enterprise"} · Search:{" "}
        {params.get("search") || "All"} ·{" "}
        {archived ? "Includes inactive" : "Active records"}
      </p>
      {view === "profile" ? (
        <section className="rounded-md border bg-card p-4">
          <h2>Organization profile</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Enterprise context. Record sources and planning assumptions; no
            synthetic organizational facts are generated.
          </p>
          <dl className="mt-4 grid grid-cols-[240px_1fr] gap-4">
            {Object.entries(profileLabels).map(([key, label]) => (
              <div className="contents" key={key}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="whitespace-pre-wrap">
                  {data.profile?.[key as keyof typeof profileLabels] ??
                    "Not recorded"}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : view === "objectives" ? (
        <div className="grid grid-cols-2 gap-4">
          {objectives.map((o) => {
            const ids = objectiveCapabilities(o, data.threats);
            const r = ready(ids, capabilities);
            return (
              <section
                className="space-y-3 rounded-md border bg-card p-4"
                key={o.id}
              >
                <div className="flex flex-wrap gap-3 text-xs">
                  {ids.map((id) => (
                    <ScopedLink
                      key={id}
                      href={`/capabilities/planning?view=issue&capability=${id}`}
                      className="text-link underline"
                    >
                      {capabilities.find((c) => c.id === id)?.code ?? id}{" "}
                      planning deficiencies / responsibilities
                    </ScopedLink>
                  ))}
                </div>
                <header className="flex justify-between gap-3">
                  <h2>
                    {o.title}
                    {!o.active ? " · inactive" : ""}
                  </h2>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editObjective(o)}
                    >
                      Edit objective
                    </Button>
                  )}
                </header>
                <p className="whitespace-pre-wrap text-sm">{o.rationale}</p>
                <p className="text-xs text-muted-foreground">
                  Priority {o.priority}/5 ·{" "}
                  {data.people.find((p) => p.id === o.ownerId)?.name ??
                    "Unassigned owner"}
                </p>
                <p className="text-sm">
                  {r.state} · weakest {r.minimum ?? "unknown"} · mean{" "}
                  {r.mean?.toFixed(1) ?? "unknown"}
                  {r.missing ? ` · ${r.missing} unassessed` : ""}
                </p>
                {links(ids)}
                <p className="text-xs text-muted-foreground">
                  {data.threats
                    .filter((t) => t.active && t.objectiveIds.includes(o.id))
                    .map((t) => t.title)
                    .join(" · ") || "No linked business threats"}
                </p>
              </section>
            );
          })}
          {!objectives.length && (
            <p className="col-span-2 rounded-md border p-6 text-muted-foreground">
              No matching objectives. Add a business objective and the
              capabilities it needs to establish investment priorities.
            </p>
          )}
        </div>
      ) : view === "threats" ? (
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {[
                  "Business threat",
                  "Likelihood / impact",
                  "Readiness",
                  "Defending capabilities",
                  "Objectives",
                ].map((x) => (
                  <th className="px-4 py-2" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {threats.map((t) => {
                const r = ready(t.capabilityIds, capabilities);
                return (
                  <tr className="border-b last:border-0" key={t.id}>
                    <td className="max-w-72 px-4 py-3">
                      <button
                        disabled={!canEdit}
                        className="text-link hover:underline"
                        onClick={() => editThreat(t)}
                      >
                        {t.title}
                        {!t.active ? " · inactive" : ""}
                      </button>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.scenario}
                      </p>
                      <p className="mt-1 text-xs">Basis: {t.basis}</p>
                    </td>
                    <td className="px-4">
                      {t.likelihood ?? "Unknown"} / {t.impact ?? "Unknown"}
                    </td>
                    <td className="px-4">
                      {r.state}
                      <p className="text-xs text-muted-foreground">
                        Min {r.minimum ?? "?"} · mean{" "}
                        {r.mean?.toFixed(1) ?? "?"} · missing {r.missing}
                      </p>
                    </td>
                    <td className="max-w-64 px-4">{links(t.capabilityIds)}</td>
                    <td className="px-4">
                      {data.objectives
                        .filter((o) => t.objectiveIds.includes(o.id))
                        .map((o) => o.title)
                        .join("; ") || "None"}
                    </td>
                  </tr>
                );
              })}
              {!threats.length && (
                <tr>
                  <td colSpan={5} className="p-6 text-muted-foreground">
                    No matching business threats. Link scenarios to objectives
                    and defending capabilities to explain planning consequences.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <section className="space-y-3">
          <h2>Threat-to-objective dependencies</h2>
          <div className="overflow-x-auto rounded-md border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-3 text-left">Business threat</th>
                  {objectives.map((o) => (
                    <th className="min-w-40 p-3 text-left" key={o.id}>
                      {o.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {threats.map((t) => (
                  <tr className="border-t" key={t.id}>
                    <th className="p-3 text-left font-medium">{t.title}</th>
                    {objectives.map((o) => (
                      <td className="p-3" key={o.id}>
                        {t.objectiveIds.includes(o.id) ? "Linked" : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!objectives.length || !threats.length) && (
            <p className="text-muted-foreground">
              Create objectives and linked threats to populate the matrix.
            </p>
          )}
        </section>
      )}
      {view !== "profile" && (
        <p className="text-xs text-muted-foreground">
          Provisional readiness method {methods.id}: unique applicable mapped
          capabilities, weakest score {methods.values.readinessDefended}+
          indicates defended, {methods.values.readinessPartial} partly defended,
          lower exposed. Any missing assessment is incomplete. This is planning
          context, not measured threat probability or verified compliance.
          Inactive threats do not contribute to objective readiness.
        </p>
      )}
      {draft && (
        <RecordEditor
          key={`${draft.kind}-${draft.id ?? "new"}`}
          title={`${draft.id ? "Edit" : "Add"} ${draft.kind}`}
          draft={draft}
          fields={fields}
          endpoint="/api/context"
          onClose={() => setDraft(null)}
          onSaved={() => void saved()}
        />
      )}
    </fieldset>
  );
}
