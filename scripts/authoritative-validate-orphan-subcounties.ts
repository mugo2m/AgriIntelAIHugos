import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type ForeignKeyInfo = {
  constraintName: string;
  tableName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  deleteAction: string;
};

type SubCountyRecord = {
  id: number;
  name: string;
  countyId: number;
  countyName: string | null;
};

type DependencyResult = {
  tableName: string;
  columnName: string;
  count: number;
};

type ValidationResult = {
  id: number;
  name: string;
  countyId: number;
  countyName: string | null;

  wardCount: number;
  farmerCount: number;
  farmCount: number;
  businessPartnerCount: number;
  commoditySourceCount: number;
  commodityDestinationCount: number;

  formalForeignKeyReferences: DependencyResult[];

  normalizedDuplicateIds: number[];
  normalizedDuplicateNames: string[];

  countyValid: boolean;
  hasAnyDependency: boolean;
  hasFormalForeignKeyReference: boolean;
  hasNormalizedDuplicate: boolean;

  classification:
    | "SAFE_DELETE_CANDIDATE"
    | "POSSIBLE_DUPLICATE_MERGE"
    | "REVIEW_REQUIRED"
    | "KEEP";

  reasons: string[];
};

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘`´']/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/subcounty$/i, "")
    .replace(/county$/i, "")
    .trim();
}

function numberValue(value: unknown): number {
  return Number(value ?? 0);
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function getForeignKeys(): Promise<ForeignKeyInfo[]> {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      constraint_name: string;
      table_name: string;
      column_name: string;
      referenced_table: string;
      referenced_column: string;
      delete_action: string;
    }>
  >(`
    SELECT
      con.conname AS constraint_name,
      child.relname AS table_name,
      child_col.attname AS column_name,
      parent.relname AS referenced_table,
      parent_col.attname AS referenced_column,

      CASE con.confdeltype::text
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE 'UNKNOWN'
      END AS delete_action

    FROM pg_constraint con

    JOIN pg_class child
      ON child.oid = con.conrelid

    JOIN pg_class parent
      ON parent.oid = con.confrelid

    JOIN LATERAL unnest(con.conkey)
      WITH ORDINALITY AS child_keys(attnum, ord)
      ON TRUE

    JOIN LATERAL unnest(con.confkey)
      WITH ORDINALITY AS parent_keys(attnum, ord)
      ON parent_keys.ord = child_keys.ord

    JOIN pg_attribute child_col
      ON child_col.attrelid = child.oid
     AND child_col.attnum = child_keys.attnum

    JOIN pg_attribute parent_col
      ON parent_col.attrelid = parent.oid
     AND parent_col.attnum = parent_keys.attnum

    WHERE con.contype = 'f'
      AND parent.relname = 'SubCounty'
      AND parent_col.attname = 'id'

    ORDER BY child.relname, child_col.attname;
  `);

  return rows.map((row) => ({
    constraintName: row.constraint_name,
    tableName: row.table_name,
    columnName: row.column_name,
    referencedTable: row.referenced_table,
    referencedColumn: row.referenced_column,
    deleteAction: row.delete_action,
  }));
}

async function countDependency(
  tableName: string,
  columnName: string,
  subCountyId: number
): Promise<number> {
  const table = quoteIdentifier(tableName);
  const column = quoteIdentifier(columnName);

  const rows = await prisma.$queryRawUnsafe<
    Array<{ count: bigint }>
  >(
    `
      SELECT COUNT(*) AS count
      FROM ${table}
      WHERE ${column} = $1
    `,
    subCountyId
  );

  return numberValue(rows[0]?.count);
}

async function countForeignKeyReference(
  fk: ForeignKeyInfo,
  subCountyId: number
): Promise<number> {
  return countDependency(
    fk.tableName,
    fk.columnName,
    subCountyId
  );
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("AUTHORITATIVE ORPHAN SUBCOUNTY VALIDATION");
  console.log("============================================================");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  const databaseRows = await prisma.$queryRawUnsafe<
    Array<{ current_database: string }>
  >(
    `SELECT current_database()`
  );

  console.log(
    `Database: ${databaseRows[0]?.current_database ?? "UNKNOWN"}`
  );

  console.log("");

  // ----------------------------------------------------------
  // 1. DISCOVER FORMAL FOREIGN KEYS
  // ----------------------------------------------------------

  console.log("Discovering formal foreign keys to SubCounty.id...");

  const foreignKeys = await getForeignKeys();

  console.log(
    `Formal foreign keys found: ${foreignKeys.length}`
  );

  console.log("");

  for (const fk of foreignKeys) {
    console.log(
      `  ${fk.tableName}.${fk.columnName} -> ` +
      `${fk.referencedTable}.${fk.referencedColumn} ` +
      `[${fk.deleteAction}]`
    );
  }

  console.log("");

  const expectedForeignKeys = new Set([
    "BusinessPartner.subCountyId",
    "CommodityTransaction.destinationSubCountyId",
    "CommodityTransaction.sourceSubCountyId",
    "Farm.subCountyId",
    "Farmer.subCountyId",
    "Ward.subCountyId",
  ]);

  const discoveredForeignKeys = new Set(
    foreignKeys.map(
      (fk) => `${fk.tableName}.${fk.columnName}`
    )
  );

  if (foreignKeys.length !== 6) {
    throw new Error(
      `SAFETY STOP: Expected 6 formal FKs, found ${foreignKeys.length}.`
    );
  }

  for (const expected of expectedForeignKeys) {
    if (!discoveredForeignKeys.has(expected)) {
      throw new Error(
        `SAFETY STOP: Missing expected FK ${expected}.`
      );
    }
  }

  console.log("Formal FK structure verified.");
  console.log("");

  // ----------------------------------------------------------
  // 2. LOAD ALL SUBCOUNTIES
  // ----------------------------------------------------------

  const allSubCounties = await prisma.$queryRawUnsafe<
    SubCountyRecord[]
  >(`
    SELECT
      sc.id,
      sc.name,
      sc."countyId",
      c.name AS "countyName"
    FROM "SubCounty" sc

    LEFT JOIN "County" c
      ON c.id = sc."countyId"

    ORDER BY sc.id;
  `);

  console.log(
    `Total SubCounties currently in database: ${allSubCounties.length}`
  );

  console.log("");

  // ----------------------------------------------------------
  // 3. IDENTIFY TRUE ORPHANS
  // ----------------------------------------------------------

  const orphanCandidates: SubCountyRecord[] = [];

  for (const sc of allSubCounties) {
    const wardCount = await countDependency(
      "Ward",
      "subCountyId",
      sc.id
    );

    const farmerCount = await countDependency(
      "Farmer",
      "subCountyId",
      sc.id
    );

    const farmCount = await countDependency(
      "Farm",
      "subCountyId",
      sc.id
    );

    const businessPartnerCount = await countDependency(
      "BusinessPartner",
      "subCountyId",
      sc.id
    );

    const commoditySourceCount = await countDependency(
      "CommodityTransaction",
      "sourceSubCountyId",
      sc.id
    );

    const commodityDestinationCount =
      await countDependency(
        "CommodityTransaction",
        "destinationSubCountyId",
        sc.id
      );

    let formalReferenceCount = 0;

    for (const fk of foreignKeys) {
      formalReferenceCount +=
        await countForeignKeyReference(fk, sc.id);
    }

    if (
      wardCount === 0 &&
      farmerCount === 0 &&
      farmCount === 0 &&
      businessPartnerCount === 0 &&
      commoditySourceCount === 0 &&
      commodityDestinationCount === 0 &&
      formalReferenceCount === 0
    ) {
      orphanCandidates.push(sc);
    }
  }

  console.log(
    `True orphan candidates identified: ${orphanCandidates.length}`
  );

  console.log("");

  // ----------------------------------------------------------
  // 4. BUILD NORMALIZED NAME MAP
  // ----------------------------------------------------------

  const normalizedMap = new Map<
    string,
    SubCountyRecord[]
  >();

  for (const sc of allSubCounties) {
    const key =
      `${sc.countyId}:${normalizeName(sc.name)}`;

    const records =
      normalizedMap.get(key) ?? [];

    records.push(sc);

    normalizedMap.set(key, records);
  }

  const duplicateGroups =
    Array.from(normalizedMap.entries())
      .filter(([, records]) => records.length > 1);

  console.log(
    `Normalized duplicate groups found: ${duplicateGroups.length}`
  );

  console.log("");

  for (const [, records] of duplicateGroups) {
    console.log("DUPLICATE GROUP:");

    for (const record of records) {
      console.log(
        `  ID ${record.id} | ${record.name} | ` +
        `County ${record.countyId} (${record.countyName})`
      );
    }

    console.log("");
  }

  // ----------------------------------------------------------
  // 5. AUTHORITATIVE VALIDATION
  // ----------------------------------------------------------

  const results: ValidationResult[] = [];

  for (const candidate of orphanCandidates) {
    console.log(
      `Validating ${candidate.id} | ${candidate.name} | ` +
      `${candidate.countyName}`
    );

    const wardCount = await countDependency(
      "Ward",
      "subCountyId",
      candidate.id
    );

    const farmerCount = await countDependency(
      "Farmer",
      "subCountyId",
      candidate.id
    );

    const farmCount = await countDependency(
      "Farm",
      "subCountyId",
      candidate.id
    );

    const businessPartnerCount =
      await countDependency(
        "BusinessPartner",
        "subCountyId",
        candidate.id
      );

    const commoditySourceCount =
      await countDependency(
        "CommodityTransaction",
        "sourceSubCountyId",
        candidate.id
      );

    const commodityDestinationCount =
      await countDependency(
        "CommodityTransaction",
        "destinationSubCountyId",
        candidate.id
      );

    const formalForeignKeyReferences:
      DependencyResult[] = [];

    for (const fk of foreignKeys) {
      const count =
        await countForeignKeyReference(
          fk,
          candidate.id
        );

      formalForeignKeyReferences.push({
        tableName: fk.tableName,
        columnName: fk.columnName,
        count,
      });
    }

    // --------------------------------------------------------
    // DUPLICATE CHECK
    // --------------------------------------------------------

    const normalizedName =
      normalizeName(candidate.name);

    const normalizedDuplicates =
      allSubCounties.filter(
        (sc) =>
          sc.id !== candidate.id &&
          sc.countyId === candidate.countyId &&
          normalizeName(sc.name) === normalizedName
      );

    const normalizedDuplicateIds =
      normalizedDuplicates.map(
        (sc) => sc.id
      );

    const normalizedDuplicateNames =
      normalizedDuplicates.map(
        (sc) => sc.name
      );

    // --------------------------------------------------------
    // DEPENDENCY CHECK
    // --------------------------------------------------------

    const hasFormalForeignKeyReference =
      formalForeignKeyReferences.some(
        (ref) => ref.count > 0
      );

    const hasAnyDependency =
      wardCount > 0 ||
      farmerCount > 0 ||
      farmCount > 0 ||
      businessPartnerCount > 0 ||
      commoditySourceCount > 0 ||
      commodityDestinationCount > 0 ||
      hasFormalForeignKeyReference;

    const countyValid =
      candidate.countyId !== null &&
      candidate.countyId !== undefined &&
      Boolean(candidate.countyName);

    const hasNormalizedDuplicate =
      normalizedDuplicateIds.length > 0;

    // --------------------------------------------------------
    // CLASSIFICATION
    // --------------------------------------------------------

    let classification:
      ValidationResult["classification"];

    const reasons: string[] = [];

    if (hasNormalizedDuplicate) {
      classification =
        "POSSIBLE_DUPLICATE_MERGE";

      reasons.push(
        `Normalized duplicate exists in same county: ` +
        `${normalizedDuplicateIds.join(", ")}`
      );
    } else if (!countyValid) {
      classification =
        "REVIEW_REQUIRED";

      reasons.push(
        "County relationship is invalid or missing."
      );
    } else if (hasAnyDependency) {
      classification =
        "REVIEW_REQUIRED";

      reasons.push(
        "One or more database dependencies exist."
      );
    } else {
      classification =
        "SAFE_DELETE_CANDIDATE";

      reasons.push(
        "No Ward, Farmer, Farm, BusinessPartner, " +
        "CommodityTransaction or formal FK references found."
      );
    }

    results.push({
      id: candidate.id,
      name: candidate.name,
      countyId: candidate.countyId,
      countyName: candidate.countyName,

      wardCount,
      farmerCount,
      farmCount,
      businessPartnerCount,
      commoditySourceCount,
      commodityDestinationCount,

      formalForeignKeyReferences,

      normalizedDuplicateIds,
      normalizedDuplicateNames,

      countyValid,
      hasAnyDependency,
      hasFormalForeignKeyReference,
      hasNormalizedDuplicate,

      classification,
      reasons,
    });
  }

  // ----------------------------------------------------------
  // 6. GLOBAL WARD INTEGRITY
  // ----------------------------------------------------------

  const wardRows = await prisma.$queryRawUnsafe<
    Array<{
      total: bigint;
      invalid_or_null: bigint;
    }>
  >(`
    SELECT
      COUNT(*) AS total,

      COUNT(*) FILTER (
        WHERE "subCountyId" IS NULL
           OR "subCountyId" NOT IN (
             SELECT id
             FROM "SubCounty"
           )
      ) AS invalid_or_null

    FROM "Ward";
  `);

  const wardTotal =
    numberValue(wardRows[0]?.total);

  const invalidWardRefs =
    numberValue(
      wardRows[0]?.invalid_or_null
    );

  const mismatchRows =
    await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(`
      SELECT COUNT(*) AS count

      FROM "Ward" w

      JOIN "SubCounty" sc
        ON sc.id = w."subCountyId"

      WHERE w."countyId"
        IS DISTINCT FROM sc."countyId";
    `);

  const wardCountyMismatches =
    numberValue(
      mismatchRows[0]?.count
    );

  // ----------------------------------------------------------
  // 7. KIBWEZI SAFETY CHECK
  // ----------------------------------------------------------

  const kibweziRows =
    await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(`
      SELECT COUNT(*) AS count
      FROM "SubCounty"
      WHERE id = 666;
    `);

  const kibweziExists =
    numberValue(
      kibweziRows[0]?.count
    );

  // ----------------------------------------------------------
  // 8. MAKUENI SAFETY CHECK
  // ----------------------------------------------------------

  const makueniRows =
    await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        name: string;
        ward_count: bigint;
      }>
    >(`
      SELECT
        sc.id,
        sc.name,
        COUNT(w.id) AS ward_count

      FROM "SubCounty" sc

      LEFT JOIN "Ward" w
        ON w."subCountyId" = sc.id

      WHERE sc."countyId" = 74

      GROUP BY sc.id, sc.name

      ORDER BY sc.id;
    `);

  // ----------------------------------------------------------
  // 9. RESULTS
  // ----------------------------------------------------------

  console.log("");
  console.log("============================================================");
  console.log("AUTHORITATIVE VALIDATION RESULTS");
  console.log("============================================================");
  console.log("");

  const safeDeleteCandidates =
    results.filter(
      (r) =>
        r.classification ===
        "SAFE_DELETE_CANDIDATE"
    );

  const possibleDuplicates =
    results.filter(
      (r) =>
        r.classification ===
        "POSSIBLE_DUPLICATE_MERGE"
    );

  const reviewRequired =
    results.filter(
      (r) =>
        r.classification ===
        "REVIEW_REQUIRED"
    );

  const keepRecords =
    results.filter(
      (r) =>
        r.classification === "KEEP"
    );

  console.log(
    `Orphan candidates examined: ${results.length}`
  );

  console.log(
    `SAFE_DELETE_CANDIDATE: ${safeDeleteCandidates.length}`
  );

  console.log(
    `POSSIBLE_DUPLICATE_MERGE: ${possibleDuplicates.length}`
  );

  console.log(
    `REVIEW_REQUIRED: ${reviewRequired.length}`
  );

  console.log(
    `KEEP: ${keepRecords.length}`
  );

  console.log("");

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "SAFE DELETE CANDIDATES"
  );

  console.log(
    "------------------------------------------------------------"
  );

  for (const result of safeDeleteCandidates) {
    console.log(
      `${result.id} | ${result.name} | ` +
      `${result.countyName}`
    );
  }

  console.log("");

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "POSSIBLE DUPLICATE / MERGE"
  );

  console.log(
    "------------------------------------------------------------"
  );

  for (const result of possibleDuplicates) {
    console.log(
      `${result.id} | ${result.name} | ` +
      `${result.countyName} | ` +
      `duplicate IDs: ` +
      `${result.normalizedDuplicateIds.join(", ")}`
    );
  }

  console.log("");

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "REVIEW REQUIRED"
  );

  console.log(
    "------------------------------------------------------------"
  );

  for (const result of reviewRequired) {
    console.log(
      `${result.id} | ${result.name} | ` +
      `${result.countyName}`
    );

    for (const reason of result.reasons) {
      console.log(`  ${reason}`);
    }
  }

  console.log("");

  // ----------------------------------------------------------
  // 10. MAKUENI
  // ----------------------------------------------------------

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "MAKUENI SAFETY CHECK"
  );

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    `SubCounties remaining: ${makueniRows.length}`
  );

  for (const row of makueniRows) {
    console.log(
      `  ${row.id} | ${row.name} | ` +
      `${numberValue(row.ward_count)} wards`
    );
  }

  console.log("");

  // ----------------------------------------------------------
  // 11. GLOBAL WARD RESULTS
  // ----------------------------------------------------------

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "GLOBAL WARD HIERARCHY"
  );

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    `Total wards: ${wardTotal}`
  );

  console.log(
    `Invalid/null Ward.subCountyId: ${invalidWardRefs}`
  );

  console.log(
    `Ward→SubCounty→County mismatches: ` +
    `${wardCountyMismatches}`
  );

  console.log("");

  // ----------------------------------------------------------
  // 12. KIBWEZI RESULT
  // ----------------------------------------------------------

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "KIBWEZI 666 SAFETY CHECK"
  );

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    `SubCounty 666 exists: ${kibweziExists}`
  );

  console.log("");

  // ----------------------------------------------------------
  // 13. SAVE JSON REPORT
  // ----------------------------------------------------------

  fs.mkdirSync(
    path.join(process.cwd(), "audit-reports"),
    { recursive: true }
  );

  const report = {
    auditType:
      "AUTHORITATIVE_ORPHAN_SUBCOUNTY_VALIDATION",

    readOnly: true,

    database:
      databaseRows[0]?.current_database ?? null,

    generatedAt:
      new Date().toISOString(),

    totalSubCounties:
      allSubCounties.length,

    orphanCandidates:
      orphanCandidates.length,

    safeDeleteCandidates:
      safeDeleteCandidates.length,

    possibleDuplicateMerges:
      possibleDuplicates.length,

    reviewRequired:
      reviewRequired.length,

    keep:
      keepRecords.length,

    formalForeignKeys:
      foreignKeys,

    normalizedDuplicateGroups:
      duplicateGroups.map(
        ([key, records]) => ({
          key,
          records: records.map(
            (record) => ({
              id: record.id,
              name: record.name,
              countyId: record.countyId,
              countyName: record.countyName,
            })
          ),
        })
      ),

    results,

    globalWardIntegrity: {
      totalWards: wardTotal,
      invalidOrNullSubCountyReferences:
        invalidWardRefs,
      wardCountyMismatches:
        wardCountyMismatches,
    },

    kibwezi666: {
      exists: kibweziExists > 0,
    },

    makueni: {
      subCounties:
        makueniRows.map(
          (row) => ({
            id: row.id,
            name: row.name,
            wardCount:
              numberValue(
                row.ward_count
              ),
          })
        ),
    },

    databaseChanges: {
      insert: 0,
      update: 0,
      delete: 0,
      schemaChanges: 0,
    },
  };

  const outputFile = path.join(
    process.cwd(),
    "audit-reports",
    "authoritative-orphan-subcounty-validation.json"
  );

  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      report,
      null,
      2
    ),
    "utf8"
  );

  // ----------------------------------------------------------
  // 14. FINAL SAFETY STATEMENT
  // ----------------------------------------------------------

  console.log(
    "============================================================"
  );

  console.log(
    "FINAL READ-ONLY SAFETY CHECK"
  );

  console.log(
    "============================================================"
  );

  console.log(
    "INSERT operations: 0"
  );

  console.log(
    "UPDATE operations: 0"
  );

  console.log(
    "DELETE operations: 0"
  );

  console.log(
    "Schema changes: 0"
  );

  console.log("");

  console.log(
    `JSON report written to: ${outputFile}`
  );

  console.log("");

  console.log(
    "AUTHORITATIVE VALIDATION COMPLETED."
  );

  console.log(
    "NO DATABASE CHANGES WERE MADE."
  );

  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "AUTHORITATIVE VALIDATION FAILED:"
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });