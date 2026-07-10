-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('FULL', 'INCREMENTAL', 'DIFFERENTIAL');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RESTORED');

-- CreateEnum
CREATE TYPE "BackupStorage" AS ENUM ('LOCAL', 'AWS_S3', 'AZURE_BLOB', 'GOOGLE_CLOUD', 'FIREBASE_STORAGE');

-- CreateEnum
CREATE TYPE "RecoveryTestStatus" AS ENUM ('PASSED', 'FAILED', 'WARNING');

-- CreateTable
CREATE TABLE "BackupJob" (
    "id" SERIAL NOT NULL,
    "backupName" TEXT NOT NULL,
    "backupType" "BackupType" NOT NULL,
    "storage" "BackupStorage" NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "filePath" TEXT,
    "fileSize" DOUBLE PRECISION,
    "checksum" TEXT,
    "compressed" BOOLEAN NOT NULL DEFAULT true,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestoreJob" (
    "id" SERIAL NOT NULL,
    "backupId" INTEGER NOT NULL,
    "restoredById" INTEGER,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "restorePoint" TIMESTAMP(3),
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestoreJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisasterRecoveryPlan" (
    "id" SERIAL NOT NULL,
    "planName" TEXT NOT NULL,
    "description" TEXT,
    "recoveryTimeObjective" DOUBLE PRECISION,
    "recoveryPointObjective" DOUBLE PRECISION,
    "responsibleTeam" TEXT,
    "documentationUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisasterRecoveryPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryTest" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "status" "RecoveryTestStatus" NOT NULL,
    "duration" DOUBLE PRECISION,
    "findings" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRetentionPolicy" (
    "id" SERIAL NOT NULL,
    "policyName" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "backupType" "BackupType" NOT NULL,
    "automaticDeletion" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BackupJob" ADD CONSTRAINT "BackupJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestoreJob" ADD CONSTRAINT "RestoreJob_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "BackupJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestoreJob" ADD CONSTRAINT "RestoreJob_restoredById_fkey" FOREIGN KEY ("restoredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryTest" ADD CONSTRAINT "RecoveryTest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DisasterRecoveryPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
