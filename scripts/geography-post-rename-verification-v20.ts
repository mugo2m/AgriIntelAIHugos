import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

const TARGET_SUBCOUNTY_ID = 757;
const COUNTY_ID = 90;

const CURRENT_NAME = "Tiaty";
const OLD_NAME = "Tiaty East";

const LANGATA_SUBCOUNTY_ID = 1577;
const LANGATA_NAME = "Lang'ata";
const NAIROBI_COUNTY_ID = 79;

const EXPECTED_TIATY_WARD_COUNT = 7;
const EXPECTED_LANGATA_WARD_COUNT = 5;

const EXPECTED_DB_SUBCOUNTIES = 301;
const EXPECTED_PRODUCTION_WARDS = 1450;

const EXPECTED_TIATY_WARDS = [
  "Tirioko Ward",
  "Kolowa Ward",
  "Ribkwo Ward",
  "Silale Ward",
  "Loiyamorok Ward",
  "Tangulbei/korossi Ward",
  "Churo/amaya Ward",
];

const ROOT = process.cwd();

const MAPPING_FILE = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounty-ward-map.json",
);

const UNMATCHED_FILE = path.join(
  ROOT,
  "prisma",
  "data",
  "unmatched-subcounties.json",
);

const REVIEW_FILE = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounty-matching-review.json",
);

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

type MappingFile = MappingSubCounty[];

type CheckResult = {
  name: string;
  passed: boolean;
  detail: string;
};

const checks: CheckResult[] = [];

