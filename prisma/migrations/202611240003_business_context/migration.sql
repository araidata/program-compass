-- CreateTable
CREATE TABLE "OrganizationProfile" (
    "id" TEXT NOT NULL DEFAULT 'organization',
    "mission" TEXT,
    "sector" TEXT,
    "criticalServices" TEXT,
    "dependencies" TEXT,
    "publicSafetyImpact" TEXT,
    "regulatoryDrivers" TEXT,
    "complexityNotes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessObjective" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "ownerId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessThreat" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "likelihood" INTEGER,
    "impact" INTEGER,
    "basis" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessThreat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectiveCapability" (
    "objectiveId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,

    CONSTRAINT "ObjectiveCapability_pkey" PRIMARY KEY ("objectiveId","capabilityId")
);

-- CreateTable
CREATE TABLE "ThreatObjective" (
    "threatId" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,

    CONSTRAINT "ThreatObjective_pkey" PRIMARY KEY ("threatId","objectiveId")
);

-- CreateTable
CREATE TABLE "ThreatCapability" (
    "threatId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,

    CONSTRAINT "ThreatCapability_pkey" PRIMARY KEY ("threatId","capabilityId")
);

-- AddForeignKey
ALTER TABLE "BusinessObjective" ADD CONSTRAINT "BusinessObjective_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveCapability" ADD CONSTRAINT "ObjectiveCapability_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "BusinessObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveCapability" ADD CONSTRAINT "ObjectiveCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreatObjective" ADD CONSTRAINT "ThreatObjective_threatId_fkey" FOREIGN KEY ("threatId") REFERENCES "BusinessThreat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreatObjective" ADD CONSTRAINT "ThreatObjective_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "BusinessObjective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreatCapability" ADD CONSTRAINT "ThreatCapability_threatId_fkey" FOREIGN KEY ("threatId") REFERENCES "BusinessThreat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreatCapability" ADD CONSTRAINT "ThreatCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "OrganizationProfile" ADD CONSTRAINT "OrganizationProfile_singleton_check" CHECK ("id" = 'organization');
ALTER TABLE "BusinessObjective" ADD CONSTRAINT "BusinessObjective_priority_check" CHECK ("priority" BETWEEN 1 AND 5);
ALTER TABLE "BusinessThreat" ADD CONSTRAINT "BusinessThreat_likelihood_check" CHECK ("likelihood" IS NULL OR "likelihood" BETWEEN 1 AND 5),
ADD CONSTRAINT "BusinessThreat_impact_check" CHECK ("impact" IS NULL OR "impact" BETWEEN 1 AND 5);
