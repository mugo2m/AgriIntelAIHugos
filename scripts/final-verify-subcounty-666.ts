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

function deleteAction(code: string): string {
  switch (code) {
    case "a":
      return "NO ACTION";
    case "r":
      return "RESTRICT";
    case "c":
      return "CASCADE";
    case "n":
      return "SET NULL";
    case "d":
      return "SET DEFAULT";
    default:
      return `UNKNOWN (${code})`;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("FINAL VERIFICATION — SUBCOUNTY 666");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("=".repeat(60));

  console.log(`\nTarget SubCounty ID: ${TARGET_SUBCOUNTY_ID}`);

  // ----------------------------------------------------------
  // 1. Confirm target row
  // ----------------------------------------------------------

  console.log("\n1. TARGET ROW");

  const target = await prisma.subCounty.findUnique({
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
    console.log("SubCounty 666 DOES NOT EXIST.");
    return;
  }

  console.log(`ID: ${target.id}`);
  console.log(`Name: ${target.name}`);
  console.log(`County: ${target.county.name} (${target.county.id})`);

  // ----------------------------------------------------------
  // 2. Exact PostgreSQL FK definitions
  // ----------------------------------------------------------

  console.log("\n2. POSTGRESQL FOREIGN-KEY DEFINITIONS");

  const foreignKeys = await prisma.$queryRaw<
    Array<{
      constraint_name: string;
      source_schema: string;
      source_table: string;
      source_column: string;
      target_schema: string;
      target_table: string;
      target_column: string;
      delete_action: string;
      constraint_definition: string;
    }>
  >`
    SELECT
      con.conname::text AS constraint_name,

      source_ns.nspname::text AS source_schema,
      source_table.relname::text AS source_table,
      source_col.attname::text AS source_column,

      target_ns.nspname::text AS target_schema,
      target_table.relname::text AS target_table,
      target_col.attname::text AS target_column,

      con.confdeltype::text AS delete_action,

      pg_get_constraintdef(con.oid)::text AS constraint_definition

    FROM pg_constraint con

    JOIN pg_class source_table
      ON source_table.oid = con.conrelid

    JOIN pg_namespace source_ns
      ON source_ns.oid = source_table.relnamespace

    JOIN pg_class target_table
      ON target_table.oid = con.confrelid

    JOIN pg_namespace target_ns
      ON target_ns.oid = target_table.relnamespace

    JOIN pg_attribute source_col
      ON source_col.attrelid = con.conrelid
     AND source_col.attnum = con.conkey[1]

    JOIN pg_attribute target_col
      ON target_col.attrelid = con.confrelid
     AND target_col.attnum = con.confkey[1]

    WHERE con.contype = 'f'
      AND target_table.relname = 'SubCounty'
      AND target_col.attname = 'id'

    ORDER BY source_table.relname, source_col.attname;
  `;

  console.log(`Foreign keys found: ${foreignKeys.length}`);

  for (const fk of foreignKeys) {
    console.log(
      `\n${fk.source_schema}.${fk.source_table}.${fk.source_column}`
    );

    console.log(`  Constraint: ${fk.constraint_name}`);

    console.log(
      `  References: ${fk.target_schema}.${fk.target_table}.${fk.target_column}`
    );

    console.log(
      `  ON DELETE: ${deleteAction(fk.delete_action)}`
    );

    console.log(
      `  Definition: ${fk.constraint_definition}`
    );
  }

  // ----------------------------------------------------------
  // 3. Count actual references to SubCounty 666
  // ----------------------------------------------------------

  console.log("\n3. ACTUAL DATABASE REFERENCES TO ID 666");

  let totalReferences = 0;

  for (const fk of foreignKeys) {
    const qualifiedTable =
      `"${fk.source_schema}"."${fk.source_table}"`;

    const quotedColumn =
      `"${fk.source_column}"`;

    const result = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*)::bigint AS count
       FROM ${qualifiedTable}
       WHERE ${quotedColumn} = $1`,
      TARGET_SUBCOUNTY_ID
    );

    const count = Number(result[0]?.count ?? 0);

    totalReferences += count;

    console.log(
      `${fk.source_table}.${fk.source_column}: ${count} row(s)`
    );
  }

  // ----------------------------------------------------------
  // 4. Database triggers on SubCounty
  // ----------------------------------------------------------

  console.log("\n4. DATABASE TRIGGERS ON SUBCOUNTY");

  const triggers = await prisma.$queryRaw<
    Array<{
      trigger_name: string;
      trigger_definition: string;
    }>
  >`
    SELECT
      tg.tgname::text AS trigger_name,
      pg_get_triggerdef(tg.oid)::text AS trigger_definition

    FROM pg_trigger tg

    JOIN pg_class tbl
      ON tbl.oid = tg.tgrelid

    JOIN pg_namespace ns
      ON ns.oid = tbl.relnamespace

    WHERE ns.nspname = 'public'
      AND tbl.relname = 'SubCounty'
      AND NOT tg.tgisinternal

    ORDER BY tg.tgname;
  `;

  console.log(
    `User-defined triggers found: ${triggers.length}`
  );

  if (triggers.length === 0) {
    console.log("No user-defined triggers found.");
  } else {
    for (const trigger of triggers) {
      console.log(`\nTrigger: ${trigger.trigger_name}`);
      console.log(
        `  ${trigger.trigger_definition}`
      );
    }
  }

  // ----------------------------------------------------------
  // 5. Known Prisma relationship counts
  // ----------------------------------------------------------

  console.log("\n5. KNOWN SUBCOUNTY RELATIONSHIPS");

  const wardCount = await prisma.ward.count({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
    },
  });

  const farmerCount = await prisma.farmer.count({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
    },
  });

  const farmCount = await prisma.farm.count({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
    },
  });

  const businessPartnerCount =
    await prisma.businessPartner.count({
      where: {
        subCountyId: TARGET_SUBCOUNTY_ID,
      },
    });

  console.log(`Wards: ${wardCount}`);
  console.log(`Farmers: ${farmerCount}`);
  console.log(`Farms: ${farmCount}`);
  console.log(`Business Partners: ${businessPartnerCount}`);

  // ----------------------------------------------------------
  // 6. Final safety classification
  // ----------------------------------------------------------

  console.log("\n6. FINAL SAFETY CLASSIFICATION");

  console.log("Target exists: YES");
  console.log(
    `Total formal FK references: ${totalReferences}`
  );
  console.log(`Wards: ${wardCount}`);
  console.log(`Farmers: ${farmerCount}`);
  console.log(`Farms: ${farmCount}`);
  console.log(
    `Business Partners: ${businessPartnerCount}`
  );
  console.log(
    `User-defined triggers: ${triggers.length}`
  );

  const completelyOrphaned =
    totalReferences === 0 &&
    wardCount === 0 &&
    farmerCount === 0 &&
    farmCount === 0 &&
    businessPartnerCount === 0;

  if (completelyOrphaned) {
    console.log("\nRESULT:");

    console.log(
      "SUBCOUNTY 666 IS COMPLETELY ORPHANED."
    );

    if (triggers.length === 0) {
      console.log(
        "NO USER-DEFINED TRIGGERS WERE FOUND ON SUBCOUNTY."
      );
    }

    console.log(
      "\nNO DEPENDENT DATABASE RECORDS WERE FOUND."
    );

    console.log(
      "ID 666 IS SAFE TO CONSIDER FOR DELETION."
    );

    console.log(
      "IMPORTANT: THIS SCRIPT DID NOT DELETE ANYTHING."
    );
  } else {
    console.log("\nRESULT:");

    console.log(
      "SUBCOUNTY 666 STILL HAS DEPENDENCIES."
    );

    console.log(
      "DO NOT DELETE OR MERGE IT."
    );
  }

  console.log("\n" + "=".repeat(60));
  console.log("FINAL VERIFICATION COMPLETE");
  console.log("READ-ONLY — NO DATABASE CHANGES WERE MADE");
  console.log("=".repeat(60));
}

main()
  .catch((error) => {
    console.error("\nFINAL VERIFICATION FAILED:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });