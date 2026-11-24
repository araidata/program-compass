/**
 * Capability assessment calculations. Pure and deterministic so they are tested
 * independently of React and the database (CALCULATION_METHODOLOGY.md).
 *
 * Aggregation is an unweighted mean over capabilities that have the inputs.
 * PROVISIONAL: weights are an open methodology decision. Unassessed values are
 * excluded and reported as counts, never treated as zero.
 */
import { displayGroups } from "./catalogue";
import { REVIEW_DUE_MONTHS, REVIEW_OVERDUE_MONTHS } from "./maturity";

export type IndicatorView = {
  id: string;
  catalogueKey: string | null;
  name: string;
  unit: string;
  direction: "higher" | "lower";
  passThreshold: number;
  failThreshold: number;
  value: number | null;
  measuredAt: string | null;
};

export type CapabilityView = {
  id: string;
  code: string;
  groupCode: string;
  name: string;
  description: string | null;
  applicable: boolean;
  currentLevel: number | null;
  targetLevel: number | null;
  confidence: "low" | "medium" | "high" | null;
  rationale: string | null;
  reviewState: "draft" | "submitted" | "reviewed";
  targetDate: string | null;
  accountableFunctionId: string | null;
  accountableFunctionName: string | null;
  assessedAt: string | null;
  assessedByName: string | null;
  pillarKeys: string[];
  indicators: IndicatorView[];
};

export type ReviewStatus = "current" | "due" | "overdue" | "never";
export type IndicatorStatus = "pass" | "at-risk" | "fail" | "missing";

