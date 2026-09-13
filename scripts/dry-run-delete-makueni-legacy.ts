import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const LEGACY_TARGETS = [
  { id: 1360, name: "Kathonzweni" },
  { id: 1361, name: "Kibwezi" },
  { id: 1362, name: "Kilungu" },
  { id: 1363, name: "Makindu" },
  { id: 1365, name: "Mbooni East" },
  { id: 1366, name: "Mbooni West" },
  { id: 1367, name: "Mukaa" },
  { id: 1368, name: "Nzaui" },
] as const;

const PROTECTED_OPERATIONAL_IDS = [
  358,
  359,
  360,
  362,
  401,
  1364,
] as const;

const EXPECTED_FK_PATHS = [
  "BusinessPartner.subCountyId",
  "CommodityTransaction.destinationSubCountyId",
  "CommodityTransaction.sourceSubCountyId",
  "Farm.subCountyId",
  "Farmer.subCountyId",
  "Ward.subCountyId",
] as const;

type ForeignKeyRow = {
  constraintName: string;
  tableName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  deleteRule: string;
  updateRule: string;
};

type TargetRow = {
  id: number;
  name: string;
  countyId: number;
};

type ReferenceCounts = {
  ward: bigint;
  farmer: bigint;
  farm: bigint;
  businessPartner: bigint;
  sourceTransaction: bigint;
  destinationTransaction: bigint;
};

function bigintToNumber(value: bigint): number {
  return Number(value);
}

async function main() {
  console.log("============================================================");
  console.log("MAKUENI LEGACY SUBCOUNTY DELETE DRY-RUN AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log();

  let failures = 0;

  // ----------------------------------------------------------
  // 1. Verify exact whitelist
  // ----------------------------------------------------------

  console.log("1. DELETE WHITELIST");
  console.log("------------------------------------------------------------");

  console.log(
    `Legacy IDs selected: ${LEGACY_TARGETS.map((target) => target.id).join(", ")}`
  );

  console.log(
    `Protected operational IDs: ${PROTECTED_OPERATIONAL_IDS.join(", ")}`
  );

  const duplicateWhitelistIds =
    new Set(LEGACY_TARGETS.map((target) => target.id)).size !==
    LEGACY_TARGETS.length;

  if (duplicateWhitelistIds) {
    console.log("FAIL | Duplicate IDs found in legacy whitelist");
    failures++;
  } else {
    console.log("PASS | Legacy whitelist contains exactly 8 unique IDs");
  }

  const protectedOverlap = LEGACY_TARGETS.filter((target) =>
    PROTECTED_OPERATIONAL_IDS.includes(
      target.id as (typeof PROTECTED_OPERATIONAL_IDS)[number]
    )
  );

  if (protectedOverlap.length > 0) {
    console.log(
      `FAIL | Protected operational IDs found in deletion whitelist: ${protectedOverlap
        .map((target) => target.id)
        .join(", ")}`
    );
    failures++;
  } else {
    console.log("PASS | No operational ID appears in deletion whitelist");
  }

  console.log();

  // ----------------------------------------------------------
  // 2. Verify actual database foreign keys
  // ----------------------------------------------------------

  console.log("2. ACTUAL FOREIGN KEYS REFERENCING SubCounty.id");
  console.log("------------------------------------------------------------");

  const foreignKeys = await prisma.$queryRaw<ForeignKeyRow[]>`
    SELECT
      con.conname AS "constraintName",
      child.relname AS "tableName",
      child_attr.attname AS "columnName",
      parent.relname AS "referencedTable",
      parent_attr.attname AS "referencedColumn",
      CASE con.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE con.confdeltype::text
      END AS "deleteRule",
      CASE con.confupdtype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE con.confupdtype::text
      END AS "updateRule"
    FROM pg_constraint con
    JOIN pg_class child
      ON child.oid = con.conrelid
    JOIN pg_namespace child_ns
      ON child_ns.oid = child.relnamespace
    JOIN pg_class parent
      ON parent.oid = con.confrelid
    JOIN pg_namespace parent_ns
      ON parent_ns.oid = parent.relnamespace
    JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS child_key(attnum, ord)
      ON TRUE
    JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS parent_key(attnum, ord)
      ON parent_key.ord = child_key.ord
    JOIN pg_attribute child_attr
      ON child_attr.attrelid = child.oid
     AND child_attr.attnum = child_key.attnum
    JOIN pg_attribute parent_attr
      ON parent_attr.attrelid = parent.oid
     AND parent_attr.attnum = parent_key.attnum
    WHERE con.contype = 'f'
      AND child_ns.nspname = 'public'
      AND parent_ns.nspname = 'public'
      AND parent.relname = 'SubCounty'
      AND parent_attr.attname = 'id'
    ORDER BY child.relname, child_attr.attname;
  `;

  console.log(`Actual FK count: ${foreignKeys.length}`);
  console.log();

  for (const fk of foreignKeys) {
    console.log(`CONSTRAINT: ${fk.constraintName}`);
    console.log(`PATH: ${fk.tableName}.${fk.columnName}`);
    console.log(`DELETE RULE: ${fk.deleteRule}`);
    console.log(`UPDATE RULE: ${fk.updateRule}`);
    console.log();
  }

  if (foreignKeys.length !== 6) {
    console.log(
      `FAIL | Expected exactly 6 SubCounty foreign keys, found ${foreignKeys.length}`
    );
    failures++;
  } else {
    console.log("PASS | Exactly 6 real foreign keys found");
  }

  const actualPaths = foreignKeys.map(
    (fk) => `${fk.tableName}.${fk.columnName}`
  );

  for (const expectedPath of EXPECTED_FK_PATHS) {
    if (!actualPaths.includes(expectedPath)) {
      console.log(`FAIL | Missing FK path: ${expectedPath}`);
      failures++;
    } else {
      console.log(`PASS | FK path found: ${expectedPath}`);
    }
  }

  console.log();

  // ----------------------------------------------------------
  // 3. Re-read the exact legacy target records
  // ----------------------------------------------------------

  console.log("3. LEGACY TARGET RECORDS");
  console.log("------------------------------------------------------------");

  const targetIds = LEGACY_TARGETS.map((target) => target.id);

  const targets = await prisma.subCounty.findMany({
    where: {
      id: {
        in: targetIds,
      },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(`Targets found: ${targets.length}/${LEGACY_TARGETS.length}`);
  console.log();

  if (targets.length !== LEGACY_TARGETS.length) {
    console.log("FAIL | Not all 8 legacy targets exist");
    failures++;
  } else {
    console.log("PASS | All 8 legacy targets exist");
  }

  for (const expected of LEGACY_TARGETS) {
    const actual = targets.find((target) => target.id === expected.id);

    if (!actual) {
      console.log(`FAIL | Missing target ID ${expected.id} (${expected.name})`);
      failures++;
      continue;
    }

    console.log(
      `ID ${actual.id} | ${actual.name} | County ${actual.countyId}`
    );

    if (actual.name.trim() !== expected.name) {
      console.log(
        `FAIL | Name mismatch for ID ${expected.id}: expected "${expected.name}", found "${actual.name}"`
      );
      failures++;
    }
  }

  console.log();

  // ----------------------------------------------------------
  // 4. Verify all targets belong to Makueni County
  // ----------------------------------------------------------

  console.log("4. COUNTY SAFETY CHECK");
  console.log("------------------------------------------------------------");

  const nonMakueniTargets = targets.filter(
    (target) => target.countyId !== 74
  );

  if (nonMakueniTargets.length > 0) {
    console.log(
      `FAIL | Targets outside Makueni County: ${nonMakueniTargets
        .map((target) => `${target.id}:${target.countyId}`)
        .join(", ")}`
    );
    failures++;
  } else {
    console.log("PASS | All 8 targets belong to Makueni County (74)");
  }

  console.log();

  // ----------------------------------------------------------
  // 5. Verify protected operational records
  // ----------------------------------------------------------

  console.log("5. PROTECTED OPERATIONAL SUBCOUNTIES");
  console.log("------------------------------------------------------------");

  const protectedRecords = await prisma.subCounty.findMany({
    where: {
      id: {
        in: [...PROTECTED_OPERATIONAL_IDS],
      },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `Protected operational records found: ${protectedRecords.length}/${PROTECTED_OPERATIONAL_IDS.length}`
  );

  for (const record of protectedRecords) {
    console.log(
      `PROTECTED | ID ${record.id} | ${record.name} | County ${record.countyId}`
    );
  }

  if (protectedRecords.length !== PROTECTED_OPERATIONAL_IDS.length) {
    console.log("FAIL | One or more protected operational records are missing");
    failures++;
  } else {
    console.log("PASS | All 6 operational SubCounty records exist");
  }

  console.log();

  // ----------------------------------------------------------
  // 6. Reference counts across all six real FK paths
  // ----------------------------------------------------------

  console.log("6. CURRENT REFERENCES TO LEGACY TARGETS");
  console.log("------------------------------------------------------------");

  const allCounts: Array<{
    id: number;
    name: string;
    counts: ReferenceCounts;
    total: number;
  }> = [];

  for (const target of targets) {
    const counts = await prisma.$queryRaw<ReferenceCounts[]>`
      SELECT
        (
          SELECT COUNT(*)
          FROM "Ward"
          WHERE "subCountyId" = ${target.id}
        ) AS "ward",

        (
          SELECT COUNT(*)
          FROM "Farmer"
          WHERE "subCountyId" = ${target.id}
        ) AS "farmer",

        (
          SELECT COUNT(*)
          FROM "Farm"
          WHERE "subCountyId" = ${target.id}
        ) AS "farm",

        (
          SELECT COUNT(*)
          FROM "BusinessPartner"
          WHERE "subCountyId" = ${target.id}
        ) AS "businessPartner",

        (
          SELECT COUNT(*)
          FROM "CommodityTransaction"
          WHERE "sourceSubCountyId" = ${target.id}
        ) AS "sourceTransaction",

        (
          SELECT COUNT(*)
          FROM "CommodityTransaction"
          WHERE "destinationSubCountyId" = ${target.id}
        ) AS "destinationTransaction";
    `;

    const row = counts[0];

    const numericCounts: ReferenceCounts = {
      ward: row.ward,
      farmer: row.farmer,
      farm: row.farm,
      businessPartner: row.businessPartner,
      sourceTransaction: row.sourceTransaction,
      destinationTransaction: row.destinationTransaction,
    };

    const total =
      bigintToNumber(numericCounts.ward) +
      bigintToNumber(numericCounts.farmer) +
      bigintToNumber(numericCounts.farm) +
      bigintToNumber(numericCounts.businessPartner) +
      bigintToNumber(numericCounts.sourceTransaction) +
      bigintToNumber(numericCounts.destinationTransaction);

    allCounts.push({
      id: target.id,
      name: target.name,
      counts: numericCounts,
      total,
    });

    console.log(
      `ID ${target.id} | ${target.name} | ` +
        `Ward=${numericCounts.ward} | ` +
        `Farmer=${numericCounts.farmer} | ` +
        `Farm=${numericCounts.farm} | ` +
        `BusinessPartner=${numericCounts.businessPartner} | ` +
        `SourceTransaction=${numericCounts.sourceTransaction} | ` +
        `DestinationTransaction=${numericCounts.destinationTransaction} | ` +
        `TOTAL=${total}`
    );
  }

  console.log();

  const referencedTargets = allCounts.filter((item) => item.total > 0);

  if (referencedTargets.length > 0) {
    console.log("FAIL | One or more legacy targets still have references");

    for (const target of referencedTargets) {
      console.log(
        `REFERENCED | ID ${target.id} | ${target.name} | TOTAL=${target.total}`
      );
    }

    failures++;
  } else {
    console.log("PASS | All 8 legacy targets have ZERO references");
  }

  console.log();

  // ----------------------------------------------------------
  // 7. Verify no Ward references any legacy target
  // ----------------------------------------------------------

  console.log("7. WARD SAFETY CHECK");
  console.log("------------------------------------------------------------");

  const legacyWardCount = await prisma.ward.count({
    where: {
      subCountyId: {
        in: targetIds,
      },
    },
  });

  console.log(
    `Ward records referencing legacy targets: ${legacyWardCount}`
  );

  if (legacyWardCount !== 0) {
    console.log("FAIL | Legacy targets still have Ward references");
    failures++;
  } else {
    console.log("PASS | No Ward references legacy targets");
  }

  console.log();

  // ----------------------------------------------------------
  // 8. Verify operational SubCounties still have their wards
  // ----------------------------------------------------------

  console.log("8. OPERATIONAL SUBCOUNTY PROTECTION CHECK");
  console.log("------------------------------------------------------------");

  const operationalWardCounts = await prisma.ward.groupBy({
    by: ["subCountyId"],
    where: {
      subCountyId: {
        in: [...PROTECTED_OPERATIONAL_IDS],
      },
    },
    _count: {
      _all: true,
    },
  });

  const operationalWardMap = new Map(
    operationalWardCounts.map((row) => [
      row.subCountyId,
      row._count._all,
    ])
  );

  for (const id of PROTECTED_OPERATIONAL_IDS) {
    const count = operationalWardMap.get(id) ?? 0;

    console.log(`PROTECTED ID ${id} | Ward count=${count}`);

    if (count === 0) {
      console.log(
        `WARNING | Protected operational ID ${id} currently has zero wards`
      );
    }
  }

  console.log();

  // ----------------------------------------------------------
  // 9. Explicit deletion candidate list
  // ----------------------------------------------------------

  console.log("9. WHAT WOULD BE DELETED");
  console.log("------------------------------------------------------------");

  for (const target of targets) {
    console.log(`WOULD DELETE | ID ${target.id} | ${target.name}`);
  }

  console.log();

  console.log("NOT INCLUDED:");
  console.log("PROTECTED | 358 | Mbooni Sub County");
  console.log("PROTECTED | 359 | Kilome Sub County");
  console.log("PROTECTED | 360 | Kaiti Sub County");
  console.log("PROTECTED | 362 | Kibwezi West Sub County");
  console.log("PROTECTED | 401 | Kibwezi East Sub County");
  console.log("PROTECTED | 1364 | Makueni");

  console.log();

  // ----------------------------------------------------------
  // 10. Final dry-run decision
  // ----------------------------------------------------------

  console.log("10. FINAL DRY-RUN DECISION");
  console.log("------------------------------------------------------------");

  if (failures === 0) {
    console.log("============================================================");
    console.log("DRY-RUN PASS");
    console.log("------------------------------------------------------------");
    console.log("Exactly 8 legacy SubCounty IDs are whitelisted.");
    console.log("All 8 legacy records exist.");
    console.log("All 8 belong to Makueni County (74).");
    console.log("Exactly 6 real FK paths reference SubCounty.id.");
    console.log("All 6 expected FK paths were verified.");
    console.log("All 8 legacy targets have ZERO references.");
    console.log("No legacy target has Ward references.");
    console.log("All 6 protected operational IDs remain outside the");
    console.log("deletion whitelist.");
    console.log();
    console.log("NO DELETE WAS EXECUTED.");
    console.log("============================================================");
  } else {
    console.log("============================================================");
    console.log("DRY-RUN FAILED");
    console.log("------------------------------------------------------------");
    console.log(`Failures detected: ${failures}`);
    console.log();
    console.log("NO DELETE WAS EXECUTED.");
    console.log("STOP. Resolve every failure before deletion.");
    console.log("============================================================");

    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });