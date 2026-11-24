"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUrlFilters, useHydrated } from "@/components/use-url-filters";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useScope } from "@/components/use-scope";
import {
  descendants,
  type WorkforceData,
  type PersonView,
  type PositionView,
} from "@/lib/domain/workforce";
import { downloadCsv } from "@/lib/domain/csv";
import { withScope } from "@/lib/pillars";

type Draft =
  | { kind: "person"; value: PersonView }
  | { kind: "position"; value: PositionView };
export function WorkforceWorkspace({
  initial,
  canEdit,
}: {
  initial: WorkforceData;
  canEdit: boolean;
}) {
  const [data, setData] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const { params, setFilters } = useUrlFilters();
  const hydrated = useHydrated();
  const router = useRouter();
  const scope = useScope();
  const view =
    params.get("view") === "people"
      ? "people"
      : params.get("view") === "ownership"
        ? "ownership"
        : "positions";
  const search = params.get("search") ?? "";
  const personId = params.get("person") ?? "";
  const rollup = params.get("rollup") === "true";
  const visiblePositions = data.positions.filter(
    (p) =>
      (!scope ||
        data.pillars.find((x) => x.id === p.pillarId)?.key === scope.id) &&
      p.title.toLowerCase().includes(search.toLowerCase()),
  );
  const people = data.people.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (!scope ||
        data.positions.some(
          (x) =>
            x.personId === p.id &&
            data.pillars.find((k) => k.id === x.pillarId)?.key === scope.id,
        )),
  );
  const ownerIds = personId
    ? rollup
      ? descendants(data.people, personId)
      : new Set([personId])
    : null;
  const owned = data.ownership.filter(
    (c) =>
      (!scope || c.pillarKeys.includes(scope.id)) &&
      (!ownerIds || (c.ownerPersonId && ownerIds.has(c.ownerPersonId))) &&
      `${c.code} ${c.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  function filter(key: string, value: string) {
    setFilters({ [key]: value });
  }
  function add(kind: "person" | "position") {
    setError("");
    setDraft(
      kind === "person"
        ? {
            kind,
            value: {
              id: "",
              revision: "",
              name: "",
              title: "",
              managerId: null,
              active: true,
            },
          }
        : {
            kind,
            value: {
              id: "",
              revision: "",
              title: "",
              pillarId:
                data.pillars.find((p) => p.key === scope?.id)?.id ??
                data.pillars[0]?.id ??
                "",
              personId: null,
              state: "proposed",
              fte: 1,
              annualCost: null,
              currency: "USD",
              startYear: null,
              justification: null,
            },
          },
    );
  }
  async function save() {
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    try {
      const { id, revision, ...values } = draft.value;
      const response = await fetch(`/api/workforce${id ? `/${id}` : ""}`, {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: draft.kind,
          values,
          ...(id ? { revision } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message ?? "Could not save");
      setDraft(null);
      setSaved("Saved");
      const refreshed = await fetch("/api/workforce", { cache: "no-store" });
      const payload = await refreshed.json();
      if (!refreshed.ok || !payload.data)
        throw new Error("Saved. Reload to refresh the workspace.");
      setData(payload.data);
      setDraft(null);
      setSaved("Saved");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  function exportView() {
    if (view === "people")
      downloadCsv("people.csv", [
        ["ID", "Name", "Title", "Manager", "Active"],
        ...people.map((p) => [
          p.id,
          p.name,
          p.title,
          data.people.find((x) => x.id === p.managerId)?.name,
          p.active,
        ]),
      ]);
    else if (view === "ownership")
      downloadCsv("ownership.csv", [
        ["Capability", "Name", "Owner", "Target date", "Current", "Target"],
        ...owned.map((c) => [
          c.code,
          c.name,
          data.people.find((p) => p.id === c.ownerPersonId)?.name,
          c.targetDate,
          c.currentLevel,
          c.targetLevel,
        ]),
      ]);
    else
      downloadCsv("positions.csv", [
        [
          "ID",
          "Title",
          "Pillar",
          "State",
          "Incumbent",
          "FTE",
          "Annual cost",
          "Currency",
          "Start year",
          "Justification",
        ],
        ...visiblePositions.map((p) => [
          p.id,
          p.title,
          data.pillars.find((x) => x.id === p.pillarId)?.name,
          p.state,
          data.people.find((x) => x.id === p.personId)?.name,
          p.fte,
          p.annualCost,
          p.currency,
          p.startYear,
          p.justification,
        ]),
      ]);
  }
  return (
    <fieldset
      disabled={!hydrated}
      aria-label="Workforce workspace"
      className="min-w-0 space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        Plan ownership and authorized, vacant or proposed positions. FTE
        allocation describes positions; workload demand and productive capacity
        are separate planning measures.
      </p>
      <div className="grid grid-cols-4 gap-3">
        {[
          ["People", people.filter((p) => p.active).length],
          [
            "Authorized FTE",
            visiblePositions
              .filter((p) => p.state === "authorized")
              .reduce((s, p) => s + p.fte, 0)
              .toFixed(2),
          ],
          [
            "Vacant positions",
            visiblePositions.filter(
              (p) => p.state === "authorized" && !p.personId,
            ).length,
          ],
          [
            "Proposed positions",
            visiblePositions.filter((p) => p.state === "proposed").length,
          ],
        ].map(([label, value]) => (
          <div className="rounded-md border bg-card p-3" key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="print-hidden flex items-center gap-2 border-b pb-2">
        {(
          [
            ["positions", "Positions"],
            ["people", "People and reporting lines"],
            ["ownership", "Assigned capabilities"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            variant={key === view ? "secondary" : "ghost"}
            onClick={() => filter("view", key)}
            aria-pressed={key === view}
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
          {canEdit && (
            <Button
              onClick={() => add(view === "people" ? "person" : "position")}
            >
              {view === "people" ? "Add person" : "Add position"}
            </Button>
          )}
        </div>
      </div>
      <div className="print-hidden flex items-center gap-3">
        <label>
          Search
          <input
            className="form-input ml-2 w-64"
            value={search}
            onChange={(e) => filter("search", e.target.value)}
          />
        </label>
        {view === "ownership" && (
          <>
            <label>
              Person
              <select
                className="form-input ml-2 w-56"
                value={personId}
                onChange={(e) => filter("person", e.target.value)}
              >
                <option value="">All people and unassigned</option>
                {data.people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rollup}
                onChange={(e) =>
                  filter("rollup", e.target.checked ? "true" : "")
                }
              />
              Include reports
            </label>
          </>
        )}
      </div>
      {!draft && error && <p role="alert">{error}</p>}
      <p className="print-only text-xs">
        View: {view} · Scope: {scope?.name ?? "Enterprise"} · Search:{" "}
        {search || "All"}
        {personId
          ? ` · Person: ${data.people.find((p) => p.id === personId)?.name ?? "Unknown"} · ${rollup ? "Includes reports" : "Direct assignments"}`
          : ""}
      </p>
      <p role="status" className="text-xs text-muted-foreground">
        {saved}
      </p>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              {(view === "positions"
                ? [
                    "Position",
                    "Pillar",
                    "State",
                    "Incumbent",
                    "FTE",
                    "Annual cost",
                  ]
                : view === "people"
                  ? [
                      "Person",
                      "Title",
                      "Reports to",
                      "State",
                      "Assigned capabilities",
                    ]
                  : ["Capability", "Owner", "Current → target", "Due"]
              ).map((x) => (
                <th className="px-4 py-2" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view === "positions"
              ? visiblePositions.map((p) => (
                  <tr className="border-b last:border-0" key={p.id}>
                    <td className="px-4 py-3">
                      <button
                        className="text-link hover:underline"
                        disabled={!canEdit}
                        onClick={() => {
                          setError("");
                          setDraft({ kind: "position", value: { ...p } });
                        }}
                      >
                        {p.title}
                      </button>
                    </td>
                    <td>
                      {data.pillars.find((x) => x.id === p.pillarId)?.name}
                    </td>
                    <td>
                      {p.state}
                      {p.state === "authorized" && !p.personId
                        ? " · vacant"
                        : ""}
                    </td>
                    <td>
                      {data.people.find((x) => x.id === p.personId)?.name ??
                        "Unassigned"}
                    </td>
                    <td>{p.fte.toFixed(2)}</td>
                    <td>
                      {p.annualCost == null
                        ? "Unknown"
                        : `${p.annualCost.toLocaleString("en-US")} ${p.currency}`}
                    </td>
                  </tr>
                ))
              : view === "people"
                ? people.map((p) => (
                    <tr className="border-b last:border-0" key={p.id}>
                      <td className="px-4 py-3">
                        <button
                          className="text-link hover:underline"
                          disabled={!canEdit}
                          onClick={() => {
                            setError("");
                            setDraft({ kind: "person", value: { ...p } });
                          }}
                        >
                          {p.name}
                        </button>
                      </td>
                      <td>{p.title}</td>
                      <td>
                        {data.people.find((x) => x.id === p.managerId)?.name ??
                          "No manager"}
                      </td>
                      <td>{p.active ? "Active" : "Inactive"}</td>
                      <td>
                        <button
                          className="text-link hover:underline"
                          onClick={() => {
                            setFilters({ view: "ownership", person: p.id });
                          }}
                        >
                          {
                            data.ownership.filter(
                              (c) => c.ownerPersonId === p.id,
                            ).length
                          }{" "}
                          direct
                        </button>
                      </td>
                    </tr>
                  ))
                : owned.map((c) => (
                    <tr className="border-b last:border-0" key={c.id}>
                      <td className="px-4 py-3">
                        <Link
                          className="text-link hover:underline"
                          href={withScope(`/capabilities?topic=${c.id}`, scope)}
                        >
                          {c.code} · {c.name}
                        </Link>
                      </td>
                      <td>
                        {data.people.find((p) => p.id === c.ownerPersonId)
                          ?.name ?? "Unassigned"}
                      </td>
                      <td>
                        {c.currentLevel ?? "Unknown"} →{" "}
                        {c.targetLevel ?? "No target"}
                      </td>
                      <td>{c.targetDate ?? "No date"}</td>
                    </tr>
                  ))}
            {(view === "people"
              ? people
              : view === "positions"
                ? visiblePositions
                : owned
            ).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-muted-foreground">
                  No matching records.{" "}
                  {view === "people"
                    ? "Add personnel to assign accountability."
                    : view === "positions"
                      ? "Add authorized or proposed positions to begin resource planning."
                      : "Assign people from capability details to build this worklist."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {view === "ownership" && (
        <p className="text-xs text-muted-foreground">
          Assigned record counts describe accountability, not hours or staffing
          demand. Rollup counts each capability once across the reporting
          subtree.
        </p>
      )}
      <Sheet
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDraft(null);
        }}
      >
        <SheetContent className="overflow-y-auto p-5 data-[side=right]:w-[540px] data-[side=right]:sm:max-w-[540px]">
          <SheetTitle>
            {draft?.value.id ? "Edit" : "Add"} {draft?.kind}
          </SheetTitle>
          <SheetDescription>
            Save personnel and position planning records. Login accounts are
            managed separately.
          </SheetDescription>
          {draft && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              {draft.kind === "person" ? (
                <>
                  <label className="block">
                    Name
                    <input
                      required
                      maxLength={150}
                      className="form-input mt-1"
                      value={draft.value.name}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: { ...draft.value, name: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="block">
                    Title
                    <input
                      required
                      maxLength={150}
                      className="form-input mt-1"
                      value={draft.value.title}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: { ...draft.value, title: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="block">
                    Reports to
                    <select
                      className="form-input mt-1"
                      value={draft.value.managerId ?? ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: {
                            ...draft.value,
                            managerId: e.target.value || null,
                          },
                        })
                      }
                    >
                      <option value="">No manager</option>
                      {data.people
                        .filter((p) => p.id !== draft.value.id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={draft.value.active}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: { ...draft.value, active: e.target.checked },
                        })
                      }
                    />
                    Active
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    Position title
                    <input
                      required
                      maxLength={150}
                      className="form-input mt-1"
                      value={draft.value.title}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: { ...draft.value, title: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="block">
                    Pillar
                    <select
                      className="form-input mt-1"
                      value={draft.value.pillarId}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: { ...draft.value, pillarId: e.target.value },
                        })
                      }
                    >
                      {data.pillars.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    Position state
                    <select
                      className="form-input mt-1"
                      value={draft.value.state}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: {
                            ...draft.value,
                            state: e.target.value as PositionView["state"],
                            personId: null,
                          },
                        })
                      }
                    >
                      {["proposed", "authorized", "retired"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    Incumbent
                    <select
                      disabled={draft.value.state !== "authorized"}
                      className="form-input mt-1"
                      value={draft.value.personId ?? ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: {
                            ...draft.value,
                            personId: e.target.value || null,
                          },
                        })
                      }
                    >
                      <option value="">Vacant / unassigned</option>
                      {data.people
                        .filter(
                          (p) => p.active || p.id === draft.value.personId,
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="block">
                    Position FTE
                    <input
                      required
                      type="number"
                      min="0.01"
                      max="1"
                      step="0.01"
                      className="form-input mt-1"
                      value={draft.value.fte}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: {
                            ...draft.value,
                            fte: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                  <label className="block">
                    Fully burdened annual cost
                    <input
                      type="number"
                      min="0"
                      max="10000000000"
                      step="0.01"
                      className="form-input mt-1"
                      value={draft.value.annualCost ?? ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: {
                            ...draft.value,
                            annualCost:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                  <label className="block">
                    Currency
                    <input
                      required
                      pattern="[A-Z]{3}"
                      maxLength={3}
                      className="form-input mt-1"
                      value={draft.value.currency}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: {
                            ...draft.value,
                            currency: e.target.value.toUpperCase(),
                          },
                        })
                      }
                    />
                  </label>
                  <label className="block">
                    Implementation year
                    <input
                      type="number"
                      min="2000"
                      max="2200"
                      className="form-input mt-1"
                      value={draft.value.startYear ?? ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: {
                            ...draft.value,
                            startYear:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                  <label className="block">
                    Justification and assumptions
                    <textarea
                      maxLength={4000}
                      rows={4}
                      className="form-input mt-1"
                      value={draft.value.justification ?? ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          value: {
                            ...draft.value,
                            justification: e.target.value || null,
                          },
                        })
                      }
                    />
                  </label>
                </>
              )}
              {error && (
                <p role="alert" className="text-status-bad">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </fieldset>
  );
}
