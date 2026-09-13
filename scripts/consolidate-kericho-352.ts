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

async function main() {
  const sourceId = 352;
  const targetId = 1482;

  const expectedGids = [957, 958, 959, 960];

  console.log("");
  console.log("============================================================");
  console.log("KERICHO BELGUT SUBCOUNTY CONSOLIDATION");
  console.log("352 → 1482");
  console.log("============================================================");
  console.log("READ + WRITE — DATABASE CHANGES WILL BE MADE");
  console.log("");

  await prisma.$transaction(
    async (tx) => {
      console.log("PRE-FLIGHT VALIDATION");
      console.log("------------------------------------------------------------");

      const source = await tx.subCounty.findUnique({
        where: {
          id: sourceId,
        },
        include: {
          county: true,
          wards: {
            orderBy: {
              sourceGid: "asc",
            },
          },
        },
      });

      const target = await tx.subCounty.findUnique({
        where: {
          id: targetId,
        },
        include: {
          county: true,
          wards: {
            orderBy: {
              sourceGid: "asc",
            },
          },
        },
      });

      if (!source) {
        throw new Error(
          `Source SubCounty ${sourceId} does not exist.`,
        );
      }

      if (!target) {
        throw new Error(
          `Target SubCounty ${targetId} does not exist.`,
        );
      }

      console.log(
        `Source: ${source.id} ${source.name}`,
      );

      console.log(
        `Target: ${target.id} ${target.name}`,
      );

      console.log(
        `Source county: ${source.county.name} (${source.countyId})`,
      );

      console.log(
        `Target county: ${target.county.name} (${target.countyId})`,
      );

      if (source.countyId !== target.countyId) {
        throw new Error(
          "SAFETY FAILURE: Source and target counties differ.",
        );
      }

      if (target.wards.length !== 0) {
        throw new Error(
          `SAFETY FAILURE: Target ${targetId} already has ${target.wards.length} wards.`,
        );
      }

      if (source.wards.length !== expectedGids.length) {
        throw new Error(
          `SAFETY FAILURE: Expected ${expectedGids.length} source wards but found ${source.wards.length}.`,
        );
      }

      const actualGids = source.wards
        .map((ward) => ward.sourceGid)
        .filter(
          (gid): gid is number =>
            gid !== null,
        )
        .sort((a, b) => a - b);

      const sortedExpectedGids = [...expectedGids].sort(
        (a, b) => a - b,
      );

      if (
        actualGids.length !== sortedExpectedGids.length ||
        actualGids.some(
          (gid, index) =>
            gid !== sortedExpectedGids[index],
        )
      ) {
        throw new Error(
          `SAFETY FAILURE: Source ward GIDs do not match expected GIDs. ` +
            `Expected=${sortedExpectedGids.join(",")} ` +
            `Actual=${actualGids.join(",")}`,
        );
      }

      const farmers = await tx.farmer.count({
        where: {
          subCountyId: sourceId,
        },
      });

      const farms = await tx.farm.count({
        where: {
          subCountyId: sourceId,
        },
      });

      const businessPartners =
        await tx.businessPartner.count({
          where: {
            subCountyId: sourceId,
          },
        });

      const destinationTransactions =
        await tx.commodityTransaction.count({
          where: {
            destinationSubCountyId: sourceId,
          },
        });

      const sourceTransactions =
        await tx.commodityTransaction.count({
          where: {
            sourceSubCountyId: sourceId,
          },
        });

      console.log("");
      console.log("SOURCE RELATIONS");
      console.log("------------------------------------------------------------");
      console.log(`Farmers:              ${farmers}`);
      console.log(`Farms:                ${farms}`);
      console.log(
        `Business Partners:    ${businessPartners}`,
      );
      console.log(
        `Destination Tx:       ${destinationTransactions}`,
      );
      console.log(
        `Source Tx:            ${sourceTransactions}`,
      );

      if (
        farmers !== 0 ||
        farms !== 0 ||
        businessPartners !== 0 ||
        destinationTransactions !== 0 ||
        sourceTransactions !== 0
      ) {
        throw new Error(
          "SAFETY FAILURE: Source SubCounty has direct relations.",
        );
      }

      console.log("");
      console.log("VERIFIED WARDS TO MOVE");
      console.log("------------------------------------------------------------");

      for (const ward of source.wards) {
        console.log(
          `${ward.id}: ${ward.name} | ` +
            `gid=${ward.sourceGid} | ` +
            `uid=${ward.sourceUid ?? ""} | ` +
            `constituency=${ward.constituencyId}`,
        );
      }

      console.log("");
      console.log("PRE-FLIGHT PASSED");
      console.log("");
      console.log(
        `Moving ${source.wards.length} wards from ${sourceId} → ${targetId}...`,
      );

      /*
       * Move ONLY the verified wards.
       *
       * No Ward IDs are changed.
       * No sourceGid/sourceUid values are changed.
       * No constituency IDs are changed.
       */
      const updateResult = await tx.ward.updateMany({
        where: {
          subCountyId: sourceId,
          sourceGid: {
            in: expectedGids,
          },
        },
        data: {
          subCountyId: targetId,
        },
      });

      console.log(
        `Wards moved: ${updateResult.count}`,
      );

      if (updateResult.count !== expectedGids.length) {
        throw new Error(
          `SAFETY FAILURE: Expected to move ${expectedGids.length} wards but moved ${updateResult.count}.`,
        );
      }

      /*
       * Confirm source has absolutely no remaining
       * direct relations before deleting it.
       */
      const remainingWards =
        await tx.ward.count({
          where: {
            subCountyId: sourceId,
          },
        });

      const remainingFarmers =
        await tx.farmer.count({
          where: {
            subCountyId: sourceId,
          },
        });

      const remainingFarms =
        await tx.farm.count({
          where: {
            subCountyId: sourceId,
          },
        });

      const remainingBusinessPartners =
        await tx.businessPartner.count({
          where: {
            subCountyId: sourceId,
          },
        });

      const remainingDestinationTransactions =
        await tx.commodityTransaction.count({
          where: {
            destinationSubCountyId: sourceId,
          },
        });

      const remainingSourceTransactions =
        await tx.commodityTransaction.count({
          where: {
            sourceSubCountyId: sourceId,
          },
        });

      console.log("");
      console.log("POST-MOVE SOURCE VALIDATION");
      console.log("------------------------------------------------------------");

      console.log(
        `Remaining wards:              ${remainingWards}`,
      );

      console.log(
        `Remaining farmers:            ${remainingFarmers}`,
      );

      console.log(
        `Remaining farms:              ${remainingFarms}`,
      );

      console.log(
        `Remaining business partners:  ${remainingBusinessPartners}`,
      );

      console.log(
        `Remaining destination Tx:     ${remainingDestinationTransactions}`,
      );

      console.log(
        `Remaining source Tx:          ${remainingSourceTransactions}`,
      );

      if (
        remainingWards !== 0 ||
        remainingFarmers !== 0 ||
        remainingFarms !== 0 ||
        remainingBusinessPartners !== 0 ||
        remainingDestinationTransactions !== 0 ||
        remainingSourceTransactions !== 0
      ) {
        throw new Error(
          "SAFETY FAILURE: Source SubCounty still has relations. DELETE ABORTED.",
        );
      }

      /*
       * Delete ONLY the legacy SubCounty 352.
       */
      await tx.subCounty.delete({
        where: {
          id: sourceId,
        },
      });

      console.log("");
      console.log(
        `Deleted legacy SubCounty ${sourceId} ${source.name}`,
      );

      /*
       * Final validation inside the transaction.
       */
      const sourceAfterDelete =
        await tx.subCounty.findUnique({
          where: {
            id: sourceId,
          },
        });

      const targetAfter =
        await tx.subCounty.findUnique({
          where: {
            id: targetId,
          },
          include: {
            wards: {
              orderBy: {
                sourceGid: "asc",
              },
            },
          },
        });

      if (sourceAfterDelete) {
        throw new Error(
          "FINAL VALIDATION FAILURE: Source SubCounty still exists.",
        );
      }

      if (!targetAfter) {
        throw new Error(
          "FINAL VALIDATION FAILURE: Target SubCounty disappeared.",
        );
      }

      if (
        targetAfter.wards.length !== expectedGids.length
      ) {
        throw new Error(
          `FINAL VALIDATION FAILURE: Target should have ${expectedGids.length} wards but has ${targetAfter.wards.length}.`,
        );
      }

      const targetGids = targetAfter.wards
        .map((ward) => ward.sourceGid)
        .filter(
          (gid): gid is number =>
            gid !== null,
        )
        .sort((a, b) => a - b);

      if (
        targetGids.length !== sortedExpectedGids.length ||
        targetGids.some(
          (gid, index) =>
            gid !== sortedExpectedGids[index],
        )
      ) {
        throw new Error(
          `FINAL VALIDATION FAILURE: Target GIDs are incorrect. ` +
            `Expected=${sortedExpectedGids.join(",")} ` +
            `Actual=${targetGids.join(",")}`,
        );
      }

      console.log("");
      console.log("FINAL VALIDATION");
      console.log("------------------------------------------------------------");

      console.log(
        `Legacy SubCounty ${sourceId} exists: NO`,
      );

      console.log(
        `Target SubCounty:               ${targetAfter.id} ${targetAfter.name}`,
      );

      console.log(
        `Target wards:                    ${targetAfter.wards.length}`,
      );

      console.log(
        `Target source GIDs:              ${targetGids.join(", ")}`,
      );

      console.log("");
      console.log(
        "CONSOLIDATION COMPLETED SUCCESSFULLY",
      );
    },
    {
      maxWait: 30000,
      timeout: 30000,
    },
  );

  /*
   * Global final check after transaction commits.
   */
  const finalWardCount =
    await prisma.ward.count();

  const finalSubCountyCount =
    await prisma.subCounty.count();

  const target = await prisma.subCounty.findUnique({
    where: {
      id: targetId,
    },
    include: {
      wards: {
        orderBy: {
          sourceGid: "asc",
        },
      },
    },
  });

  const deletedSource =
    await prisma.subCounty.findUnique({
      where: {
        id: sourceId,
      },
    });

  console.log("");
  console.log("============================================================");
  console.log("GLOBAL POST-CONSOLIDATION CHECK");
  console.log("============================================================");

  console.log(
    `Database SubCounties: ${finalSubCountyCount}`,
  );

  console.log(
    `Database Wards:       ${finalWardCount}`,
  );

  console.log(
    `Source 352 exists:    ${deletedSource ? "YES — ERROR" : "NO"}`,
  );

  console.log(
    `Target 1482 wards:    ${target?.wards.length ?? 0}`,
  );

  if (finalWardCount !== 1450) {
    throw new Error(
      `GLOBAL VALIDATION FAILURE: Expected 1450 wards but found ${finalWardCount}.`,
    );
  }

  if (deletedSource) {
    throw new Error(
      "GLOBAL VALIDATION FAILURE: Legacy SubCounty 352 still exists.",
    );
  }

  if (!target || target.wards.length !== 4) {
    throw new Error(
      "GLOBAL VALIDATION FAILURE: Target 1482 does not contain exactly 4 wards.",
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("FINAL RESULT: PASS");
  console.log("============================================================");
  console.log("");
  console.log(
    "352 Belgut Sub County was successfully consolidated into 1482 Belgut.",
  );
  console.log("");
  console.log("Moved wards: 4");
  console.log("Deleted SubCounty: 352");
  console.log("Final ward count: 1450");
  console.log("Target wards: 4");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("============================================================");
    console.error("CONSOLIDATION FAILED");
    console.error("============================================================");
    console.error("");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });