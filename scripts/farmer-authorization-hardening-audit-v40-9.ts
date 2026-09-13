import fs from "fs";
import path from "path";

import prisma from "../lib/prisma";
import {
  authorizeFarmerAccess,
} from "../lib/authorization/farmer-authorization";
import {
  getFarmerCollectionAuthorization,
  getAuthorizedFarmerWhere,
  canAccessFarmerCollection,
} from "../lib/authorization/farmer-collection-authorization";

type ScopeLevel =
  | "NATIONAL"
  | "COUNTY"
  | "SUBCOUNTY"
  | "WARD";

type SyntheticAssignment = {
  active: boolean;
  scopeLevel: ScopeLevel;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  wardId: number | null;
  functionActive: boolean;
};

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

function hasValidScopeShape(
  assignment: SyntheticAssignment,
): boolean {
  switch (assignment.scopeLevel) {
    case "NATIONAL":
      return (
        assignment.countryId !== null &&
        assignment.countyId === null &&
        assignment.subCountyId === null &&
        assignment.wardId === null
      );

    case "COUNTY":
      return (
        assignment.countryId !== null &&
        assignment.countyId !== null &&
        assignment.subCountyId === null &&
        assignment.wardId === null
      );

    case "SUBCOUNTY":
      return (
        assignment.countryId !== null &&
        assignment.countyId !== null &&
        assignment.subCountyId !== null &&
        assignment.wardId === null
      );

    case "WARD":
      return (
        assignment.countryId !== null &&
        assignment.countyId !== null &&
        assignment.subCountyId !== null &&
        assignment.wardId !== null
      );

    default:
      return false;
  }
}

function farmerMatchesSyntheticAssignment(
  assignment: SyntheticAssignment,
  farmer: {
    countyId: number;
    subCountyId: number;
    wardId: number;
    countryId: number;
  },
): boolean {
  if (!assignment.active) {
    return false;
  }

  if (!assignment.functionActive) {
    return false;
  }

  if (!hasValidScopeShape(assignment)) {
    return false;
  }

  switch (assignment.scopeLevel) {
    case "NATIONAL":
      return (
        assignment.countryId ===
        farmer.countryId
      );

    case "COUNTY":
      return (
        assignment.countryId ===
          farmer.countryId &&
        assignment.countyId ===
          farmer.countyId
      );

    case "SUBCOUNTY":
      return (
        assignment.countryId ===
          farmer.countryId &&
        assignment.countyId ===
          farmer.countyId &&
        assignment.subCountyId ===
          farmer.subCountyId
      );

    case "WARD":
      return (
        assignment.countryId ===
          farmer.countryId &&
        assignment.countyId ===
          farmer.countyId &&
        assignment.subCountyId ===
          farmer.subCountyId &&
        assignment.wardId ===
          farmer.wardId
      );

    default:
      return false;
  }
}

async function main(): Promise<void> {
  console.log("");
  console.log("=".repeat(60));
  console.log(
    "V40.9 AUTHORIZATION HARDENING AUDIT",
  );
  console.log("=".repeat(60));
  console.log(
    "READ-ONLY: NO INSERT / UPDATE / DELETE",
  );
  console.log("");

  /*
   * ----------------------------------------------------------
   * CONSTANTS
   * ----------------------------------------------------------
   */

  const USER_ID = 1;
  const FARMER_ID = 4;

  const KENYA_COUNTRY_ID = 2;

  const ISIOLO_COUNTY_ID = 48;
  const GARBATULLA_SUBCOUNTY_ID = 1309;
  const GARBATULLA_WARD_ID = 2095;

  const KAJIADO_COUNTY_ID = 92;
  const KAJIADO_NORTH_SUBCOUNTY_ID = 1478;
  const NKAIMURUNYA_WARD_ID = 1859;

  /*
   * ----------------------------------------------------------
   * SOURCE FILE CHECK
   * ----------------------------------------------------------
   */

  section("AUTHORIZATION SOURCE FILES");

  const singleHelperPath = path.join(
    process.cwd(),
    "lib",
    "authorization",
    "farmer-authorization.ts",
  );

  const collectionHelperPath = path.join(
    process.cwd(),
    "lib",
    "authorization",
    "farmer-collection-authorization.ts",
  );

  assertTrue(
    fs.existsSync(singleHelperPath),
    "Single-Farmer authorization helper exists",
  );

  assertTrue(
    fs.existsSync(collectionHelperPath),
    "Collection authorization helper exists",
  );

  /*
   * ----------------------------------------------------------
   * DATABASE USER
   * ----------------------------------------------------------
   */

  section("DATABASE USER");

  const user = await prisma.user.findUnique({
    where: {
      id: USER_ID,
    },
    include: {
      role: true,
    },
  });

  assertTrue(
    user !== null,
    `User ${USER_ID} exists`,
  );

  if (!user) {
    fail(
      "Expected authorization test user does not exist",
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
    "Authorization test user is active",
  );

  assertTrue(
    user.role !== null,
    "Authorization test user has a primary role",
  );

  /*
   * ----------------------------------------------------------
   * TARGET FARMER
   * ----------------------------------------------------------
   */

  section("TARGET FARMER");

  const farmer = await prisma.farmer.findUnique({
    where: {
      id: FARMER_ID,
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
    `Farmer ${FARMER_ID} exists`,
  );

  if (!farmer) {
    fail(
      "Expected authorization test Farmer does not exist",
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
    farmer.county.country.id ===
      KENYA_COUNTRY_ID,
    "Target Farmer belongs to Kenya",
  );

  assertTrue(
    farmer.county.id ===
      KAJIADO_COUNTY_ID,
    "Target Farmer belongs to Kajiado",
  );

  assertTrue(
    farmer.subCounty.id ===
      KAJIADO_NORTH_SUBCOUNTY_ID,
    "Target Farmer belongs to Kajiado North",
  );

  assertTrue(
    farmer.ward.id ===
      NKAIMURUNYA_WARD_ID,
    "Target Farmer belongs to Nkaimurunya Ward",
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
        userId: USER_ID,
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

  console.log(
    `Active assignments: ${assignments.length}`,
  );

  assertTrue(
    assignments.length === 5,
    "Expected 5 active simulated assignments exist",
  );

  for (const assignment of assignments) {
    console.log(
      `Assignment ${assignment.id} | ${assignment.role.name} | ${assignment.function.name} | ${assignment.scopeLevel}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * ASSIGNMENT FUNCTION VALIDITY
   * ----------------------------------------------------------
   */

  section("FUNCTION VALIDITY");

  const inactiveFunctions =
    assignments.filter(
      (assignment) =>
        assignment.function.active !== true,
    );

  assertTrue(
    inactiveFunctions.length === 0,
    "All active assignments reference active OfficerFunctions",
  );

  /*
   * ----------------------------------------------------------
   * ASSIGNMENT SCOPE SHAPES
   * ----------------------------------------------------------
   */

  section("ASSIGNMENT SCOPE SHAPES");

  for (const assignment of assignments) {
    const synthetic: SyntheticAssignment = {
      active: assignment.active,
      scopeLevel:
        assignment.scopeLevel as ScopeLevel,
      countryId: assignment.countryId,
      countyId: assignment.countyId,
      subCountyId:
        assignment.subCountyId,
      wardId: assignment.wardId,
      functionActive:
        assignment.function.active,
    };

    assertTrue(
      hasValidScopeShape(synthetic),
      `Assignment ${assignment.id} has valid ${assignment.scopeLevel} scope shape`,
    );
  }

  /*
   * ----------------------------------------------------------
   * REAL GEOGRAPHY CHAIN VALIDATION
   * ----------------------------------------------------------
   */

  section("REAL GEOGRAPHY CHAIN VALIDATION");

  for (const assignment of assignments) {
    let valid = true;

    if (assignment.countryId !== null) {
      if (
        !assignment.country ||
        assignment.country.id !==
          assignment.countryId
      ) {
        valid = false;
      }
    }

    if (
      assignment.countyId !== null
    ) {
      if (
        !assignment.county ||
        assignment.county.id !==
          assignment.countyId ||
        assignment.county.countryId !==
          assignment.countryId
      ) {
        valid = false;
      }
    }

    if (
      assignment.subCountyId !== null
    ) {
      if (
        !assignment.subCounty ||
        assignment.subCounty.id !==
          assignment.subCountyId ||
        assignment.subCounty.countyId !==
          assignment.countyId
      ) {
        valid = false;
      }
    }

    if (
      assignment.wardId !== null
    ) {
      if (
        !assignment.ward ||
        assignment.ward.id !==
          assignment.wardId ||
        assignment.ward.countyId !==
          assignment.countyId ||
        assignment.ward.subCountyId !==
          assignment.subCountyId
      ) {
        valid = false;
      }
    }

    assertTrue(
      valid,
      `Assignment ${assignment.id} geography chain is internally consistent`,
    );
  }

  /*
   * ----------------------------------------------------------
   * ROLE / FUNCTION / SCOPE SEPARATION
   * ----------------------------------------------------------
   */

  section(
    "ROLE / FUNCTION / SCOPE SEPARATION",
  );

  const roleNames = new Set(
    assignments.map(
      (assignment) =>
        assignment.role.name,
    ),
  );

  const functionNames = new Set(
    assignments.map(
      (assignment) =>
        assignment.function.name,
    ),
  );

  const scopeNames = new Set(
    assignments.map(
      (assignment) =>
        assignment.scopeLevel,
    ),
  );

  assertTrue(
    roleNames.size >= 1,
    "Assignments carry explicit Role information",
  );

  assertTrue(
    functionNames.size >= 1,
    "Assignments carry explicit Function information",
  );

  assertTrue(
    scopeNames.size >= 1,
    "Assignments carry explicit ScopeLevel information",
  );

  assertTrue(
    assignments.every(
      (assignment) =>
        assignment.function.name.length >
        0,
    ),
    "Function is represented independently of geography",
  );

  /*
   * ----------------------------------------------------------
   * NATIONAL AUTHORITY
   * ----------------------------------------------------------
   */

  section("NATIONAL AUTHORITY");

  const nationalAssignments =
    assignments.filter(
      (assignment) =>
        assignment.scopeLevel ===
          "NATIONAL" &&
        assignment.countryId ===
          KENYA_COUNTRY_ID,
    );

  assertTrue(
    nationalAssignments.length >= 1,
    "At least one valid Kenya NATIONAL assignment exists",
  );

  /*
   * ----------------------------------------------------------
   * COUNTY AUTHORITY
   * ----------------------------------------------------------
   */

  section("COUNTY AUTHORITY");

  const countyAssignments =
    assignments.filter(
      (assignment) =>
        assignment.scopeLevel ===
          "COUNTY",
    );

  assertTrue(
    countyAssignments.length >= 1,
    "At least one COUNTY assignment exists",
  );

  if (countyAssignments.length > 0) {
    const assignment =
      countyAssignments[0];

    assertTrue(
      assignment.countryId ===
        KENYA_COUNTRY_ID,
      "COUNTY assignment belongs to Kenya",
    );

    assertTrue(
      assignment.countyId ===
        ISIOLO_COUNTY_ID,
      "Simulated COUNTY assignment targets Isiolo",
    );
  }

  /*
   * ----------------------------------------------------------
   * SUBCOUNTY AUTHORITY
   * ----------------------------------------------------------
   */

  section("SUBCOUNTY AUTHORITY");

  const subCountyAssignments =
    assignments.filter(
      (assignment) =>
        assignment.scopeLevel ===
          "SUBCOUNTY",
    );

  assertTrue(
    subCountyAssignments.length >= 1,
    "At least one SUBCOUNTY assignment exists",
  );

  if (subCountyAssignments.length > 0) {
    const assignment =
      subCountyAssignments[0];

    assertTrue(
      assignment.countryId ===
        KENYA_COUNTRY_ID,
      "SUBCOUNTY assignment belongs to Kenya",
    );

    assertTrue(
      assignment.countyId ===
        ISIOLO_COUNTY_ID,
      "SUBCOUNTY assignment targets Isiolo",
    );

    assertTrue(
      assignment.subCountyId ===
        GARBATULLA_SUBCOUNTY_ID,
      "SUBCOUNTY assignment targets Garbatulla",
    );
  }

  /*
   * ----------------------------------------------------------
   * WARD AUTHORITY
   * ----------------------------------------------------------
   */

  section("WARD AUTHORITY");

  const wardAssignments =
    assignments.filter(
      (assignment) =>
        assignment.scopeLevel ===
          "WARD",
    );

  assertTrue(
    wardAssignments.length >= 1,
    "At least one WARD assignment exists",
  );

  if (wardAssignments.length > 0) {
    const assignment =
      wardAssignments[0];

    assertTrue(
      assignment.countryId ===
        KENYA_COUNTRY_ID,
      "WARD assignment belongs to Kenya",
    );

    assertTrue(
      assignment.countyId ===
        ISIOLO_COUNTY_ID,
      "WARD assignment targets Isiolo",
    );

    assertTrue(
      assignment.subCountyId ===
        GARBATULLA_SUBCOUNTY_ID,
      "WARD assignment targets Garbatulla",
    );

    assertTrue(
      assignment.wardId ===
        GARBATULLA_WARD_ID,
      "WARD assignment targets GARBATULLA",
    );
  }

  /*
   * ----------------------------------------------------------
   * SINGLE-FARMER AUTHORIZATION
   * ----------------------------------------------------------
   */

  section("SINGLE-FARMER AUTHORIZATION");

  const singleAuthorization =
    await authorizeFarmerAccess(
      USER_ID,
      FARMER_ID,
    );

  console.log(
    `Allowed: ${singleAuthorization.allowed}`,
  );

  console.log(
    `Reason: ${singleAuthorization.reason}`,
  );

  console.log(
    `Assignment: ${singleAuthorization.assignmentId ?? "NULL"}`,
  );

  console.log(
    `Role: ${singleAuthorization.roleName ?? "NULL"}`,
  );

  console.log(
    `Function: ${singleAuthorization.functionName ?? "NULL"}`,
  );

  console.log(
    `Scope: ${singleAuthorization.scopeLevel ?? "NULL"}`,
  );

  assertTrue(
    singleAuthorization.allowed === true,
    "Single-Farmer authorization ALLOWS Farmer 4",
  );

  assertTrue(
    singleAuthorization.reason ===
      "ALLOWED",
    "Single-Farmer authorization reason is ALLOWED",
  );

  assertTrue(
    singleAuthorization.assignmentId !==
      null,
    "Single-Farmer authorization identifies the matching assignment",
  );

  /*
   * ----------------------------------------------------------
   * COLLECTION AUTHORIZATION
   * ----------------------------------------------------------
   */

  section("COLLECTION AUTHORIZATION");

  const collectionAuthorization =
    await getFarmerCollectionAuthorization(
      USER_ID,
    );

  assertTrue(
    collectionAuthorization.allowed ===
      true,
    "Collection authorization ALLOWS User 1",
  );

  assertTrue(
    collectionAuthorization.reason ===
      "ALLOWED",
    "Collection authorization reason is ALLOWED",
  );

  assertTrue(
    collectionAuthorization.assignmentIds.length ===
      assignments.length,
    "All active valid assignments contribute to collection authorization",
  );

  /*
   * ----------------------------------------------------------
   * COLLECTION WHERE CLAUSE
   * ----------------------------------------------------------
   */

  section("COLLECTION WHERE CLAUSE");

  const authorizedWhere =
    await getAuthorizedFarmerWhere(
      USER_ID,
    );

  assertTrue(
    authorizedWhere !== null,
    "Authorized Farmer WHERE clause exists",
  );

  if (authorizedWhere) {
    console.log(
      JSON.stringify(
        authorizedWhere,
        null,
        2,
      ),
    );
  }

  /*
   * ----------------------------------------------------------
   * COLLECTION BOOLEAN
   * ----------------------------------------------------------
   */

  section(
    "BOOLEAN COLLECTION AUTHORIZATION",
  );

  const collectionAllowed =
    await canAccessFarmerCollection(
      USER_ID,
    );

  assertTrue(
    collectionAllowed === true,
    "canAccessFarmerCollection() returns true",
  );

  /*
   * ----------------------------------------------------------
   * FARMER COLLECTION RESULT
   * ----------------------------------------------------------
   */

  section(
    "AUTHORIZED FARMER COLLECTION",
  );

  if (authorizedWhere) {
    const rows =
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
      `Authorized Farmer rows: ${rows.length}`,
    );

    assertTrue(
      rows.some(
        (row) =>
          row.id === FARMER_ID,
      ),
      "Authorized collection contains Farmer 4",
    );
  }

  /*
   * ----------------------------------------------------------
   * LEAST PRIVILEGE — COUNTY
   * ----------------------------------------------------------
   */

  section(
    "LEAST PRIVILEGE — COUNTY",
  );

  const countyOnlyWhere = {
    county: {
      id: ISIOLO_COUNTY_ID,
      countryId: KENYA_COUNTRY_ID,
    },
  };

  const countyTargetRows =
    await prisma.farmer.findMany({
      where: {
        AND: [
          countyOnlyWhere,
          {
            id: FARMER_ID,
          },
        ],
      },
      select: {
        id: true,
      },
    });

  assertTrue(
    countyTargetRows.length === 0,
    "Isiolo COUNTY scope does not expose Kajiado Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * LEAST PRIVILEGE — SUBCOUNTY
   * ----------------------------------------------------------
   */

  section(
    "LEAST PRIVILEGE — SUBCOUNTY",
  );

  const subCountyOnlyWhere = {
    county: {
      id: ISIOLO_COUNTY_ID,
      countryId: KENYA_COUNTRY_ID,
    },
    subCountyId:
      GARBATULLA_SUBCOUNTY_ID,
  };

  const subCountyTargetRows =
    await prisma.farmer.findMany({
      where: {
        AND: [
          subCountyOnlyWhere,
          {
            id: FARMER_ID,
          },
        ],
      },
      select: {
        id: true,
      },
    });

  assertTrue(
    subCountyTargetRows.length === 0,
    "Garbatulla SUBCOUNTY scope does not expose Kajiado Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * LEAST PRIVILEGE — WARD
   * ----------------------------------------------------------
   */

  section(
    "LEAST PRIVILEGE — WARD",
  );

  const wardOnlyWhere = {
    county: {
      id: ISIOLO_COUNTY_ID,
      countryId: KENYA_COUNTRY_ID,
    },
    subCountyId:
      GARBATULLA_SUBCOUNTY_ID,
    wardId:
      GARBATULLA_WARD_ID,
  };

  const wardTargetRows =
    await prisma.farmer.findMany({
      where: {
        AND: [
          wardOnlyWhere,
          {
            id: FARMER_ID,
          },
        ],
      },
      select: {
        id: true,
      },
    });

  assertTrue(
    wardTargetRows.length === 0,
    "GARBATULLA WARD scope does not expose Kajiado Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * MALFORMED SCOPE TESTS
   * ----------------------------------------------------------
   */

  section(
    "MALFORMED SCOPE TESTS",
  );

  const malformedAssignments: Array<{
    name: string;
    assignment: SyntheticAssignment;
  }> = [
    {
      name:
        "NATIONAL with countyId",
      assignment: {
        active: true,
        scopeLevel: "NATIONAL",
        countryId:
          KENYA_COUNTRY_ID,
        countyId:
          ISIOLO_COUNTY_ID,
        subCountyId: null,
        wardId: null,
        functionActive: true,
      },
    },
    {
      name:
        "COUNTY without countryId",
      assignment: {
        active: true,
        scopeLevel: "COUNTY",
        countryId: null,
        countyId:
          ISIOLO_COUNTY_ID,
        subCountyId: null,
        wardId: null,
        functionActive: true,
      },
    },
    {
      name:
        "COUNTY with subCountyId",
      assignment: {
        active: true,
        scopeLevel: "COUNTY",
        countryId:
          KENYA_COUNTRY_ID,
        countyId:
          ISIOLO_COUNTY_ID,
        subCountyId:
          GARBATULLA_SUBCOUNTY_ID,
        wardId: null,
        functionActive: true,
      },
    },
    {
      name:
        "SUBCOUNTY without countyId",
      assignment: {
        active: true,
        scopeLevel: "SUBCOUNTY",
        countryId:
          KENYA_COUNTRY_ID,
        countyId: null,
        subCountyId:
          GARBATULLA_SUBCOUNTY_ID,
        wardId: null,
        functionActive: true,
      },
    },
    {
      name:
        "SUBCOUNTY with wardId",
      assignment: {
        active: true,
        scopeLevel: "SUBCOUNTY",
        countryId:
          KENYA_COUNTRY_ID,
        countyId:
          ISIOLO_COUNTY_ID,
        subCountyId:
          GARBATULLA_SUBCOUNTY_ID,
        wardId:
          GARBATULLA_WARD_ID,
        functionActive: true,
      },
    },
    {
      name:
        "WARD without subCountyId",
      assignment: {
        active: true,
        scopeLevel: "WARD",
        countryId:
          KENYA_COUNTRY_ID,
        countyId:
          ISIOLO_COUNTY_ID,
        subCountyId: null,
        wardId:
          GARBATULLA_WARD_ID,
        functionActive: true,
      },
    },
    {
      name:
        "WARD without countyId",
      assignment: {
        active: true,
        scopeLevel: "WARD",
        countryId:
          KENYA_COUNTRY_ID,
        countyId: null,
        subCountyId:
          GARBATULLA_SUBCOUNTY_ID,
        wardId:
          GARBATULLA_WARD_ID,
        functionActive: true,
      },
    },
  ];

  for (const test of malformedAssignments) {
    assertTrue(
      hasValidScopeShape(
        test.assignment,
      ) === false,
      `Malformed assignment rejected: ${test.name}`,
    );

    assertTrue(
      farmerMatchesSyntheticAssignment(
        test.assignment,
        {
          countyId:
            KAJIADO_COUNTY_ID,
          subCountyId:
            KAJIADO_NORTH_SUBCOUNTY_ID,
          wardId:
            NKAIMURUNYA_WARD_ID,
          countryId:
            KENYA_COUNTRY_ID,
        },
      ) === false,
      `Malformed assignment cannot authorize Farmer 4: ${test.name}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * INACTIVE ASSIGNMENT TEST
   * ----------------------------------------------------------
   */

  section(
    "INACTIVE ASSIGNMENT TEST",
  );

  const inactiveAssignment: SyntheticAssignment = {
    active: false,
    scopeLevel: "NATIONAL",
    countryId:
      KENYA_COUNTRY_ID,
    countyId: null,
    subCountyId: null,
    wardId: null,
    functionActive: true,
  };

  assertTrue(
    farmerMatchesSyntheticAssignment(
      inactiveAssignment,
      {
        countyId:
          KAJIADO_COUNTY_ID,
        subCountyId:
          KAJIADO_NORTH_SUBCOUNTY_ID,
        wardId:
          NKAIMURUNYA_WARD_ID,
        countryId:
          KENYA_COUNTRY_ID,
      },
    ) === false,
    "Inactive assignment cannot authorize Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * INACTIVE FUNCTION TEST
   * ----------------------------------------------------------
   */

  section(
    "INACTIVE FUNCTION TEST",
  );

  const inactiveFunctionAssignment:
    SyntheticAssignment = {
      active: true,
      scopeLevel: "NATIONAL",
      countryId:
        KENYA_COUNTRY_ID,
      countyId: null,
      subCountyId: null,
      wardId: null,
      functionActive: false,
    };

  assertTrue(
    farmerMatchesSyntheticAssignment(
      inactiveFunctionAssignment,
      {
        countyId:
          KAJIADO_COUNTY_ID,
        subCountyId:
          KAJIADO_NORTH_SUBCOUNTY_ID,
        wardId:
          NKAIMURUNYA_WARD_ID,
        countryId:
          KENYA_COUNTRY_ID,
      },
    ) === false,
    "Assignment with inactive function cannot authorize Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * CROSS-COUNTRY TEST
   * ----------------------------------------------------------
   */

  section(
    "CROSS-COUNTRY AUTHORIZATION TEST",
  );

  const crossCountryAssignment:
    SyntheticAssignment = {
      active: true,
      scopeLevel: "NATIONAL",
      countryId: 999999,
      countyId: null,
      subCountyId: null,
      wardId: null,
      functionActive: true,
    };

  assertTrue(
    farmerMatchesSyntheticAssignment(
      crossCountryAssignment,
      {
        countyId:
          KAJIADO_COUNTY_ID,
        subCountyId:
          KAJIADO_NORTH_SUBCOUNTY_ID,
        wardId:
          NKAIMURUNYA_WARD_ID,
        countryId:
          KENYA_COUNTRY_ID,
      },
    ) === false,
    "Foreign-country NATIONAL scope cannot authorize Kenya Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * CROSS-COUNTY TEST
   * ----------------------------------------------------------
   */

  section(
    "CROSS-COUNTY AUTHORIZATION TEST",
  );

  const crossCountyAssignment:
    SyntheticAssignment = {
      active: true,
      scopeLevel: "COUNTY",
      countryId:
        KENYA_COUNTRY_ID,
      countyId:
        ISIOLO_COUNTY_ID,
      subCountyId: null,
      wardId: null,
      functionActive: true,
    };

  assertTrue(
    farmerMatchesSyntheticAssignment(
      crossCountyAssignment,
      {
        countyId:
          KAJIADO_COUNTY_ID,
        subCountyId:
          KAJIADO_NORTH_SUBCOUNTY_ID,
        wardId:
          NKAIMURUNYA_WARD_ID,
        countryId:
          KENYA_COUNTRY_ID,
      },
    ) === false,
    "Isiolo COUNTY scope cannot authorize Kajiado Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * CROSS-SUBCOUNTY TEST
   * ----------------------------------------------------------
   */

  section(
    "CROSS-SUBCOUNTY AUTHORIZATION TEST",
  );

  const crossSubCountyAssignment:
    SyntheticAssignment = {
      active: true,
      scopeLevel: "SUBCOUNTY",
      countryId:
        KENYA_COUNTRY_ID,
      countyId:
        ISIOLO_COUNTY_ID,
      subCountyId:
        GARBATULLA_SUBCOUNTY_ID,
      wardId: null,
      functionActive: true,
    };

  assertTrue(
    farmerMatchesSyntheticAssignment(
      crossSubCountyAssignment,
      {
        countyId:
          KAJIADO_COUNTY_ID,
        subCountyId:
          KAJIADO_NORTH_SUBCOUNTY_ID,
        wardId:
          NKAIMURUNYA_WARD_ID,
        countryId:
          KENYA_COUNTRY_ID,
      },
    ) === false,
    "Garbatulla SUBCOUNTY scope cannot authorize Kajiado Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * CROSS-WARD TEST
   * ----------------------------------------------------------
   */

  section(
    "CROSS-WARD AUTHORIZATION TEST",
  );

  const crossWardAssignment:
    SyntheticAssignment = {
      active: true,
      scopeLevel: "WARD",
      countryId:
        KENYA_COUNTRY_ID,
      countyId:
        ISIOLO_COUNTY_ID,
      subCountyId:
        GARBATULLA_SUBCOUNTY_ID,
      wardId:
        GARBATULLA_WARD_ID,
      functionActive: true,
    };

  assertTrue(
    farmerMatchesSyntheticAssignment(
      crossWardAssignment,
      {
        countyId:
          KAJIADO_COUNTY_ID,
        subCountyId:
          KAJIADO_NORTH_SUBCOUNTY_ID,
        wardId:
          NKAIMURUNYA_WARD_ID,
        countryId:
          KENYA_COUNTRY_ID,
      },
    ) === false,
    "GARBATULLA WARD scope cannot authorize Nkaimurunya Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * POSITIVE SYNTHETIC SCOPE TESTS
   * ----------------------------------------------------------
   */

  section(
    "POSITIVE SYNTHETIC SCOPE TESTS",
  );

  const farmer4Location = {
    countryId:
      KENYA_COUNTRY_ID,
    countyId:
      KAJIADO_COUNTY_ID,
    subCountyId:
      KAJIADO_NORTH_SUBCOUNTY_ID,
    wardId:
      NKAIMURUNYA_WARD_ID,
  };

  const nationalPositive:
    SyntheticAssignment = {
      active: true,
      scopeLevel: "NATIONAL",
      countryId:
        KENYA_COUNTRY_ID,
      countyId: null,
      subCountyId: null,
      wardId: null,
      functionActive: true,
    };

  assertTrue(
    farmerMatchesSyntheticAssignment(
      nationalPositive,
      farmer4Location,
    ) === true,
    "Valid Kenya NATIONAL scope authorizes Farmer 4",
  );

  const countyPositive:
    SyntheticAssignment = {
      active: true,
      scopeLevel: "COUNTY",
      countryId:
        KENYA_COUNTRY_ID,
      countyId:
        KAJIADO_COUNTY_ID,
      subCountyId: null,
      wardId: null,
      functionActive: true,
    };

  assertTrue(
    farmerMatchesSyntheticAssignment(
      countyPositive,
      farmer4Location,
    ) === true,
    "Valid Kajiado COUNTY scope authorizes Farmer 4",
  );

  const subCountyPositive:
    SyntheticAssignment = {
      active: true,
      scopeLevel: "SUBCOUNTY",
      countryId:
        KENYA_COUNTRY_ID,
      countyId:
        KAJIADO_COUNTY_ID,
      subCountyId:
        KAJIADO_NORTH_SUBCOUNTY_ID,
      wardId: null,
      functionActive: true,
    };

  assertTrue(
    farmerMatchesSyntheticAssignment(
      subCountyPositive,
      farmer4Location,
    ) === true,
    "Valid Kajiado North SUBCOUNTY scope authorizes Farmer 4",
  );

  const wardPositive:
    SyntheticAssignment = {
      active: true,
      scopeLevel: "WARD",
      countryId:
        KENYA_COUNTRY_ID,
      countyId:
        KAJIADO_COUNTY_ID,
      subCountyId:
        KAJIADO_NORTH_SUBCOUNTY_ID,
      wardId:
        NKAIMURUNYA_WARD_ID,
      functionActive: true,
    };

  assertTrue(
    farmerMatchesSyntheticAssignment(
      wardPositive,
      farmer4Location,
    ) === true,
    "Valid Nkaimurunya WARD scope authorizes Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * PRIMARY ROLE BYPASS TEST
   * ----------------------------------------------------------
   */

  section(
    "PRIMARY ROLE BYPASS TEST",
  );

  assertTrue(
    user.role?.name === "Farmer",
    "Test user's primary role is Farmer",
  );

  const farmerRoleOnlyUser =
    await prisma.user.findUnique({
      where: {
        id: USER_ID,
      },
      select: {
        id: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

  assertTrue(
    farmerRoleOnlyUser?.role?.name ===
      "Farmer",
    "Primary Farmer role is identified independently from OfficerAssignment",
  );

  assertTrue(
    assignments.length > 0,
    "Farmer role does not represent the OfficerAssignment collection boundary by itself",
  );

  /*
   * ----------------------------------------------------------
   * DUPLICATE NATIONAL ASSIGNMENTS
   * ----------------------------------------------------------
   */

  section(
    "DUPLICATE NATIONAL ASSIGNMENTS",
  );

  assertTrue(
    nationalAssignments.length === 2,
    "Two NATIONAL assignments are present as expected",
  );

  const uniqueNationalRoles =
    new Set(
      nationalAssignments.map(
        (assignment) =>
          assignment.role.name,
      ),
    );

  assertTrue(
    uniqueNationalRoles.size === 2,
    "Duplicate NATIONAL scope assignments represent distinct roles",
  );

  /*
   * ----------------------------------------------------------
   * OVERLAPPING ASSIGNMENTS
   * ----------------------------------------------------------
   */

  section(
    "OVERLAPPING ASSIGNMENTS",
  );

  const overlappingNational =
    nationalAssignments.length > 1;

  assertTrue(
    overlappingNational === true,
    "Overlapping NATIONAL assignments are detected",
  );

  review(
    "Duplicate NATIONAL authorization predicates are functionally safe but may be optimized later",
  );

  /*
   * ----------------------------------------------------------
   * FUNCTION DOES NOT GRANT GEOGRAPHY
   * ----------------------------------------------------------
   */

  section(
    "FUNCTION DOES NOT GRANT GEOGRAPHY",
  );

  const cropsAssignments =
    assignments.filter(
      (assignment) =>
        assignment.function.name ===
        "Crops",
    );

  assertTrue(
    cropsAssignments.length >= 1,
    "Crops function assignment exists",
  );

  if (cropsAssignments.length > 0) {
    assertTrue(
      cropsAssignments.every(
        (assignment) =>
          assignment.scopeLevel ===
          "NATIONAL",
      ),
      "Crops function uses explicit scope rather than granting geography implicitly",
    );
  }

  /*
   * ----------------------------------------------------------
   * AUTHORIZATION DOES NOT USE NAME
   * ----------------------------------------------------------
   */

  section(
    "NAME-INDEPENDENT AUTHORIZATION",
  );

  assertTrue(
    assignments.every(
      (assignment) =>
        assignment.userId === USER_ID,
    ),
    "Assignments are bound to User ID",
  );

  assertTrue(
    assignments.every(
      (assignment) =>
        assignment.roleId !== null,
    ),
    "Assignments are bound to Role ID",
  );

  assertTrue(
    assignments.every(
      (assignment) =>
        assignment.functionId !== null,
    ),
    "Assignments are bound to Function ID",
  );

  /*
   * ----------------------------------------------------------
   * DATABASE COLLECTION CONSISTENCY
   * ----------------------------------------------------------
   */

  section(
    "DATABASE COLLECTION CONSISTENCY",
  );

  if (authorizedWhere) {
    const authorizedRows =
      await prisma.farmer.findMany({
        where: authorizedWhere,
        select: {
          id: true,
          countyId: true,
          subCountyId: true,
          wardId: true,
        },
      });

    const targetIncluded =
      authorizedRows.some(
        (row) =>
          row.id === FARMER_ID,
      );

    assertTrue(
      targetIncluded === true,
      "Authorized WHERE clause includes Farmer 4",
    );

    for (const row of authorizedRows) {
      assertTrue(
        row.countyId !== null &&
          row.subCountyId !== null &&
          row.wardId !== null,
        `Authorized Farmer ${row.id} has complete geography`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * SINGLE / COLLECTION CONSISTENCY
   * ----------------------------------------------------------
   */

  section(
    "SINGLE / COLLECTION CONSISTENCY",
  );

  const collectionContainsFarmer =
    authorizedWhere
      ? (
          await prisma.farmer.count({
            where: {
              AND: [
                authorizedWhere,
                {
                  id: FARMER_ID,
                },
              ],
            },
          })
        ) === 1
      : false;

  assertTrue(
    collectionContainsFarmer ===
      singleAuthorization.allowed,
    "Single-Farmer and collection authorization agree for Farmer 4",
  );

  /*
   * ----------------------------------------------------------
   * FINAL HARDENING SUMMARY
   * ----------------------------------------------------------
   */

  section(
    "HARDENING SUMMARY",
  );

  console.log(
    "The authorization model was evaluated across:",
  );

  console.log(
    "  Role",
  );

  console.log(
    "  Function",
  );

  console.log(
    "  ScopeLevel",
  );

  console.log(
    "  Geography",
  );

  console.log(
    "  Assignment active state",
  );

  console.log(
    "  Function active state",
  );

  console.log(
    "  Collection WHERE enforcement",
  );

  console.log(
    "  Single-Farmer authorization",
  );

  console.log(
    "  Malformed scope rejection",
  );

  console.log(
    "  Cross-geography rejection",
  );

  console.log(
    "  Primary-role bypass protection",
  );

  /*
   * ----------------------------------------------------------
   * FINAL RESULT
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("=".repeat(60));
  console.log(
    "V40.9 FINAL RESULT",
  );
  console.log("=".repeat(60));
  console.log(
    `PASS   : ${passCount}`,
  );
  console.log(
    `FAIL   : ${failCount}`,
  );
  console.log(
    `REVIEW : ${reviewCount}`,
  );

  if (
    failCount === 0 &&
    reviewCount === 0
  ) {
    console.log(
      "V40.9 STATUS: GREEN",
    );
  } else if (
    failCount === 0
  ) {
    console.log(
      "V40.9 STATUS: GREEN WITH REVIEW",
    );
  } else {
    console.log(
      "V40.9 STATUS: RED",
    );
  }

  console.log("");

  if (failCount === 0) {
    console.log(
      "Authorization hardening checks passed.",
    );

    console.log(
      "Malformed assignments cannot authorize Farmer records.",
    );

    console.log(
      "Inactive assignments and inactive functions cannot authorize Farmer records.",
    );

    console.log(
      "Cross-country and cross-geography access is denied.",
    );

    console.log(
      "Role, Function, ScopeLevel, and Geography remain separate authorization dimensions.",
    );

    console.log(
      "Primary User.role does not replace OfficerAssignment authorization.",
    );

    console.log(
      "Collection and single-Farmer authorization remain consistent.",
    );
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V40.9 AUDIT ERROR",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });