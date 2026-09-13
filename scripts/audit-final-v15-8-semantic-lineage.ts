import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const DATA_DIR = path.join(process.cwd(), "prisma", "data");

const GEOJSON_PATH = path.join(
  DATA_DIR,
  "kenya-wards-1450.geojson",
);

const JSON_OUTPUT = path.join(
  DATA_DIR,
  "final-database-semantic-lineage-audit-v15-8.json",
);

const CSV_OUTPUT = path.join(
  DATA_DIR,
  "final-database-semantic-lineage-audit-v15-8.csv",
);

const REVIEW_CSV_OUTPUT = path.join(
  DATA_DIR,
  "final-database-semantic-lineage-review-v15-8.csv",
);

const EXPECTED_WARDS = 1450;
const EXPECTED_COUNTIES = 47;
const EXPECTED_SUBCOUNTIES = 414;

type Classification =
  | "EXACT_MATCH"
  | "NAME_VARIANT_SAME_IDENTITY"
  | "AMBIGUOUS"
  | "UNRESOLVED"
  | "SOURCE_DB_CONTRADICTION"
  | "WARD_NOT_FOUND";

interface AuthoritativeWard {
  gid: number;
  county: string;
  subcounty: string;
  ward: string;
}

interface SemanticRecord {
  gid: number;
  authoritativeCounty: string;
  authoritativeSubCounty: string;
  authoritativeWard: string;

  databaseWardId: number | null;
  databaseWardName: string | null;

  databaseCountyId: number | null;
  databaseCountyName: string | null;

  databaseSubCountyId: number | null;
  databaseSubCountyName: string | null;

  countyExact: boolean;
  countyNormalized: boolean;
  subCountyExact: boolean;
  subCountyNormalized: boolean;

  classification: Classification;

  reason: string;
}

interface CsvRow {
  gid: number | string;
  authoritativeCounty: string;
  authoritativeSubCounty: string;
  authoritativeWard: string;
  databaseWardId: number | string;
  databaseWardName: string;
  databaseCountyId: number | string;
  databaseCountyName: string;
  databaseSubCountyId: number | string;
  databaseSubCountyName: string;
  countyExact: boolean | string;
  countyNormalized: boolean | string;
  subCountyExact: boolean | string;
  subCountyNormalized: boolean | string;
  classification: string;
  reason: string;
}

function normalizeCounty(
  value: string | null | undefined,
): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeSubCounty(
  value: string | null | undefined,
): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/\bsub[\s-]*county\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeWard(
  value: string | null | undefined,
): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function writeCsv(
  rows: CsvRow[],
  outputPath: string,
): void {
  if (rows.length === 0) {
    fs.writeFileSync(
      outputPath,
      "",
      "utf8",
    );
    return;
  }

  const headers = Object.keys(
    rows[0],
  ) as Array<keyof CsvRow>;

  const lines = [
    headers
      .map(csvEscape)
      .join(","),
    ...rows.map((row) =>
      headers
        .map((header) =>
          csvEscape(row[header]),
        )
        .join(","),
    ),
  ];

  fs.writeFileSync(
    outputPath,
    lines.join("\n"),
    "utf8",
  );
}

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log("");
  console.log(
    "FINAL DATABASE SEMANTIC LINEAGE AUDIT V15.8",
  );
  console.log(
    "FRESH POST-CONSOLIDATION AUTHORITATIVE OWNERSHIP AUDIT",
  );
  console.log(
    "MODE: READ-ONLY",
  );
  console.log(
    "NO INSERT / UPDATE / DELETE",
  );
  console.log("");

  const errors: Array<Record<string, unknown>> = [];
  const warnings: Array<Record<string, unknown>> = [];

  /*
   * ============================================================
   * [1/14] LOAD AUTHORITATIVE GEOJSON
   * ============================================================
   */

  console.log(
    "[1/14] Loading authoritative ward GeoJSON...",
  );

  assert(
    fs.existsSync(GEOJSON_PATH),
    `Authoritative GeoJSON not found: ${GEOJSON_PATH}`,
  );

  const geojson = JSON.parse(
    fs.readFileSync(
      GEOJSON_PATH,
      "utf8",
    ),
  );

  assert(
    Array.isArray(geojson.features),
    "GeoJSON does not contain a features array.",
  );

  const authoritative: AuthoritativeWard[] =
    geojson.features.map(
      (feature: any) => {
        const properties =
          feature.properties ?? {};

        return {
          gid: Number(properties.gid),
          county: String(
            properties.county ?? "",
          ),
          subcounty: String(
            properties.subcounty ?? "",
          ),
          ward: String(
            properties.ward ?? "",
          ),
        };
      },
    );

  const authoritativeNumeric =
    authoritative.filter(
      (row) =>
        Number.isInteger(row.gid),
    );

  const authoritativeGidSet =
    new Set(
      authoritativeNumeric.map(
        (row) => row.gid,
      ),
    );

  console.log(
    `  GeoJSON features: ${authoritative.length}`,
  );

  console.log(
    `  Numeric GIDs: ${authoritativeNumeric.length}`,
  );

  console.log(
    `  Unique GIDs: ${authoritativeGidSet.size}`,
  );

  if (
    authoritative.length !==
    EXPECTED_WARDS
  ) {
    errors.push({
      type:
        "AUTHORITATIVE_WARD_COUNT",
      expected:
        EXPECTED_WARDS,
      actual:
        authoritative.length,
    });
  }

  if (
    authoritativeNumeric.length !==
    EXPECTED_WARDS
  ) {
    errors.push({
      type:
        "AUTHORITATIVE_NUMERIC_GID_COUNT",
      expected:
        EXPECTED_WARDS,
      actual:
        authoritativeNumeric.length,
    });
  }

  if (
    authoritativeGidSet.size !==
    EXPECTED_WARDS
  ) {
    errors.push({
      type:
        "AUTHORITATIVE_UNIQUE_GID_COUNT",
      expected:
        EXPECTED_WARDS,
      actual:
        authoritativeGidSet.size,
    });
  }

  /*
   * ============================================================
   * [2/14] LOAD CURRENT DATABASE
   * ============================================================
   */

  console.log("");
  console.log(
    "[2/14] Loading current PostgreSQL geography...",
  );

  const counties =
    await prisma.county.findMany({
      select: {
        id: true,
        name: true,
      },
    });

  const subCounties =
    await prisma.subCounty.findMany({
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

  const wards =
    await prisma.ward.findMany({
      select: {
        id: true,
        name: true,
        sourceGid: true,
        countyId: true,
        subCountyId: true,
      },
    });

  console.log(
    `  Counties: ${counties.length}`,
  );

  console.log(
    `  SubCounties: ${subCounties.length}`,
  );

  console.log(
    `  Wards: ${wards.length}`,
  );

  if (
    counties.length !==
    EXPECTED_COUNTIES
  ) {
    errors.push({
      type: "COUNTY_COUNT",
      expected:
        EXPECTED_COUNTIES,
      actual:
        counties.length,
    });
  }

  if (
    subCounties.length !==
    EXPECTED_SUBCOUNTIES
  ) {
    errors.push({
      type:
        "SUBCOUNTY_COUNT",
      expected:
        EXPECTED_SUBCOUNTIES,
      actual:
        subCounties.length,
    });
  }

  if (
    wards.length !==
    EXPECTED_WARDS
  ) {
    errors.push({
      type: "WARD_COUNT",
      expected:
        EXPECTED_WARDS,
      actual:
        wards.length,
    });
  }

  /*
   * ============================================================
   * [3/14] BUILD RELATIONAL INDEXES
   * ============================================================
   */

  console.log("");
  console.log(
    "[3/14] Building relational indexes...",
  );

  const countyById =
    new Map(
      counties.map(
        (county) => [
          county.id,
          county,
        ],
      ),
    );

  const subCountyById =
    new Map(
      subCounties.map(
        (subCounty) => [
          subCounty.id,
          subCounty,
        ],
      ),
    );

  const wardByGid =
    new Map<
      number,
      (typeof wards)[number]
    >();

  const duplicateDatabaseGids:
    number[] = [];

  for (const ward of wards) {
    if (
      ward.sourceGid === null
    ) {
      continue;
    }

    if (
      wardByGid.has(
        ward.sourceGid,
      )
    ) {
      duplicateDatabaseGids.push(
        ward.sourceGid,
      );
    } else {
      wardByGid.set(
        ward.sourceGid,
        ward,
      );
    }
  }

  console.log(
    `  Database sourceGIDs: ${wardByGid.size}`,
  );

  console.log(
    `  Duplicate sourceGIDs: ${duplicateDatabaseGids.length}`,
  );

  if (
    duplicateDatabaseGids.length >
    0
  ) {
    errors.push({
      type:
        "DUPLICATE_DATABASE_SOURCE_GID",
      gids:
        duplicateDatabaseGids,
    });
  }

  /*
   * ============================================================
   * [4/14] STRUCTURAL GID RECONCILIATION
   * ============================================================
   */

  console.log("");
  console.log(
    "[4/14] Checking authoritative ↔ database GID correspondence...",
  );

  const missingDatabaseGids =
    authoritativeNumeric
      .map(
        (row) => row.gid,
      )
      .filter(
        (gid) =>
          !wardByGid.has(gid),
      );

  const unexpectedDatabaseGids =
    wards
      .filter(
        (ward) =>
          ward.sourceGid !==
            null &&
          !authoritativeGidSet.has(
            ward.sourceGid,
          ),
      )
      .map(
        (ward) =>
          ward.sourceGid,
      );

  const nullDatabaseGids =
    wards.filter(
      (ward) =>
        ward.sourceGid === null,
    ).length;

  console.log(
    `  Missing database GIDs: ${missingDatabaseGids.length}`,
  );

  console.log(
    `  Unexpected database GIDs: ${unexpectedDatabaseGids.length}`,
  );

  console.log(
    `  NULL database sourceGIDs: ${nullDatabaseGids}`,
  );

  if (
    missingDatabaseGids.length >
    0
  ) {
    errors.push({
      type:
        "AUTHORITATIVE_GIDS_MISSING_FROM_DATABASE",
      count:
        missingDatabaseGids.length,
      gids:
        missingDatabaseGids,
    });
  }

  if (
    unexpectedDatabaseGids.length >
    0
  ) {
    errors.push({
      type:
        "DATABASE_GIDS_NOT_IN_AUTHORITATIVE_SOURCE",
      count:
        unexpectedDatabaseGids.length,
      gids:
        unexpectedDatabaseGids,
    });
  }

  if (
    nullDatabaseGids > 0
  ) {
    errors.push({
      type:
        "NULL_DATABASE_SOURCE_GIDS",
      count:
        nullDatabaseGids,
    });
  }

  /*
   * ============================================================
   * [5/14] CURRENT WARD RELATIONAL INTEGRITY
   * ============================================================
   */

  console.log("");
  console.log(
    "[5/14] Checking current Ward relational integrity...",
  );

  let nullSubCounty =
    0;

  let missingSubCounty =
    0;

  let missingCounty =
    0;

  let countySubCountyMismatch =
    0;

  for (const ward of wards) {
    if (
      ward.subCountyId ===
      null
    ) {
      nullSubCounty++;
      continue;
    }

    const subCounty =
      subCountyById.get(
        ward.subCountyId,
      );

    if (!subCounty) {
      missingSubCounty++;
      continue;
    }

    if (
      !countyById.has(
        ward.countyId,
      )
    ) {
      missingCounty++;
    }

    if (
      ward.countyId !==
      subCounty.countyId
    ) {
      countySubCountyMismatch++;
    }
  }

  console.log(
    `  NULL subCountyId: ${nullSubCounty}`,
  );

  console.log(
    `  Missing SubCounty FK: ${missingSubCounty}`,
  );

  console.log(
    `  Missing County FK: ${missingCounty}`,
  );

  console.log(
    `  County/SubCounty mismatches: ${countySubCountyMismatch}`,
  );

  if (
    nullSubCounty > 0 ||
    missingSubCounty > 0 ||
    missingCounty > 0 ||
    countySubCountyMismatch > 0
  ) {
    errors.push({
      type:
        "CURRENT_WARD_RELATIONAL_INTEGRITY_FAILURE",
      nullSubCounty,
      missingSubCounty,
      missingCounty,
      countySubCountyMismatch,
    });
  }

  /*
   * ============================================================
   * [6/14] SEMANTIC LINEAGE RECONCILIATION
   * ============================================================
   */

  console.log("");
  console.log(
    "[6/14] Reconciling authoritative ownership through sourceGID lineage...",
  );

  const records: SemanticRecord[] =
    [];

  for (
    const source of authoritativeNumeric
  ) {
    const databaseWard =
      wardByGid.get(
        source.gid,
      );

    if (!databaseWard) {
      records.push({
        gid: source.gid,

        authoritativeCounty:
          source.county,

        authoritativeSubCounty:
          source.subcounty,

        authoritativeWard:
          source.ward,

        databaseWardId:
          null,

        databaseWardName:
          null,

        databaseCountyId:
          null,

        databaseCountyName:
          null,

        databaseSubCountyId:
          null,

        databaseSubCountyName:
          null,

        countyExact:
          false,

        countyNormalized:
          false,

        subCountyExact:
          false,

        subCountyNormalized:
          false,

        classification:
          "WARD_NOT_FOUND",

        reason:
          "Authoritative GID has no matching Ward.sourceGid in database.",
      });

      continue;
    }

    const databaseCounty =
      countyById.get(
        databaseWard.countyId,
      );

    const databaseSubCounty =
      databaseWard.subCountyId ===
      null
        ? undefined
        : subCountyById.get(
            databaseWard.subCountyId,
          );

    const countyExact =
      databaseCounty !==
        undefined &&
      databaseCounty.name.trim() ===
        source.county.trim();

    const countyNormalized =
      databaseCounty !==
        undefined &&
      normalizeCounty(
        databaseCounty.name,
      ) ===
        normalizeCounty(
          source.county,
        );

    const subCountyExact =
      databaseSubCounty !==
        undefined &&
      databaseSubCounty.name.trim() ===
        source.subcounty.trim();

    const subCountyNormalized =
      databaseSubCounty !==
        undefined &&
      normalizeSubCounty(
        databaseSubCounty.name,
      ) ===
        normalizeSubCounty(
          source.subcounty,
        );

    const wardNameNormalized =
      normalizeWard(
        databaseWard.name,
      ) ===
      normalizeWard(
        source.ward,
      );

    let classification:
      Classification;

    let reason: string;

    /*
     * PRIMARY DECISION:
     *
     * The database lineage is considered semantically valid
     * when the actual County and SubCounty identity agree with
     * the authoritative source after normalization.
     *
     * sourceGID remains the primary linkage.
     */

    if (
      !databaseCounty ||
      !databaseSubCounty
    ) {
      classification =
        "SOURCE_DB_CONTRADICTION";

      reason =
        "Ward.sourceGid exists, but its relational County/SubCounty lineage cannot be resolved.";
    } else if (
      !countyNormalized
    ) {
      classification =
        "SOURCE_DB_CONTRADICTION";

      reason =
        "Authoritative county does not match the database County reached through Ward.sourceGid.";
    } else if (
      !subCountyNormalized
    ) {
      classification =
        "UNRESOLVED";

      reason =
        "Authoritative SubCounty name does not normalize to the actual database SubCounty reached through Ward.sourceGid.";
    } else if (
      countyExact &&
      subCountyExact
    ) {
      classification =
        "EXACT_MATCH";

      reason =
        "Authoritative County and SubCounty names exactly match the database relational lineage.";
    } else if (
      countyNormalized &&
      subCountyNormalized
    ) {
      classification =
        "NAME_VARIANT_SAME_IDENTITY";

      if (
        !countyExact &&
        !subCountyExact
      ) {
        reason =
          "County and SubCounty differ textually but resolve to the same normalized relational identities.";
      } else if (
        !countyExact
      ) {
        reason =
          "County differs textually but resolves to the same normalized County identity.";
      } else {
        reason =
          "SubCounty differs textually but resolves to the same normalized SubCounty identity.";
      }
    } else {
      classification =
        "UNRESOLVED";

      reason =
        "Authoritative ownership could not be reconciled with the actual database lineage.";
    }

    /*
     * Ward name differences are diagnostic only.
     * They do NOT change ownership classification because
     * Ward.sourceGid is the primary identity.
     */

    if (
      classification ===
        "EXACT_MATCH" ||
      classification ===
        "NAME_VARIANT_SAME_IDENTITY"
    ) {
      if (
        !wardNameNormalized
      ) {
        warnings.push({
          type:
            "WARD_NAME_VARIANT",
          gid:
            source.gid,
          authoritativeWard:
            source.ward,
          databaseWard:
            databaseWard.name,
        });
      }
    }

    records.push({
      gid: source.gid,

      authoritativeCounty:
        source.county,

      authoritativeSubCounty:
        source.subcounty,

      authoritativeWard:
        source.ward,

      databaseWardId:
        databaseWard.id,

      databaseWardName:
        databaseWard.name,

      databaseCountyId:
        databaseCounty?.id ??
        null,

      databaseCountyName:
        databaseCounty?.name ??
        null,

      databaseSubCountyId:
        databaseSubCounty?.id ??
        null,

      databaseSubCountyName:
        databaseSubCounty?.name ??
        null,

      countyExact,

      countyNormalized,

      subCountyExact,

      subCountyNormalized,

      classification,

      reason,
    });
  }

  /*
   * ============================================================
   * [7/14] CLASSIFICATION DISTRIBUTION
   * ============================================================
   */

  console.log("");
  console.log(
    "[7/14] Building semantic classification distribution...",
  );

  const classificationCounts =
    new Map<
      Classification,
      number
    >();

  for (const record of records) {
    classificationCounts.set(
      record.classification,
      (
        classificationCounts.get(
          record.classification,
        ) ?? 0
      ) + 1,
    );
  }

  const exactCount =
    classificationCounts.get(
      "EXACT_MATCH",
    ) ?? 0;

  const nameVariantCount =
    classificationCounts.get(
      "NAME_VARIANT_SAME_IDENTITY",
    ) ?? 0;

  const ambiguousCount =
    classificationCounts.get(
      "AMBIGUOUS",
    ) ?? 0;

  const unresolvedCount =
    classificationCounts.get(
      "UNRESOLVED",
    ) ?? 0;

  const contradictionCount =
    classificationCounts.get(
      "SOURCE_DB_CONTRADICTION",
    ) ?? 0;

  const wardNotFoundCount =
    classificationCounts.get(
      "WARD_NOT_FOUND",
    ) ?? 0;

  console.log(
    `  EXACT_MATCH: ${exactCount}`,
  );

  console.log(
    `  NAME_VARIANT_SAME_IDENTITY: ${nameVariantCount}`,
  );

  console.log(
    `  AMBIGUOUS: ${ambiguousCount}`,
  );

  console.log(
    `  UNRESOLVED: ${unresolvedCount}`,
  );

  console.log(
    `  SOURCE_DB_CONTRADICTION: ${contradictionCount}`,
  );

  console.log(
    `  WARD_NOT_FOUND: ${wardNotFoundCount}`,
  );

  /*
   * ============================================================
   * [8/14] VERIFY CLASSIFICATION ACCOUNTING
   * ============================================================
   */

  console.log("");
  console.log(
    "[8/14] Validating evaluator accounting...",
  );

  const classifiedCount =
    exactCount +
    nameVariantCount +
    ambiguousCount +
    unresolvedCount +
    contradictionCount +
    wardNotFoundCount;

  console.log(
    `  Authoritative records: ${authoritativeNumeric.length}`,
  );

  console.log(
    `  Database-linked records: ${records.length}`,
  );

  console.log(
    `  Classified records: ${classifiedCount}`,
  );

  if (
    records.length !==
    authoritativeNumeric.length
  ) {
    errors.push({
      type:
        "EVALUATOR_RECORD_COUNT_MISMATCH",
      authoritative:
        authoritativeNumeric.length,
      evaluator:
        records.length,
    });
  }

  if (
    classifiedCount !==
    authoritativeNumeric.length
  ) {
    errors.push({
      type:
        "CLASSIFICATION_ACCOUNTING_FAILURE",
      expected:
        authoritativeNumeric.length,
      actual:
        classifiedCount,
    });
  }

  /*
   * ============================================================
   * [9/14] IDENTIFY REVIEW RECORDS
   * ============================================================
   */

  console.log("");
  console.log(
    "[9/14] Extracting semantic review records...",
  );

  const reviewRecords =
    records.filter(
      (record) =>
        record.classification !==
          "EXACT_MATCH" &&
        record.classification !==
          "NAME_VARIANT_SAME_IDENTITY",
    );

  const nonExactRecords =
    records.filter(
      (record) =>
        record.classification !==
        "EXACT_MATCH",
    );

  console.log(
    `  Non-exact records: ${nonExactRecords.length}`,
  );

  console.log(
    `  Review records: ${reviewRecords.length}`,
  );

  /*
   * ============================================================
   * [10/14] GROUP REVIEW RECORDS BY ACTUAL DB IDENTITY
   * ============================================================
   */

  console.log("");
  console.log(
    "[10/14] Grouping unresolved/contradictory records by actual relational identity...",
  );

  const reviewIdentityMap =
    new Map<
      string,
      {
        countyId: number | null;
        countyName: string | null;
        subCountyId: number | null;
        subCountyName: string | null;
        records: SemanticRecord[];
      }
    >();

  for (const record of reviewRecords) {
    const key =
      [
        record.databaseCountyId ??
          "NULL",
        record.databaseSubCountyId ??
          "NULL",
      ].join("|");

    const existing =
      reviewIdentityMap.get(
        key,
      );

    if (existing) {
      existing.records.push(
        record,
      );
    } else {
      reviewIdentityMap.set(
        key,
        {
          countyId:
            record.databaseCountyId,
          countyName:
            record.databaseCountyName,
          subCountyId:
            record.databaseSubCountyId,
          subCountyName:
            record.databaseSubCountyName,
          records: [
            record,
          ],
        },
      );
    }
  }

  console.log(
    `  Distinct actual database identities in review set: ${reviewIdentityMap.size}`,
  );

  /*
   * ============================================================
   * [11/14] CHECK FOR TRUE AMBIGUITY
   * ============================================================
   *
   * Because sourceGID directly identifies the Ward, ambiguity
   * should NOT arise merely because multiple SubCounty records
   * have similar names.
   *
   * If multiple actual DB identities occur for the same
   * normalized authoritative county/subcounty identity,
   * flag it explicitly.
   */

  console.log("");
  console.log(
    "[11/14] Testing semantic ambiguity independently...",
  );

  const authoritativeIdentityMap =
    new Map<
      string,
      Set<string>
    >();

  for (const record of records) {
    const key =
      [
        normalizeCounty(
          record.authoritativeCounty,
        ),
        normalizeSubCounty(
          record.authoritativeSubCounty,
        ),
      ].join("|");

    const dbIdentity =
      [
        record.databaseCountyId ??
          "NULL",
        record.databaseSubCountyId ??
          "NULL",
      ].join("|");

    const existing =
      authoritativeIdentityMap.get(
        key,
      );

    if (existing) {
      existing.add(
        dbIdentity,
      );
    } else {
      authoritativeIdentityMap.set(
        key,
        new Set([
          dbIdentity,
        ]),
      );
    }
  }

  const trueAmbiguityGroups =
    Array.from(
      authoritativeIdentityMap.entries(),
    ).filter(
      ([, databaseIdentities]) =>
        databaseIdentities.size >
        1,
    );

  console.log(
    `  Authoritative identities mapping to multiple actual DB identities: ${trueAmbiguityGroups.length}`,
  );

  if (
    trueAmbiguityGroups.length >
    0
  ) {
    for (
      const [
        identity,
        databaseIdentities,
      ] of trueAmbiguityGroups
    ) {
      console.log(
        `    ${identity} -> ${Array.from(databaseIdentities).join(", ")}`,
      );

      errors.push({
        type:
          "TRUE_SEMANTIC_AMBIGUITY",
        identity,
        databaseIdentities:
          Array.from(
            databaseIdentities,
          ),
      });
    }
  }

  /*
   * ============================================================
   * [12/14] CHECK Tiaty SEMANTIC EXCEPTION
   * ============================================================
   */

  console.log("");
  console.log(
    "[12/14] Checking Tiaty GIDs 781-787...",
  );

  const tiatyGids = [
    781,
    782,
    783,
    784,
    785,
    786,
    787,
  ];

  const tiatyRecords =
    records.filter(
      (record) =>
        tiatyGids.includes(
          record.gid,
        ),
    );

  const tiatyTargetCorrect =
    tiatyRecords.filter(
      (record) =>
        record.databaseSubCountyId ===
        757,
    ).length;

  const tiatyExpected =
    tiatyGids.length;

  console.log(
    `  Expected Tiaty GIDs: ${tiatyExpected}`,
  );

  console.log(
    `  Target SubCounty 757: ${tiatyTargetCorrect}`,
  );

  for (const gid of tiatyGids) {
    const record =
      records.find(
        (item) =>
          item.gid === gid,
      );

    if (
      !record ||
      record.databaseSubCountyId !==
        757
    ) {
      errors.push({
        type:
          "TIATY_TARGET_FAILURE",
        gid,
        actualSubCountyId:
          record?.databaseSubCountyId ??
          null,
        actualSubCountyName:
          record?.databaseSubCountyName ??
          null,
      });
    }
  }

  /*
   * ============================================================
   * [13/14] BUILD REVIEW / DIAGNOSTIC REPORTS
   * ============================================================
   */

  console.log("");
  console.log(
    "[13/14] Building V15.8 diagnostic reports...",
  );

  const csvRows: CsvRow[] =
    records.map(
      (record) => ({
        gid:
          record.gid,

        authoritativeCounty:
          record.authoritativeCounty,

        authoritativeSubCounty:
          record.authoritativeSubCounty,

        authoritativeWard:
          record.authoritativeWard,

        databaseWardId:
          record.databaseWardId ??
          "",

        databaseWardName:
          record.databaseWardName ??
          "",

        databaseCountyId:
          record.databaseCountyId ??
          "",

        databaseCountyName:
          record.databaseCountyName ??
          "",

        databaseSubCountyId:
          record.databaseSubCountyId ??
          "",

        databaseSubCountyName:
          record.databaseSubCountyName ??
          "",

        countyExact:
          record.countyExact,

        countyNormalized:
          record.countyNormalized,

        subCountyExact:
          record.subCountyExact,

        subCountyNormalized:
          record.subCountyNormalized,

        classification:
          record.classification,

        reason:
          record.reason,
      }),
    );

  const reviewCsvRows:
    CsvRow[] =
    reviewRecords.map(
      (record) => ({
        gid:
          record.gid,

        authoritativeCounty:
          record.authoritativeCounty,

        authoritativeSubCounty:
          record.authoritativeSubCounty,

        authoritativeWard:
          record.authoritativeWard,

        databaseWardId:
          record.databaseWardId ??
          "",

        databaseWardName:
          record.databaseWardName ??
          "",

        databaseCountyId:
          record.databaseCountyId ??
          "",

        databaseCountyName:
          record.databaseCountyName ??
          "",

        databaseSubCountyId:
          record.databaseSubCountyId ??
          "",

        databaseSubCountyName:
          record.databaseSubCountyName ??
          "",

        countyExact:
          record.countyExact,

        countyNormalized:
          record.countyNormalized,

        subCountyExact:
          record.subCountyExact,

        subCountyNormalized:
          record.subCountyNormalized,

        classification:
          record.classification,

        reason:
          record.reason,
      }),
    );

  const report = {
    auditVersion:
      "V15.8",

    auditType:
      "Fresh authoritative-to-database semantic lineage audit",

    mode:
      "READ_ONLY",

    generatedAt:
      new Date().toISOString(),

    methodology: {
      primaryIdentity:
        "Ward.sourceGid",

      lineage:
        "GeoJSON.gid -> Ward.sourceGid -> Ward.id -> Ward.subCountyId -> SubCounty.id -> SubCounty.countyId -> County.id",

      nameResolution:
        "Names are evaluated only after sourceGID establishes the actual database lineage.",

      duplicateHandling:
        "No arbitrary first-match SubCounty selection is used.",

      databaseModification:
        false,
    },

    baseline: {
      counties:
        counties.length,

      subCounties:
        subCounties.length,

      wards:
        wards.length,
    },

    expected: {
      counties:
        EXPECTED_COUNTIES,

      subCounties:
        EXPECTED_SUBCOUNTIES,

      wards:
        EXPECTED_WARDS,
    },

    structuralIntegrity: {
      authoritativeFeatures:
        authoritative.length,

      authoritativeNumericGids:
        authoritativeNumeric.length,

      authoritativeUniqueGids:
        authoritativeGidSet.size,

      databaseWards:
        wards.length,

      databaseUniqueSourceGids:
        wardByGid.size,

      duplicateDatabaseGids:
        duplicateDatabaseGids,

      nullDatabaseGids:
        nullDatabaseGids,

      missingDatabaseGids:
        missingDatabaseGids,

      unexpectedDatabaseGids:
        unexpectedDatabaseGids,
    },

    relationalIntegrity: {
      nullSubCounty,
      missingSubCounty,
      missingCounty,
      countySubCountyMismatch,
    },

    classification: {
      total:
        records.length,

      exactMatch:
        exactCount,

      nameVariantSameIdentity:
        nameVariantCount,

      ambiguous:
        ambiguousCount,

      unresolved:
        unresolvedCount,

      sourceDbContradiction:
        contradictionCount,

      wardNotFound:
        wardNotFoundCount,
    },

    ambiguityAnalysis: {
      trueAmbiguityGroups:
        trueAmbiguityGroups.map(
          ([
            identity,
            databaseIdentities,
          ]) => ({
            identity,
            databaseIdentities:
              Array.from(
                databaseIdentities,
              ),
          }),
        ),
    },

    tiatyVerification: {
      expectedGids:
        tiatyGids,

      expectedCount:
        tiatyExpected,

      targetId:
        757,

      correctCount:
        tiatyTargetCorrect,

      pass:
        tiatyTargetCorrect ===
        tiatyExpected,
    },

    review: {
      nonExactRecords:
        nonExactRecords.length,

      reviewRecords:
        reviewRecords.length,

      reviewIdentityGroups:
        reviewIdentityMap.size,
    },

    warnings,

    errors,

    status:
      errors.length === 0
        ? "PASS"
        : "FAIL",

    records,
  };

  fs.writeFileSync(
    JSON_OUTPUT,
    JSON.stringify(
      report,
      null,
      2,
    ),
    "utf8",
  );

  writeCsv(
    csvRows,
    CSV_OUTPUT,
  );

  writeCsv(
    reviewCsvRows,
    REVIEW_CSV_OUTPUT,
  );

  /*
   * ============================================================
   * [14/14] FINAL RESULT
   * ============================================================
   */

  console.log("");
  console.log(
    "[14/14] Final V15.8 result...",
  );

  console.log("");
  console.log(
    "FINAL V15.8 RESULT",
  );

  console.log(
    `STATUS: ${
      errors.length === 0
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log("");
  console.log(
    `Counties: ${counties.length}/${EXPECTED_COUNTIES}`,
  );

  console.log(
    `SubCounties: ${subCounties.length}/${EXPECTED_SUBCOUNTIES}`,
  );

  console.log(
    `Wards: ${wards.length}/${EXPECTED_WARDS}`,
  );

  console.log(
    `Unique sourceGIDs: ${wardByGid.size}/${EXPECTED_WARDS}`,
  );

  console.log("");

  console.log(
    `EXACT_MATCH: ${exactCount}`,
  );

  console.log(
    `NAME_VARIANT_SAME_IDENTITY: ${nameVariantCount}`,
  );

  console.log(
    `AMBIGUOUS: ${ambiguousCount}`,
  );

  console.log(
    `UNRESOLVED: ${unresolvedCount}`,
  );

  console.log(
    `SOURCE_DB_CONTRADICTION: ${contradictionCount}`,
  );

  console.log(
    `WARD_NOT_FOUND: ${wardNotFoundCount}`,
  );

  console.log("");

  console.log(
    `True ambiguity groups: ${trueAmbiguityGroups.length}`,
  );

  console.log(
    `Tiaty target 757: ${tiatyTargetCorrect}/${tiatyExpected}`,
  );

  console.log(
    `Non-exact records: ${nonExactRecords.length}`,
  );

  console.log(
    `Review records: ${reviewRecords.length}`,
  );

  console.log(
    `Errors: ${errors.length}`,
  );

  console.log(
    `Warnings: ${warnings.length}`,
  );

  console.log("");

  console.log(
    `JSON: ${JSON_OUTPUT}`,
  );

  console.log(
    `CSV: ${CSV_OUTPUT}`,
  );

  console.log(
    `REVIEW CSV: ${REVIEW_CSV_OUTPUT}`,
  );

  console.log("");

  if (
    errors.length === 0
  ) {
    console.log(
      "V15.8 PASS",
    );

    console.log(
      "Fresh semantic lineage audit completed.",
    );

    console.log(
      "No database changes were made.",
    );
  } else {
    console.log(
      "V15.8 FAIL / REVIEW REQUIRED",
    );

    console.log(
      "No database changes were made.",
    );

    console.log(
      "Review the JSON and REVIEW CSV before any repair.",
    );
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V15.8 AUDIT FAILED TO COMPLETE",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });