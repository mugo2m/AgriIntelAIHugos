import prisma from "../lib/prisma";

/**
 * ============================================================
 * EXACT SUBCOUNTY DUPLICATE VERIFICATION AUDIT
 * ============================================================
 *
 * PURPOSE
 * -------
 * Verify the 21 SubCounty records previously classified as
 * EXACT DUPLICATE candidates.
 *
 * IMPORTANT:
 * READ-ONLY — NO DATABASE CHANGES
 *
 * This script DOES NOT:
 * - update records
 * - delete records
 * - merge records
 * - migrate records
 * - seed records
 *
 * It only reads the database and reports evidence.
 *
 * ============================================================
 */

type Candidate = {
  county: string;
  emptyId: number;
  emptyName: string;
  expectedPopulatedId: number;
};

/**
 * ============================================================
 * 21 EXACT DUPLICATE CANDIDATES
 * ============================================================
 */

const candidates: Candidate[] = [
  // MIGORI
  {
    county: "Migori",
    emptyId: 1219,
    emptyName: "Kuria East",
    expectedPopulatedId: 263,
  },
  {
    county: "Migori",
    emptyId: 1220,
    emptyName: "Kuria West",
    expectedPopulatedId: 262,
  },
  {
    county: "Migori",
    emptyId: 1223,
    emptyName: "Suna East",
    expectedPopulatedId: 258,
  },
  {
    county: "Migori",
    emptyId: 1224,
    emptyName: "Suna West",
    expectedPopulatedId: 259,
  },
  {
    county: "Migori",
    emptyId: 1218,
    emptyName: "Awendo",
    expectedPopulatedId: 257,
  },
  {
    county: "Migori",
    emptyId: 1221,
    emptyName: "Nyatike",
    expectedPopulatedId: 261,
  },
  {
    county: "Migori",
    emptyId: 1222,
    emptyName: "Rongo",
    expectedPopulatedId: 256,
  },
  {
    county: "Migori",
    emptyId: 1225,
    emptyName: "Uriri",
    expectedPopulatedId: 260,
  },

  // HOMA BAY
  {
    county: "Homa Bay",
    emptyId: 1211,
    emptyName: "Ndhiwa",
    expectedPopulatedId: 272,
  },
  {
    county: "Homa Bay",
    emptyId: 1215,
    emptyName: "Rangwe",
    expectedPopulatedId: 270,
  },

  // MACHAKOS
  {
    county: "Machakos",
    emptyId: 1023,
    emptyName: "Kangundo",
    expectedPopulatedId: 306,
  },
  {
    county: "Machakos",
    emptyId: 1024,
    emptyName: "Kathiani",
    expectedPopulatedId: 308,
  },
  {
    county: "Machakos",
    emptyId: 1025,
    emptyName: "Machakos",
    expectedPopulatedId: 265,
  },
  {
    county: "Machakos",
    emptyId: 1026,
    emptyName: "Masinga",
    expectedPopulatedId: 304,
  },
  {
    county: "Machakos",
    emptyId: 1027,
    emptyName: "Matungulu",
    expectedPopulatedId: 307,
  },
  {
    county: "Machakos",
    emptyId: 1028,
    emptyName: "Mwala",
    expectedPopulatedId: 266,
  },
  {
    county: "Machakos",
    emptyId: 1029,
    emptyName: "Yatta",
    expectedPopulatedId: 305,
  },
  {
    county: "Machakos",
    emptyId: 1021,
    emptyName: "Athi River",
    expectedPopulatedId: 264,
  },

  // VIHIGA
  {
    county: "Vihiga",
    emptyId: 1176,
    emptyName: "Emuhaya",
    expectedPopulatedId: 277,
  },
  {
    county: "Vihiga",
    emptyId: 1178,
    emptyName: "Sabatia",
    expectedPopulatedId: 274,
  },
  {
    county: "Vihiga",
    emptyId: 1177,
    emptyName: "Vihiga",
    expectedPopulatedId: 278,
  },
];

/**
 * ============================================================
 * NORMALIZATION
 * ============================================================
 */

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/\bsub[-\s]?county\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ============================================================
 * DISPLAY HELPERS
 * ============================================================
 */

function line(char = "-", length = 78): void {
  console.log(char.repeat(length));
}

function printWardList(
  wards: Array<{
    id: number;
    name: string;
    constituency: {
      id: number;
      name: string;
    };
  }>
): void {
  if (wards.length === 0) {
    console.log("      None");
    return;
  }

  for (const ward of wards) {
    console.log(
      `      Ward ${ward.id}: ${ward.name} → Constituency ${ward.constituency.id}: ${ward.constituency.name}`
    );
  }
}

function printConstituencySummary(
  wards: Array<{
    constituency: {
      id: number;
      name: string;
    };
  }>
): void {
  if (wards.length === 0) {
    console.log("      None");
    return;
  }

  const grouped = new Map<
    number,
    {
      id: number;
      name: string;
      wards: number;
    }
  >();

  for (const ward of wards) {
    const constituency = ward.constituency;
    const existing = grouped.get(constituency.id);

    if (existing) {
      existing.wards += 1;
    } else {
      grouped.set(constituency.id, {
        id: constituency.id,
        name: constituency.name,
        wards: 1,
      });
    }
  }

  for (const item of [...grouped.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    console.log(
      `      Constituency ${item.id}: ${item.name} (${item.wards} ward${
        item.wards === 1 ? "" : "s"
      })`
    );
  }
}

/**
 * ============================================================
 * MAIN
 * ============================================================
 */

async function main(): Promise<void> {
  console.log();
  line("=");
  console.log("EXACT SUBCOUNTY DUPLICATE VERIFICATION AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  line("=");
  console.log();

  console.log(`Candidates under verification: ${candidates.length}`);
  console.log();

  /**
   * ----------------------------------------------------------
   * DATABASE SNAPSHOT
   * ----------------------------------------------------------
   */

  const [
    countyCount,
    subCountyCount,
    constituencyCount,
    wardCount,
  ] = await Promise.all([
    prisma.county.count(),
    prisma.subCounty.count(),
    prisma.constituency.count(),
    prisma.ward.count(),
  ]);

  console.log("DATABASE SNAPSHOT");
  console.log(`Counties:        ${countyCount}`);
  console.log(`SubCounties:     ${subCountyCount}`);
  console.log(`Constituencies:  ${constituencyCount}`);
  console.log(`Wards:           ${wardCount}`);
  console.log();

  line();

  /**
   * ----------------------------------------------------------
   * LOAD EMPTY AND POPULATED RECORDS
   * ----------------------------------------------------------
   */

  const emptyIds = candidates.map(
    (candidate) => candidate.emptyId
  );

  const populatedIds = candidates.map(
    (candidate) => candidate.expectedPopulatedId
  );

  const allIds = [
    ...new Set([
      ...emptyIds,
      ...populatedIds,
    ]),
  ];

  const subCounties = await prisma.subCounty.findMany({
    where: {
      id: {
        in: allIds,
      },
    },

    orderBy: {
      id: "asc",
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

      _count: {
        select: {
          wards: true,
          farmers: true,
          farms: true,
          businessPartners: true,
          destinationTransactions: true,
          sourceTransactions: true,
        },
      },

      wards: {
        orderBy: {
          id: "asc",
        },

        select: {
          id: true,
          name: true,

          constituency: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const byId = new Map(
    subCounties.map((subCounty) => [
      subCounty.id,
      subCounty,
    ])
  );

  /**
   * ----------------------------------------------------------
   * FINAL COUNTERS
   * ----------------------------------------------------------
   */

  let safeMergeCandidates = 0;
  let reviewCandidates = 0;
  let doNotTouchCandidates = 0;

  /**
   * ==========================================================
   * VERIFY EACH CANDIDATE
   * ==========================================================
   */

  for (const candidate of candidates) {
    console.log();
    line("=");
    console.log(
      `${candidate.county.toUpperCase()} — ${candidate.emptyName}`
    );
    line("=");

    /**
     * --------------------------------------------------------
     * EMPTY / LEGACY RECORD
     * --------------------------------------------------------
     */

    const empty = byId.get(candidate.emptyId);

    console.log();
    console.log("EMPTY / LEGACY RECORD");
    console.log(`  Expected ID:    ${candidate.emptyId}`);
    console.log(`  Expected Name:  ${candidate.emptyName}`);

    if (!empty) {
      console.log();
      console.log("  STATUS: RECORD NOT FOUND");
      console.log();
      console.log("RECOMMENDATION: DO NOT TOUCH");

      doNotTouchCandidates += 1;

      continue;
    }

    console.log(`  Actual ID:      ${empty.id}`);
    console.log(`  Actual Name:    ${empty.name}`);
    console.log(`  County ID:      ${empty.countyId}`);
    console.log(`  County:         ${empty.county.name}`);
    console.log(
      `  Normalized:     ${normalize(empty.name)}`
    );

    console.log();
    console.log("  RELATIONSHIP COUNTS");
    console.log(
      `    Wards:                    ${empty._count.wards}`
    );
    console.log(
      `    Farmers:                  ${empty._count.farmers}`
    );
    console.log(
      `    Farms:                    ${empty._count.farms}`
    );
    console.log(
      `    Business Partners:        ${empty._count.businessPartners}`
    );
    console.log(
      `    Destination Transactions: ${empty._count.destinationTransactions}`
    );
    console.log(
      `    Source Transactions:      ${empty._count.sourceTransactions}`
    );

    console.log();
    console.log("  WARDS ATTACHED TO EMPTY RECORD");
    printWardList(empty.wards);

    console.log();
    console.log("  CONSTITUENCIES THROUGH EMPTY RECORD");
    printConstituencySummary(empty.wards);

    /**
     * --------------------------------------------------------
     * POPULATED / CANONICAL RECORD
     * --------------------------------------------------------
     */

    const expected = byId.get(
      candidate.expectedPopulatedId
    );

    console.log();
    console.log("POPULATED / EXPECTED CANONICAL RECORD");

    if (!expected) {
      console.log(
        `  Expected populated SubCounty ID ${candidate.expectedPopulatedId} was NOT FOUND.`
      );

      console.log();
      console.log("RECOMMENDATION: DO NOT TOUCH");

      doNotTouchCandidates += 1;

      continue;
    }

    console.log(`  ID:             ${expected.id}`);
    console.log(`  Name:           ${expected.name}`);
    console.log(`  County ID:      ${expected.countyId}`);
    console.log(`  County:         ${expected.county.name}`);
    console.log(
      `  Normalized:     ${normalize(expected.name)}`
    );

    console.log();
    console.log("  RELATIONSHIP COUNTS");
    console.log(
      `    Wards:                    ${expected._count.wards}`
    );
    console.log(
      `    Farmers:                  ${expected._count.farmers}`
    );
    console.log(
      `    Farms:                    ${expected._count.farms}`
    );
    console.log(
      `    Business Partners:        ${expected._count.businessPartners}`
    );
    console.log(
      `    Destination Transactions: ${expected._count.destinationTransactions}`
    );
    console.log(
      `    Source Transactions:      ${expected._count.sourceTransactions}`
    );

    console.log();
    console.log("  WARDS ATTACHED TO POPULATED RECORD");
    printWardList(expected.wards);

    console.log();
    console.log("  CONSTITUENCIES THROUGH POPULATED RECORD");
    printConstituencySummary(expected.wards);

    /**
     * --------------------------------------------------------
     * BASIC VERIFICATION TESTS
     * --------------------------------------------------------
     */

    const sameCounty =
      empty.countyId === expected.countyId &&
      normalize(empty.county.name) ===
        normalize(expected.county.name);

    const sameNormalizedName =
      normalize(empty.name) ===
      normalize(expected.name);

    const emptyHasNoDirectRelationships =
      empty._count.wards === 0 &&
      empty._count.farmers === 0 &&
      empty._count.farms === 0 &&
      empty._count.businessPartners === 0 &&
      empty._count.destinationTransactions === 0 &&
      empty._count.sourceTransactions === 0;

    const populatedHasWards =
      expected._count.wards > 0;

    const populatedHasUsefulData =
      expected._count.wards > 0 ||
      expected._count.farmers > 0 ||
      expected._count.farms > 0 ||
      expected._count.businessPartners > 0 ||
      expected._count.destinationTransactions > 0 ||
      expected._count.sourceTransactions > 0;

    /**
     * --------------------------------------------------------
     * WARD NAME COMPARISON
     * --------------------------------------------------------
     */

    const emptyWardNames = new Set(
      empty.wards.map((ward) =>
        normalize(ward.name)
      )
    );

    const populatedWardNames = new Set(
      expected.wards.map((ward) =>
        normalize(ward.name)
      )
    );

    const wardsOnlyOnEmpty =
      [...emptyWardNames].filter(
        (name) =>
          !populatedWardNames.has(name)
      );

    const wardsOnlyOnPopulated =
      [...populatedWardNames].filter(
        (name) =>
          !emptyWardNames.has(name)
      );

    /**
     * --------------------------------------------------------
     * VERIFICATION TESTS OUTPUT
     * --------------------------------------------------------
     */

    console.log();
    line();
    console.log("VERIFICATION TESTS");
    line();

    console.log(
      `  Same County:                       ${
        sameCounty ? "PASS" : "FAIL"
      }`
    );

    console.log(
      `  Same normalized SubCounty name:    ${
        sameNormalizedName ? "PASS" : "FAIL"
      }`
    );

    console.log(
      `  Empty record has no relationships: ${
        emptyHasNoDirectRelationships
          ? "PASS"
          : "FAIL"
      }`
    );

    console.log(
      `  Populated record has wards:        ${
        populatedHasWards
          ? "PASS"
          : "FAIL"
      }`
    );

    console.log(
      `  Populated record has useful data:  ${
        populatedHasUsefulData
          ? "PASS"
          : "FAIL"
      }`
    );

    /**
     * --------------------------------------------------------
     * WARD COMPARISON OUTPUT
     * --------------------------------------------------------
     */

    console.log();
    console.log("WARD COMPARISON");
    line();

    console.log(
      `  Empty record wards:       ${empty.wards.length}`
    );

    console.log(
      `  Populated record wards:   ${expected.wards.length}`
    );

    console.log(
      `  Wards only on empty:      ${wardsOnlyOnEmpty.length}`
    );

    console.log(
      `  Wards only on populated:  ${wardsOnlyOnPopulated.length}`
    );

    if (wardsOnlyOnEmpty.length > 0) {
      console.log();
      console.log(
        "  WARNING — WARDS ONLY ON EMPTY RECORD:"
      );

      for (const ward of wardsOnlyOnEmpty) {
        console.log(`    ${ward}`);
      }
    }

    if (wardsOnlyOnPopulated.length > 0) {
      console.log();
      console.log(
        "  WARDS ONLY ON POPULATED RECORD:"
      );

      for (const ward of wardsOnlyOnPopulated) {
        console.log(`    ${ward}`);
      }
    }

    /**
     * --------------------------------------------------------
     * FINAL RECOMMENDATION
     * --------------------------------------------------------
     */

    let recommendation:
      | "SAFE MERGE CANDIDATE"
      | "REVIEW"
      | "DO NOT TOUCH";

    let reason: string;

    if (
      sameCounty &&
      sameNormalizedName &&
      emptyHasNoDirectRelationships &&
      populatedHasWards &&
      populatedHasUsefulData &&
      wardsOnlyOnEmpty.length === 0
    ) {
      recommendation =
        "SAFE MERGE CANDIDATE";

      reason =
        "The legacy record has no direct relationships, " +
        "belongs to the same county, has the same normalized " +
        "SubCounty name, and the populated record contains " +
        "the current ward hierarchy.";

      safeMergeCandidates += 1;
    } else if (
      sameCounty &&
      sameNormalizedName &&
      emptyHasNoDirectRelationships &&
      populatedHasUsefulData
    ) {
      recommendation = "REVIEW";

      reason =
        "The records appear to represent the same SubCounty, " +
        "but one or more hierarchy or relationship checks " +
        "require manual verification.";

      reviewCandidates += 1;
    } else {
      recommendation = "DO NOT TOUCH";

      reason =
        "The evidence is insufficient to treat this record " +
        "as a safe duplicate.";

      doNotTouchCandidates += 1;
    }

    console.log();
    line("*");
    console.log(
      `RECOMMENDATION: ${recommendation}`
    );
    console.log(`REASON: ${reason}`);
    line("*");
  }

  /**
   * ==========================================================
   * FINAL SUMMARY
   * ==========================================================
   */

  console.log();
  console.log();
  line("=");
  console.log("FINAL VERIFICATION SUMMARY");
  line("=");

  console.log();
  console.log(
    `Total candidates examined: ${candidates.length}`
  );

  console.log(
    `SAFE MERGE CANDIDATE:      ${safeMergeCandidates}`
  );

  console.log(
    `REVIEW:                    ${reviewCandidates}`
  );

  console.log(
    `DO NOT TOUCH:              ${doNotTouchCandidates}`
  );

  console.log();

  console.log("IMPORTANT:");
  console.log("This audit was READ-ONLY.");
  console.log("No database changes were made.");

  console.log();

  console.log(
    "The next repair step must only use candidates"
  );

  console.log(
    "that are independently confirmed as genuine duplicates."
  );

  console.log();
}

/**
 * ============================================================
 * EXECUTION
 * ============================================================
 */

main()
  .catch((error) => {
    console.error();
    console.error("AUDIT FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });