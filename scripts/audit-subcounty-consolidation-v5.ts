import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

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

type SubCountySeed = {
  code?: string;
  countyCode: string;
  name: string;
  headquarters?: string | null;
};

type GeoJsonFeature = {
  type: string;
  properties?: Record<string, unknown>;
  geometry?: unknown;
};

type GeoJson = {
  type: string;
  features: GeoJsonFeature[];
};

type CanonicalRecord = {
  countyId: number;
  countyName: string;
  countyCode: string;
  name: string;
  normalizedName: string;
  dbId: number | null;
  dbName: string | null;
  resolution: string;
};

type WardAuthority = {
  sourceGid: number;
  sourceUid: string | null;
  subCountyName: string;
};

type WardWithCounty = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
  subCountyId: number | null;
  subCountyName: string | null;
  sourceGid: number | null;
  sourceUid: string | null;
};

type MigrationCandidate = {
  sourceId: number;
  sourceName: string;
  countyId: number;
  countyName: string;
  targetId: number;
  targetName: string;
  wardCount: number;
  farmers: number;
  farms: number;
  businessPartners: number;
  destinationTransactions: number;
  sourceTransactions: number;
};

type ReviewRecord = {
  sourceId: number;
  sourceName: string;
  countyName: string;
  wardCount: number;
  farmers: number;
  farms: number;
  method: string;
  reason: string;
};

const SUBCOUNTY_FILE = path.resolve(
  process.cwd(),
  "prisma/data/subcounties.json",
);

const GEOJSON_FILE = path.resolve(
  process.cwd(),
  "prisma/data/kenya-wards-1450.geojson",
);

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

function cleanExactName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function getProperty(
  properties: Record<string, unknown>,
  names: string[],
): unknown {
  for (const name of names) {
    if (properties[name] !== undefined && properties[name] !== null) {
      return properties[name];
    }
  }

  const lowerMap = new Map<string, unknown>();

  for (const [key, value] of Object.entries(properties)) {
    lowerMap.set(key.toLowerCase(), value);
  }

  for (const name of names) {
    const value = lowerMap.get(name.toLowerCase());

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toStringValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value).trim() || null;
}

function loadSubCountySource(): SubCountySeed[] {
  if (!fs.existsSync(SUBCOUNTY_FILE)) {
    throw new Error(
      `Authoritative SubCounty file not found:\n${SUBCOUNTY_FILE}`,
    );
  }

  const raw = fs.readFileSync(SUBCOUNTY_FILE, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("subcounties.json is not an array.");
  }

  return parsed as SubCountySeed[];
}

function loadGeoJson(): GeoJson {
  if (!fs.existsSync(GEOJSON_FILE)) {
    throw new Error(
      `Authoritative ward GeoJSON not found:\n${GEOJSON_FILE}`,
    );
  }

  const raw = fs.readFileSync(GEOJSON_FILE, "utf8");
  const parsed = JSON.parse(raw) as GeoJson;

  if (!Array.isArray(parsed.features)) {
    throw new Error("GeoJSON does not contain a features array.");
  }

  return parsed;
}

function getAuthoritativeWard(feature: GeoJsonFeature): WardAuthority | null {
  const properties = feature.properties ?? {};

  const sourceGid = toNumber(
    getProperty(properties, [
      "gid",
      "GID",
      "sourceGid",
      "source_gid",
      "ward_gid",
    ]),
  );

  if (sourceGid === null) {
    return null;
  }

  const sourceUid = toStringValue(
    getProperty(properties, [
      "uid",
      "UID",
      "sourceUid",
      "source_uid",
      "ward_uid",
    ]),
  );

  const subCountyName = toStringValue(
    getProperty(properties, [
      "subcounty",
      "sub_county",
      "subcounty_name",
      "sub_county_name",
      "SubCounty",
      "Sub County",
      "SUBCOUNTY",
      "SUB_COUNTY",
    ]),
  );

  if (!subCountyName) {
    return null;
  }

  return {
    sourceGid,
    sourceUid,
    subCountyName: cleanExactName(subCountyName),
  };
}

async function main() {
  console.log("");
  console.log("============================================================================");
  console.log("SUBCOUNTY CONSOLIDATION AUDIT V5");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================================");
  console.log("");

  const authoritativeSubCounties = loadSubCountySource();
  const geoJson = loadGeoJson();

  const counties = await prisma.county.findMany({
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const dbSubCounties = await prisma.subCounty.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      _count: {
        select: {
          wards: true,
          farmers: true,
          farms: true,
          businessPartners: true,
          destinationTransactions: true,
          sourceTransactions: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const dbWards = await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          name: true,
        },
      },
      subCountyId: true,
      subCounty: {
        select: {
          name: true,
        },
      },
      sourceGid: true,
      sourceUid: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `Authoritative SubCounties: ${authoritativeSubCounties.length}`,
  );
  console.log(`Authoritative ward features: ${geoJson.features.length}`);
  console.log(`Database counties:         ${counties.length}`);
  console.log(`Database SubCounties:      ${dbSubCounties.length}`);
  console.log(`Database wards:            ${dbWards.length}`);
  console.log("");

  /*
   * --------------------------------------------------------------------------
   * STEP 1
   * Build the canonical DB SubCounty map directly from subcounties.json.
   *
   * IMPORTANT:
   * Exact canonical name always wins.
   * A legacy "Rongo Sub County" must NOT beat canonical "Rongo".
   * --------------------------------------------------------------------------
   */

  const dbByCounty = new Map<number, typeof dbSubCounties>();

  for (const record of dbSubCounties) {
    const list = dbByCounty.get(record.countyId) ?? [];
    list.push(record);
    dbByCounty.set(record.countyId, list);
  }

  const canonicalRecords: CanonicalRecord[] = [];
  const canonicalByCountyAndName = new Map<string, CanonicalRecord>();

  let canonicalResolved = 0;
  let canonicalUnresolved = 0;
  let canonicalAmbiguous = 0;

  for (const source of authoritativeSubCounties) {
    const county = counties.find(
      (item) => item.code === source.countyCode,
    );

    if (!county) {
      canonicalRecords.push({
        countyId: -1,
        countyName: "UNKNOWN",
        countyCode: source.countyCode,
        name: source.name,
        normalizedName: normalizeName(source.name),
        dbId: null,
        dbName: null,
        resolution: "COUNTY_NOT_FOUND",
      });

      canonicalUnresolved++;
      continue;
    }

    const records = dbByCounty.get(county.id) ?? [];

    const exactMatches = records.filter(
      (record) => cleanExactName(record.name) === cleanExactName(source.name),
    );

    let target:
      | (typeof dbSubCounties)[number]
      | null = null;

    let resolution = "";

    if (exactMatches.length === 1) {
      target = exactMatches[0];
      resolution = "EXACT_CANONICAL_NAME";
    } else if (exactMatches.length > 1) {
      canonicalAmbiguous++;

      canonicalRecords.push({
        countyId: county.id,
        countyName: county.name,
        countyCode: source.countyCode,
        name: source.name,
        normalizedName: normalizeName(source.name),
        dbId: null,
        dbName: null,
        resolution: "MULTIPLE_EXACT_CANONICAL_NAMES",
      });

      continue;
    } else {
      const normalized = normalizeName(source.name);

      const normalizedMatches = records.filter(
        (record) => normalizeName(record.name) === normalized,
      );

      /*
       * If there are multiple normalized matches, prefer a record whose
       * database name does NOT contain "sub county".
       *
       * This is specifically what prevents:
   *     Rongo
   *     Rongo Sub County
       *
       * from becoming ambiguous.
       */
      const nonLegacyMatches = normalizedMatches.filter(
        (record) =>
          !/\bsub[\s-]*county\b/i.test(record.name) &&
          !/\bsubcounty\b/i.test(record.name),
      );

      if (nonLegacyMatches.length === 1) {
        target = nonLegacyMatches[0];
        resolution = "NORMALIZED_NON_LEGACY_CANONICAL_NAME";
      } else if (normalizedMatches.length === 1) {
        target = normalizedMatches[0];
        resolution = "NORMALIZED_UNIQUE";
      } else if (normalizedMatches.length > 1) {
        canonicalAmbiguous++;

        canonicalRecords.push({
          countyId: county.id,
          countyName: county.name,
          countyCode: source.countyCode,
          name: source.name,
          normalizedName: normalized,
          dbId: null,
          dbName: null,
          resolution: "MULTIPLE_NORMALIZED_MATCHES",
        });

        continue;
      }
    }

    if (!target) {
      canonicalUnresolved++;

      canonicalRecords.push({
        countyId: county.id,
        countyName: county.name,
        countyCode: source.countyCode,
        name: source.name,
        normalizedName: normalizeName(source.name),
        dbId: null,
        dbName: null,
        resolution: "DB_CANONICAL_RECORD_NOT_FOUND",
      });

      continue;
    }

    canonicalResolved++;

    const canonical: CanonicalRecord = {
      countyId: county.id,
      countyName: county.name,
      countyCode: source.countyCode,
      name: source.name,
      normalizedName: normalizeName(source.name),
      dbId: target.id,
      dbName: target.name,
      resolution,
    };

    canonicalRecords.push(canonical);

    const key = `${county.id}::${normalizeName(source.name)}`;

    canonicalByCountyAndName.set(key, canonical);
  }

  console.log("============================================================================");
  console.log("CANONICAL SOURCE → DATABASE RESOLUTION");
  console.log("============================================================================");
  console.log(
    `Authoritative records:       ${authoritativeSubCounties.length}`,
  );
  console.log(`Resolved canonical DB IDs:   ${canonicalResolved}`);
  console.log(`Unresolved canonical IDs:    ${canonicalUnresolved}`);
  console.log(`Ambiguous canonical IDs:     ${canonicalAmbiguous}`);
  console.log("");

  if (canonicalUnresolved > 0 || canonicalAmbiguous > 0) {
    console.log("CANONICAL RESOLUTION PROBLEMS");
    console.log("--------------------------------------------");

    for (const record of canonicalRecords) {
      if (
        record.dbId === null ||
        record.resolution === "MULTIPLE_NORMALIZED_MATCHES" ||
        record.resolution === "MULTIPLE_EXACT_CANONICAL_NAMES"
      ) {
        console.log(
          `${record.countyName} | ${record.name} | ${record.resolution}`,
        );

        const candidates =
          record.countyId >= 0
            ? dbByCounty.get(record.countyId) ?? []
            : [];

        const normalized = record.normalizedName;

        const matches = candidates.filter(
          (candidate) =>
            normalizeName(candidate.name) === normalized,
        );

        for (const candidate of matches) {
          console.log(
            `  DB ${candidate.id}: ${candidate.name} | wards=${candidate._count.wards}`,
          );
        }
      }
    }

    console.log("");
  }

  /*
   * --------------------------------------------------------------------------
   * STEP 2
   * Build authoritative ward GID → canonical SubCounty target.
   * --------------------------------------------------------------------------
   */

  const authoritativeByGid = new Map<number, WardAuthority>();

  for (const feature of geoJson.features) {
    const ward = getAuthoritativeWard(feature);

    if (!ward) {
      continue;
    }

    if (authoritativeByGid.has(ward.sourceGid)) {
      throw new Error(
        `Duplicate authoritative sourceGid detected: ${ward.sourceGid}`,
      );
    }

    authoritativeByGid.set(ward.sourceGid, ward);
  }

  console.log("============================================================================");
  console.log("WARD SOURCE IDENTITY");
  console.log("============================================================================");
  console.log(
    `Authoritative GID identities: ${authoritativeByGid.size}`,
  );

  let matchedGids = 0;
  let unmatchedGids = 0;

  for (const ward of dbWards) {
    if (
      ward.sourceGid !== null &&
      authoritativeByGid.has(ward.sourceGid)
    ) {
      matchedGids++;
    } else {
      unmatchedGids++;
    }
  }

  console.log(`Database wards matched by GID: ${matchedGids}`);
  console.log(`Database wards unmatched:      ${unmatchedGids}`);
  console.log("");

  /*
   * --------------------------------------------------------------------------
   * STEP 3
   * Resolve every database ward to the canonical SubCounty using:
   *
   * database Ward.sourceGid
   *          ↓
   * authoritative ward
   *          ↓
   * authoritative SubCounty name
   *          ↓
   * subcounties.json canonical record
   *          ↓
   * canonical DB SubCounty ID
   * --------------------------------------------------------------------------
   */

  const wardTarget = new Map<number, CanonicalRecord | null>();

  let wardTargetResolved = 0;
  let wardTargetUnresolved = 0;

  for (const ward of dbWards) {
    if (ward.sourceGid === null) {
      wardTarget.set(ward.id, null);
      wardTargetUnresolved++;
      continue;
    }

    const authoritative = authoritativeByGid.get(ward.sourceGid);

    if (!authoritative) {
      wardTarget.set(ward.id, null);
      wardTargetUnresolved++;
      continue;
    }

    const key = `${ward.countyId}::${normalizeName(
      authoritative.subCountyName,
    )}`;

    const target = canonicalByCountyAndName.get(key) ?? null;

    wardTarget.set(ward.id, target);

    if (target) {
      wardTargetResolved++;
    } else {
      wardTargetUnresolved++;
    }
  }

  console.log("============================================================================");
  console.log("WARD → CANONICAL SUBCOUNTY RESOLUTION");
  console.log("============================================================================");
  console.log(`Resolved ward targets:   ${wardTargetResolved}`);
  console.log(`Unresolved ward targets: ${wardTargetUnresolved}`);
  console.log("");

  /*
   * --------------------------------------------------------------------------
   * STEP 4
   * Group wards by their CURRENT database SubCounty.
   * --------------------------------------------------------------------------
   */

  const wardsBySubCounty = new Map<number, WardWithCounty[]>();

  for (const ward of dbWards) {
    if (ward.subCountyId === null) {
      continue;
    }

    const list = wardsBySubCounty.get(ward.subCountyId) ?? [];

    list.push({
      id: ward.id,
      name: ward.name,
      countyId: ward.countyId,
      countyName: ward.county.name,
      subCountyId: ward.subCountyId,
      subCountyName: ward.subCounty?.name ?? null,
      sourceGid: ward.sourceGid,
      sourceUid: ward.sourceUid,
    });

    wardsBySubCounty.set(ward.subCountyId, list);
  }

  const safeCandidates: MigrationCandidate[] = [];
  const blockedCandidates: MigrationCandidate[] = [];
  const reviewRecords: ReviewRecord[] = [];

  let alreadyCanonical = 0;

  for (const source of dbSubCounties) {
    if (source._count.wards === 0) {
      continue;
    }

    const wards = wardsBySubCounty.get(source.id) ?? [];

    const targets = wards
      .map((ward) => wardTarget.get(ward.id) ?? null)
      .filter((target): target is CanonicalRecord => target !== null);

    const unresolvedWardCount = wards.length - targets.length;

    const targetIds = [
      ...new Set(
        targets
          .map((target) => target.dbId)
          .filter((id): id is number => id !== null),
      ),
    ];

    const relationCounts = {
      sourceId: source.id,
      sourceName: source.name,
      countyId: source.countyId,
      countyName: source.county.name,
      targetId: targetIds.length === 1 ? targetIds[0] : -1,
      targetName:
        targetIds.length === 1
          ? targets.find((target) => target.dbId === targetIds[0])
              ?.dbName ?? "UNKNOWN"
          : "UNKNOWN",
      wardCount: source._count.wards,
      farmers: source._count.farmers,
      farms: source._count.farms,
      businessPartners: source._count.businessPartners,
      destinationTransactions: source._count.destinationTransactions,
      sourceTransactions: source._count.sourceTransactions,
    };

    if (unresolvedWardCount > 0) {
      reviewRecords.push({
        sourceId: source.id,
        sourceName: source.name,
        countyName: source.county.name,
        wardCount: source._count.wards,
        farmers: source._count.farmers,
        farms: source._count.farms,
        method: "UNRESOLVED_WARD_TARGET",
        reason: `${unresolvedWardCount} ward(s) could not be resolved to a canonical SubCounty.`,
      });

      continue;
    }

    if (targetIds.length === 0) {
      reviewRecords.push({
        sourceId: source.id,
        sourceName: source.name,
        countyName: source.county.name,
        wardCount: source._count.wards,
        farmers: source._count.farmers,
        farms: source._count.farms,
        method: "CANONICAL_TARGET_NOT_FOUND",
        reason:
          "No authoritative canonical target could be resolved for the wards.",
      });

      continue;
    }

    if (targetIds.length > 1) {
      reviewRecords.push({
        sourceId: source.id,
        sourceName: source.name,
        countyName: source.county.name,
        wardCount: source._count.wards,
        farmers: source._count.farmers,
        farms: source._count.farms,
        method: "MULTIPLE_AUTHORITATIVE_TARGETS",
        reason:
          `The wards resolve to multiple canonical SubCounty IDs: ${targetIds.join(", ")}.`,
      });

      continue;
    }

    const targetId = targetIds[0];

    const target = targets.find(
      (item) => item.dbId === targetId,
    );

    if (!target) {
      reviewRecords.push({
        sourceId: source.id,
        sourceName: source.name,
        countyName: source.county.name,
        wardCount: source._count.wards,
        farmers: source._count.farmers,
        farms: source._count.farms,
        method: "TARGET_LOOKUP_FAILURE",
        reason: `Target ID ${targetId} could not be resolved.`,
      });

      continue;
    }

    if (targetId === source.id) {
      alreadyCanonical++;
      continue;
    }

    const candidate: MigrationCandidate = {
      ...relationCounts,
      targetId,
      targetName: target.dbName ?? target.name,
    };

    const hasOtherRelations =
      candidate.farmers > 0 ||
      candidate.farms > 0 ||
      candidate.businessPartners > 0 ||
      candidate.destinationTransactions > 0 ||
      candidate.sourceTransactions > 0;

    if (hasOtherRelations) {
      blockedCandidates.push(candidate);
    } else {
      safeCandidates.push(candidate);
    }
  }

  /*
   * --------------------------------------------------------------------------
   * STEP 5
   * Safety accounting.
   * --------------------------------------------------------------------------
   */

  const candidateWardCount = safeCandidates.reduce(
    (sum, item) => sum + item.wardCount,
    0,
  );

  const blockedWardCount = blockedCandidates.reduce(
    (sum, item) => sum + item.wardCount,
    0,
  );

  const reviewWardCount = reviewRecords.reduce(
    (sum, item) => sum + item.wardCount,
    0,
  );

  const canonicalWardCount = dbSubCounties
    .filter((subCounty) => subCounty._count.wards > 0)
    .reduce((sum, source) => {
      if (source.id === 0) {
        return sum;
      }

      const isAlreadyCanonical = !safeCandidates.some(
        (candidate) => candidate.sourceId === source.id,
      ) &&
        !blockedCandidates.some(
          (candidate) => candidate.sourceId === source.id,
        ) &&
        !reviewRecords.some(
          (review) => review.sourceId === source.id,
        );

      return isAlreadyCanonical
        ? sum + source._count.wards
        : sum;
    }, 0);

  const accountedWardCount =
    candidateWardCount +
    blockedWardCount +
    reviewWardCount +
    canonicalWardCount;

  console.log("");
  console.log("============================================================================");
  console.log("CONSOLIDATION SUMMARY");
  console.log("============================================================================");
  console.log(
    `Populated SubCounties:              ${
      dbSubCounties.filter((item) => item._count.wards > 0).length
    }`,
  );
  console.log(
    `Resolved migration candidates:      ${safeCandidates.length}`,
  );
  console.log(
    `SAFE migration candidates:          ${safeCandidates.length}`,
  );
  console.log(
    `Blocked migration candidates:       ${blockedCandidates.length}`,
  );
  console.log(
    `Already canonical/populated:        ${alreadyCanonical}`,
  );
  console.log(
    `Requires manual review:             ${reviewRecords.length}`,
  );
  console.log(
    `Wards in safe migration candidates: ${candidateWardCount}`,
  );
  console.log(
    `Wards in blocked candidates:        ${blockedWardCount}`,
  );
  console.log(
    `Wards requiring review:             ${reviewWardCount}`,
  );
  console.log(
    `Wards accounted:                    ${accountedWardCount}`,
  );
  console.log("");

  console.log("============================================================================");
  console.log("SAFE MIGRATION CANDIDATES");
  console.log("============================================================================");

  if (safeCandidates.length === 0) {
    console.log("NONE");
  } else {
    for (const candidate of safeCandidates) {
      console.log("");
      console.log(
        `${candidate.countyName} | ${candidate.sourceId} ${candidate.sourceName}`,
      );
      console.log(
        `  TARGET: ${candidate.targetId} ${candidate.targetName}`,
      );
      console.log(`  Wards: ${candidate.wardCount}`);
      console.log(`  Farmers: ${candidate.farmers}`);
      console.log(`  Farms: ${candidate.farms}`);
      console.log(
        `  BusinessPartners: ${candidate.businessPartners}`,
      );
      console.log(
        `  DestinationTransactions: ${candidate.destinationTransactions}`,
      );
      console.log(
        `  SourceTransactions: ${candidate.sourceTransactions}`,
      );
      console.log(
        `  Resolution: AUTHORITATIVE_GID_TO_CANONICAL_JSON`,
      );
    }
  }

  console.log("");
  console.log("============================================================================");
  console.log("BLOCKED MIGRATION CANDIDATES");
  console.log("============================================================================");

  if (blockedCandidates.length === 0) {
    console.log("NONE");
  } else {
    for (const candidate of blockedCandidates) {
      console.log("");
      console.log(
        `${candidate.countyName} | ${candidate.sourceId} ${candidate.sourceName}`,
      );
      console.log(
        `  TARGET: ${candidate.targetId} ${candidate.targetName}`,
      );
      console.log(`  Wards: ${candidate.wardCount}`);
      console.log(`  Farmers: ${candidate.farmers}`);
      console.log(`  Farms: ${candidate.farms}`);
      console.log(
        `  BusinessPartners: ${candidate.businessPartners}`,
      );
      console.log(
        `  DestinationTransactions: ${candidate.destinationTransactions}`,
      );
      console.log(
        `  SourceTransactions: ${candidate.sourceTransactions}`,
      );
    }
  }

  console.log("");
  console.log("============================================================================");
  console.log("MANUAL REVIEW RECORDS");
  console.log("============================================================================");

  if (reviewRecords.length === 0) {
    console.log("NONE");
  } else {
    for (const review of reviewRecords) {
      console.log("");
      console.log(
        `${review.countyName} | ${review.sourceId} ${review.sourceName}`,
      );
      console.log(`  Wards: ${review.wardCount}`);
      console.log(`  Farmers: ${review.farmers}`);
      console.log(`  Farms: ${review.farms}`);
      console.log(`  Method: ${review.method}`);
      console.log(`  Reason: ${review.reason}`);
    }
  }

  console.log("");
  console.log("============================================================================");
  console.log("FINAL SAFETY CHECK");
  console.log("============================================================================");
  console.log(`Database wards:          ${dbWards.length}`);
  console.log(`Canonical wards:         ${canonicalWardCount}`);
  console.log(`Candidate wards:         ${candidateWardCount}`);
  console.log(`Blocked wards:           ${blockedWardCount}`);
  console.log(`Review wards:            ${reviewWardCount}`);
  console.log(`Accounted ward records:  ${accountedWardCount}`);
  console.log(`Unique DB sourceGids:    ${new Set(
    dbWards
      .map((ward) => ward.sourceGid)
      .filter((gid): gid is number => gid !== null),
  ).size}`);

  if (accountedWardCount !== dbWards.length) {
    console.log("");
    console.log("WARNING — ward accounting does not equal database ward count.");
    console.log("DO NOT MIGRATE ANYTHING.");
  } else {
    console.log("");
    console.log("PASS — all database wards are accounted for.");
  }

  console.log("");
  console.log("IMPORTANT: NO DATABASE CHANGES WERE MADE.");
  console.log("This audit is READ-ONLY.");
  console.log("============================================================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("AUDIT FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });