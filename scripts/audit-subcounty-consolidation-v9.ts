import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

type SourceSubCounty = {
  code?: string;
  countyCode: string;
  name: string;
  headquarters?: string | null;
};

type GeoFeature = {
  type?: string;
  properties?: Record<string, unknown>;
};

type GeoJson = {
  type?: string;
  features?: GeoFeature[];
};

type RelationCounts = {
  wards: number;
  farmers: number;
  farms: number;
  businessPartners: number;
  destinationTransactions: number;
  sourceTransactions: number;
};

type AuditRecord = {
  sourceSubCountyId: number;
  sourceSubCountyName: string;
  countyId: number;
  countyName: string;
  wardCount: number;
  authoritativeNames: string[];
  currentMatchesAuthoritative: boolean;
  targetSubCountyId: number | null;
  targetSubCountyName: string | null;
  classification: string;
  reason: string;
  relations: RelationCounts;
  wardIds: number[];
  sourceGids: number[];
};

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

function getProperty(
  properties: Record<string, unknown> | undefined,
  names: string[],
): string | null {
  if (!properties) {
    return null;
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

  return null;
}

function countyKey(value: string): string {
  return normalizeName(value);
}

function subCountyKey(
  countyName: string,
  subCountyName: string,
): string {
  return `${countyKey(countyName)}::${normalizeName(subCountyName)}`;
}

function findCanonicalSource(
  countyName: string,
  sourceName: string,
  canonicalRecords: SourceSubCounty[],
): SourceSubCounty | null {
  const county = countyKey(countyName);
  const normalized = normalizeName(sourceName);

  const exact = canonicalRecords.find(
    (record) =>
      countyKey(record.countyCode) === county &&
      normalizeName(record.name) === normalized,
  );

  if (exact) {
    return exact;
  }

  const fallbackName =
    VERIFIED_SUBCOUNTY_FALLBACKS[
      subCountyKey(countyName, sourceName)
    ];

  if (fallbackName) {
    const fallback = canonicalRecords.find(
      (record) =>
        normalizeName(record.name) ===
        normalizeName(fallbackName),
    );

    if (fallback) {
      return fallback;
    }
  }

  const countyRule =
    COUNTY_SUBCOUNTY_RULES[
      subCountyKey(countyName, sourceName)
    ];

  if (countyRule) {
    const ruleMatch = canonicalRecords.find(
      (record) =>
        normalizeName(record.name) ===
        normalizeName(countyRule),
    );

    if (ruleMatch) {
      return ruleMatch;
    }
  }

  return null;
}

async function countRelations(
  subCountyId: number,
): Promise<RelationCounts> {
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
        subCountyId,
      },
    }),

    prisma.farmer.count({
      where: {
        subCountyId,
      },
    }),

    prisma.farm.count({
      where: {
        subCountyId,
      },
    }),

    prisma.businessPartner.count({
      where: {
        subCountyId,
      },
    }),

    prisma.commodityTransaction.count({
      where: {
        destinationSubCountyId: subCountyId,
      },
    }),

    prisma.commodityTransaction.count({
      where: {
        sourceSubCountyId: subCountyId,
      },
    }),
  ]);

  return {
    wards,
    farmers,
    farms,
    businessPartners,
    destinationTransactions,
    sourceTransactions,
  };
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("SUBCOUNTY CONSOLIDATION AUDIT V9");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  /*
   * ----------------------------------------------------------
   * LOAD AUTHORITATIVE SUBCOUNTIES
   * ----------------------------------------------------------
   */

  const subcountyPath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "subcounties.json",
  );

  const subcountyRaw = fs.readFileSync(
    subcountyPath,
    "utf8",
  );

  const canonicalRecords =
    JSON.parse(subcountyRaw) as SourceSubCounty[];

  /*
   * ----------------------------------------------------------
   * LOAD AUTHORITATIVE WARDS
   * ----------------------------------------------------------
   */

  const geojsonPath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "kenya-wards-1450.geojson",
  );

  const geojsonRaw = fs.readFileSync(
    geojsonPath,
    "utf8",
  );

  const geojson = JSON.parse(geojsonRaw) as GeoJson;

  const features = geojson.features ?? [];

  /*
   * ----------------------------------------------------------
   * DATABASE
   * ----------------------------------------------------------
   */

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
    },
  });

  const wards = await prisma.ward.findMany({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
      sourceGid: true,
      sourceUid: true,
    },
  });

  console.log(
    `Canonical SubCounties:       ${canonicalRecords.length}`,
  );
  console.log(
    `Authoritative ward features: ${features.length}`,
  );
  console.log(
    `Database counties:           ${counties.length}`,
  );
  console.log(
    `Database SubCounties:        ${subCounties.length}`,
  );
  console.log(
    `Database wards:              ${wards.length}`,
  );
  console.log("");

  /*
   * ----------------------------------------------------------
   * AUTHORITATIVE GID INDEX
   * ----------------------------------------------------------
   */

  const authoritativeByGid = new Map<
    number,
    {
      gid: number;
      uid: string | null;
      subCountyName: string | null;
      countyName: string | null;
    }
  >();

  for (const feature of features) {
    const properties = feature.properties;

    const gidText = getProperty(properties, [
      "gid",
      "GID",
      "GID_3",
      "sourceGid",
    ]);

    if (!gidText) {
      continue;
    }

    const gid = Number(gidText);

    if (!Number.isFinite(gid)) {
      continue;
    }

    const uid = getProperty(properties, [
      "uid",
      "UID",
      "sourceUid",
    ]);

    const subCountyName = getProperty(properties, [
      "subcounty_name",
      "sub_county_name",
      "subCountyName",
      "subcounty",
      "sub_county",
      "SUBCOUNTY",
      "SubCounty",
    ]);

    const countyName = getProperty(properties, [
      "county_name",
      "countyName",
      "county",
      "COUNTY",
      "County",
    ]);

    authoritativeByGid.set(gid, {
      gid,
      uid,
      subCountyName,
      countyName,
    });
  }

  console.log(
    `Authoritative GID identities: ${authoritativeByGid.size}`,
  );
  console.log("");

  /*
   * ----------------------------------------------------------
   * CANONICAL SOURCE → DATABASE RESOLUTION
   * ----------------------------------------------------------
   */

  const canonicalDbBySource = new Map<
    string,
    {
      source: SourceSubCounty;
      dbId: number;
      dbName: string;
      countyId: number;
    }
  >();

  let canonicalResolved = 0;
  let canonicalUnresolved = 0;

  for (const source of canonicalRecords) {
    const county = counties.find(
      (record) =>
        record.code === source.countyCode ||
        normalizeName(record.name) ===
          normalizeName(source.countyCode),
    );

    if (!county) {
      canonicalUnresolved++;
      continue;
    }

    const exact = subCounties.find(
      (record) =>
        record.countyId === county.id &&
        normalizeName(record.name) ===
          normalizeName(source.name),
    );

    if (exact) {
      canonicalDbBySource.set(
        `${source.countyCode}::${normalizeName(source.name)}`,
        {
          source,
          dbId: exact.id,
          dbName: exact.name,
          countyId: county.id,
        },
      );

      canonicalResolved++;
      continue;
    }

    const fallbackName =
      VERIFIED_SUBCOUNTY_FALLBACKS[
        subCountyKey(county.name, source.name)
      ];

    const countyRule =
      COUNTY_SUBCOUNTY_RULES[
        subCountyKey(county.name, source.name)
      ];

    const candidateName =
      fallbackName ?? countyRule ?? source.name;

    const candidates = subCounties.filter(
      (record) =>
        record.countyId === county.id &&
        normalizeName(record.name) ===
          normalizeName(candidateName),
    );

    if (candidates.length === 1) {
      const target = candidates[0];

      canonicalDbBySource.set(
        `${source.countyCode}::${normalizeName(source.name)}`,
        {
          source,
          dbId: target.id,
          dbName: target.name,
          countyId: county.id,
        },
      );

      canonicalResolved++;
    } else {
      canonicalUnresolved++;
    }
  }

  console.log(
    `Canonical source records:    ${canonicalRecords.length}`,
  );
  console.log(
    `Resolved canonical DB IDs:   ${canonicalResolved}`,
  );
  console.log(
    `Unresolved canonical IDs:    ${canonicalUnresolved}`,
  );
  console.log("");

  /*
   * ----------------------------------------------------------
   * BUILD WARD GROUPS
   * ----------------------------------------------------------
   */

  const wardsBySubCounty = new Map<
    number,
    typeof wards
  >();

  for (const ward of wards) {
    if (ward.subCountyId === null) {
      continue;
    }

    const existing =
      wardsBySubCounty.get(ward.subCountyId) ?? [];

    existing.push(ward);

    wardsBySubCounty.set(
      ward.subCountyId,
      existing,
    );
  }

  /*
   * ----------------------------------------------------------
   * AUDIT POPULATED SUBCOUNTIES
   * ----------------------------------------------------------
   */

  const auditRecords: AuditRecord[] = [];

  let safeMigrations = 0;
  let alreadyCanonical = 0;
  let nameVariants = 0;
  let blocked = 0;
  let manualReview = 0;

  let safeWardCount = 0;
  let canonicalWardCount = 0;
  let blockedWardCount = 0;
  let reviewWardCount = 0;

  const populatedSubCounties =
    subCounties.filter(
      (subCounty) =>
        (wardsBySubCounty.get(subCounty.id) ?? [])
          .length > 0,
    );

  /*
   * ----------------------------------------------------------
   * EXPLICIT VERIFIED TIATY OVERRIDE
   * ----------------------------------------------------------
   */

  const TIATY_SOURCE_ID = 463;
  const TIATY_TARGET_ID = 757;

  for (const source of populatedSubCounties) {
    const county = counties.find(
      (record) => record.id === source.countyId,
    );

    if (!county) {
      continue;
    }

    const sourceWards =
      wardsBySubCounty.get(source.id) ?? [];

    const relations =
      await countRelations(source.id);

    /*
     * --------------------------------------------------------
     * SPECIAL CASE: TIATY 463 → 757
     * --------------------------------------------------------
     */

    if (source.id === TIATY_SOURCE_ID) {
      const target = subCounties.find(
        (record) => record.id === TIATY_TARGET_ID,
      );

      const gids = sourceWards
        .map((ward) => ward.sourceGid)
        .filter(
          (gid): gid is number =>
            gid !== null,
        )
        .sort((a, b) => a - b);

      const expectedGids = [
        781,
        782,
        783,
        784,
        785,
        786,
        787,
      ];

      const gidsCorrect =
        JSON.stringify(gids) ===
        JSON.stringify(expectedGids);

      const relationsZero =
        relations.farmers === 0 &&
        relations.farms === 0 &&
        relations.businessPartners === 0 &&
        relations.destinationTransactions === 0 &&
        relations.sourceTransactions === 0;

      const targetWardCount = target
        ? await prisma.ward.count({
            where: {
              subCountyId: target.id,
            },
          })
        : -1;

      const targetCorrect =
        target !== undefined &&
        target.countyId === 90 &&
        targetWardCount === 0;

      if (
        target &&
        gidsCorrect &&
        relationsZero &&
        targetCorrect &&
        sourceWards.length === 7
      ) {
        auditRecords.push({
          sourceSubCountyId: source.id,
          sourceSubCountyName: source.name,
          countyId: county.id,
          countyName: county.name,
          wardCount: sourceWards.length,
          authoritativeNames: [
            "Tiaty Sub County",
          ],
          currentMatchesAuthoritative: false,
          targetSubCountyId: target.id,
          targetSubCountyName: target.name,
          classification: "SAFE_LEGACY_MIGRATION",
          reason:
            "VERIFIED_TIATY_463_TO_757: authoritative GIDs 781-787 are Tiaty Sub County; canonical DB target is 757 Tiaty East; source has zero direct relations.",
          relations,
          wardIds: sourceWards.map(
            (ward) => ward.id,
          ),
          sourceGids: gids,
        });

        safeMigrations++;
        safeWardCount += sourceWards.length;

        continue;
      }

      auditRecords.push({
        sourceSubCountyId: source.id,
        sourceSubCountyName: source.name,
        countyId: county.id,
        countyName: county.name,
        wardCount: sourceWards.length,
        authoritativeNames: [
          "Tiaty Sub County",
        ],
        currentMatchesAuthoritative: false,
        targetSubCountyId: target?.id ?? null,
        targetSubCountyName: target?.name ?? null,
        classification: "MANUAL_REVIEW",
        reason:
          "TIATY_VERIFICATION_FAILED: source/target/ward identity/relations did not satisfy all safety conditions.",
        relations,
        wardIds: sourceWards.map(
          (ward) => ward.id,
        ),
        sourceGids: gids,
      });

      manualReview++;
      reviewWardCount += sourceWards.length;

      continue;
    }

    /*
     * --------------------------------------------------------
     * AUTHORITATIVE NAMES FOR THIS SOURCE SUBCOUNTY
     * --------------------------------------------------------
     */

    const authoritativeNames = new Set<string>();

    let allWardsHaveAuthoritativeIdentity =
      true;

    for (const ward of sourceWards) {
      if (ward.sourceGid === null) {
        allWardsHaveAuthoritativeIdentity = false;
        continue;
      }

      const authoritative =
        authoritativeByGid.get(
          ward.sourceGid,
        );

      if (!authoritative) {
        allWardsHaveAuthoritativeIdentity = false;
        continue;
      }

      if (authoritative.subCountyName) {
        authoritativeNames.add(
          authoritative.subCountyName,
        );
      }
    }

    const authoritativeNameList =
      Array.from(authoritativeNames).sort();

    /*
     * --------------------------------------------------------
     * CURRENT DB NAME VS AUTHORITATIVE NAME
     * --------------------------------------------------------
     */

    const currentMatchesAuthoritative =
      authoritativeNameList.length === 1 &&
      normalizeName(source.name) ===
        normalizeName(authoritativeNameList[0]);

    /*
     * --------------------------------------------------------
     * ALREADY CANONICAL
     * --------------------------------------------------------
     */

    if (
      allWardsHaveAuthoritativeIdentity &&
      currentMatchesAuthoritative
    ) {
      auditRecords.push({
        sourceSubCountyId: source.id,
        sourceSubCountyName: source.name,
        countyId: county.id,
        countyName: county.name,
        wardCount: sourceWards.length,
        authoritativeNames:
          authoritativeNameList,
        currentMatchesAuthoritative: true,
        targetSubCountyId: source.id,
        targetSubCountyName: source.name,
        classification:
          "ALREADY_CANONICAL_BY_AUTHORITATIVE_IDENTITY",
        reason:
          "Current populated SubCounty matches the authoritative ward SubCounty identity; do not migrate or delete.",
        relations,
        wardIds: sourceWards.map(
          (ward) => ward.id,
        ),
        sourceGids: sourceWards
          .map((ward) => ward.sourceGid)
          .filter(
            (gid): gid is number =>
              gid !== null,
          ),
      });

      alreadyCanonical++;
      canonicalWardCount += sourceWards.length;

      continue;
    }

    /*
     * --------------------------------------------------------
     * RESOLVE AUTHORITATIVE SUBCOUNTY
     * --------------------------------------------------------
     */

    if (
      !allWardsHaveAuthoritativeIdentity ||
      authoritativeNameList.length !== 1
    ) {
      auditRecords.push({
        sourceSubCountyId: source.id,
        sourceSubCountyName: source.name,
        countyId: county.id,
        countyName: county.name,
        wardCount: sourceWards.length,
        authoritativeNames:
          authoritativeNameList,
        currentMatchesAuthoritative: false,
        targetSubCountyId: null,
        targetSubCountyName: null,
        classification: "MANUAL_REVIEW",
        reason:
          "AUTHORITATIVE_WARD_IDENTITY_UNRESOLVED",
        relations,
        wardIds: sourceWards.map(
          (ward) => ward.id,
        ),
        sourceGids: sourceWards
          .map((ward) => ward.sourceGid)
          .filter(
            (gid): gid is number =>
              gid !== null,
          ),
      });

      manualReview++;
      reviewWardCount += sourceWards.length;

      continue;
    }

    const authoritativeSubCountyName =
      authoritativeNameList[0];

    const canonicalSource =
      findCanonicalSource(
        county.name,
        authoritativeSubCountyName,
        canonicalRecords,
      );

    if (!canonicalSource) {
      auditRecords.push({
        sourceSubCountyId: source.id,
        sourceSubCountyName: source.name,
        countyId: county.id,
        countyName: county.name,
        wardCount: sourceWards.length,
        authoritativeNames:
          authoritativeNameList,
        currentMatchesAuthoritative: false,
        targetSubCountyId: null,
        targetSubCountyName: null,
        classification: "MANUAL_REVIEW",
        reason:
          "AUTHORITATIVE_SUBCOUNTY_NOT_FOUND_IN_CANONICAL_SOURCE",
        relations,
        wardIds: sourceWards.map(
          (ward) => ward.id,
        ),
        sourceGids: sourceWards
          .map((ward) => ward.sourceGid)
          .filter(
            (gid): gid is number =>
              gid !== null,
          ),
      });

      manualReview++;
      reviewWardCount += sourceWards.length;

      continue;
    }

    const canonicalDb =
      canonicalDbBySource.get(
        `${canonicalSource.countyCode}::${normalizeName(
          canonicalSource.name,
        )}`,
      );

    if (!canonicalDb) {
      auditRecords.push({
        sourceSubCountyId: source.id,
        sourceSubCountyName: source.name,
        countyId: county.id,
        countyName: county.name,
        wardCount: sourceWards.length,
        authoritativeNames:
          authoritativeNameList,
        currentMatchesAuthoritative: false,
        targetSubCountyId: null,
        targetSubCountyName: null,
        classification: "MANUAL_REVIEW",
        reason:
          "CANONICAL_SOURCE_RESOLVED_BUT_CANONICAL_DB_TARGET_NOT_FOUND",
        relations,
        wardIds: sourceWards.map(
          (ward) => ward.id,
        ),
        sourceGids: sourceWards
          .map((ward) => ward.sourceGid)
          .filter(
            (gid): gid is number =>
              gid !== null,
          ),
      });

      manualReview++;
      reviewWardCount += sourceWards.length;

      continue;
    }

    const targetId = canonicalDb.dbId;

    if (targetId === source.id) {
      auditRecords.push({
        sourceSubCountyId: source.id,
        sourceSubCountyName: source.name,
        countyId: county.id,
        countyName: county.name,
        wardCount: sourceWards.length,
        authoritativeNames:
          authoritativeNameList,
        currentMatchesAuthoritative: true,
        targetSubCountyId: source.id,
        targetSubCountyName: source.name,
        classification:
          "ALREADY_CANONICAL_BY_CANONICAL_TARGET",
        reason:
          "Canonical resolution points back to the current populated SubCounty.",
        relations,
        wardIds: sourceWards.map(
          (ward) => ward.id,
        ),
        sourceGids: sourceWards
          .map((ward) => ward.sourceGid)
          .filter(
            (gid): gid is number =>
              gid !== null,
          ),
      });

      alreadyCanonical++;
      canonicalWardCount += sourceWards.length;

      continue;
    }

    /*
     * --------------------------------------------------------
     * RELATION BLOCK
     * --------------------------------------------------------
     */

    const hasDirectRelations =
      relations.farmers > 0 ||
      relations.farms > 0 ||
      relations.businessPartners > 0 ||
      relations.destinationTransactions > 0 ||
      relations.sourceTransactions > 0;

    if (hasDirectRelations) {
      auditRecords.push({
        sourceSubCountyId: source.id,
        sourceSubCountyName: source.name,
        countyId: county.id,
        countyName: county.name,
        wardCount: sourceWards.length,
        authoritativeNames:
          authoritativeNameList,
        currentMatchesAuthoritative: false,
        targetSubCountyId: targetId,
        targetSubCountyName: canonicalDb.dbName,
        classification: "BLOCKED_BY_RELATIONS",
        reason:
          "Canonical target is resolved, but direct dependent records exist and require controlled migration.",
        relations,
        wardIds: sourceWards.map(
          (ward) => ward.id,
        ),
        sourceGids: sourceWards
          .map((ward) => ward.sourceGid)
          .filter(
            (gid): gid is number =>
              gid !== null,
          ),
      });

      blocked++;
      blockedWardCount += sourceWards.length;

      continue;
    }

    /*
     * --------------------------------------------------------
     * SAFE LEGACY MIGRATION
     * --------------------------------------------------------
     */

    auditRecords.push({
      sourceSubCountyId: source.id,
      sourceSubCountyName: source.name,
      countyId: county.id,
      countyName: county.name,
      wardCount: sourceWards.length,
      authoritativeNames:
        authoritativeNameList,
      currentMatchesAuthoritative: false,
      targetSubCountyId: targetId,
      targetSubCountyName: canonicalDb.dbName,
      classification: "SAFE_LEGACY_MIGRATION",
      reason:
        "All wards resolve to one canonical target and the source SubCounty has no direct dependent records.",
      relations,
      wardIds: sourceWards.map(
        (ward) => ward.id,
      ),
      sourceGids: sourceWards
        .map((ward) => ward.sourceGid)
        .filter(
          (gid): gid is number =>
            gid !== null,
        ),
    });

    safeMigrations++;
    safeWardCount += sourceWards.length;

    /*
     * Detect simple name variants.
     */

    if (
      normalizeName(source.name) !==
      normalizeName(canonicalDb.dbName)
    ) {
      nameVariants++;
    }
  }

  /*
   * ----------------------------------------------------------
   * SUMMARY
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("V9 CONSOLIDATION SUMMARY");
  console.log("============================================================");
  console.log("");

  console.log(
    `Populated SubCounties:          ${populatedSubCounties.length}`,
  );
  console.log(
    `SAFE legacy migrations:         ${safeMigrations}`,
  );
  console.log(
    `Already canonical:              ${alreadyCanonical}`,
  );
  console.log(
    `Name variants:                  ${nameVariants}`,
  );
  console.log(
    `Blocked by relations:           ${blocked}`,
  );
  console.log(
    `Manual review:                  ${manualReview}`,
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
   * ----------------------------------------------------------
   * SAFE MIGRATIONS
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("SAFE LEGACY MIGRATIONS");
  console.log("============================================================");
  console.log("");

  const safeRecords = auditRecords.filter(
    (record) =>
      record.classification ===
      "SAFE_LEGACY_MIGRATION",
  );

  if (safeRecords.length === 0) {
    console.log("None.");
  } else {
    for (const record of safeRecords) {
      console.log(
        `${record.countyName} | ` +
          `${record.sourceSubCountyId} ${record.sourceSubCountyName} ` +
          `→ ${record.targetSubCountyId} ${record.targetSubCountyName} ` +
          `| wards=${record.wardCount}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * BLOCKED
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("BLOCKED BY DIRECT RELATIONS");
  console.log("============================================================");
  console.log("");

  const blockedRecords =
    auditRecords.filter(
      (record) =>
        record.classification ===
        "BLOCKED_BY_RELATIONS",
    );

  if (blockedRecords.length === 0) {
    console.log("None.");
  } else {
    for (const record of blockedRecords) {
      console.log(
        `${record.countyName} | ` +
          `${record.sourceSubCountyId} ${record.sourceSubCountyName} ` +
          `| wards=${record.wardCount} ` +
          `| farmers=${record.relations.farmers} ` +
          `| farms=${record.relations.farms} ` +
          `| businessPartners=${record.relations.businessPartners} ` +
          `| destinationTx=${record.relations.destinationTransactions} ` +
          `| sourceTx=${record.relations.sourceTransactions}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * MANUAL REVIEW
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("MANUAL REVIEW");
  console.log("============================================================");
  console.log("");

  const reviewRecords =
    auditRecords.filter(
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
          `${record.sourceSubCountyId} ${record.sourceSubCountyName} ` +
          `| wards=${record.wardCount} ` +
          `| ${record.reason}`,
      );

      if (
        record.authoritativeNames.length > 0
      ) {
        console.log(
          `  Authoritative: ${record.authoritativeNames.join(
            ", ",
          )}`,
        );
      }
    }
  }

  /*
   * ----------------------------------------------------------
   * FINAL SAFETY CHECK
   * ----------------------------------------------------------
   */

  const accountedWardIds =
    new Set<number>();

  const duplicateWardIds =
    new Set<number>();

  for (const record of auditRecords) {
    for (const wardId of record.wardIds) {
      if (accountedWardIds.has(wardId)) {
        duplicateWardIds.add(wardId);
      }

      accountedWardIds.add(wardId);
    }
  }

  const databaseWardIds =
    new Set(wards.map((ward) => ward.id));

  const missingWardIds =
    Array.from(databaseWardIds).filter(
      (id) => !accountedWardIds.has(id),
    );

  const extraWardIds =
    Array.from(accountedWardIds).filter(
      (id) => !databaseWardIds.has(id),
    );

  console.log("");
  console.log("============================================================");
  console.log("FINAL V9 SAFETY CHECK");
  console.log("============================================================");
  console.log("");

  console.log(
    `Database wards:               ${databaseWardIds.size}`,
  );
  console.log(
    `Accounted ward records:       ${accountedWardIds.size}`,
  );
  console.log(
    `Missing ward IDs:             ${missingWardIds.length}`,
  );
  console.log(
    `Extra ward IDs:               ${extraWardIds.length}`,
  );
  console.log(
    `Duplicate ward assignments:   ${duplicateWardIds.size}`,
  );
  console.log("");

  if (
    missingWardIds.length === 0 &&
    extraWardIds.length === 0 &&
    duplicateWardIds.size === 0 &&
    accountedWardIds.size === databaseWardIds.size
  ) {
    console.log(
      "PASS — every database ward is accounted for exactly once.",
    );
  } else {
    console.error(
      "FAIL — ward accounting is incomplete or duplicated.",
    );

    if (missingWardIds.length > 0) {
      console.error(
        `Missing ward IDs: ${missingWardIds.join(", ")}`,
      );
    }

    if (extraWardIds.length > 0) {
      console.error(
        `Extra ward IDs: ${extraWardIds.join(", ")}`,
      );
    }

    if (duplicateWardIds.size > 0) {
      console.error(
        `Duplicate ward IDs: ${Array.from(
          duplicateWardIds,
        ).join(", ")}`,
      );

      throw new Error(
        "V9 safety check failed.",
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * EXPORT JSON
   * ----------------------------------------------------------
   */

  const outputJsonPath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "subcounty-consolidation-v9.json",
  );

  const outputPayload = {
    generatedAt: new Date().toISOString(),
    readOnly: true,
    canonicalSubCounties:
      canonicalRecords.length,
    authoritativeWardFeatures:
      features.length,
    databaseCounties:
      counties.length,
    databaseSubCounties:
      subCounties.length,
    databaseWards:
      wards.length,
    summary: {
      populatedSubCounties:
        populatedSubCounties.length,
      safeMigrations,
      alreadyCanonical,
      nameVariants,
      blocked,
      manualReview,
      safeWardCount,
      canonicalWardCount,
      blockedWardCount,
      reviewWardCount,
    },
    records: auditRecords,
    safety: {
      databaseWardCount:
        databaseWardIds.size,
      accountedWardCount:
        accountedWardIds.size,
      missingWardIds,
      extraWardIds,
      duplicateWardIds:
        Array.from(duplicateWardIds),
      passed:
        missingWardIds.length === 0 &&
        extraWardIds.length === 0 &&
        duplicateWardIds.size === 0 &&
        accountedWardIds.size ===
          databaseWardIds.size,
    },
  };

  fs.writeFileSync(
    outputJsonPath,
    JSON.stringify(
      outputPayload,
      null,
      2,
    ),
    "utf8",
  );

  /*
   * ----------------------------------------------------------
   * EXPORT CSV
   * ----------------------------------------------------------
   */

  const outputCsvPath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "subcounty-consolidation-v9.csv",
  );

  const csvHeaders = [
    "sourceSubCountyId",
    "sourceSubCountyName",
    "countyId",
    "countyName",
    "wardCount",
    "authoritativeNames",
    "currentMatchesAuthoritative",
    "targetSubCountyId",
    "targetSubCountyName",
    "classification",
    "reason",
    "farmers",
    "farms",
    "businessPartners",
    "destinationTransactions",
    "sourceTransactions",
    "wardIds",
    "sourceGids",
  ];

  const csvEscape = (value: unknown): string => {
    const text = String(value ?? "");

    return `"${text.replace(/"/g, '""')}"`;
  };

  const csvLines = [
    csvHeaders.join(","),
  ];

  for (const record of auditRecords) {
    csvLines.push(
      [
        record.sourceSubCountyId,
        record.sourceSubCountyName,
        record.countyId,
        record.countyName,
        record.wardCount,
        record.authoritativeNames.join("; "),
        record.currentMatchesAuthoritative,
        record.targetSubCountyId ?? "",
        record.targetSubCountyName ?? "",
        record.classification,
        record.reason,
        record.relations.farmers,
        record.relations.farms,
        record.relations.businessPartners,
        record.relations.destinationTransactions,
        record.relations.sourceTransactions,
        record.wardIds.join(";"),
        record.sourceGids.join(";"),
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  fs.writeFileSync(
    outputCsvPath,
    csvLines.join("\n"),
    "utf8",
  );

  console.log("");
  console.log(
    `V9 JSON written to: ${outputJsonPath}`,
  );
  console.log(
    `V9 CSV written to: ${outputCsvPath}`,
  );

  console.log("");
  console.log("============================================================");
  console.log("V9 COMPLETE");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("V9 AUDIT FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });