-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('WEATHER_API', 'PAYMENT_GATEWAY', 'SMS_PROVIDER', 'EMAIL_PROVIDER', 'ERP_SYSTEM', 'ACCOUNTING_SYSTEM', 'SATELLITE_PROVIDER', 'GOVERNMENT_API', 'AI_PROVIDER', 'IOT_PROVIDER', 'MAP_PROVIDER', 'STORAGE_PROVIDER');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'TESTING');

-- CreateEnum
CREATE TYPE "APILogStatus" AS ENUM ('SUCCESS', 'FAILED', 'TIMEOUT', 'PENDING');

-- CreateTable
CREATE TABLE "ExternalIntegration" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "integrationType" "IntegrationType" NOT NULL,
    "provider" TEXT NOT NULL,
    "baseUrl" TEXT,
    "apiVersion" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'ACTIVE',
    "authenticationType" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" SERIAL NOT NULL,
    "integrationId" INTEGER NOT NULL,
    "userId" INTEGER,
    "keyName" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APILog" (
    "id" SERIAL NOT NULL,
    "integrationId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requestMethod" TEXT NOT NULL,
    "requestBody" TEXT,
    "responseBody" TEXT,
    "responseCode" INTEGER,
    "responseTime" DOUBLE PRECISION,
    "status" "APILogStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APILog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "secret" TEXT,
    "eventType" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationCredential" (
    "id" SERIAL NOT NULL,
    "integrationId" INTEGER NOT NULL,
    "credentialName" TEXT NOT NULL,
    "credentialValue" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationCredential_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APILog" ADD CONSTRAINT "APILog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCredential" ADD CONSTRAINT "IntegrationCredential_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
