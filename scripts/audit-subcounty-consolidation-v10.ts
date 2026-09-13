import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync, writeFileSync } from "fs";

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

type Properties = Record<string, unknown>;

type GeoJSONFeature = {
  properties?: Properties;
};

type CanonicalSource = {
  countyCode: string;
  name: string;
};

type WardAssignment = {
  wardId: number;
  wardName: string;
  sourceGid: number;
  sourceUid: string | null;
  currentSubCountyId: number | null;
  currentSubCountyName: string | null;
  authoritativeSubCountyName: string;
  canonicalSubCountyId: number | null;
  canonicalSubCountyName: string | null;
};

type Candidate = {
  county: string;
  sourceId: number;
  sourceName: string;
  targetId: number | null;
  targetName: string | null;
  wardCount: number;
  wardIds: number[];
  sourceGids: number[];
  unresolvedWards: number;
  directRelations: {
    farmers: number;
    farms: number;
    businessPartners: number;
    destinationTransactions: number;
    sourceTransactions: number;
  };
  status:
    | "SAFE_CANDIDATE"
    | "BLOCKED_BY_RELATIONS"
    | "MANUAL_REVIEW"
    | "ALREADY_CANONICAL";
  reason: string;
};

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/sub[\s-]*county/g, "")
    .replace(/subcounty/g, "")
    .replace(/county/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * These are confirmed mappings where the administrative source
 * name and database canonical name are known to differ.
 *
 * IMPORTANT:
 * These mappings are used only to resolve the canonical target.
 * They do NOT automatically authorize migration.
 */
const VERIFIED_SUBCOUNTY_FALLBACKS: Record<
  string,
  string
> = {
  "migori::awendo": "Awendo",
  "migori::nyatike": "Nyatike",
  "migori::kuria west": "Kuria West",
  "migori::suna west": "Suna West",

  "machakos::athi river": "Mavoko",
  "machakos::machakos": "Machakos Town",
  "machakos::mwala": "Mwala",

  "homa bay::ndhiwa": "Ndhiwa",
  "homa bay::karachuonyo": "Karachuonyo",

  "bungoma::cheptais": "Mt Elgon",
  "bungoma::tongaren": "Tongaren",

  "kakamega::malava": "Malava",
  "kakamega::navakholo": "Navakholo",
  "kakamega::mumias east": "Mumias East",

  "taita taveta::taveta": "Taveta",
  "taita taveta::mwatate": "Mwatate",
  "taita taveta::voi": "Voi",

  "lamu::lamu west": "Lamu West",

  "meru::imenti central": "Imenti Central",

  "west pokot::pokot north": "Pokot North",
  "west pokot::pokot central": "Pokot Central",

  "nyandarua::olkalou": "Ol Kalou",

  "nyeri::nyeri central": "Nyeri Town",

  "kirinyaga::kirinyaga east": "Gichugu",

  "muranga::kiharu": "Kiharu",
  "muranga::muranga south": "Kandara",
  "muranga::gatanga": "Gatanga",
  "muranga::kangema": "Kangema",

  "samburu::samburu central": "Samburu East",

  "kiambu::kiambu town": "Kiambu",

  "kwale::lunga lunga": "Lunga Lunga",

  "nakuru::nakuru east": "Nakuru Town East",

  "nyamira::manga": "Kitutu Masaba North",

  "narok::transmara east": "Trans Mara East",

  "baringo::marigat": "Baringo South",

  "kajiado::loitokitok": "Kajiado South",

  "tharaka nithi::tharaka south": "Tharaka",
};

const COUNTY_SUBCOUNTY_RULES: Record<
  string,
  string
> = {
  "isiolo::isiolo": "Isiolo North",
  "mandera::mandera north": "Mandera North",
  "kericho::belgut": "Belgut",
};

/*
 * Confirmed completed migrations.
 *
 * These records must never appear as candidates again.
 */
const COMPLETED_MIGRATIONS = new Set([
  "463",
  "467",
  "352",
]);

function canonicalKey(
  countyName: string,
  subCountyName: string,
): string {
  return `${normalize(countyName)}::${normalize(
    subCountyName,
  )}`;
}

function getCountyName(
  properties: Properties,
): string {
  return String(properties.county ?? "").trim();
}

function getSubCountyName(
  properties: Properties,
): string {
  return String(
    properties.subcounty ??
      properties.subCounty ??
      "",
  ).trim();
}

function resolveCanonicalSourceName(
  countyName: string,
  authoritativeSubCountyName: string,
): string | null {
  const key = canonicalKey(
    countyName,
    authoritativeSubCountyName,
  );

  const fallback =
    VERIFIED_SUBCOUNTY_FALLBACKS[key];

  if (fallback) {
    return fallback;
  }

  const countyRule =
    COUNTY_SUBCOUNTY_RULES[key];

  if (countyRule) {
    return countyRule;
  }

  return authoritativeSubCountyName;
}

async function main() {
  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "SUBCOUNTY CONSOLIDATION AUDIT V10",
  );
  console.log(
    "CURRENT DATABASE STATE — READ-ONLY",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "NO DATABASE CHANGES WILL BE MADE.",
  );
  console.log("");

  /*
   * ----------------------------------------------------------
   * 1. LOAD DATABASE
   * ----------------------------------------------------------
   */

  const counties = await prisma.county.findMany({
    orderBy: {
      id: "asc",
    },
  });

  const subCounties =
    await prisma.subCounty.findMany({
      include: {
        county: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  const wards = await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      sourceGid: true,
      sourceUid: true,
      subCountyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `Database counties:         ${counties.length}`,
  );

  console.log(
    `Database SubCounties:      ${subCounties.length}`,
  );

  console.log(
    `Database wards:            ${wards.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 2. LOAD AUTHORITATIVE SUBCOUNTIES
   * ----------------------------------------------------------
   */

  const canonicalSource =
    JSON.parse(
      readFileSync(
        "prisma/data/subcounties.json",
        "utf8",
      ),
    ) as CanonicalSource[];

  console.log("");
  console.log(
    `Canonical source records: ${canonicalSource.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 3. LOAD AUTHORITATIVE WARD FEATURES
   * ----------------------------------------------------------
   */

  const geojson = JSON.parse(
    readFileSync(
      "prisma/data/kenya-wards-1450.geojson",
      "utf8",
    ),
  );

  const features: GeoJSONFeature[] =
    Array.isArray(geojson.features)
      ? geojson.features
      : [];

  console.log(
    `Authoritative ward features: ${features.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 4. BUILD AUTHORITATIVE GID MAP
   * ----------------------------------------------------------
   */

  const authoritativeByGid =
    new Map<number, Properties>();

  const duplicateAuthoritativeGids =
    new Set<number>();

  for (const feature of features) {
    const properties =
      feature.properties ?? {};

    const gid = Number(properties.gid);

    if (!Number.isFinite(gid)) {
      continue;
    }

    if (authoritativeByGid.has(gid)) {
      duplicateAuthoritativeGids.add(gid);
    }

    authoritativeByGid.set(
      gid,
      properties,
    );
  }

  console.log(
    `Authoritative GID identities: ${authoritativeByGid.size}`,
  );

  if (duplicateAuthoritativeGids.size > 0) {
    throw new Error(
      `SAFETY FAILURE: Duplicate authoritative GIDs found: ${[
        ...duplicateAuthoritativeGids,
      ].join(", ")}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * 5. BUILD CANONICAL DB RESOLUTION
   * ----------------------------------------------------------
   */

  const dbByCountyAndNormalizedName =
    new Map<string, typeof subCounties>();

  for (const subCounty of subCounties) {
    const key = canonicalKey(
      subCounty.county.name,
      subCounty.name,
    );

    const existing =
      dbByCountyAndNormalizedName.get(
        key,
      ) ?? [];

    existing.push(subCounty);

    dbByCountyAndNormalizedName.set(
      key,
      existing,
    );
  }

  const canonicalDbBySource =
    new Map<string, (typeof subCounties)[number]>();

  const unresolvedCanonical: CanonicalSource[] =
    [];

  const ambiguousCanonical: {
    source: CanonicalSource;
    matches: number[];
  }[] = [];

  for (const source of canonicalSource) {
    const county = counties.find(
      (item) =>
        item.code === source.countyCode,
    );

    if (!county) {
      unresolvedCanonical.push(source);
      continue;
    }

    const key = canonicalKey(
      county.name,
      source.name,
    );

    const matches =
      dbByCountyAndNormalizedName.get(
        key,
      ) ?? [];

    if (matches.length === 1) {
      canonicalDbBySource.set(
        `${source.countyCode}::${normalize(
          source.name,
        )}`,
        matches[0],
      );
      continue;
    }

    /*
     * Prefer an exact source-name match if more than
     * one normalized candidate exists.
     */
    const exactMatches = matches.filter(
      (item) =>
        item.name === source.name,
    );

    if (exactMatches.length === 1) {
      canonicalDbBySource.set(
        `${source.countyCode}::${normalize(
          source.name,
        )}`,
        exactMatches[0],
      );
      continue;
    }

    if (matches.length === 0) {
      unresolvedCanonical.push(source);
    } else {
      ambiguousCanonical.push({
        source,
        matches: matches.map(
          (item) => item.id,
        ),
      });
    }
  }

  console.log("");
  console.log(
    "CANONICAL SOURCE → DATABASE RESOLUTION",
  );
  console.log(
    "------------------------------------------------------------",
  );

  console.log(
    `Canonical records:       ${canonicalSource.length}`,
  );

  console.log(
    `Resolved canonical DB:   ${canonicalDbBySource.size}`,
  );

  console.log(
    `Unresolved canonical:    ${unresolvedCanonical.length}`,
  );

  console.log(
    `Ambiguous canonical:     ${ambiguousCanonical.length}`,
  );

  if (unresolvedCanonical.length > 0) {
    console.log("");
    console.log("UNRESOLVED CANONICAL RECORDS");

    for (const source of unresolvedCanonical) {
      console.log(
        `${source.countyCode} | ${source.name}`,
      );
    }
  }

  if (ambiguousCanonical.length > 0) {
    console.log("");
    console.log(
      "AMBIGUOUS CANONICAL RECORDS",
    );

    for (const item of ambiguousCanonical) {
      console.log(
        `${item.source.countyCode} | ${item.source.name} | DB IDs=${item.matches.join(
          ", ",
        )}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * 6. MAP EVERY DATABASE WARD TO AUTHORITATIVE SOURCE
   * ----------------------------------------------------------
   */

  const assignments: WardAssignment[] =
    [];

  const unmatchedDatabaseGids: number[] = [];

  for (const ward of wards) {
    if (ward.sourceGid === null) {
      unmatchedDatabaseGids.push(
        ward.id,
      );
      continue;
    }

    const authoritative =
      authoritativeByGid.get(
        ward.sourceGid,
      );

    if (!authoritative) {
      unmatchedDatabaseGids.push(
        ward.id,
      );
      continue;
    }

    const countyName =
      getCountyName(authoritative);

    const authoritativeSubCountyName =
      getSubCountyName(authoritative);

    const canonicalName =
      resolveCanonicalSourceName(
        countyName,
        authoritativeSubCountyName,
      );

    let canonicalDb:
      | (typeof subCounties)[number]
      | null = null;

    if (canonicalName) {
      const county =
        counties.find(
          (item) =>
            normalize(item.name) ===
            normalize(countyName),
        );

      if (county) {
        const key =
          `${county.code}::${normalize(
            canonicalName,
          )}`;

        canonicalDb =
          canonicalDbBySource.get(
            key,
          ) ?? null;
      }
    }

    const currentSubCounty =
      ward.subCountyId === null
        ? null
        : subCounties.find(
            (item) =>
              item.id ===
              ward.subCountyId,
          ) ?? null;

    assignments.push({
      wardId: ward.id,
      wardName: ward.name,
      sourceGid: ward.sourceGid,
      sourceUid: ward.sourceUid,
      currentSubCountyId:
        ward.subCountyId,
      currentSubCountyName:
        currentSubCounty?.name ?? null,
      authoritativeSubCountyName,
      canonicalSubCountyId:
        canonicalDb?.id ?? null,
      canonicalSubCountyName:
        canonicalDb?.name ?? null,
    });
  }

  console.log("");
  console.log(
    "WARD → CANONICAL TARGET RESOLUTION",
  );
  console.log(
    "------------------------------------------------------------",
  );

  console.log(
    `Database wards:              ${wards.length}`,
  );

  console.log(
    `Ward assignments built:      ${assignments.length}`,
  );

  console.log(
    `Database wards unmatched:    ${unmatchedDatabaseGids.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 7. GROUP WARDS BY CURRENT SUBCOUNTY
   * ----------------------------------------------------------
   */

  const wardsByCurrentSubCounty =
    new Map<number, WardAssignment[]>();

  for (const assignment of assignments) {
    if (
      assignment.currentSubCountyId ===
      null
    ) {
      continue;
    }

    const existing =
      wardsByCurrentSubCounty.get(
        assignment.currentSubCountyId,
      ) ?? [];

    existing.push(assignment);

    wardsByCurrentSubCounty.set(
      assignment.currentSubCountyId,
      existing,
    );
  }

  /*
   * ----------------------------------------------------------
   * 8. IDENTIFY POPULATED SUBCOUNTIES
   * ----------------------------------------------------------
   */

  const populatedSubCounties =
    subCounties.filter(
      (subCounty) =>
        wardsByCurrentSubCounty.has(
          subCounty.id,
        ),
    );

  console.log(
    `Populated SubCounties:       ${populatedSubCounties.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 9. AUDIT EACH POPULATED SUBCOUNTY
   * ----------------------------------------------------------
   */

  const candidates: Candidate[] = [];

  for (const source of populatedSubCounties) {
    /*
     * Skip migrations already completed.
     */
    if (
      COMPLETED_MIGRATIONS.has(
        String(source.id),
      )
    ) {
      continue;
    }

    const sourceWards =
      wardsByCurrentSubCounty.get(
        source.id,
      ) ?? [];

    const unresolved =
      sourceWards.filter(
        (ward) =>
          ward.canonicalSubCountyId ===
          null,
      );

    const targetIds = [
      ...new Set(
        sourceWards
          .map(
            (ward) =>
              ward.canonicalSubCountyId,
          )
          .filter(
            (
              id,
            ): id is number =>
              id !== null,
          ),
      ),
    ];

    /*
     * If some wards cannot be resolved,
     * this source cannot be automatically migrated.
     */
    if (
      unresolved.length > 0
    ) {
      candidates.push({
        county: source.county.name,
        sourceId: source.id,
        sourceName: source.name,
        targetId: null,
        targetName: null,
        wardCount: sourceWards.length,
        wardIds: sourceWards.map(
          (ward) => ward.wardId,
        ),
        sourceGids: sourceWards.map(
          (ward) => ward.sourceGid,
        ),
        unresolvedWards:
          unresolved.length,
        directRelations: {
          farmers: 0,
          farms: 0,
          businessPartners: 0,
          destinationTransactions: 0,
          sourceTransactions: 0,
        },
        status: "MANUAL_REVIEW",
        reason:
          "One or more wards could not be resolved to a canonical SubCounty.",
      });

      continue;
    }

    /*
     * Multiple canonical targets means this source
     * contains wards belonging to different administrative
     * SubCounties. Never migrate automatically.
     */
    if (targetIds.length !== 1) {
      candidates.push({
        county: source.county.name,
        sourceId: source.id,
        sourceName: source.name,
        targetId: null,
        targetName: null,
        wardCount: sourceWards.length,
        wardIds: sourceWards.map(
          (ward) => ward.wardId,
        ),
        sourceGids: sourceWards.map(
          (ward) => ward.sourceGid,
        ),
        unresolvedWards: 0,
        directRelations: {
          farmers: 0,
          farms: 0,
          businessPartners: 0,
          destinationTransactions: 0,
          sourceTransactions: 0,
        },
        status: "MANUAL_REVIEW",
        reason:
          `Wards resolve to ${targetIds.length} canonical targets.`,
      });

      continue;
    }

    const targetId =
      targetIds[0];

    const target =
      subCounties.find(
        (item) =>
          item.id === targetId,
      ) ?? null;

    if (!target) {
      candidates.push({
        county: source.county.name,
        sourceId: source.id,
        sourceName: source.name,
        targetId,
        targetName: null,
        wardCount: sourceWards.length,
        wardIds: sourceWards.map(
          (ward) => ward.wardId,
        ),
        sourceGids: sourceWards.map(
          (ward) => ward.sourceGid,
        ),
        unresolvedWards: 0,
        directRelations: {
          farmers: 0,
          farms: 0,
          businessPartners: 0,
          destinationTransactions: 0,
          sourceTransactions: 0,
        },
        status: "MANUAL_REVIEW",
        reason:
          "Canonical target ID does not exist in current database.",
      });

      continue;
    }

    /*
     * If the current source is already the canonical target,
     * it is not a migration candidate.
     */
    if (
      source.id === target.id
    ) {
      candidates.push({
        county: source.county.name,
        sourceId: source.id,
        sourceName: source.name,
        targetId: target.id,
        targetName: target.name,
        wardCount: sourceWards.length,
        wardIds: sourceWards.map(
          (ward) => ward.wardId,
        ),
        sourceGids: sourceWards.map(
          (ward) => ward.sourceGid,
        ),
        unresolvedWards: 0,
        directRelations: {
          farmers: 0,
          farms: 0,
          businessPartners: 0,
          destinationTransactions: 0,
          sourceTransactions: 0,
        },
        status:
          "ALREADY_CANONICAL",
        reason:
          "Current SubCounty is the resolved canonical database record.",
      });

      continue;
    }

    /*
     * Same county is mandatory.
     */
    if (
      source.countyId !==
      target.countyId
    ) {
      candidates.push({
        county: source.county.name,
        sourceId: source.id,
        sourceName: source.name,
        targetId: target.id,
        targetName: target.name,
        wardCount: sourceWards.length,
        wardIds: sourceWards.map(
          (ward) => ward.wardId,
        ),
        sourceGids: sourceWards.map(
          (ward) => ward.sourceGid,
        ),
        unresolvedWards: 0,
        directRelations: {
          farmers: 0,
          farms: 0,
          businessPartners: 0,
          destinationTransactions: 0,
          sourceTransactions: 0,
        },
        status: "MANUAL_REVIEW",
        reason:
          "Source and canonical target belong to different counties.",
      });

      continue;
    }

    /*
     * Check target wards.
     */
    const targetWards =
      wardsByCurrentSubCounty.get(
        target.id,
      ) ?? [];

    /*
     * A non-empty target must not be automatically
     * merged.
     */
    if (
      targetWards.length > 0
    ) {
      candidates.push({
        county: source.county.name,
        sourceId: source.id,
        sourceName: source.name,
        targetId: target.id,
        targetName: target.name,
        wardCount: sourceWards.length,
        wardIds: sourceWards.map(
          (ward) => ward.wardId,
        ),
        sourceGids: sourceWards.map(
          (ward) => ward.sourceGid,
        ),
        unresolvedWards: 0,
        directRelations: {
          farmers: 0,
          farms: 0,
          businessPartners: 0,
          destinationTransactions: 0,
          sourceTransactions: 0,
        },
        status: "MANUAL_REVIEW",
        reason:
          `Canonical target already contains ${targetWards.length} wards.`,
      });

      continue;
    }

    /*
     * --------------------------------------------------------
     * DIRECT RELATIONS
     * --------------------------------------------------------
     */

    const farmers =
      await prisma.farmer.count({
        where: {
          subCountyId: source.id,
        },
      });

    const farms =
      await prisma.farm.count({
        where: {
          subCountyId: source.id,
        },
      });

    const businessPartners =
      await prisma.businessPartner.count({
        where: {
          subCountyId: source.id,
        },
      });

    const destinationTransactions =
      await prisma.commodityTransaction.count(
        {
          where: {
            destinationSubCountyId:
              source.id,
          },
        },
      );

    const sourceTransactions =
      await prisma.commodityTransaction.count(
        {
          where: {
            sourceSubCountyId:
              source.id,
          },
        },
      );

    const relations = {
      farmers,
      farms,
      businessPartners,
      destinationTransactions,
      sourceTransactions,
    };

    const relationsClear =
      farmers === 0 &&
      farms === 0 &&
      businessPartners === 0 &&
      destinationTransactions === 0 &&
      sourceTransactions === 0;

    /*
     * --------------------------------------------------------
     * SAFE CANDIDATE
     * --------------------------------------------------------
     */

    if (relationsClear) {
      candidates.push({
        county: source.county.name,
        sourceId: source.id,
        sourceName: source.name,
        targetId: target.id,
        targetName: target.name,
        wardCount: sourceWards.length,
        wardIds: sourceWards.map(
          (ward) => ward.wardId,
        ),
        sourceGids: sourceWards.map(
          (ward) => ward.sourceGid,
        ),
        unresolvedWards: 0,
        directRelations: relations,
        status: "SAFE_CANDIDATE",
        reason:
          "All wards resolve to one empty canonical target and all direct relations are zero.",
      });
    } else {
      candidates.push({
        county: source.county.name,
        sourceId: source.id,
        sourceName: source.name,
        targetId: target.id,
        targetName: target.name,
        wardCount: sourceWards.length,
        wardIds: sourceWards.map(
          (ward) => ward.wardId,
        ),
        sourceGids: sourceWards.map(
          (ward) => ward.sourceGid,
        ),
        unresolvedWards: 0,
        directRelations: relations,
        status:
          "BLOCKED_BY_RELATIONS",
        reason:
          "Source SubCounty has direct dependent records and must be inspected before migration.",
      });
    }
  }

  /*
   * ----------------------------------------------------------
   * 10. SUMMARY
   * ----------------------------------------------------------
   */

  const safe =
    candidates.filter(
      (item) =>
        item.status ===
        "SAFE_CANDIDATE",
    );

  const blocked =
    candidates.filter(
      (item) =>
        item.status ===
        "BLOCKED_BY_RELATIONS",
    );

  const manualReview =
    candidates.filter(
      (item) =>
        item.status ===
        "MANUAL_REVIEW",
    );

  const alreadyCanonical =
    candidates.filter(
      (item) =>
        item.status ===
        "ALREADY_CANONICAL",
    );

  const safeWardCount =
    safe.reduce(
      (sum, item) =>
        sum + item.wardCount,
      0,
    );

  const blockedWardCount =
    blocked.reduce(
      (sum, item) =>
        sum + item.wardCount,
      0,
    );

  const reviewWardCount =
    manualReview.reduce(
      (sum, item) =>
        sum + item.wardCount,
      0,
    );

  const canonicalWardCount =
    alreadyCanonical.reduce(
      (sum, item) =>
        sum + item.wardCount,
      0,
    );

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "V10 CONSOLIDATION SUMMARY",
  );
  console.log(
    "============================================================");

  console.log(
    `Populated SubCounties:       ${populatedSubCounties.length}`,
  );

  console.log(
    `SAFE legacy migrations:      ${safe.length}`,
  );

  console.log(
    `Blocked by relations:        ${blocked.length}`,
  );

  console.log(
    `Already canonical:           ${alreadyCanonical.length}`,
  );

  console.log(
    `Manual review:               ${manualReview.length}`,
  );

  console.log("");
  console.log(
    `Wards in safe migrations:    ${safeWardCount}`,
  );

  console.log(
    `Wards in blocked records:    ${blockedWardCount}`,
  );

  console.log(
    `Wards in canonical records:  ${canonicalWardCount}`,
  );

  console.log(
    `Wards requiring review:      ${reviewWardCount}`,
  );

  /*
   * ----------------------------------------------------------
   * 11. SAFE CANDIDATES
   * ----------------------------------------------------------
   */

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "SAFE LEGACY MIGRATIONS",
  );
  console.log(
    "============================================================");

  if (safe.length === 0) {
    console.log("None.");
  } else {
    for (const item of safe) {
      console.log(
        `${item.county} | ` +
          `${item.sourceId} ${item.sourceName} → ` +
          `${item.targetId} ${item.targetName} | ` +
          `wards=${item.wardCount} | ` +
          `GIDs=${item.sourceGids.join(", ")}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * 12. BLOCKED
   * ----------------------------------------------------------
   */

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "BLOCKED BY DIRECT RELATIONS",
  );
  console.log(
    "============================================================");

  if (blocked.length === 0) {
    console.log("None.");
  } else {
    for (const item of blocked) {
      console.log(
        `${item.county} | ` +
          `${item.sourceId} ${item.sourceName} → ` +
          `${item.targetId} ${item.targetName} | ` +
          `wards=${item.wardCount}`,
      );

      console.log(
        `  Farmers=${item.directRelations.farmers} ` +
          `Farms=${item.directRelations.farms} ` +
          `BusinessPartners=${item.directRelations.businessPartners} ` +
          `DestinationTx=${item.directRelations.destinationTransactions} ` +
          `SourceTx=${item.directRelations.sourceTransactions}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * 13. MANUAL REVIEW
   * ----------------------------------------------------------
   */

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "MANUAL REVIEW",
  );
  console.log(
    "============================================================");

  if (manualReview.length === 0) {
    console.log("None.");
  } else {
    for (const item of manualReview) {
      console.log(
        `${item.county} | ` +
          `${item.sourceId} ${item.sourceName} | ` +
          `wards=${item.wardCount} | ` +
          `${item.reason}`,
      );

      if (
        item.targetId !== null
      ) {
        console.log(
          `  Proposed target: ${item.targetId} ${item.targetName}`,
        );
      }

      if (
        item.sourceGids.length > 0
      ) {
        console.log(
          `  GIDs: ${item.sourceGids.join(", ")}`,
        );
      }
    }
  }

  /*
   * ----------------------------------------------------------
   * 14. FINAL WARD ACCOUNTING
   * ----------------------------------------------------------
   */

  const assignmentWardIds =
    new Set(
      assignments.map(
        (item) => item.wardId,
      ),
    );

  const databaseWardIds =
    new Set(
      wards.map(
        (ward) => ward.id,
      ),
    );

  const missingWardIds =
    wards
      .filter(
        (ward) =>
          !assignmentWardIds.has(
            ward.id,
          ),
      )
      .map(
        (ward) => ward.id,
      );

  const extraAssignmentIds =
    assignments
      .filter(
        (assignment) =>
          !databaseWardIds.has(
            assignment.wardId,
          ),
      )
      .map(
        (assignment) =>
          assignment.wardId,
      );

  const duplicateAssignmentIds =
    assignments
      .map(
        (assignment) =>
          assignment.wardId,
      )
      .filter(
        (id, index, array) =>
          array.indexOf(id) !==
          index,
      );

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "FINAL V10 SAFETY CHECK",
  );
  console.log(
    "============================================================");

  console.log(
    `Database wards:               ${wards.length}`,
  );

  console.log(
    `Assigned wards:               ${assignments.length}`,
  );

  console.log(
    `Missing ward IDs:             ${missingWardIds.length}`,
  );

  console.log(
    `Extra assignment IDs:         ${extraAssignmentIds.length}`,
  );

  console.log(
    `Duplicate assignments:        ${duplicateAssignmentIds.length}`,
  );

  console.log(
    `Unmatched database GIDs:      ${unmatchedDatabaseGids.length}`,
  );

  if (
    missingWardIds.length === 0 &&
    extraAssignmentIds.length === 0 &&
    duplicateAssignmentIds.length === 0 &&
    unmatchedDatabaseGids.length === 0 &&
    assignments.length === wards.length
  ) {
    console.log("");
    console.log(
      "PASS — every database ward is accounted for exactly once.",
    );
  } else {
    console.log("");
    console.log(
      "FAIL — ward accounting is incomplete.",
    );

    if (
      missingWardIds.length > 0
    ) {
      console.log(
        `Missing IDs: ${missingWardIds.join(", ")}`,
      );
    }

    if (
      extraAssignmentIds.length > 0
    ) {
      console.log(
        `Extra IDs: ${extraAssignmentIds.join(", ")}`,
      );
    }

    if (
      duplicateAssignmentIds.length > 0
    ) {
      console.log(
        `Duplicate IDs: ${duplicateAssignmentIds.join(", ")}`,
      );
    }

    if (
      unmatchedDatabaseGids.length > 0
    ) {
      console.log(
        `Unmatched DB ward IDs: ${unmatchedDatabaseGids.join(", ")}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * 15. EXPORT RESULTS
   * ----------------------------------------------------------
   */

  const output = {
    audit: "V10",
    readOnly: true,
    generatedAt:
      new Date().toISOString(),

    database: {
      counties: counties.length,
      subCounties:
        subCounties.length,
      wards: wards.length,
    },

    authoritative: {
      canonicalSubCounties:
        canonicalSource.length,
      wardFeatures:
        features.length,
      authoritativeGids:
        authoritativeByGid.size,
    },

    resolution: {
      canonicalResolved:
        canonicalDbBySource.size,
      canonicalUnresolved:
        unresolvedCanonical.length,
      canonicalAmbiguous:
        ambiguousCanonical.length,
      databaseWardsAssigned:
        assignments.length,
      databaseWardsUnmatched:
        unmatchedDatabaseGids.length,
    },

    summary: {
      populatedSubCounties:
        populatedSubCounties.length,
      safeMigrations:
        safe.length,
      blockedByRelations:
        blocked.length,
      alreadyCanonical:
        alreadyCanonical.length,
      manualReview:
        manualReview.length,
      wardsInSafeMigrations:
        safeWardCount,
      wardsInBlockedRecords:
        blockedWardCount,
      wardsInCanonicalRecords:
        canonicalWardCount,
      wardsRequiringReview:
        reviewWardCount,
    },

    safeMigrations: safe,

    blockedByRelations: blocked,

    manualReview,

    alreadyCanonical,

    safety: {
      databaseWardCount:
        wards.length,
      assignedWardCount:
        assignments.length,
      missingWardIds:
        missingWardIds,
      extraAssignmentIds:
        extraAssignmentIds,
      duplicateAssignmentIds:
        duplicateAssignmentIds,
      unmatchedDatabaseGids:
        unmatchedDatabaseGids,
      pass:
        missingWardIds.length === 0 &&
        extraAssignmentIds.length === 0 &&
        duplicateAssignmentIds.length === 0 &&
        unmatchedDatabaseGids.length === 0 &&
        assignments.length ===
          wards.length,
    },
  };

  const jsonPath =
    "prisma/data/subcounty-consolidation-v10.json";

  writeFileSync(
    jsonPath,
    JSON.stringify(
      output,
      null,
      2,
    ),
    "utf8",
  );

  const csvPath =
    "prisma/data/subcounty-consolidation-v10.csv";

  const csvRows = [
    [
      "county",
      "sourceId",
      "sourceName",
      "targetId",
      "targetName",
      "wardCount",
      "wardIds",
      "sourceGids",
      "status",
      "reason",
      "farmers",
      "farms",
      "businessPartners",
      "destinationTransactions",
      "sourceTransactions",
    ],
  ];

  for (const item of candidates) {
    csvRows.push([
      item.county,
      String(item.sourceId),
      item.sourceName,
      item.targetId === null
        ? ""
        : String(item.targetId),
      item.targetName ?? "",
      String(item.wardCount),
      item.wardIds.join(";"),
      item.sourceGids.join(";"),
      item.status,
      item.reason,
      String(
        item.directRelations.farmers,
      ),
      String(
        item.directRelations.farms,
      ),
      String(
        item.directRelations
          .businessPartners,
      ),
      String(
        item.directRelations
          .destinationTransactions,
      ),
      String(
        item.directRelations
          .sourceTransactions,
      ),
    ]);
  }

  const csvContent =
    csvRows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(
                /"/g,
                '""',
              )}"`,
          )
          .join(","),
      )
      .join("\n");

  writeFileSync(
    csvPath,
    csvContent,
    "utf8",
  );

  console.log("");
  console.log(
    `V10 JSON written to: ${jsonPath}`,
  );

  console.log(
    `V10 CSV written to:  ${csvPath}`,
  );

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "V10 AUDIT COMPLETE",
  );
  console.log(
    "READ-ONLY — NO DATABASE CHANGES",
  );
  console.log(
    "============================================================",
  );
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "============================================================",
    );
    console.error(
      "V10 AUDIT FAILED",
    );
    console.error(
      "============================================================",
    );
    console.error("");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });