"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { ContextData } from "@/lib/domain/context";
import { useScope } from "@/components/use-scope";
import { useHistorical } from "@/components/planning/historical-provider";
import { withScope, withCycle } from "@/lib/pillars";
export function ContextLinks({ capabilityId }: { capabilityId: string }) {
  const [state, setState] = useState<{
    data: ContextData | null;
    error: boolean;
    loaded: boolean;
  }>({ data: null, error: false, loaded: false });
  const scope = useScope();
  const historical = useHistorical();
  useEffect(() => {
    if (historical) return;
    const controller = new AbortController();
    fetch("/api/context", { signal: controller.signal, cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((p) => setState({ data: p.data, error: false, loaded: true }))
      .catch(() => {
        if (!controller.signal.aborted)
          setState({ data: null, error: true, loaded: true });
      });
    return () => controller.abort();
  }, [capabilityId, historical]);
  const effective = historical
    ? { data: historical.dataset?.context ?? null, error: false, loaded: true }
    : state;
  const threats =
    effective.data?.threats.filter(
      (t) => t.active && t.capabilityIds.includes(capabilityId),
    ) ?? [];
  const objectives =
    effective.data?.objectives.filter(
      (o) =>
        o.active &&
        (o.capabilityIds.includes(capabilityId) ||
          threats.some((t) => t.objectiveIds.includes(o.id))),
    ) ?? [];
  return (
    <section className="space-y-2 border-t px-5 py-4">
      <h3 className="text-xs font-semibold text-muted-foreground">
        Business context
      </h3>
      {!effective.loaded ? (
        <p className="text-xs">Loading relationships…</p>
      ) : effective.error ? (
        <p className="text-xs">
          Context unavailable. Reopen this panel to retry.
        </p>
      ) : (
        <>
          <p className="text-xs">
            {objectives.length} objectives · {threats.length} business threats
          </p>
          <ul className="space-y-1 text-sm">
            {objectives.map((o) => (
              <li key={o.id}>
                <Link
                  className="text-link hover:underline"
                  href={withCycle(
                    withScope(
                      `/context?view=objectives&search=${encodeURIComponent(o.title)}`,
                      scope,
                    ),
                    historical?.cycleId ?? null,
                  )}
                >
                  {o.title}
                </Link>
              </li>
            ))}
            {threats.map((t) => (
              <li key={t.id}>
                <Link
                  className="text-link hover:underline"
                  href={withCycle(
                    withScope(
                      `/context?view=threats&search=${encodeURIComponent(t.title)}`,
                      scope,
                    ),
                    historical?.cycleId ?? null,
                  )}
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            className="text-xs text-link hover:underline"
            href={withCycle(
              withScope("/context", scope),
              historical?.cycleId ?? null,
            )}
          >
            Manage business context
          </Link>
        </>
      )}
    </section>
  );
}
