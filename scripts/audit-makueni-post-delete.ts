import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const DELETED_IDS = [
  1360,
  1361,
  1362,
  1363,
  1365,
  1366,
  1367,
  1368,
] as const;

const OPERATIONAL = [
  { id: 358, name: "Mbooni", expectedWards: 6 },
  { id: 359, name: "Kilome", expectedWards: 3 },
  { id: 360, name: "Kaiti", expectedWards: 4 },
  { id: 362, name: "Kibwezi West", expectedWards: 6 },
  { id: 401, name: "Kibwezi East", expectedWards: 4 },
  { id: 1364, name: "Makueni", expectedWards: 7 },
] as const;

async function main() {
  console.log("============================================================");
  console.log("POST-DELETION MAKUENI STRUCTURAL AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log();

  let failures = 0;

  // ----------------------------------------------------------
  // 1. Confirm deleted IDs are gone
  // ----------------------------------------------------------

  console.log("1. DELETED LEGACY RECORD CHECK");
  console.log("------------------------------------------------------------");

  const deletedRecords = await prisma.subCounty.findMany({
    where: {
      id: {
        in: [...DELETED_IDS],
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  console.log(
    `Deleted IDs still present: ${deletedRecords.length}/${DELETED_IDS.length}`
  );

  if (deletedRecords.length !== 0) {
    console.log("FAIL | Deleted legacy records still exist.");

    for (const record of deletedRecords) {
      console.log(
        `FOUND | ID ${record.id} | ${record.name}`
      );
    }

    failures++;
  } else {
    console.log("PASS | All 8 deleted legacy IDs are absent.");
  }

  console.log();

  // ----------------------------------------------------------
  // 2. Confirm operational SubCounties
  // ----------------------------------------------------------

  console.log("2. OPERATIONAL SUBCOUNTY CHECK");
  console.log("------------------------------------------------------------");

  const operationalIds = OPERATIONAL.map((item) => item.id);

  const operationalRecords = await prisma.subCounty.findMany({
    where: {
      id: {
        in: operationalIds,
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
    `Operational records found: ${operationalRecords.length}/${OPERATIONAL.length}`
  );

  if (operationalRecords.length !== OPERATIONAL.length) {
    console.log("FAIL | One or more operational SubCounties are missing.");
    failures++;
  }

  for (const expected of OPERATIONAL) {
    const actual = operationalRecords.find(
      (record) => record.id === expected.id
    );

    if (!actual) {
      console.log(
        `FAIL | Missing operational ID ${expected.id} (${expected.name})`
      );
      continue;
    }

    console.log(
      `FOUND | ID ${actual.id} | ${actual.name} | County ${actual.countyId}`
    );

    if (actual.countyId !== 74) {
      console.log(
        `FAIL | ID ${actual.id} belongs to County ${actual.countyId}, expected 74`
      );
      failures++;
    }
  }

  console.log();

  // ----------------------------------------------------------
  // 3. Verify operational Ward counts
  // ----------------------------------------------------------

  console.log("3. OPERATIONAL WARD COUNTS");
  console.log("------------------------------------------------------------");

  for (const expected of OPERATIONAL) {
    const wardCount = await prisma.ward.count({
      where: {
        subCountyId: expected.id,
      },
    });

    console.log(
      `ID ${expected.id} | ${expected.name} | Wards=${wardCount} | Expected=${expected.expectedWards}`
    );

    if (wardCount !== expected.expectedWards) {
      console.log(
        `FAIL | Ward count mismatch for ${expected.name}`
      );
      failures++;
    } else {
      console.log("PASS");
    }
  }

  console.log();

  // ----------------------------------------------------------
  // 4. Verify no Ward references deleted SubCounty IDs
  // ----------------------------------------------------------

  console.log("4. DELETED SUBCOUNTY WARD REFERENCES");
  console.log("------------------------------------------------------------");

  const deletedWardCount = await prisma.ward.count({
    where: {
      subCountyId: {
        in: [...DELETED_IDS],
      },
    },
  });

  console.log(
    `Wards referencing deleted SubCounty IDs: ${deletedWardCount}`
  );

  if (deletedWardCount !== 0) {
    console.log(
      "FAIL | Ward records still reference deleted SubCounty IDs."
    );
    failures++;
  } else {
    console.log(
      "PASS | No Ward records reference deleted SubCounty IDs."
    );
  }

  console.log();

  // ----------------------------------------------------------
  // 5. Verify no Farmers reference deleted IDs
  // ----------------------------------------------------------

  console.log("5. FARMER REFERENCES");
  console.log("------------------------------------------------------------");

  const deletedFarmerCount = await prisma.farmer.count({
    where: {
      subCountyId: {
        in: [...DELETED_IDS],
      },
    },
  });

  console.log(
    `Farmers referencing deleted SubCounty IDs: ${deletedFarmerCount}`
  );

  if (deletedFarmerCount !== 0) {
    console.log(
      "FAIL | Farmers still reference deleted SubCounty IDs."
    );
    failures++;
  } else {
    console.log("PASS | No Farmer references remain.");
  }

  console.log();

  // ----------------------------------------------------------
  // 6. Verify no Farms reference deleted IDs
  // ----------------------------------------------------------

  console.log("6. FARM REFERENCES");
  console.log("------------------------------------------------------------");

  const deletedFarmCount = await prisma.farm.count({
    where: {
      subCountyId: {
        in: [...DELETED_IDS],
      },
    },
  });

  console.log(
    `Farms referencing deleted SubCounty IDs: ${deletedFarmCount}`
  );

  if (deletedFarmCount !== 0) {
    console.log(
      "FAIL | Farms still reference deleted SubCounty IDs."
    );
    failures++;
  } else {
    console.log("PASS | No Farm references remain.");
  }

  console.log();

  // ----------------------------------------------------------
  // 7. Verify BusinessPartner references
  // ----------------------------------------------------------

  console.log("7. BUSINESS PARTNER REFERENCES");
  console.log("------------------------------------------------------------");

  const deletedBusinessPartnerCount =
    await prisma.businessPartner.count({
      where: {
        subCountyId: {
          in: [...DELETED_IDS],
        },
      },
    });

  console.log(
    `BusinessPartners referencing deleted IDs: ${deletedBusinessPartnerCount}`
  );

  if (deletedBusinessPartnerCount !== 0) {
    console.log(
      "FAIL | BusinessPartner references remain."
    );
    failures++;
  } else {
    console.log("PASS | No BusinessPartner references remain.");
  }

  console.log();

  // ----------------------------------------------------------
  // 8. Verify CommodityTransaction source references
  // ----------------------------------------------------------

  console.log("8. COMMODITY TRANSACTION SOURCE REFERENCES");
  console.log("------------------------------------------------------------");

  const sourceTransactionCount =
    await prisma.commodityTransaction.count({
      where: {
        sourceSubCountyId: {
          in: [...DELETED_IDS],
        },
      },
    });

  console.log(
    `Source transactions referencing deleted IDs: ${sourceTransactionCount}`
  );

  if (sourceTransactionCount !== 0) {
    console.log(
      "FAIL | Source transaction references remain."
    );
    failures++;
  } else {
    console.log("PASS | No source transaction references remain.");
  }

  console.log();

  // ----------------------------------------------------------
  // 9. Verify CommodityTransaction destination references
  // ----------------------------------------------------------

  console.log("9. COMMODITY TRANSACTION DESTINATION REFERENCES");
  console.log("------------------------------------------------------------");

  const destinationTransactionCount =
    await prisma.commodityTransaction.count({
      where: {
        destinationSubCountyId: {
          in: [...DELETED_IDS],
        },
      },
    });

  console.log(
    `Destination transactions referencing deleted IDs: ${destinationTransactionCount}`
  );

  if (destinationTransactionCount !== 0) {
    console.log(
      "FAIL | Destination transaction references remain."
    );
    failures++;
  } else {
    console.log(
      "PASS | No destination transaction references remain."
    );
  }

  console.log();

  // ----------------------------------------------------------
  // 10. Count remaining Makueni SubCounties
  // ----------------------------------------------------------

  console.log("10. FINAL MAKUENI SUBCOUNTY STRUCTURE");
  console.log("------------------------------------------------------------");

  const makueniSubCounties = await prisma.subCounty.findMany({
    where: {
      countyId: 74,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `Makueni SubCounties remaining: ${makueniSubCounties.length}`
  );

  for (const subCounty of makueniSubCounties) {
    const wardCount = await prisma.ward.count({
      where: {
        subCountyId: subCounty.id,
      },
    });

    console.log(
      `ID ${subCounty.id} | ${subCounty.name} | Wards=${wardCount}`
    );
  }

  console.log();

  if (makueniSubCounties.length !== 6) {
    console.log(
      `FAIL | Expected exactly 6 operational Makueni SubCounties, found ${makueniSubCounties.length}.`
    );
    failures++;
  } else {
    console.log(
      "PASS | Makueni now contains exactly 6 operational SubCounties."
    );
  }

  console.log();

  // ----------------------------------------------------------
  // 11. Total Makueni operational wards
  // ----------------------------------------------------------

  console.log("11. TOTAL OPERATIONAL MAKUENI WARDS");
  console.log("------------------------------------------------------------");

  const totalOperationalWards = await prisma.ward.count({
    where: {
      subCountyId: {
        in: operationalIds,
      },
    },
  });

  console.log(
    `Operational Makueni wards: ${totalOperationalWards}`
  );

  if (totalOperationalWards !== 30) {
    console.log(
      `FAIL | Expected 30 operational wards, found ${totalOperationalWards}.`
    );
    failures++;
  } else {
    console.log("PASS | All 30 operational wards remain.");
  }

  console.log();

  // ----------------------------------------------------------
  // 12. Final result
  // ----------------------------------------------------------

  console.log("============================================================");
  console.log("FINAL POST-DELETION RESULT");
  console.log("============================================================");

  if (failures === 0) {
    console.log("PASS");
    console.log();
    console.log("8 legacy SubCounty records are permanently absent.");
    console.log("6 operational Makueni SubCounties remain.");
    console.log("30 operational Makueni wards remain.");
    console.log("No deleted SubCounty has Ward references.");
    console.log("No deleted SubCounty has Farmer references.");
    console.log("No deleted SubCounty has Farm references.");
    console.log("No deleted SubCounty has BusinessPartner references.");
    console.log("No deleted SubCounty has source transaction references.");
    console.log("No deleted SubCounty has destination transaction references.");
    console.log();
    console.log("MAKUENI GEOGRAPHY POST-DELETION AUDIT PASSED.");
    console.log("============================================================");
  } else {
    console.log("FAIL");
    console.log();
    console.log(`Total failures: ${failures}`);
    console.log();
    console.log(
      "STOP — investigate the failed checks before making any further database changes."
    );
    console.log("============================================================");

    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });