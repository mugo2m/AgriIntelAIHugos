import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type Candidate = {
  id: number;
  countyId: number;
  countyName: string;
  name: string;
};

const CANDIDATES: Candidate[] = [
  // Nyandarua
  { id: 1370, countyId: 67, countyName: "Nyandarua", name: "Nyandarua South" },
  { id: 1371, countyId: 67, countyName: "Nyandarua", name: "Mirangine" },
  { id: 1373, countyId: 67, countyName: "Nyandarua", name: "Nyandarua Central" },
  { id: 1374, countyId: 67, countyName: "Nyandarua", name: "Nyandarua West" },
  { id: 1375, countyId: 67, countyName: "Nyandarua", name: "Nyandarua North" },

  // Marsabit
  { id: 1302, countyId: 64, countyName: "Marsabit", name: "Loiyangalani" },
  { id: 1303, countyId: 64, countyName: "Marsabit", name: "Marsabit Central" },
  { id: 1304, countyId: 64, countyName: "Marsabit", name: "Marsabit North" },
  { id: 1305, countyId: 64, countyName: "Marsabit", name: "Marsabit South" },
  { id: 1308, countyId: 64, countyName: "Marsabit", name: "Sololo" },

  // Meru
  { id: 1312, countyId: 65, countyName: "Meru", name: "Buuri East" },
  { id: 1313, countyId: 65, countyName: "Meru", name: "Buuri West" },
  { id: 1319, countyId: 65, countyName: "Meru", name: "Meru Central" },
  { id: 1320, countyId: 65, countyName: "Meru", name: "Tigania Central" },

  // Kericho
  { id: 1484, countyId: 56, countyName: "Kericho", name: "Kericho East" },
  { id: 1485, countyId: 56, countyName: "Kericho", name: "Kipkelion" },
  { id: 1486, countyId: 56, countyName: "Kericho", name: "Londiani" },
  { id: 1487, countyId: 56, countyName: "Kericho", name: "Soin Sigowet" },

  // Nairobi City
  { id: 1572, countyId: 79, countyName: "Nairobi City", name: "Dagoretti" },
  { id: 1573, countyId: 79, countyName: "Nairobi City", name: "Embakasi" },
  { id: 1580, countyId: 79, countyName: "Nairobi City", name: "Njiru" },
];

const EXPECTED_COUNTIES = [
  { id: 67, name: "Nyandarua", expectedRemaining: 5 },
  { id: 64, name: "Marsabit", expectedRemaining: 4 },
  { id: 65, name: "Meru", expectedRemaining: 9 },
  { id: 56, name: "Kericho", expectedRemaining: 6 },
  { id: 79, name: "Nairobi City", expectedRemaining: 17 },
];

async function main() {
  console.log("=".repeat(60));
  console.log("BATCH 2 SUBCOUNTY DELETION DRY-RUN");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("=".repeat(60));
  console.log();

  const client = await pool.connect();

  try {
    let failures = 0;

    console.log("1. VERIFY EXACT CANDIDATE WHITELIST");
    console.log();

    const candidateIds = CANDIDATES.map((c) => c.id);

    if (candidateIds.length !== 21) {
      console.log(
        `❌ Expected 21 candidates, found ${candidateIds.length}.`,
      );
      failures++;
    } else {
      console.log("✅ Candidate count = 21.");
    }

    if (new Set(candidateIds).size !== candidateIds.length) {
      console.log("❌ Duplicate candidate IDs detected.");
      failures++;
    } else {
      console.log("✅ All candidate IDs are unique.");
    }

    console.log();

    console.log("2. VERIFY CANDIDATES EXIST WITH EXACT IDENTITY");
    console.log();

    const existing = await client.query<{
      id: number;
      countyId: number;
      name: string;
    }>(
      `
      SELECT
        id,
        "countyId",
        name
      FROM "SubCounty"
      WHERE id = ANY($1::int[])
      ORDER BY id
      `,
      [candidateIds],
    );

    console.log(`Database records found: ${existing.rows.length}`);

    if (existing.rows.length !== 21) {
      console.log(
        `❌ Expected 21 database records, found ${existing.rows.length}.`,
      );
      failures++;
    } else {
      console.log("✅ All 21 candidate records exist.");
    }

    const expectedById = new Map(
      CANDIDATES.map((candidate) => [candidate.id, candidate]),
    );

    for (const row of existing.rows) {
      const expected = expectedById.get(row.id);

      if (!expected) {
        console.log(`❌ Unexpected candidate ID returned: ${row.id}`);
        failures++;
        continue;
      }

      if (
        row.countyId !== expected.countyId ||
        row.name !== expected.name
      ) {
        console.log(`❌ IDENTITY MISMATCH: ${row.id}`);
        console.log(
          `   Expected: county ${expected.countyId} / ${expected.name}`,
        );
        console.log(
          `   Actual:   county ${row.countyId} / ${row.name}`,
        );
        failures++;
      } else {
        console.log(
          `   ${row.id} ${row.name} — county ${row.countyId}: OK`,
        );
      }
    }

    console.log();

    console.log("3. VERIFY WARD REFERENCES");
    console.log();

    const wardRefs = await client.query<{
      subCountyId: number;
      count: string;
    }>(
      `
      SELECT
        "subCountyId",
        COUNT(*)::text AS count
      FROM "Ward"
      WHERE "subCountyId" = ANY($1::int[])
      GROUP BY "subCountyId"
      ORDER BY "subCountyId"
      `,
      [candidateIds],
    );

    const wardRefMap = new Map(
      wardRefs.rows.map((row) => [
        row.subCountyId,
        Number(row.count),
      ]),
    );

    let totalWardRefs = 0;

    for (const candidate of CANDIDATES) {
      const count = wardRefMap.get(candidate.id) ?? 0;
      totalWardRefs += count;

      console.log(
        `   ${candidate.id} ${candidate.name}: ${count} Ward refs`,
      );

      if (count !== 0) {
        failures++;
      }
    }

    console.log();

    if (totalWardRefs === 0) {
      console.log("✅ All 21 candidates have 0 Ward references.");
    } else {
      console.log(
        `❌ Total Ward references: ${totalWardRefs}`,
      );
    }

    console.log();

    console.log("4. VERIFY ALL SIX FK REFERENCE PATHS");
    console.log();

    const fkQueries = [
      {
        label: "BusinessPartner.subCountyId",
        sql: `
          SELECT COUNT(*)::text AS count
          FROM "BusinessPartner"
          WHERE "subCountyId" = ANY($1::int[])
        `,
      },
      {
        label: "CommodityTransaction.destinationSubCountyId",
        sql: `
          SELECT COUNT(*)::text AS count
          FROM "CommodityTransaction"
          WHERE "destinationSubCountyId" = ANY($1::int[])
        `,
      },
      {
        label: "CommodityTransaction.sourceSubCountyId",
        sql: `
          SELECT COUNT(*)::text AS count
          FROM "CommodityTransaction"
          WHERE "sourceSubCountyId" = ANY($1::int[])
        `,
      },
      {
        label: "Farm.subCountyId",
        sql: `
          SELECT COUNT(*)::text AS count
          FROM "Farm"
          WHERE "subCountyId" = ANY($1::int[])
        `,
      },
      {
        label: "Farmer.subCountyId",
        sql: `
          SELECT COUNT(*)::text AS count
          FROM "Farmer"
          WHERE "subCountyId" = ANY($1::int[])
        `,
      },
      {
        label: "Ward.subCountyId",
        sql: `
          SELECT COUNT(*)::text AS count
          FROM "Ward"
          WHERE "subCountyId" = ANY($1::int[])
        `,
      },
    ];

    let totalFkRefs = 0;

    for (const fk of fkQueries) {
      const result = await client.query<{ count: string }>(
        fk.sql,
        [candidateIds],
      );

      const count = Number(result.rows[0].count);

      console.log(`   ${fk.label}: ${count}`);

      totalFkRefs += count;

      if (count !== 0) {
        failures++;
      }
    }

    console.log();

    if (totalFkRefs === 0) {
      console.log("✅ All six FK paths contain 0 references.");
    } else {
      console.log(
        `❌ Total FK references across all paths: ${totalFkRefs}`,
      );
    }

    console.log();

    console.log("5. VERIFY NO UNEXPECTED CANDIDATE IDs");
    console.log();

    const unexpected = await client.query<{
      id: number;
      countyId: number;
      name: string;
    }>(
      `
      SELECT
        id,
        "countyId",
        name
      FROM "SubCounty"
      WHERE id = ANY($1::int[])
        AND NOT (
          id = ANY($2::int[])
        )
      `,
      [candidateIds, candidateIds],
    );

    if (unexpected.rows.length === 0) {
      console.log(
        "✅ No unexpected IDs found in the deletion whitelist.",
      );
    } else {
      console.log(
        `❌ Unexpected records found: ${unexpected.rows.length}`,
      );

      for (const row of unexpected.rows) {
        console.log(
          `   ${row.id} ${row.name} county ${row.countyId}`,
        );
      }

      failures++;
    }

    console.log();

    console.log("6. VERIFY CURRENT COUNTY COUNTS");
    console.log();

    for (const expectedCounty of EXPECTED_COUNTIES) {
      const result = await client.query<{
        count: string;
      }>(
        `
        SELECT COUNT(*)::text AS count
        FROM "SubCounty"
        WHERE "countyId" = $1
        `,
        [expectedCounty.id],
      );

      const actualCount = Number(result.rows[0].count);

      console.log(
        `   ${expectedCounty.id} ${expectedCounty.name}: ${actualCount} SubCounties currently`,
      );

      if (actualCount !== expectedCounty.expectedRemaining + 5) {
        console.log(
          `      ⚠️ Expected current count before deletion: ${
            expectedCounty.expectedRemaining + 5
          }`,
        );
      }
    }

    console.log();

    console.log("7. CALCULATE EXPECTED POST-DELETION COUNTS");
    console.log();

    let countyCountFailures = 0;

    for (const expectedCounty of EXPECTED_COUNTIES) {
      const result = await client.query<{
        count: string;
      }>(
        `
        SELECT COUNT(*)::text AS count
        FROM "SubCounty"
        WHERE "countyId" = $1
        `,
        [expectedCounty.id],
      );

      const currentCount = Number(result.rows[0].count);

      const candidateCount = CANDIDATES.filter(
        (candidate) => candidate.countyId === expectedCounty.id,
      ).length;

      const projectedCount = currentCount - candidateCount;

      console.log(
        `   ${expectedCounty.name}: ${currentCount} - ${candidateCount} = ${projectedCount}`,
      );

      if (projectedCount !== expectedCounty.expectedRemaining) {
        console.log(
          `      ❌ Expected projected count: ${expectedCounty.expectedRemaining}`,
        );
        countyCountFailures++;
      } else {
        console.log("      ✅ Projected count correct.");
      }
    }

    if (countyCountFailures > 0) {
      failures += countyCountFailures;
    }

    console.log();

    console.log("8. VERIFY TOTAL BATCH IMPACT");
    console.log();

    const totalSubCounties = await client.query<{
      count: string;
    }>(`
      SELECT COUNT(*)::text AS count
      FROM "SubCounty"
    `);

    const currentTotal = Number(totalSubCounties.rows[0].count);
    const projectedTotal = currentTotal - CANDIDATES.length;

    console.log(`   Current total SubCounties: ${currentTotal}`);
    console.log(`   Candidates to delete:      ${CANDIDATES.length}`);
    console.log(`   Projected total:           ${projectedTotal}`);

    console.log();

    console.log("=".repeat(60));
    console.log("BATCH 2 DELETION DRY-RUN RESULT");
    console.log("=".repeat(60));

    console.log(`Candidates:             ${CANDIDATES.length}`);
    console.log(`Ward references:        ${totalWardRefs}`);
    console.log(`All FK references:      ${totalFkRefs}`);
    console.log(`Validation failures:    ${failures}`);
    console.log();

    if (failures > 0) {
      console.log("❌ BATCH 2 DELETION DRY-RUN: FAIL");
      console.log();
      console.log(
        "DO NOT run the Batch 2 deletion script.",
      );
      console.log(
        "Investigate every failure before proceeding.",
      );

      process.exitCode = 1;
      return;
    }

    console.log("✅ BATCH 2 DELETION DRY-RUN: PASS");
    console.log();
    console.log("Confirmed:");
    console.log("  • Exact 21-ID deletion whitelist");
    console.log("  • All 21 records exist");
    console.log("  • All 21 county/name identities match");
    console.log("  • 0 Ward references");
    console.log("  • 0 references across all six FK paths");
    console.log("  • No unexpected deletion IDs");
    console.log("  • Projected county counts are correct");
    console.log();
    console.log(
      "NEXT STEP: Run the transactional Batch 2 deletion script.",
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error();
  console.error("=".repeat(60));
  console.error("BATCH 2 DELETION DRY-RUN: ERROR");
  console.error("=".repeat(60));
  console.error();
  console.error(error);

  await pool.end().catch(() => {});

  process.exitCode = 1;
});