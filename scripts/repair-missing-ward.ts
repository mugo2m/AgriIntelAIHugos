
// scripts/repair-missing-ward.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const MISSING_WARD = {
  sourceGid: 1994,
  sourceUid: "IO0zXx5HVO2",
  name: "Kisii Central Ward",
  countyId: 87,
  subCountyId: 508,
  constituencyId: 486,
};

const EXISTING_WARD_TO_PROTECT = {
  sourceGid: 2006,
  sourceUid: "erVsVGwRwBc",
  name: "Kisii Central Ward",
  subCountyId: 485,
};

async function main() {
  console.log("==============================================");
  console.log("REPAIR MISSING AUTHORITATIVE WARD");
  console.log("==============================================");
  console.log();

  await prisma.$transaction(
    async (tx) => {
      console.log("1. VERIFYING EXPECTED ADMINISTRATIVE RECORDS");
      console.log("----------------------------------------------");

      const county = await tx.county.findUnique({
        where: {
          id: MISSING_WARD.countyId,
        },
      });

      if (!county) {
        throw new Error(
          `County ${MISSING_WARD.countyId} does not exist.`,
        );
      }

      if (county.name !== "Kisii") {
        throw new Error(
          `County ${MISSING_WARD.countyId} is "${county.name}", expected "Kisii".`,
        );
      }

      const subCounty = await tx.subCounty.findUnique({
        where: {
          id: MISSING_WARD.subCountyId,
        },
      });

      if (!subCounty) {
        throw new Error(
          `SubCounty ${MISSING_WARD.subCountyId} does not exist.`,
        );
      }

      if (subCounty.countyId !== MISSING_WARD.countyId) {
        throw new Error(
          `SubCounty ${subCounty.id} belongs to county ${subCounty.countyId}, expected ${MISSING_WARD.countyId}.`,
        );
      }

      if (!subCounty.name.toLowerCase().includes("nyaribari chache")) {
        throw new Error(
          `SubCounty ${subCounty.id} is "${subCounty.name}", expected Nyaribari Chache.`,
        );
      }

      const constituency = await tx.constituency.findUnique({
        where: {
          id: MISSING_WARD.constituencyId,
        },
      });

      if (!constituency) {
        throw new Error(
          `Constituency ${MISSING_WARD.constituencyId} does not exist.`,
        );
      }

      if (constituency.countyId !== MISSING_WARD.countyId) {
        throw new Error(
          `Constituency ${constituency.id} belongs to county ${constituency.countyId}, expected ${MISSING_WARD.countyId}.`,
        );
      }

      if (constituency.name.toLowerCase() !== "nyaribari chache") {
        throw new Error(
          `Constituency ${constituency.id} is "${constituency.name}", expected "Nyaribari Chache".`,
        );
      }

      console.log(
        `County:        ${county.id} - ${county.name}`,
      );
      console.log(
        `SubCounty:     ${subCounty.id} - ${subCounty.name}`,
      );
      console.log(
        `Constituency:  ${constituency.id} - ${constituency.name}`,
      );
      console.log();

      console.log("2. VERIFYING MISSING SOURCE WARD");
      console.log("----------------------------------------------");

      const existingBySourceUid = await tx.ward.findFirst({
        where: {
          sourceUid: MISSING_WARD.sourceUid,
        },
      });

      if (existingBySourceUid) {
        throw new Error(
          `Source UID ${MISSING_WARD.sourceUid} already exists on ward ${existingBySourceUid.id}. No repair needed.`,
        );
      }

      const existingBySourceGid = await tx.ward.findFirst({
        where: {
          sourceGid: MISSING_WARD.sourceGid,
        },
      });

      if (existingBySourceGid) {
        throw new Error(
          `Source GID ${MISSING_WARD.sourceGid} already exists on ward ${existingBySourceGid.id}. No repair needed.`,
        );
      }

      // IMPORTANT:
      // Ward identity is now constituency + subCounty + name.
      // This allows legitimate same-name wards in the same constituency
      // when they belong to different sub-counties.
      const existingSameHierarchyWard =
        await tx.ward.findFirst({
          where: {
            constituencyId: MISSING_WARD.constituencyId,
            subCountyId: MISSING_WARD.subCountyId,
            name: MISSING_WARD.name,
          },
        });

      if (existingSameHierarchyWard) {
        throw new Error(
          `A ward named "${MISSING_WARD.name}" already exists in constituency ${MISSING_WARD.constituencyId} and subcounty ${MISSING_WARD.subCountyId} (ward ID ${existingSameHierarchyWard.id}).`,
        );
      }

      console.log(
        `Confirmed: sourceGid ${MISSING_WARD.sourceGid} is missing.`,
      );
      console.log(
        `Confirmed: sourceUid ${MISSING_WARD.sourceUid} is missing.`,
      );
      console.log(
        `Confirmed: "${MISSING_WARD.name}" is not already in constituency ${MISSING_WARD.constituencyId} and subcounty ${MISSING_WARD.subCountyId}.`,
      );
      console.log();

      console.log("3. PROTECTING EXISTING GID 2006 RECORD");
      console.log("----------------------------------------------");

      const existing2006 = await tx.ward.findFirst({
        where: {
          sourceGid: EXISTING_WARD_TO_PROTECT.sourceGid,
        },
      });

      if (!existing2006) {
        throw new Error(
          `Expected existing GID ${EXISTING_WARD_TO_PROTECT.sourceGid} was not found.`,
        );
      }

      if (
        existing2006.sourceUid !==
        EXISTING_WARD_TO_PROTECT.sourceUid
      ) {
        throw new Error(
          `GID ${EXISTING_WARD_TO_PROTECT.sourceGid} has unexpected sourceUid "${existing2006.sourceUid}".`,
        );
      }

      if (existing2006.name !== EXISTING_WARD_TO_PROTECT.name) {
        throw new Error(
          `GID ${EXISTING_WARD_TO_PROTECT.sourceGid} has unexpected ward name "${existing2006.name}".`,
        );
      }

      if (
        existing2006.subCountyId !==
        EXISTING_WARD_TO_PROTECT.subCountyId
      ) {
        throw new Error(
          `GID ${EXISTING_WARD_TO_PROTECT.sourceGid} is attached to SubCounty ${existing2006.subCountyId}, expected ${EXISTING_WARD_TO_PROTECT.subCountyId}.`,
        );
      }

      console.log(
        `GID 2006 preserved: ward ID ${existing2006.id}`,
      );
      console.log(
        `SubCounty: ${existing2006.subCountyId}`,
      );
      console.log(
        `Source UID: ${existing2006.sourceUid}`,
      );
      console.log();

      console.log("4. INSERTING MISSING WARD");
      console.log("----------------------------------------------");

      const createdWard = await tx.ward.create({
        data: {
          name: MISSING_WARD.name,
          countyId: MISSING_WARD.countyId,
          subCountyId: MISSING_WARD.subCountyId,
          constituencyId: MISSING_WARD.constituencyId,
          sourceGid: MISSING_WARD.sourceGid,
          sourceUid: MISSING_WARD.sourceUid,
          code: null,
        },
      });

      console.log(
        `Created ward ID:       ${createdWard.id}`,
      );
      console.log(
        `Name:                  ${createdWard.name}`,
      );
      console.log(
        `County ID:             ${createdWard.countyId}`,
      );
      console.log(
        `SubCounty ID:          ${createdWard.subCountyId}`,
      );
      console.log(
        `Constituency ID:       ${createdWard.constituencyId}`,
      );
      console.log(
        `Source GID:            ${createdWard.sourceGid}`,
      );
      console.log(
        `Source UID:            ${createdWard.sourceUid}`,
      );
      console.log();

      console.log("5. FINAL VERIFICATION");
      console.log("----------------------------------------------");

      const repairedWard = await tx.ward.findFirst({
        where: {
          sourceGid: MISSING_WARD.sourceGid,
        },
      });

      if (!repairedWard) {
        throw new Error(
          "Inserted ward could not be found during final verification.",
        );
      }

      if (repairedWard.sourceUid !== MISSING_WARD.sourceUid) {
        throw new Error(
          `Inserted ward has incorrect sourceUid: ${repairedWard.sourceUid}`,
        );
      }

      if (repairedWard.name !== MISSING_WARD.name) {
        throw new Error(
          `Inserted ward has incorrect name: ${repairedWard.name}`,
        );
      }

      if (repairedWard.countyId !== MISSING_WARD.countyId) {
        throw new Error(
          `Inserted ward has incorrect countyId: ${repairedWard.countyId}`,
        );
      }

      if (repairedWard.subCountyId !== MISSING_WARD.subCountyId) {
        throw new Error(
          `Inserted ward has incorrect subCountyId: ${repairedWard.subCountyId}`,
        );
      }

      if (
        repairedWard.constituencyId !==
        MISSING_WARD.constituencyId
      ) {
        throw new Error(
          `Inserted ward has incorrect constituencyId: ${repairedWard.constituencyId}`,
        );
      }

      const protected2006 = await tx.ward.findFirst({
        where: {
          sourceGid: EXISTING_WARD_TO_PROTECT.sourceGid,
        },
      });

      if (!protected2006) {
        throw new Error(
          "GID 2006 disappeared during the repair.",
        );
      }

      if (
        protected2006.sourceUid !==
        EXISTING_WARD_TO_PROTECT.sourceUid
      ) {
        throw new Error(
          "GID 2006 sourceUid changed during the repair.",
        );
      }

      if (
        protected2006.subCountyId !==
        EXISTING_WARD_TO_PROTECT.subCountyId
      ) {
        throw new Error(
          "GID 2006 SubCounty changed during the repair.",
        );
      }

      const totalWards = await tx.ward.count();

      const duplicateSourceGidCount =
        await tx.ward.count({
          where: {
            sourceGid: MISSING_WARD.sourceGid,
          },
        });

      if (duplicateSourceGidCount !== 1) {
        throw new Error(
          `Expected exactly one GID ${MISSING_WARD.sourceGid}; found ${duplicateSourceGidCount}.`,
        );
      }

      console.log(
        `Verified GID 1994:      ${repairedWard.id}`,
      );
      console.log(
        `Verified SubCounty:    ${repairedWard.subCountyId}`,
      );
      console.log(
        `Verified Constituency: ${repairedWard.constituencyId}`,
      );
      console.log(
        `Verified GID 2006:      ${protected2006.id} unchanged`,
      );
      console.log(
        `Database ward count:   ${totalWards}`,
      );
      console.log(
        `GID 1994 occurrences:  ${duplicateSourceGidCount}`,
      );
      console.log();

      if (totalWards !== 1450) {
        throw new Error(
          `Expected 1450 database wards after repair, found ${totalWards}.`,
        );
      }

      console.log("FINAL VERIFICATION PASSED.");
      console.log();
      console.log("The missing authoritative ward was added.");
      console.log("GID 2006 was preserved unchanged.");
      console.log("Database now contains all 1450 authoritative wards.");
      console.log();
      console.log(
        "==============================================",
      );
      console.log("TRANSACTION READY TO COMMIT");
      console.log(
        "==============================================",
      );
    },
    {
      maxWait: 10000,
      timeout: 120000,
    },
  );

  console.log();
  console.log("==============================================");
  console.log("REPAIR COMPLETED SUCCESSFULLY");
  console.log("==============================================");
}

main()
  .catch((error) => {
    console.error();
    console.error("==============================================");
    console.error("REPAIR FAILED — TRANSACTION ROLLED BACK");
    console.error("==============================================");
    console.error();
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

