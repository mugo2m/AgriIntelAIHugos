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
  console.log("SUBCOUNTY 1361 — COMPLETE REFERENCE AUDIT");
  console.log("TARGET: Kibwezi | ID 1361 | Makueni County");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  const subcounty = await prisma.$queryRaw<
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
    WHERE id = 1361;
  `;

  console.log("1. TARGET SUBCOUNTY");
  console.log("------------------------------------------------------------");

  if (subcounty.length === 0) {
    console.log("SubCounty ID 1361 NOT FOUND.");
    return;
  }

  console.log(`ID: ${subcounty[0].id}`);
  console.log(`NAME: ${subcounty[0].name}`);
  console.log(`COUNTY ID: ${subcounty[0].countyId}`);
  console.log("");

  console.log("2. ALL FOREIGN-KEY REFERENCES TO ID 1361");
  console.log("------------------------------------------------------------");

  const businessPartners = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*) AS count
    FROM "BusinessPartner"
    WHERE "subCountyId" = 1361;
  `;

  const destinationTransactions = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*) AS count
    FROM "CommodityTransaction"
    WHERE "destinationSubCountyId" = 1361;
  `;

  const sourceTransactions = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*) AS count
    FROM "CommodityTransaction"
    WHERE "sourceSubCountyId" = 1361;
  `;

  const farms = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*) AS count
    FROM "Farm"
    WHERE "subCountyId" = 1361;
  `;

  const farmers = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*) AS count
    FROM "Farmer"
    WHERE "subCountyId" = 1361;
  `;

  const wards = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*) AS count
    FROM "Ward"
    WHERE "subCountyId" = 1361;
  `;

  console.log(
    `BusinessPartner.subCountyId = 1361: ${businessPartners[0]?.count ?? 0}`
  );

  console.log(
    `CommodityTransaction.destinationSubCountyId = 1361: ${destinationTransactions[0]?.count ?? 0}`
  );

  console.log(
    `CommodityTransaction.sourceSubCountyId = 1361: ${sourceTransactions[0]?.count ?? 0}`
  );

  console.log(
    `Farm.subCountyId = 1361: ${farms[0]?.count ?? 0}`
  );

  console.log(
    `Farmer.subCountyId = 1361: ${farmers[0]?.count ?? 0}`
  );

  console.log(
    `Ward.subCountyId = 1361: ${wards[0]?.count ?? 0}`
  );

  const totalReferences =
    Number(businessPartners[0]?.count ?? 0) +
    Number(destinationTransactions[0]?.count ?? 0) +
    Number(sourceTransactions[0]?.count ?? 0) +
    Number(farms[0]?.count ?? 0) +
    Number(farmers[0]?.count ?? 0) +
    Number(wards[0]?.count ?? 0);

  console.log("");
  console.log("3. TOTAL REFERENCES");
  console.log("------------------------------------------------------------");
  console.log(`TOTAL REFERENCES TO SUBCOUNTY 1361: ${totalReferences}`);

  console.log("");
  console.log("4. CLASSIFICATION");
  console.log("------------------------------------------------------------");

  if (totalReferences === 0) {
    console.log("PASS — SUBCOUNTY 1361 IS COMPLETELY UNREFERENCED.");
    console.log("PASS — NO BUSINESS PARTNER REFERENCES.");
    console.log("PASS — NO COMMODITY TRANSACTION REFERENCES.");
    console.log("PASS — NO FARM REFERENCES.");
    console.log("PASS — NO FARMER REFERENCES.");
    console.log("PASS — NO WARD REFERENCES.");
    console.log("");
    console.log("CLASSIFICATION: EMPTY / LEGACY / SAFE FOR FURTHER REVIEW");
  } else {
    console.log("WARNING — SUBCOUNTY 1361 HAS ACTIVE REFERENCES.");
    console.log("DO NOT DELETE OR MODIFY ID 1361.");
    console.log("");
    console.log("CLASSIFICATION: REFERENCED — REQUIRES FURTHER ANALYSIS");
  }

  console.log("");
  console.log("============================================================");
  console.log("COMPLETE REFERENCE AUDIT FINISHED");
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