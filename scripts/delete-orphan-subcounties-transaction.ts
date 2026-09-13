
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

/**
 * ============================================================
 * TRANSACTIONAL SUBCOUNTY CLEANUP
 * ============================================================
 *
 * PURPOSE:
 *   Delete:
 *     1. 101 authoritative-confirmed orphan/legacy SubCounties
 *     2. SubCounty 1016, confirmed duplicate of 345
 *
 * SAFETY:
 *   - Runs inside ONE database transaction.
 *   - Re-checks dependencies INSIDE the transaction immediately
 *     before deletion.
 *   - If ANY dependency is discovered, the transaction aborts.
 *   - No partial deletion is allowed.
 *
 * EXPECTED RESULT:
 *   Counties    : 47
 *   SubCounties : 302
 *   Wards       : 1450
 *
 * IMPORTANT:
 *   This script does NOT modify wards, farmers, farms,
 *   business partners, or commodity transactions.
 *
 * ============================================================
 */

/**
 * 101 SubCounties that passed:
 *
 *   - Global audit
 *   - Authoritative GeoJSON validation
 *   - Final dependency verification
 *
 * These are the SAFE_DELETE_CANDIDATE records.
 */
const ORPHAN_SUBCOUNTY_IDS = [
  657,
  845,
  847,
  848,
  849,
  851,
  852,

  817,
  818,
  819,
  820,
  823,

  799,
  800,
  801,
  802,
  806,

  789,
  790,
  791,
  1157,

  576,
  577,
  578,

  582,

  592,
  594,

  828,

  602,
  604,
  966,

  607,
  608,
  609,
  610,
  613,

  617,
  618,
  624,
  625,

  629,
  630,

  675,
  676,
  678,
  679,
  680,

  638,
  639,
  640,
  643,
  644,
  645,
  646,
  647,
  648,
  649,
  650,
  652,
  653,
  654,
  655,

  722,

  567,
  570,

  692,
  693,
  694,
  697,

  877,
  878,
  885,

  730,
  731,

  708,
  713,
  714,

  834,

  566,

  861,
  862,
  863,
  864,
  865,
  866,
  867,
  868,
  869,
  870,
  871,

  746,
  748,
  749,

  633,
  634,
  635,

  759,
  763,

  781,
  786,

  876,
];

/**
 * Confirmed duplicate:
 *
 * 1016 Mwingi Central
 *     ↓ duplicate of
 *  345 Mwingi Central Sub- County
 *
 * 345 contains all 6 authoritative wards.
 * 1016 contains zero dependencies.
 */
const DUPLICATE_SUBCOUNTY_ID = 1016;
const CANONICAL_MWINGI_ID = 345;

type DependencyCounts = {
  wards: number;
  farmers: number;
  farms: number;
  businessPartners: number;
  sourceTransactions: number;
  destinationTransactions: number;
};

function hasDependencies(
  counts: DependencyCounts
): boolean {
  return (
    counts.wards > 0 ||
    counts.farmers > 0 ||
    counts.farms > 0 ||
    counts.businessPartners > 0 ||
    counts.sourceTransactions > 0 ||
    counts.destinationTransactions > 0
  );
}

function dependencyDescription(
  counts: DependencyCounts
): string {
  return (
    `wards=${counts.wards}, ` +
    `farmers=${counts.farmers}, ` +
    `farms=${counts.farms}, ` +
    `partners=${counts.businessPartners}, ` +
    `source=${counts.sourceTransactions}, ` +
    `destination=${counts.destinationTransactions}`
  );
}

async function getDependencyCounts(
  tx: PrismaClient,
  id: number
): Promise<DependencyCounts> {
  const result = await tx.subCounty.findUnique({
    where: {
      id,
    },

    select: {
      _count: {
        select: {
          wards: true,
          farmers: true,
          farms: true,
          businessPartners: true,
          sourceTransactions: true,
          destinationTransactions: true,
        },
      },
    },
  });

  if (!result) {
    throw new Error(
      `SubCounty ${id} does not exist.`
    );
  }

  return {
    wards: result._count.wards,
    farmers: result._count.farmers,
    farms: result._count.farms,
    businessPartners:
      result._count.businessPartners,
    sourceTransactions:
      result._count.sourceTransactions,
    destinationTransactions:
      result._count.destinationTransactions,
  };
}

