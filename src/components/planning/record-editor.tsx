"use client";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
export type FieldValue = string | number | boolean | null | string[];
export type FieldSpec = {
  key: string;
  label: string;
  type?:
    "text" | "textarea" | "number" | "select" | "multi" | "checkbox" | "date";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { id: string; label: string }[];
  help?: string;
};
export type RecordDraft = {
  kind: string;
  id?: string;
  revision?: string;
  values: Record<string, FieldValue>;
};
const editorHelp: Record<string, string> = {
  responsibility:
    "Describe ongoing work and who is accountable. Link the capability and requirement drivers so the same responsibility can support multiple planning decisions.",
  issue:
    "Describe a specific capability or investment gap, why it matters, and what happens if it is deferred. Assign an owner and due date so it appears in planning worklists.",
  initiative:
    "Describe a dated effort to improve the program. Link the gaps and resources it addresses. Investment approval and execution status are separate; completion does not change assessed maturity.",
  technology:
    "Record an existing tool or a proposed option. Link its capability coverage and explain whether the need is missing technology, underutilization, staffing, or process. Use sourced costs.",
  activity:
    "Record one unique work activity using sourced estimates. Volume, frequency, and effort determine annual demand; map it to a responsibility without entering the same work again for each framework.",
  assignment:
    "Allocate productive time from an actual person to a responsibility for a defined date range. Use sourced paid and productive hours; vacant positions supply no actual capacity.",
  constraint:
    "Record a coverage, continuity, expertise, or separation requirement. Explain its source. These constraints are evaluated separately from workload-derived staffing demand.",
  skill:
    "Record a person's assessed knowledge or skill and its source. NICE mappings describe work and expertise; they do not prescribe a headcount.",
  scenario:
    "Create one funding alternative. After saving, use Include / defer resource to choose shared initiatives, positions, and technology with scenario-specific timing.",
  item: "Choose a shared initiative or resource for this scenario and set its inclusion and timing. This changes this scenario's plan, not the shared baseline record.",
  target:
    "Set the intended capability maturity for one year in this scenario. A planning target does not change the current assessment.",
  budget:
    "Enter the sourced funding limit for one scenario year. Costs above it remain visible as a funding constraint.",
  cost: "Add a distinct sourced cost or savings line. Reuse one cost identity for one expense; do not duplicate a position or technology cost already included through a resource.",
};
export function RecordEditor({
  draft,
  fields,
  title,
  endpoint,
  onClose,
  onSaved,
  children,
  readOnly = false,
}: {
  draft: RecordDraft;
  fields: FieldSpec[];
  title: string;
  endpoint: string;
  onClose: () => void;
  onSaved: () => void;
  children?: React.ReactNode;
  readOnly?: boolean;
}) {
  const fieldPrefix = useId();
  const [values, setValues] = useState(draft.values);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function set(key: string, value: FieldValue) {
    setValues((v) => ({ ...v, [key]: value }));
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `${endpoint}${draft.id ? `/${draft.id}` : ""}`,
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: draft.kind,
            values,
            ...(draft.id ? { revision: draft.revision } : {}),
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Save failed");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <SheetContent className="overflow-y-auto p-5 data-[side=right]:w-[580px] data-[side=right]:sm:max-w-[580px]">
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>
          {editorHelp[draft.kind] ??
            "Maintain planning facts and relationships. Save changes to the shared workspace."}
        </SheetDescription>
        {children}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <fieldset disabled={readOnly || busy} className="min-w-0 space-y-4">
            {fields.map((f) =>
              f.type === "multi" ? (
                <fieldset key={f.key}>
                  <legend>{f.label}</legend>
                  <div className="mt-1 max-h-52 space-y-1 overflow-y-auto rounded-md border p-2">
                    {f.options?.map((o) => (
                      <label
                        className="flex items-start gap-2 text-sm"
                        key={o.id}
                      >
                        <input
                          type="checkbox"
                          checked={((values[f.key] as string[]) ?? []).includes(
                            o.id,
                          )}
                          onChange={(e) => {
                            const before = (values[f.key] as string[]) ?? [];
                            set(
                              f.key,
                              e.target.checked
                                ? [...before, o.id]
                                : before.filter((id) => id !== o.id),
                            );
                          }}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                  {f.help && (
                    <p className="text-xs text-muted-foreground">{f.help}</p>
                  )}
                </fieldset>
              ) : (
                <label className="block" key={f.key}>
                  {f.type === "checkbox" ? (
                    <span className="flex gap-2">
                      <input
                        type="checkbox"
                        aria-label={f.label}
                        aria-describedby={
                          f.help ? `${fieldPrefix}-${f.key}-help` : undefined
                        }
                        checked={!!values[f.key]}
                        onChange={(e) => set(f.key, e.target.checked)}
                      />
                      {f.label}
                    </span>
                  ) : (
                    <>
                      {f.label}
                      {f.type === "textarea" ? (
                        <textarea
                          className="form-input mt-1"
                          aria-label={f.label}
                          aria-describedby={
                            f.help ? `${fieldPrefix}-${f.key}-help` : undefined
                          }
                          required={f.required}
                          maxLength={4000}
                          rows={4}
                          value={String(values[f.key] ?? "")}
                          onChange={(e) => set(f.key, e.target.value || null)}
                        />
                      ) : f.type === "select" ? (
                        <select
                          className="form-input mt-1"
                          aria-label={f.label}
                          aria-describedby={
                            f.help ? `${fieldPrefix}-${f.key}-help` : undefined
                          }
                          required={f.required}
                          value={String(values[f.key] ?? "")}
                          onChange={(e) => set(f.key, e.target.value || null)}
                        >
                          <option value="">Unspecified</option>
                          {f.options?.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="form-input mt-1"
                          aria-label={f.label}
                          aria-describedby={
                            f.help ? `${fieldPrefix}-${f.key}-help` : undefined
                          }
                          type={
                            f.type === "number"
                              ? "number"
                              : f.type === "date"
                                ? "date"
                                : "text"
                          }
                          required={f.required}
                          min={f.min}
                          max={f.max}
                          step={f.step ?? 1}
                          maxLength={f.type === "number" ? undefined : 150}
                          value={String(values[f.key] ?? "")}
                          onChange={(e) =>
                            set(
                              f.key,
                              f.type === "number"
                                ? e.target.value === ""
                                  ? null
                                  : Number(e.target.value)
                                : f.type === "date" && !e.target.value
                                  ? null
                                  : e.target.value,
                            )
                          }
                        />
                      )}
                    </>
                  )}
                  {f.help && (
                    <span
                      id={`${fieldPrefix}-${f.key}-help`}
                      className="mt-1 block text-xs text-muted-foreground"
                    >
                      {f.help}
                    </span>
                  )}
                </label>
              ),
            )}
          </fieldset>
          {error && <p role="alert">{error}</p>}
          <div className="flex gap-2">
            {!readOnly && (
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
