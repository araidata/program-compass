"use client";

import { cn } from "@/lib/utils";
import { LevelChip, MaturityTrack } from "@/components/analytics/maturity";
import {
  byGroup,
  gap,
  indicatorStatus,
  type CapabilityView,
} from "@/lib/domain/capabilities";
import { RatingInput } from "./rating-input";
import { GapValue, PillarDots, ReviewBadge, indicatorTone } from "./format";
import type { CapabilityPatch } from "./capability-workspace";
import { EmptyRows } from "./empty-rows";

/**
 * Rating grid (P-13): topics as rows grouped by display group. Current and
 * target are keyboard radio groups; changes autosave.
 */
export function AssessmentView({
  items,
  canEdit,
  now,
  onOpen,
  onUpdate,
}: {
  items: CapabilityView[];
  canEdit: boolean;
  now: Date;
  onOpen: (id: string) => void;
  onUpdate: (id: string, patch: CapabilityPatch) => void;
}) {
  const groups = byGroup(items).filter((entry) =>
    items.some((item) => item.groupCode === entry.key),
  );
  let row = 0;
  return (
    <div className="relative overflow-x-auto rounded-md border bg-card">
      <table className="w-full min-w-[980px] text-left text-[13px]">
        <thead className="border-b bg-muted/70 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="h-8 px-3 font-medium">
              Topic
            </th>
            <th scope="col" className="h-8 px-2 font-medium">
              Current
            </th>
            <th scope="col" className="h-8 px-2 font-medium">
              Target
            </th>
            <th scope="col" className="h-8 w-36 px-2 font-medium">
              Profile
            </th>
            <th scope="col" className="h-8 px-2 text-right font-medium">
              Gap
            </th>
            <th scope="col" className="h-8 px-2 font-medium">
              KPIs
            </th>
            <th scope="col" className="h-8 px-3 font-medium">
              Accountable · review
            </th>
          </tr>
        </thead>
        {groups.length === 0 ? <EmptyRows colSpan={7} /> : null}
        {groups.map((entry) => (
          <tbody key={entry.key} className="divide-y border-b last:border-b-0">
            <tr className="bg-muted/30">
              <th
                scope="rowgroup"
                colSpan={7}
                className="h-8 px-3 text-xs font-medium"
              >
                <span className="text-foreground">{entry.name}</span>
                <span className="ml-3 font-normal text-muted-foreground tabular">
                  {entry.count} topics · average{" "}
                  {entry.averageCurrent?.toFixed(1) ?? "—"} →{" "}
                  {entry.averageTarget?.toFixed(1) ?? "—"}
                  {entry.belowTarget
                    ? ` · ${entry.belowTarget} below target`
                    : ""}
                </span>
              </th>
            </tr>
            {items
              .filter((item) => item.groupCode === entry.key)
              .map((item) => {
                const index = row++;
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "group hover:bg-muted/40",
                      !item.applicable && "text-muted-foreground",
                    )}
                  >
                    <td className="max-w-[340px] px-3 py-1.5">
                      <button
                        type="button"
                        onClick={() => onOpen(item.id)}
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
                    {item.applicable ? (
                      <>
                        <td className="px-2 py-1.5">
                          {canEdit ? (
                            <RatingInput
                              value={item.currentLevel}
                              onChange={(value) =>
                                onUpdate(item.id, { currentLevel: value })
                              }
                              label={`Current maturity for ${item.code} ${item.name}`}
                              column="current"
                              row={index}
                              onOpen={() => onOpen(item.id)}
                            />
                          ) : (
                            <ReadOnlyLevel value={item.currentLevel} />
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          {canEdit ? (
                            <RatingInput
                              value={item.targetLevel}
                              onChange={(value) =>
                                onUpdate(item.id, { targetLevel: value })
                              }
                              label={`Target maturity for ${item.code} ${item.name}`}
                              column="target"
                              row={index}
                              onOpen={() => onOpen(item.id)}
                            />
                          ) : (
                            <ReadOnlyLevel value={item.targetLevel} />
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <MaturityTrack
                            current={item.currentLevel}
                            target={item.targetLevel}
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right tabular">
                          <GapValue value={gap(item)} />
                        </td>
                      </>
                    ) : (
                      <td colSpan={4} className="px-2 py-1.5 text-xs italic">
                        Not applicable to this organization
                      </td>
                    )}
                    <td className="px-2 py-1.5">
                      <span className="flex gap-1">
                        {item.indicators.map((kpi) => {
                          const status = indicatorTone[indicatorStatus(kpi)];
                          return (
                            <span
                              key={kpi.id}
                              title={`${kpi.name}: ${status.label}${kpi.value != null ? ` (${kpi.value}${kpi.unit === "%" ? "%" : ` ${kpi.unit}`})` : ""}`}
                              className={cn(
                                "size-2.5 rounded-full",
                                status.tone === "good" && "bg-status-good",
                                status.tone === "warn" && "bg-status-warn",
                                status.tone === "bad" && "bg-status-bad",
                                status.tone === "none" &&
                                  "border border-status-none",
                              )}
                            />
                          );
                        })}
                        <span className="sr-only">
                          {item.indicators
                            .map(
                              (kpi) =>
                                `${kpi.name} ${indicatorTone[indicatorStatus(kpi)].label}`,
                            )
                            .join(", ")}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span
                        className={cn(
                          "block truncate text-xs",
                          (item.ownerPersonName ?? item.accountableFunctionName)
                            ? "text-foreground"
                            : "text-muted-foreground italic",
                        )}
                      >
                        {item.ownerPersonName ??
                          item.accountableFunctionName ??
                          "No owner"}
                      </span>
                      <ReviewBadge capability={item} now={now} />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        ))}
      </table>
      <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
        {canEdit
          ? "Click a level or focus a rating and type 1–5. Arrow keys move, 0 clears, Enter opens details. Changes save automatically."
          : "Read-only view. Editors and administrators can change ratings."}
      </p>
    </div>
  );
}

function ReadOnlyLevel({ value }: { value: number | null }) {
  return <LevelChip level={value} withName />;
}
