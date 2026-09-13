import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

type GeoJsonFeature = {
  type?: string;
  properties?: {
    gid?: number | string;
    county?: string;
    subcounty?: string;
    ward?: string;
    uid?: string | number;
    scuid?: string | number;
    cuid?: string | number;
    [key: string]: unknown;
  };
  geometry?: unknown;
};

type GeoJsonCollection = {
  type?: string;
  features?: GeoJsonFeature[];
};

type DuplicateTarget = {
  countyName: string;
  countyId: number;
  identityName: string;
  normalizedIdentity: string;
  ids: number[];
};

type WardEvidence = {
  id: number;
  name: string;
  sourceGid: number | null;
  countyId: number;
  subCountyId: number | null;
  authoritative?: {
    gid: number;
    county: string | null;
    subcounty: string | null;
    ward: string | null;
    uid: string | number | null;
    scuid: string | number | null;
    cuid: string | number | null;
  } | null;
  countyMatchesAuthoritative: boolean | null;
  subCountyMatchesAuthoritative: boolean | null;
};

type RecordEvidence = {
  id: number;
  countyId: number;
  countyName: string;
  name: string;
  normalizedIdentity: string;

  wardCount: number;
  wardIds: number[];
  wardGids: number[];

  farmersCount: number;
  farmsCount: number;
  businessPartnersCount: number;
  commoditySourceCount: number;
  commodityDestinationCount: number;
  totalApplicationDependencies: number;

  wardEvidence: WardEvidence[];

  hasAnyDependencies: boolean;
  hasWards: boolean;
};

type PairResult = {
  countyId: number;
  countyName: string;
  identityName: string;
  normalizedIdentity: string;

  ids: number[];

  records: RecordEvidence[];

  sameCounty: boolean;
  sameNormalizedIdentity: boolean;

  totalWardCount: number;
  totalDependencyCount: number;

  duplicateType:
    | "EXACT_DUPLICATE_EMPTY_AND_POPULATED"
    | "EXACT_DUPLICATE_BOTH_POPULATED"
    | "EXACT_DUPLICATE_BOTH_EMPTY"
    | "SPLIT_IDENTITY"
    | "REVIEW_REQUIRED";

  recommendation:
    | "SAFE_TO_CONSOLIDATE"
    | "REVIEW"
    | "DO_NOT_TOUCH";

  confidence: "HIGH" | "MEDIUM" | "LOW";

  evidence: string[];

  safetyChecks: {
    idsExist: boolean;
    sameCounty: boolean;
    sameNormalizedIdentity: boolean;
    noApplicationDependencyConflict: boolean;
    authoritativeGidsUnique: boolean;
    authoritativeGidsMatchDatabase: boolean;
    wardCountyIntegrity: boolean;
    wardSubCountyIntegrity: boolean;
  };
};

type AuditReport = {
  audit: string;
  version: string;
  mode: "READ_ONLY";
  generatedAt: string;

  authoritativeSource: {
    file: string;
    featureCount: number;
    numericGidCount: number;
    uniqueGidCount: number;
  };

  databaseCounts: {
    counties: number;
    subCounties: number;
    wards: number;
    farmers: number;
    farms: number;
    businessPartners: number;
    commodityTransactions: number;
  };

  duplicateTargets: DuplicateTarget[];

  pairResults: PairResult[];

  totals: {
    duplicatePairs: number;
    safeToConsolidate: number;
    review: number;
    doNotTouch: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };

  globalSafety: {
    noWritesPerformed: true;
    duplicatePairsAudited: number;
    recordsAudited: number;
    wardsAudited: number;
    applicationDependenciesAudited: number;
  };

  finalStatus: "PASS" | "REVIEW_REQUIRED" | "FAIL";
};

const TARGETS: DuplicateTarget[] = [
  {
    countyName: "Nyeri",
    countyId: 0,
    identityName: "Mukurwe-ini",
    normalizedIdentity: "mukurweini",
    ids: [376, 1382],
  },
  {
    countyName: "Narok",
    countyId: 0,
    identityName: "Trans Mara West",
    normalizedIdentity: "transmarawest",
    ids: [411, 1475],
  },
  {
    countyName: "Narok",
    countyId: 0,
    identityName: "Trans Mara East",
    normalizedIdentity: "transmaraeast",
    ids: [515, 1474],
  },
];

function normalizeCounty(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeSubCounty(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/\bsub[\s-]*county\b/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeWard(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function escapeCsv(value: unknown): string {
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

function ensureDirectory(directory: string) {
  fs.mkdirSync(directory, {
    recursive: true,
  });
}

function readGeoJson(filePath: string): GeoJsonCollection {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Authoritative GeoJSON not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");

  const parsed = JSON.parse(raw) as GeoJsonCollection;

  if (!Array.isArray(parsed.features)) {
    throw new Error("Authoritative GeoJSON does not contain a features array.");
  }

  return parsed;
}

function toNumericGid(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }

  return null;
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("FINAL DATABASE INTEGRITY AUDIT V15.5");
  console.log("DUPLICATE SUBCOUNTY IDENTITY AUDIT");
  console.log("MODE: READ-ONLY");
  console.log("NO INSERT / UPDATE / DELETE");
  console.log("============================================================");
  console.log("");

  const dataDirectory = path.resolve("prisma/data");

  const geoJsonPath = path.resolve(
    "prisma/data/kenya-wards-1450.geojson",
  );

  const outputJsonPath = path.resolve(
    "prisma/data/final-database-integrity-audit-v15-5.json",
  );

  const outputCsvPath = path.resolve(
    "prisma/data/final-database-integrity-audit-v15-5.csv",
  );

  ensureDirectory(dataDirectory);

  try {
    /*
     * ----------------------------------------------------------
     * 1. LOAD AUTHORITATIVE GEOJSON
     * ----------------------------------------------------------
     */

    console.log("[1/10] Loading authoritative ward GeoJSON...");

    const geoJson = readGeoJson(geoJsonPath);

    const geoFeatures = geoJson.features;

    const authoritativeByGid = new Map<number, GeoJsonFeature>();

    let numericGidCount = 0;

    for (const feature of geoFeatures) {
      const gid = toNumericGid(feature.properties?.gid);

      if (gid === null) {
        continue;
      }

      numericGidCount++;

      if (authoritativeByGid.has(gid)) {
        throw new Error(
          `Duplicate authoritative GeoJSON GID detected: ${gid}`,
        );
      }

      authoritativeByGid.set(gid, feature);
    }

    console.log(`  GeoJSON features: ${geoFeatures.length}`);
    console.log(`  Numeric GIDs: ${numericGidCount}`);
    console.log(`  Unique GIDs: ${authoritativeByGid.size}`);

    if (geoFeatures.length !== 1450) {
      throw new Error(
        `Expected 1450 authoritative ward features, found ${geoFeatures.length}.`,
      );
    }

    if (authoritativeByGid.size !== 1450) {
      throw new Error(
        `Expected 1450 unique authoritative GIDs, found ${authoritativeByGid.size}.`,
      );
    }

    /*
     * ----------------------------------------------------------
     * 2. LOAD DATABASE BASELINE
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[2/10] Loading database baseline...");

    const [
      counties,
      subCounties,
      allWards,
      farmerCount,
      farmCount,
      businessPartnerCount,
      commodityTransactionCount,
    ] = await Promise.all([
      prisma.county.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          id: "asc",
        },
      }),

      prisma.subCounty.findMany({
        select: {
          id: true,
          name: true,
          countyId: true,
        },
        orderBy: {
          id: "asc",
        },
      }),

      prisma.ward.findMany({
        select: {
          id: true,
          name: true,
          sourceGid: true,
          countyId: true,
          subCountyId: true,
        },
        orderBy: {
          id: "asc",
        },
      }),

      prisma.farmer.count(),

      prisma.farm.count(),

      prisma.businessPartner.count(),

      prisma.commodityTransaction.count(),
    ]);

    console.log(`  Counties: ${counties.length}`);
    console.log(`  SubCounties: ${subCounties.length}`);
    console.log(`  Wards: ${allWards.length}`);
    console.log(`  Farmers: ${farmerCount}`);
    console.log(`  Farms: ${farmCount}`);
    console.log(`  BusinessPartners: ${businessPartnerCount}`);
    console.log(`  CommodityTransactions: ${commodityTransactionCount}`);

    /*
     * ----------------------------------------------------------
     * 3. RESOLVE TARGET COUNTY IDS
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[3/10] Resolving target counties...");

    const countyById = new Map<number, { id: number; name: string }>();

    for (const county of counties) {
      countyById.set(county.id, county);
    }

    const countyByNormalizedName = new Map<
      string,
      { id: number; name: string }[]
    >();

    for (const county of counties) {
      const key = normalizeCounty(county.name);

      const existing = countyByNormalizedName.get(key) ?? [];

      existing.push(county);

      countyByNormalizedName.set(key, existing);
    }

    for (const target of TARGETS) {
      const candidates =
        countyByNormalizedName.get(normalizeCounty(target.countyName)) ?? [];

      if (candidates.length !== 1) {
        throw new Error(
          `Could not uniquely resolve county ${target.countyName}. Candidates: ${JSON.stringify(
            candidates,
          )}`,
        );
      }

      target.countyId = candidates[0].id;

      console.log(
        `  ${target.countyName}: countyId=${target.countyId}`,
      );
    }

    /*
     * ----------------------------------------------------------
     * 4. VERIFY DUPLICATE TARGET RECORDS
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[4/10] Loading six duplicate SubCounty records...");

    const targetIds = TARGETS.flatMap((target) => target.ids);

    const targetSubCounties = subCounties.filter((subCounty) =>
      targetIds.includes(subCounty.id),
    );

    const targetSubCountyById = new Map(
      targetSubCounties.map((subCounty) => [
        subCounty.id,
        subCounty,
      ]),
    );

    for (const target of TARGETS) {
      console.log("");
      console.log(
        `  ${target.countyName} / ${target.identityName}`,
      );

      for (const id of target.ids) {
        const record = targetSubCountyById.get(id);

        if (!record) {
          throw new Error(
            `Expected SubCounty ID ${id} was not found in the database.`,
          );
        }

        console.log(
          `    ID ${record.id}: ${record.name} | countyId=${record.countyId}`,
        );
      }
    }

    /*
     * ----------------------------------------------------------
     * 5. BUILD WARD INDEX
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[5/10] Building Ward and authoritative indexes...");

    const wardsBySubCountyId = new Map<number, typeof allWards>();

    for (const ward of allWards) {
      if (ward.subCountyId === null) {
        continue;
      }

      const existing =
        wardsBySubCountyId.get(ward.subCountyId) ?? [];

      existing.push(ward);

      wardsBySubCountyId.set(ward.subCountyId, existing);
    }

    /*
     * ----------------------------------------------------------
     * 6. AUDIT APPLICATION DEPENDENCIES
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[6/10] Inspecting application dependencies...");

    const pairResults: PairResult[] = [];

    let totalRecordsAudited = 0;
    let totalWardsAudited = 0;
    let totalDependenciesAudited = 0;

    for (const target of TARGETS) {
      console.log("");
      console.log(
        `  Auditing ${target.countyName} / ${target.identityName}`,
      );

      const records: RecordEvidence[] = [];

      for (const id of target.ids) {
        const subCounty = targetSubCountyById.get(id);

        if (!subCounty) {
          throw new Error(
            `SubCounty ${id} disappeared during audit.`,
          );
        }

        const county = countyById.get(subCounty.countyId);

        if (!county) {
          throw new Error(
            `County ${subCounty.countyId} referenced by SubCounty ${id} does not exist.`,
          );
        }

        const wards =
          wardsBySubCountyId.get(id) ?? [];

        const [
          farmersCount,
          farmsCount,
          businessPartnersCount,
          commoditySourceCount,
          commodityDestinationCount,
        ] = await Promise.all([
          prisma.farmer.count({
            where: {
              subCountyId: id,
            },
          }),

          prisma.farm.count({
            where: {
              subCountyId: id,
            },
          }),

          prisma.businessPartner.count({
            where: {
              subCountyId: id,
            },
          }),

          prisma.commodityTransaction.count({
            where: {
              sourceSubCountyId: id,
            },
          }),

          prisma.commodityTransaction.count({
            where: {
              destinationSubCountyId: id,
            },
          }),
        ]);

        const wardEvidence: WardEvidence[] = wards.map((ward) => {
          let authoritative = null;

          if (ward.sourceGid !== null) {
            const feature =
              authoritativeByGid.get(ward.sourceGid);

            if (feature) {
              authoritative = {
                gid: ward.sourceGid,
                county:
                  typeof feature.properties?.county === "string"
                    ? feature.properties.county
                    : null,
                subcounty:
                  typeof feature.properties?.subcounty === "string"
                    ? feature.properties.subcounty
                    : null,
                ward:
                  typeof feature.properties?.ward === "string"
                    ? feature.properties.ward
                    : null,
                uid:
                  feature.properties?.uid ??
                  null,
                scuid:
                  feature.properties?.scuid ??
                  null,
                cuid:
                  feature.properties?.cuid ??
                  null,
              };
            }
          }

          const countyMatchesAuthoritative =
            authoritative === null
              ? null
              : normalizeCounty(authoritative.county) ===
                normalizeCounty(county.name);

          const subCountyMatchesAuthoritative =
            authoritative === null
              ? null
              : normalizeSubCounty(authoritative.subcounty) ===
                normalizeSubCounty(subCounty.name);

          return {
            id: ward.id,
            name: ward.name,
            sourceGid: ward.sourceGid,
            countyId: ward.countyId,
            subCountyId: ward.subCountyId,
            authoritative,
            countyMatchesAuthoritative,
            subCountyMatchesAuthoritative,
          };
        });

        const totalApplicationDependencies =
          farmersCount +
          farmsCount +
          businessPartnersCount +
          commoditySourceCount +
          commodityDestinationCount;

        const record: RecordEvidence = {
          id,
          countyId: subCounty.countyId,
          countyName: county.name,
          name: subCounty.name,
          normalizedIdentity: normalizeSubCounty(
            subCounty.name,
          ),

          wardCount: wards.length,

          wardIds: wards.map((ward) => ward.id),

          wardGids: wards
            .map((ward) => ward.sourceGid)
            .filter(
              (gid): gid is number => gid !== null,
            ),

          farmersCount,
          farmsCount,
          businessPartnersCount,
          commoditySourceCount,
          commodityDestinationCount,
          totalApplicationDependencies,

          wardEvidence,

          hasAnyDependencies:
            totalApplicationDependencies > 0,

          hasWards: wards.length > 0,
        };

        records.push(record);

        totalRecordsAudited++;
        totalWardsAudited += wards.length;
        totalDependenciesAudited +=
          totalApplicationDependencies;

        console.log(
          `    ID ${id}: wards=${wards.length}, farmers=${farmersCount}, farms=${farmsCount}, businessPartners=${businessPartnersCount}, commoditySource=${commoditySourceCount}, commodityDestination=${commodityDestinationCount}`,
        );
      }

      /*
       * --------------------------------------------------------
       * PAIR-LEVEL EVALUATION
       * --------------------------------------------------------
       */

      const idsExist =
        records.length === target.ids.length &&
        target.ids.every((id) =>
          records.some((record) => record.id === id),
        );

      const sameCounty =
        records.length === 2 &&
        records.every(
          (record) => record.countyId === target.countyId,
        );

      const sameNormalizedIdentity =
        records.length === 2 &&
        new Set(
          records.map((record) => record.normalizedIdentity),
        ).size === 1;

      const allWardGids = records.flatMap(
        (record) => record.wardGids,
      );

      const uniqueWardGids = new Set(allWardGids);

      const authoritativeGidsUnique =
        uniqueWardGids.size === allWardGids.length;

      const authoritativeGidsMatchDatabase =
        records.every((record) =>
          record.wardEvidence.every(
            (ward) =>
              ward.sourceGid !== null &&
              ward.authoritative !== null,
          ),
        );

      const wardCountyIntegrity =
        records.every((record) =>
          record.wardEvidence.every(
            (ward) =>
              ward.countyId === record.countyId,
          ),
        );

      const wardSubCountyIntegrity =
        records.every((record) =>
          record.wardEvidence.every(
            (ward) =>
              ward.subCountyId === record.id,
          ),
        );

      const totalWardCount = records.reduce(
        (sum, record) => sum + record.wardCount,
        0,
      );

      const totalDependencyCount = records.reduce(
        (sum, record) =>
          sum + record.totalApplicationDependencies,
        0,
      );

      const populatedRecords = records.filter(
        (record) =>
          record.wardCount > 0 ||
          record.totalApplicationDependencies > 0,
      );

      const emptyRecords = records.filter(
        (record) =>
          record.wardCount === 0 &&
          record.totalApplicationDependencies === 0,
      );

      const sameAuthoritativeIdentity =
        records.length === 2 &&
        records.every((record) =>
          record.wardEvidence.every((ward) => {
            if (!ward.authoritative) {
              return false;
            }

            return (
              normalizeCounty(
                ward.authoritative.county,
              ) === normalizeCounty(record.countyName) &&
              normalizeSubCounty(
                ward.authoritative.subcounty,
              ) === record.normalizedIdentity
            );
          }),
        );

      const noApplicationDependencyConflict =
        totalDependencyCount === 0 ||
        populatedRecords.length <= 1;

      const evidence: string[] = [];

      if (sameCounty) {
        evidence.push(
          "Both records belong to the same county.",
        );
      } else {
        evidence.push(
          "The records do not belong to the same county.",
        );
      }

      if (sameNormalizedIdentity) {
        evidence.push(
          "Both records have the same normalized SubCounty identity.",
        );
      } else {
        evidence.push(
          "The records have different normalized identities.",
        );
      }

      if (authoritativeGidsUnique) {
        evidence.push(
          "Ward sourceGIDs are unique across the duplicate pair.",
        );
      } else {
        evidence.push(
          "Ward sourceGIDs overlap between the duplicate records.",
        );
      }

      if (authoritativeGidsMatchDatabase) {
        evidence.push(
          "Every audited Ward sourceGID resolves to an authoritative GeoJSON feature.",
        );
      } else {
        evidence.push(
          "At least one audited Ward sourceGID does not resolve to the authoritative GeoJSON.",
        );
      }

      if (wardCountyIntegrity) {
        evidence.push(
          "All audited wards have the same county as their SubCounty.",
        );
      } else {
        evidence.push(
          "At least one audited ward has a county/SubCounty inconsistency.",
        );
      }

      if (wardSubCountyIntegrity) {
        evidence.push(
          "All audited wards point to their expected SubCounty ID.",
        );
      } else {
        evidence.push(
          "At least one audited ward has an unexpected SubCounty reference.",
        );
      }

      if (emptyRecords.length === 1 && populatedRecords.length === 1) {
        evidence.push(
          "Exactly one duplicate record is empty and the other contains the active data.",
        );
      } else if (
        emptyRecords.length === 2
      ) {
        evidence.push(
          "Both duplicate records are empty.",
        );
      } else if (
        populatedRecords.length === 2
      ) {
        evidence.push(
          "Both duplicate records contain data and therefore require dependency-level review.",
        );
      }

      let duplicateType:
        | "EXACT_DUPLICATE_EMPTY_AND_POPULATED"
        | "EXACT_DUPLICATE_BOTH_POPULATED"
        | "EXACT_DUPLICATE_BOTH_EMPTY"
        | "SPLIT_IDENTITY"
        | "REVIEW_REQUIRED";

      let recommendation:
        | "SAFE_TO_CONSOLIDATE"
        | "REVIEW"
        | "DO_NOT_TOUCH";

      let confidence:
        | "HIGH"
        | "MEDIUM"
        | "LOW";

      if (
        !idsExist ||
        !sameCounty ||
        !sameNormalizedIdentity
      ) {
        duplicateType = "REVIEW_REQUIRED";
        recommendation = "DO_NOT_TOUCH";
        confidence = "HIGH";

        evidence.push(
          "The basic duplicate-identity invariants failed.",
        );
      } else if (
        !authoritativeGidsUnique ||
        !authoritativeGidsMatchDatabase ||
        !wardCountyIntegrity ||
        !wardSubCountyIntegrity
      ) {
        duplicateType = "REVIEW_REQUIRED";
        recommendation = "DO_NOT_TOUCH";
        confidence = "HIGH";

        evidence.push(
          "A structural or relational integrity invariant failed.",
        );
      } else if (
        populatedRecords.length === 2
      ) {
        duplicateType =
          "EXACT_DUPLICATE_BOTH_POPULATED";

        recommendation = "REVIEW";
        confidence = "HIGH";

        evidence.push(
          "Both records contain active data. Automatic consolidation is not authorized by V15.5.",
        );
      } else if (
        emptyRecords.length === 2
      ) {
        duplicateType =
          "EXACT_DUPLICATE_BOTH_EMPTY";

        recommendation = "REVIEW";
        confidence = "MEDIUM";

        evidence.push(
          "Both records are empty. Deletion/consolidation still requires a separate explicit migration gate.",
        );
      } else if (
        emptyRecords.length === 1 &&
        populatedRecords.length === 1 &&
        noApplicationDependencyConflict
      ) {
        duplicateType =
          "EXACT_DUPLICATE_EMPTY_AND_POPULATED";

        recommendation = "SAFE_TO_CONSOLIDATE";
        confidence = "HIGH";

        evidence.push(
          "One record is empty and one record contains the active data.",
        );

        evidence.push(
          "No application dependency conflict exists.",
        );
      } else {
        duplicateType = "SPLIT_IDENTITY";
        recommendation = "REVIEW";
        confidence = "MEDIUM";

        evidence.push(
          "Data is split across the duplicate records.",
        );
      }

      /*
       * --------------------------------------------------------
       * FINAL PAIR RESULT
       * --------------------------------------------------------
       */

      pairResults.push({
        countyId: target.countyId,
        countyName: target.countyName,
        identityName: target.identityName,
        normalizedIdentity: target.normalizedIdentity,

        ids: target.ids,

        records,

        sameCounty,
        sameNormalizedIdentity,

        totalWardCount,
        totalDependencyCount,

        duplicateType,

        recommendation,

        confidence,

        evidence,

        safetyChecks: {
          idsExist,
          sameCounty,
          sameNormalizedIdentity,
          noApplicationDependencyConflict,
          authoritativeGidsUnique,
          authoritativeGidsMatchDatabase,
          wardCountyIntegrity,
          wardSubCountyIntegrity,
        },
      });
    }

    /*
     * ----------------------------------------------------------
     * 7. PRINT DETAILED PAIR RESULTS
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[7/10] Evaluating duplicate identities...");

    for (const result of pairResults) {
      console.log("");
      console.log("------------------------------------------------------------");
      console.log(
        `${result.countyName} / ${result.identityName}`,
      );
      console.log(
        `IDs: ${result.ids.join(" / ")}`,
      );
      console.log(
        `Normalized identity: ${result.normalizedIdentity}`,
      );
      console.log(
        `Wards: ${result.totalWardCount}`,
      );
      console.log(
        `Application dependencies: ${result.totalDependencyCount}`,
      );
      console.log(
        `Duplicate type: ${result.duplicateType}`,
      );
      console.log(
        `Recommendation: ${result.recommendation}`,
      );
      console.log(
        `Confidence: ${result.confidence}`,
      );

      console.log("");
      console.log("  Records:");

      for (const record of result.records) {
        console.log(
          `    ID ${record.id} | ${record.name} | wards=${record.wardCount} | farmers=${record.farmersCount} | farms=${record.farmsCount} | businessPartners=${record.businessPartnersCount} | commoditySource=${record.commoditySourceCount} | commodityDestination=${record.commodityDestinationCount}`,
        );

        if (record.wardGids.length > 0) {
          console.log(
            `      GIDs: ${record.wardGids.join(", ")}`,
          );
        } else {
          console.log(
            "      GIDs: NONE",
          );
        }
      }

      console.log("");
      console.log("  Evidence:");

      for (const item of result.evidence) {
        console.log(`    - ${item}`);
      }
    }

    /*
     * ----------------------------------------------------------
     * 8. GLOBAL SAFETY CHECKS
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[8/10] Validating V15.5 safety invariants...");

    const allAuditedWardGids = pairResults.flatMap(
      (result) =>
        result.records.flatMap(
          (record) => record.wardGids,
        ),
    );

    const uniqueAuditedWardGids = new Set(
      allAuditedWardGids,
    );

    const duplicateWardGids =
      uniqueAuditedWardGids.size !==
      allAuditedWardGids.length;

    const structuralFailureCount =
      pairResults.filter(
        (result) =>
          !result.safetyChecks.idsExist ||
          !result.safetyChecks.sameCounty ||
          !result.safetyChecks.sameNormalizedIdentity ||
          !result.safetyChecks.authoritativeGidsUnique ||
          !result.safetyChecks.authoritativeGidsMatchDatabase ||
          !result.safetyChecks.wardCountyIntegrity ||
          !result.safetyChecks.wardSubCountyIntegrity,
      ).length;

    console.log(
      `  Duplicate Ward GIDs inside audited pairs: ${
        duplicateWardGids ? "FAIL" : "PASS"
      }`,
    );

    console.log(
      `  Structural safety failures: ${structuralFailureCount}`,
    );

    /*
     * ----------------------------------------------------------
     * 9. BUILD SUMMARY
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[9/10] Building audit report...");

    const safeToConsolidate = pairResults.filter(
      (result) =>
        result.recommendation ===
        "SAFE_TO_CONSOLIDATE",
    ).length;

    const review = pairResults.filter(
      (result) =>
        result.recommendation === "REVIEW",
    ).length;

    const doNotTouch = pairResults.filter(
      (result) =>
        result.recommendation === "DO_NOT_TOUCH",
    ).length;

    const highConfidence = pairResults.filter(
      (result) =>
        result.confidence === "HIGH",
    ).length;

    const mediumConfidence = pairResults.filter(
      (result) =>
        result.confidence === "MEDIUM",
    ).length;

    const lowConfidence = pairResults.filter(
      (result) =>
        result.confidence === "LOW",
    ).length;

    let finalStatus:
      | "PASS"
      | "REVIEW_REQUIRED"
      | "FAIL";

    if (
      structuralFailureCount > 0 ||
      duplicateWardGids
    ) {
      finalStatus = "FAIL";
    } else if (
      review > 0 ||
      doNotTouch > 0
    ) {
      finalStatus = "REVIEW_REQUIRED";
    } else {
      finalStatus = "PASS";
    }

    const report: AuditReport = {
      audit:
        "Final Database Integrity Audit V15.5 - Duplicate SubCounty Identity Audit",

      version: "V15.5",

      mode: "READ_ONLY",

      generatedAt: new Date().toISOString(),

      authoritativeSource: {
        file: geoJsonPath,
        featureCount: geoFeatures.length,
        numericGidCount,
        uniqueGidCount:
          authoritativeByGid.size,
      },

      databaseCounts: {
        counties: counties.length,
        subCounties: subCounties.length,
        wards: allWards.length,
        farmers: farmerCount,
        farms: farmCount,
        businessPartners:
          businessPartnerCount,
        commodityTransactions:
          commodityTransactionCount,
      },

      duplicateTargets: TARGETS,

      pairResults,

      totals: {
        duplicatePairs:
          pairResults.length,

        safeToConsolidate,

        review,

        doNotTouch,

        highConfidence,

        mediumConfidence,

        lowConfidence,
      },

      globalSafety: {
        noWritesPerformed: true,
        duplicatePairsAudited:
          pairResults.length,
        recordsAudited:
          totalRecordsAudited,
        wardsAudited:
          totalWardsAudited,
        applicationDependenciesAudited:
          totalDependenciesAudited,
      },

      finalStatus,
    };

    /*
     * ----------------------------------------------------------
     * 10. WRITE REPORTS
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("[10/10] Writing V15.5 diagnostic reports...");

    fs.writeFileSync(
      outputJsonPath,
      JSON.stringify(report, null, 2),
      "utf8",
    );

    const csvRows: string[] = [];

    csvRows.push(
      [
        "county",
        "countyId",
        "identity",
        "normalizedIdentity",
        "subCountyId",
        "subCountyName",
        "wardCount",
        "wardIds",
        "wardGids",
        "farmers",
        "farms",
        "businessPartners",
        "commoditySource",
        "commodityDestination",
        "totalDependencies",
        "duplicateType",
        "recommendation",
        "confidence",
        "idsExist",
        "sameCounty",
        "sameNormalizedIdentity",
        "noApplicationDependencyConflict",
        "authoritativeGidsUnique",
        "authoritativeGidsMatchDatabase",
        "wardCountyIntegrity",
        "wardSubCountyIntegrity",
      ].join(","),
    );

    for (const result of pairResults) {
      for (const record of result.records) {
        csvRows.push(
          [
            result.countyName,
            result.countyId,
            result.identityName,
            result.normalizedIdentity,
            record.id,
            record.name,
            record.wardCount,
            record.wardIds.join(";"),
            record.wardGids.join(";"),
            record.farmersCount,
            record.farmsCount,
            record.businessPartnersCount,
            record.commoditySourceCount,
            record.commodityDestinationCount,
            record.totalApplicationDependencies,
            result.duplicateType,
            result.recommendation,
            result.confidence,
            result.safetyChecks.idsExist,
            result.safetyChecks.sameCounty,
            result.safetyChecks.sameNormalizedIdentity,
            result.safetyChecks
              .noApplicationDependencyConflict,
            result.safetyChecks
              .authoritativeGidsUnique,
            result.safetyChecks
              .authoritativeGidsMatchDatabase,
            result.safetyChecks
              .wardCountyIntegrity,
            result.safetyChecks
              .wardSubCountyIntegrity,
          ]
            .map(escapeCsv)
            .join(","),
        );
      }
    }

    fs.writeFileSync(
      outputCsvPath,
      csvRows.join("\n"),
      "utf8",
    );

    /*
     * ----------------------------------------------------------
     * FINAL TERMINAL SUMMARY
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("============================================================");
    console.log("FINAL V15.5 RESULT");
    console.log("============================================================");

    console.log(`STATUS: ${finalStatus}`);

    console.log("");
    console.log(`Duplicate pairs audited: ${pairResults.length}`);
    console.log(
      `SubCounty records audited: ${totalRecordsAudited}`,
    );
    console.log(
      `Wards audited: ${totalWardsAudited}`,
    );
    console.log(
      `Application dependencies audited: ${totalDependenciesAudited}`,
    );

    console.log("");
    console.log(
      `SAFE_TO_CONSOLIDATE: ${safeToConsolidate}`,
    );

    console.log(
      `REVIEW: ${review}`,
    );

    console.log(
      `DO_NOT_TOUCH: ${doNotTouch}`,
    );

    console.log("");
    console.log(
      `HIGH confidence: ${highConfidence}`,
    );

    console.log(
      `MEDIUM confidence: ${mediumConfidence}`,
    );

    console.log(
      `LOW confidence: ${lowConfidence}`,
    );

    console.log("");
    console.log(
      `Audited Ward GIDs unique: ${
        duplicateWardGids ? "FAIL" : "PASS"
      }`,
    );

    console.log(
      `Structural safety failures: ${structuralFailureCount}`,
    );

    console.log("");
    console.log("PAIR RECOMMENDATIONS:");

    for (const result of pairResults) {
      console.log(
        `  ${result.countyName} / ${result.identityName}: ${result.recommendation} (${result.confidence})`,
      );
    }

    console.log("");
    console.log("JSON:");
    console.log(outputJsonPath);

    console.log("");
    console.log("CSV:");
    console.log(outputCsvPath);

    console.log("");

    if (finalStatus === "PASS") {
      console.log(
        "V15.5 FOUND NO DUPLICATE-IDENTITY SAFETY BLOCKERS.",
      );

      console.log(
        "Any subsequent consolidation must still use a separate explicit migration script.",
      );
    } else if (finalStatus === "REVIEW_REQUIRED") {
      console.log(
        "V15.5 REQUIRES REVIEW.",
      );

      console.log(
        "This audit does NOT authorize database repair.",
      );

      console.log(
        "Use the pair-level evidence before creating a consolidation migration.",
      );
    } else {
      console.log(
        "V15.5 FAILED A STRUCTURAL SAFETY INVARIANT.",
      );

      console.log(
        "DO NOT perform duplicate consolidation.",
      );
    }

    console.log("");
    console.log("============================================================");
    console.log("V15.5 COMPLETE");
    console.log("READ-ONLY AUDIT - NO DATABASE WRITES");
    console.log("============================================================");
    console.log("");

    /*
     * Exit semantics:
     *
     * 0 = audit completed; review may still be required.
     * 1 = unexpected runtime/audit failure.
     *
     * We deliberately DO NOT use process.exit(1) merely because
     * the audit status is REVIEW_REQUIRED. REVIEW_REQUIRED is
     * an analytical result, not a script execution failure.
     */
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("");
  console.error("============================================================");
  console.error("V15.5 AUDIT FAILED TO COMPLETE");
  console.error("============================================================");
  console.error("");

  console.error(
    error instanceof Error
      ? error.message
      : error,
  );

  console.error("");

  process.exitCode = 1;
});