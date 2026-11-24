import { cn } from "@/lib/utils";
import { levelName, maturityLevels } from "@/lib/domain/maturity";

export const levelFill: Record<number, string> = {
  1: "bg-level-1",
  2: "bg-level-2",
  3: "bg-level-3",
  4: "bg-level-4",
  5: "bg-level-5",
};

/** Ink that keeps AA contrast on each level fill. */
export const levelInk: Record<number, string> = {
  1: "text-foreground",
  2: "text-foreground",
  3: "text-white",
  4: "text-white",
  5: "text-white",
};

const position = (level: number) => ((level - 1) / 4) * 100;
const show = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/**
 * Current-to-target maturity on the 1–5 scale. Filled dot is the assessed
 * level, the dark tick is the target, the band between them is the gap.
 * Always paired with an accessible text label.
 */
export function MaturityTrack({
  current,
  target,
  className,
  showScale = false,
}: {
  current: number | null;
  target: number | null;
  className?: string;
  showScale?: boolean;
}) {
  const label =
    current == null
      ? `Not assessed${target != null ? `, target ${target}` : ""}`
      : `Current ${show(current)} ${levelName(Math.round(current))}${
          target != null
            ? `, target ${show(target)} ${levelName(Math.round(target))}`
            : ", no target"
        }`;
  const low =
    current != null && target != null ? Math.min(current, target) : null;
  const high =
    current != null && target != null ? Math.max(current, target) : null;
  const behind = current != null && target != null && target > current;
  return (
    <div className={cn("w-full min-w-24", className)}>
      <div role="img" aria-label={label} title={label} className="relative h-4">
        <div className="absolute inset-x-1.5 top-1/2 h-1 -translate-y-1/2 rounded-full bg-track" />
        <div className="absolute inset-x-1.5 top-1/2 -translate-y-1/2">
          {[1, 2, 3, 4, 5].map((tick) => (
            <span
              key={tick}
              className="absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border"
              style={{ left: `${position(tick)}%` }}
            />
          ))}
          {low != null && high != null && low !== high ? (
            <span
              className={cn(
                "absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full",
                behind ? "gap-band" : "bg-level-2",
              )}
              style={{
                left: `${position(low)}%`,
                width: `${position(high) - position(low)}%`,
              }}
            />
          ) : null}
          {target != null ? (
            <span
              className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-target"
              style={{ left: `${position(target)}%` }}
            />
          ) : null}
          {current != null ? (
            <span
              className={cn(
                "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card",
                levelFill[Math.round(current)],
              )}
              style={{ left: `${position(current)}%` }}
            />
          ) : null}
        </div>
      </div>
      {showScale ? (
        <div className="relative mx-1.5 mt-0.5 h-3 text-[10px] text-muted-foreground tabular">
          {[1, 2, 3, 4, 5].map((tick) => (
            <span
              key={tick}
              className="absolute -translate-x-1/2"
              style={{ left: `${position(tick)}%` }}
            >
              {tick}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Level as a compact chip: number on its sequential fill plus the name. */
export function LevelChip({
  level,
  withName = false,
}: {
  level: number | null;
  withName?: boolean;
}) {
  if (level == null)
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className="inline-flex size-5 items-center justify-center rounded border border-dashed text-[11px]">
          –
        </span>
        {withName ? <span className="text-xs">Not assessed</span> : null}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5" title={levelName(level)}>
      <span
        className={cn(
          "inline-flex size-5 items-center justify-center rounded text-[11px] font-semibold tabular",
          levelFill[level],
          levelInk[level],
        )}
      >
        {level}
      </span>
      {withName ? <span className="text-xs">{levelName(level)}</span> : null}
    </span>
  );
}

export function MaturityLegend({ className }: { className?: string }) {
  return (
    <dl className={cn("grid gap-2 sm:grid-cols-5", className)}>
      {maturityLevels.map((entry) => (
        <div key={entry.level} className="flex gap-2">
          <dt className="shrink-0">
            <LevelChip level={entry.level} />
          </dt>
          <dd className="min-w-0">
            <span className="block text-xs font-medium">{entry.name}</span>
            <span className="block text-[11px] leading-snug text-muted-foreground">
              {entry.definition}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Stacked distribution across levels 1–5 plus unassessed. */
export function DistributionBar({
  counts,
  unassessed,
  label,
}: {
  counts: number[];
  unassessed: number;
  label: string;
}) {
  const total = counts.reduce((sum, value) => sum + value, 0) + unassessed;
  const segments = [
    ...counts.map((count, index) => ({
      key: `l${index + 1}`,
      count,
      className: levelFill[index + 1],
      name: `${index + 1} ${levelName(index + 1)}`,
    })),
    {
      key: "none",
      count: unassessed,
      className: "unassessed-fill",
      name: label === "Target" ? "No target" : "Not assessed",
    },
  ].filter((segment) => segment.count > 0);
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      <div className="flex h-5 flex-1 gap-0.5 overflow-hidden rounded">
        {total === 0 ? <div className="flex-1 bg-track" /> : null}
        {segments.map((segment) => (
          <div
            key={segment.key}
            title={`${segment.name}: ${segment.count}`}
            className={cn("min-w-1.5", segment.className)}
            style={{ flexGrow: segment.count }}
          />
        ))}
      </div>
    </div>
  );
}
