import { PlanningModule } from "@/components/planning/planning-module";
export const metadata = { title: "Responsibilities and planning issues" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  return (
    <PlanningModule
      searchParams={searchParams}
      title="Responsibilities and planning issues"
      description="Connect capability deficiencies to accountable functions, people, positions and investment decisions."
      kinds={["responsibility", "issue"]}
    />
  );
}
