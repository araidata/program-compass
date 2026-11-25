import { Suspense } from "react";
import { requirePage } from "@/lib/server/access";
import { permits } from "@/lib/permissions";
import { loadCapacity } from "@/lib/server/capacity";
import { loadWorkforce } from "@/lib/server/workforce";
import { loadPlanning } from "@/lib/server/planning";
import { readPageCycle } from "@/lib/server/snapshots";
import { PageHeader } from "@/components/page-header";
import { CapacityWorkspace } from "@/components/planning/capacity-workspace";
import { MethodProvider } from "@/components/planning/method-provider";
import { HistoricalProvider } from "@/components/planning/historical-provider";
import { HistoricalUnavailable } from "@/components/planning/historical-notice";
import { SchemaPending } from "@/components/schema-pending";
export const metadata = { title: "Workforce planning" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const user = await requirePage();
  const cycle = await readPageCycle((await searchParams).cycle);
  const [data, workforce, planning] = await Promise.all([
    cycle ? (cycle.dataset?.capacity ?? null) : loadCapacity(),
    cycle ? (cycle.dataset?.workforce ?? null) : loadWorkforce(),
    cycle ? (cycle.dataset?.planning ?? null) : loadPlanning(),
  ]);
  const content = (
    <div className="space-y-4">
      <PageHeader
        title="Workforce planning"
        description="Justify workforce investments from unique workload, dated productive capacity and separate coverage constraints."
      />
      {data && workforce && planning ? (
        <Suspense>
          <CapacityWorkspace
            key={cycle?.id ?? "current"}
            initial={data}
            workforce={workforce}
            planning={planning}
            canEdit={!cycle && permits(user.role, "write")}
          />
        </Suspense>
      ) : cycle ? (
        <HistoricalUnavailable />
      ) : (
        <SchemaPending />
      )}
    </div>
  );
  return cycle ? (
    <MethodProvider methods={cycle.methods}>
      <HistoricalProvider cycleId={cycle.id} dataset={cycle.dataset}>
        {content}
      </HistoricalProvider>
    </MethodProvider>
  ) : (
    content
  );
}
