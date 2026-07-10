-- CreateEnum
CREATE TYPE "ProductionType" AS ENUM ('MILK', 'EGGS', 'MEAT', 'WOOL', 'HONEY', 'FISH', 'MANURE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductionUnit" AS ENUM ('LITRES', 'MILLILITRES', 'KILOGRAMS', 'GRAMS', 'TONNES', 'PIECES', 'TRAYS', 'DOZENS');

-- CreateEnum
CREATE TYPE "ProductionQuality" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateTable
CREATE TABLE "LivestockProduction" (
    "id" SERIAL NOT NULL,
    "livestockId" INTEGER NOT NULL,
    "productionType" "ProductionType" NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "ProductionUnit" NOT NULL,
    "quality" "ProductionQuality",
    "sellingPrice" DOUBLE PRECISION,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivestockProduction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LivestockProduction" ADD CONSTRAINT "LivestockProduction_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
