import { StatusBadge } from "@/components/analytics/stat";
import { PillarTag } from "@/components/pillar-tag";
import { parsePillar } from "@/lib/pillars";
import {
  indicatorStatus,
  reviewStatus,
  type CapabilityView,
  type IndicatorView,
} from "@/lib/domain/capabilities";

export function monthsSince(iso: string, now: Date): number {
  const then = new Date(iso);
  return Math.max(
    0,
    (now.getUTCFullYear() - then.getUTCFullYear()) * 12 +
      now.getUTCMonth() -
      then.getUTCMonth() -
      (now.getUTCDate() < then.getUTCDate() ? 1 : 0),
  );
}

export function ageLabel(iso: string | null, now: Date): string {
  if (!iso) return "Never";
  const months = monthsSince(iso, now);
  if (months === 0) return "This month";
  if (months < 12) return `${months} mo ago`;
  const years = Math.floor(months / 12);
  return `${years} yr${years > 1 ? "s" : ""} ago`;
}

export function ReviewBadge({
  capability,
  now,
}: {
  capability: CapabilityView;
  now: Date;
}) {
  if (!capability.applicable)
    return (
      <span className="text-xs text-muted-foreground">Not applicable</span>
    );
  const status = reviewStatus(capability, now);
  const age = ageLabel(capability.assessedAt, now);
  if (status === "never")
    return <StatusBadge tone="none">Not assessed</StatusBadge>;
  if (status === "overdue")
    return <StatusBadge tone="bad">Overdue · {age}</StatusBadge>;
  if (status === "due")
    return <StatusBadge tone="warn">Due · {age}</StatusBadge>;
  return <StatusBadge tone="good">{age}</StatusBadge>;
}

export function GapValue({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  if (value <= 0)
    return (
      <span className="text-muted-foreground" title="Meets or exceeds target">
        {value === 0 ? "0" : `+${-value} over`}
      </span>
    );
  return (
    <span
      className="font-semibold"
      title={`${value} level${value > 1 ? "s" : ""} below target`}
    >
      −{value}
    </span>
  );
}

export function PillarDots({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex flex-wrap gap-x-2 gap-y-0.5">
      {keys.length > 1 ? (
        <span
          className="text-xs text-muted-foreground"
          title="Shared across pillars"
        >
          Shared:
        </span>
      ) : null}
      {keys.map((key) => (
        <PillarTag
          key={key}
          pillar={parsePillar(key)}
          className="font-normal text-muted-foreground"
        />
      ))}
    </span>
  );
}

export const indicatorTone = {
  pass: { tone: "good", label: "Pass" },
  "at-risk": { tone: "warn", label: "At risk" },
  fail: { tone: "bad", label: "Fail" },
  missing: { tone: "none", label: "No data" },
} as const;

export function IndicatorBadge({ indicator }: { indicator: IndicatorView }) {
  const { tone, label } = indicatorTone[indicatorStatus(indicator)];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

export function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? value.toLocaleString("en-US")
    : value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** "Pass ≥ 95 · fail < 80 %" style boundary description. */
export function indicatorRule(indicator: IndicatorView): string {
  const higher = indicator.direction === "higher";
  return `Pass ${higher ? "≥" : "≤"} ${formatNumber(indicator.passThreshold)} · fail ${higher ? "<" : ">"} ${formatNumber(indicator.failThreshold)}${indicator.unit === "%" ? "%" : ` ${indicator.unit}`}`;
}
