import { expect, test } from "@playwright/test";
import { database } from "../scripts/database";
import { randomUUID } from "node:crypto";
import { authenticationDisabled } from "../src/lib/auth-mode";
import { loginPage, signIn } from "./helpers";
test("framework observations, reviewed mappings and captured analytical denominators remain independent", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  if (!authenticationDisabled) {
    await loginPage(page);
    await signIn(request);
  }
  const client = database();
  const run = randomUUID();
  const cap = await client.capability.findUniqueOrThrow({
    where: { code: "GV.01" },
  });
  const originals = await client.frameworkRequirement.findMany({
    where: { id: { in: ["nist-csf@2.0:GV.OC-01", "cjis@6.0:AC-1"] } },
    include: { assessment: true, mappings: true },
  });
  expect(originals).toHaveLength(2);
  const originalHistory = await client.changeEvent.findMany({
    where: {
      entityType: "RequirementAssessment",
      entityId: { in: originals.map((r) => r.id) },
    },
    select: { id: true },
  });
  let cycleId: string | undefined;
  try {
    const initial = (await (await request.get("/api/alignment")).json()).data;
    for (const ref of originals) {
      const row = initial.requirements.find(
        (r: { id: string }) => r.id === ref.id,
      );
      const values = {
        ...row.values,
        applicability: "applicable",
        implementation: "in-progress",
        currentLevel: 1,
        targetLevel: 4,
        notes: `Synthetic assessment ${run}`,
        capabilityIds: [cap.id],
        mappingRationale: "Synthetic reviewed strategic mapping",
        reviewed: true,
      };
      const saved = await request.patch(
        `/api/alignment/${encodeURIComponent(ref.id)}`,
        { data: { kind: "assessment", revision: row.revision, values } },
      );
      expect(saved.status(), await saved.text()).toBe(200);
      expect(
        (
          await request.patch(`/api/alignment/${encodeURIComponent(ref.id)}`, {
            data: { kind: "assessment", revision: row.revision, values },
          })
        ).status(),
      ).toBe(409);
    }
    expect(
      (await client.capability.findUniqueOrThrow({ where: { id: cap.id } }))
        .currentLevel,
    ).toBe(cap.currentLevel);
    const captured = await request.post("/api/cycles", {
      data: {
        name: `Synthetic framework cycle ${run}`,
        notes: "Independent alignment capture",
      },
    });
    expect(captured.status(), await captured.text()).toBe(201);
    cycleId = (await captured.json()).data.id;
    const live = (
      await (await request.get("/api/alignment")).json()
    ).data.requirements.find(
      (r: { id: string }) => r.id === "nist-csf@2.0:GV.OC-01",
    );
    expect(
      (
        await request.patch(`/api/alignment/${encodeURIComponent(live.id)}`, {
          data: {
            kind: "assessment",
            revision: live.revision,
            values: {
              ...live.values,
              currentLevel: 4,
              capabilityIds: [],
              reviewed: false,
            },
          },
        })
      ).status(),
    ).toBe(200);
    await page.goto(`/compliance?cycle=${cycleId}&search=GV.OC-01`);
    await expect(
      page.getByRole("button", { name: /GV.OC-01 ·/ }),
    ).toBeEnabled();
    await page.getByRole("button", { name: /GV.OC-01 ·/ }).click();
    await expect(
      page.getByLabel("Requirement-specific current maturity", { exact: true }),
    ).toHaveValue("1");
    await expect(
      page.getByLabel("Requirement-specific current maturity", { exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByLabel("Observations and assessment notes"),
    ).toHaveValue(`Synthetic assessment ${run}`);
    await page.getByRole("button", { name: "Close" }).click();
    await page.goto("/compliance?search=GV.OC-01");
    await page.getByRole("button", { name: /GV.OC-01 ·/ }).click();
    await expect(
      page.getByLabel("Requirement-specific current maturity", { exact: true }),
    ).toHaveValue("4");
  } finally {
    if (cycleId) await client.planningCycle.delete({ where: { id: cycleId } });
    for (const r of originals) {
      await client.capabilityRequirementMapping.deleteMany({
        where: { requirementId: r.id },
      });
      if (r.mappings.length)
        await client.capabilityRequirementMapping.createMany({
          data: r.mappings,
        });
      await client.requirementAssessment.deleteMany({
        where: { requirementId: r.id },
      });
      if (r.assessment)
        await client.requirementAssessment.create({ data: r.assessment });
    }
    await client.changeEvent.deleteMany({
      where: {
        OR: [
          {
            entityType: "RequirementAssessment",
            entityId: { in: originals.map((r) => r.id) },
            id: { notIn: originalHistory.map((e) => e.id) },
          },
          ...(cycleId ? [{ entityId: cycleId }] : []),
        ],
      },
    });
    await client.$disconnect();
  }
});
