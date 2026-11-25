import { Suspense } from "react";
import { db } from "@/lib/server/db";
import { loadAlignment } from "@/lib/server/alignment";
import { loadPlanning } from "@/lib/server/planning";
import { loadCapabilities } from "@/lib/server/capabilities";
import { loadMethods } from "@/lib/server/methods";
import type { CycleSummary } from "@/lib/domain/cycle-summary";
import { readPageCycle } from "@/lib/server/snapshots";
import { requirePage } from "@/lib/server/access";
import { permits } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import {
  AlignmentWorkspace,
  type AlignmentTrend,
} from "@/components/planning/alignment-workspace";
import { MethodProvider } from "@/components/planning/method-provider";
import { HistoricalProvider } from "@/components/planning/historical-provider";
import { HistoricalUnavailable } from "@/components/planning/historical-notice";
import { SchemaPending } from "@/components/schema-pending";
export const metadata = { title: "Framework Alignment" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const user = await requirePage();
  const cycle = await readPageCycle((await searchParams).cycle);
  const [alignment, capabilities, planning] = await Promise.all([
    cycle ? Promise.resolve(cycle.dataset?.alignment ?? null) : loadAlignment(),
    cycle ? Promise.resolve(cycle.capabilities) : loadCapabilities(),
    cycle ? Promise.resolve(cycle.dataset?.planning ?? null) : loadPlanning(),
  ]);
  const methods = cycle?.methods ?? (await loadMethods());
  const captures = await db().planningCycle.findMany({
    where: cycle ? { createdAt: { lte: cycle.createdAt } } : undefined,
    select: { id: true, name: true, createdAt: true, summary: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 30,
  });
  const trends: AlignmentTrend[] = [];
  for (const c of captures) {
    const summary = c.summary as unknown as CycleSummary | null;
    if (summary?.version !== 1) continue;
    for (const point of summary.alignment)
      trends.push({
        id: c.id,
        name: c.name,
        at: c.createdAt.toISOString(),
        method: summary.method,
        ...point,
      });
  }
  const content = (
    <div className="space-y-4">
      <PageHeader
        title="Framework Alignment"
        description="Versioned requirements, organization assessments, shared capability mappings and planning coverage."
      />
      {!alignment || !capabilities ? (
        cycle ? (
          <HistoricalUnavailable />
        ) : (
          <SchemaPending />
        )
      ) : alignment.frameworks.length === 0 ? (
        <section className="rounded-md border p-6">
          <h2>Reference import pending</h2>
          <p>
            Load the reviewed, checksum-pinned NIST CSF 2.0 and FBI CJIS 6.0
            datasets using the seed workflow. No compliance or coverage is
            inferred from an empty catalogue.
          </p>
        </section>
      ) : (
        <Suspense>
          <AlignmentWorkspace
            key={cycle?.id ?? "current"}
            initial={alignment}
            capabilities={capabilities}
            planning={planning}
            canEdit={!cycle && permits(user.role, "write")}
            trends={trends}
          />
        </Suspense>
      )}
    </div>
  );
  return (
    <MethodProvider methods={methods}>
      {cycle ? (
        <HistoricalProvider cycleId={cycle.id} dataset={cycle.dataset}>
          {content}
        </HistoricalProvider>
      ) : (
        content
      )}
    </MethodProvider>
  );
}
