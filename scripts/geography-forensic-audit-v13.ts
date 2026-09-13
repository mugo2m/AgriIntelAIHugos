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

const prisma = new PrismaClient({ adapter });

type GeoFeature = {
  properties?: Record<string, unknown>;
};

type IdentityRecord = {
  county: string;
  subCounty: string;
  constituency: string;
  ward: string;
};

type ConstituencyWardRecord = {
  county: string;
  constituency: string;
  ward: string;
  subCounty: string;
};

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

/**
 * Strong normalization used only for comparison.
 *
 * This does NOT modify the database.
 *
 * Examples:
 *   Murang'a       -> muranga
 *   Muranga       -> muranga
 *   Trans Mara     -> transmara
 *   Transmara      -> transmara
 *   Lang'ata       -> langata
 *   Langata        -> langata
 *   Mukurwe-ini    -> mukurweini
 *   Mukurwe ini    -> mukurweini
 *   Sub County     -> removed from the administrative name
 */
function normalizeName(value: unknown): string {
  let s = text(value).toLowerCase();

  s = s
    .replace(/[’'`]/g, "")
    .replace(/[-–—]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  s = s.replace(/\bsub\s+county\b/g, "");
  s = s.replace(/\bsubcounty\b/g, "");
  s = s.replace(/\bcounty\b/g, "");

  s = s
    .replace(/[.,/()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  s = s.replace(/\s+/g, "");

  return s;
}

function rawName(value: unknown): string {
  return text(value);
}

function getProperty(
  feature: GeoFeature,
  names: string[]
): string {
  const props = feature.properties ?? {};

  for (const name of names) {
    if (props[name] !== undefined && props[name] !== null) {
      const value = text(props[name]);
      if (value) return value;
    }
  }

  return "";
}

function featureCounty(feature: GeoFeature): string {
  return getProperty(feature, [
    "county",
    "County",
    "COUNTY",
    "county_name",
    "CountyName",
    "countyName",
    "COUNTY_NAM",
  ]);
}

function featureSubCounty(feature: GeoFeature): string {
  return getProperty(feature, [
    "subcounty",
    "SubCounty",
    "SUBCOUNTY",
    "sub_county",
    "SubCountyName",
    "subCountyName",
    "subcounty_name",
    "subcountyname",
  ]);
}

function featureConstituency(feature: GeoFeature): string {
  return getProperty(feature, [
    "constituency",
    "Constituency",
    "CONSTITUENCY",
    "constituency_name",
    "ConstituencyName",
    "constituencyName",
  ]);
}

function featureWard(feature: GeoFeature): string {
  return getProperty(feature, [
    "ward",
    "Ward",
    "WARD",
    "ward_name",
    "WardName",
    "wardName",
    "NAME",
    "name",
  ]);
}

function featureGid(feature: GeoFeature): string {
  return getProperty(feature, [
    "gid",
    "GID",
    "id",
    "ID",
  ]);
}

function identityKey(
  county: string,
  subCounty: string,
  ward: string
): string {
  return [
    normalizeName(county),
    normalizeName(subCounty),
    normalizeName(ward),
  ].join("|");
}

function constituencyKey(
  county: string,
  constituency: string
): string {
  return [
    normalizeName(county),
    normalizeName(constituency),
  ].join("|");
}

function constituencyWardKey(
  county: string,
  constituency: string,
  ward: string
): string {
  return [
    normalizeName(county),
    normalizeName(constituency),
    normalizeName(ward),
  ].join("|");
}

function addToMap(
  map: Map<string, IdentityRecord[]>,
  key: string,
  value: IdentityRecord
) {
  const existing = map.get(key) ?? [];
  existing.push(value);
  map.set(key, existing);
}

function printSeparator() {
  console.log("=".repeat(100));
}

function printHeader(title: string) {
  console.log("");
  printSeparator();
  console.log(title);
  printSeparator();
}

async function main() {
  console.log("");
  console.log("READ-ONLY GEOGRAPHY FORENSIC AUDIT V13");
  console.log("NO DATABASE CHANGES WILL BE MADE.");
  console.log("");
  console.log(
    "Purpose: stronger normalization, ward reconciliation, and full constituency reconciliation."
  );

  const geoPath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "kenya-wards-1450.geojson"
  );

  if (!fs.existsSync(geoPath)) {
    throw new Error(`GeoJSON not found: ${geoPath}`);
  }

  const geoJson = JSON.parse(
    fs.readFileSync(geoPath, "utf8")
  );

  const features: GeoFeature[] = Array.isArray(geoJson.features)
    ? geoJson.features
    : [];

  /*
   * --------------------------------------------------------------------------
   * LOAD DATABASE
   * --------------------------------------------------------------------------
   */

  const counties = await prisma.county.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const subCounties = await prisma.subCounty.findMany({
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
    orderBy: {
      id: "asc",
    },
  });

  const constituencies = await prisma.constituency.findMany({
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
      constituencyId: true,
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
        },
      },
      constituency: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * SECTION 1
   * SOURCE SUMMARY
   * --------------------------------------------------------------------------
   */

  printHeader("SECTION 1: SOURCE SUMMARY");

  console.log(`GeoJSON features: ${features.length}`);
  console.log(`DB counties: ${counties.length}`);
  console.log(`DB subcounties: ${subCounties.length}`);
  console.log(`DB constituencies: ${constituencies.length}`);
  console.log(`DB wards: ${wards.length}`);

  /*
   * --------------------------------------------------------------------------
   * BUILD GEOJSON RECORDS
   * --------------------------------------------------------------------------
   */

  const geoRecords: IdentityRecord[] = [];

  for (const feature of features) {
    geoRecords.push({
      county: featureCounty(feature),
      subCounty: featureSubCounty(feature),
      constituency: featureConstituency(feature),
      ward: featureWard(feature),
    });
  }

  /*
   * --------------------------------------------------------------------------
   * SECTION 2
   * NORMALIZED SUBCOUNTIES
   * --------------------------------------------------------------------------
   */

  printHeader("SECTION 2: STRONG NORMALIZATION — SUBCOUNTIES");

  const geoSubCountyMap = new Map<string, Set<string>>();
  const dbSubCountyMap = new Map<string, Set<string>>();

  for (const record of geoRecords) {
    const key = [
      normalizeName(record.county),
      normalizeName(record.subCounty),
    ].join("|");

    const raw = `${rawName(record.county)} | ${rawName(record.subCounty)}`;

    const values = geoSubCountyMap.get(key) ?? new Set<string>();
    values.add(raw);
    geoSubCountyMap.set(key, values);
  }

  for (const row of subCounties) {
    const key = [
      normalizeName(row.county.name),
      normalizeName(row.name),
    ].join("|");

    const raw = `${row.county.name} | ${row.name}`;

    const values = dbSubCountyMap.get(key) ?? new Set<string>();
    values.add(raw);
    dbSubCountyMap.set(key, values);
  }

  console.log(
    `GeoJSON normalized SubCounty identities: ${geoSubCountyMap.size}`
  );

  console.log(
    `DB normalized SubCounty identities: ${dbSubCountyMap.size}`
  );

  const subCountyOnlyGeo = [...geoSubCountyMap.keys()].filter(
    (key) => !dbSubCountyMap.has(key)
  );

  const subCountyOnlyDb = [...dbSubCountyMap.keys()].filter(
    (key) => !geoSubCountyMap.has(key)
  );

  console.log(
    `GeoJSON-only normalized SubCounty identities: ${subCountyOnlyGeo.length}`
  );

  console.log(
    `DB-only normalized SubCounty identities: ${subCountyOnlyDb.length}`
  );

  if (subCountyOnlyGeo.length > 0) {
    console.log("");
    console.log("GeoJSON-only:");

    for (const key of subCountyOnlyGeo) {
      console.log(`  ${key}`);
    }
  }

  if (subCountyOnlyDb.length > 0) {
    console.log("");
    console.log("DB-only:");

    for (const key of subCountyOnlyDb) {
      console.log(`  ${key}`);
    }
  }

  /*
   * --------------------------------------------------------------------------
   * SECTION 3
   * NORMALIZED WARD IDENTITY
   * --------------------------------------------------------------------------
   */

  printHeader(
    "SECTION 3: STRONG NORMALIZATION — COUNTY + SUBCOUNTY + WARD"
  );

  const geoWardMap = new Map<string, IdentityRecord[]>();
  const dbWardMap = new Map<string, IdentityRecord[]>();

  for (const record of geoRecords) {
    addToMap(
      geoWardMap,
      identityKey(
        record.county,
        record.subCounty,
        record.ward
      ),
      record
    );
  }

  for (const row of wards) {
    const record: IdentityRecord = {
      county: row.county.name,
      subCounty: row.subCounty?.name ?? "",
      constituency: row.constituency.name,
      ward: row.name,
    };

    addToMap(
      dbWardMap,
      identityKey(
        record.county,
        record.subCounty,
        record.ward
      ),
      record
    );
  }

  console.log(
    `GeoJSON normalized ward identities: ${geoWardMap.size}`
  );

  console.log(
    `DB normalized ward identities: ${dbWardMap.size}`
  );

  const duplicateGeoWardKeys = [...geoWardMap.entries()].filter(
    ([, rows]) => rows.length > 1
  );

  const duplicateDbWardKeys = [...dbWardMap.entries()].filter(
    ([, rows]) => rows.length > 1
  );

  console.log(
    `GeoJSON duplicate authoritative ward identities: ${duplicateGeoWardKeys.length}`
  );

  console.log(
    `DB duplicate authoritative ward identities: ${duplicateDbWardKeys.length}`
  );

  /*
   * --------------------------------------------------------------------------
   * SECTION 4
   * 32 / 32 WARD DIFFERENCES
   * --------------------------------------------------------------------------
   */

  printHeader(
    "SECTION 4: WARD RECONCILIATION AFTER STRONG NORMALIZATION"
  );

  const dbOnlyWardKeys = [...dbWardMap.keys()].filter(
    (key) => !geoWardMap.has(key)
  );

  const geoOnlyWardKeys = [...geoWardMap.keys()].filter(
    (key) => !dbWardMap.has(key)
  );

  console.log(
    `DB-only ward identities: ${dbOnlyWardKeys.length}`
  );

  console.log(
    `GeoJSON-only ward identities: ${geoOnlyWardKeys.length}`
  );

  if (dbOnlyWardKeys.length > 0) {
    console.log("");
    console.log("DB-only ward identities:");

    for (const key of dbOnlyWardKeys) {
      const rows = dbWardMap.get(key) ?? [];

      for (const row of rows) {
        console.log(
          `  ${row.county} | ${row.subCounty} | ${row.ward}`
        );
      }
    }
  }

  if (geoOnlyWardKeys.length > 0) {
    console.log("");
    console.log("GeoJSON-only ward identities:");

    for (const key of geoOnlyWardKeys) {
      const rows = geoWardMap.get(key) ?? [];

      for (const row of rows) {
        console.log(
          `  ${row.county} | ${row.subCounty} | ${row.ward}`
        );
      }
    }
  }

  /*
   * --------------------------------------------------------------------------
   * SECTION 5
   * DIRECT WARD NAME VARIANT MATCHING
   * --------------------------------------------------------------------------
   *
   * If a DB-only identity and GeoJSON-only identity share the same county and
   * normalized ward name but differ only in SubCounty normalization, flag them.
   */

  printHeader(
    "SECTION 5: POSSIBLE WARD NAME / SUBCOUNTY NORMALIZATION PAIRS"
  );

  const dbUnmatchedRows: IdentityRecord[] = [];

  for (const key of dbOnlyWardKeys) {
    for (const row of dbWardMap.get(key) ?? []) {
      dbUnmatchedRows.push(row);
    }
  }

  const geoUnmatchedRows: IdentityRecord[] = [];

  for (const key of geoOnlyWardKeys) {
    for (const row of geoWardMap.get(key) ?? []) {
      geoUnmatchedRows.push(row);
    }
  }

  const possiblePairs: Array<{
    db: IdentityRecord;
    geo: IdentityRecord;
  }> = [];

  for (const dbRow of dbUnmatchedRows) {
    const dbCounty = normalizeName(dbRow.county);
    const dbWard = normalizeName(dbRow.ward);

    for (const geoRow of geoUnmatchedRows) {
      if (
        normalizeName(geoRow.county) === dbCounty &&
        normalizeName(geoRow.ward) === dbWard
      ) {
        possiblePairs.push({
          db: dbRow,
          geo: geoRow,
        });
      }
    }
  }

  console.log(
    `Possible county + ward matches with SubCounty naming differences: ${possiblePairs.length}`
  );

  for (const pair of possiblePairs) {
    console.log("");
    console.log(
      `DB:   ${pair.db.county} | ${pair.db.subCounty} | ${pair.db.ward}`
    );
    console.log(
      `GEO:  ${pair.geo.county} | ${pair.geo.subCounty} | ${pair.geo.ward}`
    );
  }

  /*
   * --------------------------------------------------------------------------
   * SECTION 6
   * CONSTITUENCY INVENTORY
   * --------------------------------------------------------------------------
   */

  printHeader("SECTION 6: CONSTITUENCY INVENTORY");

  const geoConstituencyMap = new Map<
    string,
    {
      county: string;
      constituencyNames: Set<string>;
      wards: Set<string>;
    }
  >();

  for (const row of geoRecords) {
    const key = constituencyKey(
      row.county,
      row.constituency
    );

    const existing = geoConstituencyMap.get(key) ?? {
      county: row.county,
      constituencyNames: new Set<string>(),
      wards: new Set<string>(),
    };

    existing.constituencyNames.add(row.constituency);
    existing.wards.add(
      normalizeName(row.ward)
    );

    geoConstituencyMap.set(key, existing);
  }

  const dbConstituencyMap = new Map<
    string,
    {
      county: string;
      constituency: string;
      constituencyId: number;
      wards: Set<string>;
    }
  >();

  for (const row of constituencies) {
    const key = constituencyKey(
      row.county.name,
      row.name
    );

    dbConstituencyMap.set(key, {
      county: row.county.name,
      constituency: row.name,
      constituencyId: row.id,
      wards: new Set<string>(),
    });
  }

  for (const row of wards) {
    const key = constituencyKey(
      row.county.name,
      row.constituency.name
    );

    const existing = dbConstituencyMap.get(key);

    if (existing) {
      existing.wards.add(
        normalizeName(row.name)
      );
    }
  }

  console.log(
    `DB constituency identities: ${dbConstituencyMap.size}`
  );

  console.log(
    `GeoJSON constituency identities: ${geoConstituencyMap.size}`
  );

  /*
   * --------------------------------------------------------------------------
   * SECTION 7
   * CONSTITUENCY MISSING / EXTRA
   * --------------------------------------------------------------------------
   */

  printHeader(
    "SECTION 7: CONSTITUENCY IDENTITY RECONCILIATION"
  );

  const dbOnlyConstituencies = [
    ...dbConstituencyMap.keys(),
  ].filter(
    (key) => !geoConstituencyMap.has(key)
  );

  const geoOnlyConstituencies = [
    ...geoConstituencyMap.keys(),
  ].filter(
    (key) => !dbConstituencyMap.has(key)
  );

  console.log(
    `DB-only constituency identities: ${dbOnlyConstituencies.length}`
  );

  console.log(
    `GeoJSON-only constituency identities: ${geoOnlyConstituencies.length}`
  );

  if (dbOnlyConstituencies.length > 0) {
    console.log("");
    console.log("DB-only constituencies:");

    for (const key of dbOnlyConstituencies) {
      const row = dbConstituencyMap.get(key);

      if (!row) continue;

      console.log(
        `  ID ${row.constituencyId} | ${row.county} | ${row.constituency} | wards=${row.wards.size}`
      );
    }
  }

  if (geoOnlyConstituencies.length > 0) {
    console.log("");
    console.log("GeoJSON-only constituencies:");

    for (const key of geoOnlyConstituencies) {
      const row = geoConstituencyMap.get(key);

      if (!row) continue;

      console.log(
        `  ${row.county} | ${[...row.constituencyNames].join(" / ")} | wards=${row.wards.size}`
      );
    }
  }

  /*
   * --------------------------------------------------------------------------
   * SECTION 8
   * CONSTITUENCY WARD-SET COMPARISON
   * --------------------------------------------------------------------------
   */

  printHeader(
    "SECTION 8: CONSTITUENCY WARD-SET RECONCILIATION"
  );

  let constituencyWardMismatchCount = 0;

  for (const [key, dbCon] of dbConstituencyMap.entries()) {
    const geoCon = geoConstituencyMap.get(key);

    if (!geoCon) {
      continue;
    }

    const dbWards = dbCon.wards;
    const geoWards = geoCon.wards;

    const dbOnly = [...dbWards].filter(
      (ward) => !geoWards.has(ward)
    );

    const geoOnly = [...geoWards].filter(
      (ward) => !dbWards.has(ward)
    );

    if (dbOnly.length > 0 || geoOnly.length > 0) {
      constituencyWardMismatchCount++;

      console.log("");
      console.log(
        `${dbCon.county} | ${dbCon.constituency} | DB ID ${dbCon.constituencyId}`
      );

      console.log(
        `  DB ward count: ${dbWards.size}`
      );

      console.log(
        `  GeoJSON ward count: ${geoWards.size}`
      );

      if (dbOnly.length > 0) {
        console.log(
          `  DB-only wards: ${dbOnly.join(", ")}`
        );
      }

      if (geoOnly.length > 0) {
        console.log(
          `  GeoJSON-only wards: ${geoOnly.join(", ")}`
        );
      }
    }
  }

  console.log(
    `Constituencies with ward-set differences: ${constituencyWardMismatchCount}`
  );

  /*
   * --------------------------------------------------------------------------
   * SECTION 9
   * CONSTITUENCY WARD COUNTS
   * --------------------------------------------------------------------------
   */

  printHeader(
    "SECTION 9: CONSTITUENCY WARD COUNTS"
  );

  const dbConstituenciesWithZeroWards = [
    ...dbConstituencyMap.values(),
  ].filter(
    (row) => row.wards.size === 0
  );

  const geoConstituenciesWithZeroWards = [
    ...geoConstituencyMap.values(),
  ].filter(
    (row) => row.wards.size === 0
  );

  console.log(
    `DB constituencies with zero wards: ${dbConstituenciesWithZeroWards.length}`
  );

  console.log(
    `GeoJSON constituencies with zero wards: ${geoConstituenciesWithZeroWards.length}`
  );

  if (dbConstituenciesWithZeroWards.length > 0) {
    console.log("");
    console.log("DB constituencies with zero wards:");

    for (const row of dbConstituenciesWithZeroWards) {
      console.log(
        `  ID ${row.constituencyId} | ${row.county} | ${row.constituency}`
      );
    }
  }

  /*
   * --------------------------------------------------------------------------
   * SECTION 10
   * CONSTITUENCY NAME COLLISIONS
   * --------------------------------------------------------------------------
   */

  printHeader(
    "SECTION 10: CONSTITUENCY NAME COLLISIONS"
  );

  const dbConstituencyNameGroups = new Map<
    string,
    typeof constituencies
  >();

  for (const row of constituencies) {
    const key = normalizeName(row.name);

    const existing =
      dbConstituencyNameGroups.get(key) ?? [];

    existing.push(row);
    dbConstituencyNameGroups.set(key, existing);
  }

  const duplicateConstituencyNames = [
    ...dbConstituencyNameGroups.entries(),
  ].filter(
    ([, rows]) => rows.length > 1
  );

  console.log(
    `Global duplicate normalized constituency names: ${duplicateConstituencyNames.length}`
  );

  for (const [name, rows] of duplicateConstituencyNames) {
    console.log("");
    console.log(`Normalized name: ${name}`);

    for (const row of rows) {
      console.log(
        `  ID ${row.id} | ${row.county.name} | ${row.name}`
      );
    }
  }

  /*
   * --------------------------------------------------------------------------
   * SECTION 11
   * ALL CONSTITUENCIES WITH THEIR WARD STRUCTURE
   * --------------------------------------------------------------------------
   */

  printHeader(
    "SECTION 11: COMPLETE CONSTITUENCY STRUCTURE SUMMARY"
  );

  for (const row of constituencies) {
    const key = constituencyKey(
      row.county.name,
      row.name
    );

    const geo = geoConstituencyMap.get(key);
    const db = dbConstituencyMap.get(key);

    console.log(
      `ID ${row.id} | ${row.county.name} | ${row.name} | DB wards=${db?.wards.size ?? 0} | GEO wards=${geo?.wards.size ?? 0} | GEO match=${geo ? "YES" : "NO"}`
    );
  }

  /*
   * --------------------------------------------------------------------------
   * SECTION 12
   * MULTI-CONSTITUENCY SUBCOUNTIES
   * --------------------------------------------------------------------------
   */

  printHeader(
    "SECTION 12: MULTI-CONSTITUENCY SUBCOUNTIES"
  );

  const subCountyConstituencyMap = new Map<
    number,
    Map<number, Set<number>>
  >();

  for (const row of wards) {
    if (row.subCountyId === null) {
      continue;
    }

    const constituencyMap =
      subCountyConstituencyMap.get(
        row.subCountyId
      ) ??
      new Map<number, Set<number>>();

    const wardsForConstituency =
      constituencyMap.get(
        row.constituencyId
      ) ??
      new Set<number>();

    wardsForConstituency.add(row.id);

    constituencyMap.set(
      row.constituencyId,
      wardsForConstituency
    );

    subCountyConstituencyMap.set(
      row.subCountyId,
      constituencyMap
    );
  }

  const multiConstituencySubCounties = [
    ...subCountyConstituencyMap.entries(),
  ].filter(
    ([, constituencyMap]) =>
      constituencyMap.size > 1
  );

  console.log(
    `SubCounties associated with multiple Constituencies: ${multiConstituencySubCounties.length}`
  );

  for (const [
    subCountyId,
    constituencyMap,
  ] of multiConstituencySubCounties) {
    const subCounty = subCounties.find(
      (row) => row.id === subCountyId
    );

    console.log("");
    console.log(
      `SubCounty ${subCountyId} | ${subCounty?.county.name ?? ""} | ${subCounty?.name ?? ""}`
    );

    for (const [
      constituencyId,
      wardIds,
    ] of constituencyMap.entries()) {
      const constituency =
        constituencies.find(
          (row) => row.id === constituencyId
        );

      console.log(
        `  Constituency ${constituencyId} | ${constituency?.name ?? ""} | wards=${wardIds.size}`
      );
    }
  }

  /*
   * --------------------------------------------------------------------------
   * SECTION 13
   * KISII CENTRAL WARD CONTROL TEST
   * --------------------------------------------------------------------------
   */

  printHeader(
    "SECTION 13: KISII CENTRAL WARD CONTROL TEST"
  );

  const kisiiCentral = wards.filter(
    (row) =>
      normalizeName(row.county.name) === "kisii" &&
      normalizeName(row.name) ===
        "kisiicentral"
  );

  console.log(
    `Kisii Central Ward DB rows: ${kisiiCentral.length}`
  );

  for (const row of kisiiCentral) {
    const key = identityKey(
      row.county.name,
      row.subCounty?.name ?? "",
      row.name
    );

    const matches = geoWardMap.get(key) ?? [];

    console.log("");
    console.log(
      `Ward ${row.id} | ${row.county.name} | ${row.subCounty?.name} | ${row.name}`
    );

    console.log(
      `  GeoJSON authoritative matches: ${matches.length}`
    );

    for (const match of matches) {
      console.log(
        `  GEO: ${match.county} | ${match.subCounty} | ${match.ward}`
      );
    }
  }

  /*
   * --------------------------------------------------------------------------
   * SECTION 14
   * CROSS-COUNTY CONSISTENCY
   * --------------------------------------------------------------------------
   */

  printHeader(
    "SECTION 14: CROSS-COUNTY CONSISTENCY"
  );

  const countyMismatchRows = wards.filter(
    (row) =>
      row.subCounty &&
      row.subCounty.countyId !== row.countyId
  );

  const constituencyCountyMismatchRows =
    wards.filter(
      (row) =>
        row.constituency.countyId !==
        row.countyId
    );

  console.log(
    `Ward/SubCounty county mismatches: ${countyMismatchRows.length}`
  );

  console.log(
    `Ward/Constituency county mismatches: ${constituencyCountyMismatchRows.length}`
  );

  if (countyMismatchRows.length > 0) {
    for (const row of countyMismatchRows) {
      console.log(
        `  Ward ${row.id} | ${row.name} | Ward county=${row.county.name} | SubCounty county=${row.subCounty?.county.name}`
      );
    }
  }

  if (
    constituencyCountyMismatchRows.length > 0
  ) {
    for (const row of constituencyCountyMismatchRows) {
      console.log(
        `  Ward ${row.id} | ${row.name} | Ward county=${row.county.name} | Constituency county=${row.constituency.county.name}`
      );
    }
  }

  /*
   * --------------------------------------------------------------------------
   * SECTION 15
   * SOURCE / DB TOTALS
   * --------------------------------------------------------------------------
   */

  printHeader(
    "SECTION 15: FINAL STRUCTURAL TOTALS"
  );

  console.log(
    `Counties: DB=${counties.length}`
  );

  console.log(
    `SubCounties: DB=${subCounties.length} | GEO normalized=${geoSubCountyMap.size}`
  );

  console.log(
    `Constituencies: DB=${constituencies.length} | GEO normalized=${geoConstituencyMap.size}`
  );

  console.log(
    `Wards: DB=${wards.length} | GEO=${features.length}`
  );

  console.log(
    `DB authoritative ward identities: ${dbWardMap.size}`
  );

  console.log(
    `GeoJSON authoritative ward identities: ${geoWardMap.size}`
  );

  /*
   * --------------------------------------------------------------------------
   * SECTION 16
   * FINAL ISSUE CLASSIFICATION
   * --------------------------------------------------------------------------
   */

  printHeader(
    "SECTION 16: V13 ISSUE CLASSIFICATION"
  );

  const issues: string[] = [];

  if (features.length !== 1450) {
    issues.push(
      `[SOURCE] Expected 1450 GeoJSON features, found ${features.length}`
    );
  }

  if (counties.length !== 47) {
    issues.push(
      `[COUNTY] Expected 47 DB counties, found ${counties.length}`
    );
  }

  if (subCounties.length !== 301) {
    issues.push(
      `[SUBCOUNTY] Expected 301 DB SubCounties, found ${subCounties.length}`
    );
  }

  if (wards.length !== 1450) {
    issues.push(
      `[WARD] Expected 1450 DB wards, found ${wards.length}`
    );
  }

  if (geoWardMap.size !== 1450) {
    issues.push(
      `[SOURCE_WARD_IDENTITY] Expected 1450 normalized GeoJSON ward identities, found ${geoWardMap.size}`
    );
  }

  if (dbWardMap.size !== 1450) {
    issues.push(
      `[DB_WARD_IDENTITY] Expected 1450 normalized DB ward identities, found ${dbWardMap.size}`
    );
  }

  if (duplicateGeoWardKeys.length > 0) {
    issues.push(
      `[SOURCE_DUPLICATE] GeoJSON contains ${duplicateGeoWardKeys.length} duplicate authoritative ward identities`
    );
  }

  if (duplicateDbWardKeys.length > 0) {
    issues.push(
      `[DB_DUPLICATE] DB contains ${duplicateDbWardKeys.length} duplicate authoritative ward identities`
    );
  }

  if (dbOnlyWardKeys.length > 0) {
    issues.push(
      `[WARD_RECONCILIATION] ${dbOnlyWardKeys.length} DB ward identities require source reconciliation`
    );
  }

  if (geoOnlyWardKeys.length > 0) {
    issues.push(
      `[WARD_RECONCILIATION] ${geoOnlyWardKeys.length} GeoJSON ward identities require DB reconciliation`
    );
  }

  if (dbOnlyConstituencies.length > 0) {
    issues.push(
      `[CONSTITUENCY_RECONCILIATION] ${dbOnlyConstituencies.length} DB constituency identities are not directly represented in GeoJSON`
    );
  }

  if (geoOnlyConstituencies.length > 0) {
    issues.push(
      `[CONSTITUENCY_RECONCILIATION] ${geoOnlyConstituencies.length} GeoJSON constituency identities are not directly represented in DB`
    );
  }

  if (constituencyWardMismatchCount > 0) {
    issues.push(
      `[CONSTITUENCY_WARDS] ${constituencyWardMismatchCount} constituencies have different normalized ward sets`
    );
  }

  if (
    dbConstituenciesWithZeroWards.length >
    0
  ) {
    issues.push(
      `[CONSTITUENCY_WARDS] ${dbConstituenciesWithZeroWards.length} DB constituencies have zero wards`
    );
  }

  if (
    geoConstituenciesWithZeroWards.length >
    0
  ) {
    issues.push(
      `[SOURCE_CONSTITUENCY_WARDS] ${geoConstituenciesWithZeroWards.length} GeoJSON constituencies have zero wards`
    );
  }

  if (countyMismatchRows.length > 0) {
    issues.push(
      `[COUNTY_INTEGRITY] ${countyMismatchRows.length} Ward/SubCounty county mismatches`
    );
  }

  if (
    constituencyCountyMismatchRows.length > 0
  ) {
    issues.push(
      `[COUNTY_INTEGRITY] ${constituencyCountyMismatchRows.length} Ward/Constituency county mismatches`
    );
  }

  console.log(
    `V13 issues requiring investigation: ${issues.length}`
  );

  if (issues.length === 0) {
    console.log("");
    console.log("V13 RESULT: PASS");
    console.log(
      "No unresolved structural geography differences were detected by this audit."
    );
  } else {
    console.log("");

    for (const issue of issues) {
      console.log(issue);
    }

    console.log("");
    console.log(
      "V13 RESULT: REVIEW REQUIRED"
    );

    console.log("");
    console.log(
      "IMPORTANT: This audit is read-only."
    );

    console.log(
      "No counties, subcounties, constituencies, wards, or relationships were modified."
    );
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V13 AUDIT FAILED:"
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });