import prisma from "../lib/prisma";

/**
 * ============================================================================
 * BARINGO STRUCTURAL AUDIT
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Read-only diagnostic for detecting SubCounty structures that resemble the
 * problematic Baringo-style administrative split.
 *
 * IMPORTANT
 * ---------
 * THIS SCRIPT DOES NOT:
 *   - update records
 *   - delete records
 *   - move wards
 *   - move SubCounties
 *   - modify Constituencies
 *   - modify Farmers
 *   - modify Farms
 *
 * It ONLY reads the database and reports structural evidence.
 *
 * DETECTION LOGIC
 * ---------------
 *
 * A strong Baringo-like case requires:
 *
 *   1. An EMPTY broad SubCounty.
 *
 *   2. TWO OR MORE populated SubCounties whose names are directional
 *      variants of the broad SubCounty.
 *
 *      Example:
 *
 *          Broad:
 *              Example
 *
 *          Variants:
 *              Example East
 *              Example West
 *
 *   3. At least one constituency associated with the broad administrative
 *      concept.
 *
 *   4. The constituency/constituencies contain wards.
 *
 *   5. Those wards are actually assigned to the directional SubCounties.
 *
 *   6. Preferably, wards belonging to the same constituency are split across
 *      two or more directional SubCounties.
 *
 * This last condition is the most important structural evidence.
 *
 * ============================================================================
 */

type WardInfo = {
  id: number;
  name: string;
  constituencyId: number;
  subCountyId: number | null;
};

type SubCountyInfo = {
  id: number;
  name: string;
  countyId: number;
  wards: WardInfo[];
};

type ConstituencyInfo = {
  id: number;
  name: string;
  countyId: number;
  wards: WardInfo[];
};

type StructuralLevel =
  | "TRUE STRUCTURAL MATCH"
  | "STRONG REVIEW"
  | "NAME-ONLY MATCH";

type Finding = {
  level: StructuralLevel;
  countyId: number;
  countyName: string;

  emptySubCounty: SubCountyInfo;

  variants: SubCountyInfo[];

  matchingConstituencies: Array<{
    constituency: ConstituencyInfo;
    variantWardCounts: Array<{
      subCountyId: number;
      subCountyName: string;
      wards: WardInfo[];
    }>;
  }>;

  nameEvidence: boolean;
  constituencyEvidence: boolean;
  splitWardEvidence: boolean;

  score: number;
};

/**
 * Normalize administrative names.
 *
 * Examples:
 *
 *   "Kipkelion West Sub County"
 *   "Kipkelion West Sub-County"
 *   "Kipkelion West"
 *
 * all become approximately:
 *
 *   "kipkelion west"
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/\bsub[-\s]?county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compact representation for exact base-name comparison.
 */
function compact(value: string): string {
  return normalize(value).replace(/\s/g, "");
}

/**
 * Directional administrative terms.
 *
 * Central is included because Nairobi's Embakasi example contains Central.
 */
const directionWords = new Set([
  "east",
  "west",
  "north",
  "south",
  "central",
]);

/**
 * Remove directional terms.
 */
function stripDirections(value: string): string {
  return normalize(value)
    .split(" ")
    .filter(
      (word) => word.length > 0 && !directionWords.has(word)
    )
    .join(" ");
}

/**
 * Determine whether `specific` is a directional variant of `broad`.
 *
 * Example:
 *
 *   broad    = "Kipkelion"
 *   specific = "Kipkelion East Sub County"
 *
 * returns true.
 *
 * Example:
 *
 *   broad    = "Kipkelion"
 *   specific = "Kericho East"
 *
 * returns false.
 */
function isDirectionalVariant(
  broad: string,
  specific: string
): boolean {
  const broadNormalized = normalize(broad);
  const specificNormalized = normalize(specific);

  if (!broadNormalized || !specificNormalized) {
    return false;
  }

  if (compact(broad) === compact(specific)) {
    return false;
  }

  const broadBase = compact(stripDirections(broad));
  const specificBase = compact(stripDirections(specific));

  if (!broadBase || !specificBase) {
    return false;
  }

  const words = specificNormalized.split(" ");

  const hasDirection = words.some((word) =>
    directionWords.has(word)
  );

  if (!hasDirection) {
    return false;
  }

  return broadBase === specificBase;
}

/**
 * Determine whether two names represent the same administrative concept
 * after removing SubCounty wording.
 */
function sameAdministrativeName(
  a: string,
  b: string
): boolean {
  return compact(a) === compact(b);
}

/**
 * Calculate a simple name similarity score.
 *
 * This is deliberately conservative.
 */
function similarity(
  a: string,
  b: string
): number {
  const aa = compact(a);
  const bb = compact(b);

  if (!aa || !bb) {
    return 0;
  }

  if (aa === bb) {
    return 1;
  }

  if (aa.includes(bb) || bb.includes(aa)) {
    return 0.9;
  }

  const aWords = new Set(
    normalize(a)
      .split(" ")
      .filter(Boolean)
  );

  const bWords = new Set(
    normalize(b)
      .split(" ")
      .filter(Boolean)
  );

  const intersection = [...aWords].filter((word) =>
    bWords.has(word)
  ).length;

  const union = new Set([
    ...aWords,
    ...bWords,
  ]).size;

  return union > 0 ? intersection / union : 0;
}

/**
 * ============================================================================
 * MAIN
 * ============================================================================
 */

async function main() {
  console.log("=".repeat(82));
  console.log("BARINGO-LIKE SUBCOUNTY STRUCTURAL AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("=".repeat(82));
  console.log();

  console.log("PURPOSE");
  console.log(
    "Detect administrative structures that genuinely resemble the"
  );
  console.log(
    "Baringo-like broad-SubCounty / directional-SubCounty split."
  );
  console.log();

  console.log("STRICT STRUCTURAL RULE");
  console.log(
    "A name match alone is NOT sufficient for a TRUE STRUCTURAL MATCH."
  );
  console.log(
    "The audit requires actual constituency-to-ward-to-SubCounty evidence."
  );
  console.log();

  /**
   * --------------------------------------------------------------------------
   * LOAD DATABASE
   * --------------------------------------------------------------------------
   */

  const counties = await prisma.county.findMany({
    orderBy: {
      name: "asc",
    },

    select: {
      id: true,
      name: true,

      subCounties: {
        orderBy: {
          name: "asc",
        },

        select: {
          id: true,
          name: true,
          countyId: true,

          wards: {
            orderBy: {
              name: "asc",
            },

            select: {
              id: true,
              name: true,
              constituencyId: true,
              subCountyId: true,
            },
          },
        },
      },

      constituencies: {
        orderBy: {
          name: "asc",
        },

        select: {
          id: true,
          name: true,
          countyId: true,

          wards: {
            orderBy: {
              name: "asc",
            },

            select: {
              id: true,
              name: true,
              constituencyId: true,
              subCountyId: true,
            },
          },
        },
      },
    },
  });

  /**
   * --------------------------------------------------------------------------
   * DATABASE COUNTS
   * --------------------------------------------------------------------------
   */

  const countyCount = counties.length;

  const subCountyCount = counties.reduce(
    (total, county) =>
      total + county.subCounties.length,
    0
  );

  const wardCount = counties.reduce(
    (total, county) =>
      total +
      county.subCounties.reduce(
        (subtotal, subCounty) =>
          subtotal + subCounty.wards.length,
        0
      ),
    0
  );

  const constituencyCount = counties.reduce(
    (total, county) =>
      total + county.constituencies.length,
    0
  );

  console.log("DATABASE SUMMARY");
  console.log(`Counties examined: ${countyCount}`);
  console.log(`SubCounties examined: ${subCountyCount}`);
  console.log(`Constituencies examined: ${constituencyCount}`);
  console.log(`Wards examined through SubCounty: ${wardCount}`);
  console.log();

  /**
   * --------------------------------------------------------------------------
   * FINDINGS
   * --------------------------------------------------------------------------
   */

  const findings: Finding[] = [];

  let emptySubCountyCount = 0;

  /**
   * --------------------------------------------------------------------------
   * COUNTY LOOP
   * --------------------------------------------------------------------------
   */

  for (const county of counties) {
    /**
     * Empty means:
     *
     *   zero wards
     *
     * We deliberately do not require zero farmers/farms here because the
     * structural relationship we are testing is geographical.
     *
     * An empty SubCounty with farmers/farms would actually be important to
     * flag separately rather than silently ignore.
     */
    const emptySubCounties =
      county.subCounties.filter(
        (subCounty) =>
          subCounty.wards.length === 0
      );

    emptySubCountyCount +=
      emptySubCounties.length;

    const populatedSubCounties =
      county.subCounties.filter(
        (subCounty) =>
          subCounty.wards.length > 0
      );

    /**
     * --------------------------------------------------------------
     * EMPTY SUBCOUNTY LOOP
     * --------------------------------------------------------------
     */

    for (const emptySubCounty of emptySubCounties) {
      /**
       * Find directional variants.
       */
      const variants =
        populatedSubCounties.filter(
          (candidate) =>
            isDirectionalVariant(
              emptySubCounty.name,
              candidate.name
            )
        );

      /**
       * We need at least two populated variants before considering
       * this a possible Baringo-like structure.
       */
      if (variants.length < 2) {
        continue;
      }

      /**
       * ------------------------------------------------------------
       * FIND CONSTITUENCY EVIDENCE
       * ------------------------------------------------------------
       *
       * We look for constituencies that are related to the broad
       * administrative name OR to one of the directional variants.
       *
       * This is intentionally broader than requiring exact equality.
       */

      const matchingConstituencies: Finding["matchingConstituencies"] =
        [];

      for (const constituency of county.constituencies) {
        const constituencyName =
          constituency.name;

        /**
         * Name evidence:
         *
         * Does the constituency resemble:
         *
         *   broad SubCounty
         *   OR
         *   one of the directional variants?
         */
        const resemblesBroad =
          similarity(
            emptySubCounty.name,
            constituencyName
          ) >= 0.75;

        const resemblesVariant =
          variants.some(
            (variant) =>
              similarity(
                variant.name,
                constituencyName
              ) >= 0.75
          );

        if (
          !resemblesBroad &&
          !resemblesVariant
        ) {
          continue;
        }

        /**
         * ----------------------------------------------------------
         * CHECK ACTUAL WARD DISTRIBUTION
         * ----------------------------------------------------------
         */

        const variantWardCounts =
          variants
            .map((variant) => {
              const wards =
                constituency.wards.filter(
                  (ward) =>
                    ward.subCountyId ===
                    variant.id
                );

              return {
                subCountyId:
                  variant.id,

                subCountyName:
                  variant.name,

                wards,
              };
            })
            .filter(
              (item) =>
                item.wards.length > 0
            );

        /**
         * A constituency only matters structurally if its wards are
         * actually attached to at least one of the variants.
         */
        if (
          variantWardCounts.length === 0
        ) {
          continue;
        }

        matchingConstituencies.push({
          constituency,
          variantWardCounts,
        });
      }

      /**
       * ------------------------------------------------------------
       * DETERMINE STRUCTURAL EVIDENCE
       * ------------------------------------------------------------
       */

      const nameEvidence =
        variants.length >= 2;

      const constituencyEvidence =
        matchingConstituencies.length > 0;

      /**
       * Strongest evidence:
       *
       * At least one constituency has wards assigned to TWO OR MORE
       * directional SubCounties.
       *
       * Example:
       *
       * Constituency X
       *
       *   East SubCounty:
       *       Ward A
       *       Ward B
       *
       *   West SubCounty:
       *       Ward C
       *       Ward D
       */
      const splitWardEvidence =
        matchingConstituencies.some(
          (item) =>
            item.variantWardCounts.length >= 2
        );

      /**
       * ------------------------------------------------------------
       * SCORE
       * ------------------------------------------------------------
       */

      let score = 0;

      if (nameEvidence) {
        score += 3;
      }

      if (constituencyEvidence) {
        score += 3;
      }

      if (splitWardEvidence) {
        score += 5;
      }

      /**
       * Additional evidence:
       *
       * If the broad empty name exactly resembles a constituency,
       * increase confidence.
       */
      const exactConstituencyMatch =
        county.constituencies.some(
          (constituency) =>
            sameAdministrativeName(
              emptySubCounty.name,
              constituency.name
            )
        );

      if (exactConstituencyMatch) {
        score += 2;
      }

      /**
       * ------------------------------------------------------------
       * CLASSIFICATION
       * ------------------------------------------------------------
       *
       * TRUE STRUCTURAL MATCH:
       *
       *   - at least 2 variants
       *   - constituency evidence
       *   - same constituency's wards split across variants
       *
       * STRONG REVIEW:
       *
       *   - variants exist
       *   - constituency evidence exists
       *   - but no same-constituency split
       *
       * NAME-ONLY MATCH:
       *
       *   - variants exist
       *   - but no actual constituency/ward structural evidence
       */

      let level: StructuralLevel;

      if (
        variants.length >= 2 &&
        constituencyEvidence &&
        splitWardEvidence
      ) {
        level =
          "TRUE STRUCTURAL MATCH";
      } else if (
        variants.length >= 2 &&
        constituencyEvidence
      ) {
        level =
          "STRONG REVIEW";
      } else {
        level =
          "NAME-ONLY MATCH";
      }

      findings.push({
        level,

        countyId:
          county.id,

        countyName:
          county.name,

        emptySubCounty: {
          id: emptySubCounty.id,
          name: emptySubCounty.name,
          countyId: emptySubCounty.countyId,
          wards: [],
        },

        variants,

        matchingConstituencies,

        nameEvidence,
        constituencyEvidence,
        splitWardEvidence,

        score,
      });
    }
  }

  /**
   * --------------------------------------------------------------------------
   * SORT
   * --------------------------------------------------------------------------
   */

  const rank: Record<
    StructuralLevel,
    number
  > = {
    "TRUE STRUCTURAL MATCH": 3,
    "STRONG REVIEW": 2,
    "NAME-ONLY MATCH": 1,
  };

  findings.sort(
    (a, b) =>
      rank[b.level] -
        rank[a.level] ||
      b.score - a.score ||
      a.countyName.localeCompare(
        b.countyName
      ) ||
      a.emptySubCounty.name.localeCompare(
        b.emptySubCounty.name
      )
  );

  /**
   * --------------------------------------------------------------------------
   * CLASSIFICATION COUNTS
   * --------------------------------------------------------------------------
   */

  const trueMatches =
    findings.filter(
      (item) =>
        item.level ===
        "TRUE STRUCTURAL MATCH"
    );

  const strongReviews =
    findings.filter(
      (item) =>
        item.level ===
        "STRONG REVIEW"
    );

  const nameOnly =
    findings.filter(
      (item) =>
        item.level ===
        "NAME-ONLY MATCH"
    );

  /**
   * --------------------------------------------------------------------------
   * SAFETY SUMMARY
   * --------------------------------------------------------------------------
   */

  console.log("SAFETY / DETECTION SUMMARY");
  console.log(
    `Empty SubCounties examined: ${emptySubCountyCount}`
  );
  console.log(
    `TRUE STRUCTURAL MATCH: ${trueMatches.length}`
  );
  console.log(
    `STRONG REVIEW:         ${strongReviews.length}`
  );
  console.log(
    `NAME-ONLY MATCH:       ${nameOnly.length}`
  );
  console.log();

  console.log(
    "IMPORTANT: NAME-ONLY MATCHES ARE NOT STRUCTURAL PROOF."
  );

  console.log(
    "IMPORTANT: STRONG REVIEW RECORDS REQUIRE MANUAL VERIFICATION."
  );

  console.log(
    "IMPORTANT: TRUE STRUCTURAL MATCHES ARE THE HIGHEST-PRIORITY CASES."
  );

  console.log();

  /**
   * ==========================================================================
   * TRUE STRUCTURAL MATCHES
   * ==========================================================================
   */

  console.log("=".repeat(82));
  console.log(
    "TRUE STRUCTURAL MATCHES — HIGHEST PRIORITY"
  );
  console.log("=".repeat(82));
  console.log();

  if (trueMatches.length === 0) {
    console.log(
      "NONE FOUND."
    );
    console.log();

    console.log(
      "This means the current database does not contain a case that"
    );

    console.log(
      "satisfies all of the strict Baringo-like structural conditions."
    );

    console.log();
  }

  for (const finding of trueMatches) {
    console.log(
      `[TRUE STRUCTURAL MATCH] ${finding.countyName}`
    );

    console.log(
      `County ID: ${finding.countyId}`
    );

    console.log(
      `EMPTY BROAD SUBCOUNTY: ${finding.emptySubCounty.id} - ${finding.emptySubCounty.name}`
    );

    console.log(
      `Score: ${finding.score}`
    );

    console.log();

    console.log(
      "POPULATED DIRECTIONAL VARIANTS:"
    );

    for (const variant of finding.variants) {
      console.log(
        `  ${variant.id} - ${variant.name} | wards=${variant.wards.length}`
      );
    }

    console.log();

    console.log(
      "CONSTITUENCY / WARD STRUCTURE:"
    );

    for (
      const item of
      finding.matchingConstituencies
    ) {
      console.log(
        `  Constituency ${item.constituency.id} - ${item.constituency.name}`
      );

      for (
        const group of
        item.variantWardCounts
      ) {
        console.log(
          `    ${group.subCountyId} - ${group.subCountyName} | wards=${group.wards.length}`
        );

        for (
          const ward of
          group.wards
        ) {
          console.log(
            `      Ward ${ward.id} - ${ward.name}`
          );
        }
      }
    }

    console.log();

    console.log(
      "STRUCTURAL EVIDENCE:"
    );

    console.log(
      "  ✓ Empty broad SubCounty"
    );

    console.log(
      "  ✓ Multiple directional variants"
    );

    console.log(
      "  ✓ Constituency evidence"
    );

    console.log(
      "  ✓ Same constituency has wards split across variants"
    );

    console.log();

    console.log(
      "RECOMMENDATION:"
    );

    console.log(
      "  HIGHEST PRIORITY FOR AUTHORITATIVE ADMINISTRATIVE VERIFICATION."
    );

    console.log();
    console.log("-".repeat(82));
    console.log();
  }

  /**
   * ==========================================================================
   * STRONG REVIEW
   * ==========================================================================
   */

  console.log("=".repeat(82));
  console.log(
    "STRONG REVIEW — STRUCTURALALLY RELATED BUT NOT PROVEN"
  );
  console.log("=".repeat(82));
  console.log();

  if (strongReviews.length === 0) {
    console.log(
      "NONE FOUND."
    );
    console.log();
  }

  for (const finding of strongReviews) {
    console.log(
      `[STRONG REVIEW] ${finding.countyName}`
    );

    console.log(
      `County ID: ${finding.countyId}`
    );

    console.log(
      `EMPTY BROAD SUBCOUNTY: ${finding.emptySubCounty.id} - ${finding.emptySubCounty.name}`
    );

    console.log(
      `Score: ${finding.score}`
    );

    console.log();

    console.log(
      "POPULATED VARIANTS:"
    );

    for (const variant of finding.variants) {
      console.log(
        `  ${variant.id} - ${variant.name} | wards=${variant.wards.length}`
      );
    }

    console.log();

    console.log(
      "MATCHING CONSTITUENCIES WITH ACTUAL VARIANT WARDS:"
    );

    for (
      const item of
      finding.matchingConstituencies
    ) {
      console.log(
        `  Constituency ${item.constituency.id} - ${item.constituency.name}`
      );

      for (
        const group of
        item.variantWardCounts
      ) {
        console.log(
          `    ${group.subCountyId} - ${group.subCountyName} | wards=${group.wards.length}`
        );

        for (
          const ward of
          group.wards
        ) {
          console.log(
            `      Ward ${ward.id} - ${ward.name}`
          );
        }
      }
    }

    console.log();

    console.log(
      "REVIEW STATUS:"
    );

    console.log(
      "  STRUCTURAL EVIDENCE EXISTS, BUT THE STRICT"
    );

    console.log(
      "  SAME-CONSTITUENCY SPLIT CONDITION WAS NOT PROVEN."
    );

    console.log();

    console.log(
      "ACTION:"
    );

    console.log(
      "  Verify against an authoritative administrative source."
    );

    console.log();

    console.log("-".repeat(82));
    console.log();
  }

  /**
   * ==========================================================================
   * NAME-ONLY MATCHES
   * ==========================================================================
   */

  console.log("=".repeat(82));
  console.log(
    "NAME-ONLY MATCHES — NOT STRUCTURAL PROOF"
  );
  console.log("=".repeat(82));
  console.log();

  if (nameOnly.length === 0) {
    console.log(
      "NONE FOUND."
    );
    console.log();
  }

  for (const finding of nameOnly) {
    console.log(
      `[NAME-ONLY MATCH] ${finding.countyName}`
    );

    console.log(
      `County ID: ${finding.countyId}`
    );

    console.log(
      `EMPTY BROAD SUBCOUNTY: ${finding.emptySubCounty.id} - ${finding.emptySubCounty.name}`
    );

    console.log(
      `Score: ${finding.score}`
    );

    console.log();

    console.log(
      "DIRECTIONAL VARIANTS:"
    );

    for (const variant of finding.variants) {
      console.log(
        `  ${variant.id} - ${variant.name} | wards=${variant.wards.length}`
      );
    }

    console.log();

    console.log(
      "INTERPRETATION:"
    );

    console.log(
      "  The names resemble a broad administrative concept and"
    );

    console.log(
      "  directional variants, but the database does not provide"
    );

    console.log(
      "  sufficient constituency/ward evidence to call this a"
    );

    console.log(
      "  Baringo-like structural case."
    );

    console.log();

    console.log("-".repeat(82));
    console.log();
  }

  /**
   * ==========================================================================
   * SPECIAL CHECK
   * ==========================================================================
   *
   * Look for wards that have a SubCounty assignment but whose constituency
   * belongs to the same county and whose SubCounty is not represented by
   * the expected constituency naming pattern.
   *
   * This does not classify Baringo cases. It provides additional diagnostic
   * information that may reveal hierarchy inconsistencies.
   */

  console.log("=".repeat(82));
  console.log(
    "ADDITIONAL HIERARCHY CONSISTENCY CHECK"
  );
  console.log("=".repeat(82));
  console.log();

  type HierarchyIssue = {
    county: string;
    wardId: number;
    wardName: string;
    constituencyId: number;
    constituencyName: string;
    subCountyId: number;
    subCountyName: string;
  };

  const hierarchyIssues: HierarchyIssue[] = [];

  for (const county of counties) {
    const constituencyMap =
      new Map<number, ConstituencyInfo>();

    for (
      const constituency of
      county.constituencies
    ) {
      constituencyMap.set(
        constituency.id,
        constituency
      );
    }

    for (
      const subCounty of
      county.subCounties
    ) {
      for (
        const ward of
        subCounty.wards
      ) {
        const constituency =
          constituencyMap.get(
            ward.constituencyId
          );

        if (!constituency) {
          hierarchyIssues.push({
            county: county.name,
            wardId: ward.id,
            wardName: ward.name,
            constituencyId:
              ward.constituencyId,
            constituencyName:
              "UNKNOWN",
            subCountyId:
              subCounty.id,
            subCountyName:
              subCounty.name,
          });

          continue;
        }

        /**
         * A ward exists in this SubCounty but is linked to a constituency
         * that belongs to another administrative object in the loaded
         * county data.
         *
         * We report this only when the ward's constituency relationship
         * cannot be found under the county's constituency collection.
         */
      }
    }
  }

  if (hierarchyIssues.length === 0) {
    console.log(
      "No obvious Ward → Constituency lookup inconsistencies found."
    );
  } else {
    console.log(
      `Hierarchy issues found: ${hierarchyIssues.length}`
    );

    console.log();

    for (const issue of hierarchyIssues) {
      console.log(
        `${issue.county} | Ward ${issue.wardId} - ${issue.wardName}`
      );

      console.log(
        `  Constituency: ${issue.constituencyId} - ${issue.constituencyName}`
      );

      console.log(
        `  SubCounty: ${issue.subCountyId} - ${issue.subCountyName}`
      );

      console.log();
    }
  }

  /**
   * ==========================================================================
   * FINAL SUMMARY
   * ==========================================================================
   */

  console.log("=".repeat(82));
  console.log(
    "FINAL INTERPRETATION"
  );
  console.log("=".repeat(82));
  console.log();

  console.log(
    `TRUE STRUCTURAL MATCHES: ${trueMatches.length}`
  );

  console.log(
    `STRONG REVIEW CASES:     ${strongReviews.length}`
  );

  console.log(
    `NAME-ONLY MATCHES:       ${nameOnly.length}`
  );

  console.log();

  if (trueMatches.length > 0) {
    console.log(
      "RESULT: Potential Baringo-like structural cases were detected."
    );

    console.log(
      "These should be investigated first using an authoritative"
    );

    console.log(
      "administrative boundary/source dataset."
    );
  } else {
    console.log(
      "RESULT: No TRUE Baringo-like structural case was detected"
    );

    console.log(
      "under the strict structural rules used by this audit."
    );
  }

  console.log();

  console.log(
    "NAME-ONLY MATCHES MUST NOT BE TREATED AS DUPLICATES."
  );

  console.log(
    "EMPTY SUBCOUNTIES MUST NOT BE DELETED AUTOMATICALLY."
  );

  console.log(
    "NO DATABASE CHANGES WERE MADE."
  );

  console.log();

  console.log("=".repeat(82));
  console.log(
    "AUDIT COMPLETE — READ-ONLY"
  );
  console.log("=".repeat(82));
}

/**
 * ============================================================================
 * EXECUTION
 * ============================================================================
 */

main()
  .catch((error) => {
    console.error();
    console.error("AUDIT FAILED:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });