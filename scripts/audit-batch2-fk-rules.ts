import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type ForeignKeyRow = {
  constraint_name: string;
  table_schema: string;
  table_name: string;
  column_name: string;
  foreign_table_schema: string;
  foreign_table_name: string;
  foreign_column_name: string;
  delete_rule: string;
  update_rule: string;
};

const EXPECTED_FKS = [
  {
    table: "BusinessPartner",
    column: "subCountyId",
    deleteRule: "SET NULL",
  },
  {
    table: "CommodityTransaction",
    column: "destinationSubCountyId",
    deleteRule: "SET NULL",
  },
  {
    table: "CommodityTransaction",
    column: "sourceSubCountyId",
    deleteRule: "SET NULL",
  },
  {
    table: "Farm",
    column: "subCountyId",
    deleteRule: "SET NULL",
  },
  {
    table: "Farmer",
    column: "subCountyId",
    deleteRule: "RESTRICT",
  },
  {
    table: "Ward",
    column: "subCountyId",
    deleteRule: "SET NULL",
  },
];

async function main() {
  console.log("=".repeat(60));
  console.log("BATCH 2 FOREIGN-KEY RULE CATALOG AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("=".repeat(60));
  console.log();

  const client = await pool.connect();

  try {
    console.log("1. LOAD ACTUAL POSTGRESQL FOREIGN-KEY DEFINITIONS");
    console.log();

    const result = await client.query<ForeignKeyRow>(`
      SELECT
        tc.constraint_name,
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
       AND tc.table_schema = ccu.table_schema
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
       AND tc.table_schema = rc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'SubCounty'
        AND ccu.column_name = 'id'
      ORDER BY tc.table_name, kcu.column_name;
    `);

    console.log(
      `Foreign keys referencing SubCounty.id: ${result.rows.length}`,
    );
    console.log();

    if (result.rows.length === 0) {
      throw new Error(
        "No foreign keys referencing SubCounty.id were found.",
      );
    }

    for (const fk of result.rows) {
      console.log(
        `   ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`,
      );
      console.log(`      Constraint: ${fk.constraint_name}`);
      console.log(`      ON DELETE: ${fk.delete_rule}`);
      console.log(`      ON UPDATE: ${fk.update_rule}`);
      console.log();
    }

    console.log("2. VERIFY EXPECTED SIX FK PATHS");
    console.log();

    const normalizedActual = result.rows.map((fk) => ({
      table: fk.table_name,
      column: fk.column_name,
      deleteRule: fk.delete_rule,
    }));

    let pathFailures = 0;

    for (const expected of EXPECTED_FKS) {
      const matches = normalizedActual.filter(
        (actual) =>
          actual.table === expected.table &&
          actual.column === expected.column,
      );

      if (matches.length === 0) {
        console.log(
          `❌ MISSING: ${expected.table}.${expected.column}`,
        );
        pathFailures++;
        continue;
      }

      if (matches.length > 1) {
        console.log(
          `❌ DUPLICATE FK DEFINITIONS: ${expected.table}.${expected.column}`,
        );
        pathFailures++;
        continue;
      }

      const actual = matches[0];

      if (actual.deleteRule !== expected.deleteRule) {
        console.log(
          `❌ WRONG DELETE RULE: ${expected.table}.${expected.column}`,
        );
        console.log(`   Expected: ${expected.deleteRule}`);
        console.log(`   Actual:   ${actual.deleteRule}`);
        pathFailures++;
        continue;
      }

      console.log(
        `✅ ${expected.table}.${expected.column} — ON DELETE ${actual.deleteRule}`,
      );
    }

    console.log();

    if (result.rows.length !== EXPECTED_FKS.length) {
      console.log(
        `❌ Expected exactly ${EXPECTED_FKS.length} FK paths, found ${result.rows.length}.`,
      );
      pathFailures++;
    } else {
      console.log(
        `✅ Exactly ${EXPECTED_FKS.length} FK paths reference SubCounty.id.`,
      );
    }

    console.log();
    console.log("3. VERIFY TARGET TABLE/COLUMN");
    console.log();

    const targetFailures = result.rows.filter(
      (fk) =>
        fk.foreign_table_name !== "SubCounty" ||
        fk.foreign_column_name !== "id",
    );

    if (targetFailures.length > 0) {
      console.log(
        `❌ ${targetFailures.length} FK definitions have an unexpected target.`,
      );

      for (const fk of targetFailures) {
        console.log(
          `   ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`,
        );
      }

      pathFailures += targetFailures.length;
    } else {
      console.log(
        "✅ Every discovered FK points to SubCounty.id.",
      );
    }

    console.log();
    console.log("4. BATCH 2 DELETE-SAFETY INTERPRETATION");
    console.log();

    for (const expected of EXPECTED_FKS) {
      const actual = normalizedActual.find(
        (fk) =>
          fk.table === expected.table &&
          fk.column === expected.column,
      );

      if (!actual) {
        continue;
      }

      if (actual.deleteRule === "SET NULL") {
        console.log(
          `   ${expected.table}.${expected.column}: SET NULL — safe from FK blocking, if nullable.`,
        );
      } else if (actual.deleteRule === "RESTRICT") {
        console.log(
          `   ${expected.table}.${expected.column}: RESTRICT — deletion requires zero references.`,
        );
      } else if (actual.deleteRule === "CASCADE") {
        console.log(
          `   ${expected.table}.${expected.column}: CASCADE — REVIEW REQUIRED.`,
        );
      } else {
        console.log(
          `   ${expected.table}.${expected.column}: ${actual.deleteRule} — REVIEW REQUIRED.`,
        );
      }
    }

    console.log();
    console.log("=".repeat(60));
    console.log("BATCH 2 FK-RULE AUDIT RESULT");
    console.log("=".repeat(60));

    console.log(`Discovered FK paths: ${result.rows.length}`);
    console.log(`Expected FK paths:   ${EXPECTED_FKS.length}`);
    console.log(`Failures:            ${pathFailures}`);
    console.log();

    if (pathFailures > 0) {
      console.log("❌ BATCH 2 FK-RULE AUDIT: FAIL");
      console.log();
      console.log(
        "DO NOT proceed to the Batch 2 dry-run or deletion.",
      );

      process.exitCode = 1;
      return;
    }

    const hasCascade = normalizedActual.some(
      (fk) => fk.deleteRule === "CASCADE",
    );

    if (hasCascade) {
      console.log("❌ CASCADE DELETE RULE DETECTED.");
      console.log(
        "DO NOT proceed without reviewing the cascade behavior.",
      );

      process.exitCode = 1;
      return;
    }

    console.log("✅ BATCH 2 FK-RULE AUDIT: PASS");
    console.log();
    console.log("Confirmed:");
    console.log("  • Exactly six FK paths reference SubCounty.id");
    console.log("  • All six expected paths are present");
    console.log("  • All six point to SubCounty.id");
    console.log("  • No CASCADE delete rule exists");
    console.log("  • Delete rules match the expected PostgreSQL schema");
    console.log();
    console.log(
      "NEXT STEP: Run the Batch 2 deletion dry-run audit.",
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error();
  console.error("=".repeat(60));
  console.error("BATCH 2 FK-RULE AUDIT: ERROR");
  console.error("=".repeat(60));
  console.error();

  console.error(error);

  await pool.end().catch(() => {});

  process.exitCode = 1;
});