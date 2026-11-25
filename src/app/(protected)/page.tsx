import { OverviewPlanning } from "@/components/planning/overview-planning";
import { db } from "@/lib/server/db";
import { captureDataset } from "@/lib/server/snapshots";
import { readPageCycle } from "@/lib/server/snapshots";
import { MethodProvider } from "@/components/planning/method-provider";
import { DemoNotice } from "@/components/demo-notice";
import Link from "next/link";
import { parsePillar, pillars, withScope, PILLAR_PARAM } from "@/lib/pillars";
import { PageHeader } from "@/components/page-header";
import { Meter, Panel, Stat, StatStrip } from "@/components/analytics/stat";
import {
  DistributionChart,
  GroupProfile,
  TopicList,
} from "@/components/analytics/capability-charts";
import { StatusBadge } from "@/components/analytics/stat";
import { requirePage } from "@/lib/server/access";
import { hasDemoData, loadCapabilities } from "@/lib/server/capabilities";
import { SchemaPending } from "@/components/schema-pending";
import {
  byGroup,
  byPillar,
  deficiencies,
  distribution,
  gap,
  indicatorStatus,
  reviewStatus,
  strengths,
  summarize,
  weaknesses,
  type CapabilityView,
} from "@/lib/domain/capabilities";

type Attention = { item: CapabilityView; reason: string; tone: "bad" | "warn" };

function attention(items: CapabilityView[], now: Date): Attention[] {
  const list: Attention[] = [];
  for (const item of items) {
    if (!item.applicable) continue;
    const failing = item.indicators.filter(
      (kpi) => indicatorStatus(kpi) === "fail",
    ).length;
    const review = reviewStatus(item, now);
    const itemGap = gap(item) ?? 0;
    if (item.currentLevel != null && item.currentLevel <= 2 && itemGap > 0)
      list.push({
        item,
        reason: `Level ${item.currentLevel}, ${itemGap} below target`,
        tone: "bad",
      });
    else if (failing > 0)
      list.push({
        item,
        reason: `${failing} KPI${failing === 1 ? "" : "s"} failing`,
        tone: "bad",
      });
    else if (review === "overdue")
      list.push({ item, reason: "Review overdue", tone: "bad" });
    else if (item.currentLevel == null)
      list.push({ item, reason: "Not assessed", tone: "warn" });
    else if (!item.ownerPersonId && !item.accountableFunctionId)
      list.push({ item, reason: "No accountable owner", tone: "warn" });
  }
  const rank = (entry: Attention) => (entry.tone === "bad" ? 0 : 1);
  return list
    .sort((a, b) => rank(a) - rank(b) || a.item.code.localeCompare(b.item.code))
    .slice(0, 8);
}

