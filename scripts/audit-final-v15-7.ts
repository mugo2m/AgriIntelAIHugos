import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const DATA_DIR = path.join(process.cwd(), "prisma", "data");

const GEOJSON_PATH = path.join(
  DATA_DIR,
  "kenya-wards-1450.geojson",
);

const JSON_OUTPUT = path.join(
  DATA_DIR,
  "final-database-integrity-audit-v15-7.json",
);

const CSV_OUTPUT = path.join(
  DATA_DIR,
  "final-database-integrity-audit-v15-7.csv",
);

const EXPECTED_COUNTS = {
  counties: 47,
  subCounties: 414,
  wards: 1450,
};

const REPAIRED_PAIRS = [
  {
    countyName: "Nyeri",
    countyId: 69,
    oldId: 376,
    oldName: "Mukurweini Sub County",
    targetId: 1382,
    targetName: "Mukurwe-ini",
    expectedGids: [487, 488, 489, 490],
    expectedAuthoritativeSubCounty: "Mukurwe-ini",
  },
  {
    countyName: "Narok",
    countyId: 80,
    oldId: 411,
    oldName: "Transmara West Sub County",
    targetId: 1475,
    targetName: "Trans Mara West",
    expectedGids: [2158, 2159, 2160, 2161, 2162, 2163],
    expectedAuthoritativeSubCounty: "Trans Mara West",
  },
  {
    countyName: "Narok",
    countyId: 80,
    oldId: 515,
    oldName: "Transmara East Sub County",
    targetId: 1474,
    targetName: "Trans Mara East",
    expectedGids: [2164, 2165, 2166, 2167],
    expectedAuthoritativeSubCounty: "Trans Mara East",
  },
];

const DELETED_IDS = [376, 411, 515];

function normalizeCounty(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeSubCounty(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/\bsub[\s-]*county\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function writeCsv(
  rows: Array<Record<string, unknown>>,
  outputPath: string,
) {
  if (rows.length === 0) {
    fs.writeFileSync(outputPath, "", "utf8");
    return;
  }

  const headers = Object.keys(rows[0]);

  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) =>
      headers.map((header) => csvEscape(row[header])).join(","),
    ),
  ];

  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
}

async function main() {
  console.log("");
  console.log("FINAL DATABASE INTEGRITY AUDIT V15.7");
  console.log("INDEPENDENT POST-CONSOLIDATION AUDIT");
  console.log("MODE: READ-ONLY");
  console.log("NO INSERT / UPDATE / DELETE");
  console.log("");

  const errors: Array<Record<string, unknown>> = [];
  const warnings: Array<Record<string, unknown>> = [];

  /*
   * ------------------------------------------------------------
   * [1/12] Load authoritative GeoJSON
   * ------------------------------------------------------------
   */

  console.log("[1/12] Loading authoritative ward GeoJSON...");

  assert(
    fs.existsSync(GEOJSON_PATH),
    `Authoritative GeoJSON not found: ${GEOJSON_PATH}`,
  );

  const geojson = JSON.parse(
    fs.readFileSync(GEOJSON_PATH, "utf8"),
  );

  assert(
    Array.isArray(geojson.features),
    "GeoJSON does not contain a features array.",
  );

  const authoritativeRows = geojson.features.map(
    (feature: any) => {
      const properties = feature.properties ?? {};

      const gid = Number(properties.gid);

      return {
        gid,
        county: String(properties.county ?? ""),
        subcounty: String(properties.subcounty ?? ""),
        ward: String(properties.ward ?? ""),
      };
    },
  );

  const numericGids = authoritativeRows.filter(
    (row) => Number.isInteger(row.gid),
  );

  const authoritativeGidSet = new Set(
    numericGids.map((row) => row.gid),
  );

  console.log(
    `  GeoJSON features: ${authoritativeRows.length}`,
  );

  console.log(
    `  Numeric GIDs: ${numericGids.length}`,
  );

  console.log(
    `  Unique GIDs: ${authoritativeGidSet.size}`,
  );

  if (authoritativeRows.length !== EXPECTED_COUNTS.wards) {
    errors.push({
      type: "AUTHORITATIVE_WARD_COUNT",
      expected: EXPECTED_COUNTS.wards,
      actual: authoritativeRows.length,
    });
  }

  if (numericGids.length !== EXPECTED_COUNTS.wards) {
    errors.push({
      type: "AUTHORITATIVE_NUMERIC_GID_COUNT",
      expected: EXPECTED_COUNTS.wards,
      actual: numericGids.length,
    });
  }

  if (authoritativeGidSet.size !== EXPECTED_COUNTS.wards) {
    errors.push({
      type: "AUTHORITATIVE_UNIQUE_GID_COUNT",
      expected: EXPECTED_COUNTS.wards,
      actual: authoritativeGidSet.size,
    });
  }

  /*
   * ------------------------------------------------------------
   * [2/12] Load database baseline
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("[2/12] Loading database baseline...");

  const counties = await prisma.county.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const subCounties = await prisma.subCounty.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  const wards = await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      sourceGid: true,
      countyId: true,
      subCountyId: true,
    },
  });

  const farmers = await prisma.farmer.findMany({
    select: {
      id: true,
      subCountyId: true,
    },
  });

  const farms = await prisma.farm.findMany({
    select: {
      id: true,
      subCountyId: true,
    },
  });

  const businessPartners = await prisma.businessPartner.findMany({
    select: {
      id: true,
      subCountyId: true,
    },
  });

  const commodityTransactions =
    await prisma.commodityTransaction.findMany({
      select: {
        id: true,
        sourceSubCountyId: true,
        destinationSubCountyId: true,
      },
    });

  console.log(`  Counties: ${counties.length}`);
  console.log(`  SubCounties: ${subCounties.length}`);
  console.log(`  Wards: ${wards.length}`);
  console.log(`  Farmers: ${farmers.length}`);
  console.log(`  Farms: ${farms.length}`);
  console.log(
    `  BusinessPartners: ${businessPartners.length}`,
  );
  console.log(
    `  CommodityTransactions: ${commodityTransactions.length}`,
  );

  if (counties.length !== EXPECTED_COUNTS.counties) {
    errors.push({
      type: "COUNTY_COUNT",
      expected: EXPECTED_COUNTS.counties,
      actual: counties.length,
    });
  }

  if (subCounties.length !== EXPECTED_COUNTS.subCounties) {
    errors.push({
      type: "SUBCOUNTY_COUNT",
      expected: EXPECTED_COUNTS.subCounties,
      actual: subCounties.length,
    });
  }

  if (wards.length !== EXPECTED_COUNTS.wards) {
    errors.push({
      type: "WARD_COUNT",
      expected: EXPECTED_COUNTS.wards,
      actual: wards.length,
    });
  }

  /*
   * ------------------------------------------------------------
   * [3/12] Build indexes
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("[3/12] Building database indexes...");

  const countyById = new Map(
    counties.map((county) => [county.id, county]),
  );

  const subCountyById = new Map(
    subCounties.map((subCounty) => [
      subCounty.id,
      subCounty,
    ]),
  );

  const wardBySourceGid = new Map<
    number,
    (typeof wards)[number]
  >();

  const duplicateDatabaseGids: number[] = [];

  for (const ward of wards) {
    if (ward.sourceGid === null) {
      continue;
    }

    if (wardBySourceGid.has(ward.sourceGid)) {
      duplicateDatabaseGids.push(ward.sourceGid);
    } else {
      wardBySourceGid.set(ward.sourceGid, ward);
    }
  }

  console.log(
    `  Database sourceGIDs: ${wardBySourceGid.size}`,
  );

  console.log(
    `  Duplicate database sourceGIDs: ${duplicateDatabaseGids.length}`,
  );

  if (duplicateDatabaseGids.length > 0) {
    errors.push({
      type: "DUPLICATE_DATABASE_SOURCE_GID",
      gids: duplicateDatabaseGids,
    });
  }

  const authoritativeByGid = new Map(
    authoritativeRows.map((row) => [row.gid, row]),
  );

  /*
   * ------------------------------------------------------------
   * [4/12] Verify sourceGID structural integrity
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("[4/12] Checking sourceGID structural integrity...");

  const nullSourceGids = wards.filter(
    (ward) => ward.sourceGid === null,
  ).length;

  const missingAuthoritativeGids =
    numericGids
      .map((row) => row.gid)
      .filter((gid) => !wardBySourceGid.has(gid));

  const unexpectedDatabaseGids =
    wards
      .filter(
        (ward) =>
          ward.sourceGid !== null &&
          !authoritativeGidSet.has(ward.sourceGid),
      )
      .map((ward) => ward.sourceGid);

  console.log(`  NULL database sourceGIDs: ${nullSourceGids}`);
  console.log(
    `  Missing authoritative GIDs: ${missingAuthoritativeGids.length}`,
  );
  console.log(
    `  Unexpected database GIDs: ${unexpectedDatabaseGids.length}`,
  );

  if (nullSourceGids > 0) {
    errors.push({
      type: "NULL_SOURCE_GIDS",
      count: nullSourceGids,
    });
  }

  if (missingAuthoritativeGids.length > 0) {
    errors.push({
      type: "MISSING_AUTHORITATIVE_GIDS",
      count: missingAuthoritativeGids.length,
      gids: missingAuthoritativeGids,
    });
  }

  if (unexpectedDatabaseGids.length > 0) {
    errors.push({
      type: "UNEXPECTED_DATABASE_GIDS",
      count: unexpectedDatabaseGids.length,
      gids: unexpectedDatabaseGids,
    });
  }

  /*
   * ------------------------------------------------------------
   * [5/12] Verify Ward relational integrity
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("[5/12] Checking Ward relational integrity...");

  let nullSubCountyCount = 0;
  let missingSubCountyCount = 0;
  let missingCountyCount = 0;
  let countySubCountyMismatchCount = 0;

  for (const ward of wards) {
    if (ward.subCountyId === null) {
      nullSubCountyCount++;
      continue;
    }

    const subCounty = subCountyById.get(ward.subCountyId);

    if (!subCounty) {
      missingSubCountyCount++;
      continue;
    }

    if (!countyById.has(ward.countyId)) {
      missingCountyCount++;
    }

    if (ward.countyId !== subCounty.countyId) {
      countySubCountyMismatchCount++;
    }
  }

  console.log(
    `  NULL subCountyId: ${nullSubCountyCount}`,
  );

  console.log(
    `  Missing SubCounty FK: ${missingSubCountyCount}`,
  );

  console.log(
    `  Missing County FK: ${missingCountyCount}`,
  );

  console.log(
    `  County/SubCounty mismatches: ${countySubCountyMismatchCount}`,
  );

  if (nullSubCountyCount > 0) {
    errors.push({
      type: "NULL_WARD_SUBCOUNTY",
      count: nullSubCountyCount,
    });
  }

  if (missingSubCountyCount > 0) {
    errors.push({
      type: "MISSING_WARD_SUBCOUNTY_FK",
      count: missingSubCountyCount,
    });
  }

  if (missingCountyCount > 0) {
    errors.push({
      type: "MISSING_WARD_COUNTY_FK",
      count: missingCountyCount,
    });
  }

  if (countySubCountyMismatchCount > 0) {
    errors.push({
      type: "WARD_COUNTY_SUBCOUNTY_MISMATCH",
      count: countySubCountyMismatchCount,
    });
  }

  /*
   * ------------------------------------------------------------
   * [6/12] Verify deleted IDs
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("[6/12] Checking deleted SubCounty IDs...");

  const deletedRecords = subCounties.filter((subCounty) =>
    DELETED_IDS.includes(subCounty.id),
  );

  console.log(
    `  Deleted IDs expected absent: ${DELETED_IDS.join(", ")}`,
  );

  console.log(
    `  Deleted IDs still present: ${deletedRecords.length}`,
  );

  if (deletedRecords.length > 0) {
    errors.push({
      type: "DELETED_SUBCOUNTY_STILL_PRESENT",
      ids: deletedRecords.map((record) => record.id),
    });
  }

  /*
   * ------------------------------------------------------------
   * [7/12] Verify canonical target IDs
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("[7/12] Checking canonical target SubCounty IDs...");

  const targetResults: Array<Record<string, unknown>> = [];

  for (const pair of REPAIRED_PAIRS) {
    const target = subCountyById.get(pair.targetId);

    console.log("");
    console.log(
      `  ${pair.countyName} / ${pair.targetName}`,
    );

    if (!target) {
      console.log(
        `    Target ${pair.targetId}: MISSING`,
      );

      errors.push({
        type: "CANONICAL_TARGET_MISSING",
        targetId: pair.targetId,
        targetName: pair.targetName,
      });

      continue;
    }

    console.log(
      `    Target: ${target.id} | ${target.name} | countyId=${target.countyId}`,
    );

    if (target.countyId !== pair.countyId) {
      errors.push({
        type: "TARGET_COUNTY_MISMATCH",
        targetId: pair.targetId,
        expectedCountyId: pair.countyId,
        actualCountyId: target.countyId,
      });
    }

    const targetWards = wards.filter(
      (ward) => ward.subCountyId === pair.targetId,
    );

    const actualGids = targetWards
      .map((ward) => ward.sourceGid)
      .filter(
        (gid): gid is number => gid !== null,
      )
      .sort((a, b) => a - b);

    const expectedGids = [...pair.expectedGids].sort(
      (a, b) => a - b,
    );

    const gidsMatch =
      actualGids.length === expectedGids.length &&
      actualGids.every(
        (gid, index) => gid === expectedGids[index],
      );

    console.log(
      `    Target ward count: ${targetWards.length}`,
    );

    console.log(
      `    Expected ward count: ${expectedGids.length}`,
    );

    console.log(
      `    Expected GIDs: ${expectedGids.join(", ")}`,
    );

    console.log(
      `    Actual GIDs: ${actualGids.join(", ") || "NONE"}`,
    );

    console.log(
      `    Ward ownership: ${gidsMatch ? "PASS" : "FAIL"}`,
    );

    if (!gidsMatch) {
      errors.push({
        type: "TARGET_WARD_SET_MISMATCH",
        targetId: pair.targetId,
        expectedGids,
        actualGids,
      });
    }

    targetResults.push({
      countyName: pair.countyName,
      countyId: pair.countyId,
      targetId: pair.targetId,
      targetName: target.name,
      targetWardCount: targetWards.length,
      expectedWardCount: expectedGids.length,
      expectedGids: expectedGids.join("|"),
      actualGids: actualGids.join("|"),
      ownershipStatus: gidsMatch ? "PASS" : "FAIL",
    });
  }

  /*
   * ------------------------------------------------------------
   * [8/12] Verify authoritative correspondence for 14 wards
   * ------------------------------------------------------------
   */

  console.log("");
  console.log(
    "[8/12] Verifying authoritative GeoJSON correspondence for repaired wards...",
  );

  const repairedGids = REPAIRED_PAIRS.flatMap(
    (pair) => pair.expectedGids,
  );

  const repairedGidSet = new Set(repairedGids);

  const repairedWardResults: Array<Record<string, unknown>> = [];

  for (const pair of REPAIRED_PAIRS) {
    const target = subCountyById.get(pair.targetId);

    if (!target) {
      continue;
    }

    const targetCounty = countyById.get(target.countyId);

    for (const gid of pair.expectedGids) {
      const authoritative = authoritativeByGid.get(gid);
      const ward = wardBySourceGid.get(gid);

      let status = "PASS";
      const problems: string[] = [];

      if (!authoritative) {
        problems.push("AUTHORITATIVE_GID_MISSING");
      }

      if (!ward) {
        problems.push("DATABASE_WARD_MISSING");
      }

      if (ward && ward.subCountyId !== pair.targetId) {
        problems.push("WRONG_TARGET_SUBCOUNTY");
      }

      if (ward && ward.countyId !== pair.countyId) {
        problems.push("WRONG_COUNTY_ID");
      }

      if (authoritative) {
        if (
          normalizeCounty(authoritative.county) !==
          normalizeCounty(pair.countyName)
        ) {
          problems.push("AUTHORITATIVE_COUNTY_MISMATCH");
        }

        if (
          normalizeSubCounty(
            authoritative.subcounty,
          ) !==
          normalizeSubCounty(
            pair.expectedAuthoritativeSubCounty,
          )
        ) {
          problems.push(
            "AUTHORITATIVE_SUBCOUNTY_NAME_MISMATCH",
          );
        }
      }

      if (ward && targetCounty && authoritative) {
        const dbCountyName = targetCounty.name;

        if (
          normalizeCounty(dbCountyName) !==
          normalizeCounty(authoritative.county)
        ) {
          problems.push(
            "DATABASE_COUNTY_VS_AUTHORITATIVE_MISMATCH",
          );
        }
      }

      if (problems.length > 0) {
        status = "FAIL";

        errors.push({
          type: "REPAIRED_WARD_AUTHORITATIVE_CORRESPONDENCE",
          gid,
          problems,
        });
      }

      repairedWardResults.push({
        gid,
        authoritativeCounty:
          authoritative?.county ?? "",
        authoritativeSubCounty:
          authoritative?.subcounty ?? "",
        authoritativeWard:
          authoritative?.ward ?? "",
        databaseWardId:
          ward?.id ?? "",
        databaseSubCountyId:
          ward?.subCountyId ?? "",
        databaseCountyId:
          ward?.countyId ?? "",
        expectedTargetId: pair.targetId,
        status,
      });
    }
  }

  console.log(
    `  Repaired authoritative GIDs checked: ${repairedGids.length}`,
  );

  const repairedPassCount = repairedWardResults.filter(
    (row) => row.status === "PASS",
  ).length;

  console.log(
    `  Authoritative correspondence PASS: ${repairedPassCount}/${repairedGids.length}`,
  );

  /*
   * ------------------------------------------------------------
   * [9/12] Check all application foreign keys
   * ------------------------------------------------------------
   */

  console.log("");
  console.log(
    "[9/12] Checking application foreign keys for deleted IDs...",
  );

  const deletedWardRefs = wards.filter(
    (ward) =>
      ward.subCountyId !== null &&
      DELETED_IDS.includes(ward.subCountyId),
  ).length;

  const deletedFarmerRefs = farmers.filter(
    (farmer) =>
      farmer.subCountyId !== null &&
      DELETED_IDS.includes(farmer.subCountyId),
  ).length;

  const deletedFarmRefs = farms.filter(
    (farm) =>
      farm.subCountyId !== null &&
      DELETED_IDS.includes(farm.subCountyId),
  ).length;

  const deletedBusinessPartnerRefs =
    businessPartners.filter(
      (partner) =>
        partner.subCountyId !== null &&
        DELETED_IDS.includes(partner.subCountyId),
    ).length;

  const deletedCommoditySourceRefs =
    commodityTransactions.filter(
      (transaction) =>
        transaction.sourceSubCountyId !== null &&
        DELETED_IDS.includes(
          transaction.sourceSubCountyId,
        ),
    ).length;

  const deletedCommodityDestinationRefs =
    commodityTransactions.filter(
      (transaction) =>
        transaction.destinationSubCountyId !== null &&
        DELETED_IDS.includes(
          transaction.destinationSubCountyId,
        ),
    ).length;

  console.log(
    `  Ward refs: ${deletedWardRefs}`,
  );

  console.log(
    `  Farmer refs: ${deletedFarmerRefs}`,
  );

  console.log(
    `  Farm refs: ${deletedFarmRefs}`,
  );

  console.log(
    `  BusinessPartner refs: ${deletedBusinessPartnerRefs}`,
  );

  console.log(
    `  Commodity source refs: ${deletedCommoditySourceRefs}`,
  );

  console.log(
    `  Commodity destination refs: ${deletedCommodityDestinationRefs}`,
  );

  const deletedReferenceChecks = [
    ["Ward", deletedWardRefs],
    ["Farmer", deletedFarmerRefs],
    ["Farm", deletedFarmRefs],
    ["BusinessPartner", deletedBusinessPartnerRefs],
    ["Commodity source", deletedCommoditySourceRefs],
    [
      "Commodity destination",
      deletedCommodityDestinationRefs,
    ],
  ];

  for (const [type, count] of deletedReferenceChecks) {
    if (count !== 0) {
      errors.push({
        type: "DELETED_ID_FOREIGN_KEY_REFERENCE",
        referenceType: type,
        count,
      });
    }
  }

  /*
   * ------------------------------------------------------------
   * [10/12] Duplicate normalized identity audit
   * ------------------------------------------------------------
   */

  console.log("");
  console.log(
    "[10/12] Checking normalized SubCounty identities...",
  );

  const identityMap = new Map<
    string,
    Array<{
      id: number;
      name: string;
      countyId: number;
    }>
  >();

  for (const subCounty of subCounties) {
    const county = countyById.get(subCounty.countyId);

    if (!county) {
      continue;
    }

    const key =
      `${normalizeCounty(county.name)}|${normalizeSubCounty(subCounty.name)}`;

    const existing = identityMap.get(key) ?? [];

    existing.push({
      id: subCounty.id,
      name: subCounty.name,
      countyId: subCounty.countyId,
    });

    identityMap.set(key, existing);
  }

  const duplicateIdentities = Array.from(
    identityMap.entries(),
  )
    .filter(([, records]) => records.length > 1)
    .map(([key, records]) => ({
      key,
      records,
    }));

  console.log(
    `  Global duplicate normalized identities: ${duplicateIdentities.length}`,
  );

  for (const duplicate of duplicateIdentities) {
    console.log(
      `    ${duplicate.key}: ${duplicate.records
        .map((record) => `${record.id} (${record.name})`)
        .join(" | ")}`,
    );
  }

  const repairedTargetIds = REPAIRED_PAIRS.map(
    (pair) => pair.targetId,
  );

  const repairedOldIds = REPAIRED_PAIRS.map(
    (pair) => pair.oldId,
  );

  for (const pair of REPAIRED_PAIRS) {
    const county = countyById.get(pair.countyId);

    if (!county) {
      continue;
    }

    const key =
      `${normalizeCounty(county.name)}|${normalizeSubCounty(pair.targetName)}`;

    const records = identityMap.get(key) ?? [];

    const unexpectedRecords = records.filter(
      (record) =>
        record.id !== pair.targetId &&
        !repairedOldIds.includes(record.id),
    );

    if (unexpectedRecords.length > 0) {
      errors.push({
        type: "REPAIRED_GROUP_STILL_DUPLICATED",
        countyName: pair.countyName,
        normalizedIdentity: key,
        targetId: pair.targetId,
        records,
      });
    }
  }

  /*
   * ------------------------------------------------------------
   * [11/12] Independent final invariants
   * ------------------------------------------------------------
   */

  console.log("");
  console.log(
    "[11/12] Validating independent final invariants...",
  );

  const uniqueSourceGidCount =
    new Set(
      wards
        .map((ward) => ward.sourceGid)
        .filter(
          (gid): gid is number => gid !== null,
        ),
    ).size;

  const expectedRepairedGidCount =
    repairedGidSet.size;

  const databaseRepairedGids =
    wards
      .filter(
        (ward) =>
          ward.sourceGid !== null &&
          repairedGidSet.has(ward.sourceGid),
      )
      .map((ward) => ward.sourceGid);

  const databaseRepairedGidSet =
    new Set(databaseRepairedGids);

  console.log(
    `  Counties: ${counties.length}/${EXPECTED_COUNTS.counties}`,
  );

  console.log(
    `  SubCounties: ${subCounties.length}/${EXPECTED_COUNTS.subCounties}`,
  );

  console.log(
    `  Wards: ${wards.length}/${EXPECTED_COUNTS.wards}`,
  );

  console.log(
    `  Unique sourceGIDs: ${uniqueSourceGidCount}/${EXPECTED_COUNTS.wards}`,
  );

  console.log(
    `  Repaired authoritative GIDs: ${databaseRepairedGidSet.size}/${expectedRepairedGidCount}`,
  );

  if (uniqueSourceGidCount !== EXPECTED_COUNTS.wards) {
    errors.push({
      type: "GLOBAL_UNIQUE_SOURCE_GID_COUNT",
      expected: EXPECTED_COUNTS.wards,
      actual: uniqueSourceGidCount,
    });
  }

  if (
    databaseRepairedGidSet.size !==
    expectedRepairedGidCount
  ) {
    errors.push({
      type: "REPAIRED_GID_GLOBAL_PRESENCE",
      expected: expectedRepairedGidCount,
      actual: databaseRepairedGidSet.size,
    });
  }

  /*
   * Check that each deleted ID is genuinely absent from the
   * SubCounty table.
   */

  for (const deletedId of DELETED_IDS) {
    if (subCountyById.has(deletedId)) {
      errors.push({
        type: "DELETED_ID_PRESENT",
        deletedId,
      });
    }
  }

  /*
   * Check canonical targets still exist.
   */

  for (const targetId of repairedTargetIds) {
    if (!subCountyById.has(targetId)) {
      errors.push({
        type: "TARGET_ID_MISSING",
        targetId,
      });
    }
  }

  /*
   * ------------------------------------------------------------
   * Build diagnostic rows
   * ------------------------------------------------------------
   */

  const diagnosticRows: Array<Record<string, unknown>> = [];

  for (const pair of REPAIRED_PAIRS) {
    const target = subCountyById.get(pair.targetId);

    const targetWards = wards.filter(
      (ward) => ward.subCountyId === pair.targetId,
    );

    diagnosticRows.push({
      countyName: pair.countyName,
      countyId: pair.countyId,
      oldSubCountyId: pair.oldId,
      oldSubCountyName: pair.oldName,
      targetSubCountyId: pair.targetId,
      targetSubCountyName:
        target?.name ?? "",
      expectedWardCount:
        pair.expectedGids.length,
      actualWardCount:
        targetWards.length,
      expectedGids:
        pair.expectedGids.join("|"),
      actualGids:
        targetWards
          .map((ward) => ward.sourceGid)
          .filter(
            (gid): gid is number =>
              gid !== null,
          )
          .sort((a, b) => a - b)
          .join("|"),
      deletedOldIdPresent:
        subCountyById.has(pair.oldId),
      targetPresent:
        subCountyById.has(pair.targetId),
      status:
        target &&
        targetWards.length === pair.expectedGids.length &&
        targetWards
          .map((ward) => ward.sourceGid)
          .filter(
            (gid): gid is number =>
              gid !== null,
          )
          .sort((a, b) => a - b)
          .join("|") ===
          [...pair.expectedGids]
            .sort((a, b) => a - b)
            .join("|")
          ? "PASS"
          : "FAIL",
    });
  }

  /*
   * ------------------------------------------------------------
   * [12/12] Write reports
   * ------------------------------------------------------------
   */

  console.log("");
  console.log(
    "[12/12] Writing V15.7 diagnostic reports...",
  );

  const status =
    errors.length === 0
      ? "PASS"
      : "FAIL";

  const report = {
    auditVersion: "V15.7",
    auditType:
      "Independent post-consolidation database integrity audit",
    mode: "READ_ONLY",
    generatedAt:
      new Date().toISOString(),

    status,

    baseline: {
      counties: counties.length,
      subCounties: subCounties.length,
      wards: wards.length,
      farmers: farmers.length,
      farms: farms.length,
      businessPartners:
        businessPartners.length,
      commodityTransactions:
        commodityTransactions.length,
    },

    expectedCounts: EXPECTED_COUNTS,

    sourceGidIntegrity: {
      authoritativeFeatures:
        authoritativeRows.length,
      authoritativeNumericGids:
        numericGids.length,
      authoritativeUniqueGids:
        authoritativeGidSet.size,
      databaseWards:
        wards.length,
      databaseUniqueSourceGids:
        uniqueSourceGidCount,
      nullDatabaseSourceGids:
        nullSourceGids,
      missingAuthoritativeGids:
        missingAuthoritativeGids,
      unexpectedDatabaseGids:
        unexpectedDatabaseGids,
    },

    wardRelationalIntegrity: {
      nullSubCounty:
        nullSubCountyCount,
      missingSubCounty:
        missingSubCountyCount,
      missingCounty:
        missingCountyCount,
      countySubCountyMismatches:
        countySubCountyMismatchCount,
    },

    deletedSubCountyVerification: {
      deletedIds: DELETED_IDS,
      deletedIdsStillPresent:
        deletedRecords.map(
          (record) => ({
            id: record.id,
            name: record.name,
          }),
        ),
      wardRefs:
        deletedWardRefs,
      farmerRefs:
        deletedFarmerRefs,
      farmRefs:
        deletedFarmRefs,
      businessPartnerRefs:
        deletedBusinessPartnerRefs,
      commoditySourceRefs:
        deletedCommoditySourceRefs,
      commodityDestinationRefs:
        deletedCommodityDestinationRefs,
    },

    canonicalTargets: targetResults,

    repairedAuthoritativeCorrespondence:
      repairedWardResults,

    duplicateNormalizedIdentities: {
      count: duplicateIdentities.length,
      identities: duplicateIdentities,
    },

    repairedPairs: REPAIRED_PAIRS.map(
      (pair) => ({
        countyName:
          pair.countyName,
        countyId:
          pair.countyId,
        oldSubCountyId:
          pair.oldId,
        oldSubCountyName:
          pair.oldName,
        targetSubCountyId:
          pair.targetId,
        targetSubCountyName:
          pair.targetName,
        expectedGids:
          pair.expectedGids,
      }),
    ),

    diagnosticRows,

    errors,
    warnings,

    invariants: {
      countyCountPass:
        counties.length ===
        EXPECTED_COUNTS.counties,

      subCountyCountPass:
        subCounties.length ===
        EXPECTED_COUNTS.subCounties,

      wardCountPass:
        wards.length ===
        EXPECTED_COUNTS.wards,

      uniqueSourceGidPass:
        uniqueSourceGidCount ===
        EXPECTED_COUNTS.wards,

      deletedIdsAbsent:
        deletedRecords.length === 0,

      canonicalTargetsPresent:
        repairedTargetIds.every(
          (id) => subCountyById.has(id),
        ),

      repairedWardGidsPresent:
        databaseRepairedGidSet.size ===
        expectedRepairedGidCount,

      wardRelationalIntegrityPass:
        nullSubCountyCount === 0 &&
        missingSubCountyCount === 0 &&
        missingCountyCount === 0 &&
        countySubCountyMismatchCount === 0,

      deletedIdForeignKeysClear:
        deletedWardRefs === 0 &&
        deletedFarmerRefs === 0 &&
        deletedFarmRefs === 0 &&
        deletedBusinessPartnerRefs === 0 &&
        deletedCommoditySourceRefs === 0 &&
        deletedCommodityDestinationRefs === 0,

      repairedAuthoritativeCorrespondencePass:
        repairedPassCount ===
        repairedGids.length,

      repairedPairDuplicateCheckPass:
        !errors.some(
          (error) =>
            error.type ===
            "REPAIRED_GROUP_STILL_DUPLICATED",
        ),
    },
  };

  fs.writeFileSync(
    JSON_OUTPUT,
    JSON.stringify(report, null, 2),
    "utf8",
  );

  writeCsv(
    diagnosticRows,
    CSV_OUTPUT,
  );

  /*
   * ------------------------------------------------------------
   * Final result
   * ------------------------------------------------------------
   */

  console.log("");
  console.log(
    "FINAL V15.7 RESULT",
  );

  console.log(
    `STATUS: ${status}`,
  );

  console.log(
    `Counties: ${counties.length}`,
  );

  console.log(
    `SubCounties: ${subCounties.length}`,
  );

  console.log(
    `Wards: ${wards.length}`,
  );

  console.log(
    `Unique sourceGIDs: ${uniqueSourceGidCount}`,
  );

  console.log(
    `Deleted IDs still present: ${deletedRecords.length}`,
  );

  console.log(
    `Canonical targets verified: ${repairedTargetIds.length}`,
  );

  console.log(
    `Repaired authoritative GIDs verified: ${repairedPassCount}/${repairedGids.length}`,
  );

  console.log(
    `Global duplicate normalized identities: ${duplicateIdentities.length}`,
  );

  console.log(
    `County/SubCounty mismatches: ${countySubCountyMismatchCount}`,
  );

  console.log(
    `Deleted-ID FK references: ${
      deletedWardRefs +
      deletedFarmerRefs +
      deletedFarmRefs +
      deletedBusinessPartnerRefs +
      deletedCommoditySourceRefs +
      deletedCommodityDestinationRefs
    }`,
  );

  console.log(
    `Errors: ${errors.length}`,
  );

  console.log(
    `Warnings: ${warnings.length}`,
  );

  console.log("");
  console.log(
    `JSON: ${JSON_OUTPUT}`,
  );

  console.log(
    `CSV: ${CSV_OUTPUT}`,
  );

  console.log("");

  if (status === "PASS") {
    console.log(
      "V15.7 PASS",
    );

    console.log(
      "Independent post-consolidation integrity verification completed.",
    );

    console.log(
      "No database changes were made.",
    );
  } else {
    console.log(
      "V15.7 FAIL",
    );

    console.log(
      "Review the diagnostic report before any further database repair.",
    );
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V15.7 AUDIT FAILED TO COMPLETE",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });