import fs from "fs";
import path from "path";

import prisma from "../lib/prisma";
import {
  canAccessFarmerCollection,
  getAuthorizedFarmerWhere,
} from "../lib/authorization/farmer-collection-authorization";

const ROUTE_PATH = path.resolve(
  process.cwd(),
  "app/api/farmers/route.ts",
);

const EXPECTED_USER_ID = 1;
const EXPECTED_FARMER_ID = 4;

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

function normalizeSource(source: string): string {
  return source
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function section(title: string): void {
  console.log("");
  console.log("-".repeat(60));
  console.log(title);
  console.log("-".repeat(60));
}

function printJson(
  label: string,
  value: unknown,
): void {
  console.log("");
  console.log(label);
  console.log(
    JSON.stringify(
      value,
      (_key, currentValue) =>
        typeof currentValue === "bigint"
          ? currentValue.toString()
          : currentValue,
      2,
    ),
  );
}

async function main(): Promise<void> {
  console.log("");
  console.log("=".repeat(60));
  console.log("V40.7 FARMER API AUTHORIZATION AUDIT");
  console.log("=".repeat(60));
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  if (!fs.existsSync(ROUTE_PATH)) {
    fail("app/api/farmers/route.ts exists");
    console.log("");
    console.log(
      "V40.7 cannot continue without the route.",
    );
    console.log("");
    return;
  }

  const rawRouteSource = fs.readFileSync(
    ROUTE_PATH,
    "utf8",
  );

  const routeSource = normalizeSource(
    rawRouteSource,
  );

  section("ROUTE SOURCE INTEGRATION");

  assertTrue(
    fs.existsSync(ROUTE_PATH),
    "app/api/farmers/route.ts exists",
  );

  assertTrue(
    /getAuthorizedFarmerWhere\s*,?\s*}\s*from\s*["']@\/lib\/authorization\/farmer-collection-authorization["']/s.test(
      routeSource,
    ),
    "GET imports getAuthorizedFarmerWhere from collection authorization helper",
  );

  assertTrue(
    routeSource.includes(
      "await getAuthorizedFarmerWhere(dbUser.id)",
    ),
    "GET calls getAuthorizedFarmerWhere(dbUser.id)",
  );

  assertTrue(
    routeSource.includes(
      "where: authorizedWhere",
    ),
    "GET passes authorizedWhere into Farmer findMany",
  );

  const authorizationCallIndex =
    routeSource.indexOf(
      "await getAuthorizedFarmerWhere(dbUser.id)",
    );

  const farmerFindManyIndex =
    routeSource.indexOf(
      "prisma.farmer.findMany",
    );

  assertTrue(
    authorizationCallIndex >= 0 &&
      farmerFindManyIndex >= 0 &&
      authorizationCallIndex <
        farmerFindManyIndex,
    "GET creates authorizedWhere before Farmer query",
  );

  assertTrue(
    routeSource.includes(
      "if (!authorizedWhere)",
    ),
    "GET denies access when no authorization scope exists",
  );

  assertTrue(
    routeSource.includes(
      'error: "Forbidden"',
    ),
    "GET returns Forbidden when collection authorization is unavailable",
  );

  section(
    "REMOVAL OF OLD PRIMARY-ROLE COLLECTION GATE",
  );

  assertTrue(
    !routeSource.includes(
      "allowedCollectionRoles",
    ),
    "Old allowedCollectionRoles gate removed",
  );

  assertTrue(
    !routeSource.includes(
      'roleName === "Super Admin"',
    ) &&
      !routeSource.includes(
        'roleName === "National Admin"',
      ),
    "Old Super Admin / National Admin hardcoded collection gate removed",
  );

  assertTrue(
    !routeSource.includes(
      '["Super Admin", "National Admin"]',
    ) &&
      !routeSource.includes(
        '["National Admin", "Super Admin"]',
      ),
    "Old primary-role authorization check removed",
  );

  section("AUTHENTICATION AND ACCOUNT CHECKS");

  assertTrue(
    routeSource.includes("getCurrentUser"),
    "GET still requires authenticated Firebase session",
  );

  assertTrue(
    routeSource.includes("if (!currentUser)"),
    "GET checks for missing authenticated user",
  );

  assertTrue(
    routeSource.includes("status: 401"),
    "GET returns 401 for unauthenticated requests",
  );

  assertTrue(
    routeSource.includes("const firebaseUid"),
    "GET resolves Firebase UID",
  );

  assertTrue(
    routeSource.includes(
      "prisma.user.findUnique",
    ),
    "GET resolves authenticated user from database",
  );

  assertTrue(
    /prisma\.user\.findUnique\s*\(\s*\{\s*where\s*:\s*\{\s*firebaseUid\s*(?:,|\})/s.test(
      routeSource,
    ),
    "GET looks up database User by Firebase UID",
  );

  assertTrue(
    routeSource.includes("if (!dbUser)"),
    "GET checks database synchronization",
  );

  assertTrue(
    routeSource.includes("if (!dbUser.active)"),
    "GET checks active user status",
  );

  section("COLLECTION AUTHORIZATION FLOW");

  assertTrue(
    routeSource.includes(
      "export async function GET",
    ),
    "GET handler located",
  );

  assertTrue(
    routeSource.includes(
      "export async function POST",
    ),
    "POST handler located",
  );

  const getStart = routeSource.indexOf(
    "export async function GET",
  );

  const postStart = routeSource.indexOf(
    "export async function POST",
  );

  const getSource =
    getStart >= 0 &&
    postStart > getStart
      ? routeSource.slice(
          getStart,
          postStart,
        )
      : routeSource;

  const postSource =
    postStart >= 0
      ? routeSource.slice(postStart)
      : "";

  assertTrue(
    getSource.length > 0,
    "GET handler isolated successfully for focused authorization checks",
  );

  assertTrue(
    getSource.includes("dbUser.id"),
    "GET authorization is based on database User ID",
  );

  assertTrue(
    getSource.includes(
      "getAuthorizedFarmerWhere(dbUser.id)",
    ),
    "GET constructs collection authorization WHERE clause",
  );

  assertTrue(
    getSource.includes(
      "where: authorizedWhere",
    ),
    "GET applies authorization WHERE clause to Farmer query",
  );

  section("N+1 AUTHORIZATION PROTECTION");

  assertTrue(
    !getSource.includes(
      "authorizeFarmerAccess(",
    ),
    "GET does not call authorizeFarmerAccess() per Farmer",
  );

  const collectionHelperMatches =
    getSource.match(
      /getAuthorizedFarmerWhere\s*\(\s*dbUser\.id\s*\)/g,
    ) ?? [];

  assertTrue(
    collectionHelperMatches.length === 1,
    "GET makes exactly one collection authorization helper call",
  );

  section("FARMER QUERY STRUCTURE");

  assertTrue(
    getSource.includes(
      "prisma.farmer.findMany",
    ),
    "GET uses Prisma Farmer findMany",
  );

  assertTrue(
    getSource.includes(
      "where: authorizedWhere",
    ),
    "Farmer collection query is filtered by authorization WHERE",
  );

  assertTrue(
    getSource.includes("orderBy:"),
    "Existing Farmer ordering is preserved",
  );

  assertTrue(
    getSource.includes(
      'createdAt: "desc"',
    ),
    "Farmers remain ordered by newest first",
  );

  assertTrue(
    getSource.includes("user:"),
    "Farmer user relation remains included",
  );

  assertTrue(
    getSource.includes("county:"),
    "Farmer county relation remains included",
  );

  assertTrue(
    getSource.includes("subCounty:"),
    "Farmer subCounty relation remains included",
  );

  assertTrue(
    getSource.includes("ward:"),
    "Farmer ward relation remains included",
  );

  assertTrue(
    getSource.includes("farms:"),
    "Farmer farms relation remains included",
  );

  section("POST REGISTRATION PROTECTION");

  assertTrue(
    postSource.length > 0,
    "POST handler isolated successfully",
  );

  assertTrue(
    postSource.includes("getCurrentUser"),
    "POST still requires authenticated Firebase session",
  );

  assertTrue(
    postSource.includes(
      "prisma.$transaction",
    ),
    "POST still uses Prisma transaction",
  );

  assertTrue(
    postSource.includes("prisma.farmer") ||
      postSource.includes("tx.farmer"),
    "POST still performs Farmer transaction work",
  );

  assertTrue(
    postSource.includes("prisma.farm") ||
      postSource.includes("tx.farm"),
    "POST still performs Farm transaction work",
  );

  assertTrue(
    postSource.includes(
      "normalizePhoneNumber",
    ),
    "POST still normalizes phone number",
  );

  assertTrue(
    postSource.includes("countyId"),
    "POST still handles county geography",
  );

  assertTrue(
    postSource.includes("subCountyId"),
    "POST still handles subcounty geography",
  );

  assertTrue(
    postSource.includes("wardId"),
    "POST still handles ward geography",
  );

  section("DATABASE AUTHORIZATION CONTEXT");

  const dbUser =
    await prisma.user.findUnique({
      where: {
        id: EXPECTED_USER_ID,
      },
      include: {
        role: true,
      },
    });

  assertTrue(
    dbUser !== null,
    `User ${EXPECTED_USER_ID} loaded${
      dbUser
        ? ` | ${dbUser.name}`
        : ""
    }`,
  );

  if (!dbUser) {
    fail(
      "Cannot continue database authorization tests without User 1",
    );
    return;
  }

  assertTrue(
    dbUser.active === true,
    "User is active",
  );

  console.log(
    `Primary role: ${dbUser.role?.name ?? "NULL"}`,
  );

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

  console.log(
    `Active OfficerAssignments: ${assignments.length}`,
  );

  section("ACTIVE OFFICER ASSIGNMENTS");

  assertTrue(
    assignments.length === 5,
    "User has 5 active OfficerAssignment(s)",
  );

  for (const assignment of assignments) {
    console.log(
      `Assignment ${assignment.id} | ${assignment.role.name} | ${assignment.function.name} | ${assignment.scopeLevel}`,
    );
  }

  const invalidAssignments =
    assignments.filter(
      (assignment) => {
        if (!assignment.active) {
          return true;
        }

        if (!assignment.function.active) {
          return true;
        }

        switch (assignment.scopeLevel) {
          case "NATIONAL":
            return (
              assignment.countryId === null ||
              assignment.countyId !== null ||
              assignment.subCountyId !== null ||
              assignment.wardId !== null ||
              assignment.country?.id !==
                assignment.countryId
            );

          case "COUNTY":
            return (
              assignment.countryId === null ||
              assignment.countyId === null ||
              assignment.subCountyId !== null ||
              assignment.wardId !== null ||
              assignment.country?.id !==
                assignment.countryId ||
              assignment.county?.id !==
                assignment.countyId ||
              assignment.county?.countryId !==
                assignment.countryId
            );

          case "SUBCOUNTY":
            return (
              assignment.countryId === null ||
              assignment.countyId === null ||
              assignment.subCountyId === null ||
              assignment.wardId !== null ||
              assignment.country?.id !==
                assignment.countryId ||
              assignment.county?.id !==
                assignment.countyId ||
              assignment.county?.countryId !==
                assignment.countryId ||
              assignment.subCounty?.id !==
                assignment.subCountyId ||
              assignment.subCounty?.countyId !==
                assignment.countyId
            );

          case "WARD":
            return (
              assignment.countryId === null ||
              assignment.countyId === null ||
              assignment.subCountyId === null ||
              assignment.wardId === null ||
              assignment.country?.id !==
                assignment.countryId ||
              assignment.county?.id !==
                assignment.countyId ||
              assignment.county?.countryId !==
                assignment.countryId ||
              assignment.subCounty?.id !==
                assignment.subCountyId ||
              assignment.subCounty?.countyId !==
                assignment.countyId ||
              assignment.ward?.id !==
                assignment.wardId ||
              assignment.ward?.countyId !==
                assignment.countyId ||
              assignment.ward?.subCountyId !==
                assignment.subCountyId
            );

          default:
            return true;
        }
      },
    );

  assertTrue(
    invalidAssignments.length === 0,
    "All active assignments have valid scope/function configuration",
  );

  assertTrue(
    assignments.some(
      (assignment) =>
        assignment.scopeLevel === "NATIONAL",
    ),
    "NATIONAL scope represented",
  );

  assertTrue(
    assignments.some(
      (assignment) =>
        assignment.scopeLevel === "COUNTY",
    ),
    "COUNTY scope represented",
  );

  assertTrue(
    assignments.some(
      (assignment) =>
        assignment.scopeLevel === "SUBCOUNTY",
    ),
    "SUBCOUNTY scope represented",
  );

  assertTrue(
    assignments.some(
      (assignment) =>
        assignment.scopeLevel === "WARD",
    ),
    "WARD scope represented",
  );

  section("COLLECTION AUTHORIZATION HELPER");

  const authorizedWhere =
    await getAuthorizedFarmerWhere(
      EXPECTED_USER_ID,
    );

  assertTrue(
    authorizedWhere !== null,
    "getAuthorizedFarmerWhere() returned a valid WHERE clause",
  );

  if (authorizedWhere) {
    printJson(
      "Generated Farmer WHERE clause:",
      authorizedWhere,
    );
  }

  section("BOOLEAN COLLECTION AUTHORIZATION");

  const collectionAccess =
    await canAccessFarmerCollection(
      EXPECTED_USER_ID,
    );

  assertTrue(
    collectionAccess === true,
    "canAccessFarmerCollection() returns true",
  );

  section(
    "DATABASE COLLECTION AUTHORIZATION TEST",
  );

  if (authorizedWhere) {
    const authorizedFarmers =
      await prisma.farmer.findMany({
        where: authorizedWhere,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          userId: true,
          county: {
            select: {
              name: true,
              country: {
                select: {
                  name: true,
                },
              },
            },
          },
          subCounty: {
            select: {
              name: true,
            },
          },
          ward: {
            select: {
              name: true,
            },
          },
        },
      });

    console.log(
      `Authorized Farmer rows returned: ${authorizedFarmers.length}`,
    );

    const farmer4Included =
      authorizedFarmers.some(
        (farmer) =>
          farmer.id === EXPECTED_FARMER_ID,
      );

    assertTrue(
      farmer4Included,
      `Farmer ${EXPECTED_FARMER_ID} is included in the authorized collection`,
    );

    const farmer4FromCollection =
      authorizedFarmers.find(
        (farmer) =>
          farmer.id === EXPECTED_FARMER_ID,
      );

    if (farmer4FromCollection) {
      console.log(
        `Farmer ${farmer4FromCollection.id} | userId=${farmer4FromCollection.userId} | county=${farmer4FromCollection.county.name} | subCounty=${farmer4FromCollection.subCounty.name} | ward=${farmer4FromCollection.ward.name}`,
      );
    }

    assertTrue(
      authorizedFarmers.length >= 1,
      "Database successfully executed the authorization WHERE clause",
    );
  } else {
    fail(
      "Database authorization query could not run because WHERE clause is null",
    );
  }

  section("EXPECTED FARMER GEOGRAPHY");

  const farmer4 =
    await prisma.farmer.findUnique({
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
    farmer4 !== null,
    `Farmer ${EXPECTED_FARMER_ID} loaded`,
  );

  if (farmer4) {
    console.log(
      `Geography: ${farmer4.county.country.name} → ${farmer4.county.name} → ${farmer4.subCounty.name} → ${farmer4.ward.name}`,
    );

    assertTrue(
      farmer4.county.country.name === "Kenya",
      `Farmer ${EXPECTED_FARMER_ID} belongs to Kenya`,
    );
  }

  section("NATIONAL SCOPE AUTHORIZATION TEST");

  const hasNationalAssignment =
    assignments.some(
      (assignment) =>
        assignment.active &&
        assignment.scopeLevel === "NATIONAL" &&
        assignment.countryId !== null,
    );

  assertTrue(
    hasNationalAssignment,
    "User has an active NATIONAL authorization assignment",
  );

  section(
    "COLLECTION / SINGLE-FARMER AUTHORIZATION CONSISTENCY",
  );

  if (authorizedWhere && farmer4) {
    const collectionMatches =
      await prisma.farmer.count({
        where: {
          AND: [
            authorizedWhere,
            {
              id: EXPECTED_FARMER_ID,
            },
          ],
        },
      });

    assertTrue(
      collectionMatches === 1,
      `Farmer ${EXPECTED_FARMER_ID} is accessible through the collection authorization`,
    );
  } else {
    fail(
      "Cannot perform collection/single-farmer consistency test",
    );
  }

  section("UNFILTERED COLLECTION PROTECTION");

  const farmerFindManyMatches =
    getSource.match(
      /prisma\.farmer\.findMany\s*\(/g,
    ) ?? [];

  assertTrue(
    farmerFindManyMatches.length >= 1,
    "Farmer findMany exists in GET",
  );

  assertTrue(
    getSource.includes(
      "where: authorizedWhere",
    ),
    "Farmer findMany contains authorization WHERE clause",
  );

  section("ROUTE SURFACE CHECK");

  assertTrue(
    !routeSource.includes(
      "export async function DELETE",
    ),
    "No DELETE handler exposed in Farmer route",
  );

  assertTrue(
    !routeSource.includes(
      "export async function PUT",
    ),
    "No PUT handler exposed in Farmer route",
  );

  assertTrue(
    !routeSource.includes(
      "export async function PATCH",
    ),
    "No PATCH handler exposed in Farmer route",
  );

  console.log("");
  console.log("=".repeat(60));
  console.log("V40.7 FINAL RESULT");
  console.log("=".repeat(60));
  console.log(`PASS   : ${passCount}`);
  console.log(`FAIL   : ${failCount}`);
  console.log(`REVIEW : ${reviewCount}`);

  if (
    failCount === 0 &&
    reviewCount === 0
  ) {
    console.log(
      "V40.7 STATUS: GREEN",
    );
  } else if (failCount === 0) {
    console.log(
      "V40.7 STATUS: GREEN WITH REVIEW",
    );
  } else {
    console.log(
      "V40.7 STATUS: RED",
    );
  }

  console.log("");

  if (failCount === 0) {
    console.log(
      "Farmer API authorization integration is structurally and operationally GREEN.",
    );
    console.log(
      "Collection authorization is enforced through OfficerAssignment scopes.",
    );
    console.log(
      "PostgreSQL receives the generated authorization WHERE clause.",
    );
    console.log(
      "The Farmer collection does not depend on the old primary-role gate.",
    );
  } else {
    console.log(
      "One or more Farmer API authorization checks failed.",
    );
  }

  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V40.7 AUDIT ERROR",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });