import type { FieldSpec } from "./record-editor";
import type {
  PlanningData,
  PlanningKind,
  FieldValue,
} from "@/lib/domain/planning";
import type { MethodValues } from "@/lib/domain/methods";
const select = (key: string, label: string, values: string[]): FieldSpec => ({
  key,
  label,
  type: "select",
  required: true,
  options: values.map((id) => ({ id, label: id.replaceAll("-", " ") })),
});
export function planningFields(
  kind: PlanningKind,
  data: PlanningData,
): FieldSpec[] {
  const owner: FieldSpec = {
    key: "ownerId",
    label: "Accountable person",
    type: "select",
    options: data.options.people,
  };
  const caps: FieldSpec = {
    key: "capabilityIds",
    label: "Capabilities",
    type: "multi",
    options: data.options.capabilities,
  };
  const reqs: FieldSpec = {
    key: "requirementIds",
    label: "Requirement drivers",
    type: "multi",
    options: data.options.requirements,
  };
  const multi = (
    key: string,
    label: string,
    other: PlanningKind,
  ): FieldSpec => ({
    key,
    label,
    type: "multi",
    options: data.rows
      .filter((r) => r.kind === other)
      .map((r) => ({ id: r.id, label: String(r.values.title) })),
  });
  const dates = (keys: string[]): FieldSpec[] =>
    keys.map((key) => ({
      key,
      label: key.replace(/([A-Z])/g, " $1"),
      type: "date",
    }));
  const prose = (key: string, label: string): FieldSpec => ({
    key,
    label,
    type: "textarea",
    required: true,
  });
  const money = (key: string, label: string): FieldSpec => ({
    key,
    label,
    type: "number",
    min: 0,
    max: 1e10,
    step: 0.01,
    help: "Unknown remains blank. Enter a sourced amount; zero is an explicit estimate of no additional cost.",
  });
  const base: FieldSpec[] = [
    { key: "title", label: "Title", required: true },
    prose("description", "Description and planning scope"),
    owner,
    caps,
    reqs,
  ];
  if (kind === "responsibility")
    return [
      ...base,
      {
        key: "functionId",
        label: "Accountable function",
        type: "select",
        required: true,
        options: data.options.functions,
      },
      {
        key: "positionIds",
        label: "Responsible positions",
        type: "multi",
        options: data.options.positions,
      },
      prose("source", "Source/basis and planning decision"),
      { key: "active", label: "Active", type: "checkbox" },
    ];
  if (kind === "issue")
    return [
      ...base,
      prose("source", "Source or external reference"),
      prose("consequence", "Planning consequence and investment decision"),
      ...dates(["openedDate", "dueDate"]),
      select("status", "Planning issue status", [
        "open",
        "in-progress",
        "resolved",
        "deferred",
      ]),
      multi("initiativeIds", "Addressing initiatives", "initiative"),
    ];
  if (kind === "technology")
    return [
      ...base,
      select("decision", "Investment alternative", [
        "inventory",
        "optimization",
        "expansion",
        "consolidation",
        "replacement",
        "retirement",
        "acquisition",
        "managed-service",
      ]),
      select("deploymentState", "Deployment state", [
        "unknown",
        "planned",
        "pilot",
        "partial",
        "deployed",
        "offline",
      ]),
      multi(
        "alternativeIds",
        "Existing technologies / alternatives compared",
        "technology",
      ),
      { key: "vendor", label: "Vendor" },
      { key: "category", label: "Category", required: true },
      prose("source", "Estimate source/basis"),
      prose(
        "alternatives",
        "Existing coverage, options and investment rationale",
      ),
      select("deficiencyType", "Deficiency cause", [
        "technology",
        "underutilization",
        "staffing",
        "process",
        "none",
      ]),
      select("state", "Portfolio state", ["existing", "proposed", "retired"]),
      {
        key: "coveragePercent",
        label: "Deployment coverage (%)",
        type: "number",
        min: 0,
        max: 100,
        step: 0.01,
      },
      {
        key: "utilizationPercent",
        label: "Utilization (%)",
        type: "number",
        min: 0,
        max: 100,
        step: 0.01,
      },
      ...dates(["startDate", "renewalDate", "retirementDate"]),
      money("annualLicenseCost", "Annual licensing cost"),
      money("annualOperatingCost", "Annual operating cost"),
      money("implementationCost", "One-time implementation cost"),
      { key: "currency", label: "Currency", required: true },
      multi(
        "responsibilityIds",
        "Supported responsibilities",
        "responsibility",
      ),
      multi("dependencyIds", "Technology dependencies", "technology"),
    ];
  return [
    ...base,
    prose("justification", "Business justification and estimate basis"),
    prose("outcomes", "Expected outcomes"),
    prose("deferral", "Consequences of deferral"),
    select("investmentState", "Investment decision", ["proposed", "approved"]),
    select("status", "Execution status", [
      "planned",
      "in-progress",
      "on-hold",
      "completed",
      "cancelled",
    ]),
    {
      key: "priority",
      label: "Priority (5 highest)",
      type: "number",
      min: 1,
      max: 5,
      required: true,
    },
    ...dates(["startDate", "endDate"]),
    {
      key: "effortHours",
      label: "Implementation effort (hours)",
      type: "number",
      min: 0,
      max: 1e10,
      step: 0.01,
    },
    money("oneTimeCost", "Additional one-time initiative cost"),
    money("recurringCost", "Additional annual initiative cost"),
    { key: "currency", label: "Currency", required: true },
    {
      key: "objectiveIds",
      label: "Business objectives",
      type: "multi",
      options: data.options.objectives,
    },
    multi("issueIds", "Planning deficiencies", "issue"),
    {
      key: "positionIds",
      label: "Workforce requirements",
      type: "multi",
      options: data.options.positions,
    },
    multi("technologyIds", "Technology requirements", "technology"),
    multi("dependencyIds", "Prerequisite initiatives", "initiative"),
  ];
}
export function newPlanningValues(
  kind: PlanningKind,
  methods: MethodValues,
  day: string,
): Record<string, FieldValue> {
  const base = {
    title: "",
    description: "",
    ownerId: null,
    capabilityIds: [],
    requirementIds: [],
  };
  if (kind === "responsibility")
    return {
      ...base,
      source: "",
      functionId: "",
      positionIds: [],
      active: true,
    };
  if (kind === "issue")
    return {
      ...base,
      source: "",
      consequence: "",
      openedDate: day,
      dueDate: null,
      status: "open",
      initiativeIds: [],
    };
  if (kind === "technology")
    return {
      ...base,
      decision: "inventory",
      deploymentState: "unknown",
      retirementDate: null,
      alternativeIds: [],
      vendor: "",
      category: "",
      source: "",
      alternatives: "",
      deficiencyType: "technology",
      state: "proposed",
      coveragePercent: null,
      utilizationPercent: null,
      startDate: null,
      renewalDate: null,
      annualLicenseCost: null,
      annualOperatingCost: null,
      implementationCost: null,
      currency: methods.currency,
      responsibilityIds: [],
      dependencyIds: [],
    };
  return {
    ...base,
    justification: "",
    outcomes: "",
    deferral: "",
    investmentState: "proposed",
    status: "planned",
    priority: 3,
    startDate: null,
    endDate: null,
    effortHours: null,
    oneTimeCost: null,
    recurringCost: null,
    currency: methods.currency,
    issueIds: [],
    objectiveIds: [],
    positionIds: [],
    technologyIds: [],
    dependencyIds: [],
  };
}
