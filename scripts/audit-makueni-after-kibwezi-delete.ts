import "dotenv/config";
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

const MAKUENI_COUNTY_ID = 74;
const DELETED_SUBCOUNTY_ID = 666;
const KIBWEZI_WEST_ID = 362;
const KIBWEZI_EAST_ID = 401;

async function main() {
  console.log("=".repeat(70));
  console.log("POST-DELETION MAKUENI INTEGRITY AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("=".repeat(70));

  // ------------------------------------------------------------
  // 1. COUNTY
  // ------------------------------------------------------------

  console.log("\n1. MAKUENI COUNTY");

  const county = await prisma.county.findUnique({
    where: {
      id: MAKUENI_COUNTY_ID,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!county) {
    throw new Error(
      `Makueni County (${MAKUENI_COUNTY_ID}) was not found.`
    );
  }

  console.log(`ID: ${county.id}`);
  console.log(`Name: ${county.name}`);

  // ------------------------------------------------------------
  // 2. CONFIRM DELETED SUBCOUNTY
  // ------------------------------------------------------------

  console.log("\n2. DELETED SUBCOUNTY CHECK");

  const deletedSubCounty = await prisma.subCounty.findUnique({
    where: {
      id: DELETED_SUBCOUNTY_ID,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  if (deletedSubCounty) {
    console.log(
      `ERROR: SubCounty ${DELETED_SUBCOUNTY_ID} still exists.`
    );
  } else {
    console.log(
      `CONFIRMED: SubCounty ${DELETED_SUBCOUNTY_ID} no longer exists.`
    );
  }

  // ------------------------------------------------------------
  // 3. ALL CURRENT MAKUENI SUBCOUNTIES
  // ------------------------------------------------------------

  console.log("\n3. CURRENT MAKUENI SUBCOUNTIES");

  const subCounties = await prisma.subCounty.findMany({
    where: {
      countyId: MAKUENI_COUNTY_ID,
    },
    select: {
      id: true,
      name: true,
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

  console.log(
    `Current Makueni SubCounties: ${subCounties.length}`
  );

  for (const subCounty of subCounties) {
    console.log(
      `${subCounty.id} | ${subCounty.name} | ` +
        `Wards: ${subCounty._count.wards} | ` +
        `Farmers: ${subCounty._count.farmers} | ` +
        `Farms: ${subCounty._count.farms} | ` +
        `Business Partners: ${subCounty._count.businessPartners}`
    );
  }

  // ------------------------------------------------------------
  // 4. KIBWEZI WEST
  // ------------------------------------------------------------

  console.log("\n4. KIBWEZI WEST");

  const kibweziWest = await prisma.subCounty.findUnique({
    where: {
      id: KIBWEZI_WEST_ID,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      wards: {
        select: {
          id: true,
          name: true,
          code: true,
          constituencyId: true,
          subCountyId: true,
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  if (!kibweziWest) {
    throw new Error(
      `Kibwezi West SubCounty ${KIBWEZI_WEST_ID} was not found.`
    );
  }

  console.log(`ID: ${kibweziWest.id}`);
  console.log(`Name: ${kibweziWest.name}`);
  console.log(`County ID: ${kibweziWest.countyId}`);
  console.log(`Ward count: ${kibweziWest.wards.length}`);

  for (const ward of kibweziWest.wards) {
    console.log(
      `  Ward ${ward.id} | ${ward.name} | ` +
        `Code: ${ward.code ?? "NULL"} | ` +
        `Constituency: ${ward.constituencyId} | ` +
        `SubCounty: ${ward.subCountyId}`
    );
  }

  // ------------------------------------------------------------
  // 5. KIBWEZI EAST
  // ------------------------------------------------------------

  console.log("\n5. KIBWEZI EAST");

  const kibweziEast = await prisma.subCounty.findUnique({
    where: {
      id: KIBWEZI_EAST_ID,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      wards: {
        select: {
          id: true,
          name: true,
          code: true,
          constituencyId: true,
          subCountyId: true,
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  if (!kibweziEast) {
    throw new Error(
      `Kibwezi East SubCounty ${KIBWEZI_EAST_ID} was not found.`
    );
  }

  console.log(`ID: ${kibweziEast.id}`);
  console.log(`Name: ${kibweziEast.name}`);
  console.log(`County ID: ${kibweziEast.countyId}`);
  console.log(`Ward count: ${kibweziEast.wards.length}`);

  for (const ward of kibweziEast.wards) {
    console.log(
      `  Ward ${ward.id} | ${ward.name} | ` +
        `Code: ${ward.code ?? "NULL"} | ` +
        `Constituency: ${ward.constituencyId} | ` +
        `SubCounty: ${ward.subCountyId}`
    );
  }

  // ------------------------------------------------------------
  // 6. WARDS STILL REFERENCING DELETED 666
  // ------------------------------------------------------------

  console.log("\n6. WARDS REFERENCING DELETED SUBCOUNTY 666");

  const orphanedWards = await prisma.ward.findMany({
    where: {
      subCountyId: DELETED_SUBCOUNTY_ID,
    },
    select: {
      id: true,
      name: true,
      subCountyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `Wards referencing ${DELETED_SUBCOUNTY_ID}: ${orphanedWards.length}`
  );

  for (const ward of orphanedWards) {
    console.log(
      `  Ward ${ward.id} | ${ward.name} | SubCounty ${ward.subCountyId}`
    );
  }

  // ------------------------------------------------------------
  // 7. EAST/WEST WARD OVERLAP
  // ------------------------------------------------------------

  console.log("\n7. KIBWEZI EAST/WEST WARD OVERLAP");

  const westWardIds = new Set(
    kibweziWest.wards.map((ward) => ward.id)
  );

  const overlappingWards = kibweziEast.wards.filter((ward) =>
    westWardIds.has(ward.id)
  );

  console.log(
    `Kibwezi West wards: ${kibweziWest.wards.length}`
  );

  console.log(
    `Kibwezi East wards: ${kibweziEast.wards.length}`
  );

  console.log(
    `Ward ID overlap: ${overlappingWards.length}`
  );

  for (const ward of overlappingWards) {
    console.log(
      `  OVERLAP: Ward ${ward.id} | ${ward.name}`
    );
  }

  // ------------------------------------------------------------
  // 8. WARD SUBCOUNTY CONSISTENCY
  // ------------------------------------------------------------

  console.log("\n8. WARD → SUBCOUNTY CONSISTENCY");

  const makueniWards = await prisma.ward.findMany({
    where: {
      countyId: MAKUENI_COUNTY_ID,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `Makueni wards found: ${makueniWards.length}`
  );

  const invalidCountyAssignments =
    makueniWards.filter(
      (ward) =>
        ward.subCountyId !== null &&
        !subCounties.some(
          (subCounty) => subCounty.id === ward.subCountyId
        )
    );

  console.log(
    `Wards with invalid/missing Makueni SubCounty assignment: ${invalidCountyAssignments.length}`
  );

  for (const ward of invalidCountyAssignments) {
    console.log(
      `  Ward ${ward.id} | ${ward.name} | ` +
        `SubCounty ${ward.subCountyId}`
    );
  }

  // ------------------------------------------------------------
  // 9. KIBWEZI EAST/WEST COUNTY CONSISTENCY
  // ------------------------------------------------------------

  console.log("\n9. KIBWEZI EAST/WEST COUNTY CONSISTENCY");

  const westWrongCounty =
    kibweziWest.countyId !== MAKUENI_COUNTY_ID;

  const eastWrongCounty =
    kibweziEast.countyId !== MAKUENI_COUNTY_ID;

  console.log(
    `Kibwezi West county correct: ${!westWrongCounty}`
  );

  console.log(
    `Kibwezi East county correct: ${!eastWrongCounty}`
  );

  // ------------------------------------------------------------
  // 10. FINAL SUMMARY
  // ------------------------------------------------------------

  console.log("\n10. FINAL AUDIT SUMMARY");

  const deletedCorrectly =
    deletedSubCounty === null;

  const westCorrect =
    kibweziWest.countyId === MAKUENI_COUNTY_ID &&
    kibweziWest.wards.length === 6;

  const eastCorrect =
    kibweziEast.countyId === MAKUENI_COUNTY_ID &&
    kibweziEast.wards.length === 4;

  const noDeletedReferences =
    orphanedWards.length === 0;

  const noEastWestOverlap =
    overlappingWards.length === 0;

  const hierarchyConsistent =
    invalidCountyAssignments.length === 0;

  console.log(
    `Deleted SubCounty 666 absent: ${deletedCorrectly ? "YES" : "NO"}`
  );

  console.log(
    `Kibwezi West (362) correct: ${westCorrect ? "YES" : "NO"}`
  );

  console.log(
    `Kibwezi East (401) correct: ${eastCorrect ? "YES" : "NO"}`
  );

  console.log(
    `No wards reference 666: ${noDeletedReferences ? "YES" : "NO"}`
  );

  console.log(
    `East/West ward overlap: ${noEastWestOverlap ? "NONE" : "FOUND"}`
  );

  console.log(
    `Makueni hierarchy consistent: ${hierarchyConsistent ? "YES" : "NO"}`
  );

  const auditPassed =
    deletedCorrectly &&
    westCorrect &&
    eastCorrect &&
    noDeletedReferences &&
    noEastWestOverlap &&
    hierarchyConsistent &&
    !westWrongCounty &&
    !eastWrongCounty;

  console.log("\n" + "=".repeat(70));

  if (auditPassed) {
    console.log("AUDIT RESULT: PASSED");
    console.log(
      "Makueni hierarchy remains consistent after deletion."
    );
    console.log(
      "SubCounty 666 is gone and Kibwezi East/West remain intact."
    );
  } else {
    console.log("AUDIT RESULT: FAILED");
    console.log(
      "DO NOT RUN THE LOCATION LOADER."
    );
    console.log(
      "Review the anomalies above before making any further changes."
    );
  }

  console.log("=".repeat(70));
  console.log("READ-ONLY AUDIT COMPLETE");
  console.log("NO DATABASE CHANGES WERE MADE");
  console.log("=".repeat(70));
}

main()
  .catch((error) => {
    console.error("\nAUDIT FAILED:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });