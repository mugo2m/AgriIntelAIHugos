-- CreateEnum
CREATE TYPE "WarehouseZoneType" AS ENUM ('RECEIVING', 'STORAGE', 'COLD_STORAGE', 'PACKAGING', 'SHIPPING', 'QUARANTINE');

-- CreateEnum
CREATE TYPE "WarehouseMovementType" AS ENUM ('INBOUND', 'OUTBOUND', 'TRANSFER', 'RETURN', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LogisticsPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "WarehouseZone" (
    "id" SERIAL NOT NULL,
    "storageFacilityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "zoneType" "WarehouseZoneType" NOT NULL,
    "capacity" DOUBLE PRECISION,
    "currentUtilization" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseMovement" (
    "id" SERIAL NOT NULL,
    "storageFacilityId" INTEGER NOT NULL,
    "batchId" INTEGER,
    "shipmentId" INTEGER,
    "movementType" "WarehouseMovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryRoute" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "estimatedDuration" TEXT,
    "priority" "LogisticsPriority" NOT NULL DEFAULT 'NORMAL',
    "driverName" TEXT,
    "vehicleRegistration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseInspection" (
    "id" SERIAL NOT NULL,
    "storageFacilityId" INTEGER NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "inspectorName" TEXT NOT NULL,
    "findings" TEXT,
    "recommendations" TEXT,
    "nextInspection" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseInspection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WarehouseZone" ADD CONSTRAINT "WarehouseZone_storageFacilityId_fkey" FOREIGN KEY ("storageFacilityId") REFERENCES "StorageFacility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseMovement" ADD CONSTRAINT "WarehouseMovement_storageFacilityId_fkey" FOREIGN KEY ("storageFacilityId") REFERENCES "StorageFacility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseMovement" ADD CONSTRAINT "WarehouseMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseMovement" ADD CONSTRAINT "WarehouseMovement_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRoute" ADD CONSTRAINT "DeliveryRoute_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseInspection" ADD CONSTRAINT "WarehouseInspection_storageFacilityId_fkey" FOREIGN KEY ("storageFacilityId") REFERENCES "StorageFacility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
