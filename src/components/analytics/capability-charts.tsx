import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DistributionBar,
  LevelChip,
  MaturityTrack,
} from "@/components/analytics/maturity";
import { PillarTag } from "@/components/pillar-tag";
import { parsePillar } from "@/lib/pillars";
import { ConfiguredLevelName } from "@/components/planning/method-provider";
import { levelFill } from "@/lib/domain/maturity";
import {
  gap,
  type CapabilityView,
  type Distribution,
  type GroupSummary,
} from "@/lib/domain/capabilities";

/** Either an in-page action or a link; works in server and client trees. */
export type TopicLink = {
  href?: (item: CapabilityView) => string;
  onOpen?: (id: string) => void;
};

function TopicName({
  item,
  link,
  className,
}: {
  item: CapabilityView;
  link: TopicLink;
  className?: string;
}) {
  const content = (
    <>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
        {item.code}
      </span>
      <span className="truncate">{item.name}</span>
    </>
  );
  const classes = cn(
    "flex min-w-0 items-baseline gap-2 text-left hover:underline",
    className,
  );
  if (link.href)
    return (
      <Link href={link.href(item)} className={classes}>
        {content}
      </Link>
    );
  return (
    <button
      type="button"
      onClick={() => link.onOpen?.(item.id)}
      className={classes}
    >
      {content}
    </button>
  );
}

/**
 * Maturity profile: one row per group with average current and target on the
 * shared 1–5 track, plus the weakest topic. Equivalent figures are in text.
 */
export function GroupProfile({
  groups,
  link,
  pillarLabels = false,
}: {
  groups: GroupSummary[];
  link: TopicLink;
  pillarLabels?: boolean;
}) {
  return (
    <table className="w-full text-left text-[13px]">
      <thead className="text-xs text-muted-foreground">
        <tr className="border-b">
          <th scope="col" className="h-8 px-4 font-medium">
            {pillarLabels ? "Pillar" : "Group"}
          </th>
          <th scope="col" className="h-8 w-[38%] px-2 font-medium">
            <span className="sr-only">Average current to target</span>
            <span
              aria-hidden="true"
              className="flex justify-between px-1.5 text-[10px] tabular"
            >
              {[1, 2, 3, 4, 5].map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </span>
          </th>
          <th scope="col" className="h-8 px-2 text-right font-medium">
            Current
          </th>
          <th scope="col" className="h-8 px-2 text-right font-medium">
            Target
          </th>
          <th scope="col" className="h-8 px-2 text-right font-medium">
            Below
          </th>
          <th scope="col" className="h-8 px-4 font-medium">
            Weakest topic
          </th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {groups.map((entry) => (
          <tr key={entry.key}>
            <th scope="row" className="whitespace-nowrap px-4 py-2 font-medium">
              {pillarLabels ? (
                <PillarTag
                  pillar={parsePillar(entry.key)}
                  label="name"
                  className="text-[13px]"
                />
              ) : (
                entry.name
              )}
              <span className="ml-2 text-xs font-normal text-muted-foreground tabular">
                {entry.assessed}/{entry.count}
              </span>
            </th>
            <td className="px-2 py-2">
              <MaturityTrack
                current={entry.averageCurrent}
                target={entry.averageTarget}
              />
            </td>
            <td className="px-2 py-2 text-right font-medium tabular">
              {entry.averageCurrent?.toFixed(1) ?? "—"}
            </td>
            <td className="px-2 py-2 text-right text-muted-foreground tabular">
              {entry.averageTarget?.toFixed(1) ?? "—"}
            </td>
            <td className="px-2 py-2 text-right tabular">
              {entry.belowTarget}
            </td>
            <td className="max-w-[220px] px-4 py-2">
              {entry.weakest ? (
                <span className="flex items-center gap-2">
                  <LevelChip level={entry.weakest.currentLevel} />
                  <TopicName
                    item={entry.weakest}
                    link={link}
                    className="text-xs"
                  />
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  No ratings
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Current and target distributions with an exact-count table beneath. */
export function DistributionChart({
  distribution,
}: {
  distribution: Distribution;
}) {
  return (
    <div className="space-y-3 px-4 py-3">
      <DistributionBar
        counts={distribution.current}
        unassessed={distribution.unassessed}
        label="Current"
      />
      <DistributionBar
        counts={distribution.target}
        unassessed={distribution.noTarget}
        label="Target"
      />
      <table className="w-full text-xs tabular">
        <caption className="sr-only">Topics per maturity level</caption>
        <thead className="text-muted-foreground">
          <tr>
            <th scope="col" className="w-14 py-1 text-left font-medium">
              Level
            </th>
            {[1, 2, 3, 4, 5].map((level) => (
              <th
                key={level}
                scope="col"
                className="py-1 text-right font-medium"
                title={`Level ${level}`}
              >
                <span className="inline-flex items-center gap-1">
                  <span
                    aria-hidden="true"
                    className={cn("size-2 rounded-sm", levelFill[level])}
                  />
                  {level}
                  <span className="sr-only">
                    {" "}
                    <ConfiguredLevelName level={level} />
                  </span>
                </span>
              </th>
            ))}
            <th scope="col" className="py-1 text-right font-medium">
              <span className="inline-flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="unassessed-fill size-2 rounded-sm"
                />
                Unset
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <th
              scope="row"
              className="py-1 text-left font-normal text-muted-foreground"
            >
              Current
            </th>
            {distribution.current.map((count, index) => (
              <td key={index} className="py-1 text-right">
                {count}
              </td>
            ))}
            <td className="py-1 text-right">{distribution.unassessed}</td>
          </tr>
          <tr className="border-t">
            <th
              scope="row"
              className="py-1 text-left font-normal text-muted-foreground"
            >
              Target
            </th>
            {distribution.target.map((count, index) => (
              <td key={index} className="py-1 text-right">
                {count}
              </td>
            ))}
            <td className="py-1 text-right">{distribution.noTarget}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Ranked topic list used for strengths, gaps and deficiencies. */
export function TopicList({
  items,
  link,
  empty,
  metric,
}: {
  items: CapabilityView[];
  link: TopicLink;
  empty: string;
  metric: "gap" | "level";
}) {
  if (items.length === 0)
    return (
      <p className="px-4 py-6 text-center text-xs text-muted-foreground">
        {empty}
      </p>
    );
  return (
    <ol className="divide-y">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 px-4 py-2">
          <TopicName item={item} link={link} className="flex-1 text-[13px]" />
          <MaturityTrack
            current={item.currentLevel}
            target={item.targetLevel}
            className="w-24 shrink-0"
          />
          <span className="w-14 shrink-0 text-right text-xs tabular">
            {metric === "gap" ? (
              <span className="font-semibold">−{gap(item)}</span>
            ) : (
              <span>
                {item.currentLevel}
                <span className="text-muted-foreground">
                  {" "}
                  / {item.targetLevel ?? "—"}
                </span>
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
