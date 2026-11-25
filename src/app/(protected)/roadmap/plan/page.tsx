import { Suspense } from "react";
import { requirePage } from "@/lib/server/access";
import { permits } from "@/lib/permissions";
import { readPageCycle } from "@/lib/server/snapshots";
import { loadFinance } from "@/lib/server/finance";
import { loadPlanning } from "@/lib/server/planning";
import { loadWorkforce } from "@/lib/server/workforce";
import { loadCapabilities } from "@/lib/server/capabilities";
import { loadAlignment } from "@/lib/server/alignment";
import { PageHeader } from "@/components/page-header";
import { FinanceWorkspace } from "@/components/planning/finance-workspace";
import { MethodProvider } from "@/components/planning/method-provider";
import { HistoricalProvider } from "@/components/planning/historical-provider";
import { HistoricalUnavailable } from "@/components/planning/historical-notice";
import { SchemaPending } from "@/components/schema-pending";
export const metadata = { title: "Strategic plan and finances" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const user = await requirePage();
  const cycle = await readPageCycle((await searchParams).cycle);
  const [data, planning, workforce, capabilities, alignment] =
    await Promise.all([
      cycle ? (cycle.dataset?.finance ?? null) : loadFinance(),
      cycle ? (cycle.dataset?.planning ?? null) : loadPlanning(),
      cycle ? (cycle.dataset?.workforce ?? null) : loadWorkforce(),
      cycle ? cycle.capabilities : loadCapabilities(),
      cycle ? (cycle.dataset?.alignment ?? null) : loadAlignment(),
    ]);
  const content = (
    <div className="space-y-4">
      <PageHeader
        title="Strategic plan and finances"
        description="Compare shared initiatives and resource investments over three detailed years and a five-year outlook."
      />
      {data && planning && workforce && capabilities && alignment ? (
        <Suspense>
          <FinanceWorkspace
            key={cycle?.id ?? "current"}
            initial={data}
            planning={planning}
            workforce={workforce}
            capabilities={capabilities}
            alignment={alignment}
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
