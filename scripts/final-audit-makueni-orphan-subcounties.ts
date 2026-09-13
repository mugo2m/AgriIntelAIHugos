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

const COUNTY_ID = 74;

const ORPHAN_CANDIDATES = [665, 667, 668, 670, 671, 672, 673];

function printSection(title: string) {
  console.log("\n" + "=".repeat(90));
  console.log(title);
  console.log("=".repeat(90));
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘`´']/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/subcounty$/i, "");
}

async function main() {
  console.log("\n");
  console.log("🔎 FINAL READ-ONLY AUDIT — MAKUENI SUBCOUNTY CLEANUP");
  console.log("County ID: 74");
  console.log("County: Makueni");
  console.log("No database changes will be made.");

  // ===========================================================================
  // 1. VERIFY COUNTY
  // ===========================================================================

  printSection("1. COUNTY VERIFICATION");

  const county = await prisma.$queryRaw<
    Array<{
      id: number;
      name: string;
    }>
  >`
    SELECT id, name
    FROM "County"
    WHERE id = ${COUNTY_ID}
  `;

  if (county.length === 0) {
    throw new Error(`County ${COUNTY_ID} does not exist.`);
  }

  console.log(`County ID: ${county[0].id}`);
  console.log(`County Name: ${county[0].name}`);
  console.log("✅ County verified.");

  // ===========================================================================
  // 2. VERIFY DELETED KIBWEZI 666
  // ===========================================================================

  printSection("2. VERIFY PREVIOUSLY DELETED SUBCOUNTY 666");

  const deletedKibwezi = await prisma.$queryRaw<
    Array<{
      id: number;
      name: string;
    }>
  >`
    SELECT id, name
    FROM "SubCounty"
    WHERE id = 666
  `;

  if (deletedKibwezi.length === 0) {
    console.log("✅ SubCounty 666 no longer exists.");
  } else {
    console.log(
      `⚠️ SubCounty 666 still exists: ${deletedKibwezi[0].name}`
    );
  }

  // ===========================================================================
  // 3. CURRENT MAKUENI SUBCOUNTIES
  // ===========================================================================

  printSection("3. CURRENT MAKUENI SUBCOUNTIES");

  const allSubCounties = await prisma.$queryRaw<
    Array<{
      id: number;
      name: string;
      countyId: number;
      wardCount: bigint;
    }>
  >`
    SELECT
      sc.id,
      sc.name,
      sc."countyId",
      COUNT(w.id)::bigint AS "wardCount"
    FROM "SubCounty" sc
    LEFT JOIN "Ward" w
      ON w."subCountyId" = sc.id
    WHERE sc."countyId" = ${COUNTY_ID}
    GROUP BY sc.id, sc.name, sc."countyId"
    ORDER BY sc.id
  `;

  console.log(`Current Makueni SubCounties: ${allSubCounties.length}\n`);

  for (const sc of allSubCounties) {
    console.log(
      `ID ${sc.id} | ${sc.name} | Wards: ${Number(sc.wardCount)}`
    );
  }

  // ===========================================================================
  // 4. AUDIT ALL ORPHAN CANDIDATES
  // ===========================================================================

  printSection("4. DETAILED AUDIT OF ORPHAN CANDIDATES");

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
    `Formal FKs pointing to SubCounty.id: ${fkDefinitions.length}`
  );

  const candidateResults: Array<{
    id: number;
    name: string;
    countyId: number;
    wards: number;
    farmers: number;
    farms: number;
    businessPartners: number;
    formalFkReferences: number;
    normalizedDuplicate: boolean;
    triggers: number;
  }> = [];

  for (const candidateId of ORPHAN_CANDIDATES) {
    console.log("\n" + "-".repeat(90));
    console.log(`AUDITING SUBCOUNTY ${candidateId}`);

    // -------------------------------------------------------------------------
    // Target identity
    // -------------------------------------------------------------------------

    const target = await prisma.$queryRaw<
      Array<{
        id: number;
        name: string;
        countyId: number;
        countyName: string;
      }>
    >`
      SELECT
        sc.id,
        sc.name,
        sc."countyId",
        c.name AS "countyName"
      FROM "SubCounty" sc
      LEFT JOIN "County" c
        ON c.id = sc."countyId"
      WHERE sc.id = ${candidateId}
    `;

    if (target.length === 0) {
      console.log(`❌ SubCounty ${candidateId} does not exist.`);
      continue;
    }

    const record = target[0];

    console.log(`ID: ${record.id}`);
    console.log(`Name: ${record.name}`);
    console.log(`County ID: ${record.countyId}`);
    console.log(`County: ${record.countyName}`);

    if (record.countyId !== COUNTY_ID) {
      console.log(
        `⚠️ WARNING: Expected County ${COUNTY_ID}, found ${record.countyId}`
      );
    }

    // -------------------------------------------------------------------------
    // Known relationships
    // -------------------------------------------------------------------------

    const wardCount = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "Ward"
      WHERE "subCountyId" = ${candidateId}
    `;

    const farmerCount = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "Farmer"
      WHERE "subCountyId" = ${candidateId}
    `;

    const farmCount = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "Farm"
      WHERE "subCountyId" = ${candidateId}
    `;

    const businessPartnerCount = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "BusinessPartner"
      WHERE "subCountyId" = ${candidateId}
    `;

    const wards = Number(wardCount[0].count);
    const farmers = Number(farmerCount[0].count);
    const farms = Number(farmCount[0].count);
    const businessPartners = Number(
      businessPartnerCount[0].count
    );

    console.log("\nKnown relationships:");
    console.log(`  Wards: ${wards}`);
    console.log(`  Farmers: ${farmers}`);
    console.log(`  Farms: ${farms}`);
    console.log(`  Business Partners: ${businessPartners}`);

    // -------------------------------------------------------------------------
    // Formal FK references
    // -------------------------------------------------------------------------

    let formalFkReferences = 0;

    console.log("\nFormal FK references:");

    for (const fk of fkDefinitions) {
      const tableName = `"${fk.table_name.replace(/"/g, '""')}"`;
      const columnName = `"${fk.column_name.replace(/"/g, '""')}"`;

      const sql = `
        SELECT COUNT(*)::bigint AS count
        FROM ${tableName}
        WHERE ${columnName} = $1
      `;

      const result =
        await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          sql,
          candidateId
        );

      const count = Number(result[0].count);

      formalFkReferences += count;

      console.log(
        `  ${fk.table_name}.${fk.column_name}: ${count}`
      );
    }

    console.log(
      `  TOTAL FORMAL FK REFERENCES: ${formalFkReferences}`
    );

    // -------------------------------------------------------------------------
    // Normalized duplicate
    // -------------------------------------------------------------------------

    const targetNormalizedName = normalizeName(record.name);

    const countyRecords = await prisma.$queryRaw<
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
      WHERE "countyId" = ${COUNTY_ID}
      ORDER BY id
    `;

    const duplicates = countyRecords.filter(
      (item) =>
        normalizeName(item.name) === targetNormalizedName
    );

    const otherDuplicates = duplicates.filter(
      (item) => item.id !== candidateId
    );

    const normalizedDuplicate =
      otherDuplicates.length > 0;

    console.log("\nNormalized duplicate check:");

    if (normalizedDuplicate) {
      console.log(
        `  ⚠️ ${otherDuplicates.length} potential duplicate(s)`
      );

      for (const duplicate of otherDuplicates) {
        console.log(
          `  ID ${duplicate.id} | ${duplicate.name}`
        );
      }
    } else {
      console.log("  ✅ No normalized duplicate.");
    }

    // -------------------------------------------------------------------------
    // Triggers
    // -------------------------------------------------------------------------

    const triggers = await prisma.$queryRaw<
      Array<{
        trigger_name: string;
      }>
    >`
      SELECT
        tg.tgname AS trigger_name
      FROM pg_trigger tg
      JOIN pg_class rel
        ON rel.oid = tg.tgrelid
      JOIN pg_namespace nsp
        ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'SubCounty'
        AND nsp.nspname = 'public'
        AND NOT tg.tgisinternal
      ORDER BY tg.tgname
    `;

    console.log("\nUser-defined triggers:");

    if (triggers.length === 0) {
      console.log("  None.");
    } else {
      console.log(`  ${triggers.length} trigger(s)`);

      for (const trigger of triggers) {
        console.log(`  ${trigger.trigger_name}`);
      }
    }

    // -------------------------------------------------------------------------
    // Classification
    // -------------------------------------------------------------------------

    const completelyOrphaned =
      record.countyId === COUNTY_ID &&
      wards === 0 &&
      farmers === 0 &&
      farms === 0 &&
      businessPartners === 0 &&
      formalFkReferences === 0 &&
      !normalizedDuplicate &&
      triggers.length === 0;

    console.log("\nClassification:");

    if (completelyOrphaned) {
      console.log("  🟢 COMPLETELY ORPHANED");
    } else {
      console.log("  ⚠️ REQUIRES REVIEW");
    }

    candidateResults.push({
      id: record.id,
      name: record.name,
      countyId: record.countyId,
      wards,
      farmers,
      farms,
      businessPartners,
      formalFkReferences,
      normalizedDuplicate,
      triggers: triggers.length,
    });
  }

  // ===========================================================================
  // 5. ACTIVE POPULATED SUBCOUNTIES
  // ===========================================================================

  printSection("5. ACTIVE POPULATED MAKUENI SUBCOUNTIES");

  const populated = allSubCounties.filter(
    (sc) => Number(sc.wardCount) > 0
  );

  console.log(
    `Populated SubCounties: ${populated.length}`
  );

  let totalMakueniWards = 0;

  for (const sc of populated) {
    const count = Number(sc.wardCount);

    totalMakueniWards += count;

    console.log(
      `ID ${sc.id} | ${sc.name} | Wards: ${count}`
    );
  }

  console.log(
    `\nTotal wards under populated SubCounties: ${totalMakueniWards}`
  );

  // ===========================================================================
  // 6. VERIFY ALL MAKUENI WARDS HAVE VALID SUBCOUNTY ASSIGNMENTS
  // ===========================================================================

  printSection("6. MAKUENI WARD ASSIGNMENT INTEGRITY");

  const invalidWards = await prisma.$queryRaw<
    Array<{
      id: number;
      name: string;
      subCountyId: number | null;
      subCountyName: string | null;
    }>
  >`
    SELECT
      w.id,
      w.name,
      w."subCountyId",
      sc.name AS "subCountyName"
    FROM "Ward" w
    LEFT JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    WHERE w."countyId" = ${COUNTY_ID}
      AND (
        w."subCountyId" IS NULL
        OR sc.id IS NULL
        OR sc."countyId" <> ${COUNTY_ID}
      )
    ORDER BY w.id
  `;

  console.log(
    `Makueni wards with invalid/missing SubCounty assignment: ${invalidWards.length}`
  );

  if (invalidWards.length === 0) {
    console.log("✅ All Makueni wards have valid SubCounty assignments.");
  } else {
    for (const ward of invalidWards) {
      console.log(
        `⚠️ Ward ${ward.id} | ${ward.name} | ` +
          `SubCounty ${ward.subCountyId ?? "NULL"} | ` +
          `${ward.subCountyName ?? "NULL"}`
      );
    }
  }

  // ===========================================================================
  // 7. CHECK WARD OVERLAP BETWEEN ACTIVE SUBCOUNTIES
  // ===========================================================================

  printSection("7. ACTIVE SUBCOUNTY WARD OVERLAP CHECK");

  const duplicateWardAssignments = await prisma.$queryRaw<
    Array<{
      wardId: number;
      wardName: string;
      assignmentCount: bigint;
    }>
  >`
    SELECT
      w.id AS "wardId",
      w.name AS "wardName",
      COUNT(DISTINCT w."subCountyId")::bigint AS "assignmentCount"
    FROM "Ward" w
    WHERE w."countyId" = ${COUNTY_ID}
      AND w."subCountyId" IS NOT NULL
    GROUP BY w.id, w.name
    HAVING COUNT(DISTINCT w."subCountyId") > 1
    ORDER BY w.id
  `;

  console.log(
    `Wards assigned to more than one SubCounty: ${duplicateWardAssignments.length}`
  );

  if (duplicateWardAssignments.length === 0) {
    console.log("✅ No ward assignment overlap.");
  }

  // ===========================================================================
  // 8. FINAL CONSOLIDATED SUMMARY
  // ===========================================================================

  printSection("8. FINAL CONSOLIDATED SUMMARY");

  console.log(
    "Candidate ID | SubCounty | Wards | Farmers | Farms | BusinessPartners | FKRefs | Duplicate | Triggers"
  );
  console.log("-".repeat(110));

  for (const result of candidateResults) {
    console.log(
      `${result.id.toString().padEnd(12)} | ` +
        `${result.name.padEnd(10)} | ` +
        `${result.wards.toString().padEnd(5)} | ` +
        `${result.farmers.toString().padEnd(7)} | ` +
        `${result.farms.toString().padEnd(5)} | ` +
        `${result.businessPartners.toString().padEnd(16)} | ` +
        `${result.formalFkReferences.toString().padEnd(6)} | ` +
        `${result.normalizedDuplicate ? "YES" : "NO "}       | ` +
        `${result.triggers}`
    );
  }

  // ===========================================================================
  // 9. FINAL DECISION READINESS
  // ===========================================================================

  printSection("9. FINAL DECISION READINESS");

  const allCandidatesOrphaned =
    candidateResults.length === ORPHAN_CANDIDATES.length &&
    candidateResults.every(
      (result) =>
        result.countyId === COUNTY_ID &&
        result.wards === 0 &&
        result.farmers === 0 &&
        result.farms === 0 &&
        result.businessPartners === 0 &&
        result.formalFkReferences === 0 &&
        !result.normalizedDuplicate &&
        result.triggers === 0
    );

  const hierarchyIntegrityPassed =
    invalidWards.length === 0 &&
    duplicateWardAssignments.length === 0;

  console.log(
    `All seven candidates completely orphaned: ${
      allCandidatesOrphaned ? "YES" : "NO"
    }`
  );

  console.log(
    `Makueni ward hierarchy integrity passed: ${
      hierarchyIntegrityPassed ? "YES" : "NO"
    }`
  );

  console.log(
    `SubCounty 666 remains deleted: ${
      deletedKibwezi.length === 0 ? "YES" : "NO"
    }`
  );

  console.log(`\nActive populated SubCounties: ${populated.length}`);
  console.log(`Total Makueni wards: ${totalMakueniWards}`);

  if (allCandidatesOrphaned && hierarchyIntegrityPassed) {
    console.log("\n🟢 FINAL AUDIT PASSED");
    console.log(
      "The seven candidate SubCounty records are completely orphaned."
    );
    console.log(
      "The active Makueni ward hierarchy remains internally consistent."
    );
    console.log(
      "No database changes were made."
    );
    console.log(
      "Deletion may now be considered separately after explicit approval."
    );
  } else {
    console.log("\n⚠️ FINAL AUDIT REQUIRES REVIEW");
    console.log(
      "Do NOT delete the candidate records until the issues above are resolved."
    );
  }

  // ===========================================================================
  // 10. READ-ONLY CONFIRMATION
  // ===========================================================================

  printSection("10. READ-ONLY CONFIRMATION");

  console.log("✅ SELECT/query operations only.");
  console.log("✅ No INSERT performed.");
  console.log("✅ No UPDATE performed.");
  console.log("✅ No DELETE performed.");
  console.log("✅ No schema changes performed.");
}

main()
  .catch((error) => {
    console.error("\n❌ FINAL AUDIT FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });