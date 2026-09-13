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

type WardDiagnostic = {
  ward_id: string;
  ward_name: string;
  ward_normalized_name: string;
  constituency_id: string;
  constituency_name: string;
  constituency_normalized_name: string;
  county_id: string;
  county_name: string;
  subcounty_id: string;
  subcounty_name: string;
};

type ConstituencyDiagnostic = {
  constituency_id: string;
  constituency_name: string;
  constituency_normalized_name: string;
  county_id: string;
  county_name: string;
};

type GeoIdentity = {
  county: string;
  subcounty: string;
  constituency: string;
  ward: string;
  raw: Record<string, unknown>;
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

function normalizeName(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }

  return String(value);
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function escapeLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function queryRows<T extends QueryRow>(
  sql: string,
): Promise<T[]> {
  return prisma.$queryRawUnsafe<T[]>(sql);
}

async function scalarNumber(sql: string): Promise<number> {
  const rows = await queryRows<{ value: string }>(sql);

  return Number(rows[0]?.value ?? 0);
}

function printLine() {
  console.log("=".repeat(100));
}

function printTitle(title: string) {
  console.log("");
  printLine();
  console.log(title);
  printLine();
}

function findProperty(
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

  const normalizedCandidates = candidates.map(
    normalizeName,
  );

  for (const [key, value] of Object.entries(
    properties,
  )) {
    const normalizedKey = normalizeName(key);

    if (
      normalizedCandidates.includes(normalizedKey)
    ) {
      return value;
    }
  }

  return undefined;
}

function loadGeoJSON(): GeoJSONDocument {
  const geoPath = path.resolve(
    process.cwd(),
    "prisma",
    "data",
    "kenya-wards-1450.geojson",
  );

  if (!fs.existsSync(geoPath)) {
    throw new Error(
      `GeoJSON not found: ${geoPath}`,
    );
  }

  const raw = fs.readFileSync(
    geoPath,
    "utf8",
  );

  return JSON.parse(raw) as GeoJSONDocument;
}

function extractGeoIdentities(
  geojson: GeoJSONDocument,
): GeoIdentity[] {
  const features = Array.isArray(
    geojson.features,
  )
    ? geojson.features
    : [];

  return features.map((feature) => {
    const properties =
      feature.properties ?? {};

    const county = displayValue(
      findProperty(properties, [
        "county",
        "County",
        "county_name",
        "countyName",
        "COUNTY",
        "COUNTY_NAME",
      ]),
    );

    const subcounty = displayValue(
      findProperty(properties, [
        "subcounty",
        "SubCounty",
        "sub_county",
        "subCounty",
        "subcounty_name",
        "subCountyName",
        "SUBCOUNTY",
        "SUB_COUNTY",
        "SUBCOUNTY_NAME",
      ]),
    );

    const constituency = displayValue(
      findProperty(properties, [
        "constituency",
        "Constituency",
        "constituency_name",
        "constituencyName",
        "CONSTITUENCY",
        "CONSTITUENCY_NAME",
      ]),
    );

    const ward = displayValue(
      findProperty(properties, [
        "ward",
        "Ward",
        "ward_name",
        "wardName",
        "WARD",
        "WARD_NAME",
        "name",
        "Name",
      ]),
    );

    return {
      county,
      subcounty,
      constituency,
      ward,
      raw: properties,
    };
  });
}

function buildGeoIdentityKey(
  county: string,
  subcounty: string,
  constituency: string,
  ward: string,
): string {
  return [
    normalizeName(county),
    normalizeName(subcounty),
    normalizeName(constituency),
    normalizeName(ward),
  ].join("|");
}

async function auditDuplicateWardIdentity() {
  printTitle(
    "SECTION 1: EXACT DUPLICATE WARD IDENTITY",
  );

  const duplicateGroups =
    await queryRows<{
      constituency_id: string;
      normalized_ward_name: string;
      duplicate_count: string;
    }>(`
      SELECT
        "constituencyId"::text AS constituency_id,
        LOWER(TRIM(name)) AS normalized_ward_name,
        COUNT(*)::text AS duplicate_count
      FROM "Ward"
      GROUP BY
        "constituencyId",
        LOWER(TRIM(name))
      HAVING COUNT(*) > 1
      ORDER BY
        "constituencyId",
        LOWER(TRIM(name));
    `);

  console.log(
    `Duplicate Ward identity groups: ${duplicateGroups.length}`,
  );

  if (duplicateGroups.length === 0) {
    console.log(
      "No duplicate Ward identities found.",
    );

    return [];
  }

  const allRows: WardDiagnostic[] = [];

  for (const group of duplicateGroups) {
    console.log("");
    console.log(
      `Duplicate identity: constituencyId=${group.constituency_id}, normalizedWard=${group.normalized_ward_name}`,
    );
    console.log(
      `Rows in duplicate group: ${group.duplicate_count}`,
    );

    const rows =
      await queryRows<WardDiagnostic>(`
        SELECT
          w.id::text AS ward_id,
          w.name AS ward_name,
          LOWER(TRIM(w.name)) AS ward_normalized_name,

          c.id::text AS constituency_id,
          c.name AS constituency_name,
          LOWER(TRIM(c.name)) AS constituency_normalized_name,

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

        WHERE w."constituencyId" = ${escapeLiteral(
          group.constituency_id,
        )}::integer

          AND LOWER(TRIM(w.name)) =
            ${escapeLiteral(
              group.normalized_ward_name,
            )}

        ORDER BY w.id;
      `);

    for (const row of rows) {
      allRows.push(row);

      console.log("");
      console.log(
        `Ward ID:              ${row.ward_id}`,
      );
      console.log(
        `Ward name:            ${row.ward_name}`,
      );
      console.log(
        `Ward normalized:      ${row.ward_normalized_name}`,
      );
      console.log(
        `Constituency ID:      ${row.constituency_id}`,
      );
      console.log(
        `Constituency name:    ${row.constituency_name}`,
      );
      console.log(
        `County ID:            ${row.county_id}`,
      );
      console.log(
        `County name:          ${row.county_name}`,
      );
      console.log(
        `SubCounty ID:         ${row.subcounty_id}`,
      );
      console.log(
        `SubCounty name:       ${row.subcounty_name}`,
      );
    }
  }

  return allRows;
}

async function auditDuplicateConstituencyNames() {
  printTitle(
    "SECTION 2: DUPLICATE CONSTITUENCY NAME INVESTIGATION",
  );

  const duplicateGroups =
    await queryRows<{
      normalized_name: string;
      duplicate_count: string;
    }>(`
      SELECT
        LOWER(TRIM(name)) AS normalized_name,
        COUNT(*)::text AS duplicate_count
      FROM "Constituency"
      GROUP BY LOWER(TRIM(name))
      HAVING COUNT(*) > 1
      ORDER BY LOWER(TRIM(name));
    `);

  console.log(
    `Duplicate Constituency.name groups: ${duplicateGroups.length}`,
  );

  const allRows: ConstituencyDiagnostic[] =
    [];

  for (const group of duplicateGroups) {
    console.log("");
    console.log(
      `Duplicate constituency name: ${group.normalized_name}`,
    );
    console.log(
      `Rows: ${group.duplicate_count}`,
    );

    const rows =
      await queryRows<ConstituencyDiagnostic>(`
        SELECT
          c.id::text AS constituency_id,
          c.name AS constituency_name,
          LOWER(TRIM(c.name)) AS constituency_normalized_name,
          co.id::text AS county_id,
          co.name AS county_name
        FROM "Constituency" c
        JOIN "County" co
          ON co.id = c."countyId"
        WHERE LOWER(TRIM(c.name)) =
          ${escapeLiteral(
            group.normalized_name,
          )}
        ORDER BY co.id, c.id;
      `);

    for (const row of rows) {
      allRows.push(row);

      const wardCount =
        await scalarNumber(`
          SELECT COUNT(*)::text AS value
          FROM "Ward"
          WHERE "constituencyId" =
            ${escapeLiteral(
              row.constituency_id,
            )}::integer;
        `);

      console.log("");
      console.log(
        `Constituency ID:   ${row.constituency_id}`,
      );
      console.log(
        `Name:              ${row.constituency_name}`,
      );
      console.log(
        `County ID:         ${row.county_id}`,
      );
      console.log(
        `County:            ${row.county_name}`,
      );
      console.log(
        `Ward count:        ${wardCount}`,
      );
    }
  }

  return allRows;
}

function matchGeoIdentity(
  row: WardDiagnostic,
  geoIdentities: GeoIdentity[],
): GeoIdentity[] {
  const exactKey = buildGeoIdentityKey(
    row.county_name,
    row.subcounty_name,
    row.constituency_name,
    row.ward_name,
  );

  return geoIdentities.filter(
    (geo) =>
      buildGeoIdentityKey(
        geo.county,
        geo.subcounty,
        geo.constituency,
        geo.ward,
      ) === exactKey,
  );
}

function matchGeoByWardAndConstituency(
  row: WardDiagnostic,
  geoIdentities: GeoIdentity[],
): GeoIdentity[] {
  const wardKey = normalizeName(
    row.ward_name,
  );

  const constituencyKey =
    normalizeName(
      row.constituency_name,
    );

  return geoIdentities.filter(
    (geo) =>
      normalizeName(geo.ward) === wardKey &&
      normalizeName(
        geo.constituency,
      ) === constituencyKey,
  );
}

async function compareDuplicateWardWithGeoJSON(
  duplicateWardRows: WardDiagnostic[],
  geoIdentities: GeoIdentity[],
) {
  printTitle(
    "SECTION 3: DUPLICATE WARD VS AUTHORITATIVE GEOJSON",
  );

  if (duplicateWardRows.length === 0) {
    console.log(
      "No duplicate Ward rows require GeoJSON comparison.",
    );

    return;
  }

  for (const row of duplicateWardRows) {
    console.log("");
    console.log(
      `DATABASE WARD ID ${row.ward_id}`,
    );

    console.log(
      `County:       ${row.county_name}`,
    );

    console.log(
      `SubCounty:    ${row.subcounty_name}`,
    );

    console.log(
      `Constituency: ${row.constituency_name}`,
    );

    console.log(
      `Ward:         ${row.ward_name}`,
    );

    const exactMatches =
      matchGeoIdentity(
        row,
        geoIdentities,
      );

    console.log(
      `Exact authoritative GeoJSON identity matches: ${exactMatches.length}`,
    );

    for (const match of exactMatches) {
      console.log(
        `  GEOJSON -> ${match.county} / ${match.subcounty} / ${match.constituency} / ${match.ward}`,
      );
    }

    const hierarchyMatches =
      matchGeoByWardAndConstituency(
        row,
        geoIdentities,
      );

    console.log(
      `GeoJSON matches by constituency + ward: ${hierarchyMatches.length}`,
    );

    if (
      hierarchyMatches.length > 0
    ) {
      for (const match of hierarchyMatches) {
        console.log(
          `  HIERARCHY -> ${match.county} / ${match.subcounty} / ${match.constituency} / ${match.ward}`,
        );
      }
    }

    if (
      exactMatches.length === 1
    ) {
      console.log(
        "AUTHORITY RESULT: This database identity exists exactly once in the authoritative GeoJSON.",
      );
    } else if (
      exactMatches.length === 0
    ) {
      console.log(
        "AUTHORITY RESULT: This database identity was NOT found exactly in the authoritative GeoJSON.",
      );
    } else {
      console.log(
        "AUTHORITY RESULT: Multiple authoritative GeoJSON matches were found. Investigate source uniqueness.",
      );
    }
  }
}

async function inspectConstituencyWardSets(
  duplicateConstituencies: ConstituencyDiagnostic[],
) {
  printTitle(
    "SECTION 4: CONSTITUENCY WARD-SET COMPARISON",
  );

  if (
    duplicateConstituencies.length === 0
  ) {
    console.log(
      "No duplicate Constituency names require comparison.",
    );

    return;
  }

  const grouped = new Map<
    string,
    ConstituencyDiagnostic[]
  >();

  for (const row of duplicateConstituencies) {
    const key =
      row.constituency_normalized_name;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)!.push(row);
  }

  for (const [
    normalizedName,
    rows,
  ] of grouped.entries()) {
    console.log("");
    console.log(
      `Constituency normalized name: ${normalizedName}`,
    );

    for (const row of rows) {
      const wards =
        await queryRows<{
          ward_id: string;
          ward_name: string;
          normalized_name: string;
        }>(`
          SELECT
            id::text AS ward_id,
            name AS ward_name,
            LOWER(TRIM(name)) AS normalized_name
          FROM "Ward"
          WHERE "constituencyId" =
            ${escapeLiteral(
              row.constituency_id,
            )}::integer
          ORDER BY id;
        `);

      console.log("");
      console.log(
        `Constituency ${row.constituency_id} | ${row.constituency_name}`,
      );

      console.log(
        `County ${row.county_id} | ${row.county_name}`,
      );

      console.log(
        `Ward count: ${wards.length}`,
      );

      for (const ward of wards) {
        console.log(
          `  Ward ${ward.ward_id}: ${ward.ward_name}`,
        );
      }
    }
  }
}

async function auditAuthoritativeGeoJSONTotals(
  geoIdentities: GeoIdentity[],
) {
  printTitle(
    "SECTION 5: AUTHORITATIVE GEOJSON SUMMARY",
  );

  console.log(
    `GeoJSON feature count: ${geoIdentities.length}`,
  );

  const countySet = new Set(
    geoIdentities.map((x) =>
      normalizeName(x.county),
    ),
  );

  const subcountySet = new Set(
    geoIdentities.map((x) =>
      `${normalizeName(
        x.county,
      )}|${normalizeName(x.subcounty)}`,
    ),
  );

  const constituencySet = new Set(
    geoIdentities.map((x) =>
      `${normalizeName(
        x.county,
      )}|${normalizeName(
        x.constituency,
      )}`,
    ),
  );

  const wardSet = new Set(
    geoIdentities.map((x) =>
      buildGeoIdentityKey(
        x.county,
        x.subcounty,
        x.constituency,
        x.ward,
      ),
    ),
  );

  console.log(
    `Authoritative counties: ${countySet.size}`,
  );

  console.log(
    `Authoritative county/subcounty identities: ${subcountySet.size}`,
  );

  console.log(
    `Authoritative county/constituency identities: ${constituencySet.size}`,
  );

  console.log(
    `Authoritative full ward identities: ${wardSet.size}`,
  );

  if (
    geoIdentities.length !==
    wardSet.size
  ) {
    console.log(
      "WARNING: GeoJSON itself contains duplicate full ward identities.",
    );
  } else {
    console.log(
      "GeoJSON full ward identities are unique.",
    );
  }
}

async function inspectPotentialGlobalWardNameDuplicates() {
  printTitle(
    "SECTION 6: WARD NAME DUPLICATES — DIAGNOSTIC ONLY",
  );

  const rows =
    await queryRows<{
      normalized_name: string;
      duplicate_count: string;
    }>(`
      SELECT
        LOWER(TRIM(name)) AS normalized_name,
        COUNT(*)::text AS duplicate_count
      FROM "Ward"
      GROUP BY LOWER(TRIM(name))
      HAVING COUNT(*) > 1
      ORDER BY
        COUNT(*) DESC,
        LOWER(TRIM(name));
    `);

  console.log(
    `Global duplicate Ward-name groups: ${rows.length}`,
  );

  console.log(
    "These are NOT automatically errors because ward names may legitimately repeat in different constituencies.",
  );

  for (const row of rows) {
    console.log(
      `  ${row.normalized_name}: ${row.duplicate_count}`,
    );
  }
}

async function inspectPotentialConstituencyIdentityDuplicates() {
  printTitle(
    "SECTION 7: CONSTITUENCY IDENTITY CHECK",
  );

  const rows =
    await queryRows<{
      county_id: string;
      county_name: string;
      normalized_name: string;
      duplicate_count: string;
    }>(`
      SELECT
        c."countyId"::text AS county_id,
        co.name AS county_name,
        LOWER(TRIM(c.name)) AS normalized_name,
        COUNT(*)::text AS duplicate_count
      FROM "Constituency" c
      JOIN "County" co
        ON co.id = c."countyId"
      GROUP BY
        c."countyId",
        co.name,
        LOWER(TRIM(c.name))
      HAVING COUNT(*) > 1
      ORDER BY
        co.name,
        LOWER(TRIM(c.name));
    `);

  console.log(
    `Duplicate Constituency identities using countyId + normalized name: ${rows.length}`,
  );

  if (rows.length === 0) {
    console.log(
      "No true duplicate Constituency identities found.",
    );
  } else {
    for (const row of rows) {
      console.log(
        `  County ${row.county_id} (${row.county_name}) / ${row.normalized_name}: ${row.duplicate_count}`,
      );
    }
  }
}

async function main() {
  console.log("");
  printLine();
  console.log(
    "READ-ONLY GEOGRAPHY FORENSIC AUDIT V9",
  );
  printLine();

  console.log(
    "NO DATABASE CHANGES WILL BE MADE.",
  );

  console.log("");
  console.log(
    "Purpose: identify the exact Ward identity collision and investigate duplicate Constituency names.",
  );

  const geojson = loadGeoJSON();

  const geoIdentities =
    extractGeoIdentities(
      geojson,
    );

  await auditAuthoritativeGeoJSONTotals(
    geoIdentities,
  );

  const duplicateWardRows =
    await auditDuplicateWardIdentity();

  const duplicateConstituencies =
    await auditDuplicateConstituencyNames();

  await compareDuplicateWardWithGeoJSON(
    duplicateWardRows,
    geoIdentities,
  );

  await inspectConstituencyWardSets(
    duplicateConstituencies,
  );

  await inspectPotentialGlobalWardNameDuplicates();

  await inspectPotentialConstituencyIdentityDuplicates();

  printTitle(
    "FINAL V9 FORENSIC CONCLUSION",
  );

  console.log(
    `Duplicate Ward identity groups investigated: ${duplicateWardRows.length > 0 ? "YES" : "NONE"}`,
  );

  console.log(
    `Duplicate Constituency-name groups investigated: ${duplicateConstituencies.length}`,
  );

  console.log("");
  console.log(
    "V9 IS READ-ONLY.",
  );

  console.log(
    "NO DATABASE RECORDS WERE INSERTED, UPDATED, DELETED, OR MIGRATED.",
  );

  console.log("");
  console.log(
    "NEXT STEP: use the exact records printed above to determine whether the duplicate Ward is a genuine duplicate or a legitimate administrative identity before making any repair.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "GEOGRAPHY FORENSIC AUDIT V9 FAILED",
    );
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });