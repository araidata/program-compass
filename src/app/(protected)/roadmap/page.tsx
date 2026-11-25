import { ScopedLink } from "@/components/scoped-link";
import { PlanningModule } from "@/components/planning/planning-module";
export const metadata = { title: "Roadmap" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  return (
    <div className="space-y-4">
      <ScopedLink href="/roadmap/plan" className="text-sm text-link underline">
        Five-year strategic plan, scenarios and finances
      </ScopedLink>
      <PlanningModule
        searchParams={searchParams}
        title="Roadmap"
        description="Sequence initiatives, resource requirements and expected capability improvement without changing observed maturity."
        kinds={["initiative"]}
      />
    </div>
  );
}
