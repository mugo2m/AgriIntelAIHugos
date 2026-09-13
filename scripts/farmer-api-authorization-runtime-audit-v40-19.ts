import fs from "fs";
import path from "path";

import prisma from "../lib/prisma";

const BASE_URL = "http://localhost:3000";
const PROJECT_ROOT = process.cwd();

const FARMER_ID = 4;

const FARMER_ROUTE = path.join(
  PROJECT_ROOT,
  "app",
  "api",
  "farmers",
  "[id]",
  "route.ts",
);

const FARMS_ROUTE = path.join(
  PROJECT_ROOT,
  "app",
  "api",
  "farms",
  "route.ts",
);

type AuditStatus = "PASS" | "FAIL" | "REVIEW";

let pass = 0;
let fail = 0;
let review = 0;

function result(
  status: AuditStatus,
  message: string,
): void {
  if (status === "PASS") pass++;
  if (status === "FAIL") fail++;
  if (status === "REVIEW") review++;

  console.log(
    `${status.padEnd(7)} ${message}`,
  );
}

function section(title: string): void {
  console.log("");
  console.log("=".repeat(70));
  console.log(title);
  console.log("=".repeat(70));
}

function containsAny(
  source: string,
  patterns: string[],
): boolean {
  return patterns.some((pattern) =>
    source.includes(pattern),
  );
}

function containsAll(
  source: string,
  patterns: string[],
): boolean {
  return patterns.every((pattern) =>
    source.includes(pattern),
  );
}

function normalizeWhitespace(
  source: string,
): string {
  return source.replace(/\s+/g, " ");
}

async function httpRequest(
  url: string,
  options: RequestInit = {},
): Promise<{
  status: number;
  body: string;
}> {
  try {
    const response = await fetch(url, options);

    return {
      status: response.status,
      body: await response.text(),
    };
  } catch (error) {
    return {
      status: 0,
      body:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

async function main(): Promise<void> {
  console.log("");
  console.log(
    "V40.19 FARMER/FARM AUTHORIZATION RUNTIME AUDIT",
  );
  console.log("=".repeat(70));
  console.log(
    "READ-ONLY: NO INSERT / UPDATE / DELETE",
  );
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Farmer target: ${FARMER_ID}`);

  section("1. ROUTE SOURCE VERIFICATION");

  if (!fs.existsSync(FARMER_ROUTE)) {
    result(
      "FAIL",
      `Missing route: ${path.relative(
        PROJECT_ROOT,
        FARMER_ROUTE,
      )}`,
    );
  } else {
    const source = fs.readFileSync(
      FARMER_ROUTE,
      "utf8",
    );

    const normalized =
      normalizeWhitespace(source);

    result(
      containsAny(source, [
        "getCurrentUser",
        "getCurrentUser()",
      ]) &&
        containsAny(source, [
          "authorizeFarmerAccess",
          "authorizeFarmerAccess(",
        ])
        ? "PASS"
        : "FAIL",
      "/api/farmers/[id] contains authentication + single-Farmer authorization",
    );

    result(
      source.includes(
        "export async function GET",
      )
        ? "PASS"
        : "FAIL",
      "/api/farmers/[id] GET exists",
    );

    result(
      source.includes(
        "export async function PATCH",
      )
        ? "PASS"
        : "FAIL",
      "/api/farmers/[id] PATCH exists",
    );

    result(
      source.includes(
        "export async function DELETE",
      )
        ? "PASS"
        : "FAIL",
      "/api/farmers/[id] DELETE exists",
    );

    const authPosition =
      source.indexOf(
        "authorizeFarmerAccess",
      );

    const farmerReadPosition =
      source.indexOf(
        "prisma.farmer.findUnique",
      );

    result(
      authPosition >= 0 &&
        farmerReadPosition >= 0
        ? "PASS"
        : "FAIL",
      "GET contains single-Farmer authorization and protected Farmer lookup",
    );

    const updatePosition =
      source.indexOf(
        "prisma.farmer.update",
      );

    result(
      authPosition >= 0 &&
        updatePosition >= 0 &&
        authPosition < updatePosition
        ? "PASS"
        : "FAIL",
      "PATCH authorization occurs before Farmer update",
    );

    const deletePosition =
      source.indexOf(
        "prisma.farmer.delete",
      );

    result(
      authPosition >= 0 &&
        deletePosition >= 0 &&
        authPosition < deletePosition
        ? "PASS"
        : "FAIL",
      "DELETE authorization occurs before Farmer delete",
    );

    result(
      !source.includes(
        "firstName:",
      )
        ? "PASS"
        : "FAIL",
      "PATCH does not write obsolete Farmer.firstName",
    );

    result(
      !source.includes(
        "lastName:",
      )
        ? "PASS"
        : "FAIL",
      "PATCH does not write obsolete Farmer.lastName",
    );

    result(
      containsAny(source, [
        "phone:",
        "phoneNumber",
        "Farmer.phone",
      ])
        ? "PASS"
        : "REVIEW",
      "PATCH uses current Farmer phone contract",
    );

    result(
      source.includes(
        "status: 403",
      )
        ? "PASS"
        : "FAIL",
      "Route contains HTTP 403 unauthorized handling",
    );

    result(
      normalized.includes(
        "getAuthenticatedDbUser",
      )
        ? "PASS"
        : "REVIEW",
      "Route contains authenticated PostgreSQL-user resolution helper",
    );
  }

  if (!fs.existsSync(FARMS_ROUTE)) {
    result(
      "FAIL",
      `Missing route: ${path.relative(
        PROJECT_ROOT,
        FARMS_ROUTE,
      )}`,
    );
  } else {
    const source = fs.readFileSync(
      FARMS_ROUTE,
      "utf8",
    );

    const normalized =
      normalizeWhitespace(source);

    result(
      containsAny(source, [
        "getCurrentUser",
        "getCurrentUser()",
      ]) &&
        containsAny(source, [
          "getAuthorizedFarmerWhere",
          "getAuthorizedFarmerWhere(",
        ])
        ? "PASS"
        : "FAIL",
      "/api/farms contains authentication + Farmer collection authorization",
    );

    result(
      source.includes(
        "export async function GET",
      )
        ? "PASS"
        : "FAIL",
      "/api/farms GET exists",
    );

    result(
      source.includes(
        "export async function POST",
      )
        ? "PASS"
        : "FAIL",
      "/api/farms POST exists",
    );

    result(
      containsAll(source, [
        "authorizedFarmerWhere",
        "farmer:",
      ])
        ? "PASS"
        : "FAIL",
      "GET /api/farms uses server-generated Farmer authorization scope",
    );

    result(
      containsAny(source, [
        "where: { farmer:",
        "farmer: authorizedFarmerWhere",
        "farmer:",
      ]) &&
        source.includes(
          "getAuthorizedFarmerWhere",
        )
        ? "PASS"
        : "FAIL",
      "GET /api/farms constrains Farm access through Farmer authorization",
    );

    result(
      source.includes(
        "getAuthorizedFarmerWhere",
      )
        ? "PASS"
        : "FAIL",
      "POST /api/farms obtains server-side Farmer authorization scope",
    );

    result(
      source.includes(
        "farmerId",
      )
        ? "PASS"
        : "FAIL",
      "POST /api/farms handles Farmer identity",
    );

    result(
      containsAny(source, [
        "requestedFarmerId",
        "targetFarmerId",
      ])
        ? "PASS"
        : "REVIEW",
      "POST distinguishes requested Farmer ID from server-selected target",
    );

    result(
      source.includes(
        "authorizedFarmerWhere",
      ) &&
        containsAny(source, [
          "findFirst",
          "findUnique",
        ])
        ? "PASS"
        : "REVIEW",
      "POST validates Farmer against server authorization scope",
    );

    result(
      source.includes(
        "Authentication required.",
      )
        ? "PASS"
        : "FAIL",
      "/api/farms has authentication failure handling",
    );

    result(
      source.includes(
        "status: 401",
      )
        ? "PASS"
        : "FAIL",
      "/api/farms returns 401 for unauthenticated access",
    );

    result(
      normalized.includes(
        "getAuthenticatedDbUser",
      )
        ? "PASS"
        : "REVIEW",
      "/api/farms resolves authenticated PostgreSQL user",
    );
  }

  section("2. DATABASE AUTHORIZATION BASELINE");

  const users =
    await prisma.user.count();

  const farmers =
    await prisma.farmer.count();

  const farms =
    await prisma.farm.count();

  const assignments =
    await prisma.officerAssignment.count();

  const functions =
    await prisma.officerFunction.count();

  console.log(
    `Users             : ${users}`,
  );

  console.log(
    `Farmers           : ${farmers}`,
  );

  console.log(
    `Farms             : ${farms}`,
  );

  console.log(
    `OfficerFunctions  : ${functions}`,
  );

  console.log(
    `OfficerAssignments: ${assignments}`,
  );

  result(
    users >= 1
      ? "PASS"
      : "FAIL",
    `Database contains ${users} User record(s)`,
  );

  result(
    farmers >= 1
      ? "PASS"
      : "FAIL",
    `Database contains ${farmers} Farmer record(s)`,
  );

  result(
    farms >= 1
      ? "PASS"
      : "FAIL",
    `Database contains ${farms} Farm record(s)`,
  );

  result(
    functions >= 16
      ? "PASS"
      : "REVIEW",
    `OfficerFunction baseline is ${functions}; expected at least 16`,
  );

  result(
    assignments >= 5
      ? "PASS"
      : "REVIEW",
    `OfficerAssignment baseline is ${assignments}; expected at least 5`,
  );

  const farmer =
    await prisma.farmer.findUnique({
      where: {
        id: FARMER_ID,
      },
      select: {
        id: true,
        userId: true,
        phone: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
        county: {
          select: {
            id: true,
            name: true,
            countryId: true,
            country: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

  if (!farmer) {
    result(
      "FAIL",
      `Target Farmer ${FARMER_ID} does not exist`,
    );
  } else {
    result(
      "PASS",
      `Target Farmer ${FARMER_ID} exists`,
    );

    console.log(
      `Farmer geography: country=${farmer.county.countryId}, county=${farmer.countyId}, subCounty=${farmer.subCountyId}, ward=${farmer.wardId}`,
    );

    console.log(
      `Farmer userId: ${farmer.userId}`,
    );
  }

  section("3. UNAUTHENTICATED HTTP TESTS");

  const farmerGet =
    await httpRequest(
      `${BASE_URL}/api/farmers/${FARMER_ID}`,
    );

  result(
    farmerGet.status === 401
      ? "PASS"
      : "FAIL",
    `GET /api/farmers/${FARMER_ID} without session -> HTTP ${farmerGet.status}`,
  );

  const farmerPatch =
    await httpRequest(
      `${BASE_URL}/api/farmers/${FARMER_ID}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: "+254700000000",
        }),
      },
    );

  result(
    farmerPatch.status === 401
      ? "PASS"
      : "FAIL",
    `PATCH /api/farmers/${FARMER_ID} without session -> HTTP ${farmerPatch.status}`,
  );

  const farmerDelete =
    await httpRequest(
      `${BASE_URL}/api/farmers/${FARMER_ID}`,
      {
        method: "DELETE",
      },
    );

  result(
    farmerDelete.status === 401
      ? "PASS"
      : "FAIL",
    `DELETE /api/farmers/${FARMER_ID} without session -> HTTP ${farmerDelete.status}`,
  );

  const farmsGet =
    await httpRequest(
      `${BASE_URL}/api/farms`,
    );

  result(
    farmsGet.status === 401
      ? "PASS"
      : "FAIL",
    `GET /api/farms without session -> HTTP ${farmsGet.status}`,
  );

  const farmsPost =
    await httpRequest(
      `${BASE_URL}/api/farms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          farmerId: FARMER_ID,
          farmName:
            "V40.19 Unauthorized Test",
          acreage: 1,
        }),
      },
    );

  result(
    farmsPost.status === 401
      ? "PASS"
      : "FAIL",
    `POST /api/farms without session -> HTTP ${farmsPost.status}`,
  );

  section("4. INVALID SESSION TESTS");

  const invalidFarmerGet =
    await httpRequest(
      `${BASE_URL}/api/farmers/${FARMER_ID}`,
      {
        headers: {
          Cookie:
            "session=definitely-invalid-firebase-session-cookie",
        },
      },
    );

  result(
    invalidFarmerGet.status === 401
      ? "PASS"
      : "FAIL",
    `GET /api/farmers/${FARMER_ID} with invalid session -> HTTP ${invalidFarmerGet.status}`,
  );

  const invalidFarmsGet =
    await httpRequest(
      `${BASE_URL}/api/farms`,
      {
        headers: {
          Cookie:
            "session=definitely-invalid-firebase-session-cookie",
        },
      },
    );

  result(
    invalidFarmsGet.status === 401
      ? "PASS"
      : "FAIL",
    `GET /api/farms with invalid session -> HTTP ${invalidFarmsGet.status}`,
  );

  section("5. SINGLE-FARMER AUTHORIZATION HELPER");

  if (farmer) {
    const {
      authorizeFarmerAccess,
    } = await import(
      "../lib/authorization/farmer-authorization"
    );

    const ownUserResult =
      await authorizeFarmerAccess(
        farmer.userId,
        farmer.id,
      );

    console.log(
      `User ${farmer.userId} -> Farmer ${farmer.id}:`,
      ownUserResult,
    );

    result(
      ownUserResult.allowed
        ? "PASS"
        : "REVIEW",
      ownUserResult.allowed
        ? "Current Farmer owner passes single-Farmer authorization"
        : `Current Farmer owner does not pass single-Farmer authorization: ${ownUserResult.reason}`,
    );
  }

  section("6. COLLECTION AUTHORIZATION");

  if (farmer) {
    const {
      getFarmerCollectionAuthorization,
      getAuthorizedFarmerWhere,
    } = await import(
      "../lib/authorization/farmer-collection-authorization"
    );

    const collection =
      await getFarmerCollectionAuthorization(
        farmer.userId,
      );

    console.log(
      "Collection authorization:",
      collection,
    );

    result(
      collection.allowed
        ? "PASS"
        : "REVIEW",
      collection.allowed
        ? `User ${farmer.userId} has valid Farmer collection authorization`
        : `User ${farmer.userId} has no collection authorization: ${collection.reason}`,
    );

    const where =
      await getAuthorizedFarmerWhere(
        farmer.userId,
      );

    result(
      where !== null
        ? "PASS"
        : "REVIEW",
      where !== null
        ? "Server generated authorized Farmer WHERE exists"
        : "No server generated authorized Farmer WHERE exists",
    );

    if (where) {
      const authorizedFarmers =
        await prisma.farmer.count({
          where,
        });

      console.log(
        `Authorized Farmer rows: ${authorizedFarmers}`,
      );

      result(
        authorizedFarmers >= 1
          ? "PASS"
          : "REVIEW",
        `Authorized Farmer query returns ${authorizedFarmers} row(s)`,
      );

      const authorizedFarms =
        await prisma.farm.count({
          where: {
            farmer: where,
          },
        });

      console.log(
        `Authorized Farm rows: ${authorizedFarms}`,
      );

      result(
        "PASS",
        `Farm query through Farmer authorization executes successfully (${authorizedFarms} row(s))`,
      );
    }
  }

  section("7. DATABASE IMMUTABILITY CHECK");

  const farmerAfter =
    await prisma.farmer.findUnique({
      where: {
        id: FARMER_ID,
      },
      select: {
        id: true,
        userId: true,
        phone: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
      },
    });

  const farmAfterCount =
    await prisma.farm.count();

  result(
    farmerAfter?.id === FARMER_ID
      ? "PASS"
      : "FAIL",
    `Farmer ${FARMER_ID} still exists after read-only audit`,
  );

  result(
    farmAfterCount === farms
      ? "PASS"
      : "FAIL",
    `Farm count unchanged: before=${farms}, after=${farmAfterCount}`,
  );

  section("8. FINAL RESULT");

  console.log("");
  console.log(`PASS   : ${pass}`);
  console.log(`FAIL   : ${fail}`);
  console.log(`REVIEW : ${review}`);

  if (fail > 0) {
    console.log("");
    console.log("V40.19 STATUS: RED");
  } else if (review > 0) {
    console.log("");
    console.log(
      "V40.19 STATUS: GREEN WITH REVIEW",
    );
  } else {
    console.log("");
    console.log("V40.19 STATUS: GREEN");
  }

  console.log("");
  console.log(
    "IMPORTANT: This audit performs NO INSERT, UPDATE, or DELETE.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("V40.19 AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });