/*
  Warnings:

  - You are about to drop the column `educationLevel` on the `Farmer` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Farmer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Farmer" DROP COLUMN "educationLevel",
DROP COLUMN "gender",
ADD COLUMN     "communicationPreferenceId" INTEGER,
ADD COLUMN     "digitalLiteracyLevelId" INTEGER,
ADD COLUMN     "educationLevelId" INTEGER,
ADD COLUMN     "farmerTypeId" INTEGER,
ADD COLUMN     "farmingActivityId" INTEGER,
ADD COLUMN     "genderId" INTEGER,
ADD COLUMN     "hasDefaultedLoan" BOOLEAN,
ADD COLUMN     "hasLoan" BOOLEAN,
ADD COLUMN     "householdSize" INTEGER,
ADD COLUMN     "maritalStatusId" INTEGER,
ADD COLUMN     "numberOfDependents" INTEGER,
ADD COLUMN     "numberOfFarmWorkers" INTEGER,
ADD COLUMN     "occupationId" INTEGER,
ADD COLUMN     "preferredLanguageId" INTEGER,
ADD COLUMN     "receivesCredit" BOOLEAN,
ADD COLUMN     "receivesInputSubsidy" BOOLEAN;

-- CreateTable
CREATE TABLE "Gender" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Gender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationLevel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "EducationLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Occupation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Occupation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaritalStatus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MaritalStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FarmerType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmingActivity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FarmingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationPreference" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CommunicationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalLiteracyLevel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "DigitalLiteracyLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gender_name_key" ON "Gender"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EducationLevel_name_key" ON "EducationLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Occupation_name_key" ON "Occupation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MaritalStatus_name_key" ON "MaritalStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FarmerType_name_key" ON "FarmerType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FarmingActivity_name_key" ON "FarmingActivity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationPreference_name_key" ON "CommunicationPreference"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalLiteracyLevel_name_key" ON "DigitalLiteracyLevel"("name");

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_educationLevelId_fkey" FOREIGN KEY ("educationLevelId") REFERENCES "EducationLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_maritalStatusId_fkey" FOREIGN KEY ("maritalStatusId") REFERENCES "MaritalStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_farmerTypeId_fkey" FOREIGN KEY ("farmerTypeId") REFERENCES "FarmerType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_farmingActivityId_fkey" FOREIGN KEY ("farmingActivityId") REFERENCES "FarmingActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_preferredLanguageId_fkey" FOREIGN KEY ("preferredLanguageId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_communicationPreferenceId_fkey" FOREIGN KEY ("communicationPreferenceId") REFERENCES "CommunicationPreference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_digitalLiteracyLevelId_fkey" FOREIGN KEY ("digitalLiteracyLevelId") REFERENCES "DigitalLiteracyLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
