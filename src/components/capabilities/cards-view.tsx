"use client";
import { capabilityGuidance } from "@/lib/domain/capability-guidance";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MaturityTrack } from "@/components/analytics/maturity";
import { IndicatorBadge } from "./format";
import type { CapabilityView } from "@/lib/domain/capabilities";
export function CardsView({
  items,
  onOpen,
}: {
  items: CapabilityView[];
  onOpen: (id: string) => void;
}) {
  const [all, setAll] = useState(false);
  return (
    <section className="space-y-3">
      <Button variant="outline" onClick={() => setAll(!all)}>
        {all ? "Collapse descriptions" : "Expand descriptions"}
      </Button>
      <div className="grid grid-cols-2 gap-4">
        {items.map((c) => (
          <article
            className="space-y-3 rounded-md border bg-card p-4"
            key={c.id}
          >
            <button
              className="text-left font-medium text-link hover:underline"
              onClick={() => onOpen(c.id)}
            >
              {c.code} · {c.name}
            </button>
            <MaturityTrack current={c.currentLevel} target={c.targetLevel} />
            <details open={all || undefined}>
              <summary className="cursor-pointer text-sm">
                Description and subject areas
              </summary>
              {capabilityGuidance[c.code] && (
                <div className="mt-2 text-sm">
                  <p>{capabilityGuidance[c.code].description}</p>
                  <ul className="mt-2 list-inside list-disc">
                    {capabilityGuidance[c.code].subjects.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Locally authored guide / suggested subject areas; not
                    verbatim source content or an assessment of your
                    organization.
                  </p>
                </div>
              )}
              <p className="mt-2 whitespace-pre-wrap text-sm">
                {c.description ||
                  "No local description recorded. Open details to add organization-authored scope and subject areas."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Description provenance: local organizational content. Catalogue
                name/identifier: original reference baseline.
              </p>
            </details>
            <ul className="space-y-2">
              {c.indicators.map((k) => (
                <li className="flex justify-between gap-2 text-sm" key={k.id}>
                  <span>{k.name}</span>
                  <IndicatorBadge indicator={k} />
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Owner:{" "}
              {c.ownerPersonName ?? c.accountableFunctionName ?? "Unassigned"}
            </p>
          </article>
        ))}
      </div>
      {!items.length && <p>No matching capabilities.</p>}
    </section>
  );
}
