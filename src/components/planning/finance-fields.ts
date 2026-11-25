import type { FieldSpec, RecordDraft } from "./record-editor";
import {
  scenarioKinds,
  type FinanceData,
  type FinanceKind,
} from "@/lib/domain/finance";
import type { PlanningData } from "@/lib/domain/planning";
import type { WorkforceData } from "@/lib/domain/workforce";
import type { Methods } from "@/lib/domain/methods";
const option = (ids: readonly string[]) =>
  ids.map((id) => ({ id, label: id.replaceAll("-", " ") }));
export function financeFields(
  kind: FinanceKind,
  data: FinanceData,
  planning: PlanningData,
  workforce: WorkforceData,
): FieldSpec[] {
  const select = (
    key: string,
    label: string,
    options: { id: string; label: string }[],
    required = false,
  ): FieldSpec => ({ key, label, type: "select", options, required });
  const num = (
    key: string,
    label: string,
    min: number,
    max: number,
  ): FieldSpec => ({
    key,
    label,
    type: "number",
    min,
    max,
    step: key === "escalationPercent" ? 0.0001 : 1,
  });
  const base: FieldSpec[] = [
    { key: "title", label: "Title", required: true },
    {
      key: "source",
      label: "Source / calculation basis / planning decision",
      type: "textarea",
      required: true,
    },
  ];
  const resource: FieldSpec[] = [
    select(
      "initiativeId",
      "Initiative (select exactly one resource)",
      planning.rows
        .filter((r) => r.kind === "initiative")
        .map((r) => ({ id: r.id, label: String(r.values.title) })),
    ),
    select(
      "positionId",
      "Position",
      workforce.positions.map((p) => ({
        id: p.id,
        label: `${p.title} · ${p.state}`,
      })),
    ),
    select(
      "technologyId",
      "Technology",
      planning.rows
        .filter((r) => r.kind === "technology")
        .map((r) => ({ id: r.id, label: String(r.values.title) })),
    ),
  ];
  const scenario = select(
    "scenarioId",
    "Scenario",
    data.rows
      .filter((r) => r.kind === "scenario")
      .map((r) => ({ id: r.id, label: String(r.values.title) })),
    true,
  );
  const dates: FieldSpec[] = [
    {
      key: "startDate",
      label: "Activation / implementation start",
      type: "date",
    },
    {
      key: "endDate",
      label: "End / retirement date (inclusive)",
      type: "date",
    },
  ];
  const currency: FieldSpec = {
    key: "currency",
    label: "Currency (ISO three letters)",
    required: true,
  };
  const money: FieldSpec = {
    key: "amount",
    label: "Amount (exact decimal; blank = unknown)",
    help: "Annual amount for recurring costs; one-time amount for once. No currency conversion.",
  };
  if (kind === "scenario")
    return [
      ...base,
      select("kind", "Planning strategy", option(scenarioKinds), true),
      select(
        "methodVersionId",
        "Captured assumption version",
        data.methods.map((m) => ({
          id: m.id,
          label: `${m.effectiveDate} · ${m.provisional ? "provisional" : "approved"} · ${m.id}`,
        })),
        true,
      ),
      num("startYear", "First planning year", 2000, 2196),
      num("fiscalStartMonth", "Fiscal start month (1–12)", 1, 12),
      currency,
      { key: "active", label: "Active (clear to archive)", type: "checkbox" },
    ];
  if (kind === "item")
    return [
      ...base,
      scenario,
      ...resource,
      {
        key: "included",
        label: "Include in scenario (baseline/shared records unchanged)",
        type: "checkbox",
      },
      ...dates,
      {
        key: "deferral",
        label: "Consequences of exclusion / deferral",
        type: "textarea",
        required: true,
      },
    ];
  if (kind === "target")
    return [
      ...base,
      scenario,
      select("capabilityId", "Capability", planning.options.capabilities, true),
      num("year", "Target year", 2000, 2200),
      num("level", "Annual target level", 1, 5),
    ];
  if (kind === "budget")
    return [...base, scenario, num("year", "Budget year", 2000, 2200), money];
  return [
    ...base,
    {
      key: "identity",
      label: "Unique cost identity",
      required: true,
      help: "Primary resource components have reserved identities; additional costs must begin additional:.",
    },
    ...resource,
    select(
      "capabilityId",
      "Optional strategic capability driver",
      planning.options.capabilities,
    ),
    select(
      "component",
      "Identity component",
      option([
        "resource-once",
        "resource-recurring",
        "resource-license",
        "resource-operating",
        "additional",
      ]),
      true,
    ),
    select(
      "category",
      "Cost category",
      option([
        "salary",
        "licensing",
        "implementation",
        "operating",
        "training",
        "managed-service",
        "savings",
      ]),
      true,
    ),
    select("frequency", "Timing", option(["once", "annual"]), true),
    money,
    currency,
    ...dates,
    num(
      "escalationPercent",
      "Annual escalation percent override (blank uses versioned category assumption)",
      -100,
      100,
    ),
    { key: "baseline", label: "Existing baseline cost", type: "checkbox" },
    {
      key: "saving",
      label: "Savings / avoided cost (subtract from total)",
      type: "checkbox",
    },
    { key: "active", label: "Active cost line", type: "checkbox" },
  ];
}
export function newFinanceDraft(
  kind: FinanceKind,
  methods: Methods,
  scenarioId: string,
): RecordDraft {
  const values: RecordDraft["values"] = { title: "", source: "" };
  if (kind === "scenario")
    Object.assign(values, {
      kind: "alternative-funding",
      methodVersionId: methods.id,
      startYear: methods.values.planStartYear,
      fiscalStartMonth: methods.values.fiscalStartMonth,
      currency: methods.values.currency,
      active: true,
    });
  if (kind === "item")
    Object.assign(values, {
      scenarioId,
      initiativeId: null,
      positionId: null,
      technologyId: null,
      included: true,
      startDate: null,
      endDate: null,
      deferral: "",
    });
  if (kind === "target")
    Object.assign(values, {
      scenarioId,
      capabilityId: null,
      year: methods.values.planStartYear,
      level: null,
    });
  if (kind === "budget")
    Object.assign(values, {
      scenarioId,
      year: methods.values.planStartYear,
      amount: null,
    });
  if (kind === "cost")
    Object.assign(values, {
      identity: "additional:",
      initiativeId: null,
      positionId: null,
      technologyId: null,
      capabilityId: null,
      component: "additional",
      category: "training",
      frequency: "once",
      amount: null,
      currency: methods.values.currency,
      startDate: null,
      endDate: null,
      escalationPercent: null,
      baseline: false,
      saving: false,
      active: true,
    });
  return { kind, values };
}
