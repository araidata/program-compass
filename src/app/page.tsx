import Link from "next/link";
import { ArrowRight, Compass, ShieldCheck, Layers3, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    name: "Security Operations",
    icon: ShieldCheck,
    description: "Understand operational capabilities and response readiness.",
  },
  {
    name: "Security Architecture & Engineering",
    icon: Layers3,
    description:
      "Connect security design, engineering, and technology investments.",
  },
  {
    name: "Governance, Risk & Compliance",
    icon: Users,
    description: "Align oversight, risk priorities, and compliance objectives.",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Your program, in perspective</p>
        <h1>Dashboard</h1>
        <p className="mt-3 text-muted-foreground">
          A shared foundation for a more intentional cybersecurity program.
        </p>
      </div>
      <section
        className="relative overflow-hidden rounded-2xl bg-sidebar p-7 text-sidebar-foreground sm:p-10"
        aria-labelledby="welcome-title"
      >
        <Compass
          aria-hidden="true"
          className="absolute -right-12 -top-12 size-72 text-white/5"
          strokeWidth={1}
        />
        <div className="relative max-w-2xl">
          <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1 text-xs font-medium text-teal-200">
            Phase 0 · Application foundation
          </span>
          <h2
            id="welcome-title"
            className="mt-6 text-3xl font-semibold tracking-tight"
          >
            A clear direction starts here.
          </h2>
          <p className="mt-4 leading-7 text-slate-300">
            Program Compass is initialized. Your workspace is ready for the next
            phase of cybersecurity strategy and resource planning.
          </p>
          <p className="mt-4 text-sm text-slate-300">
            No organizational data has been connected. Assessments, metrics, and
            planning workflows will become available in future phases.
          </p>
          <Link
            href="/business-context"
            className="mt-7 inline-flex items-center gap-2 font-medium text-teal-200 underline-offset-4 hover:underline"
          >
            Explore the workspace{" "}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section aria-labelledby="pillars-title">
        <div className="mb-4">
          <p className="eyebrow">One connected program</p>
          <h2 id="pillars-title" className="text-xl font-semibold">
            Three cybersecurity pillars
          </h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {pillars.map(({ name, icon: Icon, description }) => (
            <Card key={name}>
              <CardHeader>
                <Icon
                  className="mb-3 size-6 text-teal-700"
                  aria-hidden="true"
                />
                <CardTitle className="text-base leading-6">{name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-5 py-4 text-sm">
        <div>
          <span className="font-medium">Foundation established</span>
          <p className="mt-1 text-muted-foreground">
            Business functionality is planned for subsequent phases.
          </p>
        </div>
        <Link
          href="/strategic-planning"
          className="inline-flex items-center gap-2 font-medium text-teal-800 hover:underline"
        >
          Strategic Planning{" "}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
