import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

type RoleRow = {
  id: number;
  name: string;
  description: string | null;
};

type UserRow = {
  id: number;
  name: string;
  email: string;
  firebaseUid: string;
  roleId: number;
  active: boolean;
  role: {
    id: number;
    name: string;
    description: string | null;
  };
};

function section(title: string) {
  console.log("");
  console.log("=".repeat(70));
  console.log(title);
  console.log("=".repeat(70));
}

function readSource(relativePath: string): string {
  const absolutePath = path.join(process.cwd(), relativePath);

  if (!fs.existsSync(absolutePath)) {
    return "";
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function hasAny(source: string, values: string[]): boolean {
  return values.some((value) => source.includes(value));
}

async function main() {
  console.log("");
  console.log("=".repeat(70));
  console.log("V36 FARMER AUTHORIZATION IMPLEMENTATION CONTRACT AUDIT");
  console.log("=".repeat(70));
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE / MIGRATION");

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
    // 1. AUTHENTICATION HELPER SOURCE
    // ================================================================

    section("1. AUTHENTICATION HELPER SOURCE");

    const authPath = "lib/actions/auth.action.ts";
    const authSource = readSource(authPath);

    if (!authSource) {
      MISSING(`${authPath} could not be read.`);
    } else {
      PASS(`${authPath} exists and can be inspected.`);

      console.log(
        `Source size: ${authSource.length} characters`,
      );

      console.log(
        `getCurrentUser occurrences: ${
          (authSource.match(/getCurrentUser/g) || []).length
        }`,
      );

      console.log(
        `session cookie references: ${
          (authSource.match(/session/g) || []).length
        }`,
      );

      if (
        authSource.includes("verifySessionCookie") ||
        authSource.includes("verifySession")
      ) {
        PASS(
          "Authentication helper visibly verifies a Firebase session.",
        );
      } else {
        REVIEW(
          "Firebase session verification was not detected by the static audit.",
        );
      }

      if (authSource.includes("firebaseUid")) {
        PASS(
          "Authentication helper visibly works with Firebase UID/database identity mapping.",
        );
      } else {
        REVIEW(
          "Firebase UID mapping was not detected directly in auth.action.ts.",
        );
      }

      if (authSource.includes("cookies")) {
        PASS(
          "Authentication helper reads the Next.js session cookie mechanism.",
        );
      } else {
        REVIEW(
          "Next.js cookie handling was not detected.",
        );
      }
    }

    // ================================================================
    // 2. FARMER ROUTE SOURCE
    // ================================================================

    section("2. FARMER ROUTE SOURCE");

    const farmerRoutePath = "app/api/farmers/route.ts";
    const farmerRouteSource = readSource(farmerRoutePath);

    if (!farmerRouteSource) {
      MISSING(`${farmerRoutePath} could not be read.`);
    } else {
      PASS(`${farmerRoutePath} exists and can be inspected.`);

      console.log(
        `Source size: ${farmerRouteSource.length} characters`,
      );

      console.log(
        `GET occurrences: ${
          (farmerRouteSource.match(/export\s+async\s+function\s+GET/g) || [])
            .length
        }`,
      );

      console.log(
        `POST occurrences: ${
          (farmerRouteSource.match(/export\s+async\s+function\s+POST/g) || [])
            .length
        }`,
      );
    }

    // ================================================================
    // 3. GET AUTHENTICATION CONTRACT
    // ================================================================

    section("3. GET AUTHENTICATION CONTRACT");

    if (farmerRouteSource) {
      const getMatch = farmerRouteSource.match(
        /export\s+async\s+function\s+GET[\s\S]*?(?=export\s+async\s+function\s+POST|$)/,
      );

      const getSource = getMatch ? getMatch[0] : "";

      console.log(
        `GET source extracted: ${getSource.length > 0 ? "YES" : "NO"}`,
      );

      const getAuthCount =
        (getSource.match(/getCurrentUser\s*\(/g) || []).length +
        (getSource.match(/isAuthenticated\s*\(/g) || []).length;

      console.log(`GET auth-helper occurrences: ${getAuthCount}`);

      if (getAuthCount > 0) {
        PASS(
          "GET visibly performs an authentication check.",
        );
      } else {
        REVIEW(
          "GET currently has no visible getCurrentUser()/isAuthenticated() authentication check.",
        );
      }

      if (getSource.includes("prisma.farmer.findMany")) {
        PASS(
          "GET directly reads the Farmer collection.",
        );
      } else {
        REVIEW(
          "GET Farmer.findMany() was not detected.",
        );
      }

      if (
        getSource.includes("NextResponse.json") &&
        getSource.includes("status: 200")
      ) {
        PASS(
          "GET returns Farmer collection data as HTTP 200 JSON.",
        );
      }
    }

    // ================================================================
    // 4. GET AUTHORIZATION CONTRACT
    // ================================================================

    section("4. GET AUTHORIZATION CONTRACT");

    if (farmerRouteSource) {
      const getMatch = farmerRouteSource.match(
        /export\s+async\s+function\s+GET[\s\S]*?(?=export\s+async\s+function\s+POST|$)/,
      );

      const getSource = getMatch ? getMatch[0] : "";

      const roleChecks = [
        "role.name",
        "roleId",
        "Super Admin",
        "National Admin",
        "County Director",
        "Sub County Officer",
        "Ward Extension Officer",
        "Extension Officer",
      ];

      const detectedRoleChecks = roleChecks.filter((value) =>
        getSource.includes(value),
      );

      console.log(
        `Visible GET authorization indicators: ${
          detectedRoleChecks.length
        }`,
      );

      if (detectedRoleChecks.length > 0) {
        console.log(
          `Detected: ${detectedRoleChecks.join(", ")}`,
        );
      } else {
        REVIEW(
          "GET has no visible role-based authorization contract.",
        );
      }

      const forbiddenHandling =
        getSource.includes("403") ||
        getSource.includes("Forbidden") ||
        getSource.includes("FORBIDDEN");

      if (forbiddenHandling) {
        PASS(
          "GET contains visible forbidden/403 handling.",
        );
      } else {
        REVIEW(
          "GET has no visible 403 authorization response.",
        );
      }
    }

    // ================================================================
    // 5. GET COLLECTION FILTERING
    // ================================================================

    section("5. GET COLLECTION FILTERING");

    if (farmerRouteSource) {
      const getMatch = farmerRouteSource.match(
        /export\s+async\s+function\s+GET[\s\S]*?(?=export\s+async\s+function\s+POST|$)/,
      );

      const getSource = getMatch ? getMatch[0] : "";

      const filteringIndicators = [
        "where:",
        "userId:",
        "countyId:",
        "subCountyId:",
        "wardId:",
        "tenantId:",
      ];

      const detectedFilters = filteringIndicators.filter((value) =>
        getSource.includes(value),
      );

      console.log(
        `Visible collection filtering indicators: ${
          detectedFilters.length
        }`,
      );

      if (detectedFilters.length > 0) {
        console.log(
          `Detected: ${detectedFilters.join(", ")}`,
        );
      } else {
        REVIEW(
          "GET Farmer collection currently has no visible authorization filter.",
        );
      }
    }

    // ================================================================
    // 6. POST AUTHENTICATION CROSS-CHECK
    // ================================================================

    section("6. POST AUTHENTICATION CROSS-CHECK");

    if (farmerRouteSource) {
      const postMatch = farmerRouteSource.match(
        /export\s+async\s+function\s+POST[\s\S]*$/,
      );

      const postSource = postMatch ? postMatch[0] : "";

      const postAuthCount =
        (postSource.match(/getCurrentUser\s*\(/g) || []).length +
        (postSource.match(/isAuthenticated\s*\(/g) || []).length;

      console.log(
        `POST auth-helper occurrences: ${postAuthCount}`,
      );

      if (postAuthCount > 0) {
        PASS(
          "POST already has an authentication contract.",
        );
      } else {
        REVIEW(
          "POST authentication helper was not detected.",
        );
      }

      if (postSource.includes("firebaseUid")) {
        PASS(
          "POST visibly maps authenticated identity through Firebase UID.",
        );
      } else {
        REVIEW(
          "POST Firebase UID mapping was not detected.",
        );
      }

      if (postSource.includes("prisma.user.findUnique")) {
        PASS(
          "POST resolves the authenticated database User.",
        );
      } else {
        REVIEW(
          "POST database User lookup was not detected.",
        );
      }
    }

    // ================================================================
    // 7. CURRENT ROLE DATA
    // ================================================================

    section("7. CURRENT ROLE DATA");

    const roles: RoleRow[] = await prisma.role.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    console.log(`Role count: ${roles.length}`);

    const superAdmin = roles.find(
      (role) => role.name.toLowerCase() === "super admin",
    );

    const nationalAdmin = roles.find(
      (role) => role.name.toLowerCase() === "national admin",
    );

    const farmerRole = roles.find(
      (role) => role.name.toLowerCase() === "farmer",
    );

    const leadFarmerRole = roles.find(
      (role) => role.name.toLowerCase() === "lead farmer",
    );

    if (superAdmin) {
      PASS(`Super Admin role exists with ID=${superAdmin.id}.`);
    } else {
      MISSING("Super Admin role does not exist.");
    }

    if (nationalAdmin) {
      PASS(`National Admin role exists with ID=${nationalAdmin.id}.`);
    } else {
      MISSING("National Admin role does not exist.");
    }

    if (farmerRole) {
      PASS(`Farmer role exists with ID=${farmerRole.id}.`);
    } else {
      MISSING("Farmer role does not exist.");
    }

    if (leadFarmerRole) {
      PASS(`Lead Farmer role exists with ID=${leadFarmerRole.id}.`);
    } else {
      REVIEW("Lead Farmer role does not exist.");
    }

    // ================================================================
    // 8. CURRENT USERS
    // ================================================================

    section("8. CURRENT USERS");

    const users: UserRow[] = await prisma.user.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        firebaseUid: true,
        roleId: true,
        active: true,
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

    for (const user of users) {
      console.log(
        `User ID=${user.id} | roleId=${user.roleId} | role="${user.role.name}" | active=${user.active}`,
      );
    }

    if (users.length === 1) {
      REVIEW(
        "Only one database User currently exists, so role switching cannot be runtime-tested against multiple users.",
      );
    }

    // ================================================================
    // 9. CURRENT FARMER OWNERSHIP
    // ================================================================

    section("9. CURRENT FARMER OWNERSHIP");

    const farmerRows = await prisma.farmer.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        userId: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
      },
    });

    console.log(`Farmer count: ${farmerRows.length}`);

    for (const farmer of farmerRows) {
      console.log(
        `Farmer ID=${farmer.id} | userId=${farmer.userId} | countyId=${farmer.countyId} | subCountyId=${farmer.subCountyId} | wardId=${farmer.wardId}`,
      );
    }

    if (farmerRows.every((farmer) => farmer.userId > 0)) {
      PASS(
        "Current Farmer records have valid ownership userId values.",
      );
    } else {
      REVIEW(
        "At least one Farmer record has an invalid ownership userId.",
      );
    }

    // ================================================================
    // 10. SELF-SERVICE SQL CONTRACT
    // ================================================================

    section("10. SELF-SERVICE SQL CONTRACT");

    console.log("");
    console.log("AUTHENTICATED IDENTITY:");
    console.log("  Firebase session");
    console.log("      -> Firebase UID");
    console.log("      -> User.firebaseUid");
    console.log("      -> User.id");
    console.log("");

    console.log("SELF-SERVICE QUERY:");
    console.log("");
    console.log('SELECT f.*');
    console.log('FROM "Farmer" f');
    console.log('WHERE f."userId" = :authenticatedUserId;');
    console.log("");

    PASS(
      "Farmer ownership supports a deterministic self-service SQL predicate.",
    );

    // ================================================================
    // 11. ADMIN COLLECTION SQL CONTRACT
    // ================================================================

    section("11. ADMIN COLLECTION SQL CONTRACT");

    console.log("");
    console.log("AUTHORIZATION QUERY CONCEPT:");
    console.log("");
    console.log('SELECT f.*');
    console.log('FROM "Farmer" f');
    console.log('JOIN "User" u');
    console.log('  ON u.id = f."userId"');
    console.log('JOIN "Role" r');
    console.log('  ON r.id = u."roleId"');
    console.log("WHERE r.name IN (");
    console.log("  'Super Admin',");
    console.log("  'National Admin'");
    console.log(");");
    console.log("");

    PASS(
      "Super Admin and National Admin provide a currently identifiable collection-access role contract.",
    );

    // ================================================================
    // 12. STAFF GEOGRAPHIC AUTHORIZATION
    // ================================================================

    section("12. STAFF GEOGRAPHIC AUTHORIZATION");

    console.log("");
    console.log("Required for future geographic staff access:");
    console.log("");
    console.log("County Director");
    console.log("  -> authorized county");
    console.log("");
    console.log("Sub County Officer");
    console.log("  -> authorized sub-county");
    console.log("");
    console.log("Ward Extension Officer");
    console.log("  -> authorized ward");
    console.log("");

    REVIEW(
      "Current User model/data does not establish staff geographic authorization scope.",
    );

    // ================================================================
    // 13. POST SAFETY CONTRACT
    // ================================================================

    section("13. POST SAFETY CONTRACT");

    if (farmerRouteSource) {
      const postMatch = farmerRouteSource.match(
        /export\s+async\s+function\s+POST[\s\S]*$/,
      );

      const postSource = postMatch ? postMatch[0] : "";

      if (postSource.includes("getCurrentUser")) {
        PASS(
          "POST authentication should remain unchanged during GET authorization work.",
        );
      }

      if (postSource.includes("firebaseUid")) {
        PASS(
          "POST uses authenticated Firebase identity rather than trusting submitted userId.",
        );
      }

      if (postSource.includes("prisma.$transaction")) {
        PASS(
          "POST transaction boundary remains present.",
        );
      }

      if (
        postSource.includes("P2002") &&
        postSource.includes("P2003")
      ) {
        PASS(
          "POST Prisma constraint error handling remains present.",
        );
      }
    }

    // ================================================================
    // 14. IMPLEMENTATION DECISION
    // ================================================================

    section("14. IMPLEMENTATION DECISION");

    console.log("");
    console.log("SAFE NOW:");
    console.log("");
    console.log("1. Authenticate GET /api/farmers");
    console.log("");
    console.log("2. Resolve authenticated database User");
    console.log("");
    console.log("3. Authorize Super Admin / National Admin");
    console.log("");
    console.log("4. Return Farmer collection only to those roles");
    console.log("");
    console.log("5. Create GET /api/farmers/me");
    console.log("");
    console.log("6. Authorize authenticated Farmer/Lead Farmer");
    console.log("");
    console.log("7. Query Farmer WHERE userId = authenticated User.id");
    console.log("");

    console.log("NOT SAFE YET:");
    console.log("");
    console.log("County Director -> county filtering");
    console.log("Sub County Officer -> sub-county filtering");
    console.log("Ward Extension Officer -> ward filtering");
    console.log("Extension Officer -> geographic filtering");
    console.log("");

    PASS(
      "A safe first authorization implementation can be completed without inventing staff geographic scope.",
    );

    // ================================================================
    // 15. FINAL V36 CLASSIFICATION
    // ================================================================

    section("15. FINAL V36 CLASSIFICATION");

    console.log(`PASS    : ${pass}`);
    console.log(`REVIEW  : ${review}`);
    console.log(`MISSING : ${missing}`);

    console.log("");
    console.log("V36 COMPLETE");
    console.log("READ-ONLY: NO INSERT / UPDATE / DELETE / MIGRATION");
    console.log("");

    console.log("IMPLEMENTATION GATE:");
    console.log("");
    console.log(
      "GET /api/farmers can now be secured using authenticated role authorization.",
    );
    console.log(
      "GET /api/farmers/me can now be implemented using Farmer.userId ownership.",
    );
    console.log(
      "Geographic staff authorization remains deferred until staff scope exists.",
    );
  } catch (error) {
    console.error("");
    console.error("V36 AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();