-- AlterTable
ALTER TABLE "PlanningCycle" ADD COLUMN     "dataset" JSONB;

-- CreateTable
CREATE TABLE "PlanningMethodVersion" (
    "id" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "basis" TEXT NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "provisional" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningMethodVersion_pkey" PRIMARY KEY ("id")
);

