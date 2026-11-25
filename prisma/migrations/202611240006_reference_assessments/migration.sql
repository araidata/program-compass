-- AlterTable
ALTER TABLE "Framework" ADD COLUMN     "sourceHash" TEXT;

-- AlterTable
ALTER TABLE "FrameworkRequirement" ADD COLUMN     "deadline" DATE,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'requirement',
ADD COLUMN     "sourcePage" INTEGER,
ADD COLUMN     "sourceUrl" TEXT;

-- AlterTable
ALTER TABLE "CapabilityRequirementMapping" ADD COLUMN     "reviewed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RequirementAssessment" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "applicability" TEXT NOT NULL DEFAULT 'unknown',
    "implementation" TEXT NOT NULL DEFAULT 'unassessed',
    "currentLevel" INTEGER,
    "targetLevel" INTEGER,
    "notes" TEXT,
    "ownerId" TEXT,
    "applicableDeadline" DATE,
    "scaleVersion" TEXT NOT NULL DEFAULT 'provisional-1',
    "assessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NiceElement" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,

    CONSTRAINT "NiceElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NiceRelation" (
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "NiceRelation_pkey" PRIMARY KEY ("sourceId","targetId")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequirementAssessment_requirementId_key" ON "RequirementAssessment"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "NiceElement_version_identifier_key" ON "NiceElement"("version", "identifier");

-- AddForeignKey
ALTER TABLE "RequirementAssessment" ADD CONSTRAINT "RequirementAssessment_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "FrameworkRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementAssessment" ADD CONSTRAINT "RequirementAssessment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NiceRelation" ADD CONSTRAINT "NiceRelation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NiceElement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NiceRelation" ADD CONSTRAINT "NiceRelation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "NiceElement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RequirementAssessment" ADD CONSTRAINT "requirement_levels" CHECK (("currentLevel" IS NULL OR "currentLevel" BETWEEN 1 AND 5) AND ("targetLevel" IS NULL OR "targetLevel" BETWEEN 1 AND 5)), ADD CONSTRAINT "requirement_applicability" CHECK ("applicability" IN ('unknown','applicable','not-applicable')), ADD CONSTRAINT "requirement_implementation" CHECK ("implementation" IN ('unassessed','not-started','planned','in-progress','implemented'));
