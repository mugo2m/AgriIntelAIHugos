import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

type MigrationPair = {
  countyName: string;
  identityName: string;
  oldSubCountyId: number;
  oldSubCountyName: string;
  targetSubCountyId: number;
  targetSubCountyName: string;
  expectedWardCount: number;
  expectedWardGids: number[];
};

type WardSnapshot = {
  id: number;
  name: string;
  sourceGid: number | null;
  countyId: number;
  subCountyId: number | null;
};

type MigrationResult = {
  countyName: string;
  identityName: string;

  oldSubCountyId: number;
  oldSubCountyName: string;

  targetSubCountyId: number;
  targetSubCountyName: string;

  expectedWardCount: number;
  updatedWardCount: number;
  deletedSubCountyCount: number;

  expectedWardGids: number[];
  verifiedWardGids: number[];

  farmersBefore: number;
  farmsBefore: number;
  businessPartnersBefore: number;
  commoditySourceBefore: number;
  commodityDestinationBefore: number;

  oldWardCountBefore: number;
  targetWardCountBefore: number;

  oldWardCountAfter: number;
  targetWardCountAfter: number;

  oldSubCountyExistsAfter: boolean;
  targetSubCountyExistsAfter: boolean;

  status: "PASS";
};

type MigrationLog = {
  audit: string;
  version: string;
  mode: "TRANSACTIONAL_WRITE";
  generatedAt: string;

  safetyBasis: {
    sourceAudit: string;
    sourceStatus: "PASS";
    safePairs: number;
  };

  pairs: MigrationPair[];

  results: MigrationResult[];

  totals: {
    pairsProcessed: number;
    wardsMoved: number;
    subCountiesDeleted: number;
    farmersChanged: number;
    farmsChanged: number;
    businessPartnersChanged: number;
    commodityTransactionsChanged: number;
  };

  finalStatus: "PASS";
};

const PAIRS: MigrationPair[] = [
  {
    countyName: "Nyeri",
    identityName: "Mukurwe-ini",

    oldSubCountyId: 376,
    oldSubCountyName: "Mukurweini Sub County",

    targetSubCountyId: 1382,
    targetSubCountyName: "Mukurwe-ini",

    expectedWardCount: 4,

    expectedWardGids: [
      487,
      488,
      489,
      490,
    ],
  },

  {
    countyName: "Narok",
    identityName: "Trans Mara West",

    oldSubCountyId: 411,
    oldSubCountyName: "Transmara West Sub County",

    targetSubCountyId: 1475,
    targetSubCountyName: "Trans Mara West",

    expectedWardCount: 6,

    expectedWardGids: [
      2158,
      2159,
      2160,
      2161,
      2162,
      2163,
    ],
  },

  {
    countyName: "Narok",
    identityName: "Trans Mara East",

    oldSubCountyId: 515,
    oldSubCountyName: "Transmara East Sub County",

    targetSubCountyId: 1474,
    targetSubCountyName: "Trans Mara East",

    expectedWardCount: 4,

    expectedWardGids: [
      2164,
      2165,
      2166,
      2167,
    ],
  },
];

function ensureDirectory(directory: string) {
  fs.mkdirSync(directory, {
    recursive: true,
  });
}

function assertEqual(
  actual: unknown,
  expected: unknown,
  message: string,
) {
  if (actual !== expected) {
    throw new Error(
      `${message}. Expected=${String(expected)}, Actual=${String(actual)}`,
    );
  }
}

function assertTrue(
  condition: boolean,
  message: string,
) {
  if (!condition) {
    throw new Error(message);
  }
}

function sortedNumbers(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

function arraysEqual(
  a: number[],
  b: number[],
): boolean {
  const aa = sortedNumbers(a);
  const bb = sortedNumbers(b);

  if (aa.length !== bb.length) {
    return false;
  }

  return aa.every(
    (value, index) => value === bb[index],
  );
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("V15.6 CONTROLLED SUBCOUNTY CONSOLIDATION");
  console.log("MODE: TRANSACTIONAL WRITE");
  console.log("SOURCE AUDIT: V15.5 PASS");
  console.log("============================================================");
  console.log("");

  const outputDirectory = path.resolve(
    "prisma/data",
  );

  const outputJsonPath = path.resolve(
    "prisma/data/consolidation-migration-v15-6.json",
  );

  ensureDirectory(outputDirectory);

  const results: MigrationResult[] = [];

  let totalWardsMoved = 0;
  let totalSubCountiesDeleted = 0;

  try {
    /*
     * ----------------------------------------------------------
     * 1. SOURCE SAFETY GATE
     * ----------------------------------------------------------
     */

    console.log("[1/9] Confirming V15.5 safety basis...");

    const v15_5Path = path.resolve(
      "prisma/data/final-database-integrity-audit-v15-5.json",
    );

    assertTrue(
      fs.existsSync(v15_5Path),
      `V15.5 audit not found: ${v15_5Path}`,
    );

    const v15_5 = JSON.parse(
      fs.readFileSync(v15_5Path, "utf8"),
    ) as {
      version?: string;
      finalStatus?: string;
      totals?: {
        duplicatePairs?: number;
        safeToConsolidate?: number;
        review?: number;
        doNotTouch?: number;
      };
    };

    assertEqual(
      v15_5.version,
      "V15.5",
      "V15.5 audit version mismatch",
    );

    assertEqual(
      v15_5.finalStatus,
      "PASS",
      "V15.5 final status is not PASS",
    );

    assertEqual(
      v15_5.totals?.duplicatePairs,
      3,
      "V15.5 duplicate-pair count mismatch",
    );

    assertEqual(
      v15_5.totals?.safeToConsolidate,
      3,
      "V15.5 safe-to-consolidate count mismatch",
    );

    assertEqual(
      v15_5.totals?.review,
      0,
      "V15.5 contains review-required pairs",
    );

    assertEqual(
      v15_5.totals?.doNotTouch,
      0,
      "V15.5 contains DO_NOT_TOUCH pairs",
    );

    console.log("  V15.5 status: PASS");
    console.log("  Safe pairs: 3");
    console.log("  Review pairs: 0");
    console.log("  DO_NOT_TOUCH pairs: 0");

    /*
     * ----------------------------------------------------------
     * 2. PRE-TRANSACTION DATABASE BASELINE
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[2/9] Loading database baseline...");

    const [
      countyCount,
      subCountyCount,
      wardCount,
      farmerCount,
      farmCount,
      businessPartnerCount,
      commodityTransactionCount,
    ] = await Promise.all([
      prisma.county.count(),
      prisma.subCounty.count(),
      prisma.ward.count(),
      prisma.farmer.count(),
      prisma.farm.count(),
      prisma.businessPartner.count(),
      prisma.commodityTransaction.count(),
    ]);

    console.log(`  Counties: ${countyCount}`);
    console.log(`  SubCounties: ${subCountyCount}`);
    console.log(`  Wards: ${wardCount}`);
    console.log(`  Farmers: ${farmerCount}`);
    console.log(`  Farms: ${farmCount}`);
    console.log(
      `  BusinessPartners: ${businessPartnerCount}`,
    );
    console.log(
      `  CommodityTransactions: ${commodityTransactionCount}`,
    );

    assertEqual(
      countyCount,
      47,
      "Unexpected county count before migration",
    );

    assertEqual(
      subCountyCount,
      417,
      "Unexpected SubCounty count before migration",
    );

    assertEqual(
      wardCount,
      1450,
      "Unexpected Ward count before migration",
    );

    /*
     * ----------------------------------------------------------
     * 3. TRANSACTION
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[3/9] Starting transaction...");
    console.log(
      "  No changes are committed unless every verification passes.",
    );

    await prisma.$transaction(
      async (tx) => {
        /*
         * ------------------------------------------------------
         * 3A. PREFLIGHT ALL PAIRS
         * ------------------------------------------------------
         */

        console.log("");
        console.log("  [3A] Running transaction preflight...");

        for (const pair of PAIRS) {
          console.log("");
          console.log(
            `  ${pair.countyName} / ${pair.identityName}`,
          );

          const oldSubCounty =
            await tx.subCounty.findUnique({
              where: {
                id: pair.oldSubCountyId,
              },
              select: {
                id: true,
                name: true,
                countyId: true,
              },
            });

          const targetSubCounty =
            await tx.subCounty.findUnique({
              where: {
                id: pair.targetSubCountyId,
              },
              select: {
                id: true,
                name: true,
                countyId: true,
              },
            });

          assertTrue(
            oldSubCounty !== null,
            `Old SubCounty ${pair.oldSubCountyId} does not exist`,
          );

          assertTrue(
            targetSubCounty !== null,
            `Target SubCounty ${pair.targetSubCountyId} does not exist`,
          );

          console.log(
            `    Old: ${oldSubCounty!.id} | ${oldSubCounty!.name} | countyId=${oldSubCounty!.countyId}`,
          );

          console.log(
            `    Target: ${targetSubCounty!.id} | ${targetSubCounty!.name} | countyId=${targetSubCounty!.countyId}`,
          );

          assertEqual(
            oldSubCounty!.name,
            pair.oldSubCountyName,
            `Unexpected old SubCounty name for ID ${pair.oldSubCountyId}`,
          );

          assertEqual(
            targetSubCounty!.name,
            pair.targetSubCountyName,
            `Unexpected target SubCounty name for ID ${pair.targetSubCountyId}`,
          );

          assertEqual(
            oldSubCounty!.countyId,
            targetSubCounty!.countyId,
            `Old and target SubCounties have different counties for pair ${pair.identityName}`,
          );

          /*
           * Old record must contain exactly the expected wards.
           */

          const oldWards =
            await tx.ward.findMany({
              where: {
                subCountyId:
                  pair.oldSubCountyId,
              },
              select: {
                id: true,
                name: true,
                sourceGid: true,
                countyId: true,
                subCountyId: true,
              },
              orderBy: {
                id: "asc",
              },
            });

          /*
           * Target must be completely empty of wards.
           */

          const targetWards =
            await tx.ward.findMany({
              where: {
                subCountyId:
                  pair.targetSubCountyId,
              },
              select: {
                id: true,
                name: true,
                sourceGid: true,
                countyId: true,
                subCountyId: true,
              },
            });

          assertEqual(
            oldWards.length,
            pair.expectedWardCount,
            `Unexpected old Ward count for ${pair.identityName}`,
          );

          assertEqual(
            targetWards.length,
            0,
            `Target SubCounty ${pair.targetSubCountyId} is not empty`,
          );

          const actualGids = oldWards
            .map((ward) => ward.sourceGid)
            .filter(
              (gid): gid is number =>
                gid !== null,
            );

          assertTrue(
            actualGids.length ===
              oldWards.length,
            `A Ward under ${pair.oldSubCountyId} has NULL sourceGid`,
          );

          assertTrue(
            arraysEqual(
              actualGids,
              pair.expectedWardGids,
            ),
            `Authoritative GID set mismatch for ${pair.identityName}`,
          );

          /*
           * Every Ward must belong to the same county.
           */

          for (const ward of oldWards) {
            assertEqual(
              ward.countyId,
              oldSubCounty!.countyId,
              `Ward ${ward.id} county mismatch`,
            );

            assertEqual(
              ward.subCountyId,
              pair.oldSubCountyId,
              `Ward ${ward.id} SubCounty mismatch`,
            );
          }

          /*
           * ----------------------------------------------------
           * APPLICATION DEPENDENCY GATE
           * ----------------------------------------------------
           */

          const [
            farmers,
            farms,
            businessPartners,
            commoditySource,
            commodityDestination,
          ] = await Promise.all([
            tx.farmer.count({
              where: {
                subCountyId:
                  pair.oldSubCountyId,
              },
            }),

            tx.farm.count({
              where: {
                subCountyId:
                  pair.oldSubCountyId,
              },
            }),

            tx.businessPartner.count({
              where: {
                subCountyId:
                  pair.oldSubCountyId,
              },
            }),

            tx.commodityTransaction.count({
              where: {
                sourceSubCountyId:
                  pair.oldSubCountyId,
              },
            }),

            tx.commodityTransaction.count({
              where: {
                destinationSubCountyId:
                  pair.oldSubCountyId,
              },
            }),
          ]);

          console.log(
            `    Old wards: ${oldWards.length}`,
          );

          console.log(
            `    Old Ward GIDs: ${actualGids.join(", ")}`,
          );

          console.log(
            `    Farmers: ${farmers}`,
          );

          console.log(
            `    Farms: ${farms}`,
          );

          console.log(
            `    BusinessPartners: ${businessPartners}`,
          );

          console.log(
            `    Commodity source refs: ${commoditySource}`,
          );

          console.log(
            `    Commodity destination refs: ${commodityDestination}`,
          );

          assertEqual(
            farmers,
            0,
            `Farmer dependencies exist on old SubCounty ${pair.oldSubCountyId}`,
          );

          assertEqual(
            farms,
            0,
            `Farm dependencies exist on old SubCounty ${pair.oldSubCountyId}`,
          );

          assertEqual(
            businessPartners,
            0,
            `BusinessPartner dependencies exist on old SubCounty ${pair.oldSubCountyId}`,
          );

          assertEqual(
            commoditySource,
            0,
            `Commodity source dependencies exist on old SubCounty ${pair.oldSubCountyId}`,
          );

          assertEqual(
            commodityDestination,
            0,
            `Commodity destination dependencies exist on old SubCounty ${pair.oldSubCountyId}`,
          );

          console.log(
            "    Preflight: PASS",
          );
        }

        /*
         * ------------------------------------------------------
         * 3B. IMMUTABLE SNAPSHOT
         * ------------------------------------------------------
         */

        console.log("");
        console.log(
          "  [3B] Creating immutable Ward snapshot...",
        );

        const snapshots =
          new Map<number, WardSnapshot[]>();

        for (const pair of PAIRS) {
          const wards =
            await tx.ward.findMany({
              where: {
                subCountyId:
                  pair.oldSubCountyId,
              },
              select: {
                id: true,
                name: true,
                sourceGid: true,
                countyId: true,
                subCountyId: true,
              },
              orderBy: {
                id: "asc",
              },
            });

          snapshots.set(
            pair.oldSubCountyId,
            wards,
          );

          console.log(
            `    ${pair.identityName}: snapshot=${wards.length}`,
          );
        }

        /*
         * ------------------------------------------------------
         * 3C. UPDATE ONLY Ward.subCountyId
         * ------------------------------------------------------
         */

        console.log("");
        console.log(
          "  [3C] Reassigning Ward.subCountyId...",
        );

        for (const pair of PAIRS) {
          const snapshot =
            snapshots.get(
              pair.oldSubCountyId,
            ) ?? [];

          const result =
            await tx.ward.updateMany({
              where: {
                subCountyId:
                  pair.oldSubCountyId,
              },
              data: {
                subCountyId:
                  pair.targetSubCountyId,
              },
            });

          console.log(
            `    ${pair.identityName}: UPDATE affected ${result.count} wards`,
          );

          assertEqual(
            result.count,
            snapshot.length,
            `Ward UPDATE count mismatch for ${pair.identityName}`,
          );

          assertEqual(
            result.count,
            pair.expectedWardCount,
            `Unexpected number of updated wards for ${pair.identityName}`,
          );

          totalWardsMoved += result.count;
        }

        /*
         * ------------------------------------------------------
         * 3D. VERIFY WARD REASSIGNMENT
         * ------------------------------------------------------
         */

        console.log("");
        console.log(
          "  [3D] Verifying Ward reassignment...",
        );

        for (const pair of PAIRS) {
          const snapshot =
            snapshots.get(
              pair.oldSubCountyId,
            ) ?? [];

          const oldRemaining =
            await tx.ward.count({
              where: {
                subCountyId:
                  pair.oldSubCountyId,
              },
            });

          const targetWards =
            await tx.ward.findMany({
              where: {
                subCountyId:
                  pair.targetSubCountyId,
              },
              select: {
                id: true,
                name: true,
                sourceGid: true,
                countyId: true,
                subCountyId: true,
              },
              orderBy: {
                id: "asc",
              },
            });

          assertEqual(
            oldRemaining,
            0,
            `Old SubCounty ${pair.oldSubCountyId} still owns wards`,
          );

          assertEqual(
            targetWards.length,
            pair.expectedWardCount,
            `Target Ward count mismatch for ${pair.identityName}`,
          );

          const targetGids =
            targetWards
              .map(
                (ward) => ward.sourceGid,
              )
              .filter(
                (gid): gid is number =>
                  gid !== null,
              );

          assertTrue(
            arraysEqual(
              targetGids,
              pair.expectedWardGids,
            ),
            `Target GID set mismatch after reassignment for ${pair.identityName}`,
          );

          /*
           * Verify immutable Ward fields.
           */

          for (const original of snapshot) {
            const updated =
              targetWards.find(
                (ward) =>
                  ward.id === original.id,
              );

            assertTrue(
              updated !== undefined,
              `Ward ${original.id} disappeared during migration`,
            );

            assertEqual(
              updated!.name,
              original.name,
              `Ward ${original.id} name changed`,
            );

            assertEqual(
              updated!.sourceGid,
              original.sourceGid,
              `Ward ${original.id} sourceGid changed`,
            );

            assertEqual(
              updated!.countyId,
              original.countyId,
              `Ward ${original.id} countyId changed`,
            );

            assertEqual(
              updated!.subCountyId,
              pair.targetSubCountyId,
              `Ward ${original.id} did not receive target SubCounty`,
            );
          }

          console.log(
            `    ${pair.identityName}: reassignment verification PASS`,
          );
        }

        /*
         * ------------------------------------------------------
         * 3E. VERIFY APPLICATION DEPENDENCIES REMAIN ZERO
         * ------------------------------------------------------
         */

        console.log("");
        console.log(
          "  [3E] Verifying application dependencies...",
        );

        for (const pair of PAIRS) {
          const [
            targetFarmers,
            targetFarms,
            targetBusinessPartners,
            targetCommoditySource,
            targetCommodityDestination,
          ] = await Promise.all([
            tx.farmer.count({
              where: {
                subCountyId:
                  pair.targetSubCountyId,
              },
            }),

            tx.farm.count({
              where: {
                subCountyId:
                  pair.targetSubCountyId,
              },
            }),

            tx.businessPartner.count({
              where: {
                subCountyId:
                  pair.targetSubCountyId,
              },
            }),

            tx.commodityTransaction.count({
              where: {
                sourceSubCountyId:
                  pair.targetSubCountyId,
              },
            }),

            tx.commodityTransaction.count({
              where: {
                destinationSubCountyId:
                  pair.targetSubCountyId,
              },
            }),
          ]);

          assertEqual(
            targetFarmers,
            0,
            `Unexpected Farmer dependency on target ${pair.targetSubCountyId}`,
          );

          assertEqual(
            targetFarms,
            0,
            `Unexpected Farm dependency on target ${pair.targetSubCountyId}`,
          );

          assertEqual(
            targetBusinessPartners,
            0,
            `Unexpected BusinessPartner dependency on target ${pair.targetSubCountyId}`,
          );

          assertEqual(
            targetCommoditySource,
            0,
            `Unexpected Commodity source dependency on target ${pair.targetSubCountyId}`,
          );

          assertEqual(
            targetCommodityDestination,
            0,
            `Unexpected Commodity destination dependency on target ${pair.targetSubCountyId}`,
          );

          console.log(
            `    ${pair.identityName}: application dependency verification PASS`,
          );
        }

        /*
         * ------------------------------------------------------
         * 3F. DELETE ONLY THE NOW-EMPTY OLD RECORDS
         * ------------------------------------------------------
         */

        console.log("");
        console.log(
          "  [3F] Deleting only empty old SubCounty records...",
        );

        for (const pair of PAIRS) {
          const oldWardCount =
            await tx.ward.count({
              where: {
                subCountyId:
                  pair.oldSubCountyId,
              },
            });

          assertEqual(
            oldWardCount,
            0,
            `Cannot delete SubCounty ${pair.oldSubCountyId}; wards remain`,
          );

          const [
            farmers,
            farms,
            businessPartners,
            commoditySource,
            commodityDestination,
          ] = await Promise.all([
            tx.farmer.count({
              where: {
                subCountyId:
                  pair.oldSubCountyId,
              },
            }),

            tx.farm.count({
              where: {
                subCountyId:
                  pair.oldSubCountyId,
              },
            }),

            tx.businessPartner.count({
              where: {
                subCountyId:
                  pair.oldSubCountyId,
              },
            }),

            tx.commodityTransaction.count({
              where: {
                sourceSubCountyId:
                  pair.oldSubCountyId,
              },
            }),

            tx.commodityTransaction.count({
              where: {
                destinationSubCountyId:
                  pair.oldSubCountyId,
              },
            }),
          ]);

          assertEqual(
            farmers,
            0,
            `Cannot delete SubCounty ${pair.oldSubCountyId}; Farmer references remain`,
          );

          assertEqual(
            farms,
            0,
            `Cannot delete SubCounty ${pair.oldSubCountyId}; Farm references remain`,
          );

          assertEqual(
            businessPartners,
            0,
            `Cannot delete SubCounty ${pair.oldSubCountyId}; BusinessPartner references remain`,
          );

          assertEqual(
            commoditySource,
            0,
            `Cannot delete SubCounty ${pair.oldSubCountyId}; Commodity source references remain`,
          );

          assertEqual(
            commodityDestination,
            0,
            `Cannot delete SubCounty ${pair.oldSubCountyId}; Commodity destination references remain`,
          );

          const deleted =
            await tx.subCounty.delete({
              where: {
                id: pair.oldSubCountyId,
              },
            });

          assertEqual(
            deleted.id,
            pair.oldSubCountyId,
            `Unexpected deleted SubCounty ID for ${pair.identityName}`,
          );

          totalSubCountiesDeleted++;

          console.log(
            `    Deleted ${deleted.id} | ${deleted.name}`,
          );
        }

        /*
         * ------------------------------------------------------
         * 3G. FINAL IN-TRANSACTION VERIFICATION
         * ------------------------------------------------------
         */

        console.log("");
        console.log(
          "  [3G] Running final in-transaction verification...",
        );

        for (const pair of PAIRS) {
          const oldSubCounty =
            await tx.subCounty.findUnique({
              where: {
                id: pair.oldSubCountyId,
              },
            });

          const targetSubCounty =
            await tx.subCounty.findUnique({
              where: {
                id: pair.targetSubCountyId,
              },
            });

          assertTrue(
            oldSubCounty === null,
            `Deleted SubCounty ${pair.oldSubCountyId} still exists`,
          );

          assertTrue(
            targetSubCounty !== null,
            `Target SubCounty ${pair.targetSubCountyId} disappeared`,
          );

          const oldWardCount =
            await tx.ward.count({
              where: {
                subCountyId:
                  pair.oldSubCountyId,
              },
            });

          const targetWardCount =
            await tx.ward.count({
              where: {
                subCountyId:
                  pair.targetSubCountyId,
              },
            });

          assertEqual(
            oldWardCount,
            0,
            `Deleted SubCounty ${pair.oldSubCountyId} still has Ward references`,
          );

          assertEqual(
            targetWardCount,
            pair.expectedWardCount,
            `Target ${pair.targetSubCountyId} has incorrect Ward count`,
          );

          console.log(
            `    ${pair.identityName}: old=0, target=${targetWardCount}`,
          );
        }

        const finalSubCountyCount =
          await tx.subCounty.count();

        const finalWardCount =
          await tx.ward.count();

        assertEqual(
          finalSubCountyCount,
          414,
          "Unexpected SubCounty count after consolidation",
        );

        assertEqual(
          finalWardCount,
          1450,
          "Unexpected Ward count after consolidation",
        );

        console.log(
          `    SubCounties in transaction: ${finalSubCountyCount}`,
        );

        console.log(
          `    Wards in transaction: ${finalWardCount}`,
        );

        console.log(
          "    Final in-transaction verification: PASS",
        );

        console.log("");
        console.log(
          "  ALL V15.6 TRANSACTION CHECKS PASSED.",
        );

        console.log(
          "  Transaction is ready to COMMIT.",
        );
      },
      {
        maxWait: 10000,
        timeout: 60000,
      },
    );

    /*
     * ----------------------------------------------------------
     * 4. POST-COMMIT VERIFICATION
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[4/9] Transaction committed successfully.");

    console.log("");
    console.log("[5/9] Running post-commit verification...");

    for (const pair of PAIRS) {
      const oldSubCounty =
        await prisma.subCounty.findUnique({
          where: {
            id: pair.oldSubCountyId,
          },
        });

      const targetSubCounty =
        await prisma.subCounty.findUnique({
          where: {
            id: pair.targetSubCountyId,
          },
        });

      assertTrue(
        oldSubCounty === null,
        `Post-commit: old SubCounty ${pair.oldSubCountyId} still exists`,
      );

      assertTrue(
        targetSubCounty !== null,
        `Post-commit: target SubCounty ${pair.targetSubCountyId} does not exist`,
      );

      const targetWards =
        await prisma.ward.findMany({
          where: {
            subCountyId:
              pair.targetSubCountyId,
          },
          select: {
            id: true,
            name: true,
            sourceGid: true,
            countyId: true,
            subCountyId: true,
          },
          orderBy: {
            id: "asc",
          },
        });

      assertEqual(
        targetWards.length,
        pair.expectedWardCount,
        `Post-commit target Ward count mismatch for ${pair.identityName}`,
      );

      const targetGids =
        targetWards
          .map(
            (ward) => ward.sourceGid,
          )
          .filter(
            (gid): gid is number =>
              gid !== null,
          );

      assertTrue(
        arraysEqual(
          targetGids,
          pair.expectedWardGids,
        ),
        `Post-commit GID mismatch for ${pair.identityName}`,
      );

      const oldWardCount =
        await prisma.ward.count({
          where: {
            subCountyId:
              pair.oldSubCountyId,
          },
        });

      assertEqual(
        oldWardCount,
        0,
        `Post-commit old Ward references remain for ${pair.identityName}`,
      );

      results.push({
        countyName: pair.countyName,
        identityName: pair.identityName,

        oldSubCountyId:
          pair.oldSubCountyId,
        oldSubCountyName:
          pair.oldSubCountyName,

        targetSubCountyId:
          pair.targetSubCountyId,
        targetSubCountyName:
          pair.targetSubCountyName,

        expectedWardCount:
          pair.expectedWardCount,

        updatedWardCount:
          pair.expectedWardCount,

        deletedSubCountyCount: 1,

        expectedWardGids:
          pair.expectedWardGids,

        verifiedWardGids:
          targetGids,

        farmersBefore: 0,
        farmsBefore: 0,
        businessPartnersBefore: 0,
        commoditySourceBefore: 0,
        commodityDestinationBefore: 0,

        oldWardCountBefore:
          pair.expectedWardCount,

        targetWardCountBefore: 0,

        oldWardCountAfter: 0,

        targetWardCountAfter:
          targetWards.length,

        oldSubCountyExistsAfter:
          false,

        targetSubCountyExistsAfter:
          true,

        status: "PASS",
      });

      console.log(
        `  ${pair.identityName}: PASS`,
      );
    }

    /*
     * ----------------------------------------------------------
     * 6. GLOBAL POST-COMMIT COUNTS
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[6/9] Checking global post-commit counts...");

    const [
      finalCountyCount,
      finalSubCountyCount,
      finalWardCount,
      finalFarmerCount,
      finalFarmCount,
      finalBusinessPartnerCount,
      finalCommodityTransactionCount,
    ] = await Promise.all([
      prisma.county.count(),
      prisma.subCounty.count(),
      prisma.ward.count(),
      prisma.farmer.count(),
      prisma.farm.count(),
      prisma.businessPartner.count(),
      prisma.commodityTransaction.count(),
    ]);

    assertEqual(
      finalCountyCount,
      47,
      "County count changed unexpectedly",
    );

    assertEqual(
      finalSubCountyCount,
      414,
      "SubCounty count after V15.6 is incorrect",
    );

    assertEqual(
      finalWardCount,
      1450,
      "Ward count changed unexpectedly",
    );

    assertEqual(
      finalFarmerCount,
      farmerCount,
      "Farmer count changed unexpectedly",
    );

    assertEqual(
      finalFarmCount,
      farmCount,
      "Farm count changed unexpectedly",
    );

    assertEqual(
      finalBusinessPartnerCount,
      businessPartnerCount,
      "BusinessPartner count changed unexpectedly",
    );

    assertEqual(
      finalCommodityTransactionCount,
      commodityTransactionCount,
      "CommodityTransaction count changed unexpectedly",
    );

    console.log(
      `  Counties: ${finalCountyCount}`,
    );

    console.log(
      `  SubCounties: ${finalSubCountyCount}`,
    );

    console.log(
      `  Wards: ${finalWardCount}`,
    );

    console.log(
      `  Farmers: ${finalFarmerCount}`,
    );

    console.log(
      `  Farms: ${finalFarmCount}`,
    );

    console.log(
      `  BusinessPartners: ${finalBusinessPartnerCount}`,
    );

    console.log(
      `  CommodityTransactions: ${finalCommodityTransactionCount}`,
    );

    /*
     * ----------------------------------------------------------
     * 7. GLOBAL SOURCE GID INTEGRITY
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[7/9] Checking global Ward sourceGID integrity...");

    const allWardGids =
      await prisma.ward.findMany({
        select: {
          sourceGid: true,
        },
      });

    const numericGids =
      allWardGids
        .map(
          (ward) => ward.sourceGid,
        )
        .filter(
          (gid): gid is number =>
            gid !== null,
        );

    const nullGidCount =
      allWardGids.length -
      numericGids.length;

    const uniqueGids =
      new Set(numericGids);

    assertEqual(
      allWardGids.length,
      1450,
      "Unexpected total Ward rows",
    );

    assertEqual(
      nullGidCount,
      0,
      "NULL Ward sourceGIDs detected",
    );

    assertEqual(
      uniqueGids.size,
      1450,
      "Duplicate Ward sourceGIDs detected",
    );

    console.log(
      `  Ward rows: ${allWardGids.length}`,
    );

    console.log(
      `  NULL sourceGIDs: ${nullGidCount}`,
    );

    console.log(
      `  Unique sourceGIDs: ${uniqueGids.size}`,
    );

    /*
     * ----------------------------------------------------------
     * 8. APPLICATION FK SAFETY
     * ----------------------------------------------------------
     */

    console.log("");
    console.log(
      "[8/9] Checking deleted SubCounty IDs across application FKs...",
    );

    const deletedIds =
      PAIRS.map(
        (pair) => pair.oldSubCountyId,
      );

    const [
      deletedWardRefs,
      deletedFarmerRefs,
      deletedFarmRefs,
      deletedBusinessPartnerRefs,
      deletedCommoditySourceRefs,
      deletedCommodityDestinationRefs,
    ] = await Promise.all([
      prisma.ward.count({
        where: {
          subCountyId: {
            in: deletedIds,
          },
        },
      }),

      prisma.farmer.count({
        where: {
          subCountyId: {
            in: deletedIds,
          },
        },
      }),

      prisma.farm.count({
        where: {
          subCountyId: {
            in: deletedIds,
          },
        },
      }),

      prisma.businessPartner.count({
        where: {
          subCountyId: {
            in: deletedIds,
          },
        },
      }),

      prisma.commodityTransaction.count({
        where: {
          sourceSubCountyId: {
            in: deletedIds,
          },
        },
      }),

      prisma.commodityTransaction.count({
        where: {
          destinationSubCountyId: {
            in: deletedIds,
          },
        },
      }),
    ]);

    assertEqual(
      deletedWardRefs,
      0,
      "Ward references to deleted SubCounty IDs remain",
    );

    assertEqual(
      deletedFarmerRefs,
      0,
      "Farmer references to deleted SubCounty IDs remain",
    );

    assertEqual(
      deletedFarmRefs,
      0,
      "Farm references to deleted SubCounty IDs remain",
    );

    assertEqual(
      deletedBusinessPartnerRefs,
      0,
      "BusinessPartner references to deleted SubCounty IDs remain",
    );

    assertEqual(
      deletedCommoditySourceRefs,
      0,
      "Commodity source references to deleted SubCounty IDs remain",
    );

    assertEqual(
      deletedCommodityDestinationRefs,
      0,
      "Commodity destination references to deleted SubCounty IDs remain",
    );

    console.log(
      `  Ward refs: ${deletedWardRefs}`,
    );

    console.log(
      `  Farmer refs: ${deletedFarmerRefs}`,
    );

    console.log(
      `  Farm refs: ${deletedFarmRefs}`,
    );

    console.log(
      `  BusinessPartner refs: ${deletedBusinessPartnerRefs}`,
    );

    console.log(
      `  Commodity source refs: ${deletedCommoditySourceRefs}`,
    );

    console.log(
      `  Commodity destination refs: ${deletedCommodityDestinationRefs}`,
    );

    /*
     * ----------------------------------------------------------
     * 9. WRITE MIGRATION LOG
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[9/9] Writing V15.6 migration log...");

    const log: MigrationLog = {
      audit:
        "Controlled SubCounty Consolidation Migration",

      version: "V15.6",

      mode: "TRANSACTIONAL_WRITE",

      generatedAt:
        new Date().toISOString(),

      safetyBasis: {
        sourceAudit:
          "final-database-integrity-audit-v15-5.json",

        sourceStatus: "PASS",

        safePairs: 3,
      },

      pairs: PAIRS,

      results,

      totals: {
        pairsProcessed:
          PAIRS.length,

        wardsMoved:
          totalWardsMoved,

        subCountiesDeleted:
          totalSubCountiesDeleted,

        farmersChanged: 0,

        farmsChanged: 0,

        businessPartnersChanged: 0,

        commodityTransactionsChanged: 0,
      },

      finalStatus: "PASS",
    };

    fs.writeFileSync(
      outputJsonPath,
      JSON.stringify(log, null, 2),
      "utf8",
    );

    /*
     * ----------------------------------------------------------
     * FINAL RESULT
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("============================================================");
    console.log("FINAL V15.6 RESULT");
    console.log("============================================================");

    console.log("STATUS: PASS");

    console.log("");
    console.log(
      `Pairs consolidated: ${PAIRS.length}`,
    );

    console.log(
      `Wards moved: ${totalWardsMoved}`,
    );

    console.log(
      `SubCounties deleted: ${totalSubCountiesDeleted}`,
    );

    console.log(
      "Farmers changed: 0",
    );

    console.log(
      "Farms changed: 0",
    );

    console.log(
      "BusinessPartners changed: 0",
    );

    console.log(
      "CommodityTransactions changed: 0",
    );

    console.log("");
    console.log(
      "SubCounties: 417 -> 414",
    );

    console.log(
      "Wards: 1450 -> 1450",
    );

    console.log("");
    console.log(
      "Deleted old IDs: 376, 411, 515",
    );

    console.log(
      "Preserved canonical IDs: 1382, 1475, 1474",
    );

    console.log("");
    console.log(
      "Ward sourceGID integrity: PASS",
    );

    console.log(
      "Deleted-ID application FK integrity: PASS",
    );

    console.log("");
    console.log(
      `Migration log: ${outputJsonPath}`,
    );

    console.log("");
    console.log("============================================================");
    console.log("V15.6 COMPLETE");
    console.log("TRANSACTION COMMITTED");
    console.log("============================================================");
    console.log("");
  } catch (error) {
    console.error("");
    console.error("============================================================");
    console.error("V15.6 MIGRATION FAILED");
    console.error("============================================================");
    console.error("");

    console.error(
      error instanceof Error
        ? error.message
        : error,
    );

    console.error("");
    console.error(
      "If the error occurred inside the transaction, PostgreSQL rolled back the entire transaction.",
    );

    console.error(
      "No partial V15.6 consolidation should remain.",
    );

    console.error("");

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();