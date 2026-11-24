"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
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
  type QuickFilter,
} from "@/lib/domain/capabilities";
import { displayGroups } from "@/lib/domain/catalogue";
import { levelName } from "@/lib/domain/maturity";
import { AssessmentView } from "./assessment-view";
import { GapsView } from "./gaps-view";
import { PerformanceView } from "./performance-view";
import { AnalysisView } from "./analysis-view";
import { CapabilityPanel, type FunctionGroup } from "./capability-panel";

export const views = [
  { id: "assessment", label: "Assessment" },
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
  functions,
  canEdit,
  now: nowIso,
}: {
  initial: CapabilityView[];
  functions: FunctionGroup[];
  canEdit: boolean;
  now: string;
}) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const scope = useScope();
  const [items, setItems] = useState(initial);
  const [save, setSave] = useState<SaveState>({ state: "idle" });

  const view = (views.find((entry) => entry.id === params.get("view"))?.id ??
    "assessment") as ViewId;
  const filter = (quickFilters.find(
    (entry) => entry.id === params.get("filter"),
  )?.id ?? "all") as QuickFilter;
  const group = params.get("group") ?? "";
  const query = params.get("q") ?? "";
  const selectedId = params.get("topic");

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
      const before = items.find((item) => item.id === id);
      if (!before) return;
      setItems((list) =>
        list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
      setSave({ state: "saving" });
      const result = await request<CapabilityView>(
        `/api/capabilities/${id}`,
        "PATCH",
        patch,
      );
      if (result.ok) {
        setItems((list) =>
          list.map((item) => (item.id === id ? result.data : item)),
        );
        setSave({ state: "saved", at: new Date() });
      } else {
        setItems((list) =>
          list.map((item) => (item.id === id ? before : item)),
        );
        handleFailure(result);
      }
    },
    [items, handleFailure],
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
      replaceIndicator(capabilityId, (list) =>
        list.map((kpi) =>
          kpi.id === indicatorId ? { ...kpi, ...patch } : kpi,
        ),
      );
      setSave({ state: "saving" });
      const result = await request<IndicatorView>(
        `/api/indicators/${indicatorId}`,
        "PATCH",
        patch,
      );
      if (result.ok) {
        replaceIndicator(capabilityId, (list) =>
          list.map((kpi) => (kpi.id === indicatorId ? result.data : kpi)),
        );
        setSave({ state: "saved", at: new Date() });
        return true;
      }
      replaceIndicator(capabilityId, (list) =>
        list.map((kpi) => (kpi.id === indicatorId ? before : kpi)),
      );
      handleFailure(result);
      return false;
    },
    [items, replaceIndicator, handleFailure],
  );

  const createIndicator = useCallback(
    async (
      capabilityId: string,
      body: Omit<IndicatorView, "id" | "catalogueKey">,
    ) => {
      setSave({ state: "saving" });
      const result = await request<IndicatorView>(
        `/api/capabilities/${capabilityId}/indicators`,
        "POST",
        body,
      );
      if (result.ok) {
        replaceIndicator(capabilityId, (list) => [...list, result.data]);
        setSave({ state: "saved", at: new Date() });
        return true;
      }
      handleFailure(result);
      return false;
    },
    [replaceIndicator, handleFailure],
  );

  const deleteIndicator = useCallback(
    async (capabilityId: string, indicatorId: string) => {
      setSave({ state: "saving" });
      const result = await request<{ id: string }>(
        `/api/indicators/${indicatorId}`,
        "DELETE",
        {},
      );
      if (result.ok) {
        replaceIndicator(capabilityId, (list) =>
          list.filter((kpi) => kpi.id !== indicatorId),
        );
        setSave({ state: "saved", at: new Date() });
      } else handleFailure(result);
    },
    [replaceIndicator, handleFailure],
  );

  function exportCsv() {
    const header = [
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
      "Accountable function",
      "KPI 1",
      "KPI 1 value",
      "KPI 2",
      "KPI 2 value",
    ];
    const rows = visible.map((item) => [
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
      item.accountableFunctionName,
      item.indicators[0]?.name,
      item.indicators[0]?.value,
      item.indicators[1]?.name,
      item.indicators[1]?.value,
    ]);
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
          className="flex gap-5 overflow-x-auto"
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

      {view === "assessment" ? (
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
        />
      ) : null}
      {view === "analysis" ? (
        <AnalysisView items={scoped} enterprise={!scope} onOpen={open} />
      ) : null}

      <CapabilityPanel
        capability={selected}
        functions={functions}
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
