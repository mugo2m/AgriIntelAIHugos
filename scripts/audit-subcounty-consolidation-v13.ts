import "dotenv/config";

import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const ROOT = process.cwd();

const SUBCOUNTIES_FILE = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounties.json",
);

const WARDS_FILE = path.join(
  ROOT,
  "prisma",
  "data",
  "kenya-wards-1450.geojson",
);

const JSON_OUTPUT = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounty-consolidation-v13.json",
);

const CSV_OUTPUT = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounty-consolidation-v13.csv",
);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

/* =========================================================
   TYPES
   ========================================================= */

type CanonicalSubCounty = {
  code: string;
  countyCode: string;
  name: string;
  headquarters: string | null;
};

type GeoJsonProperties = {
  gid?: number | string;
  pop2009?: number | string | null;
  county?: string | null;
  subcounty?: string | null;
  ward?: string | null;
  uid?: string | null;
  scuid?: string | null;
  cuid?: string | null;
};

type GeoJsonFeature = {
  type?: string;
  properties?: GeoJsonProperties;
};

type GeoJsonCollection = {
  type?: string;
  features?: GeoJsonFeature[];
};

type CountyRow = {
  id: number;
  name: string;
};

type SubCountyRow = {
  id: number;
  name: string;
  countyId: number;
};

type WardRow = {
  id: number;
  name: string;
  sourceGid: number | bigint | null;
  subCountyId: number | null;
  countyId: number;
  constituencyId: number;
};

type WardIdentity = {
  gid: number;
  wardName: string;
  countyName: string;
  subCountyName: string;
  scuid: string | null;
  cuid: string | null;
  uid: string | null;
};

type ScuidGroup = {
  scuid: string;
  gids: number[];
  countyNames: string[];
  subCountyNames: string[];
  wardNames: string[];
};

type CanonicalMatch = {
  source: CanonicalSubCounty;
  matchType: "EXACT" | "LOOSE" | "ALIAS";
};

type PrismaTargetMatch = {
  row: SubCountyRow;
  matchType:
    | "EXACT"
    | "LOOSE"
    | "ALIAS"
    | "LEGACY_EXACT"
    | "LEGACY_LOOSE";
};

type ScuidResolution = {
  scuid: string;
  gids: number[];
  countyNames: string[];
  authoritativeSubCountyNames: string[];
  canonicalSourceCodes: string[];
  canonicalSourceNames: string[];
  prismaTargetIds: number[];
  prismaTargetNames: string[];
  status:
    | "RESOLVED"
    | "UNRESOLVED"
    | "AMBIGUOUS";
  reason: string;
};

type CandidateStatus =
  | "SAFE_CANDIDATE"
  | "BLOCKED"
  | "ALREADY_CANONICAL"
  | "MANUAL_REVIEW";

type CandidateRecord = {
  currentId: number;
  currentName: string;
  countyId: number;
  countyName: string;
  wardCount: number;
  wardIds: number[];
  sourceGids: number[];
  canonicalSourceCode: string | null;
  canonicalSourceName: string | null;
  canonicalPrismaId: number | null;
  canonicalPrismaName: string | null;
  status: CandidateStatus;
  reason: string;
};

type WardOwnershipAudit = {
  gid: number;
  wardName: string;
  countyName: string;
  authoritativeSubCountyName: string;
  authoritativeScuid: string | null;
  expectedPrismaSubCountyId: number | null;
  expectedPrismaSubCountyName: string | null;
  actualPrismaSubCountyId: number | null;
  actualPrismaSubCountyName: string | null;
  status:
    | "CORRECT"
    | "WRONG_SUBCOUNTY"
    | "UNASSIGNED"
    | "EXPECTED_TARGET_UNRESOLVED";
};

type AuditReport = {
  generatedAt: string;
  readOnly: true;

  sourceFiles: {
    subcounties: string;
    wards: string;
  };

  sourceCounts: {
    canonicalSubcounties: number;
    geoJsonFeatures: number;
    authoritativeGids: number;
  };

  databaseCounts: {
    counties: number;
    subcounties: number;
    wards: number;
  };

  gidIntegrity: {
    databaseWardsWithSourceGid: number;
    duplicateAuthoritativeGids: number;
    duplicateDatabaseSourceGids: number;
    missingDatabaseGids: number;
    unmatchedDatabaseGids: number;
  };

  scuidAudit: {
    groups: number;
    resolved: number;
    unresolved: number;
    ambiguous: number;
  };

  canonicalResolution: {
    canonicalSourcesResolved: number;
    canonicalSourcesUnresolved: number;
    unresolvedCanonicalNames: string[];
  };

  candidateSummary: {
    totalSubcountyRecords: number;
    populatedSubcounties: number;
    emptySubcounties: number;
    safeCandidates: number;
    blockedCandidates: number;
    alreadyCanonical: number;
    manualReview: number;
  };

  wardOwnership: {
    total: number;
    correct: number;
    wrongSubcounty: number;
    unassigned: number;
    expectedTargetUnresolved: number;
  };

  candidates: CandidateRecord[];
  scuidResolutions: ScuidResolution[];
  wardOwnershipAudit: WardOwnershipAudit[];

  structuralAudit: {
    status: "PASS" | "FAIL";
    message: string;
  };
};

/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalizeBaseName(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLooseName(value: string | null | undefined): string {
  let result = normalizeBaseName(value);

  result = result
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return result;
}

function normalizeExactName(value: string | null | undefined): string {
  return normalizeBaseName(value);
}

/* =========================================================
   COUNTY ALIASES
   ========================================================= */

const COUNTY_ALIASES: Record<string, string> = {
  "tharaka nithi": "Tharaka Nithi",
  "tharaka nithi county": "Tharaka Nithi",

  muranga: "Murang'a",
  "muranga county": "Murang'a",

  nairobi: "Nairobi City",
  "nairobi county": "Nairobi City",

  "elgeyo marakwet": "Elgeyo Marakwet",
  "elgeyo marakwet county": "Elgeyo Marakwet",

  "trans nzoia": "Trans Nzoia",
  "taita taveta": "Taita Taveta",

  "uasingishu": "Uasin Gishu",
  "uasin gishu": "Uasin Gishu",

  "nyamira county": "Nyamira",
  "kisumu county": "Kisumu",
  "kiambu county": "Kiambu",
  "nakuru county": "Nakuru",
  "narok county": "Narok",
  "kajiado county": "Kajiado",
  "kericho county": "Kericho",
  "bomet county": "Bomet",
  "bungoma county": "Bungoma",
  "busia county": "Busia",
  "siaya county": "Siaya",
  "kisii county": "Kisii",
  "migori county": "Migori",
  "homa bay county": "Homa Bay",
  "homabay": "Homa Bay",
  "homabay county": "Homa Bay",
};

function normalizeCountyName(value: string | null | undefined): string {
  const base = normalizeBaseName(value);

  return normalizeBaseName(
    COUNTY_ALIASES[base] ?? value ?? "",
  );
}

/* =========================================================
   SUBCOUNTY ALIASES
   ========================================================= */

const NAME_ALIASES: Record<string, string> = {
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
  banissa: "Banisa",

  lafey: "Lafey",
  ainabkoi: "Ainabkoi",
  kesses: "Kesses",
};

function canonicalNameFromAuthoritativeName(
  value: string | null | undefined,
): string {
  const loose = normalizeLooseName(value);

  return NAME_ALIASES[loose] ?? value ?? "";
}

/* =========================================================
   KENYA COUNTY CODES
   ========================================================= */

const COUNTY_CODE_TO_NAME: Record<string, string> = {
  "001": "Mombasa",
  "002": "Kwale",
  "003": "Kilifi",
  "004": "Tana River",
  "005": "Lamu",
  "006": "Taita Taveta",
  "007": "Garissa",
  "008": "Wajir",
  "009": "Mandera",
  "010": "Marsabit",
  "011": "Isiolo",
  "012": "Meru",
  "013": "Tharaka Nithi",
  "014": "Embu",
  "015": "Kitui",
  "016": "Machakos",
  "017": "Makueni",
  "018": "Nyandarua",
  "019": "Nyeri",
  "020": "Kirinyaga",
  "021": "Murang'a",
  "022": "Kiambu",
  "023": "Turkana",
  "024": "West Pokot",
  "025": "Samburu",
  "026": "Trans Nzoia",
  "027": "Uasin Gishu",
  "028": "Elgeyo Marakwet",
  "029": "Nandi",
  "030": "Baringo",
  "031": "Laikipia",
  "032": "Nakuru",
  "033": "Narok",
  "034": "Kajiado",
  "035": "Kericho",
  "036": "Bomet",
  "037": "Kakamega",
  "038": "Vihiga",
  "039": "Bungoma",
  "040": "Busia",
  "041": "Siaya",
  "042": "Kisumu",
  "043": "Homa Bay",
  "044": "Migori",
  "045": "Kisii",
  "046": "Nyamira",
  "047": "Nairobi City",
};

/* =========================================================
   HELPERS
   ========================================================= */

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function safeJsonStringify(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, currentValue) => {
      if (typeof currentValue === "bigint") {
        return Number(currentValue);
      }

      return currentValue;
    },
    2,
  );
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

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) =>
    a.localeCompare(b),
  );
}

function sortedUniqueNumbers(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

/* =========================================================
   LOAD CANONICAL SUBCOUNTY SOURCE
   ========================================================= */

function loadCanonicalSource(): CanonicalSubCounty[] {
  if (!fs.existsSync(SUBCOUNTIES_FILE)) {
    throw new Error(
      `Canonical source file not found: ${SUBCOUNTIES_FILE}`,
    );
  }

  const raw = fs.readFileSync(SUBCOUNTIES_FILE, "utf8");

  const parsed: unknown = JSON.parse(raw);

  let records: unknown[];

  if (Array.isArray(parsed)) {
    records = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    "value" in parsed &&
    Array.isArray(
      (parsed as { value: unknown }).value,
    )
  ) {
    records = (parsed as { value: unknown[] }).value;
  } else {
    throw new Error(
      "Unsupported subcounties.json structure. Expected an array or { value: [...] }.",
    );
  }

  const result: CanonicalSubCounty[] = [];

  for (const item of records) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const row = item as Record<string, unknown>;

    const code = String(row.code ?? "").trim();
    const countyCode = String(row.countyCode ?? "").trim();
    const name = String(row.name ?? "").trim();

    if (!code || !countyCode || !name) {
      continue;
    }

    result.push({
      code,
      countyCode,
      name,
      headquarters:
        row.headquarters === null ||
        row.headquarters === undefined
          ? null
          : String(row.headquarters),
    });
  }

  return result;
}

/* =========================================================
   LOAD GEOJSON
   ========================================================= */

function loadGeoJson(): GeoJsonFeature[] {
  if (!fs.existsSync(WARDS_FILE)) {
    throw new Error(
      `GeoJSON source file not found: ${WARDS_FILE}`,
    );
  }

  const raw = fs.readFileSync(WARDS_FILE, "utf8");

  const parsed = JSON.parse(raw) as GeoJsonCollection;

  if (!Array.isArray(parsed.features)) {
    throw new Error(
      "GeoJSON does not contain a features array.",
    );
  }

  return parsed.features;
}

/* =========================================================
   CANONICAL SOURCE INDEXES
   ========================================================= */

function buildCanonicalIndexes(
  canonical: CanonicalSubCounty[],
) {
  const exactByCountyCode = new Map<
    string,
    Map<string, CanonicalSubCounty[]>
  >();

  const looseByCountyCode = new Map<
    string,
    Map<string, CanonicalSubCounty[]>
  >();

  for (const row of canonical) {
    const countyCode = row.countyCode.padStart(3, "0");

    if (!exactByCountyCode.has(countyCode)) {
      exactByCountyCode.set(
        countyCode,
        new Map(),
      );
    }

    if (!looseByCountyCode.has(countyCode)) {
      looseByCountyCode.set(
        countyCode,
        new Map(),
      );
    }

    const exactMap = exactByCountyCode.get(countyCode)!;
    const looseMap = looseByCountyCode.get(countyCode)!;

    const exactKey = normalizeExactName(row.name);
    const looseKey = normalizeLooseName(row.name);

    if (!exactMap.has(exactKey)) {
      exactMap.set(exactKey, []);
    }

    if (!looseMap.has(looseKey)) {
      looseMap.set(looseKey, []);
    }

    exactMap.get(exactKey)!.push(row);
    looseMap.get(looseKey)!.push(row);
  }

  return {
    exactByCountyCode,
    looseByCountyCode,
  };
}

/* =========================================================
   FIND CANONICAL RECORD FOR GEOJSON SUBCOUNTY
   ========================================================= */

function findCanonicalForGeoSubCounty(
  countyName: string,
  authoritativeSubCountyName: string,
  indexes: ReturnType<typeof buildCanonicalIndexes>,
): CanonicalMatch | null {
  const canonicalCountyName =
    normalizeCountyName(countyName);

  let countyCode: string | null = null;

  for (const [code, name] of Object.entries(
    COUNTY_CODE_TO_NAME,
  )) {
    if (
      normalizeCountyName(name) ===
      canonicalCountyName
    ) {
      countyCode = code;
      break;
    }
  }

  if (!countyCode) {
    return null;
  }

  const exactMap =
    indexes.exactByCountyCode.get(countyCode);

  const looseMap =
    indexes.looseByCountyCode.get(countyCode);

  if (!exactMap || !looseMap) {
    return null;
  }

  const exactKey = normalizeExactName(
    authoritativeSubCountyName,
  );

  const exactMatches = exactMap.get(exactKey) ?? [];

  if (exactMatches.length === 1) {
    return {
      source: exactMatches[0],
      matchType: "EXACT",
    };
  }

  const canonicalName =
    canonicalNameFromAuthoritativeName(
      authoritativeSubCountyName,
    );

  const canonicalExactKey =
    normalizeExactName(canonicalName);

  const canonicalExactMatches =
    exactMap.get(canonicalExactKey) ?? [];

  if (canonicalExactMatches.length === 1) {
    return {
      source: canonicalExactMatches[0],
      matchType: "ALIAS",
    };
  }

  const looseKey = normalizeLooseName(
    authoritativeSubCountyName,
  );

  const looseMatches = looseMap.get(looseKey) ?? [];

  if (looseMatches.length === 1) {
    return {
      source: looseMatches[0],
      matchType: "LOOSE",
    };
  }

  return null;
}

/* =========================================================
   FIND PRISMA TARGET
   ========================================================= */

function findPrismaTarget(
  countyName: string,
  source: CanonicalSubCounty,
  counties: CountyRow[],
  subcounties: SubCountyRow[],
): PrismaTargetMatch | null {
  const wantedCounty = normalizeCountyName(
    countyName,
  );

  const county = counties.find(
    (row) =>
      normalizeCountyName(row.name) ===
      wantedCounty,
  );

  if (!county) {
    return null;
  }

  const countyRows = subcounties.filter(
    (row) => row.countyId === county.id,
  );

  /*
   * IMPORTANT:
   * Prefer the exact canonical source name.
   *
   * Example:
   * "Kandara"
   * should beat
   * "Kandara Sub County".
   */

  const exactCanonical =
    normalizeExactName(source.name);

  const exact = countyRows.filter(
    (row) =>
      normalizeExactName(row.name) ===
      exactCanonical,
  );

  if (exact.length === 1) {
    return {
      row: exact[0],
      matchType: "EXACT",
    };
  }

  if (exact.length > 1) {
    return null;
  }

  const looseCanonical =
    normalizeLooseName(source.name);

  const loose = countyRows.filter(
    (row) =>
      normalizeLooseName(row.name) ===
      looseCanonical,
  );

  if (loose.length === 1) {
    const isLegacyName =
      normalizeExactName(loose[0].name) !==
      exactCanonical;

    return {
      row: loose[0],
      matchType: isLegacyName
        ? "LEGACY_LOOSE"
        : "LOOSE",
    };
  }

  /*
   * Alias fallback.
   */

  const aliasName =
    NAME_ALIASES[looseCanonical];

  if (aliasName) {
    const aliasExact =
      normalizeExactName(aliasName);

    const aliasMatches = countyRows.filter(
      (row) =>
        normalizeExactName(row.name) ===
        aliasExact,
    );

    if (aliasMatches.length === 1) {
      return {
        row: aliasMatches[0],
        matchType: "ALIAS",
      };
    }

    const aliasLoose =
      normalizeLooseName(aliasName);

    const aliasLooseMatches =
      countyRows.filter(
        (row) =>
          normalizeLooseName(row.name) ===
          aliasLoose,
      );

    if (aliasLooseMatches.length === 1) {
      return {
        row: aliasLooseMatches[0],
        matchType: "LEGACY_LOOSE",
      };
    }
  }

  return null;
}

/* =========================================================
   LOAD DATABASE
   ========================================================= */

async function loadDatabase() {
  const counties = (await prisma.county.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  })) as CountyRow[];

  const subcounties =
    (await prisma.subCounty.findMany({
      select: {
        id: true,
        name: true,
        countyId: true,
      },
      orderBy: {
        id: "asc",
      },
    })) as SubCountyRow[];

  const wards = (await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      sourceGid: true,
      subCountyId: true,
      countyId: true,
      constituencyId: true,
    },
    orderBy: {
      id: "asc",
    },
  })) as WardRow[];

  return {
    counties,
    subcounties,
    wards,
  };
}

/* =========================================================
   BUILD WARD IDENTITIES
   ========================================================= */

function buildWardIdentities(
  features: GeoJsonFeature[],
): WardIdentity[] {
  const result: WardIdentity[] = [];

  for (const feature of features) {
    const p = feature.properties;

    if (!p) {
      continue;
    }

    const gid = toNumber(p.gid);

    if (gid === null) {
      continue;
    }

    result.push({
      gid,
      wardName: String(p.ward ?? "").trim(),
      countyName: String(p.county ?? "").trim(),
      subCountyName: String(
        p.subcounty ?? "",
      ).trim(),
      scuid:
        p.scuid === null ||
        p.scuid === undefined
          ? null
          : String(p.scuid).trim(),
      cuid:
        p.cuid === null ||
        p.cuid === undefined
          ? null
          : String(p.cuid).trim(),
      uid:
        p.uid === null ||
        p.uid === undefined
          ? null
          : String(p.uid).trim(),
    });
  }

  return result;
}

/* =========================================================
   BUILD SCUID GROUPS
   ========================================================= */

function buildScuidGroups(
  identities: WardIdentity[],
): ScuidGroup[] {
  const groups = new Map<string, ScuidGroup>();

  for (const row of identities) {
    if (!row.scuid) {
      continue;
    }

    if (!groups.has(row.scuid)) {
      groups.set(row.scuid, {
        scuid: row.scuid,
        gids: [],
        countyNames: [],
        subCountyNames: [],
        wardNames: [],
      });
    }

    const group = groups.get(row.scuid)!;

    group.gids.push(row.gid);
    group.countyNames.push(row.countyName);
    group.subCountyNames.push(
      row.subCountyName,
    );
    group.wardNames.push(row.wardName);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      gids: sortedUniqueNumbers(group.gids),
      countyNames: sortedUnique(
        group.countyNames,
      ),
      subCountyNames: sortedUnique(
        group.subCountyNames,
      ),
      wardNames: sortedUnique(group.wardNames),
    }))
    .sort((a, b) =>
      a.scuid.localeCompare(b.scuid),
    );
}

/* =========================================================
   RESOLVE SCUID GROUP
   ========================================================= */

function resolveScuidGroup(
  group: ScuidGroup,
  canonicalIndexes: ReturnType<
    typeof buildCanonicalIndexes
  >,
  counties: CountyRow[],
  subcounties: SubCountyRow[],
): ScuidResolution {
  const canonicalSources = new Map<
    string,
    CanonicalSubCounty
  >();

  const targetRows = new Map<
    number,
    SubCountyRow
  >();

  for (const subCountyName of group.subCountyNames) {
    for (const countyName of group.countyNames) {
      const canonical =
        findCanonicalForGeoSubCounty(
          countyName,
          subCountyName,
          canonicalIndexes,
        );

      if (!canonical) {
        continue;
      }

      canonicalSources.set(
        canonical.source.code,
        canonical.source,
      );

      const target = findPrismaTarget(
        countyName,
        canonical.source,
        counties,
        subcounties,
      );

      if (target) {
        targetRows.set(
          target.row.id,
          target.row,
        );
      }
    }
  }

  const canonicalSourceNames = [
    ...canonicalSources.values(),
  ].map((row) => row.name);

  if (targetRows.size === 1) {
    const target = [...targetRows.values()][0];

    return {
      scuid: group.scuid,
      gids: group.gids,
      countyNames: group.countyNames,
      authoritativeSubCountyNames:
        group.subCountyNames,
      canonicalSourceCodes: [
        ...canonicalSources.keys(),
      ],
      canonicalSourceNames,
      prismaTargetIds: [target.id],
      prismaTargetNames: [target.name],
      status: "RESOLVED",
      reason:
        "SCUID resolves to one existing Prisma SubCounty.",
    };
  }

  if (targetRows.size > 1) {
    return {
      scuid: group.scuid,
      gids: group.gids,
      countyNames: group.countyNames,
      authoritativeSubCountyNames:
        group.subCountyNames,
      canonicalSourceCodes: [
        ...canonicalSources.keys(),
      ],
      canonicalSourceNames,
      prismaTargetIds: [
        ...targetRows.keys(),
      ],
      prismaTargetNames: [
        ...targetRows.values(),
      ].map((row) => row.name),
      status: "AMBIGUOUS",
      reason:
        "One SCUID maps to more than one Prisma SubCounty.",
    };
  }

  return {
    scuid: group.scuid,
    gids: group.gids,
    countyNames: group.countyNames,
    authoritativeSubCountyNames:
      group.subCountyNames,
    canonicalSourceCodes: [
      ...canonicalSources.keys(),
    ],
    canonicalSourceNames,
    prismaTargetIds: [],
    prismaTargetNames: [],
    status: "UNRESOLVED",
    reason:
      "Authoritative SCUID could not be mapped to an existing Prisma SubCounty.",
  };
}

/* =========================================================
   BUILD AUTHORITATIVE WARD OWNERSHIP
   ========================================================= */

function buildAuthoritativeWardOwnership(
  identities: WardIdentity[],
  canonicalIndexes: ReturnType<
    typeof buildCanonicalIndexes
  >,
  counties: CountyRow[],
  subcounties: SubCountyRow[],
): Map<number, PrismaTargetMatch | null> {
  const result = new Map<
    number,
    PrismaTargetMatch | null
  >();

  for (const identity of identities) {
    const canonical =
      findCanonicalForGeoSubCounty(
        identity.countyName,
        identity.subCountyName,
        canonicalIndexes,
      );

    if (!canonical) {
      result.set(identity.gid, null);
      continue;
    }

    const target = findPrismaTarget(
      identity.countyName,
      canonical.source,
      counties,
      subcounties,
    );

    result.set(identity.gid, target);
  }

  return result;
}

/* =========================================================
   BUILD CANDIDATES
   ========================================================= */

async function buildCandidates(
  subcounties: SubCountyRow[],
  counties: CountyRow[],
  wards: WardRow[],
  canonical: CanonicalSubCounty[],
  canonicalIndexes: ReturnType<
    typeof buildCanonicalIndexes
  >,
): Promise<CandidateRecord[]> {
  const candidateRows: CandidateRecord[] = [];

  const canonicalTargetIds = new Set<number>();

  for (const source of canonical) {
    const countyName =
      COUNTY_CODE_TO_NAME[
        source.countyCode.padStart(3, "0")
      ];

    if (!countyName) {
      continue;
    }

    const target = findPrismaTarget(
      countyName,
      source,
      counties,
      subcounties,
    );

    if (target) {
      canonicalTargetIds.add(
        target.row.id,
      );
    }
  }

  const wardBySubCountyId = new Map<
    number,
    WardRow[]
  >();

  for (const ward of wards) {
    if (ward.subCountyId === null) {
      continue;
    }

    if (!wardBySubCountyId.has(ward.subCountyId)) {
      wardBySubCountyId.set(
        ward.subCountyId,
        [],
      );
    }

    wardBySubCountyId
      .get(ward.subCountyId)!
      .push(ward);
  }

  const protectedManualReviewIds =
    new Set<number>([295]);

  for (const row of subcounties) {
    const county = counties.find(
      (item) => item.id === row.countyId,
    );

    const countyName = county?.name ?? "";

    const wardRows =
      wardBySubCountyId.get(row.id) ?? [];

    const wardIds = wardRows.map(
      (ward) => ward.id,
    );

    const sourceGids = wardRows
      .map((ward) =>
        toNumber(ward.sourceGid),
      )
      .filter(
        (gid): gid is number =>
          gid !== null,
      );

    const canonicalMatches =
      canonical.filter((source) => {
        const sourceCounty =
          COUNTY_CODE_TO_NAME[
            source.countyCode.padStart(3, "0")
          ];

        if (
          !sourceCounty ||
          normalizeCountyName(
            sourceCounty,
          ) !== normalizeCountyName(countyName)
        ) {
          return false;
        }

        return (
          normalizeExactName(source.name) ===
            normalizeExactName(row.name) ||
          normalizeLooseName(source.name) ===
            normalizeLooseName(row.name)
        );
      });

    let canonicalSource:
      | CanonicalSubCounty
      | null = null;

    if (canonicalMatches.length === 1) {
      canonicalSource = canonicalMatches[0];
    }

    let canonicalTargetId: number | null =
      null;

    let canonicalTargetName: string | null =
      null;

    if (canonicalSource) {
      const target = findPrismaTarget(
        countyName,
        canonicalSource,
        counties,
        subcounties,
      );

      if (target) {
        canonicalTargetId = target.row.id;
        canonicalTargetName =
          target.row.name;
      }
    }

    let status: CandidateStatus;
    let reason: string;

    if (protectedManualReviewIds.has(row.id)) {
      status = "MANUAL_REVIEW";
      reason =
        "Protected record requiring manual review.";
    } else if (
      canonicalTargetId !== null &&
      canonicalTargetId === row.id
    ) {
      status = "ALREADY_CANONICAL";
      reason =
        "This Prisma SubCounty is already the canonical target.";
    } else if (
      canonicalTargetId !== null &&
      wardRows.length === 0
    ) {
      status = "SAFE_CANDIDATE";
      reason =
        "Empty legacy/non-canonical SubCounty with a unique canonical target.";
    } else if (
      canonicalTargetId !== null &&
      wardRows.length > 0
    ) {
      status = "SAFE_CANDIDATE";
      reason =
        "Non-canonical SubCounty has wards and maps uniquely to an existing canonical target; review ward ownership before repair.";
    } else if (
      canonicalSource === null
    ) {
      status = "MANUAL_REVIEW";
      reason =
        "No unique canonical source record could be matched.";
    } else {
      status = "BLOCKED";
      reason =
        "Canonical target could not be resolved safely.";
    }

    candidateRows.push({
      currentId: row.id,
      currentName: row.name,
      countyId: row.countyId,
      countyName,
      wardCount: wardRows.length,
      wardIds,
      sourceGids,
      canonicalSourceCode:
        canonicalSource?.code ?? null,
      canonicalSourceName:
        canonicalSource?.name ?? null,
      canonicalPrismaId:
        canonicalTargetId,
      canonicalPrismaName:
        canonicalTargetName,
      status,
      reason,
    });
  }

  return candidateRows.sort(
    (a, b) => a.currentId - b.currentId,
  );
}

/* =========================================================
   AUDIT WARD OWNERSHIP
   ========================================================= */

function auditWardOwnership(
  identities: WardIdentity[],
  wards: WardRow[],
  authoritativeOwnership: Map<
    number,
    PrismaTargetMatch | null
  >,
): WardOwnershipAudit[] {
  const wardByGid = new Map<
    number,
    WardRow
  >();

  for (const ward of wards) {
    const gid = toNumber(ward.sourceGid);

    if (gid === null) {
      continue;
    }

    wardByGid.set(gid, ward);
  }

  const result: WardOwnershipAudit[] = [];

  for (const identity of identities) {
    const ward = wardByGid.get(identity.gid);

    const expected =
      authoritativeOwnership.get(identity.gid) ??
      null;

    if (!expected) {
      result.push({
        gid: identity.gid,
        wardName: identity.wardName,
        countyName: identity.countyName,
        authoritativeSubCountyName:
          identity.subCountyName,
        authoritativeScuid: identity.scuid,
        expectedPrismaSubCountyId: null,
        expectedPrismaSubCountyName: null,
        actualPrismaSubCountyId:
          ward?.subCountyId ?? null,
        actualPrismaSubCountyName: null,
        status:
          "EXPECTED_TARGET_UNRESOLVED",
      });

      continue;
    }

    if (!ward) {
      result.push({
        gid: identity.gid,
        wardName: identity.wardName,
        countyName: identity.countyName,
        authoritativeSubCountyName:
          identity.subCountyName,
        authoritativeScuid: identity.scuid,
        expectedPrismaSubCountyId:
          expected.row.id,
        expectedPrismaSubCountyName:
          expected.row.name,
        actualPrismaSubCountyId: null,
        actualPrismaSubCountyName: null,
        status: "UNASSIGNED",
      });

      continue;
    }

    const actualId = ward.subCountyId;

    if (actualId === null) {
      result.push({
        gid: identity.gid,
        wardName: identity.wardName,
        countyName: identity.countyName,
        authoritativeSubCountyName:
          identity.subCountyName,
        authoritativeScuid: identity.scuid,
        expectedPrismaSubCountyId:
          expected.row.id,
        expectedPrismaSubCountyName:
          expected.row.name,
        actualPrismaSubCountyId: null,
        actualPrismaSubCountyName: null,
        status: "UNASSIGNED",
      });

      continue;
    }

    if (actualId === expected.row.id) {
      result.push({
        gid: identity.gid,
        wardName: identity.wardName,
        countyName: identity.countyName,
        authoritativeSubCountyName:
          identity.subCountyName,
        authoritativeScuid: identity.scuid,
        expectedPrismaSubCountyId:
          expected.row.id,
        expectedPrismaSubCountyName:
          expected.row.name,
        actualPrismaSubCountyId: actualId,
        actualPrismaSubCountyName:
          expected.row.name,
        status: "CORRECT",
      });

      continue;
    }

    result.push({
      gid: identity.gid,
      wardName: identity.wardName,
      countyName: identity.countyName,
      authoritativeSubCountyName:
        identity.subCountyName,
      authoritativeScuid: identity.scuid,
      expectedPrismaSubCountyId:
        expected.row.id,
      expectedPrismaSubCountyName:
        expected.row.name,
      actualPrismaSubCountyId: actualId,
      actualPrismaSubCountyName: null,
      status: "WRONG_SUBCOUNTY",
    });
  }

  return result.sort(
    (a, b) => a.gid - b.gid,
  );
}

/* =========================================================
   CSV
   ========================================================= */

function writeCsv(
  candidates: CandidateRecord[],
): void {
  const header = [
    "currentId",
    "currentName",
    "countyId",
    "countyName",
    "wardCount",
    "wardIds",
    "sourceGids",
    "canonicalSourceCode",
    "canonicalSourceName",
    "canonicalPrismaId",
    "canonicalPrismaName",
    "status",
    "reason",
  ];

  const lines = [
    header.join(","),
    ...candidates.map((row) =>
      [
        row.currentId,
        row.currentName,
        row.countyId,
        row.countyName,
        row.wardCount,
        row.wardIds.join("|"),
        row.sourceGids.join("|"),
        row.canonicalSourceCode,
        row.canonicalSourceName,
        row.canonicalPrismaId,
        row.canonicalPrismaName,
        row.status,
        row.reason,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  fs.writeFileSync(
    CSV_OUTPUT,
    lines.join("\n"),
    "utf8",
  );
}

/* =========================================================
   MAIN
   ========================================================= */

async function main(): Promise<void> {
  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "V13 SUBCOUNTY CONSOLIDATION / WARD OWNERSHIP AUDIT",
  );
  console.log(
    "READ-ONLY — NO DATABASE MODIFICATIONS",
  );
  console.log(
    "============================================================",
  );
  console.log("");

  const canonical = loadCanonicalSource();

  const features = loadGeoJson();

  const identities =
    buildWardIdentities(features);

  console.log(
    `Canonical source records: ${canonical.length}`,
  );

  console.log(
    `Authoritative GeoJSON features: ${features.length}`,
  );

  console.log(
    `Authoritative ward identities: ${identities.length}`,
  );

  const {
    counties,
    subcounties,
    wards,
  } = await loadDatabase();

  console.log(
    `Current DB counties: ${counties.length}`,
  );

  console.log(
    `Current DB subcounties: ${subcounties.length}`,
  );

  console.log(
    `Current DB wards: ${wards.length}`,
  );

  console.log("");

  /* ---------------------------------------------------------
     CANONICAL INDEXES
     --------------------------------------------------------- */

  const canonicalIndexes =
    buildCanonicalIndexes(canonical);

  /* ---------------------------------------------------------
     GID INTEGRITY
     --------------------------------------------------------- */

  const authoritativeGids =
    identities.map((row) => row.gid);

  const databaseGids = wards
    .map((row) => toNumber(row.sourceGid))
    .filter(
      (gid): gid is number =>
        gid !== null,
    );

  const authoritativeGidSet =
    new Set(authoritativeGids);

  const databaseGidSet =
    new Set(databaseGids);

  const authoritativeDuplicateCount =
    authoritativeGids.length -
    authoritativeGidSet.size;

  const databaseDuplicateCount =
    databaseGids.length -
    databaseGidSet.size;

  const missingDatabaseGids =
    authoritativeGids.filter(
      (gid) => !databaseGidSet.has(gid),
    );

  const unmatchedDatabaseGids =
    databaseGids.filter(
      (gid) => !authoritativeGidSet.has(gid),
    );

  console.log(
    `Authoritative GIDs: ${authoritativeGidSet.size}`,
  );

  console.log(
    `Database wards with sourceGid: ${databaseGids.length}`,
  );

  console.log(
    `Duplicate authoritative GIDs: ${authoritativeDuplicateCount}`,
  );

  console.log(
    `Duplicate database sourceGIDs: ${databaseDuplicateCount}`,
  );

  console.log(
    `Missing database GIDs: ${missingDatabaseGids.length}`,
  );

  console.log(
    `Unmatched database GIDs: ${unmatchedDatabaseGids.length}`,
  );

  console.log("");

  /* ---------------------------------------------------------
     SCUID AUDIT
     --------------------------------------------------------- */

  const scuidGroups =
    buildScuidGroups(identities);

  const scuidResolutions =
    scuidGroups.map((group) =>
      resolveScuidGroup(
        group,
        canonicalIndexes,
        counties,
        subcounties,
      ),
    );

  const resolvedScuids =
    scuidResolutions.filter(
      (row) => row.status === "RESOLVED",
    ).length;

  const unresolvedScuids =
    scuidResolutions.filter(
      (row) => row.status === "UNRESOLVED",
    ).length;

  const ambiguousScuids =
    scuidResolutions.filter(
      (row) => row.status === "AMBIGUOUS",
    ).length;

  console.log(
    `SCUID groups: ${scuidGroups.length}`,
  );

  console.log(
    `Resolved SCUIDs: ${resolvedScuids}`,
  );

  console.log(
    `Unresolved SCUIDs: ${unresolvedScuids}`,
  );

  console.log(
    `Ambiguous SCUIDs: ${ambiguousScuids}`,
  );

  console.log("");

  /* ---------------------------------------------------------
     CANONICAL SOURCE RESOLUTION
     --------------------------------------------------------- */

  const canonicalResolvedIds =
    new Set<string>();

  const unresolvedCanonicalNames =
    new Set<string>();

  for (const source of canonical) {
    const countyName =
      COUNTY_CODE_TO_NAME[
        source.countyCode.padStart(3, "0")
      ];

    if (!countyName) {
      unresolvedCanonicalNames.add(
        source.name,
      );
      continue;
    }

    const target = findPrismaTarget(
      countyName,
      source,
      counties,
      subcounties,
    );

    if (target) {
      canonicalResolvedIds.add(
        source.code,
      );
    } else {
      unresolvedCanonicalNames.add(
        `${countyName} :: ${source.name}`,
      );
    }
  }

  console.log(
    `Canonical sources resolved: ${canonicalResolvedIds.size}`,
  );

  console.log(
    `Canonical sources unresolved: ${unresolvedCanonicalNames.size}`,
  );

  console.log("");

  /* ---------------------------------------------------------
     AUTHORITATIVE WARD OWNERSHIP
     --------------------------------------------------------- */

  const authoritativeOwnership =
    buildAuthoritativeWardOwnership(
      identities,
      canonicalIndexes,
      counties,
      subcounties,
    );

  /* ---------------------------------------------------------
     CANDIDATES
     --------------------------------------------------------- */

  const candidates =
    await buildCandidates(
      subcounties,
      counties,
      wards,
      canonical,
      canonicalIndexes,
    );

  const safeCandidates =
    candidates.filter(
      (row) =>
        row.status === "SAFE_CANDIDATE",
    );

  const blockedCandidates =
    candidates.filter(
      (row) => row.status === "BLOCKED",
    );

  const alreadyCanonical =
    candidates.filter(
      (row) =>
        row.status ===
        "ALREADY_CANONICAL",
    );

  const manualReview =
    candidates.filter(
      (row) =>
        row.status === "MANUAL_REVIEW",
    );

  const populated =
    candidates.filter(
      (row) => row.wardCount > 0,
    );

  const empty =
    candidates.filter(
      (row) => row.wardCount === 0,
    );

  console.log(
    "------------------------------------------------------------",
  );

  console.log(
    `Total subcounty records: ${candidates.length}`,
  );

  console.log(
    `Populated subcounties: ${populated.length}`,
  );

  console.log(
    `Empty subcounties: ${empty.length}`,
  );

  console.log(
    `Safe candidates: ${safeCandidates.length}`,
  );

  console.log(
    `Blocked candidates: ${blockedCandidates.length}`,
  );

  console.log(
    `Already canonical: ${alreadyCanonical.length}`,
  );

  console.log(
    `Manual review: ${manualReview.length}`,
  );

  console.log(
    "------------------------------------------------------------",
  );

  /* ---------------------------------------------------------
     WARD OWNERSHIP AUDIT
     --------------------------------------------------------- */

  const wardOwnershipAudit =
    auditWardOwnership(
      identities,
      wards,
      authoritativeOwnership,
    );

  const correctWards =
    wardOwnershipAudit.filter(
      (row) => row.status === "CORRECT",
    ).length;

  const wrongSubcountyWards =
    wardOwnershipAudit.filter(
      (row) =>
        row.status ===
        "WRONG_SUBCOUNTY",
    ).length;

  const unassignedWards =
    wardOwnershipAudit.filter(
      (row) =>
        row.status === "UNASSIGNED",
    ).length;

  const unresolvedExpectedWards =
    wardOwnershipAudit.filter(
      (row) =>
        row.status ===
        "EXPECTED_TARGET_UNRESOLVED",
    ).length;

  console.log("");

  console.log(
    "WARD OWNERSHIP AUDIT",
  );

  console.log(
    `Total authoritative wards: ${wardOwnershipAudit.length}`,
  );

  console.log(
    `Correct ownership: ${correctWards}`,
  );

  console.log(
    `Wrong subcounty: ${wrongSubcountyWards}`,
  );

  console.log(
    `Unassigned: ${unassignedWards}`,
  );

  console.log(
    `Expected target unresolved: ${unresolvedExpectedWards}`,
  );

  console.log("");

  /* ---------------------------------------------------------
     STRUCTURAL AUDIT
     --------------------------------------------------------- */

  const structuralPass =
    authoritativeGidSet.size === 1450 &&
    databaseGids.length === 1450 &&
    databaseGidSet.size === 1450 &&
    authoritativeDuplicateCount === 0 &&
    databaseDuplicateCount === 0 &&
    missingDatabaseGids.length === 0 &&
    unmatchedDatabaseGids.length === 0;

  const structuralMessage =
    structuralPass
      ? "All 1450 authoritative ward GIDs match the 1450 database sourceGIDs exactly."
      : "Ward GID structural integrity requires review.";

  console.log(
    "============================================================",
  );

  console.log(
    `STRUCTURAL AUDIT: ${
      structuralPass
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    structuralMessage,
  );

  console.log(
    "============================================================",
  );

  /* ---------------------------------------------------------
     REPORT
     --------------------------------------------------------- */

  const report: AuditReport = {
    generatedAt:
      new Date().toISOString(),

    readOnly: true,

    sourceFiles: {
      subcounties:
        SUBCOUNTIES_FILE,
      wards:
        WARDS_FILE,
    },

    sourceCounts: {
      canonicalSubcounties:
        canonical.length,
      geoJsonFeatures:
        features.length,
      authoritativeGids:
        authoritativeGidSet.size,
    },

    databaseCounts: {
      counties:
        counties.length,
      subcounties:
        subcounties.length,
      wards:
        wards.length,
    },

    gidIntegrity: {
      databaseWardsWithSourceGid:
        databaseGids.length,
      duplicateAuthoritativeGids:
        authoritativeDuplicateCount,
      duplicateDatabaseSourceGids:
        databaseDuplicateCount,
      missingDatabaseGids:
        missingDatabaseGids.length,
      unmatchedDatabaseGids:
        unmatchedDatabaseGids.length,
    },

    scuidAudit: {
      groups:
        scuidGroups.length,
      resolved:
        resolvedScuids,
      unresolved:
        unresolvedScuids,
      ambiguous:
        ambiguousScuids,
    },

    canonicalResolution: {
      canonicalSourcesResolved:
        canonicalResolvedIds.size,
      canonicalSourcesUnresolved:
        unresolvedCanonicalNames.size,
      unresolvedCanonicalNames:
        [...unresolvedCanonicalNames].sort(
          (a, b) =>
            a.localeCompare(b),
        ),
    },

    candidateSummary: {
      totalSubcountyRecords:
        candidates.length,
      populatedSubcounties:
        populated.length,
      emptySubcounties:
        empty.length,
      safeCandidates:
        safeCandidates.length,
      blockedCandidates:
        blockedCandidates.length,
      alreadyCanonical:
        alreadyCanonical.length,
      manualReview:
        manualReview.length,
    },

    wardOwnership: {
      total:
        wardOwnershipAudit.length,
      correct:
        correctWards,
      wrongSubcounty:
        wrongSubcountyWards,
      unassigned:
        unassignedWards,
      expectedTargetUnresolved:
        unresolvedExpectedWards,
    },

    candidates,

    scuidResolutions,

    wardOwnershipAudit,

    structuralAudit: {
      status:
        structuralPass
          ? "PASS"
          : "FAIL",
      message:
        structuralMessage,
    },
  };

  fs.writeFileSync(
    JSON_OUTPUT,
    safeJsonStringify(report),
    "utf8",
  );

  writeCsv(candidates);

  console.log("");

  console.log(
    `JSON report written to: ${JSON_OUTPUT}`,
  );

  console.log(
    `CSV report written to: ${CSV_OUTPUT}`,
  );

  console.log("");

  console.log(
    "V13 completed successfully.",
  );

  console.log(
    "NO DATABASE CHANGES WERE MADE.",
  );

  console.log("");

  /* ---------------------------------------------------------
     IMPORTANT RECORDS
     --------------------------------------------------------- */

  console.log(
    "IMPORTANT CANDIDATES:",
  );

  for (const row of candidates) {
    if (
      row.status === "SAFE_CANDIDATE" ||
      row.status === "MANUAL_REVIEW"
    ) {
      console.log(
        `${row.currentId} | ${row.countyName} | ${row.currentName} | ${row.status} | target=${row.canonicalPrismaId ?? "NONE"} | wards=${row.wardCount}`,
      );
    }
  }

  console.log("");

  console.log(
    "WARD OWNERSHIP PROBLEMS:",
  );

  for (const row of wardOwnershipAudit) {
    if (
      row.status !== "CORRECT"
    ) {
      console.log(
        `GID ${row.gid} | ${row.countyName} | ${row.wardName} | authoritative=${row.authoritativeSubCountyName} | expectedId=${row.expectedPrismaSubCountyId ?? "NONE"} | actualId=${row.actualPrismaSubCountyId ?? "NONE"} | ${row.status}`,
      );
    }
  }
}

/* =========================================================
   RUN
   ========================================================= */

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V13 AUDIT FAILED:",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });