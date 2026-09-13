import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const LEGACY_ID = 467;
const TARGET_ID = 1478;

async function main() {
  console.log("");
  console.log("======================================================");
  console.log("Kajiado North SubCounty Consolidation");
  console.log("467 → 1478");
  console.log("======================================================");
  console.log("");

  /*
   * ----------------------------------------------------
   * PREFLIGHT
   * ----------------------------------------------------
   */

  const legacy = await prisma.subCounty.findUnique({
    where: {
      id: LEGACY_ID,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          wards: true,
          farms: true,
          farmers: true,
          businessPartners: true,
          destinationTransactions: true,
          sourceTransactions: true,
        },
      },
    },
  });

  const target = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_ID,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          wards: true,
          farms: true,
          farmers: true,
          businessPartners: true,
          destinationTransactions: true,
          sourceTransactions: true,
        },
      },
    },
  });

  if (!legacy) {
    throw new Error(`Legacy SubCounty ${LEGACY_ID} was not found.`);
  }

  if (!target) {
    throw new Error(`Target SubCounty ${TARGET_ID} was not found.`);
  }

  console.log("LEGACY");
  console.log("----------------------------------------------");
  console.log(`ID:       ${legacy.id}`);
  console.log(`Name:     ${legacy.name}`);
  console.log(`County:   ${legacy.county.name} (${legacy.countyId})`);

  console.log("");
  console.log("TARGET");
  console.log("----------------------------------------------");
  console.log(`ID:       ${target.id}`);
  console.log(`Name:     ${target.name}`);
  console.log(`County:   ${target.county.name} (${target.countyId})`);

  /*
   * ----------------------------------------------------
   * SAFETY CHECKS
   * ----------------------------------------------------
   */

  if (legacy.countyId !== target.countyId) {
    throw new Error(
      `COUNTY MISMATCH: legacy county ${legacy.countyId}, target county ${target.countyId}`,
    );
  }

  if (target._count.wards !== 0) {
    throw new Error(
      `TARGET SAFETY FAILURE: target SubCounty ${TARGET_ID} already has ${target._count.wards} wards.`,
    );
  }

  if (target._count.farms !== 0) {
    throw new Error(
      `TARGET SAFETY FAILURE: target SubCounty ${TARGET_ID} already has ${target._count.farms} farms.`,
    );
  }

  if (target._count.farmers !== 0) {
    throw new Error(
      `TARGET SAFETY FAILURE: target SubCounty ${TARGET_ID} already has ${target._count.farmers} farmers.`,
    );
  }

  if (legacy._count.businessPartners !== 0) {
    throw new Error(
      `UNEXPECTED RELATION: legacy has ${legacy._count.businessPartners} business partners.`,
    );
  }

  if (legacy._count.destinationTransactions !== 0) {
    throw new Error(
      `UNEXPECTED RELATION: legacy has ${legacy._count.destinationTransactions} destination transactions.`,
    );
  }

  if (legacy._count.sourceTransactions !== 0) {
    throw new Error(
      `UNEXPECTED RELATION: legacy has ${legacy._count.sourceTransactions} source transactions.`,
    );
  }

  console.log("");
  console.log("PREFLIGHT PASSED");
  console.log("----------------------------------------------");
  console.log(`Wards to move:       ${legacy._count.wards}`);
  console.log(`Farmers to move:     ${legacy._count.farmers}`);
  console.log(`Farms to move:       ${legacy._count.farms}`);
  console.log(`BusinessPartners:    ${legacy._count.businessPartners}`);
  console.log(`Destination Tx:      ${legacy._count.destinationTransactions}`);
  console.log(`Source Tx:            ${legacy._count.sourceTransactions}`);

  /*
   * ----------------------------------------------------
   * SHOW EXACT RECORDS
   * ----------------------------------------------------
   */

  const wards = await prisma.ward.findMany({
    where: {
      subCountyId: LEGACY_ID,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      constituencyId: true,
      countyId: true,
      sourceGid: true,
      sourceUid: true,
    },
  });

  console.log("");
  console.log("WARDS TO MOVE");
  console.log("----------------------------------------------");

  for (const ward of wards) {
    console.log(
      `${ward.id}: ${ward.name} | constituency=${ward.constituencyId} | county=${ward.countyId} | gid=${ward.sourceGid} | uid=${ward.sourceUid}`,
    );
  }

  /*
   * ----------------------------------------------------
   * TRANSACTION
   * ----------------------------------------------------
   */

  console.log("");
  console.log("STARTING DATABASE TRANSACTION");
  console.log("----------------------------------------------");

  await prisma.$transaction(
    async (tx) => {
      /*
       * 1. Move wards
       */
      const wardResult = await tx.ward.updateMany({
        where: {
          subCountyId: LEGACY_ID,
        },
        data: {
          subCountyId: TARGET_ID,
        },
      });

      console.log(`Wards moved: ${wardResult.count}`);

      /*
       * 2. Move farmers
       */
      const farmerResult = await tx.farmer.updateMany({
        where: {
          subCountyId: LEGACY_ID,
        },
        data: {
          subCountyId: TARGET_ID,
        },
      });

      console.log(`Farmers moved: ${farmerResult.count}`);

      /*
       * 3. Move farms
       */
      const farmResult = await tx.farm.updateMany({
        where: {
          subCountyId: LEGACY_ID,
        },
        data: {
          subCountyId: TARGET_ID,
        },
      });

      console.log(`Farms moved: ${farmResult.count}`);

      /*
       * 4. Verify legacy SubCounty has no
       *    remaining direct relationships.
       */
      const remaining = await tx.subCounty.findUnique({
        where: {
          id: LEGACY_ID,
        },
        select: {
          _count: {
            select: {
              wards: true,
              farms: true,
              farmers: true,
              businessPartners: true,
              destinationTransactions: true,
              sourceTransactions: true,
            },
          },
        },
      });

      if (!remaining) {
        throw new Error(
          `Legacy SubCounty ${LEGACY_ID} disappeared unexpectedly before deletion.`,
        );
      }

      const counts = remaining._count;

      if (
        counts.wards !== 0 ||
        counts.farms !== 0 ||
        counts.farmers !== 0 ||
        counts.businessPartners !== 0 ||
        counts.destinationTransactions !== 0 ||
        counts.sourceTransactions !== 0
      ) {
        throw new Error(
          `LEGACY SUBCOUNTY STILL HAS RELATIONS: ${JSON.stringify(counts)}`,
        );
      }

      /*
       * 5. Delete the now-empty legacy SubCounty.
       */
      await tx.subCounty.delete({
        where: {
          id: LEGACY_ID,
        },
      });

      console.log(`Deleted legacy SubCounty: ${LEGACY_ID}`);
    },
    {
      timeout: 30000,
    },
  );

  /*
   * ----------------------------------------------------
   * FINAL VALIDATION
   * ----------------------------------------------------
   */

  console.log("");
  console.log("FINAL VALIDATION");
  console.log("----------------------------------------------");

  const deletedLegacy = await prisma.subCounty.findUnique({
    where: {
      id: LEGACY_ID,
    },
    select: {
      id: true,
    },
  });

  const finalTarget = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_ID,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      _count: {
        select: {
          wards: true,
          farms: true,
          farmers: true,
          businessPartners: true,
          destinationTransactions: true,
          sourceTransactions: true,
        },
      },
    },
  });

  const legacyWardCount = await prisma.ward.count({
    where: {
      subCountyId: LEGACY_ID,
    },
  });

  const legacyFarmerCount = await prisma.farmer.count({
    where: {
      subCountyId: LEGACY_ID,
    },
  });

  const legacyFarmCount = await prisma.farm.count({
    where: {
      subCountyId: LEGACY_ID,
    },
  });

  console.log(
    `Legacy SubCounty 467 exists: ${deletedLegacy ? "YES — ERROR" : "NO"}`,
  );

  console.log(`Legacy wards remaining:    ${legacyWardCount}`);
  console.log(`Legacy farmers remaining:  ${legacyFarmerCount}`);
  console.log(`Legacy farms remaining:    ${legacyFarmCount}`);

  if (!finalTarget) {
    throw new Error(`Target SubCounty ${TARGET_ID} disappeared.`);
  }

  console.log("");
  console.log("TARGET FINAL COUNTS");
  console.log("----------------------------------------------");
  console.log(`Target ID:               ${finalTarget.id}`);
  console.log(`Target Name:             ${finalTarget.name}`);
  console.log(`Target County ID:        ${finalTarget.countyId}`);
  console.log(`Wards:                   ${finalTarget._count.wards}`);
  console.log(`Farmers:                 ${finalTarget._count.farmers}`);
  console.log(`Farms:                   ${finalTarget._count.farms}`);
  console.log(
    `Business Partners:       ${finalTarget._count.businessPartners}`,
  );
  console.log(
    `Destination Tx:          ${finalTarget._count.destinationTransactions}`,
  );
  console.log(
    `Source Tx:               ${finalTarget._count.sourceTransactions}`,
  );

  if (
    deletedLegacy ||
    legacyWardCount !== 0 ||
    legacyFarmerCount !== 0 ||
    legacyFarmCount !== 0
  ) {
    throw new Error("FINAL VALIDATION FAILED.");
  }

  if (
    finalTarget._count.wards !== 5 ||
    finalTarget._count.farmers !== 1 ||
    finalTarget._count.farms !== 1
  ) {
    throw new Error(
      `FINAL TARGET COUNTS ARE UNEXPECTED: ${JSON.stringify(
        finalTarget._count,
      )}`,
    );
  }

  console.log("");
  console.log("======================================================");
  console.log("CONSOLIDATION COMPLETED SUCCESSFULLY");
  console.log("======================================================");
  console.log("");
  console.log("467 Kajiado North Sub County → 1478 Kajiado North");
  console.log("");
  console.log("Moved:");
  console.log("  5 Wards");
  console.log("  1 Farmer");
  console.log("  1 Farm");
  console.log("");
  console.log("Deleted:");
  console.log("  Legacy SubCounty 467");
  console.log("");
  console.log("Final target:");
  console.log("  SubCounty 1478 Kajiado North");
  console.log("  5 Wards");
  console.log("  1 Farmer");
  console.log("  1 Farm");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("======================================================");
    console.error("CONSOLIDATION FAILED");
    console.error("======================================================");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });