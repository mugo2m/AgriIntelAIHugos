-- CreateEnum
CREATE TYPE "DocumentOwnerType" AS ENUM ('FARMER', 'FARM', 'LIVESTOCK', 'EQUIPMENT', 'EMPLOYEE', 'FINANCIAL', 'SOIL_TEST', 'HARVEST', 'AI_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('IDENTIFICATION', 'CERTIFICATE', 'LICENSE', 'CONTRACT', 'RECEIPT', 'INVOICE', 'REPORT', 'IMAGE', 'VIDEO', 'AUDIO', 'PDF', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "FileStorageProvider" AS ENUM ('LOCAL', 'FIREBASE', 'AWS_S3', 'AZURE_BLOB', 'GOOGLE_CLOUD');

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT,
    "fileExtension" TEXT,
    "mimeType" TEXT,
    "fileSize" DOUBLE PRECISION,
    "fileUrl" TEXT NOT NULL,
    "storageProvider" "FileStorageProvider" NOT NULL,
    "ownerType" "DocumentOwnerType" NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "farmerId" INTEGER,
    "farmId" INTEGER,
    "livestockId" INTEGER,
    "equipmentId" INTEGER,
    "uploadedBy" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
