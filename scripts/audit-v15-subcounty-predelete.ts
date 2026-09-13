import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

type V14Result = {
  oldSubCountyId: number;
  oldSubCountyName: string;
  targetSubCountyId: number;
  targetSubCountyName: string;
  countyId: number;
  countyName: string;
  oldWardCount: number;
  targetWardCount: number;
  farmersCount: number;
  farmsCount: number;
  businessPartnersCount: number;
};

type V14Log = {
  results: V14Result[];
};

type ForeignKeyColumn = {
  constraintName: string;
  sourceSchema: string;
  sourceTable: string;
  sourceColumn: string;
  targetSchema: string;
  targetTable: string;
  targetColumn: string;
};

type DependencyResult = ForeignKeyColumn & {
  matchingRows: number;
  status: "REFERENCED" | "CLEAR";
};

function quoteIdentifier(value: string): string {
  return '"' + value.replace(/"/g, '""') + '"';
}

function fail(message: string): never {
  console.error("");
  console.error("==============================================");
  console.error("V15 PRE-DELETE AUDIT FAILED");
  console.error("==============================================");
  console.error("");
  console.error(message);
  process.exit(1);
}

async function main() {
  console.log("");
  console.log("==============================================");
  console.log("V15 SUBCOUNTY PRE-DELETE DEPENDENCY AUDIT");
  console.log("==============================================");

  const v14Path = path.resolve(
    process.cwd(),
    "prisma/data/consolidation-migration-v14.json"
  );

  if (!fs.existsSync(v14Path)) {
    fail("V14 migration log not found: " + v14Path);
  }

  const v14 = JSON.parse(
    fs.readFileSync(v14Path, "utf8")
  ) as V14Log;

  if (!Array.isArray(v14.results)) {
    fail("V14 migration log does not contain a valid results array.");
  }

  console.log("");
  console.log(
    "V14 migration records loaded: " + v14.results.length
  );

  if (v14.results.length !== 122) {
    fail(
      "Expected exactly 122 V14 migration records, found " +
        v14.results.length +
        "."
    );
  }

  const oldIds = v14.results.map(function (r) {
    return r.oldSubCountyId;
  });

  const uniqueOldIds = Array.from(new Set(oldIds));

  console.log("Old SubCounty IDs: " + oldIds.length);
  console.log(
    "Unique old SubCounty IDs: " + uniqueOldIds.length
  );

  if (uniqueOldIds.length !== 122) {
    fail(
      "Expected 122 unique old SubCounty IDs, found " +
        uniqueOldIds.length +
        "."
    );
  }

  const invalidV14Records = v14.results.filter(function (result) {
    return (
      typeof result.oldSubCountyId !== "number" ||
      typeof result.targetSubCountyId !== "number" ||
      typeof result.countyId !== "number" ||
      typeof result.oldSubCountyName !== "string" ||
      typeof result.targetSubCountyName !== "string"
    );
  });

  if (invalidV14Records.length > 0) {
    fail(
      "One or more V14 migration records are missing required identity fields."
    );
  }

  console.log(
    "V14 migration record structure: PASS"
  );

  console.log("");
  console.log("==============================================================");
  console.log("STEP 1 — DATABASE SUBCOUNTY VERIFICATION");
  console.log("==============================================================");

  const oldSubcounties = await prisma.subCounty.findMany({
    where: {
      id: {
        in: uniqueOldIds,
      },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
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

  console.log(
    "Expected old records: " + uniqueOldIds.length
  );

  console.log(
    "Found old records: " + oldSubcounties.length
  );

  if (oldSubcounties.length !== 122) {
    fail(
      "Expected all 122 old SubCounty records to still exist. Found " +
        oldSubcounties.length +
        "."
    );
  }

  const missingOldIds = uniqueOldIds.filter(function (id) {
    return !oldSubcounties.some(function (row) {
      return row.id === id;
    });
  });

  if (missingOldIds.length > 0) {
    fail(
      "Missing old SubCounty IDs: " +
        missingOldIds.join(", ")
    );
  }

  const applicationDependencyProblems =
    oldSubcounties.filter(function (row) {
      return (
        row._count.wards > 0 ||
        row._count.farmers > 0 ||
        row._count.farms > 0 ||
        row._count.businessPartners > 0
      );
    });

  console.log(
    "Old records with Ward/Farmer/Farm/BusinessPartner dependencies: " +
      applicationDependencyProblems.length
  );

  if (applicationDependencyProblems.length > 0) {
    console.log("");
    console.log("DEPENDENCY DETAILS:");

    for (const row of applicationDependencyProblems) {
      console.log(
        "  ID " +
          row.id +
          " | " +
          row.name +
          " | wards=" +
          row._count.wards +
          " farmers=" +
          row._count.farmers +
          " farms=" +
          row._count.farms +
          " businessPartners=" +
          row._count.businessPartners
      );
    }

    fail(
      "One or more old SubCounty records still have application-level dependencies."
    );
  }

  console.log(
    "APPLICATION-LEVEL DEPENDENCY CHECK: PASS"
  );

  console.log("");
  console.log("==============================================================");
  console.log("STEP 2 — DATABASE FOREIGN-KEY DISCOVERY");
  console.log("==============================================================");

  const foreignKeys =
    await prisma.$queryRaw<ForeignKeyColumn[]>`
      SELECT
        con.conname AS "constraintName",
        src_ns.nspname AS "sourceSchema",
        src.relname AS "sourceTable",
        src_att.attname AS "sourceColumn",
        tgt_ns.nspname AS "targetSchema",
        tgt.relname AS "targetTable",
        tgt_att.attname AS "targetColumn"
      FROM pg_constraint con
      JOIN pg_class src
        ON src.oid = con.conrelid
      JOIN pg_namespace src_ns
        ON src_ns.oid = src.relnamespace
      JOIN pg_class tgt
        ON tgt.oid = con.confrelid
      JOIN pg_namespace tgt_ns
        ON tgt_ns.oid = tgt.relnamespace
      JOIN LATERAL unnest(con.conkey)
        WITH ORDINALITY AS src_cols(attnum, ord)
        ON TRUE
      JOIN LATERAL unnest(con.confkey)
        WITH ORDINALITY AS tgt_cols(attnum, ord)
        ON tgt_cols.ord = src_cols.ord
      JOIN pg_attribute src_att
        ON src_att.attrelid = src.oid
       AND src_att.attnum = src_cols.attnum
      JOIN pg_attribute tgt_att
        ON tgt_att.attrelid = tgt.oid
       AND tgt_att.attnum = tgt_cols.attnum
      WHERE con.contype = 'f'
        AND tgt.relname = 'SubCounty'
        AND tgt_ns.nspname = 'public'
      ORDER BY
        src_ns.nspname,
        src.relname,
        src_att.attname,
        con.conname
    `;

  console.log(
    "Foreign-key columns referencing public.SubCounty: " +
      foreignKeys.length
  );

  if (foreignKeys.length === 0) {
    fail(
      "No database foreign-key relationship referencing public.SubCounty was discovered. Schema investigation is required before deletion."
    );
  }

  console.log("");

  for (const fk of foreignKeys) {
    console.log(
      "  " +
        fk.sourceSchema +
        "." +
        fk.sourceTable +
        "." +
        fk.sourceColumn +
        " -> " +
        fk.targetSchema +
        "." +
        fk.targetTable +
        "." +
        fk.targetColumn +
        " [" +
        fk.constraintName +
        "]"
    );
  }

  console.log("");
  console.log("==============================================================");
  console.log("STEP 3 — FULL FOREIGN-KEY REFERENCE AUDIT");
  console.log("==============================================================");

  const dependencyResults: DependencyResult[] = [];

  for (const fk of foreignKeys) {
    const sourceTable =
      quoteIdentifier(fk.sourceSchema) +
      "." +
      quoteIdentifier(fk.sourceTable);

    const sourceColumn =
      quoteIdentifier(fk.sourceColumn);

    const targetColumn =
      quoteIdentifier(fk.targetColumn);

    const sql =
      "SELECT COUNT(*)::bigint AS \"count\" " +
      "FROM " +
      sourceTable +
      " AS src " +
      "WHERE src." +
      sourceColumn +
      " IN (" +
      "SELECT sc." +
      targetColumn +
      ' FROM "public"."SubCounty" AS sc ' +
      'WHERE sc."id" = ANY($1::int[])' +
      ")";

    const rows =
      await prisma.$queryRawUnsafe<{ count: bigint }>(
        sql,
        uniqueOldIds
      );

    const matchingRows = Number(
      rows[0]?.count ?? 0
    );

    const status =
      matchingRows > 0
        ? "REFERENCED"
        : "CLEAR";

    dependencyResults.push({
      ...fk,
      matchingRows,
      status,
    });

    console.log(
      "  " +
        fk.sourceTable +
        "." +
        fk.sourceColumn +
        ": " +
        matchingRows +
        " matching row(s)"
    );
  }

  const referenced =
    dependencyResults.filter(function (row) {
      return row.status === "REFERENCED";
    });

  const clear =
    dependencyResults.filter(function (row) {
      return row.status === "CLEAR";
    });

  console.log("");
  console.log("==============================================================");
  console.log("STEP 4 — FOREIGN-KEY DEPENDENCY SUMMARY");
  console.log("==============================================================");

  console.log(
    "Foreign-key relationships checked: " +
      dependencyResults.length
  );

  console.log(
    "Foreign-key relationships clear: " +
      clear.length
  );

  console.log(
    "Foreign-key relationships with references: " +
      referenced.length
  );

  if (referenced.length > 0) {
    console.log("");
    console.log("REFERENCES FOUND:");

    for (const row of referenced) {
      console.log(
        "  " +
          row.sourceSchema +
          "." +
          row.sourceTable +
          "." +
          row.sourceColumn +
          " -> " +
          row.matchingRows +
          " row(s)"
      );
    }
  }

  console.log("");
  console.log("==============================================================");
  console.log("STEP 5 — OLD RECORD EMPTY-STATE VERIFICATION");
  console.log("==============================================================");

  const remainingWardCount =
    await prisma.ward.count({
      where: {
        subCountyId: {
          in: uniqueOldIds,
        },
      },
    });

  const remainingFarmerCount =
    await prisma.farmer.count({
      where: {
        subCountyId: {
          in: uniqueOldIds,
        },
      },
    });

  const remainingFarmCount =
    await prisma.farm.count({
      where: {
        subCountyId: {
          in: uniqueOldIds,
        },
      },
    });

  const remainingBusinessPartnerCount =
    await prisma.businessPartner.count({
      where: {
        subCountyId: {
          in: uniqueOldIds,
        },
      },
    });

  console.log(
    "Wards attached to old IDs: " +
      remainingWardCount
  );

  console.log(
    "Farmers attached to old IDs: " +
      remainingFarmerCount
  );

  console.log(
    "Farms attached to old IDs: " +
      remainingFarmCount
  );

  console.log(
    "Business partners attached to old IDs: " +
      remainingBusinessPartnerCount
  );

  if (
    remainingWardCount !== 0 ||
    remainingFarmerCount !== 0 ||
    remainingFarmCount !== 0 ||
    remainingBusinessPartnerCount !== 0
  ) {
    fail(
      "One or more previously audited application dependencies are still present."
    );
  }

  console.log(
    "EXPLICIT APPLICATION DEPENDENCY CHECK: PASS"
  );

  console.log("");
  console.log("==============================================================");
  console.log("STEP 6 — V14 TARGET RECORD VERIFICATION");
  console.log("==============================================================");

  const targetIds = v14.results.map(function (r) {
    return r.targetSubCountyId;
  });

  const uniqueTargetIds =
    Array.from(new Set(targetIds));

  console.log(
    "V14 target records: " +
      uniqueTargetIds.length
  );

  if (uniqueTargetIds.length !== 122) {
    fail(
      "Expected 122 unique V14 target SubCounty IDs, found " +
        uniqueTargetIds.length +
        "."
    );
  }

  const targets = await prisma.subCounty.findMany({
    where: {
      id: {
        in: uniqueTargetIds,
      },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
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

  console.log(
    "Target records found: " +
      targets.length
  );

  if (targets.length !== 122) {
    fail(
      "Expected all 122 V14 target records to exist. Found " +
        targets.length +
        "."
    );
  }

  const targetProblems =
    targets.filter(function (row) {
      return (
        row._count.farmers > 0 ||
        row._count.farms > 0 ||
        row._count.businessPartners > 0
      );
    });

  console.log(
    "Target records with unexpected application dependencies: " +
      targetProblems.length
  );

  if (targetProblems.length > 0) {
    fail(
      "Unexpected application dependencies were found on V14 target records."
    );
  }

  console.log("TARGET RECORD CHECK: PASS");

  console.log("");
  console.log("==============================================================");
  console.log("STEP 7 — OLD/TARGET IDENTITY VERIFICATION");
  console.log("==============================================================");

  const identityProblems: string[] = [];

  for (const migration of v14.results) {
    const old =
      oldSubcounties.find(function (row) {
        return row.id === migration.oldSubCountyId;
      });

    const target =
      targets.find(function (row) {
        return row.id === migration.targetSubCountyId;
      });

    if (!old) {
      identityProblems.push(
        "Missing old ID " +
          migration.oldSubCountyId
      );
      continue;
    }

    if (!target) {
      identityProblems.push(
        "Missing target ID " +
          migration.targetSubCountyId
      );
      continue;
    }

    if (old.countyId !== migration.countyId) {
      identityProblems.push(
        "Old ID " +
          old.id +
          " county mismatch: DB=" +
          old.countyId +
          ", V14=" +
          migration.countyId
      );
    }

    if (target.countyId !== migration.countyId) {
      identityProblems.push(
        "Target ID " +
          target.id +
          " county mismatch: DB=" +
          target.countyId +
          ", V14=" +
          migration.countyId
      );
    }
  }

  console.log(
    "Identity problems: " +
      identityProblems.length
  );

  if (identityProblems.length > 0) {
    console.log("");

    for (const problem of identityProblems) {
      console.log("  " + problem);
    }

    fail(
      "One or more old/target SubCounty identity checks failed."
    );
  }

  console.log("IDENTITY VERIFICATION: PASS");

  console.log("");
  console.log("==============================================================");
  console.log("STEP 8 — V15 FINAL SAFETY GATE");
  console.log("==============================================================");

  const allForeignKeysClear =
    referenced.length === 0;

  const allApplicationDependenciesClear =
    remainingWardCount === 0 &&
    remainingFarmerCount === 0 &&
    remainingFarmCount === 0 &&
    remainingBusinessPartnerCount === 0;

  const allOldRecordsExist =
    oldSubcounties.length === 122;

  const allTargetsExist =
    targets.length === 122;

  const allIdentitiesValid =
    identityProblems.length === 0;

  const safeToDelete =
    allForeignKeysClear &&
    allApplicationDependenciesClear &&
    allOldRecordsExist &&
    allTargetsExist &&
    allIdentitiesValid;

  console.log(
    "Old records verified: " +
      allOldRecordsExist
  );

  console.log(
    "Target records verified: " +
      allTargetsExist
  );

  console.log(
    "All database foreign-key references clear: " +
      allForeignKeysClear
  );

  console.log(
    "All known application dependencies clear: " +
      allApplicationDependenciesClear
  );

  console.log(
    "All identities valid: " +
      allIdentitiesValid
  );

  console.log("");

  if (safeToDelete) {
    console.log("==============================================");
    console.log("V15 PRE-DELETE AUDIT: PASS");
    console.log("==============================================");
    console.log("");
    console.log("SAFE_TO_DELETE: 122");
    console.log("REFERENCED: 0");
    console.log("UNKNOWN_REFERENCES: 0");
    console.log("");
    console.log(
      "The 122 old SubCounty records have no database foreign-key references."
    );
    console.log(
      "No database changes were made by this audit."
    );
    console.log(
      "Controlled V15 deletion may now be considered separately."
    );
  } else {
    console.log("==============================================");
    console.log("V15 PRE-DELETE AUDIT: FAILED");
    console.log("==============================================");
    console.log("");
    console.log(
      "The old SubCounty records must NOT be deleted."
    );
    console.log(
      "Resolve the dependency findings before any deletion."
    );

    process.exitCode = 1;
  }

  const output = {
    generatedAt: new Date().toISOString(),
    mode: "READ_ONLY_PRE_DELETE_AUDIT",
    v14MigrationCount: v14.results.length,
    oldSubCountyIds: uniqueOldIds,
    targetSubCountyIds: uniqueTargetIds,
    foreignKeysChecked: dependencyResults,
    applicationDependencies: {
      wards: remainingWardCount,
      farmers: remainingFarmerCount,
      farms: remainingFarmCount,
      businessPartners: remainingBusinessPartnerCount,
    },
    verification: {
      oldRecordsFound: oldSubcounties.length,
      targetRecordsFound: targets.length,
      identityProblems: identityProblems.length,
      allForeignKeysClear,
      allApplicationDependenciesClear,
      allOldRecordsExist,
      allTargetsExist,
      allIdentitiesValid,
    },
    result: {
      safeToDelete,
      safeCount: safeToDelete ? 122 : 0,
      referencedCount: referenced.length,
      unknownReferences: 0,
    },
  };

  const jsonPath = path.resolve(
    process.cwd(),
    "prisma/data/pre-delete-audit-v15.json"
  );

  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      output,
      function (_key, value) {
        if (typeof value === "bigint") {
          return Number(value);
        }

        return value;
      },
      2
    ),
    "utf8"
  );

  console.log("");
  console.log("JSON: " + jsonPath);

  await prisma.$disconnect();
}

main().catch(async function (error) {
  console.error("");
  console.error("V15 AUDIT ERROR");
  console.error(error);

  await prisma.$disconnect();

  process.exit(1);
});