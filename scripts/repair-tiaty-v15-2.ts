import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import fs from "fs";
import path from "path";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const SOURCE_SUBCOUNTY_ID = 463;
const TARGET_SUBCOUNTY_ID = 757;

const EXPECTED_SOURCE_GIDS = [
  781,
  782,
  783,
  784,
  785,
  786,
  787,
];

const EXPECTED_WARD_NAMES = [
  "Tirioko Ward",
  "Kolowa Ward",
  "Ribkwo Ward",
  "Silale Ward",
  "Loiyamorok Ward",
  "Tangulbei/korossi Ward",
  "Churo/amaya Ward",
];

function fail(message: string): never {
  throw new Error(`SAFETY GATE FAILED: ${message}`);
}

function sortedNumbers(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

function arraysEqual(a: number[], b: number[]): boolean {
  const aa = sortedNumbers(a);
  const bb = sortedNumbers(b);

  return (
    aa.length === bb.length &&
    aa.every((value, index) => value === bb[index])
  );
}

async function main() {
  console.log("==============================================");
  console.log("V15.2 CONTROLLED TIATY WARD REASSIGNMENT");
  console.log("==============================================");
  console.log("");
  console.log("READ/WRITE MIGRATION");
  console.log("Target operation: Ward.subCountyId 463 -> 757");
  console.log("Expected wards: 7");
  console.log("");

  /*
   * STEP 0
   * Verify both SubCounty records exist.
   */
  console.log("STEP 0 — SUBCOUNTY PRE-FLIGHT");

  const sourceSubCounty = await prisma.subCounty.findUnique({
    where: {
      id: SOURCE_SUBCOUNTY_ID,
    },
  });

  const targetSubCounty = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_SUBCOUNTY_ID,
    },
  });

  if (!sourceSubCounty) {
    fail(`Source SubCounty ${SOURCE_SUBCOUNTY_ID} does not exist.`);
  }

  if (!targetSubCounty) {
    fail(`Target SubCounty ${TARGET_SUBCOUNTY_ID} does not exist.`);
  }

  console.log(
    `Source: ${sourceSubCounty.id} | ${sourceSubCounty.name} | countyId=${sourceSubCounty.countyId}`,
  );

  console.log(
    `Target: ${targetSubCounty.id} | ${targetSubCounty.name} | countyId=${targetSubCounty.countyId}`,
  );

  if (sourceSubCounty.countyId !== targetSubCounty.countyId) {
    fail(
      `Source county ${sourceSubCounty.countyId} differs from target county ${targetSubCounty.countyId}.`,
    );
  }

  console.log("Source/target county relationship: PASS");
  console.log("");

  /*
   * STEP 1
   * Load the authoritative seven wards.
   */
  console.log("STEP 1 — AUTHORITATIVE WARD PRE-FLIGHT");

  const wards = await prisma.ward.findMany({
    where: {
      sourceGid: {
        in: EXPECTED_SOURCE_GIDS,
      },
    },
    orderBy: {
      sourceGid: "asc",
    },
  });

  console.log(`Rows found by sourceGID: ${wards.length}`);

  if (wards.length !== EXPECTED_SOURCE_GIDS.length) {
    fail(
      `Expected ${EXPECTED_SOURCE_GIDS.length} authoritative wards but found ${wards.length}.`,
    );
  }

  const actualGids = wards.map((ward) => ward.sourceGid);

  if (!arraysEqual(actualGids, EXPECTED_SOURCE_GIDS)) {
    fail(
      `Authoritative sourceGID set mismatch. Found: ${actualGids.join(", ")}`,
    );
  }

  console.log("Authoritative sourceGID set: PASS");

  /*
   * STEP 2
   * Verify every authoritative ward currently belongs to 463.
   */
  console.log("");
  console.log("STEP 2 — CURRENT FOREIGN-KEY OWNERSHIP CHECK");

  const wrongCurrentOwner = wards.filter(
    (ward) => ward.subCountyId !== SOURCE_SUBCOUNTY_ID,
  );

  if (wrongCurrentOwner.length > 0) {
    console.log("Unexpected current ownership:");

    for (const ward of wrongCurrentOwner) {
      console.log(
        `  GID ${ward.sourceGid} | ${ward.name} | subCountyId=${ward.subCountyId}`,
      );
    }

    fail(
      `${wrongCurrentOwner.length} authoritative wards are not currently owned by SubCounty ${SOURCE_SUBCOUNTY_ID}.`,
    );
  }

  console.log(
    `All ${EXPECTED_SOURCE_GIDS.length} wards currently reference SubCounty ${SOURCE_SUBCOUNTY_ID}: PASS`,
  );

  /*
   * STEP 3
   * Verify ward names against the authoritative expected set.
   */
  console.log("");
  console.log("STEP 3 — WARD IDENTITY CHECK");

  const actualNames = wards.map((ward) => ward.name);

  console.log("Current authoritative wards:");

  for (const ward of wards) {
    console.log(
      `  GID ${ward.sourceGid} | DB ID ${ward.id} | ${ward.name} | countyId=${ward.countyId} | subCountyId=${ward.subCountyId}`,
    );
  }

  const normalizedActualNames = actualNames
    .map((name) => name.trim().toLowerCase())
    .sort();

  const normalizedExpectedNames = EXPECTED_WARD_NAMES
    .map((name) => name.trim().toLowerCase())
    .sort();

  if (
    normalizedActualNames.length !== normalizedExpectedNames.length ||
    normalizedActualNames.some(
      (name, index) => name !== normalizedExpectedNames[index],
    )
  ) {
    fail(
      `Ward name identity mismatch. Actual: ${actualNames.join(
        ", ",
      )}`,
    );
  }

  console.log("Ward identity set: PASS");

  /*
   * STEP 4
   * Verify county ownership.
   */
  console.log("");
  console.log("STEP 4 — COUNTY INTEGRITY CHECK");

  const countyMismatch = wards.filter(
    (ward) => ward.countyId !== sourceSubCounty.countyId,
  );

  if (countyMismatch.length > 0) {
    fail(
      `${countyMismatch.length} wards have a countyId inconsistent with the SubCounty.`,
    );
  }

  const targetCountyMismatch = wards.filter(
    (ward) => ward.countyId !== targetSubCounty.countyId,
  );

  if (targetCountyMismatch.length > 0) {
    fail(
      `${targetCountyMismatch.length} wards do not belong to the target SubCounty's county.`,
    );
  }

  console.log("Ward -> County integrity: PASS");
  console.log("");

  /*
   * STEP 5
   * Verify there are exactly seven wards currently attached
   * to the source SubCounty.
   *
   * This is important: we do NOT want to accidentally move
   * additional wards belonging to 463.
   */
  console.log("STEP 5 — SOURCE SUBCOUNTY CARDINALITY CHECK");

  const sourceWardCount = await prisma.ward.count({
    where: {
      subCountyId: SOURCE_SUBCOUNTY_ID,
    },
  });

  console.log(`All wards currently owned by ${SOURCE_SUBCOUNTY_ID}: ${sourceWardCount}`);

  if (sourceWardCount !== EXPECTED_SOURCE_GIDS.length) {
    fail(
      `Source SubCounty ${SOURCE_SUBCOUNTY_ID} owns ${sourceWardCount} wards, expected exactly ${EXPECTED_SOURCE_GIDS.length}.`,
    );
  }

  const sourceWardIds = wards.map((ward) => ward.id).sort((a, b) => a - b);

  const allSourceWards = await prisma.ward.findMany({
    where: {
      subCountyId: SOURCE_SUBCOUNTY_ID,
    },
    select: {
      id: true,
      sourceGid: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const allSourceGids = allSourceWards.map((ward) => ward.sourceGid);

  if (!arraysEqual(allSourceGids, EXPECTED_SOURCE_GIDS)) {
    fail(
      `Source SubCounty ${SOURCE_SUBCOUNTY_ID} contains unexpected sourceGIDs: ${allSourceGids.join(
        ", ",
      )}`,
    );
  }

  console.log("Source SubCounty contains exactly the seven expected wards: PASS");

  /*
   * STEP 6
   * Verify target does not already own any of the seven.
   */
  console.log("");
  console.log("STEP 6 — TARGET PRECONDITION CHECK");

  const targetExistingExpectedWards = await prisma.ward.count({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
      sourceGid: {
        in: EXPECTED_SOURCE_GIDS,
      },
    },
  });

  if (targetExistingExpectedWards !== 0) {
    fail(
      `Target SubCounty already owns ${targetExistingExpectedWards} of the seven authoritative wards.`,
    );
  }

  const targetWardCountBefore = await prisma.ward.count({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
    },
  });

  console.log(
    `Target SubCounty ${TARGET_SUBCOUNTY_ID} current ward count: ${targetWardCountBefore}`,
  );

  console.log("Target precondition: PASS");
  console.log("");

  /*
   * STEP 7
   * Snapshot immutable columns.
   */
  console.log("STEP 7 — IMMUTABLE WARD SNAPSHOT");

  const snapshot = wards.map((ward) => ({
    id: ward.id,
    sourceGid: ward.sourceGid,
    countyId: ward.countyId,
    name: ward.name,
  }));

  console.log(`Snapshot rows: ${snapshot.length}`);
  console.log("Immutable ward snapshot: PASS");
  console.log("");

  /*
   * STEP 8
   * Transactional UPDATE.
   */
  console.log("STEP 8 — CONTROLLED TRANSACTION");
  console.log("");
  console.log(
    `Updating ONLY ${EXPECTED_SOURCE_GIDS.length} wards from subCountyId ${SOURCE_SUBCOUNTY_ID} to ${TARGET_SUBCOUNTY_ID}...`,
  );

  const transactionResult = await prisma.$transaction(async (tx) => {
    const liveBefore = await tx.ward.findMany({
      where: {
        sourceGid: {
          in: EXPECTED_SOURCE_GIDS,
        },
      },
      orderBy: {
        sourceGid: "asc",
      },
    });

    if (liveBefore.length !== EXPECTED_SOURCE_GIDS.length) {
      fail(
        `Transaction preflight found ${liveBefore.length} wards instead of ${EXPECTED_SOURCE_GIDS.length}.`,
      );
    }

    for (const ward of liveBefore) {
      if (ward.subCountyId !== SOURCE_SUBCOUNTY_ID) {
        fail(
          `GID ${ward.sourceGid} changed ownership before UPDATE. Current=${ward.subCountyId}.`,
        );
      }

      if (ward.countyId !== sourceSubCounty!.countyId) {
        fail(
          `GID ${ward.sourceGid} has unexpected countyId ${ward.countyId}.`,
        );
      }
    }

    const updateResult = await tx.ward.updateMany({
      where: {
        subCountyId: SOURCE_SUBCOUNTY_ID,
        sourceGid: {
          in: EXPECTED_SOURCE_GIDS,
        },
      },
      data: {
        subCountyId: TARGET_SUBCOUNTY_ID,
      },
    });

    console.log(`UPDATE affected rows: ${updateResult.count}`);

    if (updateResult.count !== EXPECTED_SOURCE_GIDS.length) {
      fail(
        `UPDATE affected ${updateResult.count} rows; expected exactly ${EXPECTED_SOURCE_GIDS.length}.`,
      );
    }

    const afterUpdate = await tx.ward.findMany({
      where: {
        sourceGid: {
          in: EXPECTED_SOURCE_GIDS,
        },
      },
      orderBy: {
        sourceGid: "asc",
      },
    });

    if (afterUpdate.length !== EXPECTED_SOURCE_GIDS.length) {
      fail(
        `Post-UPDATE row count is ${afterUpdate.length}; expected ${EXPECTED_SOURCE_GIDS.length}.`,
      );
    }

    for (const ward of afterUpdate) {
      if (ward.subCountyId !== TARGET_SUBCOUNTY_ID) {
        fail(
          `GID ${ward.sourceGid} was not reassigned to target ${TARGET_SUBCOUNTY_ID}.`,
        );
      }
    }

    const afterUpdateIds = afterUpdate.map((ward) => ward.id).sort((a, b) => a - b);
    const snapshotIds = snapshot.map((ward) => ward.id).sort((a, b) => a - b);

    if (!arraysEqual(afterUpdateIds, snapshotIds)) {
      fail("Ward primary keys changed during the migration.");
    }

    for (const before of snapshot) {
      const after = afterUpdate.find((ward) => ward.id === before.id);

      if (!after) {
        fail(`Ward ID ${before.id} disappeared during migration.`);
      }

      if (after.sourceGid !== before.sourceGid) {
        fail(`Ward ID ${before.id} sourceGid changed.`);
      }

      if (after.countyId !== before.countyId) {
        fail(`Ward ID ${before.id} countyId changed.`);
      }

      if (after.name !== before.name) {
        fail(`Ward ID ${before.id} name changed.`);
      }
    }

    const oldRemaining = await tx.ward.count({
      where: {
        subCountyId: SOURCE_SUBCOUNTY_ID,
      },
    });

    if (oldRemaining !== 0) {
      fail(
        `Source SubCounty still owns ${oldRemaining} wards inside transaction.`,
      );
    }

    const targetExpectedCount = await tx.ward.count({
      where: {
        subCountyId: TARGET_SUBCOUNTY_ID,
        sourceGid: {
          in: EXPECTED_SOURCE_GIDS,
        },
      },
    });

    if (targetExpectedCount !== EXPECTED_SOURCE_GIDS.length) {
      fail(
        `Target owns ${targetExpectedCount} expected wards; expected ${EXPECTED_SOURCE_GIDS.length}.`,
      );
    }

    const sourceGidCount = await tx.ward.count({
      where: {
        sourceGid: {
          in: EXPECTED_SOURCE_GIDS,
        },
        subCountyId: TARGET_SUBCOUNTY_ID,
      },
    });

    if (sourceGidCount !== EXPECTED_SOURCE_GIDS.length) {
      fail(
        `Only ${sourceGidCount} expected sourceGIDs point to target.`,
      );
    }

    return {
      updateCount: updateResult.count,
      oldRemaining,
      targetExpectedCount,
      snapshotRows: snapshot.length,
    };
  });

  console.log("");
  console.log("TRANSACTION VERIFICATION: PASS");
  console.log(`Rows reassigned: ${transactionResult.updateCount}`);
  console.log(`Source wards remaining: ${transactionResult.oldRemaining}`);
  console.log(
    `Expected wards now at target: ${transactionResult.targetExpectedCount}`,
  );
  console.log("Immutable ward attributes preserved: PASS");
  console.log("Transaction is now committed.");
  console.log("");

  /*
   * STEP 9
   * Post-commit verification.
   */
  console.log("STEP 9 — POST-COMMIT VERIFICATION");

  const sourceAfter = await prisma.ward.count({
    where: {
      subCountyId: SOURCE_SUBCOUNTY_ID,
    },
  });

  const targetAfter = await prisma.ward.count({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
    },
  });

  const repairedRows = await prisma.ward.findMany({
    where: {
      sourceGid: {
        in: EXPECTED_SOURCE_GIDS,
      },
    },
    orderBy: {
      sourceGid: "asc",
    },
  });

  if (sourceAfter !== 0) {
    fail(`Post-commit source SubCounty still owns ${sourceAfter} wards.`);
  }

  if (repairedRows.length !== EXPECTED_SOURCE_GIDS.length) {
    fail(
      `Post-commit repaired row count is ${repairedRows.length}; expected ${EXPECTED_SOURCE_GIDS.length}.`,
    );
  }

  for (const ward of repairedRows) {
    if (ward.subCountyId !== TARGET_SUBCOUNTY_ID) {
      fail(
        `Post-commit GID ${ward.sourceGid} has subCountyId ${ward.subCountyId}.`,
      );
    }

    if (ward.countyId !== targetSubCounty.countyId) {
      fail(
        `Post-commit GID ${ward.sourceGid} has countyId ${ward.countyId}.`,
      );
    }
  }

  const totalWardCount = await prisma.ward.count();

  const uniqueSourceGids = await prisma.ward.findMany({
    select: {
      sourceGid: true,
    },
    distinct: ["sourceGid"],
  });

  if (totalWardCount !== 1450) {
    fail(`Total Ward count changed to ${totalWardCount}; expected 1450.`);
  }

  if (uniqueSourceGids.length !== 1450) {
    fail(
      `Unique sourceGID count changed to ${uniqueSourceGids.length}; expected 1450.`,
    );
  }

  console.log(`Source SubCounty ${SOURCE_SUBCOUNTY_ID} wards: ${sourceAfter}`);
  console.log(`Target SubCounty ${TARGET_SUBCOUNTY_ID} wards: ${targetAfter}`);
  console.log(`Repaired authoritative wards: ${repairedRows.length}`);
  console.log(`Total wards: ${totalWardCount}`);
  console.log(`Unique sourceGIDs: ${uniqueSourceGids.length}`);

  /*
   * STEP 10
   * Write migration log.
   */
  const output = {
    generatedAt: new Date().toISOString(),
    mode: "CONTROLLED_TIATY_WARD_REASSIGNMENT",
    status: "PASS",
    sourceSubCountyId: SOURCE_SUBCOUNTY_ID,
    sourceSubCountyName: sourceSubCounty.name,
    targetSubCountyId: TARGET_SUBCOUNTY_ID,
    targetSubCountyName: targetSubCounty.name,
    countyId: targetSubCounty.countyId,
    affectedSourceGids: EXPECTED_SOURCE_GIDS,
    affectedWardCount: repairedRows.length,
    sourceWardCountAfter: sourceAfter,
    targetWardCountAfter: targetAfter,
    totalWardCountAfter: totalWardCount,
    uniqueSourceGidsAfter: uniqueSourceGids.length,
    immutableFieldsPreserved: true,
    transactionVerified: true,
  };

  const outputPath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "tiaty-reassignment-v15-2.json",
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(output, null, 2),
    "utf8",
  );

  console.log("");
  console.log("==============================================");
  console.log("V15.2 CONTROLLED TIATY MIGRATION COMPLETE");
  console.log("==============================================");
  console.log("");
  console.log(`Source SubCounty: ${SOURCE_SUBCOUNTY_ID}`);
  console.log(`Target SubCounty: ${TARGET_SUBCOUNTY_ID}`);
  console.log(`Wards reassigned: ${repairedRows.length}`);
  console.log(`Source wards remaining: ${sourceAfter}`);
  console.log(`Target wards after migration: ${targetAfter}`);
  console.log(`Total wards: ${totalWardCount}`);
  console.log(`Unique sourceGIDs: ${uniqueSourceGids.length}`);
  console.log("Immutable fields preserved: YES");
  console.log("Transaction verification: PASS");
  console.log("Post-commit verification: PASS");
  console.log("");
  console.log(`JSON LOG: ${outputPath}`);
  console.log("");
  console.log("V15.2 FINAL STATUS: PASS");
}

main()
  .catch((error) => {
    console.error("");
    console.error("==============================================");
    console.error("V15.2 MIGRATION FAILED / ROLLED BACK");
    console.error("==============================================");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });