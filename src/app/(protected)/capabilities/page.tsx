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
import { permits } from "@/lib/permissions";

export const metadata = { title: "Capabilities" };

export default async function CapabilitiesPage() {
  const user = await requirePage();
  const [capabilities, functions] = await Promise.all([
    loadCapabilities(),
    listFunctionOptions(),
  ]);
  const synthetic = capabilities != null && (await hasDemoData());
  return (
    <div className="space-y-4">
      <PageHeader
        title="Capabilities"
        description="Current and target maturity, operational KPIs and gaps for each security topic."
      />
      {synthetic ? <DemoNotice /> : null}
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
            initial={capabilities}
            synthetic={synthetic}
            functions={functions}
            canEdit={permits(user.role, "write")}
            now={new Date().toISOString()}
          />
        </Suspense>
      )}
    </div>
  );
}
