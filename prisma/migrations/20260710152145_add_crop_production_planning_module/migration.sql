-- CreateEnum
CREATE TYPE "PerformanceStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'EXCEEDED_TARGET', 'BELOW_TARGET', 'FAILED');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('LONG_RAINS', 'SHORT_RAINS', 'DRY_SEASON', 'IRRIGATED');

-- CreateTable
CREATE TABLE "CropProductionPlan" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "fieldId" INTEGER,
    "cropId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "targetAcres" DOUBLE PRECISION NOT NULL,
    "targetYieldPerAcre" DOUBLE PRECISION NOT NULL,
    "targetProductionKg" DOUBLE PRECISION NOT NULL,
    "expectedPricePerKg" DOUBLE PRECISION NOT NULL,
    "expectedRevenue" DOUBLE PRECISION NOT NULL,
    "expectedExpenses" DOUBLE PRECISION NOT NULL,
    "expectedProfit" DOUBLE PRECISION NOT NULL,
    "plannedPlantingDate" TIMESTAMP(3),
    "plannedHarvestDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropProductionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropProductionPerformance" (
    "id" SERIAL NOT NULL,
    "productionPlanId" INTEGER NOT NULL,
    "actualAcres" DOUBLE PRECISION NOT NULL,
    "actualYieldPerAcre" DOUBLE PRECISION NOT NULL,
    "actualProductionKg" DOUBLE PRECISION NOT NULL,
    "averagePricePerKg" DOUBLE PRECISION NOT NULL,
    "actualRevenue" DOUBLE PRECISION NOT NULL,
    "actualExpenses" DOUBLE PRECISION NOT NULL,
    "actualProfit" DOUBLE PRECISION NOT NULL,
    "achievementPercentage" DOUBLE PRECISION,
    "productionVariance" DOUBLE PRECISION,
    "revenueVariance" DOUBLE PRECISION,
    "profitVariance" DOUBLE PRECISION,
    "status" "PerformanceStatus" NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropProductionPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "name" "SeasonType" NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CropProductionPlan" ADD CONSTRAINT "CropProductionPlan_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropProductionPlan" ADD CONSTRAINT "CropProductionPlan_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropProductionPlan" ADD CONSTRAINT "CropProductionPlan_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropProductionPlan" ADD CONSTRAINT "CropProductionPlan_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropProductionPerformance" ADD CONSTRAINT "CropProductionPerformance_productionPlanId_fkey" FOREIGN KEY ("productionPlanId") REFERENCES "CropProductionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
