"use client";
import { useEffect, useState } from "react";
import { useHistorical } from "./historical-provider";
type Event = {
  id: string;
  createdAt: string;
  action: string;
  details: Record<string, unknown>;
  actor: { name: string } | null;
};
export function RecordHistory({
  entityType,
  id,
  endpoint,
}: {
  entityType: string;
  id: string;
  endpoint: string;
}) {
  const historical = useHistorical();
  const [live, setLive] = useState<Event[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (historical) return;
    const c = new AbortController();
    fetch(endpoint, { signal: c.signal, cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((p) => setLive(p.data))
      .catch(() => {
        if (!c.signal.aborted) setError(true);
      });
    return () => c.abort();
  }, [historical, endpoint]);
  const rows = historical
    ? ((historical.dataset?.history as Event[] | undefined)
        ?.filter(
          (e) =>
            (e as Event & { entityType: string; entityId: string })
              .entityType === entityType &&
            (e as Event & { entityId: string }).entityId === id,
        )
        .slice(-30)
        .reverse() ?? [])
    : live;
  return (
    <details className="rounded border p-2 text-xs">
      <summary>
        {historical ? "Captured assessment history" : "Assessment history"}
      </summary>
      {error ? (
        <p>History unavailable. Reopen to retry.</p>
      ) : rows === null ? (
        <p>Loading history…</p>
      ) : rows.length ? (
        rows.map((e) => (
          <div className="mt-2 border-t pt-2" key={e.id}>
            <p>
              {e.createdAt.slice(0, 19).replace("T", " ")} UTC ·{" "}
              {e.actor?.name ??
                (typeof e.details.exportedActorName === "string"
                  ? e.details.exportedActorName
                  : "Unauthenticated / system")}{" "}
              · {e.action}
            </p>
            <pre className="mt-1 whitespace-pre-wrap break-words font-sans">
              {JSON.stringify(e.details, null, 2)}
            </pre>
          </div>
        ))
      ) : (
        <p>No assessment changes recorded in this view.</p>
      )}
    </details>
  );
}
