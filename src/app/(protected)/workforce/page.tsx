import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { WorkforceWorkspace } from "@/components/workforce/workforce-workspace";
import { SchemaPending } from "@/components/schema-pending";
import { loadWorkforce } from "@/lib/server/workforce";
import { requirePage } from "@/lib/server/access";
import { permits } from "@/lib/permissions";
export const metadata = { title: "Workforce" };
export default async function WorkforcePage() {
  const user = await requirePage();
  const data = await loadWorkforce();
  return (
    <div className="space-y-4">
      <PageHeader
        title="Workforce"
        description="People, reporting relationships, position allocation and capability accountability."
      />
      {data ? (
        <Suspense>
          <WorkforceWorkspace
            initial={data}
            canEdit={permits(user.role, "write")}
          />
        </Suspense>
      ) : (
        <SchemaPending />
      )}
    </div>
  );
}