/** Target minus current on the same scale; null when either is unknown. */
export function gap(capability: CapabilityView): number | null {
  if (!capability.applicable) return null;
  if (capability.currentLevel == null || capability.targetLevel == null)
    return null;
  return capability.targetLevel - capability.currentLevel;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export function reviewStatus(
  capability: Pick<CapabilityView, "assessedAt">,
  now: Date,
): ReviewStatus {
  if (!capability.assessedAt) return "never";
  const assessed = new Date(capability.assessedAt);
  if (addMonths(assessed, REVIEW_OVERDUE_MONTHS) <= now) return "overdue";
  if (addMonths(assessed, REVIEW_DUE_MONTHS) <= now) return "due";
  return "current";
}

/**
 * Reference-baseline KPI rule. Higher is better: pass at or above the pass
 * boundary, fail below the fail boundary. Lower is better: pass at or below
 * the pass boundary, fail above the fail boundary. Between is at risk.
 * No observation is "missing", never a failure or zero.
 */
export function indicatorStatus(
  indicator: Pick<
    IndicatorView,
    "value" | "direction" | "passThreshold" | "failThreshold"
  >,
): IndicatorStatus {
  const { value, passThreshold, failThreshold } = indicator;
  if (value == null) return "missing";
  if (indicator.direction === "higher") {
    if (value >= passThreshold) return "pass";
    if (value < failThreshold) return "fail";
    return "at-risk";
  }
  if (value <= passThreshold) return "pass";
  if (value > failThreshold) return "fail";
  return "at-risk";
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export type Summary = {
  total: number;
  applicable: number;
  notApplicable: number;
  assessed: number;
  unassessed: number;
  averageCurrent: number | null;
  averageTarget: number | null;
  averageGap: number | null;
  belowTarget: number;
  /** Sum of positive gaps: maturity levels still to close. */
  levelsToClose: number;
  meetsTarget: number;
  noTarget: number;
  noOwner: number;
  reviewDue: number;
  reviewOverdue: number;
  indicators: {
    total: number;
    pass: number;
    atRisk: number;
    fail: number;
    missing: number;
  };
};

export function summarize(
  capabilities: readonly CapabilityView[],
  now: Date,
): Summary {
  const applicable = capabilities.filter((item) => item.applicable);
  const assessed = applicable.filter((item) => item.currentLevel != null);
  const gaps = applicable
    .map(gap)
    .filter((value): value is number => value != null);
  const indicators = applicable.flatMap((item) => item.indicators);
  const statuses = indicators.map(indicatorStatus);
  const reviews = assessed.map((item) => reviewStatus(item, now));
  return {
    total: capabilities.length,
    applicable: applicable.length,
    notApplicable: capabilities.length - applicable.length,
    assessed: assessed.length,
    unassessed: applicable.length - assessed.length,
    averageCurrent: mean(assessed.map((item) => item.currentLevel!)),
    averageTarget: mean(
      applicable
        .filter((item) => item.targetLevel != null)
        .map((item) => item.targetLevel!),
    ),
    averageGap: mean(gaps),
    belowTarget: gaps.filter((value) => value > 0).length,
    levelsToClose: gaps
      .filter((value) => value > 0)
      .reduce((sum, value) => sum + value, 0),
    meetsTarget: gaps.filter((value) => value <= 0).length,
    noTarget: applicable.filter((item) => item.targetLevel == null).length,
    noOwner: applicable.filter((item) => !item.accountableFunctionId).length,
    reviewDue: reviews.filter((value) => value === "due").length,
    reviewOverdue: reviews.filter((value) => value === "overdue").length,
    indicators: {
      total: indicators.length,
      pass: statuses.filter((value) => value === "pass").length,
      atRisk: statuses.filter((value) => value === "at-risk").length,
      fail: statuses.filter((value) => value === "fail").length,
      missing: statuses.filter((value) => value === "missing").length,
    },
  };
}

export type Distribution = {
  current: number[];
  target: number[];
  unassessed: number;
  noTarget: number;
};

/** Counts per level 1..5 (index 0 is level 1) for applicable capabilities. */
export function distribution(
  capabilities: readonly CapabilityView[],
): Distribution {
  const current = [0, 0, 0, 0, 0];
  const target = [0, 0, 0, 0, 0];
  let unassessed = 0;
  let noTarget = 0;
  for (const item of capabilities) {
    if (!item.applicable) continue;
    if (item.currentLevel == null) unassessed += 1;
    else current[item.currentLevel - 1] += 1;
    if (item.targetLevel == null) noTarget += 1;
    else target[item.targetLevel - 1] += 1;
  }
  return { current, target, unassessed, noTarget };
}

export type GroupSummary = {
  key: string;
  name: string;
  count: number;
  assessed: number;
  averageCurrent: number | null;
  averageTarget: number | null;
  averageGap: number | null;
  belowTarget: number;
  weakest: CapabilityView | null;
};

function group(
  key: string,
  name: string,
  items: readonly CapabilityView[],
): GroupSummary {
  const applicable = items.filter((item) => item.applicable);
  const assessed = applicable.filter((item) => item.currentLevel != null);
  const gaps = applicable
    .map(gap)
    .filter((value): value is number => value != null);
  const weakest =
    [...assessed].sort(
      (a, b) =>
        a.currentLevel! - b.currentLevel! ||
        (gap(b) ?? 0) - (gap(a) ?? 0) ||
        a.code.localeCompare(b.code),
    )[0] ?? null;
  return {
    key,
    name,
    count: applicable.length,
    assessed: assessed.length,
    averageCurrent: mean(assessed.map((item) => item.currentLevel!)),
    averageTarget: mean(
      applicable
        .filter((item) => item.targetLevel != null)
        .map((item) => item.targetLevel!),
    ),
    averageGap: mean(gaps),
    belowTarget: gaps.filter((value) => value > 0).length,
    weakest,
  };
}

/** Summary per reference display group (not official CSF functions). */
export function byGroup(
  capabilities: readonly CapabilityView[],
): GroupSummary[] {
  return displayGroups.map((entry) =>
    group(
      entry.code,
      entry.name,
      capabilities.filter((item) => item.groupCode === entry.code),
    ),
  );
}

/** A capability shared by several pillars counts once in each pillar. */
export function byPillar(
  capabilities: readonly CapabilityView[],
  pillars: readonly { key: string; name: string }[],
): GroupSummary[] {
  return pillars.map((pillar) =>
    group(
      pillar.key,
      pillar.name,
      capabilities.filter((item) => item.pillarKeys.includes(pillar.key)),
    ),
  );
}

/** Assessed capabilities that meet their target, strongest first. */
export function strengths(
  capabilities: readonly CapabilityView[],
  limit = 5,
): CapabilityView[] {
  return capabilities
    .filter(
      (item) =>
        item.applicable &&
        item.currentLevel != null &&
        (item.targetLevel == null
          ? item.currentLevel >= 4
          : item.currentLevel >= item.targetLevel),
    )
    .sort(
      (a, b) =>
        b.currentLevel! - a.currentLevel! ||
        (gap(a) ?? 0) - (gap(b) ?? 0) ||
        a.code.localeCompare(b.code),
    )
    .slice(0, limit);
}

/** Largest gaps to target first; ties go to the lower current level. */
export function weaknesses(
  capabilities: readonly CapabilityView[],
  limit = 5,
): CapabilityView[] {
  return capabilities
    .filter((item) => (gap(item) ?? 0) > 0)
    .sort(
      (a, b) =>
        gap(b)! - gap(a)! ||
        a.currentLevel! - b.currentLevel! ||
        a.code.localeCompare(b.code),
    )
    .slice(0, limit);
}

/** Deficiency: assessed at level 1 or 2 while applicable. */
export const DEFICIENCY_MAX_LEVEL = 2;

export function deficiencies(
  capabilities: readonly CapabilityView[],
): CapabilityView[] {
  return capabilities
    .filter(
      (item) =>
        item.applicable &&
        item.currentLevel != null &&
        item.currentLevel <= DEFICIENCY_MAX_LEVEL,
    )
    .sort(
      (a, b) =>
        a.currentLevel! - b.currentLevel! ||
        (gap(b) ?? 0) - (gap(a) ?? 0) ||
        a.code.localeCompare(b.code),
    );
}

export const quickFilters = [
  { id: "all", label: "All" },
  { id: "below", label: "Below target" },
  { id: "unassessed", label: "Not assessed" },
  { id: "no-target", label: "No target" },
  { id: "review", label: "Review due" },
  { id: "no-owner", label: "No owner" },
  { id: "na", label: "Not applicable" },
] as const;

export type QuickFilter = (typeof quickFilters)[number]["id"];

export function matchesFilter(
  capability: CapabilityView,
  filter: QuickFilter,
  now: Date,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "na":
      return !capability.applicable;
    case "below":
      return (gap(capability) ?? 0) > 0;
    case "unassessed":
      return capability.applicable && capability.currentLevel == null;
    case "no-target":
      return capability.applicable && capability.targetLevel == null;
    case "review": {
      const status = reviewStatus(capability, now);
      return (
        capability.applicable &&
        capability.currentLevel != null &&
        (status === "due" || status === "overdue")
      );
    }
    case "no-owner":
      return capability.applicable && !capability.accountableFunctionId;
  }
}

export function formatLevel(value: number | null, digits = 1): string {
  return value == null ? "—" : value.toFixed(digits);
}
