import { cn } from "@/lib/utils";
import type { IndicatorView } from "@/lib/domain/capabilities";

/**
 * KPI performance band: fail, at-risk and pass zones in muted status tints,
 * with a marker at the observed value. Always shown beside a text status.
 */
export function KpiBand({
  indicator,
  className,
}: {
  indicator: IndicatorView;
  className?: string;
}) {
  const { passThreshold: pass, failThreshold: fail, value } = indicator;
  const percent = indicator.unit === "%";
  const max = percent ? 100 : Math.max(pass, fail, value ?? 0) * 1.25 || 1;
  const at = (n: number) => `${Math.min(100, Math.max(0, (n / max) * 100))}%`;
  const higher = indicator.direction === "higher";
  const low = Math.min(pass, fail);
  const high = Math.max(pass, fail);
  return (
    <div
      aria-hidden="true"
      className={cn("relative h-2 w-full min-w-20 overflow-visible", className)}
    >
      <div className="absolute inset-0 flex overflow-hidden rounded-full">
        <span
          className={higher ? "bg-status-bad/25" : "bg-status-good/25"}
          style={{ width: at(low) }}
        />
        <span
          className="bg-status-warn/30"
          style={{ width: `calc(${at(high)} - ${at(low)})` }}
        />
        <span
          className={cn(
            "flex-1",
            higher ? "bg-status-good/25" : "bg-status-bad/25",
          )}
        />
      </div>
      {value != null ? (
        <span
          className="absolute top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card"
          style={{ left: at(value) }}
        />
      ) : null}
    </div>
  );
}
