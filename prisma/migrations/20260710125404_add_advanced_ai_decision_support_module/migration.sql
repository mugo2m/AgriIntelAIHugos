-- CreateEnum
CREATE TYPE "DecisionCategory" AS ENUM ('CROP', 'LIVESTOCK', 'WEATHER', 'SOIL', 'IRRIGATION', 'FERTILIZER', 'PEST', 'DISEASE', 'MARKET', 'FINANCE', 'INVENTORY', 'ENERGY');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IMPLEMENTED');

-- CreateEnum
CREATE TYPE "AIModelSource" AS ENUM ('OPENAI', 'GEMINI', 'CLAUDE', 'LLAMA', 'MISTRAL', 'GROK', 'CUSTOM');

-- CreateTable
CREATE TABLE "AIDecision" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "DecisionCategory" NOT NULL,
    "modelSource" "AIModelSource" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "priority" "RecommendationPriority" NOT NULL,
    "status" "DecisionStatus" NOT NULL DEFAULT 'PENDING',
    "userId" INTEGER,
    "farmId" INTEGER,
    "recommendation" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionFeedback" (
    "id" SERIAL NOT NULL,
    "decisionId" INTEGER NOT NULL,
    "userId" INTEGER,
    "rating" INTEGER,
    "accepted" BOOLEAN,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationScenario" (
    "id" SERIAL NOT NULL,
    "scenarioName" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "constraints" TEXT,
    "expectedBenefit" TEXT,
    "simulationResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptimizationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExplainableAI" (
    "id" SERIAL NOT NULL,
    "decisionId" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL,
    "importantFeatures" TEXT NOT NULL,
    "confidenceExplanation" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExplainableAI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIKnowledgeMemory" (
    "id" SERIAL NOT NULL,
    "topic" TEXT NOT NULL,
    "embeddingId" TEXT,
    "knowledgeSource" TEXT,
    "summary" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIKnowledgeMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIModelPerformance" (
    "id" SERIAL NOT NULL,
    "modelName" TEXT NOT NULL,
    "version" TEXT,
    "accuracy" DOUBLE PRECISION,
    "precision" DOUBLE PRECISION,
    "recall" DOUBLE PRECISION,
    "f1Score" DOUBLE PRECISION,
    "latency" DOUBLE PRECISION,
    "evaluatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIModelPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExplainableAI_decisionId_key" ON "ExplainableAI"("decisionId");

-- AddForeignKey
ALTER TABLE "AIDecision" ADD CONSTRAINT "AIDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIDecision" ADD CONSTRAINT "AIDecision_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionFeedback" ADD CONSTRAINT "DecisionFeedback_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "AIDecision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionFeedback" ADD CONSTRAINT "DecisionFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExplainableAI" ADD CONSTRAINT "ExplainableAI_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "AIDecision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
