import "dotenv/config";

import fs from "fs";
import path from "path";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type CanonicalSubCounty = {
  code?: string;
  countyCode: string;
  name: string;
  headquarters?: string | null;
};

type GeoJsonFeature = {
  type: string;
  properties?: Record<string, unknown>;
  geometry?: unknown;
};

type GeoJsonCollection = {
  type: string;
  features: GeoJsonFeature[];
};

type WardIdentity = {
  sourceGid: number;
  sourceUid: string | null;
  wardName: string;
  authoritativeSubCounty: string | null;
  authoritativeCounty: string | null;
};

type DirectRelations = {
  wards: number;
  farmers: number;
  farms: number;
  businessPartners: number;
  destinationTransactions: number;
  sourceTransactions: number;
};

type Classification =
  | "ALREADY_CANONICAL"
  | "SAFE_LEGACY"
  | "BLOCKED_LEGACY"
  | "NAME_VARIANT"
  | "MANUAL_REVIEW";

type WardResolution = {
  wardId: number;
  wardName: string;
  sourceGid: number | null;
  sourceUid: string | null;
  authoritativeSubCounty: string | null;
  authoritativeCounty: string | null;
};

type AuditRecord = {
  countyId: number;
  countyName: string;
  currentSubCountyId: number;
  currentSubCountyName: string;
  wards: number;

  authoritativeSubCountyNames: string[];
  authoritativeWardCount: number;

  canonicalTargetId: number | null;
  canonicalTargetName: string | null;

  relations: DirectRelations;

  classification: Classification;
  reason: string;

  wardResolutions: WardResolution[];
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

const ROOT = process.cwd();

const CANONICAL_FILE = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounties.json",
);

const GEOJSON_FILE = path.join(
  ROOT,
  "prisma",
  "data",
  "kenya-wards-1450.geojson",
);

const OUTPUT_JSON = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounty-consolidation-v8.json",
);

const OUTPUT_CSV = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounty-consolidation-v8.csv",
);

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

function getProperty(
  properties: Record<string, unknown> | undefined,
  names: string[],
): string | null {
  if (!properties) {
    return null;
  }

  for (const name of names) {
    const value = properties[name];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}

function getNumericProperty(
  properties: Record<string, unknown> | undefined,
  names: string[],
): number | null {
  if (!properties) {
    return null;
  }

  for (const name of names) {
    const value = properties[name];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("SUBCOUNTY CONSOLIDATION AUDIT V8");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  if (!fs.existsSync(CANONICAL_FILE)) {
    throw new Error(`Canonical file not found: ${CANONICAL_FILE}`);
  }

  if (!fs.existsSync(GEOJSON_FILE)) {
    throw new Error(`GeoJSON file not found: ${GEOJSON_FILE}`);
  }

  const canonicalSource =
    JSON.parse(
      fs.readFileSync(CANONICAL_FILE, "utf8"),
    ) as CanonicalSubCounty[];

  const geojson =
    JSON.parse(
      fs.readFileSync(GEOJSON_FILE, "utf8"),
    ) as GeoJsonCollection;

  console.log(
    `Canonical SubCounties:       ${canonicalSource.length}`,
  );

  console.log(
    `Authoritative ward features: ${geojson.features.length}`,
  );

  const counties = await prisma.county.findMany({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  const subCounties = await prisma.subCounty.findMany({
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
          code: true,
        },
      },
    },
  });

  const wards = await prisma.ward.findMany({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      sourceGid: true,
      sourceUid: true,
      countyId: true,
      subCountyId: true,
      county: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      subCounty: {
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      },
    },
  });

  const farmers = await prisma.farmer.findMany({
    select: {
      subCountyId: true,
    },
  });

  const farms = await prisma.farm.findMany({
    select: {
      subCountyId: true,
    },
  });

  const businessPartners = await prisma.businessPartner.findMany({
    select: {
      subCountyId: true,
    },
  });

  const destinationTransactions =
    await prisma.commodityTransaction.findMany({
      select: {
        destinationSubCountyId: true,
      },
    });

  const sourceTransactions =
    await prisma.commodityTransaction.findMany({
      select: {
        sourceSubCountyId: true,
      },
    });

  console.log(
    `Database counties:           ${counties.length}`,
  );

  console.log(
    `Database SubCounties:         ${subCounties.length}`,
  );

  console.log(
    `Database wards:               ${wards.length}`,
  );

  console.log("");

  /*
   * ----------------------------------------------------------
   * 1. BUILD AUTHORITATIVE WARD INDEX
   * ----------------------------------------------------------
   */

  const authoritativeByGid =
    new Map<number, WardIdentity>();

  const authoritativeByUid =
    new Map<string, WardIdentity>();

  for (const feature of geojson.features) {
    const properties = feature.properties;

    const sourceGid =
      getNumericProperty(properties, [
        "gid",
        "sourceGid",
        "GID",
        "GID_2",
        "ward_gid",
        "wardGid",
      ]);

    if (sourceGid === null) {
      continue;
    }

    const sourceUid =
      getProperty(properties, [
        "uid",
        "sourceUid",
        "UID",
        "ward_uid",
        "wardUid",
      ]);

    const wardName =
      getProperty(properties, [
        "ward_name",
        "wardName",
        "name",
        "NAME",
        "ward",
      ]) ?? "UNKNOWN";

    const authoritativeSubCounty =
      getProperty(properties, [
        "subcounty_name",
        "subCountyName",
        "sub_county_name",
        "subcounty",
        "sub_county",
        "SubCounty",
        "SUBCOUNTY",
      ]);

    const authoritativeCounty =
      getProperty(properties, [
        "county_name",
        "countyName",
        "county",
        "County",
        "COUNTY",
      ]);

    const identity: WardIdentity = {
      sourceGid,
      sourceUid,
      wardName,
      authoritativeSubCounty,
      authoritativeCounty,
    };

    authoritativeByGid.set(sourceGid, identity);

    if (sourceUid) {
      authoritativeByUid.set(sourceUid, identity);
    }
  }

  console.log(
    `Authoritative GID identities: ${authoritativeByGid.size}`,
  );

  console.log("");

  /*
   * ----------------------------------------------------------
   * 2. BUILD CANONICAL SOURCE INDEX
   * ----------------------------------------------------------
   */

  const canonicalByCountyAndName =
    new Map<string, CanonicalSubCounty>();

  for (const record of canonicalSource) {
    const key =
      `${normalizeCounty(record.countyCode)}::${normalizeName(record.name)}`;

    canonicalByCountyAndName.set(key, record);
  }

  /*
   * ----------------------------------------------------------
   * 3. BUILD COUNTY INDEX
   * ----------------------------------------------------------
   */

  const countiesByCode =
    new Map<string, typeof counties[number]>();

  const countiesByNormalizedName =
    new Map<string, typeof counties[number]>();

  for (const county of counties) {
    countiesByCode.set(
      normalizeCounty(county.code),
      county,
    );

    countiesByNormalizedName.set(
      normalizeCounty(county.name),
      county,
    );
  }

  /*
   * ----------------------------------------------------------
   * 4. BUILD DB SUBCOUNTY INDEXES
   * ----------------------------------------------------------
   */

  const subCountyById =
    new Map<number, typeof subCounties[number]>();

  const subCountiesByCounty =
    new Map<number, typeof subCounties>();

  for (const subCounty of subCounties) {
    subCountyById.set(
      subCounty.id,
      subCounty,
    );

    const list =
      subCountiesByCounty.get(subCounty.countyId) ?? [];

    list.push(subCounty);

    subCountiesByCounty.set(
      subCounty.countyId,
      list,
    );
  }

  /*
   * ----------------------------------------------------------
   * 5. RESOLVE CANONICAL DB RECORDS
   *
   * IMPORTANT:
   * We do NOT require GeoJSON → canonical source to work.
   *
   * We first resolve the authoritative name against DB records.
   * This fixes the V7 failure.
   * ----------------------------------------------------------
   */

  function findCanonicalDbTarget(
    countyId: number,
    authoritativeName: string,
  ): typeof subCounties[number] | null {
    const countyRecords =
      subCountiesByCounty.get(countyId) ?? [];

    const normalizedAuthoritative =
      normalizeName(authoritativeName);

    /*
     * First: exact normalized name.
     */
    const exactMatches =
      countyRecords.filter(
        (record) =>
          normalizeName(record.name) ===
          normalizedAuthoritative,
      );

    if (exactMatches.length === 1) {
      return exactMatches[0];
    }

    /*
     * Second: explicit known administrative rename.
     *
     * These are not guesses; they are based on the
     * administrative mapping already established during
     * the previous audits.
     */
    const fallbackMap: Record<string, string> = {
      "isiolo::isiolo": "isiolo north",
      "mandera::mandera north": "mandera north",
      "kericho::belgut": "ainamoi",
      "bungoma::cheptais": "cheptais",
      "bungoma::tongaren": "tongaren",
      "machakos::athi river": "athi river",
      "machakos::machakos": "machakos",
      "machakos::mwala": "mwala",
      "homa bay::karachuonyo": "karachuonyo",
      "homa bay::ndhiwa": "ndhiwa",
      "migori::awendo": "awendo",
      "migori::nyatike": "nyatike",
      "migori::kuria west": "kuria west",
      "migori::suna west": "suna west",
      "taita taveta::taveta": "taveta",
      "taita taveta::mwatate": "mwatate",
      "taita taveta::voi": "voi",
      "meru::imenti central": "imenti central",
      "west pokot::pokot north": "pokot north",
      "west pokot::pokot central": "pokot central",
      "nyandarua::olkalou": "olkalou",
      "nyeri::nyeri central": "nyeri central",
      "kirinyaga::kirinyaga east": "kirinyaga east",
      "muranga::kiharu": "kiharu",
      "muranga::muranga south": "muranga south",
      "muranga::gatanga": "gatanga",
      "muranga::kangema": "kangema",
      "samburu::samburu central": "samburu central",
      "kiambu::kiambu town": "kiambu town",
      "kwale::lunga lunga": "lunga lunga",
      "nakuru::nakuru east": "nakuru east",
      "nyamira::manga": "manga",
      "narok::transmara east": "transmara east",
      "baringo::marigat": "marigat",
      "kajiado::loitokitok": "loitokitok",
      "tharaka nithi::tharaka south": "tharaka south",
    };

    const county =
      countyRecords[0]?.county;

    if (!county) {
      return null;
    }

    const countyKey =
      normalizeCounty(county.name);

    const fallbackKey =
      `${countyKey}::${normalizedAuthoritative}`;

    const fallbackName =
      fallbackMap[fallbackKey];

    if (fallbackName) {
      const fallbackMatches =
        countyRecords.filter(
          (record) =>
            normalizeName(record.name) ===
            normalizeName(fallbackName),
        );

      if (fallbackMatches.length === 1) {
        return fallbackMatches[0];
      }
    }

    /*
     * Third: canonical source file.
     */
    const canonicalMatches =
      canonicalSource.filter(
        (record) =>
          normalizeName(record.name) ===
          normalizedAuthoritative,
      );

    if (canonicalMatches.length === 1) {
      const canonical =
        canonicalMatches[0];

      const canonicalDbMatches =
        countyRecords.filter(
          (record) =>
            normalizeName(record.name) ===
            normalizeName(canonical.name),
        );

      if (canonicalDbMatches.length === 1) {
        return canonicalDbMatches[0];
      }
    }

    return null;
  }

  /*
   * ----------------------------------------------------------
   * 6. DIRECT RELATION INDEXES
   * ----------------------------------------------------------
   */

  const farmerCounts =
    new Map<number, number>();

  for (const farmer of farmers) {
    if (farmer.subCountyId === null) {
      continue;
    }

    farmerCounts.set(
      farmer.subCountyId,
      (farmerCounts.get(farmer.subCountyId) ?? 0) + 1,
    );
  }

  const farmCounts =
    new Map<number, number>();

  for (const farm of farms) {
    if (farm.subCountyId === null) {
      continue;
    }

    farmCounts.set(
      farm.subCountyId,
      (farmCounts.get(farm.subCountyId) ?? 0) + 1,
    );
  }

  const businessPartnerCounts =
    new Map<number, number>();

  for (const partner of businessPartners) {
    if (partner.subCountyId === null) {
      continue;
    }

    businessPartnerCounts.set(
      partner.subCountyId,
      (businessPartnerCounts.get(partner.subCountyId) ?? 0) + 1,
    );
  }

  const destinationTransactionCounts =
    new Map<number, number>();

  for (const tx of destinationTransactions) {
    if (tx.destinationSubCountyId === null) {
      continue;
    }

    destinationTransactionCounts.set(
      tx.destinationSubCountyId,
      (destinationTransactionCounts.get(
        tx.destinationSubCountyId,
      ) ?? 0) + 1,
    );
  }

  const sourceTransactionCounts =
    new Map<number, number>();

  for (const tx of sourceTransactions) {
    if (tx.sourceSubCountyId === null) {
      continue;
    }

    sourceTransactionCounts.set(
      tx.sourceSubCountyId,
      (sourceTransactionCounts.get(
        tx.sourceSubCountyId,
      ) ?? 0) + 1,
    );
  }

  /*
   * ----------------------------------------------------------
   * 7. GROUP DATABASE WARDS BY CURRENT SUBCOUNTY
   * ----------------------------------------------------------
   */

  const wardsBySubCounty =
    new Map<number, typeof wards>();

  for (const ward of wards) {
    if (ward.subCountyId === null) {
      continue;
    }

    const list =
      wardsBySubCounty.get(ward.subCountyId) ?? [];

    list.push(ward);

    wardsBySubCounty.set(
      ward.subCountyId,
      list,
    );
  }

  /*
   * ----------------------------------------------------------
   * 8. CLASSIFY ALL POPULATED SUBCOUNTIES
   * ----------------------------------------------------------
   */

  const populatedSubCounties =
    subCounties.filter(
      (subCounty) =>
        (wardsBySubCounty.get(subCounty.id) ?? []).length > 0,
    );

  const records: AuditRecord[] = [];

  let safeLegacy = 0;
  let alreadyCanonical = 0;
  let blocked = 0;
  let nameVariant = 0;
  let manualReview = 0;

  let safeLegacyWards = 0;
  let canonicalWards = 0;
  let blockedWards = 0;
  let reviewWards = 0;

  for (const subCounty of populatedSubCounties) {
    const currentWards =
      wardsBySubCounty.get(subCounty.id) ?? [];

    const wardResolutions: WardResolution[] = [];

    const authoritativeNames =
      new Set<string>();

    const targetIds =
      new Set<number>();

    let unresolvedWardCount = 0;

    for (const ward of currentWards) {
      let authoritative: WardIdentity | null = null;

      if (ward.sourceGid !== null) {
        authoritative =
          authoritativeByGid.get(
            ward.sourceGid,
          ) ?? null;
      }

      if (!authoritative && ward.sourceUid) {
        authoritative =
          authoritativeByUid.get(
            ward.sourceUid,
          ) ?? null;
      }

      if (!authoritative) {
        unresolvedWardCount++;

        wardResolutions.push({
          wardId: ward.id,
          wardName: ward.name,
          sourceGid: ward.sourceGid,
          sourceUid: ward.sourceUid,
          authoritativeSubCounty: null,
          authoritativeCounty: null,
        });

        continue;
      }

      if (authoritative.authoritativeSubCounty) {
        authoritativeNames.add(
          authoritative.authoritativeSubCounty,
        );
      }

      wardResolutions.push({
        wardId: ward.id,
        wardName: ward.name,
        sourceGid: ward.sourceGid,
        sourceUid: ward.sourceUid,
        authoritativeSubCounty:
          authoritative.authoritativeSubCounty,
        authoritativeCounty:
          authoritative.authoritativeCounty,
      });

      /*
       * Resolve the authoritative SubCounty directly
       * against the database.
       */
      if (
        authoritative.authoritativeSubCounty
      ) {
        const target =
          findCanonicalDbTarget(
            subCounty.countyId,
            authoritative.authoritativeSubCounty,
          );

        if (target) {
          targetIds.add(target.id);
        }
      }
    }

    const targetIdArray =
      Array.from(targetIds);

    const relations: DirectRelations = {
      wards: currentWards.length,
      farmers:
        farmerCounts.get(subCounty.id) ?? 0,
      farms:
        farmCounts.get(subCounty.id) ?? 0,
      businessPartners:
        businessPartnerCounts.get(subCounty.id) ?? 0,
      destinationTransactions:
        destinationTransactionCounts.get(
          subCounty.id,
        ) ?? 0,
      sourceTransactions:
        sourceTransactionCounts.get(
          subCounty.id,
        ) ?? 0,
    };

    const normalizedCurrent =
      normalizeName(subCounty.name);

    /*
     * --------------------------------------------------------
     * CASE 1:
     * Current DB name agrees with authoritative name.
     * --------------------------------------------------------
     */

    const currentMatchesAuthoritative =
      authoritativeNames.size === 1 &&
      Array.from(authoritativeNames)[0] !== null &&
      normalizeName(
        Array.from(authoritativeNames)[0],
      ) === normalizedCurrent;

    if (
      unresolvedWardCount === 0 &&
      currentMatchesAuthoritative
    ) {
      records.push({
        countyId: subCounty.countyId,
        countyName: subCounty.county.name,
        currentSubCountyId: subCounty.id,
        currentSubCountyName: subCounty.name,
        wards: currentWards.length,
        authoritativeSubCountyNames:
          Array.from(authoritativeNames),
        authoritativeWardCount:
          currentWards.length,
        canonicalTargetId: subCounty.id,
        canonicalTargetName: subCounty.name,
        relations,
        classification: "ALREADY_CANONICAL",
        reason:
          "CURRENT_SUBCOUNTY_MATCHES_AUTHORITATIVE_SUBCOUNTY",
        wardResolutions,
      });

      alreadyCanonical++;
      canonicalWards += currentWards.length;

      continue;
    }

    /*
     * --------------------------------------------------------
     * CASE 2:
     * All wards resolve to exactly one different DB target.
     * --------------------------------------------------------
     */

    if (
      unresolvedWardCount === 0 &&
      targetIdArray.length === 1 &&
      targetIdArray[0] !== subCounty.id
    ) {
      const target =
        subCountyById.get(
          targetIdArray[0],
        );

      if (!target) {
        records.push({
          countyId: subCounty.countyId,
          countyName: subCounty.county.name,
          currentSubCountyId: subCounty.id,
          currentSubCountyName: subCounty.name,
          wards: currentWards.length,
          authoritativeSubCountyNames:
            Array.from(authoritativeNames),
          authoritativeWardCount:
            currentWards.length,
          canonicalTargetId: null,
          canonicalTargetName: null,
          relations,
          classification: "MANUAL_REVIEW",
          reason:
            "TARGET_DB_SUBCOUNTY_NOT_FOUND",
          wardResolutions,
        });

        manualReview++;
        reviewWards += currentWards.length;

        continue;
      }

      const hasRelations =
        relations.farmers > 0 ||
        relations.farms > 0 ||
        relations.businessPartners > 0 ||
        relations.destinationTransactions > 0 ||
        relations.sourceTransactions > 0;

      if (hasRelations) {
        records.push({
          countyId: subCounty.countyId,
          countyName: subCounty.county.name,
          currentSubCountyId: subCounty.id,
          currentSubCountyName: subCounty.name,
          wards: currentWards.length,
          authoritativeSubCountyNames:
            Array.from(authoritativeNames),
          authoritativeWardCount:
            currentWards.length,
          canonicalTargetId: target.id,
          canonicalTargetName: target.name,
          relations,
          classification: "BLOCKED_LEGACY",
          reason:
            "ALL_WARDS_RESOLVE_TO_ONE_CANONICAL_TARGET_BUT_DIRECT_RELATIONS_EXIST",
          wardResolutions,
        });

        blocked++;
        blockedWards += currentWards.length;

        continue;
      }

      records.push({
        countyId: subCounty.countyId,
        countyName: subCounty.county.name,
        currentSubCountyId: subCounty.id,
        currentSubCountyName: subCounty.name,
        wards: currentWards.length,
        authoritativeSubCountyNames:
          Array.from(authoritativeNames),
        authoritativeWardCount:
          currentWards.length,
        canonicalTargetId: target.id,
        canonicalTargetName: target.name,
        relations,
        classification: "SAFE_LEGACY",
        reason:
          "ALL_WARDS_RESOLVE_TO_ONE_DIFFERENT_CANONICAL_TARGET_AND_NO_DIRECT_RELATIONS_EXIST",
        wardResolutions,
      });

      safeLegacy++;
      safeLegacyWards += currentWards.length;

      continue;
    }

    /*
     * --------------------------------------------------------
     * CASE 3:
     * Current name differs but authoritative name points
     * back to the same DB record.
     * --------------------------------------------------------
     */

    if (
      unresolvedWardCount === 0 &&
      targetIdArray.length === 1 &&
      targetIdArray[0] === subCounty.id
    ) {
      records.push({
        countyId: subCounty.countyId,
        countyName: subCounty.county.name,
        currentSubCountyId: subCounty.id,
        currentSubCountyName: subCounty.name,
        wards: currentWards.length,
        authoritativeSubCountyNames:
          Array.from(authoritativeNames),
        authoritativeWardCount:
          currentWards.length,
        canonicalTargetId: subCounty.id,
        canonicalTargetName: subCounty.name,
        relations,
        classification: "NAME_VARIANT",
        reason:
          "AUTHORITATIVE_NAME_RESOLVES_TO_CURRENT_DB_RECORD",
        wardResolutions,
      });

      nameVariant++;
      canonicalWards += currentWards.length;

      continue;
    }

    /*
     * --------------------------------------------------------
     * CASE 4:
     * Everything else is manual review.
     * --------------------------------------------------------
     */

    records.push({
      countyId: subCounty.countyId,
      countyName: subCounty.county.name,
      currentSubCountyId: subCounty.id,
      currentSubCountyName: subCounty.name,
      wards: currentWards.length,
      authoritativeSubCountyNames:
        Array.from(authoritativeNames),
      authoritativeWardCount:
        currentWards.length,
      canonicalTargetId: null,
      canonicalTargetName: null,
      relations,
      classification: "MANUAL_REVIEW",
      reason:
        unresolvedWardCount > 0
          ? "UNRESOLVED_AUTHORITATIVE_WARD_IDENTITIES"
          : targetIdArray.length === 0
            ? "AUTHORITATIVE_SUBCOUNTY_COULD_NOT_BE_RESOLVED_TO_DB"
            : "MULTIPLE_OR_CONFLICTING_CANONICAL_TARGETS",
      wardResolutions,
    });

    manualReview++;
    reviewWards += currentWards.length;
  }

  /*
   * ----------------------------------------------------------
   * 9. SORT RECORDS
   * ----------------------------------------------------------
   */

  records.sort((a, b) => {
    if (a.countyName !== b.countyName) {
      return a.countyName.localeCompare(
        b.countyName,
      );
    }

    return (
      a.currentSubCountyId -
      b.currentSubCountyId
    );
  });

  /*
   * ----------------------------------------------------------
   * 10. PRINT SUMMARY
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("V8 CONSOLIDATION SUMMARY");
  console.log("============================================================");
  console.log("");

  console.log(
    `Populated SubCounties:          ${populatedSubCounties.length}`,
  );

  console.log(
    `SAFE legacy migrations:         ${safeLegacy}`,
  );

  console.log(
    `Already canonical:              ${alreadyCanonical}`,
  );

  console.log(
    `Name variants:                  ${nameVariant}`,
  );

  console.log(
    `Blocked by relations:           ${blocked}`,
  );

  console.log(
    `Manual review:                  ${manualReview}`,
  );

  console.log("");

  console.log(
    `Wards in safe migrations:       ${safeLegacyWards}`,
  );

  console.log(
    `Wards in canonical records:     ${canonicalWards}`,
  );

  console.log(
    `Wards in blocked records:       ${blockedWards}`,
  );

  console.log(
    `Wards requiring review:         ${reviewWards}`,
  );

  /*
   * ----------------------------------------------------------
   * 11. SAFE MIGRATIONS
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("SAFE LEGACY MIGRATIONS");
  console.log("============================================================");
  console.log("");

  const safeRecords =
    records.filter(
      (record) =>
        record.classification ===
        "SAFE_LEGACY",
    );

  if (safeRecords.length === 0) {
    console.log("None.");
  } else {
    for (const record of safeRecords) {
      console.log(
        `${record.countyName} | ` +
        `${record.currentSubCountyId} ${record.currentSubCountyName} | ` +
        `wards=${record.wards} | ` +
        `TARGET ${record.canonicalTargetId} ${record.canonicalTargetName}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * 12. BLOCKED RECORDS
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("BLOCKED BY DIRECT RELATIONS");
  console.log("============================================================");
  console.log("");

  const blockedRecords =
    records.filter(
      (record) =>
        record.classification ===
        "BLOCKED_LEGACY",
    );

  if (blockedRecords.length === 0) {
    console.log("None.");
  } else {
    for (const record of blockedRecords) {
      console.log(
        `${record.countyName} | ` +
        `${record.currentSubCountyId} ${record.currentSubCountyName} | ` +
        `wards=${record.wards} | ` +
        `TARGET ${record.canonicalTargetId} ${record.canonicalTargetName}`,
      );

      console.log(
        `  Farmers=${record.relations.farmers} ` +
        `Farms=${record.relations.farms} ` +
        `BusinessPartners=${record.relations.businessPartners} ` +
        `DestinationTx=${record.relations.destinationTransactions} ` +
        `SourceTx=${record.relations.sourceTransactions}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * 13. MANUAL REVIEW
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("MANUAL REVIEW");
  console.log("============================================================");
  console.log("");

  const reviewRecords =
    records.filter(
      (record) =>
        record.classification ===
        "MANUAL_REVIEW",
    );

  if (reviewRecords.length === 0) {
    console.log("None.");
  } else {
    for (const record of reviewRecords) {
      console.log(
        `${record.countyName} | ` +
        `${record.currentSubCountyId} ${record.currentSubCountyName} | ` +
        `wards=${record.wards} | ` +
        `${record.reason}`,
      );

      if (
        record.authoritativeSubCountyNames.length > 0
      ) {
        console.log(
          `  Authoritative: ${record.authoritativeSubCountyNames.join(
            " | ",
          )}`,
        );
      }

      if (
        record.canonicalTargetId !== null
      ) {
        console.log(
          `  Target: ${record.canonicalTargetId} ${record.canonicalTargetName}`,
        );
      }
    }
  }

  /*
   * ----------------------------------------------------------
   * 14. FINAL WARD ACCOUNTING
   * ----------------------------------------------------------
   */

  const accountedWardIds =
    new Set<number>();

  let duplicateAssignments = 0;

  for (const record of records) {
    for (const ward of record.wardResolutions) {
      if (accountedWardIds.has(ward.wardId)) {
        duplicateAssignments++;
      }

      accountedWardIds.add(
        ward.wardId,
      );
    }
  }

  const databaseWardIds =
    new Set(
      wards.map(
        (ward) => ward.id,
      ),
    );

  const missingWardIds =
    Array.from(databaseWardIds).filter(
      (id) =>
        !accountedWardIds.has(id),
    );

  const extraWardIds =
    Array.from(accountedWardIds).filter(
      (id) =>
        !databaseWardIds.has(id),
    );

  console.log("");
  console.log("============================================================");
  console.log("FINAL V8 SAFETY CHECK");
  console.log("============================================================");
  console.log("");

  console.log(
    `Database wards:               ${wards.length}`,
  );

  console.log(
    `Accounted ward records:       ${accountedWardIds.size}`,
  );

  console.log(
    `Missing ward IDs:              ${missingWardIds.length}`,
  );

  console.log(
    `Extra ward IDs:                ${extraWardIds.length}`,
  );

  console.log(
    `Duplicate ward assignments:    ${duplicateAssignments}`,
  );

  if (
    accountedWardIds.size !== wards.length ||
    missingWardIds.length !== 0 ||
    extraWardIds.length !== 0 ||
    duplicateAssignments !== 0
  ) {
    throw new Error(
      "V8 SAFETY CHECK FAILED — ward accounting is not exact.",
    );
  }

  console.log("");
  console.log(
    "PASS — every database ward is accounted for exactly once.",
  );

  /*
   * ----------------------------------------------------------
   * 15. WRITE JSON
   * ----------------------------------------------------------
   */

  const jsonOutput = {
    generatedAt: new Date().toISOString(),

    readOnly: true,

    summary: {
      canonicalSubCounties:
        canonicalSource.length,

      authoritativeWardFeatures:
        geojson.features.length,

      databaseCounties:
        counties.length,

      databaseSubCounties:
        subCounties.length,

      databaseWards:
        wards.length,

      populatedSubCounties:
        populatedSubCounties.length,

      safeLegacyMigrations:
        safeLegacy,

      alreadyCanonical:
        alreadyCanonical,

      nameVariants:
        nameVariant,

      blockedByRelations:
        blocked,

      manualReview:
        manualReview,

      wardsInSafeMigrations:
        safeLegacyWards,

      wardsInCanonicalRecords:
        canonicalWards,

      wardsInBlockedRecords:
        blockedWards,

      wardsRequiringReview:
        reviewWards,

      accountedWards:
        accountedWardIds.size,
    },

    records,
  };

  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(
      jsonOutput,
      null,
      2,
    ),
    "utf8",
  );

  /*
   * ----------------------------------------------------------
   * 16. WRITE CSV
   * ----------------------------------------------------------
   */

  const csvHeader = [
    "countyId",
    "countyName",
    "currentSubCountyId",
    "currentSubCountyName",
    "wards",
    "authoritativeSubCountyNames",
    "authoritativeWardCount",
    "canonicalTargetId",
    "canonicalTargetName",
    "classification",
    "reason",
    "farmers",
    "farms",
    "businessPartners",
    "destinationTransactions",
    "sourceTransactions",
  ];

  const csvRows = [
    csvHeader.join(","),
  ];

  for (const record of records) {
    csvRows.push(
      [
        record.countyId,
        record.countyName,
        record.currentSubCountyId,
        record.currentSubCountyName,
        record.wards,
        record.authoritativeSubCountyNames.join(
          " | ",
        ),
        record.authoritativeWardCount,
        record.canonicalTargetId,
        record.canonicalTargetName,
        record.classification,
        record.reason,
        record.relations.farmers,
        record.relations.farms,
        record.relations.businessPartners,
        record.relations.destinationTransactions,
        record.relations.sourceTransactions,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  fs.writeFileSync(
    OUTPUT_CSV,
    csvRows.join("\n"),
    "utf8",
  );

  console.log("");
  console.log(
    `V8 JSON written to: ${OUTPUT_JSON}`,
  );

  console.log(
    `V8 CSV written to:  ${OUTPUT_CSV}`,
  );

  console.log("");
  console.log("============================================================");
  console.log("V8 COMPLETE");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("V8 AUDIT FAILED");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });