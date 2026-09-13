import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type FeatureProperties = {
  gid?: unknown;
  county?: unknown;
  subcounty?: unknown;
  ward?: unknown;
  uid?: unknown;
  scuid?: unknown;
  cuid?: unknown;
};

type GeoFeature = {
  type?: string;
  properties?: FeatureProperties;
};

type GeoJSONCollection = {
  type?: string;
  features?: GeoFeature[];
};

type AuditStatus =
  | "EXACT_MATCH"
  | "AMBIGUOUS"
  | "UNRESOLVED"
  | "SOURCE_DB_CONTRADICTION"
  | "EVALUATOR_INCONSISTENCY"
  | "KNOWN_SEMANTIC_EXCEPTION";

type AuditRecord = {
  gid: number;
  authoritativeCounty: string;
  authoritativeSubCounty: string;
  authoritativeWard: string;

  normalizedCounty: string;
  normalizedSubCounty: string;

  actualWardId: number | null;
  actualCountyId: number | null;
  actualCountyName: string | null;
  actualSubCountyId: number | null;
  actualSubCountyName: string | null;

  candidateCountyIds: number[];
  candidateSubCountyIds: number[];
  candidateSubCountyNames: string[];

  status: AuditStatus;
  reason: string;
};

type ErrorRecord = {
  category: string;
  severity: "ERROR" | "WARNING";
  gid?: number;
  details: string;
};

type DeletedIdsResult = {
  ids: number[];
  source: string;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Check your .env/.env.local configuration."
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const ROOT = process.cwd();

const GEOJSON_PATH = path.join(
  ROOT,
  "prisma",
  "data",
  "kenya-wards-1450.geojson"
);

const OUTPUT_JSON = path.join(
  ROOT,
  "prisma",
  "data",
  "final-database-integrity-audit-v15-4.json"
);

const OUTPUT_CSV = path.join(
  ROOT,
  "prisma",
  "data",
  "final-database-integrity-audit-v15-4.csv"
);

const V15_DELETION_LOG = path.join(
  ROOT,
  "prisma",
  "data",
  "deletion-log-v15.json"
);

function normalizeCounty(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeSubCounty(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/sub[\s-]*county/gi, "")
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeWard(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function asNumber(value: unknown): number | null {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return null;
  }

  return n;
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");

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

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function pushMapValue(
  map: Map<string, number[]>,
  key: string,
  value: number
): void {
  const existing = map.get(key) ?? [];

  if (!existing.includes(value)) {
    existing.push(value);
  }

  map.set(key, existing);
}

function readJsonFile<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

/**
 * V15 deletion log parsing.
 *
 * V15.3 expected either:
 *   { deletedIds: [...] }
 * or:
 *   { results: [...] }
 *
 * This implementation is intentionally defensive because the actual
 * V15 log structure may contain nested arrays/objects.
 */
function extractNumericIds(value: unknown): number[] {
  const found: number[] = [];

  function walk(node: unknown): void {
    if (node === null || node === undefined) {
      return;
    }

    if (typeof node === "number" && Number.isInteger(node)) {
      found.push(node);
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }

    if (typeof node === "object") {
      const object = node as Record<string, unknown>;

      for (const [key, child] of Object.entries(object)) {
        const normalizedKey = key.toLowerCase();

        if (
          normalizedKey.includes("id") &&
          typeof child === "number" &&
          Number.isInteger(child)
        ) {
          found.push(child);
          continue;
        }

        if (
          normalizedKey.includes("ids") &&
          Array.isArray(child)
        ) {
          walk(child);
          continue;
        }

        if (
          normalizedKey === "deleted" ||
          normalizedKey === "deletedids" ||
          normalizedKey === "deletedsubcountyids" ||
          normalizedKey === "oldids"
        ) {
          walk(child);
          continue;
        }

        if (normalizedKey === "results") {
          walk(child);
          continue;
        }
      }
    }
  }

  walk(value);

  return uniqueNumbers(found);
}

function loadV15DeletedIds(): DeletedIdsResult {
  if (!fs.existsSync(V15_DELETION_LOG)) {
    return {
      ids: [],
      source: "LOG_NOT_FOUND",
    };
  }

  try {
    const json = readJsonFile<unknown>(V15_DELETION_LOG);
    const ids = extractNumericIds(json);

    /*
     * The recursive parser can encounter unrelated IDs in a rich audit
     * structure. Therefore, prefer explicit known structures first.
     */
    if (
      json &&
      typeof json === "object" &&
      !Array.isArray(json)
    ) {
      const object = json as Record<string, unknown>;

      const preferredKeys = [
        "deletedIds",
        "deletedSubCountyIds",
        "oldIds",
      ];

      for (const key of preferredKeys) {
        if (Array.isArray(object[key])) {
          const preferred = uniqueNumbers(
            (object[key] as unknown[])
              .map(asNumber)
              .filter((x): x is number => x !== null)
          );

          if (preferred.length > 0) {
            return {
              ids: preferred,
              source: `EXPLICIT_${key}`,
            };
          }
        }
      }
    }

    return {
      ids,
      source: "RECURSIVE_LOG_SCAN",
    };
  } catch (error) {
    return {
      ids: [],
      source: `LOG_PARSE_ERROR: ${String(error)}`,
    };
  }
}

function assertRecordInvariant(
  record: AuditRecord
): ErrorRecord | null {
  const candidateCount = record.candidateSubCountyIds.length;

  if (record.status === "EXACT_MATCH" && candidateCount !== 1) {
    return {
      category: "EVALUATOR_INCONSISTENCY",
      severity: "ERROR",
      gid: record.gid,
      details:
        `EXACT_MATCH requires exactly one candidate SubCounty but found ${candidateCount}.`,
    };
  }

  if (record.status === "AMBIGUOUS" && candidateCount < 2) {
    return {
      category: "EVALUATOR_INCONSISTENCY",
      severity: "ERROR",
      gid: record.gid,
      details:
        `AMBIGUOUS requires at least two candidate SubCounty IDs but found ${candidateCount}.`,
    };
  }

  if (
    record.status === "UNRESOLVED" &&
    candidateCount !== 0
  ) {
    return {
      category: "EVALUATOR_INCONSISTENCY",
      severity: "ERROR",
      gid: record.gid,
      details:
        `UNRESOLVED requires zero candidate SubCounty IDs but found ${candidateCount}.`,
    };
  }

  if (
    record.actualWardId === null &&
    record.status !== "EVALUATOR_INCONSISTENCY"
  ) {
    return {
      category: "EVALUATOR_INCONSISTENCY",
      severity: "ERROR",
      gid: record.gid,
      details:
        "Every authoritative GID passed structural validation but has no matching database Ward.",
    };
  }

  return null;
}

async function main(): Promise<void> {
  console.log("");
  console.log("============================================================");
  console.log("FINAL DATABASE INTEGRITY AUDIT V15.4");
  console.log("============================================================");
  console.log("MODE: READ-ONLY");
  console.log("NO INSERT / UPDATE / DELETE");
  console.log("");
  console.log(
    "V15.4 changes the evaluator from single-value identity resolution"
  );
  console.log(
    "to candidate-preserving identity resolution."
  );
  console.log("");

  const errors: ErrorRecord[] = [];
  const warnings: ErrorRecord[] = [];
  const records: AuditRecord[] = [];

  try {
    // ------------------------------------------------------------
    // 1. Load authoritative GeoJSON
    // ------------------------------------------------------------

    console.log("[1/12] Loading authoritative ward GeoJSON...");

    const geojson =
      readJsonFile<GeoJSONCollection>(GEOJSON_PATH);

    const features = Array.isArray(geojson.features)
      ? geojson.features
      : [];

    const numericGids: number[] = [];

    for (const feature of features) {
      const gid = asNumber(feature.properties?.gid);

      if (gid !== null) {
        numericGids.push(gid);
      }
    }

    const uniqueGids = uniqueNumbers(numericGids);

    console.log(`  GeoJSON features: ${features.length}`);
    console.log(`  Numeric GIDs: ${numericGids.length}`);
    console.log(`  Unique GIDs: ${uniqueGids.length}`);

    if (features.length !== 1450) {
      errors.push({
        category: "GEOJSON_FEATURE_COUNT",
        severity: "ERROR",
        details:
          `Expected 1450 authoritative features but found ${features.length}.`,
      });
    }

    if (numericGids.length !== features.length) {
      errors.push({
        category: "GEOJSON_GID",
        severity: "ERROR",
        details:
          `${features.length - numericGids.length} GeoJSON features do not have numeric GIDs.`,
      });
    }

    if (uniqueGids.length !== numericGids.length) {
      errors.push({
        category: "GEOJSON_GID_DUPLICATE",
        severity: "ERROR",
        details:
          `${numericGids.length - uniqueGids.length} duplicate GeoJSON GIDs detected.`,
      });
    }

    // ------------------------------------------------------------
    // 2. Load database
    // ------------------------------------------------------------

    console.log("");
    console.log("[2/12] Loading database geography...");

    const counties = await prisma.county.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    const subCounties = await prisma.subCounty.findMany({
      select: {
        id: true,
        name: true,
        countyId: true,
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
        countyId: true,
        subCountyId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log(`  Counties: ${counties.length}`);
    console.log(`  SubCounties: ${subCounties.length}`);
    console.log(`  Wards: ${wards.length}`);

    // ------------------------------------------------------------
    // 3. Application FK validation
    // ------------------------------------------------------------

    console.log("");
    console.log("[3/12] Loading application SubCounty references...");

    const farmers = await prisma.farmer.findMany({
      select: {
        id: true,
        subCountyId: true,
      },
    });

    const farms = await prisma.farm.findMany({
      select: {
        id: true,
        subCountyId: true,
      },
    });

    const businessPartners =
      await prisma.businessPartner.findMany({
        select: {
          id: true,
          subCountyId: true,
        },
      });

    const commodityTransactions =
      await prisma.commodityTransaction.findMany({
        select: {
          id: true,
          sourceSubCountyId: true,
          destinationSubCountyId: true,
        },
      });

    const subCountyIdSet = new Set(
      subCounties.map((row) => row.id)
    );

    const invalidFarmerFKs = farmers.filter(
      (row) =>
        row.subCountyId !== null &&
        !subCountyIdSet.has(row.subCountyId)
    );

    const invalidFarmFKs = farms.filter(
      (row) =>
        row.subCountyId !== null &&
        !subCountyIdSet.has(row.subCountyId)
    );

    const invalidBusinessPartnerFKs =
      businessPartners.filter(
        (row) =>
          row.subCountyId !== null &&
          !subCountyIdSet.has(row.subCountyId)
      );

    const invalidCommoditySourceFKs =
      commodityTransactions.filter(
        (row) =>
          row.sourceSubCountyId !== null &&
          !subCountyIdSet.has(row.sourceSubCountyId)
      );

    const invalidCommodityDestinationFKs =
      commodityTransactions.filter(
        (row) =>
          row.destinationSubCountyId !== null &&
          !subCountyIdSet.has(row.destinationSubCountyId)
      );

    console.log(`  Farmers: ${farmers.length}`);
    console.log(`  Farms: ${farms.length}`);
    console.log(
      `  BusinessPartners: ${businessPartners.length}`
    );
    console.log(
      `  CommodityTransactions: ${commodityTransactions.length}`
    );

    console.log(
      `  Invalid Farmer FKs: ${invalidFarmerFKs.length}`
    );
    console.log(
      `  Invalid Farm FKs: ${invalidFarmFKs.length}`
    );
    console.log(
      `  Invalid BusinessPartner FKs: ${invalidBusinessPartnerFKs.length}`
    );
    console.log(
      `  Invalid Commodity source FKs: ${invalidCommoditySourceFKs.length}`
    );
    console.log(
      `  Invalid Commodity destination FKs: ${invalidCommodityDestinationFKs.length}`
    );

    if (invalidFarmerFKs.length > 0) {
      errors.push({
        category: "FARMER_SUBCOUNTY_FK",
        severity: "ERROR",
        details:
          `${invalidFarmerFKs.length} Farmer records reference missing SubCounty IDs.`,
      });
    }

    if (invalidFarmFKs.length > 0) {
      errors.push({
        category: "FARM_SUBCOUNTY_FK",
        severity: "ERROR",
        details:
          `${invalidFarmFKs.length} Farm records reference missing SubCounty IDs.`,
      });
    }

    if (invalidBusinessPartnerFKs.length > 0) {
      errors.push({
        category: "BUSINESS_PARTNER_SUBCOUNTY_FK",
        severity: "ERROR",
        details:
          `${invalidBusinessPartnerFKs.length} BusinessPartner records reference missing SubCounty IDs.`,
      });
    }

    if (invalidCommoditySourceFKs.length > 0) {
      errors.push({
        category: "COMMODITY_SOURCE_SUBCOUNTY_FK",
        severity: "ERROR",
        details:
          `${invalidCommoditySourceFKs.length} CommodityTransaction sourceSubCountyId values are invalid.`,
      });
    }

    if (invalidCommodityDestinationFKs.length > 0) {
      errors.push({
        category: "COMMODITY_DESTINATION_SUBCOUNTY_FK",
        severity: "ERROR",
        details:
          `${invalidCommodityDestinationFKs.length} CommodityTransaction destinationSubCountyId values are invalid.`,
      });
    }

    // ------------------------------------------------------------
    // 4. Build candidate-preserving indexes
    // ------------------------------------------------------------

    console.log("");
    console.log(
      "[4/12] Building candidate-preserving identity indexes..."
    );

    const countyIdentityMap =
      new Map<string, number[]>();

    const subCountyIdentityMap =
      new Map<string, number[]>();

    const countyById = new Map<
      number,
      {
        id: number;
        name: string;
      }
    >();

    const subCountyById = new Map<
      number,
      {
        id: number;
        name: string;
        countyId: number;
      }
    >();

    const wardBySourceGid = new Map<
      number,
      {
        id: number;
        name: string;
        sourceGid: number | null;
        countyId: number;
        subCountyId: number | null;
      }
    >();

    for (const county of counties) {
      countyById.set(county.id, county);

      pushMapValue(
        countyIdentityMap,
        normalizeCounty(county.name),
        county.id
      );
    }

    for (const subCounty of subCounties) {
      subCountyById.set(subCounty.id, subCounty);

      const county = countyById.get(
        subCounty.countyId
      );

      if (!county) {
        errors.push({
          category: "SUBCOUNTY_COUNTY_FK",
          severity: "ERROR",
          details:
            `SubCounty ${subCounty.id} (${subCounty.name}) references missing County ${subCounty.countyId}.`,
        });

        continue;
      }

      const key =
        `${normalizeCounty(county.name)}|${normalizeSubCounty(subCounty.name)}`;

      pushMapValue(
        subCountyIdentityMap,
        key,
        subCounty.id
      );
    }

    for (const ward of wards) {
      const sourceGid =
        ward.sourceGid === null
          ? null
          : Number(ward.sourceGid);

      if (sourceGid !== null && Number.isFinite(sourceGid)) {
        if (wardBySourceGid.has(sourceGid)) {
          errors.push({
            category: "WARD_SOURCE_GID_DUPLICATE",
            severity: "ERROR",
            details:
              `Database contains duplicate sourceGid ${sourceGid}.`,
          });
        }

        wardBySourceGid.set(sourceGid, {
          id: ward.id,
          name: ward.name,
          sourceGid,
          countyId: ward.countyId,
          subCountyId: ward.subCountyId,
        });
      }
    }

    // ------------------------------------------------------------
    // 5. Identity duplicate analysis
    // ------------------------------------------------------------

    console.log("");
    console.log(
      "[5/12] Checking normalized SubCounty identities..."
    );

    const duplicateIdentities: Array<{
      key: string;
      ids: number[];
      names: string[];
    }> = [];

    for (const [key, ids] of subCountyIdentityMap.entries()) {
      if (ids.length > 1) {
        duplicateIdentities.push({
          key,
          ids: [...ids].sort((a, b) => a - b),
          names: ids.map(
            (id) => subCountyById.get(id)?.name ?? "UNKNOWN"
          ),
        });
      }
    }

    console.log(
      `  Duplicate normalized identities: ${duplicateIdentities.length}`
    );

    for (const duplicate of duplicateIdentities) {
      errors.push({
        category: "SUBCOUNTY_DUPLICATE_IDENTITY",
        severity: "ERROR",
        details:
          `Duplicate identity ${duplicate.key}: IDs ${duplicate.ids.join(", ")}.`,
      });
    }

    // ------------------------------------------------------------
    // 6. sourceGID structural integrity
    // ------------------------------------------------------------

    console.log("");
    console.log(
      "[6/12] Checking sourceGID structural integrity..."
    );

    const authoritativeGidSet =
      new Set(uniqueGids);

    const databaseGidSet =
      new Set(wardBySourceGid.keys());

    const missingAuthoritativeGids =
      uniqueGids.filter(
        (gid) => !databaseGidSet.has(gid)
      );

    const unexpectedDatabaseGids =
      [...databaseGidSet].filter(
        (gid) => !authoritativeGidSet.has(gid)
      );

    const nullSourceGidCount =
      wards.filter(
        (ward) => ward.sourceGid === null
      ).length;

    console.log(
      `  Database sourceGIDs: ${databaseGidSet.size}`
    );
    console.log(
      `  NULL database sourceGIDs: ${nullSourceGidCount}`
    );
    console.log(
      `  Missing authoritative GIDs: ${missingAuthoritativeGids.length}`
    );
    console.log(
      `  Unexpected database GIDs: ${unexpectedDatabaseGids.length}`
    );

    if (nullSourceGidCount > 0) {
      errors.push({
        category: "WARD_SOURCE_GID_NULL",
        severity: "ERROR",
        details:
          `${nullSourceGidCount} Ward records have NULL sourceGid.`,
      });
    }

    if (missingAuthoritativeGids.length > 0) {
      errors.push({
        category: "SOURCE_GID_MISSING",
        severity: "ERROR",
        details:
          `${missingAuthoritativeGids.length} authoritative GIDs are absent from the database.`,
      });
    }

    if (unexpectedDatabaseGids.length > 0) {
      errors.push({
        category: "SOURCE_GID_UNEXPECTED",
        severity: "ERROR",
        details:
          `${unexpectedDatabaseGids.length} database GIDs do not exist in the authoritative source.`,
      });
    }

    // ------------------------------------------------------------
    // 7. Ward relational integrity
    // ------------------------------------------------------------

    console.log("");
    console.log(
      "[7/12] Checking Ward relational integrity..."
    );

    const countyIdSet =
      new Set(counties.map((county) => county.id));

    const nullSubCountyIdCount =
      wards.filter(
        (ward) => ward.subCountyId === null
      ).length;

    const missingWardSubCountyFKs =
      wards.filter(
        (ward) =>
          ward.subCountyId !== null &&
          !subCountyIdSet.has(ward.subCountyId)
      );

    const missingWardCountyFKs =
      wards.filter(
        (ward) => !countyIdSet.has(ward.countyId)
      );

    const countySubCountyMismatches =
      wards.filter((ward) => {
        if (ward.subCountyId === null) {
          return false;
        }

        const subCounty =
          subCountyById.get(ward.subCountyId);

        return (
          subCounty !== undefined &&
          subCounty.countyId !== ward.countyId
        );
      });

    console.log(
      `  NULL subCountyId: ${nullSubCountyIdCount}`
    );
    console.log(
      `  Missing SubCounty FK: ${missingWardSubCountyFKs.length}`
    );
    console.log(
      `  Missing County FK: ${missingWardCountyFKs.length}`
    );
    console.log(
      `  County/SubCounty mismatches: ${countySubCountyMismatches.length}`
    );

    if (nullSubCountyIdCount > 0) {
      errors.push({
        category: "WARD_SUBCOUNTY_NULL",
        severity: "ERROR",
        details:
          `${nullSubCountyIdCount} Ward records have NULL subCountyId.`,
      });
    }

    if (missingWardSubCountyFKs.length > 0) {
      errors.push({
        category: "WARD_SUBCOUNTY_FK",
        severity: "ERROR",
        details:
          `${missingWardSubCountyFKs.length} Ward records reference missing SubCounty IDs.`,
      });
    }

    if (missingWardCountyFKs.length > 0) {
      errors.push({
        category: "WARD_COUNTY_FK",
        severity: "ERROR",
        details:
          `${missingWardCountyFKs.length} Ward records reference missing County IDs.`,
      });
    }

    if (countySubCountyMismatches.length > 0) {
      errors.push({
        category: "WARD_COUNTY_SUBCOUNTY_MISMATCH",
        severity: "ERROR",
        details:
          `${countySubCountyMismatches.length} Ward records have a County ID different from the County ID of their SubCounty.`,
      });
    }

    // ------------------------------------------------------------
    // 8. Authoritative semantic reconciliation
    // ------------------------------------------------------------

    console.log("");
    console.log(
      "[8/12] Reconciling authoritative ownership using sourceGID..."
    );

    const seenGids = new Set<number>();

    let exactMatchCount = 0;
    let ambiguousCount = 0;
    let unresolvedCount = 0;
    let contradictionCount = 0;
    let knownSemanticExceptionCount = 0;
    let evaluatorInconsistencyCount = 0;

    for (const feature of features) {
      const gid = asNumber(feature.properties?.gid);

      const authoritativeCounty =
        String(feature.properties?.county ?? "").trim();

      const authoritativeSubCounty =
        String(
          feature.properties?.subcounty ?? ""
        ).trim();

      const authoritativeWard =
        String(feature.properties?.ward ?? "").trim();

      if (gid === null) {
        errors.push({
          category: "EVALUATOR_INCONSISTENCY",
          severity: "ERROR",
          details:
            `Authoritative feature has a non-numeric GID.`,
        });

        evaluatorInconsistencyCount++;
        continue;
      }

      if (seenGids.has(gid)) {
        errors.push({
          category: "EVALUATOR_INCONSISTENCY",
          severity: "ERROR",
          gid,
          details:
            `Authoritative GID ${gid} occurs more than once during reconciliation.`,
        });

        evaluatorInconsistencyCount++;
        continue;
      }

      seenGids.add(gid);

      const normalizedCounty =
        normalizeCounty(authoritativeCounty);

      const normalizedSubCounty =
        normalizeSubCounty(authoritativeSubCounty);

      const countyCandidates =
        countyIdentityMap.get(normalizedCounty) ?? [];

      const identityKey =
        `${normalizedCounty}|${normalizedSubCounty}`;

      const subCountyCandidates =
        subCountyIdentityMap.get(identityKey) ?? [];

      const actualWard =
        wardBySourceGid.get(gid);

      let actualCountyId: number | null = null;
      let actualCountyName: string | null = null;
      let actualSubCountyId: number | null = null;
      let actualSubCountyName: string | null = null;

      if (actualWard) {
        actualCountyId = actualWard.countyId;
        actualCountyName =
          countyById.get(actualWard.countyId)?.name ??
          null;

        actualSubCountyId =
          actualWard.subCountyId;

        if (actualSubCountyId !== null) {
          actualSubCountyName =
            subCountyById.get(
              actualSubCountyId
            )?.name ?? null;
        }
      }

      const candidateSubCountyNames =
        subCountyCandidates.map(
          (id) =>
            subCountyById.get(id)?.name ??
            `UNKNOWN_${id}`
        );

      let status: AuditStatus;
      let reason: string;

      if (!actualWard) {
        status = "SOURCE_DB_CONTRADICTION";

        reason =
          "Authoritative GID does not have a matching Ward.sourceGid in the database.";

        contradictionCount++;
      } else if (
        countyCandidates.length === 0
      ) {
        status = "UNRESOLVED";

        reason =
          `Authoritative County "${authoritativeCounty}" does not resolve to a current County identity.`;

        unresolvedCount++;
      } else if (
        countyCandidates.length > 1
      ) {
        status = "AMBIGUOUS";

        reason =
          `Authoritative County "${authoritativeCounty}" resolves to multiple County IDs: ${countyCandidates.join(", ")}.`;

        ambiguousCount++;
      } else if (
        subCountyCandidates.length === 0
      ) {
        /*
         * Tiaty is deliberately NOT handled through a general alias.
         *
         * V15.2 explicitly reassigned GIDs 781-787 to SubCounty 757
         * (Tiaty East), while the authoritative GeoJSON says
         * "Tiaty Sub County".
         *
         * Because this V15.4 evaluator has no alias table, we classify
         * this as a known semantic exception rather than silently
         * inventing a normalized identity.
         */
        if (
          gid >= 781 &&
          gid <= 787 &&
          normalizedCounty === "baringo"
        ) {
          const expectedTiatyTarget = 757;

          if (
            actualSubCountyId ===
            expectedTiatyTarget
          ) {
            status =
              "KNOWN_SEMANTIC_EXCEPTION";

            reason =
              "Authoritative identity is Tiaty Sub County, while the repaired canonical database identity is Tiaty East (ID 757). V15.2 explicitly established this semantic mapping; no general alias rule is being used.";

            knownSemanticExceptionCount++;
          } else {
            status = "UNRESOLVED";

            reason =
              `Authoritative SubCounty "${authoritativeSubCounty}" has no exact normalized current identity. Tiaty V15.2 target 757 was not found on this Ward.`;

            unresolvedCount++;
          }
        } else {
          status = "UNRESOLVED";

          reason =
            `Authoritative SubCounty "${authoritativeSubCounty}" does not resolve to a current SubCounty identity under strict normalization.`;

          unresolvedCount++;
        }
      } else if (
        subCountyCandidates.length > 1
      ) {
        /*
         * IMPORTANT:
         * Do not choose the first candidate.
         *
         * This is the fundamental V15.3 evaluator correction.
         */
        status = "AMBIGUOUS";

        reason =
          `Authoritative identity ${identityKey} resolves to multiple current SubCounty IDs: ${subCountyCandidates.join(", ")}. Evaluator abstains rather than selecting one.`;

        ambiguousCount++;
      } else {
        const expectedCountyId =
          countyCandidates[0];

        const expectedSubCountyId =
          subCountyCandidates[0];

        const actualSubCounty =
          actualSubCountyId === null
            ? null
            : subCountyById.get(
                actualSubCountyId
              );

        if (
          actualSubCounty === null ||
          actualSubCounty === undefined
        ) {
          status =
            "SOURCE_DB_CONTRADICTION";

          reason =
            `Ward ${actualWard.id} has an invalid or NULL SubCounty reference.`;

          contradictionCount++;
        } else if (
          actualWard.countyId !==
          expectedCountyId
        ) {
          status =
            "SOURCE_DB_CONTRADICTION";

          reason =
            `Authoritative County resolves to ID ${expectedCountyId}, but Ward ${actualWard.id} has County ID ${actualWard.countyId}.`;

          contradictionCount++;
        } else if (
          actualSubCountyId !==
          expectedSubCountyId
        ) {
          status =
            "SOURCE_DB_CONTRADICTION";

          reason =
            `Authoritative identity resolves uniquely to SubCounty ${expectedSubCountyId}, but Ward ${actualWard.id} currently references SubCounty ${actualSubCountyId}.`;

          contradictionCount++;
        } else {
          status = "EXACT_MATCH";

          reason =
            "sourceGID located the Ward and its County/SubCounty relationships match the unique normalized authoritative identity.";

          exactMatchCount++;
        }
      }

      const record: AuditRecord = {
        gid,

        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,

        normalizedCounty,
        normalizedSubCounty,

        actualWardId:
          actualWard?.id ?? null,

        actualCountyId,
        actualCountyName,

        actualSubCountyId,
        actualSubCountyName,

        candidateCountyIds:
          uniqueNumbers(countyCandidates),

        candidateSubCountyIds:
          uniqueNumbers(subCountyCandidates),

        candidateSubCountyNames,

        status,
        reason,
      };

      records.push(record);

      const invariantError =
        assertRecordInvariant(record);

      if (invariantError) {
        errors.push(invariantError);
        evaluatorInconsistencyCount++;
      }
    }

    // ------------------------------------------------------------
    // 9. Explicit Tiaty validation
    // ------------------------------------------------------------

    console.log("");
    console.log(
      "[9/12] Verifying Tiaty V15.2 semantic exception..."
    );

    const tiatyGids = [781, 782, 783, 784, 785, 786, 787];

    const tiatyRecords =
      records.filter((record) =>
        tiatyGids.includes(record.gid)
      );

    const tiatyCorrect =
      tiatyRecords.filter(
        (record) =>
          record.actualSubCountyId === 757
      ).length;

    const tiatyWrong =
      tiatyRecords.filter(
        (record) =>
          record.actualSubCountyId !== 757
      ).length;

    console.log(
      `  Expected Tiaty GIDs: ${tiatyGids.length}`
    );
    console.log(
      `  Correct target 757: ${tiatyCorrect}`
    );
    console.log(
      `  Not target 757: ${tiatyWrong}`
    );

    if (tiatyRecords.length !== 7) {
      errors.push({
        category: "TIATY_RECORD_COUNT",
        severity: "ERROR",
        details:
          `Expected 7 Tiaty records but evaluator produced ${tiatyRecords.length}.`,
      });
    }

    if (tiatyCorrect !== 7) {
      errors.push({
        category: "TIATY_REASSIGNMENT",
        severity: "ERROR",
        details:
          `Expected all 7 Tiaty GIDs to reference SubCounty 757, but only ${tiatyCorrect}/7 do.`,
      });
    }

    // ------------------------------------------------------------
    // 10. V15 deleted IDs
    // ------------------------------------------------------------

    console.log("");
    console.log(
      "[10/12] Checking V15 deleted SubCounty IDs..."
    );

    const deletedIdsResult =
      loadV15DeletedIds();

    const deletedIds =
      deletedIdsResult.ids;

    console.log(
      `  V15 deleted IDs loaded: ${deletedIds.length}`
    );
    console.log(
      `  V15 deletion-log parser: ${deletedIdsResult.source}`
    );

    if (deletedIds.length > 0) {
      const deletedIdSet =
        new Set(deletedIds);

      const wardDeletedRefs =
        wards.filter(
          (ward) =>
            ward.subCountyId !== null &&
            deletedIdSet.has(ward.subCountyId)
        ).length;

      const farmerDeletedRefs =
        farmers.filter(
          (row) =>
            row.subCountyId !== null &&
            deletedIdSet.has(row.subCountyId)
        ).length;

      const farmDeletedRefs =
        farms.filter(
          (row) =>
            row.subCountyId !== null &&
            deletedIdSet.has(row.subCountyId)
        ).length;

      const businessPartnerDeletedRefs =
        businessPartners.filter(
          (row) =>
            row.subCountyId !== null &&
            deletedIdSet.has(row.subCountyId)
        ).length;

      const commoditySourceDeletedRefs =
        commodityTransactions.filter(
          (row) =>
            row.sourceSubCountyId !== null &&
            deletedIdSet.has(row.sourceSubCountyId)
        ).length;

      const commodityDestinationDeletedRefs =
        commodityTransactions.filter(
          (row) =>
            row.destinationSubCountyId !== null &&
            deletedIdSet.has(
              row.destinationSubCountyId
            )
        ).length;

      console.log(
        `  Ward refs: ${wardDeletedRefs}`
      );
      console.log(
        `  Farmer refs: ${farmerDeletedRefs}`
      );
      console.log(
        `  Farm refs: ${farmDeletedRefs}`
      );
      console.log(
        `  BusinessPartner refs: ${businessPartnerDeletedRefs}`
      );
      console.log(
        `  Commodity source refs: ${commoditySourceDeletedRefs}`
      );
      console.log(
        `  Commodity destination refs: ${commodityDestinationDeletedRefs}`
      );

      if (
        wardDeletedRefs > 0 ||
        farmerDeletedRefs > 0 ||
        farmDeletedRefs > 0 ||
        businessPartnerDeletedRefs > 0 ||
        commoditySourceDeletedRefs > 0 ||
        commodityDestinationDeletedRefs > 0
      ) {
        errors.push({
          category: "DELETED_SUBCOUNTY_REFERENCE",
          severity: "ERROR",
          details:
            "At least one application or Ward record still references a V15-deleted SubCounty ID.",
        });
      }
    } else {
      warnings.push({
        category: "V15_DELETION_LOG",
        severity: "WARNING",
        details:
          `No V15 deleted IDs were recovered from deletion-log-v15.json. This does not prove deleted IDs are referenced; it means the log could not provide a reliable deleted-ID set. Parser source: ${deletedIdsResult.source}.`,
      });
    }

    // ------------------------------------------------------------
    // 11. Evaluator-level invariants
    // ------------------------------------------------------------

    console.log("");
    console.log(
      "[11/12] Validating evaluator invariants..."
    );

    const statusCounts = {
      EXACT_MATCH: exactMatchCount,
      AMBIGUOUS: ambiguousCount,
      UNRESOLVED: unresolvedCount,
      SOURCE_DB_CONTRADICTION: contradictionCount,
      EVALUATOR_INCONSISTENCY:
        evaluatorInconsistencyCount,
      KNOWN_SEMANTIC_EXCEPTION:
        knownSemanticExceptionCount,
    };

    const classifiedCount =
      Object.values(statusCounts).reduce(
        (sum, value) => sum + value,
        0
      );

    console.log(
      `  Authoritative records: ${features.length}`
    );
    console.log(
      `  Evaluator records: ${records.length}`
    );
    console.log(
      `  Classified records: ${classifiedCount}`
    );

    console.log("");
    console.log("  Status distribution:");

    for (const [status, count] of Object.entries(
      statusCounts
    )) {
      console.log(
        `    ${status}: ${count}`
      );
    }

    if (records.length !== features.length) {
      errors.push({
        category: "EVALUATOR_INCONSISTENCY",
        severity: "ERROR",
        details:
          `Evaluator generated ${records.length} records for ${features.length} authoritative features.`,
      });
    }

    if (classifiedCount !== features.length) {
      errors.push({
        category: "EVALUATOR_INCONSISTENCY",
        severity: "ERROR",
        details:
          `Status counts total ${classifiedCount}, but authoritative feature count is ${features.length}.`,
      });
    }

    if (seenGids.size !== uniqueGids.length) {
      errors.push({
        category: "EVALUATOR_INCONSISTENCY",
        severity: "ERROR",
        details:
          `Evaluator saw ${seenGids.size} unique GIDs but GeoJSON contains ${uniqueGids.length} unique GIDs.`,
      });
    }

    // ------------------------------------------------------------
    // 12. Write reports
    // ------------------------------------------------------------

    console.log("");
    console.log(
      "[12/12] Writing V15.4 diagnostic reports..."
    );

    const finalStatus =
      errors.length === 0
        ? "PASS"
        : "FAIL";

    /*
     * Important:
     *
     * FAIL here means the audit found something requiring review.
     * It does NOT automatically mean the database is corrupt.
     *
     * In particular:
     * - AMBIGUOUS means the evaluator abstained.
     * - UNRESOLVED means strict normalization found no identity.
     * - KNOWN_SEMANTIC_EXCEPTION is explicitly documented.
     * - SOURCE_DB_CONTRADICTION is the state that most directly
     *   indicates a possible database semantic mismatch.
     */

    const sourceDbContradictions =
      records.filter(
        (record) =>
          record.status ===
          "SOURCE_DB_CONTRADICTION"
      );

    const ambiguousRecords =
      records.filter(
        (record) =>
          record.status === "AMBIGUOUS"
      );

    const unresolvedRecords =
      records.filter(
        (record) =>
          record.status === "UNRESOLVED"
      );

    const knownSemanticExceptions =
      records.filter(
        (record) =>
          record.status ===
          "KNOWN_SEMANTIC_EXCEPTION"
      );

    const report = {
      audit: "FINAL DATABASE INTEGRITY AUDIT V15.4",
      version: "V15.4",
      mode: "READ_ONLY",
      generatedAt: new Date().toISOString(),

      methodology: {
        sourceIdentity:
          "GeoJSON authoritative ward GID",
        databaseIdentity:
          "Ward.sourceGid",
        resolver:
          "Candidate-preserving normalized identity resolver",
        aliasesUsed: false,
        fuzzyMatchingUsed: false,
        mutationPerformed: false,
        writeOperationsPerformed: false,
        deleteOperationsPerformed: false,
        updateOperationsPerformed: false,
      },

      databaseCounts: {
        counties: counties.length,
        subCounties: subCounties.length,
        wards: wards.length,
        farmers: farmers.length,
        farms: farms.length,
        businessPartners:
          businessPartners.length,
        commodityTransactions:
          commodityTransactions.length,
      },

      authoritativeCounts: {
        geoJsonFeatures: features.length,
        numericGids: numericGids.length,
        uniqueGids: uniqueGids.length,
      },

      structuralIntegrity: {
        databaseSourceGids:
          databaseGidSet.size,
        uniqueDatabaseSourceGids:
          databaseGidSet.size,
        missingAuthoritativeGids:
          missingAuthoritativeGids.length,
        unexpectedDatabaseGids:
          unexpectedDatabaseGids.length,
        nullDatabaseSourceGids:
          nullSourceGidCount,
      },

      relationalIntegrity: {
        nullWardSubCountyIds:
          nullSubCountyIdCount,
        missingWardSubCountyFKs:
          missingWardSubCountyFKs.length,
        missingWardCountyFKs:
          missingWardCountyFKs.length,
        countySubCountyMismatches:
          countySubCountyMismatches.length,
      },

      applicationForeignKeys: {
        invalidFarmerFKs:
          invalidFarmerFKs.length,
        invalidFarmFKs:
          invalidFarmFKs.length,
        invalidBusinessPartnerFKs:
          invalidBusinessPartnerFKs.length,
        invalidCommoditySourceFKs:
          invalidCommoditySourceFKs.length,
        invalidCommodityDestinationFKs:
          invalidCommodityDestinationFKs.length,
      },

      duplicateSubCountyIdentities:
        duplicateIdentities,

      statusCounts,

      tiatyValidation: {
        gids: tiatyGids,
        expectedTargetSubCountyId: 757,
        correctCount: tiatyCorrect,
        incorrectCount: tiatyWrong,
      },

      v15DeletedIds: {
        count: deletedIds.length,
        ids: deletedIds,
        parserSource:
          deletedIdsResult.source,
      },

      evaluatorAssessment: {
        exactMatches:
          exactMatchCount,
        ambiguous:
          ambiguousCount,
        unresolved:
          unresolvedCount,
        sourceDbContradictions:
          contradictionCount,
        knownSemanticExceptions:
          knownSemanticExceptionCount,
        evaluatorInconsistencies:
          evaluatorInconsistencyCount,
      },

      records,

      reviewSets: {
        ambiguous: ambiguousRecords,
        unresolved: unresolvedRecords,
        sourceDbContradictions,
        knownSemanticExceptions,
      },

      errors,
      warnings,

      finalStatus,
    };

    fs.writeFileSync(
      OUTPUT_JSON,
      JSON.stringify(report, null, 2),
      "utf8"
    );

    const csvHeader = [
      "gid",
      "authoritativeCounty",
      "authoritativeSubCounty",
      "authoritativeWard",
      "normalizedCounty",
      "normalizedSubCounty",
      "actualWardId",
      "actualCountyId",
      "actualCountyName",
      "actualSubCountyId",
      "actualSubCountyName",
      "candidateCountyIds",
      "candidateSubCountyIds",
      "candidateSubCountyNames",
      "status",
      "reason",
    ];

    const csvRows = records.map(
      (record) =>
        [
          record.gid,
          record.authoritativeCounty,
          record.authoritativeSubCounty,
          record.authoritativeWard,
          record.normalizedCounty,
          record.normalizedSubCounty,
          record.actualWardId,
          record.actualCountyId,
          record.actualCountyName,
          record.actualSubCountyId,
          record.actualSubCountyName,
          record.candidateCountyIds.join("|"),
          record.candidateSubCountyIds.join("|"),
          record.candidateSubCountyNames.join("|"),
          record.status,
          record.reason,
        ]
          .map(csvEscape)
          .join(",")
    );

    fs.writeFileSync(
      OUTPUT_CSV,
      [
        csvHeader.join(","),
        ...csvRows,
      ].join("\n"),
      "utf8"
    );

    // ------------------------------------------------------------
    // Final console result
    // ------------------------------------------------------------

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "FINAL V15.4 RESULT"
    );
    console.log(
      "============================================================"
    );

    console.log(
      `STATUS: ${finalStatus}`
    );

    console.log("");
    console.log(
      `Counties: ${counties.length}`
    );
    console.log(
      `SubCounties: ${subCounties.length}`
    );
    console.log(
      `Wards: ${wards.length}`
    );
    console.log(
      `Unique sourceGIDs: ${databaseGidSet.size}`
    );

    console.log("");
    console.log(
      `EXACT_MATCH: ${exactMatchCount}`
    );
    console.log(
      `AMBIGUOUS: ${ambiguousCount}`
    );
    console.log(
      `UNRESOLVED: ${unresolvedCount}`
    );
    console.log(
      `SOURCE_DB_CONTRADICTION: ${contradictionCount}`
    );
    console.log(
      `KNOWN_SEMANTIC_EXCEPTION: ${knownSemanticExceptionCount}`
    );
    console.log(
      `EVALUATOR_INCONSISTENCY: ${evaluatorInconsistencyCount}`
    );

    console.log("");
    console.log(
      `Duplicate SubCounty identities: ${duplicateIdentities.length}`
    );

    console.log(
      `Tiaty correct: ${tiatyCorrect}/7`
    );

    console.log(
      `V15 deleted IDs recovered: ${deletedIds.length}`
    );

    console.log(
      `Errors: ${errors.length}`
    );

    console.log(
      `Warnings: ${warnings.length}`
    );

    console.log("");
    console.log(
      `JSON: ${OUTPUT_JSON}`
    );
    console.log(
      `CSV: ${OUTPUT_CSV}`
    );

    console.log(
      "============================================================"
    );

    if (finalStatus === "PASS") {
      console.log("");
      console.log(
        "V15.4 AUDIT PASSED."
      );
      console.log(
        "No evaluator-level errors were detected."
      );
    } else {
      console.log("");
      console.log(
        "V15.4 AUDIT REQUIRES REVIEW."
      );
      console.log(
        "This does NOT authorize database repair."
      );
      console.log(
        "Review AMBIGUOUS / UNRESOLVED / SOURCE_DB_CONTRADICTION separately."
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("");
  console.error(
    "============================================================"
  );
  console.error(
    "V15.4 AUDIT EXECUTION ERROR"
  );
  console.error(
    "============================================================"
  );
  console.error(error);
  process.exit(1);
});