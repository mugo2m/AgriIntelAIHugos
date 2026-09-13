import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

type GeoJsonFeature = {
  type: string;
  properties?: {
    gid?: number | string;
    county?: string;
    subcounty?: string;
    ward?: string;
    uid?: number | string;
    scuid?: number | string;
    cuid?: number | string;
    [key: string]: unknown;
  };
  geometry?: unknown;
};

type GeoJson = {
  type: string;
  features: GeoJsonFeature[];
};

type CanonicalSubcounty = {
  code?: string | number;
  countyCode?: string | number;
  name: string;
  headquarters?: string;
};

type WardAudit = {
  sourceGid: number;
  wardName: string;
  authoritativeCountyName: string;
  authoritativeSubcountyName: string;
  authoritativeScuid: string | null;
  authoritativeCountyId: number | null;
  authoritativeSubcountyId: number | null;
  databaseWardId: number | null;
  databaseWardName: string | null;
  databaseCountyId: number | null;
  databaseCountyName: string | null;
  databaseSubcountyId: number | null;
  databaseSubcountyName: string | null;
  status:
    | "CORRECT"
    | "WRONG_SUBCOUNTY"
    | "TARGET_UNRESOLVED"
    | "WARD_NOT_FOUND";
  resolutionType:
    | "EXACT"
    | "NORMALIZED"
    | "ALIAS"
    | "NOT_FOUND"
    | "AMBIGUOUS";
  notes: string[];
};

type DuplicateGroup = {
  countyId: number;
  countyName: string;
  normalizedName: string;
  records: Array<{
    id: number;
    name: string;
    wardCount: number;
    farmerCount: number;
    farmCount: number;
    businessPartnerCount: number;
  }>;
  totalRecords: number;
  duplicateType:
    | "MULTIPLE_ACTIVE_RECORDS"
    | "LEGACY_SUBCOUNTY_NAME"
    | "OTHER";
};

function readJson<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function normalizeLooseName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[-_/]/g, " ")
    .replace(/\bsub\s*county\b/g, " ")
    .replace(/\bsubcounty\b/g, " ")
    .replace(/\bcounty\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeExactName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCountyName(value: string): string {
  const normalized = normalizeLooseName(value);

  const aliases: Record<string, string> = {
    "tharaka nithi": "tharaka nithi",
    "tharaka nithi county": "tharaka nithi",

    muranga: "muranga",
    "muranga county": "muranga",

    "elgeyo marakwet": "elgeyo marakwet",
    "elgeyo marakwet county": "elgeyo marakwet",

    nairobi: "nairobi city",
    "nairobi city": "nairobi city",

    "nairobi city county": "nairobi city",

    "trans nzoia": "trans nzoia",
    "transnzoia": "trans nzoia",

    "taita taveta": "taita taveta",
    "taita taveta county": "taita taveta",

    "isiolo": "isiolo",
    "isiolo county": "isiolo",

    "west pokot": "west pokot",
    "west pokot county": "west pokot",

    "uasin gishu": "uasin gishu",
    "uasin gishu county": "uasin gishu",

    "nyeri": "nyeri",
    "nyeri county": "nyeri",

    "nyandarua": "nyandarua",
    "nyandarua county": "nyandarua",

    "nyamira": "nyamira",
    "nyamira county": "nyamira",

    "tharaka": "tharaka nithi",
    "tharaka nithi": "tharaka nithi",
  };

  return aliases[normalized] ?? normalized;
}

function canonicalSubcountyAlias(value: string): {
  normalized: string;
  resolutionType: "ALIAS" | null;
} {
  const exact = normalizeExactName(value);
  const loose = normalizeLooseName(value);

  const aliases: Record<string, string> = {
    "tiaty sub county": "tiaty east",
    "tiaty": "tiaty east",

    "transmara east": "trans mara east",
    "trans mara east": "trans mara east",

    "transmara west": "trans mara west",
    "trans mara west": "trans mara west",

    "muranga south": "muranga south",
    "muranga east": "muranga east",

    mukurewini: "mukurwe ini",

    "mandera west": "mandera west",
    "mandera east": "mandera east",
    "mandera north": "mandera north",

    banisa: "banisa",
    lafey: "lafey",
    ainabkoi: "ainabkoi",
    kesses: "kesses",
  };

  if (aliases[exact]) {
    return {
      normalized: aliases[exact],
      resolutionType: "ALIAS",
    };
  }

  if (aliases[loose]) {
    return {
      normalized: aliases[loose],
      resolutionType: "ALIAS",
    };
  }

  return {
    normalized: loose,
    resolutionType: null,
  };
}

function safeNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  throw new Error(`Cannot convert value to number: ${String(value)}`);
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);

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
  const dataDir = path.join(process.cwd(), "prisma", "data");

  const geoJsonPath = path.join(
    dataDir,
    "kenya-wards-1450.geojson"
  );

  const canonicalSubcountiesPath = path.join(
    dataDir,
    "subcounties.json"
  );

  const v14Path = path.join(
    dataDir,
    "consolidation-migration-v14.json"
  );

  const v15Path = path.join(
    dataDir,
    "deletion-log-v15.json"
  );

  const v14_1Path = path.join(
    dataDir,
    "post-migration-audit-v14-1.json"
  );

  const outputJsonPath = path.join(
    dataDir,
    "post-deletion-audit-v15-1.json"
  );

  const outputCsvPath = path.join(
    dataDir,
    "post-deletion-audit-v15-1.csv"
  );

  console.log("");
  console.log("==============================================");
  console.log("V15.1 FINAL POST-DELETION RECONCILIATION AUDIT");
  console.log("==============================================");
  console.log("");
  console.log("READ-ONLY AUDIT");
  console.log("NO DATABASE CHANGES WILL BE MADE.");
  console.log("");

  // ------------------------------------------------------------
  // STEP 0 — LOAD AUTHORITATIVE SOURCES AND LOGS
  // ------------------------------------------------------------

  console.log("==============================================================");
  console.log("STEP 0 — LOADING AUTHORITATIVE SOURCES AND V14/V15 LOGS");
  console.log("==============================================================");

  const geoJson = readJson<GeoJson>(geoJsonPath);

  const canonicalRaw = readJson<
    CanonicalSubcounty[] | { value: CanonicalSubcounty[] }
  >(canonicalSubcountiesPath);

  const canonicalSubcounties: CanonicalSubcounty[] =
    Array.isArray(canonicalRaw)
      ? canonicalRaw
      : Array.isArray(canonicalRaw.value)
        ? canonicalRaw.value
        : [];

  const v14 = readJson<any>(v14Path);
  const v15 = readJson<any>(v15Path);
  const v14_1 = readJson<any>(v14_1Path);

  console.log(
    `Authoritative GeoJSON features: ${geoJson.features.length}`
  );

  console.log(
    `Canonical source subcounties: ${canonicalSubcounties.length}`
  );

  console.log(
    `V14 migrations: ${
      Array.isArray(v14) ? v14.length : v14?.migrations?.length ?? 0
    }`
  );

  console.log(
    `V15 deletion log loaded: ${v15 ? "YES" : "NO"}`
  );

  console.log(
    `V14.1 audit loaded: ${v14_1 ? "YES" : "NO"}`
  );

  // ------------------------------------------------------------
  // STEP 1 — AUTHORITATIVE GID AUDIT
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("STEP 1 — AUTHORITATIVE GID AUDIT");
  console.log("==============================================================");

  const authoritativeGids = geoJson.features
    .map((feature) => {
      const raw = feature.properties?.gid;
      return raw === undefined ? NaN : safeNumber(raw);
    })
    .filter((gid) => !Number.isNaN(gid));

  const authoritativeGidSet = new Set(authoritativeGids);

  const authoritativeGidFrequency = new Map<number, number>();

  for (const gid of authoritativeGids) {
    authoritativeGidFrequency.set(
      gid,
      (authoritativeGidFrequency.get(gid) ?? 0) + 1
    );
  }

  const duplicateAuthoritativeGids = [
    ...authoritativeGidFrequency.entries(),
  ]
    .filter(([, count]) => count > 1)
    .map(([gid, count]) => ({ gid, count }));

  console.log(
    `Authoritative GIDs: ${authoritativeGids.length}`
  );

  console.log(
    `Unique authoritative GIDs: ${authoritativeGidSet.size}`
  );

  console.log(
    `Duplicate authoritative GIDs: ${duplicateAuthoritativeGids.length}`
  );

  // ------------------------------------------------------------
  // STEP 2 — CURRENT DATABASE SNAPSHOT
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("STEP 2 — CURRENT DATABASE SNAPSHOT");
  console.log("==============================================================");

  const counties = await prisma.county.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const subcounties = await prisma.subCounty.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      _count: {
        select: {
          wards: true,
          farmers: true,
          farms: true,
          businessPartners: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const wards = await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
      sourceGid: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const farmersCount = await prisma.farmer.count();
  const farmsCount = await prisma.farm.count();
  const businessPartnersCount =
    await prisma.businessPartner.count();
  const commodityTransactionsCount =
    await prisma.commodityTransaction.count();

  console.log(`Database counties: ${counties.length}`);
  console.log(`Database subcounties: ${subcounties.length}`);
  console.log(`Database wards: ${wards.length}`);
  console.log(`Database farmers: ${farmersCount}`);
  console.log(`Database farms: ${farmsCount}`);
  console.log(
    `Database business partners: ${businessPartnersCount}`
  );
  console.log(
    `Database commodity transactions: ${commodityTransactionsCount}`
  );

  const expectedSubcountyCount = 417;

  const subcountyCountStatus =
    subcounties.length === expectedSubcountyCount
      ? "PASS"
      : "FAIL";

  console.log("");
  console.log(
    `EXPECTED SUBCOUNTY COUNT: ${expectedSubcountyCount}`
  );
  console.log(
    `ACTUAL SUBCOUNTY COUNT: ${subcounties.length}`
  );
  console.log(
    `SUBCOUNTY COUNT CHECK: ${subcountyCountStatus}`
  );

  // ------------------------------------------------------------
  // STEP 3 — LOAD V15 DELETED IDS
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("STEP 3 — V15 DELETED-ID VERIFICATION");
  console.log("==============================================================");

  const deletedIds: number[] = Array.isArray(v15?.deletedSubCountyIds)
    ? v15.deletedSubCountyIds.map(safeNumber)
    : Array.isArray(v15?.oldSubCountyIds)
      ? v15.oldSubCountyIds.map(safeNumber)
      : Array.isArray(v15?.deletedIds)
        ? v15.deletedIds.map(safeNumber)
        : [];

  const v14TargetIds: number[] =
    Array.isArray(v15?.targetSubCountyIds)
      ? v15.targetSubCountyIds.map(safeNumber)
      : [];

  const uniqueDeletedIds = [...new Set(deletedIds)];
  const uniqueTargetIds = [...new Set(v14TargetIds)];

  console.log(`V15 deleted IDs loaded: ${uniqueDeletedIds.length}`);
  console.log(`V15 target IDs loaded: ${uniqueTargetIds.length}`);

  const currentSubcountyIdSet = new Set(
    subcounties.map((subcounty) => subcounty.id)
  );

  const deletedIdsStillPresent = uniqueDeletedIds.filter((id) =>
    currentSubcountyIdSet.has(id)
  );

  const targetIdsMissing = uniqueTargetIds.filter(
    (id) => !currentSubcountyIdSet.has(id)
  );

  console.log(
    `Deleted IDs still present: ${deletedIdsStillPresent.length}`
  );

  console.log(
    `Canonical target IDs missing: ${targetIdsMissing.length}`
  );

  const deletionVerificationPassed =
    uniqueDeletedIds.length === 122 &&
    deletedIdsStillPresent.length === 0 &&
    uniqueTargetIds.length === 122 &&
    targetIdsMissing.length === 0;

  console.log(
    `V15 DELETED/TARGET ID CHECK: ${
      deletionVerificationPassed ? "PASS" : "FAIL"
    }`
  );

  // ------------------------------------------------------------
  // STEP 4 — CURRENT DATABASE SOURCE-GID AUDIT
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("STEP 4 — CURRENT DATABASE SOURCE-GID AUDIT");
  console.log("==============================================================");

  const databaseSourceGids = wards
    .map((ward) =>
      ward.sourceGid === null || ward.sourceGid === undefined
        ? null
        : safeNumber(ward.sourceGid)
    )
    .filter((gid): gid is number => gid !== null);

  const databaseSourceGidSet = new Set(databaseSourceGids);

  const databaseGidFrequency = new Map<number, number>();

  for (const gid of databaseSourceGids) {
    databaseGidFrequency.set(
      gid,
      (databaseGidFrequency.get(gid) ?? 0) + 1
    );
  }

  const duplicateDatabaseGids = [
    ...databaseGidFrequency.entries(),
  ]
    .filter(([, count]) => count > 1)
    .map(([gid, count]) => ({ gid, count }));

  const missingAuthoritativeGids = authoritativeGids.filter(
    (gid) => !databaseSourceGidSet.has(gid)
  );

  const unexpectedDatabaseGids = databaseSourceGids.filter(
    (gid) => !authoritativeGidSet.has(gid)
  );

  console.log(
    `Database sourceGIDs: ${databaseSourceGids.length}`
  );

  console.log(
    `Unique database sourceGIDs: ${databaseSourceGidSet.size}`
  );

  console.log(
    `Duplicate database sourceGIDs: ${duplicateDatabaseGids.length}`
  );

  console.log(
    `Missing authoritative GIDs: ${missingAuthoritativeGids.length}`
  );

  console.log(
    `Unexpected database GIDs: ${unexpectedDatabaseGids.length}`
  );

  const structuralGidAuditPassed =
    authoritativeGids.length === 1450 &&
    authoritativeGidSet.size === 1450 &&
    duplicateAuthoritativeGids.length === 0 &&
    wards.length === 1450 &&
    databaseSourceGids.length === 1450 &&
    databaseSourceGidSet.size === 1450 &&
    duplicateDatabaseGids.length === 0 &&
    missingAuthoritativeGids.length === 0 &&
    unexpectedDatabaseGids.length === 0;

  console.log(
    `STRUCTURAL GID AUDIT: ${
      structuralGidAuditPassed ? "PASS" : "FAIL"
    }`
  );

  // ------------------------------------------------------------
  // STEP 5 — WARD REFERENCE AUDIT AGAINST DELETED IDS
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("STEP 5 — DELETED SUBCOUNTY REFERENCE AUDIT");
  console.log("==============================================================");

  const deletedIdSet = new Set(uniqueDeletedIds);

  const wardsReferencingDeletedIds = wards.filter(
    (ward) =>
      ward.subCountyId !== null &&
      deletedIdSet.has(ward.subCountyId)
  );

  const farmerDeletedReferences = await prisma.farmer.count({
    where: {
      subCountyId: {
        in: uniqueDeletedIds,
      },
    },
  });

  const farmDeletedReferences = await prisma.farm.count({
    where: {
      subCountyId: {
        in: uniqueDeletedIds,
      },
    },
  });

  const businessPartnerDeletedReferences =
    await prisma.businessPartner.count({
      where: {
        subCountyId: {
          in: uniqueDeletedIds,
        },
      },
    });

  const commodityDestinationDeletedReferences =
    await prisma.commodityTransaction.count({
      where: {
        destinationSubCountyId: {
          in: uniqueDeletedIds,
        },
      },
    });

  const commoditySourceDeletedReferences =
    await prisma.commodityTransaction.count({
      where: {
        sourceSubCountyId: {
          in: uniqueDeletedIds,
        },
      },
    });

  console.log(
    `Ward references to deleted IDs: ${wardsReferencingDeletedIds.length}`
  );

  console.log(
    `Farmer references to deleted IDs: ${farmerDeletedReferences}`
  );

  console.log(
    `Farm references to deleted IDs: ${farmDeletedReferences}`
  );

  console.log(
    `BusinessPartner references to deleted IDs: ${businessPartnerDeletedReferences}`
  );

  console.log(
    `CommodityTransaction destination references: ${commodityDestinationDeletedReferences}`
  );

  console.log(
    `CommodityTransaction source references: ${commoditySourceDeletedReferences}`
  );

  const deletedReferenceAuditPassed =
    wardsReferencingDeletedIds.length === 0 &&
    farmerDeletedReferences === 0 &&
    farmDeletedReferences === 0 &&
    businessPartnerDeletedReferences === 0 &&
    commodityDestinationDeletedReferences === 0 &&
    commoditySourceDeletedReferences === 0;

  console.log(
    `DELETED-ID REFERENCE AUDIT: ${
      deletedReferenceAuditPassed ? "PASS" : "FAIL"
    }`
  );

  // ------------------------------------------------------------
  // STEP 6 — CURRENT SUBCOUNTY DUPLICATE AUDIT
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("STEP 6 — REMAINING SUBCOUNTY DUPLICATE AUDIT");
  console.log("==============================================================");

  const duplicateMap = new Map<
    string,
    typeof subcounties
  >();

  for (const subcounty of subcounties) {
    const key =
      `${subcounty.countyId}::${normalizeLooseName(subcounty.name)}`;

    const existing = duplicateMap.get(key) ?? [];

    existing.push(subcounty);

    duplicateMap.set(key, existing);
  }

  const duplicateGroups: DuplicateGroup[] = [];

  for (const [key, records] of duplicateMap.entries()) {
    if (records.length <= 1) {
      continue;
    }

    const countyId = records[0].countyId;

    const county = counties.find(
      (item) => item.id === countyId
    );

    const normalizedName = key.split("::")[1];

    const hasLegacyName = records.some((record) =>
      /\bsub\s*county\b|\bsubcounty\b/i.test(record.name)
    );

    duplicateGroups.push({
      countyId,
      countyName: county?.name ?? `COUNTY_${countyId}`,
      normalizedName,
      records: records.map((record) => ({
        id: record.id,
        name: record.name,
        wardCount: record._count.wards,
        farmerCount: record._count.farmers,
        farmCount: record._count.farms,
        businessPartnerCount:
          record._count.businessPartners,
      })),
      totalRecords: records.length,
      duplicateType: hasLegacyName
        ? "LEGACY_SUBCOUNTY_NAME"
        : "MULTIPLE_ACTIVE_RECORDS",
    });
  }

  duplicateGroups.sort((a, b) => {
    if (a.countyId !== b.countyId) {
      return a.countyId - b.countyId;
    }

    return a.normalizedName.localeCompare(b.normalizedName);
  });

  console.log(
    `Remaining duplicate identity groups: ${duplicateGroups.length}`
  );

  const duplicateRecordCount = duplicateGroups.reduce(
    (sum, group) => sum + group.totalRecords,
    0
  );

  console.log(
    `Records contained in duplicate groups: ${duplicateRecordCount}`
  );

  console.log("");

  if (duplicateGroups.length > 0) {
    console.log("Remaining duplicate groups:");

    for (const group of duplicateGroups) {
      console.log(
        `  ${group.countyName} — ${group.normalizedName}`
      );

      for (const record of group.records) {
        console.log(
          `    ID ${record.id}: ${record.name} | wards=${record.wardCount} | farmers=${record.farmerCount} | farms=${record.farmCount} | businessPartners=${record.businessPartnerCount}`
        );
      }
    }
  } else {
    console.log(
      "No remaining duplicate SubCounty identities found."
    );
  }

  // ------------------------------------------------------------
  // STEP 7 — AUTHORITATIVE SUBCOUNTY RESOLUTION MAP
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("STEP 7 — AUTHORITATIVE SUBCOUNTY RESOLUTION");
  console.log("==============================================================");

  const countyByNormalizedName = new Map<
    string,
    typeof counties
  >();

  for (const county of counties) {
    const key = normalizeCountyName(county.name);

    const existing = countyByNormalizedName.get(key) ?? [];

    existing.push(county);

    countyByNormalizedName.set(key, existing);
  }

  const exactSubcountyMap = new Map<string, typeof subcounties>();
  const looseSubcountyMap = new Map<string, typeof subcounties>();

  for (const subcounty of subcounties) {
    const exactKey =
      `${subcounty.countyId}::${normalizeExactName(subcounty.name)}`;

    const looseKey =
      `${subcounty.countyId}::${normalizeLooseName(subcounty.name)}`;

    const exactList =
      exactSubcountyMap.get(exactKey) ?? [];

    exactList.push(subcounty);

    exactSubcountyMap.set(exactKey, exactList);

    const looseList =
      looseSubcountyMap.get(looseKey) ?? [];

    looseList.push(subcounty);

    looseSubcountyMap.set(looseKey, looseList);
  }

  const canonicalResolution = {
    EXACT: 0,
    NORMALIZED: 0,
    ALIAS: 0,
    NOT_FOUND: 0,
    AMBIGUOUS: 0,
  };

  const canonicalResolutionDetails: Array<{
    countyName: string;
    sourceName: string;
    resolvedId: number | null;
    resolvedName: string | null;
    resolutionType:
      | "EXACT"
      | "NORMALIZED"
      | "ALIAS"
      | "NOT_FOUND"
      | "AMBIGUOUS";
    candidates: number[];
  }> = [];

  for (const source of canonicalSubcounties) {
    const sourceCountyCode =
      source.countyCode === undefined
        ? null
        : String(source.countyCode).padStart(3, "0");

    let countyCandidates = counties;

    if (sourceCountyCode !== null) {
      const numericCountyCode =
        Number(sourceCountyCode);

      if (!Number.isNaN(numericCountyCode)) {
        const matchingById = counties.filter(
          (county) => county.id === numericCountyCode
        );

        if (matchingById.length > 0) {
          countyCandidates = matchingById;
        }
      }
    }

    const sourceName = source.name;

    let selectedCounty =
      countyCandidates.length === 1
        ? countyCandidates[0]
        : null;

    if (!selectedCounty) {
      const normalizedSourceName =
        normalizeCountyName(sourceName);

      const matches = countyCandidates.filter(
        (county) =>
          normalizeCountyName(county.name) ===
          normalizedSourceName
      );

      if (matches.length === 1) {
        selectedCounty = matches[0];
      }
    }

    if (!selectedCounty) {
      canonicalResolution.NOT_FOUND++;

      canonicalResolutionDetails.push({
        countyName: sourceCountyCode ?? "UNKNOWN",
        sourceName,
        resolvedId: null,
        resolvedName: null,
        resolutionType: "NOT_FOUND",
        candidates: [],
      });

      continue;
    }

    const aliasResult =
      canonicalSubcountyAlias(sourceName);

    const exactKey =
      `${selectedCounty.id}::${normalizeExactName(sourceName)}`;

    const exactCandidates =
      exactSubcountyMap.get(exactKey) ?? [];

    if (exactCandidates.length === 1) {
      canonicalResolution.EXACT++;

      canonicalResolutionDetails.push({
        countyName: selectedCounty.name,
        sourceName,
        resolvedId: exactCandidates[0].id,
        resolvedName: exactCandidates[0].name,
        resolutionType: "EXACT",
        candidates: exactCandidates.map(
          (candidate) => candidate.id
        ),
      });

      continue;
    }

    if (exactCandidates.length > 1) {
      canonicalResolution.AMBIGUOUS++;

      canonicalResolutionDetails.push({
        countyName: selectedCounty.name,
        sourceName,
        resolvedId: null,
        resolvedName: null,
        resolutionType: "AMBIGUOUS",
        candidates: exactCandidates.map(
          (candidate) => candidate.id
        ),
      });

      continue;
    }

    const aliasKey =
      `${selectedCounty.id}::${aliasResult.normalized}`;

    const normalizedCandidates =
      looseSubcountyMap.get(aliasKey) ?? [];

    if (normalizedCandidates.length === 1) {
      const resolutionType =
        aliasResult.resolutionType === "ALIAS"
          ? "ALIAS"
          : "NORMALIZED";

      canonicalResolution[resolutionType]++;

      canonicalResolutionDetails.push({
        countyName: selectedCounty.name,
        sourceName,
        resolvedId: normalizedCandidates[0].id,
        resolvedName: normalizedCandidates[0].name,
        resolutionType,
        candidates: normalizedCandidates.map(
          (candidate) => candidate.id
        ),
      });

      continue;
    }

    if (normalizedCandidates.length > 1) {
      canonicalResolution.AMBIGUOUS++;

      canonicalResolutionDetails.push({
        countyName: selectedCounty.name,
        sourceName,
        resolvedId: null,
        resolvedName: null,
        resolutionType: "AMBIGUOUS",
        candidates: normalizedCandidates.map(
          (candidate) => candidate.id
        ),
      });

      continue;
    }

    canonicalResolution.NOT_FOUND++;

    canonicalResolutionDetails.push({
      countyName: selectedCounty.name,
      sourceName,
      resolvedId: null,
      resolvedName: null,
      resolutionType: "NOT_FOUND",
      candidates: [],
    });
  }

  console.log(
    `Canonical source records: ${canonicalSubcounties.length}`
  );

  console.log(
    `EXACT: ${canonicalResolution.EXACT}`
  );

  console.log(
    `NORMALIZED: ${canonicalResolution.NORMALIZED}`
  );

  console.log(
    `ALIAS: ${canonicalResolution.ALIAS}`
  );

  console.log(
    `NOT_FOUND: ${canonicalResolution.NOT_FOUND}`
  );

  console.log(
    `AMBIGUOUS: ${canonicalResolution.AMBIGUOUS}`
  );

  // ------------------------------------------------------------
  // STEP 8 — AUTHORITATIVE WARD OWNERSHIP RECONCILIATION
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("STEP 8 — AUTHORITATIVE WARD OWNERSHIP RECONCILIATION");
  console.log("==============================================================");

  const dbWardBySourceGid = new Map<
    number,
    (typeof wards)[number]
  >();

  for (const ward of wards) {
    if (
      ward.sourceGid !== null &&
      ward.sourceGid !== undefined
    ) {
      dbWardBySourceGid.set(
        safeNumber(ward.sourceGid),
        ward
      );
    }
  }

  const canonicalSubcountyBySourceIdentity =
    new Map<
      string,
      {
        id: number;
        name: string;
        countyId: number;
        countyName: string;
        resolutionType:
          | "EXACT"
          | "NORMALIZED"
          | "ALIAS";
      }
    >();

  for (const detail of canonicalResolutionDetails) {
    if (
      detail.resolvedId === null ||
      detail.resolvedId === undefined
    ) {
      continue;
    }

    const subcounty = subcounties.find(
      (item) => item.id === detail.resolvedId
    );

    if (!subcounty) {
      continue;
    }

    const county = counties.find(
      (item) => item.id === subcounty.countyId
    );

    if (!county) {
      continue;
    }

    const identityKey =
      `${subcounty.countyId}::${normalizeLooseName(detail.sourceName)}`;

    canonicalSubcountyBySourceIdentity.set(
      identityKey,
      {
        id: subcounty.id,
        name: subcounty.name,
        countyId: subcounty.countyId,
        countyName: county.name,
        resolutionType:
          detail.resolutionType as
            | "EXACT"
            | "NORMALIZED"
            | "ALIAS",
      }
    );
  }

  const wardAuditResults: WardAudit[] = [];

  let correctCount = 0;
  let wrongSubcountyCount = 0;
  let targetUnresolvedCount = 0;
  let wardNotFoundCount = 0;

  for (const feature of geoJson.features) {
    const properties = feature.properties ?? {};

    const sourceGid =
      properties.gid === undefined
        ? NaN
        : safeNumber(properties.gid);

    const wardName =
      properties.ward === undefined
        ? ""
        : String(properties.ward);

    const authoritativeCountyName =
      properties.county === undefined
        ? ""
        : String(properties.county);

    const authoritativeSubcountyName =
      properties.subcounty === undefined
        ? ""
        : String(properties.subcounty);

    const authoritativeScuid =
      properties.scuid === undefined ||
      properties.scuid === null
        ? null
        : String(properties.scuid);

    const normalizedCounty =
      normalizeCountyName(authoritativeCountyName);

    const countyCandidates =
      countyByNormalizedName.get(normalizedCounty) ??
      [];

    let authoritativeCountyId: number | null = null;

    if (countyCandidates.length === 1) {
      authoritativeCountyId =
        countyCandidates[0].id;
    }

    let authoritativeSubcountyId: number | null =
      null;

    let resolutionType:
      | "EXACT"
      | "NORMALIZED"
      | "ALIAS"
      | "NOT_FOUND"
      | "AMBIGUOUS" = "NOT_FOUND";

    if (authoritativeCountyId !== null) {
      const exactKey =
        `${authoritativeCountyId}::${normalizeExactName(authoritativeSubcountyName)}`;

      const exactCandidates =
        exactSubcountyMap.get(exactKey) ?? [];

      if (exactCandidates.length === 1) {
        authoritativeSubcountyId =
          exactCandidates[0].id;

        resolutionType = "EXACT";
      } else if (exactCandidates.length > 1) {
        resolutionType = "AMBIGUOUS";
      } else {
        const aliasResult =
          canonicalSubcountyAlias(
            authoritativeSubcountyName
          );

        const normalizedKey =
          `${authoritativeCountyId}::${aliasResult.normalized}`;

        const normalizedCandidates =
          looseSubcountyMap.get(normalizedKey) ?? [];

        if (normalizedCandidates.length === 1) {
          authoritativeSubcountyId =
            normalizedCandidates[0].id;

          resolutionType =
            aliasResult.resolutionType === "ALIAS"
              ? "ALIAS"
              : "NORMALIZED";
        } else if (normalizedCandidates.length > 1) {
          resolutionType = "AMBIGUOUS";
        } else {
          resolutionType = "NOT_FOUND";
        }
      }
    }

    const databaseWard =
      dbWardBySourceGid.get(sourceGid);

    if (!databaseWard) {
      wardNotFoundCount++;

      wardAuditResults.push({
        sourceGid,
        wardName,
        authoritativeCountyName,
        authoritativeSubcountyName,
        authoritativeScuid,
        authoritativeCountyId,
        authoritativeSubcountyId,
        databaseWardId: null,
        databaseWardName: null,
        databaseCountyId: null,
        databaseCountyName: null,
        databaseSubcountyId: null,
        databaseSubcountyName: null,
        status: "WARD_NOT_FOUND",
        resolutionType,
        notes: [
          "Authoritative sourceGid has no matching database Ward.",
        ],
      });

      continue;
    }

    const databaseCounty = counties.find(
      (county) => county.id === databaseWard.countyId
    );

    const databaseSubcounty =
      databaseWard.subCountyId === null
        ? null
        : subcounties.find(
            (subcounty) =>
              subcounty.id === databaseWard.subCountyId
          );

    const notes: string[] = [];

    if (
      databaseWard.countyId !==
      authoritativeCountyId
    ) {
      notes.push(
        "Database ward county differs from authoritative county."
      );
    }

    if (
      authoritativeSubcountyId === null
    ) {
      notes.push(
        "Authoritative target SubCounty could not be resolved."
      );

      targetUnresolvedCount++;

      wardAuditResults.push({
        sourceGid,
        wardName,
        authoritativeCountyName,
        authoritativeSubcountyName,
        authoritativeScuid,
        authoritativeCountyId,
        authoritativeSubcountyId,
        databaseWardId: databaseWard.id,
        databaseWardName: databaseWard.name,
        databaseCountyId: databaseWard.countyId,
        databaseCountyName:
          databaseCounty?.name ?? null,
        databaseSubcountyId:
          databaseWard.subCountyId,
        databaseSubcountyName:
          databaseSubcounty?.name ?? null,
        status: "TARGET_UNRESOLVED",
        resolutionType,
        notes,
      });

      continue;
    }

    if (
      databaseWard.subCountyId ===
        authoritativeSubcountyId &&
      databaseWard.countyId ===
        authoritativeCountyId
    ) {
      correctCount++;

      wardAuditResults.push({
        sourceGid,
        wardName,
        authoritativeCountyName,
        authoritativeSubcountyName,
        authoritativeScuid,
        authoritativeCountyId,
        authoritativeSubcountyId,
        databaseWardId: databaseWard.id,
        databaseWardName: databaseWard.name,
        databaseCountyId: databaseWard.countyId,
        databaseCountyName:
          databaseCounty?.name ?? null,
        databaseSubcountyId:
          databaseWard.subCountyId,
        databaseSubcountyName:
          databaseSubcounty?.name ?? null,
        status: "CORRECT",
        resolutionType,
        notes,
      });

      continue;
    }

    wrongSubcountyCount++;

    if (
      databaseWard.subCountyId !==
      authoritativeSubcountyId
    ) {
      notes.push(
        "Database ward points to a different SubCounty than the resolved authoritative target."
      );
    }

    wardAuditResults.push({
      sourceGid,
      wardName,
      authoritativeCountyName,
      authoritativeSubcountyName,
      authoritativeScuid,
      authoritativeCountyId,
      authoritativeSubcountyId,
      databaseWardId: databaseWard.id,
      databaseWardName: databaseWard.name,
      databaseCountyId: databaseWard.countyId,
      databaseCountyName:
        databaseCounty?.name ?? null,
      databaseSubcountyId:
        databaseWard.subCountyId,
      databaseSubcountyName:
        databaseSubcounty?.name ?? null,
      status: "WRONG_SUBCOUNTY",
      resolutionType,
      notes,
    });
  }

  console.log(
    `Total authoritative wards: ${geoJson.features.length}`
  );

  console.log(`CORRECT: ${correctCount}`);
  console.log(
    `WRONG_SUBCOUNTY: ${wrongSubcountyCount}`
  );
  console.log(
    `TARGET_UNRESOLVED: ${targetUnresolvedCount}`
  );
  console.log(
    `WARD_NOT_FOUND: ${wardNotFoundCount}`
  );

  const reconciledTotal =
    correctCount +
    wrongSubcountyCount +
    targetUnresolvedCount +
    wardNotFoundCount;

  console.log(
    `Reconciliation total: ${reconciledTotal}`
  );

  // ------------------------------------------------------------
  // STEP 9 — Tiaty SPECIAL CASE
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("STEP 9 — TIATY SPECIAL-CASE AUDIT");
  console.log("==============================================================");

  const tiatyRows = wardAuditResults.filter(
    (row) =>
      normalizeLooseName(
        row.authoritativeSubcountyName
      ) === "tiaty" ||
      normalizeLooseName(
        row.authoritativeSubcountyName
      ) === "tiaty sub county" ||
      normalizeLooseName(
        row.authoritativeSubcountyName
      ) === "tiaty east"
  );

  const tiatyDatabaseSubcountyIds = [
    ...new Set(
      tiatyRows
        .map((row) => row.databaseSubcountyId)
        .filter(
          (id): id is number => id !== null
        )
    ),
  ];

  const tiatyAuthoritativeTargets = [
    ...new Set(
      tiatyRows
        .map(
          (row) => row.authoritativeSubcountyId
        )
        .filter(
          (id): id is number => id !== null
        )
    ),
  ];

  console.log(
    `Tiaty-related authoritative wards: ${tiatyRows.length}`
  );

  console.log(
    `Tiaty database SubCounty IDs: ${
      tiatyDatabaseSubcountyIds.join(", ") || "NONE"
    }`
  );

  console.log(
    `Tiaty resolved authoritative target IDs: ${
      tiatyAuthoritativeTargets.join(", ") || "NONE"
    }`
  );

  const tiatySpecialReview = tiatyRows.map(
    (row) => ({
      sourceGid: row.sourceGid,
      wardName: row.wardName,
      authoritativeSubcountyName:
        row.authoritativeSubcountyName,
      authoritativeSubcountyId:
        row.authoritativeSubcountyId,
      databaseSubcountyId:
        row.databaseSubcountyId,
      databaseSubcountyName:
        row.databaseSubcountyName,
      status: row.status,
      resolutionType:
        row.resolutionType,
    })
  );

  if (tiatyRows.length > 0) {
    console.log("");
    console.log(
      "Tiaty remains explicitly flagged for manual review."
    );

    for (const row of tiatyRows) {
      console.log(
        `  GID ${row.sourceGid} | ${row.wardName} | DB=${row.databaseSubcountyId}:${row.databaseSubcountyName} | TARGET=${row.authoritativeSubcountyId}:${row.authoritativeSubcountyName} | ${row.status}`
      );
    }
  } else {
    console.log(
      "No Tiaty authoritative wards were found."
    );
  }

  // ------------------------------------------------------------
  // STEP 10 — V14.1 COMPARISON
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("STEP 10 — V14.1 COMPARISON");
  console.log("==============================================================");

  const previousV14_1Summary = {
    databaseSubcounties:
      v14_1?.databaseCounts?.subcounties ??
      v14_1?.databaseSnapshot?.subcounties ??
      null,

    databaseWards:
      v14_1?.databaseCounts?.wards ??
      v14_1?.databaseSnapshot?.wards ??
      null,

    correct:
      v14_1?.wardOwnership?.correct ??
      v14_1?.summary?.wardOwnership?.correct ??
      null,

    wrongSubcounty:
      v14_1?.wardOwnership?.wrongSubcounty ??
      v14_1?.summary?.wardOwnership?.wrongSubcounty ??
      null,

    targetUnresolved:
      v14_1?.wardOwnership?.targetUnresolved ??
      v14_1?.summary?.wardOwnership?.targetUnresolved ??
      null,

    duplicateGroups:
      v14_1?.remainingDuplicateIdentityGroups ??
      v14_1?.summary?.remainingDuplicateIdentityGroups ??
      null,
  };

  console.log(
    `V14.1 database subcounties: ${
      previousV14_1Summary.databaseSubcounties ?? "N/A"
    }`
  );

  console.log(
    `V15.1 database subcounties: ${subcounties.length}`
  );

  console.log(
    `V14.1 database wards: ${
      previousV14_1Summary.databaseWards ?? "N/A"
    }`
  );

  console.log(
    `V15.1 database wards: ${wards.length}`
  );

  console.log(
    `V14.1 correct wards: ${
      previousV14_1Summary.correct ?? "N/A"
    }`
  );

  console.log(`V15.1 correct wards: ${correctCount}`);

  console.log(
    `V14.1 wrong subcounty: ${
      previousV14_1Summary.wrongSubcounty ?? "N/A"
    }`
  );

  console.log(
    `V15.1 wrong subcounty: ${wrongSubcountyCount}`
  );

  console.log(
    `V14.1 target unresolved: ${
      previousV14_1Summary.targetUnresolved ?? "N/A"
    }`
  );

  console.log(
    `V15.1 target unresolved: ${targetUnresolvedCount}`
  );

  console.log(
    `V14.1 duplicate groups: ${
      previousV14_1Summary.duplicateGroups ?? "N/A"
    }`
  );

  console.log(
    `V15.1 duplicate groups: ${duplicateGroups.length}`
  );

  // ------------------------------------------------------------
  // STEP 11 — OWNERSHIP INTEGRITY
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("STEP 11 — WARD OWNERSHIP INTEGRITY");
  console.log("==============================================================");

  let wardCountyMismatchCount = 0;
  let wardSubcountyReferenceMismatchCount = 0;
  let wardsWithNullSubcounty = 0;

  for (const ward of wards) {
    const subcounty =
      ward.subCountyId === null
        ? null
        : subcounties.find(
            (item) => item.id === ward.subCountyId
          );

    if (ward.subCountyId === null) {
      wardsWithNullSubcounty++;
      continue;
    }

    if (!subcounty) {
      wardSubcountyReferenceMismatchCount++;
      continue;
    }

    if (subcounty.countyId !== ward.countyId) {
      wardCountyMismatchCount++;
      wardSubcountyReferenceMismatchCount++;
    }
  }

  console.log(
    `Ward county mismatches: ${wardCountyMismatchCount}`
  );

  console.log(
    `Ward SubCounty reference mismatches: ${wardSubcountyReferenceMismatchCount}`
  );

  console.log(
    `Wards with NULL SubCounty: ${wardsWithNullSubcounty}`
  );

  const ownershipIntegrityPassed =
    wardCountyMismatchCount === 0 &&
    wardSubcountyReferenceMismatchCount === 0;

  console.log(
    `OWNERSHIP INTEGRITY: ${
      ownershipIntegrityPassed ? "PASS" : "FAIL"
    }`
  );

  // ------------------------------------------------------------
  // STEP 12 — FINAL GATES
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("STEP 12 — V15.1 FINAL SAFETY GATES");
  console.log("==============================================================");

  const wardCountPassed = wards.length === 1450;

  const sourceGidCountPassed =
    databaseSourceGids.length === 1450 &&
    databaseSourceGidSet.size === 1450;

  const subcountyCountPassed =
    subcounties.length === 417;

  const deletionIdsPassed =
    uniqueDeletedIds.length === 122 &&
    deletedIdsStillPresent.length === 0;

  const targetIdsPassed =
    uniqueTargetIds.length === 122 &&
    targetIdsMissing.length === 0;

  const noDeletedReferencesPassed =
    deletedReferenceAuditPassed;

  const authoritativeCoveragePassed =
    reconciledTotal === geoJson.features.length &&
    wardNotFoundCount === 0;

  const finalStatus =
    subcountyCountPassed &&
    wardCountPassed &&
    sourceGidCountPassed &&
    structuralGidAuditPassed &&
    deletionIdsPassed &&
    targetIdsPassed &&
    noDeletedReferencesPassed &&
    ownershipIntegrityPassed &&
    authoritativeCoveragePassed
      ? "PASS"
      : "REVIEW_REQUIRED";

  console.log(
    `SubCounty count = 417: ${
      subcountyCountPassed ? "PASS" : "FAIL"
    }`
  );

  console.log(
    `Wards = 1450: ${
      wardCountPassed ? "PASS" : "FAIL"
    }`
  );

  console.log(
    `SourceGIDs = 1450 unique: ${
      sourceGidCountPassed ? "PASS" : "FAIL"
    }`
  );

  console.log(
    `Structural GID audit: ${
      structuralGidAuditPassed ? "PASS" : "FAIL"
    }`
  );

  console.log(
    `Deleted IDs removed: ${
      deletionIdsPassed ? "PASS" : "FAIL"
    }`
  );

  console.log(
    `Target IDs preserved: ${
      targetIdsPassed ? "PASS" : "FAIL"
    }`
  );

  console.log(
    `No references to deleted IDs: ${
      noDeletedReferencesPassed ? "PASS" : "FAIL"
    }`
  );

  console.log(
    `Ward ownership integrity: ${
      ownershipIntegrityPassed ? "PASS" : "FAIL"
    }`
  );

  console.log(
    `Authoritative ward coverage: ${
      authoritativeCoveragePassed ? "PASS" : "FAIL"
    }`
  );

  console.log("");
  console.log(
    `V15.1 FINAL STATUS: ${finalStatus}`
  );

  // ------------------------------------------------------------
  // STEP 13 — SAVE JSON REPORT
  // ------------------------------------------------------------

  const auditReport = {
    generatedAt: new Date().toISOString(),

    mode: "READ_ONLY_FINAL_POST_DELETION_AUDIT",

    expectedState: {
      subcounties: 417,
      deletedSubcounties: 122,
      canonicalTargets: 122,
      wards: 1450,
      uniqueSourceGids: 1450,
    },

    databaseSnapshot: {
      counties: counties.length,
      subcounties: subcounties.length,
      wards: wards.length,
      farmers: farmersCount,
      farms: farmsCount,
      businessPartners: businessPartnersCount,
      commodityTransactions:
        commodityTransactionsCount,
    },

    v15DeletionVerification: {
      deletedIdsLoaded: uniqueDeletedIds.length,
      deletedIdsStillPresent:
        deletedIdsStillPresent.length,
      targetIdsLoaded: uniqueTargetIds.length,
      targetIdsMissing: targetIdsMissing.length,
      status:
        deletionVerificationPassed
          ? "PASS"
          : "FAIL",
    },

    structuralGidAudit: {
      authoritativeGids: authoritativeGids.length,
      uniqueAuthoritativeGids:
        authoritativeGidSet.size,
      duplicateAuthoritativeGids:
        duplicateAuthoritativeGids.length,

      databaseSourceGids:
        databaseSourceGids.length,
      uniqueDatabaseSourceGids:
        databaseSourceGidSet.size,
      duplicateDatabaseSourceGids:
        duplicateDatabaseGids.length,

      missingAuthoritativeGids:
        missingAuthoritativeGids.length,
      unexpectedDatabaseGids:
        unexpectedDatabaseGids.length,

      status:
        structuralGidAuditPassed
          ? "PASS"
          : "FAIL",
    },

    deletedReferenceAudit: {
      wardsReferencingDeletedIds:
        wardsReferencingDeletedIds.length,
      farmerReferences:
        farmerDeletedReferences,
      farmReferences:
        farmDeletedReferences,
      businessPartnerReferences:
        businessPartnerDeletedReferences,
      commodityDestinationReferences:
        commodityDestinationDeletedReferences,
      commoditySourceReferences:
        commoditySourceDeletedReferences,
      status:
        deletedReferenceAuditPassed
          ? "PASS"
          : "FAIL",
    },

    canonicalResolution: {
      canonicalSourceRecords:
        canonicalSubcounties.length,
      ...canonicalResolution,
    },

    wardOwnershipReconciliation: {
      totalAuthoritativeWards:
        geoJson.features.length,
      correct: correctCount,
      wrongSubcounty:
        wrongSubcountyCount,
      targetUnresolved:
        targetUnresolvedCount,
      wardNotFound:
        wardNotFoundCount,
      totalReconciled:
        reconciledTotal,
    },

    remainingDuplicateIdentities: {
      groupCount: duplicateGroups.length,
      recordsInDuplicateGroups:
        duplicateRecordCount,
      groups: duplicateGroups,
    },

    ownershipIntegrity: {
      wardCountyMismatchCount,
      wardSubcountyReferenceMismatchCount,
      wardsWithNullSubcounty,
      status:
        ownershipIntegrityPassed
          ? "PASS"
          : "FAIL",
    },

    tiatySpecialReview: {
      wardCount: tiatyRows.length,
      databaseSubcountyIds:
        tiatyDatabaseSubcountyIds,
      authoritativeTargetIds:
        tiatyAuthoritativeTargets,
      rows: tiatySpecialReview,
      status:
        tiatyRows.length > 0
          ? "MANUAL_REVIEW_REQUIRED"
          : "NO_TREATMENT_REQUIRED",
    },

    comparisonWithV14_1:
      previousV14_1Summary,

    finalGates: {
      subcountyCountPassed,
      wardCountPassed,
      sourceGidCountPassed,
      structuralGidAuditPassed,
      deletionIdsPassed,
      targetIdsPassed,
      noDeletedReferencesPassed,
      authoritativeCoveragePassed,
      ownershipIntegrityPassed,
    },

    finalStatus,

    wardResults: wardAuditResults,
  };

  fs.writeFileSync(
    outputJsonPath,
    JSON.stringify(
      auditReport,
      (_key, value) =>
        typeof value === "bigint"
          ? Number(value)
          : value,
      2
    ),
    "utf8"
  );

  // ------------------------------------------------------------
  // STEP 14 — SAVE CSV REPORT
  // ------------------------------------------------------------

  const csvRows: string[] = [];

  csvRows.push(
    [
      "sourceGid",
      "wardName",
      "authoritativeCountyName",
      "authoritativeSubcountyName",
      "authoritativeScuid",
      "authoritativeCountyId",
      "authoritativeSubcountyId",
      "databaseWardId",
      "databaseWardName",
      "databaseCountyId",
      "databaseCountyName",
      "databaseSubcountyId",
      "databaseSubcountyName",
      "status",
      "resolutionType",
      "notes",
    ]
      .map(csvEscape)
      .join(",")
  );

  for (const row of wardAuditResults) {
    csvRows.push(
      [
        row.sourceGid,
        row.wardName,
        row.authoritativeCountyName,
        row.authoritativeSubcountyName,
        row.authoritativeScuid,
        row.authoritativeCountyId,
        row.authoritativeSubcountyId,
        row.databaseWardId,
        row.databaseWardName,
        row.databaseCountyId,
        row.databaseCountyName,
        row.databaseSubcountyId,
        row.databaseSubcountyName,
        row.status,
        row.resolutionType,
        row.notes.join(" | "),
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  fs.writeFileSync(
    outputCsvPath,
    csvRows.join("\n"),
    "utf8"
  );

  // ------------------------------------------------------------
  // FINAL OUTPUT
  // ------------------------------------------------------------

  console.log("");
  console.log("==============================================================");
  console.log("V15.1 FINAL POST-DELETION AUDIT COMPLETE");
  console.log("==============================================================");
  console.log("");

  console.log(
    `SubCounty records: ${subcounties.length}`
  );

  console.log(
    `Expected SubCounty records: 417`
  );

  console.log(
    `Wards: ${wards.length}`
  );

  console.log(
    `Unique ward sourceGIDs: ${databaseSourceGidSet.size}`
  );

  console.log(
    `Remaining duplicate groups: ${duplicateGroups.length}`
  );

  console.log(
    `Correct ward ownership: ${correctCount}`
  );

  console.log(
    `Wrong subcounty: ${wrongSubcountyCount}`
  );

  console.log(
    `Target unresolved: ${targetUnresolvedCount}`
  );

  console.log(
    `Ward not found: ${wardNotFoundCount}`
  );

  console.log(
    `Tiaty wards requiring manual review: ${tiatyRows.length}`
  );

  console.log("");

  console.log(
    `V15.1 FINAL STATUS: ${finalStatus}`
  );

  console.log("");

  console.log(`JSON: ${outputJsonPath}`);
  console.log(`CSV:  ${outputCsvPath}`);

  console.log("");

  if (finalStatus === "PASS") {
    console.log(
      "V15.1 passed all structural, deletion, reference, and ownership-integrity gates."
    );
  } else {
    console.log(
      "V15.1 completed, but one or more gates require review."
    );
  }

  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("V15.1 AUDIT FAILED");
    console.error("");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });