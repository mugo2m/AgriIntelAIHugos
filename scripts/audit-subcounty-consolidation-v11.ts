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

const GEOJSON_PATH = path.join(
  process.cwd(),
  "prisma",
  "data",
  "kenya-wards-1450.geojson",
);

const V10_PATH = path.join(
  process.cwd(),
  "prisma",
  "data",
  "subcounty-consolidation-v10.json",
);

const OUTPUT_JSON = path.join(
  process.cwd(),
  "prisma",
  "data",
  "subcounty-consolidation-v11.json",
);

const OUTPUT_CSV = path.join(
  process.cwd(),
  "prisma",
  "data",
  "subcounty-consolidation-v11.csv",
);

type GeoFeature = {
  type?: string;
  properties?: {
    gid?: number | string;
    GID?: number | string;
    name?: string;
    ward?: string;
    subcounty?: string;
    subCounty?: string;
    county?: string;
    scuid?: string;
    cuid?: string;
    uid?: string;
    [key: string]: unknown;
  };
};

type V10Migration = {
  county: string;
  sourceId: number;
  sourceName: string;
  targetId: number;
  targetName: string;
  wardCount: number;
  wardIds: number[];
  sourceGids: number[];
  unresolvedWards: number;
  directRelations: {
    farmers: number;
    farms?: number;
    businessPartners: number;
    destinationTransactions: number;
    sourceTransactions: number;
  };
  status: string;
  reason?: string;
};

type V10File = {
  audit?: string;
  safeMigrations?: V10Migration[];
};

type WardIdentity = {
  gid: number;
  wardName: string;
  subcountyName: string;
  countyName: string;
  scuid: string | null;
  cuid: string | null;
  uid: string | null;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getNumber(
  value: number | string | undefined,
): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n) ? n : null;
}

function getWardName(
  properties: GeoFeature["properties"],
): string {
  return String(
    properties?.ward ??
      properties?.name ??
      "",
  ).trim();
}

function getSubCountyName(
  properties: GeoFeature["properties"],
): string {
  return String(
    properties?.subcounty ??
      properties?.subCounty ??
      "",
  ).trim();
}

function getCountyName(
  properties: GeoFeature["properties"],
): string {
  return String(
    properties?.county ??
      "",
  ).trim();
}

async function main() {
  console.log("");
  console.log("==================================================");
  console.log("SUBCOUNTY CONSOLIDATION AUDIT V11");
  console.log("==================================================");
  console.log("CURRENT DATABASE STATE — READ-ONLY");
  console.log("NO DATABASE CHANGES WILL BE MADE.");
  console.log("");

  // ------------------------------------------------------------
  // 1. LOAD AUTHORITATIVE GEOJSON
  // ------------------------------------------------------------

  if (!fs.existsSync(GEOJSON_PATH)) {
    throw new Error(
      `Authoritative GeoJSON not found:\n${GEOJSON_PATH}`,
    );
  }

  const geojson = JSON.parse(
    fs.readFileSync(GEOJSON_PATH, "utf8"),
  );

  const features: GeoFeature[] = Array.isArray(
    geojson?.features,
  )
    ? geojson.features
    : [];

  if (features.length === 0) {
    throw new Error(
      "No GeoJSON features were found.",
    );
  }

  console.log(
    `Authoritative GeoJSON features: ${features.length}`,
  );

  // ------------------------------------------------------------
  // 2. BUILD AUTHORITATIVE GID IDENTITY MAP
  // ------------------------------------------------------------

  const authoritative = new Map<
    number,
    WardIdentity
  >();

  const duplicateAuthoritativeGids: number[] = [];

  for (const feature of features) {
    const p = feature.properties;

    const gid = getNumber(
      p?.gid ?? p?.GID,
    );

    if (gid === null) {
      continue;
    }

    if (authoritative.has(gid)) {
      duplicateAuthoritativeGids.push(gid);
      continue;
    }

    authoritative.set(gid, {
      gid,
      wardName: getWardName(p),
      subcountyName: getSubCountyName(p),
      countyName: getCountyName(p),
      scuid: p?.scuid
        ? String(p.scuid)
        : null,
      cuid: p?.cuid
        ? String(p.cuid)
        : null,
      uid: p?.uid
        ? String(p.uid)
        : null,
    });
  }

  console.log(
    `Authoritative GID identities: ${authoritative.size}`,
  );

  if (duplicateAuthoritativeGids.length > 0) {
    throw new Error(
      `AUTHORITATIVE GEOJSON HAS DUPLICATE GIDS: ${[
        ...new Set(duplicateAuthoritativeGids),
      ].join(", ")}`,
    );
  }

  if (authoritative.size !== 1450) {
    console.log(
      `WARNING: authoritative GID count is ${authoritative.size}, expected 1450.`,
    );
  }

  // ------------------------------------------------------------
  // 3. LOAD V10
  // ------------------------------------------------------------

  if (!fs.existsSync(V10_PATH)) {
    throw new Error(
      `V10 audit file not found:\n${V10_PATH}`,
    );
  }

  const v10: V10File = JSON.parse(
    fs.readFileSync(V10_PATH, "utf8"),
  );

  const v10Safe = Array.isArray(
    v10.safeMigrations,
  )
    ? v10.safeMigrations
    : [];

  console.log(
    `V10 safe migration records: ${v10Safe.length}`,
  );

  // ------------------------------------------------------------
  // 4. READ CURRENT DATABASE
  // ------------------------------------------------------------

  const [counties, subCounties, wards] =
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
          _count: {
            select: {
              wards: true,
              farmers: true,
              businessPartners: true,
              sourceTransactions: true,
              destinationTransactions: true,
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
          sourceGid: true,
          sourceUid: true,
          subCountyId: true,
          countyId: true,
          constituencyId: true,
        },
        orderBy: {
          id: "asc",
        },
      }),
    ]);

  console.log("");
  console.log("CURRENT DATABASE:");
  console.log(`Counties:    ${counties.length}`);
  console.log(`SubCounties: ${subCounties.length}`);
  console.log(`Wards:       ${wards.length}`);
  console.log("");

  // ------------------------------------------------------------
  // 5. MAP COUNTY NAMES
  // ------------------------------------------------------------

  const countyById = new Map(
    counties.map((county) => [
      county.id,
      county,
    ]),
  );

  const countyNameToIds = new Map<
    string,
    number[]
  >();

  for (const county of counties) {
    const key = normalize(county.name);

    const existing =
      countyNameToIds.get(key) ?? [];

    existing.push(county.id);

    countyNameToIds.set(key, existing);
  }

  // ------------------------------------------------------------
  // 6. MAP DATABASE SUBCOUNTIES
  // ------------------------------------------------------------

  const subCountyById = new Map(
    subCounties.map((sc) => [
      sc.id,
      sc,
    ]),
  );

  const subCountyCandidates = new Map<
    string,
    typeof subCounties
  >();

  for (const sc of subCounties) {
    const county = countyById.get(
      sc.countyId,
    );

    if (!county) {
      continue;
    }

    const key =
      `${normalize(county.name)}|${normalize(sc.name)}`;

    const existing =
      subCountyCandidates.get(key) ?? [];

    existing.push(sc);

    subCountyCandidates.set(
      key,
      existing,
    );
  }

  // ------------------------------------------------------------
  // 7. MAP CURRENT DATABASE WARDS BY GID
  // ------------------------------------------------------------

  const dbWardByGid = new Map<
    number,
    (typeof wards)[number]
  >();

  const duplicateDbGids: number[] = [];

  for (const ward of wards) {
    if (ward.sourceGid === null) {
      continue;
    }

    if (dbWardByGid.has(ward.sourceGid)) {
      duplicateDbGids.push(
        ward.sourceGid,
      );
      continue;
    }

    dbWardByGid.set(
      ward.sourceGid,
      ward,
    );
  }

  console.log(
    `Database wards with sourceGid: ${dbWardByGid.size}`,
  );

  if (duplicateDbGids.length > 0) {
    console.log("");
    console.log(
      "WARNING: duplicate database sourceGid values:",
    );

    console.log(
      [...new Set(duplicateDbGids)].join(", "),
    );
  }

  // ------------------------------------------------------------
  // 8. VERIFY EVERY DB WARD AGAINST AUTHORITATIVE GID
  // ------------------------------------------------------------

  const unmatchedDbGids: number[] = [];

  for (const ward of wards) {
    if (ward.sourceGid === null) {
      continue;
    }

    if (!authoritative.has(ward.sourceGid)) {
      unmatchedDbGids.push(
        ward.sourceGid,
      );
    }
  }

  console.log(
    `Database GIDs not found in authoritative source: ${unmatchedDbGids.length}`,
  );

  // ------------------------------------------------------------
  // 9. REBUILD V11 CANDIDATES FROM CURRENT DB
  // ------------------------------------------------------------

  type Candidate = {
    county: string;
    countyId: number;

    sourceId: number;
    sourceName: string;

    targetId: number | null;
    targetName: string | null;

    wardCount: number;
    wardIds: number[];
    sourceGids: number[];

    authoritativeScuids: string[];
    authoritativeSubCounties: string[];

    unresolvedWards: number;

    directRelations: {
      farmers: number;
      farms: number;
      businessPartners: number;
      sourceTransactions: number;
      destinationTransactions: number;
    };

    targetWardCount: number | null;

    status: string;
    reason: string;
  };

  const candidates: Candidate[] = [];

  // Only populated SubCounties need consolidation analysis.
  const populated = subCounties.filter(
    (sc) => sc._count.wards > 0,
  );

  console.log(
    `Populated SubCounties: ${populated.length}`,
  );
  console.log("");

  for (const source of populated) {
    const county =
      countyById.get(source.countyId);

    if (!county) {
      candidates.push({
        county: "UNKNOWN",
        countyId: source.countyId,
        sourceId: source.id,
        sourceName: source.name,
        targetId: null,
        targetName: null,
        wardCount: source._count.wards,
        wardIds: [],
        sourceGids: [],
        authoritativeScuids: [],
        authoritativeSubCounties: [],
        unresolvedWards: source._count.wards,
        directRelations: {
          farmers: source._count.farmers,
          farms: 0,
          businessPartners:
            source._count.businessPartners,
          sourceTransactions:
            source._count.sourceTransactions,
          destinationTransactions:
            source._count.destinationTransactions,
        },
        targetWardCount: null,
        status: "MANUAL_REVIEW",
        reason:
          "Source county could not be resolved.",
      });

      continue;
    }

    const sourceWards =
      wards.filter(
        (ward) =>
          ward.subCountyId === source.id,
      );

    const sourceGids: number[] = [];
    const wardIds: number[] = [];

    const scuidSet = new Set<string>();
    const subcountySet = new Set<string>();

    let unresolvedWards = 0;

    for (const ward of sourceWards) {
      wardIds.push(ward.id);

      if (ward.sourceGid === null) {
        unresolvedWards++;
        continue;
      }

      sourceGids.push(
        ward.sourceGid,
      );

      const identity =
        authoritative.get(
          ward.sourceGid,
        );

      if (!identity) {
        unresolvedWards++;
        continue;
      }

      if (identity.scuid) {
        scuidSet.add(
          identity.scuid,
        );
      }

      if (identity.subcountyName) {
        subcountySet.add(
          identity.subcountyName,
        );
      }
    }

    // ----------------------------------------------------------
    // AUTHORITATIVE TARGET IDENTITY
    // ----------------------------------------------------------

    const authoritativeScuids =
      [...scuidSet];

    const authoritativeSubCounties =
      [...subcountySet];

    let targetId: number | null =
      null;

    let targetName: string | null =
      null;

    let targetWardCount: number | null =
      null;

    let status = "MANUAL_REVIEW";

    let reason =
      "Unable to establish one authoritative canonical target.";

    // All source wards must resolve to exactly
    // one authoritative SubCounty identity.
    if (
      unresolvedWards === 0 &&
      authoritativeSubCounties.length === 1
    ) {
      const authoritativeName =
        authoritativeSubCounties[0];

      const key =
        `${normalize(county.name)}|${normalize(authoritativeName)}`;

      const matches =
        subCountyCandidates.get(key) ??
        [];

      if (matches.length === 1) {
        const target =
          matches[0];

        targetId = target.id;
        targetName = target.name;
        targetWardCount =
          target._count.wards;

        // The source cannot be its own target.
        if (target.id === source.id) {
          status = "ALREADY_CANONICAL";

          reason =
            "Authoritative identity resolves to the current SubCounty.";
        } else if (
          target._count.wards === 0 &&
          source._count.farmers === 0 &&
          source._count.businessPartners === 0 &&
          source._count.sourceTransactions === 0 &&
          source._count.destinationTransactions === 0
        ) {
          status = "SAFE_CANDIDATE";

          reason =
            "All source wards resolve to one authoritative canonical target, target is empty, and source direct relations are zero.";
        } else {
          status = "BLOCKED";

          reason =
            "Authoritative target exists, but the target is not empty or the source has dependent relations.";
        }
      } else if (
        matches.length > 1
      ) {
        status = "MANUAL_REVIEW";

        reason =
          `Multiple database SubCounties match authoritative name: ${matches
            .map(
              (m) =>
                `${m.id} ${m.name}`,
            )
            .join("; ")}`;
      } else {
        status = "MANUAL_REVIEW";

        reason =
          `No canonical database SubCounty matches authoritative name "${authoritativeName}" in county "${county.name}".`;
      }
    } else if (
      unresolvedWards > 0
    ) {
      status = "MANUAL_REVIEW";

      reason =
        "One or more wards could not be resolved to an authoritative GID identity.";
    } else if (
      authoritativeSubCounties.length > 1
    ) {
      status = "MANUAL_REVIEW";

      reason =
        `Source wards resolve to multiple authoritative SubCounties: ${authoritativeSubCounties.join(
          "; ",
        )}`;
    } else {
      status = "MANUAL_REVIEW";

      reason =
        "No authoritative SubCounty identity was resolved.";
    }

    candidates.push({
      county: county.name,
      countyId: county.id,

      sourceId: source.id,
      sourceName: source.name,

      targetId,
      targetName,

      wardCount: sourceWards.length,
      wardIds,
      sourceGids,

      authoritativeScuids,
      authoritativeSubCounties,

      unresolvedWards,

      directRelations: {
        farmers: source._count.farmers,
        farms: 0,
        businessPartners:
          source._count.businessPartners,
        sourceTransactions:
          source._count.sourceTransactions,
        destinationTransactions:
          source._count.destinationTransactions,
      },

      targetWardCount,

      status,
      reason,
    });
  }

  // ------------------------------------------------------------
  // 10. DETECT DUPLICATE TARGETS
  // ------------------------------------------------------------

  const targetGroups =
    new Map<number, Candidate[]>();

  for (const candidate of candidates) {
    if (
      candidate.status !==
        "SAFE_CANDIDATE" ||
      candidate.targetId === null
    ) {
      continue;
    }

    const existing =
      targetGroups.get(
        candidate.targetId,
      ) ?? [];

    existing.push(candidate);

    targetGroups.set(
      candidate.targetId,
      existing,
    );
  }

  const duplicateTargets =
    [...targetGroups.entries()]
      .filter(
        ([, records]) =>
          records.length > 1,
      );

  // ------------------------------------------------------------
  // 11. COMPARE V10 SAFE RECORDS WITH V11
  // ------------------------------------------------------------

  const v10BySource =
    new Map<number, V10Migration>();

  for (const record of v10Safe) {
    v10BySource.set(
      record.sourceId,
      record,
    );
  }

  const mappingChanges: Array<{
    sourceId: number;
    sourceName: string;
    v10TargetId: number;
    v10TargetName: string;
    v11TargetId: number | null;
    v11TargetName: string | null;
    reason: string;
  }> = [];

  for (const candidate of candidates) {
    const old =
      v10BySource.get(
        candidate.sourceId,
      );

    if (!old) {
      continue;
    }

    if (
      old.targetId !==
        candidate.targetId ||
      normalize(old.targetName) !==
        normalize(candidate.targetName)
    ) {
      mappingChanges.push({
        sourceId: candidate.sourceId,
        sourceName: candidate.sourceName,
        v10TargetId: old.targetId,
        v10TargetName: old.targetName,
        v11TargetId:
          candidate.targetId,
        v11TargetName:
          candidate.targetName,
        reason:
          candidate.reason,
      });
    }
  }

  // ------------------------------------------------------------
  // 12. SUMMARY
  // ------------------------------------------------------------

  const safe =
    candidates.filter(
      (c) =>
        c.status ===
        "SAFE_CANDIDATE",
    );

  const blocked =
    candidates.filter(
      (c) =>
        c.status ===
        "BLOCKED",
    );

  const alreadyCanonical =
    candidates.filter(
      (c) =>
        c.status ===
        "ALREADY_CANONICAL",
    );

  const manual =
    candidates.filter(
      (c) =>
        c.status ===
        "MANUAL_REVIEW",
    );

  const wardsInSafe =
    safe.reduce(
      (sum, c) =>
        sum + c.wardCount,
      0,
    );

  const wardsInBlocked =
    blocked.reduce(
      (sum, c) =>
        sum + c.wardCount,
      0,
    );

  const wardsInManual =
    manual.reduce(
      (sum, c) =>
        sum + c.wardCount,
      0,
    );

  const wardsInCanonical =
    alreadyCanonical.reduce(
      (sum, c) =>
        sum + c.wardCount,
      0,
    );

  console.log("");
  console.log("==================================================");
  console.log("V11 CONSOLIDATION SUMMARY");
  console.log("==================================================");
  console.log(
    `Populated SubCounties: ${populated.length}`,
  );
  console.log(
    `SAFE candidates:       ${safe.length}`,
  );
  console.log(
    `BLOCKED:               ${blocked.length}`,
  );
  console.log(
    `Already canonical:     ${alreadyCanonical.length}`,
  );
  console.log(
    `Manual review:         ${manual.length}`,
  );
  console.log("");

  console.log(
    `Wards in SAFE candidates: ${wardsInSafe}`,
  );

  console.log(
    `Wards in BLOCKED:         ${wardsInBlocked}`,
  );

  console.log(
    `Wards already canonical:  ${wardsInCanonical}`,
  );

  console.log(
    `Wards requiring review:   ${wardsInManual}`,
  );

  console.log("");

  // ------------------------------------------------------------
  // 13. DUPLICATE TARGET REPORT
  // ------------------------------------------------------------

  console.log(
    "DUPLICATE TARGET CHECK",
  );
  console.log(
    `Unique SAFE target IDs: ${targetGroups.size}`,
  );
  console.log(
    `Duplicate SAFE target IDs: ${duplicateTargets.length}`,
  );
  console.log("");

  for (const [
    targetId,
    records,
  ] of duplicateTargets) {
    console.log(
      `TARGET ${targetId}`,
    );

    for (const record of records) {
      console.log(
        `  ${record.sourceId} ${record.sourceName} → ${record.targetName}`,
      );

      console.log(
        `  GIDs: [${record.sourceGids.join(", ")}]`,
      );
    }

    console.log("");
  }

  // ------------------------------------------------------------
  // 14. MAPPING CHANGE REPORT
  // ------------------------------------------------------------

  console.log(
    "V10 → V11 MAPPING CHANGES",
  );

  console.log(
    `Mappings changed: ${mappingChanges.length}`,
  );

  console.log("");

  for (const change of mappingChanges) {
    console.log(
      `${change.sourceId} ${change.sourceName}`,
    );

    console.log(
      `  V10: ${change.v10TargetId} ${change.v10TargetName}`,
    );

    console.log(
      `  V11: ${change.v11TargetId ?? "NONE"} ${change.v11TargetName ?? ""}`,
    );

    console.log(
      `  Reason: ${change.reason}`,
    );

    console.log("");
  }

  // ------------------------------------------------------------
  // 15. IMPORTANT KNOWN REPAIRS
  // ------------------------------------------------------------

  console.log(
    "KNOWN V10 REPAIRS — CURRENT DATABASE",
  );

  const repairedMuranga =
    await prisma.subCounty.findUnique({
      where: {
        id: 1393,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            wards: true,
          },
        },
      },
    });

  const deletedMuranga =
    await prisma.subCounty.findUnique({
      where: {
        id: 392,
      },
      select: {
        id: true,
      },
    });

  const repairedSamburu =
    await prisma.subCounty.findUnique({
      where: {
        id: 1422,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            wards: true,
          },
        },
      },
    });

  const deletedSamburu =
    await prisma.subCounty.findUnique({
      where: {
        id: 1423,
      },
      select: {
        id: true,
      },
    });

  console.log(
    `Murang'a South 1393 wards: ${
      repairedMuranga?._count.wards ?? "MISSING"
    }`,
  );

  console.log(
    `Legacy 392 exists: ${
      deletedMuranga ? "YES" : "NO"
    }`,
  );

  console.log(
    `Samburu Central 1422 wards: ${
      repairedSamburu?._count.wards ?? "MISSING"
    }`,
  );

  console.log(
    `Legacy 1423 exists: ${
      deletedSamburu ? "YES" : "NO"
    }`,
  );

  console.log("");

  // ------------------------------------------------------------
  // 16. SAVE JSON
  // ------------------------------------------------------------

  const output = {
    audit: "V11",
    readOnly: true,
    generatedAt:
      new Date().toISOString(),

    database: {
      counties: counties.length,
      subCounties:
        subCounties.length,
      wards: wards.length,
    },

    authoritative: {
      wardFeatures:
        features.length,
      authoritativeGids:
        authoritative.size,
    },

    v10: {
      safeMigrations:
        v10Safe.length,
    },

    summary: {
      populatedSubCounties:
        populated.length,
      safeCandidates:
        safe.length,
      blocked:
        blocked.length,
      alreadyCanonical:
        alreadyCanonical.length,
      manualReview:
        manual.length,
      wardsInSafeCandidates:
        wardsInSafe,
      wardsInBlocked:
        wardsInBlocked,
      wardsInCanonical:
        wardsInCanonical,
      wardsRequiringReview:
        wardsInManual,
      duplicateTargetIds:
        duplicateTargets.length,
      mappingChanges:
        mappingChanges.length,
    },

    duplicateTargets:
      duplicateTargets.map(
        ([targetId, records]) => ({
          targetId,
          records,
        }),
      ),

    mappingChanges,

    safeCandidates: safe,
    blockedCandidates: blocked,
    alreadyCanonical,
    manualReview: manual,

    checks: {
      databaseWardCount:
        wards.length,
      authoritativeGidCount:
        authoritative.size,
      unmatchedDbGids:
        unmatchedDbGids.length,
      duplicateDbGids:
        [...new Set(
          duplicateDbGids,
        )],
    },
  };

  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(
      output,
      null,
      2,
    ),
    "utf8",
  );

  // ------------------------------------------------------------
  // 17. SAVE CSV
  // ------------------------------------------------------------

  const csvRows = [
    [
      "county",
      "sourceId",
      "sourceName",
      "targetId",
      "targetName",
      "wardCount",
      "sourceGids",
      "authoritativeSubCounties",
      "authoritativeScuids",
      "unresolvedWards",
      "farmers",
      "farms",
      "businessPartners",
      "sourceTransactions",
      "destinationTransactions",
      "targetWardCount",
      "status",
      "reason",
    ],
  ];

  for (const c of candidates) {
    csvRows.push([
      c.county,
      String(c.sourceId),
      c.sourceName,
      c.targetId === null
        ? ""
        : String(c.targetId),
      c.targetName ?? "",
      String(c.wardCount),
      c.sourceGids.join("|"),
      c.authoritativeSubCounties.join("|"),
      c.authoritativeScuids.join("|"),
      String(c.unresolvedWards),
      String(
        c.directRelations.farmers,
      ),
      String(
        c.directRelations.farms,
      ),
      String(
        c.directRelations
          .businessPartners,
      ),
      String(
        c.directRelations
          .sourceTransactions,
      ),
      String(
        c.directRelations
          .destinationTransactions,
      ),
      c.targetWardCount === null
        ? ""
        : String(c.targetWardCount),
      c.status,
      c.reason,
    ]);
  }

  const escapeCsv = (
    value: string,
  ): string => {
    if (
      value.includes(",") ||
      value.includes('"') ||
      value.includes("\n")
    ) {
      return `"${value.replace(
        /"/g,
        '""',
      )}"`;
    }

    return value;
  };

  const csvText =
    csvRows
      .map((row) =>
        row
          .map(escapeCsv)
          .join(","),
      )
      .join("\n");

  fs.writeFileSync(
    OUTPUT_CSV,
    csvText,
    "utf8",
  );

  // ------------------------------------------------------------
  // 18. FINAL SAFETY MESSAGE
  // ------------------------------------------------------------

  console.log(
    "OUTPUT FILES:",
  );

  console.log(
    OUTPUT_JSON,
  );

  console.log(
    OUTPUT_CSV,
  );

  console.log("");

  console.log(
    "==================================================",
  );

  if (
    duplicateTargets.length === 0 &&
    mappingChanges.length === 0 &&
    unmatchedDbGids.length === 0 &&
    duplicateDbGids.length === 0
  ) {
    console.log(
      "V11 INITIAL SAFETY CHECK: PASS",
    );
  } else {
    console.log(
      "V11 INITIAL SAFETY CHECK: REVIEW REQUIRED",
    );
  }

  console.log(
    "NO DATABASE CHANGES WERE MADE.",
  );

  console.log(
    "==================================================",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V11 AUDIT FAILED",
    );
    console.error(
      error instanceof Error
        ? error.message
        : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });