-- CreateEnum
CREATE TYPE "ReviewState" AS ENUM ('draft', 'submitted', 'reviewed');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "IndicatorDirection" AS ENUM ('higher', 'lower');

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "catalogue" TEXT NOT NULL DEFAULT 'reference-baseline-1',
    "code" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "applicable" BOOLEAN NOT NULL DEFAULT true,
    "currentLevel" INTEGER,
    "targetLevel" INTEGER,
    "scaleVersion" TEXT NOT NULL DEFAULT 'provisional-1',
    "confidence" "Confidence",
    "rationale" TEXT,
    "reviewState" "ReviewState" NOT NULL DEFAULT 'draft',
    "targetDate" DATE,
    "accountableFunctionId" TEXT,
    "assessedAt" TIMESTAMP(3),
    "assessedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityPillar" (
    "capabilityId" TEXT NOT NULL,
    "pillarId" TEXT NOT NULL,

    CONSTRAINT "CapabilityPillar_pkey" PRIMARY KEY ("capabilityId","pillarId")
);

-- CreateTable
CREATE TABLE "CapabilityIndicator" (
    "id" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "catalogueKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '%',
    "direction" "IndicatorDirection" NOT NULL DEFAULT 'higher',
    "passThreshold" DECIMAL(14,4) NOT NULL,
    "failThreshold" DECIMAL(14,4) NOT NULL,
    "value" DECIMAL(14,4),
    "measuredAt" DATE,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapabilityIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Framework" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Framework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkRequirement" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrameworkRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityRequirementMapping" (
    "capabilityId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapabilityRequirementMapping_pkey" PRIMARY KEY ("capabilityId","requirementId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Capability_code_key" ON "Capability"("code");

-- CreateIndex
CREATE INDEX "Capability_groupCode_sortOrder_idx" ON "Capability"("groupCode", "sortOrder");

-- CreateIndex
CREATE INDEX "CapabilityPillar_pillarId_idx" ON "CapabilityPillar"("pillarId");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityIndicator_catalogueKey_key" ON "CapabilityIndicator"("catalogueKey");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityIndicator_capabilityId_name_key" ON "CapabilityIndicator"("capabilityId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Framework_key_version_key" ON "Framework"("key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkRequirement_frameworkId_identifier_key" ON "FrameworkRequirement"("frameworkId", "identifier");

-- CreateIndex
CREATE INDEX "CapabilityRequirementMapping_requirementId_idx" ON "CapabilityRequirementMapping"("requirementId");

-- AddForeignKey
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_accountableFunctionId_fkey" FOREIGN KEY ("accountableFunctionId") REFERENCES "OrganizationalFunction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityPillar" ADD CONSTRAINT "CapabilityPillar_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityPillar" ADD CONSTRAINT "CapabilityPillar_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityIndicator" ADD CONSTRAINT "CapabilityIndicator_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityIndicator" ADD CONSTRAINT "CapabilityIndicator_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkRequirement" ADD CONSTRAINT "FrameworkRequirement_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkRequirement" ADD CONSTRAINT "FrameworkRequirement_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FrameworkRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityRequirementMapping" ADD CONSTRAINT "CapabilityRequirementMapping_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityRequirementMapping" ADD CONSTRAINT "CapabilityRequirementMapping_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "FrameworkRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Assessment invariants enforced beyond the UI. Levels use the provisional 1-5 scale.
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_currentLevel_range" CHECK ("currentLevel" IS NULL OR "currentLevel" BETWEEN 1 AND 5);
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_targetLevel_range" CHECK ("targetLevel" IS NULL OR "targetLevel" BETWEEN 1 AND 5);
ALTER TABLE "CapabilityIndicator" ADD CONSTRAINT "CapabilityIndicator_name_present" CHECK (length(trim("name")) > 0);
-- Boundaries must be ordered for the KPI's favourable direction.
ALTER TABLE "CapabilityIndicator" ADD CONSTRAINT "CapabilityIndicator_boundaries" CHECK (
  ("direction" = 'higher' AND "passThreshold" >= "failThreshold") OR
  ("direction" = 'lower' AND "passThreshold" <= "failThreshold")
);
ALTER TABLE "CapabilityRequirementMapping" ADD CONSTRAINT "CapabilityRequirementMapping_rationale_length" CHECK ("rationale" IS NULL OR length("rationale") <= 2000);
