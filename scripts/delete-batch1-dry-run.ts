import "dotenv/config";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

type Target = {
  id: number;
  countyId: number;
  county: string;
  name: string;
};

const targets: Target[] = [
  // HOMA BAY - 51
  { id: 1540, countyId: 51, county: "Homa Bay", name: "Homa Bay" },
  { id: 1542, countyId: 51, county: "Homa Bay", name: "Rachuonyo North" },
  { id: 1543, countyId: 51, county: "Homa Bay", name: "Rachuonyo East" },
  { id: 1544, countyId: 51, county: "Homa Bay", name: "Rachuonyo South" },
  { id: 1546, countyId: 51, county: "Homa Bay", name: "Suba North" },
  { id: 1547, countyId: 51, county: "Homa Bay", name: "Suba South" },

  // BUNGOMA - 53
  { id: 1512, countyId: 53, county: "Bungoma", name: "Bungoma Central" },
  { id: 1513, countyId: 53, county: "Bungoma", name: "Bungoma East" },
  { id: 1514, countyId: 53, county: "Bungoma", name: "Bungoma North" },
  { id: 1515, countyId: 53, county: "Bungoma", name: "Bungoma South" },
  { id: 1518, countyId: 53, county: "Bungoma", name: "Bungoma West" },
  { id: 1521, countyId: 53, county: "Bungoma", name: "Mt Elgon Forest" },

  // KAKAMEGA - 54
  { id: 1494, countyId: 54, county: "Kakamega", name: "Kakamega Central" },
  { id: 1495, countyId: 54, county: "Kakamega", name: "Kakamega East" },
  { id: 1496, countyId: 54, county: "Kakamega", name: "Kakamega North" },
  { id: 1497, countyId: 54, county: "Kakamega", name: "Kakamega South" },
  { id: 1501, countyId: 54, county: "Kakamega", name: "Matete" },

  // KITUI - 68
  { id: 1333, countyId: 68, county: "Kitui", name: "Ikutha" },
  { id: 1334, countyId: 68, county: "Kitui", name: "Katulani" },
  { id: 1335, countyId: 68, county: "Kitui", name: "Kisasi" },
  { id: 1338, countyId: 68, county: "Kitui", name: "Kyuso" },
  { id: 1339, countyId: 68, county: "Kitui", name: "Lower Yatta" },
  { id: 1340, countyId: 68, county: "Kitui", name: "Matinyani" },
  { id: 1341, countyId: 68, county: "Kitui", name: "Migwani" },
  { id: 1342, countyId: 68, county: "Kitui", name: "Mumoni" },
  { id: 1343, countyId: 68, county: "Kitui", name: "Mutitu" },
  { id: 1344, countyId: 68, county: "Kitui", name: "Mutitu North" },
  { id: 1345, countyId: 68, county: "Kitui", name: "Mutomo" },
  { id: 1347, countyId: 68, county: "Kitui", name: "Mwingi East" },
  { id: 1348, countyId: 68, county: "Kitui", name: "Nzambani" },
  { id: 1349, countyId: 68, county: "Kitui", name: "Thagicu" },
  { id: 1350, countyId: 68, county: "Kitui", name: "Tseikuru" },

  // KISII - 87
  { id: 1556, countyId: 87, county: "Kisii", name: "Etago" },
  { id: 1557, countyId: 87, county: "Kisii", name: "Gucha" },
  { id: 1558, countyId: 87, county: "Kisii", name: "Gucha South" },
  { id: 1559, countyId: 87, county: "Kisii", name: "Kenyenya" },
  { id: 1560, countyId: 87, county: "Kisii", name: "Kisii Central" },
  { id: 1561, countyId: 87, county: "Kisii", name: "Kisii South" },
  { id: 1562, countyId: 87, county: "Kisii", name: "Kitutu Central" },
  { id: 1563, countyId: 87, county: "Kisii", name: "Marani" },
  { id: 1564, countyId: 87, county: "Kisii", name: "Masaba South" },
  { id: 1565, countyId: 87, county: "Kisii", name: "Nyamache" },
  { id: 1566, countyId: 87, county: "Kisii", name: "Sameta" },
];

const expectedCounts = {
  51: 6,
  53: 6,
  54: 5,
  68: 15,
  87: 11,
};

function fail(message: string): never {
  console.error("");
  console.error("============================================================");
  console.error("DRY RUN FAILED");
  console.error("============================================================");
  console.error(message);
  console.error("");
  process.exit(1);
}

async function main() {
  let failures = 0;

  console.log("============================================================");
  console.log("BATCH 1 SUBCOUNTY DELETION DRY RUN");
  console.log("============================================================");
  console.log("Mode: READ ONLY — NO DELETE WILL OCCUR");
  console.log("");
  console.log(`Whitelist size: ${targets.length}`);
  console.log("");

  // ----------------------------------------------------------
  // 1. Verify whitelist size
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("1. WHITELIST VERIFICATION");
  console.log("------------------------------------------------------------");

  if (targets.length !== 43) {
    console.error(
      `FAIL: Expected 43 targets, found ${targets.length}`
    );
    failures++;
  } else {
    console.log("PASS: Exactly 43 deletion targets defined.");
  }

  const uniqueIds = new Set(targets.map((x) => x.id));

  if (uniqueIds.size !== targets.length) {
    console.error("FAIL: Duplicate target IDs detected.");
    failures++;
  } else {
    console.log("PASS: All target IDs are unique.");
  }

  console.log("");

  // ----------------------------------------------------------
  // 2. Verify target records
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("2. TARGET RECORD VERIFICATION");
  console.log("------------------------------------------------------------");

  const ids = targets.map((x) => x.id);

  const records = await prisma.subCounty.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      _count: {
        select: {
          wards: true,
        },
      },
    },
    orderBy: {
      countyId: "asc",
    },
  });

  console.log(`Records found: ${records.length}/43`);
  console.log("");

  if (records.length !== 43) {
    console.error(
      `FAIL: Expected 43 records, found ${records.length}.`
    );
    failures++;
  }

  for (const target of targets) {
    const record = records.find((x) => x.id === target.id);

    if (!record) {
      console.error(
        `FAIL: Missing ID ${target.id} | ` +
        `${target.county} | ${target.name}`
      );
      failures++;
      continue;
    }

    if (record.countyId !== target.countyId) {
      console.error(
        `FAIL: ID ${target.id} county mismatch. ` +
        `Expected ${target.countyId}, found ${record.countyId}`
      );
      failures++;
    }

    if (record.name !== target.name) {
      console.error(
        `FAIL: ID ${target.id} name mismatch. ` +
        `Expected "${target.name}", found "${record.name}"`
      );
      failures++;
    }

    if (record._count.wards !== 0) {
      console.error(
        `FAIL: ID ${target.id} has ${record._count.wards} wards.`
      );
      failures++;
    }
  }

  if (failures === 0) {
    console.log(
      "PASS: All 43 target IDs, county IDs, names and Ward counts match."
    );
  }

  console.log("");

  // ----------------------------------------------------------
  // 3. Verify six reference paths directly
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("3. LIVE REFERENCE CHECK");
  console.log("------------------------------------------------------------");

  const checks = [
    {
      name: "BusinessPartner.subCountyId",
      sql: `
        SELECT COUNT(*)::int AS count
        FROM "BusinessPartner"
        WHERE "subCountyId" = ANY($1::int[])
      `,
    },
    {
      name: "CommodityTransaction.destinationSubCountyId",
      sql: `
        SELECT COUNT(*)::int AS count
        FROM "CommodityTransaction"
        WHERE "destinationSubCountyId" = ANY($1::int[])
      `,
    },
    {
      name: "CommodityTransaction.sourceSubCountyId",
      sql: `
        SELECT COUNT(*)::int AS count
        FROM "CommodityTransaction"
        WHERE "sourceSubCountyId" = ANY($1::int[])
      `,
    },
    {
      name: "Farm.subCountyId",
      sql: `
        SELECT COUNT(*)::int AS count
        FROM "Farm"
        WHERE "subCountyId" = ANY($1::int[])
      `,
    },
    {
      name: "Farmer.subCountyId",
      sql: `
        SELECT COUNT(*)::int AS count
        FROM "Farmer"
        WHERE "subCountyId" = ANY($1::int[])
      `,
    },
    {
      name: "Ward.subCountyId",
      sql: `
        SELECT COUNT(*)::int AS count
        FROM "Ward"
        WHERE "subCountyId" = ANY($1::int[])
      `,
    },
  ];

  let totalReferences = 0;

  for (const check of checks) {
    const result = await pool.query(check.sql, [ids]);

    const count = Number(result.rows[0]?.count ?? 0);

    totalReferences += count;

    if (count === 0) {
      console.log(`PASS: ${check.name} = 0`);
    } else {
      console.error(
        `FAIL: ${check.name} = ${count}`
      );
      failures++;
    }
  }

  console.log("");
  console.log(`TOTAL LIVE REFERENCES: ${totalReferences}`);

  if (totalReferences === 0) {
    console.log("PASS: No database records reference the 43 targets.");
  }

  console.log("");

  // ----------------------------------------------------------
  // 4. County-by-county deletion summary
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("4. DELETION SUMMARY");
  console.log("------------------------------------------------------------");

  for (const [countyId, expected] of Object.entries(expectedCounts)) {
    const countyTargets = targets.filter(
      (x) => x.countyId === Number(countyId)
    );

    const countyRecords = records.filter(
      (x) => x.countyId === Number(countyId)
    );

    console.log(
      `${countyTargets[0]?.county ?? "Unknown"} (${countyId}): ` +
      `${countyRecords.length}/${expected} targets`
    );

    if (countyRecords.length !== expected) {
      console.error(
        `FAIL: County ${countyId} expected ${expected}, ` +
        `found ${countyRecords.length}`
      );
      failures++;
    }
  }

  console.log("");

  // ----------------------------------------------------------
  // 5. Confirm NO other IDs are included
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("5. SCOPE PROTECTION");
  console.log("------------------------------------------------------------");

  const recordIdSet = new Set(records.map((x) => x.id));

  const unexpected = records.filter(
    (record) => !uniqueIds.has(record.id)
  );

  if (unexpected.length > 0) {
    console.error(
      `FAIL: ${unexpected.length} unexpected IDs returned.`
    );
    failures++;
  } else {
    console.log("PASS: No unexpected SubCounty IDs are in scope.");
  }

  if (recordIdSet.size === 43) {
    console.log("PASS: Exactly 43 unique database IDs are in scope.");
  } else {
    console.error(
      `FAIL: Expected 43 unique database IDs, found ${recordIdSet.size}`
    );
    failures++;
  }

  console.log("");

  // ----------------------------------------------------------
  // 6. Final dry-run result
  // ----------------------------------------------------------

  console.log("============================================================");

  if (failures === 0 && totalReferences === 0) {
    console.log("BATCH 1 DELETION DRY RUN: PASS");
    console.log("============================================================");
    console.log("");
    console.log("43 exact SubCounty records are eligible.");
    console.log("0 references across all six FK paths.");
    console.log("0 Ward references.");
    console.log("No unexpected IDs included.");
    console.log("");
    console.log("NO DATABASE CHANGES WERE MADE.");
    console.log("");
    console.log("NEXT STEP:");
    console.log("Transactional deletion of exactly these 43 IDs.");
    console.log("");
  } else {
    console.log("BATCH 1 DELETION DRY RUN: FAIL");
    console.log("============================================================");
    console.log("");
    console.log(`Failures detected: ${failures}`);
    console.log("");
    console.log("NO DATABASE CHANGES WERE MADE.");
    console.log("");
    fail("Batch 1 is NOT approved for deletion.");
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("============================================================");
    console.error("UNEXPECTED DRY-RUN ERROR");
    console.error("============================================================");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });