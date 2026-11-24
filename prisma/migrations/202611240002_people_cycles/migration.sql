-- CreateEnum
CREATE TYPE "PositionState" AS ENUM ('authorized', 'proposed', 'retired');

-- AlterTable
ALTER TABLE "Capability" ADD COLUMN     "ownerPersonId" TEXT;

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "managerId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pillarId" TEXT NOT NULL,
    "personId" TEXT,
    "state" "PositionState" NOT NULL DEFAULT 'proposed',
    "fte" DECIMAL(8,4) NOT NULL,
    "annualCost" DECIMAL(16,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startYear" INTEGER,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningCycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "asOf" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilitySnapshot" (
    "cycleId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "assessment" JSONB NOT NULL,

    CONSTRAINT "CapabilitySnapshot_pkey" PRIMARY KEY ("cycleId","capabilityId")
);

-- CreateIndex
CREATE INDEX "Person_managerId_idx" ON "Person"("managerId");

-- CreateIndex
CREATE INDEX "Position_pillarId_idx" ON "Position"("pillarId");

-- CreateIndex
CREATE INDEX "Position_personId_idx" ON "Position"("personId");

-- AddForeignKey
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilitySnapshot" ADD CONSTRAINT "CapabilitySnapshot_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PlanningCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilitySnapshot" ADD CONSTRAINT "CapabilitySnapshot_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Backstop constraints for administrative/operator writes.
ALTER TABLE "Position" ADD CONSTRAINT "Position_fte_check" CHECK ("fte" > 0 AND "fte" <= 1),
ADD CONSTRAINT "Position_cost_check" CHECK ("annualCost" IS NULL OR "annualCost" >= 0),
ADD CONSTRAINT "Position_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
ADD CONSTRAINT "Position_incumbent_check" CHECK ("state" = 'authorized' OR "personId" IS NULL);
ALTER TABLE "Person" ADD CONSTRAINT "Person_manager_check" CHECK ("managerId" IS NULL OR "managerId" <> "id");
