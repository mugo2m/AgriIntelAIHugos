import prisma from "../lib/prisma";

/**
 * ============================================================================
 * SUBCOUNTY DISPOSITION AUDIT
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Classify EMPTY SubCounty records using the actual County →
 * SubCounty → Constituency → Ward relationships in the database.
 *
 * THIS SCRIPT IS 100% READ-ONLY.
 *
 * It DOES NOT:
 *   - INSERT
 *   - UPDATE
 *   - DELETE
 *   - MERGE
 *   - MOVE wards
 *   - MOVE constituencies
 *
 * ============================================================================
 *
 * DISPOSITION CATEGORIES
 * ----------------------
 *
 * 1. EXACT DUPLICATE
 *    Empty SubCounty has the same normalized name as a populated SubCounty
 *    in the same County.
 *
 * 2. DIRECTIONAL / BROAD ADMINISTRATIVE REVIEW
 *    Empty SubCounty has multiple populated directional variants such as:
 *
 *        Kipkelion
 *        Kipkelion East
 *        Kipkelion West
 *
 *    but the database does not prove that the empty record is a duplicate.
 *
 * 3. CONSTITUENCY-ALIGNED REVIEW
 *    Empty SubCounty name strongly corresponds to one or more Constituencies,
 *    but there is no exact populated SubCounty duplicate.
 *
 * 4. POSSIBLE DUPLICATE
 *    Strong name relationship exists with a populated SubCounty, but the
 *    relationship is not sufficiently exact to call it an exact duplicate.
 *
 * 5. HISTORICAL / LEGACY CANDIDATE
 *    Empty SubCounty has no strong current structural match and therefore
 *    should NOT be automatically deleted.
 *
 * 6. STRUCTURAL ANOMALY
 *    A relationship exists which requires investigation because the hierarchy
 *    does not behave as expected.
 *
 * 7. UNKNOWN / MANUAL REVIEW
 *    Insufficient evidence from the current database alone.
 *
 * ============================================================================
 *
 * IMPORTANT
 * ---------
 *
 * This script does NOT decide that a record is safe to delete.
 *
 * It produces evidence for the next step.
 *
 * ============================================================================
 */

/**
 * ---------------------------------------------------------------------------
 * NAME NORMALIZATION
 * ---------------------------------------------------------------------------
 */

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/\bsub[-\s]?county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/\bcounty\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string): string {
  return normalize(value).replace(/\s/g, "");
}

/**
 * ---------------------------------------------------------------------------
 * DIRECTIONAL TERMS
 * ---------------------------------------------------------------------------
 */

const directionWords = new Set([
  "east",
  "west",
  "north",
  "south",
  "central",
]);

function stripDirections(value: string): string {
  return normalize(value)
    .split(" ")
    .filter(
      (word) =>
        word.length > 0 &&
        !directionWords.has(word)
    )
    .join(" ");
}

function isDirectionalVariant(
  broadName: string,
  candidateName: string
): boolean {
  const broad = normalize(broadName);
  const candidate = normalize(candidateName);

  if (!broad || !candidate) {
    return false;
  }

  if (compact(broadName) === compact(candidateName)) {
    return false;
  }

  const broadBase = compact(
    stripDirections(broadName)
  );

  const candidateBase = compact(
    stripDirections(candidateName)
  );

  if (!broadBase || !candidateBase) {
    return false;
  }

  const candidateWords = candidate.split(" ");

  const hasDirection = candidateWords.some(
    (word) => directionWords.has(word)
  );

  if (!hasDirection) {
    return false;
  }

  return broadBase === candidateBase;
}

/**
 * ---------------------------------------------------------------------------
 * NAME SIMILARITY
 * ---------------------------------------------------------------------------
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

  if (
    aa.includes(bb) ||
    bb.includes(aa)
  ) {
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

  const intersection = [...aWords].filter(
    (word) => bWords.has(word)
  ).length;

  const union = new Set([
    ...aWords,
    ...bWords,
  ]).size;

  return union > 0
    ? intersection / union
    : 0;
}

/**
 * ---------------------------------------------------------------------------
 * HELPERS
 * ---------------------------------------------------------------------------
 */

function pluralize(
  value: number,
  singular: string,
  plural?: string
): string {
  return `${value} ${
    value === 1
      ? singular
      : plural ?? `${singular}s`
  }`;
}

function printDivider(char = "-", length = 82) {
  console.log(char.repeat(length));
}

/**
 * ============================================================================
 * MAIN
 * ============================================================================
 */

async function main() {
  console.log("=".repeat(82));
  console.log("SUBCOUNTY DISPOSITION AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("=".repeat(82));
  console.log();

  console.log(
    "Purpose: classify empty SubCounty records using actual"
  );

  console.log(
    "County → SubCounty → Constituency → Ward relationships."
  );

  console.log();

  /**
   * -------------------------------------------------------------------------
   * LOAD COMPLETE LOCATION HIERARCHY
   * -------------------------------------------------------------------------
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
   * -------------------------------------------------------------------------
   * BASIC COUNTS
   * -------------------------------------------------------------------------
   */

  const countyCount = counties.length;

  const subCountyCount = counties.reduce(
    (sum, county) =>
      sum + county.subCounties.length,
    0
  );

  const constituencyCount =
    counties.reduce(
      (sum, county) =>
        sum + county.constituencies.length,
      0
    );

  const wardCount = counties.reduce(
    (sum, county) =>
      sum +
      county.subCounties.reduce(
        (inner, subCounty) =>
          inner + subCounty.wards.length,
        0
      ),
    0
  );

  console.log("DATABASE SNAPSHOT");
  console.log(
    `Counties:        ${countyCount}`
  );
  console.log(
    `SubCounties:     ${subCountyCount}`
  );
  console.log(
    `Constituencies:  ${constituencyCount}`
  );
  console.log(
    `Wards:           ${wardCount}`
  );

  console.log();

  /**
   * -------------------------------------------------------------------------
   * RESULT TYPES
   * -------------------------------------------------------------------------
   */

  type Disposition =
    | "EXACT DUPLICATE"
    | "DIRECTIONAL / BROAD ADMINISTRATIVE REVIEW"
    | "CONSTITUENCY-ALIGNED REVIEW"
    | "POSSIBLE DUPLICATE"
    | "STRUCTURAL ANOMALY"
    | "HISTORICAL / LEGACY CANDIDATE"
    | "UNKNOWN / MANUAL REVIEW";

  type Finding = {
    disposition: Disposition;

    countyId: number;
    countyName: string;

    subCountyId: number;
    subCountyName: string;

    wardCount: number;

    exactMatches: Array<{
      id: number;
      name: string;
      wardCount: number;
    }>;

    directionalVariants: Array<{
      id: number;
      name: string;
      wardCount: number;
    }>;

    constituencyMatches: Array<{
      id: number;
      name: string;
      wardCount: number;
      assignedSubCounties: Array<{
        id: number;
        name: string;
        wardCount: number;
      }>;
    }>;

    wardsWithNullSubCounty: Array<{
      id: number;
      name: string;
      constituencyId: number;
    }>;

    structuralNotes: string[];

    score: number;
  };

  const findings: Finding[] = [];

  /**
   * -------------------------------------------------------------------------
   * PROCESS EVERY COUNTY
   * -------------------------------------------------------------------------
   */

  for (const county of counties) {
    const emptySubCounties =
      county.subCounties.filter(
        (subCounty) =>
          subCounty.wards.length === 0
      );

    const populatedSubCounties =
      county.subCounties.filter(
        (subCounty) =>
          subCounty.wards.length > 0
      );

    /**
     * Map SubCounty IDs to their records.
     */
    const subCountyMap = new Map<
      number,
      (typeof county.subCounties)[number]
    >();

    for (const subCounty of county.subCounties) {
      subCountyMap.set(
        subCounty.id,
        subCounty
      );
    }

    /**
     * -----------------------------------------------------------------------
     * EMPTY SUBCOUNTY
     * -----------------------------------------------------------------------
     */

    for (const emptySubCounty of emptySubCounties) {
      const exactMatches =
        populatedSubCounties
          .filter(
            (candidate) =>
              compact(candidate.name) ===
              compact(emptySubCounty.name)
          )
          .map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
            wardCount:
              candidate.wards.length,
          }));

      const directionalVariants =
        populatedSubCounties
          .filter(
            (candidate) =>
              isDirectionalVariant(
                emptySubCounty.name,
                candidate.name
              )
          )
          .map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
            wardCount:
              candidate.wards.length,
          }));

      /**
       * ---------------------------------------------------------------------
       * CONSTITUENCY MATCHING
       * ---------------------------------------------------------------------
       *
       * We examine Constituencies independently from SubCounty names.
       *
       * This is important because a constituency may reveal that an empty
       * SubCounty name is actually a historical/broad administrative label.
       */

      const constituencyMatches: Finding["constituencyMatches"] =
        [];

      for (const constituency of county.constituencies) {
        const nameScore = similarity(
          emptySubCounty.name,
          constituency.name
        );

        /**
         * Only investigate reasonably strong name relationships.
         */
        if (nameScore < 0.75) {
          continue;
        }

        /**
         * Find which populated SubCounties actually own the wards belonging
         * to this constituency.
         */
        const assignedSubCountyMap =
          new Map<
            number,
            {
              id: number;
              name: string;
              wardCount: number;
            }
          >();

        for (const ward of constituency.wards) {
          if (ward.subCountyId === null) {
            continue;
          }

          const subCounty =
            subCountyMap.get(
              ward.subCountyId
            );

          if (!subCounty) {
            continue;
          }

          const existing =
            assignedSubCountyMap.get(
              subCounty.id
            );

          if (existing) {
            existing.wardCount += 1;
          } else {
            assignedSubCountyMap.set(
              subCounty.id,
              {
                id: subCounty.id,
                name: subCounty.name,
                wardCount: 1,
              }
            );
          }
        }

        const assignedSubCounties =
          [...assignedSubCountyMap.values()];

        constituencyMatches.push({
          id: constituency.id,
          name: constituency.name,
          wardCount:
            constituency.wards.length,
          assignedSubCounties,
        });
      }

      /**
       * ---------------------------------------------------------------------
       * WARDS WITH NULL SUBCOUNTY
       * ---------------------------------------------------------------------
       *
       * These are important because a missing SubCounty assignment may
       * explain an apparently empty administrative record.
       */

      const wardsWithNullSubCounty: Finding["wardsWithNullSubCounty"] =
        [];

      for (const constituency of county.constituencies) {
        for (const ward of constituency.wards) {
          if (ward.subCountyId === null) {
            wardsWithNullSubCounty.push({
              id: ward.id,
              name: ward.name,
              constituencyId:
                ward.constituencyId,
            });
          }
        }
      }

      /**
       * ---------------------------------------------------------------------
       * STRUCTURAL NOTES
       * ---------------------------------------------------------------------
       */

      const structuralNotes: string[] = [];

      /**
       * Exact populated duplicate.
       */
      if (exactMatches.length > 0) {
        structuralNotes.push(
          "A populated SubCounty with the same normalized name exists in the same County."
        );
      }

      /**
       * Multiple directional variants.
       */
      if (directionalVariants.length >= 2) {
        structuralNotes.push(
          "Multiple populated directional variants exist."
        );
      }

      /**
       * One directional variant.
       */
      if (
        directionalVariants.length === 1
      ) {
        structuralNotes.push(
          "One populated directional variant exists."
        );
      }

      /**
       * Constituency evidence.
       */
      if (
        constituencyMatches.length > 0
      ) {
        structuralNotes.push(
          "One or more similarly named Constituencies contain actual wards."
        );
      }

      /**
       * Constituency wards split between multiple SubCounties.
       */
      const splitConstituencyCount =
        constituencyMatches.filter(
          (item) =>
            item.assignedSubCounties
              .length >= 2
        ).length;

      if (
        splitConstituencyCount > 0
      ) {
        structuralNotes.push(
          "At least one matching Constituency has wards assigned across multiple SubCounties."
        );
      }

      /**
       * Null SubCounty assignments.
       */
      if (
        wardsWithNullSubCounty.length > 0
      ) {
        structuralNotes.push(
          `${wardsWithNullSubCounty.length} ward(s) have subCountyId = null in this County.`
        );
      }

      /**
       * ---------------------------------------------------------------------
       * SCORE
       * ---------------------------------------------------------------------
       */

      let score = 0;

      if (exactMatches.length > 0) {
        score += 10;
      }

      if (
        directionalVariants.length >= 2
      ) {
        score += 5;
      } else if (
        directionalVariants.length === 1
      ) {
        score += 2;
      }

      if (
        constituencyMatches.length > 0
      ) {
        score += 4;
      }

      if (
        splitConstituencyCount > 0
      ) {
        score += 5;
      }

      if (
        wardsWithNullSubCounty.length > 0
      ) {
        score += 1;
      }

      /**
       * ---------------------------------------------------------------------
       * DISPOSITION
       * ---------------------------------------------------------------------
       */

      let disposition: Disposition;

      /**
       * PRIORITY 1
       *
       * Exact same normalized name as a populated SubCounty.
       *
       * This is strong evidence, but even this is still reported rather than
       * automatically deleted.
       */
      if (exactMatches.length > 0) {
        disposition =
          "EXACT DUPLICATE";
      }

      /**
       * PRIORITY 2
       *
       * Multiple directional variants.
       *
       * This is precisely the class represented by:
       *
       *   Kipkelion
       *       Kipkelion East
       *       Kipkelion West
       *
       * It requires administrative verification.
       */
      else if (
        directionalVariants.length >= 2
      ) {
        disposition =
          "DIRECTIONAL / BROAD ADMINISTRATIVE REVIEW";
      }

      /**
       * PRIORITY 3
       *
       * Strong constituency relationship.
       */
      else if (
        constituencyMatches.length > 0 &&
        directionalVariants.length === 0
      ) {
        disposition =
          "CONSTITUENCY-ALIGNED REVIEW";
      }

      /**
       * PRIORITY 4
       *
       * One directional variant.
       */
      else if (
        directionalVariants.length === 1
      ) {
        disposition =
          "POSSIBLE DUPLICATE";
      }

      /**
       * PRIORITY 5
       *
       * A structural inconsistency is detected.
       */
      else if (
        wardsWithNullSubCounty.length > 0
      ) {
        disposition =
          "STRUCTURAL ANOMALY";
      }

      /**
       * PRIORITY 6
       *
       * No strong current relationship.
       *
       * IMPORTANT:
       *
       * This does NOT mean "safe to delete".
       */
      else if (
        constituencyMatches.length === 0
      ) {
        disposition =
          "HISTORICAL / LEGACY CANDIDATE";
      }

      /**
       * FALLBACK
       */
      else {
        disposition =
          "UNKNOWN / MANUAL REVIEW";
      }

      findings.push({
        disposition,

        countyId: county.id,
        countyName: county.name,

        subCountyId:
          emptySubCounty.id,

        subCountyName:
          emptySubCounty.name,

        wardCount:
          emptySubCounty.wards.length,

        exactMatches,

        directionalVariants,

        constituencyMatches,

        wardsWithNullSubCounty,

        structuralNotes,

        score,
      });
    }
  }

  /**
   * -------------------------------------------------------------------------
   * SORT
   * -------------------------------------------------------------------------
   */

  const dispositionRank: Record<
    Disposition,
    number
  > = {
    "EXACT DUPLICATE": 7,
    "STRUCTURAL ANOMALY": 6,
    "DIRECTIONAL / BROAD ADMINISTRATIVE REVIEW": 5,
    "POSSIBLE DUPLICATE": 4,
    "CONSTITUENCY-ALIGNED REVIEW": 3,
    "UNKNOWN / MANUAL REVIEW": 2,
    "HISTORICAL / LEGACY CANDIDATE": 1,
  };

  findings.sort(
    (a, b) =>
      dispositionRank[b.disposition] -
        dispositionRank[a.disposition] ||
      b.score - a.score ||
      a.countyName.localeCompare(
        b.countyName
      ) ||
      a.subCountyName.localeCompare(
        b.subCountyName
      )
  );

  /**
   * -------------------------------------------------------------------------
   * SUMMARY COUNTS
   * -------------------------------------------------------------------------
   */

  const countDisposition = (
    disposition: Disposition
  ) =>
    findings.filter(
      (finding) =>
        finding.disposition ===
        disposition
    ).length;

  const exactDuplicates =
    countDisposition(
      "EXACT DUPLICATE"
    );

  const structuralAnomalies =
    countDisposition(
      "STRUCTURAL ANOMALY"
    );

  const directionalReviews =
    countDisposition(
      "DIRECTIONAL / BROAD ADMINISTRATIVE REVIEW"
    );

  const possibleDuplicates =
    countDisposition(
      "POSSIBLE DUPLICATE"
    );

  const constituencyReviews =
    countDisposition(
      "CONSTITUENCY-ALIGNED REVIEW"
    );

  const historicalCandidates =
    countDisposition(
      "HISTORICAL / LEGACY CANDIDATE"
    );

  const unknown =
    countDisposition(
      "UNKNOWN / MANUAL REVIEW"
    );

  /**
   * -------------------------------------------------------------------------
   * SAFETY SUMMARY
   * -------------------------------------------------------------------------
   */

  console.log("=".repeat(82));
  console.log("DISPOSITION SUMMARY");
  console.log("=".repeat(82));
  console.log();

  console.log(
    `Empty SubCounties examined: ${findings.length}`
  );

  console.log();

  console.log(
    `EXACT DUPLICATE:                         ${exactDuplicates}`
  );

  console.log(
    `STRUCTURAL ANOMALY:                      ${structuralAnomalies}`
  );

  console.log(
    `DIRECTIONAL / BROAD ADMINISTRATIVE:      ${directionalReviews}`
  );

  console.log(
    `POSSIBLE DUPLICATE:                      ${possibleDuplicates}`
  );

  console.log(
    `CONSTITUENCY-ALIGNED REVIEW:             ${constituencyReviews}`
  );

  console.log(
    `HISTORICAL / LEGACY CANDIDATE:            ${historicalCandidates}`
  );

  console.log(
    `UNKNOWN / MANUAL REVIEW:                  ${unknown}`
  );

  console.log();

  console.log(
    `TOTAL CLASSIFIED:                        ${findings.length}`
  );

  console.log();

  console.log(
    "IMPORTANT: No category means automatic deletion."
  );

  console.log(
    "IMPORTANT: EXACT DUPLICATE means strong evidence, not an automatic merge."
  );

  console.log(
    "IMPORTANT: HISTORICAL / LEGACY means retain pending authoritative evidence."
  );

  console.log();

  /**
   * ==========================================================================
   * EXACT DUPLICATES
   * ==========================================================================
   */

  console.log("=".repeat(82));
  console.log(
    "1. EXACT DUPLICATE — HIGHEST PRIORITY FOR VERIFICATION"
  );
  console.log("=".repeat(82));
  console.log();

  const exactRecords =
    findings.filter(
      (finding) =>
        finding.disposition ===
        "EXACT DUPLICATE"
    );

  if (exactRecords.length === 0) {
    console.log("NONE FOUND.");
    console.log();
  }

  for (const finding of exactRecords) {
    console.log(
      `[EXACT DUPLICATE] ${finding.countyName}`
    );

    console.log(
      `Empty SubCounty: ${finding.subCountyId} - ${finding.subCountyName}`
    );

    console.log(
      `Score: ${finding.score}`
    );

    console.log();

    console.log(
      "POPULATED MATCHES:"
    );

    for (
      const match of
      finding.exactMatches
    ) {
      console.log(
        `  ${match.id} - ${match.name} | wards=${match.wardCount}`
      );
    }

    console.log();

    console.log(
      "ACTION: VERIFY BEFORE ANY MERGE OR DELETE."
    );

    printDivider();
  }

  /**
   * ==========================================================================
   * STRUCTURAL ANOMALIES
   * ==========================================================================
   */

  console.log();
  console.log("=".repeat(82));
  console.log(
    "2. STRUCTURAL ANOMALIES"
  );
  console.log("=".repeat(82));
  console.log();

  const anomalyRecords =
    findings.filter(
      (finding) =>
        finding.disposition ===
        "STRUCTURAL ANOMALY"
    );

  if (anomalyRecords.length === 0) {
    console.log("NONE FOUND.");
    console.log();
  }

  for (const finding of anomalyRecords) {
    console.log(
      `[STRUCTURAL ANOMALY] ${finding.countyName}`
    );

    console.log(
      `SubCounty: ${finding.subCountyId} - ${finding.subCountyName}`
    );

    console.log();

    for (
      const note of
      finding.structuralNotes
    ) {
      console.log(
        `  • ${note}`
      );
    }

    if (
      finding.wardsWithNullSubCounty
        .length > 0
    ) {
      console.log();
      console.log(
        "WARDS WITH NULL SUBCOUNTY:"
      );

      for (
        const ward of
        finding.wardsWithNullSubCounty
      ) {
        console.log(
          `  Ward ${ward.id} - ${ward.name} | constituencyId=${ward.constituencyId}`
        );
      }
    }

    console.log();

    printDivider();
  }

  /**
   * ==========================================================================
   * DIRECTIONAL / BROAD
   * ==========================================================================
   */

  console.log();
  console.log("=".repeat(82));
  console.log(
    "3. DIRECTIONAL / BROAD ADMINISTRATIVE REVIEW"
  );
  console.log("=".repeat(82));
  console.log();

  const directionalRecords =
    findings.filter(
      (finding) =>
        finding.disposition ===
        "DIRECTIONAL / BROAD ADMINISTRATIVE REVIEW"
    );

  if (directionalRecords.length === 0) {
    console.log("NONE FOUND.");
    console.log();
  }

  for (const finding of directionalRecords) {
    console.log(
      `[DIRECTIONAL / BROAD REVIEW] ${finding.countyName}`
    );

    console.log(
      `Empty SubCounty: ${finding.subCountyId} - ${finding.subCountyName}`
    );

    console.log(
      `Score: ${finding.score}`
    );

    console.log();

    console.log(
      "POPULATED DIRECTIONAL VARIANTS:"
    );

    for (
      const variant of
      finding.directionalVariants
    ) {
      console.log(
        `  ${variant.id} - ${variant.name} | wards=${variant.wardCount}`
      );
    }

    console.log();

    if (
      finding.constituencyMatches
        .length > 0
    ) {
      console.log(
        "RELATED CONSTITUENCIES:"
      );

      for (
        const constituency of
        finding.constituencyMatches
      ) {
        console.log(
          `  ${constituency.id} - ${constituency.name} | wards=${constituency.wardCount}`
        );

        if (
          constituency
            .assignedSubCounties
            .length > 0
        ) {
          for (
            const assigned of
            constituency.assignedSubCounties
          ) {
            console.log(
              `    → ${assigned.id} - ${assigned.name} | wards=${assigned.wardCount}`
            );
          }
        }
      }

      console.log();
    }

    console.log(
      "INTERPRETATION:"
    );

    console.log(
      "  This is NOT proof of duplication."
    );

    console.log(
      "  The broad name may represent a historical or broader"
    );

    console.log(
      "  administrative concept."
    );

    console.log();

    console.log(
      "ACTION:"
    );

    console.log(
      "  Verify against authoritative administrative data."
    );

    console.log();

    printDivider();
  }

  /**
   * ==========================================================================
   * POSSIBLE DUPLICATES
   * ==========================================================================
   */

  console.log();
  console.log("=".repeat(82));
  console.log(
    "4. POSSIBLE DUPLICATES"
  );
  console.log("=".repeat(82));
  console.log();

  const possibleRecords =
    findings.filter(
      (finding) =>
        finding.disposition ===
        "POSSIBLE DUPLICATE"
    );

  if (possibleRecords.length === 0) {
    console.log("NONE FOUND.");
    console.log();
  }

  for (const finding of possibleRecords) {
    console.log(
      `[POSSIBLE DUPLICATE] ${finding.countyName}`
    );

    console.log(
      `Empty SubCounty: ${finding.subCountyId} - ${finding.subCountyName}`
    );

    console.log(
      `Score: ${finding.score}`
    );

    console.log();

    console.log(
      "RELATED POPULATED SUBCOUNTY:"
    );

    for (
      const variant of
      finding.directionalVariants
    ) {
      console.log(
        `  ${variant.id} - ${variant.name} | wards=${variant.wardCount}`
      );
    }

    console.log();

    console.log(
      "ACTION: MANUAL VERIFICATION REQUIRED."
    );

    console.log();

    printDivider();
  }

  /**
   * ==========================================================================
   * CONSTITUENCY-ALIGNED REVIEW
   * ==========================================================================
   */

  console.log();
  console.log("=".repeat(82));
  console.log(
    "5. CONSTITUENCY-ALIGNED REVIEW"
  );
  console.log("=".repeat(82));
  console.log();

  const constituencyRecords =
    findings.filter(
      (finding) =>
        finding.disposition ===
        "CONSTITUENCY-ALIGNED REVIEW"
    );

  if (
    constituencyRecords.length === 0
  ) {
    console.log("NONE FOUND.");
    console.log();
  }

  for (
    const finding of
    constituencyRecords
  ) {
    console.log(
      `[CONSTITUENCY REVIEW] ${finding.countyName}`
    );

    console.log(
      `Empty SubCounty: ${finding.subCountyId} - ${finding.subCountyName}`
    );

    console.log();

    for (
      const constituency of
      finding.constituencyMatches
    ) {
      console.log(
        `Constituency ${constituency.id} - ${constituency.name}`
      );

      console.log(
        `  Total wards: ${constituency.wardCount}`
      );

      if (
        constituency.assignedSubCounties
          .length === 0
      ) {
        console.log(
          "  No SubCounty assignments found."
        );
      } else {
        console.log(
          "  Ward assignments:"
        );

        for (
          const assigned of
          constituency.assignedSubCounties
        ) {
          console.log(
            `    ${assigned.id} - ${assigned.name} | wards=${assigned.wardCount}`
          );
        }
      }
    }

    console.log();

    console.log(
      "ACTION: INVESTIGATE WHETHER THE EMPTY RECORD IS"
    );

    console.log(
      "A HISTORICAL ADMINISTRATIVE LABEL OR A DUPLICATE."
    );

    console.log();

    printDivider();
  }

  /**
   * ==========================================================================
   * HISTORICAL / LEGACY
   * ==========================================================================
   */

  console.log();
  console.log("=".repeat(82));
  console.log(
    "6. HISTORICAL / LEGACY CANDIDATES"
  );
  console.log("=".repeat(82));
  console.log();

  const historicalRecords =
    findings.filter(
      (finding) =>
        finding.disposition ===
        "HISTORICAL / LEGACY CANDIDATE"
    );

  if (
    historicalRecords.length === 0
  ) {
    console.log("NONE FOUND.");
    console.log();
  }

  for (const finding of historicalRecords) {
    console.log(
      `[HISTORICAL / LEGACY] ${finding.countyName}`
    );

    console.log(
      `SubCounty: ${finding.subCountyId} - ${finding.subCountyName}`
    );

    console.log(
      "No strong current populated SubCounty or Constituency match was found."
    );

    console.log(
      "This record MUST NOT be automatically deleted."
    );

    console.log();

    printDivider();
  }

  /**
   * ==========================================================================
   * UNKNOWN
   * ==========================================================================
   */

  console.log();
  console.log("=".repeat(82));
  console.log(
    "7. UNKNOWN / MANUAL REVIEW"
  );
  console.log("=".repeat(82));
  console.log();

  const unknownRecords =
    findings.filter(
      (finding) =>
        finding.disposition ===
        "UNKNOWN / MANUAL REVIEW"
    );

  if (unknownRecords.length === 0) {
    console.log("NONE FOUND.");
    console.log();
  }

  for (const finding of unknownRecords) {
    console.log(
      `[UNKNOWN] ${finding.countyName}`
    );

    console.log(
      `SubCounty: ${finding.subCountyId} - ${finding.subCountyName}`
    );

    console.log(
      `Score: ${finding.score}`
    );

    console.log();

    printDivider();
  }

  /**
   * ==========================================================================
   * COUNTY-BY-COUNTY SUMMARY
   * ==========================================================================
   */

  console.log();
  console.log("=".repeat(82));
  console.log(
    "8. COUNTY-BY-COUNTY EMPTY SUBCOUNTY SUMMARY"
  );
  console.log("=".repeat(82));
  console.log();

  const countyGroups =
    new Map<
      number,
      {
        countyName: string;
        findings: Finding[];
      }
    >();

  for (const finding of findings) {
    const existing =
      countyGroups.get(
        finding.countyId
      );

    if (existing) {
      existing.findings.push(
        finding
      );
    } else {
      countyGroups.set(
        finding.countyId,
        {
          countyName:
            finding.countyName,
          findings: [finding],
        }
      );
    }
  }

  for (
    const group of
    [...countyGroups.values()].sort(
      (a, b) =>
        a.countyName.localeCompare(
          b.countyName
        )
    )
  ) {
    console.log(
      `${group.countyName} — ${group.findings.length} empty SubCounty record(s)`
    );

    for (
      const finding of
      group.findings
    ) {
      console.log(
        `  ${finding.subCountyId} - ${finding.subCountyName} → ${finding.disposition}`
      );
    }

    console.log();
  }

  /**
   * ==========================================================================
   * FINAL SAFETY CONCLUSION
   * ==========================================================================
   */

  console.log("=".repeat(82));
  console.log(
    "FINAL SAFETY CONCLUSION"
  );
  console.log("=".repeat(82));
  console.log();

  console.log(
    `Total empty SubCounties analyzed: ${findings.length}`
  );

  console.log();

  console.log(
    "The audit has made NO database changes."
  );

  console.log();

  console.log(
    "DO NOT delete records solely because they are empty."
  );

  console.log(
    "DO NOT merge records solely because their names resemble each other."
  );

  console.log(
    "DO NOT modify the 131 records until their disposition is understood."
  );

  console.log();

  if (exactDuplicates > 0) {
    console.log(
      `There are ${pluralize(
        exactDuplicates,
        "exact duplicate candidate"
      )} requiring priority verification.`
    );
  } else {
    console.log(
      "No exact normalized-name duplicates were detected among empty SubCounties."
    );
  }

  if (directionalReviews > 0) {
    console.log(
      `${pluralize(
        directionalReviews,
        "directional/broad administrative case"
      )} require authoritative verification.`
    );
  }

  if (possibleDuplicates > 0) {
    console.log(
      `${pluralize(
        possibleDuplicates,
        "possible duplicate"
      )} require manual verification.`
    );
  }

  if (structuralAnomalies > 0) {
    console.log(
      `${pluralize(
        structuralAnomalies,
        "structural anomaly"
      )} require investigation.`
    );
  }

  console.log();

  console.log(
    "NEXT STEP: Use this output to determine which records,"
  );

  console.log(
    "if any, are candidates for a separate repair/merge operation."
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