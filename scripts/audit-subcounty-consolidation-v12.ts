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

const SUBCOUNTIES_PATH = path.join(
  process.cwd(),
  "prisma",
  "data",
  "subcounties.json",
);

const OUTPUT_JSON = path.join(
  process.cwd(),
  "prisma",
  "data",
  "subcounty-consolidation-v12.json",
);

const OUTPUT_CSV = path.join(
  process.cwd(),
  "prisma",
  "data",
  "subcounty-consolidation-v12.csv",
);

type GeoProperties = {
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

type GeoFeature = {
  properties?: GeoProperties;
};

type WardIdentity = {
  gid: number;
  wardName: string;
  countyName: string;
  subCountyName: string;
  scuid: string | null;
  cuid: string | null;
  uid: string | null;
};

type CanonicalSource = {
  id?: number | string;
  code?: number | string;
  name?: string;
  county?: string;
  county_name?: string;
  countyName?: string;
  scuid?: string;
  scuid_code?: string;
  scuidCode?: string;
  cuid?: string;
  cuid_code?: string;
  cuidCode?: string;
  [key: string]: unknown;
};

type CandidateStatus =
  | "SAFE_CANDIDATE"
  | "BLOCKED"
  | "ALREADY_CANONICAL"
  | "MANUAL_REVIEW";

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

  canonicalSourceMatches: Array<{
    id: number | null;
    code: string | null;
    name: string;
    county: string | null;
    scuid: string | null;
  }>;

  unresolvedWards: number;

  directRelations: {
    farmers: number;
    farms: number;
    businessPartners: number;
    sourceTransactions: number;
    destinationTransactions: number;
  };

  targetWardCount: number | null;

  status: CandidateStatus;

  reason: string;
};

type CanonicalResolution = {
  source: CanonicalSource;
  sourceId: number | null;
  sourceCode: string | null;
  sourceName: string;
  sourceCounty: string | null;
  sourceScuid: string | null;
  dbMatches: typeof subCountiesPlaceholder;
};

type DbSubCounty = {
  id: number;
  name: string;
  countyId: number;
  _count: {
    wards: number;
    farmers: number;
    businessPartners: number;
    sourceTransactions: number;
    destinationTransactions: number;
  };
};

type DbWard = {
  id: number;
  name: string;
  sourceGid: number | null;
  sourceUid: string | null;
  subCountyId: number | null;
  countyId: number;
  constituencyId: number;
};

type DbCounty = {
  id: number;
  name: string;
};

type subCountiesPlaceholder = DbSubCounty;

function normalizeBasic(
  value: string | null | undefined,
): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLoose(
  value: string | null | undefined,
): string {
  return normalizeBasic(value)
    .replace(/\bsub\s+county\b/g, "")
    .replace(/\bcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(
  value: string | null | undefined,
): string {
  return normalizeBasic(value).replace(
    /\s+/g,
    "",
  );
}

function compactLoose(
  value: string | null | undefined,
): string {
  return normalizeLoose(value).replace(
    /\s+/g,
    "",
  );
}

function numberValue(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}

function stringValue(
  value: unknown,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text = String(value).trim();

  return text.length > 0
    ? text
    : null;
}

function getGeoGid(
  properties: GeoProperties | undefined,
): number | null {
  return numberValue(
    properties?.gid ??
      properties?.GID,
  );
}

function getGeoWardName(
  properties: GeoProperties | undefined,
): string {
  return (
    stringValue(
      properties?.ward ??
        properties?.name,
    ) ?? ""
  );
}

function getGeoSubCountyName(
  properties: GeoProperties | undefined,
): string {
  return (
    stringValue(
      properties?.subcounty ??
        properties?.subCounty,
    ) ?? ""
  );
}

function getGeoCountyName(
  properties: GeoProperties | undefined,
): string {
  return (
    stringValue(
      properties?.county,
    ) ?? ""
  );
}

function getCanonicalId(
  record: CanonicalSource,
): number | null {
  return numberValue(
    record.id ??
      record.code,
  );
}

function getCanonicalName(
  record: CanonicalSource,
): string {
  return (
    stringValue(
      record.name,
    ) ?? ""
  );
}

function getCanonicalCountyName(
  record: CanonicalSource,
): string | null {
  return stringValue(
    record.county ??
      record.county_name ??
      record.countyName,
  );
}

function getCanonicalScuid(
  record: CanonicalSource,
): string | null {
  return stringValue(
    record.scuid ??
      record.scuid_code ??
      record.scuidCode,
  );
}

function extractCanonicalRecords(
  data: unknown,
): CanonicalSource[] {
  if (Array.isArray(data)) {
    return data as CanonicalSource[];
  }

  if (
    data &&
    typeof data === "object"
  ) {
    const object = data as Record<
      string,
      unknown
    >;

    const possibleKeys = [
      "subcounties",
      "subCounties",
      "records",
      "data",
    ];

    for (
      const key of possibleKeys
    ) {
      if (
        Array.isArray(
          object[key],
        )
      ) {
        return object[
          key
        ] as CanonicalSource[];
      }
    }

    const values =
      Object.values(
        object,
      );

    if (
      values.length === 330 &&
      values.every(
        (value) =>
          value !== null &&
          typeof value ===
            "object",
      )
    ) {
      return values as CanonicalSource[];
    }
  }

  throw new Error(
    "Could not locate the canonical SubCounty records inside subcounties.json.",
  );
}

async function main() {
  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "SUBCOUNTY CONSOLIDATION AUDIT V12",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "READ-ONLY AUDIT",
  );
  console.log(
    "NO DATABASE CHANGES WILL BE MADE.",
  );
  console.log("");

  // ==========================================================
  // 1. LOAD GEOJSON
  // ==========================================================

  if (
    !fs.existsSync(
      GEOJSON_PATH,
    )
  ) {
    throw new Error(
      `GeoJSON file not found:\n${GEOJSON_PATH}`,
    );
  }

  const geojson =
    JSON.parse(
      fs.readFileSync(
        GEOJSON_PATH,
        "utf8",
      ),
    );

  const features: GeoFeature[] =
    Array.isArray(
      geojson?.features,
    )
      ? geojson.features
      : [];

  if (
    features.length === 0
  ) {
    throw new Error(
      "No GeoJSON features found.",
    );
  }

  console.log(
    `Authoritative GeoJSON features: ${features.length}`,
  );

  // ==========================================================
  // 2. BUILD AUTHORITATIVE GID MAP
  // ==========================================================

  const authoritative =
    new Map<
      number,
      WardIdentity
    >();

  const duplicateAuthoritativeGids =
    new Set<number>();

  for (
    const feature of features
  ) {
    const properties =
      feature.properties;

    const gid =
      getGeoGid(properties);

    if (
      gid === null
    ) {
      continue;
    }

    if (
      authoritative.has(
        gid,
      )
    ) {
      duplicateAuthoritativeGids.add(
        gid,
      );

      continue;
    }

    authoritative.set(
      gid,
      {
        gid,

        wardName:
          getGeoWardName(
            properties,
          ),

        countyName:
          getGeoCountyName(
            properties,
          ),

        subCountyName:
          getGeoSubCountyName(
            properties,
          ),

        scuid:
          stringValue(
            properties?.scuid,
          ),

        cuid:
          stringValue(
            properties?.cuid,
          ),

        uid:
          stringValue(
            properties?.uid,
          ),
      },
    );
  }

  console.log(
    `Authoritative GID identities: ${authoritative.size}`,
  );

  if (
    duplicateAuthoritativeGids.size >
    0
  ) {
    throw new Error(
      `Duplicate authoritative GIDs detected: ${[
        ...duplicateAuthoritativeGids,
      ].join(", ")}`,
    );
  }

  // ==========================================================
  // 3. LOAD CANONICAL SUBCOUNTIES
  // ==========================================================

  if (
    !fs.existsSync(
      SUBCOUNTIES_PATH,
    )
  ) {
    throw new Error(
      `Canonical SubCounty file not found:\n${SUBCOUNTIES_PATH}`,
    );
  }

  const canonicalJson =
    JSON.parse(
      fs.readFileSync(
        SUBCOUNTIES_PATH,
        "utf8",
      ),
    );

  const canonicalRecords =
    extractCanonicalRecords(
      canonicalJson,
    );

  console.log(
    `Canonical source records: ${canonicalRecords.length}`,
  );

  if (
    canonicalRecords.length !==
    330
  ) {
    throw new Error(
      `Expected exactly 330 canonical SubCounty records, found ${canonicalRecords.length}.`,
    );
  }

  // ==========================================================
  // 4. DATABASE
  // ==========================================================

  const [
    counties,
    subCounties,
    wards,
  ] =
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
  console.log(
    "CURRENT DATABASE",
  );
  console.log(
    `Counties:    ${counties.length}`,
  );
  console.log(
    `SubCounties: ${subCounties.length}`,
  );
  console.log(
    `Wards:       ${wards.length}`,
  );
  console.log("");

  // ==========================================================
  // 5. COUNTY LOOKUPS
  // ==========================================================

  const countyById =
    new Map<
      number,
      DbCounty
    >();

  for (
    const county of counties
  ) {
    countyById.set(
      county.id,
      county,
    );
  }

  const countyIdsByName =
    new Map<
      string,
      number[]
    >();

  for (
    const county of counties
  ) {
    const key =
      normalizeBasic(
        county.name,
      );

    const existing =
      countyIdsByName.get(
        key,
      ) ?? [];

    existing.push(
      county.id,
    );

    countyIdsByName.set(
      key,
      existing,
    );
  }

  // ==========================================================
  // 6. DATABASE SUBCOUNTY LOOKUP
  // ==========================================================

  const subCountyById =
    new Map<
      number,
      DbSubCounty
    >();

  for (
    const subCounty of
      subCounties
  ) {
    subCountyById.set(
      subCounty.id,
      subCounty,
    );
  }

  // ==========================================================
  // 7. RESOLVE ALL 330 CANONICAL SOURCE RECORDS
  // ==========================================================

  const canonicalResolutions: Array<{
    source: CanonicalSource;
    sourceId: number | null;
    sourceName: string;
    sourceCounty: string | null;
    sourceScuid: string | null;
    dbMatches: DbSubCounty[];
  }> = [];

  let canonicalUnresolved =
    0;

  let canonicalAmbiguous =
    0;

  for (
    const record of
      canonicalRecords
  ) {
    const sourceId =
      getCanonicalId(
        record,
      );

    const sourceName =
      getCanonicalName(
        record,
      );

    const sourceCounty =
      getCanonicalCountyName(
        record,
      );

    const sourceScuid =
      getCanonicalScuid(
        record,
      );

    let dbMatches:
      DbSubCounty[] = [];

    if (
      sourceCounty !== null
    ) {
      const countyIds =
        countyIdsByName.get(
          normalizeBasic(
            sourceCounty,
          ),
        ) ?? [];

      if (
        countyIds.length ===
        1
      ) {
        const countyId =
          countyIds[0];

        dbMatches =
          subCounties.filter(
            (sc) =>
              sc.countyId ===
                countyId &&
              normalizeBasic(
                sc.name,
              ) ===
                normalizeBasic(
                  sourceName,
                ),
          );

        // If exact name failed, allow the
        // compact representation.
        if (
          dbMatches.length ===
          0
        ) {
          dbMatches =
            subCounties.filter(
              (sc) =>
                sc.countyId ===
                  countyId &&
                compact(
                  sc.name,
                ) ===
                  compact(
                    sourceName,
                  ),
            );
        }

        // Finally allow the "Sub County"
        // suffix difference.
        if (
          dbMatches.length ===
          0
        ) {
          dbMatches =
            subCounties.filter(
              (sc) =>
                sc.countyId ===
                  countyId &&
                compactLoose(
                  sc.name,
                ) ===
                  compactLoose(
                    sourceName,
                  ),
            );
        }
      }
    } else {
      dbMatches =
        subCounties.filter(
          (sc) =>
            normalizeBasic(
              sc.name,
            ) ===
            normalizeBasic(
              sourceName,
            ),
        );
    }

    if (
      dbMatches.length ===
      0
    ) {
      canonicalUnresolved++;
    }

    if (
      dbMatches.length >
      1
    ) {
      canonicalAmbiguous++;
    }

    canonicalResolutions.push({
      source: record,
      sourceId,
      sourceName,
      sourceCounty,
      sourceScuid,
      dbMatches,
    });
  }

  console.log(
    "CANONICAL SOURCE RESOLUTION",
  );

  console.log(
    `Canonical records: ${canonicalRecords.length}`,
  );

  console.log(
    `Resolved: ${
      canonicalRecords.length -
      canonicalUnresolved -
      canonicalAmbiguous
    }`,
  );

  console.log(
    `Unresolved: ${canonicalUnresolved}`,
  );

  console.log(
    `Ambiguous: ${canonicalAmbiguous}`,
  );

  console.log("");

  // ==========================================================
  // 8. CANONICAL LOOKUPS
  // ==========================================================

  const canonicalByScuid =
    new Map<
      string,
      typeof canonicalResolutions
    >();

  const canonicalByNameCounty =
    new Map<
      string,
      typeof canonicalResolutions
    >();

  for (
    const resolution of
      canonicalResolutions
  ) {
    if (
      resolution.sourceScuid
    ) {
      const existing =
        canonicalByScuid.get(
          resolution.sourceScuid,
        ) ?? [];

      existing.push(
        resolution,
      );

      canonicalByScuid.set(
        resolution.sourceScuid,
        existing,
      );
    }

    const key =
      `${normalizeBasic(
        resolution.sourceCounty,
      )}|${compactLoose(
        resolution.sourceName,
      )}`;

    const existing =
      canonicalByNameCounty.get(
        key,
      ) ?? [];

    existing.push(
      resolution,
    );

    canonicalByNameCounty.set(
      key,
      existing,
    );
  }

  // ==========================================================
  // 9. WARD LOOKUP
  // ==========================================================

  const wardsBySubCounty =
    new Map<
      number,
      DbWard[]
    >();

  for (
    const ward of wards
  ) {
    if (
      ward.subCountyId ===
      null
    ) {
      continue;
    }

    const existing =
      wardsBySubCounty.get(
        ward.subCountyId,
      ) ?? [];

    existing.push(
      ward,
    );

    wardsBySubCounty.set(
      ward.subCountyId,
      existing,
    );
  }

  // ==========================================================
  // 10. AUTHORITATIVE GROUPS
  // ==========================================================

  const authoritativeGidsByScuid =
    new Map<
      string,
      number[]
    >();

  const authoritativeGidsByName =
    new Map<
      string,
      number[]
    >();

  for (
    const identity of
      authoritative.values()
  ) {
    if (
      identity.scuid
    ) {
      const existing =
        authoritativeGidsByScuid.get(
          identity.scuid,
        ) ?? [];

      existing.push(
        identity.gid,
      );

      authoritativeGidsByScuid.set(
        identity.scuid,
        existing,
      );
    }

    const key =
      `${normalizeBasic(
        identity.countyName,
      )}|${compactLoose(
        identity.subCountyName,
      )}`;

    const existing =
      authoritativeGidsByName.get(
        key,
      ) ?? [];

    existing.push(
      identity.gid,
    );

    authoritativeGidsByName.set(
      key,
      existing,
    );
  }

  // ==========================================================
  // 11. ANALYZE POPULATED SUBCOUNTIES
  // ==========================================================

  const populated =
    subCounties.filter(
      (sc) =>
        sc._count.wards > 0,
    );

  console.log(
    `Populated SubCounties: ${populated.length}`,
  );

  console.log("");

  const candidates:
    Candidate[] = [];

  for (
    const source of populated
  ) {
    const county =
      countyById.get(
        source.countyId,
      );

    const sourceWards =
      wardsBySubCounty.get(
        source.id,
      ) ?? [];

    const sourceGids =
      sourceWards
        .map(
          (ward) =>
            ward.sourceGid,
        )
        .filter(
          (
            gid,
          ): gid is number =>
            gid !== null,
        );

    const wardIds =
      sourceWards.map(
        (ward) =>
          ward.id,
      );

    const authoritativeScuids =
      new Set<string>();

    const authoritativeSubCounties =
      new Set<string>();

    let unresolvedWards =
      0;

    for (
      const ward of
        sourceWards
    ) {
      if (
        ward.sourceGid ===
        null
      ) {
        unresolvedWards++;
        continue;
      }

      const identity =
        authoritative.get(
          ward.sourceGid,
        );

      if (!identity) {
        unresolvedWards++;
        continue;
      }

      if (
        identity.scuid
      ) {
        authoritativeScuids.add(
          identity.scuid,
        );
      }

      if (
        identity.subCountyName
      ) {
        authoritativeSubCounties.add(
          identity.subCountyName,
        );
      }
    }

    const directRelations = {
      farmers:
        source._count.farmers,

      farms: 0,

      businessPartners:
        source._count
          .businessPartners,

      sourceTransactions:
        source._count
          .sourceTransactions,

      destinationTransactions:
        source._count
          .destinationTransactions,
    };

    let canonicalMatches:
      typeof canonicalResolutions =
      [];

    if (
      authoritativeScuids.size ===
      1
    ) {
      const scuid =
        [
          ...authoritativeScuids,
        ][0];

      canonicalMatches =
        canonicalByScuid.get(
          scuid,
        ) ?? [];
    }

    if (
      canonicalMatches.length ===
        0 &&
      authoritativeScuids.size ===
        0 &&
      authoritativeSubCounties.size ===
        1 &&
      county
    ) {
      const authoritativeName =
        [
          ...authoritativeSubCounties,
        ][0];

      const key =
        `${normalizeBasic(
          county.name,
        )}|${compactLoose(
          authoritativeName,
        )}`;

      canonicalMatches =
        canonicalByNameCounty.get(
          key,
        ) ?? [];
    }

    let targetId:
      number | null =
      null;

    let targetName:
      string | null =
      null;

    let targetWardCount:
      number | null =
      null;

    let status:
      CandidateStatus =
      "MANUAL_REVIEW";

    let reason =
      "Unable to resolve authoritative canonical identity.";

    if (!county) {
      status =
        "MANUAL_REVIEW";

      reason =
        "Source county does not exist in the database.";
    } else if (
      unresolvedWards > 0
    ) {
      status =
        "MANUAL_REVIEW";

      reason =
        "One or more database wards do not have a valid authoritative GID identity.";
    } else if (
      authoritativeScuids.size >
      1
    ) {
      status =
        "MANUAL_REVIEW";

      reason =
        `Source wards contain multiple authoritative SCUIDs: ${[
          ...authoritativeScuids,
        ].join(", ")}`;
    } else if (
      authoritativeSubCounties.size >
      1
    ) {
      status =
        "MANUAL_REVIEW";

      reason =
        `Source wards resolve to multiple authoritative SubCounty names: ${[
          ...authoritativeSubCounties,
        ].join("; ")}`;
    } else if (
      canonicalMatches.length ===
      0
    ) {
      status =
        "MANUAL_REVIEW";

      reason =
        "No canonical record in subcounties.json matches the authoritative ward identity.";
    } else if (
      canonicalMatches.length >
      1
    ) {
      status =
        "MANUAL_REVIEW";

      reason =
        `Multiple canonical records match the authoritative identity: ${canonicalMatches
          .map(
            (match) =>
              `${getCanonicalId(
                match.source,
              ) ?? "NO-ID"} ${match.sourceName}`,
          )
          .join("; ")}`;
    } else {
      const canonical =
        canonicalMatches[0];

      const dbMatches =
        canonical.dbMatches;

      if (
        dbMatches.length ===
        0
      ) {
        status =
          "MANUAL_REVIEW";

        reason =
          `Canonical source "${canonical.sourceName}" has no matching database SubCounty.`;
      } else if (
        dbMatches.length >
        1
      ) {
        status =
          "MANUAL_REVIEW";

        reason =
          `Canonical source "${canonical.sourceName}" matches multiple database SubCounties: ${dbMatches
            .map(
              (match) =>
                `${match.id} ${match.name}`,
            )
            .join("; ")}`;
      } else {
        const target =
          dbMatches[0];

        targetId =
          target.id;

        targetName =
          target.name;

        targetWardCount =
          target._count.wards;

        const expectedGids =
          canonical.sourceScuid
            ? authoritativeGidsByScuid.get(
                canonical.sourceScuid,
              ) ?? []
            : county
              ? authoritativeGidsByName.get(
                  `${normalizeBasic(
                    county.name,
                  )}|${compactLoose(
                    canonical.sourceName,
                  )}`,
                ) ?? []
              : [];

        const sourceGidsSorted =
          [...sourceGids].sort(
            (a, b) =>
              a - b,
          );

        const expectedGidsSorted =
          [...expectedGids].sort(
            (a, b) =>
              a - b,
          );

        const sourceComplete =
          sourceGidsSorted.length ===
            expectedGidsSorted.length &&
          sourceGidsSorted.every(
            (
              gid,
              index,
            ) =>
              gid ===
              expectedGidsSorted[
                index
              ],
          );

        const targetWards =
          wardsBySubCounty.get(
            target.id,
          ) ?? [];

        const targetGids =
          targetWards
            .map(
              (ward) =>
                ward.sourceGid,
            )
            .filter(
              (
                gid,
              ): gid is number =>
                gid !== null,
            );

        const targetHasWrongGids =
          targetGids.some(
            (gid) =>
              !expectedGids.includes(
                gid,
              ),
          );

        if (
          target.id ===
          source.id
        ) {
          if (
            sourceComplete &&
            !targetHasWrongGids
          ) {
            status =
              "ALREADY_CANONICAL";

            reason =
              "Current database SubCounty is the canonical target and its wards exactly match the authoritative ward set.";
          } else {
            status =
              "MANUAL_REVIEW";

            reason =
              "Database SubCounty resolves to the canonical record, but its current ward set does not exactly match the authoritative ward set.";
          }
        } else if (
          !sourceComplete
        ) {
          status =
            "MANUAL_REVIEW";

          reason =
            "Source SubCounty contains only part of the authoritative ward set or contains an unexpected ward.";
        } else if (
          targetHasWrongGids
        ) {
          status =
            "MANUAL_REVIEW";

          reason =
            "Canonical target already contains one or more wards that do not belong to its authoritative ward set.";
        } else if (
          target._count.wards >
            0
        ) {
          status =
            "BLOCKED";

          reason =
            "Canonical target already contains wards. No automatic consolidation is permitted.";
        } else if (
          source._count.farmers >
            0 ||
          source._count
              .businessPartners >
            0 ||
          source._count
              .sourceTransactions >
            0 ||
          source._count
              .destinationTransactions >
            0
        ) {
          status =
            "BLOCKED";

          reason =
            "Legacy source has direct dependent relations.";
        } else {
          status =
            "SAFE_CANDIDATE";

          reason =
            "Authoritative GID identity resolves to one canonical source record, the source contains the complete authoritative ward set, the canonical target is empty, and the legacy source has zero direct relations.";
        }
      }
    }

    candidates.push({
      county:
        county?.name ??
        "UNKNOWN",

      countyId:
        source.countyId,

      sourceId:
        source.id,

      sourceName:
        source.name,

      targetId,

      targetName,

      wardCount:
        sourceWards.length,

      wardIds,

      sourceGids,

      authoritativeScuids:
        [
          ...authoritativeScuids,
        ],

      authoritativeSubCounties:
        [
          ...authoritativeSubCounties,
        ],

      canonicalSourceMatches:
        canonicalMatches.map(
          (match) => ({
            id:
              getCanonicalId(
                match.source,
              ),

            code:
              match.sourceCode,

            name:
              match.sourceName,

            county:
              match.sourceCounty,

            scuid:
              match.sourceScuid,
          }),
        ),

      unresolvedWards,

      directRelations,

      targetWardCount,

      status,

      reason,
    });
  }

  // ==========================================================
  // 12. DUPLICATE TARGET CHECK
  // ==========================================================

  const preliminarySafe =
    candidates.filter(
      (candidate) =>
        candidate.status ===
        "SAFE_CANDIDATE",
    );

  const targetGroups =
    new Map<
      number,
      Candidate[]
    >();

  for (
    const candidate of
      preliminarySafe
  ) {
    if (
      candidate.targetId ===
      null
    ) {
      continue;
    }

    const existing =
      targetGroups.get(
        candidate.targetId,
      ) ?? [];

    existing.push(
      candidate,
    );

    targetGroups.set(
      candidate.targetId,
      existing,
    );
  }

  const duplicateTargets =
    [
      ...targetGroups.entries(),
    ].filter(
      ([, records]) =>
        records.length >
        1,
    );

  for (
    const [
      targetId,
      records,
    ] of duplicateTargets
  ) {
    for (
      const candidate of
        records
    ) {
      candidate.status =
        "MANUAL_REVIEW";

      candidate.reason =
        `Canonical target ${targetId} is claimed by multiple SAFE candidates. Manual resolution required.`;
    }
  }

  // ==========================================================
  // 13. FINAL STATUS GROUPS
  // ==========================================================

  const safe =
    candidates.filter(
      (candidate) =>
        candidate.status ===
        "SAFE_CANDIDATE",
    );

  const blocked =
    candidates.filter(
      (candidate) =>
        candidate.status ===
        "BLOCKED",
    );

  const alreadyCanonical =
    candidates.filter(
      (candidate) =>
        candidate.status ===
        "ALREADY_CANONICAL",
    );

  const manual =
    candidates.filter(
      (candidate) =>
        candidate.status ===
        "MANUAL_REVIEW",
    );

  // ==========================================================
  // 14. WARD ACCOUNTING
  // ==========================================================

  const databaseWardIds =
    new Set<number>();

  for (
    const ward of wards
  ) {
    databaseWardIds.add(
      ward.id,
    );
  }

  const candidateWardIds =
    new Set<number>();

  for (
    const candidate of
      candidates
  ) {
    for (
      const wardId of
        candidate.wardIds
    ) {
      candidateWardIds.add(
        wardId,
      );
    }
  }

  const missingWardIds =
    [
      ...databaseWardIds,
    ].filter(
      (id) =>
        !candidateWardIds.has(
          id,
        ),
    );

  const extraWardIds =
    [
      ...candidateWardIds,
    ].filter(
      (id) =>
        !databaseWardIds.has(
          id,
        ),
    );

  // ==========================================================
  // 15. SOURCE GID ACCOUNTING
  // ==========================================================

  const databaseGids =
    new Set<number>();

  const duplicateDatabaseGids =
    new Set<number>();

  for (
    const ward of wards
  ) {
    if (
      ward.sourceGid ===
      null
    ) {
      continue;
    }

    if (
      databaseGids.has(
        ward.sourceGid,
      )
    ) {
      duplicateDatabaseGids.add(
        ward.sourceGid,
      );
    }

    databaseGids.add(
      ward.sourceGid,
    );
  }

  const authoritativeGids =
    new Set(
      authoritative.keys(),
    );

  const unmatchedDatabaseGids =
    [
      ...databaseGids,
    ].filter(
      (gid) =>
        !authoritativeGids.has(
          gid,
        ),
    );

  const missingDatabaseGids =
    [
      ...authoritativeGids,
    ].filter(
      (gid) =>
        !databaseGids.has(
          gid,
        ),
    );

  // ==========================================================
  // 16. SUMMARY
  // ==========================================================

  const wardsInSafe =
    safe.reduce(
      (sum, candidate) =>
        sum +
        candidate.wardCount,
      0,
    );

  const wardsInBlocked =
    blocked.reduce(
      (sum, candidate) =>
        sum +
        candidate.wardCount,
      0,
    );

  const wardsInCanonical =
    alreadyCanonical.reduce(
      (sum, candidate) =>
        sum +
        candidate.wardCount,
      0,
    );

  const wardsInManual =
    manual.reduce(
      (sum, candidate) =>
        sum +
        candidate.wardCount,
      0,
    );

  console.log(
    "============================================================",
  );
  console.log(
    "V12 CONSOLIDATION SUMMARY",
  );
  console.log(
    "============================================================");

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

  // ==========================================================
  // 17. DUPLICATE TARGETS
  // ==========================================================

  console.log(
    "DUPLICATE TARGET CHECK",
  );

  console.log(
    `Duplicate target IDs: ${duplicateTargets.length}`,
  );

  if (
    duplicateTargets.length ===
    0
  ) {
    console.log(
      "PASS — no SAFE candidates share a target.",
    );
  } else {
    console.log(
      "REVIEW REQUIRED — duplicate targets found.",
    );

    for (
      const [
        targetId,
        records,
      ] of duplicateTargets
    ) {
      console.log("");

      console.log(
        `TARGET ${targetId}`,
      );

      for (
        const record of
          records
      ) {
        console.log(
          `  ${record.sourceId} ${record.sourceName} → ${record.targetName}`,
        );
      }
    }
  }

  console.log("");

  // ==========================================================
  // 18. IMPORTANT KNOWN REPAIRS
  // ==========================================================

  console.log(
    "KNOWN COMPLETED REPAIRS",
  );

  console.log(
    "392 Muranga South Sub County → 1393 Murang'a South",
  );

  console.log(
    "353 Samburu Central Sub County → 1422 Samburu Central",
  );

  console.log("");

  // ==========================================================
  // 19. AINAMOI SAFETY CHECK
  // ==========================================================

  const ainamoi =
    subCountyById.get(
      295,
    );

  if (ainamoi) {
    const ainamoiWards =
      wardsBySubCounty.get(
        295,
      ) ?? [];

    console.log(
      "AINAMOI SAFETY CHECK",
    );

    console.log(
      `295 ${ainamoi.name}`,
    );

    console.log(
      `Ward count: ${ainamoiWards.length}`,
    );

    console.log(
      `GIDs: [${ainamoiWards
        .map(
          (ward) =>
            ward.sourceGid,
        )
        .join(", ")}]`,
    );

    console.log(
      "295 AINAMOI will NOT be automatically migrated by V12 unless its complete authoritative identity proves it safe.",
    );

    console.log("");
  }

  // ==========================================================
  // 20. MURANG'A CHECK
  // ==========================================================

  const murangaIds = [
    1389,
    1390,
    1391,
    1392,
    1393,
    1394,
    1395,
    1396,
    393,
    394,
    537,
  ];

  console.log(
    "MURANG'A CURRENT STATE",
  );

  for (
    const id of murangaIds
  ) {
    const sc =
      subCountyById.get(
        id,
      );

    if (!sc) {
      continue;
    }

    const scWards =
      wardsBySubCounty.get(
        id,
      ) ?? [];

    console.log(
      `${id} ${sc.name} — ${scWards.length} wards`,
    );
  }

  console.log("");

  // ==========================================================
  // 21. SAMBURU CHECK
  // ==========================================================

  const samburuIds = [
    420,
    421,
    1422,
    1423,
    1424,
  ];

  console.log(
    "SAMBURU CURRENT STATE",
  );

  for (
    const id of samburuIds
  ) {
    const sc =
      subCountyById.get(
        id,
      );

    if (!sc) {
      console.log(
        `${id} — NOT PRESENT`,
      );

      continue;
    }

    const scWards =
      wardsBySubCounty.get(
        id,
      ) ?? [];

    console.log(
      `${id} ${sc.name} — ${scWards.length} wards`,
    );
  }

  console.log("");

  // ==========================================================
  // 22. FINAL STRUCTURAL CHECK
  // ==========================================================

  const structuralPass =
    features.length === 1450 &&
    authoritative.size === 1450 &&
    canonicalRecords.length ===
      330 &&
    canonicalUnresolved === 0 &&
    canonicalAmbiguous === 0 &&
    duplicateDatabaseGids.size ===
      0 &&
    unmatchedDatabaseGids.length ===
      0 &&
    missingDatabaseGids.length ===
      0 &&
    missingWardIds.length ===
      0 &&
    extraWardIds.length ===
      0 &&
    duplicateTargets.length ===
      0;

  console.log(
    "============================================================",
  );

  if (structuralPass) {
    console.log(
      "V12 STRUCTURAL CHECK: PASS",
    );
  } else {
    console.log(
      "V12 STRUCTURAL CHECK: REVIEW REQUIRED",
    );
  }

  console.log("");

  console.log(
    `Database wards:              ${wards.length}`,
  );

  console.log(
    `Database unique GIDs:        ${databaseGids.size}`,
  );

  console.log(
    `Authoritative GIDs:          ${authoritative.size}`,
  );

  console.log(
    `Duplicate database GIDs:     ${duplicateDatabaseGids.size}`,
  );

  console.log(
    `Unmatched database GIDs:      ${unmatchedDatabaseGids.length}`,
  );

  console.log(
    `Missing database GIDs:        ${missingDatabaseGids.length}`,
  );

  console.log(
    `Missing candidate ward IDs:   ${missingWardIds.length}`,
  );

  console.log(
    `Extra candidate ward IDs:     ${extraWardIds.length}`,
  );

  console.log("");

  console.log(
    "SAFE CANDIDATES",
  );

  for (
    const candidate of safe
  ) {
    console.log(
      `${candidate.sourceId} ${candidate.sourceName} → ${candidate.targetId} ${candidate.targetName} | ${candidate.wardCount} wards | GIDs [${candidate.sourceGids.join(", ")}]`,
    );
  }

  console.log("");

  // ==========================================================
  // 23. WRITE JSON
  // ==========================================================

  const output = {
    audit: "V12",

    readOnly: true,

    generatedAt:
      new Date().toISOString(),

    database: {
      counties:
        counties.length,

      subCounties:
        subCounties.length,

      wards:
        wards.length,
    },

    authoritative: {
      geojsonFeatures:
        features.length,

      authoritativeGids:
        authoritative.size,

      canonicalSubCounties:
        canonicalRecords.length,
    },

    resolution: {
      canonicalRecords:
        canonicalRecords.length,

      canonicalUnresolved,

      canonicalAmbiguous,

      databaseUniqueGids:
        databaseGids.size,

      unmatchedDatabaseGids:
        unmatchedDatabaseGids.length,

      missingDatabaseGids:
        missingDatabaseGids.length,
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
    },

    completedRepairs: [
      {
        sourceId: 392,
        sourceName:
          "Muranga South Sub County",
        targetId: 1393,
        targetName:
          "Murang'a South",
      },
      {
        sourceId: 353,
        sourceName:
          "Samburu Central Sub County",
        targetId: 1422,
        targetName:
          "Samburu Central",
      },
    ],

    structuralChecks: {
      authoritativeFeatures:
        features.length ===
        1450,

      authoritativeGids:
        authoritative.size ===
        1450,

      canonicalRecords:
        canonicalRecords.length ===
        330,

      canonicalUnresolved:
        canonicalUnresolved ===
        0,

      canonicalAmbiguous:
        canonicalAmbiguous ===
        0,

      duplicateDatabaseGids:
        duplicateDatabaseGids.size ===
        0,

      unmatchedDatabaseGids:
        unmatchedDatabaseGids.length ===
        0,

      missingDatabaseGids:
        missingDatabaseGids.length ===
        0,

      missingCandidateWardIds:
        missingWardIds.length ===
        0,

      extraCandidateWardIds:
        extraWardIds.length ===
        0,

      duplicateTargetIds:
        duplicateTargets.length ===
        0,
    },

    safeCandidates:
      safe,

    blockedCandidates:
      blocked,

    alreadyCanonical,

    manualReview:
      manual,

    duplicateTargets:
      duplicateTargets.map(
        ([
          targetId,
          records,
        ]) => ({
          targetId,

          records:
            records.map(
              (record) => ({
                sourceId:
                  record.sourceId,

                sourceName:
                  record.sourceName,

                targetId:
                  record.targetId,

                targetName:
                  record.targetName,

                sourceGids:
                  record.sourceGids,

                wardCount:
                  record.wardCount,
              }),
            ),
        }),
      ),

    missingCandidateWardIds:
      missingWardIds,

    extraCandidateWardIds:
      extraWardIds,

    unmatchedDatabaseGids,

    missingDatabaseGids,

    duplicateDatabaseGids: [
      ...duplicateDatabaseGids,
    ],
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

  // ==========================================================
  // 24. WRITE CSV
  // ==========================================================

  const csvHeader = [
    "county",
    "countyId",
    "sourceId",
    "sourceName",
    "targetId",
    "targetName",
    "wardCount",
    "wardIds",
    "sourceGids",
    "authoritativeScuids",
    "authoritativeSubCounties",
    "unresolvedWards",
    "farmers",
    "farms",
    "businessPartners",
    "sourceTransactions",
    "destinationTransactions",
    "targetWardCount",
    "status",
    "reason",
  ];

  const csvRows: string[][] = [
    csvHeader,
  ];

  for (
    const candidate of
      candidates
  ) {
    csvRows.push([
      candidate.county,

      String(
        candidate.countyId,
      ),

      String(
        candidate.sourceId,
      ),

      candidate.sourceName,

      candidate.targetId ===
      null
        ? ""
        : String(
            candidate.targetId,
          ),

      candidate.targetName ??
        "",

      String(
        candidate.wardCount,
      ),

      candidate.wardIds.join(
        "|",
      ),

      candidate.sourceGids.join(
        "|",
      ),

      candidate.authoritativeScuids.join(
        "|",
      ),

      candidate.authoritativeSubCounties.join(
        "|",
      ),

      String(
        candidate.unresolvedWards,
      ),

      String(
        candidate.directRelations
          .farmers,
      ),

      String(
        candidate.directRelations
          .farms,
      ),

      String(
        candidate.directRelations
          .businessPartners,
      ),

      String(
        candidate.directRelations
          .sourceTransactions,
      ),

      String(
        candidate.directRelations
          .destinationTransactions,
      ),

      candidate.targetWardCount ===
      null
        ? ""
        : String(
            candidate.targetWardCount,
          ),

      candidate.status,

      candidate.reason,
    ]);
  }

  function csvEscape(
    value: string,
  ): string {
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
  }

  const csvText =
    csvRows
      .map(
        (row) =>
          row
            .map(
              csvEscape,
            )
            .join(","),
      )
      .join("\n");

  fs.writeFileSync(
    OUTPUT_CSV,
    csvText,
    "utf8",
  );

  // ==========================================================
  // 25. FINISH
  // ==========================================================

  console.log(
    "============================================================",
  );

  console.log(
    "OUTPUT FILES",
  );

  console.log(
    OUTPUT_JSON,
  );

  console.log(
    OUTPUT_CSV,
  );

  console.log("");

  console.log(
    "NO DATABASE CHANGES WERE MADE.",
  );

  console.log(
    "============================================================",
  );
}

main()
  .catch(
    (error) => {
      console.error("");

      console.error(
        "V12 AUDIT FAILED",
      );

      console.error(
        error instanceof Error
          ? error.message
          : error,
      );

      process.exitCode = 1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );