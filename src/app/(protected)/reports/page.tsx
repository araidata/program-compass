import { ScopedLink } from "@/components/scoped-link";
import { Suspense } from "react";
import { requirePage } from "@/lib/server/access";
import { db } from "@/lib/server/db";
import { captureDataset, readPageCycle } from "@/lib/server/snapshots";
import { PageHeader } from "@/components/page-header";
import { ReportsWorkspace } from "@/components/planning/reports-workspace";
import { MethodProvider } from "@/components/planning/method-provider";
import { HistoricalProvider } from "@/components/planning/historical-provider";
import { HistoricalUnavailable } from "@/components/planning/historical-notice";
export const metadata = { title: "Leadership reports" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  await requirePage();
  const cycle = await readPageCycle((await searchParams).cycle);
  const data = cycle
    ? cycle.dataset
    : await db().$transaction((tx) => captureDataset(tx), {
        isolationLevel: "RepeatableRead",
        timeout: 60_000,
        maxWait: 10_000,
      });
  const content = (
    <div className="space-y-4">
      <PageHeader
        title="Leadership reports"
        description="Reconciled executive and management planning packs with source drilldowns, CSV and multipage print."
      />
      <ScopedLink
        href="/reports/data"
        className="print-hidden text-sm text-link underline"
      >
        Relational JSON export / validated atomic import
      </ScopedLink>
      {data ? (
        <Suspense>
          <ReportsWorkspace key={cycle?.id ?? "current"} data={data} />
        </Suspense>
      ) : (
        <HistoricalUnavailable />
      )}
    </div>
  );
  return data ? (
    <MethodProvider methods={data.methods}>
      {cycle ? (
        <HistoricalProvider cycleId={cycle.id} dataset={data}>
          {content}
        </HistoricalProvider>
      ) : (
        content
      )}
    </MethodProvider>
  ) : (
    content
  );
}
