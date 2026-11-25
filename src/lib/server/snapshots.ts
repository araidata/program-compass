import "server-only";
import { loadFinance } from "./finance";
import type { FinanceData } from "@/lib/domain/finance";
import { loadCapacity } from "./capacity";
import type { CapacityData } from "@/lib/domain/capacity";
import { notFound } from "next/navigation";
import { loadAlignment } from "./alignment";
import type { AlignmentData } from "@/lib/domain/alignment";
import { loadPlanning } from "./planning";
import type { PlanningData } from "@/lib/domain/planning";
import { db } from "./db";
import { HttpError } from "./access";
import { capabilityInclude, toView } from "./capabilities";
import { loadContext } from "./context";
import { loadWorkforce } from "./workforce";
import {
  defaultMethods,
  methodValuesSchema,
  type Methods,
} from "@/lib/domain/methods";
import type { CapabilityView } from "@/lib/domain/capabilities";
import type { ContextData } from "@/lib/domain/context";
import type { WorkforceData } from "@/lib/domain/workforce";
import type { Prisma } from "@/generated/prisma/client";
export type SnapshotDataset = {
  version: 2;
  capacity?: CapacityData;
  finance?: FinanceData;
  planning?: PlanningData;
  alignment?: AlignmentData;
  capturedAt: string;
  methods: Methods;
  capabilities: CapabilityView[];
  context: ContextData | null;
  workforce: WorkforceData | null;
  references: unknown;
  functionOptions: {
    key: string;
    name: string;
    functions: { id: string; name: string }[];
  }[];
  history: unknown[];
};
export async function captureDataset(
  tx: Prisma.TransactionClient,
): Promise<SnapshotDataset> {
  const record = await tx.planningMethodVersion.findFirst({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  const methods: Methods = record
    ? {
        ...record,
        values: methodValuesSchema.parse(record.values),
        effectiveDate: record.effectiveDate.toISOString().slice(0, 10),
        createdAt: record.createdAt.toISOString(),
      }
    : defaultMethods;
  const caps = await tx.capability.findMany({
    include: capabilityInclude,
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
  });
  const pillars = await tx.pillar.findMany({
    include: { functions: true },
    orderBy: { sortOrder: "asc" },
  });
  const functionOptions = pillars.map((p) => ({
    key: p.key,
    name: p.name,
    functions: p.functions.map((f) => ({ id: f.id, name: f.name })),
  }));
  const finance = await loadFinance(tx);
  const capacity = await loadCapacity(tx);
  const alignment = await loadAlignment(tx);
  const planning = await loadPlanning(tx);
  const context = await loadContext(tx);
  const workforce = await loadWorkforce(tx);
  const history = await tx.changeEvent.findMany({
    where: {
      entityType: {
        in: [
          "Capability",
          "Person",
          "Position",
          "BusinessObjective",
          "BusinessThreat",
          "PlanningMethodVersion",
          "responsibility",
          "planningIssue",
          "initiative",
          "technology",
          "RequirementAssessment",
          "planningScenario",
          "scenarioItem",
          "annualCapabilityTarget",
          "scenarioBudget",
          "financialCost",
          "workActivity",
          "capacityAssignment",
          "skillObservation",
          "workforceConstraint",
        ],
      },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: { actor: { select: { name: true } } },
  });
  return JSON.parse(
    JSON.stringify({
      version: 2,
      capacity,
      finance,
      planning,
      alignment,
      capturedAt: new Date().toISOString(),
      methods,
      capabilities: caps.map((c) => toView(c, methods)),
      context,
      workforce,
      functionOptions,
      references: { frameworks: alignment.frameworks },
      history,
    }),
  ) as SnapshotDataset;
}
export async function readCycle(id: string) {
  const cycle = await db().planningCycle.findUnique({
    where: { id },
    include: { snapshots: true },
  });
  if (!cycle) throw new HttpError(404, "Cycle not found");
  const dataset = cycle.dataset as unknown as SnapshotDataset | null;
  if (dataset && dataset.version !== 2)
    throw new HttpError(409, "Unsupported snapshot version");
  return {
    ...cycle,
    dataset,
    capabilities:
      dataset?.capabilities ??
      cycle.snapshots.map((s) => s.assessment as unknown as CapabilityView),
    methods: dataset?.methods ?? defaultMethods,
  };
}

export async function readPageCycle(id?: string) {
  if (!id) return null;
  try {
    return await readCycle(id);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
}
