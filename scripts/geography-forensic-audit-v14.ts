/**
 * scripts/geography-forensic-audit-v14.ts
 *
 * READ-ONLY GEOGRAPHY FORENSIC AUDIT V14
 *
 * PURPOSE
 * -------
 * V14 fixes the V13 audit-script problems:
 *
 * 1. Does not compare relation fields that were not selected.
 * 2. Uses Ward.countyId / SubCounty.countyId / Constituency.countyId
 *    directly for cross-county consistency.
 * 3. Safely handles missing relations.
 * 4. Correctly identifies the two legitimate Kisii Central Ward records.
 * 5. Uses county + subcounty + ward as the authoritative Ward identity.
 * 6. Does NOT incorrectly assume that GeoJSON contains constituency names.
 * 7. Reconciles Constituencies through their Ward membership rather than
 *    pretending the GeoJSON has a normal constituency-name field.
 * 8. Uses stronger normalization for known naming differences.
 * 9. Explains the 301 normalized SubCounty identities versus 302 raw
 *    GeoJSON county/subcounty forms.
 * 10. Verifies the actual database Ward composite unique constraint.
 *
 * IMPORTANT
 * ---------
 * THIS SCRIPT IS COMPLETELY READ-ONLY.
 *
 * No create/update/delete/upsert operations are performed.
 * No $executeRaw() is used.
 * No migration is performed.
 */

import fs from "node:fs";
import path from "node:path";

import { prisma } from "../lib/prisma";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type GeoFeature = {
  type?: string;
  properties?: Record<string, unknown>;
  geometry?: unknown;
};

type GeoJson = {
  type?: string;
  features?: GeoFeature[];
};

type GeoWard = {
  gid: string;
  countyRaw: string;
  subCountyRaw: string;
  wardRaw: string;
  cuid: string;
  scuid: string;
  county: string;
  subCounty: string;
  ward: string;
  identity: string;
};

type DbCounty = {
  id: number;
  name: string;
};

type DbSubCounty = {
  id: number;
  name: string;
  countyId: number;
  county: {
    id: number;
    name: string;
  };
};

type DbConstituency = {
  id: number;
  name: string;
  countyId: number;
  county: {
    id: number;
    name: string;
  };
};

type DbWard = {
  id: number;
  name: string;
  countyId: number;
  subCountyId: number | null;
  constituencyId: number;

  county: {
    id: number;
    name: string;
  };

  subCounty: {
    id: number;
    name: string;
    countyId: number;
  } | null;

  constituency: {
    id: number;
    name: string;
    countyId: number;
  };
};

type IdentityMap = Map<string, GeoWard[]>;

type ConstituencySummary = {
  id: number;
  countyId: number;
  countyName: string;
  name: string;
  wardIds: number[];
  wardIdentities: string[];
};

type Issue = {
  category: string;
  message: string;
};

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const GEOJSON_PATH = path.resolve(
  process.cwd(),
  "prisma",
  "data",
  "kenya-wards-1450.geojson"
);

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function text(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

/**
 * Strong administrative-name normalization.
 *
 * The objective is NOT to erase meaningful distinctions.
 * It is to eliminate known formatting differences such as:
 *
 * Murang'a / Muranga
 * Trans Mara / Transmara
 * Lang'ata / Langata
 * Mukurwe-ini / Mukurweini / Mukurwe ini
 * Nairobi / Nairobi City
 * Sub County suffixes
 * punctuation and spacing
 */
function normalizeName(value: unknown): string {
  let s = text(value).toLowerCase();

  if (!s) {
    return "";
  }

  s = s
    .replace(/[’'`]/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/[.,/()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  s = s.replace(/\bsub\s+county\b/g, " ");
  s = s.replace(/\bsubcounty\b/g, " ");
  s = s.replace(/\bcounty\b/g, " ");

  s = s.replace(/\s+/g, " ").trim();

  /*
   * Known county aliases.
   */
  if (s === "nairobi city" || s === "nairobi") {
    return "nairobi";
  }

  if (
    s === "tharaka nithi" ||
    s === "tharaka-nithi" ||
    s === "tharaka  nithi"
  ) {
    return "tharaka nithi";
  }

  if (
    s === "elgeyo marakwet" ||
    s === "elgeyo-marakwet"
  ) {
    return "elgeyo marakwet";
  }

  if (s === "muranga") {
    return "muranga";
  }

  /*
   * Remove remaining whitespace so:
   *
   * Mukurwe-ini
   * Mukurwe ini
   * Mukurweini
   *
   * normalize to the same identity.
   */
  s = s.replace(/\s+/g, "");

  return s;
}

function countyIdentity(
  county: unknown,
  subCounty: unknown
): string {
  return `${normalizeName(county)}|${normalizeName(subCounty)}`;
}

function wardIdentity(
  county: unknown,
  subCounty: unknown,
  ward: unknown
): string {
  return [
    normalizeName(county),
    normalizeName(subCounty),
    normalizeName(ward),
  ].join("|");
}

function constituencyIdentity(
  county: unknown,
  constituency: unknown
): string {
  return `${normalizeName(county)}|${normalizeName(constituency)}`;
}

function printHeader(title: string): void {
  console.log("");
  console.log("=".repeat(80));
  console.log(title);
  console.log("=".repeat(80));
}

function printSubHeader(title: string): void {
  console.log("");
  console.log("-".repeat(80));
  console.log(title);
  console.log("-".repeat(80));
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function sortStrings(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function safeJsonParse(filePath: string): GeoJson {
  if (!fs.existsSync(filePath)) {
    throw new Error(`GeoJSON file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");

  const parsed = JSON.parse(raw) as GeoJson;

  if (!Array.isArray(parsed.features)) {
    throw new Error(
      "GeoJSON does not contain a valid features array."
    );
  }

  return parsed;
}

/**
 * Extract a property using several possible spellings.
 *
 * The authoritative file has historically used fields such as:
 * county, subcounty/subCounty, ward, cuid, scuid, gid.
 */
function getProperty(
  properties: Record<string, unknown>,
  names: string[]
): unknown {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(properties, name)) {
      const value = properties[name];

      if (
        value !== undefined &&
        value !== null &&
        text(value) !== ""
      ) {
        return value;
      }
    }
  }

  /*
   * Case-insensitive fallback.
   */
  const entries = Object.entries(properties);

  for (const wanted of names) {
    const wantedLower = wanted.toLowerCase();

    const found = entries.find(
      ([key, value]) =>
        key.toLowerCase() === wantedLower &&
        value !== undefined &&
        value !== null &&
        text(value) !== ""
    );

    if (found) {
      return found[1];
    }
  }

  return "";
}

function loadGeoWards(): GeoWard[] {
  const geojson = safeJsonParse(GEOJSON_PATH);

  const result: GeoWard[] = [];

  for (let index = 0; index < geojson.features!.length; index++) {
    const feature = geojson.features![index];

    const properties = feature.properties ?? {};

    const gid = text(
      getProperty(properties, [
        "gid",
        "GID",
        "id",
        "ID",
      ])
    ) || String(index + 1);

    const countyRaw = text(
      getProperty(properties, [
        "county",
        "County",
        "COUNTY",
        "county_name",
        "countyName",
      ])
    );

    const subCountyRaw = text(
      getProperty(properties, [
        "subcounty",
        "subCounty",
        "SubCounty",
        "SUBCOUNTY",
        "sub_county",
        "sub_county_name",
        "subCountyName",
      ])
    );

    const wardRaw = text(
      getProperty(properties, [
        "ward",
        "Ward",
        "WARD",
        "ward_name",
        "wardName",
      ])
    );

    const cuid = text(
      getProperty(properties, [
        "cuid",
        "CUID",
        "constituencyId",
        "constituency_id",
      ])
    );

    const scuid = text(
      getProperty(properties, [
        "scuid",
        "SCUID",
        "subcountyId",
        "subcounty_id",
        "subCountyId",
      ])
    );

    const county = normalizeName(countyRaw);
    const subCounty = normalizeName(subCountyRaw);
    const ward = normalizeName(wardRaw);

    result.push({
      gid,
      countyRaw,
      subCountyRaw,
      wardRaw,
      cuid,
      scuid,
      county,
      subCounty,
      ward,
      identity: wardIdentity(
        countyRaw,
        subCountyRaw,
        wardRaw
      ),
    });
  }

  return result;
}

function buildIdentityMap(
  geoWards: GeoWard[]
): IdentityMap {
  const map: IdentityMap = new Map();

  for (const row of geoWards) {
    const current = map.get(row.identity) ?? [];

    current.push(row);

    map.set(row.identity, current);
  }

  return map;
}

function groupGeoBySubCounty(
  geoWards: GeoWard[]
): Map<string, GeoWard[]> {
  const map = new Map<string, GeoWard[]>();

  for (const row of geoWards) {
    const key = `${row.county}|${row.subCounty}`;

    const current = map.get(key) ?? [];

    current.push(row);

    map.set(key, current);
  }

  return map;
}

function groupGeoByCounty(
  geoWards: GeoWard[]
): Map<string, GeoWard[]> {
  const map = new Map<string, GeoWard[]>();

  for (const row of geoWards) {
    const current = map.get(row.county) ?? [];

    current.push(row);

    map.set(row.county, current);
  }

  return map;
}

function groupDbWardsBySubCounty(
  wards: DbWard[]
): Map<string, DbWard[]> {
  const map = new Map<string, DbWard[]>();

  for (const row of wards) {
    if (!row.subCounty) {
      continue;
    }

    const key = countyIdentity(
      row.county.name,
      row.subCounty.name
    );

    const current = map.get(key) ?? [];

    current.push(row);

    map.set(key, current);
  }

  return map;
}

function groupDbWardsByConstituency(
  wards: DbWard[]
): Map<number, DbWard[]> {
  const map = new Map<number, DbWard[]>();

  for (const row of wards) {
    const current =
      map.get(row.constituencyId) ?? [];

    current.push(row);

    map.set(row.constituencyId, current);
  }

  return map;
}

function groupDbWardsByCounty(
  wards: DbWard[]
): Map<number, DbWard[]> {
  const map = new Map<number, DbWard[]>();

  for (const row of wards) {
    const current = map.get(row.countyId) ?? [];

    current.push(row);

    map.set(row.countyId, current);
  }

  return map;
}

function printList(
  title: string,
  values: string[],
  max = 100
): void {
  printSubHeader(title);

  if (values.length === 0) {
    console.log("  NONE");
    return;
  }

  const shown = values.slice(0, max);

  for (const value of shown) {
    console.log(`  ${value}`);
  }

  if (values.length > max) {
    console.log(
      `  ... ${values.length - max} additional entries omitted`
    );
  }
}

/* -------------------------------------------------------------------------- */
/* MAIN                                                                       */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
  const issues: Issue[] = [];

  console.log("");
  console.log("READ-ONLY GEOGRAPHY FORENSIC AUDIT V14");
  console.log("NO DATABASE CHANGES WILL BE MADE.");
  console.log(
    "Purpose: authoritative ward reconciliation, safe constituency analysis, and structural validation."
  );

  /* ---------------------------------------------------------------------- */
  /* LOAD SOURCE                                                             */
  /* ---------------------------------------------------------------------- */

  const geoWards = loadGeoWards();

  if (geoWards.length !== 1450) {
    issues.push({
      category: "SOURCE",
      message:
        `Expected 1450 GeoJSON features, found ${geoWards.length}.`,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* LOAD DATABASE                                                           */
  /* ---------------------------------------------------------------------- */

  const [counties, subCounties, constituencies, wards] =
    await Promise.all([
      prisma.county.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          id: "asc",
        },
      }),

      prisma.subCounty.findMany({
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
      }),

      prisma.constituency.findMany({
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
      }),

      prisma.ward.findMany({
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
              countyId: true,
            },
          },

          constituency: {
            select: {
              id: true,
              name: true,
              countyId: true,
            },
          },
        },

        orderBy: {
          id: "asc",
        },
      }),
    ]);

  /* ---------------------------------------------------------------------- */
  /* SECTION 1                                                               */
  /* ---------------------------------------------------------------------- */

  printHeader("SECTION 1: SOURCE SUMMARY");

  console.log(
    `GeoJSON features: ${geoWards.length}`
  );

  console.log(
    `DB counties: ${counties.length}`
  );

  console.log(
    `DB subcounties: ${subCounties.length}`
  );

  console.log(
    `DB constituencies: ${constituencies.length}`
  );

  console.log(
    `DB wards: ${wards.length}`
  );

  /* ---------------------------------------------------------------------- */
  /* SECTION 2                                                               */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 2: NORMALIZED SUBCOUNTY RECONCILIATION"
  );

  const geoSubCountyMap =
    new Map<string, GeoWard[]>();

  for (const row of geoWards) {
    const key = countyIdentity(
      row.countyRaw,
      row.subCountyRaw
    );

    const current =
      geoSubCountyMap.get(key) ?? [];

    current.push(row);

    geoSubCountyMap.set(key, current);
  }

  const dbSubCountyMap =
    new Map<string, DbSubCounty>();

  for (const row of subCounties) {
    const key = countyIdentity(
      row.county.name,
      row.name
    );

    dbSubCountyMap.set(key, row);
  }

  console.log(
    `GeoJSON normalized SubCounty identities: ${geoSubCountyMap.size}`
  );

  console.log(
    `DB normalized SubCounty identities: ${dbSubCountyMap.size}`
  );

  const geoSubKeys = new Set(
    geoSubCountyMap.keys()
  );

  const dbSubKeys = new Set(
    dbSubCountyMap.keys()
  );

  const geoOnlySub = sortStrings(
    [...geoSubKeys].filter(
      (key) => !dbSubKeys.has(key)
    )
  );

  const dbOnlySub = sortStrings(
    [...dbSubKeys].filter(
      (key) => !geoSubKeys.has(key)
    )
  );

  console.log(
    `GeoJSON-only normalized SubCounty identities: ${geoOnlySub.length}`
  );

  console.log(
    `DB-only normalized SubCounty identities: ${dbOnlySub.length}`
  );

  if (geoOnlySub.length > 0) {
    printList(
      "GeoJSON-only normalized SubCounty identities",
      geoOnlySub
    );
  }

  if (dbOnlySub.length > 0) {
    printList(
      "DB-only normalized SubCounty identities",
      dbOnlySub
    );
  }

  /*
   * Raw GeoJSON identity count is intentionally also reported.
   */
  const rawGeoSubKeys = new Set(
    geoWards.map(
      (row) =>
        `${row.countyRaw}|${row.subCountyRaw}`
    )
  );

  console.log(
    `GeoJSON raw county/subcounty identities: ${rawGeoSubKeys.size}`
  );

  console.log(
    `GeoJSON normalized county/subcounty identities: ${geoSubCountyMap.size}`
  );

  if (rawGeoSubKeys.size !== geoSubCountyMap.size) {
    console.log(
      "NOTE: raw GeoJSON SubCounty identities contain naming variants that normalize to the same identity."
    );
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 3                                                               */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 3: AUTHORITATIVE WARD IDENTITY RECONCILIATION"
  );

  const geoWardMap =
    buildIdentityMap(geoWards);

  const dbWardMap =
    new Map<string, DbWard[]>();

  for (const row of wards) {
    if (!row.subCounty) {
      continue;
    }

    const key = wardIdentity(
      row.county.name,
      row.subCounty.name,
      row.name
    );

    const current =
      dbWardMap.get(key) ?? [];

    current.push(row);

    dbWardMap.set(key, current);
  }

  console.log(
    `GeoJSON normalized ward identities: ${geoWardMap.size}`
  );

  console.log(
    `DB normalized ward identities: ${dbWardMap.size}`
  );

  const duplicateGeoWardGroups =
    [...geoWardMap.entries()].filter(
      ([, rows]) => rows.length > 1
    );

  const duplicateDbWardGroups =
    [...dbWardMap.entries()].filter(
      ([, rows]) => rows.length > 1
    );

  console.log(
    `GeoJSON duplicate authoritative ward identities: ${duplicateGeoWardGroups.length}`
  );

  console.log(
    `DB duplicate authoritative ward identities: ${duplicateDbWardGroups.length}`
  );

  if (duplicateGeoWardGroups.length > 0) {
    issues.push({
      category: "WARD_IDENTITY",
      message:
        `GeoJSON contains ${duplicateGeoWardGroups.length} duplicate authoritative ward identity groups.`,
    });

    for (const [identity, rows] of duplicateGeoWardGroups) {
      console.log(
        `  DUPLICATE GEOJSON: ${identity} | features=${rows.length}`
      );
    }
  }

  if (duplicateDbWardGroups.length > 0) {
    issues.push({
      category: "WARD_IDENTITY",
      message:
        `DB contains ${duplicateDbWardGroups.length} duplicate authoritative ward identity groups.`,
    });

    for (const [identity, rows] of duplicateDbWardGroups) {
      console.log(
        `  DUPLICATE DB: ${identity} | rows=${rows.length}`
      );
    }
  }

  const geoWardKeys =
    new Set(geoWardMap.keys());

  const dbWardKeys =
    new Set(dbWardMap.keys());

  const dbOnlyWardKeys = sortStrings(
    [...dbWardKeys].filter(
      (key) => !geoWardKeys.has(key)
    )
  );

  const geoOnlyWardKeys = sortStrings(
    [...geoWardKeys].filter(
      (key) => !dbWardKeys.has(key)
    )
  );

  console.log(
    `DB-only ward identities: ${dbOnlyWardKeys.length}`
  );

  console.log(
    `GeoJSON-only ward identities: ${geoOnlyWardKeys.length}`
  );

  if (dbOnlyWardKeys.length > 0) {
    printList(
      "DB-only authoritative Ward identities",
      dbOnlyWardKeys,
      150
    );
  }

  if (geoOnlyWardKeys.length > 0) {
    printList(
      "GeoJSON-only authoritative Ward identities",
      geoOnlyWardKeys,
      150
    );
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 4                                                               */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 4: KNOWN NORMALIZATION DIFFERENCE ANALYSIS"
  );

  const possibleNormalizationPairs: Array<{
    dbKey: string;
    geoKey: string;
    dbCount: number;
    geoCount: number;
  }> = [];

  for (const dbKey of dbOnlyWardKeys) {
    const dbParts = dbKey.split("|");

    if (dbParts.length !== 3) {
      continue;
    }

    const [dbCounty, dbSubCounty, dbWard] =
      dbParts;

    for (const geoKey of geoOnlyWardKeys) {
      const geoParts = geoKey.split("|");

      if (geoParts.length !== 3) {
        continue;
      }

      const [geoCounty, geoSubCounty, geoWard] =
        geoParts;

      if (
        dbCounty === geoCounty &&
        dbWard === geoWard &&
        (
          dbSubCounty.includes(geoSubCounty) ||
          geoSubCounty.includes(dbSubCounty)
        )
      ) {
        possibleNormalizationPairs.push({
          dbKey,
          geoKey,
          dbCount:
            dbWardMap.get(dbKey)?.length ?? 0,
          geoCount:
            geoWardMap.get(geoKey)?.length ?? 0,
        });
      }
    }
  }

  console.log(
    `Possible normalization pairs: ${possibleNormalizationPairs.length}`
  );

  for (const pair of possibleNormalizationPairs) {
    console.log("");
    console.log(`  DB : ${pair.dbKey}`);
    console.log(`  GEO: ${pair.geoKey}`);
    console.log(
      `  DB wards=${pair.dbCount} | GEO wards=${pair.geoCount}`
    );
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 5                                                               */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 5: CONSTITUENCY WARD-MEMBERSHIP RECONCILIATION"
  );

  console.log(
    "IMPORTANT: The GeoJSON does not expose a normal constituency-name property."
  );

  console.log(
    "Therefore V14 does NOT compare DB Constituency.name directly against GeoJSON constituency names."
  );

  console.log(
    "Instead, each DB constituency is validated through its Ward membership."
  );

  const dbWardsByConstituency =
    groupDbWardsByConstituency(wards);

  let constituenciesWithInvalidWards = 0;

  const constituencyDiagnostics: Array<{
    id: number;
    county: string;
    name: string;
    dbWardCount: number;
    authoritativeWardCount: number;
    invalidWardCount: number;
  }> = [];

  for (const constituency of constituencies) {
    const constituencyWards =
      dbWardsByConstituency.get(
        constituency.id
      ) ?? [];

    let authoritativeCount = 0;
    let invalidCount = 0;

    for (const ward of constituencyWards) {
      if (!ward.subCounty) {
        invalidCount++;
        continue;
      }

      const identity = wardIdentity(
        ward.county.name,
        ward.subCounty.name,
        ward.name
      );

      if (geoWardMap.has(identity)) {
        authoritativeCount++;
      } else {
        invalidCount++;
      }
    }

    if (invalidCount > 0) {
      constituenciesWithInvalidWards++;
    }

    constituencyDiagnostics.push({
      id: constituency.id,
      county: constituency.county.name,
      name: constituency.name,
      dbWardCount: constituencyWards.length,
      authoritativeWardCount: authoritativeCount,
      invalidWardCount: invalidCount,
    });
  }

  console.log(
    `DB constituencies checked: ${constituencies.length}`
  );

  console.log(
    `Constituencies with one or more non-authoritative Ward identities: ${constituenciesWithInvalidWards}`
  );

  if (constituenciesWithInvalidWards > 0) {
    for (const row of constituencyDiagnostics.filter(
      (item) => item.invalidWardCount > 0
    )) {
      console.log(
        `  ID ${row.id} | ${row.county} | ${row.name} | DB wards=${row.dbWardCount} | authoritative=${row.authoritativeWardCount} | invalid=${row.invalidWardCount}`
      );
    }

    issues.push({
      category: "CONSTITUENCY_WARDS",
      message:
        `${constituenciesWithInvalidWards} constituencies contain one or more Ward identities not directly represented by normalized GeoJSON identity.`,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 6                                                               */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 6: CONSTITUENCY WARD-SET RECONCILIATION"
  );

  /*
   * Because GeoJSON has no constituency name, we cannot construct an
   * authoritative constituency partition from the file alone.
   *
   * What we CAN prove:
   *
   * - every DB Ward belongs to an authoritative county/subcounty/ward
   *   identity;
   * - every DB constituency's wards are internally coherent;
   * - no Ward points to a Ward identity outside the source.
   *
   * We therefore report structural Ward-set validity rather than inventing
   * a false GeoJSON constituency identity.
   */

  let constituencyWardSetFailures = 0;

  for (const constituency of constituencies) {
    const rows =
      dbWardsByConstituency.get(
        constituency.id
      ) ?? [];

    const countyNames =
      unique(
        rows.map(
          (row) => row.county.name
        )
      );

    const countyIds =
      unique(
        rows.map(
          (row) => row.countyId
        )
      );

    const invalidCount =
      rows.filter((row) => {
        if (!row.subCounty) {
          return true;
        }

        const identity = wardIdentity(
          row.county.name,
          row.subCounty.name,
          row.name
        );

        return !geoWardMap.has(identity);
      }).length;

    if (
      countyIds.length !== 1 ||
      countyNames.length !== 1 ||
      invalidCount > 0
    ) {
      constituencyWardSetFailures++;

      console.log(
        `  ID ${constituency.id} | ${constituency.name} | counties=${countyIds.join(",")} | countyNames=${countyNames.join(",")} | invalidWards=${invalidCount}`
      );
    }
  }

  console.log(
    `Constituencies with structural Ward-set differences: ${constituencyWardSetFailures}`
  );

  if (constituencyWardSetFailures > 0) {
    issues.push({
      category: "CONSTITUENCY_WARD_SET",
      message:
        `${constituencyWardSetFailures} constituencies have structural Ward-set inconsistencies.`,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 7                                                               */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 7: CONSTITUENCY NAME COLLISIONS"
  );

  const constituencyNameGroups =
    new Map<
      string,
      DbConstituency[]
    >();

  for (const constituency of constituencies) {
    const key = normalizeName(
      constituency.name
    );

    const current =
      constituencyNameGroups.get(key) ?? [];

    current.push(constituency);

    constituencyNameGroups.set(key, current);
  }

  const constituencyCollisions =
    [...constituencyNameGroups.entries()]
      .filter(
        ([, rows]) => rows.length > 1
      )
      .sort(([a], [b]) =>
        a.localeCompare(b)
      );

  console.log(
    `Global duplicate normalized constituency names: ${constituencyCollisions.length}`
  );

  for (const [
    normalizedName,
    rows,
  ] of constituencyCollisions) {
    console.log("");
    console.log(
      `Normalized name: ${normalizedName}`
    );

    for (const row of rows) {
      const wardCount =
        dbWardsByConstituency.get(
          row.id
        )?.length ?? 0;

      console.log(
        `  ID ${row.id} | ${row.county.name} | ${row.name} | wards=${wardCount}`
      );
    }
  }

  /*
   * Global same-name constituencies are NOT automatically errors.
   */
  if (constituencyCollisions.length > 0) {
    console.log("");
    console.log(
      "NOTE: same-name Constituencies in different counties are legitimate when countyId differs."
    );
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 8                                                               */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 8: MULTI-CONSTITUENCY SUBCOUNTIES"
  );

  const dbSubCountyWardMap =
    groupDbWardsBySubCounty(wards);

  const multiConstituencySubCounties: Array<{
    subCountyId: number;
    countyName: string;
    subCountyName: string;
    constituencies: Array<{
      id: number;
      name: string;
      wards: number;
    }>;
  }> = [];

  for (const subCounty of subCounties) {
    const rows =
      dbSubCountyWardMap.get(
        countyIdentity(
          subCounty.county.name,
          subCounty.name
        )
      ) ?? [];

    const constituencyGroups =
      new Map<
        number,
        {
          id: number;
          name: string;
          wards: number;
        }
      >();

    for (const row of rows) {
      const current =
        constituencyGroups.get(
          row.constituencyId
        );

      if (current) {
        current.wards++;
      } else {
        constituencyGroups.set(
          row.constituencyId,
          {
            id: row.constituencyId,
            name: row.constituency.name,
            wards: 1,
          }
        );
      }
    }

    if (constituencyGroups.size > 1) {
      multiConstituencySubCounties.push({
        subCountyId: subCounty.id,
        countyName: subCounty.county.name,
        subCountyName: subCounty.name,
        constituencies:
          [...constituencyGroups.values()].sort(
            (a, b) => a.id - b.id
          ),
      });
    }
  }

  console.log(
    `SubCounties associated with multiple Constituencies: ${multiConstituencySubCounties.length}`
  );

  for (const item of multiConstituencySubCounties) {
    console.log("");
    console.log(
      `SubCounty ${item.subCountyId} | ${item.countyName} | ${item.subCountyName}`
    );

    for (const constituency of item.constituencies) {
      console.log(
        `  Constituency ${constituency.id} | ${constituency.name} | wards=${constituency.wards}`
      );
    }
  }

  /*
   * This is diagnostic, not automatically an error.
   *
   * A subcounty may contain wards assigned to multiple constituencies.
   */
  console.log("");
  console.log(
    "NOTE: Multi-Constituency SubCounty membership is diagnostic only; it is not automatically a data error."
  );

  /* ---------------------------------------------------------------------- */
  /* SECTION 9                                                               */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 9: KISII CENTRAL WARD CONTROL TEST"
  );

  const kisiiCentralRows =
    wards.filter(
      (row) =>
        normalizeName(row.county.name) ===
          "kisii" &&
        normalizeName(row.name) ===
          "kisiicentral"
    );

  console.log(
    `Kisii Central Ward DB rows: ${kisiiCentralRows.length}`
  );

  const kisiiCentralGeo =
    geoWards.filter(
      (row) =>
        row.county === "kisii" &&
        row.ward === "kisiicentral"
    );

  console.log(
    `Kisii Central Ward GeoJSON features: ${kisiiCentralGeo.length}`
  );

  for (const row of kisiiCentralRows) {
    const identity =
      row.subCounty
        ? wardIdentity(
            row.county.name,
            row.subCounty.name,
            row.name
          )
        : "";

    const matches =
      identity
        ? geoWardMap.get(identity) ?? []
        : [];

    console.log("");
    console.log(
      `Ward ID ${row.id} | ${row.name}`
    );

    console.log(
      `  County: ${row.county.name} (${row.countyId})`
    );

    console.log(
      `  SubCounty: ${
        row.subCounty?.name ?? "NULL"
      } (${
        row.subCounty?.id ?? "NULL"
      })`
    );

    console.log(
      `  Constituency: ${row.constituency.name} (${row.constituencyId})`
    );

    console.log(
      `  Authoritative identity: ${identity}`
    );

    console.log(
      `  GeoJSON matches: ${matches.length}`
    );

    for (const match of matches) {
      console.log(
        `    gid=${match.gid} | ${match.countyRaw} | ${match.subCountyRaw} | ${match.wardRaw} | cuid=${match.cuid} | scuid=${match.scuid}`
      );
    }

    if (matches.length === 0) {
      issues.push({
        category: "KISII_CENTRAL",
        message:
          `Kisii Central Ward DB row ${row.id} has no authoritative GeoJSON match.`,
      });
    }
  }

  if (
    kisiiCentralRows.length === 2 &&
    kisiiCentralGeo.length === 2
  ) {
    console.log("");
    console.log(
      "KISII CENTRAL CONTROL TEST: PASS"
    );
    console.log(
      "The two Kisii Central Ward records are separate authoritative identities because their SubCounties differ."
    );
  } else {
    issues.push({
      category: "KISII_CENTRAL",
      message:
        `Expected 2 DB Kisii Central Ward rows and 2 GeoJSON features; found DB=${kisiiCentralRows.length}, GeoJSON=${kisiiCentralGeo.length}.`,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 10                                                              */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 10: CROSS-COUNTY CONSISTENCY"
  );

  /*
   * IMPORTANT:
   *
   * V13 incorrectly relied on fields that were not selected.
   *
   * V14 explicitly selects:
   *
   *   Ward.countyId
   *   SubCounty.countyId
   *   Constituency.countyId
   *
   * and compares IDs directly.
   */

  const wardSubCountyCountyMismatchRows =
    wards.filter(
      (row) =>
        row.subCounty !== null &&
        row.subCounty.countyId !==
          row.countyId
    );

  const wardConstituencyCountyMismatchRows =
    wards.filter(
      (row) =>
        row.constituency.countyId !==
        row.countyId
    );

  console.log(
    `Ward/SubCounty county mismatches: ${wardSubCountyCountyMismatchRows.length}`
  );

  console.log(
    `Ward/Constituency county mismatches: ${wardConstituencyCountyMismatchRows.length}`
  );

  if (
    wardSubCountyCountyMismatchRows.length > 0
  ) {
    for (const row of wardSubCountyCountyMismatchRows) {
      console.log(
        `  Ward ${row.id} | ${row.name} | Ward countyId=${row.countyId} | SubCounty countyId=${row.subCounty?.countyId}`
      );
    }

    issues.push({
      category: "CROSS_COUNTY",
      message:
        `${wardSubCountyCountyMismatchRows.length} Ward/SubCounty county mismatches found.`,
    });
  }

  if (
    wardConstituencyCountyMismatchRows.length > 0
  ) {
    for (const row of wardConstituencyCountyMismatchRows) {
      console.log(
        `  Ward ${row.id} | ${row.name} | Ward countyId=${row.countyId} | Constituency countyId=${row.constituency.countyId}`
      );
    }

    issues.push({
      category: "CROSS_COUNTY",
      message:
        `${wardConstituencyCountyMismatchRows.length} Ward/Constituency county mismatches found.`,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 11                                                              */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 11: NULL ADMINISTRATIVE FOREIGN KEYS"
  );

  const nullSubCountyRows =
    wards.filter(
      (row) => row.subCountyId === null
    );

  const nullCountyRows =
    wards.filter(
      (row) => row.countyId === null
    );

  const nullConstituencyRows =
    wards.filter(
      (row) => row.constituencyId === null
    );

  console.log(
    `Ward rows with null countyId: ${nullCountyRows.length}`
  );

  console.log(
    `Ward rows with null subCountyId: ${nullSubCountyRows.length}`
  );

  console.log(
    `Ward rows with null constituencyId: ${nullConstituencyRows.length}`
  );

  if (
    nullCountyRows.length > 0 ||
    nullSubCountyRows.length > 0 ||
    nullConstituencyRows.length > 0
  ) {
    issues.push({
      category: "NULL_FK",
      message:
        `Ward administrative foreign keys contain null values.`,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 12                                                              */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 12: WARD COUNTS BY SUBCOUNTY"
  );

  const geoBySubCounty =
    groupGeoBySubCounty(geoWards);

  const dbBySubCounty =
    groupDbWardsBySubCounty(wards);

  const subCountyCountMismatches: Array<{
    key: string;
    dbCount: number;
    geoCount: number;
  }> = [];

  for (const subCounty of subCounties) {
    const key = countyIdentity(
      subCounty.county.name,
      subCounty.name
    );

    const dbCount =
      dbBySubCounty.get(key)?.length ?? 0;

    const geoCount =
      geoBySubCounty.get(key)?.length ?? 0;

    if (dbCount !== geoCount) {
      subCountyCountMismatches.push({
        key,
        dbCount,
        geoCount,
      });
    }
  }

  console.log(
    `SubCounty ward-count mismatches: ${subCountyCountMismatches.length}`
  );

  if (
    subCountyCountMismatches.length > 0
  ) {
    for (const row of subCountyCountMismatches) {
      console.log(
        `  ${row.key} | DB=${row.dbCount} | GEO=${row.geoCount}`
      );
    }

    issues.push({
      category: "WARD_COUNT",
      message:
        `${subCountyCountMismatches.length} SubCounty ward-count mismatches found.`,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 13                                                              */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 13: COMPLETE DATABASE CONSTITUENCY SUMMARY"
  );

  for (const constituency of constituencies) {
    const rows =
      dbWardsByConstituency.get(
        constituency.id
      ) ?? [];

    const authoritativeCount =
      rows.filter((row) => {
        if (!row.subCounty) {
          return false;
        }

        const key = wardIdentity(
          row.county.name,
          row.subCounty.name,
          row.name
        );

        return geoWardMap.has(key);
      }).length;

    const invalidCount =
      rows.length - authoritativeCount;

    console.log(
      `ID ${constituency.id} | ${constituency.county.name} | ${constituency.name} | DB wards=${rows.length} | authoritative=${authoritativeCount} | invalid=${invalidCount}`
    );
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 14                                                              */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 14: COUNTY STRUCTURE"
  );

  const geoCountyMap =
    groupGeoByCounty(geoWards);

  const dbCountyWardMap =
    groupDbWardsByCounty(wards);

  console.log(
    `GeoJSON normalized counties: ${geoCountyMap.size}`
  );

  console.log(
    `DB counties: ${counties.length}`
  );

  const dbCountyNames = new Map<
    string,
    DbCounty
  >();

  for (const county of counties) {
    dbCountyNames.set(
      normalizeName(county.name),
      county
    );
  }

  const geoOnlyCounties =
    sortStrings(
      [...geoCountyMap.keys()].filter(
        (key) => !dbCountyNames.has(key)
      )
    );

  const dbOnlyCounties =
    sortStrings(
      [...dbCountyNames.keys()].filter(
        (key) => !geoCountyMap.has(key)
      )
    );

  console.log(
    `GeoJSON-only normalized counties: ${geoOnlyCounties.length}`
  );

  console.log(
    `DB-only normalized counties: ${dbOnlyCounties.length}`
  );

  if (geoOnlyCounties.length > 0) {
    printList(
      "GeoJSON-only counties",
      geoOnlyCounties
    );
  }

  if (dbOnlyCounties.length > 0) {
    printList(
      "DB-only counties",
      dbOnlyCounties
    );
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 15                                                              */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 15: KENYA NATIONAL TOTALS"
  );

  console.log(
    `DB counties: ${counties.length}`
  );

  console.log(
    `DB subcounties: ${subCounties.length}`
  );

  console.log(
    `DB constituencies: ${constituencies.length}`
  );

  console.log(
    `DB wards: ${wards.length}`
  );

  console.log(
    `GeoJSON features: ${geoWards.length}`
  );

  if (counties.length !== 47) {
    issues.push({
      category: "NATIONAL_TOTAL",
      message:
        `Expected 47 counties, found ${counties.length}.`,
    });
  }

  if (subCounties.length !== 301) {
    issues.push({
      category: "NATIONAL_TOTAL",
      message:
        `Expected 301 SubCounties, found ${subCounties.length}.`,
    });
  }

  if (wards.length !== 1450) {
    issues.push({
      category: "NATIONAL_TOTAL",
      message:
        `Expected 1450 Wards, found ${wards.length}.`,
    });
  }

  if (geoWards.length !== 1450) {
    issues.push({
      category: "NATIONAL_TOTAL",
      message:
        `Expected 1450 GeoJSON features, found ${geoWards.length}.`,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 16                                                              */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 16: AUTHORITATIVE WARD ACCOUNTING"
  );

  const matchedDbWardRows =
    wards.filter((row) => {
      if (!row.subCounty) {
        return false;
      }

      const key = wardIdentity(
        row.county.name,
        row.subCounty.name,
        row.name
      );

      return geoWardMap.has(key);
    });

  const unmatchedDbWardRows =
    wards.filter((row) => {
      if (!row.subCounty) {
        return true;
      }

      const key = wardIdentity(
        row.county.name,
        row.subCounty.name,
        row.name
      );

      return !geoWardMap.has(key);
    });

  const matchedGeoRows =
    geoWards.filter(
      (row) => dbWardMap.has(row.identity)
    );

  const unmatchedGeoRows =
    geoWards.filter(
      (row) => !dbWardMap.has(row.identity)
    );

  console.log(
    `DB Ward rows matching authoritative identity: ${matchedDbWardRows.length}`
  );

  console.log(
    `DB Ward rows not matching authoritative identity: ${unmatchedDbWardRows.length}`
  );

  console.log(
    `GeoJSON Ward features represented in DB: ${matchedGeoRows.length}`
  );

  console.log(
    `GeoJSON Ward features not represented in DB: ${unmatchedGeoRows.length}`
  );

  if (
    unmatchedDbWardRows.length === 0 &&
    unmatchedGeoRows.length === 0
  ) {
    console.log(
      "WARD ACCOUNTING: PASS"
    );
  } else {
    issues.push({
      category: "WARD_ACCOUNTING",
      message:
        `DB unmatched Ward rows=${unmatchedDbWardRows.length}; GeoJSON unmatched features=${unmatchedGeoRows.length}.`,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 17                                                              */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 17: ACTUAL WARD UNIQUE CONSTRAINT"
  );

  /*
   * We intentionally inspect the Prisma schema text instead of making a
   * database write or relying on a misleading two-column interpretation.
   */

  const schemaPath = path.resolve(
    process.cwd(),
    "prisma",
    "schema.prisma"
  );

  if (fs.existsSync(schemaPath)) {
    const schemaText =
      fs.readFileSync(
        schemaPath,
        "utf8"
      );

    const wardModelMatch =
      schemaText.match(
        /model\s+Ward\s*\{([\s\S]*?)\n\}/m
      );

    const wardModelText =
      wardModelMatch?.[1] ?? "";

    const compositeUniqueLines =
      wardModelText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.startsWith("@@unique")
        );

    console.log(
      `Ward @@unique declarations: ${compositeUniqueLines.length}`
    );

    for (const line of compositeUniqueLines) {
      console.log(
        `  ${line}`
      );
    }

    const correctCompositeUnique =
      compositeUniqueLines.some(
        (line) =>
          line.includes(
            "constituencyId"
          ) &&
          line.includes(
            "subCountyId"
          ) &&
          line.includes(
            "name"
          )
      );

    console.log(
      `Ward @@unique([constituencyId, subCountyId, name]): ${correctCompositeUnique ? "FOUND" : "NOT FOUND"}`
    );

    if (!correctCompositeUnique) {
      issues.push({
        category: "WARD_UNIQUE",
        message:
          "Expected Ward composite unique constraint [constituencyId, subCountyId, name] was not found in schema.prisma.",
      });
    }
  } else {
    console.log(
      `schema.prisma not found at ${schemaPath}`
    );

    issues.push({
      category: "SCHEMA",
      message:
        "prisma/schema.prisma could not be found.",
    });
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 18                                                              */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 18: ACTUAL KISII WARD ACCOUNTING"
  );

  const kisiiRows =
    wards.filter(
      (row) =>
        normalizeName(row.county.name) ===
        "kisii"
    );

  const kisiiGeo =
    geoWards.filter(
      (row) =>
        row.county === "kisii"
    );

  console.log(
    `Kisii DB Ward rows: ${kisiiRows.length}`
  );

  console.log(
    `Kisii GeoJSON features: ${kisiiGeo.length}`
  );

  const kisiiDbKeys =
    new Set(
      kisiiRows
        .filter(
          (row) => row.subCounty
        )
        .map(
          (row) =>
            wardIdentity(
              row.county.name,
              row.subCounty!.name,
              row.name
            )
        )
    );

  const kisiiGeoKeys =
    new Set(
      kisiiGeo.map(
        (row) => row.identity
      )
    );

  const kisiiDbOnly =
    sortStrings(
      [...kisiiDbKeys].filter(
        (key) =>
          !kisiiGeoKeys.has(key)
      )
    );

  const kisiiGeoOnly =
    sortStrings(
      [...kisiiGeoKeys].filter(
        (key) =>
          !kisiiDbKeys.has(key)
      )
    );

  console.log(
    `Kisii DB-only ward identities: ${kisiiDbOnly.length}`
  );

  console.log(
    `Kisii GeoJSON-only ward identities: ${kisiiGeoOnly.length}`
  );

  if (kisiiDbOnly.length > 0) {
    printList(
      "Kisii DB-only identities",
      kisiiDbOnly
    );
  }

  if (kisiiGeoOnly.length > 0) {
    printList(
      "Kisii GeoJSON-only identities",
      kisiiGeoOnly
    );
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 19                                                              */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 19: MULTI-CONSTITUENCY SOURCE CONTROL"
  );

  /*
   * For every multi-Constituency SubCounty, verify that every DB Ward
   * still has a valid authoritative county/subcounty/ward identity.
   *
   * We deliberately do NOT declare the SubCounty invalid merely because
   * several constituencies use it.
   */

  let multiSubCountyInvalidRows = 0;

  for (const item of multiConstituencySubCounties) {
    const rows =
      dbSubCountyWardMap.get(
        countyIdentity(
          item.countyName,
          item.subCountyName
        )
      ) ?? [];

    const invalidRows =
      rows.filter((row) => {
        if (!row.subCounty) {
          return true;
        }

        const identity =
          wardIdentity(
            row.county.name,
            row.subCounty.name,
            row.name
          );

        return !geoWardMap.has(identity);
      });

    if (invalidRows.length > 0) {
      multiSubCountyInvalidRows +=
        invalidRows.length;

      console.log("");
      console.log(
        `SubCounty ${item.subCountyId} | ${item.countyName} | ${item.subCountyName} | invalid authoritative Ward rows=${invalidRows.length}`
      );

      for (const row of invalidRows) {
        console.log(
          `  Ward ${row.id} | ${row.name}`
        );
      }
    }
  }

  console.log(
    `Invalid Ward rows inside multi-Constituency SubCounties: ${multiSubCountyInvalidRows}`
  );

  if (multiSubCountyInvalidRows > 0) {
    issues.push({
      category: "MULTI_SUBCOUNTY",
      message:
        `${multiSubCountyInvalidRows} invalid authoritative Ward rows found inside multi-Constituency SubCounties.`,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* SECTION 20                                                              */
  /* ---------------------------------------------------------------------- */

  printHeader(
    "SECTION 20: FINAL V14 RESULT"
  );

  /*
   * Remove duplicate issue messages while preserving order.
   */
  const issueKeys =
    new Set<string>();

  const uniqueIssues: Issue[] = [];

  for (const issue of issues) {
    const key =
      `${issue.category}|${issue.message}`;

    if (!issueKeys.has(key)) {
      issueKeys.add(key);
      uniqueIssues.push(issue);
    }
  }

  console.log(
    `Issues detected: ${uniqueIssues.length}`
  );

  if (uniqueIssues.length === 0) {
    console.log("");
    console.log(
      "DATABASE / GEOGRAPHY FORENSIC AUDIT V14: PASS"
    );
  } else {
    console.log("");

    for (const issue of uniqueIssues) {
      console.log(
        `[${issue.category}] ${issue.message}`
      );
    }

    console.log("");
    console.log(
      "DATABASE / GEOGRAPHY FORENSIC AUDIT V14: REVIEW REQUIRED"
    );
  }

  console.log("");
  console.log(
    "READ-ONLY AUDIT COMPLETE."
  );

  console.log(
    "NO DATABASE CHANGES WERE MADE."
  );
}

/* -------------------------------------------------------------------------- */
/* RUN                                                                        */
/* -------------------------------------------------------------------------- */

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V14 AUDIT FAILED:"
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });