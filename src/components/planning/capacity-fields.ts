import type { FieldSpec, RecordDraft } from "./record-editor";
import type { CapacityData, CapacityKind } from "@/lib/domain/capacity";
import type { WorkforceData } from "@/lib/domain/workforce";
import type { PlanningData } from "@/lib/domain/planning";
const num = (key: string, label: string, min = 0, max = 1e10): FieldSpec => ({
  key,
  label,
  type: "number",
  min,
  max,
  step: 0.0001,
});
export function capacityFields(
  kind: CapacityKind,
  data: CapacityData,
  workforce: WorkforceData,
  planning: PlanningData,
): FieldSpec[] {
  const responsibilities = planning.rows
    .filter((r) => r.kind === "responsibility")
    .map((r) => ({ id: r.id, label: String(r.values.title) }));
  const nice = data.nice
    .filter((n) =>
      ["task", "work_role", "skill", "knowledge", "competency_area"].includes(
        n.kind,
      ),
    )
    .map((n) => ({ id: n.id, label: `${n.identifier} · ${n.title}` }));
  const select = (
    key: string,
    label: string,
    options: { id: string; label: string }[],
    required = false,
  ): FieldSpec => ({ key, label, options, required, type: "select" });
  const responsibility = select(
    "responsibilityId",
    "Primary responsibility",
    responsibilities,
    true,
  );
  const common: FieldSpec[] = [
    { key: "title", label: "Title", required: true },
    {
      key: "source",
      label: "Source / estimate basis (include units and provenance)",
      type: "textarea",
      required: true,
    },
    { key: "active", label: "Active (clear to archive)", type: "checkbox" },
  ];
  if (kind === "activity")
    return [
      ...common,
      {
        key: "workKey",
        label: "Unique activity identity",
        required: true,
        help: "One business activity, regardless of how many capabilities/frameworks it supports.",
      },
      responsibility,
      num("year", "Workload year", 2000, 2200),
      {
        key: "effectiveDate",
        label: "Estimate effective date",
        type: "date",
        required: true,
      },
      { key: "provisional", label: "Provisional estimate", type: "checkbox" },
      select(
        "workType",
        "Work type",
        ["run", "change"].map((id) => ({ id, label: id })),
        true,
      ),
      num("volume", "Units per occurrence"),
      num("frequency", "Occurrences per year"),
      num("hoursPerUnit", "Hours per unit"),
      num("fixedHours", "Fixed hours per year"),
      num("projectHours", "Project hours per year"),
      num("growth", "Growth multiplier (1 means unchanged)", 0, 100),
      num("outsourcedHours", "Distinct outsourced hours per year"),
      num("automatedHours", "Distinct automated hours per year"),
      num(
        "productiveHoursPerFte",
        "Sourced productive hours per FTE-year",
        0.0001,
        8784,
      ),
      {
        key: "capabilityIds",
        label: "Capability drivers",
        type: "multi",
        options: planning.options.capabilities,
      },
      {
        key: "requirementIds",
        label: "Requirement drivers",
        type: "multi",
        options: planning.options.requirements,
      },
      {
        key: "niceIds",
        label: "NICE roles / tasks / knowledge / skills",
        type: "multi",
        options: nice,
      },
    ];
  if (kind === "assignment")
    return [
      ...common,
      select(
        "positionId",
        "Position",
        workforce.positions.map((p) => ({
          id: p.id,
          label: `${p.title} · ${p.state}`,
        })),
        true,
      ),
      select(
        "personId",
        "Actual incumbent (blank for vacancy/proposal)",
        workforce.people
          .filter((p) => p.active)
          .map((p) => ({ id: p.id, label: p.name })),
      ),
      responsibility,
      {
        key: "startDate",
        label: "Assignment start",
        type: "date",
        required: true,
      },
      { key: "endDate", label: "Assignment end (inclusive)", type: "date" },
      num("allocatedFte", "Allocated position FTE", 0.0001, 1),
      num("paidHours", "Annual paid hours per full-time person", 0, 8784),
      num(
        "productiveHours",
        "Annual productive hours per full-time person",
        0,
        8784,
      ),
      num("runShare", "Run share of productive capacity (0–1)", 0, 1),
    ];
  if (kind === "skill")
    return [
      ...common,
      select(
        "personId",
        "Person",
        workforce.people.map((p) => ({ id: p.id, label: p.name })),
        true,
      ),
      select("niceElementId", "NICE element", nice, true),
      num(
        "currentLevel",
        "Observed current skill level (organization 1–5 scale)",
        1,
        5,
      ),
      num("targetLevel", "Target skill level", 1, 5),
      {
        key: "assessedDate",
        label: "Observed date",
        type: "date",
        required: true,
      },
      {
        key: "notes",
        label: "Observation notes / organization scale basis",
        type: "textarea",
      },
    ];
  return [
    ...common,
    responsibility,
    select(
      "kind",
      "Constraint type",
      [
        "minimum-coverage",
        "continuity",
        "expertise",
        "separation-of-duties",
      ].map((id) => ({ id, label: id })),
      true,
    ),
    select(
      "conflictingResponsibilityId",
      "Responsibility requiring a different assignee",
      responsibilities,
    ),
    num("minimumPeople", "Minimum distinct people", 1, 10000),
    num("minimumFte", "Minimum coverage FTE", 0, 10000),
    select("niceElementId", "Required NICE expertise", nice),
    num("minimumSkill", "Required observed expertise level", 1, 5),
    {
      key: "consequence",
      label: "Planning consequence of unmet coverage",
      type: "textarea",
      required: true,
    },
    {
      key: "alternatives",
      label: "Alternatives and continuity arrangements",
      type: "textarea",
      required: true,
    },
  ];
}
export function newCapacityDraft(
  kind: CapacityKind,
  year: number,
): RecordDraft {
  const values: RecordDraft["values"] = { title: "", source: "", active: true };
  if (kind === "activity")
    Object.assign(values, {
      workKey: "",
      responsibilityId: null,
      effectiveDate: new Date().toISOString().slice(0, 10),
      provisional: true,
      year,
      workType: "run",
      volume: null,
      frequency: null,
      hoursPerUnit: null,
      fixedHours: null,
      projectHours: null,
      growth: null,
      outsourcedHours: null,
      automatedHours: null,
      productiveHoursPerFte: null,
      capabilityIds: [],
      requirementIds: [],
      niceIds: [],
    });
  if (kind === "assignment")
    Object.assign(values, {
      positionId: null,
      personId: null,
      responsibilityId: null,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null,
      allocatedFte: null,
      paidHours: null,
      productiveHours: null,
      runShare: null,
    });
  if (kind === "skill")
    Object.assign(values, {
      personId: null,
      niceElementId: null,
      currentLevel: null,
      targetLevel: null,
      assessedDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  if (kind === "constraint")
    Object.assign(values, {
      responsibilityId: null,
      conflictingResponsibilityId: null,
      kind: "minimum-coverage",
      minimumPeople: null,
      minimumFte: null,
      niceElementId: null,
      minimumSkill: null,
      consequence: "",
      alternatives: "",
    });
  return { kind, values };
}
