import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

type SubCountyRecord = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
};

type DependencyResult = {
  wards: number;
  farmers: number;
  farms: number;
  businessPartners: number;
  commodityDestination: number;
  commoditySource: number;
  totalFormalFkReferences: number;
};

type AuditRecord = SubCountyRecord & DependencyResult & {
  normalizedName: string;
  normalizedDuplicates: string[];
  classification: string;
};

function section(title: string) {
  console.log("\n" + "=".repeat(100));
  console.log(title);
  console.log("=".repeat(100));
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘`´']/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/subcounty$/i, "");
}

async function main() {
  section("GLOBAL SUBCOUNTY ORPHAN / DUPLICATE AUDIT");

  console.log("🔎 READ-ONLY DATABASE AUDIT");
  console.log("");
  console.log("⚠️ No INSERT operations.");
  console.log("⚠️ No UPDATE operations.");
  console.log("⚠️ No DELETE operations.");
  console.log("⚠️ No schema changes.");
  console.log("");
  console.log("Scope: ALL SubCounties in the database.");

  // ==========================================================================
  // 1. DATABASE CONNECTION
  // ==========================================================================

  section("1. DATABASE CONNECTION");

  const databaseCheck = await prisma.$queryRaw<
    Array<{ database_name: string }>
  >`
    SELECT current_database() AS database_name
  `;

  console.log(
    `Database: ${databaseCheck[0].database_name}`
  );

  // ==========================================================================
  // 2. COUNTY INVENTORY
  // ==========================================================================

  section("2. COUNTY INVENTORY");

  const countyStats = await prisma.$queryRaw<
    Array<{
      countyCount: bigint;
      subCountyCount: bigint;
      wardCount: bigint;
    }>
  >`
    SELECT
      (SELECT COUNT(*) FROM "County")::bigint AS "countyCount",
      (SELECT COUNT(*) FROM "SubCounty")::bigint AS "subCountyCount",
      (SELECT COUNT(*) FROM "Ward")::bigint AS "wardCount"
  `;

  const countyCount = Number(countyStats[0].countyCount);
  const subCountyCount = Number(countyStats[0].subCountyCount);
  const wardCount = Number(countyStats[0].wardCount);

  console.log(`Counties:    ${countyCount}`);
  console.log(`SubCounties: ${subCountyCount}`);
  console.log(`Wards:       ${wardCount}`);

  // ==========================================================================
  // 3. DISCOVER ALL FORMAL FOREIGN KEYS
  // ==========================================================================

  section("3. FORMAL FOREIGN KEYS REFERENCING SUBCOUNTY.ID");

  const fkDefinitions = await prisma.$queryRaw<
    Array<{
      constraint_name: string;
      table_name: string;
      column_name: string;
      referenced_table: string;
      referenced_column: string;
      delete_action: string;
    }>
  >`
    SELECT
      con.conname AS constraint_name,
      rel.relname AS table_name,
      att.attname AS column_name,
      refrel.relname AS referenced_table,
      refatt.attname AS referenced_column,
      CASE con.confdeltype::text
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE 'UNKNOWN'
      END AS delete_action
    FROM pg_constraint con
    JOIN pg_class rel
      ON rel.oid = con.conrelid
    JOIN pg_class refrel
      ON refrel.oid = con.confrelid
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid
     AND att.attnum = con.conkey[1]
    JOIN pg_attribute refatt
      ON refatt.attrelid = con.confrelid
     AND refatt.attnum = con.confkey[1]
    WHERE con.contype = 'f'
      AND refrel.relname = 'SubCounty'
      AND refatt.attname = 'id'
    ORDER BY rel.relname, att.attname
  `;

  console.log(
    `Formal foreign keys found: ${fkDefinitions.length}`
  );

  for (const fk of fkDefinitions) {
    console.log(
      `${fk.table_name}.${fk.column_name} -> ` +
        `${fk.referenced_table}.${fk.referenced_column} ` +
        `[ON DELETE ${fk.delete_action}]`
    );
  }

  // ==========================================================================
  // 4. GET ALL SUBCOUNTIES
  // ==========================================================================

  section("4. LOAD ALL SUBCOUNTIES");

  const subCounties = await prisma.$queryRaw<SubCountyRecord[]>`
    SELECT
      sc.id,
      sc.name,
      sc."countyId",
      c.name AS "countyName"
    FROM "SubCounty" sc
    LEFT JOIN "County" c
      ON c.id = sc."countyId"
    ORDER BY sc."countyId", sc.id
  `;

  console.log(
    `SubCounty records loaded: ${subCounties.length}`
  );

  if (subCounties.length !== subCountyCount) {
    throw new Error(
      `SAFETY FAILURE: Expected ${subCountyCount} SubCounties ` +
        `but loaded ${subCounties.length}.`
    );
  }

  console.log("✅ All SubCounty records loaded.");

  // ==========================================================================
  // 5. COUNTY RELATIONSHIP VALIDATION
  // ==========================================================================

  section("5. COUNTY RELATIONSHIP VALIDATION");

  const invalidCountyAssignments = subCounties.filter(
    (sc) =>
      sc.countyName === null ||
      sc.countyName === undefined
  );

  console.log(
    `SubCounties with missing/invalid County: ${invalidCountyAssignments.length}`
  );

  if (invalidCountyAssignments.length > 0) {
    for (const sc of invalidCountyAssignments) {
      console.log(
        `⚠️ SubCounty ${sc.id} | ${sc.name} | County ${sc.countyId}`
      );
    }
  } else {
    console.log("✅ Every SubCounty has a valid County.");
  }

  // ==========================================================================
  // 6. BUILD NORMALIZED NAME GROUPS
  // ==========================================================================

  section("6. NORMALIZED DUPLICATE ANALYSIS");

  const normalizedGroups = new Map<string, SubCountyRecord[]>();

  for (const sc of subCounties) {
    const normalized = normalizeName(sc.name);

    const key = `${sc.countyId}:${normalized}`;

    const existing = normalizedGroups.get(key) ?? [];

    existing.push(sc);

    normalizedGroups.set(key, existing);
  }

  const duplicateGroups = Array.from(
    normalizedGroups.values()
  ).filter((group) => group.length > 1);

  console.log(
    `Normalized duplicate groups: ${duplicateGroups.length}`
  );

  if (duplicateGroups.length > 0) {
    console.log("\n⚠️ NORMALIZED DUPLICATES:");

    for (const group of duplicateGroups) {
      const countyName = group[0].countyName;

      console.log("");
      console.log(
        `County ${group[0].countyId} | ${countyName}`
      );

      for (const item of group) {
        console.log(
          `  ID ${item.id} | ${item.name}`
        );
      }
    }
  } else {
    console.log("✅ No normalized duplicate SubCounty names found.");
  }

  // ==========================================================================
  // 7. AUDIT EVERY SUBCOUNTY
  // ==========================================================================

  section("7. AUDIT EVERY SUBCOUNTY");

  const auditResults: AuditRecord[] = [];

  let processed = 0;

  for (const sc of subCounties) {
    processed++;

    console.log(
      `\n[${processed}/${subCounties.length}] ` +
        `ID ${sc.id} | ${sc.name} | County ${sc.countyName}`
    );

    // ------------------------------------------------------------------------
    // Known relationships
    // ------------------------------------------------------------------------

    const wardResult = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "Ward"
      WHERE "subCountyId" = ${sc.id}
    `;

    const farmerResult = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "Farmer"
      WHERE "subCountyId" = ${sc.id}
    `;

    const farmResult = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "Farm"
      WHERE "subCountyId" = ${sc.id}
    `;

    const businessPartnerResult = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "BusinessPartner"
      WHERE "subCountyId" = ${sc.id}
    `;

    const commodityDestinationResult = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "CommodityTransaction"
      WHERE "destinationSubCountyId" = ${sc.id}
    `;

    const commoditySourceResult = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "CommodityTransaction"
      WHERE "sourceSubCountyId" = ${sc.id}
    `;

    const wards = Number(wardResult[0].count);
    const farmers = Number(farmerResult[0].count);
    const farms = Number(farmResult[0].count);
    const businessPartners = Number(
      businessPartnerResult[0].count
    );
    const commodityDestination = Number(
      commodityDestinationResult[0].count
    );
    const commoditySource = Number(
      commoditySourceResult[0].count
    );

    // ------------------------------------------------------------------------
    // Formal FK audit
    // ------------------------------------------------------------------------

    let totalFormalFkReferences = 0;

    for (const fk of fkDefinitions) {
      const tableName =
        `"${fk.table_name.replace(/"/g, '""')}"`;

      const columnName =
        `"${fk.column_name.replace(/"/g, '""')}"`;

      const sql = `
        SELECT COUNT(*)::bigint AS count
        FROM ${tableName}
        WHERE ${columnName} = $1
      `;

      const result =
        await prisma.$queryRawUnsafe<
          Array<{ count: bigint }>
        >(sql, sc.id);

      totalFormalFkReferences += Number(
        result[0].count
      );
    }

    // ------------------------------------------------------------------------
    // Normalized duplicates
    // ------------------------------------------------------------------------

    const normalized = normalizeName(sc.name);

    const duplicates =
      normalizedGroups.get(
        `${sc.countyId}:${normalized}`
      ) ?? [];

    const normalizedDuplicates = duplicates
      .filter((item) => item.id !== sc.id)
      .map(
        (item) =>
          `${item.id} (${item.name})`
      );

    // ------------------------------------------------------------------------
    // Classification
    // ------------------------------------------------------------------------

    const knownDependencyTotal =
      wards +
      farmers +
      farms +
      businessPartners +
      commodityDestination +
      commoditySource;

    let classification = "";

    if (
      knownDependencyTotal === 0 &&
      totalFormalFkReferences === 0
    ) {
      classification = "ORPHAN";
    } else if (normalizedDuplicates.length > 0) {
      classification = "DUPLICATE / POPULATED";
    } else {
      classification = "POPULATED / ACTIVE";
    }

    auditResults.push({
      ...sc,
      normalizedName: normalized,
      wards,
      farmers,
      farms,
      businessPartners,
      commodityDestination,
      commoditySource,
      totalFormalFkReferences,
      normalizedDuplicates,
      classification,
    });

    console.log(
      `  Wards: ${wards} | Farmers: ${farmers} | Farms: ${farms}`
    );

    console.log(
      `  BusinessPartners: ${businessPartners}`
    );

    console.log(
      `  Commodity destination: ${commodityDestination}`
    );

    console.log(
      `  Commodity source: ${commoditySource}`
    );

    console.log(
      `  Formal FK references: ${totalFormalFkReferences}`
    );

    if (normalizedDuplicates.length > 0) {
      console.log(
        `  ⚠️ Normalized duplicates: ${normalizedDuplicates.join(", ")}`
      );
    }

    console.log(
      `  Classification: ${classification}`
    );
  }

  // ==========================================================================
  // 8. GLOBAL SUMMARY
  // ==========================================================================

  section("8. GLOBAL AUDIT SUMMARY");

  const orphaned = auditResults.filter(
    (item) => item.classification === "ORPHAN"
  );

  const populated = auditResults.filter(
    (item) =>
      item.classification === "POPULATED / ACTIVE"
  );

  const duplicatePopulated = auditResults.filter(
    (item) =>
      item.classification === "DUPLICATE / POPULATED"
  );

  console.log(
    `Total SubCounties audited: ${auditResults.length}`
  );

  console.log(
    `Orphan SubCounties: ${orphaned.length}`
  );

  console.log(
    `Populated/active SubCounties: ${populated.length}`
  );

  console.log(
    `Duplicate/populated SubCounties: ${duplicatePopulated.length}`
  );

  console.log(
    `Normalized duplicate groups: ${duplicateGroups.length}`
  );

  console.log(
    `Invalid County assignments: ${invalidCountyAssignments.length}`
  );

  // ==========================================================================
  // 9. ORPHAN LIST
  // ==========================================================================

  section("9. COMPLETE ORPHAN SUBCOUNTY LIST");

  if (orphaned.length === 0) {
    console.log(
      "🟢 NO ORPHAN SUBCOUNTIES FOUND."
    );
  } else {
    console.log(
      `🔴 ${orphaned.length} ORPHAN SUBCOUNTY RECORD(S) FOUND:\n`
    );

    for (const item of orphaned) {
      console.log(
        `ID ${item.id} | ${item.name} | ` +
          `County ${item.countyId} (${item.countyName})`
      );
    }
  }

  // ==========================================================================
  // 10. DUPLICATE LIST
  // ==========================================================================

  section("10. COMPLETE NORMALIZED DUPLICATE LIST");

  if (duplicateGroups.length === 0) {
    console.log(
      "🟢 NO NORMALIZED DUPLICATES FOUND."
    );
  } else {
    for (const group of duplicateGroups) {
      console.log("");
      console.log(
        `County ${group[0].countyId} | ${group[0].countyName}`
      );

      for (const item of group) {
        const dependencies =
          auditResults.find(
            (audit) => audit.id === item.id
          );

        console.log(
          `  ID ${item.id} | ${item.name} | ` +
            `Wards ${dependencies?.wards ?? "?"} | ` +
            `Farmers ${dependencies?.farmers ?? "?"} | ` +
            `Farms ${dependencies?.farms ?? "?"}`
        );
      }
    }
  }

  // ==========================================================================
  // 11. COUNTY-BY-COUNTY SUMMARY
  // ==========================================================================

  section("11. COUNTY-BY-COUNTY SUBCOUNTY SUMMARY");

  const countyGroups = new Map<
    number,
    AuditRecord[]
  >();

  for (const item of auditResults) {
    const existing =
      countyGroups.get(item.countyId) ?? [];

    existing.push(item);

    countyGroups.set(item.countyId, existing);
  }

  for (const [countyId, records] of countyGroups) {
    const countyName = records[0].countyName;

    const countyOrphans = records.filter(
      (item) => item.classification === "ORPHAN"
    ).length;

    const countyDuplicates = records.filter(
      (item) =>
        item.normalizedDuplicates.length > 0
    ).length;

    const countyWards = records.reduce(
      (sum, item) => sum + item.wards,
      0
    );

    console.log(
      `County ${countyId} | ${countyName} | ` +
        `SubCounties: ${records.length} | ` +
        `Wards: ${countyWards} | ` +
        `Orphans: ${countyOrphans} | ` +
        `Duplicate records: ${countyDuplicates}`
    );
  }

  // ==========================================================================
  // 12. SPECIAL CHECK FOR SUBCOUNTY 666
  // ==========================================================================

  section("12. PREVIOUS KIBWEZI 666 CHECK");

  const kibwezi666 = await prisma.$queryRaw<
    Array<{
      id: number;
      name: string;
      countyId: number;
    }>
  >`
    SELECT
      id,
      name,
      "countyId"
    FROM "SubCounty"
    WHERE id = 666
  `;

  if (kibwezi666.length === 0) {
    console.log(
      "✅ SubCounty 666 (Kibwezi) remains deleted."
    );
  } else {
    console.log(
      "⚠️ SubCounty 666 exists unexpectedly:"
    );

    console.log(kibwezi666[0]);
  }

  // ==========================================================================
  // 13. MAKUENI SPECIAL CHECK
  // ==========================================================================

  section("13. MAKUENI SPECIAL CHECK");

  const makueniRecords = auditResults.filter(
    (item) => item.countyId === 74
  );

  console.log(
    `Makueni SubCounties currently present: ${makueniRecords.length}`
  );

  for (const item of makueniRecords) {
    console.log(
      `ID ${item.id} | ${item.name} | Wards: ${item.wards}`
    );
  }

  const makueniWardTotal = makueniRecords.reduce(
    (sum, item) => sum + item.wards,
    0
  );

  console.log(
    `Total Makueni wards through SubCounty assignments: ${makueniWardTotal}`
  );

  // ==========================================================================
  // 14. GLOBAL WARD ASSIGNMENT CHECK
  // ==========================================================================

  section("14. GLOBAL WARD ASSIGNMENT INTEGRITY");

  const wardsWithoutSubCounty = await prisma.$queryRaw<
    Array<{
      id: number;
      name: string;
      countyId: number;
    }>
  >`
    SELECT
      w.id,
      w.name,
      w."countyId"
    FROM "Ward" w
    LEFT JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    WHERE w."subCountyId" IS NULL
       OR sc.id IS NULL
  `;

  console.log(
    `Wards with NULL/invalid SubCounty: ${wardsWithoutSubCounty.length}`
  );

  if (wardsWithoutSubCounty.length > 0) {
    for (const ward of wardsWithoutSubCounty) {
      console.log(
        `⚠️ Ward ${ward.id} | ${ward.name} | County ${ward.countyId}`
      );
    }
  } else {
    console.log(
      "🟢 Every Ward has a valid SubCounty reference."
    );
  }

  // ==========================================================================
  // 15. GLOBAL WARD / COUNTY CONSISTENCY
  // ==========================================================================

  section("15. GLOBAL WARD → SUBCOUNTY → COUNTY CONSISTENCY");

  const inconsistentWardHierarchy = await prisma.$queryRaw<
    Array<{
      wardId: number;
      wardName: string;
      wardCountyId: number;
      subCountyId: number;
      subCountyCountyId: number;
      subCountyName: string;
    }>
  >`
    SELECT
      w.id AS "wardId",
      w.name AS "wardName",
      w."countyId" AS "wardCountyId",
      sc.id AS "subCountyId",
      sc."countyId" AS "subCountyCountyId",
      sc.name AS "subCountyName"
    FROM "Ward" w
    JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    WHERE w."countyId" <> sc."countyId"
    ORDER BY w.id
  `;

  console.log(
    `Wards with County/SubCounty mismatch: ${inconsistentWardHierarchy.length}`
  );

  if (inconsistentWardHierarchy.length > 0) {
    for (const ward of inconsistentWardHierarchy) {
      console.log(
        `⚠️ Ward ${ward.wardId} | ${ward.wardName} | ` +
          `Ward County ${ward.wardCountyId} | ` +
          `SubCounty ${ward.subCountyId} (${ward.subCountyName}) | ` +
          `SubCounty County ${ward.subCountyCountyId}`
      );
    }
  } else {
    console.log(
      "🟢 Ward → SubCounty → County hierarchy is globally consistent."
    );
  }

  // ==========================================================================
  // 16. FINAL DATABASE SAFETY CHECK
  // ==========================================================================

  section("16. FINAL READ-ONLY SAFETY CHECK");

  console.log("Database changes made: 0");
  console.log("INSERT operations: 0");
  console.log("UPDATE operations: 0");
  console.log("DELETE operations: 0");
  console.log("Schema changes: 0");

  console.log("");
  console.log(
    `SubCounties audited: ${auditResults.length}`
  );

  console.log(
    `Orphans found: ${orphaned.length}`
  );

  console.log(
    `Normalized duplicate groups: ${duplicateGroups.length}`
  );

  console.log(
    `Invalid County assignments: ${invalidCountyAssignments.length}`
  );

  console.log(
    `Invalid Ward → SubCounty assignments: ${wardsWithoutSubCounty.length}`
  );

  console.log(
    `Ward → County/SubCounty mismatches: ${inconsistentWardHierarchy.length}`
  );

  console.log("");

  if (
    orphaned.length === 0 &&
    invalidCountyAssignments.length === 0 &&
    wardsWithoutSubCounty.length === 0 &&
    inconsistentWardHierarchy.length === 0 &&
    duplicateGroups.length === 0
  ) {
    console.log(
      "🟢 GLOBAL SUBCOUNTY INTEGRITY AUDIT PASSED."
    );

    console.log(
      "🟢 NO ORPHANS, NORMALIZED DUPLICATES, OR HIERARCHY ERRORS FOUND."
    );
  } else {
    console.log(
      "🟡 GLOBAL AUDIT COMPLETED — ISSUES REQUIRE REVIEW."
    );

    console.log(
      "⚠️ NO DATABASE CHANGES WERE MADE."
    );
  }
}

main()
  .catch((error) => {
    console.error("\n❌ GLOBAL SUBCOUNTY AUDIT FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });