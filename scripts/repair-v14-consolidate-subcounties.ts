import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

type V134Result = {
  countyId: number;
  countyName: string;
  normalizedName: string;

  oldSubCountyId: number;
  oldSubCountyName: string;

  targetSubCountyId: number;
  targetSubCountyName: string;

  sameCounty: boolean;
  sameNormalizedIdentity: boolean;

  oldWardCount: number;
  targetWardCount: number;

  oldWardIds: number[];
  oldWardGids: number[];

  farmersCount: number;
  farmsCount: number;
  businessPartnersCount: number;

  wardCountyMismatchCount: number;
  wardSubCountyMismatchCount: number;

  hasDependencies: boolean;
  hasWardProblems: boolean;

  action: string;
  reason: string;
};

type MigrationResult = {
  countyId: number;
  countyName: string;

  oldSubCountyId: number;
  oldSubCountyName: string;

  targetSubCountyId: number;
  targetSubCountyName: string;

  expectedWardCount: number;
  movedWardCount: number;

  oldWardCountAfter: number;
  targetWardCountAfter: number;

  oldFarmersAfter: number;
  oldFarmsAfter: number;
  oldBusinessPartnersAfter: number;

  status: "MIGRATED";
};

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const safetyPath = path.resolve(
  "prisma/data/consolidation-safety-v13-4.json"
);

const logJsonPath = path.resolve(
  "prisma/data/consolidation-migration-v14.json"
);

const logCsvPath = path.resolve(
  "prisma/data/consolidation-migration-v14.csv"
);

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function loadApprovedCandidates(): V134Result[] {
  if (!fs.existsSync(safetyPath)) {
    throw new Error(
      `V13.4 safety file not found: ${safetyPath}`
    );
  }

  const raw = JSON.parse(
    fs.readFileSync(safetyPath, "utf8")
  );

  if (!Array.isArray(raw.results)) {
    throw new Error(
      "V13.4 safety file does not contain the expected 'results' array."
    );
  }

  const candidates = raw.results as V134Result[];

  return candidates;
}

async function main() {
  console.log("============================================================");
  console.log("V14 CONTROLLED SUBCOUNTY CONSOLIDATION");
  console.log("============================================================");
  console.log("");
  console.log("CONTROLLED REPAIR — DATABASE MODIFICATIONS WILL OCCUR");
  console.log("NO SUBCOUNTY RECORDS WILL BE DELETED");
  console.log("");

  const candidates = loadApprovedCandidates();

  console.log(
    `V13.4 results loaded: ${candidates.length}`
  );

  if (candidates.length !== 122) {
    throw new Error(
      `Expected exactly 122 V13.4 candidates, but found ${candidates.length}.`
    );
  }

  /*
   * ----------------------------------------------------------
   * ABSOLUTE SAFETY CHECK
   * ----------------------------------------------------------
   */

  for (const candidate of candidates) {
    if (candidate.action !== "SAFE_TO_MIGRATE") {
      throw new Error(
        `Unsafe V13.4 candidate detected: ${candidate.countyName} | old=${candidate.oldSubCountyId} | target=${candidate.targetSubCountyId} | action=${candidate.action}`
      );
    }

    if (!candidate.sameCounty) {
      throw new Error(
        `County mismatch in V13.4 candidate: ${candidate.countyName} | old=${candidate.oldSubCountyId} | target=${candidate.targetSubCountyId}`
      );
    }

    if (!candidate.sameNormalizedIdentity) {
      throw new Error(
        `Identity mismatch in V13.4 candidate: ${candidate.countyName} | old=${candidate.oldSubCountyId} | target=${candidate.targetSubCountyId}`
      );
    }

    if (candidate.targetWardCount !== 0) {
      throw new Error(
        `Target ${candidate.targetSubCountyId} already has ${candidate.targetWardCount} wards.`
      );
    }

    if (candidate.farmersCount !== 0) {
      throw new Error(
        `Old SubCounty ${candidate.oldSubCountyId} has ${candidate.farmersCount} farmers.`
      );
    }

    if (candidate.farmsCount !== 0) {
      throw new Error(
        `Old SubCounty ${candidate.oldSubCountyId} has ${candidate.farmsCount} farms.`
      );
    }

    if (candidate.businessPartnersCount !== 0) {
      throw new Error(
        `Old SubCounty ${candidate.oldSubCountyId} has ${candidate.businessPartnersCount} business partners.`
      );
    }

    if (candidate.wardCountyMismatchCount !== 0) {
      throw new Error(
        `Old SubCounty ${candidate.oldSubCountyId} has ${candidate.wardCountyMismatchCount} ward county mismatches.`
      );
    }

    if (candidate.wardSubCountyMismatchCount !== 0) {
      throw new Error(
        `Old SubCounty ${candidate.oldSubCountyId} has ${candidate.wardSubCountyMismatchCount} ward ownership mismatches.`
      );
    }

    if (candidate.hasDependencies) {
      throw new Error(
        `Old SubCounty ${candidate.oldSubCountyId} reports dependencies.`
      );
    }

    if (candidate.hasWardProblems) {
      throw new Error(
        `Old SubCounty ${candidate.oldSubCountyId} reports ward problems.`
      );
    }
  }

  console.log(
    "All 122 V13.4 candidates passed the safety gate."
  );

  const results: MigrationResult[] = [];

  /*
   * ----------------------------------------------------------
   * TRANSACTION
   * ----------------------------------------------------------
   */

  await prisma.$transaction(
    async (tx) => {
      console.log("");
      console.log("------------------------------------------------------------");
      console.log("V14 PRE-FLIGHT DATABASE VALIDATION");
      console.log("------------------------------------------------------------");

      /*
       * ========================================================
       * PASS 1 — LIVE DATABASE PRE-FLIGHT
       * ========================================================
       */

      for (const candidate of candidates) {
        const oldRecord = await tx.subCounty.findUnique({
          where: {
            id: candidate.oldSubCountyId,
          },
          select: {
            id: true,
            name: true,
            countyId: true,
            _count: {
              select: {
                wards: true,
                farmers: true,
                farms: true,
                businessPartners: true,
              },
            },
          },
        });

        if (!oldRecord) {
          throw new Error(
            `PRE-FLIGHT FAILED: old SubCounty ${candidate.oldSubCountyId} not found.`
          );
        }

        const targetRecord = await tx.subCounty.findUnique({
          where: {
            id: candidate.targetSubCountyId,
          },
          select: {
            id: true,
            name: true,
            countyId: true,
            _count: {
              select: {
                wards: true,
                farmers: true,
                farms: true,
                businessPartners: true,
              },
            },
          },
        });

        if (!targetRecord) {
          throw new Error(
            `PRE-FLIGHT FAILED: target SubCounty ${candidate.targetSubCountyId} not found.`
          );
        }

        /*
         * Old and target must be different.
         */

        if (
          candidate.oldSubCountyId ===
          candidate.targetSubCountyId
        ) {
          throw new Error(
            `PRE-FLIGHT FAILED: old and target IDs are identical for ${candidate.countyName}.`
          );
        }

        /*
         * County integrity.
         */

        if (oldRecord.countyId !== candidate.countyId) {
          throw new Error(
            `PRE-FLIGHT FAILED: old SubCounty ${candidate.oldSubCountyId} county=${oldRecord.countyId}, expected=${candidate.countyId}.`
          );
        }

        if (targetRecord.countyId !== candidate.countyId) {
          throw new Error(
            `PRE-FLIGHT FAILED: target SubCounty ${candidate.targetSubCountyId} county=${targetRecord.countyId}, expected=${candidate.countyId}.`
          );
        }

        /*
         * Target MUST still be empty.
         */

        if (targetRecord._count.wards !== 0) {
          throw new Error(
            `PRE-FLIGHT FAILED: target ${candidate.targetSubCountyId} already has ${targetRecord._count.wards} wards.`
          );
        }

        /*
         * Old application dependencies MUST still be zero.
         */

        if (oldRecord._count.farmers !== 0) {
          throw new Error(
            `PRE-FLIGHT FAILED: old ${candidate.oldSubCountyId} has ${oldRecord._count.farmers} farmers.`
          );
        }

        if (oldRecord._count.farms !== 0) {
          throw new Error(
            `PRE-FLIGHT FAILED: old ${candidate.oldSubCountyId} has ${oldRecord._count.farms} farms.`
          );
        }

        if (
          oldRecord._count.businessPartners !== 0
        ) {
          throw new Error(
            `PRE-FLIGHT FAILED: old ${candidate.oldSubCountyId} has ${oldRecord._count.businessPartners} business partners.`
          );
        }

        /*
         * Ward count must still match V13.4.
         */

        if (
          oldRecord._count.wards !==
          candidate.oldWardCount
        ) {
          throw new Error(
            `PRE-FLIGHT FAILED: ${candidate.countyName} old=${candidate.oldSubCountyId} expected ${candidate.oldWardCount} wards, found ${oldRecord._count.wards}.`
          );
        }

        /*
         * Confirm the exact expected ward IDs.
         */

        const liveWards = await tx.ward.findMany({
          where: {
            subCountyId: candidate.oldSubCountyId,
          },
          select: {
            id: true,
            sourceGid: true,
            countyId: true,
            subCountyId: true,
          },
          orderBy: {
            id: "asc",
          },
        });

        const liveWardIds = liveWards
          .map((ward) => ward.id)
          .sort((a, b) => a - b);

        const expectedWardIds = [
          ...candidate.oldWardIds,
        ].sort((a, b) => a - b);

        if (
          JSON.stringify(liveWardIds) !==
          JSON.stringify(expectedWardIds)
        ) {
          throw new Error(
            `PRE-FLIGHT FAILED: live ward IDs differ from V13.4 for ${candidate.countyName} | old=${candidate.oldSubCountyId}.`
          );
        }

        /*
         * Confirm ward county integrity.
         */

        for (const ward of liveWards) {
          if (ward.countyId !== candidate.countyId) {
            throw new Error(
              `PRE-FLIGHT FAILED: ward ${ward.id} county=${ward.countyId}, expected=${candidate.countyId}.`
            );
          }

          if (
            ward.subCountyId !==
            candidate.oldSubCountyId
          ) {
            throw new Error(
              `PRE-FLIGHT FAILED: ward ${ward.id} has unexpected subCountyId=${ward.subCountyId}.`
            );
          }
        }
      }

      console.log(
        "LIVE DATABASE PRE-FLIGHT: PASS"
      );

      console.log(
        "All 122 old records, target records, ward IDs, counties and dependencies verified."
      );

      /*
       * ========================================================
       * PASS 2 — CONTROLLED WARD MIGRATION
       * ========================================================
       */

      console.log("");
      console.log("------------------------------------------------------------");
      console.log("V14 WARD MIGRATION");
      console.log("------------------------------------------------------------");

      let totalMoved = 0;

      for (const candidate of candidates) {
        const oldId = candidate.oldSubCountyId;
        const targetId = candidate.targetSubCountyId;

        const oldRecord = await tx.subCounty.findUnique({
          where: {
            id: oldId,
          },
          select: {
            id: true,
            name: true,
          },
        });

        const targetRecord = await tx.subCounty.findUnique({
          where: {
            id: targetId,
          },
          select: {
            id: true,
            name: true,
          },
        });

        if (!oldRecord || !targetRecord) {
          throw new Error(
            `MIGRATION FAILED: SubCounty disappeared for ${candidate.countyName}.`
          );
        }

        /*
         * Re-read wards immediately before updating.
         */

        const wardsBefore = await tx.ward.findMany({
          where: {
            subCountyId: oldId,
          },
          select: {
            id: true,
            sourceGid: true,
            countyId: true,
            subCountyId: true,
          },
          orderBy: {
            id: "asc",
          },
        });

        if (
          wardsBefore.length !==
          candidate.oldWardCount
        ) {
          throw new Error(
            `MIGRATION FAILED: ${candidate.countyName} expected ${candidate.oldWardCount} wards but found ${wardsBefore.length}.`
          );
        }

        /*
         * MOVE ONLY subCountyId.
         *
         * sourceGid is untouched.
         * countyId is untouched.
         */

        const updateResult =
          await tx.ward.updateMany({
            where: {
              subCountyId: oldId,
            },
            data: {
              subCountyId: targetId,
            },
          });

        if (
          updateResult.count !==
          candidate.oldWardCount
        ) {
          throw new Error(
            `MIGRATION FAILED: ${candidate.countyName} expected ${candidate.oldWardCount} updates but database reported ${updateResult.count}.`
          );
        }

        /*
         * Verify old record is empty.
         */

        const oldWardCountAfter =
          await tx.ward.count({
            where: {
              subCountyId: oldId,
            },
          });

        if (oldWardCountAfter !== 0) {
          throw new Error(
            `MIGRATION FAILED: old SubCounty ${oldId} still has ${oldWardCountAfter} wards.`
          );
        }

        /*
         * Verify target has exactly expected wards.
         */

        const targetWardCountAfter =
          await tx.ward.count({
            where: {
              subCountyId: targetId,
            },
          });

        if (
          targetWardCountAfter !==
          candidate.oldWardCount
        ) {
          throw new Error(
            `MIGRATION FAILED: target ${targetId} has ${targetWardCountAfter} wards; expected ${candidate.oldWardCount}.`
          );
        }

        /*
         * Verify application dependencies remain zero.
         */

        const oldAfter =
          await tx.subCounty.findUnique({
            where: {
              id: oldId,
            },
            select: {
              _count: {
                select: {
                  wards: true,
                  farmers: true,
                  farms: true,
                  businessPartners: true,
                },
              },
            },
          });

        if (!oldAfter) {
          throw new Error(
            `MIGRATION FAILED: old SubCounty ${oldId} disappeared.`
          );
        }

        if (
          oldAfter._count.wards !== 0 ||
          oldAfter._count.farmers !== 0 ||
          oldAfter._count.farms !== 0 ||
          oldAfter._count.businessPartners !== 0
        ) {
          throw new Error(
            `MIGRATION FAILED: old SubCounty ${oldId} still has dependencies.`
          );
        }

        /*
         * Verify moved wards still belong to same county.
         */

        const movedWards =
          await tx.ward.findMany({
            where: {
              subCountyId: targetId,
            },
            select: {
              id: true,
              sourceGid: true,
              countyId: true,
              subCountyId: true,
            },
          });

        for (const ward of movedWards) {
          if (
            ward.countyId !==
            candidate.countyId
          ) {
            throw new Error(
              `MIGRATION FAILED: ward ${ward.id} county changed unexpectedly.`
            );
          }

          if (
            ward.subCountyId !==
            targetId
          ) {
            throw new Error(
              `MIGRATION FAILED: ward ${ward.id} target ownership incorrect.`
            );
          }
        }

        results.push({
          countyId: candidate.countyId,
          countyName: candidate.countyName,

          oldSubCountyId: oldId,
          oldSubCountyName:
            oldRecord.name,

          targetSubCountyId: targetId,
          targetSubCountyName:
            targetRecord.name,

          expectedWardCount:
            candidate.oldWardCount,

          movedWardCount:
            updateResult.count,

          oldWardCountAfter,
          targetWardCountAfter,

          oldFarmersAfter:
            oldAfter._count.farmers,

          oldFarmsAfter:
            oldAfter._count.farms,

          oldBusinessPartnersAfter:
            oldAfter._count.businessPartners,

          status: "MIGRATED",
        });

        totalMoved += updateResult.count;

        console.log(
          `${candidate.countyName} | ${oldId} ${oldRecord.name} -> ${targetId} ${targetRecord.name} | wards=${updateResult.count}`
        );
      }

      /*
       * ========================================================
       * PASS 3 — COMPLETE TRANSACTION VERIFICATION
       * ========================================================
       */

      console.log("");
      console.log("------------------------------------------------------------");
      console.log("FINAL TRANSACTION VERIFICATION");
      console.log("------------------------------------------------------------");

      if (
        results.length !==
        candidates.length
      ) {
        throw new Error(
          `Expected ${candidates.length} migrations, but recorded ${results.length}.`
        );
      }

      /*
       * Confirm every old record is empty.
       */

      for (const result of results) {
        const oldRecord =
          await tx.subCounty.findUnique({
            where: {
              id: result.oldSubCountyId,
            },
            select: {
              id: true,
              _count: {
                select: {
                  wards: true,
                  farmers: true,
                  farms: true,
                  businessPartners: true,
                },
              },
            },
          });

        if (!oldRecord) {
          throw new Error(
            `FINAL VERIFICATION FAILED: old SubCounty ${result.oldSubCountyId} no longer exists.`
          );
        }

        if (
          oldRecord._count.wards !== 0 ||
          oldRecord._count.farmers !== 0 ||
          oldRecord._count.farms !== 0 ||
          oldRecord._count.businessPartners !== 0
        ) {
          throw new Error(
            `FINAL VERIFICATION FAILED: old SubCounty ${result.oldSubCountyId} is not empty.`
          );
        }

        const targetWardCount =
          await tx.ward.count({
            where: {
              subCountyId:
                result.targetSubCountyId,
            },
          });

        if (
          targetWardCount !==
          result.expectedWardCount
        ) {
          throw new Error(
            `FINAL VERIFICATION FAILED: target ${result.targetSubCountyId} expected ${result.expectedWardCount} wards but has ${targetWardCount}.`
          );
        }
      }

      console.log(
        `Migrations verified: ${results.length}`
      );

      console.log(
        `Wards verified as moved: ${totalMoved}`
      );

      console.log(
        "All old records verified empty."
      );

      console.log(
        "All target records verified with expected ward counts."
      );

      console.log("");
      console.log(
        "TRANSACTION VERIFICATION: PASS"
      );

      console.log(
        "Transaction is now committing."
      );
    },
    {
      maxWait: 10000,
      timeout: 120000,
    }
  );

  /*
   * ============================================================
   * WRITE POST-COMMIT LOG
   * ============================================================
   */

  const totalMoved = results.reduce(
    (sum, result) =>
      sum + result.movedWardCount,
    0
  );

  const log = {
    version: "V14",
    generatedAt:
      new Date().toISOString(),

    status: "COMMITTED",

    modificationType:
      "WARD_SUBCOUNTY_REASSIGNMENT",

    deletionsPerformed: false,

    candidatesLoaded:
      candidates.length,

    migrationsCompleted:
      results.length,

    wardsMoved:
      totalMoved,

    migrationDirection:
      "oldSubCountyId -> targetSubCountyId",

    sourceAudit:
      "consolidation-safety-v13-4.json",

    importantNote:
      "Only Ward.subCountyId was changed. No SubCounty, Farmer, Farm, BusinessPartner, countyId or sourceGid records were deleted or otherwise modified.",

    results,
  };

  fs.writeFileSync(
    logJsonPath,
    JSON.stringify(
      log,
      null,
      2
    ),
    "utf8"
  );

  const csvHeader = [
    "countyId",
    "countyName",
    "oldSubCountyId",
    "oldSubCountyName",
    "targetSubCountyId",
    "targetSubCountyName",
    "expectedWardCount",
    "movedWardCount",
    "oldWardCountAfter",
    "targetWardCountAfter",
    "oldFarmersAfter",
    "oldFarmsAfter",
    "oldBusinessPartnersAfter",
    "status",
  ];

  const csvRows =
    results.map((result) =>
      [
        result.countyId,
        result.countyName,
        result.oldSubCountyId,
        result.oldSubCountyName,
        result.targetSubCountyId,
        result.targetSubCountyName,
        result.expectedWardCount,
        result.movedWardCount,
        result.oldWardCountAfter,
        result.targetWardCountAfter,
        result.oldFarmersAfter,
        result.oldFarmsAfter,
        result.oldBusinessPartnersAfter,
        result.status,
      ]
        .map(csvEscape)
        .join(",")
    );

  fs.writeFileSync(
    logCsvPath,
    [
      csvHeader.join(","),
      ...csvRows,
    ].join("\n"),
    "utf8"
  );

  console.log("");
  console.log("============================================================");
  console.log("V14 CONTROLLED MIGRATION COMPLETE");
  console.log("============================================================");
  console.log("");
  console.log(
    `Migrations completed: ${results.length}`
  );
  console.log(
    `Wards moved: ${totalMoved}`
  );
  console.log(
    "SubCounty records deleted: 0"
  );
  console.log(
    "Farmers migrated: 0"
  );
  console.log(
    "Farms migrated: 0"
  );
  console.log(
    "Business partners migrated: 0"
  );
  console.log("");
  console.log(
    `JSON LOG: ${logJsonPath}`
  );
  console.log(
    `CSV LOG: ${logCsvPath}`
  );
  console.log("");
  console.log(
    "IMPORTANT: Old SubCounty records remain in the database."
  );
  console.log(
    "Post-V14 reconciliation must be completed before deletion is considered."
  );
  console.log("");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("============================================================");
    console.error("V14 MIGRATION FAILED");
    console.error("============================================================");
    console.error("");
    console.error(
      "The transaction was rolled back."
    );
    console.error(
      "No partial V14 migration should remain."
    );
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });