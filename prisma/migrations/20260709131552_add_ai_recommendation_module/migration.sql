-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('CROP', 'SOIL', 'FERTILIZER', 'IRRIGATION', 'WEATHER', 'PEST', 'DISEASE', 'HARVEST', 'LIVESTOCK', 'FEED', 'BREEDING', 'VACCINATION', 'FINANCIAL', 'MARKET', 'GENERAL');

-- CreateEnum
CREATE TYPE "RecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'VIEWED', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PredictionType" AS ENUM ('YIELD', 'WEATHER', 'MARKET_PRICE', 'PEST_RISK', 'DISEASE_RISK', 'SOIL_HEALTH', 'IRRIGATION_DEMAND', 'LIVESTOCK_PRODUCTIVITY');

-- CreateEnum
CREATE TYPE "AIModelType" AS ENUM ('MACHINE_LEARNING', 'DEEP_LEARNING', 'LLM', 'RULE_BASED', 'HYBRID');

-- CreateTable
CREATE TABLE "AIRecommendation" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "farmerId" INTEGER,
    "cropId" INTEGER,
    "livestockId" INTEGER,
    "soilTestId" INTEGER,
    "recommendationType" "RecommendationType" NOT NULL,
    "priority" "RecommendationPriority" NOT NULL,
    "title" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "reason" TEXT,
    "confidence" DOUBLE PRECISION,
    "generatedBy" "AIModelType" NOT NULL,
    "status" "RecommendationStatus" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIModelPrediction" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "weatherRecordId" INTEGER,
    "predictionType" "PredictionType" NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT,
    "inputSummary" TEXT,
    "predictedValue" DOUBLE PRECISION,
    "predictedLabel" TEXT,
    "confidence" DOUBLE PRECISION,
    "predictionDate" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIModelPrediction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_soilTestId_fkey" FOREIGN KEY ("soilTestId") REFERENCES "SoilTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIModelPrediction" ADD CONSTRAINT "AIModelPrediction_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIModelPrediction" ADD CONSTRAINT "AIModelPrediction_weatherRecordId_fkey" FOREIGN KEY ("weatherRecordId") REFERENCES "WeatherRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
