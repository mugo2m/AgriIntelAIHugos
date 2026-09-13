import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";

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

const V15_AUDIT_PATH = path.join(
  process.cwd(),
  "prisma",
  "data",
  "pre-delete-audit-v15.json"
);

const V14_LOG_PATH = path.join(
  process.cwd(),
  "prisma",
  "data",
  "consolidation-migration-v14.json"
);

const DELETION_LOG_PATH = path.join(
  process.cwd(),
  "prisma",
  "data",
  "deletion-log-v15.json"
);

type JsonObject = Record<string, any>;

function loadJson(filePath: string): JsonObject {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file does not exist: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sortedNumbers(values: unknown[]): number[] {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value))
    .sort((a, b) => a - b);
}

function sameNumberArray(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

function normalizeSourceGid(value: unknown): string {
  return String(value);
}

async function main() {
  console.log("==============================================");
  console.log("V15 CONTROLLED SUBCOUNTY DELETION");
  console.log("==============================================");
  console.log("");

  if (!fs.existsSync(V15_AUDIT_PATH)) {
    throw new Error(
      `V15 audit not found:\n${V15_AUDIT_PATH}\n\nRun V15 pre-delete audit first.`
    );
  }

  if (!fs.existsSync(V14_LOG_PATH)) {
    throw new Error(
      `V14 migration log not found:\n${V14_LOG_PATH}`
    );
  }

  const v15Audit = loadJson(V15_AUDIT_PATH);
  const v14Log = loadJson(V14_LOG_PATH);

  console.log("STEP 0 — V15 AUDIT VALIDATION");
  console.log("");

  if (v15Audit.mode !== "READ_ONLY_PRE_DELETE_AUDIT") {
    throw new Error(
      `SAFETY STOP: Unexpected V15 audit mode: ${v15Audit.mode}`
    );
  }

  if (!Array.isArray(v15Audit.oldSubCountyIds)) {
    throw new Error(
      "SAFETY STOP: V15 audit does not contain oldSubCountyIds."
    );
  }

  if (!Array.isArray(v15Audit.targetSubCountyIds)) {
    throw new Error(
      "SAFETY STOP: V15 audit does not contain targetSubCountyIds."
    );
  }

  if (!v15Audit.result || typeof v15Audit.result !== "object") {
    throw new Error(
      "SAFETY STOP: V15 audit does not contain result."
    );
  }

  const oldSubCountyIds = sortedNumbers(
    v15Audit.oldSubCountyIds
  );

  const targetSubCountyIds = sortedNumbers(
    v15Audit.targetSubCountyIds
  );

  if (oldSubCountyIds.length !== 122) {
    throw new Error(
      `SAFETY STOP: Expected 122 old SubCounty IDs, found ${oldSubCountyIds.length}.`
    );
  }

  if (new Set(oldSubCountyIds).size !== 122) {
    throw new Error(
      "SAFETY STOP: Duplicate old SubCounty IDs detected."
    );
  }

  if (targetSubCountyIds.length !== 122) {
    throw new Error(
      `SAFETY STOP: Expected 122 target SubCounty IDs, found ${targetSubCountyIds.length}.`
    );
  }

  if (new Set(targetSubCountyIds).size !== 122) {
    throw new Error(
      "SAFETY STOP: Duplicate target SubCounty IDs detected."
    );
  }

  if (v15Audit.v14MigrationCount !== 122) {
    throw new Error(
      `SAFETY STOP: V15 reports ${v15Audit.v14MigrationCount} V14 migrations, not 122.`
    );
  }

  if (v15Audit.result.safeToDelete !== true) {
    throw new Error(
      "SAFETY STOP: V15 result.safeToDelete is not true."
    );
  }

  if (Number(v15Audit.result.safeCount) !== 122) {
    throw new Error(
      `SAFETY STOP: V15 safeCount is ${v15Audit.result.safeCount}, not 122.`
    );
  }

  if (Number(v15Audit.result.referencedCount) !== 0) {
    throw new Error(
      `SAFETY STOP: V15 referencedCount is ${v15Audit.result.referencedCount}.`
    );
  }

  if (Number(v15Audit.result.unknownReferences) !== 0) {
    throw new Error(
      `SAFETY STOP: V15 unknownReferences is ${v15Audit.result.unknownReferences}.`
    );
  }

  if (
    v15Audit.verification?.allForeignKeysClear !== true ||
    v15Audit.verification?.allApplicationDependenciesClear !== true ||
    v15Audit.verification?.allOldRecordsExist !== true ||
    v15Audit.verification?.allTargetsExist !== true ||
    v15Audit.verification?.allIdentitiesValid !== true
  ) {
    throw new Error(
      "SAFETY STOP: One or more V15 verification gates are not true."
    );
  }

  console.log(`V15 audit mode: ${v15Audit.mode}`);
  console.log(`V15 old IDs: ${oldSubCountyIds.length}`);
  console.log(`V15 target IDs: ${targetSubCountyIds.length}`);
  console.log(`V15 safeToDelete: ${v15Audit.result.safeToDelete}`);
  console.log(`V15 safeCount: ${v15Audit.result.safeCount}`);
  console.log(`V15 referencedCount: ${v15Audit.result.referencedCount}`);
  console.log(
    `V15 unknownReferences: ${v15Audit.result.unknownReferences}`
  );
  console.log("V15 safety gates: PASS");
  console.log("");

  const v14Records = Array.isArray(v14Log)
    ? v14Log
    : Array.isArray(v14Log.migrations)
      ? v14Log.migrations
      : Array.isArray(v14Log.results)
        ? v14Log.results
        : null;

  if (!v14Records) {
    throw new Error(
      "SAFETY STOP: Could not locate V14 migration records."
    );
  }

  if (v14Records.length !== 122) {
    throw new Error(
      `SAFETY STOP: Expected 122 V14 records, found ${v14Records.length}.`
    );
  }

  const v14ByOldId = new Map<number, JsonObject>();

  for (const record of v14Records) {
    const oldId = Number(record.oldSubCountyId);

    if (!Number.isInteger(oldId)) {
      throw new Error(
        `SAFETY STOP: Invalid V14 oldSubCountyId: ${record.oldSubCountyId}`
      );
    }

    if (v14ByOldId.has(oldId)) {
      throw new Error(
        `SAFETY STOP: Duplicate V14 oldSubCountyId: ${oldId}`
      );
    }

    v14ByOldId.set(oldId, record);
  }

  const v14OldIds = [...v14ByOldId.keys()].sort(
    (a, b) => a - b
  );

  if (!sameNumberArray(v14OldIds, oldSubCountyIds)) {
    throw new Error(
      "SAFETY STOP: V15 old IDs do not exactly match V14 oldSubCounty IDs."
    );
  }

  const v14TargetIds = v14Records
    .map((record: JsonObject) => Number(record.targetSubCountyId))
    .sort((a: number, b: number) => a - b);

  if (!sameNumberArray(v14TargetIds, targetSubCountyIds)) {
    throw new Error(
      "SAFETY STOP: V15 target IDs do not exactly match V14 targetSubCounty IDs."
    );
  }

  console.log("V15 ↔ V14 identity reconciliation: PASS");
  console.log("Exactly 122 old IDs and 122 target IDs verified.");
  console.log("");

  console.log("==============================================================");
  console.log("STEP 1 — LIVE DATABASE PRE-FLIGHT");
  console.log("==============================================================");

  const transactionResult = await prisma.$transaction(
    async (tx) => {
      const oldRecords = await tx.subCounty.findMany({
        where: {
          id: {
            in: oldSubCountyIds,
          },
        },
        select: {
          id: true,
          name: true,
          countyId: true,
        },
        orderBy: {
          id: "asc",
        },
      });

      console.log(
        `Old records found: ${oldRecords.length}`
      );

      if (oldRecords.length !== 122) {
        throw new Error(
          `SAFETY STOP: Expected 122 old records, found ${oldRecords.length}.`
        );
      }

      const liveOldIds = oldRecords
        .map((record) => record.id)
        .sort((a, b) => a - b);

      if (!sameNumberArray(liveOldIds, oldSubCountyIds)) {
        throw new Error(
          "SAFETY STOP: Live old IDs do not exactly match V15 approved IDs."
        );
      }

      console.log("Live old SubCounty IDs: PASS");

      console.log("");
      console.log("Checking old-record identities...");

      for (const oldRecord of oldRecords) {
        const v14 = v14ByOldId.get(oldRecord.id);

        if (!v14) {
          throw new Error(
            `SAFETY STOP: Missing V14 record for old SubCounty ${oldRecord.id}.`
          );
        }

        if (
          oldRecord.countyId !==
          Number(v14.countyId)
        ) {
          throw new Error(
            `SAFETY STOP: County mismatch for old SubCounty ${oldRecord.id}.`
          );
        }

        if (
          oldRecord.name !==
          String(v14.oldSubCountyName)
        ) {
          throw new Error(
            `SAFETY STOP: Name mismatch for old SubCounty ${oldRecord.id}.`
          );
        }
      }

      console.log("Old SubCounty identities: PASS");

      console.log("");
      console.log("Checking target records...");

      const targetRecords = await tx.subCounty.findMany({
        where: {
          id: {
            in: targetSubCountyIds,
          },
        },
        select: {
          id: true,
          name: true,
          countyId: true,
        },
        orderBy: {
          id: "asc",
        },
      });

      if (targetRecords.length !== 122) {
        throw new Error(
          `SAFETY STOP: Expected 122 target records, found ${targetRecords.length}.`
        );
      }

      const liveTargetIds = targetRecords
        .map((record) => record.id)
        .sort((a, b) => a - b);

      if (!sameNumberArray(liveTargetIds, targetSubCountyIds)) {
        throw new Error(
          "SAFETY STOP: Live target IDs do not exactly match V15 target IDs."
        );
      }

      for (const targetRecord of targetRecords) {
        const v14 = v14Records.find(
          (record: JsonObject) =>
            Number(record.targetSubCountyId) ===
            targetRecord.id
        );

        if (!v14) {
          throw new Error(
            `SAFETY STOP: Missing V14 record for target ${targetRecord.id}.`
          );
        }

        if (
          targetRecord.countyId !==
          Number(v14.countyId)
        ) {
          throw new Error(
            `SAFETY STOP: Target ${targetRecord.id} has wrong county.`
          );
        }

        if (
          targetRecord.name !==
          String(v14.targetSubCountyName)
        ) {
          throw new Error(
            `SAFETY STOP: Target ${targetRecord.id} has unexpected name.`
          );
        }
      }

      console.log("Target SubCounty identities: PASS");

      console.log("");
      console.log("==============================================================");
      console.log("STEP 2 — LIVE FOREIGN-KEY DEPENDENCY CHECK");
      console.log("==============================================================");

      const [
        wardReferences,
        farmerReferences,
        farmReferences,
        businessPartnerReferences,
        destinationTransactionReferences,
        sourceTransactionReferences,
      ] = await Promise.all([
        tx.ward.count({
          where: {
            subCountyId: {
              in: oldSubCountyIds,
            },
          },
        }),

        tx.farmer.count({
          where: {
            subCountyId: {
              in: oldSubCountyIds,
            },
          },
        }),

        tx.farm.count({
          where: {
            subCountyId: {
              in: oldSubCountyIds,
            },
          },
        }),

        tx.businessPartner.count({
          where: {
            subCountyId: {
              in: oldSubCountyIds,
            },
          },
        }),

        tx.commodityTransaction.count({
          where: {
            destinationSubCountyId: {
              in: oldSubCountyIds,
            },
          },
        }),

        tx.commodityTransaction.count({
          where: {
            sourceSubCountyId: {
              in: oldSubCountyIds,
            },
          },
        }),
      ]);

      console.log(
        `Ward.subCountyId references: ${wardReferences}`
      );
      console.log(
        `Farmer.subCountyId references: ${farmerReferences}`
      );
      console.log(
        `Farm.subCountyId references: ${farmReferences}`
      );
      console.log(
        `BusinessPartner.subCountyId references: ${businessPartnerReferences}`
      );
      console.log(
        `CommodityTransaction.destinationSubCountyId references: ${destinationTransactionReferences}`
      );
      console.log(
        `CommodityTransaction.sourceSubCountyId references: ${sourceTransactionReferences}`
      );

      if (
        wardReferences !== 0 ||
        farmerReferences !== 0 ||
        farmReferences !== 0 ||
        businessPartnerReferences !== 0 ||
        destinationTransactionReferences !== 0 ||
        sourceTransactionReferences !== 0
      ) {
        throw new Error(
          "SAFETY STOP: Foreign-key references exist against old SubCounty IDs."
        );
      }

      console.log("");
      console.log("ALL SIX FOREIGN-KEY RELATIONSHIPS: CLEAR");
      console.log("");

      console.log("==============================================================");
      console.log("STEP 3 — APPLICATION DEPENDENCY CHECK");
      console.log("==============================================================");

      const [
        oldWardCount,
        oldFarmerCount,
        oldFarmCount,
        oldBusinessPartnerCount,
      ] = await Promise.all([
        tx.ward.count({
          where: {
            subCountyId: {
              in: oldSubCountyIds,
            },
          },
        }),

        tx.farmer.count({
          where: {
            subCountyId: {
              in: oldSubCountyIds,
            },
          },
        }),

        tx.farm.count({
          where: {
            subCountyId: {
              in: oldSubCountyIds,
            },
          },
        }),

        tx.businessPartner.count({
          where: {
            subCountyId: {
              in: oldSubCountyIds,
            },
          },
        }),
      ]);

      console.log(`Wards: ${oldWardCount}`);
      console.log(`Farmers: ${oldFarmerCount}`);
      console.log(`Farms: ${oldFarmCount}`);
      console.log(
        `Business partners: ${oldBusinessPartnerCount}`
      );

      if (
        oldWardCount !== 0 ||
        oldFarmerCount !== 0 ||
        oldFarmCount !== 0 ||
        oldBusinessPartnerCount !== 0
      ) {
        throw new Error(
          "SAFETY STOP: Application dependencies exist."
        );
      }

      console.log("APPLICATION DEPENDENCY CHECK: PASS");
      console.log("");

      console.log("==============================================================");
      console.log("STEP 4 — WARD SNAPSHOT");
      console.log("==============================================================");

      const wardsBefore = await tx.ward.findMany({
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

      if (wardsBefore.length !== 1450) {
        throw new Error(
          `SAFETY STOP: Expected 1450 wards, found ${wardsBefore.length}.`
        );
      }

      const wardIdsBefore = wardsBefore.map(
        (ward) => ward.id
      );

      const sourceGidsBefore = wardsBefore.map(
        (ward) => normalizeSourceGid(ward.sourceGid)
      );

      if (new Set(wardIdsBefore).size !== 1450) {
        throw new Error(
          "SAFETY STOP: Duplicate ward IDs detected."
        );
      }

      if (new Set(sourceGidsBefore).size !== 1450) {
        throw new Error(
          "SAFETY STOP: Duplicate ward sourceGIDs detected."
        );
      }

      console.log("Wards before deletion: 1450");
      console.log("Unique ward IDs: 1450");
      console.log("Unique ward sourceGIDs: 1450");
      console.log("WARD SNAPSHOT: PASS");
      console.log("");

      console.log("==============================================================");
      console.log("STEP 5 — CONTROLLED DELETION");
      console.log("==============================================================");

      console.log(
        "Deleting ONLY the 122 V15-approved old SubCounty records..."
      );

      const deleteResult = await tx.subCounty.deleteMany({
        where: {
          id: {
            in: oldSubCountyIds,
          },
        },
      });

      console.log(
        `Records deleted: ${deleteResult.count}`
      );

      if (deleteResult.count !== 122) {
        throw new Error(
          `SAFETY STOP: Expected exactly 122 deletions, got ${deleteResult.count}.`
        );
      }

      console.log("DELETE COUNT: PASS");
      console.log("");

      console.log("==============================================================");
      console.log("STEP 6 — IN-TRANSACTION VERIFICATION");
      console.log("==============================================================");

      const oldRecordsRemaining =
        await tx.subCounty.count({
          where: {
            id: {
              in: oldSubCountyIds,
            },
          },
        });

      if (oldRecordsRemaining !== 0) {
        throw new Error(
          `SAFETY STOP: ${oldRecordsRemaining} deleted records still exist.`
        );
      }

      console.log("Deleted old records remaining: 0");

      const targetsRemaining =
        await tx.subCounty.count({
          where: {
            id: {
              in: targetSubCountyIds,
            },
          },
        });

      if (targetsRemaining !== 122) {
        throw new Error(
          `SAFETY STOP: Expected 122 target records, found ${targetsRemaining}.`
        );
      }

      console.log("Target records preserved: 122");

      const wardsAfter = await tx.ward.findMany({
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

      if (wardsAfter.length !== 1450) {
        throw new Error(
          `SAFETY STOP: Ward count changed to ${wardsAfter.length}.`
        );
      }

      const wardIdsAfter = wardsAfter.map(
        (ward) => ward.id
      );

      const sourceGidsAfter = wardsAfter.map(
        (ward) => normalizeSourceGid(ward.sourceGid)
      );

      if (
        !sameNumberArray(
          wardIdsBefore,
          wardIdsAfter
        )
      ) {
        throw new Error(
          "SAFETY STOP: Ward IDs changed."
        );
      }

      if (
        JSON.stringify(sourceGidsBefore) !==
        JSON.stringify(sourceGidsAfter)
      ) {
        throw new Error(
          "SAFETY STOP: Ward sourceGIDs changed."
        );
      }

      console.log("Wards preserved: 1450");
      console.log("Ward IDs unchanged: PASS");
      console.log("Ward sourceGIDs unchanged: PASS");

      const oldWardReferencesAfter =
        await tx.ward.count({
          where: {
            subCountyId: {
              in: oldSubCountyIds,
            },
          },
        });

      if (oldWardReferencesAfter !== 0) {
        throw new Error(
          `SAFETY STOP: ${oldWardReferencesAfter} wards reference deleted IDs.`
        );
      }

      const oldFarmerReferencesAfter =
        await tx.farmer.count({
          where: {
            subCountyId: {
              in: oldSubCountyIds,
            },
          },
        });

      const oldFarmReferencesAfter =
        await tx.farm.count({
          where: {
            subCountyId: {
              in: oldSubCountyIds,
            },
          },
        });

      const oldBusinessPartnerReferencesAfter =
        await tx.businessPartner.count({
          where: {
            subCountyId: {
              in: oldSubCountyIds,
            },
          },
        });

      const oldDestinationReferencesAfter =
        await tx.commodityTransaction.count({
          where: {
            destinationSubCountyId: {
              in: oldSubCountyIds,
            },
          },
        });

      const oldSourceReferencesAfter =
        await tx.commodityTransaction.count({
          where: {
            sourceSubCountyId: {
              in: oldSubCountyIds,
            },
          },
        });

      if (
        oldFarmerReferencesAfter !== 0 ||
        oldFarmReferencesAfter !== 0 ||
        oldBusinessPartnerReferencesAfter !== 0 ||
        oldDestinationReferencesAfter !== 0 ||
        oldSourceReferencesAfter !== 0
      ) {
        throw new Error(
          "SAFETY STOP: Application references appeared after deletion."
        );
      }

      console.log("All six FK relationships after deletion: CLEAR");
      console.log("");

      console.log("==============================================================");
      console.log("STEP 7 — TRANSACTION COMMIT GATE");
      console.log("==============================================================");

      console.log("Old records deleted: 122");
      console.log("Old records remaining: 0");
      console.log("Target records preserved: 122");
      console.log("Wards preserved: 1450");
      console.log("Ward sourceGIDs preserved: 1450");
      console.log("Foreign-key references to deleted IDs: 0");
      console.log("");
      console.log("TRANSACTION VERIFICATION: PASS");
      console.log("Transaction is now committing.");

      return {
        deletedIds: oldSubCountyIds,
        targetIds: targetSubCountyIds,
        deletedCount: deleteResult.count,
        wardCountBefore: wardsBefore.length,
        wardCountAfter: wardsAfter.length,
        sourceGidCountBefore: sourceGidsBefore.length,
        sourceGidCountAfter: sourceGidsAfter.length,
      };
    },
    {
      maxWait: 30000,
      timeout: 120000,
    }
  );

  console.log("");
  console.log("==============================================================");
  console.log("STEP 8 — POST-COMMIT VERIFICATION");
  console.log("==============================================================");

  const deletedRecordsAfterCommit =
    await prisma.subCounty.count({
      where: {
        id: {
          in: transactionResult.deletedIds,
        },
      },
    });

  if (deletedRecordsAfterCommit !== 0) {
    throw new Error(
      `POST-COMMIT FAILURE: ${deletedRecordsAfterCommit} deleted records still exist.`
    );
  }

  console.log("Deleted old records remaining: 0");

  const targetsAfterCommit =
    await prisma.subCounty.count({
      where: {
        id: {
          in: transactionResult.targetIds,
        },
      },
    });

  if (targetsAfterCommit !== 122) {
    throw new Error(
      `POST-COMMIT FAILURE: Expected 122 targets, found ${targetsAfterCommit}.`
    );
  }

  console.log("Target records preserved: 122");

  const wardsAfterCommit =
    await prisma.ward.findMany({
      select: {
        id: true,
        sourceGid: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  if (wardsAfterCommit.length !== 1450) {
    throw new Error(
      `POST-COMMIT FAILURE: Expected 1450 wards, found ${wardsAfterCommit.length}.`
    );
  }

  const sourceGidsAfterCommit =
    wardsAfterCommit.map((ward) =>
      normalizeSourceGid(ward.sourceGid)
    );

  if (
    new Set(sourceGidsAfterCommit).size !== 1450
  ) {
    throw new Error(
      "POST-COMMIT FAILURE: Ward sourceGID uniqueness was lost."
    );
  }

  console.log("Wards preserved: 1450");
  console.log("Unique ward sourceGIDs: 1450");

  const [
    finalWardReferences,
    finalFarmerReferences,
    finalFarmReferences,
    finalBusinessPartnerReferences,
    finalDestinationReferences,
    finalSourceReferences,
  ] = await Promise.all([
    prisma.ward.count({
      where: {
        subCountyId: {
          in: transactionResult.deletedIds,
        },
      },
    }),

    prisma.farmer.count({
      where: {
        subCountyId: {
          in: transactionResult.deletedIds,
        },
      },
    }),

    prisma.farm.count({
      where: {
        subCountyId: {
          in: transactionResult.deletedIds,
        },
      },
    }),

    prisma.businessPartner.count({
      where: {
        subCountyId: {
          in: transactionResult.deletedIds,
        },
      },
    }),

    prisma.commodityTransaction.count({
      where: {
        destinationSubCountyId: {
          in: transactionResult.deletedIds,
        },
      },
    }),

    prisma.commodityTransaction.count({
      where: {
        sourceSubCountyId: {
          in: transactionResult.deletedIds,
        },
      },
    }),
  ]);

  if (
    finalWardReferences !== 0 ||
    finalFarmerReferences !== 0 ||
    finalFarmReferences !== 0 ||
    finalBusinessPartnerReferences !== 0 ||
    finalDestinationReferences !== 0 ||
    finalSourceReferences !== 0
  ) {
    throw new Error(
      "POST-COMMIT FAILURE: Foreign-key references to deleted IDs exist."
    );
  }

  console.log("Ward references to deleted IDs: 0");
  console.log("Farmer references to deleted IDs: 0");
  console.log("Farm references to deleted IDs: 0");
  console.log(
    "BusinessPartner references to deleted IDs: 0"
  );
  console.log(
    "CommodityTransaction destination references: 0"
  );
  console.log(
    "CommodityTransaction source references: 0"
  );

  console.log("");
  console.log("==============================================================");
  console.log("V15 CONTROLLED DELETION COMPLETE");
  console.log("==============================================================");
  console.log("");
  console.log(
    `SubCounty records deleted: ${transactionResult.deletedCount}`
  );
  console.log("Old SubCounty records remaining: 0");
  console.log("Canonical target records preserved: 122");
  console.log("Wards preserved: 1450");
  console.log("Ward sourceGIDs preserved: 1450");
  console.log("Farmers changed: 0");
  console.log("Farms changed: 0");
  console.log("Business partners changed: 0");
  console.log("Commodity transactions changed: 0");
  console.log("");
  console.log("V15 FINAL STATUS: PASS");

  const deletionLog = {
    audit: "V15 CONTROLLED SUBCOUNTY DELETION",
    generatedAt: new Date().toISOString(),
    status: "PASS",

    sourceAudit:
      "prisma/data/pre-delete-audit-v15.json",

    sourceMigrationLog:
      "prisma/data/consolidation-migration-v14.json",

    deletedSubCountyCount:
      transactionResult.deletedCount,

    deletedSubCountyIds:
      [...transactionResult.deletedIds].sort(
        (a, b) => a - b
      ),

    preservedTargetSubCountyCount:
      transactionResult.targetIds.length,

    preservedTargetSubCountyIds:
      [...transactionResult.targetIds].sort(
        (a, b) => a - b
      ),

    wardsBefore:
      transactionResult.wardCountBefore,

    wardsAfter:
      transactionResult.wardCountAfter,

    sourceGidsBefore:
      transactionResult.sourceGidCountBefore,

    sourceGidsAfter:
      transactionResult.sourceGidCountAfter,

    foreignKeyReferencesAfterDeletion: {
      Ward_subCountyId:
        finalWardReferences,

      Farmer_subCountyId:
        finalFarmerReferences,

      Farm_subCountyId:
        finalFarmReferences,

      BusinessPartner_subCountyId:
        finalBusinessPartnerReferences,

      CommodityTransaction_destinationSubCountyId:
        finalDestinationReferences,

      CommodityTransaction_sourceSubCountyId:
        finalSourceReferences,
    },

    verification: {
      oldRecordsGone:
        deletedRecordsAfterCommit === 0,

      targetRecordsPreserved:
        targetsAfterCommit === 122,

      wardsPreserved:
        wardsAfterCommit.length === 1450,

      sourceGidsPreserved:
        new Set(sourceGidsAfterCommit).size === 1450,

      allForeignKeysClear:
        finalWardReferences === 0 &&
        finalFarmerReferences === 0 &&
        finalFarmReferences === 0 &&
        finalBusinessPartnerReferences === 0 &&
        finalDestinationReferences === 0 &&
        finalSourceReferences === 0,
    },
  };

  fs.writeFileSync(
    DELETION_LOG_PATH,
    JSON.stringify(
      deletionLog,
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log(
    `JSON LOG: ${DELETION_LOG_PATH}`
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("==============================================");
    console.error("V15 CONTROLLED DELETION FAILED");
    console.error("==============================================");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });