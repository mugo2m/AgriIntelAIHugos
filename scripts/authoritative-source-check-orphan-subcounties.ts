import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const GEOJSON_PATH = path.join(
  process.cwd(),
  "prisma",
  "data",
  "kenya-wards-1450.geojson"
);

const EXPECTED_WARD_COUNT = 1450;

type GeoFeature = {
  type?: string;
  properties?: Record<string, unknown>;
};

type GeoJSON = {
  type?: string;
  features?: GeoFeature[];
};

type SourceRecord = {
  county: string;
  subCounty: string;
  ward: string;
};

type DbSubCounty = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
};

type Result = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;

  sourceCountyMatch: boolean;
  sourceSubCountyMatch: boolean;

  sourceCountyNames: string[];
  sourceSubCountyNames: string[];

  authoritativeWardCount: number;
  databaseWardCount: number;

  authoritativeWards: string[];
  databaseWards: string[];

  missingDatabaseWards: string[];
  unexpectedDatabaseWards: string[];

  normalizedDuplicateIds: number[];
  normalizedDuplicateNames: string[];

  classification:
    | "SAFE_DELETE_CANDIDATE"
    | "POSSIBLE_DUPLICATE_MERGE"
    | "REVIEW_REQUIRED"
    | "KEEP";

  reasons: string[];
};

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘`´']/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/subcounty$/i, "")
    .replace(/county$/i, "")
    .trim();
}

function normalizeWardName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘`´']/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function getString(
  properties: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = properties[key];

    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      return value.trim();
    }
  }

  return null;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("AUTHORITATIVE SOURCE VALIDATION");
  console.log("============================================================");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  // ----------------------------------------------------------
  // 1. VERIFY SOURCE FILE
  // ----------------------------------------------------------

  console.log("Authoritative source:");

  console.log(GEOJSON_PATH);

  console.log("");

  if (!fs.existsSync(GEOJSON_PATH)) {
    throw new Error(
      `SOURCE FILE NOT FOUND:\n${GEOJSON_PATH}\n\n` +
      `SAFETY STOP: No classification will be made without ` +
      `the authoritative 1,450-ward source.`
    );
  }

  const raw = fs.readFileSync(
    GEOJSON_PATH,
    "utf8"
  );

  const geojson =
    JSON.parse(raw) as GeoJSON;

  if (!Array.isArray(geojson.features)) {
    throw new Error(
      "SAFETY STOP: GeoJSON does not contain a features array."
    );
  }

  console.log(
    `Authoritative GeoJSON features: ${geojson.features.length}`
  );

  if (
    geojson.features.length !==
    EXPECTED_WARD_COUNT
  ) {
    throw new Error(
      `SAFETY STOP: Expected ${EXPECTED_WARD_COUNT} ` +
      `authoritative wards but found ` +
      `${geojson.features.length}.`
    );
  }

  console.log(
    "Authoritative ward count verified: 1,450"
  );

  console.log("");

  // ----------------------------------------------------------
  // 2. EXTRACT COUNTY / SUBCOUNTY / WARD
  // ----------------------------------------------------------

  const sourceRecords: SourceRecord[] = [];

  let featuresWithoutHierarchy = 0;

  for (const feature of geojson.features) {
    const properties =
      feature.properties ?? {};

    const county =
      getString(properties, [
        "county_name",
        "countyName",
        "COUNTY_NAME",
        "COUNTY",
        "county",
        "County",
      ]);

    const subCounty =
      getString(properties, [
        "subcounty_name",
        "subCountyName",
        "SUBCOUNTY_NAME",
        "SUBCOUNTY",
        "SUB_COUNTY",
        "subcounty",
        "subCounty",
        "SubCounty",
      ]);

    const ward =
      getString(properties, [
        "ward_name",
        "wardName",
        "WARD_NAME",
        "WARD",
        "ward",
        "Ward",
        "name",
        "Name",
      ]);

    if (
      !county ||
      !subCounty ||
      !ward
    ) {
      featuresWithoutHierarchy++;
      continue;
    }

    sourceRecords.push({
      county,
      subCounty,
      ward,
    });
  }

  console.log(
    `Source records with complete hierarchy: ${sourceRecords.length}`
  );

  console.log(
    `Source records missing hierarchy fields: ${featuresWithoutHierarchy}`
  );

  console.log("");

  if (
    sourceRecords.length !==
    EXPECTED_WARD_COUNT
  ) {
    throw new Error(
      `SAFETY STOP: Could not extract complete ` +
      `County/SubCounty/Ward hierarchy from all ` +
      `${EXPECTED_WARD_COUNT} authoritative features.`
    );
  }

  // ----------------------------------------------------------
  // 3. DATABASE SUBCOUNTIES
  // ----------------------------------------------------------

  const dbSubCounties =
    await prisma.$queryRawUnsafe<
      DbSubCounty[]
    >(`
      SELECT
        sc.id,
        sc.name,
        sc."countyId",
        c.name AS "countyName"
      FROM "SubCounty" sc
      JOIN "County" c
        ON c.id = sc."countyId"
      ORDER BY sc.id;
    `);

  console.log(
    `Database SubCounties: ${dbSubCounties.length}`
  );

  console.log("");

  // ----------------------------------------------------------
  // 4. IDENTIFY CURRENT DATABASE ORPHANS
  // ----------------------------------------------------------

  const orphanRows =
    await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        name: string;
        countyId: number;
        countyName: string;
      }>
    >(`
      SELECT
        sc.id,
        sc.name,
        sc."countyId",
        c.name AS "countyName"

      FROM "SubCounty" sc

      JOIN "County" c
        ON c.id = sc."countyId"

      WHERE NOT EXISTS (
        SELECT 1
        FROM "Ward" w
        WHERE w."subCountyId" = sc.id
      )

      AND NOT EXISTS (
        SELECT 1
        FROM "Farmer" f
        WHERE f."subCountyId" = sc.id
      )

      AND NOT EXISTS (
        SELECT 1
        FROM "Farm" f
        WHERE f."subCountyId" = sc.id
      )

      AND NOT EXISTS (
        SELECT 1
        FROM "BusinessPartner" bp
        WHERE bp."subCountyId" = sc.id
      )

      AND NOT EXISTS (
        SELECT 1
        FROM "CommodityTransaction" ct
        WHERE ct."sourceSubCountyId" = sc.id
      )

      AND NOT EXISTS (
        SELECT 1
        FROM "CommodityTransaction" ct
        WHERE ct."destinationSubCountyId" = sc.id
      )

      ORDER BY sc.id;
    `);

  console.log(
    `Current database orphan candidates: ${orphanRows.length}`
  );

  console.log("");

  // ----------------------------------------------------------
  // 5. BUILD NORMALIZED DATABASE DUPLICATE MAP
  // ----------------------------------------------------------

  const duplicateMap =
    new Map<
      string,
      DbSubCounty[]
    >();

  for (const sc of dbSubCounties) {
    const key =
      `${sc.countyId}:${normalizeName(sc.name)}`;

    const existing =
      duplicateMap.get(key) ?? [];

    existing.push(sc);

    duplicateMap.set(
      key,
      existing
    );
  }

  // ----------------------------------------------------------
  // 6. BUILD AUTHORITATIVE SOURCE INDEX
  // ----------------------------------------------------------

  const sourceMap =
    new Map<
      string,
      SourceRecord[]
    >();

  for (const record of sourceRecords) {
    const key =
      `${normalizeName(record.county)}:` +
      `${normalizeName(record.subCounty)}`;

    const existing =
      sourceMap.get(key) ?? [];

    existing.push(record);

    sourceMap.set(
      key,
      existing
    );
  }

  // ----------------------------------------------------------
  // 7. VALIDATE EACH ORPHAN
  // ----------------------------------------------------------

  const results: Result[] = [];

  for (const orphan of orphanRows) {
    console.log(
      `Checking ${orphan.id} | ${orphan.name} | ` +
      `${orphan.countyName}`
    );

    const countyKey =
      normalizeName(orphan.countyName);

    const subCountyKey =
      normalizeName(orphan.name);

    const exactSourceKey =
      `${countyKey}:${subCountyKey}`;

    const sameCountySource =
      sourceMap.get(
        exactSourceKey
      ) ?? [];

    const sourceSubCountyNames =
      Array.from(
        new Set(
          sameCountySource.map(
            (r) => r.subCounty
          )
        )
      );

    const sourceCountyNames =
      Array.from(
        new Set(
          sourceRecords
            .filter(
              (r) =>
                normalizeName(
                  r.subCounty
                ) === subCountyKey
            )
            .map(
              (r) => r.county
            )
        )
      );

    const sourceCountyMatch =
      sourceCountyNames.some(
        (name) =>
          normalizeName(name) ===
          countyKey
      );

    const sourceSubCountyMatch =
      sameCountySource.length > 0;

    // --------------------------------------------------------
    // AUTHORITATIVE WARDS
    // --------------------------------------------------------

    const authoritativeWards =
      sameCountySource
        .map(
          (r) => r.ward
        )
        .filter(
          (value, index, array) =>
            array.findIndex(
              (x) =>
                normalizeWardName(x) ===
                normalizeWardName(value)
            ) === index
        );

    // --------------------------------------------------------
    // DATABASE WARDS
    // --------------------------------------------------------

    const databaseWardRows =
      await prisma.$queryRawUnsafe<
        Array<{ name: string }>
      >(
        `
          SELECT name
          FROM "Ward"
          WHERE "subCountyId" = $1
          ORDER BY name
        `,
        orphan.id
      );

    const databaseWards =
      databaseWardRows.map(
        (row) => row.name
      );

    const authoritativeWardSet =
      new Set(
        authoritativeWards.map(
          normalizeWardName
        )
      );

    const databaseWardSet =
      new Set(
        databaseWards.map(
          normalizeWardName
        )
      );

    const missingDatabaseWards =
      authoritativeWards.filter(
        (ward) =>
          !databaseWardSet.has(
            normalizeWardName(ward)
          )
      );

    const unexpectedDatabaseWards =
      databaseWards.filter(
        (ward) =>
          !authoritativeWardSet.has(
            normalizeWardName(ward)
          )
      );

    // --------------------------------------------------------
    // DUPLICATE CHECK
    // --------------------------------------------------------

    const duplicateRecords =
      duplicateMap.get(
        `${orphan.countyId}:${subCountyKey}`
      ) ?? [];

    const normalizedDuplicates =
      duplicateRecords.filter(
        (record) =>
          record.id !== orphan.id
      );

    const normalizedDuplicateIds =
      normalizedDuplicates.map(
        (record) => record.id
      );

    const normalizedDuplicateNames =
      normalizedDuplicates.map(
        (record) => record.name
      );

    // --------------------------------------------------------
    // CLASSIFICATION
    // --------------------------------------------------------

    let classification:
      Result["classification"];

    const reasons: string[] = [];

    if (
      normalizedDuplicates.length > 0
    ) {
      classification =
        "POSSIBLE_DUPLICATE_MERGE";

      reasons.push(
        `Normalized duplicate exists in database: ` +
        `${normalizedDuplicateIds.join(", ")}.`
      );

      if (
        sourceSubCountyMatch
      ) {
        reasons.push(
          `Authoritative source also contains ` +
          `this County/SubCounty combination.`
        );
      }
    } else if (
      sourceSubCountyMatch
    ) {
      classification = "KEEP";

      reasons.push(
        `Authoritative source confirms this ` +
        `County/SubCounty combination.`
      );

      reasons.push(
        `Authoritative source contains ` +
        `${authoritativeWards.length} ward(s) ` +
        `for this SubCounty.`
      );

      if (
        missingDatabaseWards.length > 0
      ) {
        reasons.push(
          `${missingDatabaseWards.length} ` +
          `authoritative ward(s) are missing ` +
          `from the database.`
        );

        classification =
          "REVIEW_REQUIRED";
      }
    } else if (
      sourceCountyNames.length > 0 &&
      !sourceCountyMatch
    ) {
      classification =
        "REVIEW_REQUIRED";

      reasons.push(
        `SubCounty name appears in the ` +
        `authoritative source but under ` +
        `different County(s): ` +
        `${sourceCountyNames.join(", ")}.`
      );
    } else {
      classification =
        "SAFE_DELETE_CANDIDATE";

      reasons.push(
        `SubCounty is absent from the ` +
        `1,450-ward authoritative source.`
      );

      reasons.push(
        `No authoritative wards were found.`
      );
    }

    // --------------------------------------------------------
    // STORE RESULT
    // --------------------------------------------------------

    results.push({
      id: orphan.id,
      name: orphan.name,
      countyId: orphan.countyId,
      countyName: orphan.countyName,

      sourceCountyMatch,
      sourceSubCountyMatch,

      sourceCountyNames,
      sourceSubCountyNames,

      authoritativeWardCount:
        authoritativeWards.length,

      databaseWardCount:
        databaseWards.length,

      authoritativeWards,

      databaseWards,

      missingDatabaseWards,

      unexpectedDatabaseWards,

      normalizedDuplicateIds,

      normalizedDuplicateNames,

      classification,

      reasons,
    });
  }

  // ----------------------------------------------------------
  // 8. SUMMARY
  // ----------------------------------------------------------

  const safeDelete =
    results.filter(
      (r) =>
        r.classification ===
        "SAFE_DELETE_CANDIDATE"
    );

  const duplicateMerge =
    results.filter(
      (r) =>
        r.classification ===
        "POSSIBLE_DUPLICATE_MERGE"
    );

  const review =
    results.filter(
      (r) =>
        r.classification ===
        "REVIEW_REQUIRED"
    );

  const keep =
    results.filter(
      (r) =>
        r.classification ===
        "KEEP"
    );

  console.log("");
  console.log("============================================================");
  console.log("AUTHORITATIVE SOURCE VALIDATION SUMMARY");
  console.log("============================================================");
  console.log("");

  console.log(
    `Orphans validated: ${results.length}`
  );

  console.log(
    `SAFE_DELETE_CANDIDATE: ${safeDelete.length}`
  );

  console.log(
    `POSSIBLE_DUPLICATE_MERGE: ${duplicateMerge.length}`
  );

  console.log(
    `REVIEW_REQUIRED: ${review.length}`
  );

  console.log(
    `KEEP: ${keep.length}`
  );

  console.log("");

  // ----------------------------------------------------------
  // 9. SAFE DELETE LIST
  // ----------------------------------------------------------

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "SAFE DELETE CANDIDATES"
  );

  console.log(
    "------------------------------------------------------------"
  );

  for (const result of safeDelete) {
    console.log(
      `${result.id} | ${result.name} | ` +
      `${result.countyName}`
    );
  }

  console.log("");

  // ----------------------------------------------------------
  // 10. DUPLICATES
  // ----------------------------------------------------------

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "POSSIBLE DUPLICATE MERGES"
  );

  console.log(
    "------------------------------------------------------------"
  );

  for (const result of duplicateMerge) {
    console.log(
      `${result.id} | ${result.name} | ` +
      `${result.countyName} | ` +
      `existing IDs: ` +
      `${result.normalizedDuplicateIds.join(", ")}`
    );
  }

  console.log("");

  // ----------------------------------------------------------
  // 11. REVIEW
  // ----------------------------------------------------------

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "REVIEW REQUIRED"
  );

  console.log(
    "------------------------------------------------------------"
  );

  for (const result of review) {
    console.log(
      `${result.id} | ${result.name} | ` +
      `${result.countyName}`
    );

    for (const reason of result.reasons) {
      console.log(
        `  ${reason}`
      );
    }
  }

  console.log("");

  // ----------------------------------------------------------
  // 12. KEEP
  // ----------------------------------------------------------

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "KEEP"
  );

  console.log(
    "------------------------------------------------------------"
  );

  for (const result of keep) {
    console.log(
      `${result.id} | ${result.name} | ` +
      `${result.countyName} | ` +
      `${result.authoritativeWardCount} authoritative wards`
    );
  }

  console.log("");

  // ----------------------------------------------------------
  // 13. SPECIFIC DUPLICATE DETAIL
  // ----------------------------------------------------------

  const duplicate1016 =
    results.find(
      (r) => r.id === 1016
    );

  if (duplicate1016) {
    console.log(
      "------------------------------------------------------------"
    );

    console.log(
      "MWINGI CENTRAL DUPLICATE DETAIL"
    );

    console.log(
      "------------------------------------------------------------"
    );

    console.log(
      `Candidate: ${duplicate1016.id} | ` +
      `${duplicate1016.name}`
    );

    console.log(
      `Duplicate: ${duplicate1016.normalizedDuplicateIds.join(", ")}`
    );

    console.log(
      `Authoritative source match: ` +
      `${duplicate1016.sourceSubCountyMatch}`
    );

    console.log(
      `Authoritative wards: ` +
      `${duplicate1016.authoritativeWardCount}`
    );

    console.log("");
  }

  // ----------------------------------------------------------
  // 14. SAVE MACHINE-READABLE REPORT
  // ----------------------------------------------------------

  const reportDirectory =
    path.join(
      process.cwd(),
      "audit-reports"
    );

  fs.mkdirSync(
    reportDirectory,
    {
      recursive: true,
    }
  );

  const reportPath =
    path.join(
      reportDirectory,
      "authoritative-source-orphan-validation.json"
    );

  const report = {
    auditType:
      "AUTHORITATIVE_SOURCE_ORPHAN_SUBCOUNTY_VALIDATION",

    readOnly: true,

    source: {
      file: GEOJSON_PATH,
      expectedWardCount:
        EXPECTED_WARD_COUNT,
      actualFeatureCount:
        geojson.features.length,
      extractedCompleteRecords:
        sourceRecords.length,
    },

    database: {
      totalSubCounties:
        dbSubCounties.length,
      orphanCandidates:
        orphanRows.length,
    },

    summary: {
      safeDeleteCandidates:
        safeDelete.length,

      possibleDuplicateMerges:
        duplicateMerge.length,

      reviewRequired:
        review.length,

      keep:
        keep.length,
    },

    results,

    databaseChanges: {
      insert: 0,
      update: 0,
      delete: 0,
      schemaChanges: 0,
    },
  };

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      report,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    `JSON report: ${reportPath}`
  );

  console.log("");

  console.log(
    "============================================================"
  );

  console.log(
    "AUTHORITATIVE SOURCE VALIDATION COMPLETED"
  );

  console.log(
    "============================================================"
  );

  console.log(
    "NO DATABASE CHANGES WERE MADE."
  );

  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "AUTHORITATIVE SOURCE VALIDATION FAILED"
    );
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });