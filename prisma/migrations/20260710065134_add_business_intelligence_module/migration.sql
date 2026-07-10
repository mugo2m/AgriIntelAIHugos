-- CreateEnum
CREATE TYPE "DashboardType" AS ENUM ('FARMER', 'FARM_MANAGER', 'AGRONOMIST', 'VETERINARIAN', 'ACCOUNTANT', 'ADMIN', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "WidgetType" AS ENUM ('KPI', 'LINE_CHART', 'BAR_CHART', 'PIE_CHART', 'TABLE', 'MAP', 'CALENDAR', 'GAUGE');

-- CreateEnum
CREATE TYPE "KPIType" AS ENUM ('CROP_YIELD', 'LIVESTOCK_PRODUCTION', 'SOIL_HEALTH', 'WEATHER', 'REVENUE', 'EXPENSE', 'PROFIT', 'INVENTORY', 'MARKET_PRICE', 'WATER_USAGE', 'AI_INSIGHT');

-- CreateEnum
CREATE TYPE "DashboardPeriod" AS ENUM ('TODAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM');

-- CreateTable
CREATE TABLE "Dashboard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dashboardType" "DashboardType" NOT NULL,
    "period" "DashboardPeriod" NOT NULL DEFAULT 'MONTH',
    "userId" INTEGER,
    "farmId" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardWidget" (
    "id" SERIAL NOT NULL,
    "dashboardId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "widgetType" "WidgetType" NOT NULL,
    "kpiType" "KPIType",
    "positionX" INTEGER,
    "positionY" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPIRecord" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER,
    "kpiType" "KPIType" NOT NULL,
    "period" "DashboardPeriod" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KPIRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "totalRevenue" DOUBLE PRECISION,
    "totalExpenses" DOUBLE PRECISION,
    "netProfit" DOUBLE PRECISION,
    "cropYield" DOUBLE PRECISION,
    "livestockProduction" DOUBLE PRECISION,
    "inventoryValue" DOUBLE PRECISION,
    "aiHealthScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Dashboard" ADD CONSTRAINT "Dashboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dashboard" ADD CONSTRAINT "Dashboard_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardWidget" ADD CONSTRAINT "DashboardWidget_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPIRecord" ADD CONSTRAINT "KPIRecord_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
