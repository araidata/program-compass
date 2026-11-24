"use client";
import { useState } from "react";
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
  type?: "text" | "textarea" | "number" | "select" | "multi" | "checkbox";
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
export function RecordEditor({
  draft,
  fields,
  title,
  endpoint,
  onClose,
  onSaved,
}: {
  draft: RecordDraft;
  fields: FieldSpec[];
  title: string;
  endpoint: string;
  onClose: () => void;
  onSaved: () => void;
}) {
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
          Maintain planning facts and relationships. Save changes to the shared
          workspace.
        </SheetDescription>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
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
                        required={f.required}
                        maxLength={4000}
                        rows={4}
                        value={String(values[f.key] ?? "")}
                        onChange={(e) => set(f.key, e.target.value || null)}
                      />
                    ) : f.type === "select" ? (
                      <select
                        className="form-input mt-1"
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
                        type={f.type === "number" ? "number" : "text"}
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
                              : e.target.value,
                          )
                        }
                      />
                    )}
                  </>
                )}
                {f.help && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {f.help}
                  </span>
                )}
              </label>
            ),
          )}
          {error && <p role="alert">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
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
