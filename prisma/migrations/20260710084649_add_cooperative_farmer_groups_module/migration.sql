-- CreateEnum
CREATE TYPE "CooperativeType" AS ENUM ('PRODUCER', 'MARKETING', 'DAIRY', 'POULTRY', 'LIVESTOCK', 'SAVINGS', 'MULTIPURPOSE');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('MEMBER', 'CHAIRPERSON', 'SECRETARY', 'TREASURER', 'COMMITTEE_MEMBER');

-- CreateTable
CREATE TABLE "Cooperative" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "cooperativeType" "CooperativeType" NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "establishedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cooperative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperativeMembership" (
    "id" SERIAL NOT NULL,
    "cooperativeId" INTEGER NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "memberRole" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CooperativeMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperativeMeeting" (
    "id" SERIAL NOT NULL,
    "cooperativeId" INTEGER NOT NULL,
    "organizerId" INTEGER,
    "title" TEXT NOT NULL,
    "agenda" TEXT,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "minutes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CooperativeMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedResource" (
    "id" SERIAL NOT NULL,
    "cooperativeId" INTEGER NOT NULL,
    "resourceName" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cooperative_registrationNumber_key" ON "Cooperative"("registrationNumber");

-- AddForeignKey
ALTER TABLE "CooperativeMembership" ADD CONSTRAINT "CooperativeMembership_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeMembership" ADD CONSTRAINT "CooperativeMembership_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeMeeting" ADD CONSTRAINT "CooperativeMeeting_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeMeeting" ADD CONSTRAINT "CooperativeMeeting_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedResource" ADD CONSTRAINT "SharedResource_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
