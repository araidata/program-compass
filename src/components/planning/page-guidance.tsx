"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ScopedLink } from "@/components/scoped-link";
import { planningSteps } from "@/lib/planning-guide";

/** Visible first action plus optional detail, beside the actual workspace. */
export function PageGuidance() {
  const path = usePathname();
  const params = useSearchParams();
  const step = planningSteps.find((s) => s.href.split("?")[0] === path);
  if (!step) return null;
  return (
    <aside
      aria-label="Page guidance"
      className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-4 print:hidden"
    >
      <p className="text-sm">
        <strong>Start here:</strong> {step.first}
      </p>
      {params.has("cycle") && (
        <p className="mt-2 text-sm font-medium">
          You are viewing a captured cycle. Select Current assessment at the top
          to enter or change records.
        </p>
      )}
      <details key={path} className="mt-2 text-sm">
        <summary className="w-fit cursor-pointer font-medium text-link">
          How to use this page
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          {step.steps.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ol>
        <p className="mt-3">
          <strong>What you get:</strong> {step.result}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <ScopedLink href={step.next} className="text-link underline">
            Next: {step.nextLabel}
          </ScopedLink>
          <ScopedLink
            href={`/guide#${step.id}`}
            className="text-link underline"
          >
            See the full workflow and example
          </ScopedLink>
        </div>
      </details>
    </aside>
  );
}
