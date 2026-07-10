-- CreateEnum
CREATE TYPE "HealthRecordType" AS ENUM ('ROUTINE_CHECKUP', 'EMERGENCY', 'VACCINATION', 'DEWORMING', 'SURGERY', 'LAB_TEST', 'TREATMENT');

-- CreateEnum
CREATE TYPE "LabTestType" AS ENUM ('BLOOD', 'FECAL', 'URINE', 'MILK', 'TISSUE', 'PCR', 'OTHER');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('PRESCRIBED', 'DISPENSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HealthConditionStatus" AS ENUM ('ACTIVE', 'RECOVERED', 'CHRONIC', 'FATAL');

-- CreateTable
CREATE TABLE "AnimalHealthRecord" (
    "id" SERIAL NOT NULL,
    "livestockId" INTEGER NOT NULL,
    "recordType" "HealthRecordType" NOT NULL,
    "examinationDate" TIMESTAMP(3) NOT NULL,
    "diagnosis" TEXT,
    "symptoms" TEXT,
    "temperature" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "conditionStatus" "HealthConditionStatus" NOT NULL,
    "veterinarian" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimalHealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabTest" (
    "id" SERIAL NOT NULL,
    "healthRecordId" INTEGER NOT NULL,
    "testType" "LabTestType" NOT NULL,
    "result" TEXT,
    "laboratory" TEXT,
    "testDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" SERIAL NOT NULL,
    "treatmentId" INTEGER NOT NULL,
    "medication" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "durationDays" INTEGER,
    "instructions" TEXT,
    "status" "PrescriptionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AnimalHealthRecord" ADD CONSTRAINT "AnimalHealthRecord_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_healthRecordId_fkey" FOREIGN KEY ("healthRecordId") REFERENCES "AnimalHealthRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
