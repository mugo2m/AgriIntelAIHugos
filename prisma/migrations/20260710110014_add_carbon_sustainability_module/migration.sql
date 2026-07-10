-- CreateEnum
CREATE TYPE "CarbonSource" AS ENUM ('FUEL', 'ELECTRICITY', 'FERTILIZER', 'LIVESTOCK', 'TRANSPORT', 'MACHINERY', 'WASTE', 'IRRIGATION', 'OTHER');

-- CreateEnum
CREATE TYPE "SustainabilityProjectStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SustainabilityCategory" AS ENUM ('CARBON_REDUCTION', 'WATER_CONSERVATION', 'SOIL_HEALTH', 'BIODIVERSITY', 'RENEWABLE_ENERGY', 'WASTE_MANAGEMENT');

-- CreateTable
CREATE TABLE "CarbonEmission" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "source" "CarbonSource" NOT NULL,
    "emissionDate" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "carbonEquivalent" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarbonEmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SustainabilityProject" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "projectName" TEXT NOT NULL,
    "category" "SustainabilityCategory" NOT NULL,
    "description" TEXT,
    "status" "SustainabilityProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "estimatedCost" DOUBLE PRECISION,
    "expectedCarbonReduction" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SustainabilityProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterUsage" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "usageDate" TIMESTAMP(3) NOT NULL,
    "source" "WaterSourceType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenewableEnergySystem" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "systemType" TEXT NOT NULL,
    "capacity" DOUBLE PRECISION,
    "installationDate" TIMESTAMP(3),
    "energyGenerated" DOUBLE PRECISION,
    "unit" TEXT,
    "supplier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenewableEnergySystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteManagementRecord" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "wasteType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "disposalMethod" TEXT NOT NULL,
    "disposalDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WasteManagementRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CarbonEmission" ADD CONSTRAINT "CarbonEmission_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SustainabilityProject" ADD CONSTRAINT "SustainabilityProject_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterUsage" ADD CONSTRAINT "WaterUsage_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewableEnergySystem" ADD CONSTRAINT "RenewableEnergySystem_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteManagementRecord" ADD CONSTRAINT "WasteManagementRecord_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
