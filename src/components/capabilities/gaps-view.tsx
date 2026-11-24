"use client";

import { useState } from "react";
import { LevelChip, MaturityTrack } from "@/components/analytics/maturity";
import {
  gap,
  indicatorStatus,
  reviewStatus,
  type CapabilityView,
} from "@/lib/domain/capabilities";
import { GapValue, PillarDots, ReviewBadge } from "./format";
import { EmptyRows } from "./empty-rows";

const sorts = [
  { id: "gap", label: "Largest gap first" },
  { id: "order", label: "Topic order" },
  { id: "review", label: "Review status" },
  { id: "owner", label: "Accountable owner" },
  { id: "date", label: "Target date" },
] as const;
type SortId = (typeof sorts)[number]["id"];

const reviewRank = { never: 0, overdue: 1, due: 2, current: 3 } as const;

function sortItems(items: CapabilityView[], sort: SortId, now: Date) {
  const list = [...items];
  const byOrder = (a: CapabilityView, b: CapabilityView) =>
    a.code.localeCompare(b.code);
  switch (sort) {
    case "gap":
      return list.sort(
        (a, b) =>
          (gap(b) ?? -99) - (gap(a) ?? -99) ||
          (a.currentLevel ?? 0) - (b.currentLevel ?? 0) ||
          byOrder(a, b),
      );
    case "review":
      return list.sort(
        (a, b) =>
          reviewRank[reviewStatus(a, now)] - reviewRank[reviewStatus(b, now)] ||
          (a.assessedAt ?? "").localeCompare(b.assessedAt ?? "") ||
          byOrder(a, b),
      );
    case "owner":
      return list.sort(
        (a, b) =>
          (a.ownerPersonName ?? a.accountableFunctionName ?? "~").localeCompare(
            b.ownerPersonName ?? b.accountableFunctionName ?? "~",
          ) || byOrder(a, b),
      );
    case "date":
      return list.sort(
        (a, b) =>
          (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999") ||
          byOrder(a, b),
      );
    default:
      return list.sort(byOrder);
  }
}

function quarter(date: string | null) {
  if (!date) return null;
  const [year, month] = date.split("-").map(Number);
  return `Q${Math.ceil(month / 3)} ${year}`;
}

/** Targets table: current against target, the gap, timing and ownership. */
export function GapsView({
  items,
  now,
  onOpen,
}: {
  items: CapabilityView[];
  now: Date;
  onOpen: (id: string) => void;
}) {
  const [sort, setSort] = useState<SortId>("gap");
  const sorted = sortItems(items, sort, now);
  return (
    <div className="relative overflow-x-auto rounded-md border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Dot is the assessed level, the dark tick is the target, hatching is
          the gap still to close.
        </p>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortId)}
            className="h-7 rounded-md border bg-card px-2 text-xs text-foreground"
          >
            {sorts.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <table className="w-full min-w-[980px] text-left text-[13px]">
        <thead className="border-b bg-muted/70 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="h-8 px-3 font-medium">
              Topic
            </th>
            <th scope="col" className="h-8 px-2 font-medium">
              Current
            </th>
            <th scope="col" className="h-8 w-48 px-2 font-medium">
              Current → target
            </th>
            <th scope="col" className="h-8 px-2 font-medium">
              Target
            </th>
            <th scope="col" className="h-8 px-2 text-right font-medium">
              Gap
            </th>
            <th scope="col" className="h-8 px-2 font-medium">
              By
            </th>
            <th scope="col" className="h-8 px-2 font-medium">
              KPIs passing
            </th>
            <th scope="col" className="h-8 px-2 font-medium">
              Accountable
            </th>
            <th scope="col" className="h-8 px-3 font-medium">
              Last reviewed
            </th>
          </tr>
        </thead>
        {sorted.length === 0 ? (
          <EmptyRows colSpan={9} />
        ) : (
          <tbody className="divide-y">
            {sorted.map((item) => {
              const passing = item.indicators.filter(
                (kpi) => indicatorStatus(kpi) === "pass",
              ).length;
              return (
                <tr
                  key={item.id}
                  onClick={() => onOpen(item.id)}
                  className="cursor-pointer hover:bg-muted/40"
                >
                  <td className="max-w-[300px] px-3 py-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpen(item.id);
                      }}
                      className="flex items-baseline gap-2 text-left hover:underline"
                    >
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {item.code}
                      </span>
                      <span className="font-medium leading-snug">
                        {item.name}
                      </span>
                    </button>
                    <div className="mt-0.5 pl-12">
                      <PillarDots keys={item.pillarKeys} />
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <LevelChip
                      level={item.applicable ? item.currentLevel : null}
                    />
                  </td>
                  <td className="px-2 py-2">
                    {item.applicable ? (
                      <MaturityTrack
                        current={item.currentLevel}
                        target={item.targetLevel}
                        showScale
                      />
                    ) : (
                      <span className="text-xs italic text-muted-foreground">
                        Not applicable
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <LevelChip
                      level={item.applicable ? item.targetLevel : null}
                    />
                  </td>
                  <td className="px-2 py-2 text-right tabular">
                    <GapValue value={gap(item)} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-xs tabular">
                    {quarter(item.targetDate) ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-xs tabular">
                    {passing} / {item.indicators.length}
                  </td>
                  <td className="max-w-[160px] truncate px-2 py-2 text-xs">
                    {item.ownerPersonName ?? item.accountableFunctionName ?? (
                      <span className="italic text-muted-foreground">
                        No owner
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <ReviewBadge capability={item} now={now} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        )}
      </table>
    </div>
  );
}
