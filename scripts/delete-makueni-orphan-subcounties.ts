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

// ============================================================================
// APPROVED DELETION LIST
// ============================================================================

const COUNTY_ID = 74;

const APPROVED_SUBCOUNTIES = [
  { id: 665, name: "Kathonzweni" },
  { id: 667, name: "Kilungu" },
  { id: 668, name: "Makindu" },
  { id: 670, name: "Mbooni East" },
  { id: 671, name: "Mbooni West" },
  { id: 672, name: "Mukaa" },
  { id: 673, name: "Nzaui" },
];

// These are the active Makueni SubCounties that MUST remain.
const PROTECTED_SUBCOUNTIES = [
  { id: 358, name: "Mbooni  Sub County" },
  { id: 359, name: "Kilome Sub County" },
  { id: 360, name: "Kaiti  Sub County" },
  { id: 361, name: "Makueni  Sub County" },
  { id: 362, name: "Kibwezi West  Sub County" },
  { id: 401, name: "Kibwezi East  Sub County" },
];

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
  console.log("🗑️  CONTROLLED MAKUENI SUBCOUNTY DELETION");
  console.log("=".repeat(90));
  console.log("County ID: 74");
  console.log("County: Makueni");
  console.log("");
  console.log("APPROVED IDS:");
  console.log(
    APPROVED_SUBCOUNTIES.map((item) => `${item.id} (${item.name})`).join(", ")
  );
  console.log("");
  console.log("⚠️ Only these seven SubCounty records may be deleted.");
  console.log("⚠️ Any unexpected dependency will abort the transaction.");
  console.log("⚠️ No active SubCounty or Ward will be deleted.");

  // ==========================================================================
  // 1. DISCOVER FORMAL FOREIGN KEYS
  // ==========================================================================

  printSection("1. DISCOVER FORMAL SUBCOUNTY FOREIGN KEYS");

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
    `Formal foreign keys pointing to SubCounty.id: ${fkDefinitions.length}`
  );

  for (const fk of fkDefinitions) {
    console.log(
      `${fk.table_name}.${fk.column_name} -> ` +
        `${fk.referenced_table}.${fk.referenced_column} ` +
        `[ON DELETE ${fk.delete_action}]`
    );
  }

  if (fkDefinitions.length !== 6) {
    throw new Error(
      `SAFETY ABORT: Expected exactly 6 formal FKs pointing to SubCounty.id, ` +
        `but found ${fkDefinitions.length}.`
    );
  }

  console.log("✅ Expected six formal SubCounty foreign keys confirmed.");

  // ==========================================================================
  // 2. START DEFENSIVE TRANSACTION
  // ==========================================================================

  printSection("2. START DEFENSIVE TRANSACTION");

  await prisma.$transaction(
    async (tx) => {
      console.log("🔒 Transaction started.");

      // ========================================================================
      // 2A. VERIFY COUNTY
      // ========================================================================

      const county = await tx.$queryRaw<
        Array<{
          id: number;
          name: string;
        }>
      >`
        SELECT id, name
        FROM "County"
        WHERE id = ${COUNTY_ID}
      `;

      if (county.length !== 1) {
        throw new Error(
          `SAFETY ABORT: Expected County ${COUNTY_ID} to exist exactly once.`
        );
      }

      if (county[0].name !== "Makueni") {
        throw new Error(
          `SAFETY ABORT: County ${COUNTY_ID} is "${county[0].name}", not Makueni.`
        );
      }

      console.log(
        `✅ County verified: ${county[0].id} | ${county[0].name}`
      );

      // ========================================================================
      // 2B. VERIFY SUBCOUNTY 666 REMAINS DELETED
      // ========================================================================

      const kibwezi666 = await tx.$queryRaw<
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

      if (kibwezi666.length !== 0) {
        throw new Error(
          "SAFETY ABORT: SubCounty 666 still exists. " +
            "Expected it to remain deleted."
        );
      }

      console.log("✅ Previously deleted SubCounty 666 remains absent.");

      // ========================================================================
      // 2C. VERIFY EVERY APPROVED TARGET
      // ========================================================================

      console.log("\nVerifying approved deletion targets...");

      for (const approved of APPROVED_SUBCOUNTIES) {
        const target = await tx.$queryRaw<
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
          WHERE id = ${approved.id}
        `;

        if (target.length !== 1) {
          throw new Error(
            `SAFETY ABORT: Expected SubCounty ${approved.id} ` +
              `to exist exactly once.`
          );
        }

        if (target[0].name !== approved.name) {
          throw new Error(
            `SAFETY ABORT: SubCounty ${approved.id} name mismatch. ` +
              `Expected "${approved.name}", found "${target[0].name}".`
          );
        }

        if (target[0].countyId !== COUNTY_ID) {
          throw new Error(
            `SAFETY ABORT: SubCounty ${approved.id} belongs to County ` +
              `${target[0].countyId}, not County ${COUNTY_ID}.`
          );
        }

        console.log(
          `✅ Verified ID ${approved.id} | ${target[0].name} | County ${target[0].countyId}`
        );
      }

      // ========================================================================
      // 2D. VERIFY PROTECTED ACTIVE SUBCOUNTIES
      // ========================================================================

      console.log("\nVerifying protected active SubCounties...");

      for (const protectedItem of PROTECTED_SUBCOUNTIES) {
        const target = await tx.$queryRaw<
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
          WHERE id = ${protectedItem.id}
        `;

        if (target.length !== 1) {
          throw new Error(
            `SAFETY ABORT: Protected SubCounty ${protectedItem.id} ` +
              `does not exist exactly once.`
          );
        }

        if (target[0].countyId !== COUNTY_ID) {
          throw new Error(
            `SAFETY ABORT: Protected SubCounty ${protectedItem.id} ` +
              `does not belong to Makueni.`
          );
        }

        console.log(
          `✅ Protected: ID ${target[0].id} | ${target[0].name}`
        );
      }

      // ========================================================================
      // 2E. VERIFY NO APPROVED TARGET HAS WARDS
      // ========================================================================

      printSection("3. DEFENSIVE DEPENDENCY CHECKS");

      let totalWardReferences = 0;
      let totalFarmerReferences = 0;
      let totalFarmReferences = 0;
      let totalBusinessPartnerReferences = 0;
      let totalFormalFkReferences = 0;

      for (const approved of APPROVED_SUBCOUNTIES) {
        console.log(`\nChecking ID ${approved.id} | ${approved.name}`);

        // ----------------------------------------------------------------------
        // Wards
        // ----------------------------------------------------------------------

        const wards = await tx.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS count
          FROM "Ward"
          WHERE "subCountyId" = ${approved.id}
        `;

        const wardCount = Number(wards[0].count);

        totalWardReferences += wardCount;

        console.log(`  Wards: ${wardCount}`);

        if (wardCount !== 0) {
          throw new Error(
            `SAFETY ABORT: SubCounty ${approved.id} has ${wardCount} ward(s).`
          );
        }

        // ----------------------------------------------------------------------
        // Farmers
        // ----------------------------------------------------------------------

        const farmers = await tx.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS count
          FROM "Farmer"
          WHERE "subCountyId" = ${approved.id}
        `;

        const farmerCount = Number(farmers[0].count);

        totalFarmerReferences += farmerCount;

        console.log(`  Farmers: ${farmerCount}`);

        if (farmerCount !== 0) {
          throw new Error(
            `SAFETY ABORT: SubCounty ${approved.id} has ${farmerCount} farmer(s).`
          );
        }

        // ----------------------------------------------------------------------
        // Farms
        // ----------------------------------------------------------------------

        const farms = await tx.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS count
          FROM "Farm"
          WHERE "subCountyId" = ${approved.id}
        `;

        const farmCount = Number(farms[0].count);

        totalFarmReferences += farmCount;

        console.log(`  Farms: ${farmCount}`);

        if (farmCount !== 0) {
          throw new Error(
            `SAFETY ABORT: SubCounty ${approved.id} has ${farmCount} farm(s).`
          );
        }

        // ----------------------------------------------------------------------
        // Business Partners
        // ----------------------------------------------------------------------

        const businessPartners = await tx.$queryRaw<
          Array<{ count: bigint }>
        >`
          SELECT COUNT(*)::bigint AS count
          FROM "BusinessPartner"
          WHERE "subCountyId" = ${approved.id}
        `;

        const businessPartnerCount = Number(
          businessPartners[0].count
        );

        totalBusinessPartnerReferences += businessPartnerCount;

        console.log(
          `  Business Partners: ${businessPartnerCount}`
        );

        if (businessPartnerCount !== 0) {
          throw new Error(
            `SAFETY ABORT: SubCounty ${approved.id} has ` +
              `${businessPartnerCount} business partner(s).`
          );
        }

        // ----------------------------------------------------------------------
        // Every formal FK
        // ----------------------------------------------------------------------

        for (const fk of fkDefinitions) {
          const tableName = `"${fk.table_name.replace(/"/g, '""')}"`;
          const columnName = `"${fk.column_name.replace(/"/g, '""')}"`;

          const sql = `
            SELECT COUNT(*)::bigint AS count
            FROM ${tableName}
            WHERE ${columnName} = $1
          `;

          const result =
            await tx.$queryRawUnsafe<Array<{ count: bigint }>>(
              sql,
              approved.id
            );

          const count = Number(result[0].count);

          totalFormalFkReferences += count;

          console.log(
            `  FK ${fk.table_name}.${fk.column_name}: ${count}`
          );

          if (count !== 0) {
            throw new Error(
              `SAFETY ABORT: ${fk.table_name}.${fk.column_name} ` +
                `contains ${count} reference(s) to SubCounty ${approved.id}.`
            );
          }
        }
      }

      // ========================================================================
      // 2F. GLOBAL DEPENDENCY SUMMARY
      // ========================================================================

      console.log("\nDependency summary:");

      console.log(
        `  Total Ward references: ${totalWardReferences}`
      );

      console.log(
        `  Total Farmer references: ${totalFarmerReferences}`
      );

      console.log(
        `  Total Farm references: ${totalFarmReferences}`
      );

      console.log(
        `  Total Business Partner references: ${totalBusinessPartnerReferences}`
      );

      console.log(
        `  Total formal FK references: ${totalFormalFkReferences}`
      );

      if (
        totalWardReferences !== 0 ||
        totalFarmerReferences !== 0 ||
        totalFarmReferences !== 0 ||
        totalBusinessPartnerReferences !== 0 ||
        totalFormalFkReferences !== 0
      ) {
        throw new Error(
          "SAFETY ABORT: One or more dependencies were detected."
        );
      }

      console.log("✅ All dependency checks returned zero.");

      // ========================================================================
      // 2G. NORMALIZED DUPLICATE CHECK
      // ========================================================================

      printSection("4. NORMALIZED DUPLICATE SAFETY CHECK");

      const allMakueniSubCounties = await tx.$queryRaw<
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

      for (const approved of APPROVED_SUBCOUNTIES) {
        const target = allMakueniSubCounties.find(
          (item) => item.id === approved.id
        );

        if (!target) {
          throw new Error(
            `SAFETY ABORT: Approved target ${approved.id} disappeared during transaction.`
          );
        }

        const normalizedTarget = normalizeName(target.name);

        const duplicates = allMakueniSubCounties.filter(
          (item) =>
            item.id !== approved.id &&
            normalizeName(item.name) === normalizedTarget
        );

        if (duplicates.length > 0) {
          console.log(
            `⚠️ Potential normalized duplicate for ${approved.id}:`
          );

          for (const duplicate of duplicates) {
            console.log(
              `   ID ${duplicate.id} | ${duplicate.name}`
            );
          }

          throw new Error(
            `SAFETY ABORT: Normalized duplicate detected for SubCounty ${approved.id}.`
          );
        }

        console.log(
          `✅ No normalized duplicate for ${approved.id} | ${approved.name}`
        );
      }

      // ========================================================================
      // 2H. VERIFY PROTECTED SUBCOUNTIES HAVE NOT BECOME TARGETS
      // ========================================================================

      printSection("5. PROTECTED HIERARCHY SAFETY CHECK");

      for (const protectedItem of PROTECTED_SUBCOUNTIES) {
        if (
          APPROVED_SUBCOUNTIES.some(
            (approved) => approved.id === protectedItem.id
          )
        ) {
          throw new Error(
            `SAFETY ABORT: Protected SubCounty ${protectedItem.id} ` +
              `appears in deletion list.`
          );
        }
      }

      console.log(
        `✅ ${PROTECTED_SUBCOUNTIES.length} active SubCounties are protected.`
      );

      // ========================================================================
      // 2I. RECORD PRE-DELETE COUNTS
      // ========================================================================

      printSection("6. PRE-DELETE HIERARCHY SNAPSHOT");

      const preDeleteWardCount = await tx.$queryRaw<
        Array<{ count: bigint }>
      >`
        SELECT COUNT(*)::bigint AS count
        FROM "Ward"
        WHERE "countyId" = ${COUNTY_ID}
      `;

      const preDeleteSubCountyCount = await tx.$queryRaw<
        Array<{ count: bigint }>
      >`
        SELECT COUNT(*)::bigint AS count
        FROM "SubCounty"
        WHERE "countyId" = ${COUNTY_ID}
      `;

      console.log(
        `Makueni SubCounty count before deletion: ${Number(
          preDeleteSubCountyCount[0].count
        )}`
      );

      console.log(
        `Makueni Ward count before deletion: ${Number(
          preDeleteWardCount[0].count
        )}`
      );

      if (Number(preDeleteWardCount[0].count) !== 30) {
        throw new Error(
          `SAFETY ABORT: Expected exactly 30 Makueni wards before deletion, ` +
            `found ${Number(preDeleteWardCount[0].count)}.`
        );
      }

      if (
        Number(preDeleteSubCountyCount[0].count) !==
        13
      ) {
        throw new Error(
          `SAFETY ABORT: Expected exactly 13 Makueni SubCounties before deletion, ` +
            `found ${Number(preDeleteSubCountyCount[0].count)}.`
        );
      }

      console.log("✅ Pre-delete hierarchy snapshot matches audited state.");

      // ========================================================================
      // 2J. DELETE EXACT APPROVED RECORDS
      // ========================================================================

      printSection("7. DELETE APPROVED ORPHAN RECORDS");

      for (const approved of APPROVED_SUBCOUNTIES) {
        console.log(
          `Deleting ID ${approved.id} | ${approved.name}...`
        );

        const deleteResult = await tx.$executeRaw`
          DELETE FROM "SubCounty"
          WHERE id = ${approved.id}
            AND name = ${approved.name}
            AND "countyId" = ${COUNTY_ID}
        `;

        if (deleteResult !== 1) {
          throw new Error(
            `SAFETY ABORT: Expected to delete exactly one row for ` +
              `SubCounty ${approved.id}, but deleted ${deleteResult}.`
          );
        }

        console.log(
          `✅ Deleted ID ${approved.id} | ${approved.name}`
        );
      }

      // ========================================================================
      // 2K. VERIFY TARGETS ARE GONE INSIDE TRANSACTION
      // ========================================================================

      printSection("8. VERIFY DELETIONS INSIDE TRANSACTION");

      for (const approved of APPROVED_SUBCOUNTIES) {
        const remaining = await tx.$queryRaw<
          Array<{
            id: number;
          }>
        >`
          SELECT id
          FROM "SubCounty"
          WHERE id = ${approved.id}
        `;

        if (remaining.length !== 0) {
          throw new Error(
            `SAFETY ABORT: SubCounty ${approved.id} still exists after deletion.`
          );
        }

        console.log(
          `✅ Confirmed deleted: ${approved.id} | ${approved.name}`
        );
      }

      // ========================================================================
      // 2L. VERIFY ACTIVE SUBCOUNTIES INSIDE TRANSACTION
      // ========================================================================

      printSection("9. VERIFY ACTIVE SUBCOUNTIES");

      for (const protectedItem of PROTECTED_SUBCOUNTIES) {
        const remaining = await tx.$queryRaw<
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
          WHERE id = ${protectedItem.id}
        `;

        if (remaining.length !== 1) {
          throw new Error(
            `SAFETY ABORT: Protected SubCounty ${protectedItem.id} ` +
              `was unexpectedly changed or deleted.`
          );
        }

        if (remaining[0].countyId !== COUNTY_ID) {
          throw new Error(
            `SAFETY ABORT: Protected SubCounty ${protectedItem.id} ` +
              `has unexpected County ${remaining[0].countyId}.`
          );
        }

        console.log(
          `✅ Protected SubCounty intact: ${remaining[0].id} | ${remaining[0].name}`
        );
      }

      // ========================================================================
      // 2M. VERIFY ALL 30 WARDS STILL EXIST
      // ========================================================================

      printSection("10. VERIFY MAKUENI WARDS");

      const postDeleteWardCount = await tx.$queryRaw<
        Array<{ count: bigint }>
      >`
        SELECT COUNT(*)::bigint AS count
        FROM "Ward"
        WHERE "countyId" = ${COUNTY_ID}
      `;

      const wardsAfterDeletion = Number(
        postDeleteWardCount[0].count
      );

      console.log(
        `Makueni wards after deletion: ${wardsAfterDeletion}`
      );

      if (wardsAfterDeletion !== 30) {
        throw new Error(
          `SAFETY ABORT: Makueni Ward count changed. ` +
            `Expected 30, found ${wardsAfterDeletion}.`
        );
      }

      console.log("✅ All 30 Makueni wards remain.");

      // ========================================================================
      // 2N. VERIFY ALL MAKUENI WARDS HAVE VALID SUBCOUNTIES
      // ========================================================================

      const invalidWards = await tx.$queryRaw<
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
        `Makueni wards with invalid/missing SubCounty: ${invalidWards.length}`
      );

      if (invalidWards.length !== 0) {
        for (const ward of invalidWards) {
          console.log(
            `⚠️ Ward ${ward.id} | ${ward.name} | ` +
              `SubCounty ${ward.subCountyId ?? "NULL"} | ` +
              `${ward.subCountyName ?? "NULL"}`
          );
        }

        throw new Error(
          "SAFETY ABORT: Invalid or missing Makueni ward assignments detected."
        );
      }

      console.log(
        "✅ All Makueni wards still have valid SubCounty assignments."
      );

      // ========================================================================
      // 2O. VERIFY NO WARD OVERLAP
      // ========================================================================

      const overlappingWards = await tx.$queryRaw<
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
        `Makueni wards with multiple SubCounty assignments: ${overlappingWards.length}`
      );

      if (overlappingWards.length !== 0) {
        throw new Error(
          "SAFETY ABORT: Ward assignment overlap detected."
        );
      }

      console.log("✅ No ward assignment overlap.");

      // ========================================================================
      // 2P. VERIFY EXPECTED FINAL SUBCOUNTY COUNT
      // ========================================================================

      printSection("11. VERIFY FINAL MAKUENI SUBCOUNTY COUNT");

      const finalSubCountyCount = await tx.$queryRaw<
        Array<{ count: bigint }>
      >`
        SELECT COUNT(*)::bigint AS count
        FROM "SubCounty"
        WHERE "countyId" = ${COUNTY_ID}
      `;

      const finalCount = Number(
        finalSubCountyCount[0].count
      );

      console.log(
        `Makueni SubCounties after deletion: ${finalCount}`
      );

      if (finalCount !== 6) {
        throw new Error(
          `SAFETY ABORT: Expected exactly 6 Makueni SubCounties after deletion, ` +
            `found ${finalCount}.`
        );
      }

      console.log(
        "✅ Exactly six active Makueni SubCounties remain."
      );

      // ========================================================================
      // 2Q. FINAL ACTIVE SUBCOUNTY LIST
      // ========================================================================

      const finalSubCounties = await tx.$queryRaw<
        Array<{
          id: number;
          name: string;
          wardCount: bigint;
        }>
      >`
        SELECT
          sc.id,
          sc.name,
          COUNT(w.id)::bigint AS "wardCount"
        FROM "SubCounty" sc
        LEFT JOIN "Ward" w
          ON w."subCountyId" = sc.id
        WHERE sc."countyId" = ${COUNTY_ID}
        GROUP BY sc.id, sc.name
        ORDER BY sc.id
      `;

      console.log("\nFinal active Makueni hierarchy:");

      for (const sc of finalSubCounties) {
        console.log(
          `ID ${sc.id} | ${sc.name} | Wards: ${Number(sc.wardCount)}`
        );
      }

      // ========================================================================
      // 2R. FINAL TRANSACTION SAFETY CHECK
      // ========================================================================

      printSection("12. TRANSACTION FINAL SAFETY CHECK");

      console.log("✅ Seven approved orphan records deleted.");
      console.log("✅ No approved record remains.");
      console.log("✅ Protected active SubCounties remain.");
      console.log("✅ All 30 Makueni wards remain.");
      console.log("✅ All Makueni wards have valid SubCounty assignments.");
      console.log("✅ No ward assignment overlap detected.");
      console.log("✅ Final Makueni SubCounty count is 6.");

      console.log("\n🟢 ALL TRANSACTION SAFETY CHECKS PASSED.");
      console.log("Transaction is ready to commit.");
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );

  // ==========================================================================
  // 3. POST-COMMIT VERIFICATION
  // ==========================================================================

  printSection("13. POST-COMMIT VERIFICATION");

  console.log("Transaction committed successfully.");

  // --------------------------------------------------------------------------
  // Verify deleted records remain absent
  // --------------------------------------------------------------------------

  for (const approved of APPROVED_SUBCOUNTIES) {
    const remaining = await prisma.$queryRaw<
      Array<{
        id: number;
        name: string;
      }>
    >`
      SELECT id, name
      FROM "SubCounty"
      WHERE id = ${approved.id}
    `;

    if (remaining.length !== 0) {
      throw new Error(
        `POST-COMMIT FAILURE: SubCounty ${approved.id} still exists.`
      );
    }

    console.log(
      `✅ Permanently deleted: ID ${approved.id} | ${approved.name}`
    );
  }

  // --------------------------------------------------------------------------
  // Verify protected records
  // --------------------------------------------------------------------------

  console.log("\nProtected active SubCounties:");

  for (const protectedItem of PROTECTED_SUBCOUNTIES) {
    const record = await prisma.$queryRaw<
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
      WHERE id = ${protectedItem.id}
    `;

    if (record.length !== 1) {
      throw new Error(
        `POST-COMMIT FAILURE: Protected SubCounty ${protectedItem.id} is missing.`
      );
    }

    console.log(
      `✅ ID ${record[0].id} | ${record[0].name} | County ${record[0].countyId}`
    );
  }

  // --------------------------------------------------------------------------
  // Verify final counts
  // --------------------------------------------------------------------------

  const finalSubCountyCount = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*)::bigint AS count
    FROM "SubCounty"
    WHERE "countyId" = ${COUNTY_ID}
  `;

  const finalWardCount = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*)::bigint AS count
    FROM "Ward"
    WHERE "countyId" = ${COUNTY_ID}
  `;

  const finalSubCounties = Number(
    finalSubCountyCount[0].count
  );

  const finalWards = Number(finalWardCount[0].count);

  console.log(
    `\nFinal Makueni SubCounties: ${finalSubCounties}`
  );

  console.log(
    `Final Makueni Wards: ${finalWards}`
  );

  if (finalSubCounties !== 6) {
    throw new Error(
      `POST-COMMIT FAILURE: Expected 6 Makueni SubCounties, found ${finalSubCounties}.`
    );
  }

  if (finalWards !== 30) {
    throw new Error(
      `POST-COMMIT FAILURE: Expected 30 Makueni wards, found ${finalWards}.`
    );
  }

  // --------------------------------------------------------------------------
  // Verify ward integrity after commit
  // --------------------------------------------------------------------------

  const invalidWards = await prisma.$queryRaw<
    Array<{
      id: number;
      name: string;
    }>
  >`
    SELECT
      w.id,
      w.name
    FROM "Ward" w
    LEFT JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    WHERE w."countyId" = ${COUNTY_ID}
      AND (
        w."subCountyId" IS NULL
        OR sc.id IS NULL
        OR sc."countyId" <> ${COUNTY_ID}
      )
  `;

  if (invalidWards.length !== 0) {
    throw new Error(
      `POST-COMMIT FAILURE: ${invalidWards.length} invalid Makueni ward assignment(s) detected.`
    );
  }

  console.log(
    "✅ Post-commit ward assignment integrity passed."
  );

  // --------------------------------------------------------------------------
  // Final success
  // --------------------------------------------------------------------------

  printSection("14. FINAL RESULT");

  console.log("🟢 MAKUENI SUBCOUNTY CLEANUP COMPLETED SUCCESSFULLY");
  console.log("");
  console.log("Deleted:");
  for (const approved of APPROVED_SUBCOUNTIES) {
    console.log(
      `  🗑️ ID ${approved.id} | ${approved.name}`
    );
  }

  console.log("");
  console.log("Remaining active SubCounties:");
  for (const protectedItem of PROTECTED_SUBCOUNTIES) {
    console.log(
      `  🟢 ID ${protectedItem.id} | ${protectedItem.name}`
    );
  }

  console.log("");
  console.log(`Final Makueni SubCounties: ${finalSubCounties}`);
  console.log(`Final Makueni Wards: ${finalWards}`);

  console.log("");
  console.log("✅ No farmer references lost.");
  console.log("✅ No farm references lost.");
  console.log("✅ No business partner references lost.");
  console.log("✅ No commodity transaction references lost.");
  console.log("✅ No wards deleted.");
  console.log("✅ No active SubCounty deleted.");
  console.log("✅ No invalid ward assignments created.");
}

main()
  .catch((error) => {
    console.error("\n❌ MAKUENI DELETION FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });