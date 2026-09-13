import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString,
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

const expectedCounts: Record<number, number> = {
  51: 6,
  53: 6,
  54: 5,
  68: 15,
  87: 11,
};

const ids = targets.map((target) => target.id);

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const client = await pool.connect();

  let committed = false;

  try {
    console.log("============================================================");
    console.log("BATCH 1 TRANSACTIONAL SUBCOUNTY DELETION");
    console.log("============================================================");
    console.log("WARNING: DATABASE CHANGES WILL OCCUR");
    console.log("");
    console.log(`Exact deletion whitelist: ${ids.length} IDs`);
    console.log("");

    assert(ids.length === 43, `Expected 43 IDs, found ${ids.length}`);

    const uniqueIds = new Set(ids);

    assert(
      uniqueIds.size === 43,
      `Expected 43 unique IDs, found ${uniqueIds.size}`
    );

    console.log("PASS: Exact 43-ID whitelist confirmed.");
    console.log("");

    await client.query("BEGIN");

    console.log("Transaction started.");
    console.log("");

    // --------------------------------------------------------
    // 1. Lock and verify exact target records
    // --------------------------------------------------------

    console.log("------------------------------------------------------------");
    console.log("1. LOCKING AND VERIFYING TARGET RECORDS");
    console.log("------------------------------------------------------------");

    const targetResult = await client.query(
      `
      SELECT
        sc.id,
        sc."countyId",
        sc.name,
        c.name AS "countyName"
      FROM "SubCounty" sc
      JOIN "County" c
        ON c.id = sc."countyId"
      WHERE sc.id = ANY($1::int[])
      ORDER BY sc."countyId", sc.id
      FOR UPDATE OF sc
      `,
      [ids]
    );

    console.log(`Locked target records: ${targetResult.rows.length}/43`);

    assert(
      targetResult.rows.length === 43,
      `Target count changed. Expected 43, found ${targetResult.rows.length}`
    );

    for (const target of targets) {
      const row = targetResult.rows.find(
        (item) => Number(item.id) === target.id
      );

      assert(
        !!row,
        `Target ID ${target.id} is missing inside transaction`
      );

      assert(
        Number(row.countyId) === target.countyId,
        `County mismatch for ID ${target.id}: expected ${target.countyId}, found ${row.countyId}`
      );

      assert(
        row.name === target.name,
        `Name mismatch for ID ${target.id}: expected "${target.name}", found "${row.name}"`
      );

      assert(
        row.countyName === target.county,
        `County name mismatch for ID ${target.id}: expected "${target.county}", found "${row.countyName}"`
      );
    }

    console.log(
      "PASS: All 43 IDs, county IDs, county names and SubCounty names match."
    );
    console.log("");

    // --------------------------------------------------------
    // 2. Lock and verify zero Ward references
    // --------------------------------------------------------

    console.log("------------------------------------------------------------");
    console.log("2. WARD REFERENCE CHECK");
    console.log("------------------------------------------------------------");

    const wardResult = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM "Ward"
      WHERE "subCountyId" = ANY($1::int[])
      `,
      [ids]
    );

    const wardCount = Number(wardResult.rows[0]?.count ?? 0);

    console.log(`Ward references: ${wardCount}`);

    assert(
      wardCount === 0,
      `ABORT: ${wardCount} Ward references exist`
    );

    console.log("PASS: 0 Ward references.");
    console.log("");

    // --------------------------------------------------------
    // 3. Verify all six FK paths
    // --------------------------------------------------------

    console.log("------------------------------------------------------------");
    console.log("3. SIX FK REFERENCE CHECKS");
    console.log("------------------------------------------------------------");

    const referenceChecks = [
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

    for (const check of referenceChecks) {
      const result = await client.query(check.sql, [ids]);

      const count = Number(result.rows[0]?.count ?? 0);

      totalReferences += count;

      console.log(`${check.name}: ${count}`);

      assert(
        count === 0,
        `ABORT: ${check.name} contains ${count} references`
      );
    }

    console.log("");
    console.log("PASS: All six FK paths contain 0 references.");
    console.log(`TOTAL REFERENCES: ${totalReferences}`);
    console.log("");

    // --------------------------------------------------------
    // 4. Verify PostgreSQL FK catalog inside transaction
    // --------------------------------------------------------

    console.log("------------------------------------------------------------");
    console.log("4. FK CATALOG SAFETY CHECK");
    console.log("------------------------------------------------------------");

    const fkResult = await client.query(`
      SELECT
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
      ORDER BY src.relname, src_col.attname
    `);

    assert(
      fkResult.rows.length === 6,
      `ABORT: Expected 6 SubCounty FK paths, found ${fkResult.rows.length}`
    );

    console.log("PASS: Exactly 6 real PostgreSQL FK paths exist.");
    console.log("");

    // --------------------------------------------------------
    // 5. County scope verification
    // --------------------------------------------------------

    console.log("------------------------------------------------------------");
    console.log("5. COUNTY SCOPE CHECK");
    console.log("------------------------------------------------------------");

    for (const [countyIdText, expectedCount] of Object.entries(
      expectedCounts
    )) {
      const countyId = Number(countyIdText);

      const result = await client.query(
        `
        SELECT COUNT(*)::int AS count
        FROM "SubCounty"
        WHERE id = ANY($1::int[])
          AND "countyId" = $2
        `,
        [ids, countyId]
      );

      const count = Number(result.rows[0]?.count ?? 0);

      console.log(
        `County ${countyId}: ${count}/${expectedCount} targets`
      );

      assert(
        count === expectedCount,
        `ABORT: County ${countyId} expected ${expectedCount} targets, found ${count}`
      );
    }

    console.log("");
    console.log("PASS: County target counts match exactly.");
    console.log("");

    // --------------------------------------------------------
    // 6. DELETE EXACTLY THE WHITELIST
    // --------------------------------------------------------

    console.log("------------------------------------------------------------");
    console.log("6. DELETING EXACT 43-ID WHITELIST");
    console.log("------------------------------------------------------------");

    const deleteResult = await client.query(
      `
      DELETE FROM "SubCounty"
      WHERE id = ANY($1::int[])
      RETURNING id, "countyId", name
      `,
      [ids]
    );

    console.log(
      `Rows deleted inside transaction: ${deleteResult.rowCount}`
    );

    assert(
      deleteResult.rowCount === 43,
      `ABORT: Expected to delete 43 rows, deleted ${deleteResult.rowCount}`
    );

    const deletedIds = new Set(
      deleteResult.rows.map((row) => Number(row.id))
    );

    assert(
      deletedIds.size === 43,
      `ABORT: Expected 43 unique deleted IDs, found ${deletedIds.size}`
    );

    for (const target of targets) {
      assert(
        deletedIds.has(target.id),
        `ABORT: Expected ID ${target.id} was not returned by DELETE`
      );
    }

    console.log("PASS: Exactly the 43 whitelisted IDs were deleted.");
    console.log("");

    // --------------------------------------------------------
    // 7. Verify targets are absent before COMMIT
    // --------------------------------------------------------

    console.log("------------------------------------------------------------");
    console.log("7. PRE-COMMIT ABSENCE CHECK");
    console.log("------------------------------------------------------------");

    const remainingResult = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM "SubCounty"
      WHERE id = ANY($1::int[])
      `,
      [ids]
    );

    const remaining = Number(remainingResult.rows[0]?.count ?? 0);

    console.log(`Target records remaining: ${remaining}`);

    assert(
      remaining === 0,
      `ABORT: ${remaining} target records still exist before commit`
    );

    console.log("PASS: All 43 targets are absent before commit.");
    console.log("");

    // --------------------------------------------------------
    // 8. COMMIT
    // --------------------------------------------------------

    console.log("------------------------------------------------------------");
    console.log("8. COMMIT");
    console.log("------------------------------------------------------------");

    await client.query("COMMIT");

    committed = true;

    console.log("COMMIT SUCCESSFUL.");
    console.log("");
    console.log("============================================================");
    console.log("BATCH 1 TRANSACTIONAL DELETION: SUCCESS");
    console.log("============================================================");
    console.log("");
    console.log("Deleted exactly 43 legacy SubCounty records.");
    console.log("Homa Bay: 6");
    console.log("Bungoma: 6");
    console.log("Kakamega: 5");
    console.log("Kitui: 15");
    console.log("Kisii: 11");
    console.log("");
    console.log("The transaction committed successfully.");
    console.log("");
    console.log("IMPORTANT:");
    console.log("Run the post-delete audit immediately.");
    console.log("");
  } catch (error) {
    console.error("");
    console.error("============================================================");
    console.error("DELETION FAILED — ROLLBACK");
    console.error("============================================================");
    console.error("");

    if (!committed) {
      try {
        await client.query("ROLLBACK");
        console.error("ROLLBACK SUCCESSFUL.");
      } catch (rollbackError) {
        console.error("ROLLBACK ERROR:", rollbackError);
      }
    }

    console.error("");
    console.error(error);
    console.error("");
    console.error("NO PARTIAL DELETE SHOULD HAVE BEEN COMMITTED.");
    console.error("");

    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
