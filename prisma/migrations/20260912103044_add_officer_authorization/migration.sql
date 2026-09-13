-- CreateEnum
CREATE TYPE "OfficerScopeLevel" AS ENUM ('NATIONAL', 'COUNTY', 'SUBCOUNTY', 'WARD');

-- CreateEnum
CREATE TYPE "OfficerAssignmentSource" AS ENUM ('OFFICIAL', 'SIMULATED');

-- CreateTable
CREATE TABLE "OfficerFunction" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficerFunction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficerAssignment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "functionId" INTEGER NOT NULL,
    "scopeLevel" "OfficerScopeLevel" NOT NULL,
    "countryId" INTEGER,
    "countyId" INTEGER,
    "subCountyId" INTEGER,
    "wardId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "source" "OfficerAssignmentSource" NOT NULL DEFAULT 'SIMULATED',
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfficerFunction_name_key" ON "OfficerFunction"("name");

-- CreateIndex
CREATE INDEX "OfficerFunction_active_idx" ON "OfficerFunction"("active");

-- CreateIndex
CREATE INDEX "OfficerAssignment_userId_idx" ON "OfficerAssignment"("userId");

-- CreateIndex
CREATE INDEX "OfficerAssignment_roleId_idx" ON "OfficerAssignment"("roleId");

-- CreateIndex
CREATE INDEX "OfficerAssignment_functionId_idx" ON "OfficerAssignment"("functionId");

-- CreateIndex
CREATE INDEX "OfficerAssignment_scopeLevel_idx" ON "OfficerAssignment"("scopeLevel");

-- CreateIndex
CREATE INDEX "OfficerAssignment_countryId_idx" ON "OfficerAssignment"("countryId");

-- CreateIndex
CREATE INDEX "OfficerAssignment_countyId_idx" ON "OfficerAssignment"("countyId");

-- CreateIndex
CREATE INDEX "OfficerAssignment_subCountyId_idx" ON "OfficerAssignment"("subCountyId");

-- CreateIndex
CREATE INDEX "OfficerAssignment_wardId_idx" ON "OfficerAssignment"("wardId");

-- CreateIndex
CREATE INDEX "OfficerAssignment_active_idx" ON "OfficerAssignment"("active");

-- CreateIndex
CREATE INDEX "OfficerAssignment_source_idx" ON "OfficerAssignment"("source");

-- AddForeignKey
ALTER TABLE "OfficerAssignment" ADD CONSTRAINT "OfficerAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerAssignment" ADD CONSTRAINT "OfficerAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerAssignment" ADD CONSTRAINT "OfficerAssignment_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "OfficerFunction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerAssignment" ADD CONSTRAINT "OfficerAssignment_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerAssignment" ADD CONSTRAINT "OfficerAssignment_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerAssignment" ADD CONSTRAINT "OfficerAssignment_subCountyId_fkey" FOREIGN KEY ("subCountyId") REFERENCES "SubCounty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerAssignment" ADD CONSTRAINT "OfficerAssignment_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
