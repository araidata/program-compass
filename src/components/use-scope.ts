"use client";

import { useSearchParams } from "next/navigation";
import { PILLAR_PARAM, parsePillar } from "@/lib/pillars";

/** Current pillar scope from the URL; null means the enterprise view. */
export function useScope() {
  const searchParams = useSearchParams();
  return parsePillar(searchParams.get(PILLAR_PARAM));
}
