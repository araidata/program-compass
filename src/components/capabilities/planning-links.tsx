"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useHistorical } from "@/components/planning/historical-provider";
import { useScope } from "@/components/use-scope";
import { withScope, withCycle } from "@/lib/pillars";
import type { PlanningData } from "@/lib/domain/planning";
export function PlanningLinks({ capabilityId }: { capabilityId: string }) {
  const historical = useHistorical();
  const scope = useScope();
  const [live, setLive] = useState<PlanningData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (historical) return;
    const controller = new AbortController();
    fetch("/api/planning", { cache: "no-store", signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((p) => setLive(p.data))
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [historical, capabilityId]);
  const data = historical ? (historical.dataset?.planning ?? null) : live;
  return (
    <section className="space-y-2 border-t px-5 py-4">
      <h3 className="text-xs font-semibold text-muted-foreground">
        Responsibilities and investment planning
      </h3>
      {error ? (
        <p className="text-xs">Planning links unavailable. Reopen to retry.</p>
      ) : !data ? (
        <p className="text-xs">
          {historical
            ? "Planning relationships were not captured in this cycle."
            : "Loading planning relationships…"}
        </p>
      ) : (
        <>
          <ul className="space-y-1">
            {data.rows
              .filter((r) =>
                (r.values.capabilityIds as string[]).includes(capabilityId),
              )
              .map((r) => (
                <li key={r.id}>
                  <Link
                    className="text-sm text-link hover:underline"
                    href={withCycle(
                      withScope(
                        `${r.kind === "initiative" ? "/roadmap" : r.kind === "technology" ? "/technology" : "/capabilities/planning"}?view=${r.kind}&capability=${capabilityId}`,
                        scope,
                      ),
                      historical?.cycleId ?? null,
                    )}
                  >
                    {String(r.values.title)} · {r.kind}
                  </Link>
                </li>
              ))}
          </ul>
          <Link
            className="text-xs text-link hover:underline"
            href={withCycle(
              withScope(
                `/capabilities/planning?capability=${capabilityId}`,
                scope,
              ),
              historical?.cycleId ?? null,
            )}
          >
            Manage responsibilities and deficiencies
          </Link>
        </>
      )}
    </section>
  );
}
