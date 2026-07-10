-- CreateEnum
CREATE TYPE "BreedingMethod" AS ENUM ('NATURAL', 'ARTIFICIAL_INSEMINATION', 'EMBRYO_TRANSFER');

-- CreateEnum
CREATE TYPE "PregnancyStatus" AS ENUM ('NOT_PREGNANT', 'PREGNANT', 'CALVED', 'ABORTED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "BirthType" AS ENUM ('SINGLE', 'TWINS', 'TRIPLETS', 'MULTIPLE');

-- CreateEnum
CREATE TYPE "OffspringStatus" AS ENUM ('ALIVE', 'STILLBORN', 'DIED');

-- CreateEnum
CREATE TYPE "HatchStatus" AS ENUM ('INCUBATING', 'HATCHED', 'FAILED');

-- CreateTable
CREATE TABLE "Breeding" (
    "id" SERIAL NOT NULL,
    "maleId" INTEGER,
    "femaleId" INTEGER NOT NULL,
    "method" "BreedingMethod" NOT NULL,
    "breedingDate" TIMESTAMP(3) NOT NULL,
    "expectedBirthDate" TIMESTAMP(3),
    "pregnancyStatus" "PregnancyStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Breeding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Birth" (
    "id" SERIAL NOT NULL,
    "breedingId" INTEGER NOT NULL,
    "motherId" INTEGER NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "birthType" "BirthType" NOT NULL,
    "offspringCount" INTEGER NOT NULL,
    "offspringStatus" "OffspringStatus" NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Birth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EggIncubation" (
    "id" SERIAL NOT NULL,
    "livestockId" INTEGER NOT NULL,
    "incubationStart" TIMESTAMP(3) NOT NULL,
    "expectedHatchDate" TIMESTAMP(3) NOT NULL,
    "eggsSet" INTEGER NOT NULL,
    "eggsHatched" INTEGER,
    "hatchStatus" "HatchStatus" NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EggIncubation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Breeding" ADD CONSTRAINT "Breeding_maleId_fkey" FOREIGN KEY ("maleId") REFERENCES "Livestock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breeding" ADD CONSTRAINT "Breeding_femaleId_fkey" FOREIGN KEY ("femaleId") REFERENCES "Livestock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Birth" ADD CONSTRAINT "Birth_breedingId_fkey" FOREIGN KEY ("breedingId") REFERENCES "Breeding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Birth" ADD CONSTRAINT "Birth_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Livestock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EggIncubation" ADD CONSTRAINT "EggIncubation_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
