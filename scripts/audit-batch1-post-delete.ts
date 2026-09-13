import { Pool } from "pg";
import fs from "fs";
import path from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type CountyTarget = {
  countyId: number;
  countyName: string;
  originalSubCountyCount: number;
  deletedCount: number;
  expectedRemainingSubCounties: number;
  expectedWardCount: number;
  deletedIds: number[];
};

type GeoFeature = {
  properties?: {
    county?: string;
    subcounty?: string;
    ward?: string;
    gid?: number;
    uid?: string;
    scuid?: string;
    cuid?: string;
  };
};

const targets: CountyTarget[] = [
  {
    countyId: 51,
    countyName: "Homa Bay",
    originalSubCountyCount: 14,
    deletedCount: 6,
    expectedRemainingSubCounties: 8,
    expectedWardCount: 40,
    deletedIds: [1540, 1542, 1543, 1544, 1546, 1547],
  },
  {
    countyId: 53,
    countyName: "Bungoma",
    originalSubCountyCount: 16,
    deletedCount: 6,
    expectedRemainingSubCounties: 10,
    expectedWardCount: 45,
    deletedIds: [1512, 1513, 1514, 1515, 1518, 1521],
  },
  {
    countyId: 54,
    countyName: "Kakamega",
    originalSubCountyCount: 17,
    deletedCount: 5,
    expectedRemainingSubCounties: 12,
    expectedWardCount: 60,
    deletedIds: [1494, 1495, 1496, 1497, 1501],
  },
  {
    countyId: 68,
    countyName: "Kitui",
    originalSubCountyCount: 23,
    deletedCount: 15,
    expectedRemainingSubCounties: 8,
    expectedWardCount: 40,
    deletedIds: [
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
    ],
  },
  {
    countyId: 87,
    countyName: "Kisii",
    originalSubCountyCount: 20,
    deletedCount: 11,
    expectedRemainingSubCounties: 9,
    expectedWardCount: 45,
    deletedIds: [
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
    ],
  },
];

const deletedIds = targets.flatMap((target) => target.deletedIds);

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function countyVariants(value: string): string[] {
  const normalized = normalize(value);

  const variants = new Set<string>();

  variants.add(normalized);

  if (normalized === "homa bay") {
    variants.add("homabay");
  }

  if (normalized === "muranga") {
    variants.add("muranga");
    variants.add("muranga county");
  }

  return [...variants];
}

function subCountyVariants(value: string): string[] {
  const normalized = normalize(value);

  const variants = new Set<string>();

  variants.add(normalized);

  const withoutSubCounty = normalized
    .replace(/\bsub county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (withoutSubCounty) {
    variants.add(withoutSubCounty);
  }

  return [...variants];
}

function fail(message: string): never {
  console.error(`\n❌ FAIL: ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

function pass(message: string): void {
  console.log(`✅ ${message}`);
}

function loadGeoJSON(): GeoFeature[] {
  const geoJsonPath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "kenya-wards-1450.geojson",
  );

  if (!fs.existsSync(geoJsonPath)) {
    fail(`Authoritative GeoJSON not found: ${geoJsonPath}`);
  }

  const raw = fs.readFileSync(geoJsonPath, "utf8");

  const parsed = JSON.parse(raw) as {
    features?: GeoFeature[];
  };

  if (!Array.isArray(parsed.features)) {
    fail("Authoritative GeoJSON does not contain a valid features array.");
  }

  return parsed.features;
}

async function main(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("============================================================");
    console.log("BATCH 1 POST-DELETE AUDIT");
    console.log("READ-ONLY — NO DATABASE CHANGES");
    console.log("============================================================\n");

    console.log(`Target deleted IDs: ${deletedIds.length}`);

    const expectedRemainingSubCounties = targets.reduce(
      (sum, target) => sum + target.expectedRemainingSubCounties,
      0,
    );

    const expectedRemainingWards = targets.reduce(
      (sum, target) => sum + target.expectedWardCount,
      0,
    );

    console.log(
      `Expected remaining operational SubCounties: ${expectedRemainingSubCounties}`,
    );

    console.log(
      `Expected remaining operational wards: ${expectedRemainingWards}`,
    );

    /*
     * ----------------------------------------------------------
     * Load authoritative geography
     * ----------------------------------------------------------
     */

    console.log("\nLoading authoritative GeoJSON...");

    const features = loadGeoJSON();

    console.log(
      `Authoritative GeoJSON features loaded: ${features.length}`,
    );

    if (features.length !== 1450) {
      fail(
        `Expected authoritative GeoJSON to contain 1450 ward features, found ${features.length}.`,
      );
    }

    pass("Authoritative GeoJSON contains exactly 1450 ward features.");

    /*
     * ----------------------------------------------------------
     * Build authoritative county/subcounty index
     * ----------------------------------------------------------
     */

    const authoritative = new Map<
      string,
      {
        countyName: string;
        subCountyName: string;
        wards: Set<number>;
      }
    >();

    for (const feature of features) {
      const countyName = feature.properties?.county ?? "";
      const subCountyName = feature.properties?.subcounty ?? "";
      const gid = Number(feature.properties?.gid);

      if (!countyName || !subCountyName) {
        continue;
      }

      const countyKeys = countyVariants(countyName);
      const subCountyKeys = subCountyVariants(subCountyName);

      for (const countyKey of countyKeys) {
        for (const subCountyKey of subCountyKeys) {
          const key = `${countyKey}|||${subCountyKey}`;

          if (!authoritative.has(key)) {
            authoritative.set(key, {
              countyName,
              subCountyName,
              wards: new Set<number>(),
            });
          }

          if (Number.isFinite(gid)) {
            authoritative.get(key)!.wards.add(gid);
          }
        }
      }
    }

    /*
     * ----------------------------------------------------------
     * 1. Verify deleted IDs are absent
     * ----------------------------------------------------------
     */

    console.log("\n1. VERIFY DELETED IDS ARE ABSENT");

    const deletedPresenceResult = await client.query<{
      id: number;
      name: string;
      countyId: number;
    }>(
      `
      SELECT
        sc.id,
        sc.name,
        sc."countyId"
      FROM "SubCounty" sc
      WHERE sc.id = ANY($1::int[])
      ORDER BY sc.id
      `,
      [deletedIds],
    );

    if (deletedPresenceResult.rows.length !== 0) {
      console.table(deletedPresenceResult.rows);

      fail(
        `Expected all ${deletedIds.length} deleted IDs to be absent, but ${deletedPresenceResult.rows.length} still exist.`,
      );
    }

    pass(`All ${deletedIds.length} deleted SubCounty IDs are absent.`);

    /*
     * ----------------------------------------------------------
     * 2. Verify no Ward references deleted IDs
     * ----------------------------------------------------------
     */

    console.log("\n2. VERIFY NO WARD REFERENCES");

    const wardRefsResult = await client.query<{
      id: number;
      name: string;
      subCountyId: number;
    }>(
      `
      SELECT
        w.id,
        w.name,
        w."subCountyId"
      FROM "Ward" w
      WHERE w."subCountyId" = ANY($1::int[])
      ORDER BY w."subCountyId", w.id
      `,
      [deletedIds],
    );

    if (wardRefsResult.rows.length !== 0) {
      console.table(wardRefsResult.rows);

      fail(
        `Found ${wardRefsResult.rows.length} Ward references to deleted SubCounty IDs.`,
      );
    }

    pass("Ward references to deleted IDs = 0.");

    /*
     * ----------------------------------------------------------
     * 3. Verify all six FK paths
     * ----------------------------------------------------------
     */

    console.log("\n3. VERIFY ALL SIX FK REFERENCE PATHS");

    const fkChecks = [
      {
        label: "BusinessPartner.subCountyId",
        table: "BusinessPartner",
        column: "subCountyId",
      },
      {
        label: "CommodityTransaction.destinationSubCountyId",
        table: "CommodityTransaction",
        column: "destinationSubCountyId",
      },
      {
        label: "CommodityTransaction.sourceSubCountyId",
        table: "CommodityTransaction",
        column: "sourceSubCountyId",
      },
      {
        label: "Farm.subCountyId",
        table: "Farm",
        column: "subCountyId",
      },
      {
        label: "Farmer.subCountyId",
        table: "Farmer",
        column: "subCountyId",
      },
      {
        label: "Ward.subCountyId",
        table: "Ward",
        column: "subCountyId",
      },
    ];

    let totalFkRefs = 0;

    for (const fk of fkChecks) {
      const result = await client.query<{ count: string }>(
        `
        SELECT COUNT(*)::text AS count
        FROM "${fk.table}"
        WHERE "${fk.column}" = ANY($1::int[])
        `,
        [deletedIds],
      );

      const count = Number(result.rows[0]?.count ?? 0);

      console.log(`   ${fk.label}: ${count}`);

      if (count !== 0) {
        fail(
          `${fk.label} contains ${count} references to deleted SubCounty IDs.`,
        );
      }

      totalFkRefs += count;
    }

    if (totalFkRefs !== 0) {
      fail(`Total FK references to deleted IDs = ${totalFkRefs}.`);
    }

    pass("All six FK paths contain 0 references to deleted IDs.");

    /*
     * ----------------------------------------------------------
     * 4. Verify five target counties still exist
     * ----------------------------------------------------------
     */

    console.log("\n4. VERIFY FIVE TARGET COUNTIES STILL EXIST");

    const countyIds = targets.map((target) => target.countyId);

    const countyResult = await client.query<{
      id: number;
      name: string;
    }>(
      `
      SELECT
        c.id,
        c.name
      FROM "County" c
      WHERE c.id = ANY($1::int[])
      ORDER BY c.id
      `,
      [countyIds],
    );

    if (countyResult.rows.length !== targets.length) {
      console.table(countyResult.rows);

      fail(
        `Expected ${targets.length} counties, found ${countyResult.rows.length}.`,
      );
    }

    for (const target of targets) {
      const county = countyResult.rows.find(
        (row) => Number(row.id) === target.countyId,
      );

      if (!county) {
        fail(
          `County ${target.countyId} (${target.countyName}) is missing.`,
        );
      }

      if (normalize(county.name) !== normalize(target.countyName)) {
        fail(
          `County ID ${target.countyId} name mismatch. Expected "${target.countyName}", found "${county.name}".`,
        );
      }

      console.log(`   ${target.countyId}: ${county.name}`);
    }

    pass("All five target counties still exist with expected names.");

    /*
     * ----------------------------------------------------------
     * 5. Verify remaining SubCounty counts
     * ----------------------------------------------------------
     */

    console.log("\n5. VERIFY REMAINING SUBCOUNTY COUNTS");

    const subCountyCountResult = await client.query<{
      countyId: number;
      countyName: string;
      count: string;
    }>(
      `
      SELECT
        c.id AS "countyId",
        c.name AS "countyName",
        COUNT(sc.id)::text AS count
      FROM "County" c
      LEFT JOIN "SubCounty" sc
        ON sc."countyId" = c.id
      WHERE c.id = ANY($1::int[])
      GROUP BY c.id, c.name
      ORDER BY c.id
      `,
      [countyIds],
    );

    let totalRemainingSubCounties = 0;

    for (const target of targets) {
      const row = subCountyCountResult.rows.find(
        (item) => Number(item.countyId) === target.countyId,
      );

      if (!row) {
        fail(
          `No SubCounty count returned for county ${target.countyId} (${target.countyName}).`,
        );
      }

      const actualCount = Number(row.count);

      totalRemainingSubCounties += actualCount;

      console.log(
        `   ${target.countyName}: ${actualCount} remaining; expected ${target.expectedRemainingSubCounties}`,
      );

      if (actualCount !== target.expectedRemainingSubCounties) {
        fail(
          `${target.countyName}: expected ${target.expectedRemainingSubCounties} remaining SubCounties, found ${actualCount}.`,
        );
      }
    }

    if (totalRemainingSubCounties !== expectedRemainingSubCounties) {
      fail(
        `Expected ${expectedRemainingSubCounties} total remaining SubCounties, found ${totalRemainingSubCounties}.`,
      );
    }

    pass(
      `Remaining SubCounty count = ${totalRemainingSubCounties}, exactly as expected.`,
    );

    /*
     * ----------------------------------------------------------
     * 6. Verify remaining Ward counts
     * ----------------------------------------------------------
     */

    console.log("\n6. VERIFY REMAINING WARD COUNTS");

    const wardCountResult = await client.query<{
      countyId: number;
      countyName: string;
      count: string;
    }>(
      `
      SELECT
        c.id AS "countyId",
        c.name AS "countyName",
        COUNT(w.id)::text AS count
      FROM "County" c
      LEFT JOIN "Ward" w
        ON w."countyId" = c.id
      WHERE c.id = ANY($1::int[])
      GROUP BY c.id, c.name
      ORDER BY c.id
      `,
      [countyIds],
    );

    let totalRemainingWards = 0;

    for (const target of targets) {
      const row = wardCountResult.rows.find(
        (item) => Number(item.countyId) === target.countyId,
      );

      if (!row) {
        fail(
          `No Ward count returned for county ${target.countyId} (${target.countyName}).`,
        );
      }

      const actualCount = Number(row.count);

      totalRemainingWards += actualCount;

      console.log(
        `   ${target.countyName}: ${actualCount} wards; expected ${target.expectedWardCount}`,
      );

      if (actualCount !== target.expectedWardCount) {
        fail(
          `${target.countyName}: expected ${target.expectedWardCount} wards, found ${actualCount}.`,
        );
      }
    }

    if (totalRemainingWards !== expectedRemainingWards) {
      fail(
        `Expected ${expectedRemainingWards} total wards, found ${totalRemainingWards}.`,
      );
    }

    pass(
      `Remaining Ward count = ${totalRemainingWards}, exactly as expected.`,
    );

    /*
     * ----------------------------------------------------------
     * 7. Verify every surviving SubCounty is authoritative
     * ----------------------------------------------------------
     *
     * This replaces the incorrect hardcoded ID list.
     *
     * The database IDs themselves are not authoritative geography
     * identifiers. The authoritative source is the 1450-ward GeoJSON.
     *
     * Therefore we validate:
     *
     *   DB County + DB SubCounty name
     *       ↓
     *   authoritative GeoJSON
     *
     * Every surviving SubCounty must:
     *
     *   1. exist in the authoritative source
     *   2. have authoritative wards
     *
     * This catches accidental deletion of a legitimate operational
     * SubCounty even when aggregate counts happen to look correct.
     * ----------------------------------------------------------
     */

    console.log(
      "\n7. VERIFY EVERY SURVIVING SUBCOUNTY AGAINST AUTHORITATIVE GEOGRAPHY",
    );

    const survivingSubCounties = await client.query<{
      id: number;
      name: string;
      countyId: number;
      countyName: string;
    }>(
      `
      SELECT
        sc.id,
        sc.name,
        sc."countyId",
        c.name AS "countyName"
      FROM "SubCounty" sc
      INNER JOIN "County" c
        ON c.id = sc."countyId"
      WHERE sc."countyId" = ANY($1::int[])
      ORDER BY sc."countyId", sc.id
      `,
      [countyIds],
    );

    if (survivingSubCounties.rows.length !== expectedRemainingSubCounties) {
      fail(
        `Expected ${expectedRemainingSubCounties} surviving SubCounties, found ${survivingSubCounties.rows.length}.`,
      );
    }

    const unmatched: Array<{
      id: number;
      countyId: number;
      countyName: string;
      subCountyName: string;
    }> = [];

    const noWardAuthority: Array<{
      id: number;
      countyId: number;
      countyName: string;
      subCountyName: string;
    }> = [];

    const matchedAuthority = new Set<string>();

    for (const row of survivingSubCounties.rows) {
      const countyKeys = countyVariants(row.countyName);
      const subCountyKeys = subCountyVariants(row.name);

      let match:
        | {
            countyName: string;
            subCountyName: string;
            wards: Set<number>;
          }
        | undefined;

      let matchedKey = "";

      for (const countyKey of countyKeys) {
        for (const subCountyKey of subCountyKeys) {
          const key = `${countyKey}|||${subCountyKey}`;

          const candidate = authoritative.get(key);

          if (candidate) {
            match = candidate;
            matchedKey = key;
            break;
          }
        }

        if (match) {
          break;
        }
      }

      if (!match) {
        unmatched.push({
          id: Number(row.id),
          countyId: Number(row.countyId),
          countyName: row.countyName,
          subCountyName: row.name,
        });

        continue;
      }

      matchedAuthority.add(matchedKey);

      if (match.wards.size === 0) {
        noWardAuthority.push({
          id: Number(row.id),
          countyId: Number(row.countyId),
          countyName: row.countyName,
          subCountyName: row.name,
        });
      }
    }

    if (unmatched.length !== 0) {
      console.log("\nUnmatched surviving SubCounties:");
      console.table(unmatched);

      fail(
        `${unmatched.length} surviving SubCounties do not match the authoritative GeoJSON.`,
      );
    }

    pass(
      `All ${survivingSubCounties.rows.length} surviving SubCounties match authoritative geography.`,
    );

    if (noWardAuthority.length !== 0) {
      console.log("\nSurviving SubCounties with zero authoritative wards:");
      console.table(noWardAuthority);

      fail(
        `${noWardAuthority.length} surviving SubCounties have no authoritative wards.`,
      );
    }

    pass("Every surviving SubCounty has authoritative wards.");

    /*
     * ----------------------------------------------------------
     * 8. Verify authoritative SubCounty coverage
     * ----------------------------------------------------------
     *
     * For each target county, count the distinct authoritative
     * SubCounties represented in the GeoJSON and compare against
     * the expected operational count.
     *
     * The 43 deleted legacy candidates had already been proven to
     * have no authoritative match.
     *
     * Therefore the surviving DB set should cover the complete
     * authoritative operational set.
     * ----------------------------------------------------------
     */

    console.log("\n8. VERIFY AUTHORITATIVE SUBCOUNTY COVERAGE");

    for (const target of targets) {
      const countyKeys = countyVariants(target.countyName);

      const authoritativeCountySubCounties = new Set<string>();

      for (const feature of features) {
        const featureCounty = feature.properties?.county ?? "";
        const featureSubCounty = feature.properties?.subcounty ?? "";

        if (!featureCounty || !featureSubCounty) {
          continue;
        }

        const featureCountyKeys = countyVariants(featureCounty);

        const countyMatches = featureCountyKeys.some((key) =>
          countyKeys.includes(key),
        );

        if (!countyMatches) {
          continue;
        }

        const subCountyKeys = subCountyVariants(featureSubCounty);

        for (const subCountyKey of subCountyKeys) {
          authoritativeCountySubCounties.add(subCountyKey);
        }
      }

      /*
       * Because subcountyVariants can add aliases, the count can be
       * larger than the true distinct count. Therefore use the
       * authoritative map itself and collect canonical source names.
       */

      const canonicalSourceNames = new Set<string>();

      for (const feature of features) {
        const featureCounty = feature.properties?.county ?? "";
        const featureSubCounty = feature.properties?.subcounty ?? "";

        if (!featureCounty || !featureSubCounty) {
          continue;
        }

        const countyMatches = countyVariants(featureCounty).some((key) =>
          countyKeys.includes(key),
        );

        if (!countyMatches) {
          continue;
        }

        canonicalSourceNames.add(normalize(featureSubCounty));
      }

      console.log(
        `   ${target.countyName}: ${canonicalSourceNames.size} authoritative SubCounties; ${target.expectedRemainingSubCounties} expected operational`,
      );

      if (
        canonicalSourceNames.size !== target.expectedRemainingSubCounties
      ) {
        fail(
          `${target.countyName}: authoritative SubCounty count ${canonicalSourceNames.size} does not equal expected operational count ${target.expectedRemainingSubCounties}.`,
        );
      }
    }

    pass(
      "All five counties have the expected authoritative operational SubCounty coverage.",
    );

    /*
     * ----------------------------------------------------------
     * 9. Verify no deleted IDs appear anywhere
     * ----------------------------------------------------------
     */

    console.log("\n9. FINAL REDISCOVERY CHECK");

    const rediscoveryResult = await client.query<{
      id: number;
      name: string;
      countyId: number;
    }>(
      `
      SELECT
        sc.id,
        sc.name,
        sc."countyId"
      FROM "SubCounty" sc
      WHERE sc.id = ANY($1::int[])
      ORDER BY sc.id
      `,
      [deletedIds],
    );

    if (rediscoveryResult.rows.length !== 0) {
      console.table(rediscoveryResult.rows);

      fail(
        `Rediscovery check failed: ${rediscoveryResult.rows.length} deleted IDs were found again.`,
      );
    }

    pass("No deleted target IDs were rediscovered.");

    /*
     * ----------------------------------------------------------
     * 10. Final aggregate FK check
     * ----------------------------------------------------------
     */

    console.log("\n10. FINAL AGGREGATE FK CHECK");

    const fkAggregateResult = await client.query<{
      businessPartner: string;
      destinationTransaction: string;
      sourceTransaction: string;
      farm: string;
      farmer: string;
      ward: string;
    }>(
      `
      SELECT
        (
          SELECT COUNT(*)
          FROM "BusinessPartner"
          WHERE "subCountyId" = ANY($1::int[])
        )::text AS "businessPartner",

        (
          SELECT COUNT(*)
          FROM "CommodityTransaction"
          WHERE "destinationSubCountyId" = ANY($1::int[])
        )::text AS "destinationTransaction",

        (
          SELECT COUNT(*)
          FROM "CommodityTransaction"
          WHERE "sourceSubCountyId" = ANY($1::int[])
        )::text AS "sourceTransaction",

        (
          SELECT COUNT(*)
          FROM "Farm"
          WHERE "subCountyId" = ANY($1::int[])
        )::text AS farm,

        (
          SELECT COUNT(*)
          FROM "Farmer"
          WHERE "subCountyId" = ANY($1::int[])
        )::text AS farmer,

        (
          SELECT COUNT(*)
          FROM "Ward"
          WHERE "subCountyId" = ANY($1::int[])
        )::text AS ward
      `,
      [deletedIds],
    );

    const aggregate = fkAggregateResult.rows[0];

    const aggregateValues = {
      BusinessPartner: Number(aggregate.businessPartner),
      "CommodityTransaction.destination":
        Number(aggregate.destinationTransaction),
      "CommodityTransaction.source": Number(aggregate.sourceTransaction),
      Farm: Number(aggregate.farm),
      Farmer: Number(aggregate.farmer),
      Ward: Number(aggregate.ward),
    };

    console.table(aggregateValues);

    const aggregateTotal = Object.values(aggregateValues).reduce(
      (sum, value) => sum + value,
      0,
    );

    if (aggregateTotal !== 0) {
      fail(
        `Final aggregate FK reference count = ${aggregateTotal}; expected 0.`,
      );
    }

    pass("Final aggregate FK reference count = 0.");

    /*
     * ----------------------------------------------------------
     * FINAL PASS
     * ----------------------------------------------------------
     */

    console.log("\n============================================================");
    console.log("BATCH 1 POST-DELETE AUDIT: PASS");
    console.log("============================================================");

    console.log(`Deleted target IDs verified absent: ${deletedIds.length}`);
    console.log(
      `Remaining operational SubCounties: ${totalRemainingSubCounties}`,
    );
    console.log(`Remaining operational wards: ${totalRemainingWards}`);
    console.log(`FK references to deleted IDs: ${aggregateTotal}`);
    console.log(`Target counties verified: ${targets.length}`);

    console.log("\nCounty summary:");

    for (const target of targets) {
      console.log(
        `  ${target.countyId} ${target.countyName}: ` +
          `${target.expectedRemainingSubCounties} SubCounties, ` +
          `${target.expectedWardCount} wards`,
      );
    }

    console.log("\n============================================================");
    console.log("BATCH 1 IS CLOSED");
    console.log("============================================================");
    console.log(
      "43 legacy SubCounty records were deleted successfully.",
    );
    console.log(
      "Post-delete integrity verification confirms the deletion.",
    );
    console.log(
      "All surviving SubCounties match authoritative geography.",
    );
    console.log("No unexpected references were found.");
    console.log("No deleted target IDs remain.");
    console.log("No database changes were made by this audit.");
  } catch (error) {
    console.error("\n============================================================");
    console.error("BATCH 1 POST-DELETE AUDIT: FAILED");
    console.error("============================================================");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("\nUNHANDLED AUDIT ERROR:");

  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});