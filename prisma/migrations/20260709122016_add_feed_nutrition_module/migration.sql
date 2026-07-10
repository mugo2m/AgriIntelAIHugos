-- CreateEnum
CREATE TYPE "FeedCategory" AS ENUM ('HAY', 'SILAGE', 'CONCENTRATE', 'GRAIN', 'PELLETS', 'MINERAL', 'SUPPLEMENT', 'PASTURE', 'HOME_MADE_FEED', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedingFrequency" AS ENUM ('ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'WEEKLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FeedUnit" AS ENUM ('GRAMS', 'KILOGRAMS', 'TONNES', 'LITRES', 'MILLILITRES', 'BALES', 'BAGS');

-- CreateTable
CREATE TABLE "Feed" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FeedCategory" NOT NULL,
    "manufacturer" TEXT,
    "proteinPercentage" DOUBLE PRECISION,
    "energyValue" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedingSchedule" (
    "id" SERIAL NOT NULL,
    "livestockId" INTEGER NOT NULL,
    "feedId" INTEGER NOT NULL,
    "frequency" "FeedingFrequency" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "FeedUnit" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedingSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedRecord" (
    "id" SERIAL NOT NULL,
    "livestockId" INTEGER NOT NULL,
    "feedId" INTEGER NOT NULL,
    "feedingDate" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "FeedUnit" NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FeedingSchedule" ADD CONSTRAINT "FeedingSchedule_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingSchedule" ADD CONSTRAINT "FeedingSchedule_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedRecord" ADD CONSTRAINT "FeedRecord_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedRecord" ADD CONSTRAINT "FeedRecord_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
