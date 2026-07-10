-- CreateTable
CREATE TABLE "FertilizerType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "nitrogen" DOUBLE PRECISION,
    "phosphorus" DOUBLE PRECISION,
    "potassium" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FertilizerType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FertilizerRecommendation" (
    "id" SERIAL NOT NULL,
    "soilTestId" INTEGER NOT NULL,
    "fertilizerTypeId" INTEGER NOT NULL,
    "recommendedRate" DOUBLE PRECISION,
    "unit" TEXT,
    "recommendationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FertilizerRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FertilizerApplication" (
    "id" SERIAL NOT NULL,
    "recommendationId" INTEGER NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "quantityApplied" DOUBLE PRECISION,
    "unit" TEXT,
    "method" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FertilizerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FertilizerType_name_key" ON "FertilizerType"("name");

-- AddForeignKey
ALTER TABLE "FertilizerRecommendation" ADD CONSTRAINT "FertilizerRecommendation_soilTestId_fkey" FOREIGN KEY ("soilTestId") REFERENCES "SoilTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizerRecommendation" ADD CONSTRAINT "FertilizerRecommendation_fertilizerTypeId_fkey" FOREIGN KEY ("fertilizerTypeId") REFERENCES "FertilizerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizerApplication" ADD CONSTRAINT "FertilizerApplication_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "FertilizerRecommendation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