async function main() {
  console.log("");
  console.log("====================================================");
  console.log("TRANSACTIONAL SUBCOUNTY CLEANUP");
  console.log("====================================================");
  console.log("");
  console.log("WARNING: THIS SCRIPT MODIFIES THE DATABASE.");
  console.log("");
  console.log(
    `Confirmed orphan candidates : ${ORPHAN_SUBCOUNTY_IDS.length}`
  );
  console.log(
    `Confirmed duplicate          : ${DUPLICATE_SUBCOUNTY_ID}`
  );
  console.log(
    `Total records to delete      : ${
      ORPHAN_SUBCOUNTY_IDS.length + 1
    }`
  );
  console.log("");

  if (ORPHAN_SUBCOUNTY_IDS.length !== 101) {
    throw new Error(
      `Safety check failed: expected 101 orphan IDs, found ${ORPHAN_SUBCOUNTY_IDS.length}.`
    );
  }

  if (
    ORPHAN_SUBCOUNTY_IDS.includes(
      DUPLICATE_SUBCOUNTY_ID
    )
  ) {
    throw new Error(
      "Safety check failed: duplicate ID 1016 is present in orphan list."
    );
  }

  if (
    ORPHAN_SUBCOUNTY_IDS.includes(
      CANONICAL_MWINGI_ID
    )
  ) {
    throw new Error(
      "Safety check failed: canonical Mwingi ID 345 is present in orphan list."
    );
  }

  console.log(
    "Pre-transaction ID safety checks: PASS"
  );
  console.log("");

  const result = await prisma.$transaction(
    async (tx) => {
      console.log(
        "----------------------------------------------------"
      );
      console.log(
        "TRANSACTION STARTED"
      );
      console.log(
        "----------------------------------------------------"
      );
      console.log("");

      /**
       * --------------------------------------------------------
       * STEP 1
       * Verify all 101 orphan records still exist.
       * --------------------------------------------------------
       */
      const orphanRecords =
        await tx.subCounty.findMany({
          where: {
            id: {
              in: ORPHAN_SUBCOUNTY_IDS,
            },
          },

          select: {
            id: true,
            name: true,
            countyId: true,
            county: {
              select: {
                name: true,
              },
            },
          },

          orderBy: {
            id: "asc",
          },
        });

      if (
        orphanRecords.length !==
        ORPHAN_SUBCOUNTY_IDS.length
      ) {
        const foundIds = new Set(
          orphanRecords.map(
            (record) => record.id
          )
        );

        const missingIds =
          ORPHAN_SUBCOUNTY_IDS.filter(
            (id) => !foundIds.has(id)
          );

        throw new Error(
          `Safety abort: expected 101 orphan records, ` +
            `but found ${orphanRecords.length}. ` +
            `Missing IDs: ${missingIds.join(", ")}`
        );
      }

      console.log(
        `Verified orphan records exist : ${orphanRecords.length}/101`
      );

      /**
       * --------------------------------------------------------
       * STEP 2
       * Verify canonical Mwingi 345 exists.
       * --------------------------------------------------------
       */
      const canonicalMwingi =
        await tx.subCounty.findUnique({
          where: {
            id: CANONICAL_MWINGI_ID,
          },

          select: {
            id: true,
            name: true,
            countyId: true,
            county: {
              select: {
                name: true,
              },
            },
          },
        });

      if (!canonicalMwingi) {
        throw new Error(
          "Safety abort: canonical Mwingi SubCounty 345 does not exist."
        );
      }

      console.log(
        `Canonical Mwingi verified      : ${canonicalMwingi.id} ${canonicalMwingi.name}`
      );

      /**
       * --------------------------------------------------------
       * STEP 3
       * Verify duplicate 1016 exists.
       * --------------------------------------------------------
       */
      const duplicateMwingi =
        await tx.subCounty.findUnique({
          where: {
            id: DUPLICATE_SUBCOUNTY_ID,
          },

          select: {
            id: true,
            name: true,
            countyId: true,
            county: {
              select: {
                name: true,
              },
            },
          },
        });

      if (!duplicateMwingi) {
        throw new Error(
          "Safety abort: duplicate Mwingi SubCounty 1016 does not exist."
        );
      }

      console.log(
        `Duplicate Mwingi verified       : ${duplicateMwingi.id} ${duplicateMwingi.name}`
      );

      /**
       * --------------------------------------------------------
       * STEP 4
       * Confirm 1016 and 345 are in the same county.
       * --------------------------------------------------------
       */
      if (
        duplicateMwingi.countyId !==
        canonicalMwingi.countyId
      ) {
        throw new Error(
          `Safety abort: Mwingi duplicate 1016 countyId ` +
            `${duplicateMwingi.countyId} does not match canonical 345 countyId ` +
            `${canonicalMwingi.countyId}.`
        );
      }

      console.log(
        "Mwingi county relationship      : PASS"
      );

      /**
       * --------------------------------------------------------
       * STEP 5
       * FINAL DEPENDENCY CHECK
       *
       * This happens INSIDE the transaction.
       *
       * If ANY record has ANY dependency,
       * the transaction throws and EVERYTHING rolls back.
       * --------------------------------------------------------
       */
      console.log("");
      console.log(
        "Running final in-transaction dependency verification..."
      );
      console.log("");

      const allIdsToDelete = [
        ...ORPHAN_SUBCOUNTY_IDS,
        DUPLICATE_SUBCOUNTY_ID,
      ];

      const dependencyFailures: Array<{
        id: number;
        counts: DependencyCounts;
      }> = [];

      for (const id of allIdsToDelete) {
        const counts =
          await getDependencyCounts(tx, id);

        if (hasDependencies(counts)) {
          dependencyFailures.push({
            id,
            counts,
          });
        }
      }

      if (dependencyFailures.length > 0) {
        console.log("");
        console.log(
          "DEPENDENCY FAILURES DETECTED:"
        );

        for (const failure of dependencyFailures) {
          console.log(
            `  ${failure.id}: ${dependencyDescription(
              failure.counts
            )}`
          );
        }

        throw new Error(
          `SAFETY ABORT: ${dependencyFailures.length} record(s) have dependencies. ` +
            "NO RECORDS WILL BE DELETED."
        );
      }

      console.log(
        `Dependency verification: PASS (${allIdsToDelete.length}/${allIdsToDelete.length})`
      );

      /**
       * --------------------------------------------------------
       * STEP 6
       * Confirm canonical Mwingi 345 contains wards.
       *
       * This protects against accidentally treating 345 as
       * the duplicate.
       * --------------------------------------------------------
       */
      const canonicalCounts =
        await getDependencyCounts(
          tx,
          CANONICAL_MWINGI_ID
        );

      if (canonicalCounts.wards !== 6) {
        throw new Error(
          `Safety abort: canonical Mwingi 345 expected 6 wards, ` +
            `found ${canonicalCounts.wards}.`
        );
      }

      console.log(
        "Canonical Mwingi ward count      : 6 PASS"
      );

      /**
       * --------------------------------------------------------
       * STEP 7
       * Delete the 101 confirmed orphan records.
       * --------------------------------------------------------
       */
      console.log("");
      console.log(
        "Deleting 101 confirmed orphan SubCounties..."
      );

      const orphanDeleteResult =
        await tx.subCounty.deleteMany({
          where: {
            id: {
              in: ORPHAN_SUBCOUNTY_IDS,
            },
          },
        });

      if (
        orphanDeleteResult.count !== 101
      ) {
        throw new Error(
          `Safety abort: expected to delete 101 orphan records, ` +
            `but deleteMany reported ${orphanDeleteResult.count}.`
        );
      }

      console.log(
        `Deleted orphan SubCounties       : ${orphanDeleteResult.count}`
      );

      /**
       * --------------------------------------------------------
       * STEP 8
       * Delete duplicate Mwingi 1016.
       *
       * Dependency check already passed immediately before
       * deletion.
       * --------------------------------------------------------
       */
      console.log(
        "Deleting duplicate Mwingi 1016..."
      );

      const duplicateDeleteResult =
        await tx.subCounty.deleteMany({
          where: {
            id: DUPLICATE_SUBCOUNTY_ID,
          },
        });

      if (
        duplicateDeleteResult.count !== 1
      ) {
        throw new Error(
          `Safety abort: expected to delete duplicate 1016, ` +
            `but deleteMany reported ${duplicateDeleteResult.count}.`
        );
      }

      console.log(
        "Deleted duplicate SubCounty      : 1016"
      );

      /**
       * --------------------------------------------------------
       * STEP 9
       * Verify deleted records are gone INSIDE transaction.
       * --------------------------------------------------------
       */
      const remainingDeletedTargets =
        await tx.subCounty.count({
          where: {
            id: {
              in: allIdsToDelete,
            },
          },
        });

      if (
        remainingDeletedTargets !== 0
      ) {
        throw new Error(
          `Safety abort: ${remainingDeletedTargets} target record(s) ` +
            "still exist after deletion."
        );
      }

      console.log(
        "Deletion verification            : PASS"
      );

      /**
       * --------------------------------------------------------
       * STEP 10
       * Verify canonical Mwingi 345 still exists INSIDE
       * transaction.
       * --------------------------------------------------------
       */
      const canonicalStillExists =
        await tx.subCounty.count({
          where: {
            id: CANONICAL_MWINGI_ID,
          },
        });

      if (
        canonicalStillExists !== 1
      ) {
        throw new Error(
          "Safety abort: canonical Mwingi 345 was unexpectedly removed."
        );
      }

      console.log(
        "Canonical Mwingi preserved       : PASS"
      );

      /**
       * --------------------------------------------------------
       * STEP 11
       * Check transaction-local SubCounty count.
       * --------------------------------------------------------
       *
       * Current expected count:
       *
       * 404 - 101 - 1 = 302
       */
      const subCountyCount =
        await tx.subCounty.count();

      if (subCountyCount !== 302) {
        throw new Error(
          `Safety abort: expected 302 SubCounties inside transaction, ` +
            `found ${subCountyCount}.`
        );
      }

      console.log(
        "Transaction SubCounty count      : 302 PASS"
      );

      console.log("");
      console.log(
        "All transactional safety checks passed."
      );
      console.log(
        "Transaction is ready to COMMIT."
      );
      console.log("");

      return {
        orphanDeleted:
          orphanDeleteResult.count,
        duplicateDeleted:
          duplicateDeleteResult.count,
        totalDeleted:
          orphanDeleteResult.count +
          duplicateDeleteResult.count,
        finalSubCountyCount:
          subCountyCount,
      };
    }
  );

  console.log(
    "===================================================="
  );
  console.log(
    "TRANSACTION COMMITTED SUCCESSFULLY"
  );
  console.log(
    "===================================================="
  );
  console.log("");

  console.log(
    `Orphan SubCounties deleted : ${result.orphanDeleted}`
  );

  console.log(
    `Duplicate SubCounty deleted: ${result.duplicateDeleted}`
  );

  console.log(
    `TOTAL DELETED              : ${result.totalDeleted}`
  );

  console.log(
    `SubCounties remaining      : ${result.finalSubCountyCount}`
  );

  console.log("");

  console.log(
    "Expected final counts:"
  );

  console.log(
    "  Counties    : 47"
  );

  console.log(
    "  SubCounties : 302"
  );

  console.log(
    "  Wards       : 1450"
  );

  console.log("");

  console.log(
    "IMPORTANT:"
  );

  console.log(
    "No wards, farmers, farms, business partners,"
  );

  console.log(
    "or commodity transactions were intentionally deleted."
  );

  console.log("");
  console.log(
    "Next step: run the global audit to verify the"
  );
  console.log(
    "entire location hierarchy after cleanup."
  );
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "===================================================="
    );
    console.error(
      "TRANSACTION ABORTED"
    );
    console.error(
      "===================================================="
    );
    console.error("");

    console.error(
      "NO PARTIAL CLEANUP SHOULD HAVE BEEN COMMITTED."
    );

    console.error("");

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

