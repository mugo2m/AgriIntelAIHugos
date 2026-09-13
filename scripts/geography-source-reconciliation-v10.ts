import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

type QueryRow = Record<string, unknown>;

type GeoFeature = {
  type?: string;
  properties?: Record<string, unknown>;
  geometry?: unknown;
};

type GeoJSONDocument = {
  type?: string;
  features?: GeoFeature[];
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

function printLine() {
  console.log("=".repeat(110));
}

function printTitle(title: string) {
  console.log("");
  printLine();
  console.log(title);
  printLine();
}

function display(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }

  return String(value);
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

async function queryRows<T extends QueryRow>(
  sql: string,
): Promise<T[]> {
  return prisma.$queryRawUnsafe<T[]>(sql);
}

function loadGeoJSON(): GeoJSONDocument {
  const filePath = path.resolve(
    process.cwd(),
    "prisma",
    "data",
    "kenya-wards-1450.geojson",
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `GeoJSON not found: ${filePath}`,
    );
  }

  console.log(`GeoJSON source: ${filePath}`);

  const raw = fs.readFileSync(
    filePath,
    "utf8",
  );

  return JSON.parse(raw) as GeoJSONDocument;
}

function propertyText(
  properties: Record<string, unknown>,
): string {
  return Object.entries(properties)
    .map(
      ([key, value]) =>
        `${key}=${display(value)}`,
    )
    .join(" | ");
}

function featureMatches(
  feature: GeoFeature,
  terms: string[],
): boolean {
  const properties =
    feature.properties ?? {};

  const text = Object.entries(properties)
    .map(([key, value]) => {
      return `${key} ${display(value)}`;
    })
    .join(" ")
    .toLowerCase();

  return terms.every((term) =>
    text.includes(term.toLowerCase()),
  );
}

function getFeatureProperty(
  properties: Record<string, unknown>,
  candidates: string[],
): unknown {
  for (const candidate of candidates) {
    if (
      Object.prototype.hasOwnProperty.call(
        properties,
        candidate,
      )
    ) {
      return properties[candidate];
    }
  }

  const normalizedCandidates =
    candidates.map(normalize);

  for (const [key, value] of Object.entries(
    properties,
  )) {
    if (
      normalizedCandidates.includes(
        normalize(key),
      )
    ) {
      return value;
    }
  }

  return undefined;
}

function extractCanonicalGeoFields(
  feature: GeoFeature,
) {
  const properties =
    feature.properties ?? {};

  return {
    county: getFeatureProperty(
      properties,
      [
        "county",
        "County",
        "county_name",
        "countyName",
        "COUNTY",
        "COUNTY_NAME",
      ],
    ),
    subcounty: getFeatureProperty(
      properties,
      [
        "subcounty",
        "SubCounty",
        "sub_county",
        "subCounty",
        "subcounty_name",
        "subCountyName",
        "SUBCOUNTY",
        "SUB_COUNTY",
        "SUBCOUNTY_NAME",
      ],
    ),
    constituency: getFeatureProperty(
      properties,
      [
        "constituency",
        "Constituency",
        "constituency_name",
        "constituencyName",
        "CONSTITUENCY",
        "CONSTITUENCY_NAME",
      ],
    ),
    ward: getFeatureProperty(
      properties,
      [
        "ward",
        "Ward",
        "ward_name",
        "wardName",
        "WARD",
        "WARD_NAME",
        "name",
        "Name",
      ],
    ),
  };
}

async function printDatabaseKisiiSummary() {
  printTitle(
    "SECTION 1: DATABASE KISII SUMMARY",
  );

  const counties =
    await queryRows<{
      id: string;
      name: string;
    }>(`
      SELECT
        id::text,
        name
      FROM "County"
      WHERE LOWER(TRIM(name)) = 'kisii'
      ORDER BY id;
    `);

  console.log(
    `Kisii County rows: ${counties.length}`,
  );

  for (const county of counties) {
    console.log(
      `County ID ${county.id}: ${county.name}`,
    );
  }

  const subcounties =
    await queryRows<{
      id: string;
      name: string;
      county_id: string;
      county_name: string;
    }>(`
      SELECT
        s.id::text,
        s.name,
        c.id::text AS county_id,
        c.name AS county_name
      FROM "SubCounty" s
      JOIN "County" c
        ON c.id = s."countyId"
      WHERE LOWER(TRIM(c.name)) = 'kisii'
      ORDER BY s.id;
    `);

  console.log("");
  console.log(
    `Kisii SubCounty rows: ${subcounties.length}`,
  );

  for (const row of subcounties) {
    console.log(
      `SubCounty ${row.id}: ${row.name}`,
    );
  }
}

async function printDatabaseNyaribariChache() {
  printTitle(
    "SECTION 2: DATABASE NYARIBARI CHACHE STRUCTURE",
  );

  const constituencies =
    await queryRows<{
      id: string;
      name: string;
      county_id: string;
      county_name: string;
    }>(`
      SELECT
        c.id::text,
        c.name,
        co.id::text AS county_id,
        co.name AS county_name
      FROM "Constituency" c
      JOIN "County" co
        ON co.id = c."countyId"
      WHERE LOWER(TRIM(c.name)) =
        'nyaribari chache'
      ORDER BY c.id;
    `);

  console.log(
    `Nyaribari Chache constituency rows: ${constituencies.length}`,
  );

  for (const constituency of constituencies) {
    console.log("");
    console.log(
      `Constituency ID: ${constituency.id}`,
    );

    console.log(
      `Constituency name: ${constituency.name}`,
    );

    console.log(
      `County ID: ${constituency.county_id}`,
    );

    console.log(
      `County name: ${constituency.county_name}`,
    );

    const wards =
      await queryRows<{
        ward_id: string;
        ward_name: string;
        subcounty_id: string;
        subcounty_name: string;
        county_id: string;
        county_name: string;
      }>(`
        SELECT
          w.id::text AS ward_id,
          w.name AS ward_name,
          s.id::text AS subcounty_id,
          s.name AS subcounty_name,
          co.id::text AS county_id,
          co.name AS county_name
        FROM "Ward" w
        JOIN "SubCounty" s
          ON s.id = w."subCountyId"
        JOIN "County" co
          ON co.id = w."countyId"
        WHERE w."constituencyId" =
          ${constituency.id}
        ORDER BY w.id;
      `);

    console.log(
      `Ward count: ${wards.length}`,
    );

    for (const ward of wards) {
      console.log(
        `  Ward ${ward.ward_id} | ${ward.ward_name} | SubCounty ${ward.subcounty_id} | ${ward.subcounty_name}`,
      );
    }
  }
}

async function printDuplicateWardRecords() {
  printTitle(
    "SECTION 3: DUPLICATE KISII CENTRAL WARD RECORDS",
  );

  const rows =
    await queryRows<{
      ward_id: string;
      ward_name: string;
      constituency_id: string;
      constituency_name: string;
      county_id: string;
      county_name: string;
      subcounty_id: string;
      subcounty_name: string;
    }>(`
      SELECT
        w.id::text AS ward_id,
        w.name AS ward_name,
        c.id::text AS constituency_id,
        c.name AS constituency_name,
        co.id::text AS county_id,
        co.name AS county_name,
        s.id::text AS subcounty_id,
        s.name AS subcounty_name
      FROM "Ward" w
      JOIN "Constituency" c
        ON c.id = w."constituencyId"
      JOIN "County" co
        ON co.id = w."countyId"
      JOIN "SubCounty" s
        ON s.id = w."subCountyId"
      WHERE w."constituencyId" = 486
        AND LOWER(TRIM(w.name)) =
          'kisii central ward'
      ORDER BY w.id;
    `);

  console.log(
    `Rows found: ${rows.length}`,
  );

  for (const row of rows) {
    console.log("");
    console.log(
      `Ward ID: ${row.ward_id}`,
    );
    console.log(
      `Ward: ${row.ward_name}`,
    );
    console.log(
      `Constituency: ${row.constituency_id} | ${row.constituency_name}`,
    );
    console.log(
      `County: ${row.county_id} | ${row.county_name}`,
    );
    console.log(
      `SubCounty: ${row.subcounty_id} | ${row.subcounty_name}`,
    );
  }
}

async function inspectGeoJSONMatches(
  geojson: GeoJSONDocument,
) {
  printTitle(
    "SECTION 4: ALL GEOJSON FEATURES MATCHING KISII",
  );

  const features =
    Array.isArray(geojson.features)
      ? geojson.features
      : [];

  const kisiiFeatures =
    features.filter((feature) =>
      featureMatches(feature, [
        "kisii",
      ]),
    );

  console.log(
    `GeoJSON features containing "Kisii": ${kisiiFeatures.length}`,
  );

  for (
    let index = 0;
    index < kisiiFeatures.length;
    index++
  ) {
    const feature =
      kisiiFeatures[index];

    const canonical =
      extractCanonicalGeoFields(
        feature,
      );

    console.log("");
    console.log(
      `FEATURE ${index + 1}`,
    );

    console.log(
      `Canonical county:       ${display(canonical.county)}`,
    );

    console.log(
      `Canonical subcounty:    ${display(canonical.subcounty)}`,
    );

    console.log(
      `Canonical constituency: ${display(canonical.constituency)}`,
    );

    console.log(
      `Canonical ward:         ${display(canonical.ward)}`,
    );

    console.log(
      `RAW PROPERTIES: ${propertyText(
        feature.properties ?? {},
      )}`,
    );
  }
}

async function inspectGeoJSONNyaribari(
  geojson: GeoJSONDocument,
) {
  printTitle(
    "SECTION 5: GEOJSON FEATURES MATCHING NYARIBARI",
  );

  const features =
    Array.isArray(geojson.features)
      ? geojson.features
      : [];

  const matches =
    features.filter((feature) =>
      featureMatches(feature, [
        "nyaribari",
      ]),
    );

  console.log(
    `GeoJSON features containing "Nyaribari": ${matches.length}`,
  );

  for (
    let index = 0;
    index < matches.length;
    index++
  ) {
    const feature = matches[index];

    const canonical =
      extractCanonicalGeoFields(
        feature,
      );

    console.log("");
    console.log(
      `FEATURE ${index + 1}`,
    );

    console.log(
      `Canonical county:       ${display(canonical.county)}`,
    );

    console.log(
      `Canonical subcounty:    ${display(canonical.subcounty)}`,
    );

    console.log(
      `Canonical constituency: ${display(canonical.constituency)}`,
    );

    console.log(
      `Canonical ward:         ${display(canonical.ward)}`,
    );

    console.log(
      `RAW PROPERTIES: ${propertyText(
        feature.properties ?? {},
      )}`,
    );
  }
}

async function inspectGeoJSONKisiiCentral(
  geojson: GeoJSONDocument,
) {
  printTitle(
    "SECTION 6: GEOJSON FEATURES MATCHING KISII CENTRAL",
  );

  const features =
    Array.isArray(geojson.features)
      ? geojson.features
      : [];

  const matches =
    features.filter((feature) =>
      featureMatches(feature, [
        "kisii",
        "central",
      ]),
    );

  console.log(
    `GeoJSON features containing both "Kisii" and "Central": ${matches.length}`,
  );

  for (
    let index = 0;
    index < matches.length;
    index++
  ) {
    const feature = matches[index];

    const canonical =
      extractCanonicalGeoFields(
        feature,
      );

    console.log("");
    console.log(
      `FEATURE ${index + 1}`,
    );

    console.log(
      `Canonical county:       ${display(canonical.county)}`,
    );

    console.log(
      `Canonical subcounty:    ${display(canonical.subcounty)}`,
    );

    console.log(
      `Canonical constituency: ${display(canonical.constituency)}`,
    );

    console.log(
      `Canonical ward:         ${display(canonical.ward)}`,
    );

    console.log(
      `RAW PROPERTIES: ${propertyText(
        feature.properties ?? {},
      )}`,
    );
  }
}

async function summarizeGeoJSONSubcounties(
  geojson: GeoJSONDocument,
) {
  printTitle(
    "SECTION 7: KISII GEOJSON COUNTY/SUBCOUNTY IDENTITIES",
  );

  const features =
    Array.isArray(geojson.features)
      ? geojson.features
      : [];

  const kisiiFeatures =
    features.filter((feature) => {
      const canonical =
        extractCanonicalGeoFields(
          feature,
        );

      return (
        normalize(
          canonical.county,
        ) === "kisii"
      );
    });

  const identities = new Map<
    string,
    {
      county: string;
      subcounty: string;
      wardCount: number;
    }
  >();

  for (const feature of kisiiFeatures) {
    const canonical =
      extractCanonicalGeoFields(
        feature,
      );

    const county = display(
      canonical.county,
    );

    const subcounty = display(
      canonical.subcounty,
    );

    const key = `${normalize(
      county,
    )}|${normalize(subcounty)}`;

    const current = identities.get(
      key,
    );

    if (current) {
      current.wardCount++;
    } else {
      identities.set(key, {
        county,
        subcounty,
        wardCount: 1,
      });
    }
  }

  console.log(
    `Kisii GeoJSON features: ${kisiiFeatures.length}`,
  );

  console.log(
    `Kisii GeoJSON county/subcounty identities: ${identities.size}`,
  );

  for (const identity of identities.values()) {
    console.log(
      `${identity.county} | ${identity.subcounty} | wards=${identity.wardCount}`,
    );
  }
}

async function compareDbAndGeoJSON(
  geojson: GeoJSONDocument,
) {
  printTitle(
    "SECTION 8: DATABASE VS GEOJSON KISII IDENTITY COMPARISON",
  );

  const dbRows =
    await queryRows<{
      ward_id: string;
      ward_name: string;
      constituency_name: string;
      county_name: string;
      subcounty_name: string;
    }>(`
      SELECT
        w.id::text AS ward_id,
        w.name AS ward_name,
        c.name AS constituency_name,
        co.name AS county_name,
        s.name AS subcounty_name
      FROM "Ward" w
      JOIN "Constituency" c
        ON c.id = w."constituencyId"
      JOIN "County" co
        ON co.id = w."countyId"
      JOIN "SubCounty" s
        ON s.id = w."subCountyId"
      WHERE LOWER(TRIM(co.name)) = 'kisii'
      ORDER BY
        c.name,
        s.name,
        w.name,
        w.id;
    `);

  const features =
    Array.isArray(geojson.features)
      ? geojson.features
      : [];

  const geoRows = features
    .map((feature) => {
      const canonical =
        extractCanonicalGeoFields(
          feature,
        );

      return {
        county: display(
          canonical.county,
        ),
        subcounty: display(
          canonical.subcounty,
        ),
        constituency: display(
          canonical.constituency,
        ),
        ward: display(
          canonical.ward,
        ),
      };
    })
    .filter(
      (row) =>
        normalize(row.county) ===
        "kisii",
    );

  const geoKeys = new Set(
    geoRows.map(
      (row) =>
        [
          normalize(row.county),
          normalize(row.subcounty),
          normalize(row.constituency),
          normalize(row.ward),
        ].join("|"),
    ),
  );

  console.log(
    `Database Kisii ward rows: ${dbRows.length}`,
  );

  console.log(
    `GeoJSON Kisii ward features: ${geoRows.length}`,
  );

  console.log("");

  console.log(
    "DATABASE IDENTITIES NOT FOUND IN GEOJSON:",
  );

  let missing = 0;

  for (const row of dbRows) {
    const key = [
      normalize(row.county_name),
      normalize(row.subcounty_name),
      normalize(row.constituency_name),
      normalize(row.ward_name),
    ].join("|");

    if (!geoKeys.has(key)) {
      missing++;

      console.log(
        `DB Ward ${row.ward_id}: ${row.county_name} | ${row.subcounty_name} | ${row.constituency_name} | ${row.ward_name}`,
      );
    }
  }

  console.log(
    `Database identities not found in GeoJSON: ${missing}`,
  );

  console.log("");

  console.log(
    "GEOJSON IDENTITIES NOT FOUND IN DATABASE:",
  );

  const dbKeys = new Set(
    dbRows.map(
      (row) =>
        [
          normalize(row.county_name),
          normalize(row.subcounty_name),
          normalize(row.constituency_name),
          normalize(row.ward_name),
        ].join("|"),
    ),
  );

  let additional = 0;

  for (const row of geoRows) {
    const key = [
      normalize(row.county),
      normalize(row.subcounty),
      normalize(row.constituency),
      normalize(row.ward),
    ].join("|");

    if (!dbKeys.has(key)) {
      additional++;

      console.log(
        `GEOJSON: ${row.county} | ${row.subcounty} | ${row.constituency} | ${row.ward}`,
      );
    }
  }

  console.log(
    `GeoJSON identities not found in database: ${additional}`,
  );
}

async function main() {
  printTitle(
    "READ-ONLY GEOGRAPHY SOURCE RECONCILIATION V10",
  );

  console.log(
    "NO DATABASE CHANGES WILL BE MADE.",
  );

  console.log("");
  console.log(
    "Purpose: resolve the Kisii Central Ward collision and explain the 302nd authoritative county/subcounty identity.",
  );

  const geojson = loadGeoJSON();

  await printDatabaseKisiiSummary();

  await printDatabaseNyaribariChache();

  await printDuplicateWardRecords();

  await inspectGeoJSONMatches(
    geojson,
  );

  await inspectGeoJSONNyaribari(
    geojson,
  );

  await inspectGeoJSONKisiiCentral(
    geojson,
  );

  await summarizeGeoJSONSubcounties(
    geojson,
  );

  await compareDbAndGeoJSON(
    geojson,
  );

  printTitle(
    "V10 FINAL STATUS",
  );

  console.log(
    "V10 COMPLETE.",
  );

  console.log(
    "READ-ONLY: NO DATABASE CHANGES WERE MADE.",
  );

  console.log("");
  console.log(
    "DO NOT DELETE OR MERGE WARD 1942 OR 2628 YET.",
  );

  console.log(
    "The next repair decision must be based on the authoritative GeoJSON identities printed above.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "GEOGRAPHY SOURCE RECONCILIATION V10 FAILED",
    );
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });