import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const LEGACY_TARGETS = [
  { id: 1360, name: "Kathonzweni" },
  { id: 1361, name: "Kibwezi" },
  { id: 1362, name: "Kilungu" },
  { id: 1363, name: "Makindu" },
  { id: 1365, name: "Mbooni East" },
  { id: 1366, name: "Mbooni West" },
  { id: 1367, name: "Mukaa" },
  { id: 1368, name: "Nzaui" },
] as const;

const PROTECTED_OPERATIONAL_IDS = [
  358,
  359,
  360,
  362,
  401,
  1364,
] as const;

const EXPECTED_FK_PATHS = [
  "BusinessPartner.subCountyId",
  "CommodityTransaction.destinationSubCountyId",
  "CommodityTransaction.sourceSubCountyId",
  "Farm.subCountyId",
  "Farmer.subCountyId",
  "Ward.subCountyId",
] as const;

type ForeignKeyRow = {
  constraintName: string;
  tableName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  deleteRule: string;
  updateRule: string;
};

type ReferenceCounts = {
  ward: bigint;
  farmer: bigint;
  farm: bigint;
  businessPartner: bigint;
  sourceTransaction: bigint;
  destinationTransaction: bigint;
};

function toNumber(value: bigint): number {
  return Number(value);
}

async function getForeignKeys(tx: PrismaClient) {
  return tx.$queryRaw<ForeignKeyRow[]>`
    SELECT
      con.conname AS "constraintName",
      child.relname AS "tableName",
      child_attr.attname AS "columnName",
      parent.relname AS "referencedTable",
      parent_attr.attname AS "referencedColumn",
      CASE con.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE con.confdeltype::text
      END AS "deleteRule",
      CASE con.confupdtype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE con.confupdtype::text
      END AS "updateRule"
    FROM pg_constraint con
    JOIN pg_class child
      ON child.oid = con.conrelid
    JOIN pg_namespace child_ns
      ON child_ns.oid = child.relnamespace
    JOIN pg_class parent
      ON parent.oid = con.confrelid
    JOIN pg_namespace parent_ns
      ON parent_ns.oid = parent.relnamespace
    JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS child_key(attnum, ord)
      ON TRUE
    JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS parent_key(attnum, ord)
      ON parent_key.ord = child_key.ord
    JOIN pg_attribute child_attr
      ON child_attr.attrelid = child.oid
     AND child_attr.attnum = child_key.attnum
    JOIN pg_attribute parent_attr
      ON parent_attr.attrelid = parent.oid
     AND parent_attr.attnum = parent_key.attnum
    WHERE con.contype = 'f'
      AND child_ns.nspname = 'public'
      AND parent_ns.nspname = 'public'
      AND parent.relname = 'SubCounty'
      AND parent_attr.attname = 'id'
    ORDER BY child.relname, child_attr.attname;
  `;
}

async function getReferenceCounts(
  tx: PrismaClient,
  subCountyId: number
): Promise<ReferenceCounts> {
  const result = await tx.$queryRaw<ReferenceCounts[]>`
    SELECT
      (
        SELECT COUNT(*)
        FROM "Ward"
        WHERE "subCountyId" = ${subCountyId}
      ) AS "ward",

      (
        SELECT COUNT(*)
        FROM "Farmer"
        WHERE "subCountyId" = ${subCountyId}
      ) AS "farmer",

      (
        SELECT COUNT(*)
        FROM "Farm"
        WHERE "subCountyId" = ${subCountyId}
      ) AS "farm",

      (
        SELECT COUNT(*)
        FROM "BusinessPartner"
        WHERE "subCountyId" = ${subCountyId}
      ) AS "businessPartner",

      (
        SELECT COUNT(*)
        FROM "CommodityTransaction"
        WHERE "sourceSubCountyId" = ${subCountyId}
      ) AS "sourceTransaction",

      (
        SELECT COUNT(*)
        FROM "CommodityTransaction"
        WHERE "destinationSubCountyId" = ${subCountyId}
      ) AS "destinationTransaction";
  `;

  if (!result[0]) {
    throw new Error(
      `Could not obtain reference counts for SubCounty ${subCountyId}.`
    );
  }

  return result[0];
}

async function main() {
  console.log("============================================================");
  console.log("MAKUENI LEGACY SUBCOUNTY TRANSACTIONAL DELETE");
  console.log("============================================================");
  console.log();
  console.log("WARNING: THIS SCRIPT WILL MODIFY THE DATABASE.");
  console.log("Only the explicit 8-ID whitelist can be deleted.");
  console.log();

  const targetIds = LEGACY_TARGETS.map((target) => target.id);

  try {
    const deletedIds = await prisma.$transaction(
      async (tx) => {
        console.log("------------------------------------------------------------");
        console.log("TRANSACTION STARTED");
        console.log("------------------------------------------------------------");

        // ------------------------------------------------------
        // 1. Verify exact whitelist
        // ------------------------------------------------------

        const uniqueIds = new Set(targetIds);

        if (uniqueIds.size !== LEGACY_TARGETS.length) {
          throw new Error(
            "SAFETY STOP: Duplicate IDs exist in the deletion whitelist."
          );
        }

        for (const protectedId of PROTECTED_OPERATIONAL_IDS) {
          if (uniqueIds.has(protectedId)) {
            throw new Error(
              `SAFETY STOP: Protected operational ID ${protectedId} is in deletion whitelist.`
            );
          }
        }

        console.log("PASS | Deletion whitelist contains exactly 8 unique IDs.");
        console.log(
          `TARGETS | ${targetIds.join(", ")}`
        );
        console.log();

        // ------------------------------------------------------
        // 2. Verify actual database foreign keys
        // ------------------------------------------------------

        console.log("VERIFYING FOREIGN KEYS...");

        const foreignKeys = await getForeignKeys(tx);

        if (foreignKeys.length !== 6) {
          throw new Error(
            `SAFETY STOP: Expected exactly 6 SubCounty foreign keys, found ${foreignKeys.length}.`
          );
        }

        const actualPaths = foreignKeys.map(
          (fk) => `${fk.tableName}.${fk.columnName}`
        );

        for (const expectedPath of EXPECTED_FK_PATHS) {
          if (!actualPaths.includes(expectedPath)) {
            throw new Error(
              `SAFETY STOP: Expected FK path missing: ${expectedPath}`
            );
          }
        }

        console.log("PASS | Exactly 6 expected FK paths verified.");
        console.log();

        // ------------------------------------------------------
        // 3. Re-read the 8 target records inside transaction
        // ------------------------------------------------------

        console.log("VERIFYING TARGET RECORDS...");

        const targets = await tx.subCounty.findMany({
          where: {
            id: {
              in: targetIds,
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

        if (targets.length !== LEGACY_TARGETS.length) {
          throw new Error(
            `SAFETY STOP: Expected 8 target records, found ${targets.length}.`
          );
        }

        for (const expected of LEGACY_TARGETS) {
          const actual = targets.find(
            (target) => target.id === expected.id
          );

          if (!actual) {
            throw new Error(
              `SAFETY STOP: Target ID ${expected.id} no longer exists.`
            );
          }

          if (actual.name.trim() !== expected.name) {
            throw new Error(
              `SAFETY STOP: ID ${expected.id} name mismatch. Expected "${expected.name}", found "${actual.name}".`
            );
          }

          if (actual.countyId !== 74) {
            throw new Error(
              `SAFETY STOP: ID ${expected.id} does not belong to Makueni County 74.`
            );
          }

          console.log(
            `VERIFIED | ID ${actual.id} | ${actual.name} | County ${actual.countyId}`
          );
        }

        console.log("PASS | All 8 target records verified.");
        console.log();

        // ------------------------------------------------------
        // 4. Verify protected operational records
        // ------------------------------------------------------

        console.log("VERIFYING PROTECTED OPERATIONAL RECORDS...");

        const protectedRecords = await tx.subCounty.findMany({
          where: {
            id: {
              in: [...PROTECTED_OPERATIONAL_IDS],
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

        if (
          protectedRecords.length !== PROTECTED_OPERATIONAL_IDS.length
        ) {
          throw new Error(
            `SAFETY STOP: Expected all 6 protected operational records, found ${protectedRecords.length}.`
          );
        }

        for (const record of protectedRecords) {
          console.log(
            `PROTECTED | ID ${record.id} | ${record.name} | County ${record.countyId}`
          );
        }

        console.log("PASS | All 6 protected records exist.");
        console.log();

        // ------------------------------------------------------
        // 5. Re-check ALL six FK paths for every target
        // ------------------------------------------------------

        console.log("RE-CHECKING REFERENCES INSIDE TRANSACTION...");
        console.log();

        for (const target of targets) {
          const counts = await getReferenceCounts(tx, target.id);

          const total =
            toNumber(counts.ward) +
            toNumber(counts.farmer) +
            toNumber(counts.farm) +
            toNumber(counts.businessPartner) +
            toNumber(counts.sourceTransaction) +
            toNumber(counts.destinationTransaction);

          console.log(
            `ID ${target.id} | ${target.name} | ` +
              `Ward=${counts.ward} | ` +
              `Farmer=${counts.farmer} | ` +
              `Farm=${counts.farm} | ` +
              `BusinessPartner=${counts.businessPartner} | ` +
              `SourceTransaction=${counts.sourceTransaction} | ` +
              `DestinationTransaction=${counts.destinationTransaction} | ` +
              `TOTAL=${total}`
          );

          if (total !== 0) {
            throw new Error(
              `SAFETY STOP: SubCounty ${target.id} (${target.name}) has ${total} database references.`
            );
          }
        }

        console.log();
        console.log(
          "PASS | All 8 targets have ZERO references inside transaction."
        );
        console.log();

        // ------------------------------------------------------
        // 6. Explicit Ward safety check
        // ------------------------------------------------------

        const wardReferences = await tx.ward.count({
          where: {
            subCountyId: {
              in: targetIds,
            },
          },
        });

        if (wardReferences !== 0) {
          throw new Error(
            `SAFETY STOP: ${wardReferences} Ward records reference the deletion targets.`
          );
        }

        console.log("PASS | Zero Ward records reference deletion targets.");
        console.log();

        // ------------------------------------------------------
        // 7. Final target identity check immediately before delete
        // ------------------------------------------------------

        console.log("FINAL PRE-DELETE IDENTITY CHECK...");

        const finalTargets = await tx.subCounty.findMany({
          where: {
            id: {
              in: targetIds,
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

        if (finalTargets.length !== 8) {
          throw new Error(
            `SAFETY STOP: Final target count changed. Expected 8, found ${finalTargets.length}.`
          );
        }

        for (const expected of LEGACY_TARGETS) {
          const actual = finalTargets.find(
            (target) => target.id === expected.id
          );

          if (
            !actual ||
            actual.name.trim() !== expected.name ||
            actual.countyId !== 74
          ) {
            throw new Error(
              `SAFETY STOP: Final identity check failed for ID ${expected.id}.`
            );
          }
        }

        console.log(
          "PASS | Final identity check confirms exact 8 intended records."
        );
        console.log();

        // ------------------------------------------------------
        // 8. DELETE ONLY THE EXACT WHITELIST
        // ------------------------------------------------------

        console.log("------------------------------------------------------------");
        console.log("EXECUTING DELETE");
        console.log("------------------------------------------------------------");

        console.log(
          `Deleting exactly ${LEGACY_TARGETS.length} SubCounty records...`
        );

        const deleteResult = await tx.subCounty.deleteMany({
          where: {
            id: {
              in: targetIds,
            },
          },
        });

        console.log(`DELETE RESULT | Count=${deleteResult.count}`);

        if (deleteResult.count !== LEGACY_TARGETS.length) {
          throw new Error(
            `SAFETY STOP: Expected to delete exactly 8 records, but database reported ${deleteResult.count}. Transaction will ROLLBACK.`
          );
        }

        console.log(
          "PASS | Exactly 8 SubCounty records deleted inside transaction."
        );
        console.log();

        // ------------------------------------------------------
        // 9. Verify deletion inside transaction
        // ------------------------------------------------------

        console.log("VERIFYING DELETION BEFORE COMMIT...");

        const remainingTargets = await tx.subCounty.findMany({
          where: {
            id: {
              in: targetIds,
            },
          },
          select: {
            id: true,
          },
        });

        if (remainingTargets.length !== 0) {
          throw new Error(
            `SAFETY STOP: ${remainingTargets.length} deletion targets still exist inside transaction. Transaction will ROLLBACK.`
          );
        }

        console.log(
          "PASS | All 8 deletion targets are absent inside transaction."
        );
        console.log();

        // ------------------------------------------------------
        // 10. Verify protected operational records still exist
        // ------------------------------------------------------

        console.log("VERIFYING PROTECTED RECORDS BEFORE COMMIT...");

        const remainingProtected = await tx.subCounty.findMany({
          where: {
            id: {
              in: [...PROTECTED_OPERATIONAL_IDS],
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

        if (
          remainingProtected.length !== PROTECTED_OPERATIONAL_IDS.length
        ) {
          throw new Error(
            `SAFETY STOP: Protected operational records changed. Expected 6, found ${remainingProtected.length}. Transaction will ROLLBACK.`
          );
        }

        for (const record of remainingProtected) {
          console.log(
            `PROTECTED VERIFIED | ID ${record.id} | ${record.name} | County ${record.countyId}`
          );
        }

        console.log(
          "PASS | All 6 protected operational records remain."
        );
        console.log();

        // ------------------------------------------------------
        // 11. Transaction commits here
        // ------------------------------------------------------

        console.log("------------------------------------------------------------");
        console.log("ALL SAFETY CHECKS PASSED");
        console.log("------------------------------------------------------------");
        console.log("COMMITTING TRANSACTION...");
        console.log();

        return targetIds;
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    console.log("============================================================");
    console.log("TRANSACTION COMMITTED SUCCESSFULLY");
    console.log("============================================================");
    console.log();
    console.log(`Deleted records: ${deletedIds.length}`);
    console.log(`Deleted IDs: ${deletedIds.join(", ")}`);
    console.log();
    console.log("No operational SubCounty was included.");
    console.log("============================================================");

    // ----------------------------------------------------------
    // 12. POST-COMMIT verification
    // ----------------------------------------------------------

    console.log();
    console.log("POST-COMMIT VERIFICATION");
    console.log("------------------------------------------------------------");

    const deletedStillPresent = await prisma.subCounty.findMany({
      where: {
        id: {
          in: targetIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (deletedStillPresent.length !== 0) {
      throw new Error(
        `POST-COMMIT FAILURE: ${deletedStillPresent.length} deleted records still exist.`
      );
    }

    console.log("PASS | All 8 legacy IDs are now absent.");

    const protectedAfterCommit = await prisma.subCounty.findMany({
      where: {
        id: {
          in: [...PROTECTED_OPERATIONAL_IDS],
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

    if (
      protectedAfterCommit.length !== PROTECTED_OPERATIONAL_IDS.length
    ) {
      throw new Error(
        `POST-COMMIT FAILURE: Expected 6 protected records, found ${protectedAfterCommit.length}.`
      );
    }

    console.log(
      "PASS | All 6 protected operational SubCounties still exist."
    );

    for (const record of protectedAfterCommit) {
      console.log(
        `PROTECTED | ID ${record.id} | ${record.name} | County ${record.countyId}`
      );
    }

    console.log();
    console.log("============================================================");
    console.log("FINAL RESULT: PASS");
    console.log("============================================================");
    console.log("8 legacy Makueni SubCounty records were deleted.");
    console.log("6 operational SubCounty records remain protected.");
    console.log("Post-commit verification passed.");
    console.log("============================================================");
  } catch (error) {
    console.error();
    console.error("============================================================");
    console.error("DELETE FAILED / ROLLED BACK");
    console.error("============================================================");
    console.error(error);
    console.error();
    console.error("If the error occurred inside the transaction,");
    console.error("the transaction was rolled back and no partial");
    console.error("deletion was committed.");
    console.error("============================================================");

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();