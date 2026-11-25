import { requirePage } from "@/lib/server/access";
import { permits } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { DataExchangeWorkspace } from "@/components/planning/data-exchange-workspace";
export const metadata = { title: "Relational data exchange" };
export default async function Page() {
  const user = await requirePage();
  return (
    <div className="space-y-4">
      <PageHeader
        title="Relational data exchange"
        description="Export the current Enterprise workspace and preview an atomic, validated restore or merge."
      />
      <DataExchangeWorkspace canAdmin={permits(user.role, "administer")} />
    </div>
  );
}
