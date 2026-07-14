-- CreateTable
CREATE TABLE "ProductionCost" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "cropId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "areaAcres" DOUBLE PRECISION NOT NULL,
    "seedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fertilizerCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "manureCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pesticideCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "herbicideCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fungicideCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "labourCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "machineryCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuelCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "irrigationCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transportCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "packagingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insuranceCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "miscellaneousCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "costPerAcre" DOUBLE PRECISION,
    "costPerKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueBreakdown" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "cropId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "localSalesKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "localRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "countySalesKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "countyRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outsideCountySalesKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outsideCountyRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exportSalesKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exportRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "institutionalSalesKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "institutionalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "processingRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "averagePricePerKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfitabilityAnalysis" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "cropId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "grossProfit" DOUBLE PRECISION NOT NULL,
    "netProfit" DOUBLE PRECISION NOT NULL,
    "roi" DOUBLE PRECISION,
    "profitMargin" DOUBLE PRECISION,
    "revenuePerAcre" DOUBLE PRECISION,
    "profitPerAcre" DOUBLE PRECISION,
    "revenuePerKg" DOUBLE PRECISION,
    "profitPerKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfitabilityAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommoditySalesAnalysis" (
    "id" SERIAL NOT NULL,
    "cropId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "quantitySoldKg" DOUBLE PRECISION NOT NULL,
    "averageSellingPrice" DOUBLE PRECISION NOT NULL,
    "highestPrice" DOUBLE PRECISION NOT NULL,
    "lowestPrice" DOUBLE PRECISION NOT NULL,
    "numberOfTransactions" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommoditySalesAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgriculturalKPI" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER,
    "cropId" INTEGER,
    "seasonId" INTEGER,
    "year" INTEGER NOT NULL,
    "productionKg" DOUBLE PRECISION,
    "targetProductionKg" DOUBLE PRECISION,
    "achievementPercentage" DOUBLE PRECISION,
    "revenue" DOUBLE PRECISION,
    "expenses" DOUBLE PRECISION,
    "profit" DOUBLE PRECISION,
    "roi" DOUBLE PRECISION,
    "averageYieldPerAcre" DOUBLE PRECISION,
    "averagePricePerKg" DOUBLE PRECISION,
    "foodSecurityScore" DOUBLE PRECISION,
    "sustainabilityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgriculturalKPI_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductionCost" ADD CONSTRAINT "ProductionCost_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionCost" ADD CONSTRAINT "ProductionCost_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionCost" ADD CONSTRAINT "ProductionCost_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueBreakdown" ADD CONSTRAINT "RevenueBreakdown_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueBreakdown" ADD CONSTRAINT "RevenueBreakdown_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueBreakdown" ADD CONSTRAINT "RevenueBreakdown_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitabilityAnalysis" ADD CONSTRAINT "ProfitabilityAnalysis_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitabilityAnalysis" ADD CONSTRAINT "ProfitabilityAnalysis_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitabilityAnalysis" ADD CONSTRAINT "ProfitabilityAnalysis_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommoditySalesAnalysis" ADD CONSTRAINT "CommoditySalesAnalysis_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommoditySalesAnalysis" ADD CONSTRAINT "CommoditySalesAnalysis_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgriculturalKPI" ADD CONSTRAINT "AgriculturalKPI_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgriculturalKPI" ADD CONSTRAINT "AgriculturalKPI_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgriculturalKPI" ADD CONSTRAINT "AgriculturalKPI_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;
