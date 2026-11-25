-- CreateTable
CREATE TABLE "WorkActivity" (
    "id" TEXT NOT NULL,
    "workKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "responsibilityId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "provisional" BOOLEAN NOT NULL DEFAULT true,
    "year" INTEGER NOT NULL,
    "volume" DECIMAL(16,4),
    "frequency" DECIMAL(16,4),
    "hoursPerUnit" DECIMAL(16,4),
    "fixedHours" DECIMAL(16,4),
    "projectHours" DECIMAL(16,4),
    "growth" DECIMAL(12,6),
    "outsourcedHours" DECIMAL(16,4),
    "automatedHours" DECIMAL(16,4),
    "productiveHoursPerFte" DECIMAL(12,4),
    "workType" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapacityAssignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "personId" TEXT,
    "responsibilityId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "allocatedFte" DECIMAL(8,4) NOT NULL,
    "paidHours" DECIMAL(12,4),
    "productiveHours" DECIMAL(12,4),
    "runShare" DECIMAL(8,4) NOT NULL,
    "source" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapacityAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillObservation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "niceElementId" TEXT NOT NULL,
    "currentLevel" INTEGER,
    "targetLevel" INTEGER,
    "assessedDate" DATE NOT NULL,
    "notes" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceConstraint" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "responsibilityId" TEXT NOT NULL,
    "conflictingResponsibilityId" TEXT,
    "kind" TEXT NOT NULL,
    "minimumPeople" INTEGER,
    "minimumFte" DECIMAL(8,4),
    "niceElementId" TEXT,
    "minimumSkill" INTEGER,
    "source" TEXT NOT NULL,
    "consequence" TEXT NOT NULL,
    "alternatives" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceConstraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CapabilityToWorkActivity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CapabilityToWorkActivity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FrameworkRequirementToWorkActivity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FrameworkRequirementToWorkActivity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_NiceElementToWorkActivity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NiceElementToWorkActivity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkActivity_workKey_key" ON "WorkActivity"("workKey");

-- CreateIndex
CREATE UNIQUE INDEX "SkillObservation_personId_niceElementId_key" ON "SkillObservation"("personId", "niceElementId");

-- CreateIndex
CREATE INDEX "_CapabilityToWorkActivity_B_index" ON "_CapabilityToWorkActivity"("B");

-- CreateIndex
CREATE INDEX "_FrameworkRequirementToWorkActivity_B_index" ON "_FrameworkRequirementToWorkActivity"("B");

-- CreateIndex
CREATE INDEX "_NiceElementToWorkActivity_B_index" ON "_NiceElementToWorkActivity"("B");

-- AddForeignKey
ALTER TABLE "WorkActivity" ADD CONSTRAINT "WorkActivity_responsibilityId_fkey" FOREIGN KEY ("responsibilityId") REFERENCES "Responsibility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacityAssignment" ADD CONSTRAINT "CapacityAssignment_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacityAssignment" ADD CONSTRAINT "CapacityAssignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacityAssignment" ADD CONSTRAINT "CapacityAssignment_responsibilityId_fkey" FOREIGN KEY ("responsibilityId") REFERENCES "Responsibility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillObservation" ADD CONSTRAINT "SkillObservation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillObservation" ADD CONSTRAINT "SkillObservation_niceElementId_fkey" FOREIGN KEY ("niceElementId") REFERENCES "NiceElement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceConstraint" ADD CONSTRAINT "WorkforceConstraint_responsibilityId_fkey" FOREIGN KEY ("responsibilityId") REFERENCES "Responsibility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceConstraint" ADD CONSTRAINT "WorkforceConstraint_conflictingResponsibilityId_fkey" FOREIGN KEY ("conflictingResponsibilityId") REFERENCES "Responsibility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceConstraint" ADD CONSTRAINT "WorkforceConstraint_niceElementId_fkey" FOREIGN KEY ("niceElementId") REFERENCES "NiceElement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CapabilityToWorkActivity" ADD CONSTRAINT "_CapabilityToWorkActivity_A_fkey" FOREIGN KEY ("A") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CapabilityToWorkActivity" ADD CONSTRAINT "_CapabilityToWorkActivity_B_fkey" FOREIGN KEY ("B") REFERENCES "WorkActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FrameworkRequirementToWorkActivity" ADD CONSTRAINT "_FrameworkRequirementToWorkActivity_A_fkey" FOREIGN KEY ("A") REFERENCES "FrameworkRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FrameworkRequirementToWorkActivity" ADD CONSTRAINT "_FrameworkRequirementToWorkActivity_B_fkey" FOREIGN KEY ("B") REFERENCES "WorkActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NiceElementToWorkActivity" ADD CONSTRAINT "_NiceElementToWorkActivity_A_fkey" FOREIGN KEY ("A") REFERENCES "NiceElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NiceElementToWorkActivity" ADD CONSTRAINT "_NiceElementToWorkActivity_B_fkey" FOREIGN KEY ("B") REFERENCES "WorkActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CapacityAssignment" ADD CONSTRAINT "capacity_dates" CHECK ("endDate" IS NULL OR "endDate">="startDate"), ADD CONSTRAINT "capacity_fte" CHECK ("allocatedFte">0 AND "allocatedFte"<=1 AND "runShare" BETWEEN 0 AND 1), ADD CONSTRAINT "capacity_hours" CHECK (("paidHours" IS NULL OR "paidHours" BETWEEN 0 AND 8784) AND ("productiveHours" IS NULL OR "productiveHours" BETWEEN 0 AND 8784) AND ("paidHours" IS NULL OR "productiveHours" IS NULL OR "paidHours">="productiveHours"));
ALTER TABLE "WorkActivity" ADD CONSTRAINT "workload_nonnegative" CHECK (("volume" IS NULL OR "volume">=0) AND ("frequency" IS NULL OR "frequency">=0) AND ("hoursPerUnit" IS NULL OR "hoursPerUnit">=0) AND ("fixedHours" IS NULL OR "fixedHours">=0) AND ("projectHours" IS NULL OR "projectHours">=0) AND ("growth" IS NULL OR "growth">=0) AND ("outsourcedHours" IS NULL OR "outsourcedHours">=0) AND ("automatedHours" IS NULL OR "automatedHours">=0) AND ("productiveHoursPerFte" IS NULL OR "productiveHoursPerFte">0)), ADD CONSTRAINT "workload_year" CHECK ("year" BETWEEN 2000 AND 2200), ADD CONSTRAINT "workload_type" CHECK ("workType" IN ('run','change'));
ALTER TABLE "SkillObservation" ADD CONSTRAINT "skill_levels" CHECK (("currentLevel" IS NULL OR "currentLevel" BETWEEN 1 AND 5) AND ("targetLevel" IS NULL OR "targetLevel" BETWEEN 1 AND 5));
ALTER TABLE "WorkforceConstraint" ADD CONSTRAINT "coverage_kind" CHECK ("kind" IN ('minimum-coverage','continuity','expertise','separation-of-duties')), ADD CONSTRAINT "coverage_limits" CHECK (("minimumPeople" IS NULL OR "minimumPeople">0) AND ("minimumFte" IS NULL OR "minimumFte">=0) AND ("minimumSkill" IS NULL OR "minimumSkill" BETWEEN 1 AND 5));
