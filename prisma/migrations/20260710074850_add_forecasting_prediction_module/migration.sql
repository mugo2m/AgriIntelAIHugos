-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PredictionModelType" AS ENUM ('LINEAR_REGRESSION', 'RANDOM_FOREST', 'XGBOOST', 'LIGHTGBM', 'LSTM', 'CNN', 'TRANSFORMER', 'ARIMA', 'PROPHET', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ForecastPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- AlterTable
ALTER TABLE "AIModelPrediction" ADD COLUMN     "userId" INTEGER;

-- CreateTable
CREATE TABLE "ModelPerformance" (
    "id" SERIAL NOT NULL,
    "modelType" "PredictionModelType" NOT NULL,
    "predictionType" "PredictionType" NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "precision" DOUBLE PRECISION,
    "recall" DOUBLE PRECISION,
    "f1Score" DOUBLE PRECISION,
    "mae" DOUBLE PRECISION,
    "mse" DOUBLE PRECISION,
    "rmse" DOUBLE PRECISION,
    "r2Score" DOUBLE PRECISION,
    "evaluatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingDataset" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT,
    "recordCount" INTEGER,
    "source" TEXT,
    "storagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingDataset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AIModelPrediction" ADD CONSTRAINT "AIModelPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
