import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const ROOT = process.cwd();

const CANONICAL_SOURCE = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounties.json",
);

const GEOJSON_SOURCE = path.join(
  ROOT,
  "prisma",
  "data",
  "kenya-wards-1450.geojson",
);

const JSON_OUTPUT = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounty-unresolved-v13-1.json",
);

const CSV_OUTPUT = path.join(
  ROOT,
  "prisma",
  "data",
  "subcounty-unresolved-v13-1.csv",
);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

/* ============================================================
   TYPES
============================================================ */

type CanonicalSubCounty = {
  code?: string | number | null;
  countyCode?: string | number | null;
  name?: string | null;
  headquarters?: string | null;
};

type GeoJsonProperties = {
  gid?: string | number | null;
  pop2009?: string | number | null;
  county?: string | null;
  subcounty?: string | null;
  ward?: string | null;
  uid?: string | null;
  scuid?: string | null;
  cuid?: string | null;
};

type GeoJsonFeature = {
  type?: string;
  properties?: GeoJsonProperties | null;
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

type CandidateMatch = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
  exactName: boolean;
  looseName: boolean;
  aliasName: boolean;
};

type DiagnosticRecord = {
  authoritativeCounty: string;
  authoritativeSubCounty: string;

  countyId: number | null;
  countyName: string | null;

  canonicalFound: boolean;
  canonicalCode: string | null;
  canonicalCountyCode: string | null;
  canonicalName: string | null;
  canonicalHeadquarters: string | null;

  prismaCandidates: CandidateMatch[];

  selectedCandidateId: number | null;
  selectedCandidateName: string | null;

  resolutionStatus:
    | "RESOLVED"
    | "CANONICAL_NOT_FOUND"
    | "COUNTY_NOT_FOUND"
    | "NO_PRISMA_CANDIDATE"
    | "MULTIPLE_PRISMA_CANDIDATES";

  resolutionReason: string;

  geoJsonWardCount: number;
  geoJsonGids: number[];
};

/* ============================================================
   COUNTY CODE MAP
============================================================ */

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
  "047": "Nairobi",
};

const COUNTY_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTY_CODE_TO_NAME).map(([code, name]) => [
    name,
    code,
  ]),
);

/* ============================================================
   COUNTY ALIASES
============================================================ */

const COUNTY_ALIASES: Record<string, string> = {
  "muranga": "Murang'a",
  "muranga county": "Murang'a",

  "nairobi": "Nairobi",
  "nairobi city": "Nairobi",

  "tharaka nithi": "Tharaka Nithi",
  "tharaka-nithi": "Tharaka Nithi",
  "tharaka nithi county": "Tharaka Nithi",

  "elgeyo marakwet": "Elgeyo Marakwet",
  "elgeyo-marakwet": "Elgeyo Marakwet",

  "taita taveta": "Taita Taveta",
  "taita-taveta": "Taita Taveta",

  "trans nzoia": "Trans Nzoia",
  "trans-nzoia": "Trans Nzoia",

  "uasin gishu": "Uasin Gishu",
  "uasin-gishu": "Uasin Gishu",

  "west pokot": "West Pokot",
  "west-pokot": "West Pokot",

  "tana river": "Tana River",
  "tana-river": "Tana River",

  "homa bay": "Homa Bay",
  "homa-bay": "Homa Bay",

  "nyamira": "Nyamira",
  "nyamira county": "Nyamira",
};

/* ============================================================
   SUBCOUNTY ALIASES
============================================================ */

const SUBCOUNTY_ALIASES: Record<string, string> = {
  "tiaty sub county": "Tiaty East",
  "tiaty": "Tiaty East",

  "transmara east": "Trans Mara East",
  "trans mara east": "Trans Mara East",

  "transmara west": "Trans Mara West",
  "trans mara west": "Trans Mara West",

  "muranga south": "Murang'a South",
  "muranga east": "Murang'a East",

  "mukurewini": "Mukurwe-ini",

  "mandera west": "Mandera West",
  "mandera east": "Mandera East",
  "mandera north": "Mandera North",

  "ainabkoi": "Ainabkoi",
  "kesses": "Kesses",

  "banisa": "Banisa",
  "lafey": "Lafey",

  "bomachoge borabu": "Bomachoge Borabu",
  "bomachoge chache": "Bomachoge Chache",

  "nyaribari masaba": "Nyaribari Masaba",
  "nyaribari chache": "Nyaribari Chache",

  "kitutu chache north": "Kitutu Chache North",
  "kitutu chache south": "Kitutu Chache South",

  "kiambu town": "Kiambu Town",
  "thika town": "Thika Town",

  "embakasi north": "Embakasi North",
  "embakasi south": "Embakasi South",
  "embakasi east": "Embakasi East",
  "embakasi west": "Embakasi West",
  "embakasi central": "Embakasi Central",

  "dagoretti north": "Dagoretti North",
  "dagoretti south": "Dagoretti South",

  "homa bay town": "Homa Bay Town",

  "kandara": "Kandara",
  "githunguri": "Githunguri",
  "kiambaa": "Kiambaa",
  "kabete": "Kabete",
  "kikuyu": "Kikuyu",
  "limuru": "Limuru",
  "lari": "Lari",
  "gatundu south": "Gatundu South",
  "gatundu north": "Gatundu North",
  "juja": "Juja",
  "ruiru": "Ruiru",

  "kanyenya-ini": "Kangema",
};

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeBaseName(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLooseName(value: unknown): string {
  let valueNormalized = normalizeBaseName(value);

  valueNormalized = valueNormalized
    .replace(/\bsub\s+county\b/g, " ")
    .replace(/\bsubcounty\b/g, " ")
    .replace(/\bsub\s+county\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return valueNormalized;
}

function normalizeExactName(value: unknown): string {
  return normalizeBaseName(value);
}

function canonicalCountyName(value: unknown): string {
  const loose = normalizeBaseName(value);

  if (COUNTY_ALIASES[loose]) {
    return COUNTY_ALIASES[loose];
  }

  for (const officialName of Object.values(COUNTY_CODE_TO_NAME)) {
    if (normalizeBaseName(officialName) === loose) {
      return officialName;
    }
  }

  return String(value ?? "").trim();
}

function canonicalSubCountyName(value: unknown): string {
  const loose = normalizeLooseName(value);

  if (SUBCOUNTY_ALIASES[loose]) {
    return SUBCOUNTY_ALIASES[loose];
  }

  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

/* ============================================================
   FILE LOADERS
============================================================ */

function loadJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function loadCanonicalSource(): CanonicalSubCounty[] {
  const parsed = loadJsonFile(CANONICAL_SOURCE);

  if (Array.isArray(parsed)) {
    return parsed as CanonicalSubCounty[];
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as any).value)
  ) {
    return (parsed as any).value as CanonicalSubCounty[];
  }

  throw new Error(
    `Unsupported canonical source structure: ${CANONICAL_SOURCE}`,
  );
}

function loadGeoJson(): GeoJsonFeature[] {
  const parsed = loadJsonFile(GEOJSON_SOURCE) as GeoJsonCollection;

  if (!parsed || !Array.isArray(parsed.features)) {
    throw new Error(
      `Invalid GeoJSON structure: ${GEOJSON_SOURCE}`,
    );
  }

  return parsed.features;
}

/* ============================================================
   HELPERS
============================================================ */

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n) ? n : null;
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
    (_, current) =>
      typeof current === "bigint"
        ? current.toString()
        : current,
    2,
  );
}

/* ============================================================
   CANONICAL INDEXES
============================================================ */

type CanonicalIndex = {
  records: CanonicalSubCounty[];

  byCountyCodeExact: Map<string, CanonicalSubCounty[]>;
  byCountyCodeLoose: Map<string, CanonicalSubCounty[]>;
  byCountyNameExact: Map<string, CanonicalSubCounty[]>;
  byCountyNameLoose: Map<string, CanonicalSubCounty[]>;
};

function addToMap(
  map: Map<string, CanonicalSubCounty[]>,
  key: string,
  record: CanonicalSubCounty,
) {
  if (!key) {
    return;
  }

  const existing = map.get(key);

  if (existing) {
    existing.push(record);
  } else {
    map.set(key, [record]);
  }
}

function buildCanonicalIndex(
  records: CanonicalSubCounty[],
): CanonicalIndex {
  const index: CanonicalIndex = {
    records,
    byCountyCodeExact: new Map(),
    byCountyCodeLoose: new Map(),
    byCountyNameExact: new Map(),
    byCountyNameLoose: new Map(),
  };

  for (const record of records) {
    const countyCode = String(record.countyCode ?? "").trim();

    const rawName = String(record.name ?? "");

    const exactName = normalizeExactName(rawName);
    const looseName = normalizeLooseName(rawName);

    if (countyCode && exactName) {
      addToMap(
        index.byCountyCodeExact,
        `${countyCode}|${exactName}`,
        record,
      );
    }

    if (countyCode && looseName) {
      addToMap(
        index.byCountyCodeLoose,
        `${countyCode}|${looseName}`,
        record,
      );
    }

    const countyName =
      COUNTY_CODE_TO_NAME[countyCode] ?? "";

    if (countyName && exactName) {
      addToMap(
        index.byCountyNameExact,
        `${normalizeLooseName(countyName)}|${exactName}`,
        record,
      );
    }

    if (countyName && looseName) {
      addToMap(
        index.byCountyNameLoose,
        `${normalizeLooseName(countyName)}|${looseName}`,
        record,
      );
    }
  }

  return index;
}

/* ============================================================
   FIND CANONICAL RECORD
============================================================ */

function findCanonicalRecord(
  countyName: string,
  subCountyName: string,
  index: CanonicalIndex,
): {
  record: CanonicalSubCounty | null;
  reason: string;
} {
  const canonicalCounty =
    canonicalCountyName(countyName);

  const countyCode =
    COUNTY_NAME_TO_CODE[canonicalCounty];

  const exactSubCounty =
    normalizeExactName(subCountyName);

  const looseSubCounty =
    normalizeLooseName(subCountyName);

  if (countyCode && exactSubCounty) {
    const exact =
      index.byCountyCodeExact.get(
        `${countyCode}|${exactSubCounty}`,
      ) ?? [];

    if (exact.length === 1) {
      return {
        record: exact[0],
        reason: "COUNTY_CODE + EXACT_NAME",
      };
    }

    if (exact.length > 1) {
      return {
        record: null,
        reason: `COUNTY_CODE + EXACT_NAME produced ${exact.length} records`,
      };
    }
  }

  if (countyCode && looseSubCounty) {
    const loose =
      index.byCountyCodeLoose.get(
        `${countyCode}|${looseSubCounty}`,
      ) ?? [];

    if (loose.length === 1) {
      return {
        record: loose[0],
        reason: "COUNTY_CODE + LOOSE_NAME",
      };
    }

    if (loose.length > 1) {
      return {
        record: null,
        reason: `COUNTY_CODE + LOOSE_NAME produced ${loose.length} records`,
      };
    }
  }

  if (exactSubCounty) {
    const countyExact =
      index.byCountyNameExact.get(
        `${normalizeLooseName(canonicalCounty)}|${exactSubCounty}`,
      ) ?? [];

    if (countyExact.length === 1) {
      return {
        record: countyExact[0],
        reason: "COUNTY_NAME + EXACT_NAME",
      };
    }

    if (countyExact.length > 1) {
      return {
        record: null,
        reason: `COUNTY_NAME + EXACT_NAME produced ${countyExact.length} records`,
      };
    }
  }

  if (looseSubCounty) {
    const countyLoose =
      index.byCountyNameLoose.get(
        `${normalizeLooseName(canonicalCounty)}|${looseSubCounty}`,
      ) ?? [];

    if (countyLoose.length === 1) {
      return {
        record: countyLoose[0],
        reason: "COUNTY_NAME + LOOSE_NAME",
      };
    }

    if (countyLoose.length > 1) {
      return {
        record: null,
        reason: `COUNTY_NAME + LOOSE_NAME produced ${countyLoose.length} records`,
      };
    }
  }

  const aliasTarget =
    SUBCOUNTY_ALIASES[looseSubCounty];

  if (aliasTarget) {
    const aliasLoose =
      normalizeLooseName(aliasTarget);

    if (countyCode) {
      const aliasMatches =
        index.byCountyCodeLoose.get(
          `${countyCode}|${aliasLoose}`,
        ) ?? [];

      if (aliasMatches.length === 1) {
        return {
          record: aliasMatches[0],
          reason: "COUNTY_CODE + SUBCOUNTY_ALIAS",
        };
      }

      if (aliasMatches.length > 1) {
        return {
          record: null,
          reason: `COUNTY_CODE + SUBCOUNTY_ALIAS produced ${aliasMatches.length} records`,
        };
      }
    }

    const aliasCountyMatches =
      index.byCountyNameLoose.get(
        `${normalizeLooseName(canonicalCounty)}|${aliasLoose}`,
      ) ?? [];

    if (aliasCountyMatches.length === 1) {
      return {
        record: aliasCountyMatches[0],
        reason: "COUNTY_NAME + SUBCOUNTY_ALIAS",
      };
    }

    if (aliasCountyMatches.length > 1) {
      return {
        record: null,
        reason: `COUNTY_NAME + SUBCOUNTY_ALIAS produced ${aliasCountyMatches.length} records`,
      };
    }
  }

  return {
    record: null,
    reason: "NO_CANONICAL_SOURCE_MATCH",
  };
}

/* ============================================================
   MAIN
============================================================ */

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("V13.1 UNRESOLVED SUBCOUNTY TARGET AUDIT");
  console.log("READ-ONLY — NO DATABASE MODIFICATIONS");
  console.log("============================================================");
  console.log("");

  const canonicalRecords =
    loadCanonicalSource();

  const geoJsonFeatures =
    loadGeoJson();

  console.log(
    `Canonical source records: ${canonicalRecords.length}`,
  );

  console.log(
    `GeoJSON features: ${geoJsonFeatures.length}`,
  );

  console.log("");

  const canonicalIndex =
    buildCanonicalIndex(canonicalRecords);

  /* ----------------------------------------------------------
     DATABASE
  ---------------------------------------------------------- */

  const counties =
    (await prisma.county.findMany({
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

  console.log(
    `Database counties: ${counties.length}`,
  );

  console.log(
    `Database subcounties: ${subcounties.length}`,
  );

  console.log("");

  const countyById =
    new Map<number, CountyRow>();

  for (const county of counties) {
    countyById.set(county.id, county);
  }

  /* ----------------------------------------------------------
     COUNTY INDEX
  ---------------------------------------------------------- */

  const countyByLooseName =
    new Map<string, CountyRow[]>();

  for (const county of counties) {
    const key =
      normalizeLooseName(county.name);

    const list =
      countyByLooseName.get(key) ?? [];

    list.push(county);

    countyByLooseName.set(key, list);
  }

  /* ----------------------------------------------------------
     SUBCOUNTY INDEXES
  ---------------------------------------------------------- */

  const subcountiesByCounty =
    new Map<number, SubCountyRow[]>();

  const subcountyExactByCounty =
    new Map<string, SubCountyRow[]>();

  const subcountyLooseByCounty =
    new Map<string, SubCountyRow[]>();

  for (const subcounty of subcounties) {
    const list =
      subcountiesByCounty.get(
        subcounty.countyId,
      ) ?? [];

    list.push(subcounty);

    subcountiesByCounty.set(
      subcounty.countyId,
      list,
    );

    const exactKey =
      `${subcounty.countyId}|${normalizeExactName(subcounty.name)}`;

    const exactList =
      subcountyExactByCounty.get(exactKey) ?? [];

    exactList.push(subcounty);

    subcountyExactByCounty.set(
      exactKey,
      exactList,
    );

    const looseKey =
      `${subcounty.countyId}|${normalizeLooseName(subcounty.name)}`;

    const looseList =
      subcountyLooseByCounty.get(looseKey) ?? [];

    looseList.push(subcounty);

    subcountyLooseByCounty.set(
      looseKey,
      looseList,
    );
  }

  /* ----------------------------------------------------------
     COLLECT ONLY UNRESOLVED AUTHORITATIVE SUBCOUNTIES
  ---------------------------------------------------------- */

  type WardGroup = {
    county: string;
    subcounty: string;
    gids: number[];
  };

  const unresolvedGroups =
    new Map<string, WardGroup>();

  for (const feature of geoJsonFeatures) {
    const props =
      feature.properties ?? {};

    const county =
      String(props.county ?? "").trim();

    const subcounty =
      String(props.subcounty ?? "").trim();

    const gid =
      toNumber(props.gid);

    if (!county || !subcounty || gid === null) {
      continue;
    }

    const canonical =
      findCanonicalRecord(
        county,
        subcounty,
        canonicalIndex,
      );

    if (canonical.record) {
      continue;
    }

    const key =
      `${canonicalCountyName(county)}|${normalizeLooseName(subcounty)}`;

    const existing =
      unresolvedGroups.get(key);

    if (existing) {
      existing.gids.push(gid);
    } else {
      unresolvedGroups.set(key, {
        county,
        subcounty,
        gids: [gid],
      });
    }
  }

  console.log(
    `Unique unresolved authoritative subcounties: ${unresolvedGroups.size}`,
  );

  console.log("");

  /* ----------------------------------------------------------
     DIAGNOSTIC ANALYSIS
  ---------------------------------------------------------- */

  const diagnostics: DiagnosticRecord[] = [];

  for (const group of unresolvedGroups.values()) {
    const authoritativeCounty =
      group.county;

    const authoritativeSubCounty =
      group.subcounty;

    const canonicalCounty =
      canonicalCountyName(
        authoritativeCounty,
      );

    const countyCandidates =
      countyByLooseName.get(
        normalizeLooseName(canonicalCounty),
      ) ?? [];

    let countyId: number | null = null;
    let countyName: string | null = null;

    if (countyCandidates.length === 1) {
      countyId =
        countyCandidates[0].id;

      countyName =
        countyCandidates[0].name;
    }

    /* --------------------------------------------------------
       CANONICAL SOURCE
    -------------------------------------------------------- */

    const canonicalResult =
      findCanonicalRecord(
        authoritativeCounty,
        authoritativeSubCounty,
        canonicalIndex,
      );

    const canonical =
      canonicalResult.record;

    /* --------------------------------------------------------
       PRISMA CANDIDATES
    -------------------------------------------------------- */

    const prismaCandidates: CandidateMatch[] = [];

    if (countyId !== null) {
      const countySubcounties =
        subcountiesByCounty.get(
          countyId,
        ) ?? [];

      const requestedExact =
        normalizeExactName(
          authoritativeSubCounty,
        );

      const requestedLoose =
        normalizeLooseName(
          authoritativeSubCounty,
        );

      const canonicalAlias =
        SUBCOUNTY_ALIASES[
          requestedLoose
        ];

      const aliasNormalized =
        canonicalAlias
          ? normalizeLooseName(
              canonicalAlias,
            )
          : "";

      for (const candidate of countySubcounties) {
        const candidateExact =
          normalizeExactName(
            candidate.name,
          );

        const candidateLoose =
          normalizeLooseName(
            candidate.name,
          );

        const exactName =
          candidateExact === requestedExact;

        const looseName =
          candidateLoose === requestedLoose;

        const aliasName =
          Boolean(
            aliasNormalized &&
            candidateLoose === aliasNormalized,
          );

        if (
          exactName ||
          looseName ||
          aliasName
        ) {
          prismaCandidates.push({
            id: candidate.id,
            name: candidate.name,
            countyId: candidate.countyId,
            countyName:
              countyById.get(
                candidate.countyId,
              )?.name ?? "",
            exactName,
            looseName,
            aliasName,
          });
        }
      }
    }

    let selectedCandidateId:
      number | null = null;

    let selectedCandidateName:
      string | null = null;

    let resolutionStatus:
      | "RESOLVED"
      | "CANONICAL_NOT_FOUND"
      | "COUNTY_NOT_FOUND"
      | "NO_PRISMA_CANDIDATE"
      | "MULTIPLE_PRISMA_CANDIDATES";

    let resolutionReason: string;

    if (countyCandidates.length === 0) {
      resolutionStatus =
        "COUNTY_NOT_FOUND";

      resolutionReason =
        `No Prisma County matched "${canonicalCounty}".`;
    } else if (
      countyCandidates.length > 1
    ) {
      resolutionStatus =
        "COUNTY_NOT_FOUND";

      resolutionReason =
        `Multiple Prisma Counties matched "${canonicalCounty}": ${countyCandidates
          .map((x) => `${x.id}:${x.name}`)
          .join(", ")}`;
    } else if (
      canonical &&
      prismaCandidates.length === 1
    ) {
      resolutionStatus =
        "RESOLVED";

      selectedCandidateId =
        prismaCandidates[0].id;

      selectedCandidateName =
        prismaCandidates[0].name;

      resolutionReason =
        `Prisma candidate matched canonical source "${canonical.name}".`;
    } else if (
      prismaCandidates.length > 1
    ) {
      resolutionStatus =
        "MULTIPLE_PRISMA_CANDIDATES";

      resolutionReason =
        `Multiple Prisma SubCounty candidates matched the authoritative name: ${prismaCandidates
          .map((x) => `${x.id}:${x.name}`)
          .join(", ")}`;
    } else if (
      !canonical
    ) {
      resolutionStatus =
        "CANONICAL_NOT_FOUND";

      resolutionReason =
        `No matching record was found in subcounties.json. Matching attempt: ${canonicalResult.reason}`;
    } else {
      resolutionStatus =
        "NO_PRISMA_CANDIDATE";

      resolutionReason =
        `Canonical source "${canonical.name}" was found, but no Prisma SubCounty matched it inside county ${countyId}.`;
    }

    diagnostics.push({
      authoritativeCounty,
      authoritativeSubCounty,

      countyId,
      countyName,

      canonicalFound:
        Boolean(canonical),

      canonicalCode:
        canonical
          ? String(
              canonical.code ?? "",
            )
          : null,

      canonicalCountyCode:
        canonical
          ? String(
              canonical.countyCode ?? "",
            )
          : null,

      canonicalName:
        canonical?.name ?? null,

      canonicalHeadquarters:
        canonical?.headquarters ?? null,

      prismaCandidates,

      selectedCandidateId,

      selectedCandidateName,

      resolutionStatus,

      resolutionReason,

      geoJsonWardCount:
        group.gids.length,

      geoJsonGids:
        [...group.gids].sort(
          (a, b) => a - b,
        ),
    });
  }

  diagnostics.sort((a, b) => {
    if (
      a.authoritativeCounty !==
      b.authoritativeCounty
    ) {
      return a.authoritativeCounty.localeCompare(
        b.authoritativeCounty,
      );
    }

    return a.authoritativeSubCounty.localeCompare(
      b.authoritativeSubCounty,
    );
  });

  /* ----------------------------------------------------------
     SUMMARY
  ---------------------------------------------------------- */

  const statusCounts = {
    RESOLVED: 0,
    CANONICAL_NOT_FOUND: 0,
    COUNTY_NOT_FOUND: 0,
    NO_PRISMA_CANDIDATE: 0,
    MULTIPLE_PRISMA_CANDIDATES: 0,
  };

  for (const record of diagnostics) {
    statusCounts[
      record.resolutionStatus
    ]++;
  }

  console.log(
    "------------------------------------------------------------",
  );

  console.log(
    `Resolved after V13.1 analysis: ${statusCounts.RESOLVED}`,
  );

  console.log(
    `Canonical source not found: ${statusCounts.CANONICAL_NOT_FOUND}`,
  );

  console.log(
    `County not found/ambiguous: ${statusCounts.COUNTY_NOT_FOUND}`,
  );

  console.log(
    `No Prisma candidate: ${statusCounts.NO_PRISMA_CANDIDATE}`,
  );

  console.log(
    `Multiple Prisma candidates: ${statusCounts.MULTIPLE_PRISMA_CANDIDATES}`,
  );

  console.log(
    "------------------------------------------------------------",
  );

  /* ----------------------------------------------------------
     PRINT DETAILED RESULTS
  ---------------------------------------------------------- */

  console.log("");

  console.log(
    "DETAILED UNRESOLVED SUBCOUNTY ANALYSIS",
  );

  console.log("");

  let counter = 1;

  for (const record of diagnostics) {
    console.log(
      `#${counter} ${record.authoritativeCounty} | ${record.authoritativeSubCounty}`,
    );

    console.log(
      `  Wards: ${record.geoJsonWardCount}`,
    );

    console.log(
      `  GIDs: ${record.geoJsonGids.join(", ")}`,
    );

    console.log(
      `  Prisma county: ${
        record.countyId !== null
          ? `${record.countyId} | ${record.countyName}`
          : "NONE"
      }`,
    );

    console.log(
      `  Canonical source: ${
        record.canonicalFound
          ? `${record.canonicalName} | code=${record.canonicalCode} | countyCode=${record.canonicalCountyCode}`
          : "NONE"
      }`,
    );

    console.log(
      `  Status: ${record.resolutionStatus}`,
    );

    console.log(
      `  Reason: ${record.resolutionReason}`,
    );

    if (
      record.prismaCandidates.length > 0
    ) {
      console.log(
        "  Prisma candidates:",
      );

      for (const candidate of record.prismaCandidates) {
        const methods: string[] = [];

        if (candidate.exactName) {
          methods.push("EXACT");
        }

        if (candidate.looseName) {
          methods.push("LOOSE");
        }

        if (candidate.aliasName) {
          methods.push("ALIAS");
        }

        console.log(
          `    ${candidate.id} | ${candidate.name} | ${methods.join("+")}`,
        );
      }
    } else {
      console.log(
        "  Prisma candidates: NONE",
      );
    }

    console.log("");

    counter++;
  }

  /* ----------------------------------------------------------
     WRITE JSON
  ---------------------------------------------------------- */

  const report = {
    audit: "V13.1",
    mode: "READ_ONLY",
    generatedAt: new Date().toISOString(),

    sourceFiles: {
      canonical: CANONICAL_SOURCE,
      geojson: GEOJSON_SOURCE,
    },

    counts: {
      canonicalSourceRecords:
        canonicalRecords.length,

      geoJsonFeatures:
        geoJsonFeatures.length,

      databaseCounties:
        counties.length,

      databaseSubcounties:
        subcounties.length,

      uniqueUnresolvedAuthoritativeSubcounties:
        diagnostics.length,

      resolved:
        statusCounts.RESOLVED,

      canonicalNotFound:
        statusCounts.CANONICAL_NOT_FOUND,

      countyNotFound:
        statusCounts.COUNTY_NOT_FOUND,

      noPrismaCandidate:
        statusCounts.NO_PRISMA_CANDIDATE,

      multiplePrismaCandidates:
        statusCounts.MULTIPLE_PRISMA_CANDIDATES,
    },

    diagnostics,
  };

  fs.writeFileSync(
    JSON_OUTPUT,
    safeJsonStringify(report),
    "utf8",
  );

  /* ----------------------------------------------------------
     WRITE CSV
  ---------------------------------------------------------- */

  const csvHeader = [
    "authoritativeCounty",
    "authoritativeSubCounty",
    "countyId",
    "countyName",
    "canonicalFound",
    "canonicalCode",
    "canonicalCountyCode",
    "canonicalName",
    "canonicalHeadquarters",
    "selectedCandidateId",
    "selectedCandidateName",
    "resolutionStatus",
    "resolutionReason",
    "geoJsonWardCount",
    "geoJsonGids",
    "prismaCandidates",
  ];

  const csvRows = [
    csvHeader.join(","),
  ];

  for (const record of diagnostics) {
    csvRows.push(
      [
        record.authoritativeCounty,
        record.authoritativeSubCounty,
        record.countyId,
        record.countyName,
        record.canonicalFound,
        record.canonicalCode,
        record.canonicalCountyCode,
        record.canonicalName,
        record.canonicalHeadquarters,
        record.selectedCandidateId,
        record.selectedCandidateName,
        record.resolutionStatus,
        record.resolutionReason,
        record.geoJsonWardCount,
        record.geoJsonGids.join(";"),
        record.prismaCandidates
          .map(
            (candidate) =>
              `${candidate.id}:${candidate.name}`,
          )
          .join(";"),
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  fs.writeFileSync(
    CSV_OUTPUT,
    csvRows.join("\n"),
    "utf8",
  );

  console.log("");
  console.log(
    `JSON report written to: ${JSON_OUTPUT}`,
  );

  console.log(
    `CSV report written to: ${CSV_OUTPUT}`,
  );

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "V13.1 COMPLETED",
  );
  console.log(
    "NO DATABASE CHANGES WERE MADE.",
  );
  console.log(
    "============================================================",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V13.1 FAILED",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });