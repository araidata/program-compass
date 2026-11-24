import { cn } from "@/lib/utils";
import type { Pillar } from "@/lib/pillars";

const dotClass: Record<Pillar["id"], string> = {
  secops: "bg-pillar-secops",
  sae: "bg-pillar-sae",
  grc: "bg-pillar-grc",
};

/** Small pillar identifier: a reserved colour dot plus a text label. */
export function PillarTag({
  pillar,
  label = "short",
  className,
}: {
  pillar: Pillar | null;
  label?: "short" | "name";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-foreground",
        className,
      )}
      title={pillar?.name ?? "All pillars"}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          pillar ? dotClass[pillar.id] : "bg-status-none",
        )}
      />
      {pillar ? pillar[label] : "Enterprise"}
    </span>
  );
}
