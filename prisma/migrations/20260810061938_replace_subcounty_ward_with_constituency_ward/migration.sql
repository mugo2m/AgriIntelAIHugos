/*
  Warnings:

  - A unique constraint covering the columns `[constituencyId,name]` on the table `Ward` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `constituencyId` to the `Ward` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countyId` to the `Ward` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Ward` table without a default value. This is not possible if the table is not empty.
  - Added the required column `module` to the `permissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Ward" DROP CONSTRAINT "Ward_subCountyId_fkey";

-- DropIndex
DROP INDEX "Ward_subCountyId_name_key";

-- AlterTable
ALTER TABLE "Ward" ADD COLUMN     "code" TEXT,
ADD COLUMN     "constituencyId" INTEGER NOT NULL,
ADD COLUMN     "countyId" INTEGER NOT NULL,
ADD COLUMN     "sourceGid" INTEGER,
ADD COLUMN     "sourceUid" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "subCountyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "module" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Constituency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "countyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Constituency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Constituency_countyId_idx" ON "Constituency"("countyId");

-- CreateIndex
CREATE UNIQUE INDEX "Constituency_countyId_name_key" ON "Constituency"("countyId", "name");

-- CreateIndex
CREATE INDEX "Ward_countyId_idx" ON "Ward"("countyId");

-- CreateIndex
CREATE INDEX "Ward_constituencyId_idx" ON "Ward"("constituencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Ward_constituencyId_name_key" ON "Ward"("constituencyId", "name");

-- AddForeignKey
ALTER TABLE "Constituency" ADD CONSTRAINT "Constituency_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "Constituency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_subCountyId_fkey" FOREIGN KEY ("subCountyId") REFERENCES "SubCounty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
