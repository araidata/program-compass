import { ScopedLink } from "@/components/scoped-link";
import { DemoNotice } from "@/components/demo-notice";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { CapabilityWorkspace } from "@/components/capabilities/capability-workspace";
import { requirePage } from "@/lib/server/access";
import {
  listFunctionOptions,
  loadCapabilities,
  hasDemoData,
} from "@/lib/server/capabilities";
import { SchemaPending } from "@/components/schema-pending";
import { db } from "@/lib/server/db";
import { loadWorkforce } from "@/lib/server/workforce";
import { CycleControl } from "@/components/capabilities/cycle-control";
import { readPageCycle } from "@/lib/server/snapshots";
import { MethodProvider } from "@/components/planning/method-provider";
import { HistoricalProvider } from "@/components/planning/historical-provider";
import { CycleComparison } from "@/components/capabilities/cycle-comparison";
import { permits } from "@/lib/permissions";

export const metadata = { title: "Capabilities" };

export default async function CapabilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { cycle: cycleId } = await searchParams;
  const user = await requirePage();
  const [live, functions, workforce] = await Promise.all([
    loadCapabilities(),
    listFunctionOptions(),
    loadWorkforce(),
  ]);
  const cycles = workforce
    ? await db().planningCycle.findMany({
        omit: { dataset: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 100,
      })
    : [];
  const cycle = await readPageCycle(cycleId);
  const capabilities = cycle?.capabilities ?? live;
  const synthetic = cycle
    ? (capabilities?.some(
        (c) => c.rationale === "Synthetic development rating.",
      ) ?? false)
    : capabilities != null && (await hasDemoData());
  const content = (
    <div className="space-y-4">
      <PageHeader
        title="Capabilities"
        description="Current and target maturity, operational KPIs and gaps for each security topic."
      />
      <ScopedLink
        href="/capabilities/planning"
        className="inline-block text-sm text-link hover:underline"
      >
        Responsibilities and planning issues
      </ScopedLink>
      {synthetic ? <DemoNotice /> : null}
      {cycle && live && (
        <CycleComparison captured={cycle.capabilities} current={live} />
      )}
      {workforce && (
        <Suspense>
          <CycleControl
            cycles={cycles.map((c) => ({
              id: c.id,
              name: c.name,
              asOf: c.asOf.toISOString().slice(0, 10),
            }))}
            current={cycleId ?? ""}
            canEdit={permits(user.role, "write")}
          />
        </Suspense>
      )}
      {capabilities == null ? (
        <SchemaPending />
      ) : capabilities.length === 0 ? (
        <section className="rounded-md border bg-card px-4 py-8">
          <h2>The topic catalogue is not loaded</h2>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            An operator loads the 30 reference topics and 60 KPIs with the
            database seed command. No assessment data is created by the seed.
          </p>
        </section>
      ) : (
        <Suspense>
          <CapabilityWorkspace
            key={cycleId ?? "live"}
            initial={capabilities}
            synthetic={synthetic}
            functions={
              cycle ? (cycle.dataset?.functionOptions ?? []) : functions
            }
            people={
              cycle
                ? (cycle.dataset?.workforce?.people ?? [])
                : (workforce?.people ?? [])
            }
            canEdit={!cycleId && permits(user.role, "write")}
            now={cycle?.createdAt.toISOString() ?? new Date().toISOString()}
          />
        </Suspense>
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
