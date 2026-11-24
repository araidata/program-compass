/**
 * Maturity scale. PROVISIONAL: the scale is an open decision (UX_REVIEW section 8).
 * Version is stored with every assessment so a later approved scale can be
 * distinguished from ratings made against this one.
 */
export const SCALE_VERSION = "provisional-1";
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;

export const maturityLevels = [
  {
    level: 1,
    name: "Initial",
    definition:
      "Ad hoc and reactive. Outcomes depend on individuals; little documentation.",
  },
  {
    level: 2,
    name: "Developing",
    definition:
      "Partly documented and repeatable in places, but applied inconsistently.",
  },
  {
    level: 3,
    name: "Defined",
    definition:
      "Documented, standardized and consistently applied across the scope.",
  },
  {
    level: 4,
    name: "Managed",
    definition:
      "Measured with indicators, monitored, and corrected when it drifts.",
  },
  {
    level: 5,
    name: "Optimized",
    definition:
      "Continuously improved from measurement, lessons learned and threat change.",
  },
] as const;

export type Level = 1 | 2 | 3 | 4 | 5;

export function levelName(level: number | null | undefined): string {
  if (level == null) return "Not assessed";
  return maturityLevels.find((entry) => entry.level === level)?.name ?? "—";
}

export function isLevel(value: unknown): value is Level {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_LEVEL &&
    value <= MAX_LEVEL
  );
}

/**
 * Review cadence. PROVISIONAL: P-13 leaves the cadence value to Aaron. These
 * months match the reference application's observable rule.
 */
export const REVIEW_DUE_MONTHS = 6;
export const REVIEW_OVERDUE_MONTHS = 12;
