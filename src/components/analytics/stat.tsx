import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * One figure in a module's summary strip. When `href` or `onSelect` is set the
 * figure applies the matching filter (UX_REVIEW section 4).
 */
export function Stat({
  label,
  value,
  unit,
  detail,
  tone = "neutral",
  href,
  onSelect,
  active = false,
  children,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  detail?: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
  href?: string;
  onSelect?: () => void;
  active?: boolean;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {tone !== "neutral" ? (
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              tone === "good" && "bg-status-good",
              tone === "warn" && "bg-status-warn",
              tone === "bad" && "bg-status-bad",
            )}
          />
        ) : null}
        {label}
      </span>
      <span className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-semibold tracking-tight tabular">
          {value}
        </span>
        {unit ? (
          <span className="text-xs text-muted-foreground">{unit}</span>
        ) : null}
      </span>
      {detail ? (
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {detail}
        </span>
      ) : null}
      {children ? <span className="mt-2 block">{children}</span> : null}
    </>
  );
  const className = cn(
    "block min-w-0 bg-card px-4 py-3 text-left",
    (href || onSelect) && "transition-colors hover:bg-muted/50",
    active && "bg-accent/60 shadow-[inset_0_-2px_0_var(--ring)]",
  );
  if (href)
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  if (onSelect)
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className={className}
      >
        {body}
      </button>
    );
  return <div className={className}>{body}</div>;
}

/** Hairline-separated row of figures; reads as one instrument panel. */
export function StatStrip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border md:grid-cols-3 xl:grid-cols-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Meter({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <span
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="block h-1 overflow-hidden rounded-full bg-track"
    >
      <span
        className="block h-full rounded-full bg-level-4"
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <section
      aria-labelledby={id}
      className={cn("min-w-0 rounded-md border bg-card", className)}
    >
      <header className="flex items-start justify-between gap-3 border-b px-4 py-2.5">
        <div className="min-w-0">
          <h2 id={id}>{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </header>
      {/* Wide tables scroll inside the panel instead of overflowing it. */}
      <div className="relative overflow-x-auto">{children}</div>
    </section>
  );
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: "good" | "warn" | "bad" | "none";
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          tone === "good" && "bg-status-good",
          tone === "warn" && "bg-status-warn",
          tone === "bad" && "bg-status-bad",
          tone === "none" && "bg-status-none",
        )}
      />
      {children}
    </span>
  );
}
