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

const TARGET_ID = 673;

function printSection(title: string) {
  console.log("\n" + "=".repeat(80));
  console.log(title);
  console.log("=".repeat(80));
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘`´']/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/subcounty$/i, "");
}

async function main() {
  console.log("\n🔍 READ-ONLY AUDIT: SUBCOUNTY 673 — NZAUI");
  console.log("No database changes will be made.");

  // ---------------------------------------------------------------------------
  // 1. Confirm target identity
  // ---------------------------------------------------------------------------

  printSection("1. TARGET IDENTITY");

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
    WHERE sc.id = ${TARGET_ID}
  `;

  if (target.length === 0) {
    console.log(`❌ SubCounty ${TARGET_ID} does not exist.`);
    return;
  }

  console.log(`ID: ${target[0].id}`);
  console.log(`Name: ${target[0].name}`);
  console.log(`County ID: ${target[0].countyId}`);
  console.log(`County: ${target[0].countyName}`);

  // ---------------------------------------------------------------------------
  // 2. Known Prisma relationships
  // ---------------------------------------------------------------------------

  printSection("2. KNOWN RELATIONSHIP COUNTS");

  const wardCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Ward"
    WHERE "subCountyId" = ${TARGET_ID}
  `;

  const farmerCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Farmer"
    WHERE "subCountyId" = ${TARGET_ID}
  `;

  const farmCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Farm"
    WHERE "subCountyId" = ${TARGET_ID}
  `;

  const businessPartnerCount = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*)::bigint AS count
    FROM "BusinessPartner"
    WHERE "subCountyId" = ${TARGET_ID}
  `;

  console.log(`Wards: ${Number(wardCount[0].count)}`);
  console.log(`Farmers: ${Number(farmerCount[0].count)}`);
  console.log(`Farms: ${Number(farmCount[0].count)}`);
  console.log(
    `Business Partners: ${Number(businessPartnerCount[0].count)}`
  );

  // ---------------------------------------------------------------------------
  // 3. Discover every formal FK pointing to SubCounty.id
  // ---------------------------------------------------------------------------

  printSection("3. FORMAL FOREIGN KEY REFERENCES");

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

  console.log(`Formal FKs pointing to SubCounty.id: ${fkDefinitions.length}`);

  for (const fk of fkDefinitions) {
    console.log(
      `${fk.table_name}.${fk.column_name} -> ` +
        `${fk.referenced_table}.${fk.referenced_column} ` +
        `[ON DELETE ${fk.delete_action}]`
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Check actual row-level dependencies for every FK
  // ---------------------------------------------------------------------------

  printSection("4. ACTUAL ROW REFERENCES TO SUBCOUNTY 673");

  let totalReferences = 0;

  for (const fk of fkDefinitions) {
    const tableName = `"${fk.table_name.replace(/"/g, '""')}"`;
    const columnName = `"${fk.column_name.replace(/"/g, '""')}"`;

    const sql = `
      SELECT COUNT(*)::bigint AS count
      FROM ${tableName}
      WHERE ${columnName} = $1
    `;

    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      sql,
      TARGET_ID
    );

    const count = Number(result[0].count);

    totalReferences += count;

    console.log(
      `${fk.table_name}.${fk.column_name}: ${count} reference(s)`
    );
  }

  console.log(`\nTOTAL FORMAL FK REFERENCES: ${totalReferences}`);

  // ---------------------------------------------------------------------------
  // 5. Check every column named subCountyId
  // ---------------------------------------------------------------------------

  printSection("5. ALL COLUMNS NAMED subCountyId");

  const subCountyIdColumns = await prisma.$queryRaw<
    Array<{
      table_name: string;
      column_name: string;
    }>
  >`
    SELECT
      table_name,
      column_name
    FROM information_schema.columns
    WHERE column_name = 'subCountyId'
      AND table_schema = 'public'
    ORDER BY table_name
  `;

  console.log(
    `Tables containing a column named subCountyId: ${subCountyIdColumns.length}`
  );

  let namedColumnReferences = 0;

  for (const column of subCountyIdColumns) {
    const tableName = `"${column.table_name.replace(/"/g, '""')}"`;
    const columnName = `"${column.column_name.replace(/"/g, '""')}"`;

    const sql = `
      SELECT COUNT(*)::bigint AS count
      FROM ${tableName}
      WHERE ${columnName} = $1
    `;

    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      sql,
      TARGET_ID
    );

    const count = Number(result[0].count);

    namedColumnReferences += count;

    console.log(
      `${column.table_name}.${column.column_name}: ${count} reference(s)`
    );
  }

  console.log(
    `\nTOTAL references through columns named subCountyId: ${namedColumnReferences}`
  );

  // ---------------------------------------------------------------------------
  // 6. Normalized duplicate check within same county
  // ---------------------------------------------------------------------------

  printSection("6. NORMALIZED DUPLICATE CHECK");

  const targetNormalizedName = normalizeName(target[0].name);

  console.log(`Target name: ${target[0].name}`);
  console.log(`Normalized target name: ${targetNormalizedName}`);

  const countySubCounties = await prisma.$queryRaw<
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
    WHERE "countyId" = ${target[0].countyId}
    ORDER BY id
  `;

  const duplicates = countySubCounties.filter((record) => {
    return normalizeName(record.name) === targetNormalizedName;
  });

  console.log(
    `Records with same normalized name in County ${target[0].countyId}: ${duplicates.length}`
  );

  for (const duplicate of duplicates) {
    console.log(
      `ID ${duplicate.id} | ${duplicate.name} | normalized=${normalizeName(
        duplicate.name
      )}`
    );
  }

  const otherDuplicates = duplicates.filter(
    (record) => record.id !== TARGET_ID
  );

  if (otherDuplicates.length === 0) {
    console.log("✅ No normalized duplicate found.");
  } else {
    console.log("⚠️ Potential normalized duplicate(s) found.");
  }

  // ---------------------------------------------------------------------------
  // 7. User-defined triggers
  // ---------------------------------------------------------------------------

  printSection("7. USER-DEFINED TRIGGERS ON SubCounty");

  const triggers = await prisma.$queryRaw<
    Array<{
      trigger_name: string;
      trigger_definition: string;
    }>
  >`
    SELECT
      tg.tgname AS trigger_name,
      pg_get_triggerdef(tg.oid) AS trigger_definition
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

  console.log(`User-defined triggers: ${triggers.length}`);

  if (triggers.length === 0) {
    console.log("None.");
  } else {
    for (const trigger of triggers) {
      console.log(`Trigger: ${trigger.trigger_name}`);
      console.log(trigger.trigger_definition);
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Final classification
  // ---------------------------------------------------------------------------

  printSection("8. FINAL CLASSIFICATION");

  const knownRelationships =
    Number(wardCount[0].count) +
    Number(farmerCount[0].count) +
    Number(farmCount[0].count) +
    Number(businessPartnerCount[0].count);

  const completelyOrphaned =
    totalReferences === 0 &&
    knownRelationships === 0 &&
    otherDuplicates.length === 0;

  if (completelyOrphaned) {
    console.log("🟢 COMPLETELY ORPHANED");
    console.log(
      `SubCounty ${TARGET_ID} (${target[0].name}) has no actual dependencies.`
    );
    console.log("No normalized duplicate was found.");
    console.log("No database changes were made.");
    console.log(
      "It may be a legacy/empty record, but NO deletion has been performed."
    );
  } else {
    console.log("⚠️ REQUIRES REVIEW");

    if (totalReferences > 0) {
      console.log(
        `Formal FK references detected: ${totalReferences}`
      );
    }

    if (knownRelationships > 0) {
      console.log(
        `Known Prisma relationships detected: ${knownRelationships}`
      );
    }

    if (otherDuplicates.length > 0) {
      console.log(
        `Potential normalized duplicates detected: ${otherDuplicates.length}`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 9. Explicit read-only confirmation
  // ---------------------------------------------------------------------------

  printSection("9. READ-ONLY CONFIRMATION");

  console.log("✅ Audit completed.");
  console.log("✅ No INSERT performed.");
  console.log("✅ No UPDATE performed.");
  console.log("✅ No DELETE performed.");
  console.log("✅ No schema changes performed.");
}

main()
  .catch((error) => {
    console.error("\n❌ AUDIT FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });