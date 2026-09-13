
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// =======================================================
// CONFIGURATION
// =======================================================

const GEOJSON_FILE = path.resolve(
  process.cwd(),
  "prisma/data/kenya-wards-1450.geojson"
);

const OUTPUT_FILE = path.resolve(
  process.cwd(),
  "prisma/data/subcounty-ward-map.json"
);

const UNMATCHED_FILE = path.resolve(
  process.cwd(),
  "prisma/data/unmatched-subcounties.json"
);

const REVIEW_FILE = path.resolve(
  process.cwd(),
  "prisma/data/subcounty-matching-review.json"
);

const EXPECTED_WARD_COUNT = 1450;

// =======================================================
// PRISMA
// =======================================================

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Check your .env file."
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

// =======================================================
// TYPES
// =======================================================

type GeoJsonWardProperties = {
  gid?: number;
  pop2009?: number;

  county?: string;
  county_name?: string;

  subcounty?: string;
  subcounty_name?: string;

  ward?: string;
  name?: string;

  uid?: string;
  scuid?: string;
  cuid?: string;

  ward_code?: string;
};

type GeoJsonFeature = {
  type: "Feature";
  properties: GeoJsonWardProperties;
  geometry?: unknown;
};

type KenyaWardGeoJSON = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

type DatabaseSubCounty = {
  id: number;
  name: string;
  countyId: number;
  county: {
    id: number;
    name: string;
  };
};

type MappingWard = {
  id: number;
  name: string;
  code: string | null;
  sourceGid?: number;
  sourceUid?: string;
};

type MappingSubCounty = {
  subCountyId: number;
  subCountyName: string;
  countyId: number;
  countyName: string;
  wards: MappingWard[];
};

type MappingType =
  | "DIRECT"
  | "ALIAS"
  | "AGGREGATED"
  | "UNRESOLVED";

type ReviewStatus =
  | "MATCHED"
  | "MATCHED_BY_ALIAS"
  | "MATCHED_BY_AGGREGATION"
  | "UNRESOLVED";

type ReviewEntry = {
  county: string;
  normalizedCounty: string;

  sourceSubCounty: string;
  normalizedSourceSubCounty: string;

  wardCount: number;
  wards: string[];

  status: ReviewStatus;
  mappingType: MappingType;

  matchedDatabaseSubCounty?: string;
  matchedDatabaseSubCountyId?: number;

  possibleDatabaseMatches?: Array<{
    id: number;
    name: string;
  }>;

  notes?: string;
};

type BuildResult = {
  mapping: MappingSubCounty[];

  unmatched: string[];

  review: ReviewEntry[];

  downloadedWardCount: number;
  matchedWardCount: number;
  unmatchedWardCount: number;
};

// =======================================================
// CONTROLLED CROSSWALK
// =======================================================
//
// IMPORTANT:
//
// Only use this for VERIFIED naming differences.
//
// DO NOT use this object to guess that one administrative
// unit is another administrative unit.
//
// Key:
//
//   normalized county :: normalized source subcounty
//
// Value:
//
//   exact database SubCounty name
// =======================================================

const SUBCOUNTY_CROSSWALK: Record<string, string> = {
  // =====================================================
  // TAITA TAVETA
  // =====================================================

  "taita taveta::taita": "Taita",

  // =====================================================
  // SAMBURU
  // =====================================================

  "samburu::samburu": "Samburu Central",

  // =====================================================
  // KILIFI
  // =====================================================

  "kilifi::chonyi": "Chonyi",
  "kilifi::kauma": "Kauma",

  // =====================================================
  // TANA RIVER
  // =====================================================

  "tana river::tana delta": "Tana Delta",
  "tana river::tana north": "Tana North",
  "tana river::tana river": "Tana River",

  // =====================================================
  // WAJIR
  // =====================================================

  "wajir::buna": "Buna",
  "wajir::habaswein": "Habaswein",

  // =====================================================
  // MANDERA
  // =====================================================

  "mandera::banisa": "Banisa",
  "mandera::banissa": "Banisa",
  "mandera::kotulo": "Kotulo",
  "mandera::mandera central": "Mandera Central",
  "mandera::mandera west": "Mandera West",
  "mandera::mandera east": "Mandera East",
  "mandera::mandera north": "Mandera North",

  // =====================================================
  // MARSABIT
  // =====================================================

  "marsabit::loiyangalani": "Loiyangalani",
  "marsabit::marsabit central": "Marsabit Central",
  "marsabit::marsabit north": "Marsabit North",
  "marsabit::marsabit south": "Marsabit South",
  "marsabit::sololo": "Sololo",

  // IMPORTANT:
  // Laisamis is intentionally NOT mapped.
  //
  // Do not assume:
  //
  // Laisamis = Marsabit South
  //
  // unless this has been explicitly verified.

  // =====================================================
  // MERU
  // =====================================================

  "meru::buuri east": "Buuri East",
  "meru::buuri west": "Buuri West",
  "meru::meru central": "Meru Central",
  "meru::tigania central": "Tigania Central",

  // =====================================================
  // THARAKA NITHI
  // =====================================================

  "tharaka nithi::maara": "Maara",
  "tharaka nithi::meru south": "Meru South",

  // =====================================================
  // EMBU
  // =====================================================

  "embu::embu east": "Embu East",
  "embu::embu north": "Embu North",
  "embu::embu west": "Embu West",

  // Manyatta and Runyenjes are intentionally unresolved.

  // =====================================================
  // KITUI
  // =====================================================

  "kitui::ikutha": "Ikutha",
  "kitui::katulani": "Katulani",
  "kitui::kisasi": "Kisasi",
  "kitui::kyuso": "Kyuso",
  "kitui::lower yatta": "Lower Yatta",
  "kitui::matinyani": "Matinyani",
  "kitui::migwani": "Migwani",
  "kitui::mumoni": "Mumoni",
  "kitui::mutitu": "Mutitu",
  "kitui::mutitu north": "Mutitu North",
  "kitui::mutomo": "Mutomo",
  "kitui::mwingi central": "Mwingi Central",
  "kitui::mwingi east": "Mwingi East",
  "kitui::nzambani": "Nzambani",
  "kitui::thagicu": "Thagicu",
  "kitui::tseikuru": "Tseikuru",

  // =====================================================
  // MACHAKOS
  // =====================================================

  "machakos::kalama": "Kalama",

  // =====================================================
  // MAKUENI
  // =====================================================

  "makueni::kathonzweni": "Kathonzweni",
  "makueni::kibwezi": "Kibwezi",
  "makueni::kilungu": "Kilungu",
  "makueni::makindu": "Makindu",
  "makueni::mbooni east": "Mbooni East",
  "makueni::mbooni west": "Mbooni West",
  "makueni::mukaa": "Mukaa",
  "makueni::nzaui": "Nzaui",

  // =====================================================
  // NYANDARUA
  // =====================================================

  "nyandarua::nyandarua south": "Nyandarua South",
  "nyandarua::mirangine": "Mirangine",
  "nyandarua::nyandarua central": "Nyandarua Central",
  "nyandarua::nyandarua west": "Nyandarua West",
  "nyandarua::nyandarua north": "Nyandarua North",

  // =====================================================
  // NYERI
  // =====================================================

  "nyeri::mukurweini": "Mukurwe-ini",
  "nyeri::mukurwe-ini": "Mukurwe-ini",

  // =====================================================
  // KIRINYAGA
  // =====================================================

  "kirinyaga::mwea east": "Mwea East",
  "kirinyaga::mwea west": "Mwea West",

  // =====================================================
  // MURANG'A
  // =====================================================

// MURANG'A
// =====================================================

"muranga::muranga east": "Murang'a East",
"muranga::kahuro": "Kahuro",

"muranga::gatanga": "Gatanga",
"muranga::kandara": "Kandara",
"muranga::kangema": "Kangema",
"muranga::kigumo": "Kigumo",
"muranga::kiharu": "Kiharu",
"muranga::mathioya": "Mathioya",
"muranga::murang'a south": "Muranga South Sub County",

  // =====================================================
  // KIAMBU
  // =====================================================

  "kiambu::kiambu": "Kiambu",
  "kiambu::thika east": "Thika East",
  "kiambu::thika west": "Thika West",

  // =====================================================
  // WEST POKOT
  // =====================================================

  "west pokot::kipkomo": "Kipkomo",

  // =====================================================
  // TRANS NZOIA
  // =====================================================

  "trans nzoia::trans nzoia west": "Trans Nzoia West",
  "trans nzoia::trans nzoia east": "Trans Nzoia East",

  // =====================================================
  // NANDI
  // =====================================================

  "nandi::nandi central": "Nandi Central",
  "nandi::nandi north": "Nandi North",
  "nandi::nandi south": "Nandi South",

  // =====================================================
  // BARINGO
  // =====================================================

  "baringo::east pokot": "East Pokot",
  "baringo::tiaty": "Tiaty",
  "baringo::lake baringo": "Lake Baringo",


  // =====================================================
  // LAIKIPIA
  // =====================================================

  "laikipia::laikipia central": "Laikipia Central",
  "laikipia::nyahururu": "Nyahururu",

  // =====================================================
  // NAROK
  // =====================================================

  "narok::trans mara east": "Trans Mara East",
  "narok::trans mara west": "Trans Mara West",
  "narok::transmara east": "Trans Mara East",
  "narok::transmara west": "Trans Mara West",

  // =====================================================
  // KAJIADO
  // =====================================================

  "kajiado::isinya": "Isinya",
  "kajiado::mashuuru": "Mashuuru",

  // Kajiado East intentionally unresolved.
  // =====================================================
  // MURANG'A
  // =====================================================

  "muranga::gatanga": "Gatanga",
  "muranga::kandara": "Kandara",
  "muranga::kangema": "Kangema",
  "muranga::kigumo": "Kigumo",
  "muranga::kiharu": "Kiharu",
  "muranga::mathioya": "Mathioya",
  "muranga::murang'a south": "Muranga South Sub County",

  // =====================================================
  // KERICHO
  // =====================================================

  "kericho::kericho east": "Kericho East",
  "kericho::kipkelion": "Kipkelion",
  "kericho::londiani": "Londiani",
  "kericho::soin sigowet": "Soin Sigowet",
  "kericho::sigowet/soin": "Soin Sigowet",

  // Ainamoi intentionally unresolved.

  // =====================================================
  // KAKAMEGA
  // =====================================================

  "kakamega::kakamega central": "Kakamega Central",
  "kakamega::kakamega east": "Kakamega East",
  "kakamega::kakamega north": "Kakamega North",
  "kakamega::kakamega south": "Kakamega South",
  "kakamega::matete": "Matete",

  // =====================================================
  // BUNGOMA
  // =====================================================

  "bungoma::bungoma central": "Bungoma Central",
  "bungoma::bungoma east": "Bungoma East",
  "bungoma::bungoma north": "Bungoma North",
  "bungoma::bungoma south": "Bungoma South",
  "bungoma::bungoma west": "Bungoma West",
  "bungoma::mt elgon forest": "Mt Elgon Forest",

  // Kabuchai, Kanduyi, Sirisia and Webuye East remain
  // unresolved unless the database contains verified
  // corresponding records.

  // =====================================================
  // BUSIA
  // =====================================================

  "busia::busia": "Busia",

  // Matayos intentionally unresolved.

  // =====================================================
  // SIAYA
  // =====================================================

  "siaya::siaya": "Siaya",

  // =====================================================
  // HOMA BAY
  // =====================================================

  "homa bay::homa bay": "Homa Bay",

  // Homa Bay Town, Karachuonyo, Mbita and Suba remain
  // unresolved.

  // =====================================================
  // KISII
  // =====================================================

  "kisii::etago": "Etago",
  "kisii::gucha": "Gucha",
  "kisii::gucha south": "Gucha South",
  "kisii::kenyenya": "Kenyenya",
  "kisii::kisii central": "Kisii Central",
  "kisii::kisii south": "Kisii South",
  "kisii::kitutu central": "Kitutu Central",
  "kisii::marani": "Marani",
  "kisii::masaba south": "Masaba South",
  "kisii::nyamache": "Nyamache",
  "kisii::sameta": "Sameta",

  // Bobasi, Bomachoge Borabu, Bomachoge Chache,
  // Bonchari, Kitutu Chache North/South,
  // Nyaribari Chache/Masaba and South Mugirango
  // remain unresolved.

  // =====================================================
  // NYAMIRA
  // =====================================================

  "nyamira::nyamira south": "Nyamira South",

  // =====================================================
  // NAIROBI
  // =====================================================

  // Only safe direct database names are included here.
  //
  // DO NOT automatically map:
  //
  // Dagoretti North -> Dagoretti
  // Dagoretti South -> Dagoretti
  // Embakasi Central -> Embakasi
  // etc.
  //
  // Those require an explicit administrative decision.

  "nairobi::njiru": "Njiru",
  "nairobi city::njiru": "Njiru",
};

// =======================================================
// EXPLICIT AGGREGATION CROSSWALK
// =======================================================
//
// This section is intentionally EMPTY.
//
// Add entries here ONLY after confirming that several
// source administrative units should legitimately belong
// to one database SubCounty.
//
// Example:
//
// const SUBCOUNTY_AGGREGATION_CROSSWALK = {
//   "nairobi::dagoretti north": "Dagoretti",
//   "nairobi::dagoretti south": "Dagoretti",
// };
//
// Do NOT add these merely to make the script pass.
// =======================================================

const SUBCOUNTY_AGGREGATION_CROSSWALK: Record<
  string,
  string
> = {};

// =======================================================
// NORMALIZATION
// =======================================================

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/[–—−]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// =======================================================
// COUNTY NORMALIZATION
// =======================================================

function normalizeCountyName(value: string): string {
  let result = normalize(value);

  result = result
    .replace(/\s+county$/i, "")
    .replace(/\s+city\s+county$/i, "")
    .replace(/\s+city$/i, "")
    .trim();

  // Treat apostrophes as insignificant for county matching.
  // Example:
  //   Murang'a -> muranga
  //   Muranga  -> muranga
  result = result
    .replace(/['’]/g, "")
    .trim();

  if (
    result === "elgeyo marakwet" ||
    result === "elgeyo-marakwet"
  ) {
    return "elgeyo marakwet";
  }

  if (
    result === "tharaka nithi" ||
    result === "tharaka-nithi"
  ) {
    return "tharaka nithi";
  }

  if (result === "nairobi city") {
    return "nairobi";
  }

  return result;
}
// =======================================================
// SUBCOUNTY NORMALIZATION
// =======================================================

function normalizeSubCountyName(value: string): string {
  let result = normalize(value);

  result = result
    .replace(/\s+sub\s*county$/i, "")
    .replace(/\s+sub-county$/i, "")
    .replace(/\s+subcounty$/i, "")
    .trim();

  result = result.replace(/\s+/g, " ").trim();

  const aliases: Record<string, string> = {
    mukurweini: "mukurwe-ini",

    muranga: "murang'a",
    "muranga east": "murang'a east",
    "muranga south": "murang'a south",

    "transmara east": "trans mara east",
    "transmara west": "trans mara west",

    "webuye  east": "webuye east",

    banissa: "banisa",

    "sigowet/soin": "soin sigowet",
    "soin/sigowet": "soin sigowet",

    "mwingi central sub- county": "mwingi central",

    "mumias west ": "mumias west",

    "bonchari  ": "bonchari",

    "nyaribari chache  ": "nyaribari chache",

    "mbooni  ": "mbooni",

    "kaiti  ": "kaiti",

    "manyatta  ": "manyatta",

    "runyenjes  ": "runyenjes",

 "langata": "lang'ata",

    "roysambu  ": "roysambu",

    "ruaraka  ": "ruaraka",

    "starehe  ": "starehe",
  };

  return aliases[result] ?? result;
}

// =======================================================
// FIELD EXTRACTION
// =======================================================

function getCountyName(
  properties: GeoJsonWardProperties
): string {
  return (
    properties.county ??
    properties.county_name ??
    ""
  ).trim();
}

function getSubCountyName(
  properties: GeoJsonWardProperties
): string {
  return (
    properties.subcounty ??
    properties.subcounty_name ??
    ""
  ).trim();
}

function getWardName(
  properties: GeoJsonWardProperties
): string {
  return (
    properties.ward ??
    properties.name ??
    ""
  ).trim();
}

function getWardCode(
  properties: GeoJsonWardProperties
): string | null {
  return properties.ward_code?.trim() || null;
}

// =======================================================
// LOAD GEOJSON
// =======================================================

async function loadWardGeoJSON(): Promise<
  GeoJsonFeature[]
> {
  console.log("");
  console.log(
    "Loading Kenya 1,450-ward GeoJSON..."
  );

  const raw = await fs.readFile(
    GEOJSON_FILE,
    "utf8"
  );

  const data =
    JSON.parse(raw) as KenyaWardGeoJSON;

  if (
    data.type !==
    "FeatureCollection"
  ) {
    throw new Error(
      "Invalid GeoJSON: expected FeatureCollection."
    );
  }

  if (
    !Array.isArray(data.features)
  ) {
    throw new Error(
      "Invalid GeoJSON: features is not an array."
    );
  }

  console.log(
    `GeoJSON features received: ${data.features.length}`
  );

  return data.features;
}

// =======================================================
// LOAD DATABASE SUBCOUNTIES
// =======================================================

async function loadSubCounties(): Promise<
  DatabaseSubCounty[]
> {
  console.log("");
  console.log(
    "Loading SubCounty records from PostgreSQL..."
  );

  const rows =
    await prisma.subCounty.findMany({
      select: {
        id: true,
        name: true,
        countyId: true,
        county: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          countyId: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  console.log(
    `SubCounty records loaded: ${rows.length}`
  );

  return rows;
}

// =======================================================
// DATABASE LOOKUP
// =======================================================

function buildSubCountyLookup(
  subCounties: DatabaseSubCounty[]
): Map<string, DatabaseSubCounty> {
  const lookup =
    new Map<string, DatabaseSubCounty>();

  for (
    const subCounty of subCounties
  ) {
    const countyKey =
      normalizeCountyName(
        subCounty.county.name
      );

    const subCountyKey =
      normalizeSubCountyName(
        subCounty.name
      );

    const key =
      `${countyKey}::${subCountyKey}`;

    if (lookup.has(key)) {
      throw new Error(
        `Duplicate database SubCounty key detected: ${key}`
      );
    }

    lookup.set(
      key,
      subCounty
    );
  }

  return lookup;
}

// =======================================================
// POSSIBLE MATCHES
// =======================================================
//
// These are ONLY suggestions for human review.
// They are NEVER automatically selected.
// =======================================================

function findPossibleMatches(
  countyName: string,
  sourceSubCounty: string,
  subCounties: DatabaseSubCounty[]
): Array<{
  id: number;
  name: string;
}> {
  const countyKey =
    normalizeCountyName(
      countyName
    );

  const sourceKey =
    normalizeSubCountyName(
      sourceSubCounty
    );

  const sourceTokens =
    new Set(
      sourceKey
        .split(" ")
        .filter(Boolean)
    );

  const matches: Array<{
    id: number;
    name: string;
    score: number;
  }> = [];

  for (
    const subCounty of subCounties
  ) {
    if (
      normalizeCountyName(
        subCounty.county.name
      ) !== countyKey
    ) {
      continue;
    }

    const databaseKey =
      normalizeSubCountyName(
        subCounty.name
      );

    const databaseTokens =
      new Set(
        databaseKey
          .split(" ")
          .filter(Boolean)
      );

    let score = 0;

    if (
      databaseKey === sourceKey
    ) {
      score += 100;
    }

    if (
      databaseKey.includes(sourceKey)
    ) {
      score += 30;
    }

    if (
      sourceKey.includes(databaseKey)
    ) {
      score += 30;
    }

    for (
      const token of sourceTokens
    ) {
      if (
        databaseTokens.has(token)
      ) {
        score += 10;
      }
    }

    if (score > 0) {
      matches.push({
        id: subCounty.id,
        name: subCounty.name,
        score,
      });
    }
  }

  return matches
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(0, 5)
    .map(
      ({
        id,
        name,
      }) => ({
        id,
        name,
      })
    );
}

// =======================================================
// RESOLVE SUBCOUNTY
// =======================================================

function resolveSubCounty(
  countyName: string,
  sourceSubCounty: string,
  lookup: Map<string, DatabaseSubCounty>
): {
  subCounty:
    | DatabaseSubCounty
    | null;

  status:
    | "MATCHED"
    | "MATCHED_BY_ALIAS"
    | "MATCHED_BY_AGGREGATION"
    | "UNRESOLVED";

  mappingType: MappingType;

  notes?: string;
} {
  const normalizedCounty =
    normalizeCountyName(
      countyName
    );

  const normalizedSource =
    normalizeSubCountyName(
      sourceSubCounty
    );

  const directKey =
    `${normalizedCounty}::${normalizedSource}`;

  // =====================================================
  // 1. DIRECT MATCH
  // =====================================================

  const directMatch =
    lookup.get(directKey);

  if (directMatch) {
    return {
      subCounty:
        directMatch,

      status:
        "MATCHED",

      mappingType:
        "DIRECT",
    };
  }

  // =====================================================
  // 2. VERIFIED CROSSWALK
  // =====================================================

  const mappedName =
    SUBCOUNTY_CROSSWALK[
      directKey
    ];

  if (mappedName) {
    const mappedKey =
      `${normalizedCounty}::${normalizeSubCountyName(
        mappedName
      )}`;

    const mapped =
      lookup.get(mappedKey);

    if (mapped) {
      return {
        subCounty:
          mapped,

        status:
          "MATCHED_BY_ALIAS",

        mappingType:
          "ALIAS",
      };
    }

    return {
      subCounty:
        null,

      status:
        "UNRESOLVED",

      mappingType:
        "UNRESOLVED",

      notes:
        `Crosswalk points to "${mappedName}", but that database SubCounty was not found.`,
    };
  }

  // =====================================================
  // 3. EXPLICIT AGGREGATION
  // =====================================================

  const aggregationName =
    SUBCOUNTY_AGGREGATION_CROSSWALK[
      directKey
    ];

  if (aggregationName) {
    const aggregationKey =
      `${normalizedCounty}::${normalizeSubCountyName(
        aggregationName
      )}`;

    const aggregated =
      lookup.get(
        aggregationKey
      );

    if (aggregated) {
      return {
        subCounty:
          aggregated,

        status:
          "MATCHED_BY_AGGREGATION",

        mappingType:
          "AGGREGATED",

        notes:
          `Explicit aggregation: source "${sourceSubCounty}" maps to database "${aggregationName}".`,
      };
    }

    return {
      subCounty:
        null,

      status:
        "UNRESOLVED",

      mappingType:
        "UNRESOLVED",

      notes:
        `Aggregation points to "${aggregationName}", but that database SubCounty was not found.`,
    };
  }

  // =====================================================
  // 4. NO SAFE MATCH
  // =====================================================

  return {
    subCounty:
      null,

    status:
      "UNRESOLVED",

    mappingType:
      "UNRESOLVED",

    notes:
      "No direct match, verified alias, or explicit aggregation exists.",
  };
}

// =======================================================
// BUILD RECONCILIATION
// =======================================================

function buildMapping(
  features: GeoJsonFeature[],
  subCounties: DatabaseSubCounty[]
): BuildResult {
  const lookup =
    buildSubCountyLookup(
      subCounties
    );

  const mappingBySubCounty =
    new Map<
      number,
      MappingSubCounty
    >();

  const unmatched =
    new Set<string>();

  const reviewMap =
    new Map<
      string,
      ReviewEntry
    >();

  const wardNamesBySubCounty =
    new Map<
      number,
      Set<string>
    >();

  const wardCodes =
    new Set<string>();

  let matchedWardCount = 0;
  let unmatchedWardCount = 0;

  for (
    const feature of features
  ) {
    const properties =
      feature.properties;

    const countyName =
      getCountyName(
        properties
      );

    const sourceSubCounty =
      getSubCountyName(
        properties
      );

    const wardName =
      getWardName(
        properties
      );

    const wardCode =
      getWardCode(
        properties
      );

    if (
      !countyName ||
      !sourceSubCounty ||
      !wardName
    ) {
      throw new Error(
        `Invalid GeoJSON ward record: ${JSON.stringify(
          properties
        )}`
      );
    }

    const countyKey =
      normalizeCountyName(
        countyName
      );

    const sourceSubCountyKey =
      normalizeSubCountyName(
        sourceSubCounty
      );

    const reviewKey =
      `${countyKey}::${sourceSubCountyKey}`;

    // ===================================================
    // RESOLVE
    // ===================================================

    const resolution =
      resolveSubCounty(
        countyName,
        sourceSubCounty,
        lookup
      );

    // ===================================================
    // REVIEW ENTRY
    // ===================================================

    let review =
      reviewMap.get(
        reviewKey
      );

    if (!review) {
      review = {
        county:
          countyName,

        normalizedCounty:
          countyKey,

        sourceSubCounty:
          sourceSubCounty,

        normalizedSourceSubCounty:
          sourceSubCountyKey,

        wardCount:
          0,

        wards: [],

        status:
          resolution.status,

        mappingType:
          resolution.mappingType,

        notes:
          resolution.notes,
      };

      reviewMap.set(
        reviewKey,
        review
      );
    }

    review.wardCount++;

    review.wards.push(
      wardName
    );

    review.status =
      resolution.status;

    review.mappingType =
      resolution.mappingType;

    if (resolution.notes) {
      review.notes =
        resolution.notes;
    }

    // ===================================================
    // UNRESOLVED
    // ===================================================

    if (!resolution.subCounty) {
      unmatchedWardCount++;

      unmatched.add(
        reviewKey
      );

      if (
        !review.possibleDatabaseMatches
      ) {
        const possibleMatches =
          findPossibleMatches(
            countyName,
            sourceSubCounty,
            subCounties
          );

        if (
          possibleMatches.length
        ) {
          review.possibleDatabaseMatches =
            possibleMatches;
        }
      }

      continue;
    }

    // ===================================================
    // MATCHED
    // ===================================================

    matchedWardCount++;

    review.matchedDatabaseSubCounty =
      resolution.subCounty.name;

    review.matchedDatabaseSubCountyId =
      resolution.subCounty.id;

    // ===================================================
    // WARD CODE VALIDATION
    // ===================================================

    if (wardCode) {
      if (
        wardCodes.has(
          wardCode
        )
      ) {
        throw new Error(
          `Duplicate ward code detected: ${wardCode}`
        );
      }

      wardCodes.add(
        wardCode
      );
    }

    // ===================================================
    // DUPLICATE WARD VALIDATION
    // ===================================================

    let wardNames =
      wardNamesBySubCounty.get(
        resolution.subCounty.id
      );

    if (!wardNames) {
      wardNames =
        new Set<string>();

      wardNamesBySubCounty.set(
        resolution.subCounty.id,
        wardNames
      );
    }

    const normalizedWard =
      normalize(
        wardName
      );

    if (
      wardNames.has(
        normalizedWard
      )
    ) {
      throw new Error(
        `Duplicate ward "${wardName}" under ${countyName} / ${resolution.subCounty.name}`
      );
    }

    wardNames.add(
      normalizedWard
    );

    // ===================================================
    // ADD TO FINAL MAPPING
    // ===================================================

    let mapping =
      mappingBySubCounty.get(
        resolution.subCounty.id
      );

    if (!mapping) {
      mapping = {
        subCountyId:
          resolution.subCounty.id,

        subCountyName:
          resolution.subCounty.name,

        countyId:
          resolution.subCounty.countyId,

        countyName:
          resolution.subCounty.county.name,

        wards: [],
      };

      mappingBySubCounty.set(
        resolution.subCounty.id,
        mapping
      );
    }

    mapping.wards.push({
      // Ward database IDs do not exist yet.
      id: 0,

      name:
        wardName,

      code:
        wardCode,

      sourceGid:
        properties.gid,

      sourceUid:
        properties.uid,
    });
  }

  return {
    mapping:
      Array.from(
        mappingBySubCounty.values()
      ),

    unmatched:
      Array.from(
        unmatched
      ).sort(),

    review:
      Array.from(
        reviewMap.values()
      ).sort(
        (a, b) =>
          a.county.localeCompare(
            b.county
          ) ||
          a.sourceSubCounty.localeCompare(
            b.sourceSubCounty
          )
      ),

    downloadedWardCount:
      features.length,

    matchedWardCount,

    unmatchedWardCount,
  };
}

// =======================================================
// WRITE UNMATCHED REPORT
// =======================================================

async function writeUnmatchedReport(
  review: ReviewEntry[]
): Promise<void> {
  await fs.mkdir(
    path.dirname(
      UNMATCHED_FILE
    ),
    {
      recursive: true,
    }
  );

  const unmatched =
    review.filter(
      entry =>
        entry.status ===
        "UNRESOLVED"
    );

  await fs.writeFile(
    UNMATCHED_FILE,
    JSON.stringify(
      unmatched,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    `Unmatched report written to: ${UNMATCHED_FILE}`
  );
}

// =======================================================
// WRITE FULL MATCHING REVIEW
// =======================================================

async function writeMatchingReview(
  review: ReviewEntry[]
): Promise<void> {
  await fs.mkdir(
    path.dirname(
      REVIEW_FILE
    ),
    {
      recursive: true,
    }
  );

  await fs.writeFile(
    REVIEW_FILE,
    JSON.stringify(
      review,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    `Matching review written to: ${REVIEW_FILE}`
  );
}

// =======================================================
// PRINT RECONCILIATION SUMMARY
// =======================================================

function printSummary(
  result: BuildResult
): void {
  console.log("");
  console.log(
    "=============================================="
  );
  console.log(
    "RECONCILIATION SUMMARY"
  );
  console.log(
    "=============================================="
  );

  console.log(
    `Downloaded wards:              ${result.downloadedWardCount}`
  );

  console.log(
    `Matched wards:                 ${result.matchedWardCount}`
  );

  console.log(
    `Unmatched wards:               ${result.unmatchedWardCount}`
  );

  console.log(
    `Matched database subcounties:  ${result.mapping.length}`
  );

  console.log(
    `Unresolved relationships:      ${result.unmatched.length}`
  );

  console.log(
    `Source administrative units:   ${result.review.length}`
  );

  console.log(
    "=============================================="
  );
}

// =======================================================
// STRICT PRODUCTION VALIDATION
// =======================================================
//
// This is deliberately separate from reconciliation.
//
// The review reports are always generated first.
// Only a completely resolved dataset can produce the
// production mapping.
// =======================================================

function validateProductionMapping(
  result: BuildResult
): void {
  console.log("");
  console.log(
    "Validating production mapping..."
  );

  // =====================================================
  // SOURCE COUNT
  // =====================================================

  if (
    result.downloadedWardCount !==
    EXPECTED_WARD_COUNT
  ) {
    throw new Error(
      `Expected ${EXPECTED_WARD_COUNT} ward records, but received ${result.downloadedWardCount}.`
    );
  }

  // =====================================================
  // UNRESOLVED RELATIONSHIPS
  // =====================================================

  if (
    result.unmatched.length >
    0
  ) {
    console.log("");

    console.log(
      `Unresolved administrative relationships: ${result.unmatched.length}`
    );

    console.log("");

    for (
      const item of result.unmatched.slice(
        0,
        100
      )
    ) {
      console.log(
        `- ${item}`
      );
    }

    if (
      result.unmatched.length >
      100
    ) {
      console.log(
        `... and ${
          result.unmatched.length - 100
        } more`
      );
    }

    throw new Error(
      `Production mapping cannot be generated until all ${result.unmatched.length} unresolved administrative relationships are resolved.`
    );
  }

  // =====================================================
  // WARD COUNT
  // =====================================================

  if (
    result.matchedWardCount !==
    EXPECTED_WARD_COUNT
  ) {
    throw new Error(
      `Mapping contains ${result.matchedWardCount} matched wards, but ${EXPECTED_WARD_COUNT} are required.`
    );
  }

  // =====================================================
  // UNIQUE SUBCOUNTY IDs
  // =====================================================

  const ids =
    new Set<number>();

  for (
    const entry of result.mapping
  ) {
    if (
      ids.has(
        entry.subCountyId
      )
    ) {
      throw new Error(
        `Duplicate SubCounty ID detected: ${entry.subCountyId}`
      );
    }

    ids.add(
      entry.subCountyId
    );
  }

  // =====================================================
  // WARD TOTAL
  // =====================================================

  const totalWards =
    result.mapping.reduce(
      (
        total,
        entry
      ) =>
        total +
        entry.wards.length,
      0
    );

  if (
    totalWards !==
    EXPECTED_WARD_COUNT
  ) {
    throw new Error(
      `Final mapping contains ${totalWards} wards instead of ${EXPECTED_WARD_COUNT}.`
    );
  }

  console.log(
    "Production validation passed."
  );
}

// =======================================================
// WRITE FINAL OUTPUT
// =======================================================

async function writeOutput(
  mapping: MappingSubCounty[]
): Promise<void> {
  await fs.mkdir(
    path.dirname(
      OUTPUT_FILE
    ),
    {
      recursive: true,
    }
  );

  // Sort subcounties.
  mapping.sort(
    (a, b) =>
      a.countyName.localeCompare(
        b.countyName
      ) ||
      a.subCountyName.localeCompare(
        b.subCountyName
      )
  );

  // Sort wards.
  for (
    const entry of mapping
  ) {
    entry.wards.sort(
      (a, b) =>
        a.name.localeCompare(
          b.name
        )
    );
  }

  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(
      mapping,
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log(
    `Mapping written to: ${OUTPUT_FILE}`
  );
}

// =======================================================
// MAIN
// =======================================================

async function main(): Promise<void> {
  console.log("");
  console.log(
    "=============================================="
  );
  console.log(
    "Generating SubCounty → Ward Mapping"
  );
  console.log(
    "=============================================="
  );

  try {
    // ===================================================
    // DATABASE
    // ===================================================

    const subCounties =
      await loadSubCounties();

    // ===================================================
    // GEOJSON
    // ===================================================

    const features =
      await loadWardGeoJSON();

    // ===================================================
    // BUILD RECONCILIATION
    // ===================================================

    console.log("");
    console.log(
      "Building SubCounty → Ward reconciliation..."
    );

    const result =
      buildMapping(
        features,
        subCounties
      );

    // ===================================================
    // REPORTS
    // ===================================================

    await writeUnmatchedReport(
      result.review
    );

    await writeMatchingReview(
      result.review
    );

    // ===================================================
    // SUMMARY
    // ===================================================

    printSummary(
      result
    );

    // ===================================================
    // IMPORTANT:
    //
    // We deliberately DO NOT stop before writing
    // the review reports.
    //
    // Production mapping is attempted only now.
    // ===================================================

    validateProductionMapping(
      result
    );

    // ===================================================
    // OUTPUT
    // ===================================================

    await writeOutput(
      result.mapping
    );

    // ===================================================
    // SUCCESS
    // ===================================================

    console.log("");
    console.log(
      "=============================================="
    );

    console.log(
      "SUCCESS"
    );

    console.log(
      "=============================================="
    );

    console.log("");

    console.log(
      `Wards:       ${result.matchedWardCount}`
    );

    console.log(
      `SubCounties: ${result.mapping.length}`
    );

    console.log("");

    console.log(
      "SubCounty → Ward mapping generated successfully."
    );

    console.log("");
  } catch (error) {
    console.error("");
    console.error(
      "Failed to generate mapping."
    );
    console.error("");

    if (
      error instanceof Error
    ) {
      console.error(
        error.message
      );
    } else {
      console.error(
        error
      );
    }

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

