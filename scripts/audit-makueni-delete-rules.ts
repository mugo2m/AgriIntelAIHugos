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
  console.log("MAKUENI SUBCOUNTY DELETE-RULE FORENSIC AUDIT");
  console.log("TARGET: EMPTY LEGACY SUBCOUNTIES");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  console.log("1. POSTGRESQL FOREIGN-KEY DELETE RULES");
  console.log("------------------------------------------------------------");

  const constraints = await prisma.$queryRaw<
    Array<{
      constraint_name: string;
      table_name: string;
      column_name: string;
      referenced_table: string;
      referenced_column: string;
      delete_rule: string;
      update_rule: string;
    }>
  >`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = ccu.constraint_name
      AND ccu.table_schema = ccu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.constraint_schema = rc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND LOWER(ccu.table_name) = LOWER('SubCounty')
    ORDER BY tc.table_name, kcu.column_name;
  `;

  if (constraints.length === 0) {
    console.log("NO FOREIGN-KEY CONSTRAINTS FOUND.");
  } else {
    for (const constraint of constraints) {
      console.log("");
      console.log(`CONSTRAINT: ${constraint.constraint_name}`);
      console.log(
        `TABLE: ${constraint.table_name}.${constraint.column_name}`
      );
      console.log(
        `REFERENCES: ${constraint.referenced_table}.${constraint.referenced_column}`
      );
      console.log(`DELETE RULE: ${constraint.delete_rule}`);
      console.log(`UPDATE RULE: ${constraint.update_rule}`);
    }
  }

  console.log("");
  console.log("2. TARGET LEGACY RECORDS");
  console.log("------------------------------------------------------------");

  const targets = await prisma.$queryRaw<
    Array<{
      id: bigint;
      name: string;
      countyId: bigint;
    }>
  >`
    SELECT
      id,
      name,
      "countyId"
    FROM "SubCounty"
    WHERE id IN (
      1360,
      1361,
      1362,
      1363,
      1365,
      1366,
      1367,
      1368
    )
    ORDER BY id;
  `;

  for (const target of targets) {
    console.log(
      `ID ${target.id} | ${target.name} | County ${target.countyId}`
    );
  }

  console.log("");
  console.log(`TARGET RECORDS FOUND: ${targets.length}`);
  console.log("");

  console.log("3. CURRENT REFERENCE COUNTS");
  console.log("------------------------------------------------------------");

  for (const target of targets) {
    const id = Number(target.id);

    const wards = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "Ward"
      WHERE "subCountyId" = ${id};
    `;

    const farmers = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "Farmer"
      WHERE "subCountyId" = ${id};
    `;

    const farms = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "Farm"
      WHERE "subCountyId" = ${id};
    `;

    const businessPartners = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "BusinessPartner"
      WHERE "subCountyId" = ${id};
    `;

    const sourceTransactions = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "CommodityTransaction"
      WHERE "sourceSubCountyId" = ${id};
    `;

    const destinationTransactions = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "CommodityTransaction"
      WHERE "destinationSubCountyId" = ${id};
    `;

    console.log(
      `ID ${id} | ${target.name} | ` +
        `Ward=${wards[0]?.count ?? 0} | ` +
        `Farmer=${farmers[0]?.count ?? 0} | ` +
        `Farm=${farms[0]?.count ?? 0} | ` +
        `BusinessPartner=${businessPartners[0]?.count ?? 0} | ` +
        `SourceTransaction=${sourceTransactions[0]?.count ?? 0} | ` +
        `DestinationTransaction=${destinationTransactions[0]?.count ?? 0}`
    );
  }

  console.log("");
  console.log("4. SAFETY CHECK");
  console.log("------------------------------------------------------------");

  const totalReferences = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*) AS count
    FROM "Ward"
    WHERE "subCountyId" IN (
      1360,
      1361,
      1362,
      1363,
      1365,
      1366,
      1367,
      1368
    );
  `;

  console.log(
    `WARD REFERENCES TO ALL TARGET IDS: ${totalReferences[0]?.count ?? 0}`
  );

  console.log("");
  console.log("============================================================");
  console.log("DELETE-RULE FORENSIC AUDIT COMPLETE");
  console.log("READ-ONLY — NO DATABASE CHANGES");
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