import { PageHeader } from "@/components/page-header";
import { ScopedLink } from "@/components/scoped-link";
import { planningSteps } from "@/lib/planning-guide";

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="How to use Program Compass"
        description="Build an explainable security plan: what the business needs, what is missing, who will do the work, and what to fund."
      />
      <section className="rounded-lg border bg-card p-5">
        <h2>Your first pass</h2>
        <p className="mt-2 max-w-4xl text-sm">
          Start by assessing one capability: record current maturity and set a
          target. Use business objectives and framework requirements to
          prioritize the gap, then propose an initiative. Add workforce,
          technology, and costs as you learn what the work needs. You can return
          to any step; this is an iterative planning process.
        </p>
        <ScopedLink
          href="/capabilities"
          className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Assess capabilities →
        </ScopedLink>
        <div className="mt-5 grid grid-cols-3 gap-5 border-t pt-4 text-sm">
          <p>
            <strong>Scope:</strong> Enterprise shows the whole program. A pillar
            filters shared records. If something seems missing, check the scope
            and page filters.
          </p>
          <p>
            <strong>Current or captured:</strong> Current is where you edit. A
            cycle is a frozen review checkpoint; changing live records will not
            change that capture.
          </p>
          <p>
            <strong>Saving:</strong> Inline capability ratings save
            automatically; editor forms have a Save action. Wait for
            confirmation. If a record changed elsewhere, keep a copy of your
            edits before reloading and reconciling the conflict.
          </p>
        </div>
      </section>
      <nav aria-label="Planning guide steps" className="flex flex-wrap gap-2">
        {planningSteps.map((step, i) => (
          <a
            key={step.id}
            href={`#${step.id}`}
            className="rounded-md border px-3 py-2 text-sm text-link hover:bg-muted"
          >
            {i + 1}. {step.area}
          </a>
        ))}
        <a
          href="#example"
          className="rounded-md border px-3 py-2 text-sm text-link hover:bg-muted"
        >
          Worked example
        </a>
        <a
          href="#terms"
          className="rounded-md border px-3 py-2 text-sm text-link hover:bg-muted"
        >
          What the numbers mean
        </a>
      </nav>
      <div className="space-y-4">
        {planningSteps.map((step, index) => (
          <section
            id={step.id}
            key={step.id}
            className="scroll-mt-20 rounded-lg border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Step {index + 1} · {step.area}
                </p>
                <h2 className="mt-1">{step.title}</h2>
              </div>
              <ScopedLink
                href={step.href}
                className="shrink-0 text-sm font-medium text-link underline"
              >
                Open {step.area} →
              </ScopedLink>
            </div>
            <p className="mt-3 text-sm font-medium">{step.first}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              {step.steps.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ol>
            <p className="mt-3 border-t pt-3 text-sm">
              <strong>What you get:</strong> {step.result}
            </p>
          </section>
        ))}
      </div>
      <section
        id="example"
        className="scroll-mt-20 rounded-lg border bg-card p-5"
      >
        <h2>Worked example: improve incident response</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Illustrative only. These are not assessments, benchmarks, or
          recommendations for your organization. Nothing is inserted into your
          records.
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm">
          <li>
            <strong>Capabilities:</strong> after assessing your actual
            practices, you might record current level 2 and target level 3, with
            a rationale. The gap is one maturity level.
          </li>
          <li>
            <strong>Business Context:</strong> record an objective such as
            “Restore critical services promptly after an incident” and link the
            relevant capability.
          </li>
          <li>
            <strong>Planning issues and responsibilities:</strong> describe
            “Response procedures are not rehearsed,” explain the operational
            consequence, and name the responsible person or function.
          </li>
          <li>
            <strong>Resources:</strong> record the rehearsal and procedure work
            as activities, using your own sourced hours. Compare that demand
            with productive capacity. Review existing tools before proposing a
            purchase.
          </li>
          <li>
            <strong>Roadmap:</strong> add an initiative to update and rehearse
            the procedures. Link the objective, capability, issue,
            responsibilities, and resource needs; set dates and the expected
            uplift rationale.
          </li>
          <li>
            <strong>Five-year plan:</strong> include the initiative and resource
            costs in one scenario. Compare it with an alternative that defers
            the work. Review the costs, remaining gap, and consequence of delay.
          </li>
          <li>
            <strong>Reports and review:</strong> explain the investment to
            leadership. When work finishes, reassess the capability using
            observed results, then capture a cycle to preserve the review.
          </li>
        </ol>
      </section>
      <section
        id="terms"
        className="scroll-mt-20 rounded-lg border bg-card p-5"
      >
        <h2>What the numbers and records mean</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
          {[
            [
              "Capability / requirement",
              "A capability is something your program can do and is assessed once. A requirement is a framework statement with its own applicability, implementation, and assessment. Mappings connect them.",
            ],
            [
              "Current / target / projected maturity",
              "Current is the recorded assessment. Target is the intended level. Projected is the modelled effect of eligible approved work; it is not a new assessment.",
            ],
            [
              "Planning issue / responsibility / initiative",
              "An issue describes a gap and its consequence. A responsibility identifies ongoing accountable work. An initiative is a dated effort to change something.",
            ],
            [
              "Workload / capacity / FTE",
              "Workload is hours needed. Capacity is productive hours available through allocations. FTE means full-time equivalent; workload-derived staffing and minimum coverage needs are shown separately.",
            ],
            [
              "Scenario / baseline / incremental cost",
              "A scenario selects shared work and resources with its own timing. Baseline costs describe existing commitments; incremental costs describe added investment or savings. Compare alternatives before deciding what to fund.",
            ],
            [
              "Unknown / incomplete / zero",
              "Unknown inputs have not been assessed or supplied. Incomplete totals identify missing inputs. Zero is an entered or calculated value, not a substitute for missing data.",
            ],
            [
              "Provisional assumptions",
              "Planning rules and estimates are explicitly provisional until reviewed. Settings holds versioned definitions, thresholds, dates, and forecasting rules. Enter sourced organizational hours and prices in their resource records.",
            ],
            [
              "Coverage",
              "Indicative framework coverage uses applicable leaf requirements and the saved threshold. Unknown applicability is reported separately; uncovered or unmapped requirements remain visible. It is not verified compliance.",
            ],
          ].map(([term, meaning]) => (
            <div key={term}>
              <dt className="font-semibold">{term}</dt>
              <dd className="mt-1 text-muted-foreground">{meaning}</dd>
            </div>
          ))}
        </dl>
        <ScopedLink
          href="/settings"
          className="mt-5 inline-block text-sm text-link underline"
        >
          Review planning assumptions in Settings →
        </ScopedLink>
      </section>
    </div>
  );
}
