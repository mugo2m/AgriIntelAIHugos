-- CreateEnum
CREATE TYPE "CertificationType" AS ENUM ('GLOBAL_GAP', 'ORGANIC', 'FAIRTRADE', 'RAINFOREST_ALLIANCE', 'ISO_22000', 'HACCP', 'GMP', 'GOVERNMENT', 'PRIVATE', 'OTHER');

-- CreateEnum
CREATE TYPE "CertificationStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('INTERNAL', 'EXTERNAL', 'GOVERNMENT', 'CERTIFICATION', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT');

-- CreateEnum
CREATE TYPE "CorrectiveActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CLOSED');

-- CreateTable
CREATE TABLE "FarmCertification" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "certificationType" "CertificationType" NOT NULL,
    "certificateNumber" TEXT,
    "issuingOrganization" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "status" "CertificationStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmAudit" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "certificationId" INTEGER,
    "auditorId" INTEGER,
    "auditType" "AuditType" NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "status" "AuditStatus" NOT NULL,
    "compliance" "ComplianceStatus" NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" SERIAL NOT NULL,
    "auditId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "compliance" "ComplianceStatus" NOT NULL,
    "severity" "SeverityLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" SERIAL NOT NULL,
    "findingId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "assignedTo" INTEGER,
    "dueDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "status" "CorrectiveActionStatus" NOT NULL,
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FarmCertification" ADD CONSTRAINT "FarmCertification_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmAudit" ADD CONSTRAINT "FarmAudit_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmAudit" ADD CONSTRAINT "FarmAudit_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "FarmCertification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmAudit" ADD CONSTRAINT "FarmAudit_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "FarmAudit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "AuditFinding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
