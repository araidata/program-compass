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
export default async function ContextPage() {
  const user = await requirePage();
  const [data, capabilities] = await Promise.all([
    loadContext(),
    loadCapabilities(),
  ]);
  const synthetic = capabilities && (await hasDemoData());
  return (
    <div className="space-y-4">
      <PageHeader
        title="Business Context"
        description="Connect organizational priorities and business threats to capability improvement decisions."
      />
      {synthetic && <DemoNotice />}
      {data && capabilities ? (
        <Suspense>
          <ContextWorkspace
            initial={data}
            capabilities={capabilities}
            canEdit={permits(user.role, "write")}
            synthetic={!!synthetic}
          />
        </Suspense>
      ) : (
        <SchemaPending />
      )}
    </div>
  );
}
