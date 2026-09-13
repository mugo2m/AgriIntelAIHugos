import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

type MappingWard = {
  id?: unknown;
  name?: unknown;
  code?: unknown;
  sourceGid?: unknown;
  sourceUid?: unknown;
};

type MappingSubCounty = {
  subCountyId?: unknown;
  subCountyName?: unknown;
  countyId?: unknown;
  countyName?: unknown;
  wards?: MappingWard[];
};

type CheckResult = {
  name: string;
  passed: boolean;
  detail: string;
};

const ROOT = process.cwd();

const MAPPING_PATH = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounty-ward-map.json",
);

const UNMATCHED_PATH = path.join(
  ROOT,
  "prisma",
  "data",
  "unmatched-subcounties.json",
);

const REVIEW_PATH = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounty-matching-review.json",
);

const EXPECTED_AUTHORITY_WARDS = 1450;

const results: CheckResult[] = [];

function check(
  name: string,
  passed: boolean,
  detail: string,
) {
  results.push({
    name,
    passed,
    detail,
  });

  console.log(
    `${passed ? "PASS" : "FAIL"} ${name}: ${detail}`,
  );
}

function normalize(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("NATIONAL GEOGRAPHY INTEGRITY AUDIT V23");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  // --------------------------------------------------------------------------
  // FILE EXISTENCE
  // --------------------------------------------------------------------------

  console.log("1. PRODUCTION ARTIFACT CHECK");
  console.log("------------------------------------------------------------");

  check(
    "Production mapping file exists",
    fs.existsSync(MAPPING_PATH),
    MAPPING_PATH,
  );

  check(
    "Unmatched report exists",
    fs.existsSync(UNMATCHED_PATH),
    UNMATCHED_PATH,
  );

  check(
    "Review report exists",
    fs.existsSync(REVIEW_PATH),
    REVIEW_PATH,
  );

  if (!fs.existsSync(MAPPING_PATH)) {
    throw new Error(
      `Production mapping not found: ${MAPPING_PATH}`,
    );
  }

  // --------------------------------------------------------------------------
  // LOAD MAPPING
  // --------------------------------------------------------------------------

  console.log("");
  console.log("2. PRODUCTION MAPPING STRUCTURE");
  console.log("------------------------------------------------------------");

  const rawMapping = readJson(MAPPING_PATH);

  if (!Array.isArray(rawMapping)) {
    check(
      "Mapping is an array",
      false,
      "Expected top-level JSON array.",
    );

    throw new Error("Production mapping is not an array.");
  }

  const mapping = rawMapping as MappingSubCounty[];

  check(
    "Mapping is an array",
    true,
    `Top-level records = ${mapping.length}`,
  );

  const subCountyIds = mapping
    .map((item) => Number(item.subCountyId))
    .filter((id) => Number.isFinite(id));

  const uniqueSubCountyIds = new Set(subCountyIds);

  check(
    "Mapping SubCounty IDs are unique",
    uniqueSubCountyIds.size === subCountyIds.length,
    `Records=${subCountyIds.length}, unique IDs=${uniqueSubCountyIds.size}`,
  );

  const invalidSubCountyRecords = mapping.filter(
    (item) =>
      !Number.isInteger(Number(item.subCountyId)) ||
      !item.subCountyName ||
      !Number.isInteger(Number(item.countyId)) ||
      !item.countyName ||
      !Array.isArray(item.wards),
  );

  check(
    "Mapping records have required structure",
    invalidSubCountyRecords.length === 0,
    `Invalid records=${invalidSubCountyRecords.length}`,
  );

  // --------------------------------------------------------------------------
  // MAPPING WARD ANALYSIS
  // --------------------------------------------------------------------------

  console.log("");
  console.log("3. AUTHORITY WARD MAPPING ANALYSIS");
  console.log("------------------------------------------------------------");

  const allMappingWards: Array<{
    subCountyId: number;
    subCountyName: string;
    countyId: number;
    countyName: string;
    ward: MappingWard;
  }> = [];

  for (const subCounty of mapping) {
    const subCountyId = Number(subCounty.subCountyId);
    const countyId = Number(subCounty.countyId);

    for (const ward of subCounty.wards ?? []) {
      allMappingWards.push({
        subCountyId,
        subCountyName: String(subCounty.subCountyName),
        countyId,
        countyName: String(subCounty.countyName),
        ward,
      });
    }
  }

  const sourceGids = allMappingWards
    .map((item) => String(item.ward.sourceGid ?? ""))
    .filter((value) => value.length > 0);

  const uniqueSourceGids = new Set(sourceGids);

  check(
    "Authority ward count is 1450",
    allMappingWards.length === EXPECTED_AUTHORITY_WARDS,
    `Mapped ward entries=${allMappingWards.length}, expected=${EXPECTED_AUTHORITY_WARDS}`,
  );

  check(
    "Authority sourceGid count is 1450",
    sourceGids.length === EXPECTED_AUTHORITY_WARDS,
    `sourceGid entries=${sourceGids.length}`,
  );

  check(
    "Authority sourceGid values are unique",
    uniqueSourceGids.size === sourceGids.length,
    `sourceGids=${sourceGids.length}, unique=${uniqueSourceGids.size}`,
  );

  const missingSourceGids = allMappingWards.filter(
    (item) =>
      item.ward.sourceGid === undefined ||
      item.ward.sourceGid === null ||
      String(item.ward.sourceGid).trim() === "",
  );

  check(
    "All authority wards have sourceGid",
    missingSourceGids.length === 0,
    `Missing sourceGid=${missingSourceGids.length}`,
  );

  const duplicateWardKeys = new Map<string, number>();

  for (const item of allMappingWards) {
    const key = `${item.subCountyId}|${normalize(
      String(item.ward.name ?? ""),
    )}`;

    duplicateWardKeys.set(
      key,
      (duplicateWardKeys.get(key) ?? 0) + 1,
    );
  }

  const duplicateWardNames = [
    ...duplicateWardKeys.entries(),
  ].filter(([, count]) => count > 1);

  check(
    "No duplicate ward names within the same SubCounty",
    duplicateWardNames.length === 0,
    `Duplicate keys=${duplicateWardNames.length}`,
  );

  // --------------------------------------------------------------------------
  // UNMATCHED REPORT
  // --------------------------------------------------------------------------

  console.log("");
  console.log("4. UNMATCHED / REVIEW REPORTS");
  console.log("------------------------------------------------------------");

  if (fs.existsSync(UNMATCHED_PATH)) {
    const unmatched = readJson(UNMATCHED_PATH);

    let unmatchedCount = 0;

    if (Array.isArray(unmatched)) {
      unmatchedCount = unmatched.length;
    } else if (
      unmatched &&
      typeof unmatched === "object" &&
      Array.isArray(
        (unmatched as { unmatched?: unknown[] }).unmatched,
      )
    ) {
      unmatchedCount = (
        unmatched as { unmatched: unknown[] }
      ).unmatched.length;
    }

    check(
      "Unmatched authority relationships = 0",
      unmatchedCount === 0,
      `Unmatched entries=${unmatchedCount}`,
    );
  }

  // --------------------------------------------------------------------------
  // DATABASE COUNTS
  // --------------------------------------------------------------------------

  console.log("");
  console.log("5. CURRENT DATABASE COUNTS");
  console.log("------------------------------------------------------------");

  const dbSubCountyCount = await prisma.subCounty.count();
  const dbWardCount = await prisma.ward.count();
  const dbCountyCount = await prisma.county.count();

  console.log(`DB Counties: ${dbCountyCount}`);
  console.log(`DB SubCounties: ${dbSubCountyCount}`);
  console.log(`DB Wards: ${dbWardCount}`);

  check(
    "Database has 47 counties",
    dbCountyCount === 47,
    `Count=${dbCountyCount}`,
  );

  check(
    "Database Ward count equals authority count",
    dbWardCount === EXPECTED_AUTHORITY_WARDS,
    `DB wards=${dbWardCount}, authority=${EXPECTED_AUTHORITY_WARDS}`,
  );

  // --------------------------------------------------------------------------
  // MAPPED SUBCOUNTIES EXIST
  // --------------------------------------------------------------------------

  console.log("");
  console.log("6. SUBCOUNTY DATABASE RECONCILIATION");
  console.log("------------------------------------------------------------");

  const mappedIds = [...uniqueSubCountyIds];

  const dbSubCounties = await prisma.subCounty.findMany({
    where: {
      id: {
        in: mappedIds,
      },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  const dbSubCountyMap = new Map(
    dbSubCounties.map((item) => [item.id, item]),
  );

  const missingMappedSubCounties = mappedIds.filter(
    (id) => !dbSubCountyMap.has(id),
  );

  check(
    "Every mapped SubCounty exists in DB",
    missingMappedSubCounties.length === 0,
    `Mapped=${mappedIds.length}, found=${dbSubCounties.length}, missing=${missingMappedSubCounties.length}`,
  );

  const subCountyIdentityMismatches = mapping.filter(
    (item) => {
      const id = Number(item.subCountyId);
      const db = dbSubCountyMap.get(id);

      if (!db) return true;

      return (
        normalize(db.name) !==
          normalize(String(item.subCountyName)) ||
        db.countyId !== Number(item.countyId)
      );
    },
  );

  check(
    "Mapped SubCounty names and County IDs match DB",
    subCountyIdentityMismatches.length === 0,
    `Mismatches=${subCountyIdentityMismatches.length}`,
  );

  // --------------------------------------------------------------------------
  // DATABASE WARDS
  // --------------------------------------------------------------------------

  console.log("");
  console.log("7. WARD FOREIGN-KEY INTEGRITY");
  console.log("------------------------------------------------------------");

  const mappedWardIds = allMappingWards
    .map((item) => Number(item.ward.id))
    .filter((id) => Number.isInteger(id) && id > 0);

  const uniqueMappedWardIds = new Set(mappedWardIds);

  console.log(
    `Mapping ward IDs with positive values: ${mappedWardIds.length}`,
  );

  console.log(
    `Unique positive mapping ward IDs: ${uniqueMappedWardIds.size}`,
  );

  /*
   * Production mapping currently uses id=0 for authority ward identity
   * and sourceGid for authority identity. Therefore we do not require
   * mapping ward.id to equal the PostgreSQL Ward.id.
   *
   * Instead, validate DB wards through source identity:
   * authority sourceGid -> mapping -> ward name/subcounty.
   *
   * The authority sourceGid is the stable authority-side identity.
   */

  const dbWards = await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      subCountyId: true,
      countyId: true,
      constituencyId: true,
    },
  });

  const dbWardBySubCountyAndName = new Map<
    string,
    {
      id: number;
      name: string;
      subCountyId: number;
      countyId: number;
      constituencyId: number | null;
    }
  >();

  for (const ward of dbWards) {
    const key = `${ward.subCountyId}|${normalize(ward.name)}`;

    dbWardBySubCountyAndName.set(key, ward);
  }

  const missingMappedDbWards: typeof allMappingWards = [];
  const wardSubCountyMismatches: typeof allMappingWards = [];

  for (const item of allMappingWards) {
    const key = `${item.subCountyId}|${normalize(
      String(item.ward.name ?? ""),
    )}`;

    const dbWard = dbWardBySubCountyAndName.get(key);

    if (!dbWard) {
      missingMappedDbWards.push(item);
      continue;
    }

    if (dbWard.subCountyId !== item.subCountyId) {
      wardSubCountyMismatches.push(item);
    }

    if (dbWard.countyId !== item.countyId) {
      wardSubCountyMismatches.push(item);
    }
  }

  check(
    "Every mapped authority ward exists in DB",
    missingMappedDbWards.length === 0,
    `Missing DB wards=${missingMappedDbWards.length}`,
  );

  check(
    "Mapped wards have correct SubCounty/County ownership",
    wardSubCountyMismatches.length === 0,
    `Ownership mismatches=${wardSubCountyMismatches.length}`,
  );

  // --------------------------------------------------------------------------
  // DUPLICATE DB WARDS
  // --------------------------------------------------------------------------

  console.log("");
  console.log("8. DATABASE DUPLICATE ANALYSIS");
  console.log("------------------------------------------------------------");

  const dbWardKeys = new Map<string, number>();

  for (const ward of dbWards) {
    const key = `${ward.subCountyId}|${normalize(ward.name)}`;

    dbWardKeys.set(
      key,
      (dbWardKeys.get(key) ?? 0) + 1,
    );
  }

  const duplicateDbWardKeys = [
    ...dbWardKeys.entries(),
  ].filter(([, count]) => count > 1);

  check(
    "No duplicate Ward names within a SubCounty",
    duplicateDbWardKeys.length === 0,
    `Duplicate DB keys=${duplicateDbWardKeys.length}`,
  );

  const invalidWardSubCountyIds = dbWards.filter(
    (ward) =>
      ward.subCountyId === null ||
      ward.subCountyId === undefined,
  );

  check(
    "All DB wards have SubCounty IDs",
    invalidWardSubCountyIds.length === 0,
    `Invalid/missing=${invalidWardSubCountyIds.length}`,
  );

  const dbSubCountyIds = new Set(
    dbSubCounties.map((item) => item.id),
  );

  const orphanWardSubCountyIds = dbWards.filter(
    (ward) =>
      !dbSubCountyIds.has(ward.subCountyId),
  );

  check(
    "All DB Ward SubCounty IDs resolve",
    orphanWardSubCountyIds.length === 0,
    `Orphan wards=${orphanWardSubCountyIds.length}`,
  );

  // --------------------------------------------------------------------------
  // TIATY REGRESSION
  // --------------------------------------------------------------------------

  console.log("");
  console.log("9. TIATY REGRESSION CHECK");
  console.log("------------------------------------------------------------");

  const tiaty = await prisma.subCounty.findUnique({
    where: {
      id: 757,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  check(
    "Tiaty identity remains correct",
    tiaty?.id === 757 &&
      tiaty.name === "Tiaty" &&
      tiaty.countyId === 90,
    tiaty
      ? `ID=${tiaty.id}, name="${tiaty.name}", countyId=${tiaty.countyId}`
      : "SubCounty 757 not found",
  );

  const tiatyWards = await prisma.ward.findMany({
    where: {
      subCountyId: 757,
    },
    select: {
      id: true,
      name: true,
      subCountyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  check(
    "Tiaty has exactly 7 wards",
    tiatyWards.length === 7,
    `Count=${tiatyWards.length}`,
  );

  check(
    "Historical duplicate Ward IDs are absent",
    (
      await prisma.ward.count({
        where: {
          id: {
            in: [2629, 2630, 2631, 2632],
          },
        },
      })
    ) === 0,
    "IDs 2629, 2630, 2631, 2632 are absent",
  );

  check(
    "Historical SubCounty 463 is absent",
    (
      await prisma.subCounty.count({
        where: {
          id: 463,
        },
      })
    ) === 0,
    "SubCounty ID 463 does not exist",
  );

  // --------------------------------------------------------------------------
  // LANG'ATA REGRESSION
  // --------------------------------------------------------------------------

  console.log("");
  console.log("10. LANG'ATA REGRESSION CHECK");
  console.log("------------------------------------------------------------");

  const langata = await prisma.subCounty.findUnique({
    where: {
      id: 1577,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  check(
    "Lang'ata identity remains correct",
    langata?.id === 1577 &&
      normalize(langata.name) === "lang'ata" &&
      langata.countyId === 79,
    langata
      ? `ID=${langata.id}, name="${langata.name}", countyId=${langata.countyId}`
      : "SubCounty 1577 not found",
  );

  const langataWards = await prisma.ward.findMany({
    where: {
      subCountyId: 1577,
    },
    select: {
      id: true,
      name: true,
      subCountyId: true,
    },
  });

  check(
    "Lang'ata has exactly 5 wards",
    langataWards.length === 5,
    `Count=${langataWards.length}`,
  );

  // --------------------------------------------------------------------------
  // FINAL SUMMARY
  // --------------------------------------------------------------------------

  console.log("");
  console.log("============================================================");
  console.log("V23 SUMMARY");
  console.log("============================================================");

  const passed = results.filter((result) => result.passed);
  const failed = results.filter((result) => !result.passed);

  console.log(`Checks: ${results.length}`);
  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length}`);

  console.log("");

  if (failed.length === 0) {
    console.log("STATUS: PASS");
    console.log("");
    console.log(
      "NATIONAL GEOGRAPHY INTEGRITY IS GREEN.",
    );
  } else {
    console.log("STATUS: REVIEW REQUIRED");
    console.log("");
    console.log("FAILED CHECKS:");

    for (const failure of failed) {
      console.log(
        `- ${failure.name}: ${failure.detail}`,
      );
    }
  }

  console.log("");
  console.log("READ-ONLY AUDIT COMPLETE.");
  console.log("NO DATABASE MUTATION WAS PERFORMED.");
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("V23 AUDIT ERROR");
  console.error(error);

  process.exit(1);
});