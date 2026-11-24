"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { KpiBand } from "@/components/analytics/kpi-band";
import {
  LevelChip,
  MaturityLegend,
  MaturityTrack,
} from "@/components/analytics/maturity";
import { pillars } from "@/lib/pillars";
import { groupName } from "@/lib/domain/catalogue";
import { levelName } from "@/lib/domain/maturity";
import {
  gap,
  type CapabilityView,
  type IndicatorView,
} from "@/lib/domain/capabilities";
import { RatingInput } from "./rating-input";
import {
  GapValue,
  IndicatorBadge,
  PillarDots,
  ReviewBadge,
  indicatorRule,
} from "./format";
import { KpiValueInput } from "./performance-view";
import type { CapabilityPatch, IndicatorPatch } from "./capability-workspace";

export type FunctionGroup = {
  key: string;
  name: string;
  functions: { id: string; name: string }[];
};

type HistoryEntry = {
  id: string;
  at: string;
  actor: string | null;
  action: string;
  details: Record<string, unknown>;
};

const fieldLabels: Record<string, string> = {
  currentLevel: "current",
  targetLevel: "target",
  applicable: "applicability",
  confidence: "confidence",
  rationale: "rationale",
  description: "description",
  reviewState: "review state",
  targetDate: "target date",
  accountableFunctionId: "accountable function",
  pillarKeys: "pillars",
};

function describe(entry: HistoryEntry): string {
  const d = entry.details;
  if (entry.action === "catalogue.seeded")
    return `Added from catalogue ${String(d.catalogue ?? "")}`;
  if (entry.action.startsWith("indicator.")) {
    const verb = entry.action.split(".")[1];
    const value = "value" in d ? ` to ${d.value ?? "no data"}` : "";
    return `KPI ${String(d.indicator ?? "")} ${verb}${value}`;
  }
  const parts: string[] = [];
  if ("currentLevel" in d)
    parts.push(
      `current ${d.currentLevel == null ? "cleared" : `→ ${d.currentLevel} ${levelName(d.currentLevel as number)}`}`,
    );
  if ("targetLevel" in d)
    parts.push(
      `target ${d.targetLevel == null ? "cleared" : `→ ${d.targetLevel}`}`,
    );
  for (const key of Object.keys(d))
    if (key !== "currentLevel" && key !== "targetLevel")
      parts.push(`${fieldLabels[key] ?? key} changed`);
  return parts.join(", ") || "Updated";
}

function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="border-t px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "col-span-2 block" : "block"}>
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function TextArea({
  value,
  onCommit,
  disabled,
  placeholder,
  label,
}: {
  value: string | null;
  onCommit: (value: string | null) => void;
  disabled: boolean;
  placeholder: string;
  label: string;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(value ?? "");
  }
  return (
    <textarea
      aria-label={label}
      value={draft}
      disabled={disabled}
      placeholder={placeholder}
      rows={3}
      maxLength={4000}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = draft.trim() === "" ? null : draft.trim();
        if (next !== (value ?? null)) onCommit(next);
      }}
      className="form-input resize-y text-[13px] leading-relaxed disabled:bg-muted/40"
    />
  );
}

const selectClass = "form-input h-8 py-0 text-[13px] disabled:bg-muted/40";

export function CapabilityPanel({
  capability,
  functions,
  canEdit,
  now,
  onClose,
  onUpdate,
  onUpdateIndicator,
  onCreateIndicator,
  onDeleteIndicator,
}: {
  capability: CapabilityView | null;
  functions: FunctionGroup[];
  canEdit: boolean;
  now: Date;
  onClose: () => void;
  onUpdate: (id: string, patch: CapabilityPatch) => void;
  onUpdateIndicator: (
    capabilityId: string,
    indicatorId: string,
    patch: IndicatorPatch,
  ) => Promise<boolean>;
  onCreateIndicator: (
    capabilityId: string,
    body: Omit<IndicatorView, "id" | "catalogueKey">,
  ) => Promise<boolean>;
  onDeleteIndicator: (capabilityId: string, indicatorId: string) => void;
}) {
  return (
    <Sheet
      open={capability != null}
      onOpenChange={(open) => (open ? null : onClose())}
    >
      <SheetContent
        side="right"
        className="gap-0 overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[580px]"
      >
        {capability ? (
          <PanelBody
            key={capability.id}
            capability={capability}
            functions={functions}
            canEdit={canEdit}
            now={now}
            onUpdate={(patch) => onUpdate(capability.id, patch)}
            onUpdateIndicator={(id, patch) =>
              onUpdateIndicator(capability.id, id, patch)
            }
            onCreateIndicator={(body) => onCreateIndicator(capability.id, body)}
            onDeleteIndicator={(id) => onDeleteIndicator(capability.id, id)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function PanelBody({
  capability: item,
  functions,
  canEdit,
  now,
  onUpdate,
  onUpdateIndicator,
  onCreateIndicator,
  onDeleteIndicator,
}: {
  capability: CapabilityView;
  functions: FunctionGroup[];
  canEdit: boolean;
  now: Date;
  onUpdate: (patch: CapabilityPatch) => void;
  onUpdateIndicator: (id: string, patch: IndicatorPatch) => Promise<boolean>;
  onCreateIndicator: (
    body: Omit<IndicatorView, "id" | "catalogueKey">,
  ) => Promise<boolean>;
  onDeleteIndicator: (id: string) => void;
}) {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const version = JSON.stringify([
    item.assessedAt,
    item.indicators,
    item.reviewState,
    item.rationale,
    item.pillarKeys,
    item.accountableFunctionId,
    item.targetDate,
    item.applicable,
    item.confidence,
    item.targetLevel,
  ]);
  useEffect(() => {
    let active = true;
    fetch(`/api/capabilities/${item.id}/history`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (active) setHistory(payload?.data ?? []);
      })
      .catch(() => active && setHistory([]));
    return () => {
      active = false;
    };
  }, [item.id, version]);

  const disabled = !canEdit;
  return (
    <div className="flex min-h-full flex-col">
      <header className="px-5 pb-4 pt-5 pr-12">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{item.code}</span>
          <span aria-hidden="true">·</span>
          {groupName(item.groupCode)}
        </p>
        <SheetTitle className="mt-1 text-base font-semibold leading-snug">
          {item.name}
        </SheetTitle>
        <SheetDescription className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <PillarDots keys={item.pillarKeys} />
          <ReviewBadge capability={item} now={now} />
        </SheetDescription>
      </header>

      <section
        aria-label="Maturity profile"
        className="grid grid-cols-3 gap-px border-y bg-border"
      >
        <div className="bg-card px-5 py-3">
          <p className="text-xs text-muted-foreground">Current</p>
          <div className="mt-1.5">
            <LevelChip
              level={item.applicable ? item.currentLevel : null}
              withName
            />
          </div>
        </div>
        <div className="bg-card px-5 py-3">
          <p className="text-xs text-muted-foreground">Target</p>
          <div className="mt-1.5">
            <LevelChip
              level={item.applicable ? item.targetLevel : null}
              withName
            />
          </div>
        </div>
        <div className="bg-card px-5 py-3">
          <p className="text-xs text-muted-foreground">Gap</p>
          <p className="mt-1.5 text-[13px] tabular">
            <GapValue value={gap(item)} />
          </p>
        </div>
        <div className="col-span-3 bg-card px-5 pb-3 pt-2">
          <MaturityTrack
            current={item.applicable ? item.currentLevel : null}
            target={item.applicable ? item.targetLevel : null}
            showScale
          />
        </div>
      </section>

      <Section
        title="Assessment"
        aside={
          <button
            type="button"
            onClick={() => setShowLegend((value) => !value)}
            className="text-xs text-link hover:underline"
            aria-expanded={showLegend}
          >
            {showLegend ? "Hide level definitions" : "Level definitions"}
          </button>
        }
      >
        {showLegend ? (
          <MaturityLegend className="mb-4 rounded-md border bg-muted/30 p-3 sm:grid-cols-1" />
        ) : null}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <span className="mb-1 block text-xs text-muted-foreground">
              Current maturity
            </span>
            <RatingInput
              value={item.currentLevel}
              onChange={(value) => onUpdate({ currentLevel: value })}
              label="Current maturity"
              disabled={disabled || !item.applicable}
              size="md"
            />
          </div>
          <div>
            <span className="mb-1 block text-xs text-muted-foreground">
              Target maturity
            </span>
            <RatingInput
              value={item.targetLevel}
              onChange={(value) => onUpdate({ targetLevel: value })}
              label="Target maturity"
              disabled={disabled || !item.applicable}
              size="md"
            />
          </div>
          <Field label="Confidence">
            <select
              value={item.confidence ?? ""}
              disabled={disabled}
              onChange={(event) =>
                onUpdate({
                  confidence: (event.target.value ||
                    null) as CapabilityView["confidence"],
                })
              }
              className={selectClass}
            >
              <option value="">Not stated</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Review state">
            <select
              value={item.reviewState}
              disabled={disabled}
              onChange={(event) =>
                onUpdate({
                  reviewState: event.target
                    .value as CapabilityView["reviewState"],
                })
              }
              className={selectClass}
            >
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </Field>
          <Field label="Rationale and observations" wide>
            <TextArea
              label="Rationale and observations"
              value={item.rationale}
              disabled={disabled}
              placeholder="Why this level? What evidence or observations support it?"
              onCommit={(value) => onUpdate({ rationale: value })}
            />
          </Field>
          <p className="col-span-2 text-xs text-muted-foreground">
            {item.assessedAt
              ? `Last assessed ${item.assessedAt.slice(0, 10)}${item.assessedByName ? ` by ${item.assessedByName}` : ""}.`
              : "Not assessed yet."}
          </p>
        </div>
      </Section>

      <Section title="Direction and ownership">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="Accountable function">
            <select
              value={item.accountableFunctionId ?? ""}
              disabled={disabled}
              onChange={(event) =>
                onUpdate({ accountableFunctionId: event.target.value || null })
              }
              className={selectClass}
            >
              <option value="">No owner</option>
              {functions.map((pillar) => (
                <optgroup key={pillar.key} label={pillar.name}>
                  {pillar.functions.map((fn) => (
                    <option key={fn.id} value={fn.id}>
                      {fn.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Target date">
            <input
              type="date"
              value={item.targetDate ?? ""}
              disabled={disabled}
              onChange={(event) =>
                onUpdate({ targetDate: event.target.value || null })
              }
              className={selectClass}
            />
          </Field>
          <fieldset className="col-span-2">
            <legend className="mb-1 text-xs text-muted-foreground">
              Pillars involved
            </legend>
            <div className="flex flex-wrap gap-4">
              {pillars.map((pillar) => {
                const checked = item.pillarKeys.includes(pillar.id);
                return (
                  <label
                    key={pillar.id}
                    className="flex items-center gap-1.5 text-[13px]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={
                        disabled || (checked && item.pillarKeys.length === 1)
                      }
                      onChange={() =>
                        onUpdate({
                          pillarKeys: checked
                            ? item.pillarKeys.filter((key) => key !== pillar.id)
                            : pillars
                                .map((entry) => entry.id)
                                .filter(
                                  (key) =>
                                    key === pillar.id ||
                                    item.pillarKeys.includes(key),
                                ),
                        })
                      }
                    />
                    {pillar.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="col-span-2 flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={item.applicable}
              disabled={disabled}
              onChange={(event) =>
                onUpdate({ applicable: event.target.checked })
              }
            />
            Applicable to this organization
          </label>
        </div>
      </Section>

      <Section title={`Operational KPIs (${item.indicators.length})`}>
        <ul className="space-y-3">
          {item.indicators.map((kpi) => (
            <IndicatorRow
              key={kpi.id}
              indicator={kpi}
              canEdit={canEdit}
              onUpdate={(patch) => onUpdateIndicator(kpi.id, patch)}
              onDelete={() => onDeleteIndicator(kpi.id)}
            />
          ))}
        </ul>
        {canEdit ? <NewIndicator onCreate={onCreateIndicator} /> : null}
      </Section>

      <Section title="Framework references">
        <p className="text-xs text-muted-foreground">
          NIST CSF 2.0 and CJIS Security Policy 6.0 mappings appear here once
          the authoritative framework references are loaded. A topic is assessed
          once and shared across every requirement it maps to.
        </p>
      </Section>

      <Section title="History">
        {history == null ? (
          <p className="text-xs text-muted-foreground">Loading history…</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-muted-foreground">No changes recorded.</p>
        ) : (
          <ol className="space-y-2">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="grid grid-cols-[88px_1fr] gap-3 text-xs"
              >
                <time
                  dateTime={entry.at}
                  className="text-muted-foreground tabular"
                >
                  {entry.at.slice(0, 10)}
                </time>
                <span>
                  {describe(entry)}
                  <span className="text-muted-foreground">
                    {" "}
                    · {entry.actor ?? "System"}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}

function IndicatorRow({
  indicator,
  canEdit,
  onUpdate,
  onDelete,
}: {
  indicator: IndicatorView;
  canEdit: boolean;
  onUpdate: (patch: IndicatorPatch) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pass, setPass] = useState(String(indicator.passThreshold));
  const [fail, setFail] = useState(String(indicator.failThreshold));
  return (
    <li className="rounded-md border px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium">{indicator.name}</p>
          <p className="text-[11px] text-muted-foreground tabular">
            {indicatorRule(indicator)} ·{" "}
            {indicator.direction === "higher"
              ? "higher is better"
              : "lower is better"}
            {indicator.catalogueKey
              ? ` · ${indicator.catalogueKey}`
              : " · local KPI"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canEdit ? (
            <KpiValueInput
              indicator={indicator}
              label={`${indicator.name} value`}
              onSave={onUpdate}
            />
          ) : (
            <span className="text-[13px] tabular">
              {indicator.value ?? "—"}
            </span>
          )}
          <span className="w-16">
            <IndicatorBadge indicator={indicator} />
          </span>
        </div>
      </div>
      <KpiBand indicator={indicator} className="mt-2" />
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {indicator.measuredAt
            ? `Measured ${indicator.measuredAt}`
            : "No measurement recorded"}
        </span>
        {canEdit ? (
          <span className="flex items-center gap-3">
            <button
              type="button"
              className="text-link hover:underline"
              onClick={() => setEditing((value) => !value)}
              aria-expanded={editing}
            >
              {editing ? "Close" : "Edit boundaries"}
            </button>
            {indicator.catalogueKey ? null : (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-destructive hover:underline"
                onClick={onDelete}
              >
                <Trash2 aria-hidden="true" className="size-3" />
                Delete
              </button>
            )}
          </span>
        ) : null}
      </div>
      {editing ? (
        <form
          className="mt-2 flex items-end gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (
              await onUpdate({
                passThreshold: Number(pass),
                failThreshold: Number(fail),
              })
            )
              setEditing(false);
          }}
        >
          <Field
            label={`Pass ${indicator.direction === "higher" ? "at or above" : "at or below"}`}
          >
            <input
              value={pass}
              onChange={(event) => setPass(event.target.value)}
              inputMode="decimal"
              required
              className="form-input h-7 w-24 py-0 text-[13px]"
            />
          </Field>
          <Field
            label={`Fail ${indicator.direction === "higher" ? "below" : "above"}`}
          >
            <input
              value={fail}
              onChange={(event) => setFail(event.target.value)}
              inputMode="decimal"
              required
              className="form-input h-7 w-24 py-0 text-[13px]"
            />
          </Field>
          <Button type="submit" size="sm" variant="outline">
            Save
          </Button>
        </form>
      ) : null}
    </li>
  );
}

function NewIndicator({
  onCreate,
}: {
  onCreate: (
    body: Omit<IndicatorView, "id" | "catalogueKey">,
  ) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    unit: "%",
    direction: "higher" as "higher" | "lower",
    pass: "",
    fail: "",
  });
  if (!open)
    return (
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 text-link"
        onClick={() => setOpen(true)}
      >
        <Plus aria-hidden="true" />
        Add local KPI
      </Button>
    );
  return (
    <form
      className="mt-3 grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const ok = await onCreate({
          name: form.name,
          unit: form.unit,
          direction: form.direction,
          passThreshold: Number(form.pass),
          failThreshold: Number(form.fail),
          value: null,
          measuredAt: null,
        });
        if (ok) {
          setOpen(false);
          setForm({
            name: "",
            unit: "%",
            direction: "higher",
            pass: "",
            fail: "",
          });
        }
      }}
    >
      <Field label="KPI name" wide>
        <input
          required
          maxLength={120}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="form-input h-8 py-0 text-[13px]"
        />
      </Field>
      <Field label="Favourable direction">
        <select
          value={form.direction}
          onChange={(event) =>
            setForm({
              ...form,
              direction: event.target.value as "higher" | "lower",
            })
          }
          className={selectClass}
        >
          <option value="higher">Higher is better</option>
          <option value="lower">Lower is better</option>
        </select>
      </Field>
      <Field label="Unit">
        <input
          required
          maxLength={30}
          value={form.unit}
          onChange={(event) => setForm({ ...form, unit: event.target.value })}
          className="form-input h-8 py-0 text-[13px]"
        />
      </Field>
      <Field label="Pass boundary">
        <input
          required
          inputMode="decimal"
          value={form.pass}
          onChange={(event) => setForm({ ...form, pass: event.target.value })}
          className="form-input h-8 py-0 text-[13px]"
        />
      </Field>
      <Field label="Fail boundary">
        <input
          required
          inputMode="decimal"
          value={form.fail}
          onChange={(event) => setForm({ ...form, fail: event.target.value })}
          className="form-input h-8 py-0 text-[13px]"
        />
      </Field>
      <div className="col-span-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Add KPI
        </Button>
      </div>
    </form>
  );
}
