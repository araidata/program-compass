-- AlterTable
ALTER TABLE "Technology" ADD COLUMN     "decision" TEXT NOT NULL DEFAULT 'inventory',
ADD COLUMN     "deploymentState" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "retirementDate" DATE;

-- CreateTable
CREATE TABLE "_TechnologyAlternatives" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TechnologyAlternatives_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TechnologyAlternatives_B_index" ON "_TechnologyAlternatives"("B");

-- AddForeignKey
ALTER TABLE "_TechnologyAlternatives" ADD CONSTRAINT "_TechnologyAlternatives_A_fkey" FOREIGN KEY ("A") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TechnologyAlternatives" ADD CONSTRAINT "_TechnologyAlternatives_B_fkey" FOREIGN KEY ("B") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;
