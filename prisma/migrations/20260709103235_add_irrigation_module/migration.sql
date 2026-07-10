-- CreateEnum
CREATE TYPE "IrrigationMethod" AS ENUM ('DRIP', 'SPRINKLER', 'FLOOD', 'FURROW', 'PIVOT', 'RAIN_GUN', 'MANUAL');

-- CreateEnum
CREATE TYPE "WaterSourceType" AS ENUM ('RIVER', 'BOREHOLE', 'WELL', 'DAM', 'LAKE', 'RAINWATER', 'MUNICIPAL');

-- CreateEnum
CREATE TYPE "IrrigationStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IrrigationResult" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED', 'POSTPONED');

-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "waterSourceId" INTEGER;

-- CreateTable
CREATE TABLE "WaterSource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" "WaterSourceType" NOT NULL,
    "location" TEXT,
    "capacity" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaterSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IrrigationSchedule" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "plantingId" INTEGER,
    "method" "IrrigationMethod" NOT NULL,
    "status" "IrrigationStatus" NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "waterVolume" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IrrigationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IrrigationEvent" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "irrigationDate" TIMESTAMP(3) NOT NULL,
    "actualWaterVolume" DOUBLE PRECISION,
    "durationMinutes" INTEGER,
    "result" "IrrigationResult",
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IrrigationEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_waterSourceId_fkey" FOREIGN KEY ("waterSourceId") REFERENCES "WaterSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IrrigationSchedule" ADD CONSTRAINT "IrrigationSchedule_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IrrigationSchedule" ADD CONSTRAINT "IrrigationSchedule_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "Planting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IrrigationEvent" ADD CONSTRAINT "IrrigationEvent_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "IrrigationSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
