import { ScopedLink } from "@/components/scoped-link";

export function PlanningStart() {
  return (
    <section
      aria-labelledby="planning-start"
      className="rounded-lg border bg-card p-5 print:hidden"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Build your security program plan
          </p>
          <h2 id="planning-start" className="mt-1 text-xl">
            Start by assessing your capabilities.
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Assess current maturity, set targets, then follow the numbered
            sidebar groups to prioritize gaps, identify resources, and fund the
            work. Business Context helps explain priorities; you can add it
            later.
          </p>
        </div>
        <ScopedLink
          href="/guide"
          className="shrink-0 rounded-md border px-3 py-2 text-sm font-medium text-link hover:bg-muted"
        >
          How to use this site
        </ScopedLink>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {[
          [
            "1",
            "I’m starting a plan",
            "Rate current maturity and set targets to see what needs improvement.",
            "/capabilities",
            "Assess capabilities",
          ],
          [
            "2",
            "I know what needs to improve",
            "Assign the gap, identify resources, and turn it into an initiative.",
            "/capabilities/planning?view=issue",
            "Describe a planning issue",
          ],
          [
            "3",
            "I’m deciding what to fund",
            "Compare timing, costs, and remaining gaps across scenarios.",
            "/roadmap/plan",
            "Open the five-year plan",
          ],
        ].map(([number, title, detail, href, action]) => (
          <div key={number} className="rounded-md border p-4">
            <p className="text-sm font-semibold">
              <span className="mr-2 text-muted-foreground">{number}.</span>
              {title}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
            <ScopedLink
              className="mt-3 inline-block text-sm font-medium text-link underline"
              href={href}
            >
              {action} →
            </ScopedLink>
          </div>
        ))}
      </div>
    </section>
  );
}
