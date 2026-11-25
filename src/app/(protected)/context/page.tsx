import { readPageCycle } from "@/lib/server/snapshots";
import { MethodProvider } from "@/components/planning/method-provider";
import { HistoricalProvider } from "@/components/planning/historical-provider";
import { HistoricalUnavailable } from "@/components/planning/historical-notice";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { SchemaPending } from "@/components/schema-pending";
import { ContextWorkspace } from "@/components/context/context-workspace";
import { requirePage } from "@/lib/server/access";
import { loadContext } from "@/lib/server/context";
import { loadCapabilities, hasDemoData } from "@/lib/server/capabilities";
import { DemoNotice } from "@/components/demo-notice";
import { permits } from "@/lib/permissions";
export const metadata = { title: "Business Context" };
export default async function ContextPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const cycle = await readPageCycle((await searchParams).cycle);
  const user = await requirePage();
  const [data, capabilities] = await Promise.all([
    cycle ? Promise.resolve(cycle.dataset?.context ?? null) : loadContext(),
    cycle ? Promise.resolve(cycle.capabilities) : loadCapabilities(),
  ]);
  const synthetic = cycle
    ? cycle.capabilities.some(
        (c) => c.rationale === "Synthetic development rating.",
      )
    : capabilities && (await hasDemoData());
  const content = (
    <div className="space-y-4">
      <PageHeader
        title="Business Context"
        description="Connect organizational priorities and business threats to capability improvement decisions."
      />
      {synthetic && <DemoNotice />}
      {cycle && !cycle.dataset ? (
        <HistoricalUnavailable />
      ) : data && capabilities ? (
        <Suspense>
          <ContextWorkspace
            key={cycle?.id ?? "current"}
            initial={data}
            capabilities={capabilities}
            canEdit={!cycle && permits(user.role, "write")}
            synthetic={!!synthetic}
          />
        </Suspense>
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
