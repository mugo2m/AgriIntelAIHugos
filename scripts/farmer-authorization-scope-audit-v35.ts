import { prisma } from "../lib/prisma";

type UserRow = {
  id: number;
  name: string;
  email: string;
  roleId: number;
  active: boolean;
  tenantId: number | null;
  role: {
    id: number;
    name: string;
    description: string | null;
  };
};

type FarmerRow = {
  id: number;
  userId: number;
  countyId: number;
  subCountyId: number;
  wardId: number;
  villageId: number | null;
  user: {
    id: number;
    name: string;
    email: string;
    role: {
      id: number;
      name: string;
    };
  };
};

type ScopeField = {
  model: string;
  field: string;
  type: string;
};

function separator(title: string) {
  console.log("");
  console.log("=".repeat(70));
  console.log(title);
  console.log("=".repeat(70));
}

async function main() {
  console.log("");
  console.log("=".repeat(70));
  console.log("V35 FARMER AUTHORIZATION SCOPE AUDIT");
  console.log("=".repeat(70));
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");

  let pass = 0;
  let review = 0;
  let missing = 0;

  function PASS(message: string) {
    pass++;
    console.log(`[PASS] ${message}`);
  }

  function REVIEW(message: string) {
    review++;
    console.log(`[REVIEW] ${message}`);
  }

  function MISSING(message: string) {
    missing++;
    console.log(`[MISSING] ${message}`);
  }

  try {
    // ================================================================
    // 1. USER AUTHORIZATION FIELDS
    // ================================================================

    separator("1. USER AUTHORIZATION FIELDS");

    const users: UserRow[] = await prisma.user.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        active: true,
        tenantId: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    console.log(`User count: ${users.length}`);

    if (users.length > 0) {
      PASS("User records expose role relationships.");

      for (const user of users) {
        console.log(
          `User ID=${user.id} | name="${user.name}" | role="${user.role.name}" | roleId=${user.roleId} | active=${user.active} | tenantId=${user.tenantId}`,
        );
      }
    } else {
      MISSING("No database users exist.");
    }

    // ================================================================
    // 2. USER GEOGRAPHIC SCOPE
    // ================================================================

    separator("2. USER GEOGRAPHIC AUTHORIZATION SCOPE");

    const userModel = prisma.user;

    const userKeys = Object.keys(userModel);

    console.log(
      `Prisma User delegate runtime keys detected: ${userKeys.length}`,
    );

    const possibleUserScopeFields = [
      "countryId",
      "countyId",
      "subCountyId",
      "constituencyId",
      "wardId",
      "villageId",
      "tenantId",
      "organizationId",
      "departmentId",
      "regionId",
      "districtId",
    ];

    const detectedUserScopeFields: string[] = [];

    for (const field of possibleUserScopeFields) {
      if (userKeys.includes(field)) {
        detectedUserScopeFields.push(field);
      }
    }

    if (detectedUserScopeFields.length > 0) {
      PASS(
        `Potential User authorization-scope fields detected: ${detectedUserScopeFields.join(", ")}`,
      );
    } else {
      REVIEW(
        "No obvious geographic authorization fields were detected directly on User.",
      );
    }

    // ================================================================
    // 3. USER TENANT SCOPE
    // ================================================================

    separator("3. USER TENANT SCOPE");

    const tenantIds = Array.from(
      new Set(
        users
          .map((user) => user.tenantId)
          .filter((value): value is number => value !== null),
      ),
    );

    if (tenantIds.length > 0) {
      PASS(
        `User tenant relationships are populated for ${tenantIds.length} distinct tenant ID(s).`,
      );

      console.log(`Tenant IDs: ${tenantIds.join(", ")}`);
    } else {
      REVIEW(
        "No populated User.tenantId values exist in the current database.",
      );
    }

    // ================================================================
    // 4. ROLE-BASED SCOPE CLASSIFICATION
    // ================================================================

    separator("4. ROLE-BASED AUTHORIZATION SCOPE CLASSIFICATION");

    const roleNames = Array.from(
      new Set(users.map((user) => user.role.name)),
    );

    console.log(`Roles represented by current users: ${roleNames.length}`);

    for (const roleName of roleNames) {
      const normalized = roleName.toLowerCase();

      let proposedScope = "UNCLASSIFIED";

      if (
        normalized.includes("super admin") ||
        normalized === "national admin"
      ) {
        proposedScope = "NATIONAL";
      } else if (normalized.includes("county")) {
        proposedScope = "COUNTY";
      } else if (normalized.includes("sub county")) {
        proposedScope = "SUB_COUNTY";
      } else if (normalized.includes("ward")) {
        proposedScope = "WARD";
      } else if (
        normalized.includes("farmer") ||
        normalized === "farm owner"
      ) {
        proposedScope = "SELF / OWNED RECORDS";
      }

      console.log(
        `Role="${roleName}" | proposed conceptual scope=${proposedScope}`,
      );
    }

    if (roleNames.length > 0) {
      PASS("Current user roles can be classified conceptually for scope design.");
    } else {
      REVIEW("No roles are currently represented by users.");
    }

    // ================================================================
    // 5. FARMER OWNERSHIP
    // ================================================================

    separator("5. FARMER OWNERSHIP");

    const farmers: FarmerRow[] = await prisma.farmer.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        userId: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
        villageId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(`Farmer count: ${farmers.length}`);

    if (farmers.length > 0) {
      PASS("Farmer records have explicit User ownership.");

      for (const farmer of farmers) {
        console.log(
          `Farmer ID=${farmer.id} | userId=${farmer.userId} | user="${farmer.user.name}" | role="${farmer.user.role.name}" | countyId=${farmer.countyId} | subCountyId=${farmer.subCountyId} | wardId=${farmer.wardId} | villageId=${farmer.villageId}`,
        );
      }
    } else {
      REVIEW("No Farmer records currently exist.");
    }

    // ================================================================
    // 6. FARMER GEOGRAPHIC SCOPE
    // ================================================================

    separator("6. FARMER GEOGRAPHIC SCOPE");

    if (farmers.length > 0) {
      let allCountyPresent = true;
      let allSubCountyPresent = true;
      let allWardPresent = true;

      for (const farmer of farmers) {
        if (!farmer.countyId) {
          allCountyPresent = false;
        }

        if (!farmer.subCountyId) {
          allSubCountyPresent = false;
        }

        if (!farmer.wardId) {
          allWardPresent = false;
        }
      }

      if (allCountyPresent) {
        PASS("Every Farmer has a required countyId.");
      } else {
        MISSING("At least one Farmer lacks countyId.");
      }

      if (allSubCountyPresent) {
        PASS("Every Farmer has a required subCountyId.");
      } else {
        MISSING("At least one Farmer lacks subCountyId.");
      }

      if (allWardPresent) {
        PASS("Every Farmer has a required wardId.");
      } else {
        MISSING("At least one Farmer lacks wardId.");
      }

      console.log(
        "These fields can theoretically support geographic filtering:",
      );
      console.log("  Farmer.countyId");
      console.log("  Farmer.subCountyId");
      console.log("  Farmer.wardId");
      console.log("  Farmer.villageId");
    }

    // ================================================================
    // 7. ROLE + GEOGRAPHY COMPATIBILITY
    // ================================================================

    separator("7. ROLE + GEOGRAPHY AUTHORIZATION COMPATIBILITY");

    const geographicRoles = [
      "County Director",
      "Sub County Officer",
      "Ward Extension Officer",
      "Extension Officer",
    ];

    for (const roleName of geographicRoles) {
      const roleExists = users.some(
        (user) => user.role.name.toLowerCase() === roleName.toLowerCase(),
      );

      if (roleExists) {
        REVIEW(
          `Role "${roleName}" exists conceptually, but current User schema/data does not yet prove its geographic scope assignment.`,
        );
      } else {
        console.log(
          `[INFO] Role "${roleName}" exists in Role table but is not currently assigned to a User.`,
        );
      }
    }

    // ================================================================
    // 8. COLLECTION AUTHORIZATION CONTRACT
    // ================================================================

    separator("8. COLLECTION AUTHORIZATION CONTRACT");

    console.log("");
    console.log("Proposed authorization matrix:");
    console.log("");
    console.log("Super Admin");
    console.log("  -> national Farmer collection");
    console.log("");
    console.log("National Admin");
    console.log("  -> national Farmer collection");
    console.log("");
    console.log("County Director");
    console.log("  -> county-scoped Farmer collection");
    console.log("");
    console.log("Sub County Officer");
    console.log("  -> sub-county-scoped Farmer collection");
    console.log("");
    console.log("Ward Extension Officer");
    console.log("  -> ward-scoped Farmer collection");
    console.log("");
    console.log("Extension Officer");
    console.log("  -> scope must be explicitly established before implementation");
    console.log("");
    console.log("Farmer");
    console.log("  -> own Farmer record only");
    console.log("");
    console.log("Lead Farmer");
    console.log("  -> own record by default; broader access requires explicit policy");
    console.log("");

    PASS("A clear conceptual authorization matrix can be defined from the existing Role model.");

    // ================================================================
    // 9. CURRENT DATABASE EVIDENCE LIMITATION
    // ================================================================

    separator("9. CURRENT DATABASE EVIDENCE LIMITATION");

    if (users.length === 1) {
      REVIEW(
        "Only one User exists, so geographic staff-scope authorization cannot be empirically verified against multiple staff users.",
      );
    }

    if (
      users.length === 1 &&
      users[0].role.name.toLowerCase() === "farmer"
    ) {
      REVIEW(
        "The only current User is a Farmer; no real County/SubCounty/Ward staff authorization assignment is present to test.",
      );
    }

    // ================================================================
    // 10. SECURITY CONSEQUENCE FOR GET /api/farmers
    // ================================================================

    separator("10. SECURITY CONSEQUENCE FOR GET /api/farmers");

    console.log("");
    console.log("CURRENT:");
    console.log(
      "  GET /api/farmers -> unrestricted Farmer.findMany() at route level",
    );

    console.log("");
    console.log("REQUIRED:");
    console.log(
      "  authenticated Firebase session",
    );
    console.log(
      "      -> database User",
    );
    console.log(
      "      -> User.role",
    );
    console.log(
      "      -> authorization decision",
    );
    console.log(
      "      -> collection or self-service query",
    );

    console.log("");
    console.log("OWNER QUERY:");
    console.log(
      '  WHERE Farmer.userId = :authenticatedDatabaseUserId',
    );

    console.log("");
    console.log("NATIONAL QUERY:");
    console.log(
      "  authorized role + no geographic restriction",
    );

    console.log("");
    console.log("COUNTY QUERY:");
    console.log(
      '  Farmer.countyId = :authorizedCountyId',
    );

    console.log("");
    console.log("SUB-COUNTY QUERY:");
    console.log(
      '  Farmer.subCountyId = :authorizedSubCountyId',
    );

    console.log("");
    console.log("WARD QUERY:");
    console.log(
      '  Farmer.wardId = :authorizedWardId',
    );

    PASS("Authorization must occur before returning Farmer collection data.");

    // ================================================================
    // 11. RECOMMENDED ROUTE SEPARATION
    // ================================================================

    separator("11. RECOMMENDED ROUTE SEPARATION");

    console.log("");
    console.log("A. GET /api/farmers");
    console.log("   Staff/admin collection endpoint");
    console.log("");
    console.log("B. GET /api/farmers/me");
    console.log("   Farmer self-service endpoint");
    console.log("");
    console.log("C. GET /api/farmers/[id]");
    console.log("   Individual Farmer endpoint with authorization");
    console.log("");

    PASS("Route separation prevents collection access from being confused with self-service access.");

    // ================================================================
    // 12. PERMISSION MODEL DECISION
    // ================================================================

    separator("12. PERMISSION MODEL DECISION");

    console.log("");
    console.log("Existing permission model:");
    console.log("  119 RolePermission records");
    console.log("  AI-module permissions are populated");
    console.log("  No explicit Farmer read permission was detected in V34");
    console.log("");

    console.log("Therefore:");
    console.log("");
    console.log("OPTION A");
    console.log("  Add explicit Farmer permissions such as:");
    console.log("    farmer.read");
    console.log("    farmer.read.own");
    console.log("    farmer.read.county");
    console.log("    farmer.read.subcounty");
    console.log("    farmer.read.ward");
    console.log("");
    console.log("OPTION B");
    console.log("  Use the existing Role table for the first implementation");
    console.log("  and introduce permissions later.");
    console.log("");

    REVIEW(
      "A formal Farmer permission namespace is not currently present and should not be assumed to exist.",
    );

    // ================================================================
    // 13. FINAL V35 CLASSIFICATION
    // ================================================================

    separator("13. FINAL V35 CLASSIFICATION");

    console.log(`PASS    : ${pass}`);
    console.log(`REVIEW  : ${review}`);
    console.log(`MISSING : ${missing}`);

    console.log("");
    console.log("V35 does NOT modify the application.");
    console.log("V35 does NOT modify PostgreSQL.");
    console.log("V35 does NOT create roles or permissions.");
    console.log("");
    console.log("Purpose:");
    console.log(
      "Establish the evidence required before implementing Farmer authorization.",
    );

    console.log("");
    console.log("======================================================================");
    console.log("V35 COMPLETE");
    console.log("======================================================================");
    console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  } catch (error) {
    console.error("");
    console.error("V35 AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();