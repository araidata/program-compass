"use client";

import { Panel } from "@/components/analytics/stat";
import {
  DistributionChart,
  GroupProfile,
  TopicList,
} from "@/components/analytics/capability-charts";
import { KpiBand } from "@/components/analytics/kpi-band";
import { pillars } from "@/lib/pillars";
import {
  byGroup,
  byPillar,
  deficiencies,
  distribution,
  indicatorStatus,
  strengths,
  weaknesses,
  type CapabilityView,
} from "@/lib/domain/capabilities";
import { IndicatorBadge, indicatorRule } from "./format";

export function AnalysisView({
  items,
  enterprise,
  onOpen,
}: {
  items: CapabilityView[];
  enterprise: boolean;
  onOpen: (id: string) => void;
}) {
  const link = { onOpen };
  const failing = items
    .filter((item) => item.applicable)
    .flatMap((item) =>
      item.indicators.map((kpi) => ({
        item,
        kpi,
        status: indicatorStatus(kpi),
      })),
    )
    .filter((row) => row.status === "fail")
    .sort((a, b) => a.item.code.localeCompare(b.item.code));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-5">
        <Panel
          title="Maturity by group"
          description="Average current and target per reference display group. Unassessed topics are excluded from averages."
          className="xl:col-span-3"
        >
          <GroupProfile groups={byGroup(items)} link={link} />
        </Panel>
        <Panel
          title="Distribution"
          description="Topics per level, current against target."
          className="xl:col-span-2"
        >
          <DistributionChart distribution={distribution(items)} />
        </Panel>
      </div>
      {enterprise ? (
        <Panel
          title="Maturity by pillar"
          description="A topic shared by several pillars counts once in each pillar and once in enterprise totals."
        >
          <GroupProfile
            groups={byPillar(
              items,
              pillars.map((pillar) => ({ key: pillar.id, name: pillar.name })),
            )}
            link={link}
            pillarLabels
          />
        </Panel>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
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
        <Panel title="Largest gaps" description="Furthest below target.">
          <TopicList
            items={weaknesses(items)}
            link={link}
            metric="gap"
            empty="No topic is below target."
          />
        </Panel>
        <Panel
          title="Deficiencies"
          description="Assessed at level 1 Initial or 2 Developing."
        >
          <TopicList
            items={deficiencies(items)}
            link={link}
            metric="level"
            empty="No topic is assessed below level 3."
          />
        </Panel>
      </div>
      <Panel
        title="Failing KPIs"
        description="KPIs outside their fail boundary. At-risk and no-data KPIs are on the KPI performance tab."
      >
        {failing.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            No KPI is failing.
          </p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <tbody className="divide-y">
              {failing.map(({ item, kpi }) => (
                <tr key={kpi.id}>
                  <td className="max-w-[260px] px-4 py-2">
                    <button
                      type="button"
                      onClick={() => onOpen(item.id)}
                      className="flex items-baseline gap-2 text-left hover:underline"
                    >
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {item.code}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </button>
                  </td>
                  <td className="px-2 py-2">{kpi.name}</td>
                  <td className="w-40 px-2 py-2">
                    <KpiBand indicator={kpi} />
                  </td>
                  <td className="px-2 py-2 text-right font-medium tabular">
                    {kpi.value}
                    {kpi.unit === "%" ? "%" : ` ${kpi.unit}`}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-xs text-muted-foreground tabular">
                    {indicatorRule(kpi)}
                  </td>
                  <td className="px-4 py-2">
                    <IndicatorBadge indicator={kpi} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      <p className="text-[11px] text-muted-foreground">
        Averages are unweighted means of assessed, applicable topics. Scale,
        weighting and review cadence are provisional until approved (see
        CALCULATION_METHODOLOGY.md). Maturity is not a compliance determination.
      </p>
    </div>
  );
}
