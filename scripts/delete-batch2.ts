import { Pool, PoolClient } from "pg";

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
  {
    id: 1370,
    countyId: 67,
    countyName: "Nyandarua",
    name: "Nyandarua South",
  },
  {
    id: 1371,
    countyId: 67,
    countyName: "Nyandarua",
    name: "Mirangine",
  },
  {
    id: 1373,
    countyId: 67,
    countyName: "Nyandarua",
    name: "Nyandarua Central",
  },
  {
    id: 1374,
    countyId: 67,
    countyName: "Nyandarua",
    name: "Nyandarua West",
  },
  {
    id: 1375,
    countyId: 67,
    countyName: "Nyandarua",
    name: "Nyandarua North",
  },

  // Marsabit
  {
    id: 1302,
    countyId: 64,
    countyName: "Marsabit",
    name: "Loiyangalani",
  },
  {
    id: 1303,
    countyId: 64,
    countyName: "Marsabit",
    name: "Marsabit Central",
  },
  {
    id: 1304,
    countyId: 64,
    countyName: "Marsabit",
    name: "Marsabit North",
  },
  {
    id: 1305,
    countyId: 64,
    countyName: "Marsabit",
    name: "Marsabit South",
  },
  {
    id: 1308,
    countyId: 64,
    countyName: "Marsabit",
    name: "Sololo",
  },

  // Meru
  {
    id: 1312,
    countyId: 65,
    countyName: "Meru",
    name: "Buuri East",
  },
  {
    id: 1313,
    countyId: 65,
    countyName: "Meru",
    name: "Buuri West",
  },
  {
    id: 1319,
    countyId: 65,
    countyName: "Meru",
    name: "Meru Central",
  },
  {
    id: 1320,
    countyId: 65,
    countyName: "Meru",
    name: "Tigania Central",
  },

  // Kericho
  {
    id: 1484,
    countyId: 56,
    countyName: "Kericho",
    name: "Kericho East",
  },
  {
    id: 1485,
    countyId: 56,
    countyName: "Kericho",
    name: "Kipkelion",
  },
  {
    id: 1486,
    countyId: 56,
    countyName: "Kericho",
    name: "Londiani",
  },
  {
    id: 1487,
    countyId: 56,
    countyName: "Kericho",
    name: "Soin Sigowet",
  },

  // Nairobi City
  {
    id: 1572,
    countyId: 79,
    countyName: "Nairobi City",
    name: "Dagoretti",
  },
  {
    id: 1573,
    countyId: 79,
    countyName: "Nairobi City",
    name: "Embakasi",
  },
  {
    id: 1580,
    countyId: 79,
    countyName: "Nairobi City",
    name: "Njiru",
  },
];

const CANDIDATE_IDS = CANDIDATES.map((candidate) => candidate.id);

async function countReferences(
  client: PoolClient,
  table: string,
  column: string,
): Promise<number> {
  const result = await client.query<{ count: string }>(
    `
    SELECT COUNT(*)::text AS count
    FROM "${table}"
    WHERE "${column}" = ANY($1::int[])
    `,
    [CANDIDATE_IDS],
  );

  return Number(result.rows[0].count);
}

async function main() {
  console.log("=".repeat(60));
  console.log("BATCH 2 SUBCOUNTY DELETION");
  console.log("TRANSACTIONAL — DATABASE CHANGES WILL OCCUR");
  console.log("=".repeat(60));
  console.log();

  console.log("Deletion whitelist:");
  console.log();

  for (const candidate of CANDIDATES) {
    console.log(
      `   ${candidate.id} ${candidate.countyName} / ${candidate.name}`,
    );
  }

  console.log();
  console.log(`Total candidates: ${CANDIDATES.length}`);
  console.log();

  if (CANDIDATES.length !== 21) {
    throw new Error(
      `SAFETY ABORT: Expected exactly 21 candidates, found ${CANDIDATES.length}.`,
    );
  }

  if (new Set(CANDIDATE_IDS).size !== CANDIDATE_IDS.length) {
    throw new Error(
      "SAFETY ABORT: Candidate ID list contains duplicates.",
    );
  }

  const candidatesWithMissingNames = CANDIDATES.filter(
    (candidate) =>
      !candidate.name ||
      candidate.name.trim().length === 0,
  );

  if (candidatesWithMissingNames.length > 0) {
    throw new Error(
      `SAFETY ABORT: ${candidatesWithMissingNames.length} candidate(s) have missing names.`,
    );
  }

  const client = await pool.connect();

  let transactionStarted = false;

  try {
    console.log("1. BEGIN TRANSACTION");
    console.log();

    await client.query("BEGIN");
    transactionStarted = true;

    await client.query(
      "SET TRANSACTION ISOLATION LEVEL SERIALIZABLE",
    );

    console.log("✅ Transaction started.");
    console.log("✅ Isolation level: SERIALIZABLE");
    console.log();

    console.log("2. LOCK AND REVALIDATE EXACT CANDIDATES");
    console.log();

    const locked = await client.query<{
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
      FOR UPDATE
      `,
      [CANDIDATE_IDS],
    );

    console.log(`Locked records: ${locked.rows.length}`);

    if (locked.rows.length !== 21) {
      throw new Error(
        `SAFETY ABORT: Expected 21 candidate records, found ${locked.rows.length}.`,
      );
    }

    const expectedById = new Map(
      CANDIDATES.map((candidate) => [
        candidate.id,
        candidate,
      ]),
    );

    for (const row of locked.rows) {
      const expected = expectedById.get(row.id);

      if (!expected) {
        throw new Error(
          `SAFETY ABORT: Unexpected candidate ID ${row.id}.`,
        );
      }

      if (
        row.countyId !== expected.countyId ||
        row.name !== expected.name
      ) {
        throw new Error(
          `SAFETY ABORT: Identity mismatch for ID ${row.id}. ` +
            `Expected county ${expected.countyId}/${expected.name}, ` +
            `found county ${row.countyId}/${row.name}.`,
        );
      }

      console.log(
        `   ✅ ${row.id} ${row.name} — county ${row.countyId}`,
      );
    }

    console.log();
    console.log(
      "✅ All 21 records locked and identity-verified.",
    );
    console.log();

    console.log("3. RECHECK WARD REFERENCES");
    console.log();

    const wardRefs = await countReferences(
      client,
      "Ward",
      "subCountyId",
    );

    console.log(`Ward references: ${wardRefs}`);

    if (wardRefs !== 0) {
      throw new Error(
        `SAFETY ABORT: ${wardRefs} Ward references detected.`,
      );
    }

    console.log("✅ Ward references = 0.");
    console.log();

    console.log("4. RECHECK ALL SIX FK PATHS");
    console.log();

    const fkChecks = [
      ["BusinessPartner", "subCountyId"],
      [
        "CommodityTransaction",
        "destinationSubCountyId",
      ],
      [
        "CommodityTransaction",
        "sourceSubCountyId",
      ],
      ["Farm", "subCountyId"],
      ["Farmer", "subCountyId"],
      ["Ward", "subCountyId"],
    ] as const;

    let totalFkReferences = 0;

    for (const [table, column] of fkChecks) {
      const count = await countReferences(
        client,
        table,
        column,
      );

      console.log(`   ${table}.${column}: ${count}`);

      totalFkReferences += count;

      if (count !== 0) {
        throw new Error(
          `SAFETY ABORT: ${table}.${column} contains ${count} references.`,
        );
      }
    }

    console.log();
    console.log(
      `Total FK references: ${totalFkReferences}`,
    );

    if (totalFkReferences !== 0) {
      throw new Error(
        `SAFETY ABORT: Total FK references are ${totalFkReferences}, expected 0.`,
      );
    }

    console.log("✅ All six FK paths are clear.");
    console.log();

    console.log("5. FINAL PRE-DELETE WHITELIST CHECK");
    console.log();

    const preDeleteCount = await client.query<{
      count: string;
    }>(
      `
      SELECT COUNT(*)::text AS count
      FROM "SubCounty"
      WHERE id = ANY($1::int[])
      `,
      [CANDIDATE_IDS],
    );

    const countBeforeDelete = Number(
      preDeleteCount.rows[0].count,
    );

    console.log(
      `Records matching exact whitelist: ${countBeforeDelete}`,
    );

    if (countBeforeDelete !== 21) {
      throw new Error(
        `SAFETY ABORT: Expected exactly 21 records immediately before deletion, found ${countBeforeDelete}.`,
      );
    }

    console.log(
      "✅ Exact 21-record whitelist confirmed.",
    );
    console.log();

    console.log("6. DELETE EXACT 21 RECORDS");
    console.log();

    const deleteResult = await client.query<{
      id: number;
    }>(
      `
      DELETE FROM "SubCounty"
      WHERE id = ANY($1::int[])
      RETURNING id
      `,
      [CANDIDATE_IDS],
    );

    console.log(
      `Database DELETE returned: ${deleteResult.rows.length} records`,
    );

    if (deleteResult.rows.length !== 21) {
      throw new Error(
        `SAFETY ABORT: Expected exactly 21 deleted records, received ${deleteResult.rows.length}.`,
      );
    }

    const deletedIds = deleteResult.rows
      .map((row) => row.id)
      .sort((a, b) => a - b);

    const expectedIds = [...CANDIDATE_IDS].sort(
      (a, b) => a - b,
    );

    const idsMatch =
      deletedIds.length === expectedIds.length &&
      deletedIds.every(
        (id, index) => id === expectedIds[index],
      );

    if (!idsMatch) {
      throw new Error(
        "SAFETY ABORT: Deleted ID set does not exactly match the approved whitelist.",
      );
    }

    console.log(
      "✅ Exactly the approved 21 IDs were deleted.",
    );
    console.log();

    console.log(
      "7. VERIFY DELETED IDS ARE ABSENT BEFORE COMMIT",
    );
    console.log();

    const remainingTargets = await client.query<{
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
      [CANDIDATE_IDS],
    );

    console.log(
      `Remaining target records: ${remainingTargets.rows.length}`,
    );

    if (remainingTargets.rows.length !== 0) {
      throw new Error(
        `SAFETY ABORT: ${remainingTargets.rows.length} target records remain before commit.`,
      );
    }

    console.log("✅ All 21 target IDs are absent.");
    console.log();

    console.log(
      "8. VERIFY NO FK REFERENCES REMAIN BEFORE COMMIT",
    );
    console.log();

    for (const [table, column] of fkChecks) {
      const count = await countReferences(
        client,
        table,
        column,
      );

      console.log(
        `   ${table}.${column}: ${count}`,
      );

      if (count !== 0) {
        throw new Error(
          `SAFETY ABORT: ${table}.${column} has ${count} references after deletion.`,
        );
      }
    }

    console.log();
    console.log(
      "✅ All six FK paths remain clear.",
    );
    console.log();

    console.log("9. COMMIT TRANSACTION");
    console.log();

    await client.query("COMMIT");
    transactionStarted = false;

    console.log("✅ TRANSACTION COMMITTED.");
    console.log();

    console.log("=".repeat(60));
    console.log("BATCH 2 DELETION RESULT");
    console.log("=".repeat(60));
    console.log();

    console.log("Deleted records:       21");
    console.log("Ward references:       0");
    console.log("FK references:         0");
    console.log("Whitelist mismatch:    0");
    console.log("Remaining target IDs:  0");
    console.log();

    console.log(
      "Deleted IDs:",
    );

    for (const id of deletedIds) {
      console.log(`   ${id}`);
    }

    console.log();
    console.log("✅ BATCH 2 DELETION: SUCCESS");
    console.log();
    console.log(
      "NEXT STEP: Run scripts/audit-batch2-post-delete.ts",
    );
    console.log(
      "The post-delete audit must pass before Batch 2 is considered CLOSED.",
    );
  } catch (error) {
    if (transactionStarted) {
      console.log();
      console.log(
        "⚠️ ROLLING BACK TRANSACTION...",
      );

      await client.query("ROLLBACK");
      transactionStarted = false;

      console.log(
        "✅ TRANSACTION ROLLED BACK.",
      );
    }

    console.error();
    console.error("=".repeat(60));
    console.error("BATCH 2 DELETION: ABORTED");
    console.error("=".repeat(60));
    console.error();
    console.error(error);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error();
  console.error("=".repeat(60));
  console.error("FATAL ERROR");
  console.error("=".repeat(60));
  console.error();
  console.error(error);

  await pool.end().catch(() => {});

  process.exitCode = 1;
});