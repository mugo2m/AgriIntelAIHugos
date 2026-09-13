import "dotenv/config";
import { readFileSync } from "fs";
import { resolve } from "path";
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

const AUDIT_FILE = resolve(
  process.cwd(),
  "prisma/data/subcounty-consolidation-v10.json",
);

const EXPECTED_COUNTIES = 47;
const EXPECTED_WARDS = 1450;

type SafeMigration = {
  county: string;
  sourceId: number;
  sourceName: string;
  targetId: number;
  targetName: string;
  wardCount: number;
  wardIds: number[];
  sourceGids: number[];
  unresolvedWards: number;
  directRelations: {
    farmers: number;
    farms: number;
    businessPartners: number;
    destinationTransactions: number;
    sourceTransactions: number;
  };
  status: string;
  reason: string;
};

type V10Audit = {
  audit: string;
  readOnly: boolean;
  generatedAt: string;
  database: {
    counties: number;
    subCounties: number;
    wards: number;
  };
  authoritative: {
    canonicalSubCounties: number;
    wardFeatures: number;
    authoritativeGids: number;
  };
  resolution: {
    canonicalResolved: number;
    canonicalUnresolved: number;
    canonicalAmbiguous: number;
    databaseWardsAssigned: number;
    databaseWardsUnmatched: number;
  };
  summary: {
    populatedSubCounties: number;
    safeMigrations: number;
    blockedByRelations: number;
    alreadyCanonical: number;
    manualReview: number;
    wardsInSafeMigrations: number;
    wardsInBlockedRecords: number;
    wardsInCanonicalRecords: number;
    wardsRequiringReview: number;
  };
  safeMigrations: SafeMigration[];
};

function sortNumbers(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

function sameNumberSet(
  a: number[],
  b: number[],
): boolean {
  const aa = sortNumbers(a);
  const bb = sortNumbers(b);

  if (aa.length !== bb.length) {
    return false;
  }

  return aa.every(
    (value, index) =>
      value === bb[index],
  );
}

function formatNumbers(values: number[]): string {
  return sortNumbers(values).join(", ");
}

function loadV10Audit(): V10Audit {
  console.log("");
  console.log(
    "Reading V10 audit file:",
  );
  console.log(AUDIT_FILE);

  const raw = readFileSync(
    AUDIT_FILE,
    "utf8",
  );

  const audit =
    JSON.parse(raw) as V10Audit;

  if (
    audit.audit !== "V10"
  ) {
    throw new Error(
      `Expected V10 audit file, found: ${audit.audit}`,
    );
  }

  if (
    !Array.isArray(
      audit.safeMigrations,
    )
  ) {
    throw new Error(
      "V10 audit does not contain safeMigrations array.",
    );
  }

  return audit;
}

async function checkDatabaseBaseline(
  audit: V10Audit,
): Promise<void> {
  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "DATABASE BASELINE CHECK",
  );
  console.log(
    "============================================================");

  const countyCount =
    await prisma.county.count();

  const subCountyCount =
    await prisma.subCounty.count();

  const wardCount =
    await prisma.ward.count();

  console.log(
    `V10 recorded counties:     ${audit.database.counties}`,
  );

  console.log(
    `Current database counties: ${countyCount}`,
  );

  console.log(
    `V10 recorded SubCounties:  ${audit.database.subCounties}`,
  );

  console.log(
    `Current database SubCounties: ${subCountyCount}`,
  );

  console.log(
    `V10 recorded wards:        ${audit.database.wards}`,
  );

  console.log(
    `Current database wards:    ${wardCount}`,
  );

  if (
    countyCount !==
    EXPECTED_COUNTIES
  ) {
    throw new Error(
      `COUNTY BASELINE FAILED: expected ${EXPECTED_COUNTIES}, got ${countyCount}`,
    );
  }

  if (
    wardCount !==
    EXPECTED_WARDS
  ) {
    throw new Error(
      `WARD BASELINE FAILED: expected ${EXPECTED_WARDS}, got ${wardCount}`,
    );
  }

  console.log(
    "BASELINE: PASS",
  );
}

async function validateMigration(
  migration: SafeMigration,
): Promise<void> {
  console.log("");
  console.log(
    "------------------------------------------------------------",
  );

  console.log(
    `${migration.county}: ` +
      `${migration.sourceId} ${migration.sourceName} → ` +
      `${migration.targetId} ${migration.targetName}`,
  );

  console.log(
    "------------------------------------------------------------",
  );

  /*
   * ----------------------------------------------------------
   * V10 INTERNAL CHECKS
   * ----------------------------------------------------------
   */

  if (
    migration.status !==
    "SAFE_CANDIDATE"
  ) {
    throw new Error(
      `V10 STATUS IS NOT SAFE_CANDIDATE for ${migration.sourceId}. ` +
        `Found: ${migration.status}`,
    );
  }

  if (
    migration.unresolvedWards !== 0
  ) {
    throw new Error(
      `V10 says ${migration.sourceId} has unresolved wards.`,
    );
  }

  const v10Relations =
    migration.directRelations;

  if (
    v10Relations.farmers !== 0 ||
    v10Relations.farms !== 0 ||
    v10Relations.businessPartners !== 0 ||
    v10Relations.destinationTransactions !== 0 ||
    v10Relations.sourceTransactions !== 0
  ) {
    throw new Error(
      `V10 relation check is not zero for ${migration.sourceId}.`,
    );
  }

  if (
    migration.wardCount !==
    migration.sourceGids.length
  ) {
    throw new Error(
      `V10 wardCount/GID count mismatch for ${migration.sourceId}.`,
    );
  }

  if (
    migration.wardCount !==
    migration.wardIds.length
  ) {
    throw new Error(
      `V10 wardCount/wardIds count mismatch for ${migration.sourceId}.`,
    );
  }

  /*
   * ----------------------------------------------------------
   * SOURCE
   * ----------------------------------------------------------
   */

  const source =
    await prisma.subCounty.findUnique({
      where: {
        id: migration.sourceId,
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
      `SOURCE NOT FOUND: ${migration.sourceId} ${migration.sourceName}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * TARGET
   * ----------------------------------------------------------
   */

  const target =
    await prisma.subCounty.findUnique({
      where: {
        id: migration.targetId,
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

  if (!target) {
    throw new Error(
      `TARGET NOT FOUND: ${migration.targetId} ${migration.targetName}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * NAME CHECK
   * ----------------------------------------------------------
   */

  if (
    source.name !==
    migration.sourceName
  ) {
    throw new Error(
      `SOURCE NAME MISMATCH for ID ${source.id}.\n` +
        `V10: ${migration.sourceName}\n` +
        `DB:  ${source.name}`,
    );
  }

  if (
    target.name !==
    migration.targetName
  ) {
    throw new Error(
      `TARGET NAME MISMATCH for ID ${target.id}.\n` +
        `V10: ${migration.targetName}\n` +
        `DB:  ${target.name}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * COUNTY CHECK
   * ----------------------------------------------------------
   */

  if (
    source.countyId !==
    target.countyId
  ) {
    throw new Error(
      `COUNTY ID MISMATCH: source=${source.countyId}, target=${target.countyId}`,
    );
  }

  if (
    source.county.name !==
    migration.county
  ) {
    throw new Error(
      `SOURCE COUNTY NAME MISMATCH.\n` +
        `V10: ${migration.county}\n` +
        `DB:  ${source.county.name}`,
    );
  }

  if (
    target.county.name !==
    migration.county
  ) {
    throw new Error(
      `TARGET COUNTY NAME MISMATCH.\n` +
        `V10: ${migration.county}\n` +
        `DB:  ${target.county.name}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * TARGET MUST BE EMPTY
   * ----------------------------------------------------------
   */

  if (
    target.wards.length !== 0
  ) {
    throw new Error(
      `TARGET NOT EMPTY: ${target.id} has ` +
        `${target.wards.length} wards.`,
    );
  }

  /*
   * ----------------------------------------------------------
   * SOURCE WARD COUNT
   * ----------------------------------------------------------
   */

  if (
    source.wards.length !==
    migration.wardCount
  ) {
    throw new Error(
      `SOURCE WARD COUNT MISMATCH for ${source.id}.\n` +
        `V10: ${migration.wardCount}\n` +
        `DB:  ${source.wards.length}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * SOURCE WARD IDS
   * ----------------------------------------------------------
   */

  const actualWardIds =
    source.wards.map(
      (ward) => ward.id,
    );

  if (
    !sameNumberSet(
      actualWardIds,
      migration.wardIds,
    )
  ) {
    throw new Error(
      `WARD ID MISMATCH for ${source.id}.\n` +
        `V10: ${formatNumbers(migration.wardIds)}\n` +
        `DB:  ${formatNumbers(actualWardIds)}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * sourceGid MUST EXIST
   * ----------------------------------------------------------
   */

  const wardsWithoutSourceGid =
    source.wards.filter(
      (ward) =>
        ward.sourceGid === null,
    );

  if (
    wardsWithoutSourceGid.length > 0
  ) {
    throw new Error(
      `SOURCE HAS WARDS WITHOUT sourceGid: ` +
        `${wardsWithoutSourceGid
          .map((ward) => ward.id)
          .join(", ")}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * AUTHORITATIVE GID CHECK
   *
   * V10 already resolved these GIDs.
   * We independently require exact equality with
   * the GIDs currently attached to the source.
   * ----------------------------------------------------------
   */

  const actualGids =
    source.wards
      .map(
        (ward) =>
          ward.sourceGid as number,
      );

  if (
    !sameNumberSet(
      actualGids,
      migration.sourceGids,
    )
  ) {
    throw new Error(
      `SOURCE GID MISMATCH for ${source.id}.\n` +
        `V10: ${formatNumbers(migration.sourceGids)}\n` +
        `DB:  ${formatNumbers(actualGids)}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * DIRECT RELATION CHECK
   * ----------------------------------------------------------
   */

  const farmers =
    await prisma.farmer.count({
      where: {
        subCountyId:
          source.id,
      },
    });

  const farms =
    await prisma.farm.count({
      where: {
        subCountyId:
          source.id,
      },
    });

  const businessPartners =
    await prisma.businessPartner.count({
      where: {
        subCountyId:
          source.id,
      },
    });

  const destinationTransactions =
    await prisma.commodityTransaction.count(
      {
        where: {
          destinationSubCountyId:
            source.id,
        },
      },
    );

  const sourceTransactions =
    await prisma.commodityTransaction.count(
      {
        where: {
          sourceSubCountyId:
            source.id,
        },
      },
    );

  if (
    farmers !== 0 ||
    farms !== 0 ||
    businessPartners !== 0 ||
    destinationTransactions !== 0 ||
    sourceTransactions !== 0
  ) {
    throw new Error(
      `DIRECT RELATIONS FOUND for ${source.id}.\n` +
        `Farmers: ${farmers}\n` +
        `Farms: ${farms}\n` +
        `Business Partners: ${businessPartners}\n` +
        `Destination Transactions: ${destinationTransactions}\n` +
        `Source Transactions: ${sourceTransactions}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * FINAL PREFLIGHT OUTPUT
   * ----------------------------------------------------------
   */

  console.log(
    `County: ${source.county.name} (${source.countyId})`,
  );

  console.log(
    `Source: ${source.id} ${source.name}`,
  );

  console.log(
    `Target: ${target.id} ${target.name}`,
  );

  console.log(
    `Wards: ${source.wards.length}`,
  );

  console.log(
    `Ward IDs: ${formatNumbers(actualWardIds)}`,
  );

  console.log(
    `sourceGIDs: ${formatNumbers(actualGids)}`,
  );

  console.log(
    `Farmers: ${farmers}`,
  );

  console.log(
    `Farms: ${farms}`,
  );

  console.log(
    `Business Partners: ${businessPartners}`,
  );

  console.log(
    `Destination Transactions: ${destinationTransactions}`,
  );

  console.log(
    `Source Transactions: ${sourceTransactions}`,
  );

  console.log(
    "PREFLIGHT: PASS",
  );
}

async function migrateMigration(
  migration: SafeMigration,
): Promise<void> {
  console.log("");
  console.log(
    "============================================================",
  );

  console.log(
    `MIGRATING ${migration.sourceId} → ${migration.targetId}`,
  );

  console.log(
    "============================================================");

  await prisma.$transaction(
    async (tx) => {
      /*
       * Re-read source and target inside the transaction.
       */
      const source =
        await tx.subCounty.findUnique({
          where: {
            id: migration.sourceId,
          },
          include: {
            wards: {
              orderBy: {
                sourceGid: "asc",
              },
            },
          },
        });

      const target =
        await tx.subCounty.findUnique({
          where: {
            id: migration.targetId,
          },
          include: {
            wards: true,
          },
        });

      if (!source) {
        throw new Error(
          `TRANSACTION SOURCE NOT FOUND: ${migration.sourceId}`,
        );
      }

      if (!target) {
        throw new Error(
          `TRANSACTION TARGET NOT FOUND: ${migration.targetId}`,
        );
      }

      /*
       * County must remain identical.
       */
      if (
        source.countyId !==
        target.countyId
      ) {
        throw new Error(
          `TRANSACTION COUNTY MISMATCH: ` +
            `${source.countyId} → ${target.countyId}`,
        );
      }

      /*
       * Target must still be empty.
       */
      if (
        target.wards.length !== 0
      ) {
        throw new Error(
          `TRANSACTION TARGET NOT EMPTY: ` +
            `${target.id} has ${target.wards.length} wards.`,
        );
      }

      /*
       * Verify ward count.
       */
      if (
        source.wards.length !==
        migration.wardCount
      ) {
        throw new Error(
          `TRANSACTION WARD COUNT MISMATCH for ${source.id}.`,
        );
      }

      /*
       * Verify GIDs again.
       */
      const actualGids =
        source.wards
          .map(
            (ward) =>
              ward.sourceGid,
          )
          .filter(
            (
              gid,
            ): gid is number =>
              gid !== null,
          );

      if (
        !sameNumberSet(
          actualGids,
          migration.sourceGids,
        )
      ) {
        throw new Error(
          `TRANSACTION GID MISMATCH for ${source.id}.`,
        );
      }

      /*
       * Direct relations must still be zero.
       */
      const farmers =
        await tx.farmer.count({
          where: {
            subCountyId:
              source.id,
          },
        });

      const farms =
        await tx.farm.count({
          where: {
            subCountyId:
              source.id,
          },
        });

      const businessPartners =
        await tx.businessPartner.count({
          where: {
            subCountyId:
              source.id,
          },
        });

      const destinationTransactions =
        await tx.commodityTransaction.count(
          {
            where: {
              destinationSubCountyId:
                source.id,
            },
          },
        );

      const sourceTransactions =
        await tx.commodityTransaction.count(
          {
            where: {
              sourceSubCountyId:
                source.id,
            },
          },
        );

      if (
        farmers !== 0 ||
        farms !== 0 ||
        businessPartners !== 0 ||
        destinationTransactions !== 0 ||
        sourceTransactions !== 0
      ) {
        throw new Error(
          `TRANSACTION RELATION CHECK FAILED for ${source.id}.`,
        );
      }

      /*
       * ------------------------------------------------------
       * MOVE ONLY subCountyId
       *
       * constituencyId is NOT changed.
       * countyId is NOT changed.
       * sourceGid is NOT changed.
       * sourceUid is NOT changed.
       * ------------------------------------------------------
       */

      const updateResult =
        await tx.ward.updateMany({
          where: {
            subCountyId:
              source.id,
          },
          data: {
            subCountyId:
              target.id,
          },
        });

      if (
        updateResult.count !==
        source.wards.length
      ) {
        throw new Error(
          `WARD UPDATE COUNT MISMATCH for ${source.id}.\n` +
            `Expected: ${source.wards.length}\n` +
            `Updated: ${updateResult.count}`,
        );
      }

      console.log(
        `Wards moved: ${updateResult.count}`,
      );

      /*
       * Source must now have zero wards.
       */
      const remainingSourceWards =
        await tx.ward.count({
          where: {
            subCountyId:
              source.id,
          },
        });

      if (
        remainingSourceWards !== 0
      ) {
        throw new Error(
          `SOURCE STILL HAS ${remainingSourceWards} WARDS: ${source.id}`,
        );
      }

      /*
       * Target must now have exactly the migrated wards.
       */
      const targetWardCount =
        await tx.ward.count({
          where: {
            subCountyId:
              target.id,
          },
        });

      if (
        targetWardCount !==
        source.wards.length
      ) {
        throw new Error(
          `TARGET WARD COUNT MISMATCH for ${target.id}.\n` +
            `Expected: ${source.wards.length}\n` +
            `Actual: ${targetWardCount}`,
        );
      }

      /*
       * Delete ONLY the legacy SubCounty.
       */
      const deleted =
        await tx.subCounty.delete({
          where: {
            id: source.id,
          },
        });

      if (
        deleted.id !==
        source.id
      ) {
        throw new Error(
          `UNEXPECTED DELETE RESULT for ${source.id}`,
        );
      }

      console.log(
        `Deleted legacy SubCounty: ${source.id} ${source.name}`,
      );
    },
    {
      timeout: 30000,
    },
  );

  /*
   * ----------------------------------------------------------
   * POST-MIGRATION CHECK
   * ----------------------------------------------------------
   */

  const sourceAfter =
    await prisma.subCounty.findUnique({
      where: {
        id: migration.sourceId,
      },
    });

  if (sourceAfter) {
    throw new Error(
      `POST-CHECK FAILED: source ${migration.sourceId} still exists.`,
    );
  }

  const targetAfter =
    await prisma.subCounty.findUnique({
      where: {
        id: migration.targetId,
      },
      include: {
        wards: {
          orderBy: {
            sourceGid: "asc",
          },
        },
      },
    });

  if (!targetAfter) {
    throw new Error(
      `POST-CHECK FAILED: target ${migration.targetId} missing.`,
    );
  }

  const targetGids =
    targetAfter.wards
      .map(
        (ward) =>
          ward.sourceGid,
      )
      .filter(
        (
          gid,
        ): gid is number =>
          gid !== null,
      );

  if (
    !sameNumberSet(
      targetGids,
      migration.sourceGids,
    )
  ) {
    throw new Error(
      `POST-CHECK GID FAILURE for target ${migration.targetId}.\n` +
        `Expected: ${formatNumbers(migration.sourceGids)}\n` +
        `Actual: ${formatNumbers(targetGids)}`,
    );
  }

  console.log(
    `POST-CHECK: PASS`,
  );

  console.log(
    `Target ${targetAfter.id} now has ${targetAfter.wards.length} wards.`,
  );
}

async function finalGlobalCheck(): Promise<void> {
  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "FINAL GLOBAL CHECK",
  );
  console.log(
    "============================================================");

  const counties =
    await prisma.county.count();

  const subCounties =
    await prisma.subCounty.count();

  const wards =
    await prisma.ward.count();

  const orphanWards =
    await prisma.ward.count({
      where: {
        subCountyId: null,
      },
    });

  const wardsWithoutGid =
    await prisma.ward.count({
      where: {
        sourceGid: null,
      },
    });

  console.log(
    `Counties:              ${counties}`,
  );

  console.log(
    `SubCounties:           ${subCounties}`,
  );

  console.log(
    `Wards:                 ${wards}`,
  );

  console.log(
    `Orphan wards:          ${orphanWards}`,
  );

  console.log(
    `Wards without sourceGid: ${wardsWithoutGid}`,
  );

  if (
    counties !==
    EXPECTED_COUNTIES
  ) {
    throw new Error(
      `FINAL COUNTY CHECK FAILED: expected ${EXPECTED_COUNTIES}, got ${counties}`,
    );
  }

  if (
    wards !==
    EXPECTED_WARDS
  ) {
    throw new Error(
      `FINAL WARD CHECK FAILED: expected ${EXPECTED_WARDS}, got ${wards}`,
    );
  }

  if (
    orphanWards !== 0
  ) {
    throw new Error(
      `FINAL ORPHAN WARD CHECK FAILED: ${orphanWards}`,
    );
  }

  if (
    wardsWithoutGid !== 0
  ) {
    throw new Error(
      `FINAL sourceGid CHECK FAILED: ${wardsWithoutGid}`,
    );
  }

  console.log("");
  console.log(
    "FINAL GLOBAL CHECK: PASS",
  );
}

async function main(): Promise<void> {
  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "SUBCOUNTY CONSOLIDATION V10 SAFE",
  );
  console.log(
    "============================================================");

  console.log("");
  console.log(
    "This script processes ONLY audit.safeMigrations",
  );

  console.log(
    "Only records with status SAFE_CANDIDATE are processed.",
  );

  console.log(
    "Manual-review records are NOT processed.",
  );

  console.log(
    "Blocked records are NOT processed.",
  );

  console.log(
    "Already-canonical records are NOT processed.",
  );

  /*
   * ----------------------------------------------------------
   * LOAD V10
   * ----------------------------------------------------------
   */

  const audit =
    loadV10Audit();

  console.log("");
  console.log(
    `V10 generated: ${audit.generatedAt}`,
  );

  console.log(
    `V10 safe migrations: ${audit.summary.safeMigrations}`,
  );

  console.log(
    `V10 manual review: ${audit.summary.manualReview}`,
  );

  console.log(
    `V10 blocked: ${audit.summary.blockedByRelations}`,
  );

  /*
   * ----------------------------------------------------------
   * VERIFY V10 SUMMARY
   * ----------------------------------------------------------
   */

  if (
    audit.safeMigrations.length !==
    audit.summary.safeMigrations
  ) {
    throw new Error(
      `V10 SAFE COUNT MISMATCH.\n` +
        `Summary: ${audit.summary.safeMigrations}\n` +
        `Array:   ${audit.safeMigrations.length}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * VERIFY ALL RECORDS ARE SAFE
   * ----------------------------------------------------------
   */

  for (
    const migration of
    audit.safeMigrations
  ) {
    if (
      migration.status !==
      "SAFE_CANDIDATE"
    ) {
      throw new Error(
        `NON-SAFE RECORD FOUND IN safeMigrations: ` +
          `${migration.sourceId} status=${migration.status}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * DATABASE BASELINE
   * ----------------------------------------------------------
   */

  await checkDatabaseBaseline(
    audit,
  );

  /*
   * ----------------------------------------------------------
   * PHASE 1
   * COMPLETE READ-ONLY PREFLIGHT
   * ----------------------------------------------------------
   */

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "PHASE 1 — COMPLETE READ-ONLY PREFLIGHT",
  );
  console.log(
    "============================================================");

  for (
    const migration of
    audit.safeMigrations
  ) {
    await validateMigration(
      migration,
    );
  }

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "ALL V10 SAFE CANDIDATES PASSED PREFLIGHT",
  );
  console.log(
    "============================================================");

  /*
   * ----------------------------------------------------------
   * PHASE 2
   * WRITE
   * ----------------------------------------------------------
   */

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "PHASE 2 — DATABASE MIGRATION",
  );
  console.log(
    "============================================================");

  let completed =
    0;

  let wardsMoved =
    0;

  for (
    const migration of
    audit.safeMigrations
  ) {
    await migrateMigration(
      migration,
    );

    completed++;

    wardsMoved +=
      migration.wardCount;

    console.log(
      `Progress: ${completed}/${audit.safeMigrations.length}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * FINAL GLOBAL VALIDATION
   * ----------------------------------------------------------
   */

  await finalGlobalCheck();

  /*
   * ----------------------------------------------------------
   * RESULT
   * ----------------------------------------------------------
   */

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "V10 SAFE CONSOLIDATION COMPLETE",
  );
  console.log(
    "============================================================");

  console.log(
    `Safe migrations completed: ${completed}`,
  );

  console.log(
    `Wards moved:              ${wardsMoved}`,
  );

  console.log("");
  console.log(
    "FINAL RESULT: PASS",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "============================================================",
    );
    console.error(
      "V10 SAFE CONSOLIDATION FAILED",
    );
    console.error(
      "============================================================",
    );
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });