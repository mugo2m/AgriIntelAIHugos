import "dotenv/config";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

const TARGET_SUBCOUNTY_ID = 666;

type ForeignKeyReference = {
  schema_name: string;
  table_name: string;
  column_name: string;
  constraint_name: string;
  referenced_table: string;
  referenced_column: string;
};

type ColumnReference = {
  schema_name: string;
  table_name: string;
  column_name: string;
};

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

async function main() {
  console.log("============================================================");
  console.log("SUBCOUNTY 666 DEPENDENCY AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");

  console.log("");
  console.log(`Target SubCounty ID: ${TARGET_SUBCOUNTY_ID}`);

  // ----------------------------------------------------------
  // 1. VERIFY TARGET EXISTS
  // ----------------------------------------------------------

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("1. TARGET SUBCOUNTY");
  console.log("------------------------------------------------------------");

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
    console.log("SubCounty 666 does NOT exist.");
    console.log("");
    console.log("AUDIT STOPPED.");
    return;
  }

  console.log(`ID: ${target.id}`);
  console.log(`Name: ${target.name}`);
  console.log(`County: ${target.county.name} (${target.county.id})`);

  // ----------------------------------------------------------
  // 2. FIND ALL FORMAL FOREIGN KEYS TO SUBCOUNTY
  // ----------------------------------------------------------

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("2. FOREIGN KEYS REFERENCING SUBCOUNTY");
  console.log("------------------------------------------------------------");

  const foreignKeys = await prisma.$queryRaw<ForeignKeyReference[]>`
    SELECT
      kcu.table_schema AS schema_name,
      kcu.table_name AS table_name,
      kcu.column_name AS column_name,
      tc.constraint_name AS constraint_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'SubCounty'
      AND ccu.column_name = 'id'
      AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY
      kcu.table_schema,
      kcu.table_name,
      kcu.column_name;
  `;

  if (foreignKeys.length === 0) {
    console.log("No formal foreign keys referencing SubCounty.id were found.");
  } else {
    console.log(`Formal foreign-key references found: ${foreignKeys.length}`);

    for (const fk of foreignKeys) {
      console.log(
        `  ${fk.schema_name}.${fk.table_name}.${fk.column_name}`
      );
      console.log(`    Constraint: ${fk.constraint_name}`);
    }
  }

  // ----------------------------------------------------------
  // 3. CHECK EVERY FORMAL FOREIGN KEY FOR ID 666
  // ----------------------------------------------------------

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("3. ROWS DIRECTLY REFERENCING SUBCOUNTY 666");
  console.log("------------------------------------------------------------");

  let totalFormalReferences = 0;

  for (const fk of foreignKeys) {
    const qualifiedTable =
      `${quoteIdentifier(fk.schema_name)}.${quoteIdentifier(fk.table_name)}`;

    const qualifiedColumn = quoteIdentifier(fk.column_name);

    const countResult = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `
      SELECT COUNT(*)::bigint AS count
      FROM ${qualifiedTable}
      WHERE ${qualifiedColumn} = $1
      `,
      TARGET_SUBCOUNTY_ID
    );

    const count = Number(countResult[0]?.count ?? 0);

    console.log("");
    console.log(
      `${fk.table_name}.${fk.column_name}: ${count} row(s)`
    );

    if (count > 0) {
      totalFormalReferences += count;

      const sampleRows = await prisma.$queryRawUnsafe<
        Array<{ id: number }>
      >(
        `
        SELECT id
        FROM ${qualifiedTable}
        WHERE ${qualifiedColumn} = $1
        ORDER BY id
        LIMIT 20
        `,
        TARGET_SUBCOUNTY_ID
      );

      const sampleIds = sampleRows.map((row) => row.id);

      console.log(
        `  Sample IDs: ${
          sampleIds.length > 0
            ? sampleIds.join(", ")
            : "Unable to retrieve sample IDs"
        }`
      );
    }
  }

  // ----------------------------------------------------------
  // 4. SEARCH FOR subCountyId COLUMNS EVEN WITHOUT FK
  // ----------------------------------------------------------

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("4. ALL COLUMNS NAMED subCountyId");
  console.log("------------------------------------------------------------");

  const subCountyIdColumns = await prisma.$queryRaw<ColumnReference[]>`
    SELECT
      table_schema AS schema_name,
      table_name,
      column_name
    FROM information_schema.columns
    WHERE column_name = 'subCountyId'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY
      table_schema,
      table_name;
  `;

  if (subCountyIdColumns.length === 0) {
    console.log("No columns named subCountyId were found.");
  } else {
    console.log(
      `Columns named subCountyId found: ${subCountyIdColumns.length}`
    );

    for (const column of subCountyIdColumns) {
      console.log(
        `  ${column.schema_name}.${column.table_name}.${column.column_name}`
      );
    }
  }

  // ----------------------------------------------------------
  // 5. CHECK subCountyId COLUMNS FOR ID 666
  // ----------------------------------------------------------

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("5. UNCONSTRAINED subCountyId REFERENCES TO 666");
  console.log("------------------------------------------------------------");

  let totalColumnReferences = 0;

  for (const column of subCountyIdColumns) {
    const qualifiedTable =
      `${quoteIdentifier(column.schema_name)}.${quoteIdentifier(column.table_name)}`;

    const qualifiedColumn = quoteIdentifier(column.column_name);

    const countResult = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `
      SELECT COUNT(*)::bigint AS count
      FROM ${qualifiedTable}
      WHERE ${qualifiedColumn} = $1
      `,
      TARGET_SUBCOUNTY_ID
    );

    const count = Number(countResult[0]?.count ?? 0);

    console.log(
      `${column.table_name}.subCountyId: ${count} row(s)`
    );

    if (count > 0) {
      totalColumnReferences += count;

      try {
        const sampleRows = await prisma.$queryRawUnsafe<
          Array<{ id: number }>
        >(
          `
          SELECT id
          FROM ${qualifiedTable}
          WHERE ${qualifiedColumn} = $1
          ORDER BY id
          LIMIT 20
          `,
          TARGET_SUBCOUNTY_ID
        );

        const sampleIds = sampleRows.map((row) => row.id);

        console.log(
          `  Sample IDs: ${
            sampleIds.length > 0
              ? sampleIds.join(", ")
              : "No sample IDs available"
          }`
        );
      } catch {
        console.log(
          "  Sample IDs: table does not expose a simple id column"
        );
      }
    }
  }

  // ----------------------------------------------------------
  // 6. CHECK TARGET'S KNOWN CHILD RELATIONSHIPS
  // ----------------------------------------------------------

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("6. KNOWN SUBCOUNTY CHILD RELATIONSHIPS");
  console.log("------------------------------------------------------------");

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

  const businessPartnerCount = await prisma.businessPartner.count({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
    },
  });

  console.log(`Wards: ${wardCount}`);
  console.log(`Farmers: ${farmerCount}`);
  console.log(`Farms: ${farmCount}`);
  console.log(`Business Partners: ${businessPartnerCount}`);

  // ----------------------------------------------------------
  // 7. FINAL EVIDENCE SUMMARY
  // ----------------------------------------------------------

  console.log("");
  console.log("============================================================");
  console.log("FINAL EVIDENCE SUMMARY");
  console.log("============================================================");

  console.log(`Target exists: YES`);
  console.log(`Target ID: ${target.id}`);
  console.log(`Target name: ${target.name}`);
  console.log(`Target county: ${target.county.name}`);
  console.log(
    `Formal FK references containing 666: ${totalFormalReferences}`
  );
  console.log(
    `subCountyId-column references containing 666: ${totalColumnReferences}`
  );
  console.log(`Known wards: ${wardCount}`);
  console.log(`Known farmers: ${farmerCount}`);
  console.log(`Known farms: ${farmCount}`);
  console.log(`Known business partners: ${businessPartnerCount}`);

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("CLASSIFICATION");
  console.log("------------------------------------------------------------");

  if (
    totalFormalReferences === 0 &&
    totalColumnReferences === 0 &&
    wardCount === 0 &&
    farmerCount === 0 &&
    farmCount === 0 &&
    businessPartnerCount === 0
  ) {
    console.log(
      "SUBCOUNTY 666 APPEARS TO BE COMPLETELY ORPHANED."
    );
    console.log(
      "No database records were found referencing it."
    );
  } else {
    console.log(
      "SUBCOUNTY 666 HAS DEPENDENCIES."
    );
    console.log(
      "DO NOT DELETE OR MODIFY IT YET."
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("AUDIT COMPLETE — READ-ONLY");
  console.log("NO DATABASE CHANGES WERE MADE");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("AUDIT FAILED:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });