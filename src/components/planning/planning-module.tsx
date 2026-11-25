import { Suspense } from "react";
import { requirePage } from "@/lib/server/access";
import { loadPlanning } from "@/lib/server/planning";
import { readPageCycle } from "@/lib/server/snapshots";
import { loadMethods } from "@/lib/server/methods";
import { PageHeader } from "@/components/page-header";
import { PlanningWorkspace } from "./planning-workspace";
import { MethodProvider } from "./method-provider";
import { HistoricalProvider } from "./historical-provider";
import { HistoricalUnavailable } from "./historical-notice";
import { permits } from "@/lib/permissions";
import type { PlanningKind } from "@/lib/domain/planning";
export async function PlanningModule({
  searchParams,
  title,
  description,
  kinds,
}: {
  searchParams: Promise<{ cycle?: string }>;
  title: string;
  description: string;
  kinds: PlanningKind[];
}) {
  const user = await requirePage();
  const cycle = await readPageCycle((await searchParams).cycle);
  const data = cycle ? (cycle.dataset?.planning ?? null) : await loadPlanning();
  const methods = cycle?.methods ?? (await loadMethods());
  const content = (
    <div className="space-y-4">
      <PageHeader title={title} description={description} />
      {data ? (
        <Suspense>
          <PlanningWorkspace
            key={cycle?.id ?? "current"}
            initial={data}
            kinds={kinds}
            canEdit={!cycle && permits(user.role, "write")}
            now={cycle?.createdAt.toISOString() ?? new Date().toISOString()}
          />
        </Suspense>
      ) : (
        <HistoricalUnavailable />
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
