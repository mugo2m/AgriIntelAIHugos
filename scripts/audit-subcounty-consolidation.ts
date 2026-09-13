import "dotenv/config";

import fs from "node:fs";
import path from "node:path";

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

const GEOJSON_FILE = path.resolve(
  process.cwd(),
  "prisma/data/kenya-wards-1450.geojson",
);

type GeoJsonFeature = {
  type: string;
  properties?: {
    gid?: number;
    uid?: string;
    scuid?: string;

    county?: string;
    county_name?: string;

    subcounty?: string;
    subcounty_name?: string;
    sub_county?: string;

    ward?: string;
    ward_name?: string;
    name?: string;
  };
};

type GeoJson = {
  type: string;
  features: GeoJsonFeature[];
};

type AuthoritativeSubCounty = {
  code?: string;
  countyCode: string;
  name: string;
  headquarters?: string | null;
};

type SourceWard = {
  gid: number;
  uid?: string;
  scuid?: string;
  county: string;
  subcounty: string;
  ward: string;
};

type LegacySubCounty = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
  wardCount: number;
};

type ConsolidationResult = {
  legacyId: number;
  legacyName: string;
  countyId: number;
  countyName: string;

  canonicalId: number | null;
  canonicalName: string | null;

  wardCount: number;

  sourceSubCounties: string[];
  sourceScuids: string[];

  confidence: "HIGH" | "MEDIUM" | "LOW" | "UNMATCHED";

  reason: string;

  businessPartners: number;
  farms: number;
  farmers: number;
  destinationTransactions: number;
  sourceTransactions: number;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCounty(value: string): string {
  const n = normalize(value);

  const aliases: Record<string, string> = {
    "tharaka nithi": "tharaka nithi",
    "tharaka nithi county": "tharaka nithi",
    "elgeyo marakwet": "elgeyo marakwet",
    "elgeyo marakwet county": "elgeyo marakwet",
    "muranga": "muranga",
    "muranga county": "muranga",
    "nairobi": "nairobi",
    "nairobi city": "nairobi",
  };

  return aliases[n] ?? n;
}

function cleanSubCountyName(value: string): string {
  return value
    .replace(/\bsub\s*county\b/gi, "")
    .replace(/\bsubcounty\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * These are the verified rules already established during
 * the previous SubCounty/ward matching work.
 *
 * We are reusing them here.
 */
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

const COUNTY_SUBCOUNTY_RULES: Record<string, string> = {
  "isiolo::isiolo": "Isiolo North",
  "mandera::mandera north": "Mandera North",
  "kericho::belgut": "Ainamoi",
};

function getSourceSubCountyName(
  properties: GeoJsonFeature["properties"],
): string {
  return (
    properties?.subcounty ??
    properties?.subcounty_name ??
    properties?.sub_county ??
    ""
  ).trim();
}

function getSourceCountyName(
  properties: GeoJsonFeature["properties"],
): string {
  return (
    properties?.county ??
    properties?.county_name ??
    ""
  ).trim();
}

function getSourceWardName(
  properties: GeoJsonFeature["properties"],
): string {
  return (
    properties?.ward ??
    properties?.ward_name ??
    properties?.name ??
    ""
  ).trim();
}

function getCanonicalName(
  countyName: string,
  sourceSubCountyName: string,
): {
  name: string | null;
  reason: string;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "UNMATCHED";
} {
  const countyKey = normalizeCounty(countyName);
  const rawName = cleanSubCountyName(sourceSubCountyName);
  const subcountyKey = normalize(rawName);

  const combinedKey = `${countyKey}::${subcountyKey}`;

  /*
   * First use the verified county + subcounty rules.
   */
  const countyRule = COUNTY_SUBCOUNTY_RULES[combinedKey];

  if (countyRule) {
    return {
      name: countyRule,
      reason: "Verified county + SubCounty rule",
      confidence: "HIGH",
    };
  }

  /*
   * Then use the verified fallback table.
   */
  const fallback = VERIFIED_SUBCOUNTY_FALLBACKS[combinedKey];

  if (fallback) {
    return {
      name: fallback,
      reason: "Verified SubCounty fallback",
      confidence: "HIGH",
    };
  }

  /*
   * Otherwise use the cleaned authoritative source name.
   */
  if (rawName) {
    return {
      name: rawName,
      reason: "Authoritative GeoJSON SubCounty name",
      confidence: "HIGH",
    };
  }

  return {
    name: null,
    reason: "Source SubCounty name missing",
    confidence: "UNMATCHED",
  };
}

async function main() {
  console.log("");
  console.log("======================================================");
  console.log("SUBCOUNTY CONSOLIDATION AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("======================================================");
  console.log("");

  /*
   * ------------------------------------------------------
   * LOAD AUTHORITATIVE SUBCOUNTIES
   * ------------------------------------------------------
   */

  const authoritativeSource =
    subcounties as AuthoritativeSubCounty[];

  console.log(
    `Authoritative subcounties.json records: ${authoritativeSource.length}`,
  );

  /*
   * ------------------------------------------------------
   * LOAD GEOJSON
   * ------------------------------------------------------
   */

  const geoJsonRaw = fs.readFileSync(
    GEOJSON_FILE,
    "utf8",
  );

  const geoJson =
    JSON.parse(geoJsonRaw) as GeoJson;

  const sourceWards: SourceWard[] = [];

  for (const feature of geoJson.features) {
    const properties = feature.properties;

    if (!properties) {
      continue;
    }

    const gid = properties.gid;

    if (
      typeof gid !== "number"
    ) {
      continue;
    }

    const county =
      getSourceCountyName(properties);

    const subcounty =
      getSourceSubCountyName(properties);

    const ward =
      getSourceWardName(properties);

    if (
      !county ||
      !subcounty ||
      !ward
    ) {
      continue;
    }

    sourceWards.push({
      gid,
      uid: properties.uid,
      scuid: properties.scuid,
      county,
      subcounty,
      ward,
    });
  }

  console.log(
    `Authoritative ward source records: ${sourceWards.length}`,
  );

  /*
   * ------------------------------------------------------
   * LOAD DATABASE
   * ------------------------------------------------------
   */

  const counties =
    await prisma.county.findMany({
      select: {
        id: true,
        name: true,
      },
    });

  const countyByNormalizedName =
    new Map<string, { id: number; name: string }>();

  for (const county of counties) {
    countyByNormalizedName.set(
      normalizeCounty(county.name),
      county,
    );
  }

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
        _count: {
          select: {
            wards: true,
            farms: true,
            farmers: true,
            businessPartners: true,
            destinationTransactions: true,
            sourceTransactions: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

  console.log(
    `Database SubCounties: ${dbSubCounties.length}`,
  );

  /*
   * ------------------------------------------------------
   * BUILD AUTHORITATIVE CANONICAL SET
   * ------------------------------------------------------
   */

  const canonicalKeys =
    new Map<string, { name: string; countyId: number }>();

  for (const source of authoritativeSource) {
    const county =
      counties.find(
        (item) =>
          normalizeCounty(item.name) ===
          normalizeCounty(source.countyCode),
      );

    /*
     * countyCode in the authoritative file may be
     * an actual county code rather than a name.
     *
     * Therefore also try DB county code below.
     */
    let resolvedCounty = county;

    if (!resolvedCounty) {
      resolvedCounty =
        counties.find(
          (item) =>
            normalizeCounty(item.name) ===
            normalizeCounty(
              source.countyCode,
            ),
        );
    }

    if (!resolvedCounty) {
      continue;
    }

    const name =
      cleanSubCountyName(source.name);

    canonicalKeys.set(
      `${resolvedCounty.id}::${normalize(name)}`,
      {
        name,
        countyId: resolvedCounty.id,
      },
    );
  }

  /*
   * ------------------------------------------------------
   * BUILD SOURCE WARD INDEX
   * ------------------------------------------------------
   */

  const sourceByWardGid =
    new Map<number, SourceWard>();

  const sourceByWardUid =
    new Map<string, SourceWard>();

  const sourceSubCountyStats =
    new Map<
      string,
      {
        countyName: string;
        sourceName: string;
        wardCount: number;
        scuids: Set<string>;
      }
    >();

  for (const ward of sourceWards) {
    sourceByWardGid.set(
      ward.gid,
      ward,
    );

    if (ward.uid) {
      sourceByWardUid.set(
        ward.uid,
        ward,
      );
    }

    const countyKey =
      normalizeCounty(ward.county);

    const subcountyName =
      cleanSubCountyName(
        ward.subcounty,
      );

    const key =
      `${countyKey}::${normalize(subcountyName)}`;

    const existing =
      sourceSubCountyStats.get(key);

    if (existing) {
      existing.wardCount++;

      if (ward.scuid) {
        existing.scuids.add(
          ward.scuid,
        );
      }
    } else {
      sourceSubCountyStats.set(
        key,
        {
          countyName: ward.county,
          sourceName: subcountyName,
          wardCount: 1,
          scuids: new Set(
            ward.scuid
              ? [ward.scuid]
              : [],
          ),
        },
      );
    }
  }

  /*
   * ------------------------------------------------------
   * IDENTIFY POPULATED LEGACY SUBCOUNTIES
   * ------------------------------------------------------
   */

  const populated =
    dbSubCounties.filter(
      (sc) =>
        sc._count.wards > 0,
    );

  console.log(
    `Populated DB SubCounties: ${populated.length}`,
  );

  /*
   * ------------------------------------------------------
   * MATCH EACH POPULATED SUBCOUNTY
   * ------------------------------------------------------
   */

  const results: ConsolidationResult[] = [];

  for (const legacy of populated) {
    const countyName =
      legacy.county.name;

    const legacyName =
      cleanSubCountyName(
        legacy.name,
      );

    const legacyKey =
      normalize(legacyName);

    let candidateName: string | null =
      null;

    let reason =
      "No authoritative match";

    let confidence:
      | "HIGH"
      | "MEDIUM"
      | "LOW"
      | "UNMATCHED" =
      "UNMATCHED";

    /*
     * Find source SubCounty records associated
     * with the wards currently under this DB record.
     *
     * This is the important part:
     *
     * We do NOT trust the existing subCountyId
     * in subcounty-ward-map.json.
     *
     * We inspect the actual authoritative source
     * identity of the wards.
     */
    const wards =
      await prisma.ward.findMany({
        where: {
          subCountyId: legacy.id,
        },
        select: {
          id: true,
          name: true,
          sourceGid: true,
          sourceUid: true,
        },
      });

    const sourceCandidates =
      new Map<
        string,
        {
          county: string;
          subcounty: string;
          count: number;
          scuids: Set<string>;
        }
      >();

    for (const ward of wards) {
      let source: SourceWard | undefined;

      if (
        ward.sourceGid !== null &&
        ward.sourceGid !== undefined
      ) {
        source =
          sourceByWardGid.get(
            ward.sourceGid,
          );
      }

      if (
        !source &&
        ward.sourceUid
      ) {
        source =
          sourceByWardUid.get(
            ward.sourceUid,
          );
      }

      if (!source) {
        continue;
      }

      const key =
        `${normalizeCounty(source.county)}::${normalize(cleanSubCountyName(source.subcounty))}`;

      const existing =
        sourceCandidates.get(key);

      if (existing) {
        existing.count++;
        if (source.scuid) {
          existing.scuids.add(
            source.scuid,
          );
        }
      } else {
        sourceCandidates.set(
          key,
          {
            county: source.county,
            subcounty:
              cleanSubCountyName(
                source.subcounty,
              ),
            count: 1,
            scuids: new Set(
              source.scuid
                ? [source.scuid]
                : [],
            ),
          },
        );
      }
    }

    /*
     * Choose the strongest source SubCounty candidate.
     */
    const rankedCandidates =
      [...sourceCandidates.entries()]
        .sort(
          (a, b) =>
            b[1].count -
            a[1].count,
        );

    if (
      rankedCandidates.length > 0
    ) {
      const [
        ,
        candidate,
      ] =
        rankedCandidates[0];

      const resolved =
        getCanonicalName(
          candidate.county,
          candidate.subcounty,
        );

      candidateName =
        resolved.name;

      reason =
        `${resolved.reason}; ${candidate.count} ward source identities`;

      confidence =
        resolved.confidence;
    }

    /*
     * If the ward-source evidence did not resolve,
     * try the existing verified rules using the
     * DB county + DB SubCounty name.
     */
    if (!candidateName) {
      const resolved =
        getCanonicalName(
          countyName,
          legacyName,
        );

      candidateName =
        resolved.name;

      reason =
        `Fallback from DB county/SubCounty name: ${resolved.reason}`;

      confidence =
        resolved.confidence;
    }

    /*
     * Resolve candidate to the actual canonical
     * DB SubCounty record.
     */
    let canonicalId:
      | number
      | null =
      null;

    let canonicalName:
      | string
      | null =
      null;

    if (candidateName) {
      const normalizedCandidate =
        normalize(candidateName);

      const exactCandidates =
        dbSubCounties.filter(
          (sc) =>
            sc.countyId ===
              legacy.countyId &&
            normalize(
              cleanSubCountyName(
                sc.name,
              ),
            ) ===
              normalizedCandidate &&
            sc._count.wards === 0,
        );

      if (
        exactCandidates.length ===
        1
      ) {
        canonicalId =
          exactCandidates[0].id;

        canonicalName =
          exactCandidates[0].name;
      } else if (
        exactCandidates.length >
        1
      ) {
        confidence =
          "UNMATCHED";

        reason +=
          "; multiple empty canonical candidates";
      } else {
        /*
         * It may already be the canonical populated
         * record rather than a legacy record.
         */
        const populatedExact =
          dbSubCounties.find(
            (sc) =>
              sc.countyId ===
                legacy.countyId &&
              normalize(
                cleanSubCountyName(
                  sc.name,
                ),
              ) ===
                normalizedCandidate,
          );

        if (populatedExact) {
          canonicalId =
            populatedExact.id;

          canonicalName =
            populatedExact.name;

          if (
            populatedExact.id ===
            legacy.id
          ) {
            reason +=
              "; already canonical DB record";
          } else {
            reason +=
              "; canonical DB record already populated";
          }
        }
      }
    }

    /*
     * If candidate is the same record, it is not
     * a migration target.
     */
    if (
      canonicalId ===
      legacy.id
    ) {
      canonicalId = null;
      canonicalName = null;
    }

    results.push({
      legacyId: legacy.id,
      legacyName: legacy.name,
      countyId: legacy.countyId,
      countyName,

      canonicalId,
      canonicalName,

      wardCount:
        legacy._count.wards,

      sourceSubCounties:
        rankedCandidates.map(
          ([, item]) =>
            item.subcounty,
        ),

      sourceScuids:
        rankedCandidates.flatMap(
          ([, item]) =>
            [...item.scuids],
        ),

      confidence,

      reason,

      businessPartners:
        legacy._count
          .businessPartners,

      farms:
        legacy._count.farms,

      farmers:
        legacy._count.farmers,

      destinationTransactions:
        legacy._count
          .destinationTransactions,

      sourceTransactions:
        legacy._count
          .sourceTransactions,
    });
  }

  /*
   * ------------------------------------------------------
   * SUMMARY
   * ------------------------------------------------------
   */

  const matched =
    results.filter(
      (r) =>
        r.canonicalId !== null,
    );

  const unmatched =
    results.filter(
      (r) =>
        r.canonicalId === null &&
        r.confidence ===
          "UNMATCHED",
    );

  const sameNamePopulated =
    results.filter(
      (r) =>
        r.canonicalId === null &&
        r.confidence !==
          "UNMATCHED",
    );

  const wardsCovered =
    results.reduce(
      (sum, r) =>
        sum + r.wardCount,
      0,
    );

  const wardsMatched =
    matched.reduce(
      (sum, r) =>
        sum + r.wardCount,
      0,
    );

  const recordsWithRelations =
    results.filter(
      (r) =>
        r.businessPartners > 0 ||
        r.farms > 0 ||
        r.farmers > 0 ||
        r.destinationTransactions >
          0 ||
        r.sourceTransactions >
          0,
    );

  console.log("");
  console.log("======================================================");
  console.log("CONSOLIDATION SUMMARY");
  console.log("======================================================");

  console.log(
    `Populated SubCounties:              ${results.length}`,
  );

  console.log(
    `Legacy SubCounties with target:      ${matched.length}`,
  );

  console.log(
    `Unmatched SubCounties:               ${unmatched.length}`,
  );

  console.log(
    `Already/same-name records:           ${sameNamePopulated.length}`,
  );

  console.log(
    `Wards under populated SubCounties:   ${wardsCovered}`,
  );

  console.log(
    `Wards with consolidation target:     ${wardsMatched}`,
  );

  console.log(
    `Records with other relations:        ${recordsWithRelations.length}`,
  );

  /*
   * ------------------------------------------------------
   * PRINT UNMATCHED
   * ------------------------------------------------------
   */

  if (unmatched.length > 0) {
    console.log("");
    console.log("======================================================");
    console.log("UNMATCHED — MUST BE REVIEWED");
    console.log("======================================================");

    for (const item of unmatched) {
      console.log("");
      console.log(
        `Legacy ${item.legacyId}: ${item.legacyName}`,
      );

      console.log(
        `County: ${item.countyName}`,
      );

      console.log(
        `Wards: ${item.wardCount}`,
      );

      console.log(
        `Source SubCounties: ${
          item.sourceSubCounties.join(
            ", ",
          ) || "NONE"
        }`,
      );

      console.log(
        `Reason: ${item.reason}`,
      );
    }
  }

  /*
   * ------------------------------------------------------
   * PRINT CONSOLIDATION PLAN
   * ------------------------------------------------------
   */

  console.log("");
  console.log("======================================================");
  console.log("CONSOLIDATION PLAN");
  console.log("======================================================");

  for (const item of results) {
    if (
      item.canonicalId === null
    ) {
      continue;
    }

    console.log(
      `${item.legacyId} ${item.legacyName} ` +
        `→ ${item.canonicalId} ${item.canonicalName} ` +
        `| wards=${item.wardCount} ` +
        `| confidence=${item.confidence}`,
    );
  }

  /*
   * ------------------------------------------------------
   * RELATION WARNINGS
   * ------------------------------------------------------
   */

  console.log("");
  console.log("======================================================");
  console.log("NON-WARD RELATION WARNINGS");
  console.log("======================================================");

  for (const item of recordsWithRelations) {
    console.log("");

    console.log(
      `${item.legacyId} ${item.legacyName}`,
    );

    console.log(
      `  BusinessPartners: ${item.businessPartners}`,
    );

    console.log(
      `  Farms:            ${item.farms}`,
    );

    console.log(
      `  Farmers:          ${item.farmers}`,
    );

    console.log(
      `  Destination Tx:   ${item.destinationTransactions}`,
    );

    console.log(
      `  Source Tx:        ${item.sourceTransactions}`,
    );

    console.log(
      `  Target: ${
        item.canonicalId !== null
          ? `${item.canonicalId} ${item.canonicalName}`
          : "UNMATCHED"
      }`,
    );
  }

  /*
   * ------------------------------------------------------
   * FINAL STATUS
   * ------------------------------------------------------
   */

  console.log("");
  console.log("======================================================");

  if (
    unmatched.length === 0
  ) {
    console.log(
      "PASS — every populated legacy SubCounty has a canonical target.",
    );

    console.log(
      "NEXT STEP: review non-Ward relations before migration.",
    );
  } else {
    console.log(
      `REVIEW REQUIRED — ${unmatched.length} SubCounty records have no safe target.`,
    );

    console.log(
      "NO DATABASE CHANGES WERE MADE.",
    );
  }

  console.log(
    "READ-ONLY AUDIT COMPLETE",
  );

  console.log("======================================================");
  console.log("");
}

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