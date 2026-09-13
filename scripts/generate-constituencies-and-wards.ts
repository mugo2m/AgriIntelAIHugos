import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import {
wards as kenyaLocationWards,
constituencies as kenyaLocationConstituencies,
subCounties as kenyaLocationSubCounties,
} from "kenya-locations";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// =======================================================
// CONFIGURATION
// =======================================================

const GEOJSON_FILE = path.resolve(
process.cwd(),
"prisma/data/kenya-wards-1450.geojson"
);

const REVIEW_FILE = path.resolve(
process.cwd(),
"prisma/data/constituency-ward-review.json"
);

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

type GeoJsonProperties = {
gid?: number;
uid?: string;

pop2009?: number;

county?: string;
county_name?: string;

subcounty?: string;
subcounty_name?: string;
sub_county?: string;

constituency?: string;
constituency_name?: string;
const_name?: string;

ward?: string;
ward_name?: string;
name?: string;

ward_code?: string;
code?: string;

scuid?: string;
cuid?: string;
};

type GeoJsonFeature = {
type: "Feature";
properties: GeoJsonProperties;
geometry?: unknown;
};

type KenyaWardGeoJSON = {
type: "FeatureCollection";
features: GeoJsonFeature[];
};

type ResolvedFeature = {
feature: GeoJsonFeature;
county: string;
subcounty: string;
constituency: string;
ward: string;
wardCode: string | null;
};

type ReviewEntry = {
county: string;
constituency: string;
normalizedCounty: string;
normalizedConstituency: string;
wardCount: number;
wards: string[];
status:
| "READY"
| "MISSING_COUNTY"
| "MISSING_CONSTITUENCY"
| "MISSING_WARD";
};

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
.replace(///g, " ")
.replace(/-/g, " ")
.replace(/'/g, "")
.replace(/\s+/g, " ")
.trim()
.toLowerCase();
}

function normalizeCounty(value: string): string {
return normalize(value)
.replace(/\s+county$/i, "")
.replace(/\s+city county$/i, "")
.replace(/\s+city$/i, "")
.replace(/\s+/g, " ")
.trim();
}

function normalizeSubcounty(value: string): string {
return normalize(value)
.replace(/\s+sub county$/i, "")
.replace(/\s+subcounty$/i, "")
.replace(/\s+district$/i, "")
.replace(/\s+/g, " ")
.trim();
}

function normalizeConstituency(value: string): string {
return normalize(value)
.replace(/\s+constituency$/i, "")
.replace(/\s+/g, " ")
.trim();
}

function normalizeWard(value: string): string {
return normalize(value)
.replace(/\s+ward$/i, "")
.replace(/\s+/g, " ")
.trim();
}

// =======================================================
// CANONICAL COUNTY NAMES
// =======================================================
//
// These aliases prevent alternate source spellings from
// creating duplicate County records.
//
// The database already contains the canonical records:
//
// 66  Tharaka Nithi
// 76  Murang'a
// 79  Nairobi City
// 85  Elgeyo Marakwet
//
// The four duplicate records are:
//
// 145 THARAKA-NITHI
// 146 Muranga
// 147 Nairobi
// 148 ELGEYO-MARAKWET
//
// We intentionally do NOT delete anything here.
// =======================================================

const CANONICAL_COUNTY_NAMES: Record<string, string> = {
"tharaka nithi": "Tharaka Nithi",
muranga: "Murang'a",
nairobi: "Nairobi City",
"elgeyo marakwet": "Elgeyo Marakwet",
};

function getCanonicalCountyName(
countyName: string
): string {
const normalized =
normalizeCounty(countyName);

return (
CANONICAL_COUNTY_NAMES[normalized] ??
countyName.trim()
);
}

// =======================================================
// VERIFIED WARD FALLBACKS
// =======================================================
//
// Format:
//
// "county::subcounty::ward": "Constituency"
//
// All keys are normalized automatically.
// =======================================================

const VERIFIED_WARD_FALLBACKS: Record<
string,
string

> = {
> // =====================================================
> // KERICHO
> // =====================================================

"kericho::belgut::belgut":
"Ainamoi",

// =====================================================
// MANDERA
// =====================================================

"mandera::mandera north::marothile":
"Mandera North",

// =====================================================
// ISIOLO
// =====================================================

"isiolo::isiolo::wabera":
"Isiolo North",

"isiolo::isiolo::burat":
"Isiolo North",

"isiolo::isiolo::ngare mara":
"Isiolo North",

// =====================================================
// MIGORI
// =====================================================

"migori::suna west::waseweta ii":
"Suna West",

"migori::suna west::waseweta":
"Suna West",

"migori::awendo::north sakwa":
"Awendo",

"migori::awendo::south sakwa":
"Awendo",

"migori::awendo::west sakwa":
"Awendo",

"migori::awendo::central sakwa":
"Awendo",

"migori::nyatike::kachieng":
"Nyatike",

"migori::kuria west::bukira central ikerege":
"Kuria West",

// =====================================================
// MACHAKOS
// =====================================================

"machakos::athi river::mathatani":
"Mavoko",

"machakos::athi river::syokimau mulolongo":
"Mavoko",

"machakos::machakos::muvuti kiima kimwe":
"Machakos Town",

"machakos::machakos::township":
"Machakos Town",

"machakos::mwala::makutano mwala":
"Mwala",

// =====================================================
// HOMA BAY
// =====================================================

"homa bay::ndhiwa::kabouch north":
"Ndhiwa",

"homa bay::karachuonyo::central":
"Karachuonyo",

// =====================================================
// BUNGOMA
// =====================================================

"bungoma::cheptais::kakateny":
"Mt Elgon",

"bungoma::tongaren::ndalu tabani":
"Tongaren",

// =====================================================
// KAKAMEGA
// =====================================================

"kakamega::malava::butali chegulo":
"Malava",

"kakamega::navakholo::ingoste matiha":
"Navakholo",

"kakamega::mumias east::lusheya lubinu":
"Mumias East",

// =====================================================
// TAITA TAVETA
// =====================================================

"taita taveta::taveta::chala":
"Taveta",

"taita taveta::mwatate::bura":
"Mwatate",

"taita taveta::voi::sagala":
"Voi",

"taita taveta::voi::kaloleni":
"Voi",

// =====================================================
// LAMU
// =====================================================

"lamu::lamu west::shella":
"Lamu West",

// =====================================================
// MERU
// =====================================================

"meru::imenti central::mwangathia":
"Imenti Central",

// =====================================================
// WEST POKOT
// =====================================================

"west pokot::pokot north::kapchok":
"Pokot North",

"west pokot::pokot central::wei wei":
"Pokot Central",

// =====================================================
// NYANDARUA
// =====================================================

"nyandarua::olkalou::kanjuiri range":
"Ol Kalou",

// =====================================================
// NYERI
// =====================================================

"nyeri::nyeri central::ruringu karia":
"Nyeri Town",

// =====================================================
// KIRINYAGA
// =====================================================

"kirinyaga::kirinyaga east::njukiine":
"Gichugu",

// =====================================================
// MURANG'A
// =====================================================

"muranga::kiharu::township":
"Kiharu",

"muranga::muranga south::kamahuhu":
"Kandara",

"muranga::muranga south::nginda":
"Kandara",

"muranga::gatanga::mugumo ini":
"Gatanga",

"muranga::kangema::kanyenya ini":
"Kangema",

// =====================================================
// SAMBURU
// =====================================================

"samburu::samburu central::porro":
"Samburu East",

"samburu::samburu central::angata nayokie":
"Samburu East",

// =====================================================
// KIAMBU
// =====================================================

"kiambu::kiambu town::kiambu township":
"Kiambu",

// =====================================================
// KWALE
// =====================================================

"kwale::lunga lunga::pongwe kikoneni":
"Lunga Lunga",

// =====================================================
// NAKURU
// =====================================================

"nakuru::nakuru east::biashara":
"Nakuru Town East",

// =====================================================
// NYAMIRA
// =====================================================

"nyamira::manga::kamera":
"Kitutu Masaba North",

// =====================================================
// NAROK
// =====================================================

"narok::transmara east::iikerin":
"Trans Mara East",

// =====================================================
// BARINGO
// =====================================================

"baringo::marigat::iichamus":
"Baringo South",

// =====================================================
// KAJIADO
// =====================================================

"kajiado::loitokitok::entonet lenkism":
"Kajiado South",

"kajiado::loitokitok::imbrikani eselelnkei":
"Kajiado South",

// =====================================================
// THARAKA-NITHI
// =====================================================

"tharaka nithi::tharaka south::chiakagira":
"Tharaka",
};

// =======================================================
// VERIFIED SUBCOUNTY FALLBACKS
// =======================================================

const VERIFIED_SUBCOUNTY_FALLBACKS: Record<
string,
string

> = {
> "migori::awendo":
> "Awendo",

"migori::nyatike":
"Nyatike",

"migori::kuria west":
"Kuria West",

"migori::suna west":
"Suna West",

"machakos::athi river":
"Mavoko",

"machakos::machakos":
"Machakos Town",

"machakos::mwala":
"Mwala",

"homa bay::ndhiwa":
"Ndhiwa",

"homa bay::karachuonyo":
"Karachuonyo",

"bungoma::cheptais":
"Mt Elgon",

"bungoma::tongaren":
"Tongaren",

"kakamega::malava":
"Malava",

"kakamega::navakholo":
"Navakholo",

"kakamega::mumias east":
"Mumias East",

"taita taveta::taveta":
"Taveta",

"taita taveta::mwatate":
"Mwatate",

"taita taveta::voi":
"Voi",

"lamu::lamu west":
"Lamu West",

"meru::imenti central":
"Imenti Central",

"west pokot::pokot north":
"Pokot North",

"west pokot::pokot central":
"Pokot Central",

"nyandarua::olkalou":
"Ol Kalou",

"nyeri::nyeri central":
"Nyeri Town",

"kirinyaga::kirinyaga east":
"Gichugu",

"muranga::kiharu":
"Kiharu",

"muranga::muranga south":
"Kandara",

"muranga::gatanga":
"Gatanga",

"muranga::kangema":
"Kangema",

"samburu::samburu central":
"Samburu East",

"kiambu::kiambu town":
"Kiambu",

"kwale::lunga lunga":
"Lunga Lunga",

"nakuru::nakuru east":
"Nakuru Town East",

"nyamira::manga":
"Kitutu Masaba North",

"narok::transmara east":
"Trans Mara East",

"baringo::marigat":
"Baringo South",

"kajiado::loitokitok":
"Kajiado South",

"tharaka nithi::tharaka south":
"Tharaka",
};

// =======================================================
// COUNTY + SUBCOUNTY RULES
// =======================================================

const COUNTY_SUBCOUNTY_RULES: Record<
string,
string

> = {
> "isiolo::isiolo":
> "Isiolo North",

"mandera::mandera north":
"Mandera North",

"kericho::belgut":
"Ainamoi",
};

// =======================================================
// KEY BUILDERS
// =======================================================

function createWardFallbackKey(
county: string,
subcounty: string,
ward: string
): string {
return [
normalizeCounty(county),
normalizeSubcounty(subcounty),
normalizeWard(ward),
].join("::");
}

function createSubcountyFallbackKey(
county: string,
subcounty: string
): string {
return [
normalizeCounty(county),
normalizeSubcounty(subcounty),
].join("::");
}

// =======================================================
// LOAD GEOJSON
// =======================================================

async function loadGeoJSON(): Promise<
GeoJsonFeature[]

> {
> console.log("");
> console.log(
> "Loading Kenya 1,450-ward GeoJSON..."
> );

const raw =
await fs.readFile(
GEOJSON_FILE,
"utf8"
);

const data =
JSON.parse(
raw
) as KenyaWardGeoJSON;

if (
data.type !==
"FeatureCollection"
) {
throw new Error(
"Invalid GeoJSON: expected FeatureCollection."
);
}

if (
!Array.isArray(
data.features
)
) {
throw new Error(
"Invalid GeoJSON: features is not an array."
);
}

console.log(
`GeoJSON features received: ${data.features.length}`
);

if (
data.features.length !== 1450
) {
console.warn(
`WARNING: Expected 1,450 GeoJSON features but received ${data.features.length}.`
);
}

return data.features;
}

// =======================================================
// FIND CANONICAL CONSTITUENCY
// =======================================================

function findCanonicalConstituency(
name: string,
county: string
): string | null {
const normalizedName =
normalizeConstituency(name);

const normalizedCounty =
normalizeCounty(county);

const matches =
kenyaLocationConstituencies.filter(
(item: any) =>
normalizeConstituency(
item.name ?? ""
) === normalizedName &&
normalizeCounty(
item.county ?? ""
) === normalizedCounty
);

if (
matches.length === 0
) {
return null;
}

return (
matches[0]?.name?.trim() ??
null
);
}

// =======================================================
// RESOLVE CONSTITUENCY
// =======================================================

function resolveConstituency(
properties: GeoJsonProperties
): string {
const county =
getCounty(properties);

const subcounty =
getSubcounty(properties);

const ward =
getWard(properties);

const directConstituency =
getDirectConstituency(
properties
);

// -----------------------------------------------------
// 1. DIRECT GEOJSON CONSTITUENCY
// -----------------------------------------------------

if (
directConstituency.trim()
) {
const canonical =
findCanonicalConstituency(
directConstituency,
county
);

```
return (
  canonical ??
  directConstituency.trim()
);
```

}

const wardFallbackKey =
createWardFallbackKey(
county,
subcounty,
ward
);

const subcountyFallbackKey =
createSubcountyFallbackKey(
county,
subcounty
);

// -----------------------------------------------------
// 2. VERIFIED WARD FALLBACK
// -----------------------------------------------------

const verifiedWard =
VERIFIED_WARD_FALLBACKS[
wardFallbackKey
];

if (verifiedWard) {
return verifiedWard;
}

// -----------------------------------------------------
// 3. EXACT WARD LOOKUP
// -----------------------------------------------------

const normalizedWard =
normalizeWard(ward);

const wardMatches =
kenyaLocationWards.filter(
(item: any) =>
normalizeWard(
item.name ?? ""
) === normalizedWard
);

if (
wardMatches.length === 1 &&
wardMatches[0]?.constituency
) {
return wardMatches[0]
.constituency
.trim();
}

// -----------------------------------------------------
// 4. COUNTY-AWARE WARD LOOKUP
// -----------------------------------------------------

const normalizedCounty =
normalizeCounty(county);

const countyWardMatches =
wardMatches.filter(
(item: any) => {
if (!item.constituency) {
return false;
}

```
    const constituency =
      kenyaLocationConstituencies.find(
        (constituencyItem: any) =>
          normalizeConstituency(
            constituencyItem.name ?? ""
          ) ===
            normalizeConstituency(
              item.constituency
            ) &&
          normalizeCounty(
            constituencyItem.county ?? ""
          ) ===
            normalizedCounty
      );

    return Boolean(
      constituency
    );
  }
);
```

if (
countyWardMatches.length === 1 &&
countyWardMatches[0]?.constituency
) {
return countyWardMatches[0]
.constituency
.trim();
}

// -----------------------------------------------------
// 5. VERIFIED SUBCOUNTY FALLBACK
// -----------------------------------------------------

const verifiedSubcounty =
VERIFIED_SUBCOUNTY_FALLBACKS[
subcountyFallbackKey
];

if (verifiedSubcounty) {
return verifiedSubcounty;
}

// -----------------------------------------------------
// 6. COUNTY + SUBCOUNTY RULE
// -----------------------------------------------------

const countySubcountyRule =
COUNTY_SUBCOUNTY_RULES[
subcountyFallbackKey
];

if (countySubcountyRule) {
return countySubcountyRule;
}

// -----------------------------------------------------
// 7. kenya-locations SUBCOUNTY LOOKUP
// -----------------------------------------------------

const normalizedSubcounty =
normalizeSubcounty(
subcounty
);

const matchingSubcounty =
kenyaLocationSubCounties.find(
(item: any) =>
normalizeSubcounty(
item.name ?? ""
) ===
normalizedSubcounty &&
normalizeCounty(
item.county ?? ""
) ===
normalizedCounty
);

if (
matchingSubcounty
) {
const possibleConstituency =
kenyaLocationConstituencies.find(
(item: any) =>
normalizeConstituency(
item.name ?? ""
) ===
normalizeSubcounty(
matchingSubcounty.name ?? ""
) &&
normalizeCounty(
item.county ?? ""
) ===
normalizedCounty
);

```
if (
  possibleConstituency
) {
  return possibleConstituency.name;
}
```

}

// -----------------------------------------------------
// 8. FUZZY COUNTY-AWARE WARD MATCH
// -----------------------------------------------------

const fuzzyMatches =
kenyaLocationWards.filter(
(item: any) => {
const itemWard =
normalizeWard(
item.name ?? ""
);

```
    return (
      itemWard ===
        normalizedWard ||
      itemWard.includes(
        normalizedWard
      ) ||
      normalizedWard.includes(
        itemWard
      )
    );
  }
);
```

const fuzzyCountyMatches =
fuzzyMatches.filter(
(item: any) => {
if (!item.constituency) {
return false;
}

```
    const constituency =
      kenyaLocationConstituencies.find(
        (constituencyItem: any) =>
          normalizeConstituency(
            constituencyItem.name ?? ""
          ) ===
            normalizeConstituency(
              item.constituency
            ) &&
          normalizeCounty(
            constituencyItem.county ?? ""
          ) ===
            normalizedCounty
      );

    return Boolean(
      constituency
    );
  }
);
```

const uniqueFuzzyConstituencies =
Array.from(
new Set(
fuzzyCountyMatches
.map(
(item: any) =>
item.constituency
)
.filter(Boolean)
.map(
(value: string) =>
value.trim()
)
)
);

if (
uniqueFuzzyConstituencies.length === 1
) {
return uniqueFuzzyConstituencies[0];
}

// -----------------------------------------------------
// 9. ITERATIVE COUNTY-AWARE INFERENCE
// -----------------------------------------------------

const constituencyBySubcountyName =
kenyaLocationConstituencies.find(
(item: any) => {
const itemCounty =
normalizeCounty(
item.county ?? ""
);

```
    const itemConstituency =
      normalizeConstituency(
        item.name ?? ""
      );

    return (
      itemCounty ===
        normalizedCounty &&
      (
        itemConstituency ===
          normalizedSubcounty ||
        itemConstituency.includes(
          normalizedSubcounty
        ) ||
        normalizedSubcounty.includes(
          itemConstituency
        )
      )
    );
  }
);
```

if (
constituencyBySubcountyName
) {
return constituencyBySubcountyName.name;
}

// -----------------------------------------------------
// FAILED
// -----------------------------------------------------

throw new Error(
[
"",
"Constituency resolution failed.",
"",
JSON.stringify(
properties,
null,
2
),
"",
`County: ${county}`,
`Subcounty: ${subcounty}`,
`Ward: ${ward}`,
"",
"Constituency could not be resolved from:",
"",
"1. GeoJSON constituency fields",
"2. VERIFIED_WARD_FALLBACKS",
"3. kenya-locations ward lookup",
"4. county-aware ward lookup",
"5. VERIFIED_SUBCOUNTY_FALLBACKS",
"6. COUNTY_SUBCOUNTY_RULES",
"7. kenya-locations subcounty lookup",
"8. fuzzy ward matching",
"9. iterative county-aware inference",
"",
`Fallback key: ${wardFallbackKey}`,
"",
"If the relationship is genuinely missing, add a verified mapping to VERIFIED_WARD_FALLBACKS.",
].join("\n")
);
}

// =======================================================
// FIELD EXTRACTION
// =======================================================

function getCounty(
properties: GeoJsonProperties
): string {
return (
properties.county ??
properties.county_name ??
""
).trim();
}

function getSubcounty(
properties: GeoJsonProperties
): string {
return (
properties.subcounty ??
properties.subcounty_name ??
properties.sub_county ??
""
).trim();
}

function getDirectConstituency(
properties: GeoJsonProperties
): string {
return (
properties.constituency ??
properties.constituency_name ??
properties.const_name ??
""
).trim();
}

function getWard(
properties: GeoJsonProperties
): string {
return (
properties.ward ??
properties.ward_name ??
properties.name ??
""
).trim();
}

function getWardCode(
properties: GeoJsonProperties
): string | null {
const value =
properties.ward_code ??
properties.code ??
null;

return (
value?.trim() ||
null
);
}

// =======================================================
// RESOLVE ALL FEATURES
// =======================================================

function resolveFeatures(
features: GeoJsonFeature[]
): ResolvedFeature[] {
console.log("");
console.log(
"Resolving constituency relationships..."
);

const resolved: ResolvedFeature[] =
[];

const failures: string[] =
[];

for (
const feature of features
) {
try {
const properties =
feature.properties;

```
  const county =
    getCounty(properties);

  const subcounty =
    getSubcounty(properties);

  const constituency =
    resolveConstituency(
      properties
    );

  const ward =
    getWard(properties);

  const wardCode =
    getWardCode(properties);

  resolved.push({
    feature,
    county,
    subcounty,
    constituency,
    ward,
    wardCode,
  });
} catch (error) {
  if (
    error instanceof Error
  ) {
    failures.push(
      error.message
    );
  } else {
    failures.push(
      String(error)
    );
  }
}
```

}

if (
failures.length > 0
) {
throw new Error(
[
"",
`${failures.length} constituency relationships could not be resolved.`,
"",
...failures,
].join("\n\n")
);
}

console.log(
`Successfully resolved ${resolved.length} constituency relationships.`
);

return resolved;
}

// =======================================================
// BUILD REVIEW
// =======================================================

function buildReview(
resolvedFeatures: ResolvedFeature[]
): ReviewEntry[] {
const reviewMap =
new Map<
string,
ReviewEntry
>();

for (
const item of resolvedFeatures
) {
const county =
item.county;

```
const constituency =
  item.constituency;

const ward =
  item.ward;

const countyKey =
  normalizeCounty(
    county
  );

const constituencyKey =
  normalizeConstituency(
    constituency
  );

const reviewKey =
  `${countyKey}::${constituencyKey}`;

let entry =
  reviewMap.get(
    reviewKey
  );

if (!entry) {
  entry = {
    county,
    constituency,
    normalizedCounty:
      countyKey,
    normalizedConstituency:
      constituencyKey,
    wardCount: 0,
    wards: [],
    status: "READY",
  };

  reviewMap.set(
    reviewKey,
    entry
  );
}

entry.wardCount++;

if (ward) {
  entry.wards.push(
    ward
  );
}

if (!county) {
  entry.status =
    "MISSING_COUNTY";
} else if (
  !constituency
) {
  entry.status =
    "MISSING_CONSTITUENCY";
} else if (!ward) {
  entry.status =
    "MISSING_WARD";
}
```

}

return Array.from(
reviewMap.values()
).sort(
(a, b) =>
a.county.localeCompare(
b.county
) ||
a.constituency.localeCompare(
b.constituency
)
);
}

// =======================================================
// WRITE REVIEW
// =======================================================

async function writeReview(
review: ReviewEntry[]
) {
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
`Review written to: ${REVIEW_FILE}`
);
}

// =======================================================
// VALIDATE SOURCE
// =======================================================

let uniqueWardRelationships = 0;

function validateSource(
resolvedFeatures: ResolvedFeature[]
) {
console.log("");
console.log(
"Validating GeoJSON source..."
);

const wardKeys =
new Set<string>();

const wardCodes =
new Set<string>();

for (
const item of resolvedFeatures
) {
const {
county,
constituency,
ward,
wardCode,
} = item;

```
if (!county) {
  throw new Error(
    `A ward is missing county information: ${JSON.stringify(
      item.feature.properties
    )}`
  );
}

if (!constituency) {
  throw new Error(
    `A ward is missing constituency information: ${JSON.stringify(
      item.feature.properties
    )}`
  );
}

if (!ward) {
  throw new Error(
    `A ward is missing ward information: ${JSON.stringify(
      item.feature.properties
    )}`
  );
}

const key =
  `${normalizeCounty(
    county
  )}::${normalizeConstituency(
    constituency
  )}::${normalizeWard(
    ward
  )}`;

if (
  wardKeys.has(key)
) {
  console.warn(
    [
      "",
      "WARNING: duplicate normalized ward relationship detected.",
      `County: ${county}`,
      `Constituency: ${constituency}`,
      `Ward: ${ward}`,
      "",
      "The source contains multiple records with the same administrative relationship.",
      "sourceGid/sourceUid preserve source identity.",
      "",
    ].join("\n")
  );
} else {
  wardKeys.add(key);
}

if (wardCode) {
  if (
    wardCodes.has(
      wardCode
    )
  ) {
    console.warn(
      `WARNING: duplicate ward code detected in source: ${wardCode}`
    );
  } else {
    wardCodes.add(
      wardCode
    );
  }
}
```

}

console.log(
`Validated ${resolvedFeatures.length} ward records.`
);

console.log(
`Unique administrative ward relationships: ${wardKeys.size}`
);

uniqueWardRelationships =
wardKeys.size;
}

// =======================================================
// DATABASE VALIDATION
// =======================================================
//
// IMPORTANT:
//
// This is READ-ONLY.
//
// The current database is known to contain four duplicate
// county records. We intentionally stop before population
// if normalized duplicate counties exist.
//
// This prevents the loader from making the situation worse.
// =======================================================

async function validateDatabase() {
console.log("");
console.log(
"Checking current database..."
);

const countyCount =
await prisma.county.count();

const subCountyCount =
await prisma.subCounty.count();

const constituencyCount =
await prisma.constituency.count();

const wardCount =
await prisma.ward.count();

console.log(
`Counties: ${countyCount}`
);

console.log(
`SubCounties: ${subCountyCount}`
);

console.log(
`Constituencies: ${constituencyCount}`
);

console.log(
`Wards: ${wardCount}`
);

const counties =
await prisma.county.findMany({
orderBy: {
id: "asc",
},
});

const countyGroups =
new Map<
string,
typeof counties
>();

for (
const county of counties
) {
const key =
normalizeCounty(
county.name
);

```
const existing =
  countyGroups.get(
    key
  );

if (existing) {
  existing.push(
    county
  );
} else {
  countyGroups.set(
    key,
    [county]
  );
}
```

}

const duplicateGroups =
Array.from(
countyGroups.entries()
).filter(
([, records]) =>
records.length > 1
);

if (
duplicateGroups.length > 0
) {
console.log("");
console.log(
"NORMALIZED DUPLICATE COUNTIES DETECTED:"
);

```
for (
  const [
    normalizedName,
    records,
  ] of duplicateGroups
) {
  console.log("");
  console.log(
    `Normalized name: ${normalizedName}`
  );

  for (
    const county of records
  ) {
    console.log(
      `  ID ${county.id}: ${county.name}`
    );
  }
}

throw new Error(
  [
    "",
    "Database preflight failed.",
    "",
    "The database contains normalized duplicate County records.",
    "No database population was performed.",
    "",
    "Repair the existing duplicate counties first:",
    "",
    "145 THARAKA-NITHI  -> 66 Tharaka Nithi",
    "146 Muranga        -> 76 Murang'a",
    "147 Nairobi         -> 79 Nairobi City",
    "148 ELGEYO-MARAKWET -> 85 Elgeyo Marakwet",
    "",
    "Then run this generator again.",
  ].join("\n")
);
```

}

if (
countyCount !== 47
) {
throw new Error(
[
"",
`Database contains ${countyCount} counties.`,
"Expected exactly 47 counties before population.",
"",
"No database writes were performed.",
].join("\n")
);
}

console.log(
"Database county preflight passed."
);
}

// =======================================================
// POPULATE DATABASE
// =======================================================

async function populate(
resolvedFeatures: ResolvedFeature[]
) {
console.log("");
console.log(
"Populating Counties, SubCounties, Constituencies and Wards..."
);

const countyCache =
new Map<
string,
number
>();

const subCountyCache =
new Map<
string,
number
>();

const constituencyCache =
new Map<
string,
number
>();

let countyCreated = 0;

let subCountyCreated = 0;

let constituencyCreated = 0;

let wardCreated = 0;

let wardSkipped = 0;

await prisma.$transaction(
async (tx) => {
// ---------------------------------------------------
// Ensure Kenya exists
// ---------------------------------------------------

```
  const kenya =
    await tx.country.upsert({
      where: {
        name: "Kenya",
      },
      update: {},
      create: {
        name: "Kenya",
      },
    });

  // ---------------------------------------------------
  // CACHE EXISTING COUNTIES
  // ---------------------------------------------------

  const existingCounties =
    await tx.county.findMany({
      where: {
        countryId:
          kenya.id,
      },
      orderBy: {
        id: "asc",
      },
    });

  for (
    const county of
      existingCounties
  ) {
    const normalized =
      normalizeCounty(
        county.name
      );

    const canonical =
      getCanonicalCountyName(
        county.name
      );

    const canonicalKey =
      normalizeCounty(
        canonical
      );

    if (
      !countyCache.has(
        normalized
      )
    ) {
      countyCache.set(
        normalized,
        county.id
      );
    }

    if (
      !countyCache.has(
        canonicalKey
      )
    ) {
      countyCache.set(
        canonicalKey,
        county.id
      );
    }
  }

  // ---------------------------------------------------
  // PROCESS SOURCE
  // ---------------------------------------------------

  for (
    const item of
      resolvedFeatures
  ) {
    const {
      feature,
      county: countyName,
      subcounty:
        subCountyName,
      constituency:
        constituencyName,
      ward: wardName,
      wardCode,
    } = item;

    // -----------------------------------------------
    // COUNTY KEYS
    // -----------------------------------------------

    const canonicalCountyName =
      getCanonicalCountyName(
        countyName
      );

    const countyKey =
      normalizeCounty(
        canonicalCountyName
      );

    // -----------------------------------------------
    // SUBCOUNTY KEY
    // -----------------------------------------------

    const subCountyKey =
      `${countyKey}::${normalizeSubcounty(
        subCountyName
      )}`;

    // -----------------------------------------------
    // CONSTITUENCY KEY
    // -----------------------------------------------

    const constituencyKey =
      `${countyKey}::${normalizeConstituency(
        constituencyName
      )}`;

    // -----------------------------------------------
    // COUNTY
    // -----------------------------------------------

    let countyId =
      countyCache.get(
        countyKey
      );

    if (
      countyId === undefined
    ) {
      const countyCandidates =
        await tx.county.findMany({
          where: {
            countryId:
              kenya.id,
          },
          orderBy: {
            id: "asc",
          },
        });

      const normalizedMatches =
        countyCandidates.filter(
          (county) =>
            normalizeCounty(
              county.name
            ) === countyKey
        );

      if (
        normalizedMatches.length > 1
      ) {
        throw new Error(
          [
            "",
            "Ambiguous County match detected.",
            "",
            `Source county: ${countyName}`,
            `Canonical county: ${canonicalCountyName}`,
            "",
            ...normalizedMatches.map(
              (county) =>
                `ID ${county.id}: ${county.name}`
            ),
            "",
            "The loader refuses to choose between duplicate County records.",
          ].join("\n")
        );
      }

      if (
        normalizedMatches.length === 1
      ) {
        countyId =
          normalizedMatches[0].id;
      } else {
        const county =
          await tx.county.create({
            data: {
              name:
                canonicalCountyName,
              country: {
                connect: {
                  id: kenya.id,
                },
              },
            },
          });

        countyId =
          county.id;

        countyCreated++;
      }

      countyCache.set(
        countyKey,
        countyId
      );
    }

    // -----------------------------------------------
    // SUBCOUNTY
    // -----------------------------------------------

    let subCountyId =
      subCountyCache.get(
        subCountyKey
      );

    if (
      subCountyId === undefined
    ) {
      const existingSubCounties =
        await tx.subCounty.findMany({
          where: {
            countyId,
          },
          orderBy: {
            id: "asc",
          },
        });

      const normalizedSubcounty =
        normalizeSubcounty(
          subCountyName
        );

      const subCountyMatches =
        existingSubCounties.filter(
          (subCounty) =>
            normalizeSubcounty(
              subCounty.name
            ) ===
            normalizedSubcounty
        );

      if (
        subCountyMatches.length > 1
      ) {
        throw new Error(
          [
            "",
            "Ambiguous SubCounty match detected.",
            "",
            `County: ${canonicalCountyName}`,
            `Source SubCounty: ${subCountyName}`,
            "",
            ...subCountyMatches.map(
              (subCounty) =>
                `ID ${subCounty.id}: ${subCounty.name}`
            ),
            "",
            "The loader refuses to choose between duplicate SubCounty records.",
          ].join("\n")
        );
      }

      if (
        subCountyMatches.length === 1
      ) {
        subCountyId =
          subCountyMatches[0].id;
      } else {
        const subCounty =
          await tx.subCounty.create({
            data: {
              name:
                subCountyName.trim(),
              countyId,
            },
          });

        subCountyId =
          subCounty.id;

        subCountyCreated++;
      }

      subCountyCache.set(
        subCountyKey,
        subCountyId
      );
    }

    // -----------------------------------------------
    // CONSTITUENCY
    // -----------------------------------------------

    let constituencyId =
      constituencyCache.get(
        constituencyKey
      );

    if (
      constituencyId ===
      undefined
    ) {
      const existingConstituencies =
        await tx.constituency.findMany({
          where: {
            countyId,
          },
          orderBy: {
            id: "asc",
          },
        });

      const normalizedConstituency =
        normalizeConstituency(
          constituencyName
        );

      const constituencyMatches =
        existingConstituencies.filter(
          (constituency) =>
            normalizeConstituency(
              constituency.name
            ) ===
            normalizedConstituency
        );

      if (
        constituencyMatches.length > 1
      ) {
        throw new Error(
          [
            "",
            "Ambiguous Constituency match detected.",
            "",
            `County: ${canonicalCountyName}`,
            `Source Constituency: ${constituencyName}`,
            "",
            ...constituencyMatches.map(
              (constituency) =>
                `ID ${constituency.id}: ${constituency.name}`
            ),
            "",
            "The loader refuses to choose between duplicate Constituency records.",
          ].join("\n")
        );
      }

      if (
        constituencyMatches.length === 1
      ) {
        constituencyId =
          constituencyMatches[0].id;
      } else {
        const constituency =
          await tx.constituency.create({
            data: {
              name:
                constituencyName.trim(),
              countyId,
            },
          });

        constituencyId =
          constituency.id;

        constituencyCreated++;
      }

      constituencyCache.set(
        constituencyKey,
        constituencyId
      );
    }

    // -----------------------------------------------
    // WARD
    // -----------------------------------------------
    //
    // IMPORTANT:
    //
    // Current Prisma schema uses:
    //
    // @@unique([constituencyId, name])
    //
    // Therefore ward lookup is based on:
    //
    // constituencyId + normalized ward name
    //
    // NOT subCountyId + name.
    // -----------------------------------------------

    const existingWards =
      await tx.ward.findMany({
        where: {
          constituencyId,
        },
        select: {
          id: true,
          name: true,
        },
      });

    const normalizedWardName =
      normalizeWard(
        wardName
      );

    const existingWard =
      existingWards.find(
        (ward) =>
          normalizeWard(
            ward.name
          ) ===
          normalizedWardName
      );

    if (
      !existingWard
    ) {
      await tx.ward.create({
        data: {
          name:
            wardName.trim(),

          code:
            wardCode,

          sourceGid:
            feature.properties
              .gid ??
            null,

          sourceUid:
            feature.properties
              .uid ??
            null,

          countyId,

          subCountyId,

          constituencyId,
        },
      });

      wardCreated++;
    } else {
      wardSkipped++;
    }
  }
},
{
  timeout: 300000,
}
```

);

console.log("");

console.log(
`Counties created: ${countyCreated}`
);

console.log(
`SubCounties created: ${subCountyCreated}`
);

console.log(
`Constituencies created: ${constituencyCreated}`
);

console.log(
`Wards created: ${wardCreated}`
);

console.log(
`Wards skipped (duplicates): ${wardSkipped}`
);

return {
countyCreated,
subCountyCreated,
constituencyCreated,
wardCreated,
wardSkipped,
};
}

// =======================================================
// FINAL VALIDATION
// =======================================================

async function validateFinal() {
console.log("");
console.log(
"Running final database validation..."
);

const countyCount =
await prisma.county.count();

const subCountyCount =
await prisma.subCounty.count();

const constituencyCount =
await prisma.constituency.count();

const wardCount =
await prisma.ward.count();

console.log(
`Final Counties: ${countyCount}`
);

console.log(
`Final SubCounties: ${subCountyCount}`
);

console.log(
`Final Constituencies: ${constituencyCount}`
);

console.log(
`Final Wards: ${wardCount}`
);

// -----------------------------------------------------
// COUNTY VALIDATION
// -----------------------------------------------------

if (
countyCount !== 47
) {
throw new Error(
`Expected 47 counties but database contains ${countyCount}.`
);
}

// -----------------------------------------------------
// WARD VALIDATION
// -----------------------------------------------------

if (
wardCount !==
uniqueWardRelationships
) {
throw new Error(
`Expected ${uniqueWardRelationships} wards (unique administrative relationships) but database contains ${wardCount}.`
);
}

// -----------------------------------------------------
// SOURCE COUNT EXPECTATION
// -----------------------------------------------------

if (
uniqueWardRelationships !==
1450
) {
throw new Error(
`Expected 1,450 unique administrative ward relationships but calculated ${uniqueWardRelationships}.`
);
}

// -----------------------------------------------------
// FINAL SUCCESS
// -----------------------------------------------------

console.log("");
console.log(
"Final validation passed."
);

console.log(
"47 counties confirmed."
);

console.log(
"1,450 unique ward relationships confirmed."
);
}

// =======================================================
// MAIN
// =======================================================

async function main() {
console.log("");

console.log(
"================================================"
);

console.log(
"KENYA CONSTITUENCY → WARD LOADER"
);

console.log(
"================================================"
);

try {
// ---------------------------------------------------
// STEP 1 — SOURCE
// ---------------------------------------------------

```
const features =
  await loadGeoJSON();

// ---------------------------------------------------
// STEP 2 — RESOLVE
// ---------------------------------------------------

const resolvedFeatures =
  resolveFeatures(
    features
  );

// ---------------------------------------------------
// STEP 3 — REVIEW
// ---------------------------------------------------

const review =
  buildReview(
    resolvedFeatures
  );

await writeReview(
  review
);

// ---------------------------------------------------
// STEP 4 — SOURCE VALIDATION
// ---------------------------------------------------

validateSource(
  resolvedFeatures
);

// ---------------------------------------------------
// STEP 5 — DATABASE PREFLIGHT
// ---------------------------------------------------
//
// IMPORTANT:
//
// No writes occur until the database hierarchy
// is structurally safe.
// ---------------------------------------------------

await validateDatabase();

// ---------------------------------------------------
// STEP 6 — POPULATE
// ---------------------------------------------------

await populate(
  resolvedFeatures
);

// ---------------------------------------------------
// STEP 7 — FINAL VALIDATION
// ---------------------------------------------------

await validateFinal();

console.log("");

console.log(
  "================================================"
);

console.log(
  "SUCCESS"
);

console.log(
  "================================================"
);

console.log("");

console.log(
  "Kenya County → SubCounty → Constituency → Ward data loaded successfully."
);
```

} catch (error) {
console.error("");

```
console.error(
  "================================================"
);

console.error(
  "FAILED"
);

console.error(
  "================================================"
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
```

} finally {
await prisma.$disconnect();
}
}

main();
