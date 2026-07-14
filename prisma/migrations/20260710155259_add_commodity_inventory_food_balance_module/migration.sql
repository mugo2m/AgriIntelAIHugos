-- CreateEnum
CREATE TYPE "CommodityMovementType" AS ENUM ('IMPORT', 'EXPORT', 'LOCAL_TRANSFER', 'SALE', 'PURCHASE', 'DONATION');

-- CreateEnum
CREATE TYPE "FoodSecurityStatus" AS ENUM ('SURPLUS', 'BALANCED', 'DEFICIT', 'CRITICAL');

-- CreateTable
CREATE TABLE "CommodityInventory" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER,
    "cropId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "openingStockKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productionKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "importedKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAvailableKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingStockKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommodityInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityMovement" (
    "id" SERIAL NOT NULL,
    "cropId" INTEGER NOT NULL,
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "sourceCounty" TEXT NOT NULL,
    "sourceSubCounty" TEXT,
    "sourceWard" TEXT,
    "destinationCounty" TEXT NOT NULL,
    "destinationSubCounty" TEXT,
    "destinationWard" TEXT,
    "movementType" "CommodityMovementType" NOT NULL,
    "buyerName" TEXT,
    "sellerName" TEXT,
    "transporter" TEXT,
    "vehicleRegistration" TEXT,
    "transportCost" DOUBLE PRECISION,
    "pricePerKg" DOUBLE PRECISION,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommodityMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityConsumption" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "householdConsumptionKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "livestockFeedKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seedReservedKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "processingKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "postHarvestLossKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "donatedKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherUsageKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommodityConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityBalance" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "exportsKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "localSalesKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outsideCountySalesKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalConsumedKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "surplusKg" DOUBLE PRECISION,
    "deficitKg" DOUBLE PRECISION,
    "foodSecurityStatus" "FoodSecurityStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommodityBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityPriceHistory" (
    "id" SERIAL NOT NULL,
    "cropId" INTEGER NOT NULL,
    "county" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "farmGatePrice" DOUBLE PRECISION,
    "cooperativePrice" DOUBLE PRECISION,
    "wholesalePrice" DOUBLE PRECISION,
    "retailPrice" DOUBLE PRECISION,
    "exportPrice" DOUBLE PRECISION,
    "averagePrice" DOUBLE PRECISION,
    "priceDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommodityPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommodityBalance_inventoryId_key" ON "CommodityBalance"("inventoryId");

-- AddForeignKey
ALTER TABLE "CommodityInventory" ADD CONSTRAINT "CommodityInventory_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityInventory" ADD CONSTRAINT "CommodityInventory_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityInventory" ADD CONSTRAINT "CommodityInventory_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityMovement" ADD CONSTRAINT "CommodityMovement_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityConsumption" ADD CONSTRAINT "CommodityConsumption_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "CommodityInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityBalance" ADD CONSTRAINT "CommodityBalance_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "CommodityInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityPriceHistory" ADD CONSTRAINT "CommodityPriceHistory_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityPriceHistory" ADD CONSTRAINT "CommodityPriceHistory_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
