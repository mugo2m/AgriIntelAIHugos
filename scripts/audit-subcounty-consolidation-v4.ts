import "dotenv/config";
import fs from "fs/promises";
import path from "path";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import subcounties from "../prisma/data/subcounties.json";

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

// ============================================================
// TYPES
// ============================================================

type SourceSubCounty = {
  code?: string;
  countyCode?: string;
  name: string;
  headquarters?: string | null;
};

type GeoJsonFeature = {
  type: string;
  properties?: Record<string, unknown>;
};

type WardSource = {
  gid: number;
  uid?: string;
  county: string;
  subcounty: string;
  ward: string;
};

type DbSubCounty = {
  id: number;
  name: string;
  countyId: number;
  county: {
    id: number;
    name: string;
  };
};

type Candidate = {
  legacyId: number;
  legacyName: string;
  countyId: number;
  countyName: string;
  targetId: number;
  targetName: string;
  wards: number;
  farmers: number;
  farms: number;
  businessPartners: number;
  destinationTransactions: number;
  sourceTransactions: number;
  resolution: string;
};

// ============================================================
// FILES
// ============================================================

const GEOJSON_FILE = path.join(
  process.cwd(),
  "prisma",
  "data",
  "kenya-wards-1450.geojson"
);

// ============================================================
// VERIFIED SUBCOUNTY FALLBACKS
// These are previously verified project rules.
// ============================================================

const VERIFIED_SUBCOUNTY_FALLBACKS: Record<string, string> = {
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

// ============================================================
// COUNTY + SUBCOUNTY VERIFIED RULES
// ============================================================

const COUNTY_SUBCOUNTY_RULES: Record<string, string> = {
  "isiolo::isiolo": "Isiolo North",
  "mandera::mandera north": "Mandera North",
  "kericho::belgut": "Ainamoi",
};

// ============================================================
// NORMALIZATION
// ============================================================

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`"]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bsub\s*county\b/g, " ")
    .replace(/\bsubcounty\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCounty(value: unknown): string {
  let x = normalize(value);

  const aliases: Record<string, string> = {
    "nairobi": "nairobi city",
    "nairobi county": "nairobi city",
    "muranga": "muranga",
    "muranga county": "muranga",
    "tharaka nithi": "tharaka nithi",
    "tharaka nithi county": "tharaka nithi",
    "taita taveta": "taita taveta",
  };

  return aliases[x] ?? x;
}

function normalizeSubCounty(value: unknown): string {
  return normalize(value);
}

function makeKey(
  county: string,
  subCounty: string
): string {
  return `${normalizeCounty(county)}::${normalizeSubCounty(subCounty)}`;
}

// ============================================================
// GEOJSON PROPERTY HELPERS
// ============================================================

function firstValue(
  properties: Record<string, unknown> | undefined,
  names: string[]
): string {
  if (!properties) {
    return "";
  }

  for (const name of names) {
    const value = properties[name];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value).trim();
    }
  }

  return "";
}

function getGid(
  properties: Record<string, unknown> | undefined
): number | null {
  const value = firstValue(properties, [
    "gid",
    "GID",
    "GID_1",
    "id",
    "ID",
  ]);

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function getUid(
  properties: Record<string, unknown> | undefined
): string {
  return firstValue(properties, [
    "uid",
    "UID",
    "sourceUid",
    "source_uid",
  ]);
}

function getCounty(
  properties: Record<string, unknown> | undefined
): string {
  return firstValue(properties, [
    "county",
    "County",
    "county_name",
    "COUNTY",
    "countyName",
  ]);
}

function getSubCounty(
  properties: Record<string, unknown> | undefined
): string {
  return firstValue(properties, [
    "subcounty",
    "sub_county",
    "subCounty",
    "SubCounty",
    "subcounty_name",
    "sub_county_name",
    "SUBCOUNTY",
  ]);
}

function getWard(
  properties: Record<string, unknown> | undefined
): string {
  return firstValue(properties, [
    "ward",
    "Ward",
    "ward_name",
    "WARD",
    "name",
  ]);
}

// ============================================================
// LOAD GEOJSON
// ============================================================

async function loadGeoJson(): Promise<GeoJsonFeature[]> {
  const raw = await fs.readFile(GEOJSON_FILE, "utf8");

  const data = JSON.parse(raw);

  if (
    !data ||
    data.type !== "FeatureCollection" ||
    !Array.isArray(data.features)
  ) {
    throw new Error(
      "Invalid kenya-wards-1450.geojson: expected FeatureCollection."
    );
  }

  return data.features as GeoJsonFeature[];
}

// ============================================================
// BUILD AUTHORITATIVE WARD INDEX
// ============================================================

function buildWardSourceIndex(
  features: GeoJsonFeature[]
): Map<number, WardSource> {
  const index = new Map<number, WardSource>();

  for (const feature of features) {
    const properties = feature.properties;

    const gid = getGid(properties);

    if (gid === null) {
      continue;
    }

    const county = getCounty(properties);
    const subcounty = getSubCounty(properties);
    const ward = getWard(properties);
    const uid = getUid(properties);

    if (!county || !subcounty || !ward) {
      continue;
    }

    if (index.has(gid)) {
      throw new Error(
        `Duplicate authoritative GID detected: ${gid}`
      );
    }

    index.set(gid, {
      gid,
      uid: uid || undefined,
      county,
      subcounty,
      ward,
    });
  }

  return index;
}

// ============================================================
// BUILD AUTHORITATIVE SUBCOUNTY INDEX
// ============================================================

function buildAuthoritativeSubCountyIndex(): Map<
  string,
  SourceSubCounty
> {
  const index = new Map<string, SourceSubCounty>();

  for (const raw of subcounties as SourceSubCounty[]) {
    const countyCode = raw.countyCode ?? "";
    const key = normalizeSubCounty(raw.name);

    if (!key) {
      continue;
    }

    // Store by normalized subcounty name.
    // County validation happens separately through the DB.
    if (!index.has(key)) {
      index.set(key, raw);
    }
  }

  return index;
}

// ============================================================
// RESOLVE AUTHORITATIVE SUBCOUNTY NAME
// ============================================================

function resolveAuthoritativeSubCountyName(
  county: string,
  wardSubCounty: string
): {
  name: string | null;
  method: string;
} {
  const countyKey = normalizeCounty(county);
  const subCountyKey = normalizeSubCounty(wardSubCounty);

  // ----------------------------------------------------------
  // 1. Verified county + subcounty fallback
  // ----------------------------------------------------------

  const fallbackKey = `${countyKey}::${subCountyKey}`;

  const verified =
    VERIFIED_SUBCOUNTY_FALLBACKS[fallbackKey];

  if (verified) {
    return {
      name: verified,
      method: "VERIFIED_SUBCOUNTY_FALLBACK",
    };
  }

  // ----------------------------------------------------------
  // 2. County + SubCounty rule
  // ----------------------------------------------------------

  const rule =
    COUNTY_SUBCOUNTY_RULES[fallbackKey];

  if (rule) {
    return {
      name: rule,
      method: "COUNTY_SUBCOUNTY_RULE",
    };
  }

  // ----------------------------------------------------------
  // 3. Direct authoritative source name
  //
  // The ward itself already carries the authoritative
  // SubCounty name.
  // ----------------------------------------------------------

  return {
    name: wardSubCounty.trim(),
    method: "AUTHORITATIVE_WARD_SUBCOUNTY",
  };
}

// ============================================================
// RESOLVE DB CANONICAL TARGET
// ============================================================

function findDbTargets(
  dbSubCounties: DbSubCounty[],
  countyName: string,
  authoritativeName: string
): DbSubCounty[] {
  const countyKey = normalizeCounty(countyName);
  const targetKey = normalizeSubCounty(authoritativeName);

  return dbSubCounties.filter((sc) => {
    return (
      normalizeCounty(sc.county.name) === countyKey &&
      normalizeSubCounty(sc.name) === targetKey
    );
  });
}

// ============================================================
// BUILD TARGET FROM ALL WARDS OF A LEGACY SUBCOUNTY
// ============================================================

function resolveTargetForLegacySubCounty(
  legacy: DbSubCounty,
  wards: Array<{
    id: number;
    sourceGid: number | null;
    sourceUid: string | null;
    name: string;
  }>,
  wardSourceIndex: Map<number, WardSource>,
  dbSubCounties: DbSubCounty[]
): {
  target: DbSubCounty | null;
  method: string;
  reason?: string;
} {
  if (wards.length === 0) {
    return {
      target: null,
      method: "NO_WARDS",
      reason: "SubCounty has no wards.",
    };
  }

  const resolvedNames = new Map<string, number>();

  for (const ward of wards) {
    if (ward.sourceGid === null) {
      return {
        target: null,
        method: "MISSING_SOURCE_GID",
        reason: `Ward ${ward.id} (${ward.name}) has no sourceGid.`,
      };
    }

    const source = wardSourceIndex.get(ward.sourceGid);

    if (!source) {
      return {
        target: null,
        method: "UNKNOWN_SOURCE_GID",
        reason: `Ward ${ward.id} (${ward.name}) has sourceGid ${ward.sourceGid}, but that GID is not in the authoritative GeoJSON.`,
      };
    }

    const resolution =
      resolveAuthoritativeSubCountyName(
        source.county,
        source.subcounty
      );

    if (!resolution.name) {
      return {
        target: null,
        method: resolution.method,
        reason: `Could not resolve authoritative SubCounty for GID ${source.gid}.`,
      };
    }

    const key = makeKey(
      source.county,
      resolution.name
    );

    resolvedNames.set(
      key,
      (resolvedNames.get(key) ?? 0) + 1
    );
  }

  // ----------------------------------------------------------
  // All wards must resolve to exactly one target.
  // ----------------------------------------------------------

  if (resolvedNames.size !== 1) {
    return {
      target: null,
      method: "CONFLICTING_WARD_TARGETS",
      reason:
        `Wards resolve to ${resolvedNames.size} different authoritative SubCounty targets.`,
    };
  }

  const onlyKey =
    Array.from(resolvedNames.keys())[0];

  const separator = onlyKey.indexOf("::");

  const authoritativeCounty =
    onlyKey.substring(0, separator);

  const authoritativeSubCounty =
    onlyKey.substring(separator + 2);

  const possibleTargets =
    dbSubCounties.filter((sc) => {
      return (
        normalizeCounty(sc.county.name) ===
          authoritativeCounty &&
        normalizeSubCounty(sc.name) ===
          authoritativeSubCounty
      );
    });

  if (possibleTargets.length === 0) {
    return {
      target: null,
      method: "CANONICAL_TARGET_NOT_FOUND",
      reason:
        `Authoritative target "${authoritativeSubCounty}" was resolved for county "${authoritativeCounty}", but no matching DB SubCounty exists.`,
    };
  }

  if (possibleTargets.length > 1) {
    return {
      target: null,
      method: "MULTIPLE_DB_TARGETS",
      reason:
        `More than one DB SubCounty matches authoritative target "${authoritativeSubCounty}" in county "${authoritativeCounty}".`,
    };
  }

  return {
    target: possibleTargets[0],
    method: "WARD_GID_AUTHORITATIVE_TARGET",
  };
}

// ============================================================
// MAIN AUDIT
// ============================================================

async function main() {
  console.log("");
  console.log("=".repeat(76));
  console.log("SUBCOUNTY CONSOLIDATION AUDIT V4");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("=".repeat(76));
  console.log("");

  // ----------------------------------------------------------
  // Load authoritative source
  // ----------------------------------------------------------

  const features = await loadGeoJson();

  console.log(
    `Authoritative ward features: ${features.length}`
  );

  if (features.length !== 1450) {
    throw new Error(
      `Expected 1450 authoritative ward features, found ${features.length}.`
    );
  }

  const wardSourceIndex =
    buildWardSourceIndex(features);

  console.log(
    `Authoritative GID identities: ${wardSourceIndex.size}`
  );

  if (wardSourceIndex.size !== 1450) {
    throw new Error(
      `Expected 1450 unique authoritative GIDs, found ${wardSourceIndex.size}.`
    );
  }

  // ----------------------------------------------------------
  // Load database
  // ----------------------------------------------------------

  const dbSubCounties =
    await prisma.subCounty.findMany({
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
      orderBy: [
        {
          countyId: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

  console.log(
    `Database SubCounties: ${dbSubCounties.length}`
  );

  // ----------------------------------------------------------
  // Load all wards
  // ----------------------------------------------------------

  const dbWards =
    await prisma.ward.findMany({
      select: {
        id: true,
        name: true,
        subCountyId: true,
        sourceGid: true,
        sourceUid: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  console.log(
    `Database wards: ${dbWards.length}`
  );

  // ----------------------------------------------------------
  // Relation counts
  // ----------------------------------------------------------

  const dbSubCountyRelations =
    await Promise.all(
      dbSubCounties.map(async (sc) => {
        const [
          wards,
          farmers,
          farms,
          businessPartners,
          destinationTransactions,
          sourceTransactions,
        ] = await Promise.all([
          prisma.ward.count({
            where: {
              subCountyId: sc.id,
            },
          }),

          prisma.farmer.count({
            where: {
              subCountyId: sc.id,
            },
          }),

          prisma.farm.count({
            where: {
              subCountyId: sc.id,
            },
          }),

          prisma.businessPartner.count({
            where: {
              subCountyId: sc.id,
            },
          }),

          prisma.commodityTransaction.count({
            where: {
              destinationSubCountyId: sc.id,
            },
          }),

          prisma.commodityTransaction.count({
            where: {
              sourceSubCountyId: sc.id,
            },
          }),
        ]);

        return {
          id: sc.id,
          wards,
          farmers,
          farms,
          businessPartners,
          destinationTransactions,
          sourceTransactions,
        };
      })
    );

  const relationMap = new Map(
    dbSubCountyRelations.map((x) => [
      x.id,
      x,
    ])
  );

  // ----------------------------------------------------------
  // Determine authoritative populated records
  //
  // A DB SubCounty is considered canonical if its normalized
  // county/name corresponds to one of the 330 authoritative
  // records.
  // ----------------------------------------------------------

  const authoritativeRecords =
    subcounties as SourceSubCounty[];

  const authoritativeKeys = new Set<string>();

  for (const record of authoritativeRecords) {
    authoritativeKeys.add(
      normalizeSubCounty(record.name)
    );
  }

  // ----------------------------------------------------------
  // Analyze every populated DB SubCounty
  // ----------------------------------------------------------

  const candidates: Candidate[] = [];
  const review: Array<{
    legacy: DbSubCounty;
    wards: number;
    farmers: number;
    farms: number;
    reason: string;
    method: string;
  }> = [];

  let populatedCount = 0;
  let canonicalPopulated = 0;
  let totalCandidateWards = 0;
  let totalReviewWards = 0;
  let totalCanonicalWards = 0;

  for (const sc of dbSubCounties) {
    const relations = relationMap.get(sc.id)!;

    if (relations.wards === 0) {
      continue;
    }

    populatedCount++;

    const wards = dbWards.filter(
      (ward) =>
        ward.subCountyId === sc.id
    );

    const resolution =
      resolveTargetForLegacySubCounty(
        sc,
        wards,
        wardSourceIndex,
        dbSubCounties
      );

    if (!resolution.target) {
      review.push({
        legacy: sc,
        wards: relations.wards,
        farmers: relations.farmers,
        farms: relations.farms,
        reason:
          resolution.reason ??
          "Unknown resolution failure.",
        method: resolution.method,
      });

      totalReviewWards += relations.wards;

      continue;
    }

    const target = resolution.target;

    if (target.id === sc.id) {
      canonicalPopulated++;

      totalCanonicalWards +=
        relations.wards;

      continue;
    }

    const candidate: Candidate = {
      legacyId: sc.id,
      legacyName: sc.name,
      countyId: sc.countyId,
      countyName: sc.county.name,
      targetId: target.id,
      targetName: target.name,
      wards: relations.wards,
      farmers: relations.farmers,
      farms: relations.farms,
      businessPartners:
        relations.businessPartners,
      destinationTransactions:
        relations.destinationTransactions,
      sourceTransactions:
        relations.sourceTransactions,
      resolution: resolution.method,
    };

    candidates.push(candidate);

    totalCandidateWards +=
      relations.wards;
  }

  // ----------------------------------------------------------
  // SAFETY CLASSIFICATION
  // ----------------------------------------------------------

  const safeCandidates =
    candidates.filter((x) => {
      return (
        x.targetId !== x.legacyId &&
        x.businessPartners === 0 &&
        x.destinationTransactions === 0 &&
        x.sourceTransactions === 0
      );
    });

  const blockedCandidates =
    candidates.filter((x) => {
      return !(
        x.targetId !== x.legacyId &&
        x.businessPartners === 0 &&
        x.destinationTransactions === 0 &&
        x.sourceTransactions === 0
      );
    });

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------

  console.log("");
  console.log("=".repeat(76));
  console.log("CONSOLIDATION SUMMARY");
  console.log("=".repeat(76));

  console.log(
    `Populated SubCounties:              ${populatedCount}`
  );

  console.log(
    `Resolved migration candidates:      ${candidates.length}`
  );

  console.log(
    `SAFE migration candidates:          ${safeCandidates.length}`
  );

  console.log(
    `Blocked migration candidates:       ${blockedCandidates.length}`
  );

  console.log(
    `Already canonical/populated:        ${canonicalPopulated}`
  );

  console.log(
    `Requires manual review:             ${review.length}`
  );

  console.log(
    `Wards in safe migration candidates: ${safeCandidates.reduce(
      (sum, x) => sum + x.wards,
      0
    )}`
  );

  console.log(
    `Wards in blocked candidates:        ${blockedCandidates.reduce(
      (sum, x) => sum + x.wards,
      0
    )}`
  );

  console.log(
    `Wards in canonical records:         ${totalCanonicalWards}`
  );

  console.log(
    `Wards requiring review:             ${totalReviewWards}`
  );

  console.log("");

  // ----------------------------------------------------------
  // SAFE CANDIDATES
  // ----------------------------------------------------------

  console.log("=".repeat(76));
  console.log("SAFE MIGRATION CANDIDATES");
  console.log("=".repeat(76));

  if (safeCandidates.length === 0) {
    console.log("NONE");
  } else {
    for (const x of safeCandidates) {
      console.log("");
      console.log(
        `${x.countyName} | ${x.legacyId} ${x.legacyName}`
      );

      console.log(
        `  TARGET: ${x.targetId} ${x.targetName}`
      );

      console.log(
        `  Wards: ${x.wards}`
      );

      console.log(
        `  Farmers: ${x.farmers}`
      );

      console.log(
        `  Farms: ${x.farms}`
      );

      console.log(
        `  Resolution: ${x.resolution}`
      );
    }
  }

  // ----------------------------------------------------------
  // BLOCKED CANDIDATES
  // ----------------------------------------------------------

  console.log("");
  console.log("=".repeat(76));
  console.log("BLOCKED MIGRATION CANDIDATES");
  console.log("=".repeat(76));

  if (blockedCandidates.length === 0) {
    console.log("NONE");
  } else {
    for (const x of blockedCandidates) {
      console.log("");
      console.log(
        `${x.countyName} | ${x.legacyId} ${x.legacyName}`
      );

      console.log(
        `  TARGET: ${x.targetId} ${x.targetName}`
      );

      console.log(
        `  Wards: ${x.wards}`
      );

      console.log(
        `  Farmers: ${x.farmers}`
      );

      console.log(
        `  Farms: ${x.farms}`
      );

      console.log(
        `  Business Partners: ${x.businessPartners}`
      );

      console.log(
        `  Destination Transactions: ${x.destinationTransactions}`
      );

      console.log(
        `  Source Transactions: ${x.sourceTransactions}`
      );

      console.log(
        `  Resolution: ${x.resolution}`
      );
    }
  }

  // ----------------------------------------------------------
  // MANUAL REVIEW
  // ----------------------------------------------------------

  console.log("");
  console.log("=".repeat(76));
  console.log("MANUAL REVIEW RECORDS");
  console.log("=".repeat(76));

  if (review.length === 0) {
    console.log("NONE");
  } else {
    for (const x of review) {
      console.log("");
      console.log(
        `${x.legacy.county.name} | ${x.legacy.id} ${x.legacy.name}`
      );

      console.log(
        `  Wards: ${x.wards}`
      );

      console.log(
        `  Farmers: ${x.farmers}`
      );

      console.log(
        `  Farms: ${x.farms}`
      );

      console.log(
        `  Method: ${x.method}`
      );

      console.log(
        `  Reason: ${x.reason}`
      );
    }
  }

  // ----------------------------------------------------------
  // FINAL WARD ACCOUNTING
  // ----------------------------------------------------------

  const accounted =
    totalCanonicalWards +
    totalCandidateWards +
    totalReviewWards;

  console.log("");
  console.log("=".repeat(76));
  console.log("FINAL SAFETY CHECK");
  console.log("=".repeat(76));

  console.log(
    `Database wards:          ${dbWards.length}`
  );

  console.log(
    `Canonical wards:         ${totalCanonicalWards}`
  );

  console.log(
    `Candidate wards:         ${totalCandidateWards}`
  );

  console.log(
    `Review wards:            ${totalReviewWards}`
  );

  console.log(
    `Accounted ward records:  ${accounted}`
  );

  const sourceGids = new Set<number>();

  for (const ward of dbWards) {
    if (ward.sourceGid !== null) {
      sourceGids.add(ward.sourceGid);
    }
  }

  console.log(
    `Unique DB sourceGids:    ${sourceGids.size}`
  );

  if (accounted !== dbWards.length) {
    throw new Error(
      `SAFETY FAILURE: ward accounting mismatch. Accounted ${accounted}, DB has ${dbWards.length}.`
    );
  }

  if (sourceGids.size !== 1450) {
    throw new Error(
      `SAFETY FAILURE: expected 1450 unique DB sourceGids, found ${sourceGids.size}.`
    );
  }

  console.log("");
  console.log(
    "PASS — all database wards are accounted for."
  );

  console.log("");
  console.log(
    "IMPORTANT: NO DATABASE CHANGES WERE MADE."
  );

  console.log(
    "This audit is still READ-ONLY."
  );

  console.log("=".repeat(76));
}

// ============================================================
// RUN
// ============================================================

main()
  .catch((error) => {
    console.error("");
    console.error("AUDIT FAILED:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });