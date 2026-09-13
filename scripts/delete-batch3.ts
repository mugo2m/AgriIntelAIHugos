import { prisma } from "../lib/prisma";

const BATCH_NAME = "BATCH 3";

const CANDIDATE_IDS = [
  1352,
  1271,
  1272,
  1273,
  1277,
  1287,
  1289,
  1523,
  1296,
  1297,
  1299,
  1324,
  1325,
  1417,
  1262,
  1265,
  1387,
  1388,
  1389,
  1392,
  1425,
  1426,
  1403,
  1408,
  1409,
  1529,
  1261,
  1441,
  1443,
  1444,
  1328,
  1329,
  1330,
  463,
  1448,
  1453,
  1454,
  1458,
  1476,
  1481,
  1571,
] as const;

type Candidate = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
};

const EXPECTED_CANDIDATES: Record<number, { name: string; countyId: number }> = {
  1352: { name: "Kalama", countyId: 50 },
  1271: { name: "Tana Delta", countyId: 57 },
  1272: { name: "Tana North", countyId: 57 },
  1273: { name: "Tana River", countyId: 57 },
  1277: { name: "Taita", countyId: 59 },
  1287: { name: "Buna", countyId: 61 },
  1289: { name: "Habaswein", countyId: 61 },
  1523: { name: "Busia", countyId: 62 },
  1296: { name: "Banisa", countyId: 63 },
  1297: { name: "Kotulo", countyId: 63 },
  1299: { name: "Mandera Central", countyId: 63 },
  1324: { name: "Maara", countyId: 66 },
  1325: { name: "Meru South", countyId: 66 },
  1417: { name: "Kipkomo", countyId: 71 },
  1262: { name: "Chonyi", countyId: 73 },
  1265: { name: "Kauma", countyId: 73 },
  1387: { name: "Mwea East", countyId: 75 },
  1388: { name: "Mwea West", countyId: 75 },
  1389: { name: "Murang'a East", countyId: 76 },
  1392: { name: "Kahuro", countyId: 76 },
  1425: { name: "Trans Nzoia West", countyId: 81 },
  1426: { name: "Trans Nzoia East", countyId: 81 },
  1403: { name: "Kiambu", countyId: 82 },
  1408: { name: "Thika East", countyId: 82 },
  1409: { name: "Thika West", countyId: 82 },
  1529: { name: "Siaya", countyId: 83 },
  1261: { name: "Samburu", countyId: 84 },
  1441: { name: "Nandi Central", countyId: 88 },
  1443: { name: "Nandi North", countyId: 88 },
  1444: { name: "Nandi South", countyId: 88 },
  1328: { name: "Embu East", countyId: 89 },
  1329: { name: "Embu North", countyId: 89 },
  1330: { name: "Embu West", countyId: 89 },
  463: { name: "Tiaty West Sub County", countyId: 90 },
  1448: { name: "East Pokot", countyId: 90 },
  1453: { name: "Lake Baringo", countyId: 90 },
  1454: { name: "Laikipia Central", countyId: 91 },
  1458: { name: "Nyahururu", countyId: 91 },
  1476: { name: "Isinya", countyId: 92 },
  1481: { name: "Mashuuru", countyId: 92 },
  1571: { name: "Nyamira South", countyId: 94 },
};

const EXPECTED_COUNTY_NAMES: Record<number, string> = {
  50: "Machakos",
  57: "Tana River",
  59: "Taita Taveta",
  61: "Wajir",
  62: "Busia",
  63: "Mandera",
  66: "Tharaka Nithi",
  71: "West Pokot",
  73: "Kilifi",
  75: "Kirinyaga",
  76: "Murang'a",
  81: "Trans Nzoia",
  82: "Kiambu",
  83: "Siaya",
  84: "Kwale",
  88: "Nandi",
  89: "Embu",
  90: "Baringo",
  91: "Laikipia",
  92: "Kajiado",
  94: "Nyamira",
};

const FK_PATHS = [
  {
    table: "BusinessPartner",
    column: "subCountyId",
  },
  {
    table: "CommodityTransaction",
    column: "destinationSubCountyId",
  },
  {
    table: "CommodityTransaction",
    column: "sourceSubCountyId",
  },
  {
    table: "Farm",
    column: "subCountyId",
  },
  {
    table: "Farmer",
    column: "subCountyId",
  },
  {
    table: "Ward",
    column: "subCountyId",
  },
] as const;

const isDryRun = process.argv.includes("--dry-run");

function separator(char = "=", length = 110) {
  console.log(char.repeat(length));
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function getReferenceCounts(
  tx: typeof prisma,
  ids: readonly number[],
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};

  for (const fk of FK_PATHS) {
    const sql = `
      SELECT COUNT(*)::int AS count
      FROM "${fk.table}"
      WHERE "${fk.column}" = ANY($1::int[])
    `;

    const rows = await tx.$queryRawUnsafe<Array<{ count: number }>>(
      sql,
      ids,
    );

    result[`${fk.table}.${fk.column}`] = Number(rows[0]?.count ?? 0);
  }

  return result;
}

async function assertAllReferencesZero(
  tx: typeof prisma,
  ids: readonly number[],
  stage: string,
) {
  const counts = await getReferenceCounts(tx, ids);

  let total = 0;

  for (const [path, count] of Object.entries(counts)) {
    console.log(
      `${stage.padEnd(18)} ${path.padEnd(42)} refs=${count}`,
    );

    total += count;

    if (count !== 0) {
      throw new Error(
        `SAFETY FAILURE: ${path} has ${count} reference(s). Transaction will be rolled back.`,
      );
    }
  }

  if (total !== 0) {
    throw new Error(
      `SAFETY FAILURE: Total FK references = ${total}. Transaction will be rolled back.`,
    );
  }
}

async function verifyForeignKeyRules(tx: typeof prisma) {
  separator("-");
  console.log("POSTGRESQL FOREIGN KEY DELETE-RULE AUDIT");
  separator("-");

  const rows = await tx.$queryRawUnsafe<
    Array<{
      table_name: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
      delete_rule: string;
    }>
  >(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON rc.unique_constraint_name = ccu.constraint_name
      AND rc.unique_constraint_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'SubCounty'
      AND kcu.column_name IN (
        'subCountyId',
        'destinationSubCountyId',
        'sourceSubCountyId'
      )
    ORDER BY tc.table_name, kcu.column_name
  `);

  for (const row of rows) {
    console.log(
      `${row.table_name}.${row.column_name} -> ` +
        `${row.foreign_table_name}.${row.foreign_column_name} ` +
        `ON DELETE ${row.delete_rule}`,
    );

    if (row.delete_rule === "CASCADE") {
      throw new Error(
        `SAFETY FAILURE: CASCADE detected on ${row.table_name}.${row.column_name}.`,
      );
    }
  }

  console.log("PASS: No CASCADE delete rule detected.");
}

async function verifyCandidateIdentity(
  tx: typeof prisma,
): Promise<Candidate[]> {
  const rows = await tx.$queryRawUnsafe<
    Array<{
      id: number;
      name: string;
      countyId: number;
      countyName: string;
    }>
  >(`
    SELECT
      sc.id,
      sc.name,
      sc."countyId",
      c.name AS "countyName"
    FROM "SubCounty" sc
    JOIN "County" c
      ON c.id = sc."countyId"
    WHERE sc.id = ANY($1::int[])
    ORDER BY sc.id
  `, CANDIDATE_IDS);

  if (rows.length !== CANDIDATE_IDS.length) {
    throw new Error(
      `SAFETY FAILURE: Expected ${CANDIDATE_IDS.length} candidates, found ${rows.length}.`,
    );
  }

  const actualIds = new Set(rows.map((row) => Number(row.id)));

  for (const id of CANDIDATE_IDS) {
    if (!actualIds.has(id)) {
      throw new Error(
        `SAFETY FAILURE: Expected candidate ID ${id} was not found.`,
      );
    }
  }

  for (const row of rows) {
    const expected = EXPECTED_CANDIDATES[row.id];

    if (!expected) {
      throw new Error(
        `SAFETY FAILURE: ID ${row.id} is not present in the hard-coded whitelist.`,
      );
    }

    if (Number(row.countyId) !== expected.countyId) {
      throw new Error(
        `SAFETY FAILURE: ID ${row.id} countyId changed. ` +
          `Expected ${expected.countyId}, found ${row.countyId}.`,
      );
    }

    if (normalize(row.name) !== normalize(expected.name)) {
      throw new Error(
        `SAFETY FAILURE: ID ${row.id} name changed. ` +
          `Expected "${expected.name}", found "${row.name}".`,
      );
    }

    const expectedCountyName = EXPECTED_COUNTY_NAMES[row.countyId];

    if (
      expectedCountyName &&
      normalize(row.countyName) !== normalize(expectedCountyName)
    ) {
      throw new Error(
        `SAFETY FAILURE: ID ${row.id} county name mismatch. ` +
          `Expected "${expectedCountyName}", found "${row.countyName}".`,
      );
    }
  }

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    countyId: Number(row.countyId),
    countyName: row.countyName,
  }));
}

async function main() {
  separator();
  console.log(`${BATCH_NAME} DELETION — TRANSACTIONAL SAFETY SCRIPT`);
  separator();

  console.log();
  console.log(`Candidate whitelist: ${CANDIDATE_IDS.length} SubCounty IDs`);
  console.log(`Mode: ${isDryRun ? "DRY RUN — NO DELETE" : "LIVE DELETE"}`);
  console.log();

  if (CANDIDATE_IDS.length !== 41) {
    throw new Error(
      `SAFETY FAILURE: Hard-coded whitelist contains ${CANDIDATE_IDS.length} IDs. Expected exactly 41.`,
    );
  }

  const uniqueIds = new Set(CANDIDATE_IDS);

  if (uniqueIds.size !== CANDIDATE_IDS.length) {
    throw new Error(
      "SAFETY FAILURE: Duplicate IDs detected in whitelist.",
    );
  }

  console.log("PASS: Exactly 41 unique candidate IDs loaded.");

  try {
    await prisma.$transaction(
      async (tx) => {
        separator("-");
        console.log("STEP 1 — VERIFY DATABASE CANDIDATES");
        separator("-");

        const candidates = await verifyCandidateIdentity(tx);

        console.log(
          `PASS: All ${candidates.length} whitelist records exist with expected identity.`,
        );

        for (const candidate of candidates) {
          console.log(
            `${String(candidate.id).padEnd(6)} ` +
              `${candidate.countyName.padEnd(20)} ` +
              `${candidate.name}`,
          );
        }

        separator("-");
        console.log("STEP 2 — LOCK CANDIDATES");
        separator("-");

        const lockedRows = await tx.$queryRawUnsafe<
          Array<{
            id: number;
            name: string;
            countyId: number;
          }>
        >(
          `
            SELECT
              id,
              name,
              "countyId"
            FROM "SubCounty"
            WHERE id = ANY($1::int[])
            ORDER BY id
            FOR UPDATE
          `,
          CANDIDATE_IDS,
        );

        if (lockedRows.length !== CANDIDATE_IDS.length) {
          throw new Error(
            `SAFETY FAILURE: Expected to lock ${CANDIDATE_IDS.length} rows, locked ${lockedRows.length}.`,
          );
        }

        console.log(
          `PASS: ${lockedRows.length} candidate rows locked.`,
        );

        separator("-");
        console.log("STEP 3 — REVALIDATE IDENTITY AFTER LOCK");
        separator("-");

        await verifyCandidateIdentity(tx);

        console.log(
          "PASS: All candidate identities remain unchanged after locking.",
        );

        separator("-");
        console.log("STEP 4 — AUDIT FOREIGN KEY DELETE RULES");
        separator("-");

        await verifyForeignKeyRules(tx);

        separator("-");
        console.log("STEP 5 — PRE-DELETE FOREIGN KEY RECHECK");
        separator("-");

        await assertAllReferencesZero(
          tx,
          CANDIDATE_IDS,
          "PRE-DELETE",
        );

        console.log();
        console.log(
          "PASS: All six FK paths contain zero references.",
        );

        separator("-");
        console.log("STEP 6 — DELETE");
        separator("-");

        if (isDryRun) {
          console.log(
            "DRY RUN: DELETE NOT EXECUTED.",
          );

          console.log(
            `DRY RUN: ${CANDIDATE_IDS.length} rows would be deleted.`,
          );

          return;
        }

        const deletedRows = await tx.$queryRawUnsafe<
          Array<{
            id: number;
            name: string;
            countyId: number;
          }>
        >(
          `
            DELETE FROM "SubCounty"
            WHERE id = ANY($1::int[])
            RETURNING
              id,
              name,
              "countyId"
          `,
          CANDIDATE_IDS,
        );

        console.log(
          `DELETE RETURNING rows: ${deletedRows.length}`,
        );

        if (deletedRows.length !== CANDIDATE_IDS.length) {
          throw new Error(
            `SAFETY FAILURE: Expected exactly ${CANDIDATE_IDS.length} deleted rows, ` +
              `but DELETE RETURNING returned ${deletedRows.length}.`,
          );
        }

        const deletedIds = new Set(
          deletedRows.map((row) => Number(row.id)),
        );

        for (const id of CANDIDATE_IDS) {
          if (!deletedIds.has(id)) {
            throw new Error(
              `SAFETY FAILURE: Expected deleted ID ${id} was not returned by DELETE.`,
            );
          }
        }

        console.log(
          `PASS: Exactly ${CANDIDATE_IDS.length} whitelisted rows deleted.`,
        );

        separator("-");
        console.log("STEP 7 — VERIFY DELETED IDS ARE ABSENT");
        separator("-");

        const remainingRows = await tx.$queryRawUnsafe<
          Array<{ id: number }>
        >(
          `
            SELECT id
            FROM "SubCounty"
            WHERE id = ANY($1::int[])
            ORDER BY id
          `,
          CANDIDATE_IDS,
        );

        if (remainingRows.length !== 0) {
          throw new Error(
            `SAFETY FAILURE: ${remainingRows.length} deleted IDs still exist.`,
          );
        }

        console.log(
          "PASS: All 41 deleted IDs are absent inside the transaction.",
        );

        separator("-");
        console.log("STEP 8 — POST-DELETE FK RECHECK");
        separator("-");

        await assertAllReferencesZero(
          tx,
          CANDIDATE_IDS,
          "POST-DELETE",
        );

        console.log();
        console.log(
          "PASS: All six FK paths remain at zero references.",
        );

        separator("-");
        console.log("STEP 9 — FINAL TRANSACTION ASSERTIONS");
        separator("-");

        const remainingCandidateRows =
          await tx.$queryRawUnsafe<Array<{ count: number }>>(
            `
              SELECT COUNT(*)::int AS count
              FROM "SubCounty"
              WHERE id = ANY($1::int[])
            `,
            CANDIDATE_IDS,
          );

        const remainingCount = Number(
          remainingCandidateRows[0]?.count ?? 0,
        );

        if (remainingCount !== 0) {
          throw new Error(
            `SAFETY FAILURE: Final remaining candidate count = ${remainingCount}.`,
          );
        }

        console.log(
          "PASS: Final remaining candidate count = 0.",
        );

        console.log();
        console.log(
          "All transaction safety assertions passed.",
        );
        console.log(
          "Transaction is allowed to COMMIT.",
        );
      },
      {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 60000,
      },
    );

    separator();
    if (isDryRun) {
      console.log("BATCH 3 DRY RUN: COMPLETE");
      console.log("NO DATABASE CHANGES WERE MADE.");
    } else {
      console.log("BATCH 3 DELETION: COMMITTED SUCCESSFULLY");
      console.log("41 legacy SubCounty records were deleted.");
    }
    separator();
  } catch (error) {
    separator();
    console.error("BATCH 3 DELETION: ABORTED");
    separator();

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    console.log();
    console.log(
      "IMPORTANT: The transaction was rolled back. No partial deletion was committed.",
    );

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});