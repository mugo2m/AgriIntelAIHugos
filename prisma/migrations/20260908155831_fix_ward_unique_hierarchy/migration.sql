/*
  Warnings:

  - A unique constraint covering the columns `[constituencyId,subCountyId,name]` on the table `Ward` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Ward_constituencyId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Ward_constituencyId_subCountyId_name_key" ON "Ward"("constituencyId", "subCountyId", "name");
