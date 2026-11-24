import Link from "next/link";
import { navigation } from "@/lib/navigation";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>
      <section
        aria-labelledby="status-title"
        className="rounded-lg border bg-card p-4"
      >
        <h2 id="status-title" className="text-base font-semibold">
          Application status
        </h2>
        <p className="mt-2 text-sm">
          Program Compass is initialized. No organizational data is connected.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Assessment, resource planning, and reporting are planned. Program
          metrics are unavailable until those workflows are implemented.
        </p>
      </section>
      <section aria-labelledby="modules-title">
        <h2 id="modules-title" className="mb-3 text-base font-semibold">
          Planned modules
        </h2>
        <dl className="divide-y rounded-lg border bg-card">
          {navigation
            .filter((item) => item.href !== "/")
            .map((item) => (
              <div
                key={item.href}
                className="grid gap-1 px-4 py-3 md:grid-cols-[12rem_1fr] md:gap-4"
              >
                <dt>
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-teal-800 underline-offset-4 hover:underline"
                  >
                    {item.title}
                  </Link>
                </dt>
                <dd className="text-sm text-muted-foreground">
                  {item.description}
                </dd>
              </div>
            ))}
        </dl>
      </section>
      <section aria-labelledby="pillars-title">
        <h2 id="pillars-title" className="text-base font-semibold">
          Three cybersecurity pillars
        </h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Security Operations</li>
          <li>Security Architecture &amp; Engineering</li>
          <li>Governance, Risk &amp; Compliance</li>
        </ul>
      </section>
    </div>
  );
}
