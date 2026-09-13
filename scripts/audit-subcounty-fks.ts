import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("============================================================");
  console.log("SUBCOUNTY FOREIGN-KEY FORENSIC AUDIT");
  console.log("TARGET SUBCOUNTY ID: 1361");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  const foreignKeys = await prisma.$queryRaw<
    Array<{
      table_schema: string;
      table_name: string;
      column_name: string;
      referenced_table: string;
      referenced_column: string;
    }>
  >`
    SELECT
      tc.table_schema,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND LOWER(ccu.table_name) = LOWER('SubCounty')
    ORDER BY tc.table_schema, tc.table_name, kcu.column_name;
  `;

  console.log("1. FOREIGN KEYS REFERENCING SUBCOUNTY");
  console.log("------------------------------------------------------------");

  if (foreignKeys.length === 0) {
    console.log("NO FOREIGN KEYS FOUND REFERENCING SUBCOUNTY.");
  } else {
    for (const fk of foreignKeys) {
      console.log(
        `${fk.table_schema}.${fk.table_name}.${fk.column_name}` +
          ` -> ${fk.referenced_table}.${fk.referenced_column}`
      );
    }
  }

  console.log("");
  console.log(`TOTAL FOREIGN KEYS: ${foreignKeys.length}`);
  console.log("");

  console.log("2. GENERATED READ-ONLY CHECKS FOR SUBCOUNTY ID 1361");
  console.log("------------------------------------------------------------");

  if (foreignKeys.length === 0) {
    console.log("No referencing tables require checking.");
  } else {
    for (const fk of foreignKeys) {
      const generatedSql =
        `SELECT COUNT(*) AS references_1361 ` +
        `FROM "${fk.table_schema}"."${fk.table_name}" ` +
        `WHERE "${fk.column_name}" = 1361;`;

      console.log("");
      console.log(`TABLE: ${fk.table_schema}.${fk.table_name}`);
      console.log(`COLUMN: ${fk.column_name}`);
      console.log(generatedSql);
    }
  }

  console.log("");
  console.log("3. DIRECT SUBCOUNTY 1361 CHECK");
  console.log("------------------------------------------------------------");

  const subcounty = await prisma.$queryRaw<
    Array<{
      id: bigint | number;
      name: string;
      countyId: bigint | number;
    }>
  >`
    SELECT
      id,
      name,
      "countyId"
    FROM "SubCounty"
    WHERE id = 1361;
  `;

  if (subcounty.length === 0) {
    console.log("SubCounty ID 1361 NOT FOUND.");
  } else {
    for (const row of subcounty) {
      console.log(`ID: ${row.id}`);
      console.log(`NAME: ${row.name}`);
      console.log(`COUNTY ID: ${row.countyId}`);
    }
  }

  console.log("");
  console.log("4. DIRECT WARD REFERENCE CHECK");
  console.log("------------------------------------------------------------");

  const wards = await prisma.$queryRaw<
    Array<{
      count: bigint;
    }>
  >`
    SELECT COUNT(*) AS count
    FROM "Ward"
    WHERE "subCountyId" = 1361;
  `;

  console.log(`Ward.subCountyId = 1361: ${wards[0]?.count ?? 0}`);

  console.log("");
  console.log("============================================================");
  console.log("FORENSIC AUDIT COMPLETE");
  console.log("NO DATABASE CHANGES WERE MADE.");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("AUDIT FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });