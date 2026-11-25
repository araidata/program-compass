"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CycleControl } from "@/components/capabilities/cycle-control";
export function GlobalCycleControl() {
  const path = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const [cycles, setCycles] = useState<
    { id: string; name: string; asOf: string }[]
  >([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/cycles", { signal: controller.signal, cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((p) =>
        setCycles(
          p.data.map((c: { id: string; name: string; asOf: string }) => ({
            ...c,
            asOf: c.asOf.slice(0, 10),
          })),
        ),
      )
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [path, query]);
  if (
    path === "/settings" ||
    path === "/capabilities" ||
    path.startsWith("/reports/data")
  )
    return null;
  return (
    <div className="print-hidden mb-4">
      {error ? (
        <p role="status">Cycle list unavailable. Reload to retry.</p>
      ) : (
        <CycleControl
          cycles={cycles}
          current={params.get("cycle") ?? ""}
          canEdit={false}
        />
      )}
    </div>
  );
}
