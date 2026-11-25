"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  LoaderCircle,
  Search,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Meter, Stat, StatStrip } from "@/components/analytics/stat";
import { useScope } from "@/components/use-scope";
import {
  gap,
  matchesFilter,
  quickFilters,
  summarize,
  type CapabilityView,
  type IndicatorView,
  performanceRows,
  type IndicatorStatus,
  type QuickFilter,
} from "@/lib/domain/capabilities";
import { displayGroups } from "@/lib/domain/catalogue";
import { useMethods } from "@/components/planning/method-provider";
import { AssessmentView } from "./assessment-view";
import { GapsView } from "./gaps-view";
import { PerformanceView } from "./performance-view";
import { AnalysisView } from "./analysis-view";
import { CardsView } from "./cards-view";
import { CapabilityPanel, type FunctionGroup } from "./capability-panel";

export const views = [
  { id: "assessment", label: "Assessment" },
  { id: "cards", label: "Cards" },
  { id: "gaps", label: "Targets and gaps" },
  { id: "performance", label: "KPI performance" },
  { id: "analysis", label: "Analysis" },
] as const;
type ViewId = (typeof views)[number]["id"];

export type SaveState =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; at: Date }
  | { state: "error"; message: string };

export type CapabilityPatch = Partial<
  Pick<
    CapabilityView,
    | "currentLevel"
    | "targetLevel"
    | "applicable"
    | "confidence"
    | "rationale"
    | "description"
    | "reviewState"
    | "targetDate"
    | "accountableFunctionId"
    | "ownerPersonId"
    | "pillarKeys"
  >
>;

export type IndicatorPatch = Partial<
  Pick<
    IndicatorView,
    "value" | "measuredAt" | "passThreshold" | "failThreshold" | "name" | "unit"
  >
>;

async function request<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<
  { ok: true; data: T } | { ok: false; status: number; message: string }
> {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) return { ok: true, data: payload.data as T };
    return {
      ok: false,
      status: response.status,
      message: payload?.error?.message ?? "Could not save",
    };
  } catch {
    return { ok: false, status: 0, message: "Network unavailable" };
  }
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  // Neutralize spreadsheet formulas and quote every field.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function CapabilityWorkspace({
  initial,
  synthetic,
  functions,
  people,
  canEdit,
  now: nowIso,
}: {
  initial: CapabilityView[];
  synthetic: boolean;
  functions: FunctionGroup[];
  people: { id: string; name: string }[];
  canEdit: boolean;
  now: string;
}) {
  const { levelName, id: methodId } = useMethods();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const scope = useScope();
  const [items, setItems] = useState(initial);
  const [save, setSave] = useState<SaveState>({ state: "idle" });
  const queue = useRef(Promise.resolve());
  const pending = useRef(0);
  const versions = useRef(new Map<string, number>());
  const confirmed = useRef(new Map(initial.map((item) => [item.id, item])));
  const confirmedIndicators = useRef(
    new Map(
      initial.flatMap((item) =>
        item.indicators.map((kpi) => [kpi.id, kpi] as const),
      ),
    ),
  );
  const enqueueRequest = useCallback(
    <T,>(url: string, method: string, body?: unknown) => {
      pending.current += 1;
      const next = queue.current.then(() => request<T>(url, method, body));
      queue.current = next.then(
        () => undefined,
        () => undefined,
      );
      return next.finally(() => {
        pending.current -= 1;
      });
    },
    [],
  );
  const saved = useCallback(() => {
    setSave((state) =>
      state.state === "error"
        ? state
        : pending.current > 0
          ? { state: "saving" }
          : { state: "saved", at: new Date() },
    );
  }, []);

  const view = (views.find((entry) => entry.id === params.get("view"))?.id ??
    "assessment") as ViewId;
  const filter = (quickFilters.find(
    (entry) => entry.id === params.get("filter"),
  )?.id ?? "all") as QuickFilter;
  const group = params.get("group") ?? "";
  const query = params.get("q") ?? "";
  const selectedId = params.get("topic");
  const kpiStatus = (
    ["fail", "at-risk", "missing", "pass"].includes(
      params.get("kpiStatus") ?? "",
    )
      ? params.get("kpiStatus")
      : "all"
  ) as "all" | IndicatorStatus;
  const worstFirst = params.get("worst") === "1";

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const search = next.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    },
    [params, pathname, router],
  );

  const scoped = useMemo(
    () =>
      scope
        ? items.filter((item) => item.pillarKeys.includes(scope.id))
        : items,
    [items, scope],
  );
  const summary = useMemo(() => summarize(scoped, now), [scoped, now]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return scoped.filter(
      (item) =>
        matchesFilter(item, filter, now) &&
        (!group || item.groupCode === group) &&
        (!needle ||
          item.name.toLowerCase().includes(needle) ||
          item.code.toLowerCase().includes(needle) ||
          item.indicators.some((kpi) =>
            kpi.name.toLowerCase().includes(needle),
          )),
    );
  }, [scoped, filter, group, query, now]);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const open = useCallback(
    (id: string | null) => setParams({ topic: id }),
    [setParams],
  );

  const handleFailure = useCallback(
    (result: { status: number; message: string }) => {
      if (result.status === 401) {
        router.replace("/login?reason=expired");
        return;
      }
      setSave({ state: "error", message: result.message });
    },
    [router],
  );

  const update = useCallback(
    async (id: string, patch: CapabilityPatch) => {
      if (!items.some((item) => item.id === id)) return;
      const version = (versions.current.get(id) ?? 0) + 1;
      versions.current.set(id, version);
      setItems((list) =>
        list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
      setSave({ state: "saving" });
      const result = await enqueueRequest<CapabilityView>(
        `/api/capabilities/${id}`,
        "PATCH",
        patch,
      );
      if (result.ok) {
        confirmed.current.set(id, result.data);
        if (versions.current.get(id) !== version) return;
        setItems((list) =>
          list.map((item) => (item.id === id ? result.data : item)),
        );
        saved();
      } else {
        if (versions.current.get(id) === version)
          setItems((list) =>
            list.map((item) =>
              item.id === id
                ? { ...confirmed.current.get(id)!, indicators: item.indicators }
                : item,
            ),
          );
        handleFailure(result);
      }
    },
    [items, handleFailure, enqueueRequest, saved],
  );

  const replaceIndicator = useCallback(
    (capabilityId: string, map: (list: IndicatorView[]) => IndicatorView[]) =>
      setItems((list) =>
        list.map((item) =>
          item.id === capabilityId
            ? { ...item, indicators: map(item.indicators) }
            : item,
        ),
      ),
    [],
  );

  const updateIndicator = useCallback(
    async (
      capabilityId: string,
      indicatorId: string,
      patch: IndicatorPatch,
    ) => {
      const owner = items.find((item) => item.id === capabilityId);
      const before = owner?.indicators.find((kpi) => kpi.id === indicatorId);
      if (!before) return false;
      const version = (versions.current.get(indicatorId) ?? 0) + 1;
      versions.current.set(indicatorId, version);
      replaceIndicator(capabilityId, (list) =>
        list.map((kpi) =>
          kpi.id === indicatorId ? { ...kpi, ...patch } : kpi,
        ),
      );
      setSave({ state: "saving" });
      const result = await enqueueRequest<IndicatorView>(
        `/api/indicators/${indicatorId}`,
        "PATCH",
        patch,
      );
      if (result.ok) {
        confirmedIndicators.current.set(indicatorId, result.data);
        if (versions.current.get(indicatorId) !== version) return true;
        replaceIndicator(capabilityId, (list) =>
          list.map((kpi) => (kpi.id === indicatorId ? result.data : kpi)),
        );
        saved();
        return true;
      }
      if (versions.current.get(indicatorId) === version)
        replaceIndicator(capabilityId, (list) =>
          list.map((kpi) =>
            kpi.id === indicatorId
              ? confirmedIndicators.current.get(indicatorId)!
              : kpi,
          ),
        );
      handleFailure(result);
      return false;
    },
    [items, replaceIndicator, handleFailure, enqueueRequest, saved],
  );

  const createIndicator = useCallback(
    async (
      capabilityId: string,
      body: Omit<IndicatorView, "id" | "catalogueKey">,
    ) => {
      setSave({ state: "saving" });
      const result = await enqueueRequest<IndicatorView>(
        `/api/capabilities/${capabilityId}/indicators`,
        "POST",
        body,
      );
      if (result.ok) {
        confirmedIndicators.current.set(result.data.id, result.data);
        replaceIndicator(capabilityId, (list) => [...list, result.data]);
        saved();
        return true;
      }
      handleFailure(result);
      return false;
    },
    [replaceIndicator, handleFailure, enqueueRequest, saved],
  );

  const deleteIndicator = useCallback(
    async (capabilityId: string, indicatorId: string) => {
      setSave({ state: "saving" });
      const result = await enqueueRequest<{ id: string }>(
        `/api/indicators/${indicatorId}`,
        "DELETE",
        {},
      );
      if (result.ok) {
        replaceIndicator(capabilityId, (list) =>
          list.filter((kpi) => kpi.id !== indicatorId),
        );
        saved();
      } else handleFailure(result);
    },
    [replaceIndicator, handleFailure, enqueueRequest, saved],
  );

  function exportCsv() {
    let header = [
      "Code",
      "Topic",
      "Group",
      "Pillars",
      "Applicable",
      "Current",
      "Current level",
      "Target",
      "Gap",
      "Confidence",
      "Review state",
      "Last assessed",
      "Target date",
      "Accountable person",
      "Accountable function",
      "Data source",
      ...Array.from(
        {
          length: Math.max(0, ...visible.map((item) => item.indicators.length)),
        },
        (_, index) => [`KPI ${index + 1}`, `KPI ${index + 1} value`],
      ).flat(),
    ];
    let rows: unknown[][] = visible.map((item) => [
      item.code,
      item.name,
      displayGroups.find((entry) => entry.code === item.groupCode)?.name,
      item.pillarKeys.join(" "),
      item.applicable ? "yes" : "no",
      item.currentLevel,
      item.currentLevel == null ? "Not assessed" : levelName(item.currentLevel),
      item.targetLevel,
      gap(item),
      item.confidence,
      item.reviewState,
      item.assessedAt?.slice(0, 10),
      item.targetDate,
      item.ownerPersonName,
      item.accountableFunctionName,
      synthetic ? "Contains synthetic demo data" : "Recorded assessments",
      ...Array.from({ length: (header.length - 16) / 2 }, (_, index) => [
        item.indicators[index]?.name,
        item.indicators[index]?.value,
      ]).flat(),
    ]);
    if (view === "performance") {
      header = [
        "Code",
        "Topic",
        "KPI",
        "Value",
        "Unit",
        "Direction",
        "Pass boundary",
        "Fail boundary",
        "Status",
        "Measured",
        "Data source",
      ];
      rows = performanceRows(visible, kpiStatus, worstFirst).map(
        ({ item, kpi, status }) => [
          item.code,
          item.name,
          kpi.name,
          kpi.value,
          kpi.unit,
          kpi.direction,
          kpi.passThreshold,
          kpi.failThreshold,
          status,
          kpi.measuredAt,
          synthetic ? "Contains synthetic demo data" : "Recorded assessments",
        ],
      );
    }
    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `capabilities-${scope?.id ?? "enterprise"}-${nowIso.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const toggleFilter = (next: QuickFilter) =>
    setParams({
      filter: filter === next ? null : next,
      view: view === "performance" || view === "analysis" ? null : view,
    });

  return (
    <div className="space-y-4">
      {items.some(
        (c) =>
          c.currentLevel !== null &&
          c.scaleVersion &&
          c.scaleVersion !== methodId,
      ) && (
        <p className="rounded border p-3 text-xs text-muted-foreground">
          Some observations retain an earlier method version. Current configured
          labels do not re-assess those records; compare definitions in Settings
          / Saved assumption and scale versions before interpreting ordinal
          aggregates across versions. Captured cycles retain their own labels
          and definitions.
        </p>
      )}
      <StatStrip>
        <Stat
          label="Assessed"
          value={
            <>
              {summary.assessed}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {summary.applicable}
              </span>
            </>
          }
          detail={
            summary.unassessed
              ? `${summary.unassessed} not assessed`
              : "All topics rated"
          }
          tone={summary.unassessed ? "warn" : "neutral"}
          onSelect={() => toggleFilter("unassessed")}
          active={filter === "unassessed"}
        >
          <Meter
            value={summary.assessed}
            max={summary.applicable}
            label="Assessment coverage"
          />
        </Stat>
        <Stat
          label="Average maturity"
          value={summary.averageCurrent?.toFixed(1) ?? "—"}
          unit="of 5"
          detail={
            summary.averageTarget != null
              ? `Target ${summary.averageTarget.toFixed(1)}`
              : "No targets set"
          }
          onSelect={() => setParams({ view: "analysis", filter: null })}
          active={view === "analysis"}
        />
        <Stat
          label="Below target"
          value={summary.belowTarget}
          detail={`${summary.levelsToClose} level${summary.levelsToClose === 1 ? "" : "s"} to close`}
          tone={summary.belowTarget ? "bad" : "neutral"}
          onSelect={() => toggleFilter("below")}
          active={filter === "below"}
        />
        <Stat
          label="KPIs passing"
          value={
            <>
              {summary.indicators.pass}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {summary.indicators.total}
              </span>
            </>
          }
          detail={`${summary.indicators.atRisk} at risk · ${summary.indicators.fail} fail · ${summary.indicators.missing} no data`}
          tone={
            summary.indicators.fail
              ? "bad"
              : summary.indicators.atRisk
                ? "warn"
                : "neutral"
          }
          onSelect={() => setParams({ view: "performance", filter: null })}
          active={view === "performance"}
        >
          <KpiMix summary={summary.indicators} />
        </Stat>
        <Stat
          label="Review due"
          value={summary.reviewDue + summary.reviewOverdue}
          detail={`${summary.reviewOverdue} overdue`}
          tone={
            summary.reviewOverdue
              ? "bad"
              : summary.reviewDue
                ? "warn"
                : "neutral"
          }
          onSelect={() => toggleFilter("review")}
          active={filter === "review"}
        />
        <Stat
          label="No accountable owner"
          value={summary.noOwner}
          detail={
            summary.noTarget
              ? `${summary.noTarget} without a target`
              : "Every topic has a target"
          }
          tone={summary.noOwner ? "warn" : "neutral"}
          onSelect={() => toggleFilter("no-owner")}
          active={filter === "no-owner"}
        />
      </StatStrip>

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b">
        <div
          role="tablist"
          aria-label="Capability views"
          className="relative flex gap-5 overflow-x-auto"
        >
          {views.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={view === entry.id}
              onClick={() =>
                setParams({ view: entry.id === "assessment" ? null : entry.id })
              }
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 pb-2 text-[13px] font-medium transition-colors",
                view === entry.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pb-1.5">
          <SaveIndicator save={save} />
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>

      {view !== "analysis" ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Search topics and KPIs</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              defaultValue={query}
              onChange={(event) => setParams({ q: event.target.value })}
              placeholder="Search topics and KPIs"
              className="h-8 w-60 rounded-md border bg-card pl-8 pr-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="sr-only" htmlFor="group-filter">
            Group
          </label>
          <select
            id="group-filter"
            value={group}
            onChange={(event) => setParams({ group: event.target.value })}
            className="h-8 rounded-md border bg-card px-2 text-[13px]"
          >
            <option value="">All groups</option>
            {displayGroups.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.name}
              </option>
            ))}
          </select>
          {view !== "performance" ? (
            <div
              role="group"
              aria-label="Quick filters"
              className="flex flex-wrap gap-1"
            >
              {quickFilters.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={filter === entry.id}
                  onClick={() =>
                    setParams({ filter: entry.id === "all" ? null : entry.id })
                  }
                  className={cn(
                    "h-7 rounded-full border px-2.5 text-xs font-medium transition-colors",
                    filter === entry.id
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          ) : null}
          <span className="ml-auto text-xs text-muted-foreground tabular">
            {visible.length} of {scoped.length} topics
          </span>
        </div>
      ) : null}

      {view === "cards" ? (
        <CardsView items={visible} onOpen={(id) => setParams({ topic: id })} />
      ) : view === "assessment" ? (
        <AssessmentView
          items={visible}
          canEdit={canEdit}
          now={now}
          onOpen={open}
          onUpdate={update}
        />
      ) : null}
      {view === "gaps" ? (
        <GapsView items={visible} now={now} onOpen={open} />
      ) : null}
      {view === "performance" ? (
        <PerformanceView
          items={visible}
          canEdit={canEdit}
          onOpen={open}
          onUpdate={updateIndicator}
          status={kpiStatus}
          worstFirst={worstFirst}
          onStatus={(status) =>
            setParams({ kpiStatus: status === "all" ? null : status })
          }
          onWorstFirst={(worst) => setParams({ worst: worst ? "1" : null })}
        />
      ) : null}
      {view === "analysis" ? (
        <AnalysisView items={scoped} enterprise={!scope} onOpen={open} />
      ) : null}

      <CapabilityPanel
        capability={selected}
        functions={functions}
        people={people}
        canEdit={canEdit}
        now={now}
        onClose={() => open(null)}
        onUpdate={update}
        onUpdateIndicator={updateIndicator}
        onCreateIndicator={createIndicator}
        onDeleteIndicator={deleteIndicator}
      />
    </div>
  );
}

function KpiMix({
  summary,
}: {
  summary: {
    total: number;
    pass: number;
    atRisk: number;
    fail: number;
    missing: number;
  };
}) {
  if (summary.total === 0) return null;
  const parts = [
    { key: "pass", count: summary.pass, className: "bg-status-good" },
    { key: "risk", count: summary.atRisk, className: "bg-status-warn" },
    { key: "fail", count: summary.fail, className: "bg-status-bad" },
    { key: "none", count: summary.missing, className: "bg-status-none/50" },
  ].filter((part) => part.count > 0);
  return (
    <span
      aria-hidden="true"
      className="flex h-1 gap-px overflow-hidden rounded-full"
    >
      {parts.map((part) => (
        <span
          key={part.key}
          className={part.className}
          style={{ flexGrow: part.count }}
        />
      ))}
    </span>
  );
}

function SaveIndicator({ save }: { save: SaveState }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      {save.state === "saving" ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
          Saving
        </>
      ) : null}
      {save.state === "saved" ? (
        <>
          <Check aria-hidden="true" className="size-3.5 text-status-good" />
          All changes saved
        </>
      ) : null}
      {save.state === "error" ? (
        <span className="flex items-center gap-1.5 text-destructive">
          <TriangleAlert aria-hidden="true" className="size-3.5" />
          {save.message}. The change was not kept.
        </span>
      ) : null}
    </span>
  );
}