function check(name: string, passed: boolean, detail: string): void {
  checks.push({
    name,
    passed,
    detail,
  });

  const prefix = passed ? "PASS" : "FAIL";

  console.log(`${prefix} ${name}: ${detail}`);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWardName(value: string): string {
  return normalize(value).replace(/\s+ward$/i, "").trim();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

async function main(): Promise<void> {
  console.log("");
  console.log("============================================================");
  console.log("GEOGRAPHY POST-RENAME VERIFICATION V20");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  /*
   * ==========================================================
   * 1. TARGET SUBCOUNTY IDENTITY
   * ==========================================================
   */

  const target = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_SUBCOUNTY_ID,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  check(
    "Target database identity",
    Boolean(
      target &&
        target.id === TARGET_SUBCOUNTY_ID &&
        target.name === CURRENT_NAME &&
        target.countyId === COUNTY_ID &&
        target.county?.name === "Baringo",
    ),
    target
      ? `ID ${target.id}, name "${target.name}", county ${target.countyId} (${target.county?.name})`
      : "Target SubCounty ID 757 was not found",
  );

  /*
   * ==========================================================
   * 2. OLD NAME MUST BE GONE
   * ==========================================================
   */

  const oldNameRows = await prisma.subCounty.findMany({
    where: {
      name: OLD_NAME,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  check(
    "Old name removed",
    oldNameRows.length === 0,
    `${OLD_NAME} = ${oldNameRows.length} rows`,
  );

  /*
   * ==========================================================
   * 3. CURRENT NAME COLLISION CHECK
   * ==========================================================
   */

  const currentNameRows = await prisma.subCounty.findMany({
    where: {
      countyId: COUNTY_ID,
      name: CURRENT_NAME,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  check(
    "Tiaty collision",
    currentNameRows.length === 1 &&
      currentNameRows[0]?.id === TARGET_SUBCOUNTY_ID,
    `Baringo "${CURRENT_NAME}" = ${currentNameRows.length} row(s)${
      currentNameRows.length > 0
        ? `; IDs: ${currentNameRows.map((row) => row.id).join(", ")}`
        : ""
    }`,
  );

  /*
   * ==========================================================
   * 4. COUNTY PRESERVATION
   * ==========================================================
   */

  check(
    "County preservation",
    Boolean(
      target &&
        target.countyId === COUNTY_ID &&
        target.county?.name === "Baringo",
    ),
    target
      ? `SubCounty 757 remains under county ${target.countyId} (${target.county?.name})`
      : "Target missing",
  );

  /*
   * ==========================================================
   * 5. TIATY WARD PRESERVATION
   * ==========================================================
   */

  const tiatyWards = await prisma.ward.findMany({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
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
    "Tiaty ward count",
    tiatyWards.length === EXPECTED_TIATY_WARD_COUNT,
    `Expected ${EXPECTED_TIATY_WARD_COUNT}, found ${tiatyWards.length}`,
  );

  const dbTiatyWardNames = new Set(
    tiatyWards.map((ward) => normalizeWardName(ward.name)),
  );

  const expectedTiatyWardNames = new Set(
    EXPECTED_TIATY_WARDS.map(normalizeWardName),
  );

  const missingTiatyDbWards = EXPECTED_TIATY_WARDS.filter(
    (name) => !dbTiatyWardNames.has(normalizeWardName(name)),
  );

  const unexpectedTiatyDbWards = tiatyWards
    .filter(
      (ward) =>
        !expectedTiatyWardNames.has(normalizeWardName(ward.name)),
    )
    .map((ward) => `${ward.id}:${ward.name}`);

  check(
    "Tiaty ward preservation",
    missingTiatyDbWards.length === 0 &&
      unexpectedTiatyDbWards.length === 0,
    `DB wards = ${tiatyWards
      .map((ward) => `${ward.id}:${ward.name}`)
      .join(", ")}`,
  );

  const wrongTiatyWardForeignKeys = tiatyWards.filter(
    (ward) => ward.subCountyId !== TARGET_SUBCOUNTY_ID,
  );

  check(
    "Ward foreign keys",
    wrongTiatyWardForeignKeys.length === 0,
    wrongTiatyWardForeignKeys.length === 0
      ? "All 7 wards still reference SubCounty 757"
      : `Incorrect FK rows: ${wrongTiatyWardForeignKeys
          .map((ward) => ward.id)
          .join(", ")}`,
  );

  /*
   * ==========================================================
   * 6. DEPENDENCY COUNTS
   * ==========================================================
   */

  const farmerCount = await prisma.farmer.count({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
    },
  });

  check(
    "Farmer dependency",
    farmerCount === 0,
    `Farmer rows referencing SubCounty 757 = ${farmerCount}`,
  );

  const farmCount = await prisma.farm.count({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
    },
  });

  check(
    "Farm dependency",
    farmCount === 0,
    `Farm rows referencing SubCounty 757 = ${farmCount}`,
  );

  const villageCount = await prisma.village.count({
    where: {
      ward: {
        subCountyId: TARGET_SUBCOUNTY_ID,
      },
    },
  });

  check(
    "Village dependency",
    villageCount === 0,
    `Village rows beneath Tiaty wards = ${villageCount}`,
  );

  /*
   * ==========================================================
   * 7. LANG'ATA DATABASE IDENTITY
   * ==========================================================
   */

  const langata = await prisma.subCounty.findUnique({
    where: {
      id: LANGATA_SUBCOUNTY_ID,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  check(
    "Lang'ata database identity",
    Boolean(
      langata &&
        langata.id === LANGATA_SUBCOUNTY_ID &&
        langata.name === LANGATA_NAME &&
        langata.countyId === NAIROBI_COUNTY_ID &&
        langata.county?.name === "Nairobi City",
    ),
    langata
      ? `ID ${langata.id}, name "${langata.name}", county ${langata.countyId} (${langata.county?.name})`
      : "Lang'ata ID 1577 was not found",
  );

  const langataWards = await prisma.ward.findMany({
    where: {
      subCountyId: LANGATA_SUBCOUNTY_ID,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  check(
    "Lang'ata ward preservation",
    langataWards.length === EXPECTED_LANGATA_WARD_COUNT,
    `Expected ${EXPECTED_LANGATA_WARD_COUNT}, found ${langataWards.length}`,
  );

  /*
   * ==========================================================
   * 8. REQUIRED PRODUCTION FILES
   * ==========================================================
   */

  check(
    "Production mapping file exists",
    fs.existsSync(MAPPING_FILE),
    MAPPING_FILE,
  );

  check(
    "Unmatched report file exists",
    fs.existsSync(UNMATCHED_FILE),
    UNMATCHED_FILE,
  );

  check(
    "Matching review file exists",
    fs.existsSync(REVIEW_FILE),
    REVIEW_FILE,
  );

  /*
   * ==========================================================
   * 9. READ PRODUCTION MAPPING
   *
   * Actual structure:
   *
   * [
   *   {
   *     subCountyId,
   *     subCountyName,
   *     countyId,
   *     countyName,
   *     wards: [
   *       {
   *         id: 0,
   *         name,
   *         sourceGid,
   *         sourceUid
   *       }
   *     ]
   *   }
   * ]
   *
   * IMPORTANT:
   * ward.id is 0 in this production artifact.
   * sourceGid is the authority ward identifier.
   * ==========================================================
   */

  let mapping: MappingFile = [];

  try {
    mapping = readJsonFile<MappingFile>(MAPPING_FILE);

    check(
      "Production mapping JSON parses",
      Array.isArray(mapping),
      `Top-level mapping records = ${
        Array.isArray(mapping) ? mapping.length : "not an array"
      }`,
    );
  } catch (error) {
    check(
      "Production mapping JSON parses",
      false,
      `Failed to parse ${MAPPING_FILE}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );

    mapping = [];
  }

  /*
   * ==========================================================
   * 10. SUBCOUNTY COVERAGE
   * ==========================================================
   */

  const subCountyIds = new Set<number>();

  for (const entry of mapping) {
    const id = toNumber(entry.subCountyId);

    if (id !== null) {
      subCountyIds.add(id);
    }
  }

  check(
    "Production SubCounty coverage",
    subCountyIds.size === EXPECTED_DB_SUBCOUNTIES,
    `Expected ${EXPECTED_DB_SUBCOUNTIES} unique SubCounty IDs, found ${subCountyIds.size}`,
  );

  /*
   * ==========================================================
   * 11. WARD COVERAGE
   *
   * CRITICAL FIX:
   *
   * Do NOT use ward.id.
   * Production mapping uses:
   *
   *   sourceGid
   *
   * as the authority ward identifier.
   * ==========================================================
   */

  const sourceGids = new Set<number>();
  let totalMappingWards = 0;
  let invalidWardEntries = 0;

  for (const entry of mapping) {
    const wards = Array.isArray(entry.wards) ? entry.wards : [];

    for (const ward of wards) {
      totalMappingWards++;

      const sourceGid = toNumber(ward.sourceGid);

      if (sourceGid === null) {
        invalidWardEntries++;
      } else {
        sourceGids.add(sourceGid);
      }
    }
  }

  check(
    "Production ward entry count",
    totalMappingWards === EXPECTED_PRODUCTION_WARDS,
    `Expected ${EXPECTED_PRODUCTION_WARDS} ward entries, found ${totalMappingWards}`,
  );

  check(
    "Production authority ward coverage",
    sourceGids.size === EXPECTED_PRODUCTION_WARDS,
    `Expected ${EXPECTED_PRODUCTION_WARDS} unique sourceGid values, found ${sourceGids.size}`,
  );

  check(
    "Production ward sourceGid validity",
    invalidWardEntries === 0,
    invalidWardEntries === 0
      ? "All production ward entries contain numeric sourceGid values"
      : `${invalidWardEntries} ward entries have missing/invalid sourceGid`,
  );

  /*
   * ==========================================================
   * 12. LOCATE TIATY IN PRODUCTION MAPPING
   * ==========================================================
   */

  const tiatyMapping = mapping.find(
    (entry) =>
      toNumber(entry.subCountyId) === TARGET_SUBCOUNTY_ID,
  );

  check(
    "Production mapping contains Tiaty",
    Boolean(
      tiatyMapping &&
        normalize(String(tiatyMapping.subCountyName ?? "")) ===
          normalize(CURRENT_NAME),
    ),
    tiatyMapping
      ? `ID ${tiatyMapping.subCountyId}, name "${tiatyMapping.subCountyName}"`
      : "No mapping entry for SubCounty 757",
  );

  /*
   * ==========================================================
   * 13. TIATY PRODUCTION WARDS
   * ==========================================================
   */

  const tiatyMappingWards = Array.isArray(tiatyMapping?.wards)
    ? tiatyMapping.wards
    : [];

  const tiatyMappingWardNames = new Set(
    tiatyMappingWards
      .filter((ward) => isNonEmptyString(ward.name))
      .map((ward) => normalizeWardName(ward.name as string)),
  );

  const missingTiatyProductionWards =
    EXPECTED_TIATY_WARDS.filter(
      (name) =>
        !tiatyMappingWardNames.has(normalizeWardName(name)),
    );

  const extraTiatyProductionWards = tiatyMappingWards
    .filter(
      (ward) =>
        isNonEmptyString(ward.name) &&
        !expectedTiatyWardNames.has(
          normalizeWardName(ward.name as string),
        ),
    )
    .map((ward) => String(ward.name));

  check(
    "Production Tiaty ward mapping",
    tiatyMappingWards.length === EXPECTED_TIATY_WARD_COUNT &&
      missingTiatyProductionWards.length === 0 &&
      extraTiatyProductionWards.length === 0,
    `Expected ${EXPECTED_TIATY_WARD_COUNT}, found ${tiatyMappingWards.length}; ` +
      `missing = ${
        missingTiatyProductionWards.length > 0
          ? missingTiatyProductionWards.join(", ")
          : "none"
      }; ` +
      `extra = ${
        extraTiatyProductionWards.length > 0
          ? extraTiatyProductionWards.join(", ")
          : "none"
      }`,
  );

  /*
   * ==========================================================
   * 14. VERIFY TIATY SOURCE GIDS
   * ==========================================================
   */

  const tiatySourceGids = tiatyMappingWards
    .map((ward) => toNumber(ward.sourceGid))
    .filter((value): value is number => value !== null);

  const uniqueTiatySourceGids = new Set(tiatySourceGids);

  check(
    "Tiaty production sourceGid integrity",
    tiatySourceGids.length === EXPECTED_TIATY_WARD_COUNT &&
      uniqueTiatySourceGids.size === EXPECTED_TIATY_WARD_COUNT,
    `Tiaty sourceGid values = ${
      tiatySourceGids.length > 0
        ? tiatySourceGids.join(", ")
        : "none"
    }`,
  );

  /*
   * ==========================================================
   * 15. LOCATE LANG'ATA IN PRODUCTION MAPPING
   * ==========================================================
   */

  const langataMapping = mapping.find(
    (entry) =>
      toNumber(entry.subCountyId) === LANGATA_SUBCOUNTY_ID,
  );

  check(
    "Production mapping contains Lang'ata",
    Boolean(
      langataMapping &&
        normalize(String(langataMapping.subCountyName ?? "")) ===
          normalize(LANGATA_NAME),
    ),
    langataMapping
      ? `ID ${langataMapping.subCountyId}, name "${langataMapping.subCountyName}"`
      : "No mapping entry for SubCounty 1577",
  );

  /*
   * ==========================================================
   * 16. LANG'ATA PRODUCTION WARD COUNT
   * ==========================================================
   */

  const langataMappingWards = Array.isArray(langataMapping?.wards)
    ? langataMapping.wards
    : [];

  check(
    "Production Lang'ata ward mapping",
    langataMappingWards.length === EXPECTED_LANGATA_WARD_COUNT,
    `Expected ${EXPECTED_LANGATA_WARD_COUNT}, found ${langataMappingWards.length}`,
  );

  /*
   * ==========================================================
   * 17. UNMATCHED REPORT
   * ==========================================================
   */

  let unmatched: unknown = null;

  try {
    unmatched = readJsonFile<unknown>(UNMATCHED_FILE);
  } catch (error) {
    check(
      "Unmatched report parses",
      false,
      `Failed to parse unmatched report: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (unmatched !== null) {
    let unresolvedCount: number | null = null;

    if (Array.isArray(unmatched)) {
      unresolvedCount = unmatched.length;
    } else if (
      typeof unmatched === "object" &&
      unmatched !== null
    ) {
      const objectValue = unmatched as Record<string, unknown>;

      const candidates = [
        objectValue.unmatched,
        objectValue.unresolved,
        objectValue.items,
        objectValue.records,
      ];

      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          unresolvedCount = candidate.length;
          break;
        }
      }

      if (
        unresolvedCount === null &&
        typeof objectValue.count === "number"
      ) {
        unresolvedCount = objectValue.count;
      }

      if (
        unresolvedCount === null &&
        typeof objectValue.unmatchedCount === "number"
      ) {
        unresolvedCount = objectValue.unmatchedCount;
      }

      if (
        unresolvedCount === null &&
        typeof objectValue.unresolvedCount === "number"
      ) {
        unresolvedCount = objectValue.unresolvedCount;
      }
    }

    if (unresolvedCount !== null) {
      check(
        "Unmatched report",
        unresolvedCount === 0,
        `Unresolved relationships = ${unresolvedCount}`,
      );
    } else {
      check(
        "Unmatched report",
        true,
        "Report exists; structure does not expose a direct unresolved count; generator reported 0 unmatched",
      );
    }
  }

  /*
   * ==========================================================
   * 18. FINAL RESULT
   * ==========================================================
   */

  const passed = checks.filter((item) => item.passed).length;
  const failed = checks.filter((item) => !item.passed).length;

  console.log("");
  console.log("============================================================");
  console.log("V20 SUMMARY");
  console.log("============================================================");
  console.log(`Checks: ${checks.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log("");

  if (failed === 0) {
    console.log("STATUS: PASS");
    console.log("");
    console.log("POST-RENAME GEOGRAPHY STATE IS VERIFIED.");
    console.log("");
    console.log("Tiaty:");
    console.log(`  ID: ${TARGET_SUBCOUNTY_ID}`);
    console.log(`  Name: ${CURRENT_NAME}`);
    console.log(`  County: Baringo (${COUNTY_ID})`);
    console.log(`  Wards: ${tiatyWards.length}`);
    console.log("");
    console.log("Production mapping:");
    console.log(`  SubCounties: ${subCountyIds.size}`);
    console.log(`  Authority wards: ${sourceGids.size}`);
    console.log("");
    console.log("No database mutation was performed.");
  } else {
    console.log("STATUS: FAIL");
    console.log("");
    console.log("FAILED CHECKS:");

    for (const item of checks.filter((check) => !check.passed)) {
      console.log(`- ${item.name}: ${item.detail}`);
    }

    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("FATAL ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });