import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

type GeoJsonFeature = {
  type: "Feature";
  properties?: {
    gid?: number;
    pop2009?: number;
    county?: string;
    subcounty?: string;
    ward?: string;
    uid?: number;
    scuid?: number;
    cuid?: number;
  };
  geometry?: unknown;
};

type GeoJsonCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

type Candidate = {
  id: number;
  countyId: number;
  county: string;
  name: string;
};

const COMPLETED_COUNTY_IDS = [
  51, // Homa Bay
  53, // Bungoma
  54, // Kakamega
  56, // Kericho
  64, // Marsabit
  65, // Meru
  67, // Nyandarua
  68, // Kitui
  74, // Makueni
  79, // Nairobi City
  87, // Kisii
];

const EXPECTED_REMAINING_COUNTIES = 36;
const EXPECTED_CANDIDATES = 41;

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/['"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+sub\s*county$/i, "")
    .replace(/\ssubcounty$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCounty(value: string | null | undefined): string {
  const normalized = normalize(value);

  if (
    normalized === "nairobi" ||
    normalized === "nairobi city" ||
    normalized === "nairobi city county"
  ) {
    return "nairobi";
  }

  return normalized;
}

function normalizeSubCounty(value: string | null | undefined): string {
  return normalize(value);
}

function makeKey(
  county: string | null | undefined,
  subCounty: string | null | undefined
): string {
  return `${normalizeCounty(county)}|||${normalizeSubCounty(subCounty)}`;
}

function makeCountyKey(county: string): string {
  return normalizeCounty(county);
}

function loadGeoJson(): GeoJsonCollection {
  const geoJsonPath = path.resolve(
    process.cwd(),
    "prisma",
    "data",
    "kenya-wards-1450.geojson"
  );

  console.log(`\nAuthoritative GeoJSON: ${geoJsonPath}`);

  if (!fs.existsSync(geoJsonPath)) {
    throw new Error(
      `SAFETY STOP: Authoritative GeoJSON not found: ${geoJsonPath}`
    );
  }

  const raw = fs.readFileSync(geoJsonPath, "utf8");
  const data = JSON.parse(raw) as GeoJsonCollection;

  if (!data || data.type !== "FeatureCollection") {
    throw new Error(
      "SAFETY STOP: GeoJSON is not a valid FeatureCollection."
    );
  }

  if (!Array.isArray(data.features)) {
    throw new Error(
      "SAFETY STOP: GeoJSON features array is missing."
    );
  }

  if (data.features.length !== 1450) {
    throw new Error(
      `SAFETY STOP: Expected exactly 1450 authoritative wards but found ${data.features.length}.`
    );
  }

  return data;
}

async function getCandidates(): Promise<Candidate[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: number;
      countyId: number;
      county: string;
      name: string;
      wardRefs: number;
      businessPartnerRefs: number;
      commodityDestinationRefs: number;
      commoditySourceRefs: number;
      farmRefs: number;
      farmerRefs: number;
    }>
  >`
    SELECT
      sc.id,
      c.id AS "countyId",
      c.name AS county,
      sc.name,

      (
        SELECT COUNT(*)::int
        FROM "Ward" w
        WHERE w."subCountyId" = sc.id
      ) AS "wardRefs",

      (
        SELECT COUNT(*)::int
        FROM "BusinessPartner" bp
        WHERE bp."subCountyId" = sc.id
      ) AS "businessPartnerRefs",

      (
        SELECT COUNT(*)::int
        FROM "CommodityTransaction" ct
        WHERE ct."destinationSubCountyId" = sc.id
      ) AS "commodityDestinationRefs",

      (
        SELECT COUNT(*)::int
        FROM "CommodityTransaction" ct
        WHERE ct."sourceSubCountyId" = sc.id
      ) AS "commoditySourceRefs",

      (
        SELECT COUNT(*)::int
        FROM "Farm" f
        WHERE f."subCountyId" = sc.id
      ) AS "farmRefs",

      (
        SELECT COUNT(*)::int
        FROM "Farmer" f
        WHERE f."subCountyId" = sc.id
      ) AS "farmerRefs"

    FROM "SubCounty" sc
    INNER JOIN "County" c
      ON c.id = sc."countyId"

    WHERE c.id NOT IN (
      ${COMPLETED_COUNTY_IDS[0]},
      ${COMPLETED_COUNTY_IDS[1]},
      ${COMPLETED_COUNTY_IDS[2]},
      ${COMPLETED_COUNTY_IDS[3]},
      ${COMPLETED_COUNTY_IDS[4]},
      ${COMPLETED_COUNTY_IDS[5]},
      ${COMPLETED_COUNTY_IDS[6]},
      ${COMPLETED_COUNTY_IDS[7]},
      ${COMPLETED_COUNTY_IDS[8]},
      ${COMPLETED_COUNTY_IDS[9]},
      ${COMPLETED_COUNTY_IDS[10]}
    )

    ORDER BY c.id, sc.id
  `;

  const candidates = rows.filter(
    (row) =>
      row.wardRefs === 0 &&
      row.businessPartnerRefs === 0 &&
      row.commodityDestinationRefs === 0 &&
      row.commoditySourceRefs === 0 &&
      row.farmRefs === 0 &&
      row.farmerRefs === 0
  );

  return candidates.map((row) => ({
    id: row.id,
    countyId: row.countyId,
    county: row.county,
    name: row.name,
  }));
}

async function main() {
  console.log("=".repeat(110));
  console.log("BATCH 3 AUTHORITATIVE GEOJSON AUDIT — READ ONLY");
  console.log("=".repeat(110));

  /*
   * STEP 1 — Confirm 36 counties remain.
   */
  const countyRows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM "County"
    WHERE id NOT IN (
      ${COMPLETED_COUNTY_IDS[0]},
      ${COMPLETED_COUNTY_IDS[1]},
      ${COMPLETED_COUNTY_IDS[2]},
      ${COMPLETED_COUNTY_IDS[3]},
      ${COMPLETED_COUNTY_IDS[4]},
      ${COMPLETED_COUNTY_IDS[5]},
      ${COMPLETED_COUNTY_IDS[6]},
      ${COMPLETED_COUNTY_IDS[7]},
      ${COMPLETED_COUNTY_IDS[8]},
      ${COMPLETED_COUNTY_IDS[9]},
      ${COMPLETED_COUNTY_IDS[10]}
    )
  `;

  const remainingCountyCount = Number(countyRows[0].count);

  console.log(`\nRemaining counties: ${remainingCountyCount}`);

  if (remainingCountyCount !== EXPECTED_REMAINING_COUNTIES) {
    throw new Error(
      `SAFETY STOP: Expected ${EXPECTED_REMAINING_COUNTIES} remaining counties but found ${remainingCountyCount}.`
    );
  }

  console.log("PASS: 36 remaining counties confirmed.");

  /*
   * STEP 2 — Load authoritative geography.
   */
  const geoJson = loadGeoJson();

  console.log(`GeoJSON features: ${geoJson.features.length}`);
  console.log("PASS: Exactly 1450 authoritative ward features loaded.");

  /*
   * STEP 3 — Build authoritative indexes.
   */
  const authoritativeKeys = new Set<string>();
  const authoritativeCountyKeys = new Set<string>();

  const authoritativeSubCountyNamesByCounty = new Map<
    string,
    Set<string>
  >();

  const authoritativeWardCountByKey = new Map<string, number>();

  for (const feature of geoJson.features) {
    const county = feature.properties?.county;
    const subCounty = feature.properties?.subcounty;

    if (!county || !subCounty) {
      throw new Error(
        "SAFETY STOP: Authoritative GeoJSON contains a feature without county/subcounty."
      );
    }

    const countyKey = makeCountyKey(county);
    const key = makeKey(county, subCounty);

    authoritativeCountyKeys.add(countyKey);
    authoritativeKeys.add(key);

    if (!authoritativeSubCountyNamesByCounty.has(countyKey)) {
      authoritativeSubCountyNamesByCounty.set(
        countyKey,
        new Set<string>()
      );
    }

    authoritativeSubCountyNamesByCounty
      .get(countyKey)!
      .add(normalizeSubCounty(subCounty));

    authoritativeWardCountByKey.set(
      key,
      (authoritativeWardCountByKey.get(key) ?? 0) + 1
    );
  }

  console.log(
    `Authoritative county/subcounty combinations: ${authoritativeKeys.size}`
  );
  console.log(
    `Authoritative counties: ${authoritativeCountyKeys.size}`
  );

  /*
   * STEP 4 — Get the 41 candidates again directly from DB.
   */
  const candidates = await getCandidates();

  console.log(`\nDatabase preliminary candidates: ${candidates.length}`);

  if (candidates.length !== EXPECTED_CANDIDATES) {
    throw new Error(
      `SAFETY STOP: Expected ${EXPECTED_CANDIDATES} preliminary candidates but found ${candidates.length}.`
    );
  }

  console.log("PASS: Exactly 41 preliminary candidates confirmed.");

  /*
   * STEP 5 — Authoritative comparison.
   */
  type AuditResult = Candidate & {
    key: string;
    authoritativeMatch: boolean;
    authoritativeWardCount: number;
  };

  const results: AuditResult[] = [];

  console.log("\n" + "=".repeat(110));
  console.log("AUTHORITATIVE CANDIDATE COMPARISON");
  console.log("=".repeat(110));

  for (const candidate of candidates) {
    const key = makeKey(candidate.county, candidate.name);

    const authoritativeMatch = authoritativeKeys.has(key);
    const authoritativeWardCount =
      authoritativeWardCountByKey.get(key) ?? 0;

    results.push({
      ...candidate,
      key,
      authoritativeMatch,
      authoritativeWardCount,
    });

    console.log(
      `${candidate.id}\t` +
        `County ${candidate.countyId} ${candidate.county}\t` +
        `${candidate.name}\t` +
        `${authoritativeMatch ? "MATCH" : "NO MATCH"}\t` +
        `authoritativeWards=${authoritativeWardCount}`
    );
  }

  /*
   * STEP 6 — Separate results.
   */
  const matches = results.filter((r) => r.authoritativeMatch);
  const noMatches = results.filter((r) => !r.authoritativeMatch);

  console.log("\n" + "=".repeat(110));
  console.log("AUTHORITATIVE AUDIT SUMMARY");
  console.log("=".repeat(110));

  console.log(`Candidates inspected: ${results.length}`);
  console.log(`Authoritative MATCH: ${matches.length}`);
  console.log(`Authoritative NO MATCH: ${noMatches.length}`);

  /*
   * STEP 7 — Display all authoritative matches.
   */
  console.log("\n" + "-".repeat(110));
  console.log("CANDIDATES THAT MATCH AUTHORITATIVE GEOGRAPHY");
  console.log("-".repeat(110));

  if (matches.length === 0) {
    console.log("None.");
  } else {
    for (const row of matches) {
      console.log(
        `${row.id}\t${row.name}\tCounty ${row.countyId} ${row.county}\t` +
          `authoritativeWards=${row.authoritativeWardCount}`
      );
    }
  }

  /*
   * STEP 8 — Display NO MATCH candidates.
   *
   * These are the preliminary deletion candidates.
   *
   * They still require the final transactional deletion audit.
   */
  console.log("\n" + "-".repeat(110));
  console.log("AUTHORITATIVE NO-MATCH CANDIDATES");
  console.log("-".repeat(110));

  if (noMatches.length === 0) {
    console.log("None.");
  } else {
    for (const row of noMatches) {
      console.log(
        `${row.id}\t${row.name}\tCounty ${row.countyId} ${row.county}`
      );
    }
  }

  /*
   * STEP 9 — Recheck every NO-MATCH candidate directly against
   * the database before treating it as a safe candidate.
   */
  console.log("\n" + "=".repeat(110));
  console.log("FINAL ZERO-REFERENCE RECHECK FOR NO-MATCH CANDIDATES");
  console.log("=".repeat(110));

  const unsafeCandidates: Array<{
    id: number;
    reason: string;
  }> = [];

  for (const candidate of noMatches) {
    const rows = await prisma.$queryRaw<
      Array<{
        exists: number;
        wardRefs: number;
        businessPartnerRefs: number;
        commodityDestinationRefs: number;
        commoditySourceRefs: number;
        farmRefs: number;
        farmerRefs: number;
      }>
    >`
      SELECT
        (
          SELECT COUNT(*)::int
          FROM "SubCounty"
          WHERE id = ${candidate.id}
            AND "countyId" = ${candidate.countyId}
        ) AS exists,

        (
          SELECT COUNT(*)::int
          FROM "Ward"
          WHERE "subCountyId" = ${candidate.id}
        ) AS "wardRefs",

        (
          SELECT COUNT(*)::int
          FROM "BusinessPartner"
          WHERE "subCountyId" = ${candidate.id}
        ) AS "businessPartnerRefs",

        (
          SELECT COUNT(*)::int
          FROM "CommodityTransaction"
          WHERE "destinationSubCountyId" = ${candidate.id}
        ) AS "commodityDestinationRefs",

        (
          SELECT COUNT(*)::int
          FROM "CommodityTransaction"
          WHERE "sourceSubCountyId" = ${candidate.id}
        ) AS "commoditySourceRefs",

        (
          SELECT COUNT(*)::int
          FROM "Farm"
          WHERE "subCountyId" = ${candidate.id}
        ) AS "farmRefs",

        (
          SELECT COUNT(*)::int
          FROM "Farmer"
          WHERE "subCountyId" = ${candidate.id}
        ) AS "farmerRefs"
    `;

    const row = rows[0];

    const problems: string[] = [];

    if (Number(row.exists) !== 1) {
      problems.push("candidate missing or county identity changed");
    }

    if (Number(row.wardRefs) !== 0) {
      problems.push(`Ward refs=${row.wardRefs}`);
    }

    if (Number(row.businessPartnerRefs) !== 0) {
      problems.push(
        `BusinessPartner refs=${row.businessPartnerRefs}`
      );
    }

    if (Number(row.commodityDestinationRefs) !== 0) {
      problems.push(
        `Commodity destination refs=${row.commodityDestinationRefs}`
      );
    }

    if (Number(row.commoditySourceRefs) !== 0) {
      problems.push(
        `Commodity source refs=${row.commoditySourceRefs}`
      );
    }

    if (Number(row.farmRefs) !== 0) {
      problems.push(`Farm refs=${row.farmRefs}`);
    }

    if (Number(row.farmerRefs) !== 0) {
      problems.push(`Farmer refs=${row.farmerRefs}`);
    }

    if (problems.length > 0) {
      unsafeCandidates.push({
        id: candidate.id,
        reason: problems.join("; "),
      });

      console.log(
        `UNSAFE\t${candidate.id}\t${candidate.name}\t${problems.join("; ")}`
      );
    } else {
      console.log(
        `SAFE\t${candidate.id}\t${candidate.name}\tall six FK paths = 0`
      );
    }
  }

  /*
   * STEP 10 — Final safe candidate list.
   */
  const safeCandidates = noMatches.filter(
    (candidate) =>
      !unsafeCandidates.some((unsafe) => unsafe.id === candidate.id)
  );

  console.log("\n" + "=".repeat(110));
  console.log("BATCH 3 SAFE CANDIDATE WHITELIST — PRELIMINARY");
  console.log("=".repeat(110));

  if (safeCandidates.length === 0) {
    console.log("No safe candidates.");
  } else {
    for (const candidate of safeCandidates) {
      console.log(
        `${candidate.id}\t${candidate.name}\tCounty ${candidate.countyId} ${candidate.county}`
      );
    }
  }

  /*
   * STEP 11 — Safety assertions.
   */
  console.log("\n" + "=".repeat(110));
  console.log("SAFETY ASSERTIONS");
  console.log("=".repeat(110));

  if (matches.length > 0) {
    console.log(
      `NOTICE: ${matches.length} preliminary candidates match authoritative geography and MUST NOT be deleted without review.`
    );
  } else {
    console.log(
      "PASS: No preliminary candidates matched authoritative geography."
    );
  }

  if (unsafeCandidates.length > 0) {
    console.log(
      `NOTICE: ${unsafeCandidates.length} NO-MATCH candidates failed the final zero-reference recheck.`
    );
  } else {
    console.log(
      "PASS: Every authoritative NO-MATCH candidate still has zero references."
    );
  }

  console.log(`\nPreliminary candidates: ${candidates.length}`);
  console.log(`Authoritative matches: ${matches.length}`);
  console.log(`Authoritative no-matches: ${noMatches.length}`);
  console.log(`Unsafe no-matches: ${unsafeCandidates.length}`);
  console.log(`Safe preliminary candidates: ${safeCandidates.length}`);

  console.log("\n" + "-".repeat(110));
  console.log("DATABASE SAFETY STATUS");
  console.log("-".repeat(110));
  console.log("INSERT: NONE");
  console.log("UPDATE: NONE");
  console.log("DELETE: NONE");

  console.log("\n" + "=".repeat(110));
  console.log("BATCH 3 AUTHORITATIVE AUDIT: COMPLETE");
  console.log("READ ONLY — NO DATABASE CHANGES WERE MADE.");
  console.log("=".repeat(110));

  console.log("\nNEXT STEP:");
  console.log(
    "Review the authoritative MATCH / NO MATCH results before constructing the deletion whitelist."
  );
}

main()
  .catch((error) => {
    console.error("\nBATCH 3 AUTHORITATIVE AUDIT: FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });