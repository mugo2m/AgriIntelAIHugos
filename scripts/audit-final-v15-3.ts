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

const OUTPUT_JSON = path.join(
  process.cwd(),
  "prisma",
  "data",
  "final-database-integrity-audit-v15-3.json"
);

const OUTPUT_CSV = path.join(
  process.cwd(),
  "prisma",
  "data",
  "final-database-integrity-audit-v15-3.csv"
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

type Issue = {
  category: string;
  severity: "ERROR" | "WARNING";
  details: string;
};

type OwnershipStatus =
  | "CORRECT"
  | "WRONG_SUBCOUNTY"
  | "TARGET_UNRESOLVED"
  | "WARD_NOT_FOUND";

type OwnershipRow = {
  gid: number;
  authoritativeCounty: string;
  authoritativeSubCounty: string;
  authoritativeWard: string;
  expectedCountyId: number | null;
  expectedSubCountyId: number | null;
  actualWardId: number | null;
  actualCountyId: number | null;
  actualSubCountyId: number | null;
  actualSubCountyName: string | null;
  status: OwnershipStatus;
};

function normalizeCounty(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeSubCounty(value: string | null | undefined): string {
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
  severity: "ERROR" | "WARNING" = "ERROR"
): void {
  issues.push({
    category,
    severity,
    details,
  });
}

async function main(): Promise<void> {
  console.log("");
  console.log("============================================================");
  console.log("FINAL DATABASE INTEGRITY AUDIT V15.3");
  console.log("============================================================");
  console.log("MODE: READ-ONLY");
  console.log("NO INSERT / UPDATE / DELETE");
  console.log("");

  const issues: Issue[] = [];

  // ==========================================================
  // 1. LOAD AUTHORITATIVE GEOJSON
  // ==========================================================

  console.log("[1/11] Loading authoritative ward GeoJSON...");

  if (!fs.existsSync(GEOJSON_PATH)) {
    throw new Error(`GeoJSON file not found: ${GEOJSON_PATH}`);
  }

  const geojson = JSON.parse(
    fs.readFileSync(GEOJSON_PATH, "utf8")
  ) as GeoJSON;

  const features = Array.isArray(geojson.features)
    ? geojson.features
    : [];

  const authoritativeGids = features
    .map((feature) => Number(feature.properties?.gid))
    .filter((gid) => Number.isFinite(gid));

  const authoritativeGidSet = new Set<number>(
    authoritativeGids
  );

  console.log(`  GeoJSON features: ${features.length}`);
  console.log(`  Numeric GIDs: ${authoritativeGids.length}`);
  console.log(`  Unique GIDs: ${authoritativeGidSet.size}`);

  if (features.length !== 1450) {
    addIssue(
      issues,
      "AUTHORITATIVE_SOURCE",
      `Expected 1450 GeoJSON features but found ${features.length}.`
    );
  }

  if (authoritativeGids.length !== 1450) {
    addIssue(
      issues,
      "AUTHORITATIVE_SOURCE",
      `Expected 1450 numeric GIDs but found ${authoritativeGids.length}.`
    );
  }

  if (authoritativeGidSet.size !== 1450) {
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
  console.log("[2/11] Loading database geography...");

  const [counties, subCounties, wards] = await Promise.all([
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

  console.log(`  Counties: ${counties.length}`);
  console.log(`  SubCounties: ${subCounties.length}`);
  console.log(`  Wards: ${wards.length}`);

  if (counties.length !== 47) {
    addIssue(
      issues,
      "DATABASE_COUNTS",
      `Expected 47 counties but found ${counties.length}.`
    );
  }

  if (subCounties.length !== 417) {
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
  // 3. BUILD RELATIONAL LOOKUPS
  // ==========================================================

  console.log("");
  console.log("[3/11] Building relational lookup indexes...");

  const countyById = new Map<
    number,
    (typeof counties)[number]
  >();

  for (const county of counties) {
    countyById.set(county.id, county);
  }

  const subCountyById = new Map<
    number,
    (typeof subCounties)[number]
  >();

  for (const subCounty of subCounties) {
    subCountyById.set(subCounty.id, subCounty);
  }

  const wardBySourceGid = new Map<
    number,
    (typeof wards)[number]
  >();

  const duplicateDatabaseSourceGids: number[] = [];

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

    const gid = Number(ward.sourceGid);

    if (wardBySourceGid.has(gid)) {
      duplicateDatabaseSourceGids.push(gid);
    } else {
      wardBySourceGid.set(gid, ward);
    }
  }

  if (duplicateDatabaseSourceGids.length > 0) {
    addIssue(
      issues,
      "SOURCE_GID_INTEGRITY",
      `Duplicate database sourceGIDs: ${duplicateDatabaseSourceGids.join(", ")}`
    );
  }

  // ==========================================================
  // 4. SUBCOUNTY IDENTITY INTEGRITY
  // ==========================================================

  console.log("");
  console.log("[4/11] Checking SubCounty identity integrity...");

  const subCountyIdentityMap = new Map<
    string,
    number[]
  >();

  for (const subCounty of subCounties) {
    const county = countyById.get(subCounty.countyId);

    if (!county) {
      addIssue(
        issues,
        "SUBCOUNTY_FK",
        `SubCounty ${subCounty.id} references missing County ${subCounty.countyId}.`
      );
      continue;
    }

    const countyKey = normalizeCounty(county.name);
    const subCountyKey = normalizeSubCounty(subCounty.name);

    const identityKey =
      `${countyKey}|${subCountyKey}`;

    const existing =
      subCountyIdentityMap.get(identityKey) ?? [];

    existing.push(subCounty.id);

    subCountyIdentityMap.set(
      identityKey,
      existing
    );
  }

  const duplicateSubCountyIdentities =
    Array.from(subCountyIdentityMap.entries())
      .filter(([, ids]) => ids.length > 1);

  console.log(
    `  Duplicate normalized identities: ${duplicateSubCountyIdentities.length}`
  );

  for (const [identity, ids] of duplicateSubCountyIdentities) {
    addIssue(
      issues,
      "SUBCOUNTY_DUPLICATE_IDENTITY",
      `Duplicate identity ${identity}: IDs ${ids.join(", ")}`
    );
  }

  // ==========================================================
  // 5. SOURCE GID SET INTEGRITY
  // ==========================================================

  console.log("");
  console.log("[5/11] Checking database sourceGID integrity...");

  const databaseGids = Array.from(
    wardBySourceGid.keys()
  );

  const databaseGidSet = new Set<number>(
    databaseGids
  );

  const missingDatabaseGids =
    authoritativeGids.filter(
      (gid) => !databaseGidSet.has(gid)
    );

  const unexpectedDatabaseGids =
    databaseGids.filter(
      (gid) => !authoritativeGidSet.has(gid)
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

  if (databaseGids.length !== 1450) {
    addIssue(
      issues,
      "SOURCE_GID_INTEGRITY",
      `Expected 1450 database sourceGIDs but found ${databaseGids.length}.`
    );
  }

  if (databaseGidSet.size !== 1450) {
    addIssue(
      issues,
      "SOURCE_GID_INTEGRITY",
      `Expected 1450 unique database sourceGIDs but found ${databaseGidSet.size}.`
    );
  }

  if (missingDatabaseGids.length > 0) {
    addIssue(
      issues,
      "SOURCE_GID_INTEGRITY",
      `Missing authoritative GIDs: ${missingDatabaseGids.join(", ")}`
    );
  }

  if (unexpectedDatabaseGids.length > 0) {
    addIssue(
      issues,
      "SOURCE_GID_INTEGRITY",
      `Unexpected database GIDs: ${unexpectedDatabaseGids.join(", ")}`
    );
  }

  // ==========================================================
  // 6. WARD FOREIGN KEY / COUNTY INTEGRITY
  // ==========================================================

  console.log("");
  console.log("[6/11] Checking Ward relational integrity...");

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
      subCountyById.get(ward.subCountyId);

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
      countyById.get(ward.countyId);

    if (!county) {
      wardMissingCounty++;

      addIssue(
        issues,
        "WARD_FK",
        `Ward ${ward.id} (${ward.name}) references missing County ${ward.countyId}.`
      );

      continue;
    }

    if (subCounty.countyId !== ward.countyId) {
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

  if (wardNullSubCounty > 0) {
    addIssue(
      issues,
      "WARD_FK",
      `${wardNullSubCounty} wards have NULL subCountyId.`
    );
  }

  // ==========================================================
  // 7. APPLICATION SUBCOUNTY FK INTEGRITY
  // ==========================================================

  console.log("");
  console.log("[7/11] Checking application SubCounty foreign keys...");

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
      !subCountyById.has(farmer.subCountyId)
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
      !subCountyById.has(farm.subCountyId)
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
      !subCountyById.has(partner.subCountyId)
    ) {
      businessPartnerInvalid++;

      addIssue(
        issues,
        "APPLICATION_FK",
        `BusinessPartner ${partner.id} references missing SubCounty ${partner.subCountyId}.`
      );
    }
  }

  for (const transaction of commodityTransactions) {
    if (
      transaction.sourceSubCountyId !== null &&
      transaction.sourceSubCountyId !== undefined &&
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
      transaction.destinationSubCountyId !== null &&
      transaction.destinationSubCountyId !== undefined &&
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
  // 8. AUTHORITATIVE OWNERSHIP RECONCILIATION
  //
  // NO HISTORICAL ALIASES.
  //
  // The only transformation is deterministic normalization:
  //
  // county:
  //   lowercase
  //   remove apostrophes
  //   remove non-alphanumeric characters
  //
  // subcounty:
  //   lowercase
  //   remove "sub county"
  //   remove apostrophes
  //   remove non-alphanumeric characters
  //
  // Identity:
  //
  //   normalized county
  //   +
  //   normalized subcounty
  // ==========================================================

  console.log("");
  console.log(
    "[8/11] Reconciling authoritative ward ownership..."
  );

  const countyIdentityMap =
    new Map<string, number>();

  for (const county of counties) {
    const key =
      normalizeCounty(county.name);

    if (countyIdentityMap.has(key)) {
      addIssue(
        issues,
        "COUNTY_IDENTITY",
        `Multiple counties resolve to normalized identity ${key}.`
      );
    }

    countyIdentityMap.set(
      key,
      county.id
    );
  }

  const canonicalSubCountyMap =
    new Map<string, number>();

  for (const subCounty of subCounties) {
    const county =
      countyById.get(subCounty.countyId);

    if (!county) {
      continue;
    }

    const countyKey =
      normalizeCounty(county.name);

    const subCountyKey =
      normalizeSubCounty(subCounty.name);

    const identityKey =
      `${countyKey}|${subCountyKey}`;

    if (
      canonicalSubCountyMap.has(
        identityKey
      )
    ) {
      const existing =
        canonicalSubCountyMap.get(
          identityKey
        );

      if (
        existing !== undefined &&
        existing !== subCounty.id
      ) {
        addIssue(
          issues,
          "SUBCOUNTY_IDENTITY",
          `Multiple SubCounty records resolve to ${identityKey}: ${existing}, ${subCounty.id}.`
        );
      }
    } else {
      canonicalSubCountyMap.set(
        identityKey,
        subCounty.id
      );
    }
  }

  let correctOwnership = 0;
  let wrongSubCounty = 0;
  let targetUnresolved = 0;
  let wardNotFound = 0;

  const ownershipRows: OwnershipRow[] = [];

  for (const feature of features) {
    const properties =
      feature.properties ?? {};

    const gid =
      Number(properties.gid);

    const authoritativeCounty =
      String(
        properties.county ?? ""
      ).trim();

    const authoritativeSubCounty =
      String(
        properties.subcounty ?? ""
      ).trim();

    const authoritativeWard =
      String(
        properties.ward ?? ""
      ).trim();

    const countyKey =
      normalizeCounty(
        authoritativeCounty
      );

    const subCountyKey =
      normalizeSubCounty(
        authoritativeSubCounty
      );

    const expectedCountyId =
      countyIdentityMap.get(
        countyKey
      ) ?? null;

    const identityKey =
      `${countyKey}|${subCountyKey}`;

    const expectedSubCountyId =
      canonicalSubCountyMap.get(
        identityKey
      ) ?? null;

    const actualWard =
      wardBySourceGid.get(gid);

    if (!actualWard) {
      wardNotFound++;

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        expectedCountyId,
        expectedSubCountyId,
        actualWardId: null,
        actualCountyId: null,
        actualSubCountyId: null,
        actualSubCountyName: null,
        status: "WARD_NOT_FOUND",
      });

      continue;
    }

    if (
      expectedCountyId === null ||
      expectedSubCountyId === null
    ) {
      targetUnresolved++;

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        expectedCountyId,
        expectedSubCountyId,
        actualWardId: actualWard.id,
        actualCountyId: actualWard.countyId,
        actualSubCountyId:
          actualWard.subCountyId,
        actualSubCountyName:
          actualWard.subCountyId !== null
            ? subCountyById.get(
                actualWard.subCountyId
              )?.name ?? null
            : null,
        status: "TARGET_UNRESOLVED",
      });

      continue;
    }

    if (
      actualWard.subCountyId ===
      expectedSubCountyId
    ) {
      correctOwnership++;

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        expectedCountyId,
        expectedSubCountyId,
        actualWardId: actualWard.id,
        actualCountyId: actualWard.countyId,
        actualSubCountyId:
          actualWard.subCountyId,
        actualSubCountyName:
          actualWard.subCountyId !== null
            ? subCountyById.get(
                actualWard.subCountyId
              )?.name ?? null
            : null,
        status: "CORRECT",
      });
    } else {
      wrongSubCounty++;

      ownershipRows.push({
        gid,
        authoritativeCounty,
        authoritativeSubCounty,
        authoritativeWard,
        expectedCountyId,
        expectedSubCountyId,
        actualWardId: actualWard.id,
        actualCountyId: actualWard.countyId,
        actualSubCountyId:
          actualWard.subCountyId,
        actualSubCountyName:
          actualWard.subCountyId !== null
            ? subCountyById.get(
                actualWard.subCountyId
              )?.name ?? null
            : null,
        status: "WRONG_SUBCOUNTY",
      });
    }
  }

  console.log(
    `  CORRECT: ${correctOwnership}`
  );

  console.log(
    `  WRONG_SUBCOUNTY: ${wrongSubCounty}`
  );

  console.log(
    `  TARGET_UNRESOLVED: ${targetUnresolved}`
  );

  console.log(
    `  WARD_NOT_FOUND: ${wardNotFound}`
  );

  if (correctOwnership !== 1450) {
    addIssue(
      issues,
      "WARD_OWNERSHIP",
      `Expected 1450 correct authoritative ownership rows but found ${correctOwnership}.`
    );
  }

  if (wrongSubCounty > 0) {
    addIssue(
      issues,
      "WARD_OWNERSHIP",
      `${wrongSubCounty} wards have incorrect SubCounty ownership.`
    );
  }

  if (targetUnresolved > 0) {
    addIssue(
      issues,
      "WARD_OWNERSHIP",
      `${targetUnresolved} authoritative wards could not resolve to a current County + SubCounty identity.`
    );
  }

  if (wardNotFound > 0) {
    addIssue(
      issues,
      "WARD_OWNERSHIP",
      `${wardNotFound} authoritative wards could not be found by sourceGid.`
    );
  }

  // ==========================================================
  // 9. EXPLICIT TIATY V15.2 CHECK
  //
  // GIDs 781-787 must now reference SubCounty 757.
  // None may reference old SubCounty 463.
  // ==========================================================

  console.log("");
  console.log(
    "[9/11] Verifying Tiaty V15.2 reassignment..."
  );

  const tiatyExpectedGids = [
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

  for (const gid of tiatyExpectedGids) {
    const ward =
      wardBySourceGid.get(gid);

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
    `  Expected Tiaty GIDs: ${tiatyExpectedGids.length}`
  );

  console.log(
    `  Correct target 757: ${tiatyCorrect}`
  );

  console.log(
    `  Still owned by 463: ${tiatyOldOwnerRemaining}`
  );

  console.log(
    `  Missing: ${tiatyMissing}`
  );

  if (tiatyCorrect !== 7) {
    addIssue(
      issues,
      "TIATY_V15_2",
      `Expected 7 Tiaty wards to reference SubCounty 757 but found ${tiatyCorrect}.`
    );
  }

  if (tiatyOldOwnerRemaining !== 0) {
    addIssue(
      issues,
      "TIATY_V15_2",
      `${tiatyOldOwnerRemaining} Tiaty wards still reference SubCounty 463.`
    );
  }

  if (tiatyMissing !== 0) {
    addIssue(
      issues,
      "TIATY_V15_2",
      `${tiatyMissing} expected Tiaty wards are missing.`
    );
  }

  // ==========================================================
  // 10. V15 DELETED-ID ORPHAN CHECK
  // ==========================================================

  console.log("");
  console.log(
    "[10/11] Checking V15 deleted SubCounty IDs..."
  );

  const deletionLogPath =
    path.join(
      process.cwd(),
      "prisma",
      "data",
      "deletion-log-v15.json"
    );

  let deletedIds: number[] = [];

  if (
    fs.existsSync(
      deletionLogPath
    )
  ) {
    const deletionLog =
      JSON.parse(
        fs.readFileSync(
          deletionLogPath,
          "utf8"
        )
      ) as any;

    if (
      Array.isArray(
        deletionLog.deletedIds
      )
    ) {
      deletedIds =
        deletionLog.deletedIds
          .map((id: unknown) =>
            Number(id)
          )
          .filter((id: number) =>
            Number.isFinite(id)
          );
    } else if (
      Array.isArray(
        deletionLog.results
      )
    ) {
      deletedIds =
        deletionLog.results
          .map((row: any) =>
            Number(
              row.oldSubCountyId ??
              row.subCountyId ??
              row.deletedSubCountyId
            )
          )
          .filter((id: number) =>
            Number.isFinite(id)
          );
    }
  } else {
    addIssue(
      issues,
      "V15_DELETION_LOG",
      "V15 deletion log was not found.",
      "WARNING"
    );
  }

  deletedIds =
    Array.from(
      new Set(deletedIds)
    );

  console.log(
    `  V15 deleted IDs loaded: ${deletedIds.length}`
  );

  let deletedIdWardRefs = 0;
  let deletedIdFarmerRefs = 0;
  let deletedIdFarmRefs = 0;
  let deletedIdBusinessPartnerRefs = 0;
  let deletedIdCommoditySourceRefs = 0;
  let deletedIdCommodityDestinationRefs = 0;

  if (deletedIds.length > 0) {
    const deletedIdSet =
      new Set(deletedIds);

    deletedIdWardRefs =
      wards.filter(
        (ward) =>
          ward.subCountyId !== null &&
          deletedIdSet.has(
            ward.subCountyId
          )
      ).length;

    deletedIdFarmerRefs =
      farmers.filter(
        (farmer) =>
          farmer.subCountyId !== null &&
          deletedIdSet.has(
            farmer.subCountyId
          )
      ).length;

    deletedIdFarmRefs =
      farms.filter(
        (farm) =>
          farm.subCountyId !== null &&
          deletedIdSet.has(
            farm.subCountyId
          )
      ).length;

    deletedIdBusinessPartnerRefs =
      businessPartners.filter(
        (partner) =>
          partner.subCountyId !== null &&
          deletedIdSet.has(
            partner.subCountyId
          )
      ).length;

    deletedIdCommoditySourceRefs =
      commodityTransactions.filter(
        (transaction) =>
          transaction.sourceSubCountyId !== null &&
          deletedIdSet.has(
            transaction.sourceSubCountyId
          )
      ).length;

    deletedIdCommodityDestinationRefs =
      commodityTransactions.filter(
        (transaction) =>
          transaction.destinationSubCountyId !== null &&
          deletedIdSet.has(
            transaction.destinationSubCountyId
          )
      ).length;
  }

  const totalDeletedIdRefs =
    deletedIdWardRefs +
    deletedIdFarmerRefs +
    deletedIdFarmRefs +
    deletedIdBusinessPartnerRefs +
    deletedIdCommoditySourceRefs +
    deletedIdCommodityDestinationRefs;

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

  if (totalDeletedIdRefs > 0) {
    addIssue(
      issues,
      "V15_DELETED_ID_ORPHANS",
      `Found ${totalDeletedIdRefs} references to V15-deleted SubCounty IDs.`
    );
  }

  // ==========================================================
  // 11. FINAL REPORT
  // ==========================================================

  console.log("");
  console.log(
    "[11/11] Writing final audit reports..."
  );

  const errorCount =
    issues.filter(
      (issue) =>
        issue.severity === "ERROR"
    ).length;

  const warningCount =
    issues.filter(
      (issue) =>
        issue.severity === "WARNING"
    ).length;

  const status =
    errorCount === 0
      ? "PASS"
      : "FAIL";

  const report = {
    auditVersion: "V15.3",

    mode: "READ_ONLY",

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
        duplicateDatabaseSourceGids.length,
      missingAuthoritativeGids:
        missingDatabaseGids.length,
      unexpectedDatabaseGids:
        unexpectedDatabaseGids.length,
    },

    subCountyIntegrity: {
      duplicateNormalizedIdentities:
        duplicateSubCountyIdentities.length,
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

    authoritativeOwnership: {
      correct:
        correctOwnership,
      wrongSubCounty:
        wrongSubCounty,
      targetUnresolved:
        targetUnresolved,
      wardNotFound:
        wardNotFound,
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
      count:
        deletedIds.length,
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
    "expectedCountyId",
    "expectedSubCountyId",
    "actualWardId",
    "actualCountyId",
    "actualSubCountyId",
    "actualSubCountyName",
    "status",
  ];

  const csvRows =
    ownershipRows.map(
      (row) =>
        [
          row.gid,
          row.authoritativeCounty,
          row.authoritativeSubCounty,
          row.authoritativeWard,
          row.expectedCountyId,
          row.expectedSubCountyId,
          row.actualWardId,
          row.actualCountyId,
          row.actualSubCountyId,
          row.actualSubCountyName,
          row.status,
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
    "FINAL V15.3 RESULT"
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

  console.log(
    `Ward county mismatches: ${wardCountyMismatch}`
  );

  console.log(
    `Correct ownership: ${correctOwnership}`
  );

  console.log(
    `Wrong ownership: ${wrongSubCounty}`
  );

  console.log(
    `Unresolved ownership: ${targetUnresolved}`
  );

  console.log(
    `Ward not found: ${wardNotFound}`
  );

  console.log(
    `Tiaty correct: ${tiatyCorrect}/7`
  );

  console.log(
    `V15 deleted-ID references: ${totalDeletedIdRefs}`
  );

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

  if (status === "FAIL") {
    console.log(
      "AUDIT FAILED."
    );

    console.log(
      "Review the ERROR entries in the JSON report."
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