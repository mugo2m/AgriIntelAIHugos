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

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

async function main() {
  console.log("============================================================");
  console.log("FINAL MAKUENI SUBCOUNTY STRUCTURAL AUDIT");
  console.log("COUNTY ID: 74 | COUNTY: MAKUENI");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  const subcounties = await prisma.$queryRaw<
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
    WHERE "countyId" = 74
    ORDER BY id;
  `;

  console.log("1. ALL MAKUENI SUBCOUNTIES");
  console.log("------------------------------------------------------------");

  if (subcounties.length === 0) {
    console.log("NO MAKUENI SUBCOUNTIES FOUND.");
    return;
  }

  console.log(`TOTAL SUBCOUNTIES: ${subcounties.length}`);
  console.log("");

  type Result = {
    id: number;
    name: string;
    normalizedName: string;
    wardCount: number;
    farmerCount: number;
    farmCount: number;
    businessPartnerCount: number;
    classification: string;
  };

  const results: Result[] = [];

  for (const subcounty of subcounties) {
    const id = Number(subcounty.id);

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

    const wardCount = Number(wards[0]?.count ?? 0);
    const farmerCount = Number(farmers[0]?.count ?? 0);
    const farmCount = Number(farms[0]?.count ?? 0);
    const businessPartnerCount = Number(
      businessPartners[0]?.count ?? 0
    );

    const normalizedName = normalizeName(subcounty.name);

    const classification =
      wardCount > 0
        ? "OPERATIONAL"
        : farmerCount > 0 ||
            farmCount > 0 ||
            businessPartnerCount > 0
          ? "REQUIRES REVIEW"
          : "EMPTY LEGACY";

    results.push({
      id,
      name: subcounty.name,
      normalizedName,
      wardCount,
      farmerCount,
      farmCount,
      businessPartnerCount,
      classification,
    });
  }

  console.log(
    "ID     NAME                         WARDS   FARMERS   FARMS   PARTNERS   CLASSIFICATION"
  );
  console.log(
    "--------------------------------------------------------------------------------"
  );

  for (const row of results) {
    console.log(
      `${String(row.id).padEnd(6)} ` +
        `${row.name.padEnd(28)} ` +
        `${String(row.wardCount).padEnd(7)} ` +
        `${String(row.farmerCount).padEnd(9)} ` +
        `${String(row.farmCount).padEnd(7)} ` +
        `${String(row.businessPartnerCount).padEnd(10)} ` +
        `${row.classification}`
    );
  }

  console.log("");
  console.log("2. NORMALIZED NAME ANALYSIS");
  console.log("------------------------------------------------------------");

  const groups = new Map<string, Result[]>();

  for (const row of results) {
    const existing = groups.get(row.normalizedName) ?? [];
    existing.push(row);
    groups.set(row.normalizedName, existing);
  }

  let duplicateGroups = 0;

  for (const [normalizedName, rows] of groups.entries()) {
    if (rows.length > 1) {
      duplicateGroups++;

      console.log("");
      console.log(`NORMALIZED NAME: ${normalizedName}`);

      for (const row of rows) {
        console.log(
          `  ID ${row.id} | ${row.name} | ` +
            `${row.wardCount} wards | ${row.classification}`
        );
      }
    }
  }

  if (duplicateGroups === 0) {
    console.log("NO DUPLICATE NORMALIZED SUBCOUNTY NAMES FOUND.");
  }

  console.log("");
  console.log("3. OPERATIONAL RECORDS");
  console.log("------------------------------------------------------------");

  const operational = results.filter(
    (row) => row.classification === "OPERATIONAL"
  );

  for (const row of operational) {
    console.log(
      `ID ${row.id} | ${row.name} | ${row.wardCount} wards`
    );
  }

  console.log("");
  console.log(`OPERATIONAL COUNT: ${operational.length}`);

  console.log("");
  console.log("4. EMPTY LEGACY CANDIDATES");
  console.log("------------------------------------------------------------");

  const emptyLegacy = results.filter(
    (row) => row.classification === "EMPTY LEGACY"
  );

  for (const row of emptyLegacy) {
    console.log(
      `ID ${row.id} | ${row.name} | ` +
        "0 wards | 0 farmers | 0 farms | 0 business partners"
    );
  }

  console.log("");
  console.log(`EMPTY LEGACY COUNT: ${emptyLegacy.length}`);

  console.log("");
  console.log("5. RECORDS REQUIRING REVIEW");
  console.log("------------------------------------------------------------");

  const review = results.filter(
    (row) => row.classification === "REQUIRES REVIEW"
  );

  if (review.length === 0) {
    console.log("NONE.");
  } else {
    for (const row of review) {
      console.log(
        `ID ${row.id} | ${row.name} | ` +
          `wards=${row.wardCount} | ` +
          `farmers=${row.farmerCount} | ` +
          `farms=${row.farmCount} | ` +
          `partners=${row.businessPartnerCount}`
      );
    }
  }

  console.log("");
  console.log(`REVIEW COUNT: ${review.length}`);

  console.log("");
  console.log("6. KNOWN KIBWEZI OPERATIONAL STRUCTURE");
  console.log("------------------------------------------------------------");

  const kibweziRecords = results.filter(
    (row) =>
      row.id === 362 ||
      row.id === 401 ||
      row.id === 1361
  );

  for (const row of kibweziRecords) {
    console.log(
      `ID ${row.id} | ${row.name} | ` +
        `${row.wardCount} wards | ${row.classification}`
    );
  }

  console.log("");
  console.log("Expected operational Kibwezi records:");
  console.log("362 = Kibwezi West");
  console.log("401 = Kibwezi East");
  console.log("1361 = legacy Kibwezi with zero wards");

  console.log("");
  console.log("7. FINAL STRUCTURAL SUMMARY");
  console.log("------------------------------------------------------------");

  console.log(`Makueni subcounties: ${results.length}`);
  console.log(`Operational: ${operational.length}`);
  console.log(`Empty legacy candidates: ${emptyLegacy.length}`);
  console.log(`Requires review: ${review.length}`);
  console.log(`Duplicate normalized-name groups: ${duplicateGroups}`);

  console.log("");

  if (
    results.length === 14 &&
    operational.length === 6 &&
    emptyLegacy.length === 8 &&
    review.length === 0 &&
    duplicateGroups === 0
  ) {
    console.log("PASS — MAKUENI STRUCTURE IS CONSISTENT.");
    console.log("PASS — 14 SUBCOUNTIES FOUND.");
    console.log("PASS — 6 OPERATIONAL RECORDS.");
    console.log("PASS — 8 EMPTY LEGACY CANDIDATES.");
    console.log("PASS — NO RECORDS REQUIRE REVIEW.");
    console.log("PASS — NO DUPLICATE NORMALIZED NAMES.");
  } else {
    console.log(
      "WARNING — STRUCTURE DOES NOT MATCH EXPECTED BASELINE."
    );
    console.log(
      "DO NOT MAKE DATABASE CHANGES UNTIL THE DIFFERENCE IS REVIEWED."
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("FINAL MAKUENI STRUCTURAL AUDIT COMPLETE");
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