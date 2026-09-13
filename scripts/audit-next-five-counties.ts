import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type CountyRow = {
  countyId: number;
  countyName: string;
  subCountyCount: number;
  emptySubCountyCount: number;
  zeroWardSubCountyCount: number;
  referencedSubCountyCount: number;
};

type SubCountyRow = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
  wardCount: number;
  farmerCount: number;
  farmCount: number;
  businessPartnerCount: number;
  sourceTransactionCount: number;
  destinationTransactionCount: number;
  totalReferences: number;
};

const completedCountyIds = [51, 53, 54, 68, 74, 87];

function pass(message: string): void {
  console.log(`✅ ${message}`);
}

function fail(message: string): never {
  console.error(`\n❌ FAIL: ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

async function main(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("============================================================");
    console.log("NEXT FIVE COUNTIES DISCOVERY — BATCH 2");
    console.log("READ-ONLY — NO DATABASE CHANGES");
    console.log("============================================================\n");

    console.log(
      `Completed counties excluded: ${completedCountyIds.join(", ")}`,
    );

    /*
     * ----------------------------------------------------------
     * 1. Verify completed counties exist
     * ----------------------------------------------------------
     */

    console.log("\n1. VERIFY COMPLETED COUNTIES");

    const completedResult = await client.query<{
      id: number;
      name: string;
    }>(
      `
      SELECT
        id,
        name
      FROM "County"
      WHERE id = ANY($1::int[])
      ORDER BY id
      `,
      [completedCountyIds],
    );

    if (completedResult.rows.length !== completedCountyIds.length) {
      console.table(completedResult.rows);

      fail(
        `Expected ${completedCountyIds.length} completed counties to exist, found ${completedResult.rows.length}.`,
      );
    }

    for (const row of completedResult.rows) {
      console.log(`   ${row.id}: ${row.name}`);
    }

    pass("All completed counties exist.");

    /*
     * ----------------------------------------------------------
     * 2. Discover all remaining counties
     * ----------------------------------------------------------
     */

    console.log("\n2. DISCOVER REMAINING COUNTIES");

    const countyResult = await client.query<CountyRow>(
      `
      SELECT
        c.id AS "countyId",
        c.name AS "countyName",

        COUNT(DISTINCT sc.id)::int AS "subCountyCount",

        COUNT(
          DISTINCT CASE
            WHEN sc.id IS NOT NULL
              AND NOT EXISTS (
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
                FROM "Farm" fm
                WHERE fm."subCountyId" = sc.id
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
            THEN sc.id
          END
        )::int AS "emptySubCountyCount",

        COUNT(
          DISTINCT CASE
            WHEN sc.id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1
                FROM "Ward" w
                WHERE w."subCountyId" = sc.id
              )
            THEN sc.id
          END
        )::int AS "zeroWardSubCountyCount",

        COUNT(
          DISTINCT CASE
            WHEN sc.id IS NOT NULL
              AND (
                EXISTS (
                  SELECT 1
                  FROM "Farmer" f
                  WHERE f."subCountyId" = sc.id
                )
                OR EXISTS (
                  SELECT 1
                  FROM "Farm" fm
                  WHERE fm."subCountyId" = sc.id
                )
                OR EXISTS (
                  SELECT 1
                  FROM "BusinessPartner" bp
                  WHERE bp."subCountyId" = sc.id
                )
                OR EXISTS (
                  SELECT 1
                  FROM "CommodityTransaction" ct
                  WHERE ct."sourceSubCountyId" = sc.id
                )
                OR EXISTS (
                  SELECT 1
                  FROM "CommodityTransaction" ct
                  WHERE ct."destinationSubCountyId" = sc.id
                )
              )
            THEN sc.id
          END
        )::int AS "referencedSubCountyCount"

      FROM "County" c
      LEFT JOIN "SubCounty" sc
        ON sc."countyId" = c.id

      WHERE c.id <> ALL($1::int[])

      GROUP BY
        c.id,
        c.name

      ORDER BY
        "emptySubCountyCount" DESC,
        "zeroWardSubCountyCount" DESC,
        "subCountyCount" DESC,
        c.id
      `,
      [completedCountyIds],
    );

    if (countyResult.rows.length === 0) {
      fail("No remaining counties were found.");
    }

    console.log(
      `Remaining counties available for discovery: ${countyResult.rows.length}`,
    );

    /*
     * ----------------------------------------------------------
     * 3. Print ranking
     * ----------------------------------------------------------
     */

    console.log("\n3. COUNTY CLEANUP SIGNAL RANKING");

    console.table(
      countyResult.rows.map((row, index) => ({
        Rank: index + 1,
        CountyID: row.countyId,
        County: row.countyName,
        SubCounties: row.subCountyCount,
        EmptyCandidates: row.emptySubCountyCount,
        ZeroWard: row.zeroWardSubCountyCount,
        Referenced: row.referencedSubCountyCount,
      })),
    );

    /*
     * ----------------------------------------------------------
     * 4. Select next five
     * ----------------------------------------------------------
     */

    const selectedCounties = countyResult.rows.slice(0, 5);

    if (selectedCounties.length !== 5) {
      fail(
        `Expected to select 5 counties, but only ${selectedCounties.length} were available.`,
      );
    }

    console.log("\n============================================================");
    console.log("SELECTED NEXT FIVE COUNTIES");
    console.log("============================================================");

    for (let i = 0; i < selectedCounties.length; i++) {
      const county = selectedCounties[i];

      console.log(
        `${i + 1}. County ${county.countyId} — ${county.countyName}`,
      );
      console.log(
        `   SubCounties: ${county.subCountyCount}`,
      );
      console.log(
        `   Empty candidates: ${county.emptySubCountyCount}`,
      );
      console.log(
        `   Zero-ward candidates: ${county.zeroWardSubCountyCount}`,
      );
      console.log(
        `   Referenced SubCounties: ${county.referencedSubCountyCount}`,
      );
    }

    /*
     * ----------------------------------------------------------
     * 5. Detailed SubCounty discovery for selected counties
     * ----------------------------------------------------------
     */

    console.log("\n============================================================");
    console.log("DETAILED SUBCOUNTY DISCOVERY");
    console.log("============================================================");

    const selectedCountyIds = selectedCounties.map(
      (county) => county.countyId,
    );

    const subCountyResult = await client.query<SubCountyRow>(
      `
      SELECT
        sc.id,
        sc.name,
        sc."countyId",
        c.name AS "countyName",

        (
          SELECT COUNT(*)::int
          FROM "Ward" w
          WHERE w."subCountyId" = sc.id
        ) AS "wardCount",

        (
          SELECT COUNT(*)::int
          FROM "Farmer" f
          WHERE f."subCountyId" = sc.id
        ) AS "farmerCount",

        (
          SELECT COUNT(*)::int
          FROM "Farm" fm
          WHERE fm."subCountyId" = sc.id
        ) AS "farmCount",

        (
          SELECT COUNT(*)::int
          FROM "BusinessPartner" bp
          WHERE bp."subCountyId" = sc.id
        ) AS "businessPartnerCount",

        (
          SELECT COUNT(*)::int
          FROM "CommodityTransaction" ct
          WHERE ct."sourceSubCountyId" = sc.id
        ) AS "sourceTransactionCount",

        (
          SELECT COUNT(*)::int
          FROM "CommodityTransaction" ct
          WHERE ct."destinationSubCountyId" = sc.id
        ) AS "destinationTransactionCount",

        (
          (
            SELECT COUNT(*)
            FROM "Farmer" f
            WHERE f."subCountyId" = sc.id
          )
          +
          (
            SELECT COUNT(*)
            FROM "Farm" fm
            WHERE fm."subCountyId" = sc.id
          )
          +
          (
            SELECT COUNT(*)
            FROM "BusinessPartner" bp
            WHERE bp."subCountyId" = sc.id
          )
          +
          (
            SELECT COUNT(*)
            FROM "CommodityTransaction" ct
            WHERE ct."sourceSubCountyId" = sc.id
          )
          +
          (
            SELECT COUNT(*)
            FROM "CommodityTransaction" ct
            WHERE ct."destinationSubCountyId" = sc.id
          )
        )::int AS "totalReferences"

      FROM "SubCounty" sc

      INNER JOIN "County" c
        ON c.id = sc."countyId"

      WHERE sc."countyId" = ANY($1::int[])

      ORDER BY
        sc."countyId",
        "totalReferences",
        "wardCount",
        sc.id
      `,
      [selectedCountyIds],
    );

    /*
     * ----------------------------------------------------------
     * 6. Print candidates
     * ----------------------------------------------------------
     */

    for (const county of selectedCounties) {
      const rows = subCountyResult.rows.filter(
        (row) => Number(row.countyId) === county.countyId,
      );

      console.log(
        `\n------------------------------------------------------------`,
      );

      console.log(
        `COUNTY ${county.countyId}: ${county.countyName}`,
      );

      console.log(
        `SubCounties: ${rows.length}`,
      );

      const candidates = rows.filter(
        (row) =>
          row.wardCount === 0 &&
          row.totalReferences === 0,
      );

      console.log(
        `Safe-looking empty candidates: ${candidates.length}`,
      );

      console.table(
        rows.map((row) => ({
          ID: row.id,
          SubCounty: row.name,
          Wards: row.wardCount,
          Farmers: row.farmerCount,
          Farms: row.farmCount,
          Partners: row.businessPartnerCount,
          SourceTx: row.sourceTransactionCount,
          DestinationTx: row.destinationTransactionCount,
          TotalRefs: row.totalReferences,
          Candidate:
            row.wardCount === 0 &&
            row.totalReferences === 0
              ? "YES"
              : "NO",
        })),
      );
    }

    /*
     * ----------------------------------------------------------
     * 7. Aggregate selected-county summary
     * ----------------------------------------------------------
     */

    console.log("\n============================================================");
    console.log("BATCH 2 DISCOVERY SUMMARY");
    console.log("============================================================");

    const totalSubCounties = selectedCounties.reduce(
      (sum, county) => sum + county.subCountyCount,
      0,
    );

    const totalCandidates = selectedCounties.reduce(
      (sum, county) => sum + county.emptySubCountyCount,
      0,
    );

    const totalZeroWard = selectedCounties.reduce(
      (sum, county) => sum + county.zeroWardSubCountyCount,
      0,
    );

    console.log(`Selected counties: ${selectedCounties.length}`);
    console.log(`SubCounties in scope: ${totalSubCounties}`);
    console.log(`Empty candidates: ${totalCandidates}`);
    console.log(`Zero-ward candidates: ${totalZeroWard}`);

    console.log("\nSelected county IDs:");
    console.log(selectedCountyIds.join(", "));

    console.log("\n============================================================");
    console.log("DISCOVERY COMPLETE");
    console.log("============================================================");

    pass(
      "Batch 2 candidate discovery completed successfully with no database changes.",
    );

    console.log(
      "\nNEXT STEP: Run the authoritative audit against these candidates before any deletion.",
    );
  } catch (error) {
    console.error("\n============================================================");
    console.error("BATCH 2 DISCOVERY FAILED");
    console.error("============================================================");

    if (error instanceof Error) {
      console.error(error.stack ?? error.message);
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
  console.error("\nUNHANDLED ERROR:");

  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});