-- CreateTable
CREATE TABLE "Responsibility" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "functionId" TEXT NOT NULL,
    "ownerId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Responsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningIssue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "consequence" TEXT NOT NULL,
    "ownerId" TEXT,
    "openedDate" DATE NOT NULL,
    "dueDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Initiative" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "outcomes" TEXT NOT NULL,
    "deferral" TEXT NOT NULL,
    "ownerId" TEXT,
    "investmentState" TEXT NOT NULL DEFAULT 'proposed',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "startDate" DATE,
    "endDate" DATE,
    "effortHours" DECIMAL(16,4),
    "oneTimeCost" DECIMAL(16,2),
    "recurringCost" DECIMAL(16,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativeCapability" (
    "initiativeId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "uplift" INTEGER NOT NULL DEFAULT 0,
    "rationale" TEXT NOT NULL,

    CONSTRAINT "InitiativeCapability_pkey" PRIMARY KEY ("initiativeId","capabilityId")
);

-- CreateTable
CREATE TABLE "Technology" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "alternatives" TEXT NOT NULL,
    "deficiencyType" TEXT NOT NULL DEFAULT 'technology',
    "state" TEXT NOT NULL DEFAULT 'proposed',
    "ownerId" TEXT,
    "coveragePercent" DECIMAL(7,4),
    "utilizationPercent" DECIMAL(7,4),
    "startDate" DATE,
    "renewalDate" DATE,
    "annualLicenseCost" DECIMAL(16,2),
    "annualOperatingCost" DECIMAL(16,2),
    "implementationCost" DECIMAL(16,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Technology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CapabilityToResponsibility" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CapabilityToResponsibility_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CapabilityToPlanningIssue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CapabilityToPlanningIssue_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CapabilityToTechnology" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CapabilityToTechnology_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FrameworkRequirementToResponsibility" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FrameworkRequirementToResponsibility_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FrameworkRequirementToPlanningIssue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FrameworkRequirementToPlanningIssue_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FrameworkRequirementToInitiative" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FrameworkRequirementToInitiative_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FrameworkRequirementToTechnology" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FrameworkRequirementToTechnology_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PositionToResponsibility" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PositionToResponsibility_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BusinessObjectiveToInitiative" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BusinessObjectiveToInitiative_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ResponsibilityToTechnology" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ResponsibilityToTechnology_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_InitiativeToPlanningIssue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InitiativeToPlanningIssue_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_InitiativeToPosition" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InitiativeToPosition_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_InitiativeToTechnology" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InitiativeToTechnology_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_InitiativeDependencies" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InitiativeDependencies_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TechnologyDependencies" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TechnologyDependencies_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CapabilityToResponsibility_B_index" ON "_CapabilityToResponsibility"("B");

-- CreateIndex
CREATE INDEX "_CapabilityToPlanningIssue_B_index" ON "_CapabilityToPlanningIssue"("B");

-- CreateIndex
CREATE INDEX "_CapabilityToTechnology_B_index" ON "_CapabilityToTechnology"("B");

-- CreateIndex
CREATE INDEX "_FrameworkRequirementToResponsibility_B_index" ON "_FrameworkRequirementToResponsibility"("B");

-- CreateIndex
CREATE INDEX "_FrameworkRequirementToPlanningIssue_B_index" ON "_FrameworkRequirementToPlanningIssue"("B");

-- CreateIndex
CREATE INDEX "_FrameworkRequirementToInitiative_B_index" ON "_FrameworkRequirementToInitiative"("B");

-- CreateIndex
CREATE INDEX "_FrameworkRequirementToTechnology_B_index" ON "_FrameworkRequirementToTechnology"("B");

-- CreateIndex
CREATE INDEX "_PositionToResponsibility_B_index" ON "_PositionToResponsibility"("B");

-- CreateIndex
CREATE INDEX "_BusinessObjectiveToInitiative_B_index" ON "_BusinessObjectiveToInitiative"("B");

-- CreateIndex
CREATE INDEX "_ResponsibilityToTechnology_B_index" ON "_ResponsibilityToTechnology"("B");

-- CreateIndex
CREATE INDEX "_InitiativeToPlanningIssue_B_index" ON "_InitiativeToPlanningIssue"("B");

-- CreateIndex
CREATE INDEX "_InitiativeToPosition_B_index" ON "_InitiativeToPosition"("B");

-- CreateIndex
CREATE INDEX "_InitiativeToTechnology_B_index" ON "_InitiativeToTechnology"("B");

-- CreateIndex
CREATE INDEX "_InitiativeDependencies_B_index" ON "_InitiativeDependencies"("B");

-- CreateIndex
CREATE INDEX "_TechnologyDependencies_B_index" ON "_TechnologyDependencies"("B");

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "OrganizationalFunction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningIssue" ADD CONSTRAINT "PlanningIssue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeCapability" ADD CONSTRAINT "InitiativeCapability_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeCapability" ADD CONSTRAINT "InitiativeCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technology" ADD CONSTRAINT "Technology_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CapabilityToResponsibility" ADD CONSTRAINT "_CapabilityToResponsibility_A_fkey" FOREIGN KEY ("A") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CapabilityToResponsibility" ADD CONSTRAINT "_CapabilityToResponsibility_B_fkey" FOREIGN KEY ("B") REFERENCES "Responsibility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CapabilityToPlanningIssue" ADD CONSTRAINT "_CapabilityToPlanningIssue_A_fkey" FOREIGN KEY ("A") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CapabilityToPlanningIssue" ADD CONSTRAINT "_CapabilityToPlanningIssue_B_fkey" FOREIGN KEY ("B") REFERENCES "PlanningIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CapabilityToTechnology" ADD CONSTRAINT "_CapabilityToTechnology_A_fkey" FOREIGN KEY ("A") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CapabilityToTechnology" ADD CONSTRAINT "_CapabilityToTechnology_B_fkey" FOREIGN KEY ("B") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FrameworkRequirementToResponsibility" ADD CONSTRAINT "_FrameworkRequirementToResponsibility_A_fkey" FOREIGN KEY ("A") REFERENCES "FrameworkRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FrameworkRequirementToResponsibility" ADD CONSTRAINT "_FrameworkRequirementToResponsibility_B_fkey" FOREIGN KEY ("B") REFERENCES "Responsibility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FrameworkRequirementToPlanningIssue" ADD CONSTRAINT "_FrameworkRequirementToPlanningIssue_A_fkey" FOREIGN KEY ("A") REFERENCES "FrameworkRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FrameworkRequirementToPlanningIssue" ADD CONSTRAINT "_FrameworkRequirementToPlanningIssue_B_fkey" FOREIGN KEY ("B") REFERENCES "PlanningIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FrameworkRequirementToInitiative" ADD CONSTRAINT "_FrameworkRequirementToInitiative_A_fkey" FOREIGN KEY ("A") REFERENCES "FrameworkRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FrameworkRequirementToInitiative" ADD CONSTRAINT "_FrameworkRequirementToInitiative_B_fkey" FOREIGN KEY ("B") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FrameworkRequirementToTechnology" ADD CONSTRAINT "_FrameworkRequirementToTechnology_A_fkey" FOREIGN KEY ("A") REFERENCES "FrameworkRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FrameworkRequirementToTechnology" ADD CONSTRAINT "_FrameworkRequirementToTechnology_B_fkey" FOREIGN KEY ("B") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PositionToResponsibility" ADD CONSTRAINT "_PositionToResponsibility_A_fkey" FOREIGN KEY ("A") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PositionToResponsibility" ADD CONSTRAINT "_PositionToResponsibility_B_fkey" FOREIGN KEY ("B") REFERENCES "Responsibility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusinessObjectiveToInitiative" ADD CONSTRAINT "_BusinessObjectiveToInitiative_A_fkey" FOREIGN KEY ("A") REFERENCES "BusinessObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusinessObjectiveToInitiative" ADD CONSTRAINT "_BusinessObjectiveToInitiative_B_fkey" FOREIGN KEY ("B") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResponsibilityToTechnology" ADD CONSTRAINT "_ResponsibilityToTechnology_A_fkey" FOREIGN KEY ("A") REFERENCES "Responsibility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResponsibilityToTechnology" ADD CONSTRAINT "_ResponsibilityToTechnology_B_fkey" FOREIGN KEY ("B") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InitiativeToPlanningIssue" ADD CONSTRAINT "_InitiativeToPlanningIssue_A_fkey" FOREIGN KEY ("A") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InitiativeToPlanningIssue" ADD CONSTRAINT "_InitiativeToPlanningIssue_B_fkey" FOREIGN KEY ("B") REFERENCES "PlanningIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InitiativeToPosition" ADD CONSTRAINT "_InitiativeToPosition_A_fkey" FOREIGN KEY ("A") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InitiativeToPosition" ADD CONSTRAINT "_InitiativeToPosition_B_fkey" FOREIGN KEY ("B") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InitiativeToTechnology" ADD CONSTRAINT "_InitiativeToTechnology_A_fkey" FOREIGN KEY ("A") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InitiativeToTechnology" ADD CONSTRAINT "_InitiativeToTechnology_B_fkey" FOREIGN KEY ("B") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InitiativeDependencies" ADD CONSTRAINT "_InitiativeDependencies_A_fkey" FOREIGN KEY ("A") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InitiativeDependencies" ADD CONSTRAINT "_InitiativeDependencies_B_fkey" FOREIGN KEY ("B") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TechnologyDependencies" ADD CONSTRAINT "_TechnologyDependencies_A_fkey" FOREIGN KEY ("A") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TechnologyDependencies" ADD CONSTRAINT "_TechnologyDependencies_B_fkey" FOREIGN KEY ("B") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

