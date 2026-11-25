import { PlanningModule } from "@/components/planning/planning-module";
export const metadata = { title: "Technology" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  return (
    <PlanningModule
      searchParams={searchParams}
      title="Technology"
      description="Evaluate existing coverage, utilization, dependencies and investment alternatives against capability needs."
      kinds={["technology"]}
    />
  );
}
