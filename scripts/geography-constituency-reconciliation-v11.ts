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

const prisma = new PrismaClient({ adapter });

type Row = Record<string, unknown>;

const GEOJSON_PATH = path.resolve(
  process.cwd(),
  "prisma/data/kenya-wards-1450.geojson",
);

const issues: string[] = [];

function section(title: string) {
  console.log("\n" + "=".repeat(110));
  console.log(title);
  console.log("=".repeat(110));
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function display(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }

  return String(value);
}

function addIssue(category: string, message: string) {
  const line = `[${category}] ${message}`;
  issues.push(line);
  console.log(`ISSUE: ${line}`);
}

function loadGeoJSON() {
  if (!fs.existsSync(GEOJSON_PATH)) {
    throw new Error(`GeoJSON file not found: ${GEOJSON_PATH}`);
  }

  const raw = fs.readFileSync(GEOJSON_PATH, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.features)) {
    throw new Error("GeoJSON does not contain a valid features array.");
  }

  return parsed;
}

function getProperty(
  properties: Record<string, unknown>,
  ...names: string[]
): unknown {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(properties, name)) {
      return properties[name];
    }
  }

  return null;
}

async function queryRows<T extends Row = Row>(
  sql: string,
): Promise<T[]> {
  return prisma.$queryRawUnsafe<T[]>(sql);
}

async function scalarNumber(sql: string): Promise<number> {
  const rows = await queryRows<{ value: string }>(sql);

  if (rows.length === 0) {
    return 0;
  }

  return Number(rows[0].value);
}

function escapeLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

interface GeoFeature {
  county: string;
  subCounty: string;
  ward: string;
  gid: string;
  uid: string;
  scuid: string;
  cuid: string;
}

interface WardDbRow {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
  subCountyId: number;
  subCountyName: string;
  constituencyId: number;
  constituencyName: string;
}

interface ConstituencyRow {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
}

interface SubCountyRow {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
}

interface MappingRow {
  countyId: number;
  countyName: string;
  subCountyId: number;
  subCountyName: string;
  constituencyId: number;
  constituencyName: string;
  wardCount: number;
}

async function main() {
  console.log("\n" + "=".repeat(110));
  console.log("READ-ONLY GEOGRAPHY CONSTITUENCY RECONCILIATION V11");
  console.log("=".repeat(110));
  console.log("NO DATABASE CHANGES WILL BE MADE.");
  console.log("");
  console.log(
    "Purpose: validate County → SubCounty → Constituency → Ward relationships.",
  );
  console.log(
    "Primary investigation: Ward 1942 / Ward 2628 / Kisii Central Ward.",
  );
  console.log(`GeoJSON source: ${GEOJSON_PATH}`);

  const geojson = loadGeoJSON();

  /*
   * ==========================================================================================
   * SECTION 1
   * GEOJSON SOURCE SUMMARY
   * ==========================================================================================
   */

  section("SECTION 1: AUTHORITATIVE GEOJSON SOURCE SUMMARY");

  const geoFeatures: GeoFeature[] = [];

  for (const feature of geojson.features) {
    const properties =
      feature?.properties &&
      typeof feature.properties === "object"
        ? feature.properties as Record<string, unknown>
        : {};

    const county = String(
      getProperty(properties, "county", "County") ?? "",
    ).trim();

    const subCounty = String(
      getProperty(
        properties,
        "subcounty",
        "subCounty",
        "SubCounty",
        "sub_county",
      ) ?? "",
    ).trim();

    const ward = String(
      getProperty(properties, "ward", "Ward") ?? "",
    ).trim();

    const gid = String(
      getProperty(properties, "gid", "GID", "id", "ID") ?? "",
    ).trim();

    const uid = String(
      getProperty(properties, "uid", "UID") ?? "",
    ).trim();

    const scuid = String(
      getProperty(properties, "scuid", "SCUID") ?? "",
    ).trim();

    const cuid = String(
      getProperty(properties, "cuid", "CUID") ?? "",
    ).trim();

    geoFeatures.push({
      county,
      subCounty,
      ward,
      gid,
      uid,
      scuid,
      cuid,
    });
  }

  const geoCountySet = new Set(
    geoFeatures.map((x) => normalize(x.county)).filter(Boolean),
  );

  const geoSubCountySet = new Set(
    geoFeatures
      .map(
        (x) =>
          `${normalize(x.county)}|${normalize(x.subCounty)}`,
      )
      .filter((x) => x !== "|"),
  );

  const geoWardSet = new Set(
    geoFeatures
      .map(
        (x) =>
          `${normalize(x.county)}|${normalize(x.subCounty)}|${normalize(
            x.ward,
          )}`,
      )
      .filter((x) => x !== "||"),
  );

  console.log(`GeoJSON features: ${geoFeatures.length}`);
  console.log(`GeoJSON counties: ${geoCountySet.size}`);
  console.log(
    `GeoJSON county/subcounty identities: ${geoSubCountySet.size}`,
  );
  console.log(`GeoJSON county/subcounty/ward identities: ${geoWardSet.size}`);

  /*
   * ==========================================================================================
   * SECTION 2
   * DATABASE CONSTITUENCY / SUBCOUNTY STRUCTURE
   * ==========================================================================================
   */

  section("SECTION 2: DATABASE CONSTITUENCY / SUBCOUNTY STRUCTURE");

  const subCounties = await queryRows<SubCountyRow>(`
    SELECT
      sc.id,
      sc.name,
      sc."countyId",
      c.name AS "countyName"
    FROM "SubCounty" sc
    JOIN "County" c
      ON c.id = sc."countyId"
    ORDER BY c.name, sc.name, sc.id;
  `);

  const constituencies = await queryRows<ConstituencyRow>(`
    SELECT
      co.id,
      co.name,
      co."countyId",
      c.name AS "countyName"
    FROM "Constituency" co
    JOIN "County" c
      ON c.id = co."countyId"
    ORDER BY c.name, co.name, co.id;
  `);

  console.log(`Database SubCounty rows: ${subCounties.length}`);
  console.log(`Database Constituency rows: ${constituencies.length}`);

  /*
   * ==========================================================================================
   * SECTION 3
   * TRUE CONSTITUENCY IDENTITY CHECK
   * ==========================================================================================
   *
   * A constituency name alone is NOT globally unique.
   *
   * Correct logical identity:
   *
   * County + normalized constituency name
   *
   * This confirms whether duplicate constituency names are legitimate
   * because they occur in different counties.
   */

  section("SECTION 3: CONSTITUENCY LOGICAL IDENTITY AUDIT");

  const constituencyIdentityMap = new Map<string, ConstituencyRow[]>();

  for (const constituency of constituencies) {
    const key =
      `${constituency.countyId}|${normalize(constituency.name)}`;

    const existing = constituencyIdentityMap.get(key) ?? [];
    existing.push(constituency);
    constituencyIdentityMap.set(key, existing);
  }

  let trueConstituencyDuplicates = 0;

  for (const [key, rows] of constituencyIdentityMap.entries()) {
    if (rows.length > 1) {
      trueConstituencyDuplicates++;

      console.log(`\nTRUE DUPLICATE CONSTITUENCY IDENTITY: ${key}`);

      for (const row of rows) {
        console.log(
          `  Constituency ${row.id} | ${row.name} | County ${row.countyId} | ${row.countyName}`,
        );
      }
    }
  }

  console.log(
    `True duplicate constituency identities: ${trueConstituencyDuplicates}`,
  );

  if (trueConstituencyDuplicates > 0) {
    addIssue(
      "CONSTITUENCY",
      `Found ${trueConstituencyDuplicates} true duplicate constituency identities.`,
    );
  } else {
    console.log("True constituency identity audit: PASS");
  }

  /*
   * ==========================================================================================
   * SECTION 4
   * SUBCOUNTY → CONSTITUENCY MAPPING
   * ==========================================================================================
   *
   * A SubCounty should normally map to a constituency in the same county.
   *
   * This section does NOT assume that SubCounty.name === Constituency.name.
   *
   * Instead, it identifies which constituency is actually used by the wards
   * belonging to each SubCounty.
   */

  section("SECTION 4: SUBCOUNTY → CONSTITUENCY MAPPING");

  const mappingRows = await queryRows<MappingRow>(`
    SELECT
      sc."countyId" AS "countyId",
      county.name AS "countyName",
      w."subCountyId" AS "subCountyId",
      sc.name AS "subCountyName",
      w."constituencyId" AS "constituencyId",
      co.name AS "constituencyName",
      COUNT(*)::text AS "wardCount"
    FROM "Ward" w
    JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    JOIN "County" county
      ON county.id = sc."countyId"
    JOIN "Constituency" co
      ON co.id = w."constituencyId"
    GROUP BY
      sc."countyId",
      county.name,
      w."subCountyId",
      sc.name,
      w."constituencyId",
      co.name
    ORDER BY
      county.name,
      sc.name,
      co.name;
  `);

  console.log(
    `SubCounty/Constituency mappings observed through Ward rows: ${mappingRows.length}`,
  );

  for (const row of mappingRows) {
    console.log(
      `${row.countyName} | ${row.subCountyName} | Constituency ${row.constituencyId}: ${row.constituencyName} | wards=${row.wardCount}`,
    );
  }

  /*
   * ==========================================================================================
   * SECTION 5
   * SUBCOUNTIES MAPPED TO MULTIPLE CONSTITUENCIES
   * ==========================================================================================
   */

  section("SECTION 5: SUBCOUNTIES MAPPED TO MULTIPLE CONSTITUENCIES");

  const subCountyMappingMap = new Map<number, MappingRow[]>();

  for (const row of mappingRows) {
    const existing = subCountyMappingMap.get(row.subCountyId) ?? [];
    existing.push(row);
    subCountyMappingMap.set(row.subCountyId, existing);
  }

  let multiConstituencySubCountyCount = 0;

  for (const [subCountyId, rows] of subCountyMappingMap.entries()) {
    if (rows.length > 1) {
      multiConstituencySubCountyCount++;

      console.log(
        `\nSubCounty ${subCountyId} has ${rows.length} constituency mappings:`,
      );

      for (const row of rows) {
        console.log(
          `  ${row.countyName} | ${row.subCountyName} | Constituency ${row.constituencyId} | ${row.constituencyName} | wards=${row.wardCount}`,
        );
      }
    }
  }

  console.log(
    `SubCounties mapped to multiple constituencies: ${multiConstituencySubCountyCount}`,
  );

  if (multiConstituencySubCountyCount > 0) {
    addIssue(
      "SUBCOUNTY_CONSTITUENCY",
      `${multiConstituencySubCountyCount} SubCounty identities are associated with multiple constituencies through Ward rows.`,
    );
  } else {
    console.log(
      "SubCounty → Constituency cardinality audit: PASS",
    );
  }

  /*
   * ==========================================================================================
   * SECTION 6
   * WARDS WHOSE CONSTITUENCY BELONGS TO A DIFFERENT COUNTY
   * ==========================================================================================
   */

  section("SECTION 6: WARD COUNTY / CONSTITUENCY COUNTY CONSISTENCY");

  const crossCountyRows = await queryRows<{
    wardId: number;
    wardName: string;
    wardCountyId: number;
    wardCountyName: string;
    constituencyId: number;
    constituencyName: string;
    constituencyCountyId: number;
    constituencyCountyName: string;
  }>(`
    SELECT
      w.id AS "wardId",
      w.name AS "wardName",
      wc.id AS "wardCountyId",
      wc.name AS "wardCountyName",
      co.id AS "constituencyId",
      co.name AS "constituencyName",
      cc.id AS "constituencyCountyId",
      cc.name AS "constituencyCountyName"
    FROM "Ward" w
    JOIN "County" wc
      ON wc.id = w."countyId"
    JOIN "Constituency" co
      ON co.id = w."constituencyId"
    JOIN "County" cc
      ON cc.id = co."countyId"
    WHERE w."countyId" <> co."countyId"
    ORDER BY wc.name, w.name;
  `);

  console.log(
    `Wards whose County differs from Constituency County: ${crossCountyRows.length}`,
  );

  for (const row of crossCountyRows) {
    console.log(
      `Ward ${row.wardId} | ${row.wardName} | Ward County=${row.wardCountyName} (${row.wardCountyId}) | Constituency=${row.constituencyName} (${row.constituencyId}) | Constituency County=${row.constituencyCountyName} (${row.constituencyCountyId})`,
    );
  }

  if (crossCountyRows.length > 0) {
    addIssue(
      "WARD_COUNTY_CONSTITUENCY",
      `${crossCountyRows.length} Ward rows have a constituency belonging to a different county.`,
    );
  } else {
    console.log("Ward County ↔ Constituency County audit: PASS");
  }

  /*
   * ==========================================================================================
   * SECTION 7
   * WARDS WHOSE SUBCOUNTY COUNTY DIFFERS FROM WARD COUNTY
   * ==========================================================================================
   */

  section("SECTION 7: WARD COUNTY / SUBCOUNTY COUNTY CONSISTENCY");

  const subCountyCountyMismatchRows = await queryRows<{
    wardId: number;
    wardName: string;
    wardCountyId: number;
    wardCountyName: string;
    subCountyId: number;
    subCountyName: string;
    subCountyCountyId: number;
    subCountyCountyName: string;
  }>(`
    SELECT
      w.id AS "wardId",
      w.name AS "wardName",
      wc.id AS "wardCountyId",
      wc.name AS "wardCountyName",
      sc.id AS "subCountyId",
      sc.name AS "subCountyName",
      sc."countyId" AS "subCountyCountyId",
      scc.name AS "subCountyCountyName"
    FROM "Ward" w
    JOIN "County" wc
      ON wc.id = w."countyId"
    JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    JOIN "County" scc
      ON scc.id = sc."countyId"
    WHERE w."countyId" <> sc."countyId"
    ORDER BY wc.name, w.name;
  `);

  console.log(
    `Wards whose County differs from SubCounty County: ${subCountyCountyMismatchRows.length}`,
  );

  for (const row of subCountyCountyMismatchRows) {
    console.log(
      `Ward ${row.wardId} | ${row.wardName} | Ward County=${row.wardCountyName} (${row.wardCountyId}) | SubCounty=${row.subCountyName} (${row.subCountyId}) | SubCounty County=${row.subCountyCountyName} (${row.subCountyCountyId})`,
    );
  }

  if (subCountyCountyMismatchRows.length > 0) {
    addIssue(
      "WARD_COUNTY_SUBCOUNTY",
      `${subCountyCountyMismatchRows.length} Ward rows have a SubCounty belonging to a different county.`,
    );
  } else {
    console.log("Ward County ↔ SubCounty County audit: PASS");
  }

  /*
   * ==========================================================================================
   * SECTION 8
   * WARDS WHOSE SUBCOUNTY COUNTY DIFFERS FROM CONSTITUENCY COUNTY
   * ==========================================================================================
   */

  section("SECTION 8: SUBCOUNTY COUNTY / CONSTITUENCY COUNTY CONSISTENCY");

  const subCountyConstituencyCountyMismatchRows =
    await queryRows<{
      wardId: number;
      wardName: string;
      subCountyId: number;
      subCountyName: string;
      subCountyCountyId: number;
      subCountyCountyName: string;
      constituencyId: number;
      constituencyName: string;
      constituencyCountyId: number;
      constituencyCountyName: string;
    }>(`
      SELECT
        w.id AS "wardId",
        w.name AS "wardName",
        sc.id AS "subCountyId",
        sc.name AS "subCountyName",
        sc."countyId" AS "subCountyCountyId",
        scc.name AS "subCountyCountyName",
        co.id AS "constituencyId",
        co.name AS "constituencyName",
        co."countyId" AS "constituencyCountyId",
        cc.name AS "constituencyCountyName"
      FROM "Ward" w
      JOIN "SubCounty" sc
        ON sc.id = w."subCountyId"
      JOIN "County" scc
        ON scc.id = sc."countyId"
      JOIN "Constituency" co
        ON co.id = w."constituencyId"
      JOIN "County" cc
        ON cc.id = co."countyId"
      WHERE sc."countyId" <> co."countyId"
      ORDER BY scc.name, sc.name, w.name;
    `);

  console.log(
    `Wards whose SubCounty County differs from Constituency County: ${subCountyConstituencyCountyMismatchRows.length}`,
  );

  for (const row of subCountyConstituencyCountyMismatchRows) {
    console.log(
      `Ward ${row.wardId} | ${row.wardName} | SubCounty=${row.subCountyName} (${row.subCountyId}) | SubCounty County=${row.subCountyCountyName} (${row.subCountyCountyId}) | Constituency=${row.constituencyName} (${row.constituencyId}) | Constituency County=${row.constituencyCountyName} (${row.constituencyCountyId})`,
    );
  }

  if (subCountyConstituencyCountyMismatchRows.length > 0) {
    addIssue(
      "SUBCOUNTY_CONSTITUENCY_COUNTY",
      `${subCountyConstituencyCountyMismatchRows.length} Ward rows have a SubCounty County different from the Constituency County.`,
    );
  } else {
    console.log(
      "SubCounty County ↔ Constituency County audit: PASS",
    );
  }

  /*
   * ==========================================================================================
   * SECTION 9
   * EXACT KISII CENTRAL WARD INVESTIGATION
   * ==========================================================================================
   */

  section("SECTION 9: KISII CENTRAL WARD INVESTIGATION");

  const kisiiCentralRows = await queryRows<WardDbRow>(`
    SELECT
      w.id,
      w.name,
      w."countyId",
      county.name AS "countyName",
      w."subCountyId",
      sc.name AS "subCountyName",
      w."constituencyId",
      co.name AS "constituencyName"
    FROM "Ward" w
    JOIN "County" county
      ON county.id = w."countyId"
    JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    JOIN "Constituency" co
      ON co.id = w."constituencyId"
    WHERE
      county.name = 'Kisii'
      AND LOWER(TRIM(w.name)) = 'kisii central ward'
    ORDER BY w.id;
  `);

  console.log(
    `Kisii Central Ward database rows: ${kisiiCentralRows.length}`,
  );

  for (const row of kisiiCentralRows) {
    console.log("");
    console.log(`Ward ID: ${row.id}`);
    console.log(`Ward: ${row.name}`);
    console.log(
      `County: ${row.countyId} | ${row.countyName}`,
    );
    console.log(
      `SubCounty: ${row.subCountyId} | ${row.subCountyName}`,
    );
    console.log(
      `Constituency: ${row.constituencyId} | ${row.constituencyName}`,
    );
  }

  const kisiiCentralGeo = geoFeatures.filter(
    (feature) =>
      normalize(feature.county) === "kisii" &&
      normalize(feature.ward) === "kisii central ward",
  );

  console.log("");
  console.log(
    `Kisii Central Ward GeoJSON features: ${kisiiCentralGeo.length}`,
  );

  for (const feature of kisiiCentralGeo) {
    console.log("");
    console.log(
      `GeoJSON gid=${feature.gid} | ${feature.county} | ${feature.subCounty} | ${feature.ward}`,
    );
    console.log(
      `uid=${feature.uid} | scuid=${feature.scuid} | cuid=${feature.cuid}`,
    );
  }

  /*
   * ==========================================================================================
   * SECTION 10
   * DIRECT KISII SUBCOUNTY / CONSTITUENCY MAPPING
   * ==========================================================================================
   */

  section("SECTION 10: KISII SUBCOUNTY / CONSTITUENCY MAPPING");

  const kisiiMappings = mappingRows.filter(
    (row) => normalize(row.countyName) === "kisii",
  );

  console.log(
    `Kisii SubCounty/Constituency mappings: ${kisiiMappings.length}`,
  );

  for (const row of kisiiMappings) {
    console.log(
      `${row.subCountyId} | ${row.subCountyName} | Constituency ${row.constituencyId} | ${row.constituencyName} | wards=${row.wardCount}`,
    );
  }

  /*
   * ==========================================================================================
   * SECTION 11
   * KITUTU CHACHE SOUTH INVESTIGATION
   * ==========================================================================================
   */

  section("SECTION 11: KITUTU CHACHE SOUTH INVESTIGATION");

  const kitutuRows = await queryRows<WardDbRow>(`
    SELECT
      w.id,
      w.name,
      w."countyId",
      county.name AS "countyName",
      w."subCountyId",
      sc.name AS "subCountyName",
      w."constituencyId",
      co.name AS "constituencyName"
    FROM "Ward" w
    JOIN "County" county
      ON county.id = w."countyId"
    JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    JOIN "Constituency" co
      ON co.id = w."constituencyId"
    WHERE
      county.name = 'Kisii'
      AND LOWER(TRIM(sc.name)) = 'kitutu chache south sub county'
    ORDER BY w.id;
  `);

  console.log(
    `Kitutu Chache South Ward rows: ${kitutuRows.length}`,
  );

  for (const row of kitutuRows) {
    console.log(
      `Ward ${row.id} | ${row.name} | Constituency ${row.constituencyId} | ${row.constituencyName}`,
    );
  }

  /*
   * ==========================================================================================
   * SECTION 12
   * NYARIBARI CHACHE INVESTIGATION
   * ==========================================================================================
   */

  section("SECTION 12: NYARIBARI CHACHE INVESTIGATION");

  const nyaribariRows = await queryRows<WardDbRow>(`
    SELECT
      w.id,
      w.name,
      w."countyId",
      county.name AS "countyName",
      w."subCountyId",
      sc.name AS "subCountyName",
      w."constituencyId",
      co.name AS "constituencyName"
    FROM "Ward" w
    JOIN "County" county
      ON county.id = w."countyId"
    JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    JOIN "Constituency" co
      ON co.id = w."constituencyId"
    WHERE
      county.name = 'Kisii'
      AND LOWER(TRIM(sc.name)) = 'nyaribari chache sub county'
    ORDER BY w.id;
  `);

  console.log(
    `Nyaribari Chache Ward rows: ${nyaribariRows.length}`,
  );

  for (const row of nyaribariRows) {
    console.log(
      `Ward ${row.id} | ${row.name} | Constituency ${row.constituencyId} | ${row.constituencyName}`,
    );
  }

  /*
   * ==========================================================================================
   * SECTION 13
   * WARD SUBCOUNTY / CONSTITUENCY NAME RELATIONSHIP
   * ==========================================================================================
   *
   * This does NOT declare that the names must be identical.
   *
   * It only shows mappings where the normalized names differ.
   *
   * This is diagnostic information, not automatically an error.
   */

  section("SECTION 13: SUBCOUNTY / CONSTITUENCY NAME DIFFERENCES");

  const differentNameMappings = mappingRows.filter(
    (row) =>
      normalize(row.subCountyName) !==
      normalize(row.constituencyName),
  );

  console.log(
    `SubCounty/Constituency mappings with different normalized names: ${differentNameMappings.length}`,
  );

  for (const row of differentNameMappings) {
    console.log(
      `${row.countyName} | SubCounty=${row.subCountyName} (${row.subCountyId}) | Constituency=${row.constituencyName} (${row.constituencyId}) | wards=${row.wardCount}`,
    );
  }

  /*
   * ==========================================================================================
   * SECTION 14
   * GEOJSON SUBCOUNTY / DB SUBCOUNTY RECONCILIATION
   * ==========================================================================================
   */

  section("SECTION 14: GEOJSON SUBCOUNTY / DATABASE SUBCOUNTY RECONCILIATION");

  const dbSubCountyIdentityMap = new Map<
    string,
    SubCountyRow
  >();

  for (const row of subCounties) {
    const key =
      `${normalize(row.countyName)}|${normalize(row.name)}`;

    dbSubCountyIdentityMap.set(key, row);
  }

  const geoSubCountyIdentities = new Map<
    string,
    {
      county: string;
      subCounty: string;
      wardCount: number;
    }
  >();

  for (const feature of geoFeatures) {
    const key =
      `${normalize(feature.county)}|${normalize(feature.subCounty)}`;

    const existing = geoSubCountyIdentities.get(key);

    if (existing) {
      existing.wardCount++;
    } else {
      geoSubCountyIdentities.set(key, {
        county: feature.county,
        subCounty: feature.subCounty,
        wardCount: 1,
      });
    }
  }

  let missingDbSubCounties = 0;
  let extraDbSubCounties = 0;

  for (const [key, geo] of geoSubCountyIdentities.entries()) {
    if (!dbSubCountyIdentityMap.has(key)) {
      missingDbSubCounties++;

      console.log(
        `GEOJSON SUBCOUNTY MISSING FROM DB: ${geo.county} | ${geo.subCounty} | wards=${geo.wardCount}`,
      );
    }
  }

  for (const [key, db] of dbSubCountyIdentityMap.entries()) {
    if (!geoSubCountyIdentities.has(key)) {
      extraDbSubCounties++;

      console.log(
        `DB SUBCOUNTY NOT FOUND IN GEOJSON: ${db.countyName} | ${db.name} | DB ID=${db.id}`,
      );
    }
  }

  console.log(`GeoJSON subcounties missing from DB: ${missingDbSubCounties}`);
  console.log(`DB subcounties not found in GeoJSON: ${extraDbSubCounties}`);

  /*
   * ==========================================================================================
   * SECTION 15
   * GEOJSON WARD COUNT VS DB WARD COUNT PER SUBCOUNTY
   * ==========================================================================================
   */

  section("SECTION 15: GEOJSON VS DATABASE WARD COUNTS BY SUBCOUNTY");

  const dbWardCounts = await queryRows<{
    countyName: string;
    subCountyName: string;
    wardCount: string;
  }>(`
    SELECT
      c.name AS "countyName",
      sc.name AS "subCountyName",
      COUNT(*)::text AS "wardCount"
    FROM "Ward" w
    JOIN "County" c
      ON c.id = w."countyId"
    JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    GROUP BY
      c.name,
      sc.name
    ORDER BY
      c.name,
      sc.name;
  `);

  const dbWardCountMap = new Map<string, number>();

  for (const row of dbWardCounts) {
    const key =
      `${normalize(row.countyName)}|${normalize(row.subCountyName)}`;

    dbWardCountMap.set(key, Number(row.wardCount));
  }

  let wardCountMismatches = 0;

  for (const [key, geo] of geoSubCountyIdentities.entries()) {
    const dbCount = dbWardCountMap.get(key) ?? 0;

    if (dbCount !== geo.wardCount) {
      wardCountMismatches++;

      console.log(
        `COUNT MISMATCH: ${geo.county} | ${geo.subCounty} | GeoJSON=${geo.wardCount} | DB=${dbCount}`,
      );
    }
  }

  console.log(
    `SubCounty ward-count mismatches: ${wardCountMismatches}`,
  );

  if (wardCountMismatches > 0) {
    addIssue(
      "WARD_COUNT",
      `${wardCountMismatches} SubCounty ward counts differ between DB and GeoJSON.`,
    );
  } else {
    console.log("SubCounty ward-count reconciliation: PASS");
  }

  /*
   * ==========================================================================================
   * SECTION 16
   * ALL WARDS WHERE SUBCOUNTY AND CONSTITUENCY HAVE DIFFERENT NORMALIZED NAMES
   * ==========================================================================================
   *
   * This is diagnostic only.
   *
   * Many valid Kenyan administrative structures may use different names.
   */

  section(
    "SECTION 16: ALL WARD ROWS WITH DIFFERENT SUBCOUNTY / CONSTITUENCY NAMES",
  );

  const differentWardRelationshipRows =
    await queryRows<WardDbRow>(`
      SELECT
        w.id,
        w.name,
        w."countyId",
        county.name AS "countyName",
        w."subCountyId",
        sc.name AS "subCountyName",
        w."constituencyId",
        co.name AS "constituencyName"
      FROM "Ward" w
      JOIN "County" county
        ON county.id = w."countyId"
      JOIN "SubCounty" sc
        ON sc.id = w."subCountyId"
      JOIN "Constituency" co
        ON co.id = w."constituencyId"
      WHERE LOWER(TRIM(sc.name)) <> LOWER(TRIM(co.name))
      ORDER BY county.name, sc.name, co.name, w.name;
    `);

  console.log(
    `Ward rows with different SubCounty / Constituency normalized names: ${differentWardRelationshipRows.length}`,
  );

  for (const row of differentWardRelationshipRows) {
    console.log(
      `Ward ${row.id} | ${row.name} | ${row.countyName} | SubCounty=${row.subCountyName} (${row.subCountyId}) | Constituency=${row.constituencyName} (${row.constituencyId})`,
    );
  }

  /*
   * ==========================================================================================
   * SECTION 17
   * TARGETED WARD 1942 DIAGNOSTIC
   * ==========================================================================================
   */

  section("SECTION 17: TARGETED WARD 1942 DIAGNOSTIC");

  const ward1942 = await queryRows<WardDbRow>(`
    SELECT
      w.id,
      w.name,
      w."countyId",
      county.name AS "countyName",
      w."subCountyId",
      sc.name AS "subCountyName",
      w."constituencyId",
      co.name AS "constituencyName"
    FROM "Ward" w
    JOIN "County" county
      ON county.id = w."countyId"
    JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    JOIN "Constituency" co
      ON co.id = w."constituencyId"
    WHERE w.id = 1942;
  `);

  if (ward1942.length === 0) {
    console.log("Ward 1942 was not found.");
    addIssue(
      "WARD_1942",
      "Ward 1942 was expected for investigation but was not found.",
    );
  } else {
    const row = ward1942[0];

    console.log(`Ward ID: ${row.id}`);
    console.log(`Ward: ${row.name}`);
    console.log(
      `County: ${row.countyId} | ${row.countyName}`,
    );
    console.log(
      `SubCounty: ${row.subCountyId} | ${row.subCountyName}`,
    );
    console.log(
      `Constituency: ${row.constituencyId} | ${row.constituencyName}`,
    );

    const subCountyConstituencies = await queryRows<ConstituencyRow>(`
      SELECT
        co.id,
        co.name,
        co."countyId",
        c.name AS "countyName"
      FROM "Constituency" co
      JOIN "County" c
        ON c.id = co."countyId"
      WHERE co."countyId" = ${row.countyId}
      ORDER BY co.name, co.id;
    `);

    console.log("");
    console.log(
      `All Kisii constituencies (${subCountyConstituencies.length}):`,
    );

    for (const constituency of subCountyConstituencies) {
      console.log(
        `  Constituency ${constituency.id} | ${constituency.name} | County ${constituency.countyId} | ${constituency.countyName}`,
      );
    }

    const kitutuMapping = mappingRows.filter(
      (mapping) =>
        mapping.subCountyId === row.subCountyId,
    );

    console.log("");
    console.log(
      `Constituencies currently used by wards in SubCounty ${row.subCountyId}:`,
    );

    for (const mapping of kitutuMapping) {
      console.log(
        `  Constituency ${mapping.constituencyId} | ${mapping.constituencyName} | wards=${mapping.wardCount}`,
      );
    }
  }

  /*
   * ==========================================================================================
   * SECTION 18
   * TARGETED WARD 2628 DIAGNOSTIC
   * ==========================================================================================
   */

  section("SECTION 18: TARGETED WARD 2628 DIAGNOSTIC");

  const ward2628 = await queryRows<WardDbRow>(`
    SELECT
      w.id,
      w.name,
      w."countyId",
      county.name AS "countyName",
      w."subCountyId",
      sc.name AS "subCountyName",
      w."constituencyId",
      co.name AS "constituencyName"
    FROM "Ward" w
    JOIN "County" county
      ON county.id = w."countyId"
    JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    JOIN "Constituency" co
      ON co.id = w."constituencyId"
    WHERE w.id = 2628;
  `);

  if (ward2628.length === 0) {
    console.log("Ward 2628 was not found.");
    addIssue(
      "WARD_2628",
      "Ward 2628 was expected for investigation but was not found.",
    );
  } else {
    const row = ward2628[0];

    console.log(`Ward ID: ${row.id}`);
    console.log(`Ward: ${row.name}`);
    console.log(
      `County: ${row.countyId} | ${row.countyName}`,
    );
    console.log(
      `SubCounty: ${row.subCountyId} | ${row.subCountyName}`,
    );
    console.log(
      `Constituency: ${row.constituencyId} | ${row.constituencyName}`,
    );

    const mappings = mappingRows.filter(
      (mapping) =>
        mapping.subCountyId === row.subCountyId,
    );

    console.log("");
    console.log(
      `Constituencies currently used by wards in SubCounty ${row.subCountyId}:`,
    );

    for (const mapping of mappings) {
      console.log(
        `  Constituency ${mapping.constituencyId} | ${mapping.constituencyName} | wards=${mapping.wardCount}`,
      );
    }
  }

  /*
   * ==========================================================================================
   * SECTION 19
   * POTENTIAL REPAIR TARGETS
   * ==========================================================================================
   *
   * IMPORTANT:
   *
   * This section does NOT modify anything.
   *
   * It only identifies rows that are candidates for manual review.
   */

  section("SECTION 19: POTENTIAL REPAIR TARGETS");

  const repairCandidates = await queryRows<WardDbRow>(`
    SELECT
      w.id,
      w.name,
      w."countyId",
      county.name AS "countyName",
      w."subCountyId",
      sc.name AS "subCountyName",
      w."constituencyId",
      co.name AS "constituencyName"
    FROM "Ward" w
    JOIN "County" county
      ON county.id = w."countyId"
    JOIN "SubCounty" sc
      ON sc.id = w."subCountyId"
    JOIN "Constituency" co
      ON co.id = w."constituencyId"
    WHERE
      sc."countyId" <> co."countyId"
      OR w."countyId" <> sc."countyId"
      OR w."countyId" <> co."countyId"
    ORDER BY county.name, sc.name, w.name;
  `);

  console.log(
    `Potential cross-administrative repair candidates: ${repairCandidates.length}`,
  );

  for (const row of repairCandidates) {
    console.log(
      `Ward ${row.id} | ${row.name} | County=${row.countyName} | SubCounty=${row.subCountyName} (${row.subCountyId}) | Constituency=${row.constituencyName} (${row.constituencyId})`,
    );
  }

  /*
   * ==========================================================================================
   * SECTION 20
   * FINAL READ-ONLY CONCLUSION
   * ==========================================================================================
   */

  section("SECTION 20: V11 FINAL STATUS");

  console.log(`Total V11 issues: ${issues.length}`);

  if (issues.length === 0) {
    console.log("");
    console.log("V11 RESULT: PASS");
    console.log(
      "No County/SubCounty/Constituency relationship inconsistencies were detected.",
    );
  } else {
    console.log("");
    console.log("V11 RESULT: REVIEW REQUIRED");
    console.log("");
    console.log("Issues detected:");

    for (const issue of issues) {
      console.log(`- ${issue}`);
    }
  }

  console.log("");
  console.log("IMPORTANT:");
  console.log("READ-ONLY AUDIT ONLY.");
  console.log("NO DATABASE CHANGES WERE MADE.");
  console.log(
    "DO NOT DELETE, MERGE, OR UPDATE WARD 1942 OR WARD 2628 FROM THIS AUDIT ALONE.",
  );
  console.log(
    "The output must be reviewed before preparing any repair script.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("V11 AUDIT FAILED.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });