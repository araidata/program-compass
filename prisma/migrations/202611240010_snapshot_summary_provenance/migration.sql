-- Additive display provenance and derived snapshot summaries; existing values stay intact.
ALTER TABLE "Capability" ADD COLUMN "assessorLabel" TEXT;
ALTER TABLE "PlanningCycle" ADD COLUMN "summary" JSONB;
