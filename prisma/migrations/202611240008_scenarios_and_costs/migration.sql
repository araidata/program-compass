-- CreateTable
CREATE TABLE "PlanningScenario" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "methodVersionId" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "fiscalStartMonth" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioItem" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "initiativeId" TEXT,
    "positionId" TEXT,
    "technologyId" TEXT,
    "included" BOOLEAN NOT NULL,
    "startDate" DATE,
    "endDate" DATE,
    "source" TEXT NOT NULL,
    "deferral" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualCapabilityTarget" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnualCapabilityTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioBudget" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(16,2),
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialCost" (
    "id" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "positionId" TEXT,
    "technologyId" TEXT,
    "initiativeId" TEXT,
    "capabilityId" TEXT,
    "component" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "amount" DECIMAL(16,2),
    "currency" TEXT NOT NULL,
    "startDate" DATE,
    "endDate" DATE,
    "escalationPercent" DECIMAL(8,4),
    "baseline" BOOLEAN NOT NULL,
    "saving" BOOLEAN NOT NULL,
    "source" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioItem_scenarioId_initiativeId_key" ON "ScenarioItem"("scenarioId", "initiativeId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioItem_scenarioId_positionId_key" ON "ScenarioItem"("scenarioId", "positionId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioItem_scenarioId_technologyId_key" ON "ScenarioItem"("scenarioId", "technologyId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualCapabilityTarget_scenarioId_capabilityId_year_key" ON "AnnualCapabilityTarget"("scenarioId", "capabilityId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioBudget_scenarioId_year_key" ON "ScenarioBudget"("scenarioId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialCost_identity_key" ON "FinancialCost"("identity");

-- AddForeignKey
ALTER TABLE "PlanningScenario" ADD CONSTRAINT "PlanningScenario_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "PlanningMethodVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioItem" ADD CONSTRAINT "ScenarioItem_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "PlanningScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioItem" ADD CONSTRAINT "ScenarioItem_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioItem" ADD CONSTRAINT "ScenarioItem_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioItem" ADD CONSTRAINT "ScenarioItem_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualCapabilityTarget" ADD CONSTRAINT "AnnualCapabilityTarget_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "PlanningScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualCapabilityTarget" ADD CONSTRAINT "AnnualCapabilityTarget_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioBudget" ADD CONSTRAINT "ScenarioBudget_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "PlanningScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialCost" ADD CONSTRAINT "FinancialCost_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialCost" ADD CONSTRAINT "FinancialCost_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialCost" ADD CONSTRAINT "FinancialCost_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialCost" ADD CONSTRAINT "FinancialCost_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlanningScenario" ADD CONSTRAINT "scenario_horizon" CHECK ("startYear" BETWEEN 2000 AND 2196 AND "fiscalStartMonth" BETWEEN 1 AND 12), ADD CONSTRAINT "scenario_currency" CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "ScenarioItem" ADD CONSTRAINT "scenario_one_resource" CHECK (num_nonnulls("initiativeId","positionId","technologyId")=1), ADD CONSTRAINT "scenario_item_dates" CHECK ("startDate" IS NULL OR "endDate" IS NULL OR "endDate">="startDate");
ALTER TABLE "AnnualCapabilityTarget" ADD CONSTRAINT "annual_target_level" CHECK ("level" BETWEEN 1 AND 5);
ALTER TABLE "ScenarioBudget" ADD CONSTRAINT "budget_nonnegative" CHECK ("amount" IS NULL OR "amount">=0);
ALTER TABLE "FinancialCost" ADD CONSTRAINT "cost_one_resource" CHECK (num_nonnulls("initiativeId","positionId","technologyId")=1), ADD CONSTRAINT "cost_dates" CHECK ("startDate" IS NULL OR "endDate" IS NULL OR "endDate">="startDate"), ADD CONSTRAINT "cost_amount" CHECK ("amount" IS NULL OR "amount">=0), ADD CONSTRAINT "cost_escalation" CHECK ("escalationPercent" IS NULL OR "escalationPercent" BETWEEN -100 AND 100), ADD CONSTRAINT "cost_currency" CHECK ("currency" ~ '^[A-Z]{3}$'), ADD CONSTRAINT "cost_frequency" CHECK ("frequency" IN ('once','annual'));
