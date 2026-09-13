import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

const TARGET_ID = 665;

async function main() {
  console.log("==============================================");
  console.log("READ-ONLY AUDIT: SUBCOUNTY 665");
  console.log("==============================================\n");

  const target = await prisma.subCounty.findUnique({
    where: { id: TARGET_ID },
    include: {
      county: true,
      _count: {
        select: {
          wards: true,
          farmers: true,
          farms: true,
          businessPartners: true,
        },
      },
    },
  });

  if (!target) {
    console.log(`SubCounty ${TARGET_ID} does not exist.`);
    return;
  }

  console.log("TARGET IDENTITY");
  console.log("----------------------------------------------");
  console.log(`ID:          ${target.id}`);
  console.log(`Name:        ${target.name}`);
  console.log(`County ID:   ${target.countyId}`);
  console.log(`County:      ${target.county.name}`);
  console.log(`Wards:       ${target._count.wards}`);
  console.log(`Farmers:     ${target._count.farmers}`);
  console.log(`Farms:       ${target._count.farms}`);
  console.log(`Businesses:  ${target._count.businessPartners}`);
  console.log("");

  console.log("FORMAL FOREIGN-KEY DEPENDENCY AUDIT");
  console.log("----------------------------------------------");

  const dependencies = await prisma.$queryRaw<
    Array<{
      table_name: string;
      column_name: string;
      constraint_name: string;
      delete_action: string;
      reference_count: bigint;
    }>
  >`
    SELECT
      child.relname::text AS table_name,
      child_col.attname::text AS column_name,
      con.conname::text AS constraint_name,
      CASE con.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE con.confdeltype::text
      END AS delete_action,
      (
        SELECT COUNT(*)
        FROM pg_catalog.pg_class child_table
        WHERE child_table.oid = con.conrelid
      )::bigint AS reference_count
    FROM pg_constraint con
    JOIN pg_class parent
      ON parent.oid = con.confrelid
    JOIN pg_class child
      ON child.oid = con.conrelid
    JOIN pg_attribute child_col
      ON child_col.attrelid = con.conrelid
     AND child_col.attnum = ANY(con.conkey)
    WHERE con.contype = 'f'
      AND parent.relname = 'SubCounty'
      AND child_col.attname = 'subCountyId'
    ORDER BY child.relname;
  `;

  /*
   * The catalog query above identifies the FK definitions.
   * Actual reference counts are checked explicitly below because
   * the catalog itself does not contain row-level reference counts.
   */

  const fkChecks = [
    {
      table: "BusinessPartner",
      column: "subCountyId",
      sql: prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "BusinessPartner"
        WHERE "subCountyId" = ${TARGET_ID}
      `,
    },
    {
      table: "CommodityTransaction",
      column: "destinationSubCountyId",
      sql: prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "CommodityTransaction"
        WHERE "destinationSubCountyId" = ${TARGET_ID}
      `,
    },
    {
      table: "CommodityTransaction",
      column: "sourceSubCountyId",
      sql: prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "CommodityTransaction"
        WHERE "sourceSubCountyId" = ${TARGET_ID}
      `,
    },
    {
      table: "Farm",
      column: "subCountyId",
      sql: prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "Farm"
        WHERE "subCountyId" = ${TARGET_ID}
      `,
    },
    {
      table: "Farmer",
      column: "subCountyId",
      sql: prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "Farmer"
        WHERE "subCountyId" = ${TARGET_ID}
      `,
    },
    {
      table: "Ward",
      column: "subCountyId",
      sql: prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "Ward"
        WHERE "subCountyId" = ${TARGET_ID}
      `,
    },
  ];

  for (const check of fkChecks) {
    const result = await check.sql;
    const count = Number(result[0]?.count ?? 0);

    console.log(
      `${check.table}.${check.column}: ${count} reference(s)`
    );
  }

  console.log("");

  console.log("FOREIGN-KEY DEFINITIONS");
  console.log("----------------------------------------------");

  const fkDefinitions = await prisma.$queryRaw<
    Array<{
      table_name: string;
      column_name: string;
      constraint_name: string;
      delete_action: string;
    }>
  >`
    SELECT
      child.relname::text AS table_name,
      child_col.attname::text AS column_name,
      con.conname::text AS constraint_name,
      CASE con.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE con.confdeltype::text
      END AS delete_action
    FROM pg_constraint con
    JOIN pg_class parent
      ON parent.oid = con.confrelid
    JOIN pg_class child
      ON child.oid = con.conrelid
    JOIN pg_attribute child_col
      ON child_col.attrelid = con.conrelid
     AND child_col.attnum = ANY(con.conkey)
    WHERE con.contype = 'f'
      AND parent.relname = 'SubCounty'
      AND child_col.attname IN (
        'subCountyId',
        'destinationSubCountyId',
        'sourceSubCountyId'
      )
    ORDER BY child.relname, child_col.attname;
  `;

  for (const fk of fkDefinitions) {
    console.log(
      `${fk.table_name}.${fk.column_name} | ` +
      `${fk.delete_action} | ${fk.constraint_name}`
    );
  }

  console.log("");

  console.log("NORMALIZED NAME CHECK");
  console.log("----------------------------------------------");

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’`]/g, "")
      .replace(/[^a-z0-9]/g, "");

  const targetNormalized = normalize(target.name);

  const sameCounty = await prisma.subCounty.findMany({
    where: {
      countyId: target.countyId,
      id: { not: TARGET_ID },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const normalizedMatches = sameCounty.filter(
    (item) => normalize(item.name) === targetNormalized
  );

  console.log(`Target normalized name: ${targetNormalized}`);

  if (normalizedMatches.length === 0) {
    console.log("Normalized duplicate in same county: NONE");
  } else {
    console.log("Normalized duplicate candidates:");
    for (const match of normalizedMatches) {
      console.log(`  ID ${match.id} | ${match.name}`);
    }
  }

  console.log("");

  console.log("USER-DEFINED TRIGGER CHECK");
  console.log("----------------------------------------------");

  const triggers = await prisma.$queryRaw<
    Array<{
      trigger_name: string;
      trigger_event: string;
      trigger_timing: string;
    }>
  >`
    SELECT
      tg.tgname::text AS trigger_name,
      pg_get_triggerdef(tg.oid)::text AS trigger_event,
      CASE
        WHEN (tg.tgtype & 2) <> 0 THEN 'BEFORE'
        WHEN (tg.tgtype & 64) <> 0 THEN 'INSTEAD OF'
        ELSE 'AFTER'
      END AS trigger_timing
    FROM pg_trigger tg
    JOIN pg_class c
      ON c.oid = tg.tgrelid
    WHERE c.relname = 'SubCounty'
      AND NOT tg.tgisinternal
    ORDER BY tg.tgname;
  `;

  if (triggers.length === 0) {
    console.log("User-defined triggers: NONE");
  } else {
    for (const trigger of triggers) {
      console.log(
        `${trigger.trigger_name} | ${trigger.trigger_timing}`
      );
      console.log(`  ${trigger.trigger_event}`);
    }
  }

  console.log("");

  const knownDependencies =
    target._count.wards +
    target._count.farmers +
    target._count.farms +
    target._count.businessPartners;

  const actualFkReferences = await Promise.all(
    fkChecks.map(async (check) => {
      const result = await check.sql;
      return Number(result[0]?.count ?? 0);
    })
  );

  const totalFkReferences = actualFkReferences.reduce(
    (sum, count) => sum + count,
    0
  );

  console.log("CLASSIFICATION");
  console.log("----------------------------------------------");

  if (
    knownDependencies === 0 &&
    totalFkReferences === 0 &&
    normalizedMatches.length === 0
  ) {
    console.log(
      "RESULT: SubCounty 665 is completely orphaned."
    );
    console.log(
      "It has no known relationships, no FK references, and no normalized duplicate."
    );
    console.log(
      "It may be a legacy/empty SubCounty record."
    );
    console.log(
      "NO DELETION WAS PERFORMED."
    );
  } else {
    console.log(
      "RESULT: SubCounty 665 has dependencies or requires further investigation."
    );
    console.log(
      "NO DELETION WAS PERFORMED."
    );
  }

  console.log("");
  console.log("==============================================");
  console.log("AUDIT COMPLETE — NO DATABASE CHANGES");
  console.log("==============================================");
}

main()
  .catch((error) => {
    console.error("\nAUDIT FAILED:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });