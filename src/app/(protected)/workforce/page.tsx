import { readPageCycle } from "@/lib/server/snapshots";
import { MethodProvider } from "@/components/planning/method-provider";
import { HistoricalProvider } from "@/components/planning/historical-provider";
import { HistoricalUnavailable } from "@/components/planning/historical-notice";
import { ScopedLink } from "@/components/scoped-link";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { WorkforceWorkspace } from "@/components/workforce/workforce-workspace";
import { SchemaPending } from "@/components/schema-pending";
import { loadWorkforce } from "@/lib/server/workforce";
import { requirePage } from "@/lib/server/access";
import { permits } from "@/lib/permissions";
export const metadata = { title: "Workforce" };
export default async function WorkforcePage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const cycle = await readPageCycle((await searchParams).cycle);
  const user = await requirePage();
  const data = cycle
    ? (cycle.dataset?.workforce ?? null)
    : await loadWorkforce();
  const content = (
    <div className="space-y-4">
      <PageHeader
        title="Workforce"
        description="People, reporting relationships, position allocation and capability accountability."
      />
      <ScopedLink
        href="/workforce/planning"
        className="mr-5 text-sm text-link hover:underline"
      >
        Workload, capacity, NICE, skills and position justifications
      </ScopedLink>
      <ScopedLink
        href="/capabilities/planning?view=responsibility"
        className="text-sm text-link hover:underline"
      >
        Responsibility ownership and position links
      </ScopedLink>
      {cycle && !cycle.dataset ? (
        <HistoricalUnavailable />
      ) : data ? (
        <Suspense>
          <WorkforceWorkspace
            key={cycle?.id ?? "current"}
            initial={data}
            canEdit={!cycle && permits(user.role, "write")}
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