export default async function Overview({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePage();
  const search = await searchParams;
  const cycle = await readPageCycle(
    typeof search.cycle === "string" ? search.cycle : undefined,
  );
  const raw = search[PILLAR_PARAM];
  const scope = parsePillar(typeof raw === "string" ? raw : null);
  const now = cycle ? cycle.createdAt : new Date();
  const loaded = cycle ? cycle.capabilities : await loadCapabilities();
  const synthetic = cycle
    ? cycle.capabilities.some(
        (c) => c.rationale === "Synthetic development rating.",
      )
    : loaded != null && (await hasDemoData());
  const planningData = cycle
    ? cycle.dataset
    : loaded
      ? await db().$transaction((tx) => captureDataset(tx), {
          isolationLevel: "RepeatableRead",
          timeout: 60000,
          maxWait: 10000,
        })
      : null;
  const all = loaded ?? [];
  const items = scope
    ? all.filter((item) => item.pillarKeys.includes(scope.id))
    : all;
  const summary = summarize(items, now);
  const base = withScope(
    cycle ? `/capabilities?cycle=${cycle.id}` : "/capabilities",
    scope,
  );
  const join = base.includes("?") ? "&" : "?";
  const to = (query: string) => `${base}${join}${query}`;
  const link = { href: (item: CapabilityView) => to(`topic=${item.id}`) };
  const deficient = deficiencies(items);
  const watch = attention(items, now);

  const content = (
    <div className="space-y-4">
      <PageHeader
        title="Overview"
        description="Program position for the selected scope, built from recorded assessments and KPI measurements."
      />

      {synthetic ? <DemoNotice /> : null}
      {loaded == null ? (
        <SchemaPending />
      ) : summary.assessed === 0 ? (
        <section className="rounded-md border bg-card px-4 py-6">
          <h2>No assessments recorded yet</h2>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Rate current and target maturity for each topic to see posture, gaps
            and KPI performance here. Figures are never estimated.
          </p>
          <Link
            href={base}
            className="mt-3 inline-block text-[13px] font-medium text-link hover:underline"
          >
            Start the assessment in Capabilities
          </Link>
        </section>
      ) : (
        <>
          <StatStrip>
            <Stat
              label="Average maturity"
              value={summary.averageCurrent?.toFixed(1) ?? "—"}
              unit="of 5"
              detail={
                summary.averageTarget != null
                  ? `Target ${summary.averageTarget.toFixed(1)}`
                  : "No targets set"
              }
              href={to("view=analysis")}
            />
            <Stat
              label="Assessed"
              value={
                <>
                  {summary.assessed}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {summary.applicable}
                  </span>
                </>
              }
              detail={
                summary.unassessed
                  ? `${summary.unassessed} not assessed`
                  : "All topics rated"
              }
              tone={summary.unassessed ? "warn" : "neutral"}
              href={to("filter=unassessed")}
            >
              <Meter
                value={summary.assessed}
                max={summary.applicable}
                label="Assessment coverage"
              />
            </Stat>
            <Stat
              label="Below target"
              value={summary.belowTarget}
              detail={`${summary.levelsToClose} levels to close`}
              tone={summary.belowTarget ? "bad" : "neutral"}
              href={to("view=gaps&filter=below")}
            />
            <Stat
              label="Deficiencies"
              value={deficient.length}
              detail="Assessed at level 1 or 2"
              tone={deficient.length ? "bad" : "neutral"}
              href={to("view=analysis")}
            />
            <Stat
              label="KPIs passing"
              value={
                <>
                  {summary.indicators.pass}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {summary.indicators.total}
                  </span>
                </>
              }
              detail={`${summary.indicators.fail} fail · ${summary.indicators.atRisk} at risk · ${summary.indicators.missing} no data`}
              tone={
                summary.indicators.fail
                  ? "bad"
                  : summary.indicators.atRisk
                    ? "warn"
                    : "neutral"
              }
              href={to("view=performance")}
            />
            <Stat
              label="Review due"
              value={summary.reviewDue + summary.reviewOverdue}
              detail={`${summary.reviewOverdue} overdue`}
              tone={
                summary.reviewOverdue
                  ? "bad"
                  : summary.reviewDue
                    ? "warn"
                    : "neutral"
              }
              href={to("filter=review")}
            />
          </StatStrip>

          <div className="grid gap-4 xl:grid-cols-5">
            <Panel
              title="Maturity by group"
              description="Average current against target. Select a weakest topic to open it."
              className="xl:col-span-3"
            >
              <GroupProfile groups={byGroup(items)} link={link} />
            </Panel>
            <Panel
              title="Needs attention"
              description="Deficient, failing, overdue, unrated or unowned topics."
              className="xl:col-span-2"
            >
              {watch.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Nothing needs attention.
                </p>
              ) : (
                <ul className="divide-y">
                  {watch.map(({ item, reason, tone }) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-4 py-2"
                    >
                      <Link
                        href={link.href(item)}
                        className="flex min-w-0 items-baseline gap-2 text-[13px] hover:underline"
                      >
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                          {item.code}
                        </span>
                        <span className="truncate">{item.name}</span>
                      </Link>
                      <StatusBadge tone={tone}>{reason}</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {scope ? null : (
            <Panel
              title="Maturity by pillar"
              description="Shared topics count once in each pillar they involve."
            >
              <GroupProfile
                groups={byPillar(
                  items,
                  pillars.map((pillar) => ({
                    key: pillar.id,
                    name: pillar.name,
                  })),
                )}
                link={link}
                pillarLabels
              />
            </Panel>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Largest gaps" description="Furthest below target.">
              <TopicList
                items={weaknesses(items)}
                link={link}
                metric="gap"
                empty="No topic is below target."
              />
            </Panel>
            <Panel
              title="Strengths"
              description="At or above target, strongest first."
            >
              <TopicList
                items={strengths(items)}
                link={link}
                metric="level"
                empty="No topic meets its target yet."
              />
            </Panel>
            <Panel
              title="Distribution"
              description="Topics per maturity level."
            >
              <DistributionChart distribution={distribution(items)} />
            </Panel>
          </div>
        </>
      )}

      <OverviewPlanning
        data={planningData}
        scope={scope}
        cycleId={cycle?.id ?? null}
      />
    </div>
  );
  return cycle ? (
    <MethodProvider methods={cycle.methods}>{content}</MethodProvider>
  ) : (
    content
  );
}
