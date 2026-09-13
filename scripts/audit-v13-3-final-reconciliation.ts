
/**
 * V13.3 FINAL AUTHORITATIVE RECONCILIATION AUDIT
 *
 * PURPOSE
 * -------
 * Final read-only reconciliation of:
 *
 *   1. prisma/data/subcounties.json
 *   2. prisma/data/kenya-wards-1450.geojson
 *   3. Prisma County
 *   4. Prisma SubCounty
 *   5. Prisma Ward
 *
 * OBJECTIVE
 * ---------
 * Establish the authoritative mapping:
 *
 * GeoJSON Ward GID
 *   -> authoritative County
 *   -> authoritative SubCounty
 *   -> canonical subcounty.json record
 *   -> Prisma County
 *   -> Prisma SubCounty
 *   -> Prisma Ward
 *
 * IMPORTANT
 * ---------
 * READ-ONLY.
 * NO database modifications are performed.
 *
 * V13.2 established that only one authoritative subcounty required
 * canonical-name reconciliation:
 *
 *   BARINGO | Tiaty Sub County
 *   Prisma: 757 | Tiaty East
 *   Canonical: Tiaty East
 *
 * V13.3 therefore validates the complete final ownership chain.
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

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

/* ============================================================
   TYPES
   ============================================================ */

type CanonicalSubcounty = {
  code: string;
  countyCode: string;
  name: string;
  headquarters: string | null;
};

type GeoJsonFeature = {
  type: string;
  properties?: {
    gid?: unknown;
    pop2009?: unknown;
    county?: unknown;
    subcounty?: unknown;
    ward?: unknown;
    uid?: unknown;
    scuid?: unknown;
    cuid?: unknown;
  };
  geometry?: unknown;
};

type GeoJsonCollection = {
  type: string;
  features: GeoJsonFeature[];
};

type CountyRecord = {
  id: number;
  name: string;
  code: string | null;
};

type SubCountyRecord = {
  id: number;
  name: string;
  countyId: number;
};

type WardRecord = {
  id: number;
  name: string;
  sourceGid: number | null;
  subCountyId: number | null;
  countyId: number;
};

type CanonicalResolution = {
  canonical: CanonicalSubcounty | null;
  matchType:
    | "EXACT"
    | "NORMALIZED"
    | "ALIAS"
    | "FUZZY"
    | "NOT_FOUND";
  score: number;
};

type FinalWardResult = {
  gid: number;
  wardName: string;

  authoritativeCounty: string;
  authoritativeSubcounty: string;

  canonicalCountyCode: string | null;
  canonicalSubcountyCode: string | null;
  canonicalSubcountyName: string | null;

  prismaWardId: number | null;
  prismaWardName: string | null;

  prismaCountyId: number | null;
  prismaCountyName: string | null;

  prismaSubcountyId: number | null;
  prismaSubcountyName: string | null;

  expectedPrismaSubcountyId: number | null;
  expectedPrismaSubcountyName: string | null;

  ownership:
    | "CORRECT"
    | "WRONG_SUBCOUNTY"
    | "UNASSIGNED"
    | "TARGET_UNRESOLVED"
    | "WARD_NOT_FOUND";

  resolutionType:
    | "EXACT"
    | "NORMALIZED"
    | "ALIAS"
    | "FUZZY"
    | "NOT_FOUND";

  note: string;
};

type SubcountySummary = {
  countyName: string;
  canonicalName: string;
  canonicalCode: string;
  prismaSubcountyId: number | null;
  prismaSubcountyName: string | null;
  wardCount: number;
  correctWardCount: number;
  wrongWardCount: number;
  unresolvedWardCount: number;
  classification:
    | "CANONICAL"
    | "DUPLICATE_CANONICAL"
    | "CANONICAL_TARGET_MISSING"
    | "SOURCE_ONLY";
};

/* ============================================================
   PATHS
   ============================================================ */

const ROOT = process.cwd();

const SUBCOUNTIES_PATH = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounties.json",
);

const GEOJSON_PATH = path.join(
  ROOT,
  "prisma",
  "data",
  "kenya-wards-1450.geojson",
);

const OUTPUT_JSON = path.join(
  ROOT,
  "prisma",
  "data",
  "final-reconciliation-v13-3.json",
);

const OUTPUT_CSV = path.join(
  ROOT,
  "prisma",
  "data",
  "final-reconciliation-v13-3.csv",
);

/* ============================================================
   NAME ALIASES
   ============================================================ */

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

  banissa: "Banisa",

  lafey: "Lafey",

  ainabkoi: "Ainabkoi",

  kesses: "Kesses",
};

/* ============================================================
   COUNTY ALIASES
   ============================================================ */

const COUNTY_ALIASES: Record<string, string> = {
  "nairobi county": "Nairobi City",
  nairobi: "Nairobi City",

  "tharaka nithi": "Tharaka-Nithi",
  "tharaka-nithi": "Tharaka-Nithi",

  muranga: "Murang'a",
  "muranga county": "Murang'a",

  "elgeyo marakwet": "Elgeyo Marakwet",
  "elgeyo-marakwet": "Elgeyo Marakwet",
};

/* ============================================================
   HELPERS
   ============================================================ */

function normalizeLooseName(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\bsub\s*county\b/g, " ")
    .replace(/\bsubcounty\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeExactName(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalNameFromAuthoritativeName(
  value: string,
): string {
  const exact = normalizeExactName(value);

  if (NAME_ALIASES[exact]) {
    return NAME_ALIASES[exact];
  }

  const loose = normalizeLooseName(value);

  if (NAME_ALIASES[loose]) {
    return NAME_ALIASES[loose];
  }

  return value;
}

function canonicalCountyName(value: string): string {
  const exact = normalizeExactName(value);

  if (COUNTY_ALIASES[exact]) {
    return COUNTY_ALIASES[exact];
  }

  const loose = normalizeLooseName(value);

  if (COUNTY_ALIASES[loose]) {
    return COUNTY_ALIASES[loose];
  }

  return value;
}

function toNumber(value: unknown): number | null {
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

function safeJsonStringify(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, currentValue) =>
      typeof currentValue === "bigint"
        ? currentValue.toString()
        : currentValue,
    2,
  );
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort();
}

/* ============================================================
   EDIT DISTANCE
   ============================================================ */

function levenshtein(a: string, b: string): number {
  const aa = normalizeLooseName(a);
  const bb = normalizeLooseName(b);

  if (aa === bb) {
    return 0;
  }

  if (!aa.length) {
    return bb.length;
  }

  if (!bb.length) {
    return aa.length;
  }

  const previous = Array.from(
    { length: bb.length + 1 },
    (_, index) => index,
  );

  for (let i = 1; i <= aa.length; i++) {
    const current = [i];

    for (let j = 1; j <= bb.length; j++) {
      const insertion = current[j - 1] + 1;
      const deletion = previous[j] + 1;
      const substitution =
        previous[j - 1] + (aa[i - 1] === bb[j - 1] ? 0 : 1);

      current.push(
        Math.min(
          insertion,
          deletion,
          substitution,
        ),
      );
    }

    for (let j = 0; j < current.length; j++) {
      previous[j] = current[j];
    }
  }

  return previous[bb.length];
}

function similarity(a: string, b: string): number {
  const aa = normalizeLooseName(a);
  const bb = normalizeLooseName(b);

  if (aa === bb) {
    return 1;
  }

  const maxLength = Math.max(
    aa.length,
    bb.length,
  );

  if (!maxLength) {
    return 1;
  }

  return 1 - levenshtein(aa, bb) / maxLength;
}

function tokenSimilarity(a: string, b: string): number {
  const aTokens = new Set(
    normalizeLooseName(a)
      .split(" ")
      .filter(Boolean),
  );

  const bTokens = new Set(
    normalizeLooseName(b)
      .split(" ")
      .filter(Boolean),
  );

  if (!aTokens.size || !bTokens.size) {
    return 0;
  }

  let intersection = 0;

  for (const token of aTokens) {
    if (bTokens.has(token)) {
      intersection++;
    }
  }

  const union = new Set([
    ...aTokens,
    ...bTokens,
  ]).size;

  return union ? intersection / union : 0;
}

/* ============================================================
   LOAD CANONICAL SOURCE
   ============================================================ */

function loadCanonicalSource(): CanonicalSubcounty[] {
  const raw = fs.readFileSync(
    SUBCOUNTIES_PATH,
    "utf8",
  );

  const parsed: unknown = JSON.parse(raw);

  let records: unknown[];

  if (Array.isArray(parsed)) {
    records = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray(
      (parsed as { value?: unknown[] }).value,
    )
  ) {
    records = (
      parsed as {
        value: unknown[];
      }
    ).value;
  } else {
    throw new Error(
      "Unsupported subcounties.json structure.",
    );
  }

  return records.map((record, index) => {
    if (
      !record ||
      typeof record !== "object"
    ) {
      throw new Error(
        `Invalid canonical subcounty record at index ${index}.`,
      );
    }

    const item =
      record as Partial<CanonicalSubcounty>;

    if (
      !item.code ||
      !item.countyCode ||
      !item.name
    ) {
      throw new Error(
        `Canonical subcounty record ${index} is missing code, countyCode or name.`,
      );
    }

    return {
      code: String(item.code),
      countyCode: String(item.countyCode),
      name: String(item.name),
      headquarters:
        item.headquarters == null
          ? null
          : String(item.headquarters),
    };
  });
}

/* ============================================================
   LOAD GEOJSON
   ============================================================ */

function loadGeoJson(): GeoJsonFeature[] {
  const raw = fs.readFileSync(
    GEOJSON_PATH,
    "utf8",
  );

  const parsed =
    JSON.parse(raw) as GeoJsonCollection;

  if (
    !parsed ||
    !Array.isArray(parsed.features)
  ) {
    throw new Error(
      "Invalid kenya-wards-1450.geojson structure.",
    );
  }

  return parsed.features;
}

/* ============================================================
   CANONICAL INDEXES
   ============================================================ */

function buildCanonicalCountyIndex(
  canonical: CanonicalSubcounty[],
) {
  const byCountyCode = new Map<
    string,
    CanonicalSubcounty[]
  >();

  for (const record of canonical) {
    const existing =
      byCountyCode.get(record.countyCode) ?? [];

    existing.push(record);

    byCountyCode.set(
      record.countyCode,
      existing,
    );
  }

  return byCountyCode;
}

function resolveCanonicalSubcounty(
  authoritativeCounty: string,
  authoritativeSubcounty: string,
  prismaCounty: CountyRecord | null,
  canonical: CanonicalSubcounty[],
): CanonicalResolution {
  const canonicalCounty = canonicalCountyName(
    authoritativeCounty,
  );

  let candidates = canonical.filter(
    (record) => {
      if (!prismaCounty) {
        return true;
      }

      return (
        normalizeLooseName(
          canonicalCounty,
        ) ===
        normalizeLooseName(
          prismaCounty.name,
        )
      );
    },
  );

  if (!candidates.length) {
    candidates = canonical;
  }

  const canonicalTarget =
    canonicalNameFromAuthoritativeName(
      authoritativeSubcounty,
    );

  const exactTarget = normalizeExactName(
    canonicalTarget,
  );

  const exact = candidates.find(
    (record) =>
      normalizeExactName(record.name) ===
      exactTarget,
  );

  if (exact) {
    const aliasWasUsed =
      normalizeExactName(
        exact.name,
      ) !==
      normalizeExactName(
        authoritativeSubcounty,
      );

    return {
      canonical: exact,
      matchType: aliasWasUsed
        ? "ALIAS"
        : "EXACT",
      score: 1,
    };
  }

  const normalizedTarget =
    normalizeLooseName(canonicalTarget);

  const normalized =
    candidates.find(
      (record) =>
        normalizeLooseName(record.name) ===
        normalizedTarget,
    );

  if (normalized) {
    const aliasWasUsed =
      normalizeLooseName(
        normalized.name,
      ) !==
      normalizeLooseName(
        authoritativeSubcounty,
      );

    return {
      canonical: normalized,
      matchType: aliasWasUsed
        ? "ALIAS"
        : "NORMALIZED",
      score: 0.99,
    };
  }

  let best:
    | {
        record: CanonicalSubcounty;
        edit: number;
        token: number;
        score: number;
      }
    | null = null;

  for (const record of candidates) {
    const edit = similarity(
      authoritativeSubcounty,
      record.name,
    );

    const token = tokenSimilarity(
      authoritativeSubcounty,
      record.name,
    );

    const score =
      edit * 0.7 +
      token * 0.3;

    if (
      !best ||
      score > best.score
    ) {
      best = {
        record,
        edit,
        token,
        score,
      };
    }
  }

  if (
    best &&
    best.score >= 0.90
  ) {
    return {
      canonical: best.record,
      matchType: "FUZZY",
      score: best.score,
    };
  }

  return {
    canonical: null,
    matchType: "NOT_FOUND",
    score: 0,
  };
}

/* ============================================================
   MAIN
   ============================================================ */

async function main() {
  console.log(
    "\n============================================================",
  );

  console.log(
    "V13.3 FINAL AUTHORITATIVE RECONCILIATION AUDIT",
  );

  console.log(
    "READ-ONLY — NO DATABASE MODIFICATIONS",
  );

  console.log(
    "============================================================\n",
  );

  /* ----------------------------------------------------------
     LOAD SOURCE FILES
     ---------------------------------------------------------- */

  const canonical =
    loadCanonicalSource();

  const features =
    loadGeoJson();

  console.log(
    `Canonical source records: ${canonical.length}`,
  );

  console.log(
    `GeoJSON features: ${features.length}\n`,
  );

  /* ----------------------------------------------------------
     LOAD PRISMA DATA
     ---------------------------------------------------------- */

  const counties =
    (await prisma.county.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        id: "asc",
      },
    })) as CountyRecord[];

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
    })) as SubCountyRecord[];

  const wards =
    (await prisma.ward.findMany({
      select: {
        id: true,
        name: true,
        sourceGid: true,
        subCountyId: true,
        countyId: true,
      },
      orderBy: {
        id: "asc",
      },
    })) as WardRecord[];

  console.log(
    `Database counties: ${counties.length}`,
  );

  console.log(
    `Database subcounties: ${subcounties.length}`,
  );

  console.log(
    `Database wards: ${wards.length}\n`,
  );

  /* ----------------------------------------------------------
     INDEX PRISMA COUNTIES
     ---------------------------------------------------------- */

  const countyById =
    new Map<number, CountyRecord>();

  const countyByCode =
    new Map<string, CountyRecord>();

  const countyByName =
    new Map<string, CountyRecord[]>();

  for (const county of counties) {
    countyById.set(
      county.id,
      county,
    );

    if (county.code != null) {
      countyByCode.set(
        String(county.code).padStart(3, "0"),
        county,
      );
    }

    const key =
      normalizeLooseName(county.name);

    const list =
      countyByName.get(key) ?? [];

    list.push(county);

    countyByName.set(
      key,
      list,
    );
  }

  /* ----------------------------------------------------------
     INDEX PRISMA SUBCOUNTIES
     ---------------------------------------------------------- */

  const subcountyById =
    new Map<number, SubCountyRecord>();

  const subcountiesByCounty =
    new Map<
      number,
      SubCountyRecord[]
    >();

  for (const subcounty of subcounties) {
    subcountyById.set(
      subcounty.id,
      subcounty,
    );

    const list =
      subcountiesByCounty.get(
        subcounty.countyId,
      ) ?? [];

    list.push(subcounty);

    subcountiesByCounty.set(
      subcounty.countyId,
      list,
    );
  }

  /* ----------------------------------------------------------
     INDEX PRISMA WARDS
     ---------------------------------------------------------- */

  const wardByGid =
    new Map<number, WardRecord>();

  const duplicateDatabaseGids =
    new Map<number, number[]>();

  for (const ward of wards) {
    if (ward.sourceGid == null) {
      continue;
    }

    const existing =
      wardByGid.get(
        ward.sourceGid,
      );

    if (existing) {
      const list =
        duplicateDatabaseGids.get(
          ward.sourceGid,
        ) ?? [
          existing.id,
        ];

      list.push(ward.id);

      duplicateDatabaseGids.set(
        ward.sourceGid,
        list,
      );

      continue;
    }

    wardByGid.set(
      ward.sourceGid,
      ward,
    );
  }

  /* ----------------------------------------------------------
     AUTHORITATIVE GID INDEX
     ---------------------------------------------------------- */

  const authoritativeGidMap =
    new Map<number, GeoJsonFeature>();

  const duplicateAuthoritativeGids =
    new Map<number, number[]>();

  for (const feature of features) {
    const gid =
      toNumber(
        feature.properties?.gid,
      );

    if (gid == null) {
      continue;
    }

    if (
      authoritativeGidMap.has(gid)
    ) {
      const existing =
        duplicateAuthoritativeGids.get(
          gid,
        ) ?? [];

      existing.push(gid);

      duplicateAuthoritativeGids.set(
        gid,
        existing,
      );

      continue;
    }

    authoritativeGidMap.set(
      gid,
      feature,
    );
  }

  /* ----------------------------------------------------------
     STRUCTURAL GID AUDIT
     ---------------------------------------------------------- */

  const authoritativeGids =
    [...authoritativeGidMap.keys()]
      .sort((a, b) => a - b);

  const databaseGids =
    [...wardByGid.keys()]
      .sort((a, b) => a - b);

  const databaseGidSet =
    new Set(databaseGids);

  const authoritativeGidSet =
    new Set(authoritativeGids);

  const missingDatabaseGids =
    authoritativeGids.filter(
      (gid) =>
        !databaseGidSet.has(gid),
    );

  const unmatchedDatabaseGids =
    databaseGids.filter(
      (gid) =>
        !authoritativeGidSet.has(gid),
    );

  console.log(
    "------------------------------------------------------------",
  );

  console.log(
    "STRUCTURAL GID AUDIT",
  );

  console.log(
    "------------------------------------------------------------",
  );

  console.log(
    `Authoritative GIDs: ${authoritativeGids.length}`,
  );

  console.log(
    `Database sourceGIDs: ${databaseGids.length}`,
  );

  console.log(
    `Duplicate authoritative GIDs: ${duplicateAuthoritativeGids.size}`,
  );

  console.log(
    `Duplicate database sourceGIDs: ${duplicateDatabaseGids.size}`,
  );

  console.log(
    `Missing database GIDs: ${missingDatabaseGids.length}`,
  );

  console.log(
    `Unmatched database GIDs: ${unmatchedDatabaseGids.length}`,
  );

  const structuralPass =
    duplicateAuthoritativeGids.size === 0 &&
    duplicateDatabaseGids.size === 0 &&
    missingDatabaseGids.length === 0 &&
    unmatchedDatabaseGids.length === 0;

  console.log(
    `STRUCTURAL RESULT: ${
      structuralPass
        ? "PASS"
        : "FAIL"
    }\n`,
  );

  /* ----------------------------------------------------------
     CANONICAL SUBCOUNTY INDEX
     ---------------------------------------------------------- */

  const canonicalByCountyCode =
    new Map<
      string,
      CanonicalSubcounty[]
    >();

  for (const record of canonical) {
    const list =
      canonicalByCountyCode.get(
        record.countyCode,
      ) ?? [];

    list.push(record);

    canonicalByCountyCode.set(
      record.countyCode,
      list,
    );
  }

  /* ----------------------------------------------------------
     RESOLVE AUTHORITATIVE WARD OWNERSHIP
     ---------------------------------------------------------- */

  const finalWardResults:
    FinalWardResult[] = [];

  for (const feature of features) {
    const props =
      feature.properties ?? {};

    const gid =
      toNumber(props.gid);

    if (gid == null) {
      continue;
    }

    const wardName =
      String(
        props.ward ?? "",
      ).trim();

    const authoritativeCounty =
      String(
        props.county ?? "",
      ).trim();

    const authoritativeSubcounty =
      String(
        props.subcounty ?? "",
      ).trim();

    const ward =
      wardByGid.get(gid) ??
      null;

    /* --------------------------------------------------------
       FIND PRISMA COUNTY
       -------------------------------------------------------- */

    let prismaCounty:
      | CountyRecord
      | null = null;

    const authoritativeCountyCanonical =
      canonicalCountyName(
        authoritativeCounty,
      );

    const countyCandidates =
      countyByName.get(
        normalizeLooseName(
          authoritativeCountyCanonical,
        ),
      ) ?? [];

    if (
      countyCandidates.length === 1
    ) {
      prismaCounty =
        countyCandidates[0];
    } else {
      const exactCounty =
        counties.find(
          (county) =>
            normalizeExactName(
              county.name,
            ) ===
            normalizeExactName(
              authoritativeCountyCanonical,
            ),
        );

      prismaCounty =
        exactCounty ?? null;
    }

    /* --------------------------------------------------------
       RESOLVE CANONICAL SUBCOUNTY
       -------------------------------------------------------- */

    const resolution =
      resolveCanonicalSubcounty(
        authoritativeCounty,
        authoritativeSubcounty,
        prismaCounty,
        canonical,
      );

    const canonicalRecord =
      resolution.canonical;

    /* --------------------------------------------------------
       FIND EXPECTED PRISMA SUBCOUNTY
       -------------------------------------------------------- */

    let expectedPrismaSubcounty:
      | SubCountyRecord
      | null = null;

    if (
      prismaCounty &&
      canonicalRecord
    ) {
      const candidates =
        subcountiesByCounty.get(
          prismaCounty.id,
        ) ?? [];

      const canonicalExact =
        normalizeExactName(
          canonicalRecord.name,
        );

      const exactCandidates =
        candidates.filter(
          (candidate) =>
            normalizeExactName(
              candidate.name,
            ) === canonicalExact,
        );

      if (
        exactCandidates.length === 1
      ) {
        expectedPrismaSubcounty =
          exactCandidates[0];
      } else if (
        exactCandidates.length > 1
      ) {
        /*
         * If multiple exact records exist,
         * leave unresolved rather than guessing.
         */
        expectedPrismaSubcounty =
          null;
      } else {
        const looseCanonical =
          normalizeLooseName(
            canonicalRecord.name,
          );

        const looseCandidates =
          candidates.filter(
            (candidate) =>
              normalizeLooseName(
                candidate.name,
              ) === looseCanonical,
          );

        if (
          looseCandidates.length === 1
        ) {
          expectedPrismaSubcounty =
            looseCandidates[0];
        }
      }
    }

    /* --------------------------------------------------------
       ACTUAL PRISMA SUBCOUNTY
       -------------------------------------------------------- */

    const actualSubcounty =
      ward?.subCountyId != null
        ? subcountyById.get(
            ward.subCountyId,
          ) ?? null
        : null;

    let ownership:
      | "CORRECT"
      | "WRONG_SUBCOUNTY"
      | "UNASSIGNED"
      | "TARGET_UNRESOLVED"
      | "WARD_NOT_FOUND";

    let note = "";

    if (!ward) {
      ownership =
        "WARD_NOT_FOUND";

      note =
        "Authoritative GID does not exist in Prisma.";
    } else if (
      expectedPrismaSubcounty == null
    ) {
      ownership =
        "TARGET_UNRESOLVED";

      note =
        "Authoritative subcounty could not be mapped to exactly one Prisma target.";
    } else if (
      ward.subCountyId == null
    ) {
      ownership =
        "UNASSIGNED";

      note =
        "Prisma ward exists but has no subcounty assignment.";
    } else if (
      ward.subCountyId ===
      expectedPrismaSubcounty.id
    ) {
      ownership =
        "CORRECT";

      note =
        "Prisma ward ownership matches the authoritative target.";
    } else {
      ownership =
        "WRONG_SUBCOUNTY";

      note =
        `Expected Prisma SubCounty ${expectedPrismaSubcounty.id} (${expectedPrismaSubcounty.name}) but found ${actualSubcounty?.id ?? ward.subCountyId} (${actualSubcounty?.name ?? "UNKNOWN"}).`;
    }

    finalWardResults.push({
      gid,
      wardName,

      authoritativeCounty,
      authoritativeSubcounty,

      canonicalCountyCode:
        canonicalRecord?.countyCode ??
        null,

      canonicalSubcountyCode:
        canonicalRecord?.code ??
        null,

      canonicalSubcountyName:
        canonicalRecord?.name ??
        null,

      prismaWardId:
        ward?.id ??
        null,

      prismaWardName:
        ward?.name ??
        null,

      prismaCountyId:
        prismaCounty?.id ??
        null,

      prismaCountyName:
        prismaCounty?.name ??
        null,

      prismaSubcountyId:
        actualSubcounty?.id ??
        null,

      prismaSubcountyName:
        actualSubcounty?.name ??
        null,

      expectedPrismaSubcountyId:
        expectedPrismaSubcounty?.id ??
        null,

      expectedPrismaSubcountyName:
        expectedPrismaSubcounty?.name ??
        null,

      ownership,

      resolutionType:
        resolution.matchType,

      note,
    });
  }

  /* ----------------------------------------------------------
     WARD OWNERSHIP SUMMARY
     ---------------------------------------------------------- */

  const correct =
    finalWardResults.filter(
      (row) =>
        row.ownership ===
        "CORRECT",
    );

  const wrong =
    finalWardResults.filter(
      (row) =>
        row.ownership ===
        "WRONG_SUBCOUNTY",
    );

  const unassigned =
    finalWardResults.filter(
      (row) =>
        row.ownership ===
        "UNASSIGNED",
    );

  const targetUnresolved =
    finalWardResults.filter(
      (row) =>
        row.ownership ===
        "TARGET_UNRESOLVED",
    );

  const wardNotFound =
    finalWardResults.filter(
      (row) =>
        row.ownership ===
        "WARD_NOT_FOUND",
    );

  console.log(
    "============================================================",
  );

  console.log(
    "FINAL WARD OWNERSHIP AUDIT",
  );

  console.log(
    "============================================================",
  );

  console.log(
    `Total authoritative wards: ${finalWardResults.length}`,
  );

  console.log(
    `Correct ownership: ${correct.length}`,
  );

  console.log(
    `Wrong subcounty: ${wrong.length}`,
  );

  console.log(
    `Unassigned: ${unassigned.length}`,
  );

  console.log(
    `Target unresolved: ${targetUnresolved.length}`,
  );

  console.log(
    `Ward not found: ${wardNotFound.length}`,
  );

  /* ----------------------------------------------------------
     RESOLUTION TYPE SUMMARY
     ---------------------------------------------------------- */

  const resolutionCounts =
    new Map<string, number>();

  for (const row of finalWardResults) {
    resolutionCounts.set(
      row.resolutionType,
      (resolutionCounts.get(
        row.resolutionType,
      ) ?? 0) + 1,
    );
  }

  console.log(
    "\n------------------------------------------------------------",
  );

  console.log(
    "CANONICAL RESOLUTION TYPES",
  );

  console.log(
    "------------------------------------------------------------",
  );

  for (
    const type of [
      "EXACT",
      "NORMALIZED",
      "ALIAS",
      "FUZZY",
      "NOT_FOUND",
    ]
  ) {
    console.log(
      `${type}: ${
        resolutionCounts.get(type) ?? 0
      }`,
    );
  }

  /* ----------------------------------------------------------
     SUBCOUNTY-LEVEL SUMMARY
     ---------------------------------------------------------- */

  const subcountySummaryMap =
    new Map<
      string,
      SubcountySummary
    >();

  for (const record of canonical) {
    const countyCandidates =
      counties.filter(
        (county) =>
          county.code != null &&
          String(county.code).padStart(3, "0") ===
            String(record.countyCode).padStart(
              3,
              "0",
            ),
      );

    const prismaCounty =
      countyCandidates.length === 1
        ? countyCandidates[0]
        : null;

    let prismaTarget:
      | SubCountyRecord
      | null = null;

    if (prismaCounty) {
      const candidates =
        subcountiesByCounty.get(
          prismaCounty.id,
        ) ?? [];

      const exact =
        candidates.filter(
          (candidate) =>
            normalizeExactName(
              candidate.name,
            ) ===
            normalizeExactName(
              record.name,
            ),
        );

      if (exact.length === 1) {
        prismaTarget =
          exact[0];
      } else {
        const loose =
          candidates.filter(
            (candidate) =>
              normalizeLooseName(
                candidate.name,
              ) ===
              normalizeLooseName(
                record.name,
              ),
          );

        if (loose.length === 1) {
          prismaTarget =
            loose[0];
        }
      }
    }

    const rows =
      finalWardResults.filter(
        (row) =>
          row.canonicalSubcountyCode ===
          record.code,
      );

    const wardCount =
      rows.length;

    const correctWardCount =
      rows.filter(
        (row) =>
          row.ownership ===
          "CORRECT",
      ).length;

    const wrongWardCount =
      rows.filter(
        (row) =>
          row.ownership ===
          "WRONG_SUBCOUNTY",
      ).length;

    const unresolvedWardCount =
      rows.filter(
        (row) =>
          row.ownership !==
          "CORRECT" &&
          row.ownership !==
          "WRONG_SUBCOUNTY",
      ).length;

    const key =
      `${record.countyCode}:${record.code}`;

    let classification:
      | "CANONICAL"
      | "DUPLICATE_CANONICAL"
      | "CANONICAL_TARGET_MISSING"
      | "SOURCE_ONLY";

    if (!prismaCounty) {
      classification =
        "CANONICAL_TARGET_MISSING";
    } else if (!prismaTarget) {
      classification =
        "CANONICAL_TARGET_MISSING";
    } else {
      const duplicateCount =
        (
          subcountiesByCounty.get(
            prismaCounty.id,
          ) ?? []
        ).filter(
          (candidate) =>
            normalizeLooseName(
              candidate.name,
            ) ===
            normalizeLooseName(
              record.name,
            ),
        ).length;

      classification =
        duplicateCount > 1
          ? "DUPLICATE_CANONICAL"
          : "CANONICAL";
    }

    subcountySummaryMap.set(
      key,
      {
        countyName:
          prismaCounty?.name ??
          "UNKNOWN",

        canonicalName:
          record.name,

        canonicalCode:
          record.code,

        prismaSubcountyId:
          prismaTarget?.id ??
          null,

        prismaSubcountyName:
          prismaTarget?.name ??
          null,

        wardCount,

        correctWardCount,

        wrongWardCount,

        unresolvedWardCount,

        classification,
      },
    );
  }

  const subcountySummaries =
    [...subcountySummaryMap.values()]
      .sort((a, b) => {
        const countyCompare =
          a.countyName.localeCompare(
            b.countyName,
          );

        if (countyCompare !== 0) {
          return countyCompare;
        }

        return a.canonicalName.localeCompare(
          b.canonicalName,
        );
      });

  /* ----------------------------------------------------------
     DUPLICATE PRISMA SUBCOUNTY IDENTITIES
     ---------------------------------------------------------- */

  const duplicateGroups: Array<{
    countyId: number;
    countyName: string;
    normalizedName: string;
    records: Array<{
      id: number;
      name: string;
      wardCount: number;
    }>;
  }> = [];

  for (
    const [countyId, records]
    of subcountiesByCounty.entries()
  ) {
    const groups =
      new Map<
        string,
        SubCountyRecord[]
      >();

    for (const record of records) {
      const key =
        normalizeLooseName(
          record.name,
        );

      const list =
        groups.get(key) ?? [];

      list.push(record);

      groups.set(key, list);
    }

    for (
      const [
        normalizedName,
        groupedRecords,
      ] of groups.entries()
    ) {
      if (
        groupedRecords.length <= 1
      ) {
        continue;
      }

      const county =
        countyById.get(countyId);

      if (!county) {
        continue;
      }

      duplicateGroups.push({
        countyId,
        countyName:
          county.name,
        normalizedName,
        records:
          groupedRecords.map(
            (record) => ({
              id: record.id,
              name: record.name,
              wardCount:
                finalWardResults.filter(
                  (row) =>
                    row.prismaSubcountyId ===
                    record.id,
                ).length,
            }),
          ),
      });
    }
  }

  /* ----------------------------------------------------------
     WRONG OWNERSHIP DETAILS
     ---------------------------------------------------------- */

  console.log(
    "\n============================================================",
  );

  console.log(
    "WRONG SUBCOUNTY OWNERSHIP",
  );

  console.log(
    "============================================================",
  );

  if (!wrong.length) {
    console.log(
      "None.",
    );
  } else {
    for (const row of wrong) {
      console.log(
        `GID ${row.gid} | ${row.authoritativeCounty} | ${row.authoritativeSubcounty} | ${row.wardName}`,
      );

      console.log(
        `  Expected: ${row.expectedPrismaSubcountyId} | ${row.expectedPrismaSubcountyName}`,
      );

      console.log(
        `  Actual:   ${row.prismaSubcountyId} | ${row.prismaSubcountyName}`,
      );
    }
  }

  /* ----------------------------------------------------------
     DUPLICATE SUBCOUNTY DETAILS
     ---------------------------------------------------------- */

  console.log(
    "\n============================================================",
  );

  console.log(
    "DUPLICATE PRISMA SUBCOUNTY IDENTITIES",
  );

  console.log(
    "============================================================",
  );

  if (!duplicateGroups.length) {
    console.log(
      "None.",
    );
  } else {
    for (const group of duplicateGroups) {
      console.log(
        `${group.countyName} | ${group.normalizedName}`,
      );

      for (
        const record of group.records
      ) {
        console.log(
          `  ID ${record.id} | ${record.name} | wards ${record.wardCount}`,
        );
      }
    }
  }

  /* ----------------------------------------------------------
     SAFE CONSOLIDATION CANDIDATES
     ---------------------------------------------------------- */

  const safeConsolidationCandidates =
    duplicateGroups.flatMap(
      (group) => {
        if (
          group.records.length < 2
        ) {
          return [];
        }

        const sorted =
          [...group.records].sort(
            (a, b) =>
              b.wardCount -
              a.wardCount,
          );

        const canonical =
          sorted[0];

        return sorted
          .slice(1)
          .map(
            (duplicate) => ({
              countyId:
                group.countyId,

              countyName:
                group.countyName,

              normalizedName:
                group.normalizedName,

              canonicalPrismaSubcountyId:
                canonical.id,

              canonicalPrismaSubcountyName:
                canonical.name,

              duplicatePrismaSubcountyId:
                duplicate.id,

              duplicatePrismaSubcountyName:
                duplicate.name,

              canonicalWardCount:
                canonical.wardCount,

              duplicateWardCount:
                duplicate.wardCount,

              status:
                duplicate.wardCount === 0
                  ? "SAFE_CANDIDATE"
                  : "REQUIRES_WARD_MIGRATION",
            }),
          );
      },
    );

  /* ----------------------------------------------------------
     FINAL SUMMARY
     ---------------------------------------------------------- */

  const allOwnershipResolved =
    targetUnresolved.length === 0 &&
    wardNotFound.length === 0;

  const finalReady =
    structuralPass &&
    allOwnershipResolved;

  console.log(
    "\n============================================================",
  );

  console.log(
    "V13.3 FINAL RESULT",
  );

  console.log(
    "============================================================",
  );

  console.log(
    `Structural GID integrity: ${
      structuralPass
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `Authoritative wards: ${finalWardResults.length}`,
  );

  console.log(
    `Correct ownership: ${correct.length}`,
  );

  console.log(
    `Wrong ownership: ${wrong.length}`,
  );

  console.log(
    `Unassigned: ${unassigned.length}`,
  );

  console.log(
    `Target unresolved: ${targetUnresolved.length}`,
  );

  console.log(
    `Ward not found: ${wardNotFound.length}`,
  );

  console.log(
    `Duplicate Prisma subcounty groups: ${duplicateGroups.length}`,
  );

  console.log(
    `Safe consolidation candidates: ${
      safeConsolidationCandidates.filter(
        (candidate) =>
          candidate.status ===
          "SAFE_CANDIDATE",
      ).length
    }`,
  );

  console.log(
    `Final reconciliation status: ${
      finalReady
        ? "READY"
        : "REQUIRES REPAIR / REVIEW"
    }`,
  );

  /* ----------------------------------------------------------
     OUTPUT JSON
     ---------------------------------------------------------- */

  const output = {
    audit: "V13.3",
    purpose:
      "Final authoritative reconciliation of Kenya ward and subcounty identities",
    readOnly: true,

    sources: {
      canonicalSubcounties:
        "prisma/data/subcounties.json",
      authoritativeWards:
        "prisma/data/kenya-wards-1450.geojson",
    },

    counts: {
      canonicalSourceRecords:
        canonical.length,

      geoJsonFeatures:
        features.length,

      databaseCounties:
        counties.length,

      databaseSubcounties:
        subcounties.length,

      databaseWards:
        wards.length,

      authoritativeGids:
        authoritativeGids.length,

      databaseSourceGids:
        databaseGids.length,
    },

    structuralAudit: {
      pass:
        structuralPass,

      duplicateAuthoritativeGids:
        [...duplicateAuthoritativeGids.entries()],

      duplicateDatabaseGids:
        [...duplicateDatabaseGids.entries()],

      missingDatabaseGids,

      unmatchedDatabaseGids,
    },

    ownershipSummary: {
      total:
        finalWardResults.length,

      correct:
        correct.length,

      wrongSubcounty:
        wrong.length,

      unassigned:
        unassigned.length,

      targetUnresolved:
        targetUnresolved.length,

      wardNotFound:
        wardNotFound.length,
    },

    resolutionSummary:
      Object.fromEntries(
        resolutionCounts,
      ),

    finalReady,

    wrongOwnership: wrong,

    unresolvedOwnership:
      targetUnresolved,

    unassignedOwnership:
      unassigned,

    wardNotFound,

    subcountySummaries,

    duplicatePrismaSubcountyGroups:
      duplicateGroups,

    safeConsolidationCandidates,

    allWardResults:
      finalWardResults,
  };

  fs.writeFileSync(
    OUTPUT_JSON,
    safeJsonStringify(output),
    "utf8",
  );

  /* ----------------------------------------------------------
     OUTPUT CSV
     ---------------------------------------------------------- */

  const csvHeader = [
    "gid",
    "wardName",
    "authoritativeCounty",
    "authoritativeSubcounty",
    "canonicalCountyCode",
    "canonicalSubcountyCode",
    "canonicalSubcountyName",
    "prismaWardId",
    "prismaWardName",
    "prismaCountyId",
    "prismaCountyName",
    "prismaSubcountyId",
    "prismaSubcountyName",
    "expectedPrismaSubcountyId",
    "expectedPrismaSubcountyName",
    "ownership",
    "resolutionType",
    "note",
  ];

  const csvLines = [
    csvHeader.join(","),
    ...finalWardResults.map(
      (row) =>
        [
          row.gid,
          row.wardName,
          row.authoritativeCounty,
          row.authoritativeSubcounty,
          row.canonicalCountyCode,
          row.canonicalSubcountyCode,
          row.canonicalSubcountyName,
          row.prismaWardId,
          row.prismaWardName,
          row.prismaCountyId,
          row.prismaCountyName,
          row.prismaSubcountyId,
          row.prismaSubcountyName,
          row.expectedPrismaSubcountyId,
          row.expectedPrismaSubcountyName,
          row.ownership,
          row.resolutionType,
          row.note,
        ]
          .map(csvEscape)
          .join(","),
    ),
  ];

  fs.writeFileSync(
    OUTPUT_CSV,
    csvLines.join("\n"),
    "utf8",
  );

  /* ----------------------------------------------------------
     OUTPUT FILES
     ---------------------------------------------------------- */

  console.log(
    "\n============================================================",
  );

  console.log(
    "OUTPUT FILES",
  );

  console.log(
    "============================================================",
  );

  console.log(
    `JSON: prisma\\data\\final-reconciliation-v13-3.json`,
  );

  console.log(
    `CSV:  prisma\\data\\final-reconciliation-v13-3.csv`,
  );

  console.log(
    "\nV13.3 COMPLETE.",
  );

  console.log(
    "READ-ONLY — NO DATABASE MODIFICATIONS.\n",
  );
}

/* ============================================================
   RUN
   ============================================================ */

main()
  .catch((error) => {
    console.error(
      "\nV13.3 FAILED.\n",
    );

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

