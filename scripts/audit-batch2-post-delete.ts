import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

type GeoFeature = {
  properties?: {
    county?: string;
    subcounty?: string;
    ward?: string;
    cuid?: number | string;
    scuid?: number | string;
    uid?: number | string;
  };
};

type GeoJson = {
  type: string;
  features: GeoFeature[];
};

const DELETED_IDS = [
  1370,
  1371,
  1373,
  1374,
  1375,
  1302,
  1303,
  1304,
  1305,
  1308,
  1312,
  1313,
  1319,
  1320,
  1484,
  1485,
  1486,
  1487,
  1572,
  1573,
  1580,
] as const;

const TARGET_COUNTIES = [
  { id: 67, name: "Nyandarua" },
  { id: 64, name: "Marsabit" },
  { id: 65, name: "Meru" },
  { id: 56, name: "Kericho" },
  { id: 79, name: "Nairobi City" },
] as const;

const FK_PATHS = [
  {
    table: "BusinessPartner",
    column: "subCountyId",
  },
  {
    table: "CommodityTransaction",
    column: "destinationSubCountyId",
  },
  {
    table: "CommodityTransaction",
    column: "sourceSubCountyId",
  },
  {
    table: "Farm",
    column: "subCountyId",
  },
  {
    table: "Farmer",
    column: "subCountyId",
  },
  {
    table: "Ward",
    column: "subCountyId",
  },
] as const;

/**
 * Generic geography normalization.
 *
 * Handles:
 * - Unicode normalization
 * - leading/trailing whitespace
 * - repeated spaces
 * - tabs
 * - non-breaking spaces
 * - Unicode whitespace
 * - curly/straight/backtick apostrophes
 * - apostrophe punctuation differences
 * - "Sub County" / "SubCounty"
 *
 * Examples:
 *
 * "Ruaraka  Sub County" -> "ruaraka"
 * "Ruaraka Sub County"  -> "ruaraka"
 * "Kinangop Sub County" -> "kinangop"
 * "Lang'ata"             -> "langata"
 * "Lang’ata"             -> "langata"
 * "Langata"              -> "langata"
 */
function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[\s\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/g, " ")
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * County-specific normalization.
 *
 * Nairobi may appear as:
 *
 *   Nairobi
 *   Nairobi City
 *   Nairobi City County
 *
 * These are treated as the same county for authoritative comparison.
 */
function normalizeCounty(value: unknown): string {
  let normalized = normalize(value);

  normalized = normalized
    .replace(/\bcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized === "nairobi city") {
    return "nairobi";
  }

  if (normalized === "nairobi") {
    return "nairobi";
  }

  return normalized;
}

function getGeoJsonPath(): string {
  return path.resolve(
    process.cwd(),
    "prisma",
    "data",
    "kenya-wards-1450.geojson",
  );
}

function fail(message: string): never {
  throw new Error(`AUDIT FAILURE: ${message}`);
}

async function main() {
  console.log("============================================================");
  console.log("BATCH 2 POST-DELETE AUTHORITATIVE AUDIT");
  console.log("============================================================");
  console.log();
  console.log("READ-ONLY AUDIT: NO DELETE / UPDATE / INSERT OPERATIONS");
  console.log();

  const geoPath = getGeoJsonPath();

  if (!fs.existsSync(geoPath)) {
    fail(`Authoritative GeoJSON not found: ${geoPath}`);
  }

  const raw = fs.readFileSync(geoPath, "utf8");
  const geo = JSON.parse(raw) as GeoJson;

  if (!Array.isArray(geo.features)) {
    fail("GeoJSON features array is missing.");
  }

  console.log(`Authoritative GeoJSON: ${geoPath}`);
  console.log(`GeoJSON features: ${geo.features.length}`);

  if (geo.features.length !== 1450) {
    fail(
      `Expected exactly 1450 authoritative ward features, found ${geo.features.length}.`,
    );
  }

  const authoritative = new Map<
    string,
    {
      countyName: string;
      subCountyName: string;
      wards: Set<string>;
    }
  >();

  for (const feature of geo.features) {
    const p = feature.properties ?? {};

    const countyName = String(p.county ?? "").trim();
    const subCountyName = String(p.subcounty ?? "").trim();
    const wardName = String(p.ward ?? "").trim();

    if (!countyName || !subCountyName || !wardName) {
      fail(
        `GeoJSON contains incomplete geography record: county="${countyName}", subcounty="${subCountyName}", ward="${wardName}"`,
      );
    }

    const key = `${normalizeCounty(countyName)}|||${normalize(subCountyName)}`;

    let entry = authoritative.get(key);

    if (!entry) {
      entry = {
        countyName,
        subCountyName,
        wards: new Set<string>(),
      };

      authoritative.set(key, entry);
    }

    entry.wards.add(normalize(wardName));
  }

  console.log(
    `Authoritative county/subcounty index entries: ${authoritative.size}`,
  );
  console.log();

  // ------------------------------------------------------------
  // STEP 1
  // ------------------------------------------------------------

  console.log("STEP 1: VERIFY DELETED IDS ARE ABSENT");

  const deletedStillPresent = await prisma.subCounty.findMany({
    where: {
      id: {
        in: [...DELETED_IDS],
      },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (deletedStillPresent.length !== 0) {
    console.log(deletedStillPresent);

    fail(
      `${deletedStillPresent.length} deleted SubCounty IDs are still present.`,
    );
  }

  console.log(`Deleted IDs checked: ${DELETED_IDS.length}`);
  console.log("Deleted IDs still present: 0");
  console.log("PASS");
  console.log();

  // ------------------------------------------------------------
  // STEP 2
  // ------------------------------------------------------------

  console.log("STEP 2: VERIFY TARGET COUNTIES");

  const targetCountyIds = TARGET_COUNTIES.map((county) => county.id);

  const counties = await prisma.county.findMany({
    where: {
      id: {
        in: targetCountyIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (counties.length !== TARGET_COUNTIES.length) {
    console.log("Expected counties:", TARGET_COUNTIES);
    console.log("Found counties:", counties);

    fail(
      `Expected ${TARGET_COUNTIES.length} target counties, found ${counties.length}.`,
    );
  }

  for (const expected of TARGET_COUNTIES) {
    const actual = counties.find((county) => county.id === expected.id);

    if (!actual) {
      fail(`County ${expected.id} (${expected.name}) is missing.`);
    }

    if (normalizeCounty(actual.name) !== normalizeCounty(expected.name)) {
      fail(
        `County identity mismatch for ID ${expected.id}: expected "${expected.name}", found "${actual.name}".`,
      );
    }

    console.log(`  ${actual.id} ${actual.name} — PASS`);
  }

  console.log("Target counties: PASS");
  console.log();

  // ------------------------------------------------------------
  // STEP 3
  // ------------------------------------------------------------

  console.log("STEP 3: VERIFY SURVIVING SUBCOUNTIES");

  const survivors = await prisma.subCounty.findMany({
    where: {
      countyId: {
        in: targetCountyIds,
      },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      _count: {
        select: {
          wards: true,
        },
      },
    },
    orderBy: [
      {
        countyId: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  const countyNameById = new Map(
    counties.map((county) => [county.id, county.name]),
  );

  const grouped = new Map<
    number,
    {
      countyName: string;
      subCounties: typeof survivors;
    }
  >();

  for (const county of TARGET_COUNTIES) {
    grouped.set(county.id, {
      countyName: county.name,
      subCounties: [],
    });
  }

  for (const survivor of survivors) {
    const group = grouped.get(survivor.countyId);

    if (!group) {
      fail(
        `Surviving SubCounty ${survivor.id} belongs to unexpected county ${survivor.countyId}.`,
      );
    }

    group.subCounties.push(survivor);
  }

  let totalSurvivors = 0;

  for (const county of TARGET_COUNTIES) {
    const group = grouped.get(county.id)!;

    console.log();
    console.log(`${group.countyName} (County ${county.id})`);

    if (group.subCounties.length === 0) {
      fail(
        `County ${county.id} (${county.name}) has no surviving SubCounties.`,
      );
    }

    for (const subCounty of group.subCounties) {
      const dbCountyName = countyNameById.get(subCounty.countyId);

      if (!dbCountyName) {
        fail(
          `Cannot resolve county name for SubCounty ${subCounty.id}.`,
        );
      }

      const normalizedCounty = normalizeCounty(dbCountyName);
      const normalizedSubCounty = normalize(subCounty.name);

      const key = `${normalizedCounty}|||${normalizedSubCounty}`;

      const auth = authoritative.get(key);

      if (!auth) {
        console.log();
        console.log("AUTHORITATIVE MATCH DEBUG");
        console.log(`  DB SubCounty ID: ${subCounty.id}`);
        console.log(`  DB SubCounty name: "${subCounty.name}"`);
        console.log(`  DB normalized name: "${normalizedSubCounty}"`);
        console.log(`  DB County name: "${dbCountyName}"`);
        console.log(`  DB normalized county: "${normalizedCounty}"`);
        console.log(`  Lookup key: "${key}"`);
        console.log();

        fail(
          `Surviving SubCounty ${subCounty.id} "${subCounty.name}" in "${dbCountyName}" has NO authoritative GeoJSON match.`,
        );
      }

      const dbWardCount = subCounty._count.wards;
      const authoritativeWardCount = auth.wards.size;

      if (dbWardCount !== authoritativeWardCount) {
        fail(
          `Ward count mismatch for ${subCounty.id} ${subCounty.name}: DB=${dbWardCount}, authoritative=${authoritativeWardCount}.`,
        );
      }

      if (dbWardCount === 0) {
        fail(
          `Surviving SubCounty ${subCounty.id} ${subCounty.name} has zero wards.`,
        );
      }

      console.log(
        `  ${subCounty.id} ${subCounty.name} — ${dbWardCount} wards — authoritative MATCH`,
      );

      totalSurvivors++;
    }

    console.log(
      `  County SubCounties: ${group.subCounties.length}`,
    );
  }

  console.log();
  console.log(`Total surviving SubCounties: ${totalSurvivors}`);

  if (totalSurvivors !== 41) {
    fail(
      `Expected 41 surviving SubCounties across Batch 2 counties, found ${totalSurvivors}.`,
    );
  }

  console.log("Surviving SubCounty audit: PASS");
  console.log();

  // ------------------------------------------------------------
  // STEP 4
  // ------------------------------------------------------------

  console.log("STEP 4: VERIFY AUTHORITATIVE WARD TOTALS");

  let totalDbWards = 0;
  let totalAuthoritativeWards = 0;

  for (const county of TARGET_COUNTIES) {
    const group = grouped.get(county.id)!;

    let countyDbWards = 0;
    let countyAuthoritativeWards = 0;

    for (const subCounty of group.subCounties) {
      const key = `${normalizeCounty(group.countyName)}|||${normalize(subCounty.name)}`;

      const auth = authoritative.get(key);

      if (!auth) {
        fail(
          `Missing authoritative entry while calculating ward totals for ${group.countyName} / ${subCounty.name}.`,
        );
      }

      countyDbWards += subCounty._count.wards;
      countyAuthoritativeWards += auth.wards.size;
    }

    console.log(
      `  ${group.countyName}: DB wards=${countyDbWards}, authoritative wards=${countyAuthoritativeWards}`,
    );

    if (countyDbWards !== countyAuthoritativeWards) {
      fail(
        `County ward total mismatch for ${group.countyName}.`,
      );
    }

    totalDbWards += countyDbWards;
    totalAuthoritativeWards += countyAuthoritativeWards;
  }

  console.log();
  console.log(`Total DB wards: ${totalDbWards}`);
  console.log(`Total authoritative wards: ${totalAuthoritativeWards}`);

  if (totalDbWards !== totalAuthoritativeWards) {
    fail(
      `Overall ward total mismatch: DB=${totalDbWards}, authoritative=${totalAuthoritativeWards}.`,
    );
  }

  console.log("Ward totals: PASS");
  console.log();

  // ------------------------------------------------------------
  // STEP 5
  // ------------------------------------------------------------

  console.log("STEP 5: VERIFY ALL SIX SUBCOUNTY FK PATHS");

  let totalFkRefs = 0;

  for (const fk of FK_PATHS) {
    let count = 0;

    if (fk.table === "BusinessPartner") {
      count = await prisma.businessPartner.count({
        where: {
          subCountyId: {
            in: [...DELETED_IDS],
          },
        },
      });
    }

    if (fk.table === "CommodityTransaction") {
      if (fk.column === "destinationSubCountyId") {
        count = await prisma.commodityTransaction.count({
          where: {
            destinationSubCountyId: {
              in: [...DELETED_IDS],
            },
          },
        });
      }

      if (fk.column === "sourceSubCountyId") {
        count = await prisma.commodityTransaction.count({
          where: {
            sourceSubCountyId: {
              in: [...DELETED_IDS],
            },
          },
        });
      }
    }

    if (fk.table === "Farm") {
      count = await prisma.farm.count({
        where: {
          subCountyId: {
            in: [...DELETED_IDS],
          },
        },
      });
    }

    if (fk.table === "Farmer") {
      count = await prisma.farmer.count({
        where: {
          subCountyId: {
            in: [...DELETED_IDS],
          },
        },
      });
    }

    if (fk.table === "Ward") {
      count = await prisma.ward.count({
        where: {
          subCountyId: {
            in: [...DELETED_IDS],
          },
        },
      });
    }

    console.log(`  ${fk.table}.${fk.column}: ${count}`);

    if (count !== 0) {
      fail(
        `Deleted SubCounty IDs still have ${count} references in ${fk.table}.${fk.column}.`,
      );
    }

    totalFkRefs += count;
  }

  console.log(`Total FK references to deleted IDs: ${totalFkRefs}`);

  if (totalFkRefs !== 0) {
    fail("Foreign-key reference audit failed.");
  }

  console.log("All six FK paths: PASS");
  console.log();

  // ------------------------------------------------------------
  // STEP 6
  // ------------------------------------------------------------

  console.log("STEP 6: VERIFY NO DELETED IDS REDISCOVERED");

  const wardRediscovery = await prisma.ward.findMany({
    where: {
      subCountyId: {
        in: [...DELETED_IDS],
      },
    },
    select: {
      id: true,
      name: true,
      subCountyId: true,
    },
    take: 10,
  });

  if (wardRediscovery.length !== 0) {
    console.log(wardRediscovery);

    fail(
      "Deleted SubCounty IDs were rediscovered through Ward references.",
    );
  }

  console.log("Ward rediscovery records: 0");
  console.log("PASS");
  console.log();

  // ------------------------------------------------------------
  // STEP 7
  // ------------------------------------------------------------

  console.log("STEP 7: FINAL AGGREGATE CHECKS");

  const deletedCount = await prisma.subCounty.count({
    where: {
      id: {
        in: [...DELETED_IDS],
      },
    },
  });

  const targetSubCountyCount = await prisma.subCounty.count({
    where: {
      countyId: {
        in: targetCountyIds,
      },
    },
  });

  if (deletedCount !== 0) {
    fail(
      `Final deleted-ID count is ${deletedCount}, expected 0.`,
    );
  }

  if (targetSubCountyCount !== 41) {
    fail(
      `Final target-county SubCounty count is ${targetSubCountyCount}, expected 41.`,
    );
  }

  console.log(
    `Deleted candidate records remaining: ${deletedCount}`,
  );

  console.log(
    `Target-county surviving SubCounties: ${targetSubCountyCount}`,
  );

  console.log(
    `Target-county surviving wards: ${totalDbWards}`,
  );

  console.log("PASS");
  console.log();

  // ------------------------------------------------------------
  // FINAL RESULT
  // ------------------------------------------------------------

  console.log("============================================================");
  console.log("BATCH 2 POST-DELETE AUTHORITATIVE AUDIT: PASS");
  console.log("============================================================");
  console.log();

  console.log("Batch 2 counties:");
  console.log("  67 Nyandarua");
  console.log("  64 Marsabit");
  console.log("  65 Meru");
  console.log("  56 Kericho");
  console.log("  79 Nairobi City");
  console.log();

  console.log("Deleted legacy SubCounties: 21");
  console.log(`Surviving SubCounties: ${totalSurvivors}`);
  console.log(
    `Surviving authoritative wards: ${totalAuthoritativeWards}`,
  );
  console.log("Deleted-ID references: 0");
  console.log();
  console.log("BATCH 2 IS READY TO BE CLOSED.");
}

main()
  .catch((error) => {
    console.error();
    console.error("============================================================");
    console.error("BATCH 2 POST-DELETE AUTHORITATIVE AUDIT: FAILED");
    console.error("============================================================");
    console.error();
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });