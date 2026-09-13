import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

/*
 * ============================================================================
 * GLOBAL GEOGRAPHIC HIERARCHY AUDIT
 * ============================================================================
 *
 * READ-ONLY AUDIT
 * NO DATABASE CHANGES
 *
 * Hierarchy:
 *
 * County
 *   |
 *   +-- SubCounty
 *   |
 *   +-- Constituency
 *   |
 *   +-- Ward
 *
 * Expected national totals:
 *
 * Counties       = 47
 * SubCounties    = 302
 * Constituencies = 297
 * Wards          = 1450
 *
 * Three duplicate ward-name groups have been independently verified against
 * the authoritative:
 *
 * prisma/data/kenya-wards-1450.geojson
 *
 * They are legitimate distinct wards and MUST NOT be treated as duplicates.
 *
 * 1. NYERI
 *    Ward ID 1364 | sourceGid 484 | Iria-ini Ward
 *    Ward ID 1819 | sourceGid 479 | Iriaini Ward
 *
 * 2. NAKURU
 *    Ward ID 1535 | sourceGid 1750 | Biashara Ward
 *    Ward ID 1831 | sourceGid 1790 | Biashara Ward
 *
 * 3. KISII
 *    Ward ID 1942 | sourceGid 2006 | Kisii Central Ward
 *    Ward ID 2628 | sourceGid 1994 | Kisii Central Ward
 *
 * These six records are NOT duplicates.
 *
 * ============================================================================
 */

const EXPECTED_COUNTIES = 47;
const EXPECTED_SUBCOUNTIES = 302;
const EXPECTED_CONSTITUENCIES = 297;
const EXPECTED_WARDS = 1450;

/*
 * ============================================================================
 * AUTHORITATIVELY VERIFIED SAME-NAME WARD GROUPS
 * ============================================================================
 */

const LEGITIMATE_WARD_GROUPS = [
  {
    label: "Nyeri — Iria-ini / Iriaini",
    countyId: 69,
    wardIds: [1364, 1819],
    sourceGids: [484, 479],
    sourceUids: [
      "mKOh6Ubsn0x",
      "kgPF6QHfrWT",
    ],
  },

  {
    label: "Nakuru — Biashara",
    countyId: 77,
    wardIds: [1535, 1831],
    sourceGids: [1750, 1790],
    sourceUids: [
      "lW5g42Bv4Rk",
      "BA2zKL0pmeI",
    ],
  },

  {
    label: "Kisii — Kisii Central",
    countyId: 87,
    wardIds: [1942, 2628],
    sourceGids: [2006, 1994],
    sourceUids: [
      "erVsVGwRwBc",
      "IO0zXx5HVO2",
    ],
  },
];

/*
 * ============================================================================
 * NORMALIZATION
 * ============================================================================
 */

function normalizeName(
  value: string | null | undefined,
): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/*
 * ============================================================================
 * SORT / SET HELPERS
 * ============================================================================
 */

function sortedNumbers(
  values: number[],
): number[] {
  return [...values].sort(
    (a, b) => a - b,
  );
}

function sortedStrings(
  values: string[],
): string[] {
  return [...values].sort();
}

function sameNumberArray(
  a: number[],
  b: number[],
): boolean {
  return (
    JSON.stringify(
      sortedNumbers(a),
    ) ===
    JSON.stringify(
      sortedNumbers(b),
    )
  );
}

function sameStringArray(
  a: string[],
  b: string[],
): boolean {
  return (
    JSON.stringify(
      sortedStrings(a),
    ) ===
    JSON.stringify(
      sortedStrings(b),
    )
  );
}

/*
 * ============================================================================
 * AUTHORITATIVE GROUP MATCH
 * ============================================================================
 *
 * We deliberately identify the three verified groups using:
 *
 * - County ID
 * - Ward IDs
 * - sourceGids
 * - sourceUids
 *
 * This is much safer than relying only on spelling.
 * ============================================================================
 */

function identifyLegitimateGroup(
  wardIds: number[],
  sourceGids: number[],
  sourceUids: string[],
  countyId: number,
) {
  for (
    const group of LEGITIMATE_WARD_GROUPS
  ) {
    if (
      group.countyId !== countyId
    ) {
      continue;
    }

    if (
      !sameNumberArray(
        wardIds,
        group.wardIds,
      )
    ) {
      continue;
    }

    if (
      !sameNumberArray(
        sourceGids,
        group.sourceGids,
      )
    ) {
      continue;
    }

    if (
      !sameStringArray(
        sourceUids,
        group.sourceUids,
      )
    ) {
      continue;
    }

    return group;
  }

  return null;
}

/*
 * ============================================================================
 * MAIN
 * ============================================================================
 */

async function main() {
  console.log("");
  console.log(
    "======================================================",
  );
  console.log(
    "GLOBAL GEOGRAPHIC HIERARCHY AUDIT",
  );
  console.log(
    "======================================================",
  );

  console.log("");
  console.log(
    "READ-ONLY AUDIT - NO DATABASE CHANGES",
  );

  /*
   * --------------------------------------------------------------------------
   * LOAD DATA
   * --------------------------------------------------------------------------
   */

  const [
    counties,
    subCounties,
    constituencies,
    wards,
  ] = await Promise.all([
    prisma.county.findMany({
      orderBy: {
        id: "asc",
      },
    }),

    prisma.subCounty.findMany({
      include: {
        county: true,
        wards: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    }),

    prisma.constituency.findMany({
      include: {
        county: true,
        wards: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    }),

    prisma.ward.findMany({
      include: {
        county: true,
        subCounty: {
          include: {
            county: true,
          },
        },
        constituency: {
          include: {
            county: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    }),
  ]);

  console.log("");
  console.log(
    `Counties: ${counties.length}`,
  );

  console.log(
    `SubCounties: ${subCounties.length}`,
  );

  console.log(
    `Constituencies: ${constituencies.length}`,
  );

  console.log(
    `Wards: ${wards.length}`,
  );

  let reviewConditions = 0;

  /*
   * ==========================================================================
   * COUNTY AUDIT
   * ==========================================================================
   */

  console.log("");
  console.log(
    "--------------------------------------------------",
  );
  console.log(
    "COUNTY AUDIT",
  );
  console.log(
    "--------------------------------------------------",
  );

  const countyGroups =
    new Map<
      string,
      typeof counties
    >();

  for (
    const county of counties
  ) {
    const key =
      normalizeName(
        county.name,
      );

    const group =
      countyGroups.get(key) ??
      [];

    group.push(county);

    countyGroups.set(
      key,
      group,
    );
  }

  const duplicateCountyGroups =
    [
      ...countyGroups.values(),
    ].filter(
      (group) =>
        group.length > 1,
    );

  console.log(
    `County normalized duplicate groups: ${duplicateCountyGroups.length}`,
  );

  if (
    duplicateCountyGroups.length ===
    0
  ) {
    console.log(
      "PASS: No normalized duplicate Counties.",
    );
  } else {
    reviewConditions +=
      duplicateCountyGroups.length;

    console.log(
      "RESULT: REVIEW REQUIRED",
    );

    for (
      const group of
        duplicateCountyGroups
    ) {
      console.log(
        group
          .map(
            (county) =>
              `ID ${county.id}: ${county.name}`,
          )
          .join(" | "),
      );
    }
  }

  /*
   * ==========================================================================
   * SUBCOUNTY AUDIT
   * ==========================================================================
   */

  console.log("");
  console.log(
    "--------------------------------------------------",
  );
  console.log(
    "SUBCOUNTY AUDIT",
  );
  console.log(
    "--------------------------------------------------",
  );

  const orphanSubCounties =
    subCounties.filter(
      (subCounty) =>
        subCounty.wards.length ===
        0,
    );

  const invalidSubCountyAssignments =
    subCounties.filter(
      (subCounty) =>
        !subCounty.county ||
        subCounty.countyId !==
          subCounty.county.id,
    );

  const subCountyGroups =
    new Map<
      string,
      typeof subCounties
    >();

  for (
    const subCounty of
      subCounties
  ) {
    const countyKey =
      normalizeName(
        subCounty.county?.name,
      );

    const subCountyKey =
      normalizeName(
        subCounty.name,
      );

    const key =
      `${countyKey}::${subCountyKey}`;

    const group =
      subCountyGroups.get(key) ??
      [];

    group.push(subCounty);

    subCountyGroups.set(
      key,
      group,
    );
  }

  const duplicateSubCountyGroups =
    [
      ...subCountyGroups.values(),
    ].filter(
      (group) =>
        group.length > 1,
    );

  console.log(
    `SubCounty orphans: ${orphanSubCounties.length}`,
  );

  console.log(
    `SubCounty normalized duplicate groups: ${duplicateSubCountyGroups.length}`,
  );

  console.log(
    `Invalid SubCounty → County assignments: ${invalidSubCountyAssignments.length}`,
  );

  if (
    orphanSubCounties.length === 0
  ) {
    console.log(
      "PASS: No orphan SubCounties.",
    );
  } else {
    reviewConditions +=
      orphanSubCounties.length;
  }

  if (
    duplicateSubCountyGroups.length ===
    0
  ) {
    console.log(
      "PASS: No normalized duplicate SubCounties.",
    );
  } else {
    reviewConditions +=
      duplicateSubCountyGroups.length;
  }

  if (
    invalidSubCountyAssignments.length ===
    0
  ) {
    console.log(
      "PASS: All SubCounty → County assignments are valid.",
    );
  } else {
    reviewConditions +=
      invalidSubCountyAssignments.length;
  }

  /*
   * ==========================================================================
   * CONSTITUENCY AUDIT
   * ==========================================================================
   */

  console.log("");
  console.log(
    "--------------------------------------------------",
  );
  console.log(
    "CONSTITUENCY AUDIT",
  );
  console.log(
    "--------------------------------------------------",
  );

  const orphanConstituencies =
    constituencies.filter(
      (constituency) =>
        constituency.wards.length ===
        0,
    );

  const invalidConstituencyAssignments =
    constituencies.filter(
      (constituency) =>
        !constituency.county ||
        constituency.countyId !==
          constituency.county.id,
    );

  const constituencyGroups =
    new Map<
      string,
      typeof constituencies
    >();

  for (
    const constituency of
      constituencies
  ) {
    const countyKey =
      normalizeName(
        constituency.county?.name,
      );

    const constituencyKey =
      normalizeName(
        constituency.name,
      );

    const key =
      `${countyKey}::${constituencyKey}`;

    const group =
      constituencyGroups.get(
        key,
      ) ?? [];

    group.push(
      constituency,
    );

    constituencyGroups.set(
      key,
      group,
    );
  }

  const duplicateConstituencyGroups =
    [
      ...constituencyGroups.values(),
    ].filter(
      (group) =>
        group.length > 1,
    );

  console.log(
    `Constituency orphans: ${orphanConstituencies.length}`,
  );

  console.log(
    `Constituency normalized duplicate groups: ${duplicateConstituencyGroups.length}`,
  );

  console.log(
    `Invalid Constituency → County assignments: ${invalidConstituencyAssignments.length}`,
  );

  if (
    orphanConstituencies.length === 0
  ) {
    console.log(
      "PASS: No orphan Constituencies.",
    );
  } else {
    reviewConditions +=
      orphanConstituencies.length;
  }

  if (
    duplicateConstituencyGroups.length ===
    0
  ) {
    console.log(
      "PASS: No normalized duplicate Constituencies.",
    );
  } else {
    reviewConditions +=
      duplicateConstituencyGroups.length;
  }

  if (
    invalidConstituencyAssignments.length ===
    0
  ) {
    console.log(
      "PASS: All Constituency → County assignments are valid.",
    );
  } else {
    reviewConditions +=
      invalidConstituencyAssignments.length;
  }

  /*
   * ==========================================================================
   * WARD / CROSS-HIERARCHY AUDIT
   * ==========================================================================
   */

  console.log("");
  console.log(
    "--------------------------------------------------",
  );
  console.log(
    "WARD / CROSS-HIERARCHY AUDIT",
  );
  console.log(
    "--------------------------------------------------",
  );

  const invalidWardSubCounty =
    wards.filter(
      (ward) =>
        !ward.subCounty ||
        ward.subCounty.countyId !==
          ward.countyId,
    );

  const invalidWardConstituency =
    wards.filter(
      (ward) =>
        !ward.constituency ||
        ward.constituency.countyId !==
          ward.countyId,
    );

  const wardSubCountyCountyMismatches =
    wards.filter(
      (ward) =>
        ward.subCounty &&
        ward.subCounty.countyId !==
          ward.countyId,
    );

  const wardConstituencyCountyMismatches =
    wards.filter(
      (ward) =>
        ward.constituency &&
        ward.constituency.countyId !==
          ward.countyId,
    );

  const crossHierarchyMismatches =
    wards.filter(
      (ward) =>
        ward.subCounty &&
        ward.constituency &&
        ward.subCounty.countyId !==
          ward.constituency.countyId,
    );

  console.log(
    `Wards with NULL/invalid SubCounty: ${invalidWardSubCounty.length}`,
  );

  console.log(
    `Wards with NULL/invalid Constituency: ${invalidWardConstituency.length}`,
  );

  console.log(
    `Ward/SubCounty/County mismatches: ${wardSubCountyCountyMismatches.length}`,
  );

  console.log(
    `Ward/Constituency/County mismatches: ${wardConstituencyCountyMismatches.length}`,
  );

  console.log(
    `Cross-hierarchy mismatches: ${crossHierarchyMismatches.length}`,
  );

  if (
    invalidWardSubCounty.length ===
    0
  ) {
    console.log(
      "PASS: Every Ward has a valid SubCounty.",
    );
  } else {
    reviewConditions +=
      invalidWardSubCounty.length;
  }

  if (
    invalidWardConstituency.length ===
    0
  ) {
    console.log(
      "PASS: Every Ward has a valid Constituency.",
    );
  } else {
    reviewConditions +=
      invalidWardConstituency.length;
  }

  if (
    wardSubCountyCountyMismatches.length ===
    0
  ) {
    console.log(
      "PASS: Ward/SubCounty/County hierarchy is consistent.",
    );
  } else {
    reviewConditions +=
      wardSubCountyCountyMismatches.length;
  }

  if (
    wardConstituencyCountyMismatches.length ===
    0
  ) {
    console.log(
      "PASS: Ward/Constituency/County hierarchy is consistent.",
    );
  } else {
    reviewConditions +=
      wardConstituencyCountyMismatches.length;
  }

  if (
    crossHierarchyMismatches.length ===
    0
  ) {
    console.log(
      "PASS: Cross-hierarchy County relationships are consistent.",
    );
  } else {
    reviewConditions +=
      crossHierarchyMismatches.length;
  }

  /*
   * ==========================================================================
   * WARD NAME DUPLICATE AUDIT
   * ==========================================================================
   */

  console.log("");
  console.log(
    "--------------------------------------------------",
  );
  console.log(
    "WARD NAME DUPLICATE AUDIT",
  );
  console.log(
    "--------------------------------------------------",
  );

  /*
   * Important:
   *
   * Ward names are only considered duplicate candidates within the same
   * County after normalization.
   */

  const wardGroups =
    new Map<
      string,
      typeof wards
    >();

  for (
    const ward of wards
  ) {
    const countyName =
      ward.county?.name ??
      ward.subCounty?.county?.name ??
      ward.constituency?.county?.name ??
      "";

    const key =
      `${normalizeName(countyName)}::${normalizeName(ward.name)}`;

    const group =
      wardGroups.get(key) ??
      [];

    group.push(ward);

    wardGroups.set(
      key,
      group,
    );
  }

  const duplicateWardGroups =
    [
      ...wardGroups.values(),
    ].filter(
      (group) =>
        group.length > 1,
    );

  console.log(
    `Duplicate ward-name groups: ${duplicateWardGroups.length}`,
  );

  let legitimateSameNameGroups = 0;
  let groupsRequiringReview = 0;

  /*
   * Track the authoritative groups explicitly.
   *
   * This guarantees that all three verified groups are reported even if
   * normalization of their names changes in the future.
   */

  const verifiedGroupsFound =
    new Set<string>();

  /*
   * First inspect the naturally detected duplicate groups.
   */

  for (
    const group of
      duplicateWardGroups
  ) {
    const countyId =
      group[0].countyId;

    const wardIds =
      group.map(
        (ward) => ward.id,
      );

    const sourceGids =
      group
        .map(
          (ward) =>
            ward.sourceGid,
        )
        .filter(
          (
            gid,
          ): gid is number =>
            gid !== null,
        );

    const sourceUids =
      group
        .map(
          (ward) =>
            ward.sourceUid,
        )
        .filter(
          (
            uid,
          ): uid is string =>
            Boolean(uid),
        );

    const legitimate =
      identifyLegitimateGroup(
        wardIds,
        sourceGids,
        sourceUids,
        countyId,
      );

    if (legitimate) {
      legitimateSameNameGroups++;

      verifiedGroupsFound.add(
        legitimate.label,
      );

      console.log("");
      console.log(
        `${legitimate.label} duplicate-name group:`,
      );

      for (
        const ward of group
      ) {
        console.log(
          `  ID ${ward.id}: ${ward.name}` +
          ` | SubCounty: ${
            ward.subCounty?.name ??
            "NULL"
          }` +
          ` | Constituency: ${
            ward.constituency?.name ??
            "NULL"
          }` +
          ` | sourceGid: ${
            ward.sourceGid ??
            "NULL"
          }` +
          ` | sourceUid: ${
            ward.sourceUid ??
            "NULL"
          }`,
        );
      }

      console.log("");
      console.log(
        "RESULT: LEGITIMATE SAME-NAME WARDS",
      );

      console.log(
        "Verified against the authoritative 1,450-ward GeoJSON.",
      );

      console.log(
        "DO NOT merge or delete these wards.",
      );
    } else {
      groupsRequiringReview++;

      const countyName =
        group[0].county?.name ??
        "UNKNOWN";

      console.log("");
      console.log(
        `${countyName} — ${group[0].name} duplicate-name group:`,
      );

      for (
        const ward of group
      ) {
        console.log(
          `  ID ${ward.id}: ${ward.name}` +
          ` | SubCounty: ${
            ward.subCounty?.name ??
            "NULL"
          }` +
          ` | Constituency: ${
            ward.constituency?.name ??
            "NULL"
          }` +
          ` | sourceGid: ${
            ward.sourceGid ??
            "NULL"
          }` +
          ` | sourceUid: ${
            ward.sourceUid ??
            "NULL"
          }`,
        );
      }

      console.log("");
      console.log(
        "RESULT: REVIEW REQUIRED",
      );

      console.log(
        "This duplicate-name group has not been authoritatively classified.",
      );
    }
  }

  /*
   * --------------------------------------------------------------------------
   * EXPLICIT VERIFICATION OF ALL THREE KNOWN GROUPS
   * --------------------------------------------------------------------------
   *
   * This is the important correction.
   *
   * Even if a duplicate group is not discovered by the normalized name
   * grouping, we independently verify the six known authoritative records.
   * --------------------------------------------------------------------------
   */

  for (
    const legitimate of
      LEGITIMATE_WARD_GROUPS
  ) {
    if (
      verifiedGroupsFound.has(
        legitimate.label,
      )
    ) {
      continue;
    }

    const matchingWards =
      wards.filter(
        (ward) =>
          legitimate.wardIds.includes(
            ward.id,
          ),
      );

    const wardIds =
      matchingWards.map(
        (ward) => ward.id,
      );

    const sourceGids =
      matchingWards
        .map(
          (ward) =>
            ward.sourceGid,
        )
        .filter(
          (
            gid,
          ): gid is number =>
            gid !== null,
        );

    const sourceUids =
      matchingWards
        .map(
          (ward) =>
            ward.sourceUid,
        )
        .filter(
          (
            uid,
          ): uid is string =>
            Boolean(uid),
        );

    const verified =
      matchingWards.length === 2 &&
      identifyLegitimateGroup(
        wardIds,
        sourceGids,
        sourceUids,
        legitimate.countyId,
      ) !== null;

    if (verified) {
      legitimateSameNameGroups++;

      verifiedGroupsFound.add(
        legitimate.label,
      );

      console.log("");
      console.log(
        `${legitimate.label}:`,
      );

      console.log(
        "RESULT: LEGITIMATE SAME-NAME WARDS",
      );

      console.log(
        "Verified authoritative records are present in the database.",
      );

      console.log(
        `Ward IDs: ${legitimate.wardIds.join(", ")}`,
      );

      console.log(
        `sourceGIDs: ${legitimate.sourceGids.join(", ")}`,
      );

      console.log(
        "DO NOT merge or delete these wards.",
      );
    } else {
      console.log("");
      console.log(
        `WARNING: Expected legitimate group not fully verified: ${legitimate.label}`,
      );

      reviewConditions++;
    }
  }

  /*
   * Only unverified duplicate groups create review conditions.
   *
   * The three legitimate groups do NOT create review conditions.
   */

  reviewConditions +=
    groupsRequiringReview;

  /*
   * ==========================================================================
   * EXPECTED NATIONAL TOTALS
   * ==========================================================================
   */

  console.log("");
  console.log(
    "--------------------------------------------------",
  );
  console.log(
    "EXPECTED NATIONAL TOTALS",
  );
  console.log(
    "--------------------------------------------------",
  );

  const countyTotalPass =
    counties.length ===
    EXPECTED_COUNTIES;

  const subCountyTotalPass =
    subCounties.length ===
    EXPECTED_SUBCOUNTIES;

  const constituencyTotalPass =
    constituencies.length ===
    EXPECTED_CONSTITUENCIES;

  const wardTotalPass =
    wards.length ===
    EXPECTED_WARDS;

  console.log(
    `Counties: ${counties.length} / ${EXPECTED_COUNTIES} - ${
      countyTotalPass
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `SubCounties: ${subCounties.length} / ${EXPECTED_SUBCOUNTIES} - ${
      subCountyTotalPass
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `Constituencies: ${constituencies.length} / ${EXPECTED_CONSTITUENCIES} - ${
      constituencyTotalPass
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `Wards: ${wards.length} / ${EXPECTED_WARDS} - ${
      wardTotalPass
        ? "PASS"
        : "FAIL"
    }`,
  );

  if (!countyTotalPass) {
    reviewConditions++;
  }

  if (!subCountyTotalPass) {
    reviewConditions++;
  }

  if (!constituencyTotalPass) {
    reviewConditions++;
  }

  if (!wardTotalPass) {
    reviewConditions++;
  }

  /*
   * ==========================================================================
   * MAKUENI SPECIAL CHECK
   * ==========================================================================
   */

  console.log("");
  console.log(
    "--------------------------------------------------",
  );
  console.log(
    "MAKUENI SPECIAL CHECK",
  );
  console.log(
    "--------------------------------------------------",
  );

  const makueni =
    counties.find(
      (county) =>
        normalizeName(
          county.name,
        ) ===
        normalizeName(
          "Makueni",
        ),
    );

  if (!makueni) {
    console.log(
      "Makueni: FAIL - county not found",
    );

    reviewConditions++;
  } else {
    const makueniSubCounties =
      subCounties.filter(
        (subCounty) =>
          subCounty.countyId ===
          makueni.id,
      );

    const makueniWards =
      wards.filter(
        (ward) =>
          ward.countyId ===
          makueni.id,
      );

    console.log(
      `Makueni: ${makueniSubCounties.length} SubCounties, ${makueniWards.length} wards`,
    );

    const makueniPass =
      makueniSubCounties.length ===
        6 &&
      makueniWards.length ===
        30;

    console.log(
      `Makueni hierarchy: ${
        makueniPass
          ? "PASS"
          : "FAIL"
      }`,
    );

    if (!makueniPass) {
      reviewConditions++;
    }

    /*
     * Kibwezi 666 was deleted during the previous cleanup.
     */

    const kibwezi666 =
      subCounties.find(
        (subCounty) =>
          subCounty.id === 666,
      );

    if (!kibwezi666) {
      console.log(
        "Kibwezi legacy SubCounty 666: PASS (absent)",
      );
    } else {
      console.log(
        "Kibwezi legacy SubCounty 666: FAIL (present)",
      );

      reviewConditions++;
    }
  }

  /*
   * ==========================================================================
   * FINAL RESULT
   * ==========================================================================
   */

  console.log("");
  console.log(
    "======================================================",
  );
  console.log(
    "FINAL RESULT",
  );
  console.log(
    "======================================================",
  );

  console.log(
    `Legitimate same-name ward groups: ${legitimateSameNameGroups}`,
  );

  console.log(
    `Groups requiring review: ${groupsRequiringReview}`,
  );

  console.log(
    `Review conditions: ${reviewConditions}`,
  );

  console.log("");

  /*
   * PASS requires all three authoritative legitimate groups to be present.
   */

  const allThreeLegitimateGroupsFound =
    verifiedGroupsFound.size === 3;

  if (
    reviewConditions === 0 &&
    allThreeLegitimateGroupsFound
  ) {
    console.log(
      "FINAL RESULT: PASS",
    );

    console.log(
      "County → SubCounty → Constituency → Ward hierarchy is clean.",
    );

    console.log(
      "All three duplicate-name ward groups are legitimate distinct wards.",
    );

    console.log(
      "No ward repair is recommended.",
    );
  } else {
    console.log(
      "FINAL RESULT: REVIEW REQUIRED",
    );

    if (
      !allThreeLegitimateGroupsFound
    ) {
      console.log(
        "Not all three authoritative legitimate same-name groups were verified.",
      );
    }

    console.log(
      "One or more hierarchy audit conditions require attention.",
    );
  }

  console.log("");
  console.log(
    "DATABASE CHANGES: 0",
  );
}

/*
 * ============================================================================
 * EXECUTION
 * ============================================================================
 */

main()
  .catch((error) => {
    console.error("");
    console.error(
      "GLOBAL GEOGRAPHIC HIERARCHY AUDIT FAILED",
    );

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });