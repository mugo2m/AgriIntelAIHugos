import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";

type GeoFeature = {
  type?: string;
  properties?: Record<string, unknown>;
  geometry?: unknown;
};

type GeoJSON = {
  type?: string;
  features?: GeoFeature[];
};

type DbSubCounty = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
};

type DbWard = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
  subCountyId: number | null;
  subCountyName: string | null;
  constituencyId: number | null;
  constituencyName: string | null;
};

type ColumnInfo = {
  tableName: string;
  columnName: string;
  dataType: string;
  udtName: string;
};

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeName(value: unknown): string {
  let s = text(value).toLowerCase();

  s = s
    .replace(/[’'`]/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/\bsub\s+county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/\bcounty\b/g, "")
    .replace(/[.,/()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}

function compactNormalize(value: unknown): string {
  return normalizeName(value).replace(/\s+/g, "");
}

function controlledSubCountyNormalize(value: unknown): string {
  const normalized = normalizeName(value);

  /*
   * Known source naming difference established by V14:
   *
   * DB      = Tiaty East
   * GeoJSON = Tiaty
   *
   * This alias is ONLY used for reconciliation.
   * It does NOT modify the database.
   */
  if (normalized === "tiaty east") {
    return "tiaty";
  }

  return normalized;
}

function safeValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(safeValue);
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      output[key] = safeValue(item);
    }

    return output;
  }

  return value;
}

function safeJson(value: unknown): string {
  return JSON.stringify(safeValue(value), null, 2);
}

function property(
  feature: GeoFeature,
  names: string[],
): unknown {
  const props = feature.properties ?? {};

  for (const wanted of names) {
    if (wanted in props) {
      return props[wanted];
    }
  }

  const normalizedKeys = new Map<string, string>();

  for (const key of Object.keys(props)) {
    normalizedKeys.set(
      key.toLowerCase().replace(/[^a-z0-9]/g, ""),
      key,
    );
  }

  for (const wanted of names) {
    const normalizedWanted = wanted
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const actualKey = normalizedKeys.get(normalizedWanted);

    if (actualKey) {
      return props[actualKey];
    }
  }

  return null;
}

function getGeoCounty(feature: GeoFeature): string {
  return text(
    property(feature, [
      "county",
      "County",
      "COUNTY",
      "county_name",
      "countyName",
    ]),
  );
}

function getGeoSubCounty(feature: GeoFeature): string {
  return text(
    property(feature, [
      "subcounty",
      "SubCounty",
      "SUBCOUNTY",
      "sub_county",
      "subCounty",
      "subcounty_name",
      "subCountyName",
    ]),
  );
}

function getGeoWard(feature: GeoFeature): string {
  return text(
    property(feature, [
      "ward",
      "Ward",
      "WARD",
      "ward_name",
      "wardName",
    ]),
  );
}

function getGeoGid(feature: GeoFeature): unknown {
  return property(feature, [
    "gid",
    "GID",
    "id",
    "ID",
  ]);
}

function getGeoCuid(feature: GeoFeature): unknown {
  return property(feature, [
    "cuid",
    "CUID",
    "county_uid",
    "countyUid",
  ]);
}

function getGeoScuid(feature: GeoFeature): unknown {
  return property(feature, [
    "scuid",
    "SCUID",
    "subcounty_uid",
    "subCountyUid",
  ]);
}

function getGeoProperties(
  feature: GeoFeature,
): Record<string, unknown> {
  return feature.properties ?? {};
}

async function getTableColumns(
  tableName: string,
): Promise<ColumnInfo[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      table_name: string;
      column_name: string;
      data_type: string;
      udt_name: string;
    }>
  >`
    SELECT
      table_name,
      column_name,
      data_type,
      udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ORDER BY ordinal_position
  `;

  return rows.map((row) => ({
    tableName: row.table_name,
    columnName: row.column_name,
    dataType: row.data_type,
    udtName: row.udt_name,
  }));
}

async function getCandidateSourceColumns(
  tableName: string,
): Promise<ColumnInfo[]> {
  const columns = await getTableColumns(tableName);

  const candidates = [
    "gid",
    "cuid",
    "scuid",
    "sourceId",
    "sourceID",
    "sourceGid",
    "sourceGID",
    "sourceCuid",
    "sourceCUID",
    "sourceScuid",
    "sourceSCUID",
    "geoJsonId",
    "geojsonId",
    "code",
    "wardCode",
    "subCountyCode",
    "countyCode",
    "externalId",
    "externalID",
  ];

  const wanted = new Set(
    candidates.map((value) =>
      value.toLowerCase().replace(/[^a-z0-9]/g, ""),
    ),
  );

  return columns.filter((column) => {
    const normalized = column.columnName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    return wanted.has(normalized);
  });
}

function printGeoFeature(
  feature: GeoFeature,
  index: number,
): void {
  console.log(`\nGeoJSON feature #${index + 1}`);

  console.log(
    `gid       : ${text(getGeoGid(feature))}`,
  );

  console.log(
    `cuid      : ${text(getGeoCuid(feature))}`,
  );

  console.log(
    `scuid     : ${text(getGeoScuid(feature))}`,
  );

  console.log(
    `county    : ${getGeoCounty(feature)}`,
  );

  console.log(
    `subcounty : ${getGeoSubCounty(feature)}`,
  );

  console.log(
    `ward      : ${getGeoWard(feature)}`,
  );

  console.log(
    `normalized county    : ${normalizeName(getGeoCounty(feature))}`,
  );

  console.log(
    `normalized subcounty: ${controlledSubCountyNormalize(
      getGeoSubCounty(feature),
    )}`,
  );

  console.log(
    `normalized ward     : ${normalizeName(getGeoWard(feature))}`,
  );

  console.log(
    "All properties:",
  );

  console.log(
    safeJson(getGeoProperties(feature)),
  );
}

async function main(): Promise<void> {
  console.log("");
  console.log("============================================================");
  console.log("GEOGRAPHY FORENSIC AUDIT V15");
  console.log("Baringo / Tiaty East vs Tiaty Source Reconciliation");
  console.log("============================================================");
  console.log("");
  console.log("READ-ONLY.");
  console.log("NO DATABASE CHANGES WILL BE MADE.");
  console.log("");

  const geoPath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "kenya-wards-1450.geojson",
  );

  if (!fs.existsSync(geoPath)) {
    throw new Error(
      `GeoJSON file not found: ${geoPath}`,
    );
  }

  const raw = fs.readFileSync(
    geoPath,
    "utf8",
  );

  const geojson = JSON.parse(raw) as GeoJSON;

  const features = geojson.features ?? [];

  console.log("SECTION 1: SOURCE SUMMARY");
  console.log("--------------------------");

  console.log(
    `GeoJSON path: ${geoPath}`,
  );

  console.log(
    `GeoJSON features: ${features.length}`,
  );

  console.log("");

  console.log("SECTION 2: RAW GEOJSON PROPERTY KEYS");
  console.log("------------------------------------");

  const propertyKeySet = new Set<string>();

  for (const feature of features) {
    for (const key of Object.keys(feature.properties ?? {})) {
      propertyKeySet.add(key);
    }
  }

  console.log(
    `Distinct property keys: ${propertyKeySet.size}`,
  );

  console.log(
    [...propertyKeySet]
      .sort()
      .join(", "),
  );

  console.log("");

  console.log("SECTION 3: BARRINGO / TIATY SOURCE FEATURES");
  console.log("---------------------------------------------");

  const baringoTiatyFeatures = features.filter(
    (feature) => {
      const county = normalizeName(
        getGeoCounty(feature),
      );

      const subCounty = controlledSubCountyNormalize(
        getGeoSubCounty(feature),
      );

      return (
        county === "baringo" &&
        subCounty === "tiaty"
      );
    },
  );

  console.log(
    `Baringo/Tiaty GeoJSON features: ${baringoTiatyFeatures.length}`,
  );

  for (
    let i = 0;
    i < baringoTiatyFeatures.length;
    i++
  ) {
    printGeoFeature(
      baringoTiatyFeatures[i],
      i,
    );
  }

  console.log("");

  console.log("SECTION 4: EXACT GEOJSON WARD NAMES");
  console.log("-----------------------------------");

  const geoWardNames = baringoTiatyFeatures
    .map((feature) => getGeoWard(feature))
    .sort((a, b) => a.localeCompare(b));

  for (const wardName of geoWardNames) {
    console.log(
      `- ${wardName}`,
    );
  }

  console.log("");

  console.log("SECTION 5: DATABASE BARRINGO COUNTY");
  console.log("-----------------------------------");

  const baringo = await prisma.county.findMany({
    where: {
      name: {
        contains: "Baringo",
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `Baringo County rows: ${baringo.length}`,
  );

  for (const county of baringo) {
    console.log(
      `County ID ${county.id}: ${county.name}`,
    );
  }

  if (baringo.length === 0) {
    throw new Error(
      "Baringo County was not found in the database.",
    );
  }

  const baringoCountyId = baringo[0].id;

  console.log("");

  console.log("SECTION 6: DATABASE TIATY / TIATY EAST SUBCOUNTIES");
  console.log("------------------------------------------------");

  const tiatyCandidates =
    await prisma.subCounty.findMany({
      where: {
        countyId: baringoCountyId,
        OR: [
          {
            name: {
              contains: "Tiaty",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "East",
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        countyId: true,
        county: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

  console.log(
    `Candidate Baringo SubCounty rows: ${tiatyCandidates.length}`,
  );

  for (const subCounty of tiatyCandidates) {
    console.log(
      `SubCounty ID ${subCounty.id} | ${subCounty.name} | County ${subCounty.countyId} ${subCounty.county.name}`,
    );
  }

  console.log("");

  const exactTiatyEast = tiatyCandidates.filter(
    (row) =>
      normalizeName(row.name) ===
      "tiaty east",
  );

  const exactTiaty = tiatyCandidates.filter(
    (row) =>
      normalizeName(row.name) ===
      "tiaty",
  );

  console.log(
    `Exact normalized DB "Tiaty East" rows: ${exactTiatyEast.length}`,
  );

  console.log(
    `Exact normalized DB "Tiaty" rows: ${exactTiaty.length}`,
  );

  console.log("");

  console.log("SECTION 7: DATABASE WARDS FOR TIATY EAST");
  console.log("----------------------------------------");

  if (exactTiatyEast.length === 0) {
    console.log(
      "No DB SubCounty named Tiaty East was found.",
    );
  }

  let dbTiatyEastWards: DbWard[] = [];

  if (exactTiatyEast.length > 0) {
    const subCountyId =
      exactTiatyEast[0].id;

    dbTiatyEastWards =
      await prisma.ward.findMany({
        where: {
          subCountyId,
        },
        select: {
          id: true,
          name: true,
          countyId: true,
          county: {
            select: {
              name: true,
            },
          },
          subCountyId: true,
          subCounty: {
            select: {
              name: true,
            },
          },
          constituencyId: true,
          constituency: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      });

    console.log(
      `DB Tiaty East SubCounty ID: ${subCountyId}`,
    );

    console.log(
      `DB Tiaty East ward count: ${dbTiatyEastWards.length}`,
    );

    for (const ward of dbTiatyEastWards) {
      console.log("");
      console.log(
        `Ward ID          : ${ward.id}`,
      );
      console.log(
        `Ward name        : ${ward.name}`,
      );
      console.log(
        `County ID        : ${ward.countyId}`,
      );
      console.log(
        `County name      : ${ward.countyName}`,
      );
      console.log(
        `SubCounty ID     : ${ward.subCountyId}`,
      );
      console.log(
        `SubCounty name   : ${ward.subCountyName}`,
      );
      console.log(
        `Constituency ID  : ${ward.constituencyId}`,
      );
      console.log(
        `Constituency name: ${ward.constituencyName}`,
      );
    }
  }

  console.log("");

  console.log("SECTION 8: ONE-TO-ONE WARD RECONCILIATION");
  console.log("-----------------------------------------");

  const dbWardMap = new Map<string, DbWard>();

  for (const ward of dbTiatyEastWards) {
    const key = normalizeName(
      ward.name,
    );

    if (dbWardMap.has(key)) {
      console.log(
        `[DUPLICATE DB WARD NAME] ${key}`,
      );
    }

    dbWardMap.set(
      key,
      ward,
    );
  }

  const geoWardMap = new Map<
    string,
    GeoFeature
  >();

  for (const feature of baringoTiatyFeatures) {
    const key = normalizeName(
      getGeoWard(feature),
    );

    if (geoWardMap.has(key)) {
      console.log(
        `[DUPLICATE GEOJSON WARD NAME] ${key}`,
      );
    }

    geoWardMap.set(
      key,
      feature,
    );
  }

  const allWardKeys = new Set<string>([
    ...dbWardMap.keys(),
    ...geoWardMap.keys(),
  ]);

  let matchedWards = 0;
  let dbOnlyWards = 0;
  let geoOnlyWards = 0;

  for (const key of [...allWardKeys].sort()) {
    const dbWard = dbWardMap.get(key);
    const geoFeature = geoWardMap.get(key);

    if (dbWard && geoFeature) {
      matchedWards++;

      console.log("");
      console.log(
        `[MATCH] ${key}`,
      );

      console.log(
        `  DB   : ${dbWard.name} | ID ${dbWard.id}`,
      );

      console.log(
        `  GEO  : ${getGeoWard(geoFeature)} | gid ${text(getGeoGid(geoFeature))}`,
      );

      console.log(
        `  DB SubCounty : ${dbWard.subCountyName}`,
      );

      console.log(
        `  GEO SubCounty: ${getGeoSubCounty(geoFeature)}`,
      );

      console.log(
        `  DB County    : ${dbWard.countyName}`,
      );

      console.log(
        `  GEO County   : ${getGeoCounty(geoFeature)}`,
      );

      console.log(
        `  GEO scuid    : ${text(getGeoScuid(geoFeature))}`,
      );

      console.log(
        `  GEO cuid     : ${text(getGeoCuid(geoFeature))}`,
      );
    } else if (dbWard) {
      dbOnlyWards++;

      console.log("");
      console.log(
        `[DB ONLY] ${key}`,
      );

      console.log(
        `  DB Ward ID: ${dbWard.id}`,
      );

      console.log(
        `  DB Ward: ${dbWard.name}`,
      );
    } else if (geoFeature) {
      geoOnlyWards++;

      console.log("");
      console.log(
        `[GEOJSON ONLY] ${key}`,
      );

      console.log(
        `  GeoJSON Ward: ${getGeoWard(geoFeature)}`,
      );

      console.log(
        `  gid: ${text(getGeoGid(geoFeature))}`,
      );
    }
  }

  console.log("");

  console.log(
    `Matched wards : ${matchedWards}`,
  );

  console.log(
    `DB-only wards : ${dbOnlyWards}`,
  );

  console.log(
    `Geo-only wards: ${geoOnlyWards}`,
  );

  console.log("");

  console.log("SECTION 9: CONTROLLED SUBCOUNTY ALIAS TEST");
  console.log("------------------------------------------");

  console.log(
    `DB raw SubCounty name: ${
      exactTiatyEast.length > 0
        ? exactTiatyEast[0].name
        : "NOT FOUND"
    }`,
  );

  console.log(
    `GeoJSON raw SubCounty name: ${
      baringoTiatyFeatures.length > 0
        ? getGeoSubCounty(baringoTiatyFeatures[0])
        : "NOT FOUND"
    }`,
  );

  const dbAlias =
    exactTiatyEast.length > 0
      ? controlledSubCountyNormalize(
          exactTiatyEast[0].name,
        )
      : "";

  const geoAlias =
    baringoTiatyFeatures.length > 0
      ? controlledSubCountyNormalize(
          getGeoSubCounty(
            baringoTiatyFeatures[0],
          ),
        )
      : "";

  console.log(
    `Controlled DB identity : baringo|${dbAlias}`,
  );

  console.log(
    `Controlled GEO identity: baringo|${geoAlias}`,
  );

  console.log(
    `Alias reconciliation    : ${
      dbAlias === geoAlias
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log("");

  console.log("SECTION 10: SOURCE IDENTIFIER COMPARISON");
  console.log("----------------------------------------");

  const wardSourceColumns =
    await getCandidateSourceColumns(
      "Ward",
    );

  const subCountySourceColumns =
    await getCandidateSourceColumns(
      "SubCounty",
    );

  console.log(
    "Candidate Ward source columns:",
  );

  if (wardSourceColumns.length === 0) {
    console.log(
      "  None found.",
    );
  } else {
    for (const column of wardSourceColumns) {
      console.log(
        `  ${column.columnName} | ${column.dataType} | ${column.udtName}`,
      );
    }
  }

  console.log("");

  console.log(
    "Candidate SubCounty source columns:",
  );

  if (subCountySourceColumns.length === 0) {
    console.log(
      "  None found.",
    );
  } else {
    for (const column of subCountySourceColumns) {
      console.log(
        `  ${column.columnName} | ${column.dataType} | ${column.udtName}`,
      );
    }
  }

  console.log("");

  console.log(
    "IMPORTANT: Absence of source-ID columns is not an error.",
  );

  console.log(
    "The authoritative comparison can still be made using county/subcounty/ward identities.",
  );

  console.log("");

  console.log("SECTION 11: CHECK FOR OTHER TIATY / TIATY EAST RECORDS");
  console.log("-----------------------------------------------------");

  const allTiatyNames =
    await prisma.subCounty.findMany({
      where: {
        OR: [
          {
            name: {
              contains: "Tiaty",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "Tiaty East",
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        countyId: true,
        county: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          countyId: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

  console.log(
    `Total Tiaty/Tiaty East candidate SubCounty rows nationally: ${allTiatyNames.length}`,
  );

  for (const row of allTiatyNames) {
    console.log(
      `ID ${row.id} | ${row.name} | County ${row.countyId} ${row.county.name}`,
    );
  }

  console.log("");

  console.log("SECTION 12: COMPOSITE WARD UNIQUE CONSTRAINT");
  console.log("---------------------------------------------");

  const uniqueIndexes =
    await prisma.$queryRaw<
      Array<{
        index_name: string;
        is_unique: boolean;
        column_count: number;
        index_definition: string;
      }>
    >`
      SELECT
        i.relname AS index_name,
        ix.indisunique AS is_unique,
        ix.indnkeyatts::int AS column_count,
        pg_get_indexdef(ix.indexrelid) AS index_definition
      FROM pg_index ix
      JOIN pg_class i
        ON i.oid = ix.indexrelid
      JOIN pg_class t
        ON t.oid = ix.indrelid
      JOIN pg_namespace n
        ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'Ward'
        AND ix.indisunique = true
      ORDER BY i.relname
    `;

  for (const index of uniqueIndexes) {
    console.log("");
    console.log(
      `Index: ${index.index_name}`,
    );

    console.log(
      `Unique: ${index.is_unique}`,
    );

    console.log(
      `Key columns: ${index.column_count}`,
    );

    console.log(
      `Definition: ${index.index_definition}`,
    );
  }

  const correctCompositeIndex =
    uniqueIndexes.find(
      (index) =>
        index.index_name ===
        "Ward_constituencyId_subCountyId_name_key",
    );

  console.log("");

  console.log(
    `Expected composite Ward unique index found: ${
      correctCompositeIndex
        ? "YES"
        : "NO"
    }`,
  );

  console.log("");

  console.log("SECTION 13: KISII CONTROL TEST");
  console.log("--------------------------------");

  const kisiiCounty =
    await prisma.county.findFirst({
      where: {
        name: {
          equals: "Kisii",
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

  let kisiiDbCentralCount = 0;

  if (kisiiCounty) {
    const kisiiWards =
      await prisma.ward.findMany({
        where: {
          countyId: kisiiCounty.id,
        },
        select: {
          id: true,
          name: true,
        },
      });

    kisiiDbCentralCount =
      kisiiWards.filter(
        (ward) =>
          normalizeName(ward.name) ===
          "kisii central ward",
      ).length;
  }

  const kisiiGeoCentral =
    features.filter(
      (feature) =>
        normalizeName(
          getGeoCounty(feature),
        ) === "kisii" &&
        normalizeName(
          getGeoWard(feature),
        ) === "kisii central ward",
    );

  console.log(
    `Kisii Central Ward DB rows      : ${kisiiDbCentralCount}`,
  );

  console.log(
    `Kisii Central Ward GeoJSON rows : ${kisiiGeoCentral.length}`,
  );

  console.log(
    `Kisii control test              : ${
      kisiiDbCentralCount === 2 &&
      kisiiGeoCentral.length === 2
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log("");

  console.log("SECTION 14: FINAL V15 ASSESSMENT");
  console.log("--------------------------------");

  const wardNamesMatch =
    matchedWards === 7 &&
    dbOnlyWards === 0 &&
    geoOnlyWards === 0;

  const aliasMatches =
    dbAlias !== "" &&
    geoAlias !== "" &&
    dbAlias === geoAlias;

  const sourceCountMatches =
    baringoTiatyFeatures.length === 7 &&
    dbTiatyEastWards.length === 7;

  const uniqueIndexPresent =
    Boolean(correctCompositeIndex);

  const kisiiControlPass =
    kisiiDbCentralCount === 2 &&
    kisiiGeoCentral.length === 2;

  console.log(
    `Seven GeoJSON Baringo/Tiaty wards: ${
      baringoTiatyFeatures.length
    }`,
  );

  console.log(
    `Seven DB Baringo/Tiaty East wards: ${
      dbTiatyEastWards.length
    }`,
  );

  console.log(
    `Ward one-to-one reconciliation: ${
      wardNamesMatch
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `Controlled Tiaty alias reconciliation: ${
      aliasMatches
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `Ward count reconciliation: ${
      sourceCountMatches
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `Composite Ward unique index: ${
      uniqueIndexPresent
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `Kisii Central control test: ${
      kisiiControlPass
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log("");

  if (
    wardNamesMatch &&
    aliasMatches &&
    sourceCountMatches &&
    uniqueIndexPresent &&
    kisiiControlPass
  ) {
    console.log(
      "V15 CONCLUSION: Tiaty East -> Tiaty is a naming reconciliation, not a missing/extra ward problem.",
    );

    console.log(
      "NO DATABASE REPAIR SHOULD BE PERFORMED BY THIS AUDIT.",
    );

    console.log(
      "The seven DB wards and seven GeoJSON wards reconcile one-to-one.",
    );

    console.log(
      "The database should only be renamed or mapped after an explicit repair decision.",
    );
  } else {
    console.log(
      "V15 CONCLUSION: REVIEW REQUIRED.",
    );

    console.log(
      "Do NOT modify the database from this audit.",
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("V15 COMPLETE");
  console.log("READ-ONLY: NO DATABASE CHANGES WERE MADE.");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("V15 AUDIT FAILED");
    console.error("");
    console.error(
      error instanceof Error
        ? error.message
        : error,
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });