import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("FIXED SUBCOUNTY DELETE-RULE FORENSIC AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  const constraints = await prisma.$queryRaw<
    Array<{
      constraint_name: string;
      table_schema: string;
      table_name: string;
      column_name: string;
      referenced_schema: string;
      referenced_table: string;
      referenced_column: string;
      delete_rule: string;
      update_rule: string;
    }>
  >`
    SELECT
      con.conname AS constraint_name,
      child_ns.nspname AS table_schema,
      child_rel.relname AS table_name,
      child_att.attname AS column_name,
      parent_ns.nspname AS referenced_schema,
      parent_rel.relname AS referenced_table,
      parent_att.attname AS referenced_column,

      CASE con.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE 'UNKNOWN'
      END AS delete_rule,

      CASE con.confupdtype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE 'UNKNOWN'
      END AS update_rule

    FROM pg_constraint con

    JOIN pg_class child_rel
      ON child_rel.oid = con.conrelid

    JOIN pg_namespace child_ns
      ON child_ns.oid = child_rel.relnamespace

    JOIN pg_class parent_rel
      ON parent_rel.oid = con.confrelid

    JOIN pg_namespace parent_ns
      ON parent_ns.oid = parent_rel.relnamespace

    JOIN LATERAL unnest(con.conkey)
      WITH ORDINALITY AS child_key(attnum, ord)
      ON TRUE

    JOIN LATERAL unnest(con.confkey)
      WITH ORDINALITY AS parent_key(attnum, ord)
      ON parent_key.ord = child_key.ord

    JOIN pg_attribute child_att
      ON child_att.attrelid = con.conrelid
      AND child_att.attnum = child_key.attnum

    JOIN pg_attribute parent_att
      ON parent_att.attrelid = con.confrelid
      AND parent_att.attnum = parent_key.attnum

    WHERE con.contype = 'f'
      AND parent_ns.nspname = 'public'
      AND parent_rel.relname = 'SubCounty'

    ORDER BY
      child_rel.relname,
      child_att.attname,
      con.conname;
  `;

  console.log("1. ACTUAL FOREIGN KEYS REFERENCING SubCounty");
  console.log("------------------------------------------------------------");

  if (constraints.length === 0) {
    console.log("NO FOREIGN KEYS FOUND.");
  } else {
    for (const row of constraints) {
      console.log("");
      console.log(`CONSTRAINT: ${row.constraint_name}`);
      console.log(`TABLE: ${row.table_schema}.${row.table_name}.${row.column_name}`);
      console.log(
        `REFERENCES: ${row.referenced_schema}.${row.referenced_table}.${row.referenced_column}`,
      );
      console.log(`DELETE RULE: ${row.delete_rule}`);
      console.log(`UPDATE RULE: ${row.update_rule}`);
    }
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log(`ACTUAL FK COUNT: ${constraints.length}`);
  console.log("------------------------------------------------------------");

  console.log("");
  console.log("2. EXPECTED SUBCOUNTY FK PATHS");
  console.log("------------------------------------------------------------");

  const expected = [
    "BusinessPartner.subCountyId",
    "CommodityTransaction.destinationSubCountyId",
    "CommodityTransaction.sourceSubCountyId",
    "Farm.subCountyId",
    "Farmer.subCountyId",
    "Ward.subCountyId",
  ];

  let expectedPathsFound = true;

  for (const path of expected) {
    const [table, column] = path.split(".");

    const found = constraints.some(
      (row) =>
        row.table_name === table &&
        row.column_name === column &&
        row.referenced_table === "SubCounty" &&
        row.referenced_column === "id",
    );

    if (!found) {
      expectedPathsFound = false;
    }

    console.log(`${found ? "FOUND" : "MISSING"} | ${path}`);
  }

  console.log("");
  console.log("3. LEGACY TARGET RECORDS");
  console.log("------------------------------------------------------------");

  const targets = [
    1360,
    1361,
    1362,
    1363,
    1365,
    1366,
    1367,
    1368,
  ];

  const targetRows = await prisma.subCounty.findMany({
    where: {
      id: {
        in: targets,
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

  for (const row of targetRows) {
    console.log(
      `ID ${row.id} | ${row.name} | County ${row.countyId}`,
    );
  }

  console.log("");
  console.log(`TARGETS FOUND: ${targetRows.length}/${targets.length}`);

  console.log("");
  console.log("4. CURRENT REFERENCE COUNTS");
  console.log("------------------------------------------------------------");

  const referenceChecks = await Promise.all(
    targets.map(async (id) => {
      const [
        ward,
        farmer,
        farm,
        businessPartner,
        sourceTransaction,
        destinationTransaction,
      ] = await Promise.all([
        prisma.ward.count({
          where: {
            subCountyId: id,
          },
        }),

        prisma.farmer.count({
          where: {
            subCountyId: id,
          },
        }),

        prisma.farm.count({
          where: {
            subCountyId: id,
          },
        }),

        prisma.businessPartner.count({
          where: {
            subCountyId: id,
          },
        }),

        prisma.commodityTransaction.count({
          where: {
            sourceSubCountyId: id,
          },
        }),

        prisma.commodityTransaction.count({
          where: {
            destinationSubCountyId: id,
          },
        }),
      ]);

      return {
        id,
        ward,
        farmer,
        farm,
        businessPartner,
        sourceTransaction,
        destinationTransaction,
      };
    }),
  );

  let totalReferences = 0;

  for (const row of referenceChecks) {
    const total =
      row.ward +
      row.farmer +
      row.farm +
      row.businessPartner +
      row.sourceTransaction +
      row.destinationTransaction;

    totalReferences += total;

    console.log(
      `ID ${row.id} | Ward=${row.ward} | Farmer=${row.farmer} | Farm=${row.farm} | BusinessPartner=${row.businessPartner} | SourceTransaction=${row.sourceTransaction} | DestinationTransaction=${row.destinationTransaction} | TOTAL=${total}`,
    );
  }

  console.log("");
  console.log("5. FINAL SAFETY CHECK");
  console.log("------------------------------------------------------------");

  const wardReferences = await prisma.ward.count({
    where: {
      subCountyId: {
        in: targets,
      },
    },
  });

  console.log(`WARD REFERENCES TO ALL TARGET IDS: ${wardReferences}`);
  console.log(`TOTAL REFERENCES ACROSS SIX FK PATHS: ${totalReferences}`);

  console.log("");
  console.log("============================================================");

  if (
    constraints.length === 6 &&
    expectedPathsFound &&
    targetRows.length === targets.length &&
    totalReferences === 0 &&
    wardReferences === 0
  ) {
    console.log("PASS");
    console.log("------------------------------------------------------------");
    console.log("Exactly 6 real foreign keys reference SubCounty.id.");
    console.log("All 6 expected FK paths were found.");
    console.log("All 8 legacy target records exist.");
    console.log("All 8 legacy target records have ZERO references.");
    console.log("No database changes were made.");
  } else {
    console.log("REVIEW REQUIRED");
    console.log("------------------------------------------------------------");
    console.log(`Actual SubCounty FK count: ${constraints.length}`);
    console.log(`Expected FK paths found: ${expectedPathsFound}`);
    console.log(
      `Target records found: ${targetRows.length}/${targets.length}`,
    );
    console.log(`Total references: ${totalReferences}`);
    console.log(`Ward references: ${wardReferences}`);
    console.log("No database changes were made.");
  }

  console.log("============================================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("AUDIT FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });