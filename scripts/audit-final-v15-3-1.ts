import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import fs from "fs";
import path from "path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

const GEOJSON_PATH = path.join(
  process.cwd(),
  "prisma",
  "data",
  "kenya-wards-1450.geojson"
);

const DELETION_LOG_PATH = path.join(
  process.cwd(),
  "prisma",
  "data",
  "deletion-log-v15.json"
);

const OUTPUT_JSON = path.join(
  process.cwd(),
  "prisma",
  "data",
  "final-database-integrity-audit-v15-3-1.json"
);

const OUTPUT_CSV = path.join(
  process.cwd(),
  "prisma",
  "data",
  "final-database-integrity-audit-v15-3-1.csv"
);

type GeoFeature = {
  type: string;
  properties?: {
    gid?: number | string;
    county?: string;
    subcounty?: string;
    ward?: string;
  };
};

type GeoJSON = {
  type: string;
  features: GeoFeature[];
};

type IssueSeverity = "ERROR" | "WARNING";

type Issue = {
  category: string;
  severity: IssueSeverity;
  details: string;
};

type ResolutionState =
  | "EXACT_MATCH"
  | "NORMALIZED_MATCH"
  | "KNOWN_SEMANTIC_MATCH"
  | "AMBIGUOUS"
  | "TARGET_UNRESOLVED"
  | "WRONG_SUBCOUNTY"
  | "WARD_NOT_FOUND"
  | "EVALUATOR_INCONSISTENCY";

type OwnershipRow = {
  gid: number;

  authoritativeCounty: string;
  authoritativeSubCounty: string;
  authoritativeWard: string;

  normalizedCounty: string;
  normalizedSubCounty: string;
  identityKey: string;

  expectedCountyId: number | null;
  expectedCountyName: string | null;

  candidateSubCountyIds: number[];
  candidateSubCountyNames: string[];

  actualWardId: number | null;
  actualWardName: string | null;

  actualCountyId: number | null;
  actualCountyName: string | null;

  actualSubCountyId: number | null;
  actualSubCountyName: string | null;

  resolutionState: ResolutionState;

  resolutionReason: string;
};

type SemanticMapping = {
  countyKey: string;
  authoritativeSubCountyKey: string;
  targetSubCountyId: number;
  reason: string;
};

function normalizeCounty(
  value: string | null | undefined
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeSubCounty(
  value: string | null | undefined
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/sub[\s-]*county/g, "")
    .replace(/[^a-z0-9]/g, "");
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

function addIssue(
  issues: Issue[],
  category: string,
  details: string,
  severity: IssueSeverity = "ERROR"
): void {
  issues.push({
    category,
    severity,
    details,
  });
}

function numberOrNull(
  value: unknown
): number | null {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function extractDeletedIds(
  value: unknown
): number[] {
  const ids = new Set<number>();

  const idKeys = new Set([
    "deletedSubCountyId",
    "oldSubCountyId",
    "subCountyId",
    "deletedId",
  ]);

  function visit(node: unknown): void {
    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item);
      }

      return;
    }

    if (
      node === null ||
      typeof node !== "object"
    ) {
      return;
    }

    const object =
      node as Record<string, unknown>;

    for (const [key, rawValue] of Object.entries(
      object
    )) {
      if (idKeys.has(key)) {
        const numeric =
          Number(rawValue);

        if (Number.isFinite(numeric)) {
          ids.add(numeric);
        }
      }

      visit(rawValue);
    }
  }

  visit(value);

  return Array.from(ids).sort(
    (a, b) => a - b
  );
}

async function main(): Promise<void> {
  console.log("");
  console.log(
    "============================================================"
  );
  console.log(
    "FINAL DATABASE INTEGRITY AUDIT V15.3.1"
  );
  console.log(
    "============================================================"
  );
  console.log(
    "MODE: READ-ONLY"
  );
  console.log(
    "NO INSERT / UPDATE / DELETE"
  );
  console.log("");

  const issues: Issue[] = [];

  // ==========================================================
  // 1. LOAD AUTHORITATIVE GEOJSON
  // ==========================================================

  console.log(
    "[1/13] Loading authoritative ward GeoJSON..."
  );

  if (!fs.existsSync(GEOJSON_PATH)) {
    throw new Error(
      `GeoJSON file not found: ${GEOJSON_PATH}`
    );
  }

  const geojson =
    JSON.parse(
      fs.readFileSync(
        GEOJSON_PATH,
        "utf8"
      )
    ) as GeoJSON;

  const features =
    Array.isArray(geojson.features)
      ? geojson.features
      : [];

  const authoritativeRows =
    features.map(
      (feature, index) => {
        const properties =
          feature.properties ?? {};

        const gid =
          Number(properties.gid);

        return {
          featureIndex: index,
          feature,
          gid,
          county:
            String(
              properties.county ?? ""
            ).trim(),
          subCounty:
            String(
              properties.subcounty ?? ""
            ).trim(),
          ward:
            String(
              properties.ward ?? ""
            ).trim(),
        };
      }
    );

  const authoritativeGids =
    authoritativeRows
      .map((row) => row.gid)
      .filter((gid) =>
        Number.isFinite(gid)
      );

  const authoritativeGidSet =
    new Set<number>(
      authoritativeGids
    );

  console.log(
    `  GeoJSON features: ${features.length}`
  );

  console.log(
    `  Numeric GIDs: ${authoritativeGids.length}`
  );

  console.log(
    `  Unique GIDs: ${authoritativeGidSet.size}`
  );

  if (features.length !== 1450) {
    addIssue(
      issues,
      "AUTHORITATIVE_SOURCE",
      `Expected 1450 GeoJSON features but found ${features.length}.`
    );
  }

  if (
    authoritativeGids.length !== 1450
  ) {
    addIssue(
      issues,
      "AUTHORITATIVE_SOURCE",
      `Expected 1450 numeric GIDs but found ${authoritativeGids.length}.`
    );
  }

  if (
    authoritativeGidSet.size !== 1450
  ) {
    addIssue(
      issues,
      "AUTHORITATIVE_SOURCE",
      `Expected 1450 unique authoritative GIDs but found ${authoritativeGidSet.size}.`
    );
  }

  // ==========================================================
  // 2. LOAD DATABASE GEOGRAPHY
  // ==========================================================

  console.log("");
  console.log(
    "[2/13] Loading database geography..."
  );

  const [
    counties,
    subCounties,
    wards,
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
        constituencyId: true,
      },
      orderBy: {
        id: "asc",
      },
    }),
  ]);

  console.log(
    `  Counties: ${counties.length}`
  );

  console.log(
    `  SubCounties: ${subCounties.length}`
  );

  console.log(
    `  Wards: ${wards.length}`
  );

  if (counties.length !== 47) {
    addIssue(
      issues,
      "DATABASE_COUNTS",
      `Expected 47 counties but found ${counties.length}.`
    );
  }

  if (
    subCounties.length !== 417
  ) {
    addIssue(
      issues,
      "DATABASE_COUNTS",
      `Expected 417 SubCounty records but found ${subCounties.length}.`
    );
  }

  if (wards.length !== 1450) {
    addIssue(
      issues,
      "DATABASE_COUNTS",
      `Expected 1450 Ward records but found ${wards.length}.`
    );
  }

  // ==========================================================
  // 3. BUILD DATABASE INDEXES
  // ==========================================================

  console.log("");
  console.log(
    "[3/13] Building database indexes..."
  );

  const countyById =
    new Map<
      number,
      (typeof counties)[number]
    >();

  for (const county of counties) {
    countyById.set(
      county.id,
      county
    );
  }

  const subCountyById =
    new Map<
      number,
      (typeof subCounties)[number]
    >();

  for (const subCounty of subCounties) {
    subCountyById.set(
      subCounty.id,
      subCounty
    );
  }

  const wardBySourceGid =
    new Map<
      number,
      (typeof wards)[number]
    >();

  const duplicateDatabaseSourceGids =
    new Set<number>();

  for (const ward of wards) {
    if (
      ward.sourceGid === null ||
      ward.sourceGid === undefined
    ) {
      addIssue(
        issues,
        "SOURCE_GID_INTEGRITY",
        `Ward ${ward.id} (${ward.name}) has NULL sourceGid.`
      );

      continue;
    }

    const gid =
      Number(ward.sourceGid);

    if (
      !Number.isFinite(gid)
    ) {
      addIssue(
        issues,
        "SOURCE_GID_INTEGRITY",
        `Ward ${ward.id} (${ward.name}) has non-numeric sourceGid ${String(ward.sourceGid)}.`
      );

      continue;
    }

    if (
      wardBySourceGid.has(gid)
    ) {
      duplicateDatabaseSourceGids.add(
        gid
      );
    } else {
      wardBySourceGid.set(
        gid,
        ward
      );
    }
  }

  // ==========================================================
  // 4. BUILD COUNTY IDENTITY CANDIDATES
  // ==========================================================

  console.log("");
  console.log(
    "[4/13] Building county identity candidates..."
  );

  const countyIdentityCandidates =
    new Map<string, number[]>();

  for (const county of counties) {
    const key =
      normalizeCounty(
        county.name
      );

    const candidates =
      countyIdentityCandidates.get(
        key
      ) ?? [];

    candidates.push(
      county.id
    );

    countyIdentityCandidates.set(
      key,
      candidates
    );
  }

  const ambiguousCountyIdentities =
    Array.from(
      countyIdentityCandidates.entries()
    ).filter(
      ([, ids]) =>
        ids.length > 1
    );

  for (
    const [identity, ids] of
      ambiguousCountyIdentities
  ) {
    addIssue(
      issues,
      "COUNTY_IDENTITY_AMBIGUOUS",
      `Multiple County records resolve to ${identity}: ${ids.join(", ")}`
    );
  }

  // ==========================================================
  // 5. BUILD SUBCOUNTY CANDIDATE MAP
  //
  // IMPORTANT:
  //
  // Map<string, number[]>
  //
  // NOT:
  //
  // Map<string, number>
  //
  // Therefore duplicate identities remain visible.
  // ==========================================================

  console.log("");
  console.log(
    "[5/13] Building SubCounty candidate identities..."
  );

  const subCountyIdentityCandidates =
    new Map<
      string,
      number[]
    >();

  for (const subCounty of subCounties) {
    const county =
      countyById.get(
        subCounty.countyId
      );

    if (!county) {
      continue;
    }

    const countyKey =
      normalizeCounty(
        county.name
      );

    const subCountyKey =
      normalizeSubCounty(
        subCounty.name
      );

    const identityKey =
      `${countyKey}|${subCountyKey}`;

    const candidates =
      subCountyIdentityCandidates.get(
        identityKey
      ) ?? [];

    candidates.push(
      subCounty.id
    );

    subCountyIdentityCandidates.set(
      identityKey,
      candidates
    );
  }

  const duplicateSubCountyIdentities =
    Array.from(
      subCountyIdentityCandidates.entries()
    ).filter(
      ([, ids]) =>
        ids.length > 1
    );

  console.log(
    `  Duplicate normalized identities: ${duplicateSubCountyIdentities.length}`
  );

  for (
    const [identity, ids] of
      duplicateSubCountyIdentities
  ) {
    addIssue(
      issues,
      "SUBCOUNTY_DUPLICATE_IDENTITY",
      `Duplicate identity ${identity}: IDs ${ids.join(", ")}`
    );
  }

  // ==========================================================
  // 6. SOURCE GID SET INTEGRITY
  // ==========================================================

  console.log("");
  console.log(
    "[6/13] Checking sourceGID set integrity..."
  );

  const databaseGids =
    Array.from(
      wardBySourceGid.keys()
    );

  const databaseGidSet =
    new Set<number>(
      databaseGids
    );

  const missingDatabaseGids =
    authoritativeGids.filter(
      (gid) =>
        !databaseGidSet.has(gid)
    );

  const unexpectedDatabaseGids =
    databaseGids.filter(
      (gid) =>
        !authoritativeGidSet.has(gid)
    );

  console.log(
    `  Database sourceGIDs: ${databaseGids.length}`
  );

  console.log(
    `  Unique sourceGIDs: ${databaseGidSet.size}`
  );

  console.log(
    `  Missing authoritative GIDs: ${missingDatabaseGids.length}`
  );

  console.log(
    `  Unexpected database GIDs: ${unexpectedDatabaseGids.length}`
  );

  if (
    databaseGids.length !== 1450
  ) {
    addIssue(
      issues,
      "SOURCE_GID_INTEGRITY",
      `Expected 1450 database sourceGIDs but found ${databaseGids.length}.`
    );
  }

  if (
    databaseGidSet.size !== 1450
  ) {
    addIssue(
      issues,
      "SOURCE_GID_INTEGRITY",
      `Expected 1450 unique database sourceGIDs but found ${databaseGidSet.size}.`
    );
  }

  if (
    missingDatabaseGids.length > 0
  ) {
    addIssue(
      issues,
      "SOURCE_GID_INTEGRITY",
      `Missing authoritative GIDs: ${missingDatabaseGids.join(", ")}`
    );
  }

  if (
    unexpectedDatabaseGids.length > 0
  ) {
    addIssue(
      issues,
      "SOURCE_GID_INTEGRITY",
      `Unexpected database GIDs: ${unexpectedDatabaseGids.join(", ")}`
    );
  }

  // ==========================================================
  // 7. WARD RELATIONAL INTEGRITY
  // ==========================================================

  console.log("");
  console.log(
    "[7/13] Checking Ward relational integrity..."
  );

  let wardNullSubCounty = 0;
  let wardMissingSubCounty = 0;
  let wardMissingCounty = 0;
  let wardCountyMismatch = 0;

  for (const ward of wards) {
    if (
      ward.subCountyId === null ||
      ward.subCountyId === undefined
    ) {
      wardNullSubCounty++;

      continue;
    }

    const subCounty =
      subCountyById.get(
        ward.subCountyId
      );

    if (!subCounty) {
      wardMissingSubCounty++;

      addIssue(
        issues,
        "WARD_FK",
        `Ward ${ward.id} (${ward.name}) references missing SubCounty ${ward.subCountyId}.`
      );

      continue;
    }

    const county =
      countyById.get(
        ward.countyId
      );

    if (!county) {
      wardMissingCounty++;

      addIssue(
        issues,
        "WARD_FK",
        `Ward ${ward.id} (${ward.name}) references missing County ${ward.countyId}.`
      );

      continue;
    }

    if (
      subCounty.countyId !==
      ward.countyId
    ) {
      wardCountyMismatch++;

      addIssue(
        issues,
        "WARD_COUNTY_MISMATCH",
        `Ward ${ward.id} (${ward.name}) has countyId=${ward.countyId}, but SubCounty ${subCounty.id} belongs to countyId=${subCounty.countyId}.`
      );
    }
  }

  console.log(
    `  NULL subCountyId: ${wardNullSubCounty}`
  );

  console.log(
    `  Missing SubCounty FK: ${wardMissingSubCounty}`
  );

  console.log(
    `  Missing County FK: ${wardMissingCounty}`
  );

  console.log(
    `  County/SubCounty mismatches: ${wardCountyMismatch}`
  );

  // ==========================================================
  // 8. APPLICATION FOREIGN KEY INTEGRITY
  // ==========================================================

  console.log("");
  console.log(
    "[8/13] Checking application SubCounty foreign keys..."
  );

  const [
    farmers,
    farms,
    businessPartners,
    commodityTransactions,
  ] = await Promise.all([
    prisma.farmer.findMany({
      select: {
        id: true,
        subCountyId: true,
      },
    }),

    prisma.farm.findMany({
      select: {
        id: true,
        subCountyId: true,
      },
    }),

    prisma.businessPartner.findMany({
      select: {
        id: true,
        subCountyId: true,
      },
    }),

    prisma.commodityTransaction.findMany({
      select: {
        id: true,
        sourceSubCountyId: true,
        destinationSubCountyId: true,
      },
    }),
  ]);

  let farmerInvalid = 0;
  let farmInvalid = 0;
  let businessPartnerInvalid = 0;
  let commoditySourceInvalid = 0;
  let commodityDestinationInvalid = 0;

  for (const farmer of farmers) {
    if (
      farmer.subCountyId !== null &&
      farmer.subCountyId !== undefined &&
      !subCountyById.has(
        farmer.subCountyId
      )
    ) {
      farmerInvalid++;

      addIssue(
        issues,
        "APPLICATION_FK",
        `Farmer ${farmer.id} references missing SubCounty ${farmer.subCountyId}.`
      );
    }
  }

  for (const farm of farms) {
    if (
      farm.subCountyId !== null &&
      farm.subCountyId !== undefined &&
      !subCountyById.has(
        farm.subCountyId
      )
    ) {
      farmInvalid++;

      addIssue(
        issues,
        "APPLICATION_FK",
        `Farm ${farm.id} references missing SubCounty ${farm.subCountyId}.`
      );
    }
  }

  for (const partner of businessPartners) {
    if (
      partner.subCountyId !== null &&
      partner.subCountyId !== undefined &&
      !subCountyById.has(
        partner.subCountyId
      )
    ) {
      businessPartnerInvalid++;

      addIssue(
        issues,
        "APPLICATION_FK",
        `BusinessPartner ${partner.id} references missing SubCounty ${partner.subCountyId}.`
      );
    }
  }

  for (
    const transaction of
      commodityTransactions
  ) {
    if (
      transaction.sourceSubCountyId !==
        null &&
      transaction.sourceSubCountyId !==
        undefined &&
      !subCountyById.has(
        transaction.sourceSubCountyId
      )
    ) {
      commoditySourceInvalid++;

      addIssue(
        issues,
        "APPLICATION_FK",
        `CommodityTransaction ${transaction.id} references missing source SubCounty ${transaction.sourceSubCountyId}.`
      );
    }

    if (
      transaction.destinationSubCountyId !==
        null &&
      transaction.destinationSubCountyId !==
        undefined &&
      !subCountyById.has(
        transaction.destinationSubCountyId
      )
    ) {
      commodityDestinationInvalid++;

      addIssue(
        issues,
        "APPLICATION_FK",
        `CommodityTransaction ${transaction.id} references missing destination SubCounty ${transaction.destinationSubCountyId}.`
      );
    }
  }

  console.log(
    `  Farmers: ${farmers.length}`
  );

  console.log(
    `  Farms: ${farms.length}`
  );

  console.log(
    `  BusinessPartners: ${businessPartners.length}`
  );

  console.log(
    `  CommodityTransactions: ${commodityTransactions.length}`
  );

  console.log(
    `  Invalid Farmer FKs: ${farmerInvalid}`
  );

  console.log(
    `  Invalid Farm FKs: ${farmInvalid}`
  );

  console.log(
    `  Invalid BusinessPartner FKs: ${businessPartnerInvalid}`
  );

  console.log(
    `  Invalid Commodity source FKs: ${commoditySourceInvalid}`
  );

  console.log(
    `  Invalid Commodity destination FKs: ${commodityDestinationInvalid}`
  );

  // ==========================================================
  // 9. KNOWN SEMANTIC MAPPINGS
  //
  // These are NOT fuzzy matches.
  //
  // They are explicit, previously verified domain mappings.
  // ==========================================================

  console.log("");
  console.log(
    "[9/13] Loading verified semantic mappings..."
  );

  const semanticMappings:
    SemanticMapping[] = [
      {
        countyKey:
          normalizeCounty(
            "Baringo"
          ),

        authoritativeSubCountyKey:
          normalizeSubCounty(
            "Tiaty Sub County"
          ),

        targetSubCountyId: 757,

        reason:
          "V15.2 explicitly verified Tiaty Sub County authoritative wards GIDs 781-787 against canonical SubCounty 757 Tiaty East.",
      },
    ];

  console.log(
    `  Verified semantic mappings: ${semanticMappings.length}`
  );

  const semanticMappingByKey =
    new Map<
      string,
      SemanticMapping
    >();

  for (
    const mapping of
      semanticMappings
  ) {
    const key =
      `${mapping.countyKey}|${mapping.authoritativeSubCountyKey}`;

    semanticMappingByKey.set(
      key,
      mapping
    );
  }

  // ==========================================================
  // 10. AUTHORITATIVE OWNERSHIP RECONCILIATION
  // ==========================================================

  console.log("");
  console.log(
    "[10/13] Reconciling authoritative ownership..."
  );

  let exactMatch = 0;
  let normalizedMatch = 0;
  let knownSemanticMatch = 0;
  let ambiguous = 0;
  let targetUnresolved = 0;
  let wrongSubCounty = 0;
  let wardNotFound = 0;
  let evaluatorInconsistency = 0;

  const ownershipRows:
    OwnershipRow[] = [];

  for (
    const sourceRow of
      authoritativeRows
  ) {
    const {
      gid,
      county:
        authoritativeCounty,
      subCounty:
        authoritativeSubCounty,
      ward:
        authoritativeWard,
    } = sourceRow;

    if (
      !Number.isFinite(gid)
    ) {
      evaluatorInconsistency++;

      addIssue(
        issues,
        "EVALUATOR_INCONSISTENCY",
        `GeoJSON feature index ${sourceRow.featureIndex} has a non-numeric GID.`
      );

      ownershipRows.push({
        gid: -1,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        normalizedCounty:
          normalizeCounty(
            authoritativeCounty
          ),
        normalizedSubCounty:
          normalizeSubCounty(
            authoritativeSubCounty
          ),
        identityKey: "",
        expectedCountyId: null,
        expectedCountyName: null,
        candidateSubCountyIds: [],
        candidateSubCountyNames: [],
        actualWardId: null,
        actualWardName: null,
        actualCountyId: null,
        actualCountyName: null,
        actualSubCountyId: null,
        actualSubCountyName: null,
        resolutionState:
          "EVALUATOR_INCONSISTENCY",
        resolutionReason:
          "Authoritative feature has a non-numeric GID.",
      });

      continue;
    }

    const normalizedCounty =
      normalizeCounty(
        authoritativeCounty
      );

    const normalizedSubCounty =
      normalizeSubCounty(
        authoritativeSubCounty
      );

    const identityKey =
      `${normalizedCounty}|${normalizedSubCounty}`;

    const countyCandidates =
      countyIdentityCandidates.get(
        normalizedCounty
      ) ?? [];

    const expectedCountyId =
      countyCandidates.length === 1
        ? countyCandidates[0]
        : null;

    const expectedCountyName =
      expectedCountyId !== null
        ? countyById.get(
            expectedCountyId
          )?.name ?? null
        : null;

    const candidateSubCountyIds =
      subCountyIdentityCandidates.get(
        identityKey
      ) ?? [];

    const candidateSubCountyNames =
      candidateSubCountyIds.map(
        (id) =>
          subCountyById.get(
            id
          )?.name ?? `UNKNOWN(${id})`
      );

    const actualWard =
      wardBySourceGid.get(
        gid
      );

    if (!actualWard) {
      wardNotFound++;

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        normalizedCounty,
        normalizedSubCounty,
        identityKey,
        expectedCountyId,
        expectedCountyName,
        candidateSubCountyIds,
        candidateSubCountyNames,
        actualWardId: null,
        actualWardName: null,
        actualCountyId: null,
        actualCountyName: null,
        actualSubCountyId: null,
        actualSubCountyName: null,
        resolutionState:
          "WARD_NOT_FOUND",
        resolutionReason:
          "No database Ward has this sourceGid.",
      });

      continue;
    }

    const actualCounty =
      countyById.get(
        actualWard.countyId
      );

    const actualSubCounty =
      actualWard.subCountyId !== null
        ? subCountyById.get(
            actualWard.subCountyId
          )
        : undefined;

    const actualCountyName =
      actualCounty?.name ??
      null;

    const actualSubCountyName =
      actualSubCounty?.name ??
      null;

    const actualCountyKey =
      normalizeCounty(
        actualCountyName
      );

    const actualSubCountyKey =
      normalizeSubCounty(
        actualSubCountyName
      );

    /*
     * Evaluator invariant:
     *
     * If the actual Ward references a SubCounty,
     * that SubCounty must belong to the actual Ward county.
     */

    if (
      actualWard.subCountyId !==
        null &&
      !actualSubCounty
    ) {
      evaluatorInconsistency++;

      addIssue(
        issues,
        "EVALUATOR_INCONSISTENCY",
        `GID ${gid} maps to Ward ${actualWard.id}, but actual subCountyId ${actualWard.subCountyId} cannot be resolved in the loaded SubCounty table.`
      );

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        normalizedCounty,
        normalizedSubCounty,
        identityKey,
        expectedCountyId,
        expectedCountyName,
        candidateSubCountyIds,
        candidateSubCountyNames,
        actualWardId: actualWard.id,
        actualWardName: actualWard.name,
        actualCountyId:
          actualWard.countyId,
        actualCountyName,
        actualSubCountyId:
          actualWard.subCountyId,
        actualSubCountyName,
        resolutionState:
          "EVALUATOR_INCONSISTENCY",
        resolutionReason:
          "Actual Ward references a SubCounty that is not present in the loaded SubCounty table.",
      });

      continue;
    }

    if (
      actualSubCounty &&
      actualSubCounty.countyId !==
        actualWard.countyId
    ) {
      evaluatorInconsistency++;

      addIssue(
        issues,
        "EVALUATOR_INCONSISTENCY",
        `GID ${gid} maps to Ward ${actualWard.id}, but actual SubCounty ${actualSubCounty.id} belongs to County ${actualSubCounty.countyId}, while Ward belongs to County ${actualWard.countyId}.`
      );

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        normalizedCounty,
        normalizedSubCounty,
        identityKey,
        expectedCountyId,
        expectedCountyName,
        candidateSubCountyIds,
        candidateSubCountyNames,
        actualWardId: actualWard.id,
        actualWardName: actualWard.name,
        actualCountyId:
          actualWard.countyId,
        actualCountyName,
        actualSubCountyId:
          actualWard.subCountyId,
        actualSubCountyName,
        resolutionState:
          "EVALUATOR_INCONSISTENCY",
        resolutionReason:
          "Database Ward countyId and SubCounty countyId contradict each other.",
      });

      continue;
    }

    /*
     * County resolution must be unique.
     */

    if (
      countyCandidates.length === 0
    ) {
      targetUnresolved++;

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        normalizedCounty,
        normalizedSubCounty,
        identityKey,
        expectedCountyId: null,
        expectedCountyName: null,
        candidateSubCountyIds,
        candidateSubCountyNames,
        actualWardId: actualWard.id,
        actualWardName: actualWard.name,
        actualCountyId:
          actualWard.countyId,
        actualCountyName,
        actualSubCountyId:
          actualWard.subCountyId,
        actualSubCountyName,
        resolutionState:
          "TARGET_UNRESOLVED",
        resolutionReason:
          `No current County resolves to normalized identity "${normalizedCounty}".`,
      });

      continue;
    }

    if (
      countyCandidates.length > 1
    ) {
      ambiguous++;

      addIssue(
        issues,
        "COUNTY_IDENTITY_AMBIGUOUS",
        `GID ${gid} authoritative County "${authoritativeCounty}" resolves to multiple County IDs: ${countyCandidates.join(", ")}`
      );

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        normalizedCounty,
        normalizedSubCounty,
        identityKey,
        expectedCountyId: null,
        expectedCountyName: null,
        candidateSubCountyIds,
        candidateSubCountyNames,
        actualWardId: actualWard.id,
        actualWardName: actualWard.name,
        actualCountyId:
          actualWard.countyId,
        actualCountyName,
        actualSubCountyId:
          actualWard.subCountyId,
        actualSubCountyName,
        resolutionState:
          "AMBIGUOUS",
        resolutionReason:
          `Authoritative County resolves to multiple database County records: ${countyCandidates.join(", ")}.`,
      });

      continue;
    }

    /*
     * Explicit semantic mapping gets priority over
     * strict normalized identity.
     */

    const semanticMapping =
      semanticMappingByKey.get(
        identityKey
      );

    if (semanticMapping) {
      const targetId =
        semanticMapping.targetSubCountyId;

      const target =
        subCountyById.get(
          targetId
        );

      if (!target) {
        evaluatorInconsistency++;

        addIssue(
          issues,
          "EVALUATOR_INCONSISTENCY",
          `Semantic mapping ${identityKey} points to missing SubCounty ${targetId}.`
        );

        ownershipRows.push({
          gid,
          authoritativeCounty,
          authoritativeSubCounty,
          authoritativeWard,
          normalizedCounty,
          normalizedSubCounty,
          identityKey,
          expectedCountyId,
          expectedCountyName,
          candidateSubCountyIds,
          candidateSubCountyNames,
          actualWardId:
            actualWard.id,
          actualWardName:
            actualWard.name,
          actualCountyId:
            actualWard.countyId,
          actualCountyName,
          actualSubCountyId:
            actualWard.subCountyId,
          actualSubCountyName,
          resolutionState:
            "EVALUATOR_INCONSISTENCY",
          resolutionReason:
            `Verified semantic mapping targets missing SubCounty ${targetId}.`,
        });

        continue;
      }

      if (
        target.countyId !==
        expectedCountyId
      ) {
        evaluatorInconsistency++;

        addIssue(
          issues,
          "EVALUATOR_INCONSISTENCY",
          `Semantic mapping ${identityKey} targets SubCounty ${targetId}, but that SubCounty belongs to County ${target.countyId}, not expected County ${expectedCountyId}.`
        );

        ownershipRows.push({
          gid,
          authoritativeCounty,
          authoritativeSubCounty,
          authoritativeWard,
          normalizedCounty,
          normalizedSubCounty,
          identityKey,
          expectedCountyId,
          expectedCountyName,
          candidateSubCountyIds,
          candidateSubCountyNames,
          actualWardId:
            actualWard.id,
          actualWardName:
            actualWard.name,
          actualCountyId:
            actualWard.countyId,
          actualCountyName,
          actualSubCountyId:
            actualWard.subCountyId,
          actualSubCountyName,
          resolutionState:
            "EVALUATOR_INCONSISTENCY",
          resolutionReason:
            `Verified semantic mapping points to a SubCounty in the wrong County.`,
        });

        continue;
      }

      if (
        actualWard.subCountyId ===
        targetId
      ) {
        knownSemanticMatch++;

        ownershipRows.push({
          gid,
          authoritativeCounty,
          authoritativeSubCounty,
          authoritativeWard,
          normalizedCounty,
          normalizedSubCounty,
          identityKey,
          expectedCountyId,
          expectedCountyName,
          candidateSubCountyIds,
          candidateSubCountyNames,
          actualWardId:
            actualWard.id,
          actualWardName:
            actualWard.name,
          actualCountyId:
            actualWard.countyId,
          actualCountyName,
          actualSubCountyId:
            actualWard.subCountyId,
          actualSubCountyName,
          resolutionState:
            "KNOWN_SEMANTIC_MATCH",
          resolutionReason:
            semanticMapping.reason,
        });
      } else {
        wrongSubCounty++;

        ownershipRows.push({
          gid,
          authoritativeCounty,
          authoritativeSubCounty,
          authoritativeWard,
          normalizedCounty,
          normalizedSubCounty,
          identityKey,
          expectedCountyId,
          expectedCountyName,
          candidateSubCountyIds,
          candidateSubCountyNames,
          actualWardId:
            actualWard.id,
          actualWardName:
            actualWard.name,
          actualCountyId:
            actualWard.countyId,
          actualCountyName,
          actualSubCountyId:
            actualWard.subCountyId,
          actualSubCountyName,
          resolutionState:
            "WRONG_SUBCOUNTY",
          resolutionReason:
            `Verified semantic target is SubCounty ${targetId}, but actual Ward references SubCounty ${actualWard.subCountyId}.`,
        });
      }

      continue;
    }

    /*
     * No semantic mapping.
     *
     * Candidate cardinality determines the evaluator state.
     */

    if (
      candidateSubCountyIds.length === 0
    ) {
      targetUnresolved++;

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        normalizedCounty,
        normalizedSubCounty,
        identityKey,
        expectedCountyId,
        expectedCountyName,
        candidateSubCountyIds,
        candidateSubCountyNames,
        actualWardId:
          actualWard.id,
        actualWardName:
          actualWard.name,
        actualCountyId:
          actualWard.countyId,
        actualCountyName,
        actualSubCountyId:
          actualWard.subCountyId,
        actualSubCountyName,
        resolutionState:
          "TARGET_UNRESOLVED",
        resolutionReason:
          `No current SubCounty resolves to "${identityKey}".`,
      });

      continue;
    }

    if (
      candidateSubCountyIds.length > 1
    ) {
      ambiguous++;

      addIssue(
        issues,
        "SUBCOUNTY_IDENTITY_AMBIGUOUS",
        `GID ${gid} authoritative identity "${identityKey}" resolves to multiple SubCounty IDs: ${candidateSubCountyIds.join(", ")}`
      );

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        normalizedCounty,
        normalizedSubCounty,
        identityKey,
        expectedCountyId,
        expectedCountyName,
        candidateSubCountyIds,
        candidateSubCountyNames,
        actualWardId:
          actualWard.id,
        actualWardName:
          actualWard.name,
        actualCountyId:
          actualWard.countyId,
        actualCountyName,
        actualSubCountyId:
          actualWard.subCountyId,
        actualSubCountyName,
        resolutionState:
          "AMBIGUOUS",
        resolutionReason:
          `Multiple current SubCounty records resolve to the same normalized identity.`,
      });

      continue;
    }

    const expectedSubCountyId =
      candidateSubCountyIds[0];

    const expectedSubCounty =
      subCountyById.get(
        expectedSubCountyId
      );

    if (!expectedSubCounty) {
      evaluatorInconsistency++;

      addIssue(
        issues,
        "EVALUATOR_INCONSISTENCY",
        `Candidate SubCounty ${expectedSubCountyId} was returned by the candidate index but cannot be found in subCountyById.`
      );

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        normalizedCounty,
        normalizedSubCounty,
        identityKey,
        expectedCountyId,
        expectedCountyName,
        candidateSubCountyIds,
        candidateSubCountyNames,
        actualWardId:
          actualWard.id,
        actualWardName:
          actualWard.name,
        actualCountyId:
          actualWard.countyId,
        actualCountyName,
        actualSubCountyId:
          actualWard.subCountyId,
        actualSubCountyName,
        resolutionState:
          "EVALUATOR_INCONSISTENCY",
        resolutionReason:
          "Candidate index returned a SubCounty ID that is absent from the primary SubCounty index.",
      });

      continue;
    }

    /*
     * Exact textual identity.
     */

    const exactCounty =
      expectedCountyName !== null &&
      authoritativeCounty
        .trim()
        .toLowerCase() ===
        expectedCountyName
          .trim()
          .toLowerCase();

    const exactSubCounty =
      authoritativeSubCounty
        .trim()
        .toLowerCase() ===
      expectedSubCounty.name
        .trim()
        .toLowerCase();

    if (
      exactCounty &&
      exactSubCounty
    ) {
      if (
        actualWard.subCountyId ===
        expectedSubCountyId
      ) {
        exactMatch++;

        ownershipRows.push({
          gid,
          authoritativeCounty,
          authoritativeSubCounty,
          authoritativeWard,
          normalizedCounty,
          normalizedSubCounty,
          identityKey,
          expectedCountyId,
          expectedCountyName,
          candidateSubCountyIds,
          candidateSubCountyNames,
          actualWardId:
            actualWard.id,
          actualWardName:
            actualWard.name,
          actualCountyId:
            actualWard.countyId,
          actualCountyName,
          actualSubCountyId:
            actualWard.subCountyId,
          actualSubCountyName,
          resolutionState:
            "EXACT_MATCH",
          resolutionReason:
            "Authoritative County and SubCounty names exactly match the unique database identity.",
        });
      } else {
        wrongSubCounty++;

        ownershipRows.push({
          gid,
          authoritativeCounty,
          authoritativeSubCounty,
          authoritativeWard,
          normalizedCounty,
          normalizedSubCounty,
          identityKey,
          expectedCountyId,
          expectedCountyName,
          candidateSubCountyIds,
          candidateSubCountyNames,
          actualWardId:
            actualWard.id,
          actualWardName:
            actualWard.name,
          actualCountyId:
            actualWard.countyId,
          actualCountyName,
          actualSubCountyId:
            actualWard.subCountyId,
          actualSubCountyName,
          resolutionState:
            "WRONG_SUBCOUNTY",
          resolutionReason:
            `Unique authoritative identity resolves to SubCounty ${expectedSubCountyId}, but actual Ward references SubCounty ${actualWard.subCountyId}.`,
        });
      }

      continue;
    }

    /*
     * Normalized identity match.
     */

    if (
      actualWard.subCountyId ===
      expectedSubCountyId
    ) {
      normalizedMatch++;

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        normalizedCounty,
        normalizedSubCounty,
        identityKey,
        expectedCountyId,
        expectedCountyName,
        candidateSubCountyIds,
        candidateSubCountyNames,
        actualWardId:
          actualWard.id,
        actualWardName:
          actualWard.name,
        actualCountyId:
          actualWard.countyId,
        actualCountyName,
        actualSubCountyId:
          actualWard.subCountyId,
        actualSubCountyName,
        resolutionState:
          "NORMALIZED_MATCH",
        resolutionReason:
          "Authoritative identity resolves uniquely after deterministic normalization.",
      });
    } else {
      wrongSubCounty++;

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        normalizedCounty,
        normalizedSubCounty,
        identityKey,
        expectedCountyId,
        expectedCountyName,
        candidateSubCountyIds,
        candidateSubCountyNames,
        actualWardId:
          actualWard.id,
        actualWardName:
          actualWard.name,
        actualCountyId:
          actualWard.countyId,
        actualCountyName,
        actualSubCountyId:
          actualWard.subCountyId,
        actualSubCountyName,
        resolutionState:
          "WRONG_SUBCOUNTY",
        resolutionReason:
          `Unique normalized identity resolves to SubCounty ${expectedSubCountyId}, but actual Ward references SubCounty ${actualWard.subCountyId}.`,
      });
    }
  }

  console.log(
    `  EXACT_MATCH: ${exactMatch}`
  );

  console.log(
    `  NORMALIZED_MATCH: ${normalizedMatch}`
  );

  console.log(
    `  KNOWN_SEMANTIC_MATCH: ${knownSemanticMatch}`
  );

  console.log(
    `  AMBIGUOUS: ${ambiguous}`
  );

  console.log(
    `  TARGET_UNRESOLVED: ${targetUnresolved}`
  );

  console.log(
    `  WRONG_SUBCOUNTY: ${wrongSubCounty}`
  );

  console.log(
    `  WARD_NOT_FOUND: ${wardNotFound}`
  );

  console.log(
    `  EVALUATOR_INCONSISTENCY: ${evaluatorInconsistency}`
  );

  const reconciledRows =
    exactMatch +
    normalizedMatch +
    knownSemanticMatch +
    ambiguous +
    targetUnresolved +
    wrongSubCounty +
    wardNotFound +
    evaluatorInconsistency;

  if (
    reconciledRows !==
    authoritativeRows.length
  ) {
    addIssue(
      issues,
      "EVALUATOR_INCONSISTENCY",
      `Ownership reconciliation produced ${reconciledRows} classified rows, but authoritative source contains ${authoritativeRows.length} features.`
    );

    evaluatorInconsistency++;
  }

  // ==========================================================
  // 11. EXPLICIT TIATY CHECK
  // ==========================================================

  console.log("");
  console.log(
    "[11/13] Verifying Tiaty V15.2..."
  );

  const tiatyExpectedGids =
    [
      781,
      782,
      783,
      784,
      785,
      786,
      787,
    ];

  const tiatyTargetId = 757;
  const tiatyOldId = 463;

  let tiatyCorrect = 0;
  let tiatyOldOwnerRemaining = 0;
  let tiatyMissing = 0;

  for (
    const gid of
      tiatyExpectedGids
  ) {
    const ward =
      wardBySourceGid.get(
        gid
      );

    if (!ward) {
      tiatyMissing++;
      continue;
    }

    if (
      ward.subCountyId ===
      tiatyTargetId
    ) {
      tiatyCorrect++;
    }

    if (
      ward.subCountyId ===
      tiatyOldId
    ) {
      tiatyOldOwnerRemaining++;
    }
  }

  console.log(
    `  Expected: ${tiatyExpectedGids.length}`
  );

  console.log(
    `  Correct target 757: ${tiatyCorrect}`
  );

  console.log(
    `  Still on 463: ${tiatyOldOwnerRemaining}`
  );

  console.log(
    `  Missing: ${tiatyMissing}`
  );

  if (
    tiatyCorrect !== 7
  ) {
    addIssue(
      issues,
      "TIATY_V15_2",
      `Expected 7 Tiaty wards to reference SubCounty 757 but found ${tiatyCorrect}.`
    );
  }

  if (
    tiatyOldOwnerRemaining !== 0
  ) {
    addIssue(
      issues,
      "TIATY_V15_2",
      `${tiatyOldOwnerRemaining} Tiaty wards still reference SubCounty 463.`
    );
  }

  if (
    tiatyMissing !== 0
  ) {
    addIssue(
      issues,
      "TIATY_V15_2",
      `${tiatyMissing} expected Tiaty wards are missing.`
    );
  }

  // ==========================================================
  // 12. V15 DELETED-ID VERIFICATION
  // ==========================================================

  console.log("");
  console.log(
    "[12/13] Checking V15 deleted SubCounty IDs..."
  );

  let deletedIds:
    number[] = [];

  let deletionLogFound =
    false;

  if (
    fs.existsSync(
      DELETION_LOG_PATH
    )
  ) {
    deletionLogFound = true;

    const deletionLog =
      JSON.parse(
        fs.readFileSync(
          DELETION_LOG_PATH,
          "utf8"
        )
      );

    deletedIds =
      extractDeletedIds(
        deletionLog
      );
  } else {
    addIssue(
      issues,
      "V15_DELETION_LOG",
      "V15 deletion log was not found.",
      "WARNING"
    );
  }

  console.log(
    `  Deletion log found: ${deletionLogFound}`
  );

  console.log(
    `  V15 deleted IDs loaded: ${deletedIds.length}`
  );

  if (
    deletionLogFound &&
    deletedIds.length !== 122
  ) {
    addIssue(
      issues,
      "V15_DELETION_LOG",
      `Expected to recover 122 deleted SubCounty IDs from the V15 log but recovered ${deletedIds.length}.`,
      "WARNING"
    );
  }

  const deletedIdSet =
    new Set(deletedIds);

  const deletedIdsStillInDatabase =
    deletedIds.filter(
      (id) =>
        subCountyById.has(id)
    );

  if (
    deletedIdsStillInDatabase.length >
    0
  ) {
    addIssue(
      issues,
      "V15_DELETED_ID_STILL_EXISTS",
      `V15-deleted SubCounty IDs still exist in the current SubCounty table: ${deletedIdsStillInDatabase.join(", ")}`
    );
  }

  const deletedIdWardRefs =
    wards.filter(
      (ward) =>
        ward.subCountyId !== null &&
        deletedIdSet.has(
          ward.subCountyId
        )
    ).length;

  const deletedIdFarmerRefs =
    farmers.filter(
      (farmer) =>
        farmer.subCountyId !== null &&
        deletedIdSet.has(
          farmer.subCountyId
        )
    ).length;

  const deletedIdFarmRefs =
    farms.filter(
      (farm) =>
        farm.subCountyId !== null &&
        deletedIdSet.has(
          farm.subCountyId
        )
    ).length;

  const deletedIdBusinessPartnerRefs =
    businessPartners.filter(
      (partner) =>
        partner.subCountyId !== null &&
        deletedIdSet.has(
          partner.subCountyId
        )
    ).length;

  const deletedIdCommoditySourceRefs =
    commodityTransactions.filter(
      (transaction) =>
        transaction.sourceSubCountyId !==
          null &&
        deletedIdSet.has(
          transaction.sourceSubCountyId
        )
    ).length;

  const deletedIdCommodityDestinationRefs =
    commodityTransactions.filter(
      (transaction) =>
        transaction.destinationSubCountyId !==
          null &&
        deletedIdSet.has(
          transaction.destinationSubCountyId
        )
    ).length;

  const totalDeletedIdRefs =
    deletedIdWardRefs +
    deletedIdFarmerRefs +
    deletedIdFarmRefs +
    deletedIdBusinessPartnerRefs +
    deletedIdCommoditySourceRefs +
    deletedIdCommodityDestinationRefs;

  console.log(
    `  Deleted IDs still present: ${deletedIdsStillInDatabase.length}`
  );

  console.log(
    `  Ward refs: ${deletedIdWardRefs}`
  );

  console.log(
    `  Farmer refs: ${deletedIdFarmerRefs}`
  );

  console.log(
    `  Farm refs: ${deletedIdFarmRefs}`
  );

  console.log(
    `  BusinessPartner refs: ${deletedIdBusinessPartnerRefs}`
  );

  console.log(
    `  Commodity source refs: ${deletedIdCommoditySourceRefs}`
  );

  console.log(
    `  Commodity destination refs: ${deletedIdCommodityDestinationRefs}`
  );

  if (
    totalDeletedIdRefs > 0
  ) {
    addIssue(
      issues,
      "V15_DELETED_ID_ORPHANS",
      `Found ${totalDeletedIdRefs} references to V15-deleted SubCounty IDs.`
    );
  }

  // ==========================================================
  // 13. FINAL REPORT
  // ==========================================================

  console.log("");
  console.log(
    "[13/13] Writing final audit reports..."
  );

  const errorCount =
    issues.filter(
      (issue) =>
        issue.severity ===
        "ERROR"
    ).length;

  const warningCount =
    issues.filter(
      (issue) =>
        issue.severity ===
        "WARNING"
    ).length;

  /*
   * Important:
   *
   * The audit is PASS only when there are no
   * structural errors, wrong ownership, ambiguity,
   * unresolved targets, or evaluator inconsistencies.
   */

  const status =
    errorCount === 0
      ? "PASS"
      : "FAIL";

  const report = {
    auditVersion:
      "V15.3.1",

    mode:
      "READ_ONLY",

    status,

    generatedAt:
      new Date().toISOString(),

    authoritativeSource: {
      file:
        "prisma/data/kenya-wards-1450.geojson",
      features:
        features.length,
      numericGids:
        authoritativeGids.length,
      uniqueGids:
        authoritativeGidSet.size,
    },

    databaseCounts: {
      counties:
        counties.length,
      subCounties:
        subCounties.length,
      wards:
        wards.length,
      farmers:
        farmers.length,
      farms:
        farms.length,
      businessPartners:
        businessPartners.length,
      commodityTransactions:
        commodityTransactions.length,
    },

    sourceGidIntegrity: {
      databaseSourceGids:
        databaseGids.length,
      uniqueDatabaseSourceGids:
        databaseGidSet.size,
      duplicateDatabaseSourceGids:
        duplicateDatabaseSourceGids.size,
      missingAuthoritativeGids:
        missingDatabaseGids.length,
      unexpectedDatabaseGids:
        unexpectedDatabaseGids.length,
    },

    subCountyIdentityIntegrity: {
      duplicateNormalizedIdentities:
        duplicateSubCountyIdentities.length,

      duplicateIdentities:
        duplicateSubCountyIdentities.map(
          ([identity, ids]) => ({
            identity,
            ids,
            names:
              ids.map(
                (id) =>
                  subCountyById.get(
                    id
                  )?.name ?? null
              ),
          })
        ),
    },

    wardForeignKeyIntegrity: {
      nullSubCounty:
        wardNullSubCounty,
      missingSubCounty:
        wardMissingSubCounty,
      missingCounty:
        wardMissingCounty,
      countySubCountyMismatches:
        wardCountyMismatch,
    },

    applicationForeignKeyIntegrity: {
      farmerInvalid,
      farmInvalid,
      businessPartnerInvalid,
      commoditySourceInvalid,
      commodityDestinationInvalid,
    },

    reconciliation: {
      totalAuthoritativeRows:
        authoritativeRows.length,

      exactMatch,

      normalizedMatch,

      knownSemanticMatch,

      ambiguous,

      targetUnresolved,

      wrongSubCounty,

      wardNotFound,

      evaluatorInconsistency,

      classifiedRows:
        reconciledRows,
    },

    tiatyV15_2: {
      expectedGids:
        tiatyExpectedGids,

      targetSubCountyId:
        tiatyTargetId,

      oldSubCountyId:
        tiatyOldId,

      correctTargetCount:
        tiatyCorrect,

      oldOwnerRemaining:
        tiatyOldOwnerRemaining,

      missing:
        tiatyMissing,
    },

    v15DeletedIds: {
      deletionLogFound,

      count:
        deletedIds.length,

      deletedIdsStillInDatabase:
        deletedIdsStillInDatabase.length,

      wardRefs:
        deletedIdWardRefs,

      farmerRefs:
        deletedIdFarmerRefs,

      farmRefs:
        deletedIdFarmRefs,

      businessPartnerRefs:
        deletedIdBusinessPartnerRefs,

      commoditySourceRefs:
        deletedIdCommoditySourceRefs,

      commodityDestinationRefs:
        deletedIdCommodityDestinationRefs,

      totalRefs:
        totalDeletedIdRefs,
    },

    issueSummary: {
      errors:
        errorCount,

      warnings:
        warningCount,

      total:
        issues.length,
    },

    issues,

    ownershipRows,
  };

  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(
      report,
      null,
      2
    ),
    "utf8"
  );

  const csvHeader = [
    "gid",
    "authoritativeCounty",
    "authoritativeSubCounty",
    "authoritativeWard",
    "normalizedCounty",
    "normalizedSubCounty",
    "identityKey",
    "expectedCountyId",
    "expectedCountyName",
    "candidateSubCountyIds",
    "candidateSubCountyNames",
    "actualWardId",
    "actualWardName",
    "actualCountyId",
    "actualCountyName",
    "actualSubCountyId",
    "actualSubCountyName",
    "resolutionState",
    "resolutionReason",
  ];

  const csvRows =
    ownershipRows.map(
      (row) =>
        [
          row.gid,
          row.authoritativeCounty,
          row.authoritativeSubCounty,
          row.authoritativeWard,
          row.normalizedCounty,
          row.normalizedSubCounty,
          row.identityKey,
          row.expectedCountyId,
          row.expectedCountyName,
          row.candidateSubCountyIds.join(
            "|"
          ),
          row.candidateSubCountyNames.join(
            "|"
          ),
          row.actualWardId,
          row.actualWardName,
          row.actualCountyId,
          row.actualCountyName,
          row.actualSubCountyId,
          row.actualSubCountyName,
          row.resolutionState,
          row.resolutionReason,
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

  // ==========================================================
  // FINAL CONSOLE SUMMARY
  // ==========================================================

  console.log("");
  console.log(
    "============================================================"
  );
  console.log(
    "FINAL V15.3.1 RESULT"
  );
  console.log(
    "============================================================"
  );

  console.log(
    `STATUS: ${status}`
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

  console.log(
    `Duplicate SubCounty identities: ${duplicateSubCountyIdentities.length}`
  );

  console.log("");

  console.log(
    `EXACT_MATCH: ${exactMatch}`
  );

  console.log(
    `NORMALIZED_MATCH: ${normalizedMatch}`
  );

  console.log(
    `KNOWN_SEMANTIC_MATCH: ${knownSemanticMatch}`
  );

  console.log(
    `AMBIGUOUS: ${ambiguous}`
  );

  console.log(
    `TARGET_UNRESOLVED: ${targetUnresolved}`
  );

  console.log(
    `WRONG_SUBCOUNTY: ${wrongSubCounty}`
  );

  console.log(
    `WARD_NOT_FOUND: ${wardNotFound}`
  );

  console.log(
    `EVALUATOR_INCONSISTENCY: ${evaluatorInconsistency}`
  );

  console.log("");

  console.log(
    `Tiaty correct: ${tiatyCorrect}/7`
  );

  console.log(
    `V15 deleted IDs loaded: ${deletedIds.length}`
  );

  console.log(
    `V15 deleted-ID references: ${totalDeletedIdRefs}`
  );

  console.log("");

  console.log(
    `Errors: ${errorCount}`
  );

  console.log(
    `Warnings: ${warningCount}`
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

  console.log("");

  if (
    status === "FAIL"
  ) {
    console.log(
      "AUDIT FAILED."
    );

    console.log(
      "No database mutations were performed."
    );

    console.log(
      "Review AMBIGUOUS, TARGET_UNRESOLVED, WRONG_SUBCOUNTY, and EVALUATOR_INCONSISTENCY rows."
    );

    process.exitCode = 1;
  } else {
    console.log(
      "AUDIT PASSED."
    );

    console.log(
      "No database mutations were performed."
    );
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "AUDIT EXECUTION ERROR"
    );
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });