import prisma from "../lib/prisma";

const BARINGO_COUNTY_ID = 90;
const IDS_TO_DELETE = [753, 758];

async function main() {
  console.log("=== BARINGO DUPLICATE SUBCOUNTY CLEANUP ===");
  console.log(`Target IDs: ${IDS_TO_DELETE.join(", ")}`);
  console.log("Safety checks starting...\n");

  // 1. Verify Baringo
  const county = await prisma.county.findUnique({
    where: { id: BARINGO_COUNTY_ID },
    select: {
      id: true,
      name: true,
    },
  });

  if (!county || county.name !== "Baringo") {
    throw new Error(
      "SAFETY CHECK FAILED: County 90 is not Baringo.",
    );
  }

  // 2. Verify exactly the two expected records exist
  const records = await prisma.subCounty.findMany({
    where: {
      id: { in: IDS_TO_DELETE },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      _count: {
        select: {
          wards: true,
          farmers: true,
          farms: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  console.table(records);

  if (records.length !== IDS_TO_DELETE.length) {
    throw new Error(
      `SAFETY CHECK FAILED: Expected ${IDS_TO_DELETE.length} records, found ${records.length}. Nothing deleted.`,
    );
  }

  // 3. Verify every record belongs to Baringo
  const wrongCounty = records.filter(
    (record) => record.countyId !== BARINGO_COUNTY_ID,
  );

  if (wrongCounty.length > 0) {
    console.table(wrongCounty);
    throw new Error(
      "SAFETY CHECK FAILED: One or more records do not belong to Baringo. Nothing deleted.",
    );
  }

  // 4. Verify both records are completely unused
  const referenced = records.filter(
    (record) =>
      record._count.wards > 0 ||
      record._count.farmers > 0 ||
      record._count.farms > 0,
  );

  if (referenced.length > 0) {
    console.table(referenced);
    throw new Error(
      "SAFETY CHECK FAILED: One or more records are referenced. Nothing deleted.",
    );
  }

  // 5. Verify exact expected names
  const expectedNames = new Map<number, string>([
    [753, "East Pokot"],
    [758, "Lake Baringo"],
  ]);

  for (const record of records) {
    const expectedName = expectedNames.get(record.id);

    if (record.name !== expectedName) {
      throw new Error(
        `SAFETY CHECK FAILED: ID ${record.id} expected "${expectedName}", found "${record.name}". Nothing deleted.`,
      );
    }
  }

  console.log("\nALL SAFETY CHECKS PASSED.");
  console.log("Both records belong to Baringo and have:");
  console.log("- 0 wards");
  console.log("- 0 farmers");
  console.log("- 0 farms");
  console.log("\nProceeding with deletion...\n");

  // 6. Delete ONLY the two verified IDs
  const result = await prisma.subCounty.deleteMany({
    where: {
      id: { in: IDS_TO_DELETE },
      countyId: BARINGO_COUNTY_ID,
    },
  });

  console.log(`Deleted records: ${result.count}`);

  if (result.count !== IDS_TO_DELETE.length) {
    throw new Error(
      `DELETE COUNT CHECK FAILED: Expected ${IDS_TO_DELETE.length}, deleted ${result.count}.`,
    );
  }

  // 7. Final verification
  const remaining = await prisma.subCounty.findMany({
    where: {
      id: { in: IDS_TO_DELETE },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (remaining.length !== 0) {
    console.table(remaining);
    throw new Error(
      "FINAL CHECK FAILED: One or more target records still exist.",
    );
  }

  console.log("\nSUCCESS: Baringo cleanup completed.");
  console.log("Deleted ONLY:");
  console.log("753 - East Pokot");
  console.log("758 - Lake Baringo");
}

main()
  .catch((error) => {
    console.error("\nCLEANUP FAILED:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });