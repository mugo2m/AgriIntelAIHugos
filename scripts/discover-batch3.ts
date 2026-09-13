import { prisma } from "../lib/prisma";

const COMPLETED_COUNTY_IDS = [
  51, // Homa Bay
  53, // Bungoma
  54, // Kakamega
  56, // Kericho
  64, // Marsabit
  65, // Meru
  67, // Nyandarua
  68, // Kitui
  74, // Makueni
  79, // Nairobi City
  87, // Kisii
];

async function main() {
  console.log("=".repeat(100));
  console.log("BATCH 3 DISCOVERY — READ ONLY");
  console.log("=".repeat(100));

  console.log("\nCompleted counties excluded:");
  console.log(COMPLETED_COUNTY_IDS.join(", "));

  /*
   * STEP 1
   * Confirm that exactly 36 counties remain.
   */
  const countyCountRows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM "County"
    WHERE id NOT IN (
      ${COMPLETED_COUNTY_IDS[0]},
      ${COMPLETED_COUNTY_IDS[1]},
      ${COMPLETED_COUNTY_IDS[2]},
      ${COMPLETED_COUNTY_IDS[3]},
      ${COMPLETED_COUNTY_IDS[4]},
      ${COMPLETED_COUNTY_IDS[5]},
      ${COMPLETED_COUNTY_IDS[6]},
      ${COMPLETED_COUNTY_IDS[7]},
      ${COMPLETED_COUNTY_IDS[8]},
      ${COMPLETED_COUNTY_IDS[9]},
      ${COMPLETED_COUNTY_IDS[10]}
    )
  `;

  const remainingCountyCount = Number(countyCountRows[0].count);

  console.log(`\nRemaining counties: ${remainingCountyCount}`);

  if (remainingCountyCount !== 36) {
    throw new Error(
      `SAFETY STOP: Expected 36 remaining counties but found ${remainingCountyCount}.`
    );
  }

  console.log("PASS: Exactly 36 counties remain for Batch 3.");

  /*
   * STEP 2
   * List all remaining counties.
   */
  const counties = await prisma.$queryRaw<
    Array<{
      id: number;
      name: string;
    }>
  >`
    SELECT
      id,
      name
    FROM "County"
    WHERE id NOT IN (
      ${COMPLETED_COUNTY_IDS[0]},
      ${COMPLETED_COUNTY_IDS[1]},
      ${COMPLETED_COUNTY_IDS[2]},
      ${COMPLETED_COUNTY_IDS[3]},
      ${COMPLETED_COUNTY_IDS[4]},
      ${COMPLETED_COUNTY_IDS[5]},
      ${COMPLETED_COUNTY_IDS[6]},
      ${COMPLETED_COUNTY_IDS[7]},
      ${COMPLETED_COUNTY_IDS[8]},
      ${COMPLETED_COUNTY_IDS[9]},
      ${COMPLETED_COUNTY_IDS[10]}
    )
    ORDER BY id
  `;

  if (counties.length !== 36) {
    throw new Error(
      `SAFETY STOP: Expected 36 county records but retrieved ${counties.length}.`
    );
  }

  console.log("\n" + "-".repeat(100));
  console.log("36 REMAINING COUNTIES");
  console.log("-".repeat(100));

  for (const county of counties) {
    console.log(`${county.id}\t${county.name}`);
  }

  /*
   * STEP 3
   * Inspect every SubCounty in the remaining 36 counties.
   *
   * For each SubCounty we calculate:
   *
   *   - Ward references
   *   - BusinessPartner references
   *   - CommodityTransaction destination references
   *   - CommodityTransaction source references
   *   - Farm references
   *   - Farmer references
   *
   * This query is READ ONLY.
   */
  const rows = await prisma.$queryRaw<
    Array<{
      countyId: number;
      county: string;
      subCountyId: number;
      subCounty: string;
      wardRefs: number;
      businessPartnerRefs: number;
      commodityDestinationRefs: number;
      commoditySourceRefs: number;
      farmRefs: number;
      farmerRefs: number;
    }>
  >`
    SELECT
      c.id AS "countyId",
      c.name AS county,
      sc.id AS "subCountyId",
      sc.name AS "subCounty",

      (
        SELECT COUNT(*)::int
        FROM "Ward" w
        WHERE w."subCountyId" = sc.id
      ) AS "wardRefs",

      (
        SELECT COUNT(*)::int
        FROM "BusinessPartner" bp
        WHERE bp."subCountyId" = sc.id
      ) AS "businessPartnerRefs",

      (
        SELECT COUNT(*)::int
        FROM "CommodityTransaction" ct
        WHERE ct."destinationSubCountyId" = sc.id
      ) AS "commodityDestinationRefs",

      (
        SELECT COUNT(*)::int
        FROM "CommodityTransaction" ct
        WHERE ct."sourceSubCountyId" = sc.id
      ) AS "commoditySourceRefs",

      (
        SELECT COUNT(*)::int
        FROM "Farm" f
        WHERE f."subCountyId" = sc.id
      ) AS "farmRefs",

      (
        SELECT COUNT(*)::int
        FROM "Farmer" f
        WHERE f."subCountyId" = sc.id
      ) AS "farmerRefs"

    FROM "SubCounty" sc
    INNER JOIN "County" c
      ON c.id = sc."countyId"

    WHERE c.id NOT IN (
      ${COMPLETED_COUNTY_IDS[0]},
      ${COMPLETED_COUNTY_IDS[1]},
      ${COMPLETED_COUNTY_IDS[2]},
      ${COMPLETED_COUNTY_IDS[3]},
      ${COMPLETED_COUNTY_IDS[4]},
      ${COMPLETED_COUNTY_IDS[5]},
      ${COMPLETED_COUNTY_IDS[6]},
      ${COMPLETED_COUNTY_IDS[7]},
      ${COMPLETED_COUNTY_IDS[8]},
      ${COMPLETED_COUNTY_IDS[9]},
      ${COMPLETED_COUNTY_IDS[10]}
    )

    ORDER BY
      c.id,
      sc.id
  `;

  console.log("\n" + "=".repeat(100));
  console.log("ALL BATCH 3 SUBCOUNTIES");
  console.log("=".repeat(100));

  for (const row of rows) {
    console.log(
      `${row.countyId}\t${row.county}\t${row.subCountyId}\t${row.subCounty}\t` +
        `wards=${row.wardRefs}\t` +
        `BP=${row.businessPartnerRefs}\t` +
        `CT-D=${row.commodityDestinationRefs}\t` +
        `CT-S=${row.commoditySourceRefs}\t` +
        `Farm=${row.farmRefs}\t` +
        `Farmer=${row.farmerRefs}`
    );
  }

  /*
   * STEP 4
   * Identify preliminary candidates.
   *
   * A preliminary candidate MUST have:
   *
   *   Ward refs = 0
   *   BusinessPartner refs = 0
   *   Commodity destination refs = 0
   *   Commodity source refs = 0
   *   Farm refs = 0
   *   Farmer refs = 0
   *
   * These are NOT deletion approvals.
   *
   * They must still pass the authoritative GeoJSON audit.
   */
  const candidates = rows.filter(
    (row) =>
      row.wardRefs === 0 &&
      row.businessPartnerRefs === 0 &&
      row.commodityDestinationRefs === 0 &&
      row.commoditySourceRefs === 0 &&
      row.farmRefs === 0 &&
      row.farmerRefs === 0
  );

  console.log("\n" + "=".repeat(100));
  console.log("PRELIMINARY ZERO-WARD / ZERO-REFERENCE CANDIDATES");
  console.log("=".repeat(100));

  if (candidates.length === 0) {
    console.log("No preliminary candidates found.");
  } else {
    for (const row of candidates) {
      console.log(
        `${row.subCountyId}\t${row.subCounty}\tCounty ${row.countyId} ${row.county}\t` +
          `wards=${row.wardRefs}\t` +
          `BP=${row.businessPartnerRefs}\t` +
          `CT-D=${row.commodityDestinationRefs}\t` +
          `CT-S=${row.commoditySourceRefs}\t` +
          `Farm=${row.farmRefs}\t` +
          `Farmer=${row.farmerRefs}`
      );
    }
  }

  /*
   * STEP 5
   * County-level summary.
   */
  console.log("\n" + "=".repeat(100));
  console.log("COUNTY SUMMARY");
  console.log("=".repeat(100));

  const summary = new Map<
    number,
    {
      county: string;
      subCounties: number;
      zeroWard: number;
      zeroWardZeroRefs: number;
    }
  >();

  for (const row of rows) {
    if (!summary.has(row.countyId)) {
      summary.set(row.countyId, {
        county: row.county,
        subCounties: 0,
        zeroWard: 0,
        zeroWardZeroRefs: 0,
      });
    }

    const item = summary.get(row.countyId)!;

    item.subCounties += 1;

    if (row.wardRefs === 0) {
      item.zeroWard += 1;
    }

    if (
      row.wardRefs === 0 &&
      row.businessPartnerRefs === 0 &&
      row.commodityDestinationRefs === 0 &&
      row.commoditySourceRefs === 0 &&
      row.farmRefs === 0 &&
      row.farmerRefs === 0
    ) {
      item.zeroWardZeroRefs += 1;
    }
  }

  for (const [countyId, item] of summary) {
    console.log(
      `${countyId}\t${item.county}\t` +
        `SubCounties=${item.subCounties}\t` +
        `ZeroWard=${item.zeroWard}\t` +
        `ZeroWardZeroRefs=${item.zeroWardZeroRefs}`
    );
  }

  /*
   * STEP 6
   * Final discovery statistics.
   */
  const totalSubCounties = rows.length;
  const zeroWardCount = rows.filter((r) => r.wardRefs === 0).length;

  console.log("\n" + "=".repeat(100));
  console.log("BATCH 3 DISCOVERY SUMMARY");
  console.log("=".repeat(100));

  console.log(`Completed counties excluded: ${COMPLETED_COUNTY_IDS.length}`);
  console.log(`Remaining counties: ${counties.length}`);
  console.log(`Total SubCounties inspected: ${totalSubCounties}`);
  console.log(`Zero-ward SubCounties: ${zeroWardCount}`);
  console.log(
    `Zero-ward + zero-reference candidates: ${candidates.length}`
  );

  console.log("\n" + "-".repeat(100));
  console.log("SAFETY STATUS");
  console.log("-".repeat(100));

  console.log("Database operation: READ ONLY");
  console.log("INSERT: NONE");
  console.log("UPDATE: NONE");
  console.log("DELETE: NONE");

  console.log("\nIMPORTANT:");
  console.log(
    "The preliminary candidates are NOT approved for deletion."
  );
  console.log(
    "They must pass the authoritative GeoJSON comparison."
  );
  console.log(
    "Only after that will we create the exact Batch 3 deletion whitelist."
  );

  console.log("\n" + "=".repeat(100));
  console.log("BATCH 3 DISCOVERY: COMPLETE");
  console.log("READ ONLY — NO DATABASE CHANGES WERE MADE.");
  console.log("=".repeat(100));
}

main()
  .catch((error) => {
    console.error("\nBATCH 3 DISCOVERY: FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });