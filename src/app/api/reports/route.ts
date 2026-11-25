import { api, json } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { captureDataset, readCycle } from "@/lib/server/snapshots";
import { buildReport } from "@/lib/domain/reports";
import { parsePillar } from "@/lib/pillars";
import { HttpError } from "@/lib/server/access";
export async function GET(request: Request) {
  return api(request, "read", async () => {
    const params = new URL(request.url).searchParams;
    const cycle = params.get("cycle");
    const data = cycle
      ? (await readCycle(cycle)).dataset
      : await db().$transaction((tx) => captureDataset(tx), {
          isolationLevel: "RepeatableRead",
          timeout: 60_000,
          maxWait: 10_000,
        });
    if (!data)
      throw new HttpError(
        409,
        "Report modules were not captured in this legacy cycle",
      );
    const year = Number(
      params.get("year") ?? data.methods.values.planStartYear,
    );
    if (!Number.isInteger(year) || year < 2000 || year > 2200)
      throw new HttpError(400, "Invalid report year");
    return json(
      buildReport(data, {
        scope: parsePillar(params.get("pillar"))?.id ?? null,
        pack: params.get("pack") === "management" ? "management" : "executive",
        year,
        scenarioId:
          params.get("scenario") === "none"
            ? null
            : (params.get("scenario") ??
              data.finance?.rows.find(
                (r) => r.kind === "scenario" && r.values.active,
              )?.id ??
              null),
      }),
    );
  });
}
