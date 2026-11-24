"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { KpiBand } from "@/components/analytics/kpi-band";
import {
  performanceRows,
  type CapabilityView,
  type IndicatorStatus,
  type IndicatorView,
} from "@/lib/domain/capabilities";
import { IndicatorBadge, indicatorRule } from "./format";
import type { IndicatorPatch } from "./capability-workspace";

const statusFilters: { id: "all" | IndicatorStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "fail", label: "Failing" },
  { id: "at-risk", label: "At risk" },
  { id: "missing", label: "No data" },
  { id: "pass", label: "Passing" },
];
export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Inline numeric KPI entry. Saves on Enter or blur; empty means no data. */
export function KpiValueInput({
  indicator,
  label,
  onSave,
  disabled = false,
}: {
  indicator: IndicatorView;
  label: string;
  onSave: (patch: IndicatorPatch) => Promise<boolean> | void;
  disabled?: boolean;
}) {
  const shown = indicator.value == null ? "" : String(indicator.value);
  const [draft, setDraft] = useState(shown);
  const [synced, setSynced] = useState(shown);
  if (synced !== shown) {
    setSynced(shown);
    setDraft(shown);
  }
  const invalid = draft.trim() !== "" && !Number.isFinite(Number(draft));
  function commit() {
    if (invalid || draft.trim() === shown) return;
    const value = draft.trim() === "" ? null : Number(draft);
    onSave({ value, measuredAt: value == null ? null : today() });
  }
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        aria-invalid={invalid || undefined}
        value={draft}
        disabled={disabled}
        placeholder="—"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") setDraft(shown);
        }}
        className="h-7 w-16 rounded-md border bg-card px-2 text-right text-[13px] tabular outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:border-transparent disabled:bg-transparent aria-invalid:border-destructive"
      />
      <span className="w-4 text-xs text-muted-foreground">
        {indicator.unit === "%" ? "%" : ""}
      </span>
    </span>
  );
}

/** All operational KPIs for the filtered topics with bands and inline entry. */
export function PerformanceView({
  items,
  canEdit,
  onOpen,
  onUpdate,
  status,
  worstFirst,
  onStatus,
  onWorstFirst,
}: {
  status: "all" | IndicatorStatus;
  worstFirst: boolean;
  onStatus: (value: "all" | IndicatorStatus) => void;
  onWorstFirst: (value: boolean) => void;
  items: CapabilityView[];
  canEdit: boolean;
  onOpen: (id: string) => void;
  onUpdate: (
    capabilityId: string,
    indicatorId: string,
    patch: IndicatorPatch,
  ) => Promise<boolean>;
}) {
  const rows = performanceRows(items, status, worstFirst);
  return (
    <div className="relative overflow-x-auto rounded-md border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
        <div role="group" aria-label="KPI status" className="flex gap-1">
          {statusFilters.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={status === entry.id}
              onClick={() => onStatus(entry.id)}
              className={cn(
                "h-7 rounded-full border px-2.5 text-xs font-medium",
                status === entry.id
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={worstFirst}
            onChange={(event) => onWorstFirst(event.target.checked)}
          />
          Worst first
        </label>
      </div>
      <table className="w-full min-w-[980px] text-left text-[13px]">
        <thead className="border-b bg-muted/70 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="h-8 px-3 font-medium">
              Topic
            </th>
            <th scope="col" className="h-8 px-2 font-medium">
              KPI
            </th>
            <th scope="col" className="h-8 w-44 px-2 font-medium">
              Performance
            </th>
            <th scope="col" className="h-8 px-2 text-right font-medium">
              Value
            </th>
            <th scope="col" className="h-8 px-2 font-medium">
              Boundaries
            </th>
            <th scope="col" className="h-8 px-2 font-medium">
              Status
            </th>
            <th scope="col" className="h-8 px-3 font-medium">
              Measured
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-3 py-10 text-center text-muted-foreground"
              >
                No KPIs match these filters.
              </td>
            </tr>
          ) : null}
          {rows.map(({ item, kpi }, index) => {
            const repeat =
              !worstFirst && index > 0 && rows[index - 1].item.id === item.id;
            return (
              <tr key={kpi.id} className="hover:bg-muted/40">
                <td className="max-w-[280px] px-3 py-1.5">
                  {repeat ? null : (
                    <button
                      type="button"
                      onClick={() => onOpen(item.id)}
                      title={item.name}
                      className="flex max-w-[260px] items-baseline gap-2 text-left hover:underline"
                    >
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {item.code}
                      </span>
                      <span className="min-w-0 truncate font-medium">
                        {item.name}
                      </span>
                    </button>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  <span className="whitespace-nowrap">
                    {kpi.name}
                    <span
                      className="ml-1.5 text-[11px] text-muted-foreground"
                      title={
                        kpi.direction === "higher"
                          ? "Higher is better"
                          : "Lower is better"
                      }
                    >
                      <span aria-hidden="true">
                        {kpi.direction === "higher" ? "↑" : "↓"}
                      </span>
                      <span className="sr-only">
                        {kpi.direction === "higher"
                          ? "higher is better"
                          : "lower is better"}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <KpiBand indicator={kpi} />
                </td>
                <td className="px-2 py-1 text-right">
                  {canEdit ? (
                    <KpiValueInput
                      indicator={kpi}
                      label={`${kpi.name} value for ${item.code}`}
                      onSave={(patch) => onUpdate(item.id, kpi.id, patch)}
                    />
                  ) : (
                    <span className="tabular">
                      {kpi.value == null
                        ? "—"
                        : `${kpi.value}${kpi.unit === "%" ? "%" : ""}`}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground tabular">
                  {indicatorRule(kpi)}
                </td>
                <td className="px-2 py-1.5">
                  <IndicatorBadge indicator={kpi} />
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-xs text-muted-foreground tabular">
                  {kpi.measuredAt ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
