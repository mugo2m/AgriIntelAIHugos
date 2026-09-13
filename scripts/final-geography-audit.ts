import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

type GeoFeature = {
  type: string;
  properties: {
    gid: number | string;
    pop2009?: number | string | null;
    county: string;
    subcounty: string;
    ward: string;
    uid?: number | string | null;
    scuid?: number | string | null;
    cuid?: number | string | null;
  };
};

type DbSubCounty = {
  id: number;
  name: string;
  countyId: number;
  county: {
    id: number;
    name: string;
  };
  wards: Array<{
    id: number;
    name: string;
    countyId: number;
    subCountyId: number;
  }>;
};

type DbWard = {
  id: number;
  name: string;
  countyId: number;
  subCountyId: number;
  county: {
    id: number;
    name: string;
  };
  subCounty: {
    id: number;
    name: string;
    countyId: number;
  };
};

type DbCounty = {
  id: number;
  name: string;
};

const GEOJSON_PATH = path.join(
  process.cwd(),
  "prisma",
  "data",
  "kenya-wards-1450.geojson",
);

/*
 * ALL legacy SubCounty IDs deleted during the geography cleanup.
 *
 * Makueni:   8
 * Batch 1:   43
 * Batch 2:   21
 * Batch 3:   41
 *
 * TOTAL: 113
 */
const DELETED_SUBCOUNTY_IDS = [
  // ---------------------------------------------------------------------------
  // Batch 3 - 41
  // ---------------------------------------------------------------------------
  1352,
  1271,
  1272,
  1273,
  1277,
  1287,
  1289,
  1523,
  1296,
  1297,
  1299,
  1324,
  1325,
  1417,
  1262,
  1265,
  1387,
  1388,
  1389,
  1392,
  1425,
  1426,
  1403,
  1408,
  1409,
  1529,
  1261,
  1441,
  1443,
  1444,
  1328,
  1329,
  1330,
  463,
  1448,
  1453,
  1454,
  1458,
  1476,
  1481,
  1571,

  // ---------------------------------------------------------------------------
  // Makueni - 8
  // ---------------------------------------------------------------------------
  1360,
  1361,
  1362,
  1363,
  1365,
  1366,
  1367,
  1368,

  // ---------------------------------------------------------------------------
  // Batch 1 - 43
  // ---------------------------------------------------------------------------
  1540,
  1542,
  1543,
  1544,
  1546,
  1547,

  1512,
  1513,
  1514,
  1515,
  1518,
  1521,

  1494,
  1495,
  1496,
  1497,
  1501,

  1333,
  1334,
  1335,
  1338,
  1339,
  1340,
  1341,
  1342,
  1343,
  1344,
  1345,
  1347,
  1348,
  1349,
  1350,

  1556,
  1557,
  1558,
  1559,
  1560,
  1561,
  1562,
  1563,
  1564,
  1565,
  1566,

  // ---------------------------------------------------------------------------
  // Batch 2 - 21
  // ---------------------------------------------------------------------------
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

const EXPECTED_DELETED_SUBCOUNTY_COUNT = 113;

const KNOWN_COUNTY_ALIASES: Record<string, string> = {
  "nairobi": "nairobi city",
  "nairobi city": "nairobi city",
  "nairobi city county": "nairobi city",

  "muranga": "muranga",
  "murang'a": "muranga",
  "muranga county": "muranga",

  "tharaka nithi": "tharaka nithi",
  "tharaka-nithi": "tharaka nithi",
  "tharaka nithi county": "tharaka nithi",

  "elgeyo marakwet": "elgeyo marakwet",
  "elgeyo-marakwet": "elgeyo marakwet",
  "elgeyo marakwet county": "elgeyo marakwet",

  "taita taveta": "taita taveta",
  "taita-taveta": "taita taveta",

  "trans nzoia": "trans nzoia",
  "trans-nzoia": "trans nzoia",

  "tana river": "tana river",
  "tana-river": "tana river",
};

const KNOWN_SUBCOUNTY_ALIASES: Record<string, string> = {
  "tiaty": "tiaty",
  "tiaty east": "tiaty",
  "tiaty west": "tiaty",

  "tiaty east sub county": "tiaty",
  "tiaty west sub county": "tiaty",

  "marakwet east": "marakwet east",
  "marakwet east sub county": "marakwet east",

  "marakwet west": "marakwet west",
  "marakwet west sub county": "marakwet west",

  "keiyo north": "keiyo north",
  "keiyo north sub county": "keiyo north",

  "keiyo south": "keiyo south",
  "keiyo south sub county": "keiyo south",

  "mwingi central": "mwingi central",
  "mwingi central sub county": "mwingi central",

  "transmara east": "trans mara east",
  "trans mara east": "trans mara east",
  "transmara west": "trans mara west",
  "trans mara west": "trans mara west",

  "mukurweini": "mukurweini",
  "mukurwe-ini": "mukurweini",
  "mukurweini sub county": "mukurweini",

  "chuka": "chuka",
  "chuka sub county": "chuka",

  "muthambi": "muthambi",
  "muthambi sub county": "muthambi",

  "mwimbi": "mwimbi",
  "mwimbi sub county": "mwimbi",

  "igambangombe": "igambangombe",
  "igambangombe sub county": "igambangombe",

  "tharaka north": "tharaka north",
  "tharaka north sub county": "tharaka north",

  "tharaka south": "tharaka south",
  "tharaka south sub county": "tharaka south",
};

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCounty(value: string | null | undefined): string {
  let normalized = normalizeText(value);

  normalized = normalized
    .replace(/\bcounty\b/g, "")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  normalized = normalized.replace(/'/g, "");

  return KNOWN_COUNTY_ALIASES[normalized] ?? normalized;
}

function normalizeSubCounty(value: string | null | undefined): string {
  let normalized = normalizeText(value);

  normalized = normalized
    .replace(/\bsub[\s-]*county\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  normalized = normalized.replace(/'/g, "");

  return KNOWN_SUBCOUNTY_ALIASES[normalized] ?? normalized;
}

function normalizeWard(value: string | null | undefined): string {
  return normalizeText(value)
    .replace(/\bward\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function countyKey(county: string): string {
  return normalizeCounty(county);
}

function subCountyKey(county: string, subCounty: string): string {
  return `${normalizeCounty(county)}::${normalizeSubCounty(subCounty)}`;
}

function wardKey(
  county: string,
  subCounty: string,
  ward: string,
): string {
  return `${normalizeCounty(county)}::${normalizeSubCounty(subCounty)}::${normalizeWard(ward)}`;
}

function toNumber(value: unknown): number {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error(`Expected numeric value but received: ${String(value)}`);
  }

  return numberValue;
}

function loadGeoJSON(): GeoFeature[] {
  if (!fs.existsSync(GEOJSON_PATH)) {
    throw new Error(`GeoJSON file not found: ${GEOJSON_PATH}`);
  }

  const raw = fs.readFileSync(GEOJSON_PATH, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.features)) {
    throw new Error("GeoJSON does not contain a valid features array.");
  }

  return parsed.features as GeoFeature[];
}

function printSection(number: number, title: string): void {
  console.log("");
  console.log("=".repeat(80));
  console.log(`${number}. ${title}`);
  console.log("=".repeat(80));
}

function printList(
  title: string,
  values: string[],
): void {
  console.log(title);

  if (values.length === 0) {
    console.log("0");
    return;
  }

  for (const value of values) {
    console.log(`  - ${value}`);
  }
}

async function main(): Promise<void> {
  console.log("");
  console.log("FINAL GEOGRAPHY AUDIT");
  console.log("---------------------");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log(`GeoJSON: ${GEOJSON_PATH}`);

  /*
   * --------------------------------------------------------------------------
   * Defensive whitelist validation
   * --------------------------------------------------------------------------
   */

  const uniqueDeletedIds = new Set<number>(
    DELETED_SUBCOUNTY_IDS.map((id) => Number(id)),
  );

  if (DELETED_SUBCOUNTY_IDS.length !== EXPECTED_DELETED_SUBCOUNTY_COUNT) {
    throw new Error(
      `Audit whitelist count mismatch: expected ${EXPECTED_DELETED_SUBCOUNTY_COUNT}, ` +
        `found ${DELETED_SUBCOUNTY_IDS.length}`,
    );
  }

  if (uniqueDeletedIds.size !== EXPECTED_DELETED_SUBCOUNTY_COUNT) {
    throw new Error(
      `Audit whitelist contains duplicate IDs: expected ${EXPECTED_DELETED_SUBCOUNTY_COUNT} ` +
        `unique IDs, found ${uniqueDeletedIds.size}`,
    );
  }

  /*
   * --------------------------------------------------------------------------
   * Load authoritative GeoJSON
   * --------------------------------------------------------------------------
   */

  const features = loadGeoJSON();

  const authoritativeCountyKeys = new Set<string>();
  const authoritativeSubCountyKeys = new Set<string>();
  const authoritativeWardKeys = new Set<string>();
  const authoritativeGids = new Set<number>();

  const authoritativeWardCountBySubCounty =
    new Map<string, number>();

  const authoritativeWardCountByCounty =
    new Map<string, number>();

  for (const feature of features) {
    const properties = feature.properties;

    const county = String(properties.county ?? "");
    const subCounty = String(properties.subcounty ?? "");
    const ward = String(properties.ward ?? "");
    const gid = toNumber(properties.gid);

    const cKey = countyKey(county);
    const scKey = subCountyKey(county, subCounty);
    const wKey = wardKey(county, subCounty, ward);

    authoritativeCountyKeys.add(cKey);
    authoritativeSubCountyKeys.add(scKey);
    authoritativeWardKeys.add(wKey);
    authoritativeGids.add(gid);

    authoritativeWardCountBySubCounty.set(
      scKey,
      (authoritativeWardCountBySubCounty.get(scKey) ?? 0) + 1,
    );

    authoritativeWardCountByCounty.set(
      cKey,
      (authoritativeWardCountByCounty.get(cKey) ?? 0) + 1,
    );
  }

  /*
   * --------------------------------------------------------------------------
   * 1. AUTHORITATIVE SOURCE
   * --------------------------------------------------------------------------
   */

  printSection(1, "AUTHORITATIVE SOURCE");

  console.log(`GeoJSON features: ${features.length.toLocaleString()}`);
  console.log(`Authoritative counties: ${authoritativeCountyKeys.size}`);
  console.log(
    `Authoritative county/subcounty combinations: ${authoritativeSubCountyKeys.size}`,
  );
  console.log(
    `Authoritative unique ward identities: ${authoritativeWardKeys.size}`,
  );
  console.log(
    `Authoritative unique GIDs: ${authoritativeGids.size}`,
  );

  /*
   * --------------------------------------------------------------------------
   * Database load
   * --------------------------------------------------------------------------
   */

  const dbCounties = (await prisma.county.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  })) as DbCounty[];

  const dbSubCounties = (await prisma.subCounty.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          name: true,
        },
      },
      wards: {
        select: {
          id: true,
          name: true,
          countyId: true,
          subCountyId: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  })) as DbSubCounty[];

  const dbWards = (await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
      county: {
        select: {
          id: true,
          name: true,
        },
      },
      subCounty: {
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  })) as DbWard[];

  /*
   * --------------------------------------------------------------------------
   * 2. DATABASE LOAD
   * --------------------------------------------------------------------------
   */

  printSection(2, "DATABASE LOAD");

  console.log(`Database counties: ${dbCounties.length}`);
  console.log(`Database SubCounties: ${dbSubCounties.length}`);
  console.log(
    `Database wards through SubCounty relation: ${dbWards.length}`,
  );

  /*
   * --------------------------------------------------------------------------
   * 3. COUNTY COVERAGE
   * --------------------------------------------------------------------------
   */

  printSection(3, "COUNTY COVERAGE");

  const databaseCountyKeys = new Set<string>();

  for (const county of dbCounties) {
    databaseCountyKeys.add(countyKey(county.name));
  }

  const missingAuthoritativeCounties = [
    ...authoritativeCountyKeys,
  ].filter((key) => !databaseCountyKeys.has(key));

  const extraDatabaseCountyIdentities = [
    ...databaseCountyKeys,
  ].filter((key) => !authoritativeCountyKeys.has(key));

  console.log(
    `Authority counties: ${authoritativeCountyKeys.size}`,
  );
  console.log(
    `Database counties: ${databaseCountyKeys.size}`,
  );
  console.log(
    `Missing authoritative counties: ${missingAuthoritativeCounties.length}`,
  );
  console.log(
    `Extra database county identities: ${extraDatabaseCountyIdentities.length}`,
  );

  /*
   * --------------------------------------------------------------------------
   * 4. SUBCOUNTY IDENTITY AUDIT
   * --------------------------------------------------------------------------
   */

  printSection(4, "SUBCOUNTY IDENTITY AUDIT");

  const databaseSubCountyKeys = new Set<string>();
  const duplicateDatabaseSubCountyKeys = new Set<string>();

  for (const subCounty of dbSubCounties) {
    const key = subCountyKey(
      subCounty.county.name,
      subCounty.name,
    );

    if (databaseSubCountyKeys.has(key)) {
      duplicateDatabaseSubCountyKeys.add(key);
    }

    databaseSubCountyKeys.add(key);
  }

  const missingAuthoritativeSubCounties = [
    ...authoritativeSubCountyKeys,
  ].filter((key) => !databaseSubCountyKeys.has(key));

  const additionalDatabaseSubCounties = [
    ...databaseSubCountyKeys,
  ].filter((key) => !authoritativeSubCountyKeys.has(key));

  console.log(
    `Database normalized county/subcounty identities: ${databaseSubCountyKeys.size}`,
  );
  console.log(
    `Duplicate normalized SubCounty identities: ${duplicateDatabaseSubCountyKeys.size}`,
  );
  console.log(
    `Authoritative county/subcounty combinations: ${authoritativeSubCountyKeys.size}`,
  );
  console.log(
    `Database normalized county/subcounty combinations: ${databaseSubCountyKeys.size}`,
  );
  console.log(
    `Missing authoritative SubCounties: ${missingAuthoritativeSubCounties.length}`,
  );
  console.log(
    `Additional database SubCounties requiring classification: ${additionalDatabaseSubCounties.length}`,
  );

  /*
   * --------------------------------------------------------------------------
   * 5. WARD LINKAGE AUDIT
   * --------------------------------------------------------------------------
   */

  printSection(5, "WARD LINKAGE AUDIT");

  const wardsWithNullSubCountyId = dbWards.filter(
    (ward) => ward.subCountyId === null,
  );

  const wardsWithWrongSubCountyId: string[] = [];
  const wardsWithWrongCountyId: string[] = [];

  for (const ward of dbWards) {
    if (!ward.subCounty) {
      wardsWithWrongSubCountyId.push(
        `${ward.id} ${ward.name}: missing SubCounty relation`,
      );
      continue;
    }

    if (ward.subCountyId !== ward.subCounty.id) {
      wardsWithWrongSubCountyId.push(
        `${ward.id} ${ward.name}: subCountyId=${ward.subCountyId}, relation=${ward.subCounty.id}`,
      );
    }

    if (ward.countyId !== ward.county.id) {
      wardsWithWrongCountyId.push(
        `${ward.id} ${ward.name}: countyId=${ward.countyId}, relation=${ward.county.id}`,
      );
    }

    if (ward.subCounty.countyId !== ward.countyId) {
      wardsWithWrongCountyId.push(
        `${ward.id} ${ward.name}: Ward countyId=${ward.countyId}, SubCounty countyId=${ward.subCounty.countyId}`,
      );
    }
  }

  console.log(
    `Wards with null subCountyId: ${wardsWithNullSubCountyId.length}`,
  );
  console.log(
    `Wards with wrong subCountyId: ${wardsWithWrongSubCountyId.length}`,
  );
  console.log(
    `Wards with wrong countyId: ${wardsWithWrongCountyId.length}`,
  );

  /*
   * --------------------------------------------------------------------------
   * 6. AUTHORITATIVE WARD SET AUDIT
   * --------------------------------------------------------------------------
   */

  printSection(6, "AUTHORITATIVE WARD SET AUDIT");

  const databaseWardKeys = new Set<string>();
  const duplicateDatabaseWardKeys = new Set<string>();

  for (const ward of dbWards) {
    const key = wardKey(
      ward.county.name,
      ward.subCounty.name,
      ward.name,
    );

    if (databaseWardKeys.has(key)) {
      duplicateDatabaseWardKeys.add(key);
    }

    databaseWardKeys.add(key);
  }

  const missingAuthoritativeWards = [
    ...authoritativeWardKeys,
  ].filter((key) => !databaseWardKeys.has(key));

  const additionalDatabaseWardIdentities = [
    ...databaseWardKeys,
  ].filter((key) => !authoritativeWardKeys.has(key));

  console.log(
    `Database normalized ward identities: ${databaseWardKeys.size}`,
  );
  console.log(
    `Duplicate normalized database ward identities: ${duplicateDatabaseWardKeys.size}`,
  );
  console.log(
    `Missing authoritative wards: ${missingAuthoritativeWards.length}`,
  );
  console.log(
    `Additional database ward identities: ${additionalDatabaseWardIdentities.length}`,
  );

  /*
   * --------------------------------------------------------------------------
   * 7. COUNTY/SUBCOUNTY WARD COUNTS
   * --------------------------------------------------------------------------
   */

  printSection(7, "COUNTY/SUBCOUNTY WARD COUNTS");

  const databaseWardCountBySubCounty =
    new Map<string, number>();

  for (const ward of dbWards) {
    const key = subCountyKey(
      ward.county.name,
      ward.subCounty.name,
    );

    databaseWardCountBySubCounty.set(
      key,
      (databaseWardCountBySubCounty.get(key) ?? 0) + 1,
    );
  }

  const subCountyWardCountMismatches: string[] = [];

  for (const key of authoritativeSubCountyKeys) {
    const authorityCount =
      authoritativeWardCountBySubCounty.get(key) ?? 0;

    const databaseCount =
      databaseWardCountBySubCounty.get(key) ?? 0;

    if (authorityCount !== databaseCount) {
      subCountyWardCountMismatches.push(
        `${key}: database=${databaseCount}, authority=${authorityCount}`,
      );
    }
  }

  console.log(
    `SubCounty ward-count mismatches: ${subCountyWardCountMismatches.length}`,
  );

  /*
   * --------------------------------------------------------------------------
   * 8. DELETED LEGACY SUBCOUNTY AUDIT
   * --------------------------------------------------------------------------
   */

  printSection(8, "DELETED LEGACY SUBCOUNTY AUDIT");

  const deletedIds = [...uniqueDeletedIds];

  const deletedSubCountyRows = await prisma.subCounty.findMany({
    where: {
      id: {
        in: deletedIds,
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

  console.log(
    `Deleted IDs expected absent: ${EXPECTED_DELETED_SUBCOUNTY_COUNT}`,
  );
  console.log(
    `Deleted IDs still present: ${deletedSubCountyRows.length}`,
  );

  if (deletedSubCountyRows.length > 0) {
    console.log("");
    console.log("DELETED IDs STILL PRESENT:");

    for (const row of deletedSubCountyRows) {
      console.log(
        `  ${row.id} | ${row.name} | countyId=${row.countyId}`,
      );
    }
  }

  /*
   * --------------------------------------------------------------------------
   * 9. DATABASE FK INTEGRITY
   * --------------------------------------------------------------------------
   */

  printSection(9, "DATABASE FK INTEGRITY");

  const businessPartnerDeletedRefs =
    await prisma.businessPartner.count({
      where: {
        subCountyId: {
          in: deletedIds,
        },
      },
    });

  const commodityDestinationDeletedRefs =
    await prisma.commodityTransaction.count({
      where: {
        destinationSubCountyId: {
          in: deletedIds,
        },
      },
    });

  const commoditySourceDeletedRefs =
    await prisma.commodityTransaction.count({
      where: {
        sourceSubCountyId: {
          in: deletedIds,
        },
      },
    });

  const farmDeletedRefs =
    await prisma.farm.count({
      where: {
        subCountyId: {
          in: deletedIds,
        },
      },
    });

  const farmerDeletedRefs =
    await prisma.farmer.count({
      where: {
        subCountyId: {
          in: deletedIds,
        },
      },
    });

  const wardDeletedRefs =
    await prisma.ward.count({
      where: {
        subCountyId: {
          in: deletedIds,
        },
      },
    });

  console.log(
    `BusinessPartner deleted-ID refs: ${businessPartnerDeletedRefs}`,
  );

  console.log(
    `CommodityTransaction_destination deleted-ID refs: ${commodityDestinationDeletedRefs}`,
  );

  console.log(
    `CommodityTransaction_source deleted-ID refs: ${commoditySourceDeletedRefs}`,
  );

  console.log(
    `Farm deleted-ID refs: ${farmDeletedRefs}`,
  );

  console.log(
    `Farmer deleted-ID refs: ${farmerDeletedRefs}`,
  );

  console.log(
    `Ward deleted-ID refs: ${wardDeletedRefs}`,
  );

  /*
   * --------------------------------------------------------------------------
   * 10. GLOBAL WARD DATABASE CHECK
   *
   * Use raw SQL for NULL checks because Prisma 7 rejects:
   *
   *   where: { countyId: null }
   *
   * on required Int fields.
   * --------------------------------------------------------------------------
   */

  printSection(10, "GLOBAL WARD DATABASE CHECK");

  const totalWardRowsResult = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*)::bigint AS count
    FROM "Ward"
  `;

  const distinctWardIdsResult = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(DISTINCT "id")::bigint AS count
    FROM "Ward"
  `;

  const nullSubCountyWardRowsResult = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*)::bigint AS count
    FROM "Ward"
    WHERE "subCountyId" IS NULL
  `;

  const nullCountyWardRowsResult = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*)::bigint AS count
    FROM "Ward"
    WHERE "countyId" IS NULL
  `;

  const totalWardRows = Number(
    totalWardRowsResult[0]?.count ?? 0n,
  );

  const distinctWardIds = Number(
    distinctWardIdsResult[0]?.count ?? 0n,
  );

  const nullSubCountyWardRows = Number(
    nullSubCountyWardRowsResult[0]?.count ?? 0n,
  );

  const nullCountyWardRows = Number(
    nullCountyWardRowsResult[0]?.count ?? 0n,
  );

  console.log(`Ward rows: ${totalWardRows}`);
  console.log(`Distinct Ward IDs: ${distinctWardIds}`);
  console.log(
    `Ward rows with null subCountyId: ${nullSubCountyWardRows}`,
  );
  console.log(
    `Ward rows with null countyId: ${nullCountyWardRows}`,
  );

  /*
   * --------------------------------------------------------------------------
   * 11. COUNTY SUMMARY
   * --------------------------------------------------------------------------
   */

  printSection(11, "COUNTY SUMMARY");

  const dbSubCountiesByCounty = new Map<
    number,
    DbSubCounty[]
  >();

  for (const subCounty of dbSubCounties) {
    const existing =
      dbSubCountiesByCounty.get(subCounty.countyId) ?? [];

    existing.push(subCounty);

    dbSubCountiesByCounty.set(
      subCounty.countyId,
      existing,
    );
  }

  const dbWardCountByCounty = new Map<string, number>();

  for (const ward of dbWards) {
    const key = countyKey(ward.county.name);

    dbWardCountByCounty.set(
      key,
      (dbWardCountByCounty.get(key) ?? 0) + 1,
    );
  }

  const sortedCounties = [...dbCounties].sort(
    (a, b) => a.id - b.id,
  );

  for (const county of sortedCounties) {
    const cKey = countyKey(county.name);

    const subCounties =
      dbSubCountiesByCounty.get(county.id) ?? [];

    const dbWardCount =
      dbWardCountByCounty.get(cKey) ?? 0;

    const authorityWardCount =
      authoritativeWardCountByCounty.get(cKey) ?? 0;

    console.log(
      `${String(county.id).padStart(3, " ")} | ` +
        `${county.name.padEnd(25, " ")} | ` +
        `subcounties=${String(subCounties.length).padStart(2, " ")} | ` +
        `dbWards=${String(dbWardCount).padStart(3, " ")} | ` +
        `authorityWards=${String(authorityWardCount).padStart(3, " ")}`,
    );
  }

  /*
   * --------------------------------------------------------------------------
   * 12. FINAL RESULT
   * --------------------------------------------------------------------------
   */

  printSection(12, "FINAL RESULT");

  const totalBrokenFkReferences =
    businessPartnerDeletedRefs +
    commodityDestinationDeletedRefs +
    commoditySourceDeletedRefs +
    farmDeletedRefs +
    farmerDeletedRefs +
    wardDeletedRefs;

  console.log(
    `Counties: ${databaseCountyKeys.size}/${authoritativeCountyKeys.size}`,
  );

  console.log(
    `Database wards: ${totalWardRows}/${features.length}`,
  );

  console.log(
    `Authority wards: ${authoritativeWardKeys.size}/${features.length}`,
  );

  console.log(
    `Authority county/subcounty combinations: ${authoritativeSubCountyKeys.size}/${authoritativeSubCountyKeys.size}`,
  );

  console.log(
    `Broken FK references to deleted IDs: ${totalBrokenFkReferences}`,
  );

  console.log(
    `Previously deleted SubCounty IDs still present: ${deletedSubCountyRows.length}`,
  );

  console.log(
    `Missing authoritative wards: ${missingAuthoritativeWards.length}`,
  );

  console.log(
    `Duplicate DB ward identities: ${duplicateDatabaseWardKeys.size}`,
  );

  console.log(
    `Ward-count mismatches: ${subCountyWardCountMismatches.length}`,
  );

  /*
   * --------------------------------------------------------------------------
   * Final issue collection
   * --------------------------------------------------------------------------
   */

  const issues: string[] = [];

  if (features.length !== 1450) {
    issues.push(
      `GeoJSON feature count is ${features.length}, expected 1450`,
    );
  }

  if (authoritativeCountyKeys.size !== 47) {
    issues.push(
      `Authoritative county count is ${authoritativeCountyKeys.size}, expected 47`,
    );
  }

  if (databaseCountyKeys.size !== 47) {
    issues.push(
      `Database county count is ${databaseCountyKeys.size}, expected 47`,
    );
  }

  if (authoritativeSubCountyKeys.size !== 301) {
    issues.push(
      `Authoritative county/SubCounty combinations are ${authoritativeSubCountyKeys.size}, expected 301`,
    );
  }

  if (databaseSubCountyKeys.size !== 301) {
    issues.push(
      `Database normalized county/SubCounty combinations are ${databaseSubCountyKeys.size}, expected 301`,
    );
  }

  if (dbSubCounties.length !== 301) {
    issues.push(
      `Database SubCounty rows are ${dbSubCounties.length}, expected 301`,
    );
  }

  if (totalWardRows !== 1450) {
    issues.push(
      `Database Ward rows are ${totalWardRows}, expected 1450`,
    );
  }

  if (distinctWardIds !== 1450) {
    issues.push(
      `Distinct Ward IDs are ${distinctWardIds}, expected 1450`,
    );
  }

  if (authoritativeWardKeys.size !== 1450) {
    issues.push(
      `Authoritative ward identities are ${authoritativeWardKeys.size}, expected 1450`,
    );
  }

  if (authoritativeGids.size !== 1450) {
    issues.push(
      `Authoritative GIDs are ${authoritativeGids.size}, expected 1450`,
    );
  }

  if (missingAuthoritativeCounties.length > 0) {
    issues.push(
      `Missing authoritative counties: ${missingAuthoritativeCounties.join(", ")}`,
    );
  }

  if (extraDatabaseCountyIdentities.length > 0) {
    issues.push(
      `Extra database county identities: ${extraDatabaseCountyIdentities.join(", ")}`,
    );
  }

  if (duplicateDatabaseSubCountyKeys.size > 0) {
    issues.push(
      `Duplicate normalized SubCounty identities: ${duplicateDatabaseSubCountyKeys.size}`,
    );
  }

  if (missingAuthoritativeSubCounties.length > 0) {
    issues.push(
      `Missing authoritative SubCounties: ${missingAuthoritativeSubCounties.length}`,
    );
  }

  if (additionalDatabaseSubCounties.length > 0) {
    issues.push(
      `Additional database SubCounties: ${additionalDatabaseSubCounties.length}`,
    );
  }

  if (wardsWithNullSubCountyId.length > 0) {
    issues.push(
      `Wards with null subCountyId: ${wardsWithNullSubCountyId.length}`,
    );
  }

  if (wardsWithWrongSubCountyId.length > 0) {
    issues.push(
      `Wards with wrong subCountyId: ${wardsWithWrongSubCountyId.length}`,
    );
  }

  if (wardsWithWrongCountyId.length > 0) {
    issues.push(
      `Wards with wrong countyId: ${wardsWithWrongCountyId.length}`,
    );
  }

  if (duplicateDatabaseWardKeys.size > 0) {
    issues.push(
      `Duplicate normalized database ward identities: ${duplicateDatabaseWardKeys.size}`,
    );
  }

  if (missingAuthoritativeWards.length > 0) {
    issues.push(
      `Missing authoritative wards: ${missingAuthoritativeWards.length}`,
    );
  }

  if (additionalDatabaseWardIdentities.length > 0) {
    issues.push(
      `Additional database ward identities: ${additionalDatabaseWardIdentities.length}`,
    );
  }

  if (subCountyWardCountMismatches.length > 0) {
    issues.push(
      `SubCounty ward-count mismatches: ${subCountyWardCountMismatches.length}`,
    );
  }

  if (deletedSubCountyRows.length > 0) {
    issues.push(
      `Deleted SubCounty IDs still present: ${deletedSubCountyRows.length}`,
    );
  }

  if (totalBrokenFkReferences > 0) {
    issues.push(
      `Broken FK references to deleted IDs: ${totalBrokenFkReferences}`,
    );
  }

  if (nullSubCountyWardRows > 0) {
    issues.push(
      `Global Ward rows with null subCountyId: ${nullSubCountyWardRows}`,
    );
  }

  if (nullCountyWardRows > 0) {
    issues.push(
      `Global Ward rows with null countyId: ${nullCountyWardRows}`,
    );
  }

  if (dbWards.length !== 1450) {
    issues.push(
      `Prisma-loaded Ward rows are ${dbWards.length}, expected 1450`,
    );
  }

  if (DELETED_SUBCOUNTY_IDS.length !== 113) {
    issues.push(
      `Deleted-ID whitelist contains ${DELETED_SUBCOUNTY_IDS.length} IDs, expected 113`,
    );
  }

  if (uniqueDeletedIds.size !== 113) {
    issues.push(
      `Deleted-ID whitelist contains ${uniqueDeletedIds.size} unique IDs, expected 113`,
    );
  }

  /*
   * --------------------------------------------------------------------------
   * Print detailed issues if anything failed
   * --------------------------------------------------------------------------
   */

  if (issues.length > 0) {
    console.log("");
    console.log("============================================================");
    console.log("FINAL GEOGRAPHY AUDIT: FAIL");
    console.log("============================================================");
    console.log("");
    console.log(`Total issues: ${issues.length}`);

    for (const issue of issues) {
      console.log(`- ${issue}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("============================================================");
  console.log("FINAL GEOGRAPHY AUDIT: PASS");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("FINAL GEOGRAPHY AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });