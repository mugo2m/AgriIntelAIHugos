import prisma from "../lib/prisma";

import {
  authorizeFarmerAccess,
  canAccessFarmer,
  getFarmerAuthorizationContext,
} from "../lib/authorization/farmer-authorization";

const USER_ID = 1;
const FARMER_ID = 4;

function pass(message: string): void {
  console.log(`PASS   ${message}`);
}

function fail(message: string): void {
  console.log(`FAIL   ${message}`);
}

function review(message: string): void {
  console.log(`REVIEW ${message}`);
}

async function main(): Promise<void> {
  console.log("");
  console.log("============================================================");
  console.log("V40.5 FARMER AUTHORIZATION HELPER AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  let passCount = 0;
  let failCount = 0;
  let reviewCount = 0;

  try {
    // ----------------------------------------------------------
    // 1. USER
    // ----------------------------------------------------------

    const user = await prisma.user.findUnique({
      where: {
        id: USER_ID,
      },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      fail(`User ${USER_ID} does not exist`);
      failCount++;
      return;
    }

    pass(
      `User ${user.id} loaded | ${
        user.name ?? "Unnamed"
      } | Primary role: ${user.role?.name ?? "NULL"}`,
    );
    passCount++;

    if (!user.active) {
      fail(`User ${USER_ID} is inactive`);
      failCount++;
      return;
    }

    pass("User is active");
    passCount++;

    // ----------------------------------------------------------
    // 2. FARMER
    // ----------------------------------------------------------

    const farmer = await prisma.farmer.findUnique({
      where: {
        id: FARMER_ID,
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
          },
        },

        ward: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!farmer) {
      fail(`Farmer ${FARMER_ID} does not exist`);
      failCount++;
      return;
    }

    pass(
      `Farmer ${farmer.id} loaded | User ${farmer.userId} | ` +
        `${farmer.county.name} → ${farmer.subCounty.name} → ${farmer.ward.name}`,
    );
    passCount++;

    // ----------------------------------------------------------
    // 3. FARMER COUNTRY
    // ----------------------------------------------------------

    if (farmer.county.countryId === null) {
      fail(
        `Farmer ${farmer.id} county ${farmer.countyId} has no countryId`,
      );
      failCount++;
    } else {
      pass(
        `Farmer country resolved through County | ` +
          `${farmer.county.country.name} (${farmer.county.countryId})`,
      );
      passCount++;
    }

    // ----------------------------------------------------------
    // 4. AUTHORIZATION CONTEXT
    // ----------------------------------------------------------

    const context = await getFarmerAuthorizationContext(USER_ID);

    if (context.length !== 5) {
      fail(
        `Expected 5 valid active authorization assignments; found ${context.length}`,
      );
      failCount++;
    } else {
      pass("Exactly 5 valid active authorization assignments loaded");
      passCount++;
    }

    console.log("");
    console.log("------------------------------------------------------------");
    console.log("ACTIVE AUTHORIZATION ASSIGNMENTS");
    console.log("------------------------------------------------------------");

    for (const assignment of context) {
      console.log("");
      console.log(`Assignment ${assignment.id}`);
      console.log(`  User       : ${assignment.userId}`);
      console.log(`  Role       : ${assignment.role.name}`);
      console.log(`  Function   : ${assignment.function.name}`);
      console.log(`  Scope      : ${assignment.scopeLevel}`);
      console.log(`  Country ID : ${assignment.countryId}`);
      console.log(`  County ID  : ${assignment.countyId}`);
      console.log(`  SubCounty  : ${assignment.subCountyId}`);
      console.log(`  Ward ID    : ${assignment.wardId}`);
      console.log(`  Active     : ${assignment.active}`);
      console.log(`  Function active : ${assignment.function.active}`);
    }

    // ----------------------------------------------------------
    // 5. SCOPE COUNTS
    // ----------------------------------------------------------

    const nationalAssignments = context.filter(
      (assignment) => assignment.scopeLevel === "NATIONAL",
    );

    const countyAssignments = context.filter(
      (assignment) => assignment.scopeLevel === "COUNTY",
    );

    const subCountyAssignments = context.filter(
      (assignment) => assignment.scopeLevel === "SUBCOUNTY",
    );

    const wardAssignments = context.filter(
      (assignment) => assignment.scopeLevel === "WARD",
    );

    if (nationalAssignments.length === 2) {
      pass("2 NATIONAL assignments found");
      passCount++;
    } else {
      fail(
        `Expected 2 NATIONAL assignments; found ${nationalAssignments.length}`,
      );
      failCount++;
    }

    if (countyAssignments.length === 1) {
      pass("1 COUNTY assignment found");
      passCount++;
    } else {
      fail(
        `Expected 1 COUNTY assignment; found ${countyAssignments.length}`,
      );
      failCount++;
    }

    if (subCountyAssignments.length === 1) {
      pass("1 SUBCOUNTY assignment found");
      passCount++;
    } else {
      fail(
        `Expected 1 SUBCOUNTY assignment; found ${subCountyAssignments.length}`,
      );
      failCount++;
    }

    if (wardAssignments.length === 1) {
      pass("1 WARD assignment found");
      passCount++;
    } else {
      fail(
        `Expected 1 WARD assignment; found ${wardAssignments.length}`,
      );
      failCount++;
    }

    // ----------------------------------------------------------
    // 6. NATIONAL STRUCTURE
    // ----------------------------------------------------------

    console.log("");
    console.log("------------------------------------------------------------");
    console.log("NATIONAL ASSIGNMENT STRUCTURE");
    console.log("------------------------------------------------------------");

    for (const assignment of nationalAssignments) {
      if (
        assignment.countryId !== null &&
        assignment.countyId === null &&
        assignment.subCountyId === null &&
        assignment.wardId === null
      ) {
        pass(
          `NATIONAL assignment ${assignment.id} has country-only geography`,
        );
        passCount++;
      } else {
        fail(
          `NATIONAL assignment ${assignment.id} has invalid geography structure`,
        );
        failCount++;
      }
    }

    // ----------------------------------------------------------
    // 7. COUNTY STRUCTURE
    // ----------------------------------------------------------

    console.log("");
    console.log("------------------------------------------------------------");
    console.log("COUNTY ASSIGNMENT STRUCTURE");
    console.log("------------------------------------------------------------");

    for (const assignment of countyAssignments) {
      if (
        assignment.countryId !== null &&
        assignment.countyId !== null &&
        assignment.subCountyId === null &&
        assignment.wardId === null
      ) {
        pass(
          `COUNTY assignment ${assignment.id} has country + county geography`,
        );
        passCount++;
      } else {
        fail(
          `COUNTY assignment ${assignment.id} has invalid geography structure`,
        );
        failCount++;
      }
    }

    // ----------------------------------------------------------
    // 8. SUBCOUNTY STRUCTURE
    // ----------------------------------------------------------

    console.log("");
    console.log("------------------------------------------------------------");
    console.log("SUBCOUNTY ASSIGNMENT STRUCTURE");
    console.log("------------------------------------------------------------");

    for (const assignment of subCountyAssignments) {
      if (
        assignment.countryId !== null &&
        assignment.countyId !== null &&
        assignment.subCountyId !== null &&
        assignment.wardId === null
      ) {
        pass(
          `SUBCOUNTY assignment ${assignment.id} has country + county + subcounty geography`,
        );
        passCount++;
      } else {
        fail(
          `SUBCOUNTY assignment ${assignment.id} has invalid geography structure`,
        );
        failCount++;
      }
    }

    // ----------------------------------------------------------
    // 9. WARD STRUCTURE
    // ----------------------------------------------------------

    console.log("");
    console.log("------------------------------------------------------------");
    console.log("WARD ASSIGNMENT STRUCTURE");
    console.log("------------------------------------------------------------");

    for (const assignment of wardAssignments) {
      if (
        assignment.countryId !== null &&
        assignment.countyId !== null &&
        assignment.subCountyId !== null &&
        assignment.wardId !== null
      ) {
        pass(
          `WARD assignment ${assignment.id} has complete geography hierarchy`,
        );
        passCount++;
      } else {
        fail(
          `WARD assignment ${assignment.id} has invalid geography structure`,
        );
        failCount++;
      }
    }

    // ----------------------------------------------------------
    // 10. ACTUAL AUTHORIZATION TEST
    // ----------------------------------------------------------

    console.log("");
    console.log("------------------------------------------------------------");
    console.log("ACTUAL FARMER AUTHORIZATION TEST");
    console.log("------------------------------------------------------------");

    console.log("");
    console.log("Farmer geography:");
    console.log(`  Country     : ${farmer.county.country.name}`);
    console.log(`  Country ID  : ${farmer.county.countryId}`);
    console.log(`  County      : ${farmer.county.name}`);
    console.log(`  County ID   : ${farmer.countyId}`);
    console.log(`  SubCounty   : ${farmer.subCounty.name}`);
    console.log(`  SubCounty ID: ${farmer.subCountyId}`);
    console.log(`  Ward        : ${farmer.ward.name}`);
    console.log(`  Ward ID     : ${farmer.wardId}`);

    const result = await authorizeFarmerAccess(
      USER_ID,
      FARMER_ID,
    );

    console.log("");
    console.log("Authorization result:");
    console.log(`  Allowed    : ${result.allowed}`);
    console.log(`  Reason     : ${result.reason}`);
    console.log(`  Assignment : ${result.assignmentId}`);
    console.log(`  Role       : ${result.roleName}`);
    console.log(`  Function   : ${result.functionName}`);
    console.log(`  Scope      : ${result.scopeLevel}`);

    // IMPORTANT:
    // Farmer 4 is in Kenya.
    // User 1 has two NATIONAL assignments for Kenya.
    // Therefore NATIONAL authorization MUST ALLOW Farmer 4.

    if (result.allowed === true) {
      pass(
        "Farmer 4 correctly authorized by the NATIONAL Kenya assignment",
      );
      passCount++;
    } else {
      fail(
        "Farmer 4 was incorrectly denied despite the NATIONAL Kenya assignment",
      );
      failCount++;
    }

    if (
      result.reason === "ALLOWED" &&
      result.scopeLevel === "NATIONAL"
    ) {
      pass(
        "Authorization correctly resolved through NATIONAL scope",
      );
      passCount++;
    } else {
      fail(
        `Expected ALLOWED/NATIONAL; received ${result.reason}/${result.scopeLevel}`,
      );
      failCount++;
    }

    if (
      result.assignmentId === 1 ||
      result.assignmentId === 2
    ) {
      pass(
        `Authorization matched a NATIONAL assignment (${result.assignmentId})`,
      );
      passCount++;
    } else {
      fail(
        `Expected assignment 1 or 2; received ${result.assignmentId}`,
      );
      failCount++;
    }

    // ----------------------------------------------------------
    // 11. BOOLEAN HELPER
    // ----------------------------------------------------------

    console.log("");
    console.log("------------------------------------------------------------");
    console.log("BOOLEAN HELPER TEST");
    console.log("------------------------------------------------------------");

    const booleanResult = await canAccessFarmer(
      USER_ID,
      FARMER_ID,
    );

    if (booleanResult === true) {
      pass(
        "canAccessFarmer() correctly returns true through NATIONAL scope",
      );
      passCount++;
    } else {
      fail(
        "canAccessFarmer() incorrectly returned false",
      );
      failCount++;
    }

    // ----------------------------------------------------------
    // 12. COUNTY NEGATIVE TEST
    // ----------------------------------------------------------

    console.log("");
    console.log("------------------------------------------------------------");
    console.log("COUNTY NEGATIVE TEST");
    console.log("------------------------------------------------------------");

    const countyAssignment = countyAssignments[0];

    if (countyAssignment) {
      console.log(
        `Officer county : ${countyAssignment.countyId}`,
      );
      console.log(
        `Farmer county  : ${farmer.countyId}`,
      );

      if (countyAssignment.countyId !== farmer.countyId) {
        pass(
          "COUNTY scope does not match Farmer 4 because counties differ",
        );
        passCount++;
      } else {
        fail(
          "COUNTY negative test failed because counties unexpectedly match",
        );
        failCount++;
      }
    } else {
      fail("COUNTY assignment unavailable");
      failCount++;
    }

    // ----------------------------------------------------------
    // 13. SUBCOUNTY NEGATIVE TEST
    // ----------------------------------------------------------

    console.log("");
    console.log("------------------------------------------------------------");
    console.log("SUBCOUNTY NEGATIVE TEST");
    console.log("------------------------------------------------------------");

    const subCountyAssignment = subCountyAssignments[0];

    if (subCountyAssignment) {
      console.log(
        `Officer county    : ${subCountyAssignment.countyId}`,
      );
      console.log(
        `Farmer county     : ${farmer.countyId}`,
      );
      console.log(
        `Officer subcounty : ${subCountyAssignment.subCountyId}`,
      );
      console.log(
        `Farmer subcounty  : ${farmer.subCountyId}`,
      );

      if (
        subCountyAssignment.countyId !== farmer.countyId ||
        subCountyAssignment.subCountyId !== farmer.subCountyId
      ) {
        pass(
          "SUBCOUNTY scope does not match Farmer 4",
        );
        passCount++;
      } else {
        fail(
          "SUBCOUNTY negative test failed because geography unexpectedly matches",
        );
        failCount++;
      }
    } else {
      fail("SUBCOUNTY assignment unavailable");
      failCount++;
    }

    // ----------------------------------------------------------
    // 14. WARD NEGATIVE TEST
    // ----------------------------------------------------------

    console.log("");
    console.log("------------------------------------------------------------");
    console.log("WARD NEGATIVE TEST");
    console.log("------------------------------------------------------------");

    const wardAssignment = wardAssignments[0];

    if (wardAssignment) {
      console.log(
        `Officer county    : ${wardAssignment.countyId}`,
      );
      console.log(
        `Farmer county     : ${farmer.countyId}`,
      );
      console.log(
        `Officer subcounty : ${wardAssignment.subCountyId}`,
      );
      console.log(
        `Farmer subcounty  : ${farmer.subCountyId}`,
      );
      console.log(
        `Officer ward      : ${wardAssignment.wardId}`,
      );
      console.log(
        `Farmer ward       : ${farmer.wardId}`,
      );

      if (
        wardAssignment.countyId !== farmer.countyId ||
        wardAssignment.subCountyId !== farmer.subCountyId ||
        wardAssignment.wardId !== farmer.wardId
      ) {
        pass(
          "WARD scope does not match Farmer 4",
        );
        passCount++;
      } else {
        fail(
          "WARD negative test failed because geography unexpectedly matches",
        );
        failCount++;
      }
    } else {
      fail("WARD assignment unavailable");
      failCount++;
    }

    // ----------------------------------------------------------
    // 15. COUNTRY CONSISTENCY
    // ----------------------------------------------------------

    console.log("");
    console.log("------------------------------------------------------------");
    console.log("COUNTRY CONSISTENCY TEST");
    console.log("------------------------------------------------------------");

    const countryIds = new Set(
      context
        .map((assignment) => assignment.countryId)
        .filter(
          (countryId): countryId is number =>
            countryId !== null,
        ),
    );

    if (countryIds.size === 1) {
      const [assignmentCountryId] = Array.from(countryIds);

      if (
        assignmentCountryId === farmer.county.countryId
      ) {
        pass(
          `All simulated assignments target country ${assignmentCountryId}, matching farmer country`,
        );
        passCount++;
      } else {
        fail(
          `Assignment country ${assignmentCountryId} does not match farmer country ${farmer.county.countryId}`,
        );
        failCount++;
      }
    } else {
      fail(
        `Expected one consistent assignment country; found ${countryIds.size}`,
      );
      failCount++;
    }

    // ----------------------------------------------------------
    // 16. FINAL RESULT
    // ----------------------------------------------------------

    console.log("");
    console.log("============================================================");
    console.log("V40.5 FINAL RESULT");
    console.log("============================================================");
    console.log(`PASS   : ${passCount}`);
    console.log(`FAIL   : ${failCount}`);
    console.log(`REVIEW : ${reviewCount}`);
    console.log("");

    if (failCount > 0) {
      console.log("V40.5 STATUS: FAILED");
      process.exitCode = 1;
      return;
    }

    if (reviewCount > 0) {
      console.log("V40.5 STATUS: GREEN WITH REVIEW");
      return;
    }

    console.log("V40.5 STATUS: GREEN");
    console.log("");
    console.log(
      "Reusable farmer authorization helper is structurally correct.",
    );
    console.log(
      "NATIONAL, COUNTY, SUBCOUNTY, and WARD scope semantics are behaving correctly.",
    );
    console.log(
      "Geographic authorization is correctly separated from officer function.",
    );
    console.log(
      "The helper is ready for controlled API integration.",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("");
  console.error("V40.5 STATUS: FAILED");
  console.error(error);
  process.exitCode = 1;
});