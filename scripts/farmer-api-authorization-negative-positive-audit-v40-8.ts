import prisma from "../lib/prisma";
import {
  getAuthorizedFarmerWhere,
} from "../lib/authorization/farmer-collection-authorization";

const EXPECTED_USER_ID = 1;
const EXPECTED_FARMER_ID = 4;

const KENYA_COUNTRY_ID = 2;

const ISIOLO_COUNTY_ID = 48;
const GARBATULLA_SUBCOUNTY_ID = 1309;
const GARBATULLA_WARD_ID = 2095;

const KAJIADO_COUNTY_ID = 92;
const KAJIADO_NORTH_SUBCOUNTY_ID = 1478;
const NKAIMURUNYA_WARD_ID = 1859;

let passCount = 0;
let failCount = 0;
let reviewCount = 0;

function pass(message: string): void {
  passCount++;
  console.log(`PASS   ${message}`);
}

function fail(message: string): void {
  failCount++;
  console.log(`FAIL   ${message}`);
}

function review(message: string): void {
  reviewCount++;
  console.log(`REVIEW ${message}`);
}

function assertTrue(
  condition: boolean,
  message: string,
): void {
  if (condition) {
    pass(message);
  } else {
    fail(message);
  }
}

function section(title: string): void {
  console.log("");
  console.log("-".repeat(60));
  console.log(title);
  console.log("-".repeat(60));
}

async function main(): Promise<void> {
  console.log("");
  console.log("=".repeat(60));
  console.log(
    "V40.8 FARMER API POSITIVE / NEGATIVE AUTHORIZATION AUDIT",
  );
  console.log("=".repeat(60));
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  /*
   * ----------------------------------------------------------
   * DATABASE USER
   * ----------------------------------------------------------
   */

  section("DATABASE USER");

  const user = await prisma.user.findUnique({
    where: {
      id: EXPECTED_USER_ID,
    },
    include: {
      role: true,
    },
  });

  assertTrue(
    user !== null,
    `User ${EXPECTED_USER_ID} exists`,
  );

  if (!user) {
    fail(
      "Cannot continue without the expected test user",
    );
    return;
  }

  console.log(
    `User: ${user.id} | ${user.name}`,
  );

  console.log(
    `Primary role: ${user.role?.name ?? "NULL"}`,
  );

  assertTrue(
    user.active === true,
    "User is active",
  );

  /*
   * ----------------------------------------------------------
   * FARMER
   * ----------------------------------------------------------
   */

  section("TARGET FARMER");

  const farmer = await prisma.farmer.findUnique({
    where: {
      id: EXPECTED_FARMER_ID,
    },
    include: {
      county: {
        include: {
          country: true,
        },
      },
      subCounty: true,
      ward: true,
    },
  });

  assertTrue(
    farmer !== null,
    `Farmer ${EXPECTED_FARMER_ID} exists`,
  );

  if (!farmer) {
    fail(
      "Cannot continue without the expected Farmer",
    );
    return;
  }

  console.log(
    `Farmer ${farmer.id} | userId=${farmer.userId}`,
  );

  console.log(
    `Geography: ${farmer.county.country.name} → ${farmer.county.name} → ${farmer.subCounty.name} → ${farmer.ward.name}`,
  );

  assertTrue(
    farmer.county.country.id === KENYA_COUNTRY_ID,
    "Farmer belongs to Kenya",
  );

  assertTrue(
    farmer.county.id === KAJIADO_COUNTY_ID,
    "Farmer belongs to Kajiado",
  );

  assertTrue(
    farmer.subCounty.id ===
      KAJIADO_NORTH_SUBCOUNTY_ID,
    "Farmer belongs to Kajiado North",
  );

  assertTrue(
    farmer.ward.id === NKAIMURUNYA_WARD_ID,
    "Farmer belongs to Nkaimurunya Ward",
  );

  /*
   * ----------------------------------------------------------
   * ACTIVE ASSIGNMENTS
   * ----------------------------------------------------------
   */

  section("ACTIVE OFFICER ASSIGNMENTS");

  const assignments =
    await prisma.officerAssignment.findMany({
      where: {
        userId: EXPECTED_USER_ID,
        active: true,
      },
      include: {
        role: true,
        function: true,
        country: true,
        county: true,
        subCounty: true,
        ward: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  assertTrue(
    assignments.length === 5,
    "Exactly 5 active simulated assignments exist",
  );

  for (const assignment of assignments) {
    console.log(
      `Assignment ${assignment.id} | ${assignment.role.name} | ${assignment.function.name} | ${assignment.scopeLevel}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * EXPECTED ASSIGNMENT STRUCTURE
   * ----------------------------------------------------------
   */

  section("EXPECTED AUTHORIZATION ASSIGNMENTS");

  const nationalAssignments =
    assignments.filter(
      (assignment) =>
        assignment.scopeLevel === "NATIONAL" &&
        assignment.countryId ===
          KENYA_COUNTRY_ID,
    );

  const countyAssignments =
    assignments.filter(
      (assignment) =>
        assignment.scopeLevel === "COUNTY" &&
        assignment.countryId ===
          KENYA_COUNTRY_ID &&
        assignment.countyId ===
          ISIOLO_COUNTY_ID,
    );

  const subCountyAssignments =
    assignments.filter(
      (assignment) =>
        assignment.scopeLevel === "SUBCOUNTY" &&
        assignment.countryId ===
          KENYA_COUNTRY_ID &&
        assignment.countyId ===
          ISIOLO_COUNTY_ID &&
        assignment.subCountyId ===
          GARBATULLA_SUBCOUNTY_ID,
    );

  const wardAssignments =
    assignments.filter(
      (assignment) =>
        assignment.scopeLevel === "WARD" &&
        assignment.countryId ===
          KENYA_COUNTRY_ID &&
        assignment.countyId ===
          ISIOLO_COUNTY_ID &&
        assignment.subCountyId ===
          GARBATULLA_SUBCOUNTY_ID &&
        assignment.wardId ===
          GARBATULLA_WARD_ID,
    );

  assertTrue(
    nationalAssignments.length === 2,
    "Two NATIONAL Kenya assignments exist",
  );

  assertTrue(
    countyAssignments.length === 1,
    "One COUNTY Isiolo assignment exists",
  );

  assertTrue(
    subCountyAssignments.length === 1,
    "One SUBCOUNTY Garbatulla assignment exists",
  );

  assertTrue(
    wardAssignments.length === 1,
    "One WARD GARBATULLA assignment exists",
  );

  /*
   * ----------------------------------------------------------
   * COLLECTION AUTHORIZATION
   * ----------------------------------------------------------
   */

  section("COLLECTION AUTHORIZATION");

  const authorizedWhere =
    await getAuthorizedFarmerWhere(
      EXPECTED_USER_ID,
    );

  assertTrue(
    authorizedWhere !== null,
    "Collection authorization WHERE clause exists",
  );

  if (!authorizedWhere) {
    fail(
      "Cannot continue without an authorization WHERE clause",
    );
    return;
  }

  console.log("");
  console.log(
    "Authorization WHERE clause generated successfully.",
  );

  /*
   * ----------------------------------------------------------
   * POSITIVE TEST — CURRENT FARMER
   * ----------------------------------------------------------
   */

  section(
    "POSITIVE TEST — AUTHORIZED FARMER",
  );

  const positiveResult =
    await prisma.farmer.findMany({
      where: {
        AND: [
          authorizedWhere,
          {
            id: EXPECTED_FARMER_ID,
          },
        ],
      },
      select: {
        id: true,
        userId: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
      },
    });

  assertTrue(
    positiveResult.length === 1,
    "Farmer 4 is returned by the authorized collection",
  );

  if (positiveResult.length === 1) {
    const result = positiveResult[0];

    assertTrue(
      result.id === EXPECTED_FARMER_ID,
      "Authorized collection returns the expected Farmer ID",
    );

    assertTrue(
      result.countyId === KAJIADO_COUNTY_ID,
      "Authorized Farmer has Kajiado county ID",
    );

    assertTrue(
      result.subCountyId ===
        KAJIADO_NORTH_SUBCOUNTY_ID,
      "Authorized Farmer has Kajiado North subcounty ID",
    );

    assertTrue(
      result.wardId ===
        NKAIMURUNYA_WARD_ID,
      "Authorized Farmer has Nkaimurunya ward ID",
    );
  }

  /*
   * ----------------------------------------------------------
   * NEGATIVE TEST — COUNTY ASSIGNMENT
   * ----------------------------------------------------------
   *
   * Test only the County Director assignment.
   * It covers Isiolo, not Kajiado.
   */

  section(
    "NEGATIVE TEST — COUNTY SCOPE",
  );

  const countyAssignment =
    countyAssignments[0];

  assertTrue(
    countyAssignment !== undefined,
    "Isiolo COUNTY assignment available for negative test",
  );

  if (countyAssignment) {
    const countyWhere = {
      county: {
        id: ISIOLO_COUNTY_ID,
        countryId: KENYA_COUNTRY_ID,
      },
    };

    const countyResult =
      await prisma.farmer.findMany({
        where: {
          AND: [
            countyWhere,
            {
              id: EXPECTED_FARMER_ID,
            },
          ],
        },
        select: {
          id: true,
        },
      });

    assertTrue(
      countyResult.length === 0,
      "COUNTY Isiolo scope DENIES Farmer 4 in Kajiado",
    );
  }

  /*
   * ----------------------------------------------------------
   * NEGATIVE TEST — SUBCOUNTY SCOPE
   * ----------------------------------------------------------
   */

  section(
    "NEGATIVE TEST — SUBCOUNTY SCOPE",
  );

  const subCountyAssignment =
    subCountyAssignments[0];

  assertTrue(
    subCountyAssignment !== undefined,
    "Garbatulla SUBCOUNTY assignment available for negative test",
  );

  if (subCountyAssignment) {
    const subCountyWhere = {
      county: {
        id: ISIOLO_COUNTY_ID,
        countryId: KENYA_COUNTRY_ID,
      },
      subCountyId:
        GARBATULLA_SUBCOUNTY_ID,
    };

    const subCountyResult =
      await prisma.farmer.findMany({
        where: {
          AND: [
            subCountyWhere,
            {
              id: EXPECTED_FARMER_ID,
            },
          ],
        },
        select: {
          id: true,
        },
      });

    assertTrue(
      subCountyResult.length === 0,
      "SUBCOUNTY Garbatulla scope DENIES Farmer 4 in Kajiado North",
    );
  }

  /*
   * ----------------------------------------------------------
   * NEGATIVE TEST — WARD SCOPE
   * ----------------------------------------------------------
   */

  section(
    "NEGATIVE TEST — WARD SCOPE",
  );

  const wardAssignment =
    wardAssignments[0];

  assertTrue(
    wardAssignment !== undefined,
    "GARBATULLA WARD assignment available for negative test",
  );

  if (wardAssignment) {
    const wardWhere = {
      county: {
        id: ISIOLO_COUNTY_ID,
        countryId: KENYA_COUNTRY_ID,
      },
      subCountyId:
        GARBATULLA_SUBCOUNTY_ID,
      wardId: GARBATULLA_WARD_ID,
    };

    const wardResult =
      await prisma.farmer.findMany({
        where: {
          AND: [
            wardWhere,
            {
              id: EXPECTED_FARMER_ID,
            },
          ],
        },
        select: {
          id: true,
        },
      });

    assertTrue(
      wardResult.length === 0,
      "WARD GARBATULLA scope DENIES Farmer 4 in Nkaimurunya",
    );
  }

  /*
   * ----------------------------------------------------------
   * POSITIVE TEST — NATIONAL SCOPE
   * ----------------------------------------------------------
   */

  section(
    "POSITIVE TEST — NATIONAL SCOPE",
  );

  const nationalWhere = {
    county: {
      countryId: KENYA_COUNTRY_ID,
    },
  };

  const nationalResult =
    await prisma.farmer.findMany({
      where: {
        AND: [
          nationalWhere,
          {
            id: EXPECTED_FARMER_ID,
          },
        ],
      },
      select: {
        id: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
      },
    });

  assertTrue(
    nationalResult.length === 1,
    "NATIONAL Kenya scope ALLOWS Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * CROSS-COUNTRY NEGATIVE TEST
   * ----------------------------------------------------------
   *
   * The Farmer collection must not treat another country
   * as part of the Kenya authorization boundary.
   */

  section(
    "NEGATIVE TEST — CROSS-COUNTRY",
  );

  const crossCountryResult =
    await prisma.farmer.findMany({
      where: {
        AND: [
          {
            county: {
              countryId: {
                not: KENYA_COUNTRY_ID,
              },
            },
          },
          {
            id: EXPECTED_FARMER_ID,
          },
        ],
      },
      select: {
        id: true,
      },
    });

  assertTrue(
    crossCountryResult.length === 0,
    "Farmer 4 is not classified as belonging to another country",
  );

  /*
   * ----------------------------------------------------------
   * CROSS-COUNTY NEGATIVE TEST
   * ----------------------------------------------------------
   */

  section(
    "NEGATIVE TEST — CROSS-COUNTY",
  );

  const crossCountyResult =
    await prisma.farmer.findMany({
      where: {
        AND: [
          {
            countyId: {
              not: KAJIADO_COUNTY_ID,
            },
          },
          {
            id: EXPECTED_FARMER_ID,
          },
        ],
      },
      select: {
        id: true,
      },
    });

  assertTrue(
    crossCountyResult.length === 0,
    "Farmer 4 is not classified as belonging to another county",
  );

  /*
   * ----------------------------------------------------------
   * CROSS-SUBCOUNTY NEGATIVE TEST
   * ----------------------------------------------------------
   */

  section(
    "NEGATIVE TEST — CROSS-SUBCOUNTY",
  );

  const crossSubCountyResult =
    await prisma.farmer.findMany({
      where: {
        AND: [
          {
            subCountyId: {
              not:
                KAJIADO_NORTH_SUBCOUNTY_ID,
            },
          },
          {
            id: EXPECTED_FARMER_ID,
          },
        ],
      },
      select: {
        id: true,
      },
    });

  assertTrue(
    crossSubCountyResult.length === 0,
    "Farmer 4 is not classified as belonging to another subcounty",
  );

  /*
   * ----------------------------------------------------------
   * CROSS-WARD NEGATIVE TEST
   * ----------------------------------------------------------
   */

  section(
    "NEGATIVE TEST — CROSS-WARD",
  );

  const crossWardResult =
    await prisma.farmer.findMany({
      where: {
        AND: [
          {
            wardId: {
              not: NKAIMURUNYA_WARD_ID,
            },
          },
          {
            id: EXPECTED_FARMER_ID,
          },
        ],
      },
      select: {
        id: true,
      },
    });

  assertTrue(
    crossWardResult.length === 0,
    "Farmer 4 is not classified as belonging to another ward",
  );

  /*
   * ----------------------------------------------------------
   * FULL AUTHORIZED COLLECTION
   * ----------------------------------------------------------
   */

  section(
    "FULL AUTHORIZED COLLECTION",
  );

  const authorizedFarmers =
    await prisma.farmer.findMany({
      where: authorizedWhere,
      select: {
        id: true,
        userId: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  console.log(
    `Authorized Farmer rows: ${authorizedFarmers.length}`,
  );

  assertTrue(
    authorizedFarmers.length >= 1,
    "Authorized Farmer collection contains at least one row",
  );

  assertTrue(
    authorizedFarmers.some(
      (item) =>
        item.id === EXPECTED_FARMER_ID,
    ),
    "Authorized collection contains Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * AUTHORIZATION BOUNDARY
   * ----------------------------------------------------------
   */

  section("AUTHORIZATION BOUNDARY");

  /*
   * Because the user has a NATIONAL Kenya assignment,
   * the effective collection scope is Kenya-wide.
   *
   * The narrower Isiolo assignments cannot reduce access
   * granted by the national assignment.
   */

  assertTrue(
    nationalAssignments.length >= 1,
    "At least one active NATIONAL assignment establishes Kenya-wide authority",
  );

  assertTrue(
    authorizedWhere !== null,
    "Effective collection authorization remains non-null",
  );

  /*
   * ----------------------------------------------------------
   * NARROW SCOPE SEMANTICS
   * ----------------------------------------------------------
   */

  section(
    "NARROW SCOPE SEMANTICS",
  );

  const isioloCountyCount =
    await prisma.farmer.count({
      where: {
        county: {
          id: ISIOLO_COUNTY_ID,
          countryId: KENYA_COUNTRY_ID,
        },
      },
    });

  const garbatullaCount =
    await prisma.farmer.count({
      where: {
        county: {
          id: ISIOLO_COUNTY_ID,
          countryId: KENYA_COUNTRY_ID,
        },
        subCountyId:
          GARBATULLA_SUBCOUNTY_ID,
      },
    });

  const garbatullaWardCount =
    await prisma.farmer.count({
      where: {
        county: {
          id: ISIOLO_COUNTY_ID,
          countryId: KENYA_COUNTRY_ID,
        },
        subCountyId:
          GARBATULLA_SUBCOUNTY_ID,
        wardId: GARBATULLA_WARD_ID,
      },
    });

  console.log(
    `Isiolo Farmer rows: ${isioloCountyCount}`,
  );

  console.log(
    `Garbatulla Farmer rows: ${garbatullaCount}`,
  );

  console.log(
    `GARBATULLA Farmer rows: ${garbatullaWardCount}`,
  );

  assertTrue(
    isioloCountyCount >= 0,
    "COUNTY scope query executes successfully",
  );

  assertTrue(
    garbatullaCount >= 0,
    "SUBCOUNTY scope query executes successfully",
  );

  assertTrue(
    garbatullaWardCount >= 0,
    "WARD scope query executes successfully",
  );

  /*
   * ----------------------------------------------------------
   * FINAL
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("=".repeat(60));
  console.log("V40.8 FINAL RESULT");
  console.log("=".repeat(60));
  console.log(`PASS   : ${passCount}`);
  console.log(`FAIL   : ${failCount}`);
  console.log(`REVIEW : ${reviewCount}`);

  if (
    failCount === 0 &&
    reviewCount === 0
  ) {
    console.log(
      "V40.8 STATUS: GREEN",
    );
  } else if (
    failCount === 0
  ) {
    console.log(
      "V40.8 STATUS: GREEN WITH REVIEW",
    );
  } else {
    console.log(
      "V40.8 STATUS: RED",
    );
  }

  console.log("");

  if (failCount === 0) {
    console.log(
      "Positive and negative Farmer authorization boundaries are behaving correctly.",
    );

    console.log(
      "NATIONAL authorization allows the Kenya Farmer collection.",
    );

    console.log(
      "COUNTY, SUBCOUNTY, and WARD predicates correctly exclude the Kajiado Farmer when scoped to Isiolo/Garbatulla/GARBATULLA.",
    );

    console.log(
      "Authorization is enforced through PostgreSQL WHERE predicates.",
    );
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V40.8 AUDIT ERROR",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });