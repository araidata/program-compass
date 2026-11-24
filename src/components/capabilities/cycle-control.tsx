"use client";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
export function CycleControl({
  cycles,
  current,
  canEdit,
}: {
  cycles: { id: string; name: string; asOf: string }[];
  current: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  async function capture() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, notes: null }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message ?? "Capture failed");
      setName("");
      setAdding(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Capture failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-label="Assessment snapshots"
      className="space-y-2 rounded-md border bg-card p-3"
    >
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          Planning cycle
          <select
            className="form-input w-72"
            value={current}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              if (e.target.value) next.set("cycle", e.target.value);
              else next.delete("cycle");
              router.replace(`${pathname}?${next}`);
            }}
          >
            <option value="">Current assessment</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.asOf}
              </option>
            ))}
          </select>
        </label>
        {canEdit && !current && (
          <Button variant="outline" onClick={() => setAdding(!adding)}>
            Capture cycle
          </Button>
        )}
        {current && (
          <p className="text-xs text-muted-foreground">
            Historical snapshot · read only. Detail history refers to the live
            record.
          </p>
        )}
      </div>
      {adding && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void capture();
          }}
        >
          <label>
            Cycle name
            <input
              required
              maxLength={150}
              className="form-input ml-2 w-64"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? "Capturing…" : "Save snapshot"}
          </Button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
