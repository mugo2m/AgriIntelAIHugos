import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

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

type CanonicalSubCounty = {
  countyCode: string;
  name: string;
  code?: string;
  headquarters?: string | null;
};

type GeoFeature = {
  type?: string;
  properties?: Record<string, unknown>;
  geometry?: unknown;
};

type DiagnosticRow = {
  wardId: number;
  wardName: string;
  sourceGid: number | null;
  sourceUid: string | null;

  currentSubCountyId: number | null;
  currentSubCountyName: string | null;
  currentCountyId: number | null;
  currentCountyName: string | null;

  authoritativeGid: number | null;
  authoritativeUid: string | null;
  authoritativeSubCountyName: string | null;
  authoritativeCountyName: string | null;

  canonicalSourceName: string | null;
  canonicalCountyCode: string | null;

  canonicalDbId: number | null;
  canonicalDbName: string | null;

  reason: string;
};

function normalizeName(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/sub[\s-]*county/g, "")
    .replace(/subcounty/g, "")
    .replace(/county/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCode(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function getProperty(
  properties: Record<string, unknown> | undefined,
  possibleNames: string[],
): string | null {
  if (!properties) {
    return null;
  }

  for (const name of possibleNames) {
    const value = properties[name];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value).trim();
    }
  }

  return null;
}

function getNumericProperty(
  properties: Record<string, unknown> | undefined,
  possibleNames: string[],
): number | null {
  if (!properties) {
    return null;
  }

  for (const name of possibleNames) {
    const value = properties[name];

    if (value === undefined || value === null || value === "") {
      continue;
    }

    const numeric = Number(value);

    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return null;
}

function extractGid(feature: GeoFeature): number | null {
  return getNumericProperty(feature.properties, [
    "gid",
    "GID",
    "GID_3",
    "GID_4",
    "sourceGid",
    "source_gid",
  ]);
}

function extractUid(feature: GeoFeature): string | null {
  return getProperty(feature.properties, [
    "uid",
    "UID",
    "sourceUid",
    "source_uid",
  ]);
}

function extractSubCountyName(feature: GeoFeature): string | null {
  return getProperty(feature.properties, [
    "subcounty_name",
    "sub_county_name",
    "subcounty",
    "sub_county",
    "SubCounty",
    "SUBCOUNTY",
    "Subcounty",
    "SC_NAME",
    "SC",
  ]);
}

function extractCountyName(feature: GeoFeature): string | null {
  return getProperty(feature.properties, [
    "county_name",
    "county",
    "County",
    "COUNTY",
    "CountyName",
    "COUNTY_NAME",
  ]);
}

function extractWardName(feature: GeoFeature): string | null {
  return getProperty(feature.properties, [
    "ward_name",
    "ward",
    "Ward",
    "WARD",
    "WardName",
    "WARD_NAME",
  ]);
}

function loadCanonicalSubCounties(): CanonicalSubCounty[] {
  const filePath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "subcounties.json",
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Canonical SubCounty file not found: ${filePath}`,
    );
  }

  const raw = fs.readFileSync(filePath, "utf8");

  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(
      "prisma/data/subcounties.json is not an array.",
    );
  }

  return parsed as CanonicalSubCounty[];
}

function loadGeoJSON(): GeoFeature[] {
  const filePath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "kenya-wards-1450.geojson",
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `GeoJSON file not found: ${filePath}`,
    );
  }

  const raw = fs.readFileSync(filePath, "utf8");

  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.features)) {
    throw new Error(
      "kenya-wards-1450.geojson does not contain a valid features array.",
    );
  }

  return parsed.features as GeoFeature[];
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("SUBCOUNTY UNRESOLVED WARD DIAGNOSTIC V6");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  const canonicalSource = loadCanonicalSubCounties();
  const geoFeatures = loadGeoJSON();

  console.log(
    `Canonical SubCounties:     ${canonicalSource.length}`,
  );

  console.log(
    `Authoritative ward features: ${geoFeatures.length}`,
  );

  const counties = await prisma.county.findMany({
    orderBy: {
      id: "asc",
    },
  });

  const subCounties = await prisma.subCounty.findMany({
    include: {
      county: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const wards = await prisma.ward.findMany({
    include: {
      county: true,
      subCounty: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `Database counties:          ${counties.length}`,
  );

  console.log(
    `Database SubCounties:       ${subCounties.length}`,
  );

  console.log(
    `Database wards:             ${wards.length}`,
  );

  console.log("");

  /*
   * ------------------------------------------------------------
   * BUILD AUTHORITATIVE GID INDEX
   * ------------------------------------------------------------
   */

  const geoByGid = new Map<number, GeoFeature>();

  const duplicateGeoGids = new Set<number>();

  for (const feature of geoFeatures) {
    const gid = extractGid(feature);

    if (gid === null) {
      continue;
    }

    if (geoByGid.has(gid)) {
      duplicateGeoGids.add(gid);
    }

    geoByGid.set(gid, feature);
  }

  console.log(
    `Authoritative GID identities: ${geoByGid.size}`,
  );

  if (duplicateGeoGids.size > 0) {
    console.log(
      `WARNING: duplicate authoritative GIDs: ${duplicateGeoGids.size}`,
    );
  }

  /*
   * ------------------------------------------------------------
   * BUILD CANONICAL SOURCE INDEX
   * ------------------------------------------------------------
   */

  const canonicalByCountyAndName =
    new Map<string, CanonicalSubCounty[]>();

  for (const record of canonicalSource) {
    const key =
      `${normalizeCode(record.countyCode)}::${normalizeName(record.name)}`;

    const existing =
      canonicalByCountyAndName.get(key) ?? [];

    existing.push(record);

    canonicalByCountyAndName.set(key, existing);
  }

  /*
   * ------------------------------------------------------------
   * RESOLVE CANONICAL SOURCE → DATABASE
   * ------------------------------------------------------------
   */

  const canonicalDbBySourceKey =
    new Map<string, (typeof subCounties)[number]>();

  const canonicalResolutionWarnings: string[] = [];

  for (const canonical of canonicalSource) {
    const county = counties.find(
      (item) =>
        normalizeCode(item.code) ===
        normalizeCode(canonical.countyCode),
    );

    if (!county) {
      canonicalResolutionWarnings.push(
        `No county for ${canonical.countyCode} / ${canonical.name}`,
      );

      continue;
    }

    const exact = subCounties.filter(
      (item) =>
        item.countyId === county.id &&
        item.name === canonical.name,
    );

    if (exact.length === 1) {
      const key =
        `${county.id}::${normalizeName(canonical.name)}`;

      canonicalDbBySourceKey.set(key, exact[0]);

      continue;
    }

    if (exact.length > 1) {
      canonicalResolutionWarnings.push(
        `Multiple exact DB records for county ${county.id} / ${canonical.name}: ${exact
          .map((x) => x.id)
          .join(", ")}`,
      );

      continue;
    }

    const normalizedMatches = subCounties.filter(
      (item) =>
        item.countyId === county.id &&
        normalizeName(item.name) ===
          normalizeName(canonical.name),
    );

    if (normalizedMatches.length === 1) {
      const key =
        `${county.id}::${normalizeName(canonical.name)}`;

      canonicalDbBySourceKey.set(
        key,
        normalizedMatches[0],
      );

      continue;
    }

    const preferredMatches =
      normalizedMatches.filter(
        (item) =>
          !normalizeName(item.name).includes(
            "sub county",
          ),
      );

    if (preferredMatches.length === 1) {
      const key =
        `${county.id}::${normalizeName(canonical.name)}`;

      canonicalDbBySourceKey.set(
        key,
        preferredMatches[0],
      );

      continue;
    }

    canonicalResolutionWarnings.push(
      `Could not uniquely resolve canonical ${canonical.countyCode} / ${canonical.name}`,
    );
  }

  console.log(
    `Canonical DB resolutions:    ${canonicalDbBySourceKey.size}`,
  );

  console.log(
    `Canonical warnings:          ${canonicalResolutionWarnings.length}`,
  );

  /*
   * ------------------------------------------------------------
   * BUILD DB LOOKUPS
   * ------------------------------------------------------------
   */

  const countyById = new Map(
    counties.map((county) => [county.id, county]),
  );

  const subCountyById = new Map(
    subCounties.map((subCounty) => [
      subCounty.id,
      subCounty,
    ]),
  );

  /*
   * ------------------------------------------------------------
   * IDENTIFY THE 422 UNRESOLVED WARDS
   *
   * The V5 audit established that all DB wards match an
   * authoritative GID.
   *
   * Here we independently determine whether the ward's
   * authoritative SubCounty can be resolved.
   * ------------------------------------------------------------
   */

  const unresolvedRows: DiagnosticRow[] = [];

  const resolvedRows: DiagnosticRow[] = [];

  for (const ward of wards) {
    const gid =
      ward.sourceGid === null
        ? null
        : Number(ward.sourceGid);

    const feature =
      gid === null
        ? undefined
        : geoByGid.get(gid);

    const currentSubCounty =
      ward.subCountyId === null
        ? null
        : subCountyById.get(ward.subCountyId) ?? null;

    const currentCounty =
      countyById.get(ward.countyId) ?? null;

    const authoritativeSubCountyName =
      extractSubCountyName(feature);

    const authoritativeCountyName =
      extractCountyName(feature);

    const authoritativeUid =
      extractUid(feature);

    const authoritativeWardName =
      extractWardName(feature);

    let canonicalSourceName: string | null = null;
    let canonicalCountyCode: string | null = null;

    let canonicalDbId: number | null = null;
    let canonicalDbName: string | null = null;

    let reason = "RESOLVED";

    /*
     * No authoritative GID
     */

    if (!feature) {
      reason =
        "NO_AUTHORITATIVE_FEATURE_FOR_SOURCE_GID";
    }

    /*
     * Feature exists but no SubCounty property.
     */

    else if (!authoritativeSubCountyName) {
      reason =
        "AUTHORITATIVE_FEATURE_HAS_NO_SUBCOUNTY_NAME";
    }

    /*
     * Feature has SubCounty but county is missing.
     */

    else if (
      !authoritativeCountyName &&
      !currentCounty
    ) {
      reason =
        "NO_COUNTY_CONTEXT_FOR_SUBCOUNTY";
    }

    else {
      /*
       * Determine county context.
       */

      let sourceCountyCode: string | null = null;

      if (currentCounty) {
        sourceCountyCode = normalizeCode(
          currentCounty.code,
        );
      }

      /*
       * Try authoritative county name against DB county.
       */

      if (
        !sourceCountyCode &&
        authoritativeCountyName
      ) {
        const normalizedAuthoritativeCounty =
          normalizeName(authoritativeCountyName);

        const matchingCounty =
          counties.filter(
            (county) =>
              normalizeName(county.name) ===
              normalizedAuthoritativeCounty,
          );

        if (matchingCounty.length === 1) {
          sourceCountyCode = normalizeCode(
            matchingCounty[0].code,
          );
        }
      }

      /*
       * Try canonical source by county + authoritative
       * SubCounty name.
       */

      if (
        sourceCountyCode &&
        authoritativeSubCountyName
      ) {
        const canonicalMatches =
          canonicalSource.filter(
            (record) =>
              normalizeCode(record.countyCode) ===
                sourceCountyCode &&
              normalizeName(record.name) ===
                normalizeName(
                  authoritativeSubCountyName,
                ),
          );

        if (canonicalMatches.length === 1) {
          canonicalSourceName =
            canonicalMatches[0].name;

          canonicalCountyCode =
            canonicalMatches[0].countyCode;

          const county =
            counties.find(
              (item) =>
                normalizeCode(item.code) ===
                sourceCountyCode,
            );

          if (county) {
            const key =
              `${county.id}::${normalizeName(
                canonicalMatches[0].name,
              )}`;

            const target =
              canonicalDbBySourceKey.get(key);

            if (target) {
              canonicalDbId = target.id;
              canonicalDbName = target.name;
            } else {
              reason =
                "CANONICAL_SOURCE_FOUND_BUT_DB_TARGET_NOT_FOUND";
            }
          } else {
            reason =
              "COUNTY_CODE_FOUND_BUT_DB_COUNTY_NOT_FOUND";
          }
        } else if (canonicalMatches.length === 0) {
          /*
           * Try normalized county-name matching when
           * authoritative county naming differs.
           */

          const fallbackMatches =
            canonicalSource.filter(
              (record) =>
                normalizeName(record.name) ===
                normalizeName(
                  authoritativeSubCountyName,
                ) &&
                (
                  !authoritativeCountyName ||
                  normalizeName(
                    counties.find(
                      (county) =>
                        normalizeCode(
                          county.code,
                        ) ===
                        sourceCountyCode,
                    )?.name ?? "",
                  ) ===
                    normalizeName(
                      authoritativeCountyName,
                    )
                ),
            );

          if (fallbackMatches.length === 1) {
            canonicalSourceName =
              fallbackMatches[0].name;

            canonicalCountyCode =
              fallbackMatches[0].countyCode;

            const county =
              counties.find(
                (item) =>
                  normalizeCode(item.code) ===
                  normalizeCode(
                    fallbackMatches[0].countyCode,
                  ),
              );

            if (county) {
              const key =
                `${county.id}::${normalizeName(
                  fallbackMatches[0].name,
                )}`;

              const target =
                canonicalDbBySourceKey.get(key);

              if (target) {
                canonicalDbId = target.id;
                canonicalDbName = target.name;
              } else {
                reason =
                  "FALLBACK_CANONICAL_FOUND_BUT_DB_TARGET_NOT_FOUND";
              }
            } else {
              reason =
                "FALLBACK_CANONICAL_FOUND_BUT_COUNTY_NOT_FOUND";
            }
          } else if (fallbackMatches.length > 1) {
            reason =
              "MULTIPLE_CANONICAL_SUBCOUNTY_MATCHES";
          } else {
            reason =
              "AUTHORITATIVE_SUBCOUNTY_NOT_FOUND_IN_CANONICAL_SOURCE";
          }
        } else {
          reason =
            "MULTIPLE_CANONICAL_SUBCOUNTY_MATCHES";
        }
      } else {
        reason =
          "COUNTY_CONTEXT_COULD_NOT_BE_RESOLVED";
      }
    }

    /*
     * If canonical target was resolved, verify it belongs
     * to the same county as the ward.
     */

    if (
      canonicalDbId !== null &&
      currentCounty &&
      canonicalDbId !== currentSubCounty?.id
    ) {
      const target =
        subCountyById.get(canonicalDbId);

      if (
        target &&
        target.countyId !== currentCounty.id
      ) {
        reason =
          "CANONICAL_TARGET_COUNTY_MISMATCH";
      }
    }

    const row: DiagnosticRow = {
      wardId: ward.id,
      wardName: ward.name,

      sourceGid:
        ward.sourceGid === null
          ? null
          : Number(ward.sourceGid),

      sourceUid: ward.sourceUid,

      currentSubCountyId:
        ward.subCountyId,

      currentSubCountyName:
        currentSubCounty?.name ?? null,

      currentCountyId:
        ward.countyId,

      currentCountyName:
        currentCounty?.name ?? null,

      authoritativeGid: gid,

      authoritativeUid,

      authoritativeSubCountyName,

      authoritativeCountyName,

      canonicalSourceName,

      canonicalCountyCode,

      canonicalDbId,

      canonicalDbName,

      reason,
    };

    if (reason === "RESOLVED") {
      resolvedRows.push(row);
    } else {
      unresolvedRows.push(row);
    }

    /*
     * Prevent unused-variable warning in case GeoJSON
     * contains a ward name different from DB.
     */

    void authoritativeWardName;
  }

  /*
   * ------------------------------------------------------------
   * SUMMARY
   * ------------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("V6 RESOLUTION SUMMARY");
  console.log("============================================================");
  console.log("");

  console.log(
    `Database wards:                    ${wards.length}`,
  );

  console.log(
    `Resolved ward targets:             ${resolvedRows.length}`,
  );

  console.log(
    `Unresolved ward targets:           ${unresolvedRows.length}`,
  );

  console.log("");

  /*
   * ------------------------------------------------------------
   * GROUP UNRESOLVED BY REASON
   * ------------------------------------------------------------
   */

  const reasonCounts =
    new Map<string, number>();

  for (const row of unresolvedRows) {
    reasonCounts.set(
      row.reason,
      (reasonCounts.get(row.reason) ?? 0) + 1,
    );
  }

  console.log("UNRESOLVED REASONS");
  console.log("----------------------------");

  for (const [reason, count] of [
    ...reasonCounts.entries(),
  ].sort((a, b) => b[1] - a[1])) {
    console.log(
      `${reason}: ${count}`,
    );
  }

  /*
   * ------------------------------------------------------------
   * GROUP UNRESOLVED BY CURRENT SUBCOUNTY
   * ------------------------------------------------------------
   */

  const unresolvedBySubCounty =
    new Map<string, DiagnosticRow[]>();

  for (const row of unresolvedRows) {
    const key =
      `${row.currentSubCountyId ?? "NULL"}::${row.currentSubCountyName ?? "NULL"}`;

    const existing =
      unresolvedBySubCounty.get(key) ?? [];

    existing.push(row);

    unresolvedBySubCounty.set(
      key,
      existing,
    );
  }

  console.log("");
  console.log(
    "UNRESOLVED WARDS BY CURRENT SUBCOUNTY",
  );
  console.log(
    "------------------------------------------------------------",
  );

  for (const rows of [
    ...unresolvedBySubCounty.values(),
  ].sort((a, b) => {
    const aId = a[0]?.currentSubCountyId ?? 0;
    const bId = b[0]?.currentSubCountyId ?? 0;

    return aId - bId;
  })) {
    const first = rows[0];

    console.log("");
    console.log(
      `${first.currentCountyName ?? "UNKNOWN COUNTY"} | ` +
        `${first.currentSubCountyId ?? "NULL"} ` +
        `${first.currentSubCountyName ?? "NULL"} | ` +
        `wards=${rows.length}`,
    );

    for (const row of rows) {
      console.log(
        `  Ward ${row.wardId}: ${row.wardName}`,
      );

      console.log(
        `    sourceGid=${row.sourceGid} sourceUid=${row.sourceUid}`,
      );

      console.log(
        `    authoritativeSubCounty=${row.authoritativeSubCountyName}`,
      );

      console.log(
        `    authoritativeCounty=${row.authoritativeCountyName}`,
      );

      console.log(
        `    canonicalSource=${row.canonicalSourceName}`,
      );

      console.log(
        `    canonicalDb=${row.canonicalDbId} ${row.canonicalDbName}`,
      );

      console.log(
        `    REASON=${row.reason}`,
      );
    }
  }

  /*
   * ------------------------------------------------------------
   * SPECIFIC NAME-MISMATCH ANALYSIS
   * ------------------------------------------------------------
   */

  console.log("");
  console.log(
    "CURRENT SUBCOUNTY vs AUTHORITATIVE SUBCOUNTY",
  );
  console.log(
    "------------------------------------------------------------",
  );

  const mismatchGroups =
    new Map<string, number>();

  for (const row of unresolvedRows) {
    const current =
      normalizeName(
        row.currentSubCountyName ?? "",
      );

    const authoritative =
      normalizeName(
        row.authoritativeSubCountyName ?? "",
      );

    const key =
      `${row.currentCountyName ?? "UNKNOWN"} | ` +
      `${row.currentSubCountyName ?? "NULL"} | ` +
      `${row.authoritativeSubCountyName ?? "NULL"} | ` +
      `${current === authoritative ? "NORMALIZED_MATCH" : "NAME_DIFFERENCE"}`;

    mismatchGroups.set(
      key,
      (mismatchGroups.get(key) ?? 0) + 1,
    );
  }

  for (const [key, count] of [
    ...mismatchGroups.entries(),
  ].sort((a, b) => b[1] - a[1])) {
    console.log(
      `${count} | ${key}`,
    );
  }

  /*
   * ------------------------------------------------------------
   * EXPORT JSON DIAGNOSTIC
   * ------------------------------------------------------------
   */

  const outputDir =
    path.join(
      process.cwd(),
      "prisma",
      "data",
    );

  const outputPath =
    path.join(
      outputDir,
      "subcounty-unresolved-v6.json",
    );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt:
          new Date().toISOString(),

        readOnly: true,

        summary: {
          canonicalSubCounties:
            canonicalSource.length,

          authoritativeWardFeatures:
            geoFeatures.length,

          databaseCounties:
            counties.length,

          databaseSubCounties:
            subCounties.length,

          databaseWards:
            wards.length,

          resolvedWardTargets:
            resolvedRows.length,

          unresolvedWardTargets:
            unresolvedRows.length,
        },

        reasonCounts:
          Object.fromEntries(
            reasonCounts.entries(),
          ),

        unresolvedBySubCounty:
          [...unresolvedBySubCounty.entries()].map(
            ([key, rows]) => ({
              key,
              rows,
            }),
          ),

        unresolvedRows,

        canonicalResolutionWarnings,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log("");
  console.log(
    `Diagnostic JSON written to: ${outputPath}`,
  );

  /*
   * ------------------------------------------------------------
   * CSV EXPORT
   * ------------------------------------------------------------
   */

  const csvPath =
    path.join(
      outputDir,
      "subcounty-unresolved-v6.csv",
    );

  const csvHeaders = [
    "wardId",
    "wardName",
    "sourceGid",
    "sourceUid",
    "currentSubCountyId",
    "currentSubCountyName",
    "currentCountyId",
    "currentCountyName",
    "authoritativeGid",
    "authoritativeUid",
    "authoritativeSubCountyName",
    "authoritativeCountyName",
    "canonicalSourceName",
    "canonicalCountyCode",
    "canonicalDbId",
    "canonicalDbName",
    "reason",
  ];

  const csvEscape = (
    value: unknown,
  ): string => {
    if (value === null || value === undefined) {
      return "";
    }

    const text = String(value);

    if (
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n") ||
      text.includes("\r")
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const csvLines = [
    csvHeaders.join(","),
  ];

  for (const row of unresolvedRows) {
    csvLines.push(
      [
        row.wardId,
        row.wardName,
        row.sourceGid,
        row.sourceUid,
        row.currentSubCountyId,
        row.currentSubCountyName,
        row.currentCountyId,
        row.currentCountyName,
        row.authoritativeGid,
        row.authoritativeUid,
        row.authoritativeSubCountyName,
        row.authoritativeCountyName,
        row.canonicalSourceName,
        row.canonicalCountyCode,
        row.canonicalDbId,
        row.canonicalDbName,
        row.reason,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  fs.writeFileSync(
    csvPath,
    csvLines.join("\n"),
    "utf8",
  );

  console.log(
    `Diagnostic CSV written to:  ${csvPath}`,
  );

  /*
   * ------------------------------------------------------------
   * FINAL SAFETY CHECK
   * ------------------------------------------------------------
   */

  const accounted =
    resolvedRows.length +
    unresolvedRows.length;

  console.log("");
  console.log("============================================================");
  console.log("FINAL V6 SAFETY CHECK");
  console.log("============================================================");
  console.log("");

  console.log(
    `Database wards:          ${wards.length}`,
  );

  console.log(
    `Resolved:                ${resolvedRows.length}`,
  );

  console.log(
    `Unresolved:              ${unresolvedRows.length}`,
  );

  console.log(
    `Accounted:               ${accounted}`,
  );

  console.log(
    `Unique sourceGids:       ${
      new Set(
        wards
          .map((ward) => ward.sourceGid)
          .filter(
            (gid): gid is number =>
              gid !== null,
          ),
      ).size
    }`,
  );

  if (accounted !== wards.length) {
    throw new Error(
      `SAFETY FAILURE: ${wards.length - accounted} wards were not accounted for.`,
    );
  }

  console.log("");

  if (unresolvedRows.length > 0) {
    console.log(
      "V6 DIAGNOSTIC COMPLETE",
    );

    console.log(
      `There are still ${unresolvedRows.length} unresolved ward targets.`,
    );

    console.log(
      "NO DATABASE CHANGES WERE MADE.",
    );
  } else {
    console.log(
      "PASS — ALL WARD TARGETS ARE RESOLVED.",
    );

    console.log(
      "NO DATABASE CHANGES WERE MADE.",
    );
  }

  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("V6 AUDIT FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });