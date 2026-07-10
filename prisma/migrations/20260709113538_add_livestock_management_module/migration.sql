-- CreateEnum
CREATE TYPE "LivestockCategory" AS ENUM ('CATTLE', 'GOAT', 'SHEEP', 'PIG', 'POULTRY', 'RABBIT', 'FISH', 'CAMEL', 'BEE', 'OTHER');

-- CreateEnum
CREATE TYPE "AnimalSex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "AnimalStatus" AS ENUM ('ACTIVE', 'SOLD', 'DEAD', 'SLAUGHTERED', 'LOST');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'SICK', 'UNDER_TREATMENT', 'RECOVERED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "VaccinationStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED');

-- CreateTable
CREATE TABLE "Breed" (
    "id" SERIAL NOT NULL,
    "category" "LivestockCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "scientificName" TEXT,
    "originCountry" TEXT,
    "purpose" TEXT,
    "averageWeight" DOUBLE PRECISION,
    "averageMilkYield" DOUBLE PRECISION,
    "averageEggProduction" INTEGER,
    "growthRate" TEXT,
    "climateSuitability" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Breed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livestock" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "category" "LivestockCategory" NOT NULL,
    "breedId" INTEGER,
    "sex" "AnimalSex" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "acquisitionDate" TIMESTAMP(3),
    "weight" DOUBLE PRECISION,
    "healthStatus" "HealthStatus" NOT NULL,
    "status" "AnimalStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Livestock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" SERIAL NOT NULL,
    "livestockId" INTEGER NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "vaccinationDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "status" "VaccinationStatus" NOT NULL,
    "veterinarian" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treatment" (
    "id" SERIAL NOT NULL,
    "livestockId" INTEGER NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "medication" TEXT,
    "treatmentDate" TIMESTAMP(3) NOT NULL,
    "veterinarian" TEXT,
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Breed_category_name_key" ON "Breed"("category", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Livestock_tagNumber_key" ON "Livestock"("tagNumber");

-- AddForeignKey
ALTER TABLE "Livestock" ADD CONSTRAINT "Livestock_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livestock" ADD CONSTRAINT "Livestock_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "Breed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
