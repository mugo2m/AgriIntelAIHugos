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

const TARGET_SUBCOUNTY_ID = 666;

async function main() {
  console.log("=".repeat(60));
  console.log("DELETE SUBCOUNTY 666 — KIBWEZI");
  console.log("DATABASE CHANGE — CONTROLLED DELETION");
  console.log("=".repeat(60));

  await prisma.$transaction(
    async (tx) => {
      // --------------------------------------------------------
      // 1. Verify the target still exists
      // --------------------------------------------------------

      console.log("\n1. VERIFYING TARGET");

      const target = await tx.subCounty.findUnique({
        where: {
          id: TARGET_SUBCOUNTY_ID,
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
        },
      });

      if (!target) {
        throw new Error(
          `SubCounty ${TARGET_SUBCOUNTY_ID} does not exist. Aborting.`
        );
      }

      console.log(`ID: ${target.id}`);
      console.log(`Name: ${target.name}`);
      console.log(
        `County: ${target.county.name} (${target.county.id})`
      );

      if (target.name !== "Kibwezi") {
        throw new Error(
          `SAFETY STOP: ID ${TARGET_SUBCOUNTY_ID} is now named "${target.name}", not "Kibwezi". Aborting.`
        );
      }

      if (target.countyId !== 74) {
        throw new Error(
          `SAFETY STOP: ID ${TARGET_SUBCOUNTY_ID} belongs to county ${target.countyId}, not Makueni (74). Aborting.`
        );
      }

      console.log("Target identity verified.");

      // --------------------------------------------------------
      // 2. Re-check all formal FK dependencies
      // --------------------------------------------------------

      console.log("\n2. RE-CHECKING FOREIGN-KEY DEPENDENCIES");

      const dependencies = await tx.$queryRaw<
        Array<{
          source_table: string;
          source_column: string;
          row_count: bigint;
        }>
      >`
        SELECT
          source_table.relname::text AS source_table,
          source_col.attname::text AS source_column,
          (
            SELECT COUNT(*)::bigint
            FROM pg_catalog.pg_class child_table
            WHERE false
          ) AS row_count
        FROM pg_catalog.pg_constraint con

        JOIN pg_catalog.pg_class source_table
          ON source_table.oid = con.conrelid

        JOIN pg_catalog.pg_namespace source_ns
          ON source_ns.oid = source_table.relnamespace

        JOIN pg_catalog.pg_class target_table
          ON target_table.oid = con.confrelid

        JOIN pg_catalog.pg_namespace target_ns
          ON target_ns.oid = target_table.relnamespace

        JOIN pg_catalog.pg_attribute source_col
          ON source_col.attrelid = con.conrelid
         AND source_col.attnum = con.conkey[1]

        JOIN pg_catalog.pg_attribute target_col
          ON target_col.attrelid = con.confrelid
         AND target_col.attnum = con.confkey[1]

        WHERE con.contype = 'f'
          AND source_ns.nspname = 'public'
          AND target_ns.nspname = 'public'
          AND target_table.relname = 'SubCounty'
          AND target_col.attname = 'id'

        ORDER BY source_table.relname, source_col.attname;
      `;

      let totalReferences = 0;

      for (const dependency of dependencies) {
        const tableName = dependency.source_table;
        const columnName = dependency.source_column;

        const result = await tx.$queryRawUnsafe<
          Array<{ count: bigint }>
        >(
          `SELECT COUNT(*)::bigint AS count
           FROM "public"."${tableName}"
           WHERE "${columnName}" = $1`,
          TARGET_SUBCOUNTY_ID
        );

        const count = Number(result[0]?.count ?? 0);

        totalReferences += count;

        console.log(
          `${tableName}.${columnName}: ${count} row(s)`
        );

        if (count > 0) {
          throw new Error(
            `SAFETY STOP: ${tableName}.${columnName} contains ${count} reference(s) to SubCounty ${TARGET_SUBCOUNTY_ID}. Deletion aborted.`
          );
        }
      }

      console.log(
        `Total formal FK references: ${totalReferences}`
      );

      if (totalReferences !== 0) {
        throw new Error(
          "SAFETY STOP: Dependencies were found. Deletion aborted."
        );
      }

      // --------------------------------------------------------
      // 3. Explicit Prisma relationship checks
      // --------------------------------------------------------

      console.log("\n3. RE-CHECKING KNOWN RELATIONSHIPS");

      const wardCount = await tx.ward.count({
        where: {
          subCountyId: TARGET_SUBCOUNTY_ID,
        },
      });

      const farmerCount = await tx.farmer.count({
        where: {
          subCountyId: TARGET_SUBCOUNTY_ID,
        },
      });

      const farmCount = await tx.farm.count({
        where: {
          subCountyId: TARGET_SUBCOUNTY_ID,
        },
      });

      const businessPartnerCount =
        await tx.businessPartner.count({
          where: {
            subCountyId: TARGET_SUBCOUNTY_ID,
          },
        });

      console.log(`Wards: ${wardCount}`);
      console.log(`Farmers: ${farmerCount}`);
      console.log(`Farms: ${farmCount}`);
      console.log(
        `Business Partners: ${businessPartnerCount}`
      );

      if (
        wardCount !== 0 ||
        farmerCount !== 0 ||
        farmCount !== 0 ||
        businessPartnerCount !== 0
      ) {
        throw new Error(
          "SAFETY STOP: Known SubCounty relationships are no longer empty. Deletion aborted."
        );
      }

      // --------------------------------------------------------
      // 4. Final identity check immediately before deletion
      // --------------------------------------------------------

      console.log("\n4. FINAL PRE-DELETE CHECK");

      const finalCheck = await tx.subCounty.findUnique({
        where: {
          id: TARGET_SUBCOUNTY_ID,
        },
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      });

      if (!finalCheck) {
        throw new Error(
          "SAFETY STOP: Target disappeared before deletion."
        );
      }

      if (
        finalCheck.id !== 666 ||
        finalCheck.name !== "Kibwezi" ||
        finalCheck.countyId !== 74
      ) {
        throw new Error(
          "SAFETY STOP: Target identity changed before deletion."
        );
      }

      console.log(
        "Target confirmed as SubCounty 666 — Kibwezi — Makueni."
      );

      console.log(
        "All dependency checks passed."
      );

      // --------------------------------------------------------
      // 5. DELETE ONLY SUBCOUNTY 666
      // --------------------------------------------------------

      console.log("\n5. DELETING SUBCOUNTY 666");

      const deleted = await tx.subCounty.delete({
        where: {
          id: TARGET_SUBCOUNTY_ID,
        },
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      });

      console.log(
        `Deleted: ID ${deleted.id} | ${deleted.name} | County ${deleted.countyId}`
      );

      // --------------------------------------------------------
      // 6. Verify deletion inside transaction
      // --------------------------------------------------------

      console.log("\n6. VERIFYING DELETION");

      const afterDelete = await tx.subCounty.findUnique({
        where: {
          id: TARGET_SUBCOUNTY_ID,
        },
        select: {
          id: true,
        },
      });

      if (afterDelete !== null) {
        throw new Error(
          "SAFETY STOP: SubCounty 666 still exists after DELETE."
        );
      }

      console.log(
        "SubCounty 666 no longer exists."
      );

      console.log(
        "\nDeletion verification passed."
      );
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );

  // ----------------------------------------------------------
  // 7. Post-transaction confirmation
  // ----------------------------------------------------------

  console.log("\n7. POST-TRANSACTION CONFIRMATION");

  const finalTarget = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_SUBCOUNTY_ID,
    },
    select: {
      id: true,
    },
  });

  if (finalTarget === null) {
    console.log(
      "CONFIRMED: SubCounty 666 has been permanently deleted."
    );
  } else {
    throw new Error(
      "POST-DELETE VERIFICATION FAILED: SubCounty 666 still exists."
    );
  }

  // ----------------------------------------------------------
  // 8. Confirm Kibwezi East and West remain untouched
  // ----------------------------------------------------------

  console.log(
    "\n8. VERIFYING KIBWEZI EAST AND WEST"
  );

  const kibweziWest = await prisma.subCounty.findUnique({
    where: {
      id: 362,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const kibweziEast = await prisma.subCounty.findUnique({
    where: {
      id: 401,
    },
    select: {
      id: true,
      name: true,
    },
  });

  console.log(
    `ID 362: ${kibweziWest?.name ?? "NOT FOUND"}`
  );

  console.log(
    `ID 401: ${kibweziEast?.name ?? "NOT FOUND"}`
  );

  if (!kibweziWest || !kibweziEast) {
    throw new Error(
      "WARNING: Kibwezi East or West could not be found after deletion."
    );
  }

  console.log(
    "\nKibwezi East and Kibwezi West remain present."
  );

  console.log("\n" + "=".repeat(60));
  console.log("DELETION COMPLETE");
  console.log("SUBCOUNTY 666 DELETED");
  console.log("KIBWEZI EAST (401) UNCHANGED");
  console.log("KIBWEZI WEST (362) UNCHANGED");
  console.log("=".repeat(60));
}

main()
  .catch((error) => {
    console.error("\nDELETION FAILED:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });