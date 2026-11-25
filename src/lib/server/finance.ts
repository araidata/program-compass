import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { HttpError } from "./errors";
import {
  financeKinds,
  financeSchemas,
  costIdentity,
  type Cost,
  type FinanceKind,
  type FinanceRow,
  type FinanceData,
} from "@/lib/domain/finance";
import { methodValuesSchema } from "@/lib/domain/methods";
type Raw = Record<string, unknown> & { id: string; updatedAt: Date };
type Store = {
  findUnique: (q: unknown) => Promise<Raw | null>;
  findMany: (q?: unknown) => Promise<Raw[]>;
  create: (q: unknown) => Promise<Raw>;
  update: (q: unknown) => Promise<Raw>;
};
const models = {
  scenario: "planningScenario",
  item: "scenarioItem",
  target: "annualCapabilityTarget",
  budget: "scenarioBudget",
  cost: "financialCost",
} as const;
function store(tx: Prisma.TransactionClient, name: string) {
  return (tx as unknown as Record<string, unknown>)[name] as Store;
}
function view(kind: FinanceKind, raw: Raw): FinanceRow {
  const values: FinanceRow["values"] = {};
  for (const [k, v] of Object.entries(raw)) {
    if (["id", "createdAt", "updatedAt"].includes(k)) continue;
    values[k] =
      v instanceof Date
        ? v.toISOString().slice(0, 10)
        : v !== null && typeof v === "object"
          ? k === "amount"
            ? String(v)
            : Number(v)
          : (v as FinanceRow["values"][string]);
  }
  return { id: raw.id, kind, revision: raw.updatedAt.toISOString(), values };
}
export async function loadFinance(
  tx: Prisma.TransactionClient = db(),
): Promise<FinanceData> {
  const rows: FinanceRow[] = [];
  for (const kind of financeKinds)
    rows.push(
      ...(
        await store(tx, models[kind]).findMany({
          orderBy: [{ title: "asc" }, { id: "asc" }],
        })
      ).map((r) => view(kind, r)),
    );
  const methods = (
    await tx.planningMethodVersion.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    })
  ).map((m) => ({
    ...m,
    values: methodValuesSchema.parse(m.values),
    effectiveDate: m.effectiveDate.toISOString().slice(0, 10),
    createdAt: m.createdAt.toISOString(),
  }));
  return { rows, methods };
}
export async function saveFinance(
  actorId: string | null,
  kind: FinanceKind,
  id: string | null,
  input: unknown,
  revision?: string,
) {
  const values = financeSchemas[kind].parse(input) as FinanceRow["values"];
  try {
    return await db().$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(731245, 7)`;
        const target = store(tx, models[kind]);
        const before = id ? await target.findUnique({ where: { id } }) : null;
        if (id && !before)
          throw new HttpError(404, "Planning record not found");
        if (before && revision !== before.updatedAt.toISOString())
          throw new HttpError(
            409,
            "Record changed. Reload before saving; entered work is retained.",
          );
        const refs = {
          scenarioId: "planningScenario",
          methodVersionId: "planningMethodVersion",
          positionId: "position",
          initiativeId: "initiative",
          technologyId: "technology",
          capabilityId: "capability",
        };
        for (const [key, model] of Object.entries(refs))
          if (
            values[key] &&
            !(await store(tx, model).findUnique({ where: { id: values[key] } }))
          )
            throw new HttpError(400, `Invalid relationship: ${key}`);
        if (values.scenarioId) {
          const parent = await tx.planningScenario.findUniqueOrThrow({
            where: { id: String(values.scenarioId) },
          });
          if (
            typeof values.year === "number" &&
            (values.year < parent.startYear ||
              values.year > parent.startYear + 4)
          )
            throw new HttpError(
              400,
              "Year must fall within the selected five-year plan",
            );
        }
        if (kind === "scenario" && id) {
          const year = Number(values.startYear);
          const dated =
            (await tx.annualCapabilityTarget.count({
              where: {
                scenarioId: id,
                OR: [{ year: { lt: year } }, { year: { gt: year + 4 } }],
              },
            })) +
            (await tx.scenarioBudget.count({
              where: {
                scenarioId: id,
                OR: [{ year: { lt: year } }, { year: { gt: year + 4 } }],
              },
            }));
          if (dated)
            throw new HttpError(
              400,
              "Move existing targets/budgets into the new horizon before changing its start",
            );
        }
        if (kind === "cost") {
          const v = values as Cost;
          if (
            v.component === "additional" &&
            !v.identity.startsWith("additional:")
          )
            throw new HttpError(
              400,
              "Additional cost identities must start additional:; resource identities are reserved",
            );
          if (
            v.component !== "additional" &&
            v.positionId &&
            v.component !== "resource-recurring"
          )
            throw new HttpError(
              400,
              "Positions have one primary recurring salary line; use an additional identity for distinct costs",
            );
          if (
            v.component !== "additional" &&
            v.initiativeId &&
            !["resource-once", "resource-recurring"].includes(v.component)
          )
            throw new HttpError(
              400,
              "Invalid initiative primary cost component",
            );
          if (
            v.component !== "additional" &&
            v.technologyId &&
            ![
              "resource-once",
              "resource-license",
              "resource-operating",
            ].includes(v.component)
          )
            throw new HttpError(
              400,
              "Use implementation/licensing/operating identities for technology",
            );
          values.identity = costIdentity(v);
        }
        const data = Object.fromEntries(
          Object.entries(values).map(([k, v]) => [
            k,
            k.endsWith("Date") && typeof v === "string"
              ? new Date(`${v}T00:00:00Z`)
              : v,
          ]),
        );
        const record = id
          ? await target.update({ where: { id }, data })
          : await target.create({ data: { id: randomUUID(), ...data } });
        await tx.changeEvent.create({
          data: {
            actorId,
            entityType: models[kind],
            entityId: record.id,
            action: `${models[kind]}.${id ? "updated" : "created"}`,
            details: {
              before: before ? view(kind, before).values : null,
              after: view(kind, record).values,
            } as Prisma.InputJsonObject,
          },
        });
        return { id: record.id };
      },
      { timeout: 30_000, maxWait: 10_000 },
    );
  } catch (error) {
    if ((error as { code?: string }).code === "P2002")
      throw new HttpError(
        409,
        "That scenario member, annual target/budget or cost identity already exists. Edit it instead.",
      );
    throw error;
  }
}
