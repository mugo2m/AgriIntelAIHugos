import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";

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

const SUBCOUNTY_FILE = path.join(
  process.cwd(),
  "prisma",
  "data",
  "subcounties.json",
);

const WARD_GEOJSON_FILE = path.join(
  process.cwd(),
  "prisma",
  "data",
  "kenya-wards-1450.geojson",
);

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type SubCountySource = {
  code?: string;
  countyCode: string;
  name: string;
  headquarters?: string | null;
};

type GeoFeature = {
  type?: string;
  properties?: Record<string, unknown>;
};

type GeoJSONFile = {
  type?: string;
  features?: GeoFeature[];
};

type AuthoritativeWard = {
  gid: number;
  uid: string | null;
  countyName: string;
  subCountyName: string;
  wardName: string;
};

type DbWard = {
  id: number;
  name: string;
  sourceGid: number | null;
  sourceUid: string | null;
  countyId: number;
  constituencyId: number;
  subCountyId: number | null;
};

type DbSubCounty = {
  id: number;
  name: string;
  countyId: number;

  county: {
    id: number;
    name: string;
    code: string | null;
  };

  wards: DbWard[];

  farmers: Array<{
    id: number;
  }>;

  farms: Array<{
    id: number;
  }>;

  businessPartners: Array<{
    id: number;
  }>;

  destinationTransactions: Array<{
    id: number;
  }>;

  sourceTransactions: Array<{
    id: number;
  }>;
};

/*
|--------------------------------------------------------------------------
| NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeCounty(value: unknown): string {
  return normalize(value)
    .replace(/\bcounty\b/g, "")
    .trim();
}

function normalizeSubCounty(value: unknown): string {
  return normalize(value)
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .trim();
}

/*
|--------------------------------------------------------------------------
| VERIFIED NAME FALLBACKS
|--------------------------------------------------------------------------
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

/*
|--------------------------------------------------------------------------
| PROPERTY EXTRACTION
|--------------------------------------------------------------------------
*/

function getProperty(
  properties: Record<string, unknown>,
  candidates: string[],
): unknown {
  const entries = Object.entries(properties);

  for (const candidate of candidates) {
    const direct = properties[candidate];

    if (
      direct !== undefined &&
      direct !== null &&
      direct !== ""
    ) {
      return direct;
    }
  }

  for (const [key, value] of entries) {
    const normalizedKey = normalize(key);

    for (const candidate of candidates) {
      if (normalizedKey === normalize(candidate)) {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          return value;
        }
      }
    }
  }

  return null;
}

function toNumber(value: unknown): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

/*
|--------------------------------------------------------------------------
| LOAD AUTHORITATIVE WARDS
|--------------------------------------------------------------------------
*/

function loadAuthoritativeWards(): AuthoritativeWard[] {
  if (!fs.existsSync(WARD_GEOJSON_FILE)) {
    throw new Error(
      `Missing authoritative ward GeoJSON:\n${WARD_GEOJSON_FILE}`,
    );
  }

  const geojson = JSON.parse(
    fs.readFileSync(WARD_GEOJSON_FILE, "utf8"),
  ) as GeoJSONFile;

  if (!Array.isArray(geojson.features)) {
    throw new Error(
      "kenya-wards-1450.geojson does not contain a features array.",
    );
  }

  const result: AuthoritativeWard[] = [];

  for (const feature of geojson.features) {
    const properties = feature.properties ?? {};

    const gid = toNumber(
      getProperty(properties, [
        "gid",
        "GID",
        "GID_3",
        "id",
      ]),
    );

    const uid = getProperty(properties, [
      "uid",
      "UID",
      "ward_uid",
      "wardUid",
    ]);

    const county = getProperty(properties, [
      "county",
      "County",
      "county_name",
      "countyName",
      "COUNTY",
      "COUNTY_NAME",
    ]);

    const subCounty = getProperty(properties, [
      "subcounty",
      "sub_county",
      "subCounty",
      "subcounty_name",
      "subCountyName",
      "SC_NAME",
      "sc_name",
    ]);

    const ward = getProperty(properties, [
      "ward",
      "Ward",
      "ward_name",
      "wardName",
      "name",
      "NAME",
    ]);

    if (
      gid === null ||
      county === null ||
      subCounty === null ||
      ward === null
    ) {
      continue;
    }

    result.push({
      gid,
      uid:
        uid === null || uid === undefined
          ? null
          : String(uid).trim(),
      countyName: String(county).trim(),
      subCountyName: String(subCounty).trim(),
      wardName: String(ward).trim(),
    });
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| BUILD CANONICAL TARGET LOOKUP
|--------------------------------------------------------------------------
*/

function buildCanonicalLookup(
  source: SubCountySource[],
  db: DbSubCounty[],
) {
  const lookup = new Map<string, DbSubCounty>();

  for (const sourceRecord of source) {
    const countyCode = normalize(sourceRecord.countyCode);
    const sourceName = normalizeSubCounty(
      sourceRecord.name,
    );

    const countyCandidates = db.filter(
      (record) =>
        normalize(record.county.code) === countyCode,
    );

    if (countyCandidates.length === 0) {
      continue;
    }

    const county = countyCandidates[0].county;

    let target = countyCandidates.find(
      (record) =>
        normalizeSubCounty(record.name) === sourceName,
    );

    /*
     * Verified fallback.
     */

    if (!target) {
      const fallbackName =
        VERIFIED_SUBCOUNTY_FALLBACKS[
          `${normalize(county.name)}::${sourceName}`
        ] ??
        COUNTY_SUBCOUNTY_RULES[
          `${normalize(county.name)}::${sourceName}`
        ];

      if (fallbackName) {
        target = countyCandidates.find(
          (record) =>
            normalizeSubCounty(record.name) ===
            normalizeSubCounty(fallbackName),
        );
      }
    }

    if (target) {
      lookup.set(
        `${normalizeCounty(county.name)}::${sourceName}`,
        target,
      );
    }
  }

  return lookup;
}

/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  console.log("");
  console.log(
    "============================================================",
  );
  console.log("SUBCOUNTY CONSOLIDATION AUDIT V3");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log(
    "============================================================",
  );
  console.log("");

  /*
   * Load authoritative SubCounty source.
   */

  const sourceSubCounties =
    JSON.parse(
      fs.readFileSync(SUBCOUNTY_FILE, "utf8"),
    ) as SubCountySource[];

  /*
   * Load authoritative wards.
   */

  const authoritativeWards =
    loadAuthoritativeWards();

  console.log(
    `Authoritative SubCounties: ${sourceSubCounties.length}`,
  );

  console.log(
    `Authoritative ward features: ${authoritativeWards.length}`,
  );

  /*
   * Load database.
   */

  const db = (await prisma.subCounty.findMany({
    orderBy: {
      id: "asc",
    },

    include: {
      county: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },

      wards: {
        select: {
          id: true,
          name: true,
          sourceGid: true,
          sourceUid: true,
          countyId: true,
          constituencyId: true,
          subCountyId: true,
        },
      },

      farmers: {
        select: {
          id: true,
        },
      },

      farms: {
        select: {
          id: true,
        },
      },

      businessPartners: {
        select: {
          id: true,
        },
      },

      destinationTransactions: {
        select: {
          id: true,
        },
      },

      sourceTransactions: {
        select: {
          id: true,
        },
      },
    },
  })) as DbSubCounty[];

  console.log(
    `Database SubCounties: ${db.length}`,
  );

  /*
   * Authoritative ward lookup by GID.
   */

  const authoritativeByGid =
    new Map<number, AuthoritativeWard>();

  for (const ward of authoritativeWards) {
    authoritativeByGid.set(ward.gid, ward);
  }

  console.log(
    `Authoritative GID identities: ${authoritativeByGid.size}`,
  );

  /*
   * Canonical SubCounty lookup.
   */

  const canonicalLookup =
    buildCanonicalLookup(
      sourceSubCounties,
      db,
    );

  console.log(
    `Resolved canonical SubCounty targets: ${canonicalLookup.size}`,
  );

  /*
   |--------------------------------------------------------------------------
   | Resolve every database ward.
   |--------------------------------------------------------------------------
   */

  const resolvedWardTargets = new Map<
    number,
    {
      source: AuthoritativeWard;
      target: DbSubCounty | null;
    }
  >();

  let matchedByGid = 0;
  let unmatchedGid = 0;

  for (const subCounty of db) {
    for (const ward of subCounty.wards) {
      if (ward.sourceGid === null) {
        unmatchedGid++;

        continue;
      }

      const sourceWard =
        authoritativeByGid.get(
          ward.sourceGid,
        );

      if (!sourceWard) {
        unmatchedGid++;

        continue;
      }

      matchedByGid++;

      const sourceCountyKey =
        normalizeCounty(
          sourceWard.countyName,
        );

      const sourceSubCountyKey =
        normalizeSubCounty(
          sourceWard.subCountyName,
        );

      let target =
        canonicalLookup.get(
          `${sourceCountyKey}::${sourceSubCountyKey}`,
        ) ?? null;

      /*
       * If the county name differs between source and DB,
       * use the DB county associated with the current ward.
       */

      if (!target) {
        const dbCounty = db.find(
          (record) =>
            record.countyId ===
            ward.countyId,
        )?.county;

        if (dbCounty) {
          target =
            canonicalLookup.get(
              `${normalizeCounty(dbCounty.name)}::${sourceSubCountyKey}`,
            ) ?? null;
        }
      }

      resolvedWardTargets.set(
        ward.id,
        {
          source: sourceWard,
          target,
        },
      );
    }
  }

  console.log("");
  console.log(
    "WARD SOURCE IDENTITY MATCHING",
  );
  console.log(
    "--------------------------------------------",
  );
  console.log(
    `Matched by sourceGid: ${matchedByGid}`,
  );
  console.log(
    `Unmatched sourceGid:  ${unmatchedGid}`,
  );
  console.log(
    "--------------------------------------------",
  );

  /*
   |--------------------------------------------------------------------------
   | Authoritative canonical DB records.
   |--------------------------------------------------------------------------
   */

  const canonicalIds = new Set<number>();

  for (const sourceRecord of sourceSubCounties) {
    const countyCandidates =
      db.filter(
        (record) =>
          normalize(record.county.code) ===
          normalize(sourceRecord.countyCode),
      );

    if (countyCandidates.length === 0) {
      continue;
    }

    const county =
      countyCandidates[0].county;

    const sourceName =
      normalizeSubCounty(
        sourceRecord.name,
      );

    let target =
      countyCandidates.find(
        (record) =>
          normalizeSubCounty(
            record.name,
          ) === sourceName,
      );

    if (!target) {
      const fallbackName =
        VERIFIED_SUBCOUNTY_FALLBACKS[
          `${normalize(county.name)}::${sourceName}`
        ] ??
        COUNTY_SUBCOUNTY_RULES[
          `${normalize(county.name)}::${sourceName}`
        ];

      if (fallbackName) {
        target =
          countyCandidates.find(
            (record) =>
              normalizeSubCounty(
                record.name,
              ) ===
              normalizeSubCounty(
                fallbackName,
              ),
          );
      }
    }

    if (target) {
      canonicalIds.add(target.id);
    }
  }

  /*
   |--------------------------------------------------------------------------
   | Analyze populated SubCounties.
   |--------------------------------------------------------------------------
   */

  const populated = db.filter(
    (record) =>
      record.wards.length > 0,
  );

  type Candidate = {
    source: DbSubCounty;
    target: DbSubCounty;
    wards: DbWard[];
    farmers: number;
    farms: number;
    businessPartners: number;
    destinationTransactions: number;
    sourceTransactions: number;
  };

  const candidates: Candidate[] = [];

  const alreadyCanonical: DbSubCounty[] =
    [];

  const review: Array<{
    source: DbSubCounty;
    reason: string;
    targets: string[];
    unresolvedWards: DbWard[];
  }> = [];

  /*
   |--------------------------------------------------------------------------
   | Analyze each populated record.
   |--------------------------------------------------------------------------
   */

  for (const source of populated) {
    /*
     * If this is already the canonical DB record,
     * leave it alone.
     */

    if (canonicalIds.has(source.id)) {
      alreadyCanonical.push(source);

      continue;
    }

    const targetCounts =
      new Map<number, DbWard[]>();

    const unresolvedWards: DbWard[] =
      [];

    for (const ward of source.wards) {
      const resolved =
        resolvedWardTargets.get(
          ward.id,
        );

      if (
        !resolved ||
        !resolved.target
      ) {
        unresolvedWards.push(ward);

        continue;
      }

      const existing =
        targetCounts.get(
          resolved.target.id,
        ) ?? [];

      existing.push(ward);

      targetCounts.set(
        resolved.target.id,
        existing,
      );
    }

    /*
     * No target.
     */

    if (targetCounts.size === 0) {
      review.push({
        source,
        reason:
          "No authoritative canonical target could be resolved from its wards.",
        targets: [],
        unresolvedWards,
      });

      continue;
    }

    /*
     * Some wards unresolved.
     */

    if (unresolvedWards.length > 0) {
      review.push({
        source,
        reason:
          `${unresolvedWards.length} ward(s) could not be resolved to a canonical target.`,
        targets: Array.from(
          targetCounts.keys(),
        ).map(String),
        unresolvedWards,
      });

      continue;
    }

    /*
     * Multiple targets.
     */

    if (targetCounts.size > 1) {
      review.push({
        source,
        reason:
          "Its wards resolve to multiple canonical SubCounties.",
        targets: Array.from(
          targetCounts.keys(),
        ).map((id) => {
          const target = db.find(
            (record) =>
              record.id === id,
          );

          return target
            ? `${target.id}:${target.name}`
            : String(id);
        }),
        unresolvedWards: [],
      });

      continue;
    }

    const targetId =
      Array.from(
        targetCounts.keys(),
      )[0];

    const target =
      db.find(
        (record) =>
          record.id === targetId,
      );

    if (!target) {
      review.push({
        source,
        reason:
          "Resolved canonical target does not exist.",
        targets: [
          String(targetId),
        ],
        unresolvedWards: [],
      });

      continue;
    }

    /*
     * County must remain identical.
     */

    if (
      source.countyId !==
      target.countyId
    ) {
      review.push({
        source,
        reason:
          `Source county ${source.countyId} differs from target county ${target.countyId}.`,
        targets: [
          `${target.id}:${target.name}`,
        ],
        unresolvedWards: [],
      });

      continue;
    }

    candidates.push({
      source,
      target,
      wards:
        targetCounts.get(
          target.id,
        ) ?? [],
      farmers:
        source.farmers.length,
      farms:
        source.farms.length,
      businessPartners:
        source.businessPartners.length,
      destinationTransactions:
        source.destinationTransactions
          .length,
      sourceTransactions:
        source.sourceTransactions
          .length,
    });
  }

  /*
   |--------------------------------------------------------------------------
   | Summary
   |--------------------------------------------------------------------------
   */

  const candidateWardCount =
    candidates.reduce(
      (sum, item) =>
        sum + item.wards.length,
      0,
    );

  const canonicalWardCount =
    alreadyCanonical.reduce(
      (sum, item) =>
        sum + item.wards.length,
      0,
    );

  const reviewWardCount =
    review.reduce(
      (sum, item) =>
        sum +
        item.source.wards.length,
      0,
    );

  const databaseWardCount =
    db.reduce(
      (sum, item) =>
        sum + item.wards.length,
      0,
    );

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "CONSOLIDATION SUMMARY",
  );
  console.log(
    "============================================================",
  );

  console.log(
    `Populated SubCounties:              ${populated.length}`,
  );

  console.log(
    `Safe migration candidates:           ${candidates.length}`,
  );

  console.log(
    `Already canonical/populated:         ${alreadyCanonical.length}`,
  );

  console.log(
    `Requires manual review:              ${review.length}`,
  );

  console.log(
    `Wards in safe migration candidates: ${candidateWardCount}`,
  );

  console.log(
    `Wards in canonical records:          ${canonicalWardCount}`,
  );

  console.log(
    `Wards requiring review:              ${reviewWardCount}`,
  );

  console.log(
    `Farmers requiring migration:         ${candidates.reduce(
      (sum, item) =>
        sum + item.farmers,
      0,
    )}`,
  );

  console.log(
    `Farms requiring migration:           ${candidates.reduce(
      (sum, item) =>
        sum + item.farms,
      0,
    )}`,
  );

  console.log(
    `Business Partners:                   ${candidates.reduce(
      (sum, item) =>
        sum + item.businessPartners,
      0,
    )}`,
  );

  console.log(
    `Destination Transactions:            ${candidates.reduce(
      (sum, item) =>
        sum +
        item.destinationTransactions,
      0,
    )}`,
  );

  console.log(
    `Source Transactions:                 ${candidates.reduce(
      (sum, item) =>
        sum +
        item.sourceTransactions,
      0,
    )}`,
  );

  /*
   |--------------------------------------------------------------------------
   | Safe candidates
   |--------------------------------------------------------------------------
   */

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "SAFE MIGRATION CANDIDATES",
  );
  console.log(
    "============================================================",
  );

  if (candidates.length === 0) {
    console.log("NONE");
  }

  for (const item of candidates) {
    console.log("");

    console.log(
      `${item.source.county.name} | ` +
        `${item.source.id} ${item.source.name} ` +
        `→ ${item.target.id} ${item.target.name}`,
    );

    console.log(
      `  Wards:             ${item.wards.length}`,
    );

    console.log(
      `  Farmers:           ${item.farmers}`,
    );

    console.log(
      `  Farms:             ${item.farms}`,
    );

    console.log(
      `  Business Partners: ${item.businessPartners}`,
    );

    console.log(
      `  Destination Tx:    ${item.destinationTransactions}`,
    );

    console.log(
      `  Source Tx:         ${item.sourceTransactions}`,
    );

    for (const ward of item.wards) {
      const resolved =
        resolvedWardTargets.get(
          ward.id,
        );

      console.log(
        `    Ward ${ward.id}: ${ward.name}` +
          ` | GID ${ward.sourceGid}` +
          ` | authoritative SC: ${
            resolved?.source.subCountyName ??
            "UNKNOWN"
          }`,
      );
    }
  }

  /*
   |--------------------------------------------------------------------------
   | Review
   |--------------------------------------------------------------------------
   */

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "MANUAL REVIEW RECORDS",
  );
  console.log(
    "============================================================",
  );

  if (review.length === 0) {
    console.log("NONE");
  }

  for (const item of review) {
    console.log("");

    console.log(
      `${item.source.county.name} | ` +
        `${item.source.id} ${item.source.name}`,
    );

    console.log(
      `  Wards: ${item.source.wards.length}`,
    );

    console.log(
      `  Farmers: ${item.source.farmers.length}`,
    );

    console.log(
      `  Farms: ${item.source.farms.length}`,
    );

    console.log(
      `  Reason: ${item.reason}`,
    );

    if (
      item.targets.length > 0
    ) {
      console.log(
        `  Targets: ${item.targets.join(", ")}`,
      );
    }

    if (
      item.unresolvedWards.length >
      0
    ) {
      console.log(
        "  Unresolved wards:",
      );

      for (const ward of item.unresolvedWards) {
        const resolved =
          resolvedWardTargets.get(
            ward.id,
          );

        console.log(
          `    ${ward.id} ${ward.name}` +
            ` | GID ${ward.sourceGid}` +
            ` | authoritative SC: ${
              resolved?.source
                .subCountyName ??
              "NOT FOUND"
            }`,
        );
      }
    }
  }

  /*
   |--------------------------------------------------------------------------
   | Final accounting
   |--------------------------------------------------------------------------
   */

  const accounted =
    candidateWardCount +
    canonicalWardCount +
    reviewWardCount;

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "FINAL SAFETY CHECK",
  );
  console.log(
    "============================================================",
  );

  console.log(
    `Database wards:          ${databaseWardCount}`,
  );

  console.log(
    `Candidate wards:         ${candidateWardCount}`,
  );

  console.log(
    `Canonical wards:         ${canonicalWardCount}`,
  );

  console.log(
    `Review wards:            ${reviewWardCount}`,
  );

  console.log(
    `Accounted ward records:  ${accounted}`,
  );

  console.log(
    `Unmatched source GIDs:   ${unmatchedGid}`,
  );

  if (
    databaseWardCount ===
      accounted &&
    unmatchedGid === 0
  ) {
    console.log("");
    console.log(
      "PASS — all database wards are accounted for.",
    );
  } else {
    console.log("");
    console.log(
      "STOP — ward accounting does not reconcile.",
    );
  }

  console.log("");
  console.log(
    "READ-ONLY AUDIT COMPLETE.",
  );

  console.log(
    "NO DATABASE CHANGES WERE MADE.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "AUDIT FAILED",
    );
    console.error("");

    console.error(
      error instanceof Error
        ? error.message
        : error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });