import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

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

type GeoFeature = {
  properties?: {
    gid?: number | string;
    county?: string;
    subcounty?: string;
    ward?: string;
    uid?: number | string;
    scuid?: number | string;
    cuid?: number | string;
    pop2009?: number | string;
  };
};

type GeoRecord = {
  gid: number;
  countyName: string;
  subCountyName: string;
  wardName: string;
  uid: number | null;
  scuid: number | null;
  cuid: number | null;
  pop2009: number | null;
};

type DatabaseWard = {
  id: number;
  name: string;
  sourceGid: number | null;
  countyId: number;
  subCountyId: number | null;
  county: {
    id: number;
    name: string;
  };
  subCounty: {
    id: number;
    name: string;
    countyId: number;
  } | null;
};

type ReviewRecord = {
  gid: number;
  wardId: number;
  wardName: string;

  authoritativeCounty: string;
  authoritativeSubCounty: string;

  databaseCounty: string;
  databaseCountyId: number;

  databaseSubCounty: string | null;
  databaseSubCountyId: number | null;

  countyIdentityMatch: boolean;
  subCountyIdentityMatch: boolean;

  status:
    | "SOURCE_DB_CONTRADICTION"
    | "UNRESOLVED";

  countyNormalizedAuthoritative: string;
  countyNormalizedDatabase: string;

  subCountyNormalizedAuthoritative: string;
  subCountyNormalizedDatabase: string | null;

  wardUid: number | null;
  wardScuid: number | null;
  wardCuid: number | null;
  population2009: number | null;
};

type GroupedContradiction = {
  authoritativeCounty: string;
  databaseCounty: string;
  databaseCountyId: number;

  authoritativeSubCounties: string[];
  databaseSubCounties: string[];

  wardCount: number;
  gids: number[];
  wardNames: string[];
};

type GroupedUnresolved = {
  authoritativeCounty: string;
  databaseCounty: string;
  databaseCountyId: number;

  authoritativeSubCounty: string;
  databaseSubCounty: string | null;
  databaseSubCountyId: number | null;

  wardCount: number;
  gids: number[];
  wardNames: string[];
};

function normalizeCounty(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeSubCounty(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\bsub[\s-]*county\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeWard(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function toNullableNumber(
  value: number | string | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n) ? n : null;
}

function loadGeoJSON(): GeoRecord[] {
  const filePath = path.resolve(
    process.cwd(),
    "prisma/data/kenya-wards-1450.geojson"
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Authoritative GeoJSON not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const geojson = JSON.parse(raw);

  if (!Array.isArray(geojson.features)) {
    throw new Error("GeoJSON does not contain a valid features array.");
  }

  const records: GeoRecord[] = [];

  for (const feature of geojson.features as GeoFeature[]) {
    const p = feature.properties ?? {};

    const gid = Number(p.gid);

    if (!Number.isInteger(gid)) {
      continue;
    }

    records.push({
      gid,
      countyName: String(p.county ?? "").trim(),
      subCountyName: String(p.subcounty ?? "").trim(),
      wardName: String(p.ward ?? "").trim(),
      uid: toNullableNumber(p.uid),
      scuid: toNullableNumber(p.scuid),
      cuid: toNullableNumber(p.cuid),
      pop2009: toNullableNumber(p.pop2009),
    });
  }

  return records;
}

function sortStrings(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) =>
    a.localeCompare(b, undefined, {
      sensitivity: "base",
    })
  );
}

function sortNumbers(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

async function main() {
  console.log("");
  console.log("=".repeat(80));
  console.log("FINAL DATABASE SEMANTIC FORENSIC AUDIT V15.9");
  console.log("92-RECORD REVIEW CLASSIFICATION");
  console.log("MODE: READ-ONLY");
  console.log("NO INSERT / UPDATE / DELETE");
  console.log("=".repeat(80));
  console.log("");

  const errors: string[] = [];
  const warnings: string[] = [];

  console.log("[1/13] Loading authoritative ward GeoJSON...");

  const geoRecords = loadGeoJSON();

  const geoGidSet = new Set<number>();

  for (const record of geoRecords) {
    geoGidSet.add(record.gid);
  }

  console.log(`  GeoJSON records: ${geoRecords.length}`);
  console.log(`  Unique GIDs: ${geoGidSet.size}`);

  if (geoRecords.length !== 1450) {
    errors.push(
      `Authoritative GeoJSON expected 1450 records but found ${geoRecords.length}.`
    );
  }

  if (geoGidSet.size !== geoRecords.length) {
    errors.push("Authoritative GeoJSON contains duplicate GIDs.");
  }

  console.log("");
  console.log("[2/13] Loading current PostgreSQL geography...");

  const [counties, subCounties, wards, farmers, farms, businessPartners, commodityTransactions] =
    await Promise.all([
      prisma.county.findMany({
        select: {
          id: true,
          name: true,
        },
      }),

      prisma.subCounty.findMany({
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      }),

      prisma.ward.findMany({
        select: {
          id: true,
          name: true,
          sourceGid: true,
          countyId: true,
          subCountyId: true,
          county: {
            select: {
              id: true,
              name: true,
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
      }),

      prisma.farmer.count(),

      prisma.farm.count(),

      prisma.businessPartner.count(),

      prisma.commodityTransaction.count(),
    ]);

  console.log(`  Counties: ${counties.length}`);
  console.log(`  SubCounties: ${subCounties.length}`);
  console.log(`  Wards: ${wards.length}`);
  console.log(`  Farmers: ${farmers}`);
  console.log(`  Farms: ${farms}`);
  console.log(`  BusinessPartners: ${businessPartners}`);
  console.log(`  CommodityTransactions: ${commodityTransactions}`);

  if (counties.length !== 47) {
    errors.push(`Expected 47 counties, found ${counties.length}.`);
  }

  if (subCounties.length !== 414) {
    errors.push(`Expected 414 SubCounties, found ${subCounties.length}.`);
  }

  if (wards.length !== 1450) {
    errors.push(`Expected 1450 wards, found ${wards.length}.`);
  }

  console.log("");
  console.log("[3/13] Checking Ward sourceGID structural integrity...");

  const dbSourceGids = wards
    .map((ward) => ward.sourceGid)
    .filter((gid): gid is number => gid !== null);

  const dbSourceGidSet = new Set(dbSourceGids);

  const duplicateDbGids = dbSourceGids.filter(
    (gid, index) => dbSourceGids.indexOf(gid) !== index
  );

  const missingAuthoritativeGids = [...geoGidSet].filter(
    (gid) => !dbSourceGidSet.has(gid)
  );

  const unexpectedDatabaseGids = [...dbSourceGidSet].filter(
    (gid) => !geoGidSet.has(gid)
  );

  console.log(`  Database sourceGIDs: ${dbSourceGids.length}`);
  console.log(`  Unique database sourceGIDs: ${dbSourceGidSet.size}`);
  console.log(`  Duplicate database sourceGIDs: ${duplicateDbGids.length}`);
  console.log(`  Missing authoritative GIDs: ${missingAuthoritativeGids.length}`);
  console.log(`  Unexpected database GIDs: ${unexpectedDatabaseGids.length}`);

  if (duplicateDbGids.length > 0) {
    errors.push(
      `Duplicate database sourceGIDs detected: ${sortNumbers(
        duplicateDbGids
      ).join(", ")}`
    );
  }

  if (missingAuthoritativeGids.length > 0) {
    errors.push(
      `Missing authoritative GIDs detected: ${sortNumbers(
        missingAuthoritativeGids
      ).join(", ")}`
    );
  }

  if (unexpectedDatabaseGids.length > 0) {
    errors.push(
      `Unexpected database GIDs detected: ${sortNumbers(
        unexpectedDatabaseGids
      ).join(", ")}`
    );
  }

  console.log("");
  console.log("[4/13] Building sourceGID lineage index...");

  const wardBySourceGid = new Map<number, DatabaseWard>();

  for (const ward of wards as DatabaseWard[]) {
    if (ward.sourceGid === null) {
      continue;
    }

    wardBySourceGid.set(ward.sourceGid, ward);
  }

  console.log(`  Lineage index entries: ${wardBySourceGid.size}`);

  console.log("");
  console.log("[5/13] Checking current relational lineage...");

  let nullSubCountyCount = 0;
  let missingSubCountyCount = 0;
  let missingCountyCount = 0;
  let countySubCountyMismatchCount = 0;

  for (const ward of wards as DatabaseWard[]) {
    if (ward.subCountyId === null) {
      nullSubCountyCount++;
    }

    if (ward.subCountyId !== null && !ward.subCounty) {
      missingSubCountyCount++;
    }

    if (!ward.county) {
      missingCountyCount++;
    }

    if (
      ward.subCounty &&
      ward.county &&
      ward.subCounty.countyId !== ward.county.id
    ) {
      countySubCountyMismatchCount++;
    }
  }

  console.log(`  NULL subCountyId: ${nullSubCountyCount}`);
  console.log(`  Missing SubCounty FK: ${missingSubCountyCount}`);
  console.log(`  Missing County FK: ${missingCountyCount}`);
  console.log(
    `  County/SubCounty relational mismatches: ${countySubCountyMismatchCount}`
  );

  if (nullSubCountyCount > 0) {
    errors.push(`NULL Ward.subCountyId count: ${nullSubCountyCount}`);
  }

  if (missingSubCountyCount > 0) {
    errors.push(
      `Missing Ward -> SubCounty FK count: ${missingSubCountyCount}`
    );
  }

  if (missingCountyCount > 0) {
    errors.push(`Missing Ward -> County FK count: ${missingCountyCount}`);
  }

  if (countySubCountyMismatchCount > 0) {
    errors.push(
      `Ward County/SubCounty relational mismatch count: ${countySubCountyMismatchCount}`
    );
  }

  console.log("");
  console.log("[6/13] Reconciling authoritative names through sourceGID...");

  const reviewRecords: ReviewRecord[] = [];

  let exactCount = 0;
  let nameVariantCount = 0;
  let contradictionCount = 0;
  let unresolvedCount = 0;
  let wardNotFoundCount = 0;

  for (const geo of geoRecords) {
    const ward = wardBySourceGid.get(geo.gid);

    if (!ward) {
      wardNotFoundCount++;
      continue;
    }

    const authoritativeCountyNorm = normalizeCounty(geo.countyName);
    const databaseCountyNorm = normalizeCounty(ward.county.name);

    const authoritativeSubCountyNorm = normalizeSubCounty(
      geo.subCountyName
    );

    const databaseSubCountyNorm = normalizeSubCounty(
      ward.subCounty?.name
    );

    const countyMatch =
      authoritativeCountyNorm.length > 0 &&
      authoritativeCountyNorm === databaseCountyNorm;

    const subCountyMatch =
      authoritativeSubCountyNorm.length > 0 &&
      databaseSubCountyNorm !== null &&
      authoritativeSubCountyNorm === databaseSubCountyNorm;

    if (countyMatch && subCountyMatch) {
      const exactRawMatch =
        geo.countyName.trim().toLowerCase() ===
          ward.county.name.trim().toLowerCase() &&
        geo.subCountyName.trim().toLowerCase() ===
          (ward.subCounty?.name ?? "").trim().toLowerCase();

      if (exactRawMatch) {
        exactCount++;
      } else {
        nameVariantCount++;
      }

      continue;
    }

    if (!countyMatch) {
      contradictionCount++;

      reviewRecords.push({
        gid: geo.gid,
        wardId: ward.id,
        wardName: geo.wardName,

        authoritativeCounty: geo.countyName,
        authoritativeSubCounty: geo.subCountyName,

        databaseCounty: ward.county.name,
        databaseCountyId: ward.county.id,

        databaseSubCounty: ward.subCounty?.name ?? null,
        databaseSubCountyId: ward.subCounty?.id ?? null,

        countyIdentityMatch: countyMatch,
        subCountyIdentityMatch: subCountyMatch,

        status: "SOURCE_DB_CONTRADICTION",

        countyNormalizedAuthoritative: authoritativeCountyNorm,
        countyNormalizedDatabase: databaseCountyNorm,

        subCountyNormalizedAuthoritative: authoritativeSubCountyNorm,
        subCountyNormalizedDatabase:
          databaseSubCountyNorm.length > 0
            ? databaseSubCountyNorm
            : null,

        wardUid: geo.uid,
        wardScuid: geo.scuid,
        wardCuid: geo.cuid,
        population2009: geo.pop2009,
      });

      continue;
    }

    unresolvedCount++;

    reviewRecords.push({
      gid: geo.gid,
      wardId: ward.id,
      wardName: geo.wardName,

      authoritativeCounty: geo.countyName,
      authoritativeSubCounty: geo.subCountyName,

      databaseCounty: ward.county.name,
      databaseCountyId: ward.county.id,

      databaseSubCounty: ward.subCounty?.name ?? null,
      databaseSubCountyId: ward.subCounty?.id ?? null,

      countyIdentityMatch: countyMatch,
      subCountyIdentityMatch: subCountyMatch,

      status: "UNRESOLVED",

      countyNormalizedAuthoritative: authoritativeCountyNorm,
      countyNormalizedDatabase: databaseCountyNorm,

      subCountyNormalizedAuthoritative: authoritativeSubCountyNorm,
      subCountyNormalizedDatabase:
        databaseSubCountyNorm.length > 0
          ? databaseSubCountyNorm
          : null,

      wardUid: geo.uid,
      wardScuid: geo.scuid,
      wardCuid: geo.cuid,
      population2009: geo.pop2009,
    });
  }

  console.log(`  EXACT_MATCH: ${exactCount}`);
  console.log(`  NAME_VARIANT_SAME_IDENTITY: ${nameVariantCount}`);
  console.log(`  SOURCE_DB_CONTRADICTION: ${contradictionCount}`);
  console.log(`  UNRESOLVED: ${unresolvedCount}`);
  console.log(`  WARD_NOT_FOUND: ${wardNotFoundCount}`);

  if (wardNotFoundCount > 0) {
    errors.push(`Ward NOT_FOUND count: ${wardNotFoundCount}`);
  }

  console.log("");
  console.log("[7/13] Validating review accounting...");

  const classifiedCount =
    exactCount +
    nameVariantCount +
    contradictionCount +
    unresolvedCount +
    wardNotFoundCount;

  console.log(`  Authoritative records: ${geoRecords.length}`);
  console.log(`  Classified records: ${classifiedCount}`);
  console.log(`  Review records: ${reviewRecords.length}`);

  if (classifiedCount !== geoRecords.length) {
    errors.push(
      `Evaluator accounting mismatch: classified=${classifiedCount}, authoritative=${geoRecords.length}`
    );
  }

  if (reviewRecords.length !== contradictionCount + unresolvedCount) {
    errors.push("Review record accounting mismatch.");
  }

  console.log("");
  console.log("[8/13] Grouping 85 SOURCE_DB_CONTRADICTION records...");

  const contradictionGroups = new Map<string, GroupedContradiction>();

  const contradictionRecords = reviewRecords.filter(
    (record) => record.status === "SOURCE_DB_CONTRADICTION"
  );

  for (const record of contradictionRecords) {
    const key = [
      record.countyNormalizedAuthoritative,
      record.countyNormalizedDatabase,
      record.databaseCountyId,
    ].join("|");

    const existing = contradictionGroups.get(key);

    if (!existing) {
      contradictionGroups.set(key, {
        authoritativeCounty: record.authoritativeCounty,
        databaseCounty: record.databaseCounty,
        databaseCountyId: record.databaseCountyId,

        authoritativeSubCounties: [record.authoritativeSubCounty],
        databaseSubCounties: [
          record.databaseSubCounty ?? "(NULL)",
        ],

        wardCount: 1,
        gids: [record.gid],
        wardNames: [record.wardName],
      });
    } else {
      existing.authoritativeSubCounties.push(
        record.authoritativeSubCounty
      );

      existing.databaseSubCounties.push(
        record.databaseSubCounty ?? "(NULL)"
      );

      existing.wardCount++;
      existing.gids.push(record.gid);
      existing.wardNames.push(record.wardName);
    }
  }

  const contradictionGroupArray = [...contradictionGroups.values()]
    .map((group) => ({
      ...group,
      authoritativeSubCounties: sortStrings(
        group.authoritativeSubCounties
      ),
      databaseSubCounties: sortStrings(group.databaseSubCounties),
      gids: sortNumbers(group.gids),
      wardNames: sortStrings(group.wardNames),
    }))
    .sort((a, b) => b.wardCount - a.wardCount);

  console.log(
    `  Distinct contradiction county-pair groups: ${contradictionGroupArray.length}`
  );

  for (const group of contradictionGroupArray) {
    console.log("");
    console.log(
      `  ${group.authoritativeCounty} -> ${group.databaseCounty}`
    );
    console.log(`    Wards: ${group.wardCount}`);
    console.log(
      `    Authoritative SubCounties: ${group.authoritativeSubCounties.join(
        ", "
      )}`
    );
    console.log(
      `    Database SubCounties: ${group.databaseSubCounties.join(
        ", "
      )}`
    );
    console.log(`    GIDs: ${group.gids.join(", ")}`);
  }

  console.log("");
  console.log("[9/13] Grouping 7 UNRESOLVED records...");

  const unresolvedGroups = new Map<string, GroupedUnresolved>();

  const unresolvedRecords = reviewRecords.filter(
    (record) => record.status === "UNRESOLVED"
  );

  for (const record of unresolvedRecords) {
    const key = [
      record.countyNormalizedAuthoritative,
      record.countyNormalizedDatabase,
      record.authoritativeSubCounty,
      record.databaseSubCounty ?? "(NULL)",
      record.databaseSubCountyId ?? "NULL",
    ].join("|");

    const existing = unresolvedGroups.get(key);

    if (!existing) {
      unresolvedGroups.set(key, {
        authoritativeCounty: record.authoritativeCounty,
        databaseCounty: record.databaseCounty,
        databaseCountyId: record.databaseCountyId,

        authoritativeSubCounty: record.authoritativeSubCounty,
        databaseSubCounty: record.databaseSubCounty,
        databaseSubCountyId: record.databaseSubCountyId,

        wardCount: 1,
        gids: [record.gid],
        wardNames: [record.wardName],
      });
    } else {
      existing.wardCount++;
      existing.gids.push(record.gid);
      existing.wardNames.push(record.wardName);
    }
  }

  const unresolvedGroupArray = [...unresolvedGroups.values()]
    .map((group) => ({
      ...group,
      gids: sortNumbers(group.gids),
      wardNames: sortStrings(group.wardNames),
    }))
    .sort((a, b) => b.wardCount - a.wardCount);

  console.log(
    `  Distinct unresolved identity groups: ${unresolvedGroupArray.length}`
  );

  for (const group of unresolvedGroupArray) {
    console.log("");
    console.log(
      `  ${group.authoritativeCounty} / ${group.authoritativeSubCounty}`
    );
    console.log(
      `    Database: ${group.databaseCounty} / ${
        group.databaseSubCounty ?? "(NULL)"
      }`
    );
    console.log(`    Database SubCounty ID: ${group.databaseSubCountyId ?? "NULL"}`);
    console.log(`    Wards: ${group.wardCount}`);
    console.log(`    GIDs: ${group.gids.join(", ")}`);
    console.log(`    Ward names: ${group.wardNames.join(", ")}`);
  }

  console.log("");
  console.log("[10/13] Testing whether contradiction patterns are concentrated...");

  const contradictionByAuthoritativeCounty = new Map<
    string,
    number
  >();

  const contradictionByDatabaseCounty = new Map<string, number>();

  const contradictionByAuthoritativeSubCounty = new Map<
    string,
    number
  >();

  const contradictionByDatabaseSubCounty = new Map<string, number>();

  for (const record of contradictionRecords) {
    contradictionByAuthoritativeCounty.set(
      record.authoritativeCounty,
      (contradictionByAuthoritativeCounty.get(
        record.authoritativeCounty
      ) ?? 0) + 1
    );

    contradictionByDatabaseCounty.set(
      record.databaseCounty,
      (contradictionByDatabaseCounty.get(record.databaseCounty) ?? 0) + 1
    );

    const authoritativeSubKey =
      `${record.authoritativeCounty} / ${record.authoritativeSubCounty}`;

    contradictionByAuthoritativeSubCounty.set(
      authoritativeSubKey,
      (contradictionByAuthoritativeSubCounty.get(
        authoritativeSubKey
      ) ?? 0) + 1
    );

    const databaseSubKey =
      `${record.databaseCounty} / ${
        record.databaseSubCounty ?? "(NULL)"
      }`;

    contradictionByDatabaseSubCounty.set(
      databaseSubKey,
      (contradictionByDatabaseSubCounty.get(databaseSubKey) ?? 0) + 1
    );
  }

  const topAuthoritativeCountyContradictions = [
    ...contradictionByAuthoritativeCounty.entries(),
  ]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topDatabaseCountyContradictions = [
    ...contradictionByDatabaseCounty.entries(),
  ]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topAuthoritativeSubCountyContradictions = [
    ...contradictionByAuthoritativeSubCounty.entries(),
  ]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topDatabaseSubCountyContradictions = [
    ...contradictionByDatabaseSubCounty.entries(),
  ]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  console.log("");
  console.log("  By authoritative county:");

  for (const item of topAuthoritativeCountyContradictions) {
    console.log(`    ${item.name}: ${item.count}`);
  }

  console.log("");
  console.log("  By database county:");

  for (const item of topDatabaseCountyContradictions) {
    console.log(`    ${item.name}: ${item.count}`);
  }

  console.log("");
  console.log("  Top authoritative County/SubCounty identities:");

  for (const item of topAuthoritativeSubCountyContradictions) {
    console.log(`    ${item.name}: ${item.count}`);
  }

  console.log("");
  console.log("  Top database County/SubCounty identities:");

  for (const item of topDatabaseSubCountyContradictions) {
    console.log(`    ${item.name}: ${item.count}`);
  }

  console.log("");
  console.log("[11/13] Inspecting ward-level forensic evidence...");

  const forensicRows = reviewRecords
    .map((record) => {
      const authoritativeWardNorm = normalizeWard(record.wardName);

      return {
        ...record,
        normalizedWardName: authoritativeWardNorm,
        countyPair:
          `${record.authoritativeCounty} -> ${record.databaseCounty}`,
        subCountyPair:
          `${record.authoritativeSubCounty} -> ${
            record.databaseSubCounty ?? "(NULL)"
          }`,
      };
    })
    .sort((a, b) => a.gid - b.gid);

  console.log(`  Forensic review rows: ${forensicRows.length}`);

  console.log("");
  console.log("  REVIEW RECORDS:");

  for (const record of forensicRows) {
    console.log(
      `    GID ${record.gid} | Ward=${record.wardName} | ` +
        `AUTH=${record.authoritativeCounty} / ${record.authoritativeSubCounty} | ` +
        `DB=${record.databaseCounty} / ${
          record.databaseSubCounty ?? "(NULL)"
        } | ` +
        `STATUS=${record.status}`
    );
  }

  console.log("");
  console.log("[12/13] Evaluating forensic invariants...");

  const reviewGids = reviewRecords.map((record) => record.gid);
  const reviewGidSet = new Set(reviewGids);

  const duplicateReviewGids = reviewGids.filter(
    (gid, index) => reviewGids.indexOf(gid) !== index
  );

  console.log(`  Review records: ${reviewRecords.length}`);
  console.log(`  Unique review GIDs: ${reviewGidSet.size}`);
  console.log(`  Duplicate review GIDs: ${duplicateReviewGids.length}`);

  console.log(
    `  Contradictions accounted: ${
      contradictionRecords.length === contradictionCount ? "PASS" : "FAIL"
    }`
  );

  console.log(
    `  Unresolved accounted: ${
      unresolvedRecords.length === unresolvedCount ? "PASS" : "FAIL"
    }`
  );

  console.log(
    `  Review accounting: ${
      reviewRecords.length === contradictionCount + unresolvedCount
        ? "PASS"
        : "FAIL"
    }`
  );

  if (duplicateReviewGids.length > 0) {
    errors.push(
      `Duplicate GIDs inside review records: ${sortNumbers(
        duplicateReviewGids
      ).join(", ")}`
    );
  }

  const authoritativeIdentityToDbIdentities = new Map<
    string,
    Set<string>
  >();

  for (const record of reviewRecords) {
    const authoritativeIdentity =
      `${record.countyNormalizedAuthoritative}|${record.subCountyNormalizedAuthoritative}`;

    const dbIdentity =
      `${record.countyNormalizedDatabase}|${
        record.subCountyNormalizedDatabase ?? "(NULL)"
      }`;

    if (!authoritativeIdentityToDbIdentities.has(authoritativeIdentity)) {
      authoritativeIdentityToDbIdentities.set(
        authoritativeIdentity,
        new Set<string>()
      );
    }

    authoritativeIdentityToDbIdentities
      .get(authoritativeIdentity)!
      .add(dbIdentity);
  }

  const trueSemanticAmbiguityGroups = [
    ...authoritativeIdentityToDbIdentities.entries(),
  ].filter(([, dbIdentities]) => dbIdentities.size > 1);

  console.log(
    `  Authoritative review identities mapping to multiple DB identities: ${trueSemanticAmbiguityGroups.length}`
  );

  if (trueSemanticAmbiguityGroups.length > 0) {
    warnings.push(
      `Found ${trueSemanticAmbiguityGroups.length} authoritative identities mapping to multiple DB identities inside the review set.`
    );
  }

  const contradictionWardCount = contradictionRecords.length;
  const unresolvedWardCount = unresolvedRecords.length;

  const accountingTotal =
    exactCount +
    nameVariantCount +
    contradictionWardCount +
    unresolvedWardCount +
    wardNotFoundCount;

  const accountingPass =
    accountingTotal === geoRecords.length &&
    reviewRecords.length ===
      contradictionWardCount + unresolvedWardCount &&
    duplicateReviewGids.length === 0;

  console.log(`  Global classification accounting: ${accountingPass ? "PASS" : "FAIL"}`);

  if (!accountingPass) {
    errors.push("Global forensic classification accounting failed.");
  }

  console.log("");
  console.log("[13/13] Writing V15.9 forensic reports...");

  const outputDirectory = path.resolve(process.cwd(), "prisma/data");

  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, {
      recursive: true,
    });
  }

  const generatedAt = new Date().toISOString();

  const report = {
    audit: "FINAL DATABASE SEMANTIC FORENSIC AUDIT V15.9",
    mode: "READ_ONLY",

    generatedAt,

    purpose:
      "Forensic classification of the 92 semantic review records identified by V15.8. No database changes are performed.",

    databaseCounts: {
      counties: counties.length,
      subCounties: subCounties.length,
      wards: wards.length,
      farmers,
      farms,
      businessPartners,
      commodityTransactions,
    },

    authoritativeCounts: {
      geoJsonFeatures: geoRecords.length,
      numericGids: geoRecords.length,
      uniqueGids: geoGidSet.size,
    },

    structuralIntegrity: {
      databaseSourceGids: dbSourceGids.length,
      uniqueDatabaseSourceGids: dbSourceGidSet.size,
      duplicateDatabaseSourceGids: sortNumbers(duplicateDbGids),
      missingAuthoritativeGids: sortNumbers(missingAuthoritativeGids),
      unexpectedDatabaseGids: sortNumbers(unexpectedDatabaseGids),
      nullSubCountyCount,
      missingSubCountyCount,
      missingCountyCount,
      countySubCountyMismatchCount,
    },

    classification: {
      exactMatch: exactCount,
      nameVariantSameIdentity: nameVariantCount,
      sourceDbContradiction: contradictionCount,
      unresolved: unresolvedCount,
      wardNotFound: wardNotFoundCount,
      totalClassified: classifiedCount,
      totalReviewRecords: reviewRecords.length,
    },

    forensicSummary: {
      contradictionGroups: contradictionGroupArray.length,
      unresolvedGroups: unresolvedGroupArray.length,
      authoritativeReviewIdentitiesMappingToMultipleDbIdentities:
        trueSemanticAmbiguityGroups.length,
    },

    contradictionGroups: contradictionGroupArray,

    unresolvedGroups: unresolvedGroupArray,

    topAuthoritativeCountyContradictions,

    topDatabaseCountyContradictions,

    topAuthoritativeSubCountyContradictions,

    topDatabaseSubCountyContradictions,

    reviewRecords: forensicRows,

    invariants: {
      authoritativeCountMatchesClassification:
        classifiedCount === geoRecords.length,

      reviewAccountingMatches:
        reviewRecords.length ===
        contradictionCount + unresolvedCount,

      reviewGidsUnique: duplicateReviewGids.length === 0,

      sourceGidStructuralIntegrity:
        duplicateDbGids.length === 0 &&
        missingAuthoritativeGids.length === 0 &&
        unexpectedDatabaseGids.length === 0,

      relationalIntegrity:
        nullSubCountyCount === 0 &&
        missingSubCountyCount === 0 &&
        missingCountyCount === 0 &&
        countySubCountyMismatchCount === 0,

      trueSemanticAmbiguityGroups:
        trueSemanticAmbiguityGroups.length,

      forensicAccountingPass: accountingPass,
    },

    errors,

    warnings,

    finalStatus: errors.length === 0 ? "PASS" : "FAIL",
  };

  const jsonPath = path.join(
    outputDirectory,
    "final-database-semantic-forensic-audit-v15-9.json"
  );

  const csvPath = path.join(
    outputDirectory,
    "final-database-semantic-forensic-review-v15-9.csv"
  );

  fs.writeFileSync(
    jsonPath,
    JSON.stringify(report, null, 2),
    "utf8"
  );

  const csvHeaders = [
    "gid",
    "wardId",
    "wardName",
    "authoritativeCounty",
    "authoritativeSubCounty",
    "databaseCounty",
    "databaseCountyId",
    "databaseSubCounty",
    "databaseSubCountyId",
    "countyIdentityMatch",
    "subCountyIdentityMatch",
    "status",
    "countyNormalizedAuthoritative",
    "countyNormalizedDatabase",
    "subCountyNormalizedAuthoritative",
    "subCountyNormalizedDatabase",
    "wardUid",
    "wardScuid",
    "wardCuid",
    "population2009",
  ];

  const csvEscape = (value: unknown): string => {
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
  };

  const csvLines = [
    csvHeaders.join(","),
    ...reviewRecords.map((record) =>
      [
        record.gid,
        record.wardId,
        record.wardName,
        record.authoritativeCounty,
        record.authoritativeSubCounty,
        record.databaseCounty,
        record.databaseCountyId,
        record.databaseSubCounty,
        record.databaseSubCountyId,
        record.countyIdentityMatch,
        record.subCountyIdentityMatch,
        record.status,
        record.countyNormalizedAuthoritative,
        record.countyNormalizedDatabase,
        record.subCountyNormalizedAuthoritative,
        record.subCountyNormalizedDatabase,
        record.wardUid,
        record.wardScuid,
        record.wardCuid,
        record.population2009,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];

  fs.writeFileSync(
    csvPath,
    csvLines.join("\n"),
    "utf8"
  );

  console.log(`  JSON: ${jsonPath}`);
  console.log(`  CSV: ${csvPath}`);

  console.log("");
  console.log("=".repeat(80));
  console.log("FINAL V15.9 RESULT");
  console.log("=".repeat(80));

  console.log(`STATUS: ${report.finalStatus}`);
  console.log("");

  console.log(`Authoritative wards: ${geoRecords.length}`);
  console.log(`Database wards: ${wards.length}`);
  console.log(`Database SubCounties: ${subCounties.length}`);
  console.log("");

  console.log(`EXACT_MATCH: ${exactCount}`);
  console.log(`NAME_VARIANT_SAME_IDENTITY: ${nameVariantCount}`);
  console.log(`SOURCE_DB_CONTRADICTION: ${contradictionCount}`);
  console.log(`UNRESOLVED: ${unresolvedCount}`);
  console.log(`WARD_NOT_FOUND: ${wardNotFoundCount}`);
  console.log("");

  console.log(
    `Contradiction groups: ${contradictionGroupArray.length}`
  );

  console.log(
    `Unresolved groups: ${unresolvedGroupArray.length}`
  );

  console.log(
    `True ambiguity groups: ${trueSemanticAmbiguityGroups.length}`
  );

  console.log("");

  console.log(
    `Structural integrity: ${
      report.invariants.sourceGidStructuralIntegrity
        ? "PASS"
        : "FAIL"
    }`
  );

  console.log(
    `Relational integrity: ${
      report.invariants.relationalIntegrity
        ? "PASS"
        : "FAIL"
    }`
  );

  console.log(
    `Forensic accounting: ${
      report.invariants.forensicAccountingPass
        ? "PASS"
        : "FAIL"
    }`
  );

  console.log("");

  if (errors.length > 0) {
    console.log("ERRORS:");

    for (const error of errors) {
      console.log(`  - ${error}`);
    }

    console.log("");
  }

  if (warnings.length > 0) {
    console.log("WARNINGS:");

    for (const warning of warnings) {
      console.log(`  - ${warning}`);
    }

    console.log("");
  }

  console.log(`JSON: ${jsonPath}`);
  console.log(`CSV: ${csvPath}`);
  console.log("");

  if (report.finalStatus === "PASS") {
    console.log("V15.9 PASS");
    console.log("Forensic classification completed.");
    console.log("NO DATABASE CHANGES WERE MADE.");
    console.log("");
    console.log(
      "Do NOT perform repair from this audit alone."
    );
    console.log(
      "Use the grouped contradiction/unresolved evidence to determine the next semantic decision."
    );
  } else {
    console.log("V15.9 FAIL");
    console.log(
      "The forensic evaluator itself found an integrity/accounting problem."
    );
    console.log(
      "Do NOT perform database repair."
    );
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("V15.9 AUDIT FAILED WITH UNHANDLED ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });