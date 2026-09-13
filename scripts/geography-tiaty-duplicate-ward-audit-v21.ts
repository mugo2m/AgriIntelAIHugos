import { prisma } from "../lib/prisma";

const TIATY_SUBCOUNTY_ID = 757;
const OTHER_SUBCOUNTY_ID = 463;

const ORIGINAL_WARD_IDS = [1840, 1841, 2190, 2193];
const DUPLICATE_WARD_IDS = [2629, 2630, 2631, 2632];

const EXPECTED_WARD_NAMES = [
  "Silale Ward",
  "Loiyamorok Ward",
  "Tangulbei/korossi Ward",
  "Churo/amaya Ward",
];

type WardRow = {
  id: number;
  name: string;
  subCountyId: number | null;
  constituencyId: number | null;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function printWard(label: string, ward: WardRow | undefined): void {
  if (!ward) {
    console.log(`${label}: NOT FOUND`);
    return;
  }

  console.log(
    `${label}: ID=${ward.id}, name="${ward.name}", subCountyId=${ward.subCountyId}, constituencyId=${ward.constituencyId}`,
  );
}

async function main(): Promise<void> {
  console.log("");
  console.log("============================================================");
  console.log("TIATY DUPLICATE WARD AUDIT V21");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  /*
   * ==========================================================
   * 1. LOAD SUBCOUNTY 757
   * ==========================================================
   */

  const tiaty = await prisma.subCounty.findUnique({
    where: {
      id: TIATY_SUBCOUNTY_ID,
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

  console.log("TARGET SUBCOUNTY");
  console.log("---------------");

  if (tiaty) {
    console.log(`ID: ${tiaty.id}`);
    console.log(`Name: ${tiaty.name}`);
    console.log(`County ID: ${tiaty.countyId}`);
    console.log(`County: ${tiaty.county?.name}`);
  } else {
    console.log("SubCounty 757 NOT FOUND");
  }

  console.log("");

  /*
   * ==========================================================
   * 2. LOAD SUBCOUNTY 463
   * ==========================================================
   */

  const otherSubCounty = await prisma.subCounty.findUnique({
    where: {
      id: OTHER_SUBCOUNTY_ID,
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

  console.log("COMPARISON SUBCOUNTY");
  console.log("--------------------");

  if (otherSubCounty) {
    console.log(`ID: ${otherSubCounty.id}`);
    console.log(`Name: ${otherSubCounty.name}`);
    console.log(`County ID: ${otherSubCounty.countyId}`);
    console.log(`County: ${otherSubCounty.county?.name}`);
  } else {
    console.log("SubCounty 463 NOT FOUND");
  }

  console.log("");

  /*
   * ==========================================================
   * 3. LOAD ORIGINAL WARDS
   * ==========================================================
   */

  const originalWards = await prisma.ward.findMany({
    where: {
      id: {
        in: ORIGINAL_WARD_IDS,
      },
    },
    select: {
      id: true,
      name: true,
      subCountyId: true,
      constituencyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  /*
   * ==========================================================
   * 4. LOAD DUPLICATE WARDS
   * ==========================================================
   */

  const duplicateWards = await prisma.ward.findMany({
    where: {
      id: {
        in: DUPLICATE_WARD_IDS,
      },
    },
    select: {
      id: true,
      name: true,
      subCountyId: true,
      constituencyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log("ORIGINAL WARDS");
  console.log("--------------");

  for (const id of ORIGINAL_WARD_IDS) {
    printWard(
      `Original ${id}`,
      originalWards.find((ward) => ward.id === id),
    );
  }

  console.log("");

  console.log("DUPLICATE WARDS");
  console.log("---------------");

  for (const id of DUPLICATE_WARD_IDS) {
    printWard(
      `Duplicate ${id}`,
      duplicateWards.find((ward) => ward.id === id),
    );
  }

  console.log("");

  /*
   * ==========================================================
   * 5. BASIC EXISTENCE CHECKS
   * ==========================================================
   */

  const checks: {
    name: string;
    passed: boolean;
    detail: string;
  }[] = [];

  function check(
    name: string,
    passed: boolean,
    detail: string,
  ): void {
    checks.push({
      name,
      passed,
      detail,
    });

    console.log(
      `${passed ? "PASS" : "FAIL"} ${name}: ${detail}`,
    );
  }

  check(
    "SubCounty 757 exists",
    Boolean(tiaty),
    tiaty
      ? `ID 757 = "${tiaty.name}"`
      : "SubCounty 757 not found",
  );

  check(
    "SubCounty 463 exists",
    Boolean(otherSubCounty),
    otherSubCounty
      ? `ID 463 = "${otherSubCounty.name}"`
      : "SubCounty 463 not found",
  );

  check(
    "All four original wards exist",
    originalWards.length === 4,
    `Expected 4, found ${originalWards.length}`,
  );

  check(
    "All four duplicate wards exist",
    duplicateWards.length === 4,
    `Expected 4, found ${duplicateWards.length}`,
  );

  /*
   * ==========================================================
   * 6. ORIGINALS MUST CURRENTLY BELONG TO TIATY
   * ==========================================================
   */

  const originalsUnderTiaty = originalWards.filter(
    (ward) => ward.subCountyId === TIATY_SUBCOUNTY_ID,
  );

  check(
    "Original wards belong to Tiaty",
    originalsUnderTiaty.length === 4,
    `Expected 4 originals under SubCounty 757, found ${originalsUnderTiaty.length}`,
  );

  /*
   * ==========================================================
   * 7. DUPLICATES MUST CURRENTLY BELONG TO SUBCOUNTY 463
   * ==========================================================
   */

  const duplicatesUnder463 = duplicateWards.filter(
    (ward) => ward.subCountyId === OTHER_SUBCOUNTY_ID,
  );

  check(
    "Duplicate wards belong to SubCounty 463",
    duplicatesUnder463.length === 4,
    `Expected 4 duplicate rows under SubCounty 463, found ${duplicatesUnder463.length}`,
  );

  /*
   * ==========================================================
   * 8. VERIFY NAMES
   * ==========================================================
   */

  const expectedNames = new Set(
    EXPECTED_WARD_NAMES.map(normalize),
  );

  const originalNames = new Set(
    originalWards.map((ward) => normalize(ward.name)),
  );

  const duplicateNames = new Set(
    duplicateWards.map((ward) => normalize(ward.name)),
  );

  const missingOriginalNames = EXPECTED_WARD_NAMES.filter(
    (name) => !originalNames.has(normalize(name)),
  );

  const missingDuplicateNames = EXPECTED_WARD_NAMES.filter(
    (name) => !duplicateNames.has(normalize(name)),
  );

  check(
    "Original ward names match expected Tiaty wards",
    missingOriginalNames.length === 0 &&
      originalNames.size === expectedNames.size,
    missingOriginalNames.length === 0
      ? "All four expected names found"
      : `Missing: ${missingOriginalNames.join(", ")}`,
  );

  check(
    "Duplicate ward names match originals",
    missingDuplicateNames.length === 0 &&
      duplicateNames.size === expectedNames.size,
    missingDuplicateNames.length === 0
      ? "All four duplicate names correspond to Tiaty wards"
      : `Missing: ${missingDuplicateNames.join(", ")}`,
  );

  /*
   * ==========================================================
   * 9. COMPARE ORIGINALS AND DUPLICATES BY NAME
   * ==========================================================
   */

  let nameMatches = 0;

  for (const original of originalWards) {
    const duplicate = duplicateWards.find(
      (ward) =>
        normalize(ward.name) === normalize(original.name),
    );

    if (duplicate) {
      nameMatches++;
      console.log(
        `MATCH "${original.name}": original ${original.id} -> duplicate ${duplicate.id}`,
      );
    } else {
      console.log(
        `MISSING DUPLICATE FOR "${original.name}"`,
      );
    }
  }

  check(
    "Original/duplicate name pairing",
    nameMatches === 4,
    `Expected 4 name pairs, found ${nameMatches}`,
  );

  /*
   * ==========================================================
   * 10. COMPARE CONSTITUENCY IDs
   * ==========================================================
   */

  let constituencyMatches = 0;
  let constituencyMismatches = 0;

  for (const original of originalWards) {
    const duplicate = duplicateWards.find(
      (ward) =>
        normalize(ward.name) === normalize(original.name),
    );

    if (!duplicate) {
      continue;
    }

    if (
      original.constituencyId ===
      duplicate.constituencyId
    ) {
      constituencyMatches++;

      console.log(
        `CONSTITUENCY MATCH "${original.name}": ${original.constituencyId}`,
      );
    } else {
      constituencyMismatches++;

      console.log(
        `CONSTITUENCY MISMATCH "${original.name}": original=${original.constituencyId}, duplicate=${duplicate.constituencyId}`,
      );
    }
  }

  check(
    "Constituency IDs match",
    constituencyMatches === 4 &&
      constituencyMismatches === 0,
    `Matches=${constituencyMatches}, mismatches=${constituencyMismatches}`,
  );

  /*
   * ==========================================================
   * 11. CHECK WHETHER OTHER ROWS USE THESE NAMES
   * ==========================================================
   *
   * This prevents deleting duplicates blindly.
   * ==========================================================
   */

  console.log("");
  console.log("ALL DATABASE WARDS WITH THESE FOUR NAMES");
  console.log("-----------------------------------------");

  const allNamedWards = await prisma.ward.findMany({
    where: {
      name: {
        in: EXPECTED_WARD_NAMES,
      },
    },
    select: {
      id: true,
      name: true,
      subCountyId: true,
      constituencyId: true,
    },
    orderBy: [
      {
        name: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  for (const ward of allNamedWards) {
    console.log(
      `ID=${ward.id}, name="${ward.name}", subCountyId=${ward.subCountyId}, constituencyId=${ward.constituencyId}`,
    );
  }

  /*
   * ==========================================================
   * 12. CHECK FOREIGN KEY DEPENDENCIES OF DUPLICATES
   *
   * IMPORTANT:
   * Before deleting duplicate Ward rows, we must prove that
   * no Village rows point to them.
   * ==========================================================
   */

  console.log("");
  console.log("DUPLICATE WARD DEPENDENCY CHECK");
  console.log("-------------------------------");

  let totalVillageDependencies = 0;

  for (const duplicate of duplicateWards) {
    const villageCount = await prisma.village.count({
      where: {
        wardId: duplicate.id,
      },
    });

    totalVillageDependencies += villageCount;

    console.log(
      `Ward ${duplicate.id} (${duplicate.name}) -> villages = ${villageCount}`,
    );
  }

  check(
    "Duplicate ward village dependencies",
    totalVillageDependencies === 0,
    `Total Village rows referencing duplicate wards = ${totalVillageDependencies}`,
  );

  /*
   * ==========================================================
   * 13. CHECK FARMER/FARM DEPENDENCIES INDIRECTLY
   *
   * Farmers/Farms normally reference SubCounty rather than Ward,
   * but we verify the duplicate SubCounty itself separately.
   * ==========================================================
   */

  const farmerCount463 = await prisma.farmer.count({
    where: {
      subCountyId: OTHER_SUBCOUNTY_ID,
    },
  });

  const farmCount463 = await prisma.farm.count({
    where: {
      subCountyId: OTHER_SUBCOUNTY_ID,
    },
  });

  console.log("");
  console.log("SUBCOUNTY 463 DEPENDENCIES");
  console.log("-------------------------");
  console.log(`Farmers under SubCounty 463: ${farmerCount463}`);
  console.log(`Farms under SubCounty 463: ${farmCount463}`);

  /*
   * ==========================================================
   * 14. CHECK CURRENT TIATY PRODUCTION MAPPING
   * ==========================================================
   */

  const fs = await import("fs");
  const path = await import("path");

  const mappingPath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "subcounty-ward-map.json",
  );

  let mapping: unknown = null;

  if (fs.existsSync(mappingPath)) {
    mapping = JSON.parse(
      fs.readFileSync(mappingPath, "utf8"),
    );
  }

  let tiatyMapping: any = null;

  if (Array.isArray(mapping)) {
    tiatyMapping = mapping.find(
      (entry: any) =>
        Number(entry?.subCountyId) ===
        TIATY_SUBCOUNTY_ID,
    );
  }

  const mappedTiatyWards = Array.isArray(
    tiatyMapping?.wards,
  )
    ? tiatyMapping.wards
    : [];

  console.log("");
  console.log("CURRENT TIATY PRODUCTION MAPPING");
  console.log("--------------------------------");

  if (tiatyMapping) {
    console.log(
      `SubCounty ${tiatyMapping.subCountyId}: ${tiatyMapping.subCountyName}`,
    );

    for (const ward of mappedTiatyWards) {
      console.log(
        `name="${ward.name}", sourceGid=${ward.sourceGid}`,
      );
    }
  } else {
    console.log("Tiaty production mapping NOT FOUND");
  }

  check(
    "Production mapping contains 7 Tiaty wards",
    mappedTiatyWards.length === 7,
    `Expected 7, found ${mappedTiatyWards.length}`,
  );

  /*
   * ==========================================================
   * 15. FINAL SAFETY DECISION
   * ==========================================================
   */

  const safeForTargetedCorrection =
    checks.every((item) => item.passed) &&
    totalVillageDependencies === 0 &&
    farmerCount463 === 0 &&
    farmCount463 === 0 &&
    originalWards.length === 4 &&
    duplicateWards.length === 4 &&
    originalsUnderTiaty.length === 4 &&
    duplicatesUnder463.length === 4 &&
    nameMatches === 4 &&
    constituencyMatches === 4 &&
    constituencyMismatches === 0;

  console.log("");
  console.log("============================================================");
  console.log("V21 SUMMARY");
  console.log("============================================================");

  const passed = checks.filter((item) => item.passed).length;
  const failed = checks.filter((item) => !item.passed).length;

  console.log(`Checks: ${checks.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log("");

  if (safeForTargetedCorrection) {
    console.log("STATUS: PASS");
    console.log("");
    console.log("TARGETED CORRECTION MAY PROCEED.");
    console.log("");
    console.log("Planned correction:");
    console.log("  DELETE duplicate Ward IDs: 2629, 2630, 2631, 2632");
    console.log("  MOVE original Ward IDs: 1840, 1841, 2190, 2193");
    console.log("  FROM SubCounty 757");
    console.log("  TO SubCounty 463");
    console.log("");
    console.log("No mutation was performed by V21.");
  } else {
    console.log("STATUS: REVIEW REQUIRED");
    console.log("");
    console.log("DO NOT PERFORM THE TARGETED CORRECTION YET.");
    console.log("");
    console.log("Failed checks:");

    for (const item of checks.filter(
      (check) => !check.passed,
    )) {
      console.log(
        `- ${item.name}: ${item.detail}`,
      );
    }
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