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

const legacyIds = [1360, 1361, 1362, 1363, 1365, 1366, 1367, 1368];

async function main() {
  console.log("============================================================");
  console.log("MAKUENI EMPTY LEGACY SUBCOUNTY REFERENCE AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  console.log("TARGET IDS");
  console.log("------------------------------------------------------------");
  console.log(legacyIds.join(", "));
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
    WHERE id IN (1360, 1361, 1362, 1363, 1365, 1366, 1367, 1368)
    ORDER BY id;
  `;

  console.log("1. TARGET SUBCOUNTIES");
  console.log("------------------------------------------------------------");

  for (const row of subcounties) {
    console.log(
      `ID ${row.id} | ${row.name} | County ${row.countyId}`
    );
  }

  console.log("");
  console.log(`FOUND: ${subcounties.length} OF ${legacyIds.length}`);
  console.log("");

  type AuditRow = {
    id: number;
    name: string;
    businessPartners: number;
    destinationTransactions: number;
    sourceTransactions: number;
    farms: number;
    farmers: number;
    wards: number;
    totalReferences: number;
  };

  const results: AuditRow[] = [];

  console.log("2. FOREIGN-KEY REFERENCE COUNTS");
  console.log("------------------------------------------------------------");

  for (const row of subcounties) {
    const id = Number(row.id);

    const businessPartners = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "BusinessPartner"
      WHERE "subCountyId" = ${id};
    `;

    const destinationTransactions = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "CommodityTransaction"
      WHERE "destinationSubCountyId" = ${id};
    `;

    const sourceTransactions = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "CommodityTransaction"
      WHERE "sourceSubCountyId" = ${id};
    `;

    const farms = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "Farm"
      WHERE "subCountyId" = ${id};
    `;

    const farmers = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "Farmer"
      WHERE "subCountyId" = ${id};
    `;

    const wards = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "Ward"
      WHERE "subCountyId" = ${id};
    `;

    const bp = Number(businessPartners[0]?.count ?? 0);
    const destination = Number(
      destinationTransactions[0]?.count ?? 0
    );
    const source = Number(sourceTransactions[0]?.count ?? 0);
    const farm = Number(farms[0]?.count ?? 0);
    const farmer = Number(farmers[0]?.count ?? 0);
    const ward = Number(wards[0]?.count ?? 0);

    const total =
      bp +
      destination +
      source +
      farm +
      farmer +
      ward;

    results.push({
      id,
      name: row.name,
      businessPartners: bp,
      destinationTransactions: destination,
      sourceTransactions: source,
      farms: farm,
      farmers: farmer,
      wards: ward,
      totalReferences: total,
    });

    console.log(
      `ID ${id} | ${row.name} | ` +
        `BP=${bp} | DEST=${destination} | SOURCE=${source} | ` +
        `FARM=${farm} | FARMER=${farmer} | WARD=${ward} | ` +
        `TOTAL=${total}`
    );
  }

  console.log("");
  console.log("3. CLASSIFICATION");
  console.log("------------------------------------------------------------");

  let completelyEmpty = 0;
  let referenced = 0;

  for (const row of results) {
    if (row.totalReferences === 0) {
      completelyEmpty++;

      console.log(
        `ID ${row.id} | ${row.name} | ` +
          "EMPTY — NO CURRENT REFERENCES"
      );
    } else {
      referenced++;

      console.log(
        `ID ${row.id} | ${row.name} | ` +
          `REFERENCED — ${row.totalReferences} TOTAL REFERENCES`
      );
    }
  }

  console.log("");
  console.log("4. SUMMARY");
  console.log("------------------------------------------------------------");
  console.log(`TARGET LEGACY IDS: ${legacyIds.length}`);
  console.log(`FOUND IN DATABASE: ${subcounties.length}`);
  console.log(`COMPLETELY UNREFERENCED: ${completelyEmpty}`);
  console.log(`REFERENCED: ${referenced}`);
  console.log("");

  console.log("5. EMPTY / LEGACY CANDIDATES");
  console.log("------------------------------------------------------------");

  const emptyCandidates = results.filter(
    (row) => row.totalReferences === 0
  );

  if (emptyCandidates.length === 0) {
    console.log("NONE");
  } else {
    for (const row of emptyCandidates) {
      console.log(
        `ID ${row.id} | ${row.name} | ` +
          "0 wards | 0 farmers | 0 farms | " +
          "0 business partners | 0 transactions"
      );
    }
  }

  console.log("");
  console.log("6. SAFETY CLASSIFICATION");
  console.log("------------------------------------------------------------");

  if (referenced === 0 && subcounties.length === legacyIds.length) {
    console.log(
      "PASS — ALL TARGET LEGACY RECORDS ARE PRESENT AND COMPLETELY UNREFERENCED."
    );
    console.log(
      "PASS — NO FOREIGN-KEY REFERENCES FOUND."
    );
    console.log(
      "PASS — NO WARD REFERENCES FOUND."
    );
    console.log(
      "PASS — NO FARM REFERENCES FOUND."
    );
    console.log(
      "PASS — NO FARMER REFERENCES FOUND."
    );
    console.log(
      "PASS — NO BUSINESS PARTNER REFERENCES FOUND."
    );
    console.log(
      "PASS — NO COMMODITY TRANSACTION REFERENCES FOUND."
    );
    console.log("");
    console.log(
      "RESULT: ALL TARGET IDS ARE EMPTY LEGACY CANDIDATES."
    );
  } else {
    console.log(
      "WARNING — NOT ALL TARGET RECORDS ARE COMPLETELY UNREFERENCED."
    );
    console.log(
      "DO NOT DELETE OR MODIFY ANY RECORD BASED ON THIS AUDIT."
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("MAKUENI EMPTY LEGACY AUDIT COMPLETE");
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