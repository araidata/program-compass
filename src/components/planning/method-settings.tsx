"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/components/use-url-filters";
import type { Methods, MethodValues } from "@/lib/domain/methods";
const numericFields: {
  key: keyof Omit<
    MethodValues,
    "levels" | "currency" | "projectionStatuses" | "projectionRequiresApproval"
  >;
  label: string;
  unit: string;
  min: number;
  max: number;
}[] = [
  {
    key: "projectionCap",
    label: "Maximum projected maturity",
    unit: "maturity level; actual observations never decrease",
    min: 1,
    max: 5,
  },
  {
    key: "reviewDueMonths",
    label: "Assessment review due",
    unit: "calendar months",
    min: 1,
    max: 120,
  },
  {
    key: "reviewOverdueMonths",
    label: "Assessment overdue",
    unit: "calendar months",
    min: 1,
    max: 240,
  },
  {
    key: "readinessDefended",
    label: "Defended readiness threshold",
    unit: "maturity level",
    min: 1,
    max: 5,
  },
  {
    key: "readinessPartial",
    label: "Partly defended threshold",
    unit: "maturity level",
    min: 1,
    max: 5,
  },
  {
    key: "coverageThreshold",
    label: "Indicative framework coverage threshold",
    unit: "maturity level",
    min: 1,
    max: 5,
  },
  {
    key: "planStartYear",
    label: "First planning year",
    unit: "year",
    min: 2000,
    max: 2200,
  },
  {
    key: "fiscalStartMonth",
    label: "Fiscal year starts in month",
    unit: "1 January – 12 December",
    min: 1,
    max: 12,
  },
  {
    key: "salaryEscalation",
    label: "Annual salary escalation estimate",
    unit: "percent",
    min: -100,
    max: 100,
  },
  {
    key: "licensingEscalation",
    label: "Annual licensing escalation estimate",
    unit: "percent",
    min: -100,
    max: 100,
  },
];
export function MethodSettings({ initial }: { initial: Methods }) {
  const [methods, setMethods] = useState(initial);
  const [versions, setVersions] = useState<Methods[]>([]);
  const [values, setValues] = useState(initial.values);
  const [basis, setBasis] = useState(initial.basis);
  const [effectiveDate, setDate] = useState(initial.effectiveDate);
  const [provisional, setProvisional] = useState(initial.provisional);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();
  const hydrated = useHydrated();
  async function save() {
    setBusy(true);
    setStatus("");
    try {
      const r = await fetch("/api/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values,
          basis,
          effectiveDate,
          provisional,
          revision: methods.id,
        }),
      });
      const result = await r.json();
      if (!r.ok)
        throw new Error(result.error?.message ?? "Could not save methods");
      setMethods({
        ...methods,
        id: result.data.id,
        values,
        basis,
        effectiveDate,
        provisional,
      });
      setStatus(
        "Saved as a new method version. Captured cycles retain their original version.",
      );
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 rounded-md border bg-card p-4">
      <h2>Planning assumptions and methods</h2>
      <p className="text-sm text-muted-foreground">
        Versioned organizational estimates. These settings are not staffing
        benchmarks, threat probabilities or verified compliance standards.
        Paid/productive hours and prices must be entered from a source in their
        planning records.
      </p>
      <p className="text-xs">
        Current version: {methods.id} ·{" "}
        {methods.provisional ? "Provisional" : "Organization approved"}
      </p>
      <details className="rounded border p-3">
        <summary>Saved assumption / scale versions</summary>
        <Button
          type="button"
          variant="outline"
          className="my-2"
          onClick={async () => {
            try {
              const r = await fetch("/api/methods?history=true", {
                cache: "no-store",
              });
              if (!r.ok) throw new Error();
              setVersions((await r.json()).data);
            } catch {
              setStatus("Version history unavailable. Retry or reload.");
            }
          }}
        >
          Load saved versions
        </Button>
        {versions.map((v) => (
          <details className="mt-2 border-t pt-2" key={v.id}>
            <summary>
              {v.effectiveDate} � {v.id} �{" "}
              {v.provisional ? "provisional" : "approved"}
            </summary>
            <p className="text-xs">{v.basis}</p>
            <dl className="mt-2 space-y-1 text-xs">
              {v.values.levels.map((l) => (
                <div key={l.level}>
                  <dt>
                    Level {l.level}: {l.name}
                  </dt>
                  <dd>{l.definition}</dd>
                </div>
              ))}
            </dl>
            <pre className="mt-2 whitespace-pre-wrap text-xs">
              {JSON.stringify({ ...v.values, levels: undefined }, null, 2)}
            </pre>
          </details>
        ))}
      </details>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset disabled={busy || !hydrated} className="space-y-4 min-w-0">
          <div className="grid grid-cols-3 gap-4">
            {numericFields.map((f) => (
              <label className="block text-sm" key={f.key}>
                {f.label}
                <input
                  required
                  type="number"
                  step={f.key.includes("Escalation") ? "0.01" : "1"}
                  min={f.min}
                  max={f.max}
                  className="form-input mt-1"
                  value={values[f.key]}
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: Number(e.target.value) })
                  }
                />
                <span className="text-xs text-muted-foreground">{f.unit}</span>
              </label>
            ))}
            <label>
              Planning currency
              <input
                required
                pattern="[A-Z]{3}"
                maxLength={3}
                className="form-input mt-1"
                value={values.currency}
                onChange={(e) =>
                  setValues({
                    ...values,
                    currency: e.target.value.toUpperCase(),
                  })
                }
              />
            </label>
            <label>
              Effective date
              <input
                required
                type="date"
                className="form-input mt-1"
                value={effectiveDate}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={provisional}
                onChange={(e) => setProvisional(e.target.checked)}
              />
              Provisional assumptions
            </label>
          </div>
          <fieldset className="space-y-2">
            <legend>Provisional projection eligibility</legend>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={values.projectionRequiresApproval ?? true}
                onChange={(e) =>
                  setValues({
                    ...values,
                    projectionRequiresApproval: e.target.checked,
                  })
                }
              />
              Require approved investment
            </label>
            {(["planned", "in-progress", "on-hold"] as const).map((status) => (
              <label className="mr-5 inline-flex gap-2" key={status}>
                <input
                  type="checkbox"
                  checked={(
                    values.projectionStatuses ?? ["planned", "in-progress"]
                  ).includes(status)}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      projectionStatuses: e.target.checked
                        ? [
                            ...(values.projectionStatuses ?? [
                              "planned",
                              "in-progress",
                            ]),
                            status,
                          ]
                        : (
                            values.projectionStatuses ?? [
                              "planned",
                              "in-progress",
                            ]
                          ).filter((s) => s !== status),
                    })
                  }
                />
                {status}
              </label>
            ))}
            <p className="text-xs">
              Strongest eligible uplift, never summed; completed/cancelled work
              and unknown actual maturity add no unvalidated uplift. Captures
              retain the prior version.
            </p>
          </fieldset>
          <fieldset className="space-y-2">
            <legend>Maturity scale definitions (levels 1–5 retained)</legend>
            {values.levels.map((l, i) => (
              <div
                className="grid grid-cols-[40px_180px_1fr] gap-3"
                key={l.level}
              >
                <span>Level {l.level}</span>
                <label className="sr-only" htmlFor={`level-name-${l.level}`}>
                  Level {l.level} name
                </label>
                <input
                  id={`level-name-${l.level}`}
                  className="form-input"
                  required
                  maxLength={60}
                  value={l.name}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      levels: values.levels.map((v, j) =>
                        j === i ? { ...v, name: e.target.value } : v,
                      ),
                    })
                  }
                />
                <label
                  className="sr-only"
                  htmlFor={`level-definition-${l.level}`}
                >
                  Level {l.level} definition
                </label>
                <input
                  id={`level-definition-${l.level}`}
                  className="form-input"
                  required
                  maxLength={1000}
                  value={l.definition}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      levels: values.levels.map((v, j) =>
                        j === i ? { ...v, definition: e.target.value } : v,
                      ),
                    })
                  }
                />
              </div>
            ))}
          </fieldset>
          <label className="block">
            Source/basis and rationale
            <textarea
              required
              rows={3}
              className="form-input mt-1"
              maxLength={4000}
              value={basis}
              onChange={(e) => setBasis(e.target.value)}
            />
          </label>
          <Button type="submit">
            {busy ? "Saving…" : "Save new method version"}
          </Button>
        </fieldset>
      </form>
      <p role="status" className="text-sm">
        {status}
      </p>
    </section>
  );
}
