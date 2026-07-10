-- CreateEnum
CREATE TYPE "PlantingSeason" AS ENUM ('LONG_RAINS', 'SHORT_RAINS', 'IRRIGATED', 'GREENHOUSE', 'DRY_SEASON');

-- CreateEnum
CREATE TYPE "PlantingStatus" AS ENUM ('PLANNED', 'PLANTED', 'GERMINATED', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURITY', 'HARVESTED', 'FAILED');

-- CreateEnum
CREATE TYPE "HarvestQuality" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "SeedUnit" AS ENUM ('GRAMS', 'KILOGRAMS', 'TONNES', 'SEEDS', 'BAGS');

-- CreateEnum
CREATE TYPE "HarvestUnit" AS ENUM ('GRAMS', 'KILOGRAMS', 'TONNES', 'BAGS', 'CRATES', 'PIECES', 'LITRES');

-- CreateTable
CREATE TABLE "Planting" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "cropVarietyId" INTEGER NOT NULL,
    "season" "PlantingSeason" NOT NULL,
    "plantingDate" TIMESTAMP(3) NOT NULL,
    "expectedHarvestDate" TIMESTAMP(3),
    "areaPlanted" DOUBLE PRECISION,
    "seedQuantity" DOUBLE PRECISION,
    "seedUnit" "SeedUnit",
    "status" "PlantingStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Planting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Harvest" (
    "id" SERIAL NOT NULL,
    "plantingId" INTEGER NOT NULL,
    "harvestDate" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "HarvestUnit" NOT NULL,
    "quality" "HarvestQuality" NOT NULL,
    "moistureContent" DOUBLE PRECISION,
    "sellingPrice" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Harvest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Planting" ADD CONSTRAINT "Planting_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planting" ADD CONSTRAINT "Planting_cropVarietyId_fkey" FOREIGN KEY ("cropVarietyId") REFERENCES "CropVariety"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Harvest" ADD CONSTRAINT "Harvest_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "Planting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
