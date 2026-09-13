import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import subcounties from "../prisma/data/subcounties.json";

const GEOJSON_PATH = path.resolve(
  "prisma/data/kenya-wards-1450.geojson",
);

const OUTPUT_JSON = path.resolve(
  "prisma/data/subcounty-consolidation-v7.json",
);

const OUTPUT_CSV = path.resolve(
  "prisma/data/subcounty-consolidation-v7.csv",
);

type CanonicalSubCounty = {
  code?: string;
  countyCode: string;
  name: string;
  headquarters?: string | null;
};

type GeoFeature = {
  type: string;
  properties?: Record<string, unknown>;
  geometry?: unknown;
};

type GeoJSON = {
  type: string;
  features: GeoFeature[];
};

type DbCounty = {
  id: number;
  name: string;
  code: string | null;
};

type DbSubCounty = {
  id: number;
  name: string;
  countyId: number;
  county: DbCounty;
  _count: {
    wards: number;
    farmers: number;
    farms: number;
    businessPartners: number;
    destinationTransactions: number;
    sourceTransactions: number;
  };
};

type DbWard = {
  id: number;
  name: string;
  code: string | null;
  sourceGid: number | null;
  sourceUid: string | null;
  countyId: number;
  subCountyId: number | null;
  constituencyId: number;
  subCounty: {
    id: number;
    name: string;
    countyId: number;
  } | null;
  county: {
    id: number;
    name: string;
  };
};

type WardResolution = {
  wardId: number;
  wardName: string;
  sourceGid: number | null;
  sourceUid: string | null;

  currentSubCountyId: number | null;
  currentSubCountyName: string | null;

  authoritativeSubCounty: string | null;
  authoritativeCounty: string | null;

  canonicalSourceName: string | null;
  canonicalCountyCode: string | null;

  canonicalDbId: number | null;
  canonicalDbName: string | null;

  status:
    | "RESOLVED"
    | "UNRESOLVED"
    | "NO_CANONICAL_SOURCE"
    | "NO_CANONICAL_DB"
    | "COUNTY_MISMATCH"
    | "MULTIPLE_TARGETS";
};

type ConsolidationRecord = {
  sourceId: number;
  sourceName: string;
  countyId: number;
  countyName: string;

  targetId: number | null;
  targetName: string | null;

  wards: number;
  farmers: number;
  farms: number;
  businessPartners: number;
  destinationTransactions: number;
  sourceTransactions: number;

  classification:
    | "SAFE_LEGACY_MIGRATION"
    | "ALREADY_CANONICAL"
    | "BLOCKED_BY_RELATIONS"
    | "MANUAL_REVIEW";

  reason: string;

  wardIds: number[];
  wardNames: string[];
};

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
|--------------------------------------------------------------------------
| NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeName(value: string): string {
  return value
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

function normalizeCounty(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
|--------------------------------------------------------------------------
| VERIFIED SUBCOUNTY FALLBACKS
|--------------------------------------------------------------------------
|
| These are the mappings already established during the previous audits.
| They are deliberately explicit.
|
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

/*
|--------------------------------------------------------------------------
| COUNTY-SPECIFIC RULES
|--------------------------------------------------------------------------
*/

const COUNTY_SUBCOUNTY_RULES: Record<string, string> = {
  "isiolo::isiolo": "Isiolo North",
  "mandera::mandera north": "Mandera North",
  "kericho::belgut": "Ainamoi",
};

/*
|--------------------------------------------------------------------------
| ADDITIONAL AUTHORITATIVE NAME VARIANTS
|--------------------------------------------------------------------------
|
| These are source-name differences which should not cause an otherwise
| valid populated DB record to be classified as bad.
|
*/

const AUTHORITATIVE_NAME_VARIANTS: Record<string, string> = {
  "baringo::tiaty": "Tiaty",
  "baringo::tiaty west": "Tiaty",

  "narok::transmara east": "Trans Mara East",

  "machakos::athi river": "Mavoko",
  "machakos::machakos": "Machakos Town",

  "isiolo::isiolo": "Isiolo North",

  "kericho::belgut": "Ainamoi",
};

/*
|--------------------------------------------------------------------------
| GEOJSON PROPERTY HELPERS
|--------------------------------------------------------------------------
*/

function getProperty(
  feature: GeoFeature,
  names: string[],
): string | null {
  const properties = feature.properties ?? {};

  for (const name of names) {
    const value = properties[name];

    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      return value.trim();
    }
  }

  return null;
}

function getNumericProperty(
  feature: GeoFeature,
  names: string[],
): number | null {
  const properties = feature.properties ?? {};

  for (const name of names) {
    const value = properties[name];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| CANONICAL SOURCE RESOLUTION
|--------------------------------------------------------------------------
*/

function findCanonicalSource(
  countyName: string,
  authoritativeSubCountyName: string,
  canonicalRecords: CanonicalSubCounty[],
): {
  record: CanonicalSubCounty | null;
  method:
    | "EXACT"
    | "NORMALIZED"
    | "VERIFIED_FALLBACK"
    | "COUNTY_RULE"
    | "AUTHORITATIVE_VARIANT"
    | "NONE";
} {
  const countyKey = normalizeCounty(countyName);
  const subCountyKey = normalizeName(authoritativeSubCountyName);

  /*
   * 1. Exact normalized source record.
   */
  const exact = canonicalRecords.find(
    (record) =>
      normalizeCounty(record.countyCode) === countyKey &&
      normalizeName(record.name) === subCountyKey,
  );

  if (exact) {
    return {
      record: exact,
      method: "EXACT",
    };
  }

  /*
   * 2. Verified explicit fallback.
   */
  const fallbackName =
    VERIFIED_SUBCOUNTY_FALLBACKS[
      `${countyKey}::${subCountyKey}`
    ];

  if (fallbackName) {
    const fallback = canonicalRecords.find(
      (record) =>
        normalizeCounty(record.countyCode) === countyKey &&
        normalizeName(record.name) ===
          normalizeName(fallbackName),
    );

    if (fallback) {
      return {
        record: fallback,
        method: "VERIFIED_FALLBACK",
      };
    }
  }

  /*
   * 3. County-specific rule.
   */
  const countyRule =
    COUNTY_SUBCOUNTY_RULES[
      `${countyKey}::${subCountyKey}`
    ];

  if (countyRule) {
    const countyRuleRecord = canonicalRecords.find(
      (record) =>
        normalizeCounty(record.countyCode) === countyKey &&
        normalizeName(record.name) ===
          normalizeName(countyRule),
    );

    if (countyRuleRecord) {
      return {
        record: countyRuleRecord,
        method: "COUNTY_RULE",
      };
    }
  }

  /*
   * 4. Authoritative-name variant.
   */
  const variantName =
    AUTHORITATIVE_NAME_VARIANTS[
      `${countyKey}::${subCountyKey}`
    ];

  if (variantName) {
    const variant = canonicalRecords.find(
      (record) =>
        normalizeCounty(record.countyCode) === countyKey &&
        normalizeName(record.name) ===
          normalizeName(variantName),
    );

    if (variant) {
      return {
        record: variant,
        method: "AUTHORITATIVE_VARIANT",
      };
    }
  }

  /*
   * 5. Safe normalized fallback.
   *
   * This is deliberately last.
   *
   * Require exactly one candidate.
   */
  const normalizedCandidates = canonicalRecords.filter(
    (record) =>
      normalizeCounty(record.countyCode) === countyKey &&
      normalizeName(record.name) === subCountyKey,
  );

  if (normalizedCandidates.length === 1) {
    return {
      record: normalizedCandidates[0],
      method: "NORMALIZED",
    };
  }

  return {
    record: null,
    method: "NONE",
  };
}

/*
|--------------------------------------------------------------------------
| CANONICAL DB RESOLUTION
|--------------------------------------------------------------------------
*/

function findCanonicalDb(
  canonicalSource: CanonicalSubCounty,
  dbSubCounties: DbSubCounty[],
): DbSubCounty[] {
  const countyCode = normalizeCounty(
    canonicalSource.countyCode,
  );

  const nameKey = normalizeName(
    canonicalSource.name,
  );

  return dbSubCounties.filter(
    (record) =>
      normalizeCounty(record.county.code ?? "") ===
        countyCode &&
      normalizeName(record.name) === nameKey,
  );
}

/*
|--------------------------------------------------------------------------
| MAIN AUDIT
|--------------------------------------------------------------------------
*/

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("SUBCOUNTY CONSOLIDATION AUDIT V7");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  const geojson = JSON.parse(
    fs.readFileSync(GEOJSON_PATH, "utf8"),
  ) as GeoJSON;

  const canonicalRecords =
    subcounties as CanonicalSubCounty[];

  const counties = await prisma.county.findMany({
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const dbSubCounties =
    await prisma.subCounty.findMany({
      include: {
        county: {
          select: {
            id: true,
            name: true,
            code: true,
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
      },
      orderBy: {
        id: "asc",
      },
    });

  const dbWards = await prisma.ward.findMany({
    include: {
      subCounty: {
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      },
      county: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `Canonical SubCounties:       ${canonicalRecords.length}`,
  );

  console.log(
    `Authoritative ward features: ${geojson.features.length}`,
  );

  console.log(
    `Database counties:           ${counties.length}`,
  );

  console.log(
    `Database SubCounties:         ${dbSubCounties.length}`,
  );

  console.log(
    `Database wards:               ${dbWards.length}`,
  );

  /*
   |--------------------------------------------------------------------------
   | AUTHORITATIVE GID INDEX
   |--------------------------------------------------------------------------
   */

  const authoritativeByGid =
    new Map<number, GeoFeature>();

  for (const feature of geojson.features) {
    const gid = getNumericProperty(feature, [
      "gid",
      "GID",
      "sourceGid",
      "source_gid",
      "id",
    ]);

    if (gid === null) {
      continue;
    }

    authoritativeByGid.set(gid, feature);
  }

  console.log("");
  console.log(
    `Authoritative GID identities: ${authoritativeByGid.size}`,
  );

  /*
   |--------------------------------------------------------------------------
   | RESOLVE EVERY DB WARD
   |--------------------------------------------------------------------------
   */

  const wardResolutions: WardResolution[] = [];

  for (const ward of dbWards as DbWard[]) {
    const feature =
      ward.sourceGid === null
        ? undefined
        : authoritativeByGid.get(
            ward.sourceGid,
          );

    if (!feature) {
      wardResolutions.push({
        wardId: ward.id,
        wardName: ward.name,
        sourceGid: ward.sourceGid,
        sourceUid: ward.sourceUid,

        currentSubCountyId:
          ward.subCountyId,

        currentSubCountyName:
          ward.subCounty?.name ?? null,

        authoritativeSubCounty: null,
        authoritativeCounty: null,

        canonicalSourceName: null,
        canonicalCountyCode: null,

        canonicalDbId: null,
        canonicalDbName: null,

        status: "UNRESOLVED",
      });

      continue;
    }

    const authoritativeSubCounty =
      getProperty(feature, [
        "subcounty_name",
        "subCountyName",
        "sub_county_name",
        "subcounty",
        "subCounty",
        "SubCounty",
        "SUBCOUNTY",
      ]);

    const authoritativeCounty =
      getProperty(feature, [
        "county_name",
        "countyName",
        "county",
        "County",
        "COUNTY",
      ]);

    if (
      !authoritativeSubCounty ||
      !authoritativeCounty
    ) {
      wardResolutions.push({
        wardId: ward.id,
        wardName: ward.name,
        sourceGid: ward.sourceGid,
        sourceUid: ward.sourceUid,

        currentSubCountyId:
          ward.subCountyId,

        currentSubCountyName:
          ward.subCounty?.name ?? null,

        authoritativeSubCounty,
        authoritativeCounty,

        canonicalSourceName: null,
        canonicalCountyCode: null,

        canonicalDbId: null,
        canonicalDbName: null,

        status: "UNRESOLVED",
      });

      continue;
    }

    const sourceResolution =
      findCanonicalSource(
        authoritativeCounty,
        authoritativeSubCounty,
        canonicalRecords,
      );

    if (!sourceResolution.record) {
      wardResolutions.push({
        wardId: ward.id,
        wardName: ward.name,
        sourceGid: ward.sourceGid,
        sourceUid: ward.sourceUid,

        currentSubCountyId:
          ward.subCountyId,

        currentSubCountyName:
          ward.subCounty?.name ?? null,

        authoritativeSubCounty,
        authoritativeCounty,

        canonicalSourceName: null,
        canonicalCountyCode: null,

        canonicalDbId: null,
        canonicalDbName: null,

        status: "NO_CANONICAL_SOURCE",
      });

      continue;
    }

    const canonicalDbCandidates =
      findCanonicalDb(
        sourceResolution.record,
        dbSubCounties as DbSubCounty[],
      );

    if (canonicalDbCandidates.length === 0) {
      wardResolutions.push({
        wardId: ward.id,
        wardName: ward.name,
        sourceGid: ward.sourceGid,
        sourceUid: ward.sourceUid,

        currentSubCountyId:
          ward.subCountyId,

        currentSubCountyName:
          ward.subCounty?.name ?? null,

        authoritativeSubCounty,
        authoritativeCounty,

        canonicalSourceName:
          sourceResolution.record.name,

        canonicalCountyCode:
          sourceResolution.record.countyCode,

        canonicalDbId: null,
        canonicalDbName: null,

        status: "NO_CANONICAL_DB",
      });

      continue;
    }

    if (canonicalDbCandidates.length > 1) {
      wardResolutions.push({
        wardId: ward.id,
        wardName: ward.name,
        sourceGid: ward.sourceGid,
        sourceUid: ward.sourceUid,

        currentSubCountyId:
          ward.subCountyId,

        currentSubCountyName:
          ward.subCounty?.name ?? null,

        authoritativeSubCounty,
        authoritativeCounty,

        canonicalSourceName:
          sourceResolution.record.name,

        canonicalCountyCode:
          sourceResolution.record.countyCode,

        canonicalDbId: null,
        canonicalDbName: null,

        status: "MULTIPLE_TARGETS",
      });

      continue;
    }

    const target =
      canonicalDbCandidates[0];

    const countyMatches =
      target.countyId === ward.countyId;

    if (!countyMatches) {
      wardResolutions.push({
        wardId: ward.id,
        wardName: ward.name,
        sourceGid: ward.sourceGid,
        sourceUid: ward.sourceUid,

        currentSubCountyId:
          ward.subCountyId,

        currentSubCountyName:
          ward.subCounty?.name ?? null,

        authoritativeSubCounty,
        authoritativeCounty,

        canonicalSourceName:
          sourceResolution.record.name,

        canonicalCountyCode:
          sourceResolution.record.countyCode,

        canonicalDbId: target.id,
        canonicalDbName: target.name,

        status: "COUNTY_MISMATCH",
      });

      continue;
    }

    wardResolutions.push({
      wardId: ward.id,
      wardName: ward.name,
      sourceGid: ward.sourceGid,
      sourceUid: ward.sourceUid,

      currentSubCountyId:
        ward.subCountyId,

      currentSubCountyName:
        ward.subCounty?.name ?? null,

      authoritativeSubCounty,
      authoritativeCounty,

      canonicalSourceName:
        sourceResolution.record.name,

      canonicalCountyCode:
        sourceResolution.record.countyCode,

      canonicalDbId: target.id,
      canonicalDbName: target.name,

      status: "RESOLVED",
    });
  }

  /*
   |--------------------------------------------------------------------------
   | GROUP WARDS BY CURRENT SUBCOUNTY
   |--------------------------------------------------------------------------
   */

  const wardsBySubCounty =
    new Map<number, WardResolution[]>();

  for (const ward of wardResolutions) {
    if (ward.currentSubCountyId === null) {
      continue;
    }

    const existing =
      wardsBySubCounty.get(
        ward.currentSubCountyId,
      ) ?? [];

    existing.push(ward);

    wardsBySubCounty.set(
      ward.currentSubCountyId,
      existing,
    );
  }

  /*
   |--------------------------------------------------------------------------
   | BUILD CONSOLIDATION RECORDS
   |--------------------------------------------------------------------------
   */

  const records: ConsolidationRecord[] = [];

  for (const subCounty of dbSubCounties as DbSubCounty[]) {
    const wards =
      wardsBySubCounty.get(
        subCounty.id,
      ) ?? [];

    if (wards.length === 0) {
      continue;
    }

    const targets = [
      ...new Set(
        wards
          .filter(
            (ward) =>
              ward.status === "RESOLVED" &&
              ward.canonicalDbId !== null,
          )
          .map(
            (ward) =>
              ward.canonicalDbId as number,
          ),
      ),
    ];

    const unresolvedCount =
      wards.filter(
        (ward) =>
          ward.status !== "RESOLVED",
      ).length;

    const targetIds =
      targets.filter(
        (id) => id !== subCounty.id,
      );

    /*
     * CASE 1:
     * Some wards cannot be resolved.
     */
    if (
      unresolvedCount > 0
    ) {
      records.push({
        sourceId: subCounty.id,
        sourceName: subCounty.name,
        countyId: subCounty.countyId,
        countyName: subCounty.county.name,

        targetId:
          targetIds.length === 1
            ? targetIds[0]
            : null,

        targetName:
          targetIds.length === 1
            ? (
                dbSubCounties.find(
                  (x) =>
                    x.id ===
                    targetIds[0],
                )?.name ?? null
              )
            : null,

        wards: wards.length,

        farmers:
          subCounty._count.farmers,

        farms:
          subCounty._count.farms,

        businessPartners:
          subCounty._count.businessPartners,

        destinationTransactions:
          subCounty._count
            .destinationTransactions,

        sourceTransactions:
          subCounty._count
            .sourceTransactions,

        classification:
          "MANUAL_REVIEW",

        reason:
          `Unresolved ward targets: ${unresolvedCount}`,

        wardIds:
          wards.map(
            (ward) => ward.wardId,
          ),

        wardNames:
          wards.map(
            (ward) =>
              ward.wardName,
          ),
      });

      continue;
    }

    /*
     * CASE 2:
     * Multiple canonical targets.
     */
    if (targets.length > 1) {
      records.push({
        sourceId: subCounty.id,
        sourceName: subCounty.name,
        countyId: subCounty.countyId,
        countyName: subCounty.county.name,

        targetId: null,
        targetName: null,

        wards: wards.length,

        farmers:
          subCounty._count.farmers,

        farms:
          subCounty._count.farms,

        businessPartners:
          subCounty._count.businessPartners,

        destinationTransactions:
          subCounty._count
            .destinationTransactions,

        sourceTransactions:
          subCounty._count
            .sourceTransactions,

        classification:
          "MANUAL_REVIEW",

        reason:
          `Multiple canonical targets: ${targets.join(", ")}`,

        wardIds:
          wards.map(
            (ward) => ward.wardId,
          ),

        wardNames:
          wards.map(
            (ward) =>
              ward.wardName,
          ),
      });

      continue;
    }

    /*
     * CASE 3:
     * No target was resolved.
     */
    if (targets.length === 0) {
      records.push({
        sourceId: subCounty.id,
        sourceName: subCounty.name,
        countyId: subCounty.countyId,
        countyName: subCounty.county.name,

        targetId: null,
        targetName: null,

        wards: wards.length,

        farmers:
          subCounty._count.farmers,

        farms:
          subCounty._count.farms,

        businessPartners:
          subCounty._count.businessPartners,

        destinationTransactions:
          subCounty._count
            .destinationTransactions,

        sourceTransactions:
          subCounty._count
            .sourceTransactions,

        classification:
          "ALREADY_CANONICAL",

        reason:
          "All wards resolve to the current SubCounty or no migration target is required.",

        wardIds:
          wards.map(
            (ward) => ward.wardId,
          ),

        wardNames:
          wards.map(
            (ward) =>
              ward.wardName,
          ),
      });

      continue;
    }

    const targetId = targets[0];

    /*
     * CASE 4:
     * Target is the current record.
     */
    if (
      targetId === subCounty.id
    ) {
      records.push({
        sourceId: subCounty.id,
        sourceName: subCounty.name,
        countyId: subCounty.countyId,
        countyName: subCounty.county.name,

        targetId: subCounty.id,
        targetName: subCounty.name,

        wards: wards.length,

        farmers:
          subCounty._count.farmers,

        farms:
          subCounty._count.farms,

        businessPartners:
          subCounty._count.businessPartners,

        destinationTransactions:
          subCounty._count
            .destinationTransactions,

        sourceTransactions:
          subCounty._count
            .sourceTransactions,

        classification:
          "ALREADY_CANONICAL",

        reason:
          "Current SubCounty is the resolved canonical target.",

        wardIds:
          wards.map(
            (ward) => ward.wardId,
          ),

        wardNames:
          wards.map(
            (ward) =>
              ward.wardName,
          ),
      });

      continue;
    }

    /*
     * CASE 5:
     * Legacy source with another target.
     *
     * It is SAFE only when there are zero direct relations
     * other than wards.
     */
    const target =
      dbSubCounties.find(
        (record) =>
          record.id === targetId,
      );

    const relationCount =
      subCounty._count.farmers +
      subCounty._count.farms +
      subCounty._count.businessPartners +
      subCounty._count
        .destinationTransactions +
      subCounty._count
        .sourceTransactions;

    if (
      relationCount === 0
    ) {
      records.push({
        sourceId: subCounty.id,
        sourceName: subCounty.name,
        countyId: subCounty.countyId,
        countyName: subCounty.county.name,

        targetId,
        targetName:
          target?.name ?? null,

        wards: wards.length,

        farmers: 0,
        farms: 0,
        businessPartners: 0,
        destinationTransactions: 0,
        sourceTransactions: 0,

        classification:
          "SAFE_LEGACY_MIGRATION",

        reason:
          "All wards resolve to one different canonical target and the legacy SubCounty has zero direct dependent relations.",

        wardIds:
          wards.map(
            (ward) => ward.wardId,
          ),

        wardNames:
          wards.map(
            (ward) =>
              ward.wardName,
          ),
      });
    } else {
      records.push({
        sourceId: subCounty.id,
        sourceName: subCounty.name,
        countyId: subCounty.countyId,
        countyName: subCounty.county.name,

        targetId,
        targetName:
          target?.name ?? null,

        wards: wards.length,

        farmers:
          subCounty._count.farmers,

        farms:
          subCounty._count.farms,

        businessPartners:
          subCounty._count.businessPartners,

        destinationTransactions:
          subCounty._count
            .destinationTransactions,

        sourceTransactions:
          subCounty._count
            .sourceTransactions,

        classification:
          "BLOCKED_BY_RELATIONS",

        reason:
          `Legacy SubCounty has ${relationCount} direct dependent relation records that must be migrated before deletion.`,

        wardIds:
          wards.map(
            (ward) => ward.wardId,
          ),

        wardNames:
          wards.map(
            (ward) =>
              ward.wardName,
          ),
      });
    }
  }

  /*
   |--------------------------------------------------------------------------
   | SUMMARY
   |--------------------------------------------------------------------------
   */

  const safe =
    records.filter(
      (record) =>
        record.classification ===
        "SAFE_LEGACY_MIGRATION",
    );

  const alreadyCanonical =
    records.filter(
      (record) =>
        record.classification ===
        "ALREADY_CANONICAL",
    );

  const blocked =
    records.filter(
      (record) =>
        record.classification ===
        "BLOCKED_BY_RELATIONS",
    );

  const review =
    records.filter(
      (record) =>
        record.classification ===
        "MANUAL_REVIEW",
    );

  const safeWardCount =
    safe.reduce(
      (sum, record) =>
        sum + record.wards,
      0,
    );

  const blockedWardCount =
    blocked.reduce(
      (sum, record) =>
        sum + record.wards,
      0,
    );

  const reviewWardCount =
    review.reduce(
      (sum, record) =>
        sum + record.wards,
      0,
    );

  const canonicalWardCount =
    alreadyCanonical.reduce(
      (sum, record) =>
        sum + record.wards,
      0,
    );

  console.log("");
  console.log("============================================================");
  console.log("V7 CONSOLIDATION SUMMARY");
  console.log("============================================================");
  console.log("");

  console.log(
    `Populated SubCounties:          ${records.length}`,
  );

  console.log(
    `SAFE legacy migrations:         ${safe.length}`,
  );

  console.log(
    `Already canonical:              ${alreadyCanonical.length}`,
  );

  console.log(
    `Blocked by relations:           ${blocked.length}`,
  );

  console.log(
    `Manual review:                  ${review.length}`,
  );

  console.log("");

  console.log(
    `Wards in safe migrations:       ${safeWardCount}`,
  );

  console.log(
    `Wards in canonical records:     ${canonicalWardCount}`,
  );

  console.log(
    `Wards in blocked records:       ${blockedWardCount}`,
  );

  console.log(
    `Wards requiring review:         ${reviewWardCount}`,
  );

  /*
   |--------------------------------------------------------------------------
   | SAFE MIGRATION LIST
   |--------------------------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("SAFE LEGACY MIGRATIONS");
  console.log("============================================================");
  console.log("");

  if (safe.length === 0) {
    console.log("None.");
  } else {
    for (const record of safe) {
      console.log(
        `${record.countyName} | ` +
          `${record.sourceId} ${record.sourceName} ` +
          `→ ${record.targetId} ${record.targetName} ` +
          `| wards=${record.wards}`,
      );
    }
  }

  /*
   |--------------------------------------------------------------------------
   | BLOCKED LIST
   |--------------------------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("BLOCKED BY DIRECT RELATIONS");
  console.log("============================================================");
  console.log("");

  if (blocked.length === 0) {
    console.log("None.");
  } else {
    for (const record of blocked) {
      console.log(
        `${record.countyName} | ` +
          `${record.sourceId} ${record.sourceName} ` +
          `→ ${record.targetId} ${record.targetName} ` +
          `| wards=${record.wards} ` +
          `| farmers=${record.farmers} ` +
          `| farms=${record.farms} ` +
          `| businessPartners=${record.businessPartners} ` +
          `| destinationTx=${record.destinationTransactions} ` +
          `| sourceTx=${record.sourceTransactions}`,
      );
    }
  }

  /*
   |--------------------------------------------------------------------------
   | MANUAL REVIEW
   |--------------------------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("MANUAL REVIEW");
  console.log("============================================================");
  console.log("");

  if (review.length === 0) {
    console.log("None.");
  } else {
    for (const record of review) {
      console.log(
        `${record.countyName} | ` +
          `${record.sourceId} ${record.sourceName} ` +
          `| wards=${record.wards} ` +
          `| ${record.reason}`,
      );
    }
  }

  /*
   |--------------------------------------------------------------------------
   | GLOBAL SAFETY CHECK
   |--------------------------------------------------------------------------
   */

  const accountedWardIds =
    records.flatMap(
      (record) => record.wardIds,
    );

  const uniqueAccountedWardIds =
    new Set(accountedWardIds);

  const uniqueDbWardIds =
    new Set(
      dbWards.map(
        (ward) => ward.id,
      ),
    );

  const missingWardIds =
    [...uniqueDbWardIds].filter(
      (id) =>
        !uniqueAccountedWardIds.has(id),
    );

  const extraWardIds =
    [...uniqueAccountedWardIds].filter(
      (id) =>
        !uniqueDbWardIds.has(id),
    );

  console.log("");
  console.log("============================================================");
  console.log("FINAL V7 SAFETY CHECK");
  console.log("============================================================");
  console.log("");

  console.log(
    `Database wards:               ${dbWards.length}`,
  );

  console.log(
    `Accounted ward records:       ${uniqueAccountedWardIds.size}`,
  );

  console.log(
    `Missing ward IDs:              ${missingWardIds.length}`,
  );

  console.log(
    `Extra ward IDs:                ${extraWardIds.length}`,
  );

  console.log(
    `Duplicate ward assignments:    ${
      accountedWardIds.length -
      uniqueAccountedWardIds.size
    }`,
  );

  if (
    missingWardIds.length === 0 &&
    extraWardIds.length === 0 &&
    accountedWardIds.length ===
      uniqueAccountedWardIds.size
  ) {
    console.log("");
    console.log(
      "PASS — every database ward is accounted for exactly once.",
    );
  } else {
    console.log("");
    console.log(
      "FAIL — ward accounting is not safe.",
    );

    if (missingWardIds.length > 0) {
      console.log(
        `Missing IDs: ${missingWardIds.join(", ")}`,
      );
    }

    if (extraWardIds.length > 0) {
      console.log(
        `Extra IDs: ${extraWardIds.join(", ")}`,
      );
    }

    throw new Error(
      "V7 safety check failed.",
    );
  }

  /*
   |--------------------------------------------------------------------------
   | EXPORT JSON
   |--------------------------------------------------------------------------
   */

  const output = {
    generatedAt: new Date().toISOString(),

    readOnly: true,

    canonicalSubCounties:
      canonicalRecords.length,

    authoritativeWardFeatures:
      geojson.features.length,

    databaseCounties:
      counties.length,

    databaseSubCounties:
      dbSubCounties.length,

    databaseWards:
      dbWards.length,

    summary: {
      populatedSubCounties:
        records.length,

      safeLegacyMigrations:
        safe.length,

      alreadyCanonical:
        alreadyCanonical.length,

      blockedByRelations:
        blocked.length,

      manualReview:
        review.length,

      safeMigrationWards:
        safeWardCount,

      canonicalWards:
        canonicalWardCount,

      blockedWards:
        blockedWardCount,

      reviewWards:
        reviewWardCount,
    },

    safeMigrations: safe,

    blockedMigrations: blocked,

    manualReview: review,

    wardResolutions,
  };

  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(
      output,
      null,
      2,
    ),
    "utf8",
  );

  /*
   |--------------------------------------------------------------------------
   | EXPORT CSV
   |--------------------------------------------------------------------------
   */

  const csvEscape = (
    value: unknown,
  ): string => {
    const text =
      value === null ||
      value === undefined
        ? ""
        : String(value);

    return `"${text.replace(/"/g, '""')}"`;
  };

  const csvRows = [
    [
      "county",
      "sourceId",
      "sourceName",
      "targetId",
      "targetName",
      "wards",
      "farmers",
      "farms",
      "businessPartners",
      "destinationTransactions",
      "sourceTransactions",
      "classification",
      "reason",
      "wardIds",
      "wardNames",
    ],
  ];

  for (const record of records) {
    csvRows.push([
      record.countyName,
      record.sourceId,
      record.sourceName,
      record.targetId,
      record.targetName,
      record.wards,
      record.farmers,
      record.farms,
      record.businessPartners,
      record.destinationTransactions,
      record.sourceTransactions,
      record.classification,
      record.reason,
      record.wardIds.join("|"),
      record.wardNames.join("|"),
    ]);
  }

  const csv = csvRows
    .map(
      (row) =>
        row
          .map(csvEscape)
          .join(","),
    )
    .join("\n");

  fs.writeFileSync(
    OUTPUT_CSV,
    csv,
    "utf8",
  );

  console.log("");
  console.log(
    `V7 JSON written to: ${OUTPUT_JSON}`,
  );

  console.log(
    `V7 CSV written to:  ${OUTPUT_CSV}`,
  );

  console.log("");
  console.log("============================================================");
  console.log("V7 COMPLETE");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("");
  console.error("V7 AUDIT FAILED");
  console.error(error);

  await prisma.$disconnect();

  process.exit(1);
});