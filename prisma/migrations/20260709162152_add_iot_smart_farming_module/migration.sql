-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('SOIL_MOISTURE', 'SOIL_TEMPERATURE', 'SOIL_PH', 'SOIL_EC', 'AIR_TEMPERATURE', 'AIR_HUMIDITY', 'RAINFALL', 'WIND_SPEED', 'WIND_DIRECTION', 'SOLAR_RADIATION', 'WATER_LEVEL', 'WATER_FLOW', 'GPS', 'LIVESTOCK_BODY_TEMPERATURE', 'LIVESTOCK_HEART_RATE', 'LIVESTOCK_ACTIVITY', 'GREENHOUSE_TEMPERATURE', 'GREENHOUSE_HUMIDITY', 'GREENHOUSE_CO2', 'OTHER');

-- CreateEnum
CREATE TYPE "SensorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'FAULTY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('NORMAL', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('SENSOR', 'GATEWAY', 'WEATHER_STATION', 'IRRIGATION_CONTROLLER', 'DRONE', 'CAMERA', 'GPS_TRACKER', 'RFID_READER', 'OTHER');

-- CreateTable
CREATE TABLE "IoTDevice" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "weatherStationId" INTEGER,
    "deviceName" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "firmwareVersion" TEXT,
    "installationDate" TIMESTAMP(3),
    "status" "SensorStatus" NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "lastCommunication" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IoTDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "sensorName" TEXT NOT NULL,
    "sensorType" "SensorType" NOT NULL,
    "unit" TEXT,
    "minimumValue" DOUBLE PRECISION,
    "maximumValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" SERIAL NOT NULL,
    "sensorId" INTEGER NOT NULL,
    "farmId" INTEGER NOT NULL,
    "livestockId" INTEGER,
    "readingValue" DOUBLE PRECISION NOT NULL,
    "readingTime" TIMESTAMP(3) NOT NULL,
    "status" "ReadingStatus" NOT NULL,
    "batteryLevel" DOUBLE PRECISION,
    "signalStrength" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IoTDevice_deviceCode_key" ON "IoTDevice"("deviceCode");

-- AddForeignKey
ALTER TABLE "IoTDevice" ADD CONSTRAINT "IoTDevice_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IoTDevice" ADD CONSTRAINT "IoTDevice_weatherStationId_fkey" FOREIGN KEY ("weatherStationId") REFERENCES "WeatherStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "IoTDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
