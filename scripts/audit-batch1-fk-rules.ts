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
  { id: 1515, countyId: 53, countyId: 53, county: "Bungoma", name: "Bungoma South" },
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

const countyExpectations = [
  { id: 51, name: "Homa Bay" },
  { id: 53, name: "Bungoma" },
  { id: 54, name: "Kakamega" },
  { id: 68, name: "Kitui" },
  { id: 87, name: "Kisii" },
];

const expectedForeignKeys = [
  {
    table: "BusinessPartner",
    column: "subCountyId",
    onDelete: "SET NULL",
  },
  {
    table: "CommodityTransaction",
    column: "destinationSubCountyId",
    onDelete: "SET NULL",
  },
  {
    table: "CommodityTransaction",
    column: "sourceSubCountyId",
    onDelete: "SET NULL",
  },
  {
    table: "Farm",
    column: "subCountyId",
    onDelete: "SET NULL",
  },
  {
    table: "Farmer",
    column: "subCountyId",
    onDelete: "RESTRICT",
  },
  {
    table: "Ward",
    column: "subCountyId",
    onDelete: "SET NULL",
  },
];

function fail(message: string): never {
  console.error("");
  console.error("============================================================");
  console.error("AUDIT FAILED");
  console.error("============================================================");
  console.error(message);
  console.error("");
  process.exit(1);
}

async function main() {
  let failures = 0;

  console.log("============================================================");
  console.log("BATCH 1 FK-CATALOG VERIFICATION");
  console.log("============================================================");
  console.log("Mode: READ ONLY");
  console.log("Counties: Homa Bay, Bungoma, Kakamega, Kitui, Kisii");
  console.log(`Target SubCounties: ${targets.length}`);
  console.log("");

  // ----------------------------------------------------------
  // 1. Verify PostgreSQL FK catalog
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("1. POSTGRESQL FOREIGN KEY CATALOG");
  console.log("------------------------------------------------------------");

  const fkRows = await pool.query(`
    SELECT
      c.conname AS constraint_name,
      src.relname AS source_table,
      src_col.attname AS source_column,
      tgt.relname AS target_table,
      tgt_col.attname AS target_column,
      CASE c.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE c.confdeltype::text
      END AS on_delete
    FROM pg_constraint c
    JOIN pg_class src
      ON src.oid = c.conrelid
    JOIN pg_class tgt
      ON tgt.oid = c.confrelid
    JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS src_keys(attnum, ord)
      ON TRUE
    JOIN LATERAL unnest(c.confkey) WITH ORDINALITY AS tgt_keys(attnum, ord)
      ON tgt_keys.ord = src_keys.ord
    JOIN pg_attribute src_col
      ON src_col.attrelid = src.oid
     AND src_col.attnum = src_keys.attnum
    JOIN pg_attribute tgt_col
      ON tgt_col.attrelid = tgt.oid
     AND tgt_col.attnum = tgt_keys.attnum
    WHERE c.contype = 'f'
      AND tgt.relname = 'SubCounty'
      AND tgt_col.attname = 'id'
    ORDER BY src.relname, src_col.attname, c.conname;
  `);

  console.log(`Foreign keys referencing SubCounty.id: ${fkRows.rows.length}`);
  console.log("");

  for (const row of fkRows.rows) {
    console.log(
      `${row.source_table}.${row.source_column} -> ` +
      `${row.target_table}.${row.target_column} | ` +
      `ON DELETE ${row.on_delete} | ` +
      `${row.constraint_name}`
    );
  }

  console.log("");

  if (fkRows.rows.length !== expectedForeignKeys.length) {
    console.error(
      `Expected exactly ${expectedForeignKeys.length} FKs but found ${fkRows.rows.length}`
    );
    failures++;
  }

  for (const expected of expectedForeignKeys) {
    const matches = fkRows.rows.filter(
      (row) =>
        row.source_table === expected.table &&
        row.source_column === expected.column &&
        row.target_table === "SubCounty" &&
        row.target_column === "id"
    );

    if (matches.length !== 1) {
      console.error(
        `FAIL: Missing or duplicated FK ${expected.table}.${expected.column}`
      );
      failures++;
      continue;
    }

    const actual = matches[0].on_delete;

    if (actual !== expected.onDelete) {
      console.error(
        `FAIL: ${expected.table}.${expected.column} expected ON DELETE ` +
        `${expected.onDelete}, found ${actual}`
      );
      failures++;
    } else {
      console.log(
        `PASS: ${expected.table}.${expected.column} -> ` +
        `SubCounty.id | ON DELETE ${actual}`
      );
    }
  }

  console.log("");

  // ----------------------------------------------------------
  // 2. Verify the five counties
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("2. COUNTY VERIFICATION");
  console.log("------------------------------------------------------------");

  const countyIds = countyExpectations.map((x) => x.id);

  const counties = await prisma.county.findMany({
    where: {
      id: {
        in: countyIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(`Counties found: ${counties.length}/${countyExpectations.length}`);
  console.log("");

  for (const expected of countyExpectations) {
    const county = counties.find((x) => x.id === expected.id);

    if (!county) {
      console.error(
        `FAIL: County ${expected.id} (${expected.name}) was not found`
      );
      failures++;
      continue;
    }

    if (county.name !== expected.name) {
      console.error(
        `FAIL: County ${expected.id} expected "${expected.name}", ` +
        `found "${county.name}"`
      );
      failures++;
      continue;
    }

    console.log(`PASS: County ${county.id} = ${county.name}`);
  }

  console.log("");

  // ----------------------------------------------------------
  // 3. Verify exact 43 target IDs and names
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("3. TARGET SUBCOUNTY WHITELIST VERIFICATION");
  console.log("------------------------------------------------------------");

  const targetIds = targets.map((x) => x.id);

  const dbTargets = await prisma.subCounty.findMany({
    where: {
      id: {
        in: targetIds,
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
      id: "asc",
    },
  });

  console.log(`Target IDs found: ${dbTargets.length}/${targets.length}`);
  console.log("");

  if (dbTargets.length !== targets.length) {
    console.error("FAIL: Not all 43 target IDs exist.");
    failures++;
  }

  for (const expected of targets) {
    const actual = dbTargets.find((x) => x.id === expected.id);

    if (!actual) {
      console.error(
        `FAIL: Missing target ID ${expected.id} ` +
        `(${expected.county} / ${expected.name})`
      );
      failures++;
      continue;
    }

    if (actual.countyId !== expected.countyId) {
      console.error(
        `FAIL: ID ${expected.id} county mismatch. ` +
        `Expected ${expected.countyId}, found ${actual.countyId}`
      );
      failures++;
    }

    if (actual.name !== expected.name) {
      console.error(
        `FAIL: ID ${expected.id} name mismatch. ` +
        `Expected "${expected.name}", found "${actual.name}"`
      );
      failures++;
    }

    if (actual._count.wards !== 0) {
      console.error(
        `FAIL: ID ${expected.id} (${actual.name}) has ` +
        `${actual._count.wards} Ward references`
      );
      failures++;
    }
  }

  if (
    dbTargets.length === targets.length &&
    dbTargets.every(
      (actual) =>
        targets.some(
          (expected) =>
            expected.id === actual.id &&
            expected.countyId === actual.countyId &&
            expected.name === actual.name
        )
    )
  ) {
    console.log("PASS: All 43 target IDs, county IDs and names match exactly.");
    console.log("PASS: All 43 target SubCounties have zero Ward references.");
  }

  console.log("");

  // ----------------------------------------------------------
  // 4. Verify all six real FK reference paths
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("4. REFERENCE CHECK — ALL SIX FK PATHS");
  console.log("------------------------------------------------------------");

  const targetIdList = targetIds;

  const referenceQueries = [
    {
      name: "BusinessPartner.subCountyId",
      sql: `
        SELECT "subCountyId" AS id, COUNT(*)::int AS count
        FROM "BusinessPartner"
        WHERE "subCountyId" = ANY($1::int[])
        GROUP BY "subCountyId"
        ORDER BY "subCountyId"
      `,
    },
    {
      name: "CommodityTransaction.destinationSubCountyId",
      sql: `
        SELECT "destinationSubCountyId" AS id, COUNT(*)::int AS count
        FROM "CommodityTransaction"
        WHERE "destinationSubCountyId" = ANY($1::int[])
        GROUP BY "destinationSubCountyId"
        ORDER BY "destinationSubCountyId"
      `,
    },
    {
      name: "CommodityTransaction.sourceSubCountyId",
      sql: `
        SELECT "sourceSubCountyId" AS id, COUNT(*)::int AS count
        FROM "CommodityTransaction"
        WHERE "sourceSubCountyId" = ANY($1::int[])
        GROUP BY "sourceSubCountyId"
        ORDER BY "sourceSubCountyId"
      `,
    },
    {
      name: "Farm.subCountyId",
      sql: `
        SELECT "subCountyId" AS id, COUNT(*)::int AS count
        FROM "Farm"
        WHERE "subCountyId" = ANY($1::int[])
        GROUP BY "subCountyId"
        ORDER BY "subCountyId"
      `,
    },
    {
      name: "Farmer.subCountyId",
      sql: `
        SELECT "subCountyId" AS id, COUNT(*)::int AS count
        FROM "Farmer"
        WHERE "subCountyId" = ANY($1::int[])
        GROUP BY "subCountyId"
        ORDER BY "subCountyId"
      `,
    },
    {
      name: "Ward.subCountyId",
      sql: `
        SELECT "subCountyId" AS id, COUNT(*)::int AS count
        FROM "Ward"
        WHERE "subCountyId" = ANY($1::int[])
        GROUP BY "subCountyId"
        ORDER BY "subCountyId"
      `,
    },
  ];

  let totalReferences = 0;

  for (const query of referenceQueries) {
    const result = await pool.query(query.sql, [targetIdList]);

    const count = result.rows.reduce(
      (sum: number, row: { count: number }) => sum + Number(row.count),
      0
    );

    totalReferences += count;

    if (count === 0) {
      console.log(`PASS: ${query.name} = 0 references`);
    } else {
      console.error(`FAIL: ${query.name} = ${count} references`);

      for (const row of result.rows) {
        console.error(
          `      ID ${row.id}: ${row.count} reference(s)`
        );
      }

      failures++;
    }
  }

  console.log("");
  console.log(`TOTAL REFERENCES ACROSS ALL SIX PATHS: ${totalReferences}`);

  if (totalReferences === 0) {
    console.log("PASS: All 43 targets have zero database references.");
  }

  console.log("");

  // ----------------------------------------------------------
  // 5. Verify operational SubCounties and Ward counts
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("5. OPERATIONAL SUBCOUNTY / WARD INTEGRITY");
  console.log("------------------------------------------------------------");

  for (const countyExpectation of countyExpectations) {
    const subCounties = await prisma.subCounty.findMany({
      where: {
        countyId: countyExpectation.id,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            wards: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log("");
    console.log(
      `${countyExpectation.name} (${countyExpectation.id}): ` +
      `${subCounties.length} SubCounties`
    );

    let totalWards = 0;

    for (const subCounty of subCounties) {
      totalWards += subCounty._count.wards;

      console.log(
        `  ${subCounty.id} | ${subCounty.name} | ` +
        `${subCounty._count.wards} wards`
      );
    }

    console.log(`  TOTAL WARDS: ${totalWards}`);

    const targetIdsForCounty = targets
      .filter((x) => x.countyId === countyExpectation.id)
      .map((x) => x.id);

    const operational = subCounties.filter(
      (x) => !targetIdsForCounty.includes(x.id)
    );

    const operationalWardCount = operational.reduce(
      (sum, x) => sum + x._count.wards,
      0
    );

    console.log(
      `  OPERATIONAL SUBCOUNTIES AFTER EXCLUDING TARGETS: ` +
      `${operational.length}`
    );

    console.log(
      `  OPERATIONAL WARDS: ${operationalWardCount}`
    );

    if (operational.length === 0) {
      console.error(
        `FAIL: County ${countyExpectation.name} would have no ` +
        `operational SubCounties after target removal.`
      );
      failures++;
    }

    if (operationalWardCount === 0) {
      console.error(
        `FAIL: County ${countyExpectation.name} has zero operational wards.`
      );
      failures++;
    }
  }

  console.log("");

  // ----------------------------------------------------------
  // 6. Final target classification
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("6. FINAL BATCH 1 SAFETY CHECK");
  console.log("------------------------------------------------------------");

  const actualTargetIds = new Set(dbTargets.map((x) => x.id));

  const missingTargets = targets.filter(
    (target) => !actualTargetIds.has(target.id)
  );

  if (missingTargets.length > 0) {
    console.error(
      `FAIL: ${missingTargets.length} expected targets are missing.`
    );
    failures++;
  } else {
    console.log("PASS: All 43 target IDs exist.");
  }

  if (totalReferences !== 0) {
    console.error(
      "FAIL: One or more target SubCounties still have database references."
    );
    failures++;
  } else {
    console.log("PASS: All six FK paths contain zero references.");
  }

  if (fkRows.rows.length !== 6) {
    console.error(
      `FAIL: PostgreSQL catalog expected 6 real FKs, found ${fkRows.rows.length}.`
    );
    failures++;
  } else {
    console.log("PASS: PostgreSQL catalog contains exactly 6 real FKs.");
  }

  const fkRuleFailures = expectedForeignKeys.filter((expected) => {
    const row = fkRows.rows.find(
      (x) =>
        x.source_table === expected.table &&
        x.source_column === expected.column &&
        x.target_table === "SubCounty" &&
        x.target_column === "id"
    );

    return !row || row.on_delete !== expected.onDelete;
  });

  if (fkRuleFailures.length > 0) {
    console.error(
      `FAIL: ${fkRuleFailures.length} FK rule(s) do not match expectations.`
    );
    failures++;
  } else {
    console.log("PASS: All six FK delete rules match the expected schema.");
  }

  console.log("");

  // ----------------------------------------------------------
  // Final result
  // ----------------------------------------------------------

  console.log("============================================================");

  if (failures === 0) {
    console.log("BATCH 1 FK-CATALOG AUDIT: PASS");
    console.log("============================================================");
    console.log("");
    console.log("43 legacy SubCounty candidates verified.");
    console.log("0 database references.");
    console.log("0 Ward references.");
    console.log("Exactly 6 real PostgreSQL FK paths verified.");
    console.log("FK ON DELETE rules verified.");
    console.log("Five county structures remain operational.");
    console.log("");
    console.log("NO DATABASE CHANGES WERE MADE.");
    console.log("");
    console.log("NEXT STEP:");
    console.log("Create and run the 43-ID deletion DRY RUN.");
    console.log("");
  } else {
    console.log("BATCH 1 FK-CATALOG AUDIT: FAIL");
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
    console.error("UNEXPECTED AUDIT ERROR");
    console.error("============================================================");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });