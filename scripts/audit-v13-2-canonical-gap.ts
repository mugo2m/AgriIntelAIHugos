import "dotenv/config";
import fs from "fs";
import path from "path";

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

const ROOT = process.cwd();

const SUBCOUNTIES_FILE = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounties.json"
);

const GEOJSON_FILE = path.join(
  ROOT,
  "prisma",
  "data",
  "kenya-wards-1450.geojson"
);

const OUTPUT_JSON = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounty-canonical-gap-v13-2.json"
);

const OUTPUT_CSV = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounty-canonical-gap-v13-2.csv"
);

type CanonicalSubcounty = {
  code: string;
  countyCode: string;
  name: string;
  headquarters: string | null;
};

type GeoFeature = {
  type?: string;
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
};

type GeoJSONFile = {
  type?: string;
  features?: GeoFeature[];
};

type MatchClassification =
  | "EXACT"
  | "NORMALIZED"
  | "ALIAS"
  | "FUZZY_REVIEW";

type CanonicalCandidate = {
  canonicalCode: string;
  canonicalCountyCode: string;
  canonicalName: string;
  headquarters: string | null;
  classification: MatchClassification;
  score: number;
  editSimilarity: number;
  tokenSimilarity: number;
};

type AuditClassification =
  | "CANONICAL_FOUND"
  | "COUNTY_ALIAS_REQUIRED"
  | "NO_CANONICAL_MATCH";

type AuditRecord = {
  county: string;
  normalizedCounty: string;
  prismaCountyId: number | null;

  authoritativeSubcounty: string;
  normalizedAuthoritativeSubcounty: string;

  prismaSubcountyId: number | null;
  prismaSubcountyName: string | null;

  wardCount: number;
  wardGids: number[];

  classification: AuditClassification;

  bestMatch: CanonicalCandidate | null;
  alternativeMatches: CanonicalCandidate[];

  note: string;
};

/* ============================================================
   NAME NORMALIZATION
============================================================ */

function normalizeLooseName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeExactName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCountyName(value: string): string {
  return normalizeLooseName(value)
    .replace(/\bcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   COUNTY ALIASES

   GeoJSON:
     Nairobi

   Prisma:
     Nairobi City
============================================================ */

const COUNTY_ALIASES: Record<string, string> = {
  nairobi: "nairobi city",

  "tharaka nithi": "tharaka nithi",

  muranga: "muranga",

  "elgeyo marakwet": "elgeyo marakwet",
};

/* ============================================================
   SUBCOUNTY ALIASES
============================================================ */

const NAME_ALIASES: Record<string, string> = {
  "tiaty sub county": "tiaty east",
  tiaty: "tiaty east",

  transmaraeast: "trans mara east",
  "transmara east": "trans mara east",
  "trans mara east": "trans mara east",

  "transmara west": "trans mara west",
  "transmara west": "trans mara west",
  "trans mara west": "trans mara west",

  "muranga south": "muranga south",
  "muranga east": "muranga east",

  mukurewini: "mukurwe ini",

  "mandera west": "mandera west",
  "mandera east": "mandera east",
  "mandera north": "mandera north",

  banissa: "banissa",
  banisa: "banisa",

  lafey: "lafey",

  ainabkoi: "ainabkoi",

  kesses: "kesses",
};

/* ============================================================
   ALIAS HELPERS
============================================================ */

function canonicalAliasName(value: string): string {
  const loose = normalizeLooseName(value);

  return NAME_ALIASES[loose] ?? loose;
}

function canonicalCountyAlias(value: string): string {
  const normalized = normalizeCountyName(value);

  return COUNTY_ALIASES[normalized] ?? normalized;
}

/* ============================================================
   LEVENSHTEIN
============================================================ */

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;

  const matrix: number[][] = Array.from(
    { length: rows },
    () => Array<number>(cols).fill(0)
  );

  for (let i = 0; i < rows; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j < cols; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function editSimilarity(a: string, b: string): number {
  if (!a && !b) {
    return 1;
  }

  if (!a || !b) {
    return 0;
  }

  const distance = levenshtein(a, b);
  const maxLength = Math.max(a.length, b.length);

  return maxLength === 0
    ? 1
    : 1 - distance / maxLength;
}

/* ============================================================
   TOKEN SIMILARITY
============================================================ */

function tokenSimilarity(a: string, b: string): number {
  const aTokens = new Set(
    normalizeLooseName(a)
      .split(" ")
      .filter(Boolean)
  );

  const bTokens = new Set(
    normalizeLooseName(b)
      .split(" ")
      .filter(Boolean)
  );

  if (aTokens.size === 0 && bTokens.size === 0) {
    return 1;
  }

  if (aTokens.size === 0 || bTokens.size === 0) {
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

  return union === 0
    ? 0
    : intersection / union;
}

/* ============================================================
   MATCH CLASSIFICATION
============================================================ */

function classifyMatch(
  authoritativeName: string,
  canonicalName: string
): {
  classification: MatchClassification;
  score: number;
  editSimilarity: number;
  tokenSimilarity: number;
} {
  const exactA = normalizeExactName(authoritativeName);
  const exactB = normalizeExactName(canonicalName);

  if (exactA === exactB) {
    return {
      classification: "EXACT",
      score: 1,
      editSimilarity: 1,
      tokenSimilarity: 1,
    };
  }

  const looseA = normalizeLooseName(authoritativeName);
  const looseB = normalizeLooseName(canonicalName);

  if (looseA === looseB) {
    return {
      classification: "NORMALIZED",
      score: 0.99,
      editSimilarity: 1,
      tokenSimilarity: 1,
    };
  }

  const aliasA = canonicalAliasName(authoritativeName);
  const aliasB = canonicalAliasName(canonicalName);

  if (aliasA === aliasB) {
    return {
      classification: "ALIAS",
      score: 0.98,
      editSimilarity: editSimilarity(
        aliasA,
        aliasB
      ),
      tokenSimilarity: tokenSimilarity(
        aliasA,
        aliasB
      ),
    };
  }

  const edit = editSimilarity(
    looseA,
    looseB
  );

  const token = tokenSimilarity(
    looseA,
    looseB
  );

  const score =
    edit * 0.65 +
    token * 0.35;

  return {
    classification: "FUZZY_REVIEW",
    score,
    editSimilarity: edit,
    tokenSimilarity: token,
  };
}

/* ============================================================
   SAFE JSON
============================================================ */

function safeJsonStringify(
  value: unknown
): string {
  return JSON.stringify(
    value,
    (_key, currentValue) =>
      typeof currentValue === "bigint"
        ? currentValue.toString()
        : currentValue,
    2
  );
}

/* ============================================================
   CSV ESCAPE
============================================================ */

function csvEscape(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const text = String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  }

  return text;
}

/* ============================================================
   LOAD CANONICAL SOURCE
============================================================ */

function loadCanonicalSource(): CanonicalSubcounty[] {
  const raw = fs.readFileSync(
    SUBCOUNTIES_FILE,
    "utf8"
  );

  const parsed: unknown =
    JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return parsed as CanonicalSubcounty[];
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "value" in parsed
  ) {
    const wrapper =
      parsed as {
        value?: unknown;
      };

    if (Array.isArray(wrapper.value)) {
      return wrapper.value as CanonicalSubcounty[];
    }
  }

  throw new Error(
    "Unable to recognise subcounties.json structure."
  );
}

/* ============================================================
   LOAD GEOJSON
============================================================ */

function loadGeoJSON(): GeoFeature[] {
  const raw = fs.readFileSync(
    GEOJSON_FILE,
    "utf8"
  );

  const parsed =
    JSON.parse(raw) as GeoJSONFile;

  if (
    !Array.isArray(
      parsed.features
    )
  ) {
    throw new Error(
      "kenya-wards-1450.geojson does not contain a valid features array."
    );
  }

  return parsed.features;
}

/* ============================================================
   MAIN
============================================================ */

async function main() {
  console.log("");
  console.log(
    "============================================================"
  );
  console.log(
    "V13.2 CANONICAL SOURCE GAP / NAME RECONCILIATION AUDIT"
  );
  console.log(
    "READ-ONLY — NO DATABASE MODIFICATIONS"
  );
  console.log(
    "============================================================"
  );
  console.log("");

  const canonical =
    loadCanonicalSource();

  const geoFeatures =
    loadGeoJSON();

  console.log(
    `Canonical source records: ${canonical.length}`
  );

  console.log(
    `GeoJSON features: ${geoFeatures.length}`
  );

  console.log("");

  /* ==========================================================
     DATABASE
  ========================================================== */

  const counties =
    await prisma.county.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  const subcounties =
    await prisma.subCounty.findMany({
      select: {
        id: true,
        name: true,
        countyId: true,
        _count: {
          select: {
            wards: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

  const wards =
    await prisma.ward.findMany({
      select: {
        id: true,
        sourceGid: true,
        subCountyId: true,
        countyId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  console.log(
    `Database counties: ${counties.length}`
  );

  console.log(
    `Database subcounties: ${subcounties.length}`
  );

  console.log(
    `Database wards: ${wards.length}`
  );

  console.log("");

  /* ==========================================================
     COUNTY MAPS
  ========================================================== */

  const countyByNormalizedName =
    new Map<
      string,
      (typeof counties)[number]
    >();

  for (const county of counties) {
    const normalized =
      normalizeCountyName(
        county.name
      );

    const alias =
      canonicalCountyAlias(
        county.name
      );

    countyByNormalizedName.set(
      normalized,
      county
    );

    countyByNormalizedName.set(
      alias,
      county
    );
  }

  /* ==========================================================
     SUBCOUNTIES BY COUNTY
  ========================================================== */

  const subcountiesByCountyId =
    new Map<
      number,
      (typeof subcounties)[number][]
    >();

  for (const subcounty of subcounties) {
    const countyId =
      Number(subcounty.countyId);

    if (
      !subcountiesByCountyId.has(
        countyId
      )
    ) {
      subcountiesByCountyId.set(
        countyId,
        []
      );
    }

    subcountiesByCountyId
      .get(countyId)!
      .push(subcounty);
  }

  /* ==========================================================
     WARDS BY SUBCOUNTY
  ========================================================== */

  const wardsBySubcountyId =
    new Map<
      number,
      number[]
    >();

  for (const ward of wards) {
    if (
      ward.subCountyId === null ||
      ward.subCountyId === undefined
    ) {
      continue;
    }

    const subcountyId =
      Number(ward.subCountyId);

    if (
      !wardsBySubcountyId.has(
        subcountyId
      )
    ) {
      wardsBySubcountyId.set(
        subcountyId,
        []
      );
    }

    if (
      ward.sourceGid !== null &&
      ward.sourceGid !== undefined
    ) {
      wardsBySubcountyId
        .get(subcountyId)!
        .push(
          Number(ward.sourceGid)
        );
    }
  }

  /* ==========================================================
     AUTHORITATIVE GEOJSON GROUPS
  ========================================================== */

  type AuthoritativeGroup = {
    county: string;
    subcounty: string;
    gids: number[];
    scuid: string | null;
  };

  const authoritativeGroups =
    new Map<
      string,
      AuthoritativeGroup
    >();

  for (const feature of geoFeatures) {
    const properties =
      feature.properties;

    if (!properties) {
      continue;
    }

    const county =
      String(
        properties.county ?? ""
      ).trim();

    const subcounty =
      String(
        properties.subcounty ?? ""
      ).trim();

    const gid =
      Number(properties.gid);

    const scuid =
      properties.scuid === null ||
      properties.scuid === undefined
        ? null
        : String(properties.scuid);

    if (
      !county ||
      !subcounty ||
      !Number.isFinite(gid)
    ) {
      continue;
    }

    const key =
      `${canonicalCountyAlias(
        county
      )}|||${normalizeLooseName(
        subcounty
      )}`;

    if (
      !authoritativeGroups.has(
        key
      )
    ) {
      authoritativeGroups.set(
        key,
        {
          county,
          subcounty,
          gids: [],
          scuid,
        }
      );
    }

    authoritativeGroups
      .get(key)!
      .gids.push(gid);
  }

  /* ==========================================================
     FIND UNRESOLVED GROUPS
  ========================================================== */

  const unresolved: AuthoritativeGroup[] =
    [];

  for (const group of authoritativeGroups.values()) {
    const normalizedCounty =
      canonicalCountyAlias(
        group.county
      );

    const prismaCounty =
      countyByNormalizedName.get(
        normalizedCounty
      ) ?? null;

    if (!prismaCounty) {
      unresolved.push(group);
      continue;
    }

    const candidates =
      subcountiesByCountyId.get(
        Number(prismaCounty.id)
      ) ?? [];

    const authoritativeName =
      normalizeLooseName(
        group.subcounty
      );

    const exactCandidate =
      candidates.find(
        (candidate) =>
          normalizeLooseName(
            candidate.name
          ) ===
          authoritativeName
      );

    if (!exactCandidate) {
      unresolved.push(group);
    }
  }

  /* ==========================================================
     UNIQUE UNRESOLVED GROUPS
  ========================================================== */

  const unresolvedUnique =
    Array.from(
      new Map(
        unresolved.map(
          (item) => [
            `${canonicalCountyAlias(
              item.county
            )}|||${normalizeLooseName(
              item.subcounty
            )}`,
            item,
          ]
        )
      ).values()
    );

  console.log(
    `Unique unresolved authoritative subcounties: ${unresolvedUnique.length}`
  );

  console.log("");

  /* ==========================================================
     CANONICAL SOURCE BY COUNTY CODE
  ========================================================== */

  const canonicalByCountyCode =
    new Map<
      string,
      CanonicalSubcounty[]
    >();

  for (const record of canonical) {
    const countyCode =
      String(
        record.countyCode
      ).trim();

    if (
      !canonicalByCountyCode.has(
        countyCode
      )
    ) {
      canonicalByCountyCode.set(
        countyCode,
        []
      );
    }

    canonicalByCountyCode
      .get(countyCode)!
      .push(record);
  }

  /* ==========================================================
     RESULTS
  ========================================================== */

  const results: AuditRecord[] =
    [];

  let canonicalFound = 0;
  let countyAliasRequired = 0;
  let noCanonicalMatch = 0;

  for (const group of unresolvedUnique) {
    const countyInput =
      group.county;

    const normalizedCounty =
      canonicalCountyAlias(
        countyInput
      );

    const prismaCounty =
      countyByNormalizedName.get(
        normalizedCounty
      ) ?? null;

    const prismaCountyId =
      prismaCounty
        ? Number(prismaCounty.id)
        : null;

    let prismaCandidate:
      | (typeof subcounties)[number]
      | null = null;

    /* --------------------------------------------------------
       FIND PRISMA CANDIDATE
    -------------------------------------------------------- */

    if (prismaCounty) {
      const candidates =
        subcountiesByCountyId.get(
          Number(prismaCounty.id)
        ) ?? [];

      const authoritativeName =
        normalizeLooseName(
          group.subcounty
        );

      prismaCandidate =
        candidates.find(
          (candidate) =>
            normalizeLooseName(
              candidate.name
            ) ===
            authoritativeName
        ) ?? null;

      /*
       * If exact normalized matching fails,
       * identify the strongest Prisma candidate
       * for reporting only.
       */
      if (!prismaCandidate) {
        let bestScore = -1;

        for (const candidate of candidates) {
          const match =
            classifyMatch(
              group.subcounty,
              candidate.name
            );

          if (
            match.score >
            bestScore
          ) {
            bestScore =
              match.score;

            prismaCandidate =
              candidate;
          }
        }
      }
    }

    /* --------------------------------------------------------
       FIND CANONICAL SOURCE RECORDS
    -------------------------------------------------------- */

    let canonicalCandidatesForCounty:
      CanonicalSubcounty[] =
      [];

    if (
      prismaCounty &&
      prismaCounty.code !== null &&
      prismaCounty.code !== undefined
    ) {
      canonicalCandidatesForCounty =
        canonicalByCountyCode.get(
          String(
            prismaCounty.code
          )
        ) ?? [];
    }

    /* --------------------------------------------------------
       SCORE ALL CANONICAL COUNTY RECORDS
    -------------------------------------------------------- */

    const scoredCandidates:
      CanonicalCandidate[] =
      canonicalCandidatesForCounty.map(
        (record) => {
          const match =
            classifyMatch(
              group.subcounty,
              record.name
            );

          return {
            canonicalCode:
              String(record.code),

            canonicalCountyCode:
              String(
                record.countyCode
              ),

            canonicalName:
              record.name,

            headquarters:
              record.headquarters,

            classification:
              match.classification,

            score:
              match.score,

            editSimilarity:
              match.editSimilarity,

            tokenSimilarity:
              match.tokenSimilarity,
          };
        }
      );

    scoredCandidates.sort(
      (a, b) => {
        if (
          b.score !== a.score
        ) {
          return (
            b.score - a.score
          );
        }

        if (
          b.tokenSimilarity !==
          a.tokenSimilarity
        ) {
          return (
            b.tokenSimilarity -
            a.tokenSimilarity
          );
        }

        return (
          b.editSimilarity -
          a.editSimilarity
        );
      }
    );

    const best =
      scoredCandidates[0] ??
      null;

    const alternatives =
      scoredCandidates
        .slice(1, 6)
        .filter(
          (candidate) =>
            candidate.score >=
            0.35
        );

    /* --------------------------------------------------------
       CLASSIFICATION
    -------------------------------------------------------- */

    let classification:
      AuditClassification;

    let note: string;

    if (!prismaCounty) {
      classification =
        "COUNTY_ALIAS_REQUIRED";

      countyAliasRequired++;

      note =
        `Prisma county not found for "${countyInput}". ` +
        `County alias resolution is required.`;
    } else if (!best) {
      classification =
        "NO_CANONICAL_MATCH";

      noCanonicalMatch++;

      note =
        `No canonical subcounty candidate was found ` +
        `for Prisma county ${String(
          prismaCounty.code
        )}.`;
    } else {
      classification =
        "CANONICAL_FOUND";

      canonicalFound++;

      if (
        best.classification ===
        "FUZZY_REVIEW"
      ) {
        note =
          `Potential canonical source match requires manual review. ` +
          `Score=${best.score.toFixed(
            3
          )}.`;
      } else {
        note =
          `Canonical source match identified as ` +
          `${best.classification}.`;
      }
    }

    const wardGids =
      [...group.gids].sort(
        (a, b) => a - b
      );

    results.push({
      county:
        countyInput,

      normalizedCounty,

      prismaCountyId,

      authoritativeSubcounty:
        group.subcounty,

      normalizedAuthoritativeSubcounty:
        normalizeLooseName(
          group.subcounty
        ),

      prismaSubcountyId:
        prismaCandidate
          ? Number(
              prismaCandidate.id
            )
          : null,

      prismaSubcountyName:
        prismaCandidate
          ? prismaCandidate.name
          : null,

      wardCount:
        wardGids.length,

      wardGids,

      classification,

      bestMatch:
        best,

      alternativeMatches:
        alternatives,

      note,
    });
  }

  /* ==========================================================
     SORT RESULTS
  ========================================================== */

  results.sort(
    (a, b) => {
      const countyCompare =
        a.county.localeCompare(
          b.county
        );

      if (
        countyCompare !== 0
      ) {
        return countyCompare;
      }

      return a.authoritativeSubcounty.localeCompare(
        b.authoritativeSubcounty
      );
    }
  );

  /* ==========================================================
     SUMMARY
  ========================================================== */

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "V13.2 RESULT SUMMARY"
  );

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    `Canonical source candidates found: ${canonicalFound}`
  );

  console.log(
    `County alias required: ${countyAliasRequired}`
  );

  console.log(
    `No canonical source candidate: ${noCanonicalMatch}`
  );

  console.log("");

  /* ==========================================================
     DETAILED OUTPUT
  ========================================================== */

  for (const result of results) {
    console.log(
      `${result.county} | ${result.authoritativeSubcounty}`
    );

    console.log(
      `  Prisma: ${
        result.prismaSubcountyId ??
        "NONE"
      } | ${
        result.prismaSubcountyName ??
        "NONE"
      }`
    );

    console.log(
      `  Wards: ${result.wardCount}`
    );

    console.log(
      `  Classification: ${result.classification}`
    );

    if (result.bestMatch) {
      console.log(
        `  BEST CANONICAL: ${result.bestMatch.canonicalName}`
      );

      console.log(
        `  Canonical code: ${result.bestMatch.canonicalCode}`
      );

      console.log(
        `  County code: ${result.bestMatch.canonicalCountyCode}`
      );

      console.log(
        `  Match type: ${result.bestMatch.classification}`
      );

      console.log(
        `  Score: ${result.bestMatch.score.toFixed(
          3
        )}`
      );

      console.log(
        `  Edit similarity: ${result.bestMatch.editSimilarity.toFixed(
          3
        )}`
      );

      console.log(
        `  Token similarity: ${result.bestMatch.tokenSimilarity.toFixed(
          3
        )}`
      );
    }

    if (
      result.alternativeMatches.length >
      0
    ) {
      console.log(
        "  Alternatives:"
      );

      for (
        const alternative of result.alternativeMatches
      ) {
        console.log(
          `    - ${alternative.canonicalName} ` +
          `(code ${alternative.canonicalCode}, ` +
          `score ${alternative.score.toFixed(
            3
          )})`
        );
      }
    }

    console.log(
      `  Ward GIDs: ${result.wardGids.join(
        ", "
      )}`
    );

    console.log(
      `  Note: ${result.note}`
    );

    console.log("");
  }

  /* ==========================================================
     CSV
  ========================================================== */

  const csvRows: string[] =
    [];

  csvRows.push(
    [
      "county",
      "normalizedCounty",
      "prismaCountyId",
      "authoritativeSubcounty",
      "normalizedAuthoritativeSubcounty",
      "prismaSubcountyId",
      "prismaSubcountyName",
      "wardCount",
      "wardGids",
      "classification",
      "bestCanonicalCode",
      "bestCanonicalCountyCode",
      "bestCanonicalName",
      "bestClassification",
      "bestScore",
      "editSimilarity",
      "tokenSimilarity",
      "alternative1",
      "alternative2",
      "alternative3",
      "alternative4",
      "alternative5",
      "note",
    ].join(",")
  );

  for (
    const result of results
  ) {
    const alternatives =
      result.alternativeMatches;

    csvRows.push(
      [
        result.county,
        result.normalizedCounty,
        result.prismaCountyId,
        result.authoritativeSubcounty,
        result.normalizedAuthoritativeSubcounty,
        result.prismaSubcountyId,
        result.prismaSubcountyName,
        result.wardCount,
        result.wardGids.join("|"),
        result.classification,
        result.bestMatch
          ?.canonicalCode ??
          "",
        result.bestMatch
          ?.canonicalCountyCode ??
          "",
        result.bestMatch
          ?.canonicalName ??
          "",
        result.bestMatch
          ?.classification ??
          "",
        result.bestMatch
          ? result.bestMatch.score.toFixed(
              6
            )
          : "",
        result.bestMatch
          ? result.bestMatch.editSimilarity.toFixed(
              6
            )
          : "",
        result.bestMatch
          ? result.bestMatch.tokenSimilarity.toFixed(
              6
            )
          : "",
        alternatives[0]
          ?.canonicalName ??
          "",
        alternatives[1]
          ?.canonicalName ??
          "",
        alternatives[2]
          ?.canonicalName ??
          "",
        alternatives[3]
          ?.canonicalName ??
          "",
        alternatives[4]
          ?.canonicalName ??
          "",
        result.note,
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  fs.writeFileSync(
    OUTPUT_CSV,
    csvRows.join("\n"),
    "utf8"
  );

  /* ==========================================================
     JSON
  ========================================================== */

  const output = {
    audit: "V13.2",

    description:
      "Read-only canonical source gap and name reconciliation audit.",

    readOnly: true,

    sourceFiles: {
      canonicalSubcounties:
        path.relative(
          ROOT,
          SUBCOUNTIES_FILE
        ),

      authoritativeGeoJSON:
        path.relative(
          ROOT,
          GEOJSON_FILE
        ),
    },

    counts: {
      canonicalSourceRecords:
        canonical.length,

      geojsonFeatures:
        geoFeatures.length,

      databaseCounties:
        counties.length,

      databaseSubcounties:
        subcounties.length,

      databaseWards:
        wards.length,

      unresolvedAuthoritativeSubcounties:
        unresolvedUnique.length,

      canonicalFound,

      countyAliasRequired,

      noCanonicalMatch,
    },

    results,
  };

  fs.writeFileSync(
    OUTPUT_JSON,
    safeJsonStringify(output),
    "utf8"
  );

  /* ==========================================================
     FINAL
  ========================================================== */

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "OUTPUT FILES"
  );

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    `JSON: ${path.relative(
      ROOT,
      OUTPUT_JSON
    )}`
  );

  console.log(
    `CSV:  ${path.relative(
      ROOT,
      OUTPUT_CSV
    )}`
  );

  console.log("");

  console.log(
    "V13.2 COMPLETE."
  );

  console.log(
    "READ-ONLY — NO DATABASE MODIFICATIONS."
  );

  console.log("");
}

/* ============================================================
   EXECUTION
============================================================ */

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V13.2 FAILED"
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );
