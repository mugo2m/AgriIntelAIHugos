/*
  Warnings:

  - You are about to drop the column `name` on the `Buyer` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[firebaseUid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `buyerName` to the `Buyer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerType` to the `Buyer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firebaseUid` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CommodityTransactionType" AS ENUM ('HARVEST', 'PURCHASE', 'SALE', 'IMPORT', 'EXPORT', 'TRANSFER', 'HOUSEHOLD_CONSUMPTION', 'LIVESTOCK_FEED', 'SEED_RESERVE', 'PROCESSING', 'STORAGE', 'DONATION', 'LOSS', 'RETURN', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "BuyerType" AS ENUM ('INDIVIDUAL', 'RETAILER', 'WHOLESALER', 'COOPERATIVE', 'PROCESSOR', 'EXPORTER', 'GOVERNMENT', 'NGO', 'SCHOOL', 'SUPERMARKET', 'DISTRIBUTOR');

-- CreateEnum
CREATE TYPE "BusinessPartnerType" AS ENUM ('FARMER', 'CUSTOMER', 'BUYER', 'SUPPLIER', 'COOPERATIVE', 'AGRO_DEALER', 'PROCESSOR', 'EXPORTER', 'IMPORTER', 'RETAILER', 'WHOLESALER', 'GOVERNMENT', 'NGO', 'SACCO', 'BANK', 'INSURANCE', 'TRANSPORTER', 'LOGISTICS', 'EXTENSION_OFFICER', 'RESEARCH_INSTITUTION', 'UNIVERSITY');

-- DropForeignKey
ALTER TABLE "Buyer" DROP CONSTRAINT "Buyer_farmId_fkey";

-- AlterTable
ALTER TABLE "Buyer" DROP COLUMN "name",
ADD COLUMN     "businessPartnerId" INTEGER,
ADD COLUMN     "buyerName" TEXT NOT NULL,
ADD COLUMN     "buyerType" "BuyerType" NOT NULL,
ADD COLUMN     "countryId" INTEGER,
ADD COLUMN     "countyId" INTEGER,
ALTER COLUMN "farmId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "businessPartnerId" INTEGER;

-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "countryId" INTEGER,
ADD COLUMN     "countyId" INTEGER,
ADD COLUMN     "subCountyId" INTEGER,
ADD COLUMN     "villageId" INTEGER,
ADD COLUMN     "wardId" INTEGER;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "businessPartnerId" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firebaseUid" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "photoURL" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesChannel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRevenueChannel" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityTransaction" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER,
    "cropId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "transactionType" "CommodityTransactionType" NOT NULL,
    "salesChannelId" INTEGER,
    "buyerId" INTEGER,
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "pricePerKg" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "sourceCountryId" INTEGER,
    "sourceCountyId" INTEGER,
    "sourceSubCountyId" INTEGER,
    "sourceWardId" INTEGER,
    "destinationCountryId" INTEGER,
    "destinationCountyId" INTEGER,
    "destinationSubCountyId" INTEGER,
    "destinationWardId" INTEGER,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "referenceNumber" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessPartnerId" INTEGER,

    CONSTRAINT "CommodityTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommoditySale" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "invoiceNumber" TEXT,
    "receiptNumber" TEXT,
    "paymentMethod" "PaymentMethod",
    "paymentStatus" "PaymentStatus",
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "pricePerKg" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION DEFAULT 0,
    "tax" DOUBLE PRECISION DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION DEFAULT 0,
    "balance" DOUBLE PRECISION DEFAULT 0,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "vehicleNumber" TEXT,
    "driverName" TEXT,
    "destinationAddress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "salesChannelId" INTEGER NOT NULL,

    CONSTRAINT "CommoditySale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPartner" (
    "id" SERIAL NOT NULL,
    "partnerCode" TEXT NOT NULL,
    "partnerType" "BusinessPartnerType" NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "taxNumber" TEXT,
    "phone" TEXT,
    "alternativePhone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "countryId" INTEGER,
    "countyId" INTEGER,
    "subCountyId" INTEGER,
    "wardId" INTEGER,
    "villageId" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "contactPerson" TEXT,
    "contactPosition" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPartner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesChannel_name_key" ON "SalesChannel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CommoditySale_transactionId_key" ON "CommoditySale"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPartner_partnerCode_key" ON "BusinessPartner"("partnerCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_subCountyId_fkey" FOREIGN KEY ("subCountyId") REFERENCES "SubCounty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Buyer" ADD CONSTRAINT "Buyer_businessPartnerId_fkey" FOREIGN KEY ("businessPartnerId") REFERENCES "BusinessPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Buyer" ADD CONSTRAINT "Buyer_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Buyer" ADD CONSTRAINT "Buyer_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Buyer" ADD CONSTRAINT "Buyer_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_businessPartnerId_fkey" FOREIGN KEY ("businessPartnerId") REFERENCES "BusinessPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_destinationCountryId_fkey" FOREIGN KEY ("destinationCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_destinationCountyId_fkey" FOREIGN KEY ("destinationCountyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_destinationSubCountyId_fkey" FOREIGN KEY ("destinationSubCountyId") REFERENCES "SubCounty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_destinationWardId_fkey" FOREIGN KEY ("destinationWardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_salesChannelId_fkey" FOREIGN KEY ("salesChannelId") REFERENCES "SalesChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_sourceCountryId_fkey" FOREIGN KEY ("sourceCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_sourceCountyId_fkey" FOREIGN KEY ("sourceCountyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_sourceSubCountyId_fkey" FOREIGN KEY ("sourceSubCountyId") REFERENCES "SubCounty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityTransaction" ADD CONSTRAINT "CommodityTransaction_sourceWardId_fkey" FOREIGN KEY ("sourceWardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommoditySale" ADD CONSTRAINT "CommoditySale_salesChannelId_fkey" FOREIGN KEY ("salesChannelId") REFERENCES "SalesChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommoditySale" ADD CONSTRAINT "CommoditySale_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "CommodityTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_businessPartnerId_fkey" FOREIGN KEY ("businessPartnerId") REFERENCES "BusinessPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessPartnerId_fkey" FOREIGN KEY ("businessPartnerId") REFERENCES "BusinessPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPartner" ADD CONSTRAINT "BusinessPartner_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPartner" ADD CONSTRAINT "BusinessPartner_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPartner" ADD CONSTRAINT "BusinessPartner_subCountyId_fkey" FOREIGN KEY ("subCountyId") REFERENCES "SubCounty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPartner" ADD CONSTRAINT "BusinessPartner_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPartner" ADD CONSTRAINT "BusinessPartner_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
