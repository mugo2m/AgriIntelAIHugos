-- CreateEnum
CREATE TYPE "GovernmentProgramType" AS ENUM ('SUBSIDY', 'GRANT', 'LOAN', 'TRAINING', 'INSURANCE_SUPPORT', 'INPUT_SUPPORT', 'IRRIGATION_PROJECT', 'RESEARCH', 'OTHER');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('UPCOMING', 'OPEN', 'CLOSED', 'SUSPENDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "governmentApplicationId" INTEGER;

-- CreateTable
CREATE TABLE "GovernmentProgram" (
    "id" SERIAL NOT NULL,
    "programName" TEXT NOT NULL,
    "programType" "GovernmentProgramType" NOT NULL,
    "description" TEXT,
    "provider" TEXT NOT NULL,
    "budget" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ProgramStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernmentProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentApplication" (
    "id" SERIAL NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "programId" INTEGER NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedAmount" DOUBLE PRECISION,
    "approvedAmount" DOUBLE PRECISION,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernmentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionOfficer" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "county" TEXT,
    "organization" TEXT,
    "specialization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtensionOfficer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionVisit" (
    "id" SERIAL NOT NULL,
    "officerId" INTEGER NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "recommendations" TEXT,
    "nextVisit" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtensionVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GovernmentApplication_applicationNumber_key" ON "GovernmentApplication"("applicationNumber");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_governmentApplicationId_fkey" FOREIGN KEY ("governmentApplicationId") REFERENCES "GovernmentApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentApplication" ADD CONSTRAINT "GovernmentApplication_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentApplication" ADD CONSTRAINT "GovernmentApplication_programId_fkey" FOREIGN KEY ("programId") REFERENCES "GovernmentProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionVisit" ADD CONSTRAINT "ExtensionVisit_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "ExtensionOfficer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionVisit" ADD CONSTRAINT "ExtensionVisit_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
