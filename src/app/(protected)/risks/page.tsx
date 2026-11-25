import { redirect } from "next/navigation";
import { parsePillar, withScope, withCycle } from "@/lib/pillars";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ pillar?: string; cycle?: string }>;
}) {
  const p = await searchParams;
  redirect(
    withCycle(
      withScope("/capabilities/planning?view=issue", parsePillar(p.pillar)),
      p.cycle ?? null,
    ),
  );
}
