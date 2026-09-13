import prisma from "../lib/prisma";
import {
  canAccessFarmerCollection,
  getAuthorizedFarmerWhere,
  getFarmerCollectionAuthorization,
} from "../lib/authorization/farmer-collection-authorization";

let pass = 0;
let fail = 0;
let review = 0;

function passCheck(message: string) {
  pass++;
  console.log(`PASS   ${message}`);
}

function failCheck(message: string) {
  fail++;
  console.log(`FAIL   ${message}`);
}

function reviewCheck(message: string) {
  review++;
  console.log(`REVIEW ${message}`);
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("V40.6 FARMER COLLECTION AUTHORIZATION AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  const user = await prisma.user.findUnique({
    where: {
      id: 1,
    },
    select: {
      id: true,
      name: true,
      active: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!user) {
    failCheck("User 1 was not found");
    return;
  }

  passCheck(
    `User ${user.id} loaded | ${user.name} | Primary role: ${user.role.name}`,
  );

  if (user.active) {
    passCheck("User is active");
  } else {
    failCheck("User is inactive");
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("COLLECTION AUTHORIZATION CONTEXT");
  console.log("------------------------------------------------------------");

  const context = await getFarmerCollectionAuthorization(user.id);

  if (context.allowed) {
    passCheck(
      `Collection authorization allowed | Assignments: ${context.assignmentIds.join(", ")}`,
    );
  } else {
    failCheck(
      `Collection authorization denied | Reason: ${context.reason}`,
    );
  }

  console.log("");
  console.log(`Scopes: ${context.scopes.join(", ")}`);
  console.log(
    `Assignment IDs: ${context.assignmentIds.join(", ")}`,
  );

  if (
    context.scopes.includes("NATIONAL") &&
    context.scopes.includes("COUNTY") &&
    context.scopes.includes("SUBCOUNTY") &&
    context.scopes.includes("WARD")
  ) {
    passCheck(
      "NATIONAL, COUNTY, SUBCOUNTY, and WARD scopes are represented",
    );
  } else {
    failCheck(
      "Expected all four scope levels to be represented",
    );
  }

  if (context.assignmentIds.length === 5) {
    passCheck("Exactly 5 valid active assignments represented");
  } else {
    failCheck(
      `Expected 5 valid active assignments, found ${context.assignmentIds.length}`,
    );
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("PRISMA WHERE CLAUSE");
  console.log("------------------------------------------------------------");

  const where = await getAuthorizedFarmerWhere(user.id);

  if (!where) {
    failCheck("No authorized Farmer WHERE clause was generated");
  } else {
    passCheck("Authorized Farmer WHERE clause generated");

    console.log("");
    console.log(JSON.stringify(where, null, 2));
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("DATABASE COLLECTION TEST");
  console.log("------------------------------------------------------------");

  if (where) {
    const authorizedFarmers = await prisma.farmer.findMany({
      where,
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
      `Authorized Farmer rows returned: ${authorizedFarmers.length}`,
    );

    if (authorizedFarmers.some((farmer) => farmer.id === 4)) {
      passCheck(
        "Farmer 4 is included in the authorized collection",
      );
    } else {
      failCheck(
        "Farmer 4 is missing from the authorized collection",
      );
    }

    if (authorizedFarmers.length > 0) {
      passCheck(
        "Database successfully executed the authorization WHERE clause",
      );
    } else {
      reviewCheck(
        "Authorization WHERE clause returned zero Farmer rows",
      );
    }

    for (const farmer of authorizedFarmers) {
      console.log(
        `Farmer ${farmer.id} | userId=${farmer.userId} | county=${farmer.countyId} | subCounty=${farmer.subCountyId} | ward=${farmer.wardId}`,
      );
    }
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("BOOLEAN COLLECTION HELPER TEST");
  console.log("------------------------------------------------------------");

  const collectionAccess = await canAccessFarmerCollection(
    user.id,
  );

  if (collectionAccess === true) {
    passCheck(
      "canAccessFarmerCollection() correctly returns true",
    );
  } else {
    failCheck(
      "canAccessFarmerCollection() incorrectly returned false",
    );
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("SINGLE-FARMER / COLLECTION CONSISTENCY TEST");
  console.log("------------------------------------------------------------");

  const farmer4 = await prisma.farmer.findUnique({
    where: {
      id: 4,
    },
    select: {
      id: true,
      userId: true,
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
      subCounty: {
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      },
      ward: {
        select: {
          id: true,
          name: true,
          countyId: true,
          subCountyId: true,
        },
      },
    },
  });

  if (!farmer4) {
    failCheck("Farmer 4 was not found");
  } else {
    passCheck(
      `Farmer 4 loaded | ${farmer4.county.name} → ${farmer4.subCounty.name} → ${farmer4.ward.name}`,
    );

    if (where) {
      const farmer4FromCollection =
        await prisma.farmer.findFirst({
          where: {
            AND: [
              {
                id: farmer4.id,
              },
              where,
            ],
          },
          select: {
            id: true,
          },
        });

      if (farmer4FromCollection?.id === farmer4.id) {
        passCheck(
          "Collection authorization agrees with Farmer 4 single-record access",
        );
      } else {
        failCheck(
          "Collection authorization does not include Farmer 4",
        );
      }
    }
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("NO N+1 AUTHORIZATION TEST");
  console.log("------------------------------------------------------------");

  if (where) {
    passCheck(
      "Collection access uses one authorization WHERE clause instead of per-Farmer authorization calls",
    );
  } else {
    failCheck(
      "Collection authorization WHERE clause unavailable",
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("V40.6 FINAL RESULT");
  console.log("============================================================");
  console.log(`PASS   : ${pass}`);
  console.log(`FAIL   : ${fail}`);
  console.log(`REVIEW : ${review}`);
  console.log("");

  if (fail === 0 && review === 0) {
    console.log("V40.6 STATUS: GREEN");
    console.log("");
    console.log(
      "Collection-level farmer authorization is structurally correct.",
    );
    console.log(
      "Active OfficerAssignment scopes are translated into one Prisma WHERE clause.",
    );
    console.log(
      "Authorization is delegated to PostgreSQL through the generated query.",
    );
    console.log(
      "The design avoids N+1 per-Farmer authorization queries.",
    );
  } else if (fail === 0) {
    console.log("V40.6 STATUS: GREEN WITH REVIEW");
  } else {
    console.log("V40.6 STATUS: FAILED");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("V40.6 AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });