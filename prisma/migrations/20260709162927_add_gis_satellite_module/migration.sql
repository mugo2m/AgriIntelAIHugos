-- CreateEnum
CREATE TYPE "GeometryType" AS ENUM ('POINT', 'LINESTRING', 'POLYGON', 'MULTIPOLYGON');

-- CreateEnum
CREATE TYPE "SatelliteProvider" AS ENUM ('SENTINEL_2', 'LANDSAT_8', 'LANDSAT_9', 'PLANET', 'MAXAR', 'DRONE', 'OTHER');

-- CreateEnum
CREATE TYPE "ImageryType" AS ENUM ('RGB', 'MULTISPECTRAL', 'THERMAL', 'NDVI', 'EVI', 'SAVI', 'NDWI', 'SOIL_MOISTURE');

-- CreateEnum
CREATE TYPE "FieldStatus" AS ENUM ('ACTIVE', 'FALLOW', 'PREPARATION', 'PLANTED', 'HARVESTED');

-- CreateEnum
CREATE TYPE "MapLayerType" AS ENUM ('FARM_BOUNDARY', 'FIELD_BOUNDARY', 'SOIL', 'WEATHER', 'IRRIGATION', 'PEST', 'DISEASE', 'SATELLITE', 'ELEVATION');

-- AlterTable
ALTER TABLE "Planting" ADD COLUMN     "fieldId" INTEGER;

-- CreateTable
CREATE TABLE "Field" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "fieldName" TEXT NOT NULL,
    "area" DOUBLE PRECISION,
    "geometryType" "GeometryType" NOT NULL,
    "boundaryGeoJson" TEXT NOT NULL,
    "centroidLatitude" DOUBLE PRECISION,
    "centroidLongitude" DOUBLE PRECISION,
    "status" "FieldStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatelliteImage" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "fieldId" INTEGER,
    "provider" "SatelliteProvider" NOT NULL,
    "imageryType" "ImageryType" NOT NULL,
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "cloudCoverage" DOUBLE PRECISION,
    "resolution" DOUBLE PRECISION,
    "ndvi" DOUBLE PRECISION,
    "evi" DOUBLE PRECISION,
    "soilMoistureIndex" DOUBLE PRECISION,
    "vegetationHealthIndex" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SatelliteImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapLayer" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "layerName" TEXT NOT NULL,
    "layerType" "MapLayerType" NOT NULL,
    "geoJson" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapLayer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Planting" ADD CONSTRAINT "Planting_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatelliteImage" ADD CONSTRAINT "SatelliteImage_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatelliteImage" ADD CONSTRAINT "SatelliteImage_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapLayer" ADD CONSTRAINT "MapLayer_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
