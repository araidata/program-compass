import type { Prisma } from "@/generated/prisma/client";
import { loadWorkforce } from "./workforce";
import { loadPlanning } from "./planning";
import { loadContext } from "./context";
import { loadCapacity } from "./capacity";
import { loadFinance } from "./finance";
import { loadAlignment } from "./alignment";
import {
  personInput,
  positionInput,
  reportingCycle,
} from "@/lib/domain/workforce";
import { planningSchemas, dependencyCycle } from "@/lib/domain/planning";
import {
  capacitySchemas,
  allocationExceeded,
  type Assignment,
} from "@/lib/domain/capacity";
import { financeSchemas, costIdentity, type Cost } from "@/lib/domain/finance";
import {
  profileInput,
  objectiveInput,
  threatInput,
} from "@/lib/domain/context";
import { methodValuesSchema } from "@/lib/domain/methods";
import { requirementInput } from "@/lib/domain/alignment";
import { ExchangeError, type RelationalBundle } from "./exchange-core";
const strip = (row: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(Object.entries(row).filter(([k]) => !keys.includes(k)));
/** Called inside the rollback preview and again inside the final atomic apply. */
export async function validateRestoredData(
  tx: Prisma.TransactionClient,
  bundle: RelationalBundle,
) {
  const workforce = await loadWorkforce(tx);
  if (!workforce) throw new ExchangeError(409, "Workforce schema unavailable");
  for (const p of workforce.people) {
    personInput.parse(strip(p, ["id", "revision"]));
    if (reportingCycle(workforce.people, p.id, p.managerId))
      throw new ExchangeError(400, "Reporting hierarchy cycle");
  }
  for (const p of workforce.positions) {
    positionInput.parse(strip(p, ["id", "revision"]));
    if (p.personId && p.state !== "authorized")
      throw new ExchangeError(
        400,
        "Only authorized positions can have incumbents",
      );
  }
  for (const p of workforce.people) {
    const fte = workforce.positions
      .filter((r) => r.personId === p.id && r.state === "authorized")
      .reduce((s, p) => s + p.fte, 0);
    if (fte > 1.000001)
      throw new ExchangeError(400, "Position allocations exceed person FTE");
  }
  const planning = await loadPlanning(tx);
  for (const r of planning.rows) {
    planningSchemas[r.kind].parse(r.values);
    if (r.kind === "initiative" || r.kind === "technology") {
      const peers = planning.rows
        .filter((p) => p.kind === r.kind)
        .map((p) => ({
          id: p.id,
          dependencies: p.values.dependencyIds as string[],
        }));
      if (dependencyCycle(peers, r.id, r.values.dependencyIds as string[]))
        throw new ExchangeError(400, "Planning dependency cycle");
    }
  }
  const context = await loadContext(tx);
  if (context?.profile)
    profileInput.parse(strip(context.profile, ["id", "revision"]));
  for (const o of context?.objectives ?? [])
    objectiveInput.parse(strip(o, ["id", "revision"]));
  for (const t of context?.threats ?? []) {
    threatInput.parse(strip(t, ["id", "revision"]));
    if (t.objectiveIds.length + t.capabilityIds.length === 0)
      throw new ExchangeError(
        400,
        "Business threat needs a strategic planning relationship",
      );
  }
  const capacity = await loadCapacity(tx);
  for (const r of capacity.rows) capacitySchemas[r.kind].parse(r.values);
  const assignments = capacity.rows
    .filter((r) => r.kind === "assignment")
    .map((r) => r.values as Assignment);
  for (const p of workforce.positions)
    if (
      allocationExceeded(
        assignments.filter((a) => a.positionId === p.id),
        p.fte,
      )
    )
      throw new ExchangeError(400, "Dated assignments exceed position FTE");
  for (const p of workforce.people)
    if (
      allocationExceeded(
        assignments.filter((a) => a.personId === p.id),
        1,
      )
    )
      throw new ExchangeError(400, "Dated assignments exceed person FTE");
  const finance = await loadFinance(tx);
  for (const r of finance.rows) {
    financeSchemas[r.kind].parse(r.values);
    if (
      r.kind === "cost" &&
      costIdentity(r.values as Cost) !== r.values.identity
    )
      throw new ExchangeError(400, "Financial resource identity mismatch");
    if (["target", "budget"].includes(r.kind)) {
      const scenario = finance.rows.find(
        (s) => s.kind === "scenario" && s.id === r.values.scenarioId,
      );
      if (
        !scenario ||
        Number(r.values.year) < Number(scenario.values.startYear) ||
        Number(r.values.year) > Number(scenario.values.startYear) + 4
      )
        throw new ExchangeError(
          400,
          "Annual target/budget is outside its five-year horizon",
        );
    }
  }
  for (const m of finance.methods) methodValuesSchema.parse(m.values);
  const alignment = await loadAlignment(tx);
  for (const r of alignment.requirements) requirementInput.parse(r.values);
  for (const c of await tx.capability.findMany({
    include: { pillars: true, indicators: true },
  })) {
    if (
      c.pillars.length === 0 ||
      [c.currentLevel, c.targetLevel].some(
        (v) => v !== null && (v < 1 || v > 5),
      )
    )
      throw new ExchangeError(400, "Capability maturity/scope is invalid");
    for (const k of c.indicators)
      if (
        k.direction === "higher"
          ? k.passThreshold.lessThan(k.failThreshold)
          : k.passThreshold.greaterThan(k.failThreshold)
      )
        throw new ExchangeError(400, "KPI pass/fail boundaries are inverted");
  }
  for (const c of bundle.tables.PlanningCycle) {
    if (c.dataset !== null) {
      const d = c.dataset as {
        version?: number;
        methods?: { values: unknown };
        capabilities?: unknown[];
      };
      if (d.version !== 2 || !d.methods || !Array.isArray(d.capabilities))
        throw new ExchangeError(409, "Unsupported captured dataset version");
      methodValuesSchema.parse(d.methods.values);
    }
  }
}
