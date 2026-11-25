"use client";
import { createContext, useContext } from "react";
import type { SnapshotDataset } from "@/lib/server/snapshots";
const Historical = createContext<{
  cycleId: string;
  dataset: SnapshotDataset | null;
} | null>(null);
export function HistoricalProvider({
  cycleId,
  dataset,
  children,
}: {
  cycleId: string;
  dataset: SnapshotDataset | null;
  children: React.ReactNode;
}) {
  return (
    <Historical.Provider value={{ cycleId, dataset }}>
      {children}
    </Historical.Provider>
  );
}
export const useHistorical = () => useContext(Historical);
