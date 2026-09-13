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

type GeoFeature = {
  type: string;
  properties?: {
    county?: string;
    subcounty?: string;
    ward?: string;
    gid?: string | number;
    uid?: string;
    scuid?: string;
    cuid?: string;
    [key: string]: unknown;
  };
};

type GeoJSONData = {
  type: string;
  features: GeoFeature[];
};

type DbCounty = {
  id: number;
  name: string;
};

type DbSubCounty = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
};

type DbConstituency = {
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
  constituencyId: number;
  constituencyName: string;
};

type MultiMapping = {
  subCountyId: number;
  subCountyName: string;
  countyId: number;
  countyName: string;
  constituencyCount: number;
};

type UniqueIndexRow = {
  tableName: string;
  indexName: string;
  isUnique: boolean;
  isPrimary: boolean;
  definition: string;
  keyColumnCount: number;
};

type NormalizedIdentity = {
  county: string;
  subcounty: string;
  ward: string;
  key: string;
};

type GeoIdentityRecord = {
  county: string;
  subcounty: string;
  ward: string;
  key: string;
  gid: string;
  uid: string;
  scuid: string;
  cuid: string;
};

function normalizeBasic(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/&/g, " and ")
    .replace(/[-_/]/g, " ")
    .replace(/[.,;:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCounty(value: unknown): string {
  let valueNormalized = normalizeBasic(value);

  const aliases: Record<string, string> = {
    "tharaka nithi": "tharaka nithi",
    "tharaka nithi county": "tharaka nithi",
    "tharaka nithi county ": "tharaka nithi",

    muranga: "muranga",
    "muranga county": "muranga",
    "murang'a": "muranga",

    nairobi: "nairobi",
    "nairobi city": "nairobi",
    "nairobi city county": "nairobi",

    "elgeyo marakwet": "elgeyo marakwet",
    "elgeyo marakwet county": "elgeyo marakwet",

    kericho: "kericho",
    wajir: "wajir",
    meru: "meru",
    "taita taveta": "taita taveta",
    "taita taveta county": "taita taveta",
  };

  if (aliases[valueNormalized]) {
    return aliases[valueNormalized];
  }

  return valueNormalized
    .replace(/\s+county$/, "")
    .replace(/\s+city county$/, "")
    .trim();
}

function normalizeSubCounty(value: unknown): string {
  return normalizeBasic(value)
    .replace(/\bsub\s+county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/\bsub-county\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeConstituency(value: unknown): string {
  return normalizeBasic(value)
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWard(value: unknown): string {
  return normalizeBasic(value)
    .replace(/\bward\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function makeIdentity(
  county: unknown,
  subcounty: unknown,
  ward: unknown,
): NormalizedIdentity {
  const normalizedCounty = normalizeCounty(county);
  const normalizedSubCounty = normalizeSubCounty(subcounty);
  const normalizedWard = normalizeWard(ward);

  return {
    county: normalizedCounty,
    subcounty: normalizedSubCounty,
    ward: normalizedWard,
    key: `${normalizedCounty}|${normalizedSubCounty}|${normalizedWard}`,
  };
}

function makeSubCountyIdentity(
  county: unknown,
  subcounty: unknown,
): string {
  return `${normalizeCounty(county)}|${normalizeSubCounty(subcounty)}`;
}

function makeConstituencyIdentity(
  county: unknown,
  constituency: unknown,
): string {
  return `${normalizeCounty(county)}|${normalizeConstituency(constituency)}`;
}

function loadGeoJSON(): GeoJSONData {
  const filePath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "kenya-wards-1450.geojson",
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`GeoJSON file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as GeoJSONData;

  if (!Array.isArray(parsed.features)) {
    throw new Error("GeoJSON does not contain a features array.");
  }

  return parsed;
}

async function getDbCounts() {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      table_name: string;
      row_count: string;
    }>
  >(
    `
      SELECT
        table_name,
        (
          xpath(
            '/row/count/text()',
            query_to_xml(
              format('SELECT COUNT(*) AS count FROM %I', table_name),
              true,
              false,
              ''
            )
          )
        )[1]::text AS row_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'Country',
          'County',
          'SubCounty',
          'Constituency',
          'Ward'
        )
      ORDER BY table_name
    `,
  );

  return rows;
}

async function loadDbGeography() {
  const counties = await prisma.$queryRawUnsafe<DbCounty[]>(
    `
      SELECT
        c.id,
        c.name
      FROM "County" c
      ORDER BY c.id
    `,
  );

  const subcounties = await prisma.$queryRawUnsafe<DbSubCounty[]>(
    `
      SELECT
        s.id,
        s.name,
        s."countyId",
        c.name AS "countyName"
      FROM "SubCounty" s
      JOIN "County" c
        ON c.id = s."countyId"
      ORDER BY s."countyId", s.id
    `,
  );

  const constituencies = await prisma.$queryRawUnsafe<DbConstituency[]>(
    `
      SELECT
        c.id,
        c.name,
        c."countyId",
        co.name AS "countyName"
      FROM "Constituency" c
      JOIN "County" co
        ON co.id = c."countyId"
      ORDER BY c."countyId", c.id
    `,
  );

  const wards = await prisma.$queryRawUnsafe<DbWard[]>(
    `
      SELECT
        w.id,
        w.name,
        w."countyId",
        co.name AS "countyName",
        w."subCountyId",
        sc.name AS "subCountyName",
        w."constituencyId",
        c.name AS "constituencyName"
      FROM "Ward" w
      JOIN "County" co
        ON co.id = w."countyId"
      LEFT JOIN "SubCounty" sc
        ON sc.id = w."subCountyId"
      JOIN "Constituency" c
        ON c.id = w."constituencyId"
      ORDER BY w."countyId", w.id
    `,
  );

  return {
    counties,
    subcounties,
    constituencies,
    wards,
  };
}

function buildGeoIdentities(features: GeoFeature[]): GeoIdentityRecord[] {
  return features.map((feature) => {
    const p = feature.properties ?? {};

    const identity = makeIdentity(
      p.county,
      p.subcounty,
      p.ward,
    );

    return {
      county: String(p.county ?? ""),
      subcounty: String(p.subcounty ?? ""),
      ward: String(p.ward ?? ""),
      key: identity.key,
      gid: String(p.gid ?? ""),
      uid: String(p.uid ?? ""),
      scuid: String(p.scuid ?? ""),
      cuid: String(p.cuid ?? ""),
    };
  });
}

function printHeader(title: string) {
  console.log("\n" + "=".repeat(90));
  console.log(title);
  console.log("=".repeat(90));
}

async function section1SourceSummary(
  geoFeatures: GeoFeature[],
  db: Awaited<ReturnType<typeof loadDbGeography>>,
) {
  printHeader("SECTION 1: SOURCE AND DATABASE SUMMARY");

  const geoIdentities = buildGeoIdentities(geoFeatures);

  const geoSubCountyMap = new Map<string, Set<string>>();

  for (const record of geoIdentities) {
    const key = makeSubCountyIdentity(
      record.county,
      record.subcounty,
    );

    if (!geoSubCountyMap.has(key)) {
      geoSubCountyMap.set(key, new Set());
    }

    geoSubCountyMap.get(key)!.add(record.ward);
  }

  const dbSubCountyIdentities = new Set(
    db.subcounties.map((s) =>
      makeSubCountyIdentity(s.countyName, s.name),
    ),
  );

  const duplicateGeoSubCountyIdentities = new Map<
    string,
    GeoIdentityRecord[]
  >();

  for (const record of geoIdentities) {
    const key = makeSubCountyIdentity(
      record.county,
      record.subcounty,
    );

    const existing = duplicateGeoSubCountyIdentities.get(key);

    if (existing) {
      existing.push(record);
    } else {
      duplicateGeoSubCountyIdentities.set(key, [record]);
    }
  }

  const duplicates = [...duplicateGeoSubCountyIdentities.entries()]
    .filter(([, records]) => {
      const distinctSubCountyNames = new Set(
        records.map((r) => r.subcounty),
      );

      return distinctSubCountyNames.size > 1;
    });

  console.log(`GeoJSON features: ${geoFeatures.length}`);
  console.log(`GeoJSON normalized SubCounty identities: ${geoSubCountyMap.size}`);
  console.log(`DB SubCounty rows: ${db.subcounties.length}`);
  console.log(
    `DB normalized SubCounty identities: ${dbSubCountyIdentities.size}`,
  );

  console.log(
    `GeoJSON duplicate normalized SubCounty identities with name variants: ${duplicates.length}`,
  );

  if (duplicates.length > 0) {
    for (const [key, records] of duplicates) {
      console.log(`\n  ${key}`);

      const names = [
        ...new Set(records.map((r) => r.subcounty)),
      ];

      console.log(`    Source names: ${names.join(" | ")}`);
      console.log(`    Features: ${records.length}`);
    }
  }
}

async function section2MultiConstituency(
  db: Awaited<ReturnType<typeof loadDbGeography>>,
) {
  printHeader(
    "SECTION 2: SUBCOUNTIES ASSOCIATED WITH MULTIPLE CONSTITUENCIES",
  );

  const mapping = new Map<
    number,
    {
      subCountyId: number;
      subCountyName: string;
      countyId: number;
      countyName: string;
      constituencies: Map<number, string>;
    }
  >();

  for (const ward of db.wards) {
    if (ward.subCountyId === null) {
      continue;
    }

    if (!mapping.has(ward.subCountyId)) {
      mapping.set(ward.subCountyId, {
        subCountyId: ward.subCountyId,
        subCountyName: ward.subCountyName ?? "",
        countyId: ward.countyId,
        countyName: ward.countyName,
        constituencies: new Map(),
      });
    }

    mapping
      .get(ward.subCountyId)!
      .constituencies.set(
        ward.constituencyId,
        ward.constituencyName,
      );
  }

  const multi = [...mapping.values()]
    .filter((x) => x.constituencies.size > 1)
    .sort((a, b) =>
      `${a.countyName}|${a.subCountyName}`.localeCompare(
        `${b.countyName}|${b.subCountyName}`,
      ),
    );

  console.log(`Multi-Constituency SubCounty identities: ${multi.length}`);

  for (const item of multi) {
    console.log(
      `\nSubCounty ${item.subCountyId} | ${item.subCountyName} | County ${item.countyId} | ${item.countyName}`,
    );

    for (const [constituencyId, constituencyName] of item.constituencies) {
      const wards = db.wards.filter(
        (w) =>
          w.subCountyId === item.subCountyId &&
          w.constituencyId === constituencyId,
      );

      console.log(
        `  Constituency ${constituencyId} | ${constituencyName} | wards=${wards.length}`,
      );

      for (const ward of wards) {
        console.log(
          `    Ward ${ward.id} | ${ward.name} | county=${ward.countyName} | subcounty=${ward.subCountyName}`,
        );
      }
    }
  }

  return multi;
}

async function section3ReconcileMultiAgainstGeoJSON(
  multi: Awaited<ReturnType<typeof section2MultiConstituency>>,
  db: Awaited<ReturnType<typeof loadDbGeography>>,
  geoFeatures: GeoFeature[],
) {
  printHeader(
    "SECTION 3: MULTI-CONSTITUENCY SUBCOUNTY RECONCILIATION AGAINST GEOJSON",
  );

  const geoRecords = buildGeoIdentities(geoFeatures);

  let sourceConfirmed = 0;
  let sourceNotDirectlyRepresented = 0;

  for (const item of multi) {
    const dbWards = db.wards.filter(
      (w) => w.subCountyId === item.subCountyId,
    );

    console.log(
      `\n${item.countyName} | ${item.subCountyName}`,
    );

    const geoForSubCounty = geoRecords.filter(
      (r) =>
        normalizeCounty(r.county) === normalizeCounty(item.countyName) &&
        normalizeSubCounty(r.subcounty) ===
          normalizeSubCounty(item.subCountyName),
    );

    console.log(
      `  DB wards: ${dbWards.length}`,
    );

    console.log(
      `  GeoJSON wards matched by county+subcounty: ${geoForSubCounty.length}`,
    );

    const dbWardKeys = new Set(
      dbWards.map((w) =>
        makeIdentity(
          w.countyName,
          w.subCountyName,
          w.name,
        ).key,
      ),
    );

    const geoWardKeys = new Set(
      geoForSubCounty.map((r) => r.key),
    );

    const dbOnly = [...dbWardKeys].filter(
      (key) => !geoWardKeys.has(key),
    );

    const geoOnly = [...geoWardKeys].filter(
      (key) => !dbWardKeys.has(key),
    );

    console.log(`  DB-only normalized wards: ${dbOnly.length}`);
    console.log(`  GeoJSON-only normalized wards: ${geoOnly.length}`);

    if (dbOnly.length > 0) {
      console.log("  DB-only:");

      for (const key of dbOnly) {
        console.log(`    ${key}`);
      }
    }

    if (geoOnly.length > 0) {
      console.log("  GeoJSON-only:");

      for (const key of geoOnly) {
        console.log(`    ${key}`);
      }
    }

    if (dbOnly.length === 0 && geoOnly.length === 0) {
      sourceConfirmed++;
      console.log(
        "  RESULT: Ward set agrees with GeoJSON at county+subcounty level.",
      );
    } else {
      sourceNotDirectlyRepresented++;
      console.log(
        "  RESULT: Requires further source reconciliation.",
      );
    }
  }

  console.log(
    `\nGeoJSON-confirmed multi-Constituency SubCounties: ${sourceConfirmed}`,
  );

  console.log(
    `Multi-Constituency SubCounties requiring further review: ${sourceNotDirectlyRepresented}`,
  );
}

async function section4CountyConsistency(
  db: Awaited<ReturnType<typeof loadDbGeography>>,
) {
  printHeader(
    "SECTION 4: WARD COUNTY / SUBCOUNTY / CONSTITUENCY CONSISTENCY",
  );

  const countyMismatch = db.wards.filter(
    (w) => {
      const subCounty = db.subcounties.find(
        (s) => s.id === w.subCountyId,
      );

      const constituency = db.constituencies.find(
        (c) => c.id === w.constituencyId,
      );

      return (
        (subCounty && subCounty.countyId !== w.countyId) ||
        (constituency &&
          constituency.countyId !== w.countyId)
      );
    },
  );

  console.log(
    `Wards with cross-county administrative references: ${countyMismatch.length}`,
  );

  for (const ward of countyMismatch) {
    console.log(
      `  Ward ${ward.id} | ${ward.name} | county=${ward.countyName} | subcounty=${ward.subCountyName} | constituency=${ward.constituencyName}`,
    );
  }

  return countyMismatch.length;
}

async function section5WardIdentity(
  db: Awaited<ReturnType<typeof loadDbGeography>>,
  geoFeatures: GeoFeature[],
) {
  printHeader(
    "SECTION 5: AUTHORITATIVE WARD IDENTITY USING COUNTY + SUBCOUNTY + WARD",
  );

  const dbMap = new Map<string, DbWard[]>();

  for (const ward of db.wards) {
    const identity = makeIdentity(
      ward.countyName,
      ward.subCountyName,
      ward.name,
    );

    const existing = dbMap.get(identity.key);

    if (existing) {
      existing.push(ward);
    } else {
      dbMap.set(identity.key, [ward]);
    }
  }

  const geoRecords = buildGeoIdentities(geoFeatures);

  const geoMap = new Map<string, GeoIdentityRecord[]>();

  for (const record of geoRecords) {
    const existing = geoMap.get(record.key);

    if (existing) {
      existing.push(record);
    } else {
      geoMap.set(record.key, [record]);
    }
  }

  const dbDuplicates = [...dbMap.entries()].filter(
    ([, rows]) => rows.length > 1,
  );

  const geoDuplicates = [...geoMap.entries()].filter(
    ([, rows]) => rows.length > 1,
  );

  const dbOnly = [...dbMap.keys()].filter(
    (key) => !geoMap.has(key),
  );

  const geoOnly = [...geoMap.keys()].filter(
    (key) => !dbMap.has(key),
  );

  console.log(`DB ward rows: ${db.wards.length}`);
  console.log(`DB distinct county+subcounty+ward identities: ${dbMap.size}`);
  console.log(`DB duplicate identities: ${dbDuplicates.length}`);

  console.log(`GeoJSON ward features: ${geoFeatures.length}`);
  console.log(
    `GeoJSON distinct county+subcounty+ward identities: ${geoMap.size}`,
  );
  console.log(`GeoJSON duplicate identities: ${geoDuplicates.length}`);

  console.log(`DB-only identities: ${dbOnly.length}`);
  console.log(`GeoJSON-only identities: ${geoOnly.length}`);

  if (dbDuplicates.length > 0) {
    console.log("\nDB DUPLICATE AUTHORITATIVE IDENTITIES:");

    for (const [key, rows] of dbDuplicates) {
      console.log(`\n  ${key}`);

      for (const row of rows) {
        console.log(
          `    Ward ${row.id} | ${row.name} | subcounty=${row.subCountyId}:${row.subCountyName} | constituency=${row.constituencyId}:${row.constituencyName}`,
        );
      }
    }
  }

  if (geoDuplicates.length > 0) {
    console.log("\nGEOJSON DUPLICATE AUTHORITATIVE IDENTITIES:");

    for (const [key, rows] of geoDuplicates) {
      console.log(`\n  ${key}`);

      for (const row of rows) {
        console.log(
          `    gid=${row.gid} | ${row.county} | ${row.subcounty} | ${row.ward}`,
        );
      }
    }
  }

  if (dbOnly.length > 0) {
    console.log("\nDB-ONLY WARD IDENTITIES:");

    for (const key of dbOnly) {
      console.log(`  ${key}`);
    }
  }

  if (geoOnly.length > 0) {
    console.log("\nGEOJSON-ONLY WARD IDENTITIES:");

    for (const key of geoOnly) {
      console.log(`  ${key}`);
    }
  }

  return {
    dbMap,
    geoMap,
    dbDuplicates,
    geoDuplicates,
    dbOnly,
    geoOnly,
  };
}

async function section6Kisii(
  db: Awaited<ReturnType<typeof loadDbGeography>>,
  geoFeatures: GeoFeature[],
) {
  printHeader(
    "SECTION 6: KISII CENTRAL WARD — TARGETED FORENSIC CHECK",
  );

  const kisiiWards = db.wards.filter(
    (w) => normalizeCounty(w.countyName) === "kisii",
  );

  const target = kisiiWards.filter(
    (w) =>
      normalizeWard(w.name) === "kisii central",
  );

  console.log(`Kisii DB ward rows: ${kisiiWards.length}`);
  console.log(
    `Kisii Central Ward DB rows: ${target.length}`,
  );

  for (const ward of target) {
    console.log(
      `\nWard ${ward.id}`,
    );

    console.log(
      `  Name: ${ward.name}`,
    );

    console.log(
      `  County: ${ward.countyId} | ${ward.countyName}`,
    );

    console.log(
      `  SubCounty: ${ward.subCountyId} | ${ward.subCountyName}`,
    );

    console.log(
      `  Constituency: ${ward.constituencyId} | ${ward.constituencyName}`,
    );

    const identity = makeIdentity(
      ward.countyName,
      ward.subCountyName,
      ward.name,
    );

    console.log(
      `  Authoritative identity: ${identity.key}`,
    );

    const sourceMatches = geoFeatures.filter((feature) => {
      const p = feature.properties ?? {};

      const sourceIdentity = makeIdentity(
        p.county,
        p.subcounty,
        p.ward,
      );

      return sourceIdentity.key === identity.key;
    });

    console.log(
      `  GeoJSON matches: ${sourceMatches.length}`,
    );

    for (const feature of sourceMatches) {
      const p = feature.properties ?? {};

      console.log(
        `    gid=${p.gid ?? ""} | ${p.county} | ${p.subcounty} | ${p.ward} | cuid=${p.cuid ?? ""} | scuid=${p.scuid ?? ""}`,
      );
    }
  }

  const geoKisiiCentral = geoFeatures.filter((feature) => {
    const p = feature.properties ?? {};

    return (
      normalizeCounty(p.county) === "kisii" &&
      normalizeWard(p.ward) === "kisii central"
    );
  });

  console.log(
    `\nGeoJSON Kisii Central Ward features: ${geoKisiiCentral.length}`,
  );

  for (const feature of geoKisiiCentral) {
    const p = feature.properties ?? {};

    console.log(
      `  gid=${p.gid ?? ""} | ${p.county} | ${p.subcounty} | ${p.ward}`,
    );
  }
}

async function section7SourceSubCountyDifference(
  db: Awaited<ReturnType<typeof loadDbGeography>>,
  geoFeatures: GeoFeature[],
) {
  printHeader(
    "SECTION 7: RESOLVE 301 VS 302 AUTHORITATIVE SUBCOUNTY IDENTITIES",
  );

  const geoRawMap = new Map<string, GeoIdentityRecord[]>();

  for (const record of buildGeoIdentities(geoFeatures)) {
    const rawKey =
      `${normalizeBasic(record.county)}|${normalizeBasic(record.subcounty)}`;

    const existing = geoRawMap.get(rawKey);

    if (existing) {
      existing.push(record);
    } else {
      geoRawMap.set(rawKey, [record]);
    }
  }

  const geoNormalizedMap = new Map<string, GeoIdentityRecord[]>();

  for (const record of buildGeoIdentities(geoFeatures)) {
    const key = makeSubCountyIdentity(
      record.county,
      record.subcounty,
    );

    const existing = geoNormalizedMap.get(key);

    if (existing) {
      existing.push(record);
    } else {
      geoNormalizedMap.set(key, [record]);
    }
  }

  const dbMap = new Map<
    string,
    DbSubCounty[]
  >();

  for (const row of db.subcounties) {
    const key = makeSubCountyIdentity(
      row.countyName,
      row.name,
    );

    const existing = dbMap.get(key);

    if (existing) {
      existing.push(row);
    } else {
      dbMap.set(key, [row]);
    }
  }

  console.log(
    `GeoJSON raw county/subcounty identities: ${geoRawMap.size}`,
  );

  console.log(
    `GeoJSON normalized county/subcounty identities: ${geoNormalizedMap.size}`,
  );

  console.log(
    `DB normalized county/subcounty identities: ${dbMap.size}`,
  );

  const normalizedGeoOnly = [...geoNormalizedMap.keys()].filter(
    (key) => !dbMap.has(key),
  );

  const normalizedDbOnly = [...dbMap.keys()].filter(
    (key) => !geoNormalizedMap.has(key),
  );

  console.log(
    `Normalized GeoJSON identities not found in DB: ${normalizedGeoOnly.length}`,
  );

  console.log(
    `Normalized DB identities not found in GeoJSON: ${normalizedDbOnly.length}`,
  );

  if (normalizedGeoOnly.length > 0) {
    console.log("\nGEOJSON-ONLY NORMALIZED IDENTITIES:");

    for (const key of normalizedGeoOnly) {
      const rows = geoNormalizedMap.get(key)!;

      const names = [
        ...new Set(
          rows.map(
            (r) => `${r.county} | ${r.subcounty}`,
          ),
        ),
      ];

      console.log(
        `  ${key} => ${names.join(" ; ")} | wards=${rows.length}`,
      );
    }
  }

  if (normalizedDbOnly.length > 0) {
    console.log("\nDB-ONLY NORMALIZED IDENTITIES:");

    for (const key of normalizedDbOnly) {
      const rows = dbMap.get(key)!;

      const names = [
        ...new Set(
          rows.map(
            (r) => `${r.countyName} | ${r.name}`,
          ),
        ),
      ];

      console.log(
        `  ${key} => ${names.join(" ; ")}`,
      );
    }
  }

  const geoIdentitiesWithMultipleRawForms = [
    ...geoNormalizedMap.entries(),
  ].filter(([, rows]) => {
    const rawForms = new Set(
      rows.map(
        (r) =>
          `${normalizeBasic(r.county)}|${normalizeBasic(r.subcounty)}`,
      ),
    );

    return rawForms.size > 1;
  });

  console.log(
    `\nNormalized GeoJSON identities containing multiple raw name forms: ${geoIdentitiesWithMultipleRawForms.length}`,
  );

  for (const [key, rows] of geoIdentitiesWithMultipleRawForms) {
    const forms = [
      ...new Set(
        rows.map(
          (r) => `${r.county} | ${r.subcounty}`,
        ),
      ),
    ];

    console.log(`  ${key}`);
    console.log(`    Forms: ${forms.join(" ; ")}`);
  }
}

async function section8CompositeWardUniqueIndexes() {
  printHeader(
    "SECTION 8: ACTUAL POSTGRESQL WARD UNIQUE INDEX / CONSTRAINT AUDIT",
  );

  const indexes = await prisma.$queryRawUnsafe<UniqueIndexRow[]>(
    `
      SELECT
        t.relname AS "tableName",
        i.relname AS "indexName",
        ix.indisunique AS "isUnique",
        ix.indisprimary AS "isPrimary",
        pg_get_indexdef(i.oid) AS definition,
        ix.indnkeyatts AS "keyColumnCount"
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
    `,
  );

  console.log(`Unique Ward indexes: ${indexes.length}`);

  for (const index of indexes) {
    console.log(
      `\n${index.indexName}`,
    );

    console.log(
      `  Primary: ${index.isPrimary}`,
    );

    console.log(
      `  Key columns: ${index.keyColumnCount}`,
    );

    console.log(
      `  Definition: ${index.definition}`,
    );
  }

  const compositeConstituencyName = indexes.filter(
    (index) => {
      const definition = index.definition.toLowerCase();

      return (
        index.keyColumnCount === 2 &&
        definition.includes('"constituencyid"') &&
        definition.includes('"name"')
      );
    },
  );

  console.log(
    `\nComposite unique index matching (constituencyId, name): ${compositeConstituencyName.length}`,
  );

  if (compositeConstituencyName.length === 0) {
    console.log(
      "RESULT: No database-level composite unique index was found for Ward(constituencyId, name).",
    );
  } else {
    for (const index of compositeConstituencyName) {
      console.log(
        `  FOUND: ${index.indexName}`,
      );
    }
  }

  return indexes;
}

async function section9SchemaWardUniqueExpectation() {
  printHeader(
    "SECTION 9: PRISMA SCHEMA WARD UNIQUE DECLARATION",
  );

  const schemaPath = path.join(
    process.cwd(),
    "prisma",
    "schema.prisma",
  );

  if (!fs.existsSync(schemaPath)) {
    console.log(
      `Prisma schema not found at ${schemaPath}`,
    );

    return;
  }

  const schema = fs.readFileSync(schemaPath, "utf8");

  const wardMatch = schema.match(
    /model\s+Ward\s*\{([\s\S]*?)^\}/m,
  );

  if (!wardMatch) {
    console.log(
      "Ward model was not found in schema.prisma.",
    );

    return;
  }

  const wardBlock = wardMatch[1];

  const uniqueLines = wardBlock
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.startsWith("@@unique") ||
        line.startsWith("@@index"),
    );

  console.log(
    "Ward model composite indexes:",
  );

  if (uniqueLines.length === 0) {
    console.log("  None found.");
  } else {
    for (const line of uniqueLines) {
      console.log(`  ${line}`);
    }
  }

  const hasConstituencyNameUnique = uniqueLines.some(
    (line) =>
      line.includes("constituencyId") &&
      line.includes("name") &&
      line.startsWith("@@unique"),
  );

  console.log(
    `\nPrisma schema declares @@unique([constituencyId, name]): ${hasConstituencyNameUnique}`,
  );
}

async function section10TargetedWardConstraints(
  db: Awaited<ReturnType<typeof loadDbGeography>>,
) {
  printHeader(
    "SECTION 10: TARGETED KISII CENTRAL WARD CONSTRAINT CHECK",
  );

  const rows = db.wards.filter(
    (w) =>
      normalizeCounty(w.countyName) === "kisii" &&
      normalizeWard(w.name) === "kisii central",
  );

  console.log(
    `Kisii Central Ward rows in DB: ${rows.length}`,
  );

  for (const ward of rows) {
    console.log(
      `  Ward ${ward.id} | constituency=${ward.constituencyId}:${ward.constituencyName} | subcounty=${ward.subCountyId}:${ward.subCountyName}`,
    );
  }

  if (rows.length > 1) {
    const constituencyNamePairs = new Map<string, DbWard[]>();

    for (const row of rows) {
      const key = `${row.constituencyId}|${normalizeWard(row.name)}`;

      const existing = constituencyNamePairs.get(key);

      if (existing) {
        existing.push(row);
      } else {
        constituencyNamePairs.set(key, [row]);
      }
    }

    const duplicateConstraintGroups = [
      ...constituencyNamePairs.entries(),
    ].filter(([, group]) => group.length > 1);

    console.log(
      `Duplicate groups under constituencyId + normalized ward name: ${duplicateConstraintGroups.length}`,
    );

    for (const [key, group] of duplicateConstraintGroups) {
      console.log(`\n  ${key}`);

      for (const row of group) {
        console.log(
          `    Ward ${row.id} | ${row.name} | subcounty=${row.subCountyId}:${row.subCountyName}`,
        );
      }
    }
  }
}

async function section11FinalAssessment(
  multi: Awaited<ReturnType<typeof section2MultiConstituency>>,
  wardIdentityAudit: Awaited<
    ReturnType<typeof section5WardIdentity>
  >,
  countyMismatchCount: number,
  geoFeatures: GeoFeature[],
  db: Awaited<ReturnType<typeof loadDbGeography>>,
) {
  printHeader("SECTION 11: V12 FINAL ASSESSMENT");

  const issues: string[] = [];

  if (countyMismatchCount > 0) {
    issues.push(
      `[COUNTY_CONSISTENCY] ${countyMismatchCount} Ward rows have cross-county administrative references.`,
    );
  }

  if (multi.length > 0) {
    issues.push(
      `[MULTI_CONSTITUENCY] ${multi.length} SubCounty identities are associated with multiple Constituencies through Ward rows.`,
    );
  }

  if (wardIdentityAudit.dbDuplicates.length > 0) {
    issues.push(
      `[WARD_IDENTITY] ${wardIdentityAudit.dbDuplicates.length} duplicate county+subcounty+ward identities exist in DB.`,
    );
  }

  if (wardIdentityAudit.geoDuplicates.length > 0) {
    issues.push(
      `[GEOJSON_IDENTITY] ${wardIdentityAudit.geoDuplicates.length} duplicate county+subcounty+ward identities exist in GeoJSON.`,
    );
  }

  if (wardIdentityAudit.dbOnly.length > 0) {
    issues.push(
      `[WARD_IDENTITY] ${wardIdentityAudit.dbOnly.length} DB ward identities are not represented in GeoJSON.`,
    );
  }

  if (wardIdentityAudit.geoOnly.length > 0) {
    issues.push(
      `[WARD_IDENTITY] ${wardIdentityAudit.geoOnly.length} GeoJSON ward identities are not represented in DB.`,
    );
  }

  const dbSubCountyCount = new Set(
    db.subcounties.map((s) =>
      makeSubCountyIdentity(
        s.countyName,
        s.name,
      ),
    ),
  ).size;

  const geoSubCountyCount = new Set(
    buildGeoIdentities(geoFeatures).map((r) =>
      makeSubCountyIdentity(
        r.county,
        r.subcounty,
      ),
    ),
  ).size;

  console.log(`DB rows — Counties: ${db.counties.length}`);
  console.log(`DB rows — SubCounties: ${db.subcounties.length}`);
  console.log(`DB rows — Constituencies: ${db.constituencies.length}`);
  console.log(`DB rows — Wards: ${db.wards.length}`);

  console.log(
    `DB normalized SubCounty identities: ${dbSubCountyCount}`,
  );

  console.log(
    `GeoJSON normalized SubCounty identities: ${geoSubCountyCount}`,
  );

  console.log(
    `GeoJSON features: ${geoFeatures.length}`,
  );

  console.log(
    `Multi-Constituency SubCounty identities: ${multi.length}`,
  );

  console.log(
    `Authoritative DB duplicate ward identities: ${wardIdentityAudit.dbDuplicates.length}`,
  );

  console.log(
    `Authoritative GeoJSON duplicate ward identities: ${wardIdentityAudit.geoDuplicates.length}`,
  );

  console.log(
    `DB-only ward identities: ${wardIdentityAudit.dbOnly.length}`,
  );

  console.log(
    `GeoJSON-only ward identities: ${wardIdentityAudit.geoOnly.length}`,
  );

  console.log(
    `Cross-county Ward reference problems: ${countyMismatchCount}`,
  );

  console.log(
    `\nV12 issues: ${issues.length}`,
  );

  if (issues.length === 0) {
    console.log("\nV12 RESULT: PASS");
  } else {
    console.log("\nV12 RESULT: REVIEW REQUIRED");

    console.log("\nIssues:");

    for (const issue of issues) {
      console.log(`- ${issue}`);
    }
  }

  console.log(
    "\nREAD-ONLY AUDIT ONLY.",
  );

  console.log(
    "NO DATABASE CHANGES WERE MADE.",
  );

  console.log(
    "NO WARD, SUBCOUNTY, CONSTITUENCY, COUNTY, OR INDEX WAS MODIFIED.",
  );
}

async function main() {
  console.log(
    "\nREAD-ONLY GEOGRAPHY FORENSIC AUDIT V12",
  );

  console.log(
    "NO DATABASE CHANGES WILL BE MADE.",
  );

  console.log(
    "Purpose: reconcile multi-Constituency SubCounties, authoritative Ward identity, the 301/302 discrepancy, and Ward composite uniqueness.",
  );

  const geo = loadGeoJSON();

  const db = await loadDbGeography();

  await section1SourceSummary(
    geo.features,
    db,
  );

  const multi =
    await section2MultiConstituency(db);

  await section3ReconcileMultiAgainstGeoJSON(
    multi,
    db,
    geo.features,
  );

  const countyMismatchCount =
    await section4CountyConsistency(db);

  const wardIdentityAudit =
    await section5WardIdentity(
      db,
      geo.features,
    );

  await section6Kisii(
    db,
    geo.features,
  );

  await section7SourceSubCountyDifference(
    db,
    geo.features,
  );

  await section8CompositeWardUniqueIndexes();

  await section9SchemaWardUniqueExpectation();

  await section10TargetedWardConstraints(db);

  await section11FinalAssessment(
    multi,
    wardIdentityAudit,
    countyMismatchCount,
    geo.features,
    db,
  );
}

main()
  .catch((error) => {
    console.error("\nV12 AUDIT FAILED:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });