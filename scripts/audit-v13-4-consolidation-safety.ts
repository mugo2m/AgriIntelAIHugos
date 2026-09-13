import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

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

const DATA_DIR = path.join(process.cwd(), "prisma", "data");

const INPUT_JSON = path.join(
  DATA_DIR,
  "final-reconciliation-v13-3.json"
);

const OUTPUT_JSON = path.join(
  DATA_DIR,
  "consolidation-safety-v13-4.json"
);

const OUTPUT_CSV = path.join(
  DATA_DIR,
  "consolidation-safety-v13-4.csv"
);

type Candidate = {
  countyId: number;
  countyName: string;
  normalizedName: string;

  canonicalPrismaSubcountyId: number;
  canonicalPrismaSubcountyName: string;
  canonicalWardCount: number;

  duplicatePrismaSubcountyId: number;
  duplicatePrismaSubcountyName: string;
  duplicateWardCount: number;

  status: string;
};

type SafetyRecord = {
  countyId: number;
  countyName: string;
  normalizedName: string;

  oldSubCountyId: number;
  oldSubCountyName: string;

  targetSubCountyId: number;
  targetSubCountyName: string;

  sameCounty: boolean;
  sameNormalizedIdentity: boolean;

  oldWardCount: number;
  targetWardCount: number;

  oldWardIds: number[];
  oldWardGids: number[];

  farmersCount: number;
  farmsCount: number;
  businessPartnersCount: number;

  wardCountyMismatchCount: number;
  wardSubCountyMismatchCount: number;

  hasDependencies: boolean;
  hasWardProblems: boolean;

  action:
    | "SAFE_TO_MIGRATE"
    | "REVIEW_REQUIRED"
    | "PROTECTED"
    | "DO_NOT_TOUCH";

  reason: string;
};

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function escapeCsv(value: unknown): string {
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
}

function loadCandidates(): Candidate[] {
  if (!fs.existsSync(INPUT_JSON)) {
    throw new Error(
      `V13.3 output not found:\n${INPUT_JSON}`
    );
  }

  const raw = JSON.parse(
    fs.readFileSync(INPUT_JSON, "utf8")
  );

  if (!Array.isArray(raw.safeConsolidationCandidates)) {
    throw new Error(
      "safeConsolidationCandidates was not found in V13.3 output."
    );
  }

  return raw.safeConsolidationCandidates;
}

async function main() {
  console.log("============================================================");
  console.log("V13.4 CONSOLIDATION SAFETY AUDIT");
  console.log("READ-ONLY — NO DATABASE MODIFICATIONS");
  console.log("============================================================");
  console.log();

  const candidates = loadCandidates();

  console.log(
    `V13.3 consolidation candidates loaded: ${candidates.length}`
  );
  console.log();

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

  const subcounties = await prisma.subCounty.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      _count: {
        select: {
          wards: true,
          farmers: true,
          farms: true,
          businessPartners: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const wards = await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      sourceGid: true,
      subCountyId: true,
      countyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const countyMap = new Map(
    counties.map((county) => [
      county.id,
      county,
    ])
  );

  const subcountyMap = new Map(
    subcounties.map((subcounty) => [
      subcounty.id,
      subcounty,
    ])
  );

  const wardsBySubcounty = new Map<
    number,
    typeof wards
  >();

  for (const ward of wards) {
    if (ward.subCountyId === null) {
      continue;
    }

    const existing =
      wardsBySubcounty.get(ward.subCountyId) ?? [];

    existing.push(ward);

    wardsBySubcounty.set(
      ward.subCountyId,
      existing
    );
  }

  const results: SafetyRecord[] = [];

  let safeToMigrate = 0;
  let reviewRequired = 0;
  let protectedCount = 0;
  let doNotTouch = 0;

  for (const candidate of candidates) {
    /*
     * IMPORTANT:
     *
     * V13.3 naming is:
     *
     * canonicalPrismaSubcountyId
     *     = OLD populated record
     *
     * duplicatePrismaSubcountyId
     *     = NEW empty canonical target
     *
     * Therefore migration direction is:
     *
     * OLD -> TARGET
     */

    const oldId =
      Number(candidate.canonicalPrismaSubcountyId);

    const targetId =
      Number(candidate.duplicatePrismaSubcountyId);

    const oldSubCounty =
      subcountyMap.get(oldId);

    const targetSubCounty =
      subcountyMap.get(targetId);

    const county =
      countyMap.get(candidate.countyId);

    const oldWards =
      wardsBySubcounty.get(oldId) ?? [];

    const targetWards =
      wardsBySubcounty.get(targetId) ?? [];

    const oldWardIds =
      uniqueNumbers(
        oldWards.map((ward) => ward.id)
      );

    const oldWardGids =
      uniqueNumbers(
        oldWards
          .map((ward) =>
            ward.sourceGid === null
              ? null
              : Number(ward.sourceGid)
          )
          .filter(
            (gid): gid is number =>
              gid !== null
          )
      );

    const sameCounty =
      !!oldSubCounty &&
      !!targetSubCounty &&
      oldSubCounty.countyId ===
        targetSubCounty.countyId;

    const sameNormalizedIdentity =
      !!oldSubCounty &&
      !!targetSubCounty &&
      normalizeName(oldSubCounty.name) ===
        normalizeName(targetSubCounty.name);

    const farmersCount =
      oldSubCounty?._count.farmers ?? 0;

    const farmsCount =
      oldSubCounty?._count.farms ?? 0;

    const businessPartnersCount =
      oldSubCounty?._count.businessPartners ?? 0;

    const wardCountyMismatchCount =
      oldWards.filter(
        (ward) =>
          oldSubCounty &&
          ward.countyId !==
            oldSubCounty.countyId
      ).length;

    const wardSubCountyMismatchCount =
      oldWards.filter(
        (ward) =>
          ward.subCountyId !== oldId
      ).length;

    const hasDependencies =
      farmersCount > 0 ||
      farmsCount > 0 ||
      businessPartnersCount > 0;

    const hasWardProblems =
      wardCountyMismatchCount > 0 ||
      wardSubCountyMismatchCount > 0;

    let action:
      | "SAFE_TO_MIGRATE"
      | "REVIEW_REQUIRED"
      | "PROTECTED"
      | "DO_NOT_TOUCH";

    let reason: string;

    if (!oldSubCounty || !targetSubCounty) {
      action = "DO_NOT_TOUCH";

      reason =
        "Old or target Prisma SubCounty record could not be resolved.";

      doNotTouch++;
    } else if (
      oldSubCounty.id === targetSubCounty.id
    ) {
      action = "DO_NOT_TOUCH";

      reason =
        "Old and target SubCounty IDs are identical.";

      doNotTouch++;
    } else if (!sameCounty) {
      action = "DO_NOT_TOUCH";

      reason =
        "Old and target SubCounty records belong to different counties.";

      doNotTouch++;
    } else if (!sameNormalizedIdentity) {
      action = "REVIEW_REQUIRED";

      reason =
        "Old and target records do not have the same normalized identity.";

      reviewRequired++;
    } else if (hasWardProblems) {
      action = "REVIEW_REQUIRED";

      reason =
        "Existing wards attached to the old SubCounty contain ownership inconsistencies.";

      reviewRequired++;
    } else if (targetWards.length > 0) {
      action = "REVIEW_REQUIRED";

      reason =
        "Target SubCounty already owns wards. Automatic consolidation could create conflicting ward ownership.";

      reviewRequired++;
    } else if (hasDependencies) {
      action = "REVIEW_REQUIRED";

      reason =
        "Old SubCounty has farmers, farms, or business partners. These dependencies must be migrated before deletion.";

      reviewRequired++;
    } else if (oldWards.length > 0) {
      action = "SAFE_TO_MIGRATE";

      reason =
        "Same county and identity; old record owns wards, target is empty, and no dependent application records are attached.";

      safeToMigrate++;
    } else {
      action = "PROTECTED";

      reason =
        "Old record has no wards or dependent records. No migration is required.";

      protectedCount++;
    }

    results.push({
      countyId:
        candidate.countyId,

      countyName:
        county?.name ??
        candidate.countyName,

      normalizedName:
        candidate.normalizedName,

      oldSubCountyId:
        oldId,

      oldSubCountyName:
        oldSubCounty?.name ??
        candidate.canonicalPrismaSubcountyName,

      targetSubCountyId:
        targetId,

      targetSubCountyName:
        targetSubCounty?.name ??
        candidate.duplicatePrismaSubcountyName,

      sameCounty,

      sameNormalizedIdentity,

      oldWardCount:
        oldWards.length,

      targetWardCount:
        targetWards.length,

      oldWardIds,

      oldWardGids,

      farmersCount,

      farmsCount,

      businessPartnersCount,

      wardCountyMismatchCount,

      wardSubCountyMismatchCount,

      hasDependencies,

      hasWardProblems,

      action,

      reason,
    });
  }

  results.sort((a, b) => {
    const countyCompare =
      a.countyName.localeCompare(
        b.countyName
      );

    if (countyCompare !== 0) {
      return countyCompare;
    }

    return (
      a.oldSubCountyId -
      b.oldSubCountyId
    );
  });

  const summary = {
    audit: "V13.4",

    mode: "READ_ONLY",

    generatedAt:
      new Date().toISOString(),

    inputCandidates:
      candidates.length,

    databaseCounts: {
      counties:
        counties.length,

      subcounties:
        subcounties.length,

      wards:
        wards.length,
    },

    resultCounts: {
      safeToMigrate,

      reviewRequired,

      protected:
        protectedCount,

      doNotTouch,
    },

    totals: {
      oldWards:
        results.reduce(
          (sum, row) =>
            sum + row.oldWardCount,
          0
        ),

      farmers:
        results.reduce(
          (sum, row) =>
            sum + row.farmersCount,
          0
        ),

      farms:
        results.reduce(
          (sum, row) =>
            sum + row.farmsCount,
          0
        ),

      businessPartners:
        results.reduce(
          (sum, row) =>
            sum +
            row.businessPartnersCount,
          0
        ),

      wardCountyMismatches:
        results.reduce(
          (sum, row) =>
            sum +
            row.wardCountyMismatchCount,
          0
        ),

      wardSubCountyMismatches:
        results.reduce(
          (sum, row) =>
            sum +
            row.wardSubCountyMismatchCount,
          0
        ),
    },

    results,
  };

  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(
      summary,
      null,
      2
    ),
    "utf8"
  );

  const headers = [
    "countyId",
    "countyName",
    "normalizedName",
    "oldSubCountyId",
    "oldSubCountyName",
    "targetSubCountyId",
    "targetSubCountyName",
    "sameCounty",
    "sameNormalizedIdentity",
    "oldWardCount",
    "targetWardCount",
    "oldWardGids",
    "oldWardIds",
    "farmersCount",
    "farmsCount",
    "businessPartnersCount",
    "wardCountyMismatchCount",
    "wardSubCountyMismatchCount",
    "hasDependencies",
    "hasWardProblems",
    "action",
    "reason",
  ];

  const csvLines = [
    headers.join(","),

    ...results.map((row) =>
      [
        row.countyId,
        row.countyName,
        row.normalizedName,
        row.oldSubCountyId,
        row.oldSubCountyName,
        row.targetSubCountyId,
        row.targetSubCountyName,
        row.sameCounty,
        row.sameNormalizedIdentity,
        row.oldWardCount,
        row.targetWardCount,
        row.oldWardGids.join("|"),
        row.oldWardIds.join("|"),
        row.farmersCount,
        row.farmsCount,
        row.businessPartnersCount,
        row.wardCountyMismatchCount,
        row.wardSubCountyMismatchCount,
        row.hasDependencies,
        row.hasWardProblems,
        row.action,
        row.reason,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ];

  fs.writeFileSync(
    OUTPUT_CSV,
    csvLines.join("\n"),
    "utf8"
  );

  console.log("------------------------------------------------------------");
  console.log("V13.4 SAFETY RESULT");
  console.log("------------------------------------------------------------");

  console.log(
    `Candidates inspected: ${candidates.length}`
  );

  console.log(
    `SAFE_TO_MIGRATE: ${safeToMigrate}`
  );

  console.log(
    `REVIEW_REQUIRED: ${reviewRequired}`
  );

  console.log(
    `PROTECTED: ${protectedCount}`
  );

  console.log(
    `DO_NOT_TOUCH: ${doNotTouch}`
  );

  console.log();
  console.log("------------------------------------------------------------");
  console.log("DEPENDENCY SUMMARY");
  console.log("------------------------------------------------------------");

  console.log(
    `Old-record wards: ${summary.totals.oldWards}`
  );

  console.log(
    `Farmers attached to old records: ${summary.totals.farmers}`
  );

  console.log(
    `Farms attached to old records: ${summary.totals.farms}`
  );

  console.log(
    `Business partners attached to old records: ${summary.totals.businessPartners}`
  );

  console.log(
    `Ward county mismatches: ${summary.totals.wardCountyMismatches}`
  );

  console.log(
    `Ward SubCounty mismatches: ${summary.totals.wardSubCountyMismatches}`
  );

  console.log();
  console.log("------------------------------------------------------------");
  console.log("SAFE-TO-MIGRATE");
  console.log("------------------------------------------------------------");

  for (const row of results.filter(
    (row) =>
      row.action ===
      "SAFE_TO_MIGRATE"
  )) {
    console.log(
      `${row.countyName} | ` +
      `${row.oldSubCountyId} ${row.oldSubCountyName} -> ` +
      `${row.targetSubCountyId} ${row.targetSubCountyName} | ` +
      `wards=${row.oldWardCount} | ` +
      `GIDs=${row.oldWardGids.join(",")}`
    );
  }

  console.log();
  console.log("------------------------------------------------------------");
  console.log("REVIEW REQUIRED");
  console.log("------------------------------------------------------------");

  for (const row of results.filter(
    (row) =>
      row.action ===
      "REVIEW_REQUIRED"
  )) {
    console.log(
      `${row.countyName} | ` +
      `${row.oldSubCountyId} ${row.oldSubCountyName} -> ` +
      `${row.targetSubCountyId} ${row.targetSubCountyName} | ` +
      `wards=${row.oldWardCount} | ` +
      `targetWards=${row.targetWardCount} | ` +
      `farmers=${row.farmersCount} | ` +
      `farms=${row.farmsCount} | ` +
      `partners=${row.businessPartnersCount} | ` +
      `${row.reason}`
    );
  }

  console.log();
  console.log("------------------------------------------------------------");
  console.log("OUTPUT FILES");
  console.log("------------------------------------------------------------");

  console.log(
    `JSON: ${path.relative(
      process.cwd(),
      OUTPUT_JSON
    )}`
  );

  console.log(
    `CSV: ${path.relative(
      process.cwd(),
      OUTPUT_CSV
    )}`
  );

  console.log();
  console.log("============================================================");
  console.log("V13.4 COMPLETE.");
  console.log("READ-ONLY — NO DATABASE MODIFICATIONS.");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error();
    console.error("V13.4 FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });