-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "soilTypeId" INTEGER;

-- CreateTable
CREATE TABLE "SoilType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phMin" DOUBLE PRECISION,
    "phMax" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoilType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilTest" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "ph" DOUBLE PRECISION,
    "organicMatter" DOUBLE PRECISION,
    "nitrogen" DOUBLE PRECISION,
    "phosphorus" DOUBLE PRECISION,
    "potassium" DOUBLE PRECISION,
    "calcium" DOUBLE PRECISION,
    "magnesium" DOUBLE PRECISION,
    "laboratory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoilTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SoilType_name_key" ON "SoilType"("name");

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_soilTypeId_fkey" FOREIGN KEY ("soilTypeId") REFERENCES "SoilType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilTest" ADD CONSTRAINT "SoilTest_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
