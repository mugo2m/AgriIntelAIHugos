import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

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

const ROOT = process.cwd();

const GEOJSON_PATH = path.join(
  ROOT,
  "prisma",
  "data",
  "kenya-wards-1450.geojson"
);

const V14_PATH = path.join(
  ROOT,
  "prisma",
  "data",
  "consolidation-migration-v14.json"
);

const OUTPUT_JSON = path.join(
  ROOT,
  "prisma",
  "data",
  "post-migration-audit-v14-1.json"
);

const OUTPUT_CSV = path.join(
  ROOT,
  "prisma",
  "data",
  "post-migration-audit-v14-1.csv"
);

type GeoJsonFeature = {
  type: string;
  properties?: {
    gid?: number | string;
    pop2009?: number | string;
    county?: string;
    subcounty?: string;
    ward?: string;
    uid?: number | string;
    scuid?: number | string;
    cuid?: number | string;
    [key: string]: unknown;
  };
};

type GeoJson = {
  type: string;
  features: GeoJsonFeature[];
};

type V14Migration = {
  oldSubCountyId: number;
  oldSubCountyName: string;
  targetSubCountyId: number;
  targetSubCountyName: string;
  countyId: number;
  countyName: string;
  expectedWardCount?: number;
  oldWardCount?: number;
  wardCount?: number;
  movedWardCount?: number;
  movedWardIds?: number[];
  movedWardGids?: number[];
  [key: string]: unknown;
};

type AuditResult = {
  gid: number;
  wardId: number | null;
  wardName: string;
  countyName: string;
  authoritativeSubcountyName: string;
  authoritativeScuid: number | null;
  databaseSubCountyId: number | null;
  databaseSubCountyName: string | null;
  databaseCountyId: number | null;
  databaseCountyName: string | null;
  status:
    | "CORRECT"
    | "WRONG_SUBCOUNTY"
    | "TARGET_UNRESOLVED"
    | "WARD_NOT_FOUND";
  detail: string;
};

function normalizeName(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/&/g, "and")
    .replace(/[-_/.,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLooseName(value: unknown): string {
  return normalizeName(value)
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalAlias(value: string): string {
  const key = normalizeLooseName(value);

  const aliases: Record<string, string> = {
    "tiaty sub county": "Tiaty East",
    tiaty: "Tiaty East",

    "transmara east": "Trans Mara East",
    "trans mara east": "Trans Mara East",

    "transmara west": "Trans Mara West",
    "trans mara west": "Trans Mara West",

    "muranga south": "Murang'a South",
    "muranga east": "Murang'a East",

    mukurewini: "Mukurwe-ini",

    "mandera west": "Mandera West",
    "mandera east": "Mandera East",
    "mandera north": "Mandera North",

    banisa: "Banisa",
    lafey: "Lafey",
    ainabkoi: "Ainabkoi",
    kesses: "Kesses",
  };

  return aliases[key] ?? value;
}

function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n) ? n : null;
}

function escapeCsv(value: unknown): string {
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

function writeCsv(
  rows: Array<Record<string, unknown>>,
  filePath: string
) {
  if (rows.length === 0) {
    fs.writeFileSync(filePath, "", "utf8");
    return;
  }

  const headers = Object.keys(rows[0]);

  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsv(row[header])).join(",")
    ),
  ];

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

function loadGeoJson(): GeoJson {
  if (!fs.existsSync(GEOJSON_PATH)) {
    throw new Error(`GeoJSON not found: ${GEOJSON_PATH}`);
  }

  const raw = fs.readFileSync(GEOJSON_PATH, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.features)) {
    throw new Error("Invalid Kenya wards GeoJSON.");
  }

  return parsed;
}

function loadV14(): any {
  if (!fs.existsSync(V14_PATH)) {
    throw new Error(`V14 migration log not found: ${V14_PATH}`);
  }

  const raw = fs.readFileSync(V14_PATH, "utf8");

  return JSON.parse(raw);
}

function extractV14Results(v14: any): V14Migration[] {
  if (Array.isArray(v14)) {
    return v14;
  }

  if (Array.isArray(v14.results)) {
    return v14.results;
  }

  if (Array.isArray(v14.migrations)) {
    return v14.migrations;
  }

  if (Array.isArray(v14.migrationResults)) {
    return v14.migrationResults;
  }

  throw new Error(
    "Could not find V14 migration results array in consolidation-migration-v14.json."
  );
}

async function main() {
  console.log("");
  console.log("==============================================");
  console.log("V14.1 POST-MIGRATION RECONCILIATION AUDIT");
  console.log("==============================================");
  console.log("");

  const geojson = loadGeoJson();
  const v14 = loadV14();

  const features = geojson.features;
  const migrations = extractV14Results(v14);

  console.log(`Authoritative GeoJSON features: ${features.length}`);
  console.log(`V14 migrations loaded: ${migrations.length}`);
  console.log("");

  if (features.length !== 1450) {
    throw new Error(
      `Expected 1450 authoritative wards but found ${features.length}.`
    );
  }

  if (migrations.length !== 122) {
    throw new Error(
      `Expected 122 V14 migrations but found ${migrations.length}.`
    );
  }

  /*
   * ------------------------------------------------------------
   * STEP 1 — AUTHORITATIVE GIDS
   * ------------------------------------------------------------
   */

  const authoritativeGids = features
    .map((feature) => safeNumber(feature.properties?.gid))
    .filter((value): value is number => value !== null);

  const authoritativeGidSet = new Set(authoritativeGids);

  const duplicateAuthoritativeGids = authoritativeGids.filter(
    (gid, index) => authoritativeGids.indexOf(gid) !== index
  );

  console.log("STEP 1 — AUTHORITATIVE GID AUDIT");
  console.log("--------------------------------");

  console.log(
    `Authoritative GIDs: ${authoritativeGids.length}`
  );

  console.log(
    `Unique authoritative GIDs: ${authoritativeGidSet.size}`
  );

  console.log(
    `Duplicate authoritative GIDs: ${duplicateAuthoritativeGids.length}`
  );

  if (authoritativeGidSet.size !== 1450) {
    throw new Error(
      "Authoritative GID integrity failed."
    );
  }

  if (duplicateAuthoritativeGids.length > 0) {
    throw new Error(
      "Duplicate authoritative GIDs detected."
    );
  }

  /*
   * ------------------------------------------------------------
   * STEP 2 — LOAD CURRENT DATABASE
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("STEP 2 — CURRENT DATABASE SNAPSHOT");
  console.log("----------------------------------");

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
    orderBy: {
      sourceGid: "asc",
    },
  });

  console.log(`Database counties: ${counties.length}`);
  console.log(`Database subcounties: ${subcounties.length}`);
  console.log(`Database wards: ${wards.length}`);

  /*
   * ------------------------------------------------------------
   * STEP 3 — DATABASE SOURCE GID INTEGRITY
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("STEP 3 — DATABASE SOURCE GID AUDIT");
  console.log("----------------------------------");

  const dbGids = wards
    .map((ward) => safeNumber(ward.sourceGid))
    .filter((value): value is number => value !== null);

  const dbGidSet = new Set(dbGids);

  const duplicateDbGids = dbGids.filter(
    (gid, index) => dbGids.indexOf(gid) !== index
  );

  const missingGids = authoritativeGids.filter(
    (gid) => !dbGidSet.has(gid)
  );

  const unexpectedGids = dbGids.filter(
    (gid) => !authoritativeGidSet.has(gid)
  );

  console.log(`Database sourceGIDs: ${dbGids.length}`);
  console.log(`Unique database sourceGIDs: ${dbGidSet.size}`);
  console.log(
    `Duplicate database sourceGIDs: ${duplicateDbGids.length}`
  );
  console.log(
    `Missing authoritative GIDs: ${missingGids.length}`
  );
  console.log(
    `Unexpected database GIDs: ${unexpectedGids.length}`
  );

  const structuralPass =
    dbGids.length === 1450 &&
    dbGidSet.size === 1450 &&
    duplicateDbGids.length === 0 &&
    missingGids.length === 0 &&
    unexpectedGids.length === 0;

  console.log(
    `STRUCTURAL GID AUDIT: ${
      structuralPass ? "PASS" : "FAIL"
    }`
  );

  /*
   * ------------------------------------------------------------
   * STEP 4 — INDEX DATABASE
   * ------------------------------------------------------------
   */

  const wardByGid = new Map<
    number,
    (typeof wards)[number]
  >();

  for (const ward of wards) {
    const gid = safeNumber(ward.sourceGid);

    if (gid !== null) {
      wardByGid.set(gid, ward);
    }
  }

  const countyById = new Map(
    counties.map((county) => [county.id, county])
  );

  const subcountyById = new Map(
    subcounties.map((subcounty) => [
      subcounty.id,
      subcounty,
    ])
  );

  /*
   * ------------------------------------------------------------
   * STEP 5 — AUTHORITATIVE TARGET RESOLUTION
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("STEP 5 — AUTHORITATIVE TARGET RESOLUTION");
  console.log("----------------------------------------");

  const targetMap = new Map<
    string,
    {
      countyId: number;
      countyName: string;
      subCountyId: number;
      subCountyName: string;
      resolution: string;
    }
  >();

  const canonicalSourceRecords = new Map<
    string,
    {
      countyName: string;
      subcountyName: string;
      scuid: number | null;
      gids: number[];
    }
  >();

  for (const feature of features) {
    const p = feature.properties ?? {};

    const countyName = String(p.county ?? "").trim();
    const subcountyName =
      String(p.subcounty ?? "").trim();

    const scuid = safeNumber(p.scuid);
    const gid = safeNumber(p.gid);

    if (gid === null) {
      continue;
    }

    const countyKey = normalizeName(countyName);

    const exactKey =
      `${countyKey}::${normalizeName(
        subcountyName
      )}`;

    if (!canonicalSourceRecords.has(exactKey)) {
      canonicalSourceRecords.set(exactKey, {
        countyName,
        subcountyName,
        scuid,
        gids: [],
      });
    }

    canonicalSourceRecords
      .get(exactKey)!
      .gids
      .push(gid);
  }

  for (const [
    exactKey,
    sourceRecord,
  ] of canonicalSourceRecords.entries()) {
    const countyKey = normalizeName(
      sourceRecord.countyName
    );

    const countyMatches = counties.filter(
      (county) =>
        normalizeName(county.name) === countyKey
    );

    if (countyMatches.length !== 1) {
      continue;
    }

    const county = countyMatches[0];

    const countySubcounties = subcounties.filter(
      (subcounty) =>
        subcounty.countyId === county.id
    );

    const exactMatches = countySubcounties.filter(
      (subcounty) =>
        normalizeName(subcounty.name) ===
        normalizeName(sourceRecord.subcountyName)
    );

    if (exactMatches.length === 1) {
      targetMap.set(exactKey, {
        countyId: county.id,
        countyName: county.name,
        subCountyId: exactMatches[0].id,
        subCountyName: exactMatches[0].name,
        resolution: "EXACT",
      });

      continue;
    }

    const aliasName = canonicalAlias(
      sourceRecord.subcountyName
    );

    const aliasMatches = countySubcounties.filter(
      (subcounty) =>
        normalizeName(subcounty.name) ===
        normalizeName(aliasName)
    );

    if (aliasMatches.length === 1) {
      targetMap.set(exactKey, {
        countyId: county.id,
        countyName: county.name,
        subCountyId: aliasMatches[0].id,
        subCountyName: aliasMatches[0].name,
        resolution: "ALIAS",
      });

      continue;
    }

    const normalizedMatches = countySubcounties.filter(
      (subcounty) =>
        normalizeLooseName(subcounty.name) ===
        normalizeLooseName(aliasName)
    );

    if (normalizedMatches.length === 1) {
      targetMap.set(exactKey, {
        countyId: county.id,
        countyName: county.name,
        subCountyId: normalizedMatches[0].id,
        subCountyName: normalizedMatches[0].name,
        resolution: "NORMALIZED",
      });
    }
  }

  const actualResolutionCounts = {
    EXACT: 0,
    NORMALIZED: 0,
    ALIAS: 0,
    NOT_FOUND: 0,
    AMBIGUOUS: 0,
  };

  for (const key of canonicalSourceRecords.keys()) {
    const target = targetMap.get(key);

    if (!target) {
      actualResolutionCounts.NOT_FOUND++;
      continue;
    }

    if (
      target.resolution === "EXACT"
    ) {
      actualResolutionCounts.EXACT++;
    } else if (
      target.resolution === "NORMALIZED"
    ) {
      actualResolutionCounts.NORMALIZED++;
    } else if (
      target.resolution === "ALIAS"
    ) {
      actualResolutionCounts.ALIAS++;
    }
  }

  console.log(
    `Unique authoritative subcounty identities: ${
      canonicalSourceRecords.size
    }`
  );

  console.log(
    `EXACT: ${actualResolutionCounts.EXACT}`
  );

  console.log(
    `NORMALIZED: ${actualResolutionCounts.NORMALIZED}`
  );

  console.log(
    `ALIAS: ${actualResolutionCounts.ALIAS}`
  );

  console.log(
    `NOT_FOUND: ${actualResolutionCounts.NOT_FOUND}`
  );

  console.log(
    `AMBIGUOUS: ${actualResolutionCounts.AMBIGUOUS}`
  );

  /*
   * ------------------------------------------------------------
   * STEP 6 — AUTHORITATIVE WARD OWNERSHIP AUDIT
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("STEP 6 — WARD OWNERSHIP RECONCILIATION");
  console.log("--------------------------------------");

  const auditResults: AuditResult[] = [];

  let correct = 0;
  let wrongSubcounty = 0;
  let targetUnresolved = 0;
  let wardNotFound = 0;

  for (const feature of features) {
    const p = feature.properties ?? {};

    const gid = safeNumber(p.gid);

    if (gid === null) {
      continue;
    }

    const authoritativeCountyName =
      String(p.county ?? "").trim();

    const authoritativeSubcountyName =
      String(p.subcounty ?? "").trim();

    const wardName =
      String(p.ward ?? "").trim();

    const scuid = safeNumber(p.scuid);

    const ward = wardByGid.get(gid);

    if (!ward) {
      wardNotFound++;

      auditResults.push({
        gid,
        wardId: null,
        wardName,
        countyName: authoritativeCountyName,
        authoritativeSubcountyName,
        authoritativeScuid: scuid,
        databaseSubCountyId: null,
        databaseSubCountyName: null,
        databaseCountyId: null,
        databaseCountyName: null,
        status: "WARD_NOT_FOUND",
        detail:
          "Authoritative GID does not exist in the database.",
      });

      continue;
    }

    const sourceKey =
      `${normalizeName(
        authoritativeCountyName
      )}::${normalizeName(
        authoritativeSubcountyName
      )}`;

    const target = targetMap.get(sourceKey);

    if (!target) {
      targetUnresolved++;

      auditResults.push({
        gid,
        wardId: ward.id,
        wardName: ward.name,
        countyName: authoritativeCountyName,
        authoritativeSubcountyName,
        authoritativeScuid: scuid,
        databaseSubCountyId: ward.subCountyId,
        databaseSubCountyName:
          ward.subCounty?.name ?? null,
        databaseCountyId: ward.countyId,
        databaseCountyName:
          ward.county?.name ?? null,
        status: "TARGET_UNRESOLVED",
        detail:
          "Authoritative county and subcounty could not be resolved to a unique Prisma target.",
      });

      continue;
    }

    const countyCorrect =
      ward.countyId === target.countyId;

    const subcountyCorrect =
      ward.subCountyId === target.subCountyId;

    if (
      countyCorrect &&
      subcountyCorrect
    ) {
      correct++;

      auditResults.push({
        gid,
        wardId: ward.id,
        wardName: ward.name,
        countyName: authoritativeCountyName,
        authoritativeSubcountyName,
        authoritativeScuid: scuid,
        databaseSubCountyId: ward.subCountyId,
        databaseSubCountyName:
          ward.subCounty?.name ?? null,
        databaseCountyId: ward.countyId,
        databaseCountyName:
          ward.county?.name ?? null,
        status: "CORRECT",
        detail:
          "Database county and canonical subcounty ownership match the authoritative source.",
      });
    } else {
      wrongSubcounty++;

      let detail =
        "Database ownership does not match the resolved authoritative target.";

      if (!countyCorrect) {
        detail =
          "Ward countyId does not match the authoritative county target.";
      } else if (!subcountyCorrect) {
        detail =
          "Ward subCountyId does not match the authoritative canonical subcounty target.";
      }

      auditResults.push({
        gid,
        wardId: ward.id,
        wardName: ward.name,
        countyName: authoritativeCountyName,
        authoritativeSubcountyName,
        authoritativeScuid: scuid,
        databaseSubCountyId: ward.subCountyId,
        databaseSubCountyName:
          ward.subCounty?.name ?? null,
        databaseCountyId: ward.countyId,
        databaseCountyName:
          ward.county?.name ?? null,
        status: "WRONG_SUBCOUNTY",
        detail,
      });
    }
  }

  console.log(`CORRECT: ${correct}`);
  console.log(
    `WRONG_SUBCOUNTY: ${wrongSubcounty}`
  );
  console.log(
    `TARGET_UNRESOLVED: ${targetUnresolved}`
  );
  console.log(
    `WARD_NOT_FOUND: ${wardNotFound}`
  );

  /*
   * ------------------------------------------------------------
   * STEP 7 — VERIFY EVERY V14 MIGRATION
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("STEP 7 — V14 MIGRATION VERIFICATION");
  console.log("-----------------------------------");

  const migrationAudit: Array<
    Record<string, unknown>
  > = [];

  let migrationsPassed = 0;
  let migrationsFailed = 0;
  let migratedWardsVerified = 0;

  for (const migration of migrations) {
    const oldId =
      Number(migration.oldSubCountyId);

    const targetId =
      Number(migration.targetSubCountyId);

    const countyId =
      Number(migration.countyId);

    const oldRecord =
      subcountyById.get(oldId);

    const targetRecord =
      subcountyById.get(targetId);

    const expectedWardCount =
      Number(
        migration.expectedWardCount ??
        migration.oldWardCount ??
        migration.wardCount ??
        migration.movedWardCount ??
        0
      );

    const expectedWardIds =
      Array.isArray(
        migration.movedWardIds
      )
        ? migration.movedWardIds
            .map(Number)
            .sort((a, b) => a - b)
        : [];

    const targetWardIds = wards
      .filter(
        (ward) =>
          ward.subCountyId === targetId
      )
      .map((ward) => ward.id)
      .sort((a, b) => a - b);

    const oldWardIds = wards
      .filter(
        (ward) =>
          ward.subCountyId === oldId
      )
      .map((ward) => ward.id)
      .sort((a, b) => a - b);

    const targetWardCount =
      targetRecord?._count.wards ?? 0;

    const oldWardCount =
      oldRecord?._count.wards ?? 0;

    const targetCountyCorrect =
      targetRecord?.countyId === countyId;

    const oldEmpty =
      oldWardCount === 0;

    const dependencyFree =
      (oldRecord?._count.farmers ?? 0) === 0 &&
      (oldRecord?._count.farms ?? 0) === 0 &&
      (oldRecord?._count.businessPartners ?? 0) === 0;

    const expectedWardIdsMatch =
      expectedWardIds.length === 0 ||
      JSON.stringify(targetWardIds) ===
        JSON.stringify(expectedWardIds);

    const passed =
      !!oldRecord &&
      !!targetRecord &&
      targetCountyCorrect &&
      oldEmpty &&
      targetWardCount === expectedWardCount &&
      dependencyFree &&
      expectedWardIdsMatch;

    if (passed) {
      migrationsPassed++;
      migratedWardsVerified += targetWardCount;
    } else {
      migrationsFailed++;
    }

    migrationAudit.push({
      countyId,
      countyName:
        migration.countyName,
      oldSubCountyId: oldId,
      oldSubCountyName:
        migration.oldSubCountyName ??
        oldRecord?.name ??
        null,
      targetSubCountyId: targetId,
      targetSubCountyName:
        migration.targetSubCountyName ??
        targetRecord?.name ??
        null,
      expectedWardCount,
      actualOldWardCount:
        oldWardCount,
      actualTargetWardCount:
        targetWardCount,
      expectedWardIds,
      actualTargetWardIds:
        targetWardIds,
      oldWardIds,
      targetCountyCorrect,
      oldEmpty,
      dependencyFree,
      expectedWardIdsMatch,
      passed,
    });
  }

  console.log(
    `V14 migrations expected: ${migrations.length}`
  );

  console.log(
    `Migrations passed: ${migrationsPassed}`
  );

  console.log(
    `Migrations failed: ${migrationsFailed}`
  );

  console.log(
    `Migrated wards verified: ${migratedWardsVerified}`
  );

  /*
   * ------------------------------------------------------------
   * STEP 8 — OLD RECORD DEPENDENCY AUDIT
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("STEP 8 — OLD SUBCOUNTY DEPENDENCY AUDIT");
  console.log("---------------------------------------");

  const oldRecordAudit = migrations.map(
    (migration) => {
      const oldId =
        Number(migration.oldSubCountyId);

      const record =
        subcountyById.get(oldId);

      return {
        subCountyId: oldId,
        subCountyName:
          migration.oldSubCountyName ??
          record?.name ??
          null,
        countyId:
          migration.countyId,
        wardCount:
          record?._count.wards ?? null,
        farmersCount:
          record?._count.farmers ?? null,
        farmsCount:
          record?._count.farms ?? null,
        businessPartnersCount:
          record?._count.businessPartners ?? null,
        empty:
          !!record &&
          record._count.wards === 0 &&
          record._count.farmers === 0 &&
          record._count.farms === 0 &&
          record._count.businessPartners === 0,
      };
    }
  );

  const oldRecordsWithDependencies =
    oldRecordAudit.filter(
      (row) =>
        row.wardCount !== 0 ||
        row.farmersCount !== 0 ||
        row.farmsCount !== 0 ||
        row.businessPartnersCount !== 0
    );

  console.log(
    `Old records audited: ${oldRecordAudit.length}`
  );

  console.log(
    `Old records with dependencies: ${
      oldRecordsWithDependencies.length
    }`
  );

  /*
   * ------------------------------------------------------------
   * STEP 9 — WARD COUNTY/SUBCOUNTY INTEGRITY
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("STEP 9 — WARD OWNERSHIP INTEGRITY");
  console.log("---------------------------------");

  const wardCountyMismatches: Array<
    Record<string, unknown>
  > = [];

  const wardSubcountyMismatches: Array<
    Record<string, unknown>
  > = [];

  for (const ward of wards) {
    if (ward.subCountyId === null) {
      continue;
    }

    const subcounty =
      subcountyById.get(
        ward.subCountyId
      );

    if (!subcounty) {
      wardSubcountyMismatches.push({
        wardId: ward.id,
        sourceGid: ward.sourceGid,
        wardName: ward.name,
        countyId: ward.countyId,
        subCountyId: ward.subCountyId,
        problem:
          "SUBCOUNTY_NOT_FOUND",
      });

      continue;
    }

    if (
      subcounty.countyId !==
      ward.countyId
    ) {
      wardCountyMismatches.push({
        wardId: ward.id,
        sourceGid: ward.sourceGid,
        wardName: ward.name,
        wardCountyId:
          ward.countyId,
        wardCountyName:
          countyById.get(
            ward.countyId
          )?.name ?? null,
        subCountyId:
          subcounty.id,
        subCountyName:
          subcounty.name,
        subCountyCountyId:
          subcounty.countyId,
        subCountyCountyName:
          countyById.get(
            subcounty.countyId
          )?.name ?? null,
      });
    }
  }

  console.log(
    `Ward county mismatches: ${
      wardCountyMismatches.length
    }`
  );

  console.log(
    `Ward SubCounty mismatches: ${
      wardSubcountyMismatches.length
    }`
  );

  /*
   * ------------------------------------------------------------
   * STEP 10 — REMAINING DUPLICATE SUBCOUNTY IDENTITIES
   * ------------------------------------------------------------
   */

  console.log("");
  console.log(
    "STEP 10 — REMAINING DUPLICATE SUBCOUNTY AUDIT"
  );
  console.log("---------------------------------------------");

  const duplicateGroups = new Map<
    string,
    typeof subcounties
  >();

  for (const subcounty of subcounties) {
    const key =
      `${subcounty.countyId}::${normalizeLooseName(
        subcounty.name
      )}`;

    if (!duplicateGroups.has(key)) {
      duplicateGroups.set(
        key,
        []
      );
    }

    duplicateGroups
      .get(key)!
      .push(subcounty);
  }

  const remainingDuplicateGroups:
    Array<Record<string, unknown>> =
      [];

  for (const [
    key,
    records,
  ] of duplicateGroups.entries()) {
    if (records.length <= 1) {
      continue;
    }

    const countyId =
      records[0].countyId;

    remainingDuplicateGroups.push({
      key,
      countyId,
      countyName:
        countyById.get(
          countyId
        )?.name ?? null,
      normalizedName:
        normalizeLooseName(
          records[0].name
        ),
      recordCount:
        records.length,
      records:
        records.map(
          (record) => ({
            id: record.id,
            name: record.name,
            wardCount:
              record._count.wards,
            farmersCount:
              record._count.farmers,
            farmsCount:
              record._count.farms,
            businessPartnersCount:
              record._count.businessPartners,
          })
        ),
    });
  }

  console.log(
    `Remaining duplicate identity groups: ${
      remainingDuplicateGroups.length
    }`
  );

  /*
   * ------------------------------------------------------------
   * STEP 11 — FINAL V14.1 GATES
   * ------------------------------------------------------------
   */

  const totalMigratedExpected =
    migrations.reduce(
      (sum, migration) =>
        sum +
        Number(
          migration.expectedWardCount ??
          migration.oldWardCount ??
          migration.wardCount ??
          migration.movedWardCount ??
          0
        ),
      0
    );

  const migratedWardCountPass =
    totalMigratedExpected === 568 &&
    migratedWardsVerified === 568;

  const oldRecordsPass =
    oldRecordAudit.length === 122 &&
    oldRecordsWithDependencies.length === 0;

  const migrationPass =
    migrationsPassed === 122 &&
    migrationsFailed === 0;

  const ownershipIntegrityPass =
    wardCountyMismatches.length === 0 &&
    wardSubcountyMismatches.length === 0;

  const structuralPassFinal =
    structuralPass;

  const postMigrationPass =
    structuralPassFinal &&
    migrationPass &&
    migratedWardCountPass &&
    oldRecordsPass &&
    ownershipIntegrityPass;

  /*
   * ------------------------------------------------------------
   * STEP 12 — JSON REPORT
   * ------------------------------------------------------------
   */

  const report = {
    audit:
      "V14.1_POST_MIGRATION_RECONCILIATION",

    generatedAt:
      new Date().toISOString(),

    mode:
      "READ_ONLY",

    inputFiles: {
      authoritativeGeoJson:
        GEOJSON_PATH,
      v14MigrationLog:
        V14_PATH,
    },

    databaseCounts: {
      counties:
        counties.length,
      subcounties:
        subcounties.length,
      wards:
        wards.length,
    },

    authoritative: {
      wardCount:
        features.length,
      uniqueGids:
        authoritativeGidSet.size,
      duplicateGids:
        duplicateAuthoritativeGids.length,
    },

    databaseSourceGids: {
      count:
        dbGids.length,
      uniqueCount:
        dbGidSet.size,
      duplicateCount:
        duplicateDbGids.length,
      missingAuthoritativeGids:
        missingGids,
      unexpectedDatabaseGids:
        unexpectedGids,
    },

    structuralAudit: {
      pass:
        structuralPass,
      authoritativeGids:
        authoritativeGids.length,
      databaseGids:
        dbGids.length,
      duplicateAuthoritativeGids:
        duplicateAuthoritativeGids.length,
      duplicateDatabaseGids:
        duplicateDbGids.length,
      missingGids:
        missingGids.length,
      unexpectedGids:
        unexpectedGids.length,
    },

    targetResolution: {
      uniqueAuthoritativeSubcountyIdentities:
        canonicalSourceRecords.size,
      resolutionCounts:
        actualResolutionCounts,
    },

    wardOwnership: {
      correct,
      wrongSubcounty,
      targetUnresolved,
      wardNotFound,
      total:
        correct +
        wrongSubcounty +
        targetUnresolved +
        wardNotFound,
    },

    v14MigrationVerification: {
      expectedMigrations:
        migrations.length,
      migrationsPassed,
      migrationsFailed,
      expectedMigratedWards:
        totalMigratedExpected,
      verifiedMigratedWards:
        migratedWardsVerified,
      expected122Migrations:
        migrations.length === 122,
      expected568Wards:
        totalMigratedExpected === 568,
    },

    oldRecordAudit: {
      recordsAudited:
        oldRecordAudit.length,
      recordsWithDependencies:
        oldRecordsWithDependencies.length,
      recordsEmpty:
        oldRecordAudit.filter(
          (row) => row.empty
        ).length,
    },

    ownershipIntegrity: {
      wardCountyMismatches:
        wardCountyMismatches.length,
      wardSubcountyMismatches:
        wardSubcountyMismatches.length,
    },

    remainingDuplicates: {
      duplicateIdentityGroups:
        remainingDuplicateGroups.length,
    },

    gates: {
      structuralPass:
        structuralPassFinal,
      migrationPass,
      migratedWardCountPass,
      oldRecordsPass,
      ownershipIntegrityPass,
      overallPass:
        postMigrationPass,
    },

    status:
      postMigrationPass
        ? "V14.1_PASS"
        : "V14.1_REVIEW_REQUIRED",

    details: {
      migrationAudit,
      oldRecordAudit,
      wardCountyMismatches,
      wardSubcountyMismatches,
      remainingDuplicateGroups,
      wardOwnershipAudit:
        auditResults,
    },
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

  /*
   * ------------------------------------------------------------
   * CSV REPORT
   * ------------------------------------------------------------
   */

  writeCsv(
    auditResults.map(
      (row) => ({
        gid:
          row.gid,
        wardId:
          row.wardId,
        wardName:
          row.wardName,
        countyName:
          row.countyName,
        authoritativeSubcountyName:
          row.authoritativeSubcountyName,
        authoritativeScuid:
          row.authoritativeScuid,
        databaseSubCountyId:
          row.databaseSubCountyId,
        databaseSubCountyName:
          row.databaseSubCountyName,
        databaseCountyId:
          row.databaseCountyId,
        databaseCountyName:
          row.databaseCountyName,
        status:
          row.status,
        detail:
          row.detail,
      })
    ),
    OUTPUT_CSV
  );

  /*
   * ------------------------------------------------------------
   * FINAL CONSOLE SUMMARY
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("==============================================");
  console.log(
    "V14.1 POST-MIGRATION AUDIT SUMMARY"
  );
  console.log("==============================================");

  console.log("");
  console.log(
    "STRUCTURAL GID AUDIT"
  );

  console.log(
    `  Authoritative GIDs: ${
      authoritativeGids.length
    }`
  );

  console.log(
    `  Database sourceGIDs: ${
      dbGids.length
    }`
  );

  console.log(
    `  Duplicate authoritative GIDs: ${
      duplicateAuthoritativeGids.length
    }`
  );

  console.log(
    `  Duplicate database sourceGIDs: ${
      duplicateDbGids.length
    }`
  );

  console.log(
    `  Missing GIDs: ${
      missingGids.length
    }`
  );

  console.log(
    `  Unexpected GIDs: ${
      unexpectedGids.length
    }`
  );

  console.log(
    `  STATUS: ${
      structuralPass
        ? "PASS"
        : "FAIL"
    }`
  );

  console.log("");
  console.log(
    "WARD OWNERSHIP RECONCILIATION"
  );

  console.log(
    `  Correct: ${correct}`
  );

  console.log(
    `  Wrong subcounty: ${wrongSubcounty}`
  );

  console.log(
    `  Target unresolved: ${targetUnresolved}`
  );

  console.log(
    `  Ward not found: ${wardNotFound}`
  );

  console.log("");
  console.log(
    "V14 MIGRATION VERIFICATION"
  );

  console.log(
    `  Migrations expected: ${
      migrations.length
    }`
  );

  console.log(
    `  Migrations passed: ${
      migrationsPassed
    }`
  );

  console.log(
    `  Migrations failed: ${
      migrationsFailed
    }`
  );

  console.log(
    `  Expected migrated wards: ${
      totalMigratedExpected
    }`
  );

  console.log(
    `  Verified migrated wards: ${
      migratedWardsVerified
    }`
  );

  console.log("");
  console.log(
    "OLD SUBCOUNTY RECORDS"
  );

  console.log(
    `  Records audited: ${
      oldRecordAudit.length
    }`
  );

  console.log(
    `  Records with dependencies: ${
      oldRecordsWithDependencies.length
    }`
  );

  console.log(
    `  Records empty: ${
      oldRecordAudit.filter(
        (row) => row.empty
      ).length
    }`
  );

  console.log("");
  console.log(
    "OWNERSHIP INTEGRITY"
  );

  console.log(
    `  Ward county mismatches: ${
      wardCountyMismatches.length
    }`
  );

  console.log(
    `  Ward SubCounty mismatches: ${
      wardSubcountyMismatches.length
    }`
  );

  console.log("");
  console.log(
    "REMAINING DUPLICATE IDENTITIES"
  );

  console.log(
    `  Duplicate SubCounty groups: ${
      remainingDuplicateGroups.length
    }`
  );

  console.log("");
  console.log("==============================================");

  console.log(
    `V14.1 OVERALL STATUS: ${
      postMigrationPass
        ? "PASS"
        : "REVIEW REQUIRED"
    }`
  );

  console.log(
    "=============================================="
  );

  console.log("");
  console.log(
    `JSON: ${OUTPUT_JSON}`
  );

  console.log(
    `CSV:  ${OUTPUT_CSV}`
  );

  console.log("");

  if (!postMigrationPass) {
    console.log(
      "IMPORTANT: V14.1 did not pass all required gates."
    );

    console.log(
      "DO NOT proceed to V15 deletion."
    );
  } else {
    console.log(
      "V14.1 passed all required post-migration gates."
    );

    console.log(
      "No database changes were made by this audit."
    );

    console.log(
      "V15 deletion may now be considered separately."
    );
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("V14.1 AUDIT FAILED");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });